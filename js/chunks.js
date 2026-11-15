/* ============================================================
   MiniCraft — chunks · Стриминг чанков + пул воркеров генерации
   (модуль 26 из 33; строки 10003–10204 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Загрузка/выгрузка чанков и меширование
// ============================================================
const loadedMeshes = new Map(); // key -> group

let _evictTimer = 0; // троттлинг эвикции чанков (раз в ~5 с)
let _chunkScanAcc = 0;               // троттлинг полного скана области прорисовки
let _lastScanPcx = 1e9, _lastScanPcz = 1e9; // чанк игрока на момент прошлого скана

// ============================================================
//  Пул воркеров генерации чанков — ГЕНЕРАЦИЯ В ОТДЕЛЬНОМ ПОТОКЕ.
//  Раньше чанки генерировались на главном потоке (скопом, при входе
//  в мир / переходе границы чанка) — картинка фризилась. Теперь главный
//  поток лишь ПРОСИТ воркер «сгенерируй чанк» и продолжает рендер/физику;
//  готовый массив блоков приезжает асинхронно и встраивается в мир.
//
//  Источник воркера собирается из ТЕХ ЖЕ функций, что работают на главном
//  потоке (Function.prototype.toString) — генераторы физически не могут
//  разойтись, чанки в обоих потоках побайтово идентичны.
//  Фолбэк: если Worker недоступен — синхронная генерация по 2 чанка за скан.
// ============================================================
const WorldGenPool = {
  workers: [],
  next: 0,
  pending: new Set(),     // ключи "cx,cz" в работе
  dim: 'overworld',       // измерение, для которого сейчас генерируем

  // собрать исходник воркера из живых функций генерации
  buildWorkerSrc() {
    const fns = [smooth, hash2, valueNoise, hash3i, valueNoise3D, isCave, oreVeinAt,
                 terrainHeight, netherHeight, netherCeilBottom, oreHash, treeHash, treeAt,
                 idx, generateOverworldData, generateNetherData, generateChunkData];
    return "'use strict';\n" +
      // константы мира (те же значения, что на главном потоке)
      `const BLOCK = ${JSON.stringify(BLOCK)};\n` +
      `const CHUNK_SIZE = ${CHUNK_SIZE}, WORLD_HEIGHT = ${WORLD_HEIGHT}, DEPTH = ${DEPTH},` +
      ` DEEPSLATE_LEVEL = ${DEEPSLATE_LEVEL}, SEA_LEVEL = ${SEA_LEVEL}, NETHER_CEIL_MIN = ${NETHER_CEIL_MIN};\n` +
      // лерп из THREE — единственная внешняя зависимость шумов
      'const THREE = { MathUtils: { lerp: (a, b, t) => a + (b - a) * t } };\n' +
      'let WORLD_SEED = 0;\n' +
      fns.map(f => f.toString()).join('\n') + '\n' +
      'onmessage = (e) => {\n' +
      '  const d = e.data;\n' +
      "  if (d.type === 'init') { WORLD_SEED = d.seed | 0; return; }\n" +
      "  if (d.type === 'gen') {\n" +
      '    const blocks = generateChunkData(d.cx, d.cz, d.dim);\n' +
      // буфер передаётся нулевой копией (transferable) — без лишнего GC;
      // tag — метка поколения пула (защита от ответов старого мира)
      '    postMessage({ cx: d.cx, cz: d.cz, dim: d.dim, tag: d.tag, blocks }, [blocks.buffer]);\n' +
      '  }\n' +
      '};\n';
  },

  // (пере)создать воркеры под текущий сид (при входе в мир)
  init() {
    this.terminate();
    this.gen = (this.gen || 0) + 1; // метка поколения: ответы старого пула игнорируются
    if (typeof Worker === 'undefined') return; // древний браузер — фолбэк
    try {
      const src = this.buildWorkerSrc();
      const url = URL.createObjectURL(new Blob([src], { type: 'application/javascript' }));
      for (let i = 0; i < 2; i++) { // два воркера — вдвое быстрее прогрузка
        const w = new Worker(url);
        w.onmessage = (e) => this._onMsg(e.data);
        w.onerror = () => { this.terminate(); }; // любая ошибка — тихий фолбэк
        w.postMessage({ type: 'init', seed: WORLD_SEED });
        this.workers.push(w);
      }
    } catch (err) { this.terminate(); }
  },
  terminate() {
    for (const w of this.workers) { try { w.terminate(); } catch (e) {} }
    this.workers = []; this.pending.clear();
  },
  setDim(d) {
    this.dim = d;
    this.pending.clear(); // запросы старого измерения больше неактуальны
  },
  // попросить воркер сгенерировать чанк (неблокирующе); false — пула нет
  request(cx, cz) {
    if (!this.workers.length) return false;
    const k = cx + ',' + cz;
    if (this.pending.has(k) || World.chunks.has(k)) return true; // уже делаем/есть
    this.pending.add(k);
    const w = this.workers[this.next++ % this.workers.length];
    w.postMessage({ type: 'gen', cx, cz, dim: this.dim, tag: this.gen });
    return true;
  },
  // чанк приехал из воркера — встроить в мир
  _onMsg(d) {
    this.pending.delete(d.cx + ',' + d.cz);
    if (!this.workers.length) return;            // пул уже терминирован — игнор
    if (d.tag !== this.gen) return;               // ответ от предыдущего мира — игнор
    if (d.dim !== this.dim) return;               // ответ из другого измерения
    const k = d.cx + ',' + d.cz;
    if (World.chunks.has(k)) return;             // синхронный фолбэк успел раньше
    const c = { blocks: d.blocks, mesh: null, dirty: true, cx: d.cx, cz: d.cz };
    World.chunks.set(k, c);
    World.applyEditsToChunk(c);                  // правки игрока из сейва поверх
    World._lastChunk = null;
    // пометить СОСЕДЕЙ dirty: их краевые грани/свет строились в расчете на
    // «за краем пусто» — теперь надо перерисовать со швом встык
    World.markDirty(d.cx + 1, d.cz); World.markDirty(d.cx - 1, d.cz);
    World.markDirty(d.cx, d.cz + 1); World.markDirty(d.cx, d.cz - 1);
    _lastScanPcx = 1e9; // форсировать скан — построить меш
  },
};

// бюджет построения мешей за кадр: рамка НЕ фризится, недостроенное
// добирается в следующих кадрах (вместо старых «8 мешей разом за скан»)
const MESH_TIME_BUDGET_MS = 6;
const MESH_MAX_PER_FRAME = 3;
let _meshTodo = []; // очередь на (пере)строение, обновляется сканом

function updateChunks(dt) {
  const pcx = Math.floor(PLAYER.pos.x / CHUNK_SIZE);
  const pcz = Math.floor(PLAYER.pos.z / CHUNK_SIZE);

  // эвикция дальних чанков из памяти (не чаще раза в 5 с — защита от утечки)
  _evictTimer += dt || 0;
  if (_evictTimer > 5) { _evictTimer = 0; World.evictFarChunks(pcx, pcz); }

  // полный скан области прорисовки — только при пересечении границы чанка
  // либо раз в ~0.12 с (правки блоков помечают чанки dirty — их подхватит скан)
  _chunkScanAcc += dt || 0;
  if (_chunkScanAcc >= 0.12 || pcx !== _lastScanPcx || pcz !== _lastScanPcz) {
    _chunkScanAcc = 0; _lastScanPcx = pcx; _lastScanPcz = pcz;
    const todo = [];
    let missing = false;
    for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
      for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
        const cx = pcx + dx, cz = pcz + dz;
        const k = World.key(cx, cz);
        // ВАЖНО: только УЖЕ существующие чанки — никаких синхронных генераций!
        const c = World.chunks.get(k);
        if (!c) {
          // попросить воркер (асинхронно, отдельный поток)
          if (!WorldGenPool.request(cx, cz)) missing = true; // пула нет — фолбэк
          continue;
        }
        const isNew = !loadedMeshes.has(k);
        if (c.dirty || isNew) {
          todo.push({ c, k, isNew, dist: dx * dx + dz * dz });
        }
      }
    }
    // новые чанки и ближние — в первую очередь
    todo.sort((a, b) => (a.isNew === b.isNew ? a.dist - b.dist : (a.isNew ? -1 : 1)));
    _meshTodo = todo;

    // ФОЛБЭК (воркеров нет): синхронная генерация по 2 ближних чанка за скан —
    // медленнее, но гладко; вместо старого «сгенерировать всё разом и фризнуть»
    if (missing) {
      let gen = 0;
      const cand = [];
      for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++)
        for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++)
          cand.push({ cx: pcx + dx, cz: pcz + dz, d: dx*dx + dz*dz });
      cand.sort((a, b) => a.d - b.d);
      for (const it of cand) {
        if (gen >= 2) break;
        if (!World.chunks.has(World.key(it.cx, it.cz))) { World.getChunk(it.cx, it.cz); gen++; }
      }
      if (gen > 0) _lastScanPcx = 1e9; // на следующем кадре снова скан
    }

    // выгрузить дальние меши
    for (const [k, mesh] of loadedMeshes) {
      const [cx, cz] = k.split(',').map(Number);
      if (Math.abs(cx - pcx) > RENDER_DISTANCE + 1 || Math.abs(cz - pcz) > RENDER_DISTANCE + 1) {
        scene.remove(mesh);
        disposeGroup(mesh);
        loadedMeshes.delete(k);
      }
    }
  }

  // построение мешей — КАЖДЫЙ кадр, но с бюджетом по времени и количеству:
  // из-за загрузки чанков прорисовка больше не встаёт на паузу
  if (_meshTodo.length) {
    const t0 = performance.now();
    let built = 0;
    while (_meshTodo.length && built < MESH_MAX_PER_FRAME && performance.now() - t0 < MESH_TIME_BUDGET_MS) {
      const item = _meshTodo.shift();
      const c = World.chunks.get(item.k);
      if (!c || (!c.dirty && loadedMeshes.has(item.k))) continue; // уже неактуально
      const old = loadedMeshes.get(item.k);
      if (old) { scene.remove(old); disposeGroup(old); }
      const mesh = buildChunkMesh(c);
      scene.add(mesh);
      loadedMeshes.set(item.k, mesh);
      c.dirty = false;
      built++;
      shadowNeedsUpdate = true; // геометрия изменилась — обновить тени
    }
  }
}

function disposeGroup(group) {
  group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
}

