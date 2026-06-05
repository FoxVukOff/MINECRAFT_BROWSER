/* ============================================================
   MiniCraft — основа воксельного движка в духе старого Minecraft
   Three.js r128 (глобальный THREE из CDN)
   ============================================================ */

'use strict';

// ---------- Константы блоков ----------
const BLOCK = {
  AIR:     0,
  GRASS:   1,
  DIRT:    2,
  STONE:   3,
  BEDROCK: 4,
  WATER:   5,
};

const BLOCK_NAMES = {
  [BLOCK.GRASS]:   'Трава',
  [BLOCK.DIRT]:    'Земля',
  [BLOCK.STONE]:   'Камень',
  [BLOCK.BEDROCK]: 'Бедрок',
  [BLOCK.WATER]:   'Вода',
};

// Прозрачные блоки (через них видно грани соседей)
function isTransparent(b) { return b === BLOCK.AIR || b === BLOCK.WATER; }
// Жидкости (не твёрдые для коллизий)
function isLiquid(b) { return b === BLOCK.WATER; }
// Уровень моря
const SEA_LEVEL = 22;

// Какие блоки игрок может держать/ставить (бедрок не ставится обычно, но дадим)
const PLACEABLE = [BLOCK.GRASS, BLOCK.DIRT, BLOCK.STONE];

// Время ломания (в секундах, без инструментов) — как в современном майне
const BREAK_TIME = {
  [BLOCK.GRASS]:   0.6,
  [BLOCK.DIRT]:    0.75,
  [BLOCK.STONE]:   1.9,
  [BLOCK.BEDROCK]: Infinity, // неразрушим
  [BLOCK.WATER]:   Infinity, // воду нельзя сломать
};

// Размеры чанка
const CHUNK_SIZE = 16;
const WORLD_HEIGHT = 64;
const RENDER_DISTANCE = 4; // в чанках

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

  MATERIALS[BLOCK.GRASS]   = [mGrassSide, mGrassSide, mGrassTop, mDirt, mGrassSide, mGrassSide];
  MATERIALS[BLOCK.DIRT]    = [mDirt, mDirt, mDirt, mDirt, mDirt, mDirt];
  MATERIALS[BLOCK.STONE]   = [mStone, mStone, mStone, mStone, mStone, mStone];
  MATERIALS[BLOCK.BEDROCK] = [mBedrock, mBedrock, mBedrock, mBedrock, mBedrock, mBedrock];
  MATERIALS[BLOCK.WATER]   = [mWater, mWater, mWater, mWater, mWater, mWater];
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
//  Шум для генерации мира (детерминированный value-noise)
// ============================================================
function hash2(x, z) {
  // целочисленный хеш с полным 32-битным диапазоном (0..1)
  let h = (x | 0) * 374761393 + (z | 0) * 668265263;
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

// ============================================================
//  Хранилище мира (чанки)
// ============================================================
const World = {
  chunks: new Map(),          // "cx,cz" -> { blocks:Uint8Array, mesh, dirty }
  edits: new Map(),           // "x,y,z" -> blockId  (изменения игрока)

  key(cx, cz) { return cx + ',' + cz; },
  ekey(x, y, z) { return x + ',' + y + ',' + z; },

  generateChunk(cx, cz) {
    const blocks = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = cx * CHUNK_SIZE + lx;
        const wz = cz * CHUNK_SIZE + lz;
        const h = terrainHeight(wx, wz);
        const underwater = h <= SEA_LEVEL; // эта колонка под/у уровня моря
        for (let y = 0; y < WORLD_HEIGHT; y++) {
          let b = BLOCK.AIR;
          if (y === 0) b = BLOCK.BEDROCK;
          else if (y < h - 4) b = BLOCK.STONE;
          else if (y < h - 1) b = BLOCK.DIRT;
          else if (y < h) {
            // верхний слой: под водой и у берега — земля, иначе трава
            b = underwater ? BLOCK.DIRT : BLOCK.GRASS;
          } else if (y <= SEA_LEVEL) {
            b = BLOCK.WATER; // заливаем впадины водой до уровня моря
          }
          blocks[idx(lx, y, lz)] = b;
        }
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

  setBlock(wx, wy, wz, id) {
    if (wy < 0 || wy >= WORLD_HEIGHT) return;
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const c = this.getChunk(cx, cz);
    const lx = wx - cx * CHUNK_SIZE;
    const lz = wz - cz * CHUNK_SIZE;
    c.blocks[idx(lx, wy, lz)] = id;
    c.dirty = true;
    this.edits.set(this.ekey(wx, wy, wz), id);

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
//  Симуляция воды (растекание) — простая флуд-модель
// ============================================================
const WaterSim = {
  queue: new Set(),     // "x,y,z" ячейки для проверки
  tickAcc: 0,
  tickRate: 0.18,       // секунд между тиками

  // поставить ячейку и её окрестность в очередь
  touch(x, y, z) {
    const k = x + ',' + y + ',' + z;
    this.queue.add(k);
  },
  touchAround(x, y, z) {
    this.touch(x, y, z);
    this.touch(x + 1, y, z); this.touch(x - 1, y, z);
    this.touch(x, y, z + 1); this.touch(x, y, z - 1);
    this.touch(x, y + 1, z); this.touch(x, y - 1, z);
  },

  update(dt) {
    this.tickAcc += dt;
    if (this.tickAcc < this.tickRate) return;
    this.tickAcc = 0;
    if (this.queue.size === 0) return;

    const current = Array.from(this.queue);
    this.queue.clear();
    const changedChunks = new Set();

    const setWater = (x, y, z, id) => {
      World.setBlock(x, y, z, id);
      const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(z / CHUNK_SIZE);
      changedChunks.add(cx + ',' + cz);
      // соседние чанки на границе
      changedChunks.add((cx+1)+','+cz); changedChunks.add((cx-1)+','+cz);
      changedChunks.add(cx+','+(cz+1)); changedChunks.add(cx+','+(cz-1));
      this.touchAround(x, y, z);
    };

    for (const k of current) {
      const [x, y, z] = k.split(',').map(Number);
      if (y < 1 || y >= WORLD_HEIGHT) continue;
      const here = World.getBlock(x, y, z);

      if (here === BLOCK.AIR) {
        // должна ли сюда прийти вода?
        const above = World.getBlock(x, y + 1, z);
        let fed = (above === BLOCK.WATER); // льётся сверху
        if (!fed) {
          // горизонтальный источник + не выше уровня моря (чтобы не заливать всё бесконечно вверх)
          if (y <= SEA_LEVEL) {
            if (World.getBlock(x + 1, y, z) === BLOCK.WATER ||
                World.getBlock(x - 1, y, z) === BLOCK.WATER ||
                World.getBlock(x, y, z + 1) === BLOCK.WATER ||
                World.getBlock(x, y, z - 1) === BLOCK.WATER) {
              fed = true;
            }
          }
        }
        if (fed) setWater(x, y, z, BLOCK.WATER);
      } else if (here === BLOCK.WATER) {
        // проверить, не должна ли вода исчезнуть (нет питания) — простая «высыхание»
        const above = World.getBlock(x, y + 1, z);
        let supported = (above === BLOCK.WATER) || (y <= SEA_LEVEL);
        if (!supported) {
          // питается ли с боков водой, которая выше уровня моря? оставим простую логику:
          // если выше уровня моря и сверху не вода — высыхает
          World.setBlock(x, y, z, BLOCK.AIR);
          const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(z / CHUNK_SIZE);
          changedChunks.add(cx + ',' + cz);
          this.touchAround(x, y, z);
        } else {
          // распространять дальше вниз/вбок
          this.touchAround(x, y, z);
        }
      }
    }

    // перестроить изменённые чанки
    for (const ck of changedChunks) {
      const [cx, cz] = ck.split(',').map(Number);
      World.markDirty(cx, cz);
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
        for (const f of FACES) {
          const nb = World.getBlock(wx + f.dir[0], y + f.dir[1], wz + f.dir[2]);
          if (water) {
            // вода: рисуем грань только если сосед — воздух (между водой и водой/блоком грани нет)
            if (nb !== BLOCK.AIR) continue;
          } else {
            // твёрдый блок: грань видна, если сосед прозрачный (воздух или вода)
            if (!isTransparent(nb)) continue;
          }
          const material = MATERIALS[b][f.mat];
          const mi = getMatIndex(material);
          let buf = byMat.get(mi);
          if (!buf) { buf = { positions: [], normals: [], uvs: [], indices: [], water }; byMat.set(mi, buf); }
          const base = buf.positions.length / 3;
          // вода чуть ниже полного блока — опускаем верхние вершины
          const topDrop = water ? 0.12 : 0;
          for (const cv of f.corners) {
            const vy = y + cv[1] - (cv[1] === 1 ? topDrop : 0);
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
const overlay = document.getElementById('overlay');

document.getElementById('startBtn').addEventListener('click', () => {
  overlay.classList.add('hidden');
  initAudio();
  canvas.requestPointerLock();
});

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
  keys[e.code] = true;
  if (e.code === 'KeyE') { toggleInventory(); }
  if (e.code.startsWith('Digit')) {
    const n = parseInt(e.code.slice(5), 10);
    if (n >= 1 && n <= HOTBAR_SIZE) selectSlot(n - 1);
  }
  if (e.code === 'Escape' && invOpen) toggleInventory();
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
//  Инвентарь и хотбар
// ============================================================
const HOTBAR_SIZE = 5;
let activeSlot = 0;
let invOpen = false;

// hotbar: массив {id, count} или null — изначально пустой
const hotbar = [null, null, null, null, null];

// Полный инвентарь (стопки)
const inventory = {}; // id -> count

function addToInventory(id, n = 1) {
  inventory[id] = (inventory[id] || 0) + n;
  // если этот блок уже есть в хотбаре — обновить счётчик
  let inHotbar = false;
  for (const s of hotbar) {
    if (s && s.id === id) { s.count = inventory[id]; inHotbar = true; }
  }
  // иначе — положить в первый свободный слот хотбара (как в майнкрафте)
  if (!inHotbar) {
    for (let i = 0; i < HOTBAR_SIZE; i++) {
      if (!hotbar[i]) { hotbar[i] = { id, count: inventory[id] }; break; }
    }
  }
  renderHotbar();
  if (invOpen) renderInventory();
}

function removeFromInventory(id, n = 1) {
  if (!inventory[id] || inventory[id] < n) return false;
  inventory[id] -= n;
  for (let i = 0; i < HOTBAR_SIZE; i++) {
    const s = hotbar[i];
    if (s && s.id === id) {
      s.count = inventory[id];
      if (s.count <= 0) hotbar[i] = null; // пустой слот очищается
    }
  }
  renderHotbar();
  if (invOpen) renderInventory();
  return true;
}

function selectSlot(i) {
  activeSlot = i;
  renderHotbar();
}

function iconCanvas(id, size) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  // выбрать текстуру
  let tex = TEX.stone;
  if (id === BLOCK.GRASS) tex = TEX.grass_side;
  else if (id === BLOCK.DIRT) tex = TEX.dirt;
  else if (id === BLOCK.STONE) tex = TEX.stone;
  else if (id === BLOCK.BEDROCK) tex = TEX.bedrock;
  else if (id === BLOCK.WATER) tex = TEX.water;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tex, 0, 0, size, size);
  return c;
}

const hotbarEl = document.getElementById('hotbar');
function renderHotbar() {
  hotbarEl.innerHTML = '';
  for (let i = 0; i < HOTBAR_SIZE; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot' + (i === activeSlot ? ' active' : '');
    const item = hotbar[i];
    if (item) {
      slot.appendChild(iconCanvas(item.id, 40));
      if (item.count > 0) {
        const cnt = document.createElement('div');
        cnt.className = 'count';
        cnt.textContent = item.count;
        slot.appendChild(cnt);
      }
    }
    slot.addEventListener('click', () => { if (!invOpen) selectSlot(i); });
    hotbarEl.appendChild(slot);
  }
}

const invGrid = document.getElementById('invGrid');
function renderInventory() {
  invGrid.innerHTML = '';
  // показываем только реально имеющиеся блоки (count > 0)
  const owned = PLACEABLE.filter(id => (inventory[id] || 0) > 0);
  if (owned.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'grid-column:1/-1;color:#444;font-size:12px;text-align:center;padding:8px;';
    empty.textContent = 'Пусто — добывайте блоки!';
    invGrid.appendChild(empty);
    return;
  }
  for (const id of owned) {
    const count = inventory[id] || 0;
    const el = document.createElement('div');
    el.className = 'inv-item';
    el.appendChild(iconCanvas(id, 38));
    const cnt = document.createElement('div');
    cnt.className = 'count';
    cnt.textContent = count > 0 ? count : '';
    el.appendChild(cnt);
    const nm = document.createElement('div');
    nm.className = 'nm';
    nm.textContent = BLOCK_NAMES[id];
    el.appendChild(nm);
    // клик: поместить в активный слот хотбара
    el.addEventListener('click', () => {
      hotbar[activeSlot] = { id, count };
      renderHotbar();
    });
    invGrid.appendChild(el);
  }
}

function toggleInventory() {
  invOpen = !invOpen;
  document.getElementById('inventory').classList.toggle('open', invOpen);
  if (invOpen) {
    document.exitPointerLock();
    renderInventory();
  } else {
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
//  Ломать / ставить
// ============================================================
function finishBreak(t) {
  if (!t) return;
  if (t.block === BLOCK.BEDROCK) return; // бедрок не ломается
  World.setBlock(t.x, t.y, t.z, BLOCK.AIR);
  // дроп выпадает (трава -> земля, как в майнкрафте)
  let dropId = t.block;
  if (t.block === BLOCK.GRASS) dropId = BLOCK.DIRT;
  spawnDrop(dropId, t.x + 0.5, t.y + 0.5, t.z + 0.5);
  rebuildAround(t.x, t.z);
  playSound('break', t.block);
  WaterSim.touchAround(t.x, t.y, t.z); // вода может затечь в дыру
}

function placeBlock() {
  const t = getTargetBlock();
  if (!t) return;
  const slot = hotbar[activeSlot];
  if (!slot || slot.count <= 0) return;

  const nx = t.x + t.face[0];
  const ny = t.y + t.face[1];
  const nz = t.z + t.face[2];
  if (ny < 0 || ny >= WORLD_HEIGHT) return;
  const target = World.getBlock(nx, ny, nz);
  if (target !== BLOCK.AIR && !isLiquid(target)) return; // можно ставить только в воздух/воду

  // не ставить блок внутрь игрока
  if (intersectsPlayer(nx, ny, nz)) return;

  if (!removeFromInventory(slot.id, 1)) return;
  World.setBlock(nx, ny, nz, slot.id);
  rebuildAround(nx, nz);
  playSound('place', slot.id);
  WaterSim.touchAround(nx, ny, nz); // вытеснение/перетекание воды
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

function updateChunks() {
  const pcx = Math.floor(PLAYER.pos.x / CHUNK_SIZE);
  const pcz = Math.floor(PLAYER.pos.z / CHUNK_SIZE);

  // загрузить нужные
  for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++) {
    for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++) {
      const cx = pcx + dx, cz = pcz + dz;
      const c = World.getChunk(cx, cz);
      const k = World.key(cx, cz);
      if (c.dirty || !loadedMeshes.has(k)) {
        // удалить старый меш
        const old = loadedMeshes.get(k);
        if (old) { scene.remove(old); disposeGroup(old); }
        const mesh = buildChunkMesh(c);
        scene.add(mesh);
        loadedMeshes.set(k, mesh);
        c.dirty = false;
      }
    }
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
  const feetInWater = blockAtPlayer(0.2) === BLOCK.WATER;
  const headY = PLAYER.pos.y + (PLAYER.crouching ? PLAYER.crouchEye : PLAYER.eye);
  const headInWater = World.getBlock(
    Math.floor(PLAYER.pos.x), Math.floor(headY), Math.floor(PLAYER.pos.z)
  ) === BLOCK.WATER;
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
spawnPlayer();

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

  if (overlay.classList.contains('hidden') && !invOpen) {
    updatePlayer(dt);
    updateOxygen(dt);
    updateDrops(dt);
    updateMining(dt);
  } else if (mining.active) {
    resetMining();
  }

  WaterSim.update(dt);
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

// Начинаем с пустыми руками — всё добываем сами (как в выживании)
renderHotbar();

requestAnimationFrame(loop);
