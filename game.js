/* ============================================================
   MiniCraft — основа воксельного движка в духе старого Minecraft
   Three.js r128 (глобальный THREE из CDN)
   ============================================================ */

'use strict';

// ---------- Константы блоков ----------
const BLOCK = {
  AIR:        0,
  GRASS:      1,
  DIRT:       2,
  STONE:      3,
  BEDROCK:    4,
  WATER:      5, // источник (бесконечный)
  WATER_FLOW: 6, // течение (имеет уровень 1..7, может убывать/исчезать)
  SAND:       7, // песок (падает под действием гравитации)
  WOOD:       8, // ствол дуба
  LEAVES:     9, // листва (ничего не выпадает, затухает без ствола)
  PLANKS:     10, // доски
  CRAFTING_TABLE: 11, // верстак (3x3 крафт)
};

const BLOCK_NAMES = {
  [BLOCK.GRASS]:   'Трава',
  [BLOCK.DIRT]:    'Земля',
  [BLOCK.STONE]:   'Камень',
  [BLOCK.BEDROCK]: 'Бедрок',
  [BLOCK.WATER]:   'Вода',
  [BLOCK.WATER_FLOW]: 'Вода',
  [BLOCK.SAND]:    'Песок',
  [BLOCK.WOOD]:    'Дерево',
  [BLOCK.LEAVES]:  'Листва',
  [BLOCK.PLANKS]:  'Доски',
  [BLOCK.CRAFTING_TABLE]: 'Верстак',
};

const MAX_STACK = 64; // максимум в стопке

// Гравитационные блоки (падают, если под ними нет опоры)
function isFalling(b) { return b === BLOCK.SAND; }

// Прозрачные блоки (через них видно грани соседей).
// Листва тоже прозрачна, чтобы внутренние грани были видны (как в майнкрафте fancy).
function isTransparent(b) { return b === BLOCK.AIR || b === BLOCK.WATER || b === BLOCK.WATER_FLOW || b === BLOCK.LEAVES; }
// Жидкости (не твёрдые для коллизий)
function isLiquid(b) { return b === BLOCK.WATER || b === BLOCK.WATER_FLOW; }
// Максимальный уровень воды (источник). Течение: 7..1, чем дальше — тем меньше
const WATER_MAX = 8;
// Уровень моря
const SEA_LEVEL = 22;

// Какие блоки игрок может держать/ставить (бедрок не ставится обычно, но дадим)
const PLACEABLE = [BLOCK.GRASS, BLOCK.DIRT, BLOCK.STONE, BLOCK.SAND,
                   BLOCK.WOOD, BLOCK.LEAVES, BLOCK.PLANKS, BLOCK.CRAFTING_TABLE];

// Время ломания (в секундах, без инструментов) — как в современном майне
const BREAK_TIME = {
  [BLOCK.GRASS]:   0.6,
  [BLOCK.DIRT]:    0.75,
  [BLOCK.STONE]:   1.9,
  [BLOCK.SAND]:    0.5,  // песок ломается быстро
  [BLOCK.WOOD]:    1.5,
  [BLOCK.LEAVES]:  0.3,
  [BLOCK.PLANKS]:  1.2,
  [BLOCK.CRAFTING_TABLE]: 1.2,
  [BLOCK.BEDROCK]: Infinity, // неразрушим
  [BLOCK.WATER]:   Infinity, // воду нельзя сломать
  [BLOCK.WATER_FLOW]: Infinity,
};

// Размеры чанка
const CHUNK_SIZE = 16;
const WORLD_HEIGHT = 64;
let RENDER_DISTANCE = parseInt(localStorage.getItem('minicraft_render_dist') || '4', 10); // в чанках, настраивается

// ============================================================
//  Текстуры (генерируются на canvas, без внешних ассетов)
// ============================================================
const TEX = {};

function makeTex(drawFn) {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const ctx = c.getContext('2d');
  drawFn(ctx);
  return c;
}

function noiseFill(ctx, base, variance) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const v = (Math.random() - 0.5) * variance;
      ctx.fillStyle = shade(base, v);
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

function shade(hex, amt) {
  let r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  r = Math.max(0, Math.min(255, r + amt));
  g = Math.max(0, Math.min(255, g + amt));
  b = Math.max(0, Math.min(255, b + amt));
  return `rgb(${r|0},${g|0},${b|0})`;
}

function buildTextures() {
  TEX.grass_top  = makeTex(ctx => noiseFill(ctx, 0x5f9e3a, 28));
  TEX.grass_side = makeTex(ctx => {
    noiseFill(ctx, 0x8a6a3f, 24);                 // земля
    for (let x = 0; x < 16; x++) {                // зелёная кромка сверху
      const h = 3 + (Math.random() * 3 | 0);
      for (let y = 0; y < h; y++) {
        ctx.fillStyle = shade(0x5f9e3a, (Math.random()-0.5)*28);
        ctx.fillRect(x, y, 1, 1);
      }
    }
  });
  TEX.dirt    = makeTex(ctx => noiseFill(ctx, 0x8a6a3f, 26));
  TEX.stone   = makeTex(ctx => noiseFill(ctx, 0x888888, 30));
  TEX.bedrock = makeTex(ctx => noiseFill(ctx, 0x4a4a4a, 40));
  TEX.water   = makeTex(ctx => noiseFill(ctx, 0x3a6ea5, 18));
  TEX.sand    = makeTex(ctx => noiseFill(ctx, 0xd9cd9a, 16));

  // дерево: бок — кора с вертикальными полосами
  TEX.wood_side = makeTex(ctx => {
    noiseFill(ctx, 0x6b4f2a, 18);
    for (let x = 0; x < 16; x += 3 + (Math.random()*2|0)) {
      ctx.fillStyle = shade(0x6b4f2a, -22);
      for (let y = 0; y < 16; y++) ctx.fillRect(x, y, 1, 1);
    }
  });
  // дерево: торец — годовые кольца
  TEX.wood_top = makeTex(ctx => {
    noiseFill(ctx, 0x9c7842, 14);
    ctx.strokeStyle = shade(0x6b4f2a, -10);
    ctx.lineWidth = 1;
    for (let r = 2; r < 8; r += 2) { ctx.beginPath(); ctx.arc(8, 8, r, 0, Math.PI*2); ctx.stroke(); }
  });
  // листва — зелёная с прозрачными «дырками» (рисуем шум, прозрачность даст материал)
  TEX.leaves = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    for (let y=0;y<16;y++) for (let x=0;x<16;x++) {
      if (Math.random() < 0.12) continue; // дырки
      ctx.fillStyle = shade(0x3f8b2e, (Math.random()-0.5)*36);
      ctx.fillRect(x,y,1,1);
    }
  });
  // доски — горизонтальные планки
  TEX.planks = makeTex(ctx => {
    noiseFill(ctx, 0xb98e4d, 14);
    ctx.fillStyle = shade(0xb98e4d, -30);
    for (let y = 0; y < 16; y += 4) for (let x=0;x<16;x++) ctx.fillRect(x, y, 1, 1);
    for (let y=0;y<16;y++){ ctx.fillRect(7, y, 1, 1); } // вертикальный стык
  });
  // верстак: верх — сетка инструментов, бок — доски с полосой
  TEX.craft_top = makeTex(ctx => {
    noiseFill(ctx, 0xb98e4d, 12);
    ctx.fillStyle = '#5b4423';
    ctx.fillRect(1,1,6,6); ctx.fillRect(9,1,6,6); ctx.fillRect(1,9,6,6); ctx.fillRect(9,9,6,6);
    ctx.fillStyle = '#7a5c2f'; ctx.fillRect(2,2,4,4); ctx.fillRect(10,2,4,4);
  });
  TEX.craft_side = makeTex(ctx => {
    noiseFill(ctx, 0xb98e4d, 12);
    ctx.fillStyle = '#5b4423';
    ctx.fillRect(0,5,16,2); ctx.fillRect(0,9,16,1);
    for (let y=0;y<16;y++){ ctx.fillRect(3,y,1,1); ctx.fillRect(11,y,1,1); }
  });
}

buildTextures();

// ---------- Текстуры трещин (анимация ломания, 10 стадий) ----------
const CRACK_TEX = [];
function buildCrackTextures() {
  for (let stage = 0; stage < 10; stage++) {
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 16, 16);
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 1;
    // чем выше стадия — тем больше трещин
    const cracks = stage + 1;
    // детерминированный псевдослучай по стадии
    let seed = 12345 + stage * 777;
    const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let i = 0; i < cracks; i++) {
      let x = 2 + rnd() * 12;
      let y = 2 + rnd() * 12;
      ctx.beginPath();
      ctx.moveTo(x, y);
      const segs = 2 + (rnd() * 3 | 0);
      for (let s = 0; s < segs; s++) {
        x += (rnd() - 0.5) * 8;
        y += (rnd() - 0.5) * 8;
        x = Math.max(0, Math.min(16, x));
        y = Math.max(0, Math.min(16, y));
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    CRACK_TEX.push(t);
  }
}
buildCrackTextures();

function texToMaterial(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  return new THREE.MeshLambertMaterial({ map: t });
}

function waterMaterial(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  return new THREE.MeshLambertMaterial({
    map: t, transparent: true, opacity: 0.72,
    depthWrite: false, side: THREE.DoubleSide,
  });
}

// Материалы по граням: [px, nx, py, ny, pz, nz] (Three.js BoxGeometry порядок)
let MATERIALS = {};
function buildMaterials() {
  const mGrassTop  = texToMaterial(TEX.grass_top);
  const mGrassSide = texToMaterial(TEX.grass_side);
  const mDirt      = texToMaterial(TEX.dirt);
  const mStone     = texToMaterial(TEX.stone);
  const mBedrock   = texToMaterial(TEX.bedrock);
  const mWater     = waterMaterial(TEX.water);
  const mSand      = texToMaterial(TEX.sand);
  const mWoodSide  = texToMaterial(TEX.wood_side);
  const mWoodTop   = texToMaterial(TEX.wood_top);
  const mPlanks    = texToMaterial(TEX.planks);
  const mCraftTop  = texToMaterial(TEX.craft_top);
  const mCraftSide = texToMaterial(TEX.craft_side);
  // листва: прозрачные «дырки», видна с обеих сторон
  const mLeaves = (() => {
    const t = new THREE.CanvasTexture(TEX.leaves);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
  })();

  MATERIALS[BLOCK.GRASS]   = [mGrassSide, mGrassSide, mGrassTop, mDirt, mGrassSide, mGrassSide];
  MATERIALS[BLOCK.DIRT]    = [mDirt, mDirt, mDirt, mDirt, mDirt, mDirt];
  MATERIALS[BLOCK.STONE]   = [mStone, mStone, mStone, mStone, mStone, mStone];
  MATERIALS[BLOCK.BEDROCK] = [mBedrock, mBedrock, mBedrock, mBedrock, mBedrock, mBedrock];
  MATERIALS[BLOCK.WATER]      = [mWater, mWater, mWater, mWater, mWater, mWater];
  MATERIALS[BLOCK.WATER_FLOW] = [mWater, mWater, mWater, mWater, mWater, mWater];
  MATERIALS[BLOCK.SAND]    = [mSand, mSand, mSand, mSand, mSand, mSand];
  MATERIALS[BLOCK.WOOD]    = [mWoodSide, mWoodSide, mWoodTop, mWoodTop, mWoodSide, mWoodSide];
  MATERIALS[BLOCK.LEAVES]  = [mLeaves, mLeaves, mLeaves, mLeaves, mLeaves, mLeaves];
  MATERIALS[BLOCK.PLANKS]  = [mPlanks, mPlanks, mPlanks, mPlanks, mPlanks, mPlanks];
  MATERIALS[BLOCK.CRAFTING_TABLE] = [mCraftSide, mCraftSide, mCraftTop, mPlanks, mCraftSide, mCraftSide];
}
buildMaterials();

// Цвет для иконок в UI
const BLOCK_COLOR = {
  [BLOCK.GRASS]: '#5f9e3a',
  [BLOCK.DIRT]: '#8a6a3f',
  [BLOCK.STONE]: '#888888',
  [BLOCK.BEDROCK]: '#4a4a4a',
};

// ============================================================
//  Шум для генерации мира (детерминированный value-noise + сид)
// ============================================================
let WORLD_SEED = 0; // устанавливается при создании/загрузке мира

// Превратить строковый сид в число (как в майнкрафте: число или хеш строки)
function parseSeed(str) {
  if (str == null) return (Math.random() * 2147483647) | 0;
  str = String(str).trim();
  if (str === '') return (Math.random() * 2147483647) | 0;
  // если это просто число — используем его
  if (/^-?\d+$/.test(str)) return parseInt(str, 10) | 0;
  // иначе — хешируем строку
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 2654435761);
    h ^= h >>> 15;
  }
  return h | 0;
}

function hash2(x, z) {
  // целочисленный хеш с полным 32-битным диапазоном (0..1), зависящий от сида
  let h = (x | 0) * 374761393 + (z | 0) * 668265263 + Math.imul(WORLD_SEED, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function smooth(t) { return t * t * (3 - 2 * t); }
function valueNoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const v00 = hash2(xi, zi), v10 = hash2(xi + 1, zi);
  const v01 = hash2(xi, zi + 1), v11 = hash2(xi + 1, zi + 1);
  const u = smooth(xf), v = smooth(zf);
  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(v00, v10, u),
    THREE.MathUtils.lerp(v01, v11, u),
    v
  );
}
function terrainHeight(wx, wz) {
  let h = 0, amp = 1, freq = 0.011, sum = 0;
  for (let o = 0; o < 4; o++) {
    h += valueNoise(wx * freq, wz * freq) * amp;
    sum += amp; amp *= 0.5; freq *= 2;
  }
  h /= sum; // 0..1
  // расширенная вариация: впадины уходят ниже уровня моря -> озёра/моря
  return Math.floor(12 + h * 26); // диапазон ~12..38
}

// отдельный хеш для решений о деревьях (не зависит от рельефного шума)
function treeHash(wx, wz) {
  let h = (wx | 0) * 1597334677 + (wz | 0) * 3812015801 + Math.imul(WORLD_SEED, 22695477);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

// растёт ли дерево в этой колонке (на суше, выше уровня моря, разрежено)
function treeAt(wx, wz) {
  const h = terrainHeight(wx, wz);
  if (h <= SEA_LEVEL + 1) return 0;     // не на пляже/воде
  if (treeHash(wx, wz) > 0.018) return 0; // ~1.8% колонок
  // высота ствола 4..6
  return 4 + Math.floor(treeHash(wx + 99, wz - 99) * 3);
}

// ============================================================
//  Хранилище мира (чанки)
// ============================================================
const World = {
  chunks: new Map(),          // "cx,cz" -> { blocks:Uint8Array, mesh, dirty }
  edits: new Map(),           // "x,y,z" -> blockId  (изменения игрока)
  waterLevel: new Map(),      // "x,y,z" -> уровень воды (1..8); источник = 8

  key(cx, cz) { return cx + ',' + cz; },
  ekey(x, y, z) { return x + ',' + y + ',' + z; },

  // Уровень воды в ячейке: источник=8, течение=1..7, нет воды=0
  getLevel(x, y, z) {
    const b = this.getBlock(x, y, z);
    if (b === BLOCK.WATER) return WATER_MAX;
    if (b === BLOCK.WATER_FLOW) return this.waterLevel.get(this.ekey(x, y, z)) || 1;
    return 0;
  },
  setLevel(x, y, z, lvl) {
    this.waterLevel.set(this.ekey(x, y, z), lvl);
  },
  clearLevel(x, y, z) {
    this.waterLevel.delete(this.ekey(x, y, z));
  },

  generateChunk(cx, cz) {
    const blocks = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = cx * CHUNK_SIZE + lx;
        const wz = cz * CHUNK_SIZE + lz;
        const h = terrainHeight(wx, wz);
        const underwater = h <= SEA_LEVEL; // эта колонка под/у уровня моря
        // Пляжи/дно: верх рядом с уровнем моря (немного выше и до 3 блоков под водой) — песок
        const beach = (h >= SEA_LEVEL - 3 && h <= SEA_LEVEL + 1);
        for (let y = 0; y < WORLD_HEIGHT; y++) {
          let b = BLOCK.AIR;
          if (y === 0) b = BLOCK.BEDROCK;
          else if (y < h - 4) b = BLOCK.STONE;
          else if (y < h - 1) b = beach ? BLOCK.SAND : BLOCK.DIRT; // под верхним слоем тоже песок на пляже
          else if (y < h) {
            // верхний слой
            if (beach) b = BLOCK.SAND;             // берег / дно реки
            else b = underwater ? BLOCK.DIRT : BLOCK.GRASS;
          } else if (y <= SEA_LEVEL) {
            b = BLOCK.WATER; // заливаем впадины водой до уровня моря
          }
          blocks[idx(lx, y, lz)] = b;
        }
      }
    }

    // ---- Деревья ----
    // Проверяем колонки в расширенной области (±2), чтобы кроны на границе чанков попадали внутрь.
    const x0c = cx * CHUNK_SIZE, z0c = cz * CHUNK_SIZE;
    const setLocal = (wx, wy, wz, id, overwrite) => {
      const llx = wx - x0c, llz = wz - z0c;
      if (llx < 0 || llx >= CHUNK_SIZE || llz < 0 || llz >= CHUNK_SIZE) return;
      if (wy < 0 || wy >= WORLD_HEIGHT) return;
      const cur = blocks[idx(llx, wy, llz)];
      // листву ставим только в воздух; ствол перекрывает листву
      if (!overwrite && cur !== BLOCK.AIR && cur !== BLOCK.LEAVES) return;
      blocks[idx(llx, wy, llz)] = id;
    };
    for (let ox = -2; ox < CHUNK_SIZE + 2; ox++) {
      for (let oz = -2; oz < CHUNK_SIZE + 2; oz++) {
        const wx = x0c + ox, wz = z0c + oz;
        const trunkH = treeAt(wx, wz);
        if (!trunkH) continue;
        const baseY = terrainHeight(wx, wz); // верхний блок земли = baseY-1, ствол с baseY
        const topY = baseY + trunkH - 1;
        // крона: шар листвы вокруг верхушки
        for (let ly = topY - 2; ly <= topY + 1; ly++) {
          const rad = (ly >= topY) ? 1 : 2; // верх уже
          for (let dx = -rad; dx <= rad; dx++)
            for (let dz = -rad; dz <= rad; dz++) {
              if (Math.abs(dx) === rad && Math.abs(dz) === rad && rad === 2 && treeHash(wx+dx, wz+dz) < 0.5) continue; // скруглить углы
              setLocal(wx + dx, ly, wz + dz, BLOCK.LEAVES, false);
            }
        }
        // ствол
        for (let i = 0; i < trunkH; i++) setLocal(wx, baseY + i, wz, BLOCK.WOOD, true);
      }
    }

    return { blocks, mesh: null, dirty: true, cx, cz };
  },

  getChunk(cx, cz) {
    const k = this.key(cx, cz);
    let c = this.chunks.get(k);
    if (!c) {
      c = this.generateChunk(cx, cz);
      // применить сохранённые правки
      this.chunks.set(k, c);
      this.applyEditsToChunk(c);
    }
    return c;
  },

  applyEditsToChunk(c) {
    const x0 = c.cx * CHUNK_SIZE, z0 = c.cz * CHUNK_SIZE;
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        for (let y = 0; y < WORLD_HEIGHT; y++) {
          const ek = this.ekey(x0 + lx, y, z0 + lz);
          if (this.edits.has(ek)) {
            c.blocks[idx(lx, y, lz)] = this.edits.get(ek);
          }
        }
      }
    }
  },

  getBlock(wx, wy, wz) {
    if (wy < 0 || wy >= WORLD_HEIGHT) return BLOCK.AIR;
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const c = this.getChunk(cx, cz);
    const lx = wx - cx * CHUNK_SIZE;
    const lz = wz - cz * CHUNK_SIZE;
    return c.blocks[idx(lx, wy, lz)];
  },

  // transient=true: изменение от симуляции воды, его не сохраняем как правку игрока
  setBlock(wx, wy, wz, id, transient = false) {
    if (wy < 0 || wy >= WORLD_HEIGHT) return;
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const c = this.getChunk(cx, cz);
    const lx = wx - cx * CHUNK_SIZE;
    const lz = wz - cz * CHUNK_SIZE;
    c.blocks[idx(lx, wy, lz)] = id;
    c.dirty = true;
    if (!transient) this.edits.set(this.ekey(wx, wy, wz), id);
    // уровень храним только для течения; иначе чистим
    if (id !== BLOCK.WATER_FLOW) this.clearLevel(wx, wy, wz);

    // пометить соседние чанки dirty если на границе
    if (lx === 0) this.markDirty(cx - 1, cz);
    if (lx === CHUNK_SIZE - 1) this.markDirty(cx + 1, cz);
    if (lz === 0) this.markDirty(cx, cz - 1);
    if (lz === CHUNK_SIZE - 1) this.markDirty(cx, cz + 1);
  },

  markDirty(cx, cz) {
    const c = this.chunks.get(this.key(cx, cz));
    if (c) c.dirty = true;
  },
};

function idx(x, y, z) {
  return y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x;
}

// ============================================================
//  Симуляция воды — модель современного Minecraft (уровни + течение)
//  Источник WATER = уровень 8 (бесконечный).
//  Течение WATER_FLOW = уровень 7..1, убывает на 1 за блок, до 7 блоков.
//  Вода, потерявшая питание, постепенно исчезает.
// ============================================================
const WaterSim = {
  queue: [],            // FIFO список ключей "x,y,z"
  inQueue: new Set(),   // защита от дублей
  tickAcc: 0,
  tickRate: 0.14,       // сек между тиками
  MAX_PER_TICK: 220,    // лимит ячеек за тик — гарантия от лагов
  changedChunks: new Set(),

  enqueue(x, y, z) {
    if (y < 0 || y >= WORLD_HEIGHT) return;
    const k = x + ',' + y + ',' + z;
    if (this.inQueue.has(k)) return;
    this.inQueue.add(k);
    this.queue.push(k);
  },
  touchAround(x, y, z) {
    this.enqueue(x, y, z);
    this.enqueue(x + 1, y, z); this.enqueue(x - 1, y, z);
    this.enqueue(x, y, z + 1); this.enqueue(x, y, z - 1);
    this.enqueue(x, y + 1, z); this.enqueue(x, y - 1, z);
  },

  markChunk(x, z) {
    const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(z / CHUNK_SIZE);
    this.changedChunks.add(cx + ',' + cz);
    // приграничные чанки
    const lx = x - cx * CHUNK_SIZE, lz = z - cz * CHUNK_SIZE;
    if (lx === 0) this.changedChunks.add((cx - 1) + ',' + cz);
    if (lx === CHUNK_SIZE - 1) this.changedChunks.add((cx + 1) + ',' + cz);
    if (lz === 0) this.changedChunks.add(cx + ',' + (cz - 1));
    if (lz === CHUNK_SIZE - 1) this.changedChunks.add(cx + ',' + (cz + 1));
  },

  // поставить течение нужного уровня (или удалить воду)
  setFlow(x, y, z, lvl) {
    if (lvl <= 0) {
      World.clearLevel(x, y, z);
      World.setBlock(x, y, z, BLOCK.AIR, true); // transient — не сохраняем
    } else {
      World.setLevel(x, y, z, lvl);
      World.setBlock(x, y, z, BLOCK.WATER_FLOW, true);
    }
    this.markChunk(x, z);
    this.touchAround(x, y, z);
  },

  solidBelow(x, y, z) {
    const b = World.getBlock(x, y - 1, z);
    return b !== BLOCK.AIR && !isLiquid(b);
  },

  // Желаемый уровень ячейки исходя из питания.
  // Возвращает {level, falling}. falling=true означает «падающая» вода (сверху жидкость):
  //   она всегда полная (7) и НЕ растекается вбок — только вниз.
  desiredLevel(x, y, z) {
    // питание сверху -> падающая вода
    if (isLiquid(World.getBlock(x, y + 1, z))) return { level: 7, falling: true };
    // иначе — максимум из горизонтальных соседей минус 1.
    // ВАЖНО: сосед, под которым воздух (он «падает»), не питает по горизонтали —
    // иначе вода растекается над пропастью вместо того, чтобы литься вниз.
    let best = 0;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dx, dz] of dirs) {
      const nx = x + dx, nz = z + dz;
      const nb = World.getBlock(nx, y, nz);
      if (nb === BLOCK.WATER) {
        best = Math.max(best, 7); // источник питает на 7
      } else if (nb === BLOCK.WATER_FLOW) {
        // сосед, который сам падает (под ним воздух), вбок не питает
        if (World.getBlock(nx, y - 1, nz) === BLOCK.AIR) continue;
        best = Math.max(best, World.getLevel(nx, y, nz) - 1);
      }
    }
    return { level: best, falling: false };
  },

  step(x, y, z) {
    const here = World.getBlock(x, y, z);

    // 1) пустая ячейка — может ли заполниться?
    if (here === BLOCK.AIR) {
      const d = this.desiredLevel(x, y, z);
      if (d.level > 0) this.setFlow(x, y, z, d.level);
      return;
    }

    // источник: не меняется, льёт вниз и растекается вбок (на 7)
    if (here === BLOCK.WATER) {
      if (World.getBlock(x, y - 1, z) === BLOCK.AIR) this.setFlow(x, y - 1, z, 7);
      else this.spreadSides(x, y, z, 7);
      return;
    }

    // 2) течение — пересчитать уровень от питания
    if (here === BLOCK.WATER_FLOW) {
      const d = this.desiredLevel(x, y, z);
      if (d.level <= 0) { this.setFlow(x, y, z, 0); return; } // нет питания -> исчезает

      const cur = World.getLevel(x, y, z);
      if (d.level !== cur) {
        World.setLevel(x, y, z, d.level);
        this.markChunk(x, z);
        this.touchAround(x, y, z);
      }

      // под ячейкой воздух -> вода падает вниз (приоритет, без бокового растекания)
      if (World.getBlock(x, y - 1, z) === BLOCK.AIR) {
        this.setFlow(x, y - 1, z, 7);
        return;
      }
      // падающая вода вбок не растекается
      if (d.falling) return;
      // лежит на опоре (твёрдое или вода снизу) -> растекается вбок
      this.spreadSides(x, y, z, d.level);
      return;
    }
  },

  spreadSides(x, y, z, lvl) {
    const next = lvl - 1;
    if (next <= 0) return;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dx, dz] of dirs) {
      const nx = x + dx, nz = z + dz;
      const nb = World.getBlock(nx, y, nz);
      if (nb === BLOCK.AIR) {
        this.setFlow(nx, y, nz, next);
      } else if (nb === BLOCK.WATER_FLOW && World.getLevel(nx, y, nz) < next) {
        World.setLevel(nx, y, nz, next);
        this.markChunk(nx, nz);
        this.touchAround(nx, y, nz);
      }
    }
  },

  update(dt) {
    this.tickAcc += dt;
    if (this.tickAcc < this.tickRate) return;
    this.tickAcc = 0;
    if (this.queue.length === 0) return;

    let processed = 0;
    while (this.queue.length > 0 && processed < this.MAX_PER_TICK) {
      const k = this.queue.shift();
      this.inQueue.delete(k);
      const [x, y, z] = k.split(',').map(Number);
      this.step(x, y, z);
      processed++;
    }

    // перестроить только реально изменившиеся чанки
    if (this.changedChunks.size > 0) {
      for (const ck of this.changedChunks) {
        const [cx, cz] = ck.split(',').map(Number);
        World.markDirty(cx, cz);
      }
      this.changedChunks.clear();
    }
  },
};

// ============================================================
//  Меширование чанков (объединённая геометрия, только видимые грани)
// ============================================================
// Грани: dir vector + 4 угла (CCW при взгляде снаружи) + uv + материал-индекс
// Порядок углов: [нижн-лев, нижн-прав, верх-прав, верх-лев] относительно грани.
// Индексы: 0,1,2, 0,2,3 — даёт корректную (против часовой) намотку наружу.
const FACES = [
  { dir: [ 1, 0, 0], mat: 0, // +X (смотрим с +X в сторону -X)
    corners: [[1,0,1],[1,0,0],[1,1,0],[1,1,1]] },
  { dir: [-1, 0, 0], mat: 1, // -X
    corners: [[0,0,0],[0,0,1],[0,1,1],[0,1,0]] },
  { dir: [ 0, 1, 0], mat: 2, // +Y (верх)
    corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]] },
  { dir: [ 0,-1, 0], mat: 3, // -Y (низ)
    corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]] },
  { dir: [ 0, 0, 1], mat: 4, // +Z
    corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]] },
  { dir: [ 0, 0,-1], mat: 5, // -Z
    corners: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]] },
];

// поверхность воды в ячейке (0..1) с учётом уровня; полная если сверху вода
function waterSurface(x, y, z) {
  const b = World.getBlock(x, y, z);
  if (!isLiquid(b)) return 0;
  if (isLiquid(World.getBlock(x, y + 1, z))) return 1;
  const lvl = World.getLevel(x, y, z);
  return 0.12 + (lvl / WATER_MAX) * 0.86;
}

function buildChunkMesh(c) {
  // Группируем по материалу (по уникальному canvas-материалу)
  // Соберём геометрию для каждого блок-типа отдельно, чтобы корректно текстурировать грани.
  const group = new THREE.Group();
  const x0 = c.cx * CHUNK_SIZE, z0 = c.cz * CHUNK_SIZE;

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
        const water = isLiquid(b);

        // высота поверхности воды (0..1) по уровню; если сверху вода — поверхность полная
        let waterTop = 1;
        if (water) {
          const above = World.getBlock(wx, y + 1, wz);
          if (isLiquid(above)) {
            waterTop = 1; // вода под водой — полный куб
          } else {
            const lvl = World.getLevel(wx, y, wz); // 1..8
            waterTop = 0.12 + (lvl / WATER_MAX) * 0.86; // от ~0.2 (lvl1) до ~1.0 (источник)
          }
        }

        for (const f of FACES) {
          const nb = World.getBlock(wx + f.dir[0], y + f.dir[1], wz + f.dir[2]);
          if (water) {
            // верхняя грань: рисуем, если сверху не вода
            if (f.dir[1] === 1) {
              if (isLiquid(nb)) continue;
            } else if (f.dir[1] === -1) {
              // нижняя грань: только если снизу воздух
              if (nb !== BLOCK.AIR) continue;
            } else {
              // боковая грань: рисуем против воздуха или против воды с более низкой поверхностью
              if (isLiquid(nb)) {
                const nbTop = waterSurface(wx + f.dir[0], y + f.dir[1], wz + f.dir[2]);
                if (nbTop >= waterTop - 0.001) continue;
              } else if (nb !== BLOCK.AIR) {
                continue;
              }
            }
          } else {
            // твёрдый блок: грань видна, если сосед прозрачный (воздух/вода/листва)
            if (!isTransparent(nb)) continue;
            // между двумя блоками листвы грань не рисуем (избегаем двойных граней)
            if (b === BLOCK.LEAVES && nb === BLOCK.LEAVES) continue;
          }
          const material = MATERIALS[b][f.mat];
          const mi = getMatIndex(material);
          let buf = byMat.get(mi);
          if (!buf) { buf = { positions: [], normals: [], uvs: [], indices: [], water }; byMat.set(mi, buf); }
          const base = buf.positions.length / 3;
          for (const cv of f.corners) {
            // у воды верхние вершины опускаем до уровня поверхности
            const vy = water && cv[1] === 1 ? y + waterTop : y + cv[1];
            buf.positions.push(lx + cv[0], vy, lz + cv[2]);
            buf.normals.push(f.dir[0], f.dir[1], f.dir[2]);
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
    geo.setIndex(buf.indices);
    const mesh = new THREE.Mesh(geo, matList[mi]);
    if (buf.water) mesh.renderOrder = 1; // вода рисуется после непрозрачного
    group.add(mesh);
  }

  group.position.set(x0, 0, z0);
  return group;
}

// ============================================================
//  Three.js сцена
// ============================================================
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, RENDER_DISTANCE * CHUNK_SIZE * 0.6, RENDER_DISTANCE * CHUNK_SIZE);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Свет
const sun = new THREE.DirectionalLight(0xffffff, 0.85);
sun.position.set(0.5, 1, 0.3);
scene.add(sun);
scene.add(new THREE.AmbientLight(0xffffff, 0.55));

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Подсветка выделенного блока
const highlight = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.001, 1.001, 1.001)),
  new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2, transparent: true, opacity: 0.5 })
);
highlight.visible = false;
scene.add(highlight);

// Оверлей трещин (немного больше блока, чтобы не было z-fighting)
const breakOverlay = new THREE.Mesh(
  new THREE.BoxGeometry(1.002, 1.002, 1.002),
  new THREE.MeshBasicMaterial({
    map: CRACK_TEX[0],
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    depthWrite: false,
  })
);
breakOverlay.visible = false;
scene.add(breakOverlay);

// ============================================================
//  Игрок и физика
// ============================================================
const PLAYER = {
  pos: new THREE.Vector3(8, 50, 8),
  vel: new THREE.Vector3(0, 0, 0),
  width: 0.6,
  height: 1.8,
  eye: 1.62,       // высота глаз стоя
  crouchEye: 1.32, // присев
  onGround: false,
  crouching: false,
  yaw: 0,
  pitch: 0,
  speed: 4.3,
  sprintMul: 1.55,
  jumpV: 8.2,
  inWater: false,
  submerged: false,
  oxygen: 10,        // запас воздуха (0..10 «пузырьков»)
  maxOxygen: 10,
  drownTimer: 0,
};

const GRAVITY = 26;
const keys = {};

// ---------- Управление ----------
let pointerLocked = false;
let gameStarted = false; // true после загрузки/создания мира
const overlay = document.getElementById('overlay');

// ============================================================
//  Менеджер миров (создание, сохранение, загрузка, сиды)
// ============================================================
const WorldManager = {
  current: null, // имя текущего мира
  LS_INDEX: 'minicraft_worlds',     // список миров
  LS_PREFIX: 'minicraft_world_',    // данные мира

  list() {
    try { return JSON.parse(localStorage.getItem(this.LS_INDEX) || '[]'); }
    catch (e) { return []; }
  },
  saveIndex(arr) {
    localStorage.setItem(this.LS_INDEX, JSON.stringify(arr));
  },

  // сбросить мир в памяти перед загрузкой/созданием нового
  resetState() {
    // удалить меши
    for (const [, mesh] of loadedMeshes) { scene.remove(mesh); disposeGroup(mesh); }
    loadedMeshes.clear();
    World.chunks.clear();
    World.edits.clear();
    World.waterLevel.clear();
    // очистить сущности
    for (const d of drops) { scene.remove(d.mesh); }
    drops.length = 0;
    for (const s of fallingSand) { scene.remove(s.mesh); }
    fallingSand.length = 0;
    sandCheckQueue.length = 0; sandInQueue.clear();
    WaterSim.queue.length = 0; WaterSim.inQueue.clear();
    leafDecay.length = 0; leafDecaySet.clear();
    // инвентарь / крафт
    for (let i = 0; i < TOTAL_SLOTS; i++) slots[i] = null;
    for (let i = 0; i < craftSlots.length; i++) craftSlots[i] = null;
    cursorItem = null; craftResult = null;
    activeSlot = 0;
    PLAYER.vel.set(0, 0, 0);
    PLAYER.oxygen = PLAYER.maxOxygen;
  },

  // создать новый мир
  create(name, seedStr) {
    name = (name || '').trim() || ('Мир ' + (this.list().length + 1));
    const seed = parseSeed(seedStr);
    this.resetState();
    WORLD_SEED = seed;
    this.current = name;
    spawnPlayer();
    renderHotbar();

    const arr = this.list().filter(w => w.name !== name);
    arr.push({ name, seed, updated: Date.now() });
    this.saveIndex(arr);
    this.save(); // первичное сохранение
    beginGame();
  },

  // сохранить текущий мир в localStorage
  save() {
    if (!this.current) return false;
    const data = {
      seed: WORLD_SEED,
      player: {
        x: PLAYER.pos.x, y: PLAYER.pos.y, z: PLAYER.pos.z,
        yaw: PLAYER.yaw, pitch: PLAYER.pitch,
        oxygen: PLAYER.oxygen,
      },
      slots: slots.map(s => s ? { id: s.id, count: s.count } : null),
      activeSlot,
      // правки блоков: "x,y,z:id"  (только постоянные изменения игрока)
      edits: Array.from(World.edits.entries()).map(([k, v]) => k + ':' + v),
    };
    try {
      localStorage.setItem(this.LS_PREFIX + this.current, JSON.stringify(data));
      const arr = this.list();
      const w = arr.find(x => x.name === this.current);
      if (w) { w.updated = Date.now(); this.saveIndex(arr); }
      return true;
    } catch (e) {
      console.warn('Не удалось сохранить мир:', e);
      return false;
    }
  },

  // загрузить мир по имени
  load(name) {
    let data;
    try { data = JSON.parse(localStorage.getItem(this.LS_PREFIX + name)); }
    catch (e) { data = null; }
    if (!data) { alert('Мир не найден или повреждён'); return; }

    this.resetState();
    WORLD_SEED = data.seed | 0;
    this.current = name;

    // восстановить правки блоков
    for (const s of (data.edits || [])) {
      const i = s.lastIndexOf(':');
      const k = s.slice(0, i), v = parseInt(s.slice(i + 1), 10);
      World.edits.set(k, v);
    }
    // инвентарь (новый формат слотов; старые сейвы без slots -> пустой инвентарь)
    if (Array.isArray(data.slots)) {
      for (let i = 0; i < TOTAL_SLOTS; i++) {
        slots[i] = data.slots[i] ? { id: data.slots[i].id, count: data.slots[i].count } : null;
      }
    }
    activeSlot = data.activeSlot || 0;
    renderHotbar();

    // игрок
    const p = data.player || {};
    PLAYER.pos.set(p.x ?? 8, p.y ?? 50, p.z ?? 8);
    PLAYER.yaw = p.yaw || 0;
    PLAYER.pitch = p.pitch || 0;
    PLAYER.oxygen = p.oxygen ?? PLAYER.maxOxygen;

    // пере-запустить воду и песок вокруг изменённых клеток, чтобы каналы/обвалы восстановились
    for (const k of World.edits.keys()) {
      const [x, y, z] = k.split(',').map(Number);
      WaterSim.touchAround(x, y, z);
      checkSandAround(x, y, z);
    }

    beginGame();
  },

  delete(name) {
    localStorage.removeItem(this.LS_PREFIX + name);
    this.saveIndex(this.list().filter(w => w.name !== name));
    renderWorldList();
  },
};

// запустить игровой процесс (после выбора мира)
function beginGame() {
  gameStarted = true;
  overlay.classList.add('hidden');
  document.getElementById('menuBtn').style.display = 'block';
  initAudio();
  canvas.requestPointerLock();
  // автосохранение каждые 20 секунд
  if (!WorldManager._autosave) {
    WorldManager._autosave = setInterval(() => { if (gameStarted) WorldManager.save(); }, 20000);
  }
}

// сохранять при выходе со страницы
window.addEventListener('beforeunload', () => { if (gameStarted) WorldManager.save(); });

canvas.addEventListener('click', () => {
  if (!pointerLocked && overlay.classList.contains('hidden') && !invOpen) {
    canvas.requestPointerLock();
  }
});

document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === canvas;
});

document.addEventListener('mousemove', (e) => {
  if (!pointerLocked) return;
  const sens = 0.0022;
  PLAYER.yaw   -= e.movementX * sens;
  PLAYER.pitch -= e.movementY * sens;
  const lim = Math.PI / 2 - 0.01;
  PLAYER.pitch = Math.max(-lim, Math.min(lim, PLAYER.pitch));
});

document.addEventListener('keydown', (e) => {
  // игнорировать игровые клавиши, когда печатаем в поле ввода или мир ещё не запущен
  const typing = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
  if (typing) return;
  keys[e.code] = true;
  if (!gameStarted) return;
  if (e.code === 'KeyE') { toggleInventory(); }
  if (e.code.startsWith('Digit')) {
    const n = parseInt(e.code.slice(5), 10);
    if (n >= 1 && n <= HOTBAR_SIZE) selectSlot(n - 1);
  }
  // Escape обрабатывается в отдельном обработчике ниже (инвентарь/меню)
});
document.addEventListener('keyup', (e) => { keys[e.code] = false; });

// Колесо мыши — смена слота
window.addEventListener('wheel', (e) => {
  if (invOpen) return;
  const dir = e.deltaY > 0 ? 1 : -1;
  selectSlot((activeSlot + dir + HOTBAR_SIZE) % HOTBAR_SIZE);
});

// ---------- Ломание / постановка ----------
let leftHeld = false;
canvas.addEventListener('mousedown', (e) => {
  if (!pointerLocked) return;
  if (e.button === 0) leftHeld = true;          // удержание = непрерывное ломание
  if (e.button === 2) placeBlock();
});
canvas.addEventListener('mouseup', (e) => {
  if (e.button === 0) { leftHeld = false; resetMining(); }
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Состояние ломания (как в современном майнкрафте)
const mining = {
  active: false,
  x: 0, y: 0, z: 0,   // координаты блока
  block: BLOCK.AIR,
  progress: 0,        // 0..1
};

function resetMining() {
  mining.active = false;
  mining.progress = 0;
  breakOverlay.visible = false;
}

// Вызывается каждый кадр при удержании ЛКМ
function updateMining(dt) {
  if (!leftHeld || invOpen) { if (mining.active) resetMining(); return; }

  const t = getTargetBlock();
  if (!t || t.block === BLOCK.BEDROCK) { resetMining(); return; }

  // если смотрим на другой блок — начать заново
  if (!mining.active || mining.x !== t.x || mining.y !== t.y || mining.z !== t.z) {
    mining.active = true;
    mining.x = t.x; mining.y = t.y; mining.z = t.z;
    mining.block = t.block;
    mining.progress = 0;
    playSound('dig', mining.block);
  }

  const time = BREAK_TIME[mining.block] || 1;
  mining.progress += dt / time;

  // звук копания каждые ~0.25с
  mining.digTimer = (mining.digTimer || 0) + dt;
  if (mining.digTimer > 0.22) { mining.digTimer = 0; playSound('dig', mining.block); }

  if (mining.progress >= 1) {
    finishBreak(t);
    resetMining();
    return;
  }

  // показать трещины
  const stage = Math.min(9, Math.floor(mining.progress * 10));
  breakOverlay.material.map = CRACK_TEX[stage];
  breakOverlay.material.needsUpdate = true;
  breakOverlay.position.set(t.x + 0.5, t.y + 0.5, t.z + 0.5);
  breakOverlay.visible = true;
}

// ============================================================
//  Инвентарь по слотам (как в Minecraft) + крафт
// ============================================================
const HOTBAR_SIZE = 9;
const INV_ROWS = 3, INV_COLS = 9;       // основное хранилище 27
const TOTAL_SLOTS = HOTBAR_SIZE + INV_ROWS * INV_COLS; // 36
let activeSlot = 0;
let invOpen = false;
let craftMode = '2x2';                   // '2x2' (инвентарь) или '3x3' (верстак)

// Слоты: 0..8 — хотбар, 9..35 — хранилище. Каждый: {id, count} или null
const slots = new Array(TOTAL_SLOTS).fill(null);
// Слоты крафта (до 9) и результат
const craftSlots = new Array(9).fill(null);
let craftResult = null;
// Предмет «на курсоре» (взятый мышью)
let cursorItem = null;

function maxStack(id) { return MAX_STACK; }

// ---- Базовые операции со стопками ----
function addToInventory(id, n = 1) {
  // сначала докинуть в существующие стопки
  for (let i = 0; i < TOTAL_SLOTS && n > 0; i++) {
    const s = slots[i];
    if (s && s.id === id && s.count < maxStack(id)) {
      const can = Math.min(n, maxStack(id) - s.count);
      s.count += can; n -= can;
    }
  }
  // затем в пустые слоты (приоритет хотбару)
  for (let i = 0; i < TOTAL_SLOTS && n > 0; i++) {
    if (!slots[i]) {
      const can = Math.min(n, maxStack(id));
      slots[i] = { id, count: can }; n -= can;
    }
  }
  refreshUI();
  return n === 0; // false если не всё влезло
}

function countItem(id) {
  let c = 0;
  for (const s of slots) if (s && s.id === id) c += s.count;
  return c;
}

// убрать n штук id из инвентаря (для постановки блока)
function removeFromInventory(id, n = 1) {
  if (countItem(id) < n) return false;
  for (let i = 0; i < TOTAL_SLOTS && n > 0; i++) {
    const s = slots[i];
    if (s && s.id === id) {
      const take = Math.min(n, s.count);
      s.count -= take; n -= take;
      if (s.count <= 0) slots[i] = null;
    }
  }
  refreshUI();
  return true;
}

function selectSlot(i) { activeSlot = i; renderHotbar(); }

// активный предмет хотбара (для постановки блоков)
function activeItem() { return slots[activeSlot]; }

// ---- Иконки блоков ----
function iconCanvas(id, size) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  let tex = TEX.stone;
  if (id === BLOCK.GRASS) tex = TEX.grass_side;
  else if (id === BLOCK.DIRT) tex = TEX.dirt;
  else if (id === BLOCK.STONE) tex = TEX.stone;
  else if (id === BLOCK.BEDROCK) tex = TEX.bedrock;
  else if (id === BLOCK.WATER) tex = TEX.water;
  else if (id === BLOCK.SAND) tex = TEX.sand;
  else if (id === BLOCK.WOOD) tex = TEX.wood_side;
  else if (id === BLOCK.LEAVES) tex = TEX.leaves;
  else if (id === BLOCK.PLANKS) tex = TEX.planks;
  else if (id === BLOCK.CRAFTING_TABLE) tex = TEX.craft_top;
  ctx.imageSmoothingEnabled = false;
  // фон для листвы (она прозрачная)
  if (id === BLOCK.LEAVES) { ctx.fillStyle = '#2f6e22'; ctx.fillRect(0,0,size,size); }
  ctx.drawImage(tex, 0, 0, size, size);
  return c;
}

// ---- Хотбар (нижняя панель) ----
const hotbarEl = document.getElementById('hotbar');
function renderHotbar() {
  hotbarEl.innerHTML = '';
  for (let i = 0; i < HOTBAR_SIZE; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot' + (i === activeSlot ? ' active' : '');
    const item = slots[i];
    if (item) {
      slot.appendChild(iconCanvas(item.id, 40));
      if (item.count > 1) {
        const cnt = document.createElement('div');
        cnt.className = 'count'; cnt.textContent = item.count;
        slot.appendChild(cnt);
      }
    }
    slot.addEventListener('click', () => { if (!invOpen) selectSlot(i); });
    hotbarEl.appendChild(slot);
  }
}

// ============================================================
//  Рецепты крафта
// ============================================================
// Каждый рецепт: { shapeless?, pattern (для формовых), result:{id,count} }
// Для простоты: формовые задаются как массив строк с символами,
// бесформенные — как набор {id:count}.
const RECIPES = [
  // 1 дерево -> 4 доски (бесформенно)
  { shapeless: true, ingredients: { [BLOCK.WOOD]: 1 }, result: { id: BLOCK.PLANKS, count: 4 } },
  // 4 доски в 2x2 -> верстак
  { shaped: true, w: 2, h: 2,
    cells: [BLOCK.PLANKS, BLOCK.PLANKS, BLOCK.PLANKS, BLOCK.PLANKS],
    result: { id: BLOCK.CRAFTING_TABLE, count: 1 } },
];

// нормализовать содержимое сетки крафта к компактной матрице (обрезать пустые края)
function craftMatrix(size) {
  const n = size; // 2 или 3
  const grid = [];
  for (let r = 0; r < n; r++) { grid.push([]); for (let cc = 0; cc < n; cc++) grid[r].push(craftSlots[r*n+cc]); }
  // границы непустых
  let minR=n, maxR=-1, minC=n, maxC=-1;
  for (let r=0;r<n;r++) for (let cc=0;cc<n;cc++) if (grid[r][cc]) { minR=Math.min(minR,r);maxR=Math.max(maxR,r);minC=Math.min(minC,cc);maxC=Math.max(maxC,cc); }
  if (maxR<0) return null;
  const m=[];
  for (let r=minR;r<=maxR;r++){const row=[];for (let cc=minC;cc<=maxC;cc++)row.push(grid[r][cc]?grid[r][cc].id:0);m.push(row);}
  return m;
}

function craftTotals(size) {
  const n = size; const tot = {};
  for (let i=0;i<n*n;i++){const s=craftSlots[i];if(s)tot[s.id]=(tot[s.id]||0)+1;}
  return tot;
}

function matchRecipe(size) {
  const totals = craftTotals(size);
  const totalCount = Object.values(totals).reduce((a,b)=>a+b,0);
  if (totalCount === 0) return null;
  for (const rec of RECIPES) {
    if (rec.shapeless) {
      const keys = Object.keys(rec.ingredients);
      if (keys.length !== Object.keys(totals).length) continue;
      let ok = true;
      for (const k of keys) if ((totals[k]||0) !== rec.ingredients[k]) ok = false;
      if (ok) return rec;
    } else if (rec.shaped) {
      const m = craftMatrix(size);
      if (!m) continue;
      if (m.length !== rec.h || m[0].length !== rec.w) continue;
      let ok = true;
      for (let r=0;r<rec.h;r++) for (let cc=0;cc<rec.w;cc++) {
        if (m[r][cc] !== rec.cells[r*rec.w+cc]) ok = false;
      }
      if (ok) return rec;
    }
  }
  return null;
}

function updateCraftResult() {
  const size = craftMode === '3x3' ? 3 : 2;
  const rec = matchRecipe(size);
  craftResult = rec ? { ...rec.result } : null;
}

// забрать результат крафта (списать ингредиенты)
function takeCraftResult() {
  const size = craftMode === '3x3' ? 3 : 2;
  const rec = matchRecipe(size);
  if (!rec) return;
  const res = rec.result;
  // если на курсоре уже есть предмет — складываем, иначе берём
  if (cursorItem && (cursorItem.id !== res.id || cursorItem.count + res.count > maxStack(res.id))) return;
  // списать по одному из каждого занятого слота крафта
  for (let i = 0; i < size*size; i++) {
    if (craftSlots[i]) { craftSlots[i].count--; if (craftSlots[i].count<=0) craftSlots[i]=null; }
  }
  if (cursorItem) cursorItem.count += res.count;
  else cursorItem = { id: res.id, count: res.count };
  playSound('place', res.id);
  updateCraftResult();
  refreshUI();
}

// вернуть предметы из сетки крафта в инвентарь (при закрытии)
function clearCraftToInventory() {
  const n = 3;
  for (let i=0;i<n*n;i++){ if (craftSlots[i]) { addToInventory(craftSlots[i].id, craftSlots[i].count); craftSlots[i]=null; } }
  if (cursorItem) { addToInventory(cursorItem.id, cursorItem.count); cursorItem = null; }
}

// ============================================================
//  Окно инвентаря (слоты, перетаскивание, разделение)
// ============================================================
const invPanel = document.getElementById('inventory');

function refreshUI() {
  renderHotbar();
  if (invOpen) renderInventory();
  renderCursor();
}

// клик по слоту инвентаря/хотбара (массив slots[index])
function slotClick(arr, index, rightClick) {
  const s = arr[index];
  if (!cursorItem) {
    if (!s) return;
    if (rightClick) {
      // взять половину
      const half = Math.ceil(s.count / 2);
      cursorItem = { id: s.id, count: half };
      s.count -= half; if (s.count <= 0) arr[index] = null;
    } else {
      cursorItem = s; arr[index] = null; // взять всю стопку
    }
  } else {
    if (!s) {
      if (rightClick) {
        // положить 1
        arr[index] = { id: cursorItem.id, count: 1 };
        cursorItem.count--; if (cursorItem.count <= 0) cursorItem = null;
      } else {
        arr[index] = cursorItem; cursorItem = null;
      }
    } else if (s.id === cursorItem.id) {
      // объединить стопки
      const space = maxStack(s.id) - s.count;
      if (rightClick) {
        if (space > 0) { s.count++; cursorItem.count--; if (cursorItem.count<=0) cursorItem=null; }
      } else {
        const move = Math.min(space, cursorItem.count);
        s.count += move; cursorItem.count -= move;
        if (cursorItem.count <= 0) cursorItem = null;
      }
    } else {
      // обмен
      arr[index] = cursorItem; cursorItem = s;
    }
  }
  updateCraftResult();
  refreshUI();
}

function makeSlotEl(arr, index, size) {
  const el = document.createElement('div');
  el.className = 'inv-slot';
  const item = arr[index];
  if (item) {
    el.appendChild(iconCanvas(item.id, size));
    if (item.count > 1) {
      const cnt = document.createElement('div');
      cnt.className = 'count'; cnt.textContent = item.count;
      el.appendChild(cnt);
    }
    el.title = BLOCK_NAMES[item.id] || '';
  }
  el.addEventListener('mousedown', (e) => {
    e.preventDefault();
    slotClick(arr, index, e.button === 2);
  });
  el.addEventListener('contextmenu', e => e.preventDefault());
  return el;
}

const invGrid = document.getElementById('invGrid');
function renderInventory() {
  // строим всю панель заново (заголовок задан в HTML)
  invGrid.innerHTML = '';

  // --- Зона крафта ---
  const craftWrap = document.createElement('div');
  craftWrap.className = 'craft-zone';
  const size = craftMode === '3x3' ? 3 : 2;
  const grid = document.createElement('div');
  grid.className = 'craft-grid';
  grid.style.gridTemplateColumns = `repeat(${size}, 44px)`;
  for (let i = 0; i < size*size; i++) grid.appendChild(makeSlotEl(craftSlots, i, 34));
  craftWrap.appendChild(grid);

  const arrow = document.createElement('div');
  arrow.className = 'craft-arrow'; arrow.textContent = '➜';
  craftWrap.appendChild(arrow);

  const resSlot = document.createElement('div');
  resSlot.className = 'inv-slot craft-result';
  if (craftResult) {
    resSlot.appendChild(iconCanvas(craftResult.id, 34));
    if (craftResult.count > 1) { const c=document.createElement('div'); c.className='count'; c.textContent=craftResult.count; resSlot.appendChild(c); }
    resSlot.title = BLOCK_NAMES[craftResult.id] || '';
  }
  resSlot.addEventListener('mousedown', (e) => { e.preventDefault(); takeCraftResult(); });
  craftWrap.appendChild(resSlot);
  invGrid.appendChild(craftWrap);

  const lbl = document.createElement('div');
  lbl.className = 'inv-label';
  lbl.textContent = craftMode === '3x3' ? 'Крафт 3×3 (верстак)' : 'Крафт 2×2';
  invGrid.appendChild(lbl);

  // --- Основное хранилище (27) ---
  const storage = document.createElement('div');
  storage.className = 'inv-storage';
  for (let i = HOTBAR_SIZE; i < TOTAL_SLOTS; i++) storage.appendChild(makeSlotEl(slots, i, 34));
  invGrid.appendChild(storage);

  // --- Хотбар (9) внутри инвентаря ---
  const hb = document.createElement('div');
  hb.className = 'inv-hotbar';
  for (let i = 0; i < HOTBAR_SIZE; i++) hb.appendChild(makeSlotEl(slots, i, 34));
  invGrid.appendChild(hb);
}

// предмет на курсоре
const cursorEl = document.getElementById('cursorItem');
function renderCursor() {
  cursorEl.innerHTML = '';
  if (cursorItem) {
    cursorEl.style.display = 'block';
    cursorEl.appendChild(iconCanvas(cursorItem.id, 36));
    if (cursorItem.count > 1) { const c=document.createElement('div'); c.className='count'; c.textContent=cursorItem.count; cursorEl.appendChild(c); }
  } else {
    cursorEl.style.display = 'none';
  }
}
document.addEventListener('mousemove', (e) => {
  if (cursorItem && invOpen) {
    cursorEl.style.left = e.clientX + 'px';
    cursorEl.style.top = e.clientY + 'px';
  }
});

function toggleInventory(mode) {
  invOpen = !invOpen;
  if (invOpen) {
    craftMode = mode || '2x2';
    invPanel.classList.add('open');
    document.getElementById('invTitle').textContent = craftMode === '3x3' ? 'Верстак' : 'Инвентарь';
    document.exitPointerLock();
    updateCraftResult();
    renderInventory();
  } else {
    clearCraftToInventory(); // вернуть предметы из крафта
    craftMode = '2x2';
    invPanel.classList.remove('open');
    refreshUI();
    if (overlay.classList.contains('hidden')) canvas.requestPointerLock();
  }
}

renderHotbar();

// ============================================================
//  Звук и музыка (Web Audio API, всё процедурно, без файлов)
// ============================================================
const AudioEngine = {
  ctx: null,
  master: null,
  musicGain: null,
  sfxGain: null,
  musicTimer: null,
  enabled: true,
};

function initAudio() {
  if (AudioEngine.ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  AudioEngine.ctx = new AC();
  if (AudioEngine.ctx.state === 'suspended') AudioEngine.ctx.resume();
  AudioEngine.master = AudioEngine.ctx.createGain();
  AudioEngine.master.gain.value = 0.8;
  AudioEngine.master.connect(AudioEngine.ctx.destination);

  AudioEngine.sfxGain = AudioEngine.ctx.createGain();
  AudioEngine.sfxGain.gain.value = 0.6;
  AudioEngine.sfxGain.connect(AudioEngine.master);

  AudioEngine.musicGain = AudioEngine.ctx.createGain();
  AudioEngine.musicGain.gain.value = 0.18;
  AudioEngine.musicGain.connect(AudioEngine.master);

  startMusic();
}

// --- Звуковые эффекты ---
function noiseBurst(dur, filterFreq, gainVal, type = 'lowpass') {
  const ctx = AudioEngine.ctx;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const env = 1 - i / len;
    data[i] = (Math.random() * 2 - 1) * env * env;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filt = ctx.createBiquadFilter();
  filt.type = type;
  filt.frequency.value = filterFreq;
  const g = ctx.createGain();
  g.gain.value = gainVal;
  src.connect(filt); filt.connect(g); g.connect(AudioEngine.sfxGain);
  src.start();
  src.stop(ctx.currentTime + dur);
}

function tone(freq, dur, gainVal, type = 'sine') {
  const ctx = AudioEngine.ctx;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gainVal, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  osc.connect(g); g.connect(AudioEngine.sfxGain);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}

// Параметры звука по материалу
function soundProfile(block) {
  switch (block) {
    case BLOCK.STONE:   return { freq: 380, dur: 0.12, type: 'lowpass' };
    case BLOCK.BEDROCK: return { freq: 300, dur: 0.14, type: 'lowpass' };
    case BLOCK.DIRT:    return { freq: 700, dur: 0.10, type: 'lowpass' };
    case BLOCK.GRASS:   return { freq: 1200, dur: 0.10, type: 'lowpass' };
    // песок: мягкое сыпучее «шшш» — высокочастотный шум через highpass
    case BLOCK.SAND:    return { freq: 2600, dur: 0.16, type: 'highpass', sand: true };
    case BLOCK.WOOD:    return { freq: 520, dur: 0.13, type: 'lowpass' };
    case BLOCK.PLANKS:  return { freq: 600, dur: 0.12, type: 'lowpass' };
    case BLOCK.CRAFTING_TABLE: return { freq: 560, dur: 0.12, type: 'lowpass' };
    case BLOCK.LEAVES:  return { freq: 3000, dur: 0.12, type: 'highpass' };
    default:            return { freq: 600, dur: 0.10, type: 'lowpass' };
  }
}

function playSound(kind, block) {
  if (!AudioEngine.ctx || !AudioEngine.enabled) return;
  const p = soundProfile(block);
  if (kind === 'dig') {
    noiseBurst(p.dur, p.freq, 0.35, p.type);
  } else if (kind === 'break') {
    noiseBurst(p.dur * 1.6, p.freq * 1.2, 0.5, p.type);
  } else if (kind === 'place') {
    noiseBurst(p.dur * 1.3, p.freq, 0.45, p.type);
  } else if (kind === 'step') {
    noiseBurst(0.07, p.freq * 0.8, 0.18, p.type);
  } else if (kind === 'pickup') {
    // характерный "поп" подбора, как в майнкрафте — короткий тон с подъёмом
    tone(600, 0.08, 0.25, 'square');
    setTimeout(() => tone(900, 0.07, 0.2, 'square'), 35);
  } else if (kind === 'splash') {
    noiseBurst(0.25, 900, 0.3, 'lowpass');
  } else if (kind === 'sandfall') {
    // мягкий сыпучий звук падения песка
    noiseBurst(0.22, 2400, 0.22, 'highpass');
  }
}

// --- Атмосферная музыка (медленные аккорды/арпеджио, спокойный мажор) ---
const MUSIC_NOTES = [220.00, 261.63, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
function musicVoice(freq, dur) {
  const ctx = AudioEngine.ctx;
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  const g = ctx.createGain();
  const t0 = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.4);   // мягкая атака
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); // длинный затухающий хвост
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = 1400;
  osc.connect(filt); filt.connect(g); g.connect(AudioEngine.musicGain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.1);
}

function startMusic() {
  if (AudioEngine.musicTimer) return;
  const scheduleNote = () => {
    if (!AudioEngine.enabled) { AudioEngine.musicTimer = setTimeout(scheduleNote, 2000); return; }
    // случайная нота из гаммы, иногда аккорд
    const n = MUSIC_NOTES[Math.floor(Math.random() * MUSIC_NOTES.length)];
    musicVoice(n, 2.5 + Math.random() * 2);
    if (Math.random() < 0.4) {
      const n2 = MUSIC_NOTES[Math.floor(Math.random() * MUSIC_NOTES.length)];
      musicVoice(n2 * 0.5, 3 + Math.random() * 2); // басовая нота октавой ниже
    }
    AudioEngine.musicTimer = setTimeout(scheduleNote, 1800 + Math.random() * 2600);
  };
  scheduleNote();
}

// ============================================================
//  Raycast по вокселям (DDA)
// ============================================================
function getTargetBlock(maxDist = 6) {
  const dir = new THREE.Vector3(
    -Math.sin(PLAYER.yaw) * Math.cos(PLAYER.pitch),
    Math.sin(PLAYER.pitch),
    -Math.cos(PLAYER.yaw) * Math.cos(PLAYER.pitch)
  ).normalize();

  const eyeY = PLAYER.pos.y + (PLAYER.crouching ? PLAYER.crouchEye : PLAYER.eye);
  const origin = new THREE.Vector3(PLAYER.pos.x, eyeY, PLAYER.pos.z);

  let x = Math.floor(origin.x), y = Math.floor(origin.y), z = Math.floor(origin.z);
  const stepX = Math.sign(dir.x), stepY = Math.sign(dir.y), stepZ = Math.sign(dir.z);

  const tDeltaX = dir.x !== 0 ? Math.abs(1 / dir.x) : Infinity;
  const tDeltaY = dir.y !== 0 ? Math.abs(1 / dir.y) : Infinity;
  const tDeltaZ = dir.z !== 0 ? Math.abs(1 / dir.z) : Infinity;

  const fracX = origin.x - x, fracY = origin.y - y, fracZ = origin.z - z;
  let tMaxX = dir.x > 0 ? (1 - fracX) * tDeltaX : fracX * tDeltaX;
  let tMaxY = dir.y > 0 ? (1 - fracY) * tDeltaY : fracY * tDeltaY;
  let tMaxZ = dir.z > 0 ? (1 - fracZ) * tDeltaZ : fracZ * tDeltaZ;
  if (dir.x === 0) tMaxX = Infinity;
  if (dir.y === 0) tMaxY = Infinity;
  if (dir.z === 0) tMaxZ = Infinity;

  let face = [0, 0, 0];
  let dist = 0;
  while (dist <= maxDist) {
    const b = World.getBlock(x, y, z);
    if (b !== BLOCK.AIR && !isLiquid(b)) { // воду нельзя выделить/сломать — луч проходит сквозь
      return { x, y, z, block: b, face };
    }
    if (tMaxX < tMaxY && tMaxX < tMaxZ) {
      x += stepX; dist = tMaxX; tMaxX += tDeltaX; face = [-stepX, 0, 0];
    } else if (tMaxY < tMaxZ) {
      y += stepY; dist = tMaxY; tMaxY += tDeltaY; face = [0, -stepY, 0];
    } else {
      z += stepZ; dist = tMaxZ; tMaxZ += tDeltaZ; face = [0, 0, -stepZ];
    }
  }
  return null;
}

// ============================================================
//  Дропы предметов (выпадение блоков)
// ============================================================
const drops = []; // {mesh, pos, vel, id, age, picked}

function spawnDrop(id, x, y, z) {
  const geo = new THREE.BoxGeometry(0.28, 0.28, 0.28);
  const mat = MATERIALS[id]; // массив материалов
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  drops.push({
    mesh, id,
    pos: new THREE.Vector3(x, y, z),
    vel: new THREE.Vector3((Math.random()-0.5)*2, 3, (Math.random()-0.5)*2),
    age: 0, picked: false, pickDelay: 0.5,
  });
}

function updateDrops(dt) {
  const eyeY = PLAYER.pos.y + 0.9;
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.age += dt;
    // гравитация
    d.vel.y -= GRAVITY * dt;
    d.pos.x += d.vel.x * dt;
    d.pos.y += d.vel.y * dt;
    d.pos.z += d.vel.z * dt;
    // приземление на поверхность
    const groundY = Math.floor(d.pos.y - 0.14);
    if (World.getBlock(Math.floor(d.pos.x), groundY, Math.floor(d.pos.z)) !== BLOCK.AIR) {
      if (d.vel.y < 0) {
        d.pos.y = groundY + 1 + 0.14;
        d.vel.y = 0;
        d.vel.x *= 0.6; d.vel.z *= 0.6;
      }
    }
    d.mesh.position.copy(d.pos);
    d.mesh.position.y += Math.sin(d.age * 3) * 0.05 + 0.05; // покачивание
    d.mesh.rotation.y += dt * 1.5;

    // подбор
    if (d.age > d.pickDelay) {
      const dx = d.pos.x - PLAYER.pos.x;
      const dy = d.pos.y - (PLAYER.pos.y + 0.9);
      const dz = d.pos.z - PLAYER.pos.z;
      const distSq = dx*dx + dy*dy + dz*dz;
      if (distSq < 1.6 * 1.6) {
        // притягивание
        d.pos.x -= dx * dt * 6;
        d.pos.y -= dy * dt * 6;
        d.pos.z -= dz * dt * 6;
      }
      if (distSq < 0.6 * 0.6) {
        addToInventory(d.id, 1);
        playSound('pickup');
        scene.remove(d.mesh);
        d.mesh.geometry.dispose();
        drops.splice(i, 1);
      }
    }
  }
}

// ============================================================
//  Падающий песок (гравитационные блоки)
// ============================================================
const fallingSand = []; // {mesh, id, x, z, y(float), vel}
const sandCheckQueue = [];      // координаты для проверки падения
const sandInQueue = new Set();

function canFallInto(b) { return b === BLOCK.AIR || isLiquid(b); }

// поставить блок-кандидат на проверку падения
function checkSand(x, y, z) {
  if (y < 1 || y >= WORLD_HEIGHT) return;
  const k = x + ',' + y + ',' + z;
  if (sandInQueue.has(k)) return;
  sandInQueue.add(k);
  sandCheckQueue.push(k);
}
// проверить столбик и соседей сверху (после удаления опоры)
function checkSandAround(x, y, z) {
  checkSand(x, y + 1, z);
  checkSand(x, y, z);
}

function startFallingSand(id, x, y, z) {
  // убрать блок из мира и создать падающую сущность
  World.setBlock(x, y, z, BLOCK.AIR, true);
  rebuildAround(x, z);
  WaterSim.touchAround(x, y, z); // вода может занять освободившееся место

  const geo = new THREE.BoxGeometry(0.98, 0.98, 0.98);
  const mesh = new THREE.Mesh(geo, MATERIALS[id]);
  mesh.position.set(x + 0.5, y + 0.5, z + 0.5);
  scene.add(mesh);
  fallingSand.push({ mesh, id, x, z, y: y, vel: 0 });
  playSound('sandfall');

  // как только клетка освободилась — проверить песок над ней (каскадное падение столбика)
  checkSand(x, y + 1, z);
}

function processSandQueue() {
  if (sandCheckQueue.length === 0) return;
  let processed = 0;
  while (sandCheckQueue.length > 0 && processed < 200) {
    const k = sandCheckQueue.shift();
    sandInQueue.delete(k);
    processed++;
    const [x, y, z] = k.split(',').map(Number);
    if (World.getBlock(x, y, z) !== BLOCK.SAND) continue;
    if (canFallInto(World.getBlock(x, y - 1, z))) {
      startFallingSand(BLOCK.SAND, x, y, z);
    }
  }
}

function updateFallingSand(dt) {
  processSandQueue();
  // сортируем по убыванию Y; идём с конца (i--), значит нижний песок обрабатываем первым
  fallingSand.sort((a, b) => b.y - a.y);
  for (let i = fallingSand.length - 1; i >= 0; i--) {
    const s = fallingSand[i];
    s.vel -= GRAVITY * dt;
    if (s.vel < -40) s.vel = -40;
    s.y += s.vel * dt;

    // ячейка под текущим положением
    const belowY = Math.floor(s.y - 0.0001);
    const restBlock = World.getBlock(s.x, belowY, s.z);
    if (!canFallInto(restBlock)) {
      // приземлился: ставим песок на belowY+1
      let placeY = belowY + 1;
      // если место занято (вода) — всё равно ставим песок, вытесняя воду
      World.setBlock(s.x, placeY, s.z, BLOCK.SAND);
      rebuildAround(s.x, s.z);
      WaterSim.touchAround(s.x, placeY, s.z);
      playSound('sandfall', BLOCK.SAND);
      scene.remove(s.mesh);
      s.mesh.geometry.dispose();
      fallingSand.splice(i, 1);
      // вдруг сверху ещё песок — пусть тоже падает
      checkSand(s.x, placeY + 1, s.z);
      continue;
    }
    s.mesh.position.y = s.y + 0.5;
  }
}

// ============================================================
//  Затухание листвы (если рядом нет ствола — листва осыпается со временем)
// ============================================================
const leafDecay = []; // {x,y,z, t} — таймеры
const leafDecaySet = new Set();
const LEAF_SUPPORT_RADIUS = 4; // в пределах скольких блоков нужен ствол

// есть ли поблизости ствол (BFS по листве до ствола в радиусе)
function leafHasSupport(sx, sy, sz) {
  const visited = new Set();
  const stack = [[sx, sy, sz, 0]];
  visited.add(sx + ',' + sy + ',' + sz);
  while (stack.length) {
    const [x, y, z, d] = stack.pop();
    // нашли ствол среди соседей?
    const ns = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    for (const [dx, dy, dz] of ns) {
      const b = World.getBlock(x + dx, y + dy, z + dz);
      if (b === BLOCK.WOOD) return true;
      if (b === BLOCK.LEAVES && d + 1 <= LEAF_SUPPORT_RADIUS) {
        const k = (x+dx) + ',' + (y+dy) + ',' + (z+dz);
        if (!visited.has(k)) { visited.add(k); stack.push([x+dx, y+dy, z+dz, d+1]); }
      }
    }
  }
  return false;
}

function scheduleLeafDecay(x, y, z) {
  if (World.getBlock(x, y, z) !== BLOCK.LEAVES) return;
  const k = x + ',' + y + ',' + z;
  if (leafDecaySet.has(k)) return;
  leafDecaySet.add(k);
  // случайная задержка как в майнкрафте
  leafDecay.push({ x, y, z, t: 1.5 + Math.random() * 3.5 });
}

function scheduleLeafDecayAround(x, y, z) {
  const r = 2;
  for (let dx = -r; dx <= r; dx++)
    for (let dy = -r; dy <= r; dy++)
      for (let dz = -r; dz <= r; dz++) {
        if (World.getBlock(x+dx, y+dy, z+dz) === BLOCK.LEAVES) scheduleLeafDecay(x+dx, y+dy, z+dz);
      }
}

function updateLeafDecay(dt) {
  for (let i = leafDecay.length - 1; i >= 0; i--) {
    const L = leafDecay[i];
    L.t -= dt;
    if (L.t > 0) continue;
    const k = L.x + ',' + L.y + ',' + L.z;
    leafDecay.splice(i, 1);
    leafDecaySet.delete(k);
    if (World.getBlock(L.x, L.y, L.z) !== BLOCK.LEAVES) continue;
    if (leafHasSupport(L.x, L.y, L.z)) continue; // ствол рядом — остаётся
    // осыпается
    World.setBlock(L.x, L.y, L.z, BLOCK.AIR);
    rebuildAround(L.x, L.z);
    playSound('break', BLOCK.LEAVES);
    // соседняя листва тоже проверится
    scheduleLeafDecayAround(L.x, L.y, L.z);
  }
}

// ============================================================
//  Ломать / ставить
// ============================================================
function finishBreak(t) {
  if (!t) return;
  if (t.block === BLOCK.BEDROCK) return; // бедрок не ломается
  const broken = t.block;
  World.setBlock(t.x, t.y, t.z, BLOCK.AIR);

  // что выпадает
  let dropId = broken;
  if (broken === BLOCK.GRASS) dropId = BLOCK.DIRT;
  if (broken === BLOCK.LEAVES) {
    dropId = null; // из листвы ничего не выпадает
  }
  if (dropId !== null) spawnDrop(dropId, t.x + 0.5, t.y + 0.5, t.z + 0.5);

  rebuildAround(t.x, t.z);
  playSound('break', broken);
  WaterSim.touchAround(t.x, t.y, t.z); // вода может затечь в дыру
  checkSandAround(t.x, t.y, t.z);      // песок сверху может обвалиться

  // сломали ствол — листва вокруг начнёт затухать (проверяем зону)
  if (broken === BLOCK.WOOD || broken === BLOCK.LEAVES) {
    scheduleLeafDecayAround(t.x, t.y, t.z);
  }
}

function placeBlock() {
  const t = getTargetBlock();
  if (!t) return;

  // ПКМ по верстаку — открыть крафт 3x3
  if (t.block === BLOCK.CRAFTING_TABLE) {
    toggleInventory('3x3');
    return;
  }

  const slot = activeItem();
  if (!slot || slot.count <= 0) return;

  const nx = t.x + t.face[0];
  const ny = t.y + t.face[1];
  const nz = t.z + t.face[2];
  if (ny < 0 || ny >= WORLD_HEIGHT) return;
  const target = World.getBlock(nx, ny, nz);
  if (target !== BLOCK.AIR && !isLiquid(target)) return; // можно ставить только в воздух/воду

  // не ставить блок внутрь игрока
  if (intersectsPlayer(nx, ny, nz)) return;

  const placeId = slot.id;
  // списать 1 штуку из активного слота
  slot.count--; if (slot.count <= 0) slots[activeSlot] = null;
  refreshUI();

  World.setBlock(nx, ny, nz, placeId);
  rebuildAround(nx, nz);
  playSound('place', placeId);
  WaterSim.touchAround(nx, ny, nz); // вытеснение/перетекание воды
  if (isFalling(placeId)) checkSand(nx, ny, nz); // поставленный песок может упасть
}

function intersectsPlayer(bx, by, bz) {
  const px = PLAYER.pos.x, py = PLAYER.pos.y, pz = PLAYER.pos.z;
  const hw = PLAYER.width / 2;
  const minX = px - hw, maxX = px + hw;
  const minY = py, maxY = py + PLAYER.height;
  const minZ = pz - hw, maxZ = pz + hw;
  return (bx + 1 > minX && bx < maxX &&
          by + 1 > minY && by < maxY &&
          bz + 1 > minZ && bz < maxZ);
}

function rebuildAround(wx, wz) {
  const cx = Math.floor(wx / CHUNK_SIZE);
  const cz = Math.floor(wz / CHUNK_SIZE);
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      World.markDirty(cx + dx, cz + dz);
}

// ============================================================
//  Загрузка/выгрузка чанков и меширование
// ============================================================
const loadedMeshes = new Map(); // key -> group

const MAX_REBUILDS_PER_FRAME = 2; // бюджет перестроений за кадр — против лагов

function updateChunks() {
  const pcx = Math.floor(PLAYER.pos.x / CHUNK_SIZE);
  const pcz = Math.floor(PLAYER.pos.z / CHUNK_SIZE);

  // собрать кандидатов на (пере)строение, отсортировать по близости к игроку
  const todo = [];
  for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
    for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
      const cx = pcx + dx, cz = pcz + dz;
      const c = World.getChunk(cx, cz);
      const k = World.key(cx, cz);
      const isNew = !loadedMeshes.has(k);
      if (c.dirty || isNew) {
        todo.push({ c, k, isNew, dist: dx * dx + dz * dz });
      }
    }
  }
  // новые чанки и ближние — в первую очередь
  todo.sort((a, b) => (a.isNew === b.isNew ? a.dist - b.dist : (a.isNew ? -1 : 1)));

  // при первичной загрузке (много новых чанков) строим быстрее
  const newCount = todo.reduce((n, t) => n + (t.isNew ? 1 : 0), 0);
  let budget = newCount > 4 ? 5 : MAX_REBUILDS_PER_FRAME;
  for (const item of todo) {
    if (budget <= 0) break;
    const old = loadedMeshes.get(item.k);
    if (old) { scene.remove(old); disposeGroup(old); }
    const mesh = buildChunkMesh(item.c);
    scene.add(mesh);
    loadedMeshes.set(item.k, mesh);
    item.c.dirty = false;
    budget--;
  }

  // выгрузить дальние
  for (const [k, mesh] of loadedMeshes) {
    const [cx, cz] = k.split(',').map(Number);
    if (Math.abs(cx - pcx) > RENDER_DISTANCE + 1 || Math.abs(cz - pcz) > RENDER_DISTANCE + 1) {
      scene.remove(mesh);
      disposeGroup(mesh);
      loadedMeshes.delete(k);
    }
  }
}

function disposeGroup(group) {
  group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
}

// ============================================================
//  Физика игрока (AABB collision)
// ============================================================
function collide(axis, amount) {
  const hw = PLAYER.width / 2;
  const h = PLAYER.height;
  PLAYER.pos[axis] += amount;

  const minX = Math.floor(PLAYER.pos.x - hw);
  const maxX = Math.floor(PLAYER.pos.x + hw);
  const minY = Math.floor(PLAYER.pos.y);
  const maxY = Math.floor(PLAYER.pos.y + h);
  const minZ = Math.floor(PLAYER.pos.z - hw);
  const maxZ = Math.floor(PLAYER.pos.z + hw);

  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      for (let z = minZ; z <= maxZ; z++) {
        const bb = World.getBlock(x, y, z);
        if (bb === BLOCK.AIR || isLiquid(bb)) continue; // вода не сталкивается
        // пересечение есть -> откат по оси
        if (axis === 'x') {
          if (amount > 0) PLAYER.pos.x = x - hw - 1e-3;
          else PLAYER.pos.x = x + 1 + hw + 1e-3;
          PLAYER.vel.x = 0;
        } else if (axis === 'y') {
          if (amount > 0) { PLAYER.pos.y = y - h - 1e-3; PLAYER.vel.y = 0; }
          else { PLAYER.pos.y = y + 1 + 1e-3; PLAYER.vel.y = 0; PLAYER.onGround = true; }
        } else {
          if (amount > 0) PLAYER.pos.z = z - hw - 1e-3;
          else PLAYER.pos.z = z + 1 + hw + 1e-3;
          PLAYER.vel.z = 0;
        }
        return true;
      }
    }
  }
  return false;
}

function updatePlayer(dt) {
  PLAYER.crouching = !!keys['ShiftLeft'];

  // направление ввода (относительно взгляда по горизонтали)
  const forward = new THREE.Vector3(-Math.sin(PLAYER.yaw), 0, -Math.cos(PLAYER.yaw));
  const right = new THREE.Vector3(Math.cos(PLAYER.yaw), 0, -Math.sin(PLAYER.yaw));

  const move = new THREE.Vector3();
  if (keys['KeyW']) move.add(forward);
  if (keys['KeyS']) move.sub(forward);
  if (keys['KeyD']) move.add(right);
  if (keys['KeyA']) move.sub(right);
  if (move.lengthSq() > 0) move.normalize();

  // в воде ли игрок (ноги / голова)
  const feetInWater = isLiquid(blockAtPlayer(0.2));
  const headY = PLAYER.pos.y + (PLAYER.crouching ? PLAYER.crouchEye : PLAYER.eye);
  const headInWater = isLiquid(World.getBlock(
    Math.floor(PLAYER.pos.x), Math.floor(headY), Math.floor(PLAYER.pos.z)
  ));
  const wasInWater = PLAYER.inWater;
  PLAYER.inWater = feetInWater || headInWater;
  PLAYER.submerged = headInWater;
  if (PLAYER.inWater !== wasInWater) playSound('splash'); // всплеск при входе/выходе

  let speed = PLAYER.speed;
  if (keys['ControlLeft']) speed *= PLAYER.sprintMul; // спринт
  if (PLAYER.crouching) speed *= 0.45;

  if (PLAYER.inWater) {
    // ---- плавание ----
    const swimSpeed = PLAYER.speed * 0.55;
    PLAYER.vel.x = move.x * swimSpeed;
    PLAYER.vel.z = move.z * swimSpeed;
    // плавучесть + вязкость
    PLAYER.vel.y -= GRAVITY * 0.28 * dt;   // ослабленная гравитация
    PLAYER.vel.y *= 0.86;                    // сопротивление воды
    if (keys['Space']) PLAYER.vel.y = 3.2;   // грести вверх / всплывать
    else if (keys['ShiftLeft']) PLAYER.vel.y -= 3.0 * dt; // нырять
    if (PLAYER.vel.y < -6) PLAYER.vel.y = -6;
    // лёгкое всплытие, если игрок не нажимает вниз
    if (!keys['ShiftLeft'] && !keys['Space']) PLAYER.vel.y += 1.2 * dt;
  } else {
    // ---- обычная физика ----
    PLAYER.vel.x = move.x * speed;
    PLAYER.vel.z = move.z * speed;
    PLAYER.vel.y -= GRAVITY * dt;
    if (PLAYER.vel.y < -55) PLAYER.vel.y = -55;
    if (keys['Space'] && PLAYER.onGround) {
      PLAYER.vel.y = PLAYER.jumpV;
      PLAYER.onGround = false;
    }
  }

  PLAYER.onGround = false;
  // двигаем по осям с коллизиями
  collide('y', PLAYER.vel.y * dt);
  const prevX = PLAYER.pos.x, prevZ = PLAYER.pos.z;
  collide('x', PLAYER.vel.x * dt);
  collide('z', PLAYER.vel.z * dt);

  // sneak: не падать с края (как в майнкрафте)
  if (PLAYER.crouching && PLAYER.onGround) {
    if (!hasGroundUnder()) {
      // откатить горизонтальное перемещение, выводящее за край
      PLAYER.pos.x = prevX;
      PLAYER.pos.z = prevZ;
      if (!hasGroundUnder()) { /* если всё равно нет — оставим */ }
    }
  }

  // шаги
  const horizSpeed = Math.hypot(PLAYER.vel.x, PLAYER.vel.z);
  if (PLAYER.onGround && horizSpeed > 0.5) {
    PLAYER.stepTimer = (PLAYER.stepTimer || 0) + dt * (horizSpeed / PLAYER.speed);
    const interval = PLAYER.crouching ? 0.5 : 0.36;
    if (PLAYER.stepTimer >= interval) {
      PLAYER.stepTimer = 0;
      const groundBlock = World.getBlock(
        Math.floor(PLAYER.pos.x), Math.floor(PLAYER.pos.y - 0.1), Math.floor(PLAYER.pos.z)
      );
      playSound('step', groundBlock || BLOCK.DIRT);
    }
  }

  // не провалиться сквозь дно мира
  if (PLAYER.pos.y < -10) { PLAYER.pos.set(8, 60, 8); PLAYER.vel.set(0,0,0); }
}

// ---- Кислород / утопление ----
function updateOxygen(dt) {
  if (PLAYER.submerged) {
    // под водой — расход воздуха
    PLAYER.oxygen -= dt * (10 / 12); // полный запас на ~12 секунд
    if (PLAYER.oxygen <= 0) {
      PLAYER.oxygen = 0;
      // начинаем «тонуть»: периодически выталкиваем игрока к поверхности
      PLAYER.drownTimer += dt;
      if (PLAYER.drownTimer >= 1.5) {
        PLAYER.drownTimer = 0;
        playSound('splash');
        // спасение: телепорт на ближайшую поверхность над водой
        rescueToSurface();
      }
    }
  } else {
    // на воздухе — быстрое восстановление
    PLAYER.oxygen = Math.min(PLAYER.maxOxygen, PLAYER.oxygen + dt * 8);
    PLAYER.drownTimer = 0;
  }
}

// поднять игрока на поверхность воды/суши над текущей колонкой
function rescueToSurface() {
  const x = Math.floor(PLAYER.pos.x), z = Math.floor(PLAYER.pos.z);
  for (let y = Math.floor(PLAYER.pos.y); y < WORLD_HEIGHT - 1; y++) {
    const here = World.getBlock(x, y, z);
    const above = World.getBlock(x, y + 1, z);
    // первая ячейка воздуха над водой/блоком
    if (here !== BLOCK.AIR && above === BLOCK.AIR) {
      PLAYER.pos.y = y + 1.01;
      PLAYER.vel.y = 0;
      PLAYER.oxygen = PLAYER.maxOxygen * 0.4;
      return;
    }
  }
  // если поверхность не нашли — поднять чуть вверх
  PLAYER.pos.y += 1;
  PLAYER.vel.y = 2;
}

// блок в точке тела игрока (offset по высоте от ног)
function blockAtPlayer(yOffset) {
  return World.getBlock(
    Math.floor(PLAYER.pos.x),
    Math.floor(PLAYER.pos.y + yOffset),
    Math.floor(PLAYER.pos.z)
  );
}

function hasGroundUnder() {
  const hw = PLAYER.width / 2;
  const y = Math.floor(PLAYER.pos.y - 0.05);
  const xs = [PLAYER.pos.x - hw + 0.05, PLAYER.pos.x + hw - 0.05];
  const zs = [PLAYER.pos.z - hw + 0.05, PLAYER.pos.z + hw - 0.05];
  for (const x of xs) for (const z of zs) {
    if (World.getBlock(Math.floor(x), y, Math.floor(z)) !== BLOCK.AIR) return true;
  }
  return false;
}

// ============================================================
//  Спавн игрока на поверхности
// ============================================================
function spawnPlayer() {
  // ищем сушу около (0,0), чтобы не появиться в воде
  for (let r = 0; r < 60; r++) {
    for (let a = 0; a < 8; a++) {
      const sx = Math.round(r * Math.cos(a)) + 8;
      const sz = Math.round(r * Math.sin(a)) + 8;
      const h = terrainHeight(sx, sz);
      if (h > SEA_LEVEL) { // суша
        PLAYER.pos.set(sx + 0.5, h + 1, sz + 0.5);
        return;
      }
    }
  }
  const h = terrainHeight(8, 8);
  PLAYER.pos.set(8.5, Math.max(h, SEA_LEVEL) + 2, 8.5);
}
// spawnPlayer вызывается из WorldManager после выбора/создания мира

// ============================================================
//  HUD
// ============================================================
const hudEl = document.getElementById('hud');
const waterOverlayEl = document.getElementById('waterOverlay');
const oxygenEl = document.getElementById('oxygen');
let lastBubbles = -1;

function updateWaterUI() {
  // синий оверлей когда голова под водой
  waterOverlayEl.classList.toggle('on', !!PLAYER.submerged);

  // пузырьки кислорода — показываем только под водой и пока не полный
  const showOxygen = PLAYER.submerged || PLAYER.oxygen < PLAYER.maxOxygen - 0.01;
  oxygenEl.classList.toggle('on', showOxygen && PLAYER.submerged);
  const bubbles = Math.ceil(PLAYER.oxygen);
  if (bubbles !== lastBubbles) {
    lastBubbles = bubbles;
    oxygenEl.innerHTML = '';
    for (let i = 0; i < PLAYER.maxOxygen; i++) {
      const b = document.createElement('div');
      b.className = 'bubble' + (i < bubbles ? '' : ' empty');
      oxygenEl.appendChild(b);
    }
  }
}

let fpsTime = 0, fpsCount = 0, fps = 0;
function updateHUD() {
  const t = getTargetBlock();
  const targetName = t ? (BLOCK_NAMES[t.block] || '—') : '—';
  hudEl.innerHTML =
    `MiniCraft<br>` +
    `Мир: ${WorldManager.current || '—'} · Сид: ${WORLD_SEED}<br>` +
    `XYZ: ${PLAYER.pos.x.toFixed(1)}, ${PLAYER.pos.y.toFixed(1)}, ${PLAYER.pos.z.toFixed(1)}<br>` +
    `Чанков: ${loadedMeshes.size} · FPS: ${fps}<br>` +
    `${PLAYER.inWater ? '🌊 В воде' : (PLAYER.crouching ? 'Присел' : 'Выживание')}<br>` +
    `Цель: ${targetName}`;
}

// ============================================================
//  Главный цикл
// ============================================================
let last = performance.now();
function loop(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.1) dt = 0.1; // ограничить спайки

  // пока мир не выбран — ничего не симулируем и не рисуем
  if (!gameStarted) { requestAnimationFrame(loop); return; }

  if (overlay.classList.contains('hidden') && !invOpen) {
    updatePlayer(dt);
    updateOxygen(dt);
    updateDrops(dt);
    updateMining(dt);
  } else if (mining.active) {
    resetMining();
  }

  WaterSim.update(dt);
  updateFallingSand(dt);
  updateLeafDecay(dt);
  updateChunks();

  // камера
  const eyeY = PLAYER.pos.y + (PLAYER.crouching ? PLAYER.crouchEye : PLAYER.eye);
  camera.position.set(PLAYER.pos.x, eyeY, PLAYER.pos.z);
  const dir = new THREE.Vector3(
    -Math.sin(PLAYER.yaw) * Math.cos(PLAYER.pitch),
    Math.sin(PLAYER.pitch),
    -Math.cos(PLAYER.yaw) * Math.cos(PLAYER.pitch)
  );
  camera.lookAt(camera.position.clone().add(dir));

  // подсветка цели
  const t = getTargetBlock();
  if (t) {
    highlight.visible = true;
    highlight.position.set(t.x + 0.5, t.y + 0.5, t.z + 0.5);
  } else {
    highlight.visible = false;
  }

  // fps
  fpsCount++; fpsTime += dt;
  if (fpsTime >= 0.5) { fps = Math.round(fpsCount / fpsTime); fpsCount = 0; fpsTime = 0; }
  // подводная атмосфера: синий туман и фон
  if (PLAYER.submerged) {
    scene.fog.color.setHex(0x2a5aa0);
    scene.fog.near = 1; scene.fog.far = 18;
    scene.background.setHex(0x2a5aa0);
  } else {
    scene.fog.color.setHex(0x87ceeb);
    scene.fog.near = RENDER_DISTANCE * CHUNK_SIZE * 0.6;
    scene.fog.far = RENDER_DISTANCE * CHUNK_SIZE;
    scene.background.setHex(0x87ceeb);
  }

  updateWaterUI();
  updateHUD();

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}

// ============================================================
//  UI менеджера миров
// ============================================================
const worldListEl = document.getElementById('worldList');

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'только что';
  const m = Math.floor(s / 60); if (m < 60) return m + ' мин назад';
  const h = Math.floor(m / 60); if (h < 24) return h + ' ч назад';
  const d = Math.floor(h / 24); return d + ' дн назад';
}

function renderWorldList() {
  const worlds = WorldManager.list().sort((a, b) => b.updated - a.updated);
  worldListEl.innerHTML = '';
  if (worlds.length === 0) {
    const e = document.createElement('div');
    e.className = 'wm-empty';
    e.textContent = 'Пока нет сохранённых миров — создайте новый выше.';
    worldListEl.appendChild(e);
    return;
  }
  for (const w of worlds) {
    const item = document.createElement('div');
    item.className = 'wm-item';

    const info = document.createElement('div');
    info.className = 'wm-info';
    const nm = document.createElement('div');
    nm.className = 'wm-name';
    nm.textContent = w.name;
    const meta = document.createElement('div');
    meta.className = 'wm-meta';
    meta.textContent = 'Сид: ' + w.seed + ' · ' + timeAgo(w.updated);
    info.appendChild(nm); info.appendChild(meta);

    const loadBtn = document.createElement('button');
    loadBtn.className = 'wm-load';
    loadBtn.textContent = 'Играть';
    loadBtn.addEventListener('click', () => WorldManager.load(w.name));

    const delBtn = document.createElement('button');
    delBtn.className = 'wm-del';
    delBtn.textContent = '✕';
    delBtn.title = 'Удалить мир';
    delBtn.addEventListener('click', () => {
      if (confirm('Удалить мир «' + w.name + '»? Это необратимо.')) WorldManager.delete(w.name);
    });

    item.appendChild(info); item.appendChild(loadBtn); item.appendChild(delBtn);
    worldListEl.appendChild(item);
  }
}

document.getElementById('createWorldBtn').addEventListener('click', () => {
  const name = document.getElementById('newWorldName').value;
  const seed = document.getElementById('newWorldSeed').value;
  WorldManager.create(name, seed);
});

// ---- Настройка прорисовки чанков ----
function setRenderDistance(rd) {
  RENDER_DISTANCE = Math.max(2, Math.min(10, rd | 0));
  localStorage.setItem('minicraft_render_dist', String(RENDER_DISTANCE));
  // обновить туман
  if (!PLAYER.submerged) {
    scene.fog.near = RENDER_DISTANCE * CHUNK_SIZE * 0.6;
    scene.fog.far = RENDER_DISTANCE * CHUNK_SIZE;
  }
  // сразу выгрузить ставшие лишними чанки
  if (gameStarted) {
    const pcx = Math.floor(PLAYER.pos.x / CHUNK_SIZE);
    const pcz = Math.floor(PLAYER.pos.z / CHUNK_SIZE);
    for (const [k, mesh] of loadedMeshes) {
      const [cx, cz] = k.split(',').map(Number);
      if (Math.abs(cx - pcx) > RENDER_DISTANCE + 1 || Math.abs(cz - pcz) > RENDER_DISTANCE + 1) {
        scene.remove(mesh); disposeGroup(mesh); loadedMeshes.delete(k);
      }
    }
  }
}
const renderDistEl = document.getElementById('renderDist');
const rdValueEl = document.getElementById('rdValue');
renderDistEl.value = RENDER_DISTANCE;
rdValueEl.textContent = RENDER_DISTANCE;
renderDistEl.addEventListener('input', () => {
  rdValueEl.textContent = renderDistEl.value;
  setRenderDistance(parseInt(renderDistEl.value, 10));
});

// открыть меню (пауза + менеджер миров)
function openMenu() {
  if (!gameStarted) return;
  WorldManager.save();
  document.exitPointerLock();
  if (invOpen) toggleInventory();
  overlay.classList.remove('hidden');
  renderWorldList();
}

document.getElementById('menuBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  openMenu();
});

// тост «Сохранено»
const saveToastEl = document.getElementById('saveToast');
let saveToastTimer = null;
function showSaveToast() {
  saveToastEl.style.display = 'block';
  clearTimeout(saveToastTimer);
  saveToastTimer = setTimeout(() => { saveToastEl.style.display = 'none'; }, 1200);
}

// клавиши: O — сохранить, Esc — меню (когда не открыт инвентарь)
document.addEventListener('keydown', (e) => {
  if (!gameStarted) return;
  if (e.code === 'KeyO') {
    if (WorldManager.save()) showSaveToast();
  }
  if (e.code === 'Escape') {
    if (invOpen) toggleInventory();   // открыт инвентарь -> закрыть его
    else openMenu();                  // иначе -> меню/пауза
  }
});

renderHotbar();
renderWorldList();

requestAnimationFrame(loop);
