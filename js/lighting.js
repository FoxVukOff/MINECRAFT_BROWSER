/* ============================================================
   MiniCraft — lighting · Освещение: skylight + блоковый свет, AO, выборка
   (модуль 7 из 33; строки 3081–3852 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Освещение: запечённый свет в вершины (skylight + свет от факелов/светопыли/лавы)
//  Исправляет «свет под землёй»: в пещерах нет неба -> темно. Дневной цикл — глобально.
// ============================================================
const LIGHT_PAD = 2;                       // бордюр: 1 блок для граничных граней + 1 для AO-углов
const LIGHT_W = CHUNK_SIZE + LIGHT_PAD * 2; // 20
function lgIdx(x, y, z) { return (y * LIGHT_W + (z + LIGHT_PAD)) * LIGHT_W + (x + LIGHT_PAD); }
// пропускает ли блок свет
function lightPasses(b) {
  return b === BLOCK.AIR || b === BLOCK.WATER || b === BLOCK.WATER_FLOW ||
         b === BLOCK.LEAVES || b === BLOCK.GLASS || isDoor(b) || isBed(b) ||
         b === BLOCK.LAVA || b === BLOCK.LAVA_FLOW || b === BLOCK.FIRE ||
         b === BLOCK.NETHER_PORTAL || b === BLOCK.TORCH ||
         b === BLOCK.REDSTONE_DUST || b === BLOCK.REDSTONE_TORCH || b === BLOCK.LEVER ||
         b === BLOCK.BUTTON || b === BLOCK.PISTON_HEAD;
}
// сколько света излучает блок (0..15) — ванильные значения MC
function lightEmission(b) {
  if (b === BLOCK.TORCH) return 14;
  if (b === BLOCK.GLOWSTONE) return 15;
  if (b === BLOCK.LAVA || b === BLOCK.LAVA_FLOW) return 15;
  if (b === BLOCK.FIRE) return 15;
  if (b === BLOCK.NETHER_PORTAL) return 11;
  if (b === BLOCK.REDSTONE_TORCH) return 7;
  return 0;
}
// В Аду неба нет — глобальная подсветка незерака, чтобы не было кромешной тьмы
function netherAmbientLight() { return World.dim === 'nether' ? 6 : 0; }

function computeChunkLight(c) {
  const x0 = c.cx * CHUNK_SIZE, z0 = c.cz * CHUNK_SIZE;
  // ОПТИМИЗАЦИЯ: буферы сеток переиспользуются между ребилдами чанка —
  // раньше каждый ребилд аллоцировал 3 массива по ~41КБ (мусор для GC).
  const N = LIGHT_W * WORLD_HEIGHT * LIGHT_W;
  if (!c._lightSky || c._lightSky.length !== N) {
    c._lightSky = new Uint8Array(N);
    c._lightBlk = new Uint8Array(N);
    c._lightPass = new Uint8Array(N);
  } else {
    c._lightSky.fill(0); c._lightBlk.fill(0); c._lightPass.fill(0);
  }
  const sky = c._lightSky, blk = c._lightBlk, pass = c._lightPass;
  const baseAmb = netherAmbientLight();
  const overworld = World.dim === 'overworld';
  const getB = (x, y, z) => {
    if (y < 0 || y >= WORLD_HEIGHT) return BLOCK.AIR;
    return World.getBlockSoft(x0 + x, y, z0 + z); // без генерации соседей — нет фризов
  };

  const skyQueue = [];
  const blkQueue = [];
  // --- посев: skylight сверху вниз по колонкам, эмиттеры света ---
  for (let x = -LIGHT_PAD; x < CHUNK_SIZE + LIGHT_PAD; x++) {
    for (let z = -LIGHT_PAD; z < CHUNK_SIZE + LIGHT_PAD; z++) {
      let openSky = overworld; // в Аду неба нет
      for (let y = WORLD_HEIGHT - 1; y >= 0; y--) {
        const b = getB(x, y, z);
        const li = lgIdx(x, y, z);
        const ps = lightPasses(b) ? 1 : 0;
        pass[li] = ps;
        if (openSky && ps) {
          sky[li] = 15; skyQueue.push(x, y, z);
        } else {
          openSky = false;
        }
        // ОПТИМИЗАЦИЯ Ада: ambient-подсветку пишем напрямую БЕЗ BFS-посева —
        // раньше КАЖДАЯ светопроводящая клетка (весь воздух Ада, ~38 000 на чанк)
        // становилась семенем BFS, который ничего не давал (все клетки уже = 6).
        if (baseAmb && ps && blk[li] < baseAmb) blk[li] = baseAmb;
        const em = lightEmission(b);
        if (em > 0 && em > blk[li]) {
          blk[li] = em;
          // ОПТИМИЗАЦИЯ: эмиттер, накрытый сверху ТАКИМ ЖЕ эмиттером (лава под лавой),
          // в очередь не ставим — его свет уже записан напрямую, а грань поверхности
          // засеет верхняя клетка столба. Лавовое море: было ~15 000 семян на чанк, стало ~400.
          const ab = (y < WORLD_HEIGHT - 1) ? getB(x, y + 1, z) : BLOCK.AIR;
          if (lightEmission(ab) < em) blkQueue.push(x, y, z);
        }
      }
    }
  }
  // --- эмиттеры из СОСЕДНИХ чанков (факелы игрока за границей бордюра) ---
  // Свет факела радиуса 14 раньше «обрывался» на границе чанка. Теперь вводим
  // дальние эмиттеры через край сетки с затуханием по расстоянию, а дальше
  // BFS корректно обходит стены уже внутри сетки.
  if (World.lightEmitters && World.lightEmitters.size) {
    const R = LIGHT_PAD + 13;
    const inGrid = (x, z) => x >= -LIGHT_PAD && x < CHUNK_SIZE + LIGHT_PAD && z >= -LIGHT_PAD && z < CHUNK_SIZE + LIGHT_PAD;
    for (const [k, em] of World.lightEmitters) {
      const p = k.split(',');
      const lx = (+p[0]) - x0, ly = +p[1], lz = (+p[2]) - z0;
      if (inGrid(lx, lz)) continue; // внутри бордюра — уже засеяно выше
      if (lx < -R || lx >= CHUNK_SIZE + R || lz < -R || lz >= CHUNK_SIZE + R) continue; // далеко
      // ближайшая к эмиттеру клетка сетки (по краю бордюра)
      const gx = Math.max(-LIGHT_PAD, Math.min(CHUNK_SIZE + LIGHT_PAD - 1, lx));
      const gz = Math.max(-LIGHT_PAD, Math.min(CHUNK_SIZE + LIGHT_PAD - 1, lz));
      const gy = Math.max(0, Math.min(WORLD_HEIGHT - 1, ly));
      const d = Math.abs(lx - gx) + Math.abs(lz - gz) + Math.abs(ly - gy);
      const lvl = em - d;
      if (lvl <= 1) continue;
      // пробуем саму клетку и её соседей внутрь чанка (край может быть стеной)
      const tries = [[gx, gy, gz, lvl]];
      tries.push([gx + (lx < 0 ? 1 : lx >= CHUNK_SIZE ? -1 : 0), gy, gz, lvl - 1]);
      tries.push([gx, gy, gz + (lz < 0 ? 1 : lz >= CHUNK_SIZE ? -1 : 0), lvl - 1]);
      for (const [tx, ty, tz, tl] of tries) {
        if (tx < -LIGHT_PAD || tx >= CHUNK_SIZE + LIGHT_PAD || tz < -LIGHT_PAD || tz >= CHUNK_SIZE + LIGHT_PAD) continue;
        if (ty < 0 || ty >= WORLD_HEIGHT) continue;
        const li = lgIdx(tx, ty, tz);
        if (!pass[li]) continue; // в стену не вводим
        if (tl > blk[li]) { blk[li] = tl; blkQueue.push(tx, ty, tz); }
      }
    }
  }
  // --- BFS распространение (по сетке pass — без getBlock на каждом шаге) ---
  const NB = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  const inRange = (x, z) => x >= -LIGHT_PAD && x < CHUNK_SIZE + LIGHT_PAD && z >= -LIGHT_PAD && z < CHUNK_SIZE + LIGHT_PAD;
  function bfs(grid, queue, isSky) {
    let qi = 0;
    while (qi < queue.length) {
      const x = queue[qi++], y = queue[qi++], z = queue[qi++];
      const lvl = grid[lgIdx(x, y, z)];
      if (lvl <= 1) continue;
      for (const [dx, dy, dz] of NB) {
        const nx = x + dx, ny = y + dy, nz = z + dz;
        if (ny < 0 || ny >= WORLD_HEIGHT || !inRange(nx, nz)) continue;
        const ni = lgIdx(nx, ny, nz);
        if (!pass[ni]) continue; // непрозрачная клетка — свет не проходит
        const nl = (isSky && dy === -1 && lvl === 15) ? 15 : lvl - 1; // солнце вниз без потерь
        if (nl > grid[ni]) {
          grid[ni] = nl;
          queue.push(nx, ny, nz);
        }
      }
    }
  }
  bfs(sky, skyQueue, true);
  bfs(blk, blkQueue, false);
  return c;
}

// ============================================================
//  Выборка света в мешере: два канала + AO
// ============================================================
// свет ячейки в каналах [sky, blk] (0..15). Вне мира: сверху — открытое небо,
// снизу и «неизвестность» — темно/нейтрально.
const _slTmp = [0, 0];
function sampleLight(c, x, y, z, out) {
  if (y >= WORLD_HEIGHT) { out[0] = 15; out[1] = 0; return; } // над миром — полное небо
  if (y < 0) { out[0] = 0; out[1] = 0; return; }              // под миром — тьма
  if (x < -LIGHT_PAD || x >= CHUNK_SIZE + LIGHT_PAD || z < -LIGHT_PAD || z >= CHUNK_SIZE + LIGHT_PAD) { out[0] = 15; out[1] = 0; return; }
  const li = lgIdx(x, y, z);
  out[0] = c._lightSky[li]; out[1] = c._lightBlk[li];
}

// Уровень БЛОКОВОГО света (факелы/лава/светокамень, 0..15) в мировых
// координатах — для проверки спавна монстров (parity MC 1.18+: нежить
// спавнится только при уровне света блока 0 — факел рядом исключает спавн).
// Возвращает -1, если сетка света ещё не построена (чанк не меширован) —
// вызывающий должен считать «неизвестно» и НЕ спавнить (консервативно).
function blockLightAt(x, y, z) {
  if (y < 0 || y >= WORLD_HEIGHT) return -1;
  const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(z / CHUNK_SIZE);
  const c = World.chunks.get(World.key(cx, cz));
  if (!c || !c._lightBlk) return -1; // света ещё нет
  const lx = x - cx * CHUNK_SIZE, lz = z - cz * CHUNK_SIZE;
  if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE) return -1;
  return c._lightBlk[lgIdx(lx, y, lz)];
}
// Есть ли прямой доступ к небу из ячейки (для дневного спавна в пещерах:
// днём на открытой поверхности монстры не спавнятся, в тёмной пещере — да)
function hasSkyAccess(x, y, z) {
  for (let sy = y; sy < WORLD_HEIGHT; sy++) {
    if (OPAQUE[World.getBlock(x, sy, z)]) return false;
  }
  return true;
}
// затемняет ли ячейка свет (для AO-углов) — 1 = непрозрачная
function cellBlocksLight(c, x, y, z) {
  if (y < 0 || y >= WORLD_HEIGHT) return 0;
  if (x < -LIGHT_PAD || x >= CHUNK_SIZE + LIGHT_PAD || z < -LIGHT_PAD || z >= CHUNK_SIZE + LIGHT_PAD) return 0;
  return c._lightPass[lgIdx(x, y, z)] ? 0 : 1;
}
// Кривая яркости (как раньше: 0.05 + t^1.35 * 0.95) — теперь в шейдере.
// Здесь — только НАСЫЩЕННОСТЬ каналов: 1.0 = уровень 15.
// Сглаженный свет угла вершины (smooth lighting + AO, как в MC):
// усредняем 4 ячейки, смежные с углом, и добавляем ambient occlusion.
const AO_LEVELS = [0.55, 0.72, 0.86, 1.0]; // оба соседа-стены / один+угол / угол / чисто
const _clTmp = [0, 0];
function cornerLight(c, px, py, pz, t1x, t1y, t1z, t2x, t2y, t2z, out) {
  const o1 = cellBlocksLight(c, px + t1x, py + t1y, pz + t1z);
  const o2 = cellBlocksLight(c, px + t2x, py + t2y, pz + t2z);
  const oc = cellBlocksLight(c, px + t1x + t2x, py + t1y + t2y, pz + t1z + t2z);
  const ao = (o1 && o2) ? 0 : 3 - (o1 + o2 + oc);
  let sky = 0, blk = 0;
  sampleLight(c, px, py, pz, _clTmp); sky += _clTmp[0]; blk += _clTmp[1];
  sampleLight(c, px + t1x, py + t1y, pz + t1z, _clTmp); sky += _clTmp[0]; blk += _clTmp[1];
  sampleLight(c, px + t2x, py + t2y, pz + t2z, _clTmp); sky += _clTmp[0]; blk += _clTmp[1];
  sampleLight(c, px + t1x + t2x, py + t1y + t2y, pz + t1z + t2z, _clTmp); sky += _clTmp[0]; blk += _clTmp[1];
  out[0] = blk / 60; out[1] = sky / 60; out[2] = AO_LEVELS[ao];
}

// Кеш id 6 соседей текущего блока (переиспользуется между итерациями мешера,
// порядок соответствует FACES: +X -X +Y -Y +Z -Z; -1 = значение ещё не читали)
const _nbCache = [-1, -1, -1, -1, -1, -1];

function buildChunkMesh(c) {
  // запечь свет перед построением геометрии
  computeChunkLight(c);
  // Группируем по материалу (по уникальному canvas-материалу)
  // Соберём геометрию для каждого блок-типа отдельно, чтобы корректно текстурировать грани.
  const group = new THREE.Group();
  const x0 = c.cx * CHUNK_SIZE, z0 = c.cz * CHUNK_SIZE;
  // быстрые флаги: есть ли в мире ориентации/печи — иначе не трогаем Map по строковым ключам
  const hasFacing = World.facing.size > 0;
  const hasFurnaces = World.furnaces.size > 0;

  // Буферы на каждую "грань-материал" мы решаем через мульти-материал по типу блока
  // Простой подход: одна геометрия с группами материалов.
  const positions = [];
  const normals = [];
  const uvs = [];
  const indices = [];
  // материал каждой грани -> мы сделаем несколько подгрупп
  const groups = []; // {start, count, material}
  const matList = [];
  const matMap = new Map();

  function getMatIndex(material) {
    if (!matMap.has(material)) { matMap.set(material, matList.length); matList.push(material); }
    return matMap.get(material);
  }

  // временное хранилище граней по материалу
  const byMat = new Map(); // matIndex -> {positions, normals, uvs, indices}

  for (let y = 0; y < WORLD_HEIGHT; y++) {
    for (let lz = 0; lz < CHUNK_SIZE; lz++) {
      for (let lx = 0; lx < CHUNK_SIZE; lx++) {
        const b = c.blocks[idx(lx, y, lz)];
        if (b === BLOCK.AIR) continue;
        const wx = x0 + lx, wz = z0 + lz;

        // ---- Дверь: тонкая панель с учётом ориентации/открытости ----
        if (isDoor(b)) {
          const mat = MATERIALS[b][0];
          const mi = getMatIndex(mat);
          let buf = byMat.get(mi);
          if (!buf) { buf = { positions: [], normals: [], uvs: [], indices: [], colors: [], water:false }; byMat.set(mi, buf); }
          const ab = doorAABB(wx, y, wz);
          const x1=ab.x1, x2=ab.x2, z1=ab.z1, z2=ab.z2;
          sampleLight(c, lx, y, lz, _slTmp); // дверь прозрачна для света
          const blB = _slTmp[1] / 15, blS = _slTmp[0] / 15;
          const addQuad = (p, nrm) => {
            const base = buf.positions.length/3;
            for (const v of p){ buf.positions.push(lx+v[0], y+v[1], lz+v[2]); buf.normals.push(nrm[0],nrm[1],nrm[2]); buf.colors.push(blB, blS, 1); }
            buf.uvs.push(0,0,1,0,1,1,0,1);
            buf.indices.push(base,base+1,base+2,base,base+2,base+3);
          };
          // 4 боковые + верх/низ панели
          addQuad([[x1,0,z2],[x2,0,z2],[x2,1,z2],[x1,1,z2]],[0,0,1]);
          addQuad([[x2,0,z1],[x1,0,z1],[x1,1,z1],[x2,1,z1]],[0,0,-1]);
          addQuad([[x2,0,z2],[x2,0,z1],[x2,1,z1],[x2,1,z2]],[1,0,0]);
          addQuad([[x1,0,z1],[x1,0,z2],[x1,1,z2],[x1,1,z1]],[-1,0,0]);
          addQuad([[x1,1,z2],[x2,1,z2],[x2,1,z1],[x1,1,z1]],[0,1,0]);
          addQuad([[x1,0,z1],[x2,0,z1],[x2,0,z2],[x1,0,z2]],[0,-1,0]);
          continue;
        }

        // ---- Кровать: геометрия по образцу ванильной bed.json (MC) ----
        // Цельный матрас на ВСЮ клетку (половины стыкуются без щели — фикс
        // «кровать разрезало пополам»), высота 9/16, короткие ножки 3/16
        // ТОЛЬКО по внешним углам кровати (фикс «ноги отваливаются и
        // левитируют»). Никаких досок-спинок — в ванили их нет.
        if (isBed(b)) {
          const mats = MATERIALS[b];
          const mTop  = mats[2]; // верх матраса (подушка у изголовья)
          const mSide = mats[0]; // длинный бок (одеяло + деревянная рама)
          const mEnd  = mats[4]; // торец
          const mLeg  = mats[3]; // ножки (доски)
          // свет: берём освещённость над кроватью (y+1) — матрас приподнят,
          // и гарантируем минимум ~уровень 8, чтобы кровать не выглядела чёрной в тени.
          sampleLight(c, lx, y + 1, lz, _slTmp);
          const blB = Math.max(_slTmp[1], 8) / 15, blS = _slTmp[0] / 15;
          // квад с покомпонентными UV (массив из 4 пар) — нужно для ориентации кровати
          function qB(mat, shade, pts, nrm, uvs) {
            const mi = getMatIndex(mat);
            let buf = byMat.get(mi);
            if (!buf) { buf = { positions: [], normals: [], uvs: [], indices: [], colors: [], water:false }; byMat.set(mi, buf); }
            const base = buf.positions.length / 3;
            for (let i = 0; i < 4; i++) {
              const v = pts[i];
              buf.positions.push(lx+v[0], y+v[1], lz+v[2]);
              buf.normals.push(nrm[0], nrm[1], nrm[2]);
              buf.colors.push(blB, blS, shade);
              buf.uvs.push(uvs[i*2], uvs[i*2+1]);
            }
            buf.indices.push(base, base+1, base+2, base, base+2, base+3);
          }
          // ориентация: front указывает от ножной части к изголовью
          const fr = hasFacing ? World.facing.get(wx + ',' + y + ',' + wz) : undefined;
          let fnx = 0, fnz = 1; // по умолчанию FACE_PZ
          if (fr === FACE_PX) { fnx = 1; fnz = 0; }
          else if (fr === FACE_NX) { fnx = -1; fnz = 0; }
          else if (fr === FACE_PZ) { fnx = 0; fnz = 1; }
          else if (fr === FACE_NZ) { fnx = 0; fnz = -1; }
          const longX = fnx !== 0; // длинная ось кровати — X
          // --- матрас: вся клетка, y 3/16..9/16 (пропорции bed.json) ---
          const mY1 = 0.1875, mY2 = 0.5625;
          // v-окно боковых текстур: ряды 3..11 — одеяло сверху, деревянная рама снизу
          const BV1 = 0.28125, BV2 = 0.78125; // v нижнего/верхнего края окна
          // верх: UV с поворотом — подушка (верх текстуры, v≈1) всегда у ИЗГОЛОВЬЯ
          const topUV = (cx, cz) => {
            if (longX) {
              const u = cz;
              const v = (fnx > 0) ? cx : (1 - cx); // голова в +X -> у x=1 v=1
              return [u, v];
            }
            const u = cx;
            const v = (fnz > 0) ? cz : (1 - cz);   // голова в +Z -> у z=1 v=1
            return [u, v];
          };
          {
            // 4 угла верхней грани + UV от topUV
            const cs = [[0,mY2,1],[1,mY2,1],[1,mY2,0],[0,mY2,0]]; // (x,z): (0,1)(1,1)(1,0)(0,0)
            const uvs = [];
            for (const [cx, , cz] of cs) { const [u, v] = topUV(cx, cz); uvs.push(u, v); }
            qB(mTop, 1.0, cs.map(p => [p[0], p[1], p[2]]), [0,1,0], uvs);
            // низ матраса (виден снизу) — доски
            qB(mLeg, 0.6, [[0,mY1,0],[1,mY1,0],[1,mY1,1],[0,mY1,1]], [0,-1,0], [0,0,1,0,1,1,0,1]);
          }
          // длинные бока (перпендикулярны оси кровати): у идёт вдоль оси
          const sideFaces = longX
            ? [ // бока по ±Z
              { pts: [[0,mY1,1],[1,mY1,1],[1,mY2,1],[0,mY2,1]], n: [0,0,1] },
              { pts: [[1,mY1,0],[0,mY1,0],[0,mY2,0],[1,mY2,0]], n: [0,0,-1] },
            ]
            : [ // бока по ±X
              { pts: [[1,mY1,1],[1,mY1,0],[1,mY2,0],[1,mY2,1]], n: [1,0,0] },
              { pts: [[0,mY1,0],[0,mY1,1],[0,mY2,1],[0,mY2,0]], n: [-1,0,0] },
            ];
          for (const f of sideFaces) qB(mSide, 0.82, f.pts, f.n, [0,BV1, 1,BV1, 1,BV2, 0,BV2]);
          // торцы (оба: внешний И стык — иначе при сломе половины была бы дыра)
          {
            let x1 = 0, x2 = 1, z1 = 0, z2 = 1;
            let f1, f2; // два торца
            if (longX) {
              f1 = { pts: [[x2,mY1,z1],[x2,mY1,z2],[x2,mY2,z2],[x2,mY2,z1]], n: [1,0,0] };  // +X
              f2 = { pts: [[x1,mY1,z2],[x1,mY1,z1],[x1,mY2,z1],[x1,mY2,z2]], n: [-1,0,0] }; // -X
            } else {
              f1 = { pts: [[x1,mY1,z2],[x2,mY1,z2],[x2,mY2,z2],[x1,mY2,z2]], n: [0,0,1] };  // +Z
              f2 = { pts: [[x2,mY1,z1],[x1,mY1,z1],[x1,mY2,z1],[x2,mY2,z1]], n: [0,0,-1] }; // -Z
            }
            qB(mEnd, 0.82, f1.pts, f1.n, [0,BV1, 1,BV1, 1,BV2, 0,BV2]);
            qB(mEnd, 0.82, f2.pts, f2.n, [0,BV1, 1,BV1, 1,BV2, 0,BV2]);
          }
          // --- ножки 3/16×3/16 у ВНЕШНЕГО торца этой половины ---
          // (ножная половина: внешний торец = -front; изголовье: +front)
          const legW = 0.1875; // = legH (3/16, bed.json)
          const isFootHalf = (b === BLOCK.BED_FOOT);
          const outerSign = isFootHalf ? -1 : 1; // в сторону front
          const legFaces = [];
          if (longX) {
            const lx1 = (outerSign * fnx > 0) ? (1 - legW) : 0;
            legFaces.push([lx1, 0, 0, lx1 + legW, legW, legW], [lx1, 0, 1 - legW, lx1 + legW, legW, 1]);
          } else {
            const lz1 = (outerSign * fnz > 0) ? (1 - legW) : 0;
            legFaces.push([0, 0, lz1, legW, legW, lz1 + legW], [1 - legW, 0, lz1, 1, legW, lz1 + legW]);
          }
          for (const [gx1, gy1, gz1, gx2, gy2, gz2] of legFaces) {
            // 4 бока + низ (верх скрыт матрасом)
            qB(mLeg, 0.82, [[gx2,gy1,gz1],[gx2,gy1,gz2],[gx2,gy2,gz2],[gx2,gy2,gz1]], [1,0,0],  [1,0, 0,0, 0,1, 1,1]);
            qB(mLeg, 0.82, [[gx1,gy1,gz2],[gx1,gy1,gz1],[gx1,gy2,gz1],[gx1,gy2,gz2]], [-1,0,0], [0,0, 1,0, 1,1, 0,1]);
            qB(mLeg, 0.82, [[gx1,gy1,gz2],[gx2,gy1,gz2],[gx2,gy2,gz2],[gx1,gy2,gz2]], [0,0,1],  [0,0, 1,0, 1,1, 0,1]);
            qB(mLeg, 0.82, [[gx2,gy1,gz1],[gx1,gy1,gz1],[gx1,gy2,gz1],[gx2,gy2,gz1]], [0,0,-1], [1,0, 0,0, 0,1, 1,1]);
            qB(mLeg, 0.6,  [[gx1,gy1,gz1],[gx2,gy1,gz1],[gx2,gy1,gz2],[gx1,gy1,gz2]], [0,-1,0], [0,0, 1,0, 1,1, 0,1]);
          }
          continue;
        }

        // ---- Факел: тонкий столбик с пламенем (билборд-крест, светится) ----
        if (b === BLOCK.TORCH) {
          const mat = MATERIALS[BLOCK.TORCH][0];
          const mi = getMatIndex(mat);
          let buf = byMat.get(mi);
          if (!buf) { buf = { positions: [], normals: [], uvs: [], indices: [], colors: [], water:false }; byMat.set(mi, buf); }
          // факел всегда полностью яркий (сам излучает свет)
          const addQuad = (p) => {
            const base = buf.positions.length/3;
            for (const v of p){ buf.positions.push(lx+v[0], y+v[1], lz+v[2]); buf.normals.push(0,1,0); buf.colors.push(1,1,1); }
            buf.uvs.push(0,0,1,0,1,1,0,1);
            buf.indices.push(base,base+1,base+2,base,base+2,base+3);
          };
          // на стене или на полу: смещение по facing
          const fr = (hasFacing) ? World.facing.get(wx + ',' + y + ',' + wz) : undefined;
          let ox = 0.5, oz = 0.5, oy = 0; // основание
          if (fr === FACE_PX) ox = 0.18; else if (fr === FACE_NX) ox = 0.82;
          else if (fr === FACE_PZ) oz = 0.18; else if (fr === FACE_NZ) oz = 0.82;
          if (fr !== undefined) oy = 0.2; // на стене чуть выше
          const w = 0.12, h = 0.62;
          addQuad([[ox-w,oy,oz-w],[ox+w,oy,oz+w],[ox+w,oy+h,oz+w],[ox-w,oy+h,oz-w]]);
          addQuad([[ox+w,oy,oz-w],[ox-w,oy,oz+w],[ox-w,oy+h,oz+w],[ox+w,oy+h,oz-w]]);
          continue;
        }

        // ---- Редстоуновый факел: как обычный, но красный (светится) ----
        if (b === BLOCK.REDSTONE_TORCH) {
          const powered = redstoneTorchPowered(wx, y, wz); // если выключен (запитан) — тусклый
          const mat = MATERIALS[BLOCK.REDSTONE_TORCH][0];
          const mi = getMatIndex(mat);
          let buf = byMat.get(mi);
          if (!buf) { buf = { positions: [], normals: [], uvs: [], indices: [], colors: [], water:false }; byMat.set(mi, buf); }
          const addQuad = (p) => {
            const base = buf.positions.length/3;
            const bright = powered ? 0.4 : 1.0; // выключенный факел тусклее
            for (const v of p){ buf.positions.push(lx+v[0], y+v[1], lz+v[2]); buf.normals.push(0,1,0); buf.colors.push(bright,bright,bright); }
            buf.uvs.push(0,0,1,0,1,1,0,1);
            buf.indices.push(base,base+1,base+2,base,base+2,base+3);
          };
          const fr = (hasFacing) ? World.facing.get(wx + ',' + y + ',' + wz) : undefined;
          let ox = 0.5, oz = 0.5, oy = 0;
          if (fr === FACE_PX) ox = 0.18; else if (fr === FACE_NX) ox = 0.82;
          else if (fr === FACE_PZ) oz = 0.18; else if (fr === FACE_NZ) oz = 0.82;
          if (fr !== undefined) oy = 0.2;
          const w = 0.12, h = 0.62;
          addQuad([[ox-w,oy,oz-w],[ox+w,oy,oz+w],[ox+w,oy+h,oz+w],[ox-w,oy+h,oz-w]]);
          addQuad([[ox+w,oy,oz-w],[ox-w,oy,oz+w],[ox-w,oy+h,oz+w],[ox+w,oy+h,oz-w]]);
          continue;
        }

        // ---- Рычаг: каменное основание + деревянная ручка (наклон по on/off) ----
        if (b === BLOCK.LEVER) {
          const mat = MATERIALS[BLOCK.LEVER][0];
          const mi = getMatIndex(mat);
          let buf = byMat.get(mi);
          if (!buf) { buf = { positions: [], normals: [], uvs: [], indices: [], colors: [], water:false }; byMat.set(mi, buf); }
          const st = leverState(wx, y, wz); // {on, facing}
          sampleLight(c, lx, y, lz, _slTmp);
          const blB = _slTmp[1] / 15, blS = _slTmp[0] / 15;
          const addQuad = (p, nrm) => {
            const base = buf.positions.length/3;
            for (const v of p){ buf.positions.push(lx+v[0], y+v[1], lz+v[2]); buf.normals.push(nrm[0],nrm[1],nrm[2]); buf.colors.push(blB, blS, 1); }
            buf.uvs.push(0,0,1,0,1,1,0,1);
            buf.indices.push(base,base+1,base+2,base,base+2,base+3);
          };
          // основание-плита (0.1 высотой)
          addQuad([[0.3,0,0.3],[0.7,0,0.3],[0.7,0,0.7],[0.3,0,0.7]],[0,-1,0]);
          addQuad([[0.3,0.1,0.3],[0.7,0.1,0.3],[0.7,0,0.3],[0.3,0,0.3]],[0,0,-1]);
          addQuad([[0.7,0.1,0.7],[0.3,0.1,0.7],[0.3,0,0.7],[0.7,0,0.7]],[0,0,1]);
          addQuad([[0.7,0.1,0.3],[0.7,0.1,0.7],[0.7,0,0.7],[0.7,0,0.3]],[1,0,0]);
          addQuad([[0.3,0.1,0.7],[0.3,0.1,0.3],[0.3,0,0.3],[0.3,0,0.7]],[-1,0,0]);
          addQuad([[0.3,0.1,0.3],[0.7,0.1,0.3],[0.7,0.1,0.7],[0.3,0.1,0.7]],[0,1,0]);
          // билборд-ручка (крест) — наклон зависит от on/off
          const tilt = st.on ? 0.35 : -0.35;
          const baseY = 0.1, len = 0.45;
          const cx = 0.5, cz = 0.5;
          // ручка-крест вдоль двух диагоналей
          const handleQuad = (dx, dz) => {
            const ex = cx + dx*0.05, ez = cz + dz*0.05;
            const tx = cx + dx*len, tz = cz + dz*len;
            const ty = baseY + len + tilt;
            addQuad([[cx-0.04,baseY,cz-0.04],[cx+0.04,baseY,cz+0.04],[tx+0.04,ty,tz+0.04],[tx-0.04,ty,tz-0.04]],[0,1,0]);
            addQuad([[cx+0.04,baseY,cz-0.04],[cx-0.04,baseY,cz+0.04],[tx-0.04,ty,tz-0.04],[tx+0.04,ty,tz+0.04]],[0,1,0]);
          };
          handleQuad(1, 1); handleQuad(1, -1);
          continue;
        }

        // ---- Кнопка: каменная плита-основание + нажимная кнопка (билборд по facing) ----
        if (b === BLOCK.BUTTON) {
          const st = buttonState(wx, y, wz); // {pressed, facing}
          const mat = st.pressed ? MATERIALS.BUTTON_PRESSED[0] : MATERIALS[BLOCK.BUTTON][0];
          const mi = getMatIndex(mat);
          let buf = byMat.get(mi);
          if (!buf) { buf = { positions: [], normals: [], uvs: [], indices: [], colors: [], water:false }; byMat.set(mi, buf); }
          sampleLight(c, lx, y, lz, _slTmp);
          const blB = _slTmp[1] / 15, blS = _slTmp[0] / 15;
          const addQuad = (p, nrm) => {
            const base = buf.positions.length/3;
            for (const v of p){ buf.positions.push(lx+v[0], y+v[1], lz+v[2]); buf.normals.push(nrm[0],nrm[1],nrm[2]); buf.colors.push(blB, blS, 1); }
            buf.uvs.push(0,0,1,0,1,1,0,1);
            buf.indices.push(base,base+1,base+2,base,base+2,base+3);
          };
          // ориентация: на полу — FACE_PY, на стене — боковая
          const fr = st.facing;
          // билборд-кнопка: плоская панель, смещённая к «лицу»
          let cx=0.5, cy=0.5, cz=0.5, ax='z', dir=1;
          if (fr === FACE_PY) { cy = 0.0; ax='y'; dir=1; }
          else if (fr === FACE_PX) { cx = 0.15; ax='x'; dir=1; }
          else if (fr === FACE_NX) { cx = 0.85; ax='x'; dir=-1; }
          else if (fr === FACE_PZ) { cz = 0.15; ax='z'; dir=1; }
          else if (fr === FACE_NZ) { cz = 0.85; ax='z'; dir=-1; }
          const press = st.pressed ? 0.02 : 0.06; // толщина кнопки
          const sz = 0.18; // половина размера
          // рисуем плоскую панель перпендикулярно оси
          if (ax === 'z') {
            const z0 = cz;
            addQuad([[cx-sz,cy-sz,z0],[cx+sz,cy-sz,z0],[cx+sz,cy+sz,z0],[cx-sz,cy+sz,z0]],[0,0,dir]);
          } else if (ax === 'x') {
            const x0 = cx;
            addQuad([[x0,cy-sz,cz-sz],[x0,cy-sz,cz+sz],[x0,cy+sz,cz+sz],[x0,cy+sz,cz-sz]],[dir,0,0]);
          } else { // y — на полу, кнопка сверху
            const y0 = cy + 0.0;
            addQuad([[cx-sz,y0,cz-sz],[cx+sz,y0,cz-sz],[cx+sz,y0,cz+sz],[cx-sz,y0,cz+sz]],[0,dir,0]);
          }
          continue;
        }

        // ---- Поршень: корпус + лицевая панель по facing ----
        if (b === BLOCK.PISTON) {
          const extended = pistonExtended(wx, y, wz);
          const mats = MATERIALS[BLOCK.PISTON];
          // Переставляем грани так, чтобы лицевая панель (по умолчанию +Z) смотрела по facing
          const fr = (hasFacing) ? World.facing.get(wx + ',' + y + ',' + wz) : undefined;
          const blockMats = (fr !== undefined) ? orientedMaterialsFrom(mats, fr, false) : mats;
          sampleLight(c, lx, y, lz, _slTmp);
          const blB = _slTmp[1] / 15, blS = _slTmp[0] / 15;
          // корпус — полный куб (упрощённо), но если выдвинут — лицевая грань «утоплена»
          for (const f of FACES) {
            const nb = World.getBlockSoft(wx + f.dir[0], y + f.dir[1], wz + f.dir[2]);
            if (!isTransparent(nb) && !(nb === BLOCK.PISTON_HEAD)) continue;
            const material = blockMats[f.mat];
            const mi = getMatIndex(material);
            let buf = byMat.get(mi);
            if (!buf) { buf = { positions: [], normals: [], uvs: [], indices: [], colors: [], water:false }; byMat.set(mi, buf); }
            const brt = f.dir[1] === 1 ? 1 : (f.dir[1] === -1 ? 0.6 : 0.82);
            const base = buf.positions.length / 3;
            for (const cv of f.corners) {
              buf.positions.push(lx + cv[0], y + cv[1], lz + cv[2]);
              buf.normals.push(f.dir[0], f.dir[1], f.dir[2]);
              buf.colors.push(blB, blS, brt);
            }
            buf.uvs.push(0,0, 1,0, 1,1, 0,1);
            buf.indices.push(base,base+1,base+2, base,base+2,base+3);
          }
          continue;
        }

        // ---- Голова поршня (выдвинутая): тонкая плита по facing ----
        if (b === BLOCK.PISTON_HEAD) {
          const mats = MATERIALS[BLOCK.PISTON_HEAD];
          const fr = (hasFacing) ? World.facing.get(wx + ',' + y + ',' + wz) : undefined;
          const blockMats = (fr !== undefined) ? orientedMaterialsFrom(mats, fr, false) : mats;
          sampleLight(c, lx, y, lz, _slTmp);
          const blB = _slTmp[1] / 15, blS = _slTmp[0] / 15;
          // плита толщиной 0.4, смещённая к «лицу» (упрощённо — полный куб)
          for (const f of FACES) {
            const nb = World.getBlockSoft(wx + f.dir[0], y + f.dir[1], wz + f.dir[2]);
            if (!isTransparent(nb) && nb !== BLOCK.PISTON) continue;
            const material = blockMats[f.mat];
            const mi = getMatIndex(material);
            let buf = byMat.get(mi);
            if (!buf) { buf = { positions: [], normals: [], uvs: [], indices: [], colors: [], water:false }; byMat.set(mi, buf); }
            const brt = f.dir[1] === 1 ? 1 : (f.dir[1] === -1 ? 0.6 : 0.82);
            const base = buf.positions.length / 3;
            for (const cv of f.corners) {
              buf.positions.push(lx + cv[0], y + cv[1], lz + cv[2]);
              buf.normals.push(f.dir[0], f.dir[1], f.dir[2]);
              buf.colors.push(blB, blS, brt);
            }
            buf.uvs.push(0,0, 1,0, 1,1, 0,1);
            buf.indices.push(base,base+1,base+2, base,base+2,base+3);
          }
          continue;
        }

        // ---- Редстоуновая пыль: плоский «ковёр» на верхней грани блока снизу ----
        if (b === BLOCK.REDSTONE_DUST) {
          const pwr = redstonePowerAt(wx, y, wz);
          const mats = pwr > 0 ? MATERIALS.REDSTONE_DUST_ON : MATERIALS[BLOCK.REDSTONE_DUST];
          const mat = mats[2]; // верхняя грань
          const mi = getMatIndex(mat);
          let buf = byMat.get(mi);
          if (!buf) { buf = { positions: [], normals: [], uvs: [], indices: [], colors: [], water:false }; byMat.set(mi, buf); }
          sampleLight(c, lx, y, lz, _slTmp);
          const blB = _slTmp[1] / 15, blS = _slTmp[0] / 15; // выключенная пыль слегка затенена (0.9)
          const H = 0.02; // чуть выше блока снизу
          // основная плоскость
          const base = buf.positions.length/3;
          for (const v of [[0,H,0],[1,H,0],[1,H,1],[0,H,1]]) { buf.positions.push(lx+v[0], y+v[1], lz+v[2]); buf.normals.push(0,1,0); buf.colors.push(blB, blS, pwr > 0 ? 1 : 0.9); }
          buf.uvs.push(0,0, 1,0, 1,1, 0,1);
          buf.indices.push(base,base+1,base+2, base,base+2,base+3);
          continue;
        }

        // ---- Огонь: боковой огонь — плоское пламя на грани блока-опоры (как в MC),
        // обычный (на блоке снизу) — пара перекрещенных плоскостей-«полотен» ----
        if (b === BLOCK.FIRE) {
          const mat = MATERIALS[BLOCK.FIRE][0];
          const mi = getMatIndex(mat);
          let buf = byMat.get(mi);
          if (!buf) { buf = { positions: [], normals: [], uvs: [], indices: [], colors: [], water:false, fire:true }; byMat.set(mi, buf); }
          const addQuad = (p) => {
            const base = buf.positions.length/3;
            for (const v of p){ buf.positions.push(lx+v[0], y+v[1], lz+v[2]); buf.normals.push(0,1,0); buf.colors.push(1,1,1); }
            buf.uvs.push(0,0,1,0,1,1,0,1);
            buf.indices.push(base,base+1,base+2,base,base+2,base+3);
          };
          // как огонь прикреплён: приоритет — живое состояние симуляции,
          // иначе (огонь из старого сейва/без состояния) — определить по соседям
          let att = -1;
          const fst = FireSim.fires.get(wx + ',' + y + ',' + wz);
          if (fst) att = fst.att;
          else {
            if (isSolidForPlayer(wx, y-1, wz)) att = 0;
            else if (isFlammable(World.getBlock(wx+1,y,wz)) || isSolidForPlayer(wx+1,y,wz)) att = 1;
            else if (isFlammable(World.getBlock(wx-1,y,wz)) || isSolidForPlayer(wx-1,y,wz)) att = 2;
            else if (isFlammable(World.getBlock(wx,y,wz+1)) || isSolidForPlayer(wx,y,wz+1)) att = 3;
            else if (isFlammable(World.getBlock(wx,y,wz-1)) || isSolidForPlayer(wx,y,wz-1)) att = 4;
            else att = 0;
          }
          if (att >= 1 && att <= 4) {
            // БОКОВОЙ огонь: одно вертикальное «полотно» у грани блока-опоры,
            // чуть отступив внутрь своей ячейки (как плоское пламя в MC)
            const OFF = 0.08;
            let q;
            if (att === 1)      q = [[1-OFF,0,0.06],[1-OFF,0,0.94],[1-OFF,1,0.94],[1-OFF,1,0.06]]; // опора справа (+X)
            else if (att === 2) q = [[OFF,0,0.06],[OFF,0,0.94],[OFF,1,0.94],[OFF,1,0.06]];           // опора слева (-X)
            else if (att === 3) q = [[0.06,0,1-OFF],[0.94,0,1-OFF],[0.94,1,1-OFF],[0.06,1,1-OFF]];   // опора за (+Z)
            else                q = [[0.06,0,OFF],[0.94,0,OFF],[0.94,1,OFF],[0.06,1,OFF]];             // опора перед (-Z)
            addQuad(q);
            // второе полотно-«подпалина» чуть глубже — пламя выглядит объёмнее
            const OFF2 = 0.28;
            let q2;
            if (att === 1)      q2 = [[1-OFF2,0.05,0.18],[1-OFF2,0.05,0.82],[1-OFF2,0.9,0.82],[1-OFF2,0.9,0.18]];
            else if (att === 2) q2 = [[OFF2,0.05,0.18],[OFF2,0.05,0.82],[OFF2,0.9,0.82],[OFF2,0.9,0.18]];
            else if (att === 3) q2 = [[0.18,0.05,1-OFF2],[0.82,0.05,1-OFF2],[0.82,0.9,1-OFF2],[0.18,0.9,1-OFF2]];
            else                q2 = [[0.18,0.05,OFF2],[0.82,0.05,OFF2],[0.82,0.9,OFF2],[0.18,0.9,OFF2]];
            addQuad(q2);
          } else {
            // огонь стоит на блоке снизу — два диагональных «полотна» пламени
            addQuad([[0.08,0,0.08],[0.92,0,0.92],[0.92,1,0.92],[0.08,1,0.08]]);
            addQuad([[0.92,0,0.08],[0.08,0,0.92],[0.08,1,0.92],[0.92,1,0.08]]);
          }
          continue;
        }

        // ---- Портал в Ад: тонкая «панель» (как стекло), а не целый блок ----
        if (b === BLOCK.NETHER_PORTAL) {
          const mat = MATERIALS[BLOCK.NETHER_PORTAL][0];
          const mi = getMatIndex(mat);
          let buf = byMat.get(mi);
          if (!buf) { buf = { positions: [], normals: [], uvs: [], indices: [], colors: [], water:false }; byMat.set(mi, buf); }
          // ось панели: вдоль X (порталы/обсидиан по ±X) -> тонкая по Z; иначе тонкая по X
          const nbX = World.getBlockSoft(wx+1,y,wz)===BLOCK.NETHER_PORTAL || World.getBlockSoft(wx-1,y,wz)===BLOCK.NETHER_PORTAL ||
                      World.getBlockSoft(wx+1,y,wz)===BLOCK.OBSIDIAN || World.getBlockSoft(wx-1,y,wz)===BLOCK.OBSIDIAN;
          const TH = 0.12;
          const addQuad = (p, nrm) => {
            const base = buf.positions.length/3;
            for (const v of p){ buf.positions.push(lx+v[0], y+v[1], lz+v[2]); buf.normals.push(nrm[0],nrm[1],nrm[2]); buf.colors.push(1,1,1); }
            buf.uvs.push(0,0,1,0,1,1,0,1);
            buf.indices.push(base,base+1,base+2,base,base+2,base+3);
          };
          if (nbX) {
            const z1 = 0.5 - TH/2, z2 = 0.5 + TH/2;
            addQuad([[0,0,z2],[1,0,z2],[1,1,z2],[0,1,z2]],[0,0,1]);
            addQuad([[1,0,z1],[0,0,z1],[0,1,z1],[1,1,z1]],[0,0,-1]);
          } else {
            const x1 = 0.5 - TH/2, x2 = 0.5 + TH/2;
            addQuad([[x1,0,1],[x1,0,0],[x1,1,0],[x1,1,1]],[-1,0,0]);
            addQuad([[x2,0,0],[x2,0,1],[x2,1,1],[x2,1,0]],[1,0,0]);
          }
          continue;
        }

        const liquid = isLiquid(b);
        const lava = isLavaLiquid(b);

        // ОПТИМИЗАЦИЯ FACE CULLING + КЕШ СОСЕДЕЙ: id всех 6 соседей берём ОДИН раз
        // (порядок как в FACES: +X -X +Y -Y +Z -Z; -1 = «ещё не читали»). Полностью
        // погребённые блоки (все соседи непрозрачны) пропускаем целиком, а видимые
        // грани переиспользуют кеш вместо повторного World.getBlock на каждую грань.
        // ВАЖНО: за границами мира по Y сосед считается НЕПРОЗРАЧНЫМ — иначе дно мира (y=0)
        // и потолок Ада (y=95) рисуют грани «в пустоту», которые никто никогда не увидит
        // (~170 лишних граней на чанк и там, и там — заметный процент полигональности).
        const nbGet = (nx, ny, nz) => (ny < 0 || ny >= WORLD_HEIGHT) ? BLOCK.BEDROCK : World.getBlockSoft(nx, ny, nz);
        _nbCache[0] = _nbCache[1] = _nbCache[2] = _nbCache[3] = _nbCache[4] = _nbCache[5] = -1;
        if (!liquid) {
          _nbCache[0] = nbGet(wx+1, y, wz);
          if (OPAQUE[_nbCache[0]]) {
            _nbCache[1] = nbGet(wx-1, y, wz);
            if (OPAQUE[_nbCache[1]]) {
              _nbCache[2] = nbGet(wx, y+1, wz);
              if (OPAQUE[_nbCache[2]]) {
                _nbCache[3] = nbGet(wx, y-1, wz);
                if (OPAQUE[_nbCache[3]]) {
                  _nbCache[4] = nbGet(wx, y, wz+1);
                  if (OPAQUE[_nbCache[4]]) {
                    _nbCache[5] = nbGet(wx, y, wz-1);
                    if (OPAQUE[_nbCache[5]]) continue; // полностью погребён — пропускаем
                  }
                }
              }
            }
          }
        }

        // материалы с учётом ориентации блока.
        // ОПТИМИЗАЦИЯ: строковый ключ facing считаем только для ориентируемых блоков
        // и только если в мире вообще есть записи facing — иначе пропускаем аллокацию строк.
        let baseMats = MATERIALS[b];
        let front;
        if (hasFacing && CAN_ORIENT[b]) front = World.facing.get(wx + ',' + y + ',' + wz);
        // зажжённая печь — другой передний материал
        if (b === BLOCK.FURNACE && hasFurnaces) {
          const fu = World.furnaces.get(wx + ',' + y + ',' + wz);
          if (fu && fu.burn > 0) baseMats = MATERIALS.FURNACE_LIT;
        }
        // двойной сундук — половинки со стыковым рисунком
        if (b === BLOCK.CHEST && hasFacing) {
          const dpk = World.doubleChests.get(wx + ',' + y + ',' + wz);
          if (dpk) {
            const [px, , pz] = dpk.split(',').map(Number);
            // эта половина «левая» или «правая» относительно фронта
            const fr = front !== undefined ? front : FACE_PZ;
            // вектор «вправо» при взгляде на фронт
            let rx = 0, rz = 0;
            if (fr === FACE_PZ) rx = -1; else if (fr === FACE_NZ) rx = 1;
            else if (fr === FACE_PX) rz = 1; else if (fr === FACE_NX) rz = -1;
            // если партнёр находится в направлении "вправо" — мы левая половина
            const isLeft = (px - wx) === rx && (pz - wz) === rz;
            baseMats = isLeft ? MATERIALS.DCHEST_LEFT : MATERIALS.DCHEST_RIGHT;
          }
        }
        // светящаяся редстоуновая руда (при клике/наступании) — яркий материал
        if (b === BLOCK.REDSTONE_ORE && glowingOre && glowingOre.has(wx + ',' + y + ',' + wz)) {
          baseMats = MATERIALS.REDSTONE_ORE_LIT;
        }
        const blockMats = (front !== undefined && MATERIALS[b])
          ? orientedMaterialsFrom(baseMats, front, b === BLOCK.WOOD) : baseMats;

        // высота поверхности жидкости (0..1) по уровню; если сверху та же жидкость — полная
        let waterTop = 1;
        if (liquid) {
          const above = World.getBlockSoft(wx, y + 1, wz);
          const sameAbove = lava ? isLavaLiquid(above) : isWaterLiquid(above);
          if (sameAbove) {
            waterTop = 1; // жидкость под жидкостью — полный куб
          } else {
            const lvl = World.getLevel(wx, y, wz);
            const mx = lava ? LAVA_MAX : WATER_MAX;
            waterTop = lava ? (0.25 + (lvl / mx) * 0.7) : (0.12 + (lvl / mx) * 0.86);
          }
        }

        for (let fi = 0; fi < 6; fi++) {
          const f = FACES[fi];
          // сосед из кешa face-culling проверки (для жидкостей/недочитанных — читаем напрямую;
          // за границей мира по Y — непрозрачный «бедрок», чтобы не рисовать дно/крышу в пустоту)
          const nb = _nbCache[fi] >= 0 ? _nbCache[fi] : nbGet(wx + f.dir[0], y + f.dir[1], wz + f.dir[2]);
          if (liquid) {
            const sameLiquid = lava ? isLavaLiquid(nb) : isWaterLiquid(nb);
            // верхняя грань: рисуем, если сверху не та же жидкость
            if (f.dir[1] === 1) {
              if (sameLiquid) continue;
            } else if (f.dir[1] === -1) {
              // нижняя грань: рисуем, если снизу НЕ та же жидкость и сосед прозрачный
              // (воздух, стекло, листва, другая жидкость) — иначе лаву/воду не видно снизу
              if (sameLiquid) continue;
              if (!isTransparent(nb)) continue;
            } else {
              // боковая грань: рисуем против воздуха или против той же жидкости с более низкой поверхностью
              if (sameLiquid) {
                const nbTop = liquidSurface(wx + f.dir[0], y + f.dir[1], wz + f.dir[2]);
                if (nbTop >= waterTop - 0.001) continue;
              } else if (nb !== BLOCK.AIR && !isLiquid(nb)) {
                continue;
              }
            }
          } else {
            // твёрдый блок: грань видна, если сосед прозрачный (воздух/вода/листва)
            // используем быстрый OPAQUE-lookup вместо вызова функции isTransparent
            if (OPAQUE[nb]) continue;
            // между двумя блоками листвы грань не рисуем (избегаем двойных граней)
            if (b === BLOCK.LEAVES && nb === BLOCK.LEAVES) continue;
            if (b === BLOCK.NETHER_PORTAL && nb === BLOCK.NETHER_PORTAL) continue;
            if (b === BLOCK.GLASS && nb === BLOCK.GLASS) continue;
          }
          const material = blockMats[f.mat];
          const mi = getMatIndex(material);
          let buf = byMat.get(mi);
          if (!buf) { buf = { positions: [], normals: [], uvs: [], indices: [], colors: [], water: liquid }; byMat.set(mi, buf); }
          // затенение по направлению грани (верх ярче, низ темнее)
          const fShade = f.dir[1] === -1 ? 0.6 : (f.dir[1] === 0 ? 0.82 : 1);
          // свет соседней (освещённой) ячейки грани
          const px = lx + f.dir[0], py = y + f.dir[1], pz = lz + f.dir[2];
          const base = buf.positions.length / 3;
          if (liquid) {
            // жидкость — плоский свет грани (AO на течениях давал бы артефакты)
            sampleLight(c, px, py, pz, _slTmp);
            const wb = _slTmp[1] / 15, ws = _slTmp[0] / 15;
            for (const cv of f.corners) {
              // верхние вершины опускаем до уровня поверхности
              const vy = cv[1] === 1 ? y + waterTop : y + cv[1];
              buf.positions.push(lx + cv[0], vy, lz + cv[2]);
              buf.normals.push(f.dir[0], f.dir[1], f.dir[2]);
              buf.colors.push(wb, ws, fShade);
            }
          } else {
            // СГЛАЖЕННОЕ ОСВЕЩЕНИЕ (как в MC): свет каждого УГЛА вершины —
            // среднее по 4 смежным ячейкам + ambient occlusion от стен.
            const st = SMOOTH_T[f.mat];
            for (let ci = 0; ci < 4; ci++) {
              const cv = f.corners[ci];
              const t = st[ci];
              cornerLight(c, px, py, pz, t[0], t[1], t[2], t[3], t[4], t[5], _cornerOut);
              buf.positions.push(lx + cv[0], y + cv[1], lz + cv[2]);
              buf.normals.push(f.dir[0], f.dir[1], f.dir[2]);
              buf.colors.push(_cornerOut[0], _cornerOut[1], _cornerOut[2] * fShade);
            }
          }
          // UV под порядок углов [нл, нп, вп, вл]
          buf.uvs.push(0,0, 1,0, 1,1, 0,1);
          buf.indices.push(base, base+1, base+2, base, base+2, base+3);
        }
      }
    }
  }

  // создать по мешу на материал
  for (const [mi, buf] of byMat) {
    if (buf.positions.length === 0) continue;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(buf.positions, 3));
    geo.setAttribute('normal', new THREE.Float32BufferAttribute(buf.normals, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(buf.uvs, 2));
    if (buf.colors && buf.colors.length) geo.setAttribute('color', new THREE.Float32BufferAttribute(buf.colors, 3));
    geo.setIndex(buf.indices);
    const mesh = new THREE.Mesh(geo, matList[mi]);
    if (buf.water) mesh.renderOrder = 1; // вода рисуется после непрозрачного
    if (SHADOWS_ON && !buf.water) { mesh.castShadow = true; mesh.receiveShadow = true; }
    group.add(mesh);
  }

  group.position.set(x0, 0, z0);
  return group;
}

