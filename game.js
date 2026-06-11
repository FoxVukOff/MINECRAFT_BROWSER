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
  COBBLESTONE: 12, // булыжник (выпадает из камня)
  GLASS:      13, // стекло (переплавка песка)
  FURNACE:    14, // печь
  DOOR_BOTTOM: 15, // дверь, нижняя половина
  DOOR_TOP:   16, // дверь, верхняя половина
  CHEST:      17, // сундук (хранилище)
  COAL_ORE:   18, // угольная руда (в камне под землёй)
  IRON_ORE:   19, // железная руда (глубоко под землёй)
  COPPER_ORE: 20, // медная руда (чуть реже угля)
  LAVA:       21, // лава-источник
  LAVA_FLOW:  22, // течение лавы (уровень 1..3)
  FIRE:       23, // огонь (горит на горючих блоках, гаснет)
  GRAVEL:     24, // гравий (падает как песок)
  OBSIDIAN:   25, // обсидиан (лава-источник + вода), нужна алмазная кирка
  DIAMOND_ORE:26, // алмазная руда (очень редкая, глубоко)
  NETHER_PORTAL:27, // портал в Ад (тонкий проходимый блок)
  NETHERRACK: 28, // незерак (основной блок Ада)
  GLOWSTONE:  29, // светящийся камень (в Аду)
};

// Предметы (не блоки) начинаются с 100, чтобы не пересекаться с блоками
const ITEM = {
  STICK:          100, // палка
  WOODEN_PICKAXE: 101, // деревянная кирка
  DOOR:           102, // предмет-дверь (ставится как два блока)
  PORK_RAW:       103, // сырая свинина
  PORK_COOKED:    104, // жареная свинина
  BEEF_RAW:       105, // сырая говядина
  BEEF_COOKED:    106, // жареная говядина
  STONE_PICKAXE:  107, // каменная кирка
  COAL:           108, // уголь (топливо, горит долго)
  CHARCOAL:       109, // древесный уголь (переплавка дерева, среднее топливо)
  IRON_INGOT:     110, // железный слиток (переплавка железной руды)
  IRON_PICKAXE:   111, // железная кирка (ещё эффективнее)
  COPPER_INGOT:   112, // медный слиток (переплавка медной руды)
  COPPER_PICKAXE: 113, // медная кирка (золотая середина: каменная < медная < железная)
  // Топоры (быстрее по дереву)
  WOODEN_AXE:     120,
  STONE_AXE:      121,
  COPPER_AXE:     122,
  IRON_AXE:       123,
  // Лопаты (быстрее по земле/песку)
  WOODEN_SHOVEL:  130,
  STONE_SHOVEL:   131,
  COPPER_SHOVEL:  132,
  IRON_SHOVEL:    133,
  // Курятина
  CHICKEN_RAW:    140,
  CHICKEN_COOKED: 141,
  // Мечи (оружие — больше урона по мобам)
  WOODEN_SWORD:   150,
  STONE_SWORD:    151,
  COPPER_SWORD:   152,
  IRON_SWORD:     153,
  // Алмазы (лучший материал)
  DIAMOND:        160, // алмаз (из алмазной руды)
  DIAMOND_PICKAXE:161,
  DIAMOND_AXE:    162,
  DIAMOND_SHOVEL: 163,
  DIAMOND_SWORD:  164,
  // Вёдра
  BUCKET:         170, // пустое ведро
  WATER_BUCKET:   171, // ведро с водой
  LAVA_BUCKET:    172, // ведро с лавой
  // Кремень и зажигалка
  FLINT:          180, // кремень (редко из гравия)
  FLINT_AND_STEEL:181, // зажигалка (поджигает; имеет прочность)
  // Лодка
  BOAT:           190, // лодка (плавает по воде)
  // Кожа (из коров) и броня
  LEATHER:        200,
  // Кожаная броня
  LEATHER_HELMET:    210,
  LEATHER_CHESTPLATE:211,
  LEATHER_LEGGINGS:  212,
  LEATHER_BOOTS:     213,
  // Железная броня
  IRON_HELMET:    220,
  IRON_CHESTPLATE:221,
  IRON_LEGGINGS:  222,
  IRON_BOOTS:     223,
  // Алмазная броня
  DIAMOND_HELMET:    230,
  DIAMOND_CHESTPLATE:231,
  DIAMOND_LEGGINGS:  232,
  DIAMOND_BOOTS:     233,
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
  [BLOCK.COBBLESTONE]: 'Булыжник',
  [BLOCK.GLASS]:   'Стекло',
  [BLOCK.FURNACE]: 'Печь',
  [BLOCK.DOOR_BOTTOM]: 'Дверь',
  [BLOCK.DOOR_TOP]: 'Дверь',
  [BLOCK.CHEST]:   'Сундук',
  [BLOCK.COAL_ORE]: 'Угольная руда',
  [BLOCK.IRON_ORE]: 'Железная руда',
  [BLOCK.COPPER_ORE]: 'Медная руда',
  [BLOCK.LAVA]: 'Лава',
  [BLOCK.LAVA_FLOW]: 'Лава',
  [BLOCK.FIRE]: 'Огонь',
  [BLOCK.GRAVEL]: 'Гравий',
  [BLOCK.OBSIDIAN]: 'Обсидиан',
  [BLOCK.DIAMOND_ORE]: 'Алмазная руда',
  [BLOCK.NETHER_PORTAL]: 'Портал в Ад',
  [BLOCK.NETHERRACK]: 'Незерак',
  [BLOCK.GLOWSTONE]: 'Светопыль',
  [ITEM.STICK]:    'Палки',
  [ITEM.WOODEN_PICKAXE]: 'Деревянная кирка',
  [ITEM.STONE_PICKAXE]: 'Каменная кирка',
  [ITEM.IRON_INGOT]: 'Железный слиток',
  [ITEM.IRON_PICKAXE]: 'Железная кирка',
  [ITEM.COPPER_INGOT]: 'Медный слиток',
  [ITEM.COPPER_PICKAXE]: 'Медная кирка',
  [ITEM.DOOR]:     'Дверь',
  [ITEM.PORK_RAW]: 'Сырая свинина',
  [ITEM.PORK_COOKED]: 'Жареная свинина',
  [ITEM.BEEF_RAW]: 'Сырая говядина',
  [ITEM.BEEF_COOKED]: 'Жареная говядина',
  [ITEM.COAL]:     'Уголь',
  [ITEM.CHARCOAL]: 'Древесный уголь',
  [ITEM.WOODEN_AXE]: 'Деревянный топор',
  [ITEM.STONE_AXE]:  'Каменный топор',
  [ITEM.COPPER_AXE]: 'Медный топор',
  [ITEM.IRON_AXE]:   'Железный топор',
  [ITEM.WOODEN_SHOVEL]: 'Деревянная лопата',
  [ITEM.STONE_SHOVEL]:  'Каменная лопата',
  [ITEM.COPPER_SHOVEL]: 'Медная лопата',
  [ITEM.IRON_SHOVEL]:   'Железная лопата',
  [ITEM.CHICKEN_RAW]:    'Сырая курятина',
  [ITEM.CHICKEN_COOKED]: 'Жареная курятина',
  [ITEM.WOODEN_SWORD]: 'Деревянный меч',
  [ITEM.STONE_SWORD]:  'Каменный меч',
  [ITEM.COPPER_SWORD]: 'Медный меч',
  [ITEM.IRON_SWORD]:   'Железный меч',
  [ITEM.DIAMOND]:        'Алмаз',
  [ITEM.DIAMOND_PICKAXE]:'Алмазная кирка',
  [ITEM.DIAMOND_AXE]:    'Алмазный топор',
  [ITEM.DIAMOND_SHOVEL]: 'Алмазная лопата',
  [ITEM.DIAMOND_SWORD]:  'Алмазный меч',
  [ITEM.BUCKET]:        'Ведро',
  [ITEM.WATER_BUCKET]:  'Ведро воды',
  [ITEM.LAVA_BUCKET]:   'Ведро лавы',
  [ITEM.FLINT]:         'Кремень',
  [ITEM.FLINT_AND_STEEL]: 'Зажигалка',
  [ITEM.BOAT]:          'Лодка',
  [ITEM.LEATHER]:       'Кожа',
  [ITEM.LEATHER_HELMET]:    'Кожаный шлем',
  [ITEM.LEATHER_CHESTPLATE]:'Кожаная куртка',
  [ITEM.LEATHER_LEGGINGS]:  'Кожаные штаны',
  [ITEM.LEATHER_BOOTS]:     'Кожаные ботинки',
  [ITEM.IRON_HELMET]:    'Железный шлем',
  [ITEM.IRON_CHESTPLATE]:'Железный нагрудник',
  [ITEM.IRON_LEGGINGS]:  'Железные поножи',
  [ITEM.IRON_BOOTS]:     'Железные ботинки',
  [ITEM.DIAMOND_HELMET]:    'Алмазный шлем',
  [ITEM.DIAMOND_CHESTPLATE]:'Алмазный нагрудник',
  [ITEM.DIAMOND_LEGGINGS]:  'Алмазные поножи',
  [ITEM.DIAMOND_BOOTS]:     'Алмазные ботинки',
};

// Еда: сколько голода восстанавливает
const FOOD = {
  [ITEM.PORK_RAW]:    2,
  [ITEM.PORK_COOKED]: 6,
  [ITEM.BEEF_RAW]:    2,
  [ITEM.BEEF_COOKED]: 6,
  [ITEM.CHICKEN_RAW]:    1,
  [ITEM.CHICKEN_COOKED]: 4,
};
function isFood(id) { return FOOD[id] !== undefined; }

const MAX_STACK = 64; // максимум в стопке

// Является ли id блоком (а не предметом)
function isBlock(id) { return id < 100; }

// Гравитационные блоки (падают, если под ними нет опоры) — песок и гравий
function isFalling(b) { return b === BLOCK.SAND || b === BLOCK.GRAVEL; }

// Двери (две половинки)
function isDoor(b) { return b === BLOCK.DOOR_BOTTOM || b === BLOCK.DOOR_TOP; }

// Прозрачные блоки (через них видно грани соседей).
// Листва/стекло/дверь прозрачны для меширования внутренних граней.
function isTransparent(b) {
  return b === BLOCK.AIR || b === BLOCK.WATER || b === BLOCK.WATER_FLOW ||
         b === BLOCK.LEAVES || b === BLOCK.GLASS || isDoor(b) ||
         b === BLOCK.LAVA || b === BLOCK.LAVA_FLOW || b === BLOCK.FIRE ||
         b === BLOCK.NETHER_PORTAL;
}
// Жидкости (не твёрдые для коллизий)
function isWaterLiquid(b) { return b === BLOCK.WATER || b === BLOCK.WATER_FLOW; }
function isLavaLiquid(b) { return b === BLOCK.LAVA || b === BLOCK.LAVA_FLOW; }
function isLiquid(b) { return isWaterLiquid(b) || isLavaLiquid(b); }
// Блоки, сквозь которые можно проходить (двери — если открыты; пока проходимы всегда у открытой)
// Максимальный уровень воды (источник). Течение: 7..1, чем дальше — тем меньше
const WATER_MAX = 8;
const LAVA_MAX = 4; // лава течёт недалеко (как в Minecraft overworld)
// Уровень моря
const SEA_LEVEL = 22;

// Какие блоки/предметы игрок может держать/ставить
const PLACEABLE = [BLOCK.GRASS, BLOCK.DIRT, BLOCK.STONE, BLOCK.SAND, BLOCK.GRAVEL,
                   BLOCK.WOOD, BLOCK.LEAVES, BLOCK.PLANKS, BLOCK.CRAFTING_TABLE,
                   BLOCK.COBBLESTONE, BLOCK.GLASS, BLOCK.FURNACE, BLOCK.CHEST, ITEM.DOOR,
                   BLOCK.IRON_ORE, BLOCK.COPPER_ORE, BLOCK.DIAMOND_ORE, BLOCK.OBSIDIAN];

// Инструменты-кирки (ускоряют добычу камня и позволяют получить булыжник)
function isPickaxe(id) { return id === ITEM.WOODEN_PICKAXE || id === ITEM.STONE_PICKAXE || id === ITEM.COPPER_PICKAXE || id === ITEM.IRON_PICKAXE || id === ITEM.DIAMOND_PICKAXE; }
// Уровень кирки: 1 — дерево, 2 — камень, 3 — медь, 4 — железо, 5 — алмаз (лучшая)
function pickaxeTier(id) {
  if (id === ITEM.DIAMOND_PICKAXE) return 5;
  if (id === ITEM.IRON_PICKAXE) return 4;
  if (id === ITEM.COPPER_PICKAXE) return 3;
  if (id === ITEM.STONE_PICKAXE) return 2;
  if (id === ITEM.WOODEN_PICKAXE) return 1;
  return 0;
}

// --- Топоры (ускоряют дерево/доски) ---
function isAxe(id) { return id === ITEM.WOODEN_AXE || id === ITEM.STONE_AXE || id === ITEM.COPPER_AXE || id === ITEM.IRON_AXE || id === ITEM.DIAMOND_AXE; }
function axeTier(id) {
  if (id === ITEM.DIAMOND_AXE) return 5;
  if (id === ITEM.IRON_AXE) return 4;
  if (id === ITEM.COPPER_AXE) return 3;
  if (id === ITEM.STONE_AXE) return 2;
  if (id === ITEM.WOODEN_AXE) return 1;
  return 0;
}
// --- Лопаты (ускоряют землю/песок/траву) ---
function isShovel(id) { return id === ITEM.WOODEN_SHOVEL || id === ITEM.STONE_SHOVEL || id === ITEM.COPPER_SHOVEL || id === ITEM.IRON_SHOVEL || id === ITEM.DIAMOND_SHOVEL; }
function shovelTier(id) {
  if (id === ITEM.DIAMOND_SHOVEL) return 5;
  if (id === ITEM.IRON_SHOVEL) return 4;
  if (id === ITEM.COPPER_SHOVEL) return 3;
  if (id === ITEM.STONE_SHOVEL) return 2;
  if (id === ITEM.WOODEN_SHOVEL) return 1;
  return 0;
}
// --- Мечи (оружие: больше урона) ---
function isSword(id) { return id === ITEM.WOODEN_SWORD || id === ITEM.STONE_SWORD || id === ITEM.COPPER_SWORD || id === ITEM.IRON_SWORD || id === ITEM.DIAMOND_SWORD; }
function swordDamage(id) {
  if (id === ITEM.DIAMOND_SWORD) return 8;
  if (id === ITEM.IRON_SWORD) return 7;
  if (id === ITEM.COPPER_SWORD) return 6;
  if (id === ITEM.STONE_SWORD) return 5;
  if (id === ITEM.WOODEN_SWORD) return 4;
  return 0;
}
// Любой инструмент
function isTool(id) { return isPickaxe(id) || isAxe(id) || isShovel(id) || isSword(id); }

// --- Броня ---
// Слоты: 'helmet','chestplate','leggings','boots'. armorPoints — очки защиты (как в MC).
const ARMOR = {
  [ITEM.LEATHER_HELMET]:    { slot: 'helmet',     points: 1 },
  [ITEM.LEATHER_CHESTPLATE]:{ slot: 'chestplate', points: 3 },
  [ITEM.LEATHER_LEGGINGS]:  { slot: 'leggings',   points: 2 },
  [ITEM.LEATHER_BOOTS]:     { slot: 'boots',      points: 1 },
  [ITEM.IRON_HELMET]:    { slot: 'helmet',     points: 2 },
  [ITEM.IRON_CHESTPLATE]:{ slot: 'chestplate', points: 6 },
  [ITEM.IRON_LEGGINGS]:  { slot: 'leggings',   points: 5 },
  [ITEM.IRON_BOOTS]:     { slot: 'boots',      points: 2 },
  [ITEM.DIAMOND_HELMET]:    { slot: 'helmet',     points: 3 },
  [ITEM.DIAMOND_CHESTPLATE]:{ slot: 'chestplate', points: 8 },
  [ITEM.DIAMOND_LEGGINGS]:  { slot: 'leggings',   points: 6 },
  [ITEM.DIAMOND_BOOTS]:     { slot: 'boots',      points: 3 },
};
function isArmor(id) { return ARMOR[id] !== undefined; }
function armorSlotOf(id) { return ARMOR[id] ? ARMOR[id].slot : null; }
function armorPointsOf(id) { return ARMOR[id] ? ARMOR[id].points : 0; }

// --- Прочность предметов (пока только у зажигалки) ---
// MC: 65 использований; делаем чуть быстрее — 50.
const MAX_DURABILITY = {
  [ITEM.FLINT_AND_STEEL]: 50,
};
function hasDurability(id) { return MAX_DURABILITY[id] !== undefined; }
// израсходовать 1 заряд прочности у предмета в слоте; вернуть true если предмет сломался
function useDurability(slot) {
  if (!slot || !hasDurability(slot.id)) return false;
  if (slot.dur === undefined) slot.dur = MAX_DURABILITY[slot.id];
  slot.dur--;
  if (slot.dur <= 0) {
    // сломалось — убрать одну единицу
    slot.count--;
    if (slot.count <= 0) { return true; } // слот опустеет (вызывающий очистит)
    slot.dur = MAX_DURABILITY[slot.id]; // следующая в стопке (хотя обычно стопка=1)
  }
  return false;
}
// Блоки, по которым эффективен топор / лопата
function axeBlock(b) { return b === BLOCK.WOOD || b === BLOCK.PLANKS || b === BLOCK.CRAFTING_TABLE || b === BLOCK.CHEST || b === BLOCK.DOOR_BOTTOM || b === BLOCK.DOOR_TOP; }
function shovelBlock(b) { return b === BLOCK.DIRT || b === BLOCK.GRASS || b === BLOCK.SAND || b === BLOCK.GRAVEL; }

// Блоки, для добычи которых нужна кирка (иначе ломается, но ничего не выпадает)
function needsPickaxe(b) { return b === BLOCK.STONE || b === BLOCK.COBBLESTONE || b === BLOCK.FURNACE || b === BLOCK.COAL_ORE || b === BLOCK.IRON_ORE || b === BLOCK.COPPER_ORE || b === BLOCK.DIAMOND_ORE || b === BLOCK.OBSIDIAN || b === BLOCK.NETHERRACK || b === BLOCK.GLOWSTONE; }
// Минимальный уровень кирки для добычи блока:
//  руды железа/меди — каменная(2)+; алмаз — железная(4)+; обсидиан — алмазная(5).
function minePickTier(b) {
  if (b === BLOCK.OBSIDIAN) return 5;
  if (b === BLOCK.DIAMOND_ORE) return 4;
  if (b === BLOCK.IRON_ORE || b === BLOCK.COPPER_ORE) return 2;
  return 1;
}

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
  [BLOCK.COBBLESTONE]: 2.0,
  [BLOCK.GLASS]:   0.4,
  [BLOCK.FURNACE]: 2.2,
  [BLOCK.DOOR_BOTTOM]: 0.8,
  [BLOCK.DOOR_TOP]: 0.8,
  [BLOCK.CHEST]:   1.4,
  [BLOCK.COAL_ORE]: 3.0, // руда крепкая
  [BLOCK.COPPER_ORE]: 3.5, // медная руда
  [BLOCK.IRON_ORE]: 4.0, // железная руда ещё крепче
  [BLOCK.DIAMOND_ORE]: 5.0, // алмазная руда очень крепкая
  [BLOCK.GRAVEL]:  0.6, // гравий копается быстро (лопатой)
  [BLOCK.OBSIDIAN]: 12.0, // обсидиан добывается долго даже алмазной киркой
  [BLOCK.NETHERRACK]: 0.6, // незерак мягкий
  [BLOCK.GLOWSTONE]: 0.6,
  [BLOCK.BEDROCK]: Infinity, // неразрушим
  [BLOCK.WATER]:   Infinity, // воду нельзя сломать
  [BLOCK.WATER_FLOW]: Infinity,
  [BLOCK.LAVA]:    Infinity,
  [BLOCK.LAVA_FLOW]: Infinity,
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

// Детерминированная пиксель-заливка из палитры (для чёткого пиксель-арта).
// palette — массив цветов '#..'; weights — относит. частоты. seed — для стабильности.
function pixelFillRegion(ctx, ox, oy, w, h, palette, weights, seed) {
  let s = (seed || 1) >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const total = weights.reduce((a,b)=>a+b,0);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let r = rnd() * total, idx = 0;
    while (r > weights[idx] && idx < weights.length-1) { r -= weights[idx]; idx++; }
    ctx.fillStyle = palette[idx];
    ctx.fillRect(ox + x, oy + y, 1, 1);
  }
}
function pixelFill(ctx, palette, weights, seed) {
  pixelFillRegion(ctx, 0, 0, 16, 16, palette, weights, seed);
}

function shade(hex, amt) {
  let r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  r = Math.max(0, Math.min(255, r + amt));
  g = Math.max(0, Math.min(255, g + amt));
  b = Math.max(0, Math.min(255, b + amt));
  return `rgb(${r|0},${g|0},${b|0})`;
}

function buildTextures() {
  // --- Новая фаза: более чистый пиксель-арт, насыщенные палитры ---
  // трава сверху — три оттенка зелёного, детерминированный паттерн
  TEX.grass_top  = makeTex(ctx => {
    pixelFill(ctx, ['#6ab04c','#5a9e3a','#4f8c33','#76bd57'], [4,5,3,2], 101);
  });
  // земля — тёплая коричневая палитра с редкими камешками
  const dirtDraw = (ctx) => {
    pixelFill(ctx, ['#8a6a40','#7d5e36','#96754a','#6e5430'], [5,4,3,2], 202);
    // редкие камешки
    ctx.fillStyle = '#5e4628';
    for (const [gx,gy] of [[3,11],[10,4],[13,12],[6,7]]) ctx.fillRect(gx,gy,2,1);
  };
  TEX.dirt    = makeTex(dirtDraw);
  // бок травы — земля снизу + ровная зелёная кромка сверху (3-4px) с «свесом»
  TEX.grass_side = makeTex(ctx => {
    dirtDraw(ctx);
    // зелёная шапка
    pixelFillRegion(ctx, 0, 0, 16, 4, ['#6ab04c','#5a9e3a','#4f8c33'], [4,4,2], 303);
    // неровный нижний край шапки (свес)
    ctx.fillStyle = '#5a9e3a';
    for (let x = 0; x < 16; x++) if ((x*37+11)%5 < 2) ctx.fillRect(x, 4, 1, 1);
  });
  // камень — серый с тёмными вкраплениями, аккуратнее
  TEX.stone   = makeTex(ctx => {
    pixelFill(ctx, ['#909090','#828282','#9a9a9a','#777777'], [5,4,3,2], 404);
    ctx.fillStyle = '#6c6c6c';
    for (const [gx,gy] of [[2,3],[11,2],[5,9],[12,11],[7,13]]) ctx.fillRect(gx,gy,2,1);
  });
  TEX.bedrock = makeTex(ctx => pixelFill(ctx, ['#3a3a3a','#4a4a4a','#2c2c2c','#565656'], [4,4,3,2], 505));
  TEX.water   = makeTex(ctx => pixelFill(ctx, ['#3a6ea5','#3566a0','#4078b0','#315f96'], [5,4,3,2], 606));
  // лава — раскалённая, тёмно-красная основа с ярко-оранжевыми «жилами» магмы
  TEX.lava    = makeTex(ctx => {
    pixelFill(ctx, ['#d83a10','#b82c08','#e85a18','#a02404'], [5,4,3,3], 6161);
    // яркие сгустки магмы
    ctx.fillStyle = '#ffb030';
    for (const [gx,gy] of [[3,4],[10,3],[6,9],[12,11],[2,12]]) ctx.fillRect(gx,gy,2,2);
    ctx.fillStyle = '#ffe070';
    for (const [gx,gy] of [[4,5],[11,4],[7,10]]) ctx.fillRect(gx,gy,1,1);
    // тёмная застывшая корка
    ctx.fillStyle = '#6a1404';
    ctx.fillRect(0,7,16,1); ctx.fillRect(8,0,1,6);
  });
  // огонь — языки пламени снизу вверх (для билборд-креста)
  TEX.fire    = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    // основание — широкое, верх — узкий
    const layer = (color, pts) => { ctx.fillStyle = color; for (const [gx,gy,w,h] of pts) ctx.fillRect(gx,gy,w,h); };
    layer('#d8400e', [[3,9,10,7],[4,6,8,4],[6,3,4,4],[7,1,2,3]]);          // внешнее
    layer('#ff8a20', [[5,10,6,6],[5,7,6,3],[6,4,4,3],[7,2,2,2]]);          // среднее
    layer('#ffd24a', [[6,11,4,5],[7,8,2,3],[7,5,2,2]]);                     // ядро
    layer('#fff0a0', [[7,12,2,3]]);                                        // самое яркое
  });
  // портал в Ад — фиолетовая «дымка» (анимируется)
  TEX.portal = makeTex(ctx => {
    pixelFill(ctx, ['#7a2fb8','#5a1f9a','#9a4fd8','#3a1268','#6a2aa8'], [4,4,3,3,3], 2727);
    ctx.fillStyle = '#c79cff';
    for (const [gx,gy] of [[4,3],[10,6],[6,10],[12,12],[2,8]]) ctx.fillRect(gx,gy,1,1);
  });
  // песок — светлый, мягкие точки
  TEX.sand    = makeTex(ctx => {
    pixelFill(ctx, ['#ddd2a0','#e6dcae','#d4c894','#cfc088'], [5,4,3,2], 707);
  });

  // дерево: бок — кора с вертикальными полосами
  TEX.wood_side = makeTex(ctx => {
    pixelFill(ctx, ['#6b4f2a','#5e4424','#785931','#523c20'], [5,4,3,2], 808);
    // вертикальные тёмные волокна коры
    ctx.fillStyle = '#46331b';
    for (const x of [2,6,10,13]) for (let y=0;y<16;y++) if ((y+x)%3) ctx.fillRect(x,y,1,1);
  });
  // дерево: торец — годовые кольца
  TEX.wood_top = makeTex(ctx => {
    pixelFill(ctx, ['#9c7842','#8a6a38','#a8854c'], [5,4,2], 909);
    ctx.strokeStyle = '#6b4f2a'; ctx.lineWidth = 1;
    for (let r = 2; r < 8; r += 2) { ctx.beginPath(); ctx.arc(8, 8, r, 0, Math.PI*2); ctx.stroke(); }
    ctx.fillStyle = '#5e4628'; ctx.fillRect(7,7,2,2); // сердцевина
  });
  // листва — насыщенная зелень с прозрачными «дырками»
  TEX.leaves = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    let s = 1212>>>0; const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
    const pal = ['#3f8b2e','#357a26','#4a9c36','#2e6b20'];
    for (let y=0;y<16;y++) for (let x=0;x<16;x++) {
      if (rnd() < 0.14) continue; // дырки
      ctx.fillStyle = pal[(rnd()*pal.length)|0];
      ctx.fillRect(x,y,1,1);
    }
  });
  // доски — ровные горизонтальные доски с тёмными стыками
  TEX.planks = makeTex(ctx => {
    pixelFill(ctx, ['#bd9252','#b08549','#c79c5d'], [5,4,2], 1313);
    ctx.fillStyle = '#7a5a30';
    for (let y = 3; y < 16; y += 4) ctx.fillRect(0, y, 16, 1);   // линии досок
    ctx.fillStyle = '#8a663a';
    ctx.fillRect(7,0,1,3); ctx.fillRect(3,4,1,4); ctx.fillRect(11,8,1,4); ctx.fillRect(6,12,1,4); // короткие стыки
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

  // булыжник — крупные камни
  TEX.cobble = makeTex(ctx => {
    // булыжник — отдельные камни с тёмными швами (чистый пиксель-арт)
    pixelFill(ctx, ['#7d7d7d','#6f6f6f','#888888','#656565'], [5,4,3,2], 1414);
    ctx.fillStyle = '#4f4f4f';
    // тёмные швы между камнями
    ctx.fillRect(0,5,16,1); ctx.fillRect(0,10,16,1);
    ctx.fillRect(6,0,1,5); ctx.fillRect(10,6,1,4); ctx.fillRect(4,11,1,5); ctx.fillRect(11,11,1,5);
    // блики на камнях
    ctx.fillStyle = '#9a9a9a';
    ctx.fillRect(2,2,2,1); ctx.fillRect(11,2,2,1); ctx.fillRect(2,7,2,1); ctx.fillRect(12,7,2,1); ctx.fillRect(7,12,2,1);
  });
  // угольная руда — камень с чёрными вкраплениями угля
  TEX.coal_ore = makeTex(ctx => {
    pixelFill(ctx, ['#909090','#828282','#9a9a9a','#777777'], [5,4,3,2], 404); // та же база, что камень
    // чёрные «жилы» угля
    ctx.fillStyle = '#1c1c1c';
    const blobs = [[3,3,3,2],[10,4,3,3],[5,9,4,3],[11,10,2,3],[2,11,2,2]];
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle = '#3a3a3a';
    for (const [bx,by] of blobs) ctx.fillRect(bx,by,1,1);
  });
  // железная руда — камень со светло-бежевыми/розоватыми вкраплениями (НЕ медь!)
  TEX.iron_ore = makeTex(ctx => {
    pixelFill(ctx, ['#909090','#828282','#9a9a9a','#777777'], [5,4,3,2], 404);
    const blobs = [[3,4,3,2],[9,3,3,3],[6,9,4,3],[11,10,2,2],[2,11,2,2]];
    ctx.fillStyle = '#d8c4b0';                 // светлый бежево-серый металл (как в майне)
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle = '#efe2d4';                 // светлый блик
    for (const [bx,by] of blobs) ctx.fillRect(bx,by,1,1);
    ctx.fillStyle = '#b09c86';                 // тень
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx+bw-1,by+bh-1,1,1);
  });
  // медная руда — камень с оранжево-рыжими вкраплениями
  TEX.copper_ore = makeTex(ctx => {
    pixelFill(ctx, ['#909090','#828282','#9a9a9a','#777777'], [5,4,3,2], 404);
    const blobs = [[4,3,3,2],[9,4,3,3],[3,9,3,3],[10,10,3,2],[6,12,2,2]];
    ctx.fillStyle = '#c87038';                 // насыщенная медь
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle = '#e89a5a';                 // блик
    for (const [bx,by] of blobs) ctx.fillRect(bx,by,1,1);
    ctx.fillStyle = '#9c4f22';                 // тень
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx+bw-1,by+bh-1,1,1);
  });
  // алмазная руда — камень с голубыми кристаллами
  TEX.diamond_ore = makeTex(ctx => {
    pixelFill(ctx, ['#909090','#828282','#9a9a9a','#777777'], [5,4,3,2], 404);
    const blobs = [[3,4,3,2],[10,3,2,3],[5,10,3,2],[11,11,2,2],[2,11,2,2]];
    ctx.fillStyle = '#3fd6e0';                 // яркая бирюза алмаза
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle = '#bff7ff';                 // блик-грань
    for (const [bx,by] of blobs) ctx.fillRect(bx,by,1,1);
    ctx.fillStyle = '#1f9fb0';                 // тень
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx+bw-1,by+bh-1,1,1);
  });
  // гравий — серо-коричневая каменная крошка
  TEX.gravel = makeTex(ctx => {
    pixelFill(ctx, ['#8a8480','#9a938c','#76706a','#a39c94','#6a625c'], [5,4,4,2,2], 2424);
    // тёмные камешки
    ctx.fillStyle = '#55504a';
    for (const [gx,gy] of [[2,3],[7,2],[12,5],[4,9],[10,11],[6,13]]) ctx.fillRect(gx,gy,2,2);
    ctx.fillStyle = '#b8b0a6';
    for (const [gx,gy] of [[3,4],[8,3],[5,10]]) ctx.fillRect(gx,gy,1,1);
  });
  // обсидиан — почти чёрный с фиолетовыми бликами
  TEX.obsidian = makeTex(ctx => {
    pixelFill(ctx, ['#140d22','#0e0a1a','#1c1430','#0a0814'], [5,4,3,3], 2525);
    ctx.fillStyle = '#3a2a5c';                 // фиолетовые блики
    for (const [gx,gy] of [[3,3],[10,5],[6,9],[12,11],[2,12]]) ctx.fillRect(gx,gy,1,1);
    ctx.fillStyle = '#5a3f8a';
    ctx.fillRect(4,6,1,1); ctx.fillRect(9,10,1,1);
  });
  // незерак — багрово-красный пористый камень
  TEX.netherrack = makeTex(ctx => {
    pixelFill(ctx, ['#5a1f1f','#6e2626','#4a1818','#7a2c2c','#3e1414'], [5,4,4,2,2], 2828);
    ctx.fillStyle = '#852f2f';
    for (const [gx,gy] of [[3,4],[10,6],[6,10],[12,12],[2,11],[8,2]]) ctx.fillRect(gx,gy,1,1);
    ctx.fillStyle = '#3a1212';
    for (const [gx,gy] of [[5,7],[11,3],[7,13],[1,5]]) ctx.fillRect(gx,gy,1,1);
  });
  // светопыль (glowstone) — жёлто-оранжевый светящийся
  TEX.glowstone = makeTex(ctx => {
    pixelFill(ctx, ['#e0a838','#d49028','#f0c860','#b87818'], [5,4,3,3], 2929);
    ctx.fillStyle = '#fff0a0';
    for (const [gx,gy] of [[3,3],[10,4],[6,9],[12,11],[4,12],[9,7]]) ctx.fillRect(gx,gy,2,2);
    ctx.fillStyle = '#a86810';
    ctx.fillRect(0,8,16,1); ctx.fillRect(8,0,1,16);
  });
  // кожа — текстура для предметной иконки рисуется кодом; здесь не нужна
  // стекло — почти прозрачное с рамкой/бликом
  TEX.glass = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    ctx.strokeStyle = 'rgba(220,240,255,0.9)'; ctx.lineWidth=1;
    ctx.strokeRect(0.5,0.5,15,15);
    ctx.strokeStyle = 'rgba(220,240,255,0.5)';
    ctx.beginPath(); ctx.moveTo(3,13); ctx.lineTo(11,3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6,13); ctx.lineTo(13,6); ctx.stroke();
  });
  // печь: бок/верх — гладкий камень; перед — топка с решёткой
  TEX.furnace_side = makeTex(ctx => {
    noiseFill(ctx, 0x8a8a8a, 10);
    // тёмная рамка по краю
    ctx.strokeStyle = '#6c6c6c'; ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 15, 15);
    // лёгкие сколы
    ctx.fillStyle = '#787878'; ctx.fillRect(3,4,2,1); ctx.fillRect(11,9,2,1); ctx.fillRect(6,12,2,1);
    ctx.fillStyle = '#9a9a9a'; ctx.fillRect(2,10,1,2); ctx.fillRect(12,3,1,2);
  });
  TEX.furnace_top = makeTex(ctx => {
    noiseFill(ctx, 0x8a8a8a, 10);
    ctx.strokeStyle = '#6c6c6c'; ctx.lineWidth = 1; ctx.strokeRect(0.5,0.5,15,15);
    // дымоход в центре
    ctx.fillStyle = '#5a5a5a'; ctx.fillRect(5,5,6,6);
    ctx.fillStyle = '#3a3a3a'; ctx.fillRect(6,6,4,4);
  });
  TEX.furnace_front = makeTex(ctx => {
    noiseFill(ctx, 0x8a8a8a, 10);
    ctx.strokeStyle = '#6c6c6c'; ctx.lineWidth = 1; ctx.strokeRect(0.5,0.5,15,15);
    // тёмная топка
    ctx.fillStyle = '#3a3128'; ctx.fillRect(3,4,10,9);
    ctx.fillStyle = '#1c1712'; ctx.fillRect(4,5,8,7);
    // решётка-вентиляция
    ctx.fillStyle = '#555'; for (let x=4;x<12;x+=2) ctx.fillRect(x,5,1,7);
    // нижняя металлическая планка
    ctx.fillStyle = '#777'; ctx.fillRect(3,12,10,1);
    // огонёк (потухший)
    ctx.fillStyle = '#3a2a18'; ctx.fillRect(6,9,4,3);
  });
  // печь зажжённая — светящаяся топка
  TEX.furnace_front_lit = makeTex(ctx => {
    noiseFill(ctx, 0x8a8a8a, 10);
    ctx.strokeStyle = '#6c6c6c'; ctx.lineWidth = 1; ctx.strokeRect(0.5,0.5,15,15);
    ctx.fillStyle = '#2a1c10'; ctx.fillRect(3,4,10,9);
    ctx.fillStyle = '#1c1712'; ctx.fillRect(4,5,8,7);
    ctx.fillStyle = '#555'; for (let x=4;x<12;x+=2) ctx.fillRect(x,5,1,7);
    ctx.fillStyle = '#777'; ctx.fillRect(3,12,10,1);
    // пламя
    ctx.fillStyle = '#ff6a1a'; ctx.fillRect(5,9,6,3);
    ctx.fillStyle = '#ffb030'; ctx.fillRect(6,10,4,2);
    ctx.fillStyle = '#ffe060'; ctx.fillRect(7,11,2,1);
  });
  // дверь: верхняя половинка (с окошком) и нижняя
  TEX.door_top = makeTex(ctx => {
    noiseFill(ctx, 0x9c6b35, 14);
    ctx.fillStyle = '#6e4a22'; ctx.strokeStyle='#6e4a22';
    ctx.strokeRect(1.5,1.5,13,13);
    ctx.fillStyle = 'rgba(150,200,230,0.6)'; ctx.fillRect(4,3,8,5); // окошко
    ctx.fillStyle = '#3a2712'; ctx.fillRect(12,9,2,2);             // ручка
  });
  TEX.door_bottom = makeTex(ctx => {
    noiseFill(ctx, 0x9c6b35, 14);
    ctx.strokeStyle='#6e4a22'; ctx.strokeRect(1.5,0.5,13,15);
    ctx.fillStyle = '#3a2712'; ctx.fillRect(12,7,2,2);             // ручка
  });
  // сундук: доски с тёмной обвязкой по краям и фактурой древесины
  const woodGrain = (ctx, base) => {
    noiseFill(ctx, base, 10);
    // горизонтальные волокна
    ctx.globalAlpha = 0.35;
    for (let y=1;y<16;y+=2){ ctx.fillStyle = shade(base, -14); ctx.fillRect(0,y,16,1); }
    ctx.globalAlpha = 1;
  };
  TEX.chest_top = makeTex(ctx => {
    woodGrain(ctx, 0xb07a36);
    // обвязка по периметру
    ctx.fillStyle = '#4d3416';
    ctx.fillRect(0,0,16,2); ctx.fillRect(0,14,16,2); ctx.fillRect(0,0,2,16); ctx.fillRect(14,0,2,16);
    // средняя планка
    ctx.fillRect(7,0,2,16);
    ctx.fillStyle = '#6b4a20'; ctx.fillRect(2,2,5,12); ctx.fillRect(9,2,5,12);
  });
  TEX.chest_front = makeTex(ctx => {
    woodGrain(ctx, 0xb07a36);
    ctx.fillStyle = '#4d3416';
    ctx.fillRect(0,0,16,2); ctx.fillRect(0,14,16,2); ctx.fillRect(0,0,2,16); ctx.fillRect(14,0,2,16);
    ctx.fillRect(0,7,16,2);                                  // линия крышки
    // петли
    ctx.fillStyle = '#3a2712'; ctx.fillRect(2,7,2,2); ctx.fillRect(12,7,2,2);
    // замок (металл)
    ctx.fillStyle = '#6e6e6e'; ctx.fillRect(6,6,4,5);
    ctx.fillStyle = '#9a9a9a'; ctx.fillRect(7,7,2,3);
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(7,8,2,2);       // скважина
  });
  TEX.chest_side = makeTex(ctx => {
    woodGrain(ctx, 0xa3712f);
    ctx.fillStyle = '#4d3416';
    ctx.fillRect(0,0,16,2); ctx.fillRect(0,14,16,2); ctx.fillRect(0,0,2,16); ctx.fillRect(14,0,2,16);
    ctx.fillRect(0,7,16,2);                                  // линия крышки
    ctx.fillStyle = '#6b4a20'; ctx.fillRect(2,2,12,5); ctx.fillRect(2,9,12,5);
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
  const mCobble    = texToMaterial(TEX.cobble);
  const mCoalOre   = texToMaterial(TEX.coal_ore);
  const mIronOre   = texToMaterial(TEX.iron_ore);
  const mCopperOre = texToMaterial(TEX.copper_ore);
  const mDiamondOre= texToMaterial(TEX.diamond_ore);
  const mGravel    = texToMaterial(TEX.gravel);
  const mObsidian  = texToMaterial(TEX.obsidian);
  const mNetherrack= texToMaterial(TEX.netherrack);
  // светопыль — яркая, не затемняется (свечение)
  const mGlowstone = (() => {
    const t = new THREE.CanvasTexture(TEX.glowstone);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return new THREE.MeshBasicMaterial({ map: t });
  })();
  const mFurSide   = texToMaterial(TEX.furnace_side);
  const mFurTop    = texToMaterial(TEX.furnace_top);
  const mFurFront  = texToMaterial(TEX.furnace_front);
  const mDoorTop   = texToMaterial(TEX.door_top);
  const mDoorBot   = texToMaterial(TEX.door_bottom);
  const mChestTop  = texToMaterial(TEX.chest_top);
  const mChestFront= texToMaterial(TEX.chest_front);
  const mChestSide = texToMaterial(TEX.chest_side);
  // листва: прозрачные «дырки», видна с обеих сторон
  const mLeaves = (() => {
    const t = new THREE.CanvasTexture(TEX.leaves);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
  })();
  // стекло: прозрачное
  const mGlass = (() => {
    const t = new THREE.CanvasTexture(TEX.glass);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return new THREE.MeshLambertMaterial({ map: t, transparent: true, opacity: 0.55, side: THREE.DoubleSide });
  })();
  // дверь: тонкая, с прозрачностью у окошка
  const mDoorTopT = (() => {
    const t = new THREE.CanvasTexture(TEX.door_top);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide });
  })();

  MATERIALS[BLOCK.GRASS]   = [mGrassSide, mGrassSide, mGrassTop, mDirt, mGrassSide, mGrassSide];
  MATERIALS[BLOCK.DIRT]    = [mDirt, mDirt, mDirt, mDirt, mDirt, mDirt];
  MATERIALS[BLOCK.STONE]   = [mStone, mStone, mStone, mStone, mStone, mStone];
  MATERIALS[BLOCK.BEDROCK] = [mBedrock, mBedrock, mBedrock, mBedrock, mBedrock, mBedrock];
  MATERIALS[BLOCK.WATER]      = [mWater, mWater, mWater, mWater, mWater, mWater];
  MATERIALS[BLOCK.WATER_FLOW] = [mWater, mWater, mWater, mWater, mWater, mWater];
  // лава: яркая (MeshBasicMaterial — не затемняется тенями/освещением, «светится»)
  const mLava = (() => {
    const t = new THREE.CanvasTexture(TEX.lava);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return new THREE.MeshBasicMaterial({ map: t });
  })();
  MATERIALS[BLOCK.LAVA]      = [mLava, mLava, mLava, mLava, mLava, mLava];
  MATERIALS[BLOCK.LAVA_FLOW] = [mLava, mLava, mLava, mLava, mLava, mLava];
  // огонь: прозрачный билборд, светится, виден с обеих сторон
  const mFire = (() => {
    const t = new THREE.CanvasTexture(TEX.fire);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.25, side: THREE.DoubleSide, depthWrite: false });
  })();
  MATERIALS[BLOCK.FIRE] = [mFire, mFire, mFire, mFire, mFire, mFire];
  // портал — полупрозрачный фиолетовый, светится (Basic), виден с обеих сторон
  const mPortal = (() => {
    const t = new THREE.CanvasTexture(TEX.portal);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false });
  })();
  MATERIALS[BLOCK.NETHER_PORTAL] = [mPortal, mPortal, mPortal, mPortal, mPortal, mPortal];
  MATERIALS[BLOCK.SAND]    = [mSand, mSand, mSand, mSand, mSand, mSand];
  MATERIALS[BLOCK.WOOD]    = [mWoodSide, mWoodSide, mWoodTop, mWoodTop, mWoodSide, mWoodSide];
  MATERIALS[BLOCK.LEAVES]  = [mLeaves, mLeaves, mLeaves, mLeaves, mLeaves, mLeaves];
  MATERIALS[BLOCK.PLANKS]  = [mPlanks, mPlanks, mPlanks, mPlanks, mPlanks, mPlanks];
  MATERIALS[BLOCK.CRAFTING_TABLE] = [mCraftSide, mCraftSide, mCraftTop, mPlanks, mCraftSide, mCraftSide];
  MATERIALS[BLOCK.COBBLESTONE] = [mCobble, mCobble, mCobble, mCobble, mCobble, mCobble];
  MATERIALS[BLOCK.COAL_ORE] = [mCoalOre, mCoalOre, mCoalOre, mCoalOre, mCoalOre, mCoalOre];
  MATERIALS[BLOCK.IRON_ORE] = [mIronOre, mIronOre, mIronOre, mIronOre, mIronOre, mIronOre];
  MATERIALS[BLOCK.COPPER_ORE] = [mCopperOre, mCopperOre, mCopperOre, mCopperOre, mCopperOre, mCopperOre];
  MATERIALS[BLOCK.DIAMOND_ORE] = [mDiamondOre, mDiamondOre, mDiamondOre, mDiamondOre, mDiamondOre, mDiamondOre];
  MATERIALS[BLOCK.GRAVEL] = [mGravel, mGravel, mGravel, mGravel, mGravel, mGravel];
  MATERIALS[BLOCK.OBSIDIAN] = [mObsidian, mObsidian, mObsidian, mObsidian, mObsidian, mObsidian];
  MATERIALS[BLOCK.NETHERRACK] = [mNetherrack, mNetherrack, mNetherrack, mNetherrack, mNetherrack, mNetherrack];
  MATERIALS[BLOCK.GLOWSTONE] = [mGlowstone, mGlowstone, mGlowstone, mGlowstone, mGlowstone, mGlowstone];
  MATERIALS[BLOCK.GLASS]   = [mGlass, mGlass, mGlass, mGlass, mGlass, mGlass];
  // печь: перед — топка (+Z), остальное булыжник
  MATERIALS[BLOCK.FURNACE] = [mFurSide, mFurSide, mFurTop, mFurTop, mFurFront, mFurSide];
  MATERIALS.FURNACE_LIT = [mFurSide, mFurSide, mFurTop, mFurTop, texToMaterial(TEX.furnace_front_lit), mFurSide];
  MATERIALS[BLOCK.DOOR_BOTTOM] = [mDoorBot, mDoorBot, mDoorBot, mDoorBot, mDoorBot, mDoorBot];
  MATERIALS[BLOCK.DOOR_TOP]    = [mDoorTopT, mDoorTopT, mDoorTopT, mDoorTopT, mDoorTopT, mDoorTopT];
  // сундук: перед — замок (+Z), верх/низ — крышка, бока — обвязка
  MATERIALS[BLOCK.CHEST]   = [mChestSide, mChestSide, mChestTop, mChestTop, mChestFront, mChestSide];
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

// Высота поверхности незерака в Аду (холмы с лавовыми низинами)
function netherHeight(wx, wz) {
  let h = 0, amp = 1, freq = 0.02, sum = 0;
  for (let o = 0; o < 3; o++) {
    h += valueNoise((wx+5000) * freq, (wz+5000) * freq) * amp;
    sum += amp; amp *= 0.5; freq *= 2;
  }
  h /= sum; // 0..1
  return Math.floor(14 + h * 22); // ~14..36 (ниже LAVA_SEA=18 -> лавовые моря)
}

// 3D-хеш для размещения руды (детерминированно, зависит от сида)
function oreHash(x, y, z) {
  let h = (x | 0) * 73856093 ^ (y | 0) * 19349663 ^ (z | 0) * 83492791 ^ Math.imul(WORLD_SEED, 2654435761);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
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

// есть ли рядом (в радиусе r) вода/низина у уровня моря — признак «возле озера»
function nearWater(wx, wz, r) {
  for (let dx = -r; dx <= r; dx += 2) for (let dz = -r; dz <= r; dz += 2) {
    if (terrainHeight(wx + dx, wz + dz) <= SEA_LEVEL) return true;
  }
  return false;
}

// Лавовые озёра: детерминированные центры на сетке LAKE_GRID.
// Озеро появляется только на суше ВОЗЛЕ воды (как просил игрок — «каменное озеро с лавой у озера»).
const LAKE_GRID = 56;
function lavaLakeHash(gx, gz) {
  let h = (gx | 0) * 2120969693 ^ (gz | 0) * 3266489917 ^ Math.imul(WORLD_SEED, 374761393);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
// вернуть центр лавового озера для данной грид-ячейки или null
function lavaLakeCenter(gx, gz) {
  if (lavaLakeHash(gx, gz) > 0.45) return null;            // ~45% грид-ячеек имеют озеро-кандидат
  // джиттер центра внутри ячейки
  const cx = gx * LAKE_GRID + Math.floor(lavaLakeHash(gx + 13, gz + 7) * LAKE_GRID);
  const cz = gz * LAKE_GRID + Math.floor(lavaLakeHash(gx + 31, gz + 91) * LAKE_GRID);
  const baseH = terrainHeight(cx, cz);
  if (baseH <= SEA_LEVEL + 1) return null;                 // центр должен быть на суше
  if (!nearWater(cx, cz, 16)) return null;                 // только ВОЗЛЕ воды
  const radius = 2 + Math.floor(lavaLakeHash(gx + 5, gz + 5) * 3); // 2..4
  return { cx, cz, baseH, radius };
}
// вписать лавовое озеро в чанк (каменная чаша + лава внутри)
function carveLavaLake(blocks, ccx, ccz) {
  const x0 = ccx * CHUNK_SIZE, z0 = ccz * CHUNK_SIZE;
  // перебрать ближние грид-ячейки, чьи озёра могут пересечь этот чанк
  const gminX = Math.floor((x0 - LAKE_GRID) / LAKE_GRID), gmaxX = Math.floor((x0 + CHUNK_SIZE) / LAKE_GRID);
  const gminZ = Math.floor((z0 - LAKE_GRID) / LAKE_GRID), gmaxZ = Math.floor((z0 + CHUNK_SIZE) / LAKE_GRID);
  const setL = (wx, wy, wz, id) => {
    const lx = wx - x0, lz = wz - z0;
    if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE) return;
    if (wy < 0 || wy >= WORLD_HEIGHT) return;
    blocks[idx(lx, wy, lz)] = id;
  };
  for (let gx = gminX; gx <= gmaxX; gx++) for (let gz = gminZ; gz <= gmaxZ; gz++) {
    const lake = lavaLakeCenter(gx, gz);
    if (!lake) continue;
    const { cx, cz, baseH, radius } = lake;
    // top — уровень поверхности земли (верхний блок земли = top-1).
    // Озеро: открытая чаша, лава доходит почти до уровня земли, сверху — ВОЗДУХ.
    const top = baseH;
    const depth = radius + 1;   // глубина чаши
    const R = radius + 1;       // внешний радиус каменной кромки
    const lavaTop = top - 1;    // верхний уровень лавы (вровень с поверхностью земли)
    for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) {
      const wx = cx + dx, wz = cz + dz;
      if (wx < x0 || wx >= x0 + CHUNK_SIZE || wz < z0 || wz >= z0 + CHUNK_SIZE) continue;
      const dist = Math.sqrt(dx*dx + dz*dz);
      if (dist > R + 0.5) continue;
      const inside = dist <= radius - 0.2;          // зона лавы
      const rim    = dist > radius - 0.2 && dist <= R + 0.5; // каменный бортик/стенки
      // глубина чаши в этой точке (чем ближе к центру — тем глубже)
      const bowlDepth = Math.max(1, Math.round(depth * (1 - dist / (R + 0.3))));
      const bottom = lavaTop - bowlDepth;           // дно чаши
      for (let y = bottom - 1; y <= top + 1; y++) {
        if (inside) {
          if (y <= bottom - 1) setL(wx, y, wz, BLOCK.STONE);     // каменное дно
          else if (y <= lavaTop) setL(wx, y, wz, BLOCK.LAVA);    // лава
          else setL(wx, y, wz, BLOCK.AIR);                       // открыто сверху
        } else if (rim) {
          // каменный бортик до уровня земли, чуть выше лавы (чтобы лава не вытекала)
          if (y <= top - 1) setL(wx, y, wz, BLOCK.STONE);
          else setL(wx, y, wz, BLOCK.AIR);
        }
      }
    }
  }
}

// ============================================================
//  Хранилище мира (чанки)
// ============================================================
// Каждое измерение хранит свой набор Map'ов состояния.
function makeDimStore() {
  return {
    chunks: new Map(),       // "cx,cz" -> { blocks:Uint8Array, mesh, dirty }
    edits: new Map(),        // "x,y,z" -> blockId
    waterLevel: new Map(),   // "x,y,z" -> уровень жидкости
    doorState: new Map(),
    furnaces: new Map(),
    chests: new Map(),
    doubleChests: new Map(),
    facing: new Map(),
  };
}

const World = {
  // активные ссылки (переключаются вместе с измерением)
  chunks: null, edits: null, waterLevel: null, doorState: null,
  furnaces: null, chests: null, doubleChests: null, facing: null,
  dim: 'overworld',                 // текущее измерение
  dims: { overworld: makeDimStore(), nether: makeDimStore() },

  // переключить активное измерение (меняет ссылки на Map'ы)
  setDimension(name) {
    this.dim = name;
    const s = this.dims[name];
    this.chunks = s.chunks; this.edits = s.edits; this.waterLevel = s.waterLevel;
    this.doorState = s.doorState; this.furnaces = s.furnaces; this.chests = s.chests;
    this.doubleChests = s.doubleChests; this.facing = s.facing;
  },

  key(cx, cz) { return cx + ',' + cz; },
  ekey(x, y, z) { return x + ',' + y + ',' + z; },

  // Уровень жидкости в ячейке: вода — источник=8/течение=1..7; лава — источник=4/течение=1..3; нет=0
  getLevel(x, y, z) {
    const b = this.getBlock(x, y, z);
    if (b === BLOCK.LAVA) return LAVA_MAX;
    if (b === BLOCK.LAVA_FLOW) return this.waterLevel.get(this.ekey(x, y, z)) || 1;
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
    if (this.dim === 'nether') return this.generateNetherChunk(cx, cz);
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
          else if (y < h - 4) {
            b = BLOCK.STONE;
            // Руды по частоте: уголь > медь > железо.
            // Уголь — самый частый: жилы ближе к поверхности + крупные глубокие залежи.
            if (y < h - 6 && oreHash(wx, y, wz) < 0.035) b = BLOCK.COAL_ORE;
            if (y < 18 && oreHash(wx + 5000, y, wz + 5000) < 0.060) b = BLOCK.COAL_ORE;
            // Медь — чуть реже угля, встречается на средней и большой глубине.
            if (y < 20 && oreHash(wx + 7000, y, wz + 7000) < 0.045) b = BLOCK.COPPER_ORE;
            // Железо — реже их обоих, только глубоко (y < 14).
            if (y > 1 && y < 14 && oreHash(wx + 1000, y, wz + 1000) < 0.024) b = BLOCK.IRON_ORE;
            // Гравий — карманы под землёй (как в Minecraft), небольшими залежами
            if (oreHash(wx + 8000, y, wz + 8000) < 0.028) b = BLOCK.GRAVEL;
            // Алмазы — редкие, но чуть чаще, в самом низу (y 1..11)
            if (y > 1 && y < 11 && oreHash(wx + 9000, y, wz + 9000) < 0.0028) b = BLOCK.DIAMOND_ORE;
            // Лавовые карманы — очень глубоко (y 2..6), реже, чем было
            if (y >= 2 && y <= 6 && oreHash(wx + 3000, y, wz + 3000) < 0.011) b = BLOCK.LAVA;
          }
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

    // ---- Лавовые озёра в каменной чаше (возле водных озёр) ----
    carveLavaLake(blocks, cx, cz);

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
        // не сажать дерево, если в основании лава/камень озера (внутри чанка)
        {
          const llx = wx - x0c, llz = wz - z0c;
          if (llx >= 0 && llx < CHUNK_SIZE && llz >= 0 && llz < CHUNK_SIZE) {
            const ground = blocks[idx(llx, Math.max(0, baseY - 1), llz)];
            if (ground === BLOCK.LAVA || ground === BLOCK.STONE || ground === BLOCK.AIR) continue;
          }
        }
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

  // --- Генерация Ада: незерак, потолок/пол из бедрока, озёра лавы, светопыль ---
  generateNetherChunk(cx, cz) {
    const blocks = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
    const LAVA_SEA = 18; // уровень лавовых озёр в Аду
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = cx * CHUNK_SIZE + lx, wz = cz * CHUNK_SIZE + lz;
        // холмистый рельеф незерака
        const h = netherHeight(wx, wz);       // высота поверхности незерака ~24..36
        for (let y = 0; y < WORLD_HEIGHT; y++) {
          let b = BLOCK.AIR;
          if (y === 0 || y >= WORLD_HEIGHT - 1) b = BLOCK.BEDROCK; // пол и потолок Ада
          else if (y < h) {
            b = BLOCK.NETHERRACK;
            // вкрапления светопыли в толще
            if (oreHash(wx + 11000, y, wz + 11000) < 0.006) b = BLOCK.GLOWSTONE;
          } else if (y <= LAVA_SEA) {
            b = BLOCK.LAVA; // лавовое море заполняет низины
          }
          blocks[idx(lx, y, lz)] = b;
        }
        // пещеры/пустоты в толще незерака (3D-шум)
        for (let y = 2; y < WORLD_HEIGHT - 2; y++) {
          if (blocks[idx(lx, y, lz)] === BLOCK.NETHERRACK && oreHash(wx + 13000, y, wz + 13000) < 0.10 && y > LAVA_SEA) {
            blocks[idx(lx, y, lz)] = BLOCK.AIR;
          }
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
    if (!transient) { this.edits.set(this.ekey(wx, wy, wz), id); if (typeof requestSave === 'function') requestSave(); }
    // уровень храним только для течения (вода/лава); иначе чистим
    if (id !== BLOCK.WATER_FLOW && id !== BLOCK.LAVA_FLOW) this.clearLevel(wx, wy, wz);
    // воздух — сбросить ориентацию
    if (id === BLOCK.AIR) this.facing.delete(this.ekey(wx, wy, wz));

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
World.setDimension('overworld'); // инициализировать активные ссылки на Map'ы

function idx(x, y, z) {
  return y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x;
}

// открыта ли дверь в данной ячейке (учитывая, что состояние хранится по нижней половине)
function isDoorOpen(x, y, z) {
  const b = World.getBlock(x, y, z);
  if (!isDoor(b)) return false;
  const by = (b === BLOCK.DOOR_TOP) ? y - 1 : y;
  const st = World.doorState.get(World.ekey(x, by, z));
  return !!(st && st.open);
}

// Тонкая AABB двери в локальных координатах [0..1] -> {x1,x2,z1,z2}.
// «front» — куда смотрит лицевая сторона; закрытая дверь — тонкая панель у стороны back,
// открытая — повёрнута на 90° вокруг петли (hinge). thickness ~0.19.
// hinge: 'left'|'right' — с какой стороны (если смотреть со стороны front) находится петля.
function doorHinge(x, y, z) {
  const b = World.getBlock(x, y, z);
  if (!isDoor(b)) return 'left';
  const by = (b === BLOCK.DOOR_TOP) ? y - 1 : y;
  const st = World.doorState.get(World.ekey(x, by, z));
  return (st && st.hinge) ? st.hinge : 'left';
}
function doorAABB(x, y, z) {
  const TH = 0.19;
  const open = isDoorOpen(x, y, z);
  const front = World.facing.get(World.ekey(x, y, z));
  const hinge = doorHinge(x, y, z);
  // ось front и его знак
  let frontAxis, frontSide;
  if (front === FACE_PX) { frontAxis='x'; frontSide=1; }
  else if (front === FACE_NX) { frontAxis='x'; frontSide=-1; }
  else if (front === FACE_PZ) { frontAxis='z'; frontSide=1; }
  else { frontAxis='z'; frontSide=-1; } // FACE_NZ или undefined -> -Z

  if (!open) {
    // Закрытая: тонкая панель в плоскости стены (перпендикулярно проходу),
    // прижата к лицевой стороне front. Полностью перекрывает проём по другой оси.
    if (frontAxis === 'z') {
      const z = (frontSide > 0) ? { z1: 1 - TH, z2: 1 } : { z1: 0, z2: TH };
      return { x1: 0, x2: 1, z1: z.z1, z2: z.z2 };
    } else {
      const x1 = (frontSide > 0) ? 1 - TH : 0;
      const x2 = (frontSide > 0) ? 1 : TH;
      return { x1, x2, z1: 0, z2: 1 };
    }
  } else {
    // Открытая: поворот на 90° вокруг петли. Панель уходит вдоль оси front,
    // прижата к стороне петли (боковой край ячейки) -> проём свободен.
    if (frontAxis === 'z') {
      // ось прохода — Z; петля на X-краю. left/right относительно взгляда вдоль front.
      // при front=+Z (смотрим в +Z): right=+X, left=-X (право от наблюдателя)
      const onPlusX = (frontSide > 0) ? (hinge === 'right') : (hinge === 'left');
      const x1 = onPlusX ? 1 - TH : 0;
      const x2 = onPlusX ? 1 : TH;
      return { x1, x2, z1: 0, z2: 1 };
    } else {
      // ось прохода — X; петля на Z-краю.
      const onPlusZ = (frontSide > 0) ? (hinge === 'left') : (hinge === 'right');
      const z1 = onPlusZ ? 1 - TH : 0;
      const z2 = onPlusZ ? 1 : TH;
      return { x1: 0, x2: 1, z1, z2 };
    }
  }
}

// ============================================================
//  Единая симуляция жидкостей (вода и лава) — модель Minecraft.
//  Вода: источник=8, течение 7..1 (до 7 клеток), бесконечный источник
//        (если у течения ≥2 соседа-источника воды — становится источником).
//  Лава: источник=4, течение 3..1 (короткая дальность), течёт медленнее.
//  Контакты вода+лава: лава-источник→ОБСИДИАН, лава-течение→БУЛЫЖНИК,
//        вода, льющаяся НА лаву сверху → КАМЕНЬ.
// ============================================================
function liquidKind(b) {
  if (b === BLOCK.WATER || b === BLOCK.WATER_FLOW) return 'water';
  if (b === BLOCK.LAVA || b === BLOCK.LAVA_FLOW) return 'lava';
  return null;
}

const LiquidSim = {
  queue: [],
  inQueue: new Set(),
  tickAcc: 0,
  waterAcc: 0, lavaAcc: 0,
  waterRate: 0.14,   // вода течёт быстро
  lavaRate: 0.55,    // лава течёт заметно медленнее
  MAX_PER_TICK: 240,
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
    const lx = x - cx * CHUNK_SIZE, lz = z - cz * CHUNK_SIZE;
    if (lx === 0) this.changedChunks.add((cx - 1) + ',' + cz);
    if (lx === CHUNK_SIZE - 1) this.changedChunks.add((cx + 1) + ',' + cz);
    if (lz === 0) this.changedChunks.add(cx + ',' + (cz - 1));
    if (lz === CHUNK_SIZE - 1) this.changedChunks.add(cx + ',' + (cz + 1));
  },

  // максимальный уровень / блоки по типу жидкости
  maxLevel(kind) { return kind === 'water' ? WATER_MAX : LAVA_MAX; },
  srcBlock(kind) { return kind === 'water' ? BLOCK.WATER : BLOCK.LAVA; },
  flowBlock(kind) { return kind === 'water' ? BLOCK.WATER_FLOW : BLOCK.LAVA_FLOW; },

  setFlow(kind, x, y, z, lvl) {
    if (lvl <= 0) {
      World.clearLevel(x, y, z);
      World.setBlock(x, y, z, BLOCK.AIR, true);
    } else {
      World.setLevel(x, y, z, lvl);
      World.setBlock(x, y, z, this.flowBlock(kind), true);
    }
    this.markChunk(x, z);
    this.touchAround(x, y, z);
  },

  // Контакт лавы с водой -> затвердевание (как в Minecraft).
  // Возвращает true, если ячейка превратилась в камень/обсидиан/булыжник.
  contactSolidify(x, y, z) {
    const here = World.getBlock(x, y, z);
    if (!isLavaLiquid(here)) return false;
    const dirs = [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,1,0]];
    let waterNear = false;
    for (const [dx,dy,dz] of dirs) if (isWaterLiquid(World.getBlock(x+dx,y+dy,z+dz))) { waterNear = true; break; }
    if (!waterNear) return false;
    World.clearLevel(x, y, z);
    // лава-источник + вода -> ОБСИДИАН; лава-течение + вода -> БУЛЫЖНИК
    World.setBlock(x, y, z, (here === BLOCK.LAVA) ? BLOCK.OBSIDIAN : BLOCK.COBBLESTONE);
    this.markChunk(x, z);
    this.touchAround(x, y, z);
    playSound('splash');
    return true;
  },

  // есть ли поблизости горючий блок (радиус 2 по горизонтали, 1 по высоте)?
  _flammableNear(x, y, z) {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -2; dx <= 2; dx++)
        for (let dz = -2; dz <= 2; dz++)
          if (isFlammable(World.getBlock(x+dx, y+dy, z+dz))) return true;
    return false;
  },
  // Лава поджигает близкие горючие блоки: ищет вокруг (радиус ~2 по горизонтали, 1 по высоте)
  // горючий блок, рядом с которым есть воздух, и ставит туда огонь.
  _igniteNear(x, y, z) {
    for (let tries = 0; tries < 4; tries++) {
      const dx = (Math.random()*5|0) - 2; // -2..2
      const dz = (Math.random()*5|0) - 2;
      const dy = (Math.random()*3|0) - 1; // -1..1
      const fx = x+dx, fy = y+dy, fz = z+dz;
      if (!isFlammable(World.getBlock(fx, fy, fz))) continue;
      // зажечь воздух СВЕРХУ или сбоку от горючего блока
      const spots = [[fx,fy+1,fz],[fx+1,fy,fz],[fx-1,fy,fz],[fx,fy,fz+1],[fx,fy,fz-1]];
      for (const [ax,ay,az] of spots) {
        if (World.getBlock(ax,ay,az) === BLOCK.AIR) { FireSim.add(ax, ay, az); return; }
      }
    }
  },

  // желаемый уровень течения исходя из питания соседями (kind-специфично)
  desiredLevel(kind, x, y, z) {
    const src = this.srcBlock(kind), flow = this.flowBlock(kind);
    const maxL = this.maxLevel(kind);
    // питание сверху -> «падающее» течение (полный «почти-источник», вбок не растекается)
    const above = World.getBlock(x, y + 1, z);
    if (above === src || above === flow) return { level: maxL - 1, falling: true };
    let best = 0;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dx, dz] of dirs) {
      const nx = x + dx, nz = z + dz;
      const nb = World.getBlock(nx, y, nz);
      if (nb === src) {
        best = Math.max(best, maxL - 1);
      } else if (nb === flow) {
        // падающий сосед (под ним есть куда стекать вниз) вбок НЕ питает —
        // иначе вода переливается через ямку вместо того, чтобы уходить в неё.
        if (this._canDrainDown(kind, nx, y, nz)) continue;
        best = Math.max(best, World.getLevel(nx, y, nz) - 1);
      }
    }
    return { level: best, falling: false };
  },

  // Бесконечный источник воды: течение, у которого ≥2 соседа-источника воды,
  // само становится источником (классика Minecraft).
  tryFormInfiniteSource(x, y, z) {
    if (World.getBlock(x, y, z) !== BLOCK.WATER_FLOW) return false;
    let srcN = 0;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dx, dz] of dirs) if (World.getBlock(x+dx, y, z+dz) === BLOCK.WATER) srcN++;
    if (srcN >= 2) {
      World.clearLevel(x, y, z);
      World.setBlock(x, y, z, BLOCK.WATER, true);
      this.markChunk(x, z);
      this.touchAround(x, y, z);
      return true;
    }
    return false;
  },

  // Может ли жидкость данного вида занять ячейку (воздух или своё течение меньшего уровня)
  _canFlowInto(kind, x, y, z) {
    const b = World.getBlock(x, y, z);
    if (b === BLOCK.AIR) return true;
    if (b === this.flowBlock(kind)) return true;
    // другая жидкость — пройти можно (для поиска дыры), но не своя-источник/твёрдое
    return false;
  },
  // может ли жидкость в (x,y,z) стекать ВНИЗ (под ней пустота или своё течение)?
  // Такая клетка — «падающая» (сток): уходит вниз и НЕ питает горизонтальных соседей,
  // поэтому вода в ямку утекает, а не переливается дальше по каналу.
  _canDrainDown(kind, x, y, z) {
    const below = World.getBlock(x, y - 1, z);
    if (below === BLOCK.AIR) return true;
    if (below === this.flowBlock(kind)) return true; // столб ещё течёт вниз
    return false;
  },
  // Глубина поиска «дыры» (как в Minecraft — до 5 клеток по горизонтали)
  // Поиск кратчайшего расстояния до дыры (ячейки, где есть провал вниз) в направлении (dx,dz).
  // Возвращает расстояние 1..MAX или Infinity, если дыры нет.
  _distanceToHole(kind, x, y, z, dx, dz) {
    const MAX = 5;
    for (let d = 1; d <= MAX; d++) {
      const cx = x + dx * d, cz = z + dz * d;
      // путь должен оставаться проходимым по горизонтали
      if (!this._canFlowInto(kind, cx, y, cz)) return Infinity;
      // под этой ячейкой провал? тогда это «дыра»
      const below = World.getBlock(cx, y - 1, cz);
      if (below === BLOCK.AIR || this._canFlowInto(kind, cx, y - 1, cz) && below !== this.srcBlock(kind)) {
        if (below === BLOCK.AIR) return d;
      }
    }
    return Infinity;
  },
  spreadSides(kind, x, y, z, lvl) {
    const next = lvl - 1;
    if (next <= 0) return;
    const flow = this.flowBlock(kind);
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

    // --- Поиск кратчайшего пути к «дыре» (модель воды Minecraft) ---
    // Если хотя бы в одном направлении вода может стечь в провал — она течёт
    // ТОЛЬКО в направление(я) с минимальным расстоянием до дыры (не разливается во все стороны).
    let minDist = Infinity;
    const dist = dirs.map(([dx, dz]) => {
      const nx = x + dx, nz = z + dz;
      // направление доступно только если соседняя ячейка свободна для затекания
      if (!this._canFlowInto(kind, nx, y, nz) && !(isLiquid(World.getBlock(nx,y,nz)) && liquidKind(World.getBlock(nx,y,nz)) !== kind)) return Infinity;
      const dd = this._distanceToHole(kind, x, y, z, dx, dz);
      if (dd < minDist) minDist = dd;
      return dd;
    });

    for (let i = 0; i < dirs.length; i++) {
      const [dx, dz] = dirs[i];
      // если есть достижимая дыра — растекаемся только в кратчайшие направления
      if (minDist !== Infinity && dist[i] !== minDist) continue;
      const nx = x + dx, nz = z + dz;
      const nb = World.getBlock(nx, y, nz);
      if (nb === BLOCK.AIR) {
        this.setFlow(kind, nx, y, nz, next);
      } else if (isLiquid(nb) && liquidKind(nb) !== kind) {
        // встретили другую жидкость — пометить для затвердевания
        this.touchAround(nx, y, nz);
      } else if (nb === flow && World.getLevel(nx, y, nz) < next) {
        World.setLevel(nx, y, nz, next);
        this.markChunk(nx, nz);
        this.touchAround(nx, y, nz);
      }
    }
  },

  step(kind, x, y, z) {
    const src = this.srcBlock(kind), flow = this.flowBlock(kind), maxL = this.maxLevel(kind);
    const here = World.getBlock(x, y, z);

    // пустая ячейка — может заполниться от питания
    if (here === BLOCK.AIR) {
      const d = this.desiredLevel(kind, x, y, z);
      if (d.level > 0) this.setFlow(kind, x, y, z, d.level);
      return;
    }

    // лава, соприкоснувшаяся с водой сбоку/сверху — затвердевает
    if (kind === 'lava' && this.contactSolidify(x, y, z)) return;

    // лава поджигает горючие блоки рядом (как в Minecraft): иногда зажигает воздух
    // у горючих блоков в радиусе 1-2 клеток вокруг лавы.
    if (kind === 'lava' && this._flammableNear(x, y, z)) {
      if (Math.random() < 0.5) this._igniteNear(x, y, z);
      // держим эту клетку лавы «активной», чтобы поджоги продолжались
      this.enqueue(x, y, z);
    }

    // лава над водой: если ПОД лавой вода — лава затвердевает
    // (источник -> обсидиан, течение -> булыжник; вода под ней превращается в камень)
    if (kind === 'lava' && (here === src || here === flow)) {
      const below = World.getBlock(x, y - 1, z);
      if (isWaterLiquid(below)) {
        World.clearLevel(x, y, z);
        World.setBlock(x, y, z, (here === BLOCK.LAVA) ? BLOCK.OBSIDIAN : BLOCK.COBBLESTONE);
        this.markChunk(x, z); this.touchAround(x, y, z);
        playSound('splash');
        return;
      }
    }

    // вода, льющаяся НА лаву сверху, превращает лаву под собой в камень/обсидиан
    if (kind === 'water' && (here === src || here === flow)) {
      const below = World.getBlock(x, y - 1, z);
      if (below === BLOCK.LAVA) { World.clearLevel(x, y-1, z); World.setBlock(x, y-1, z, BLOCK.OBSIDIAN); this.markChunk(x,z); this.touchAround(x,y-1,z); playSound('splash'); }
      else if (below === BLOCK.LAVA_FLOW) { World.clearLevel(x, y-1, z); World.setBlock(x, y-1, z, BLOCK.STONE); this.markChunk(x,z); this.touchAround(x,y-1,z); playSound('splash'); }
    }

    // источник: льёт вниз и растекается вбок
    if (here === src) {
      if (World.getBlock(x, y - 1, z) === BLOCK.AIR) this.setFlow(kind, x, y - 1, z, maxL - 1);
      else this.spreadSides(kind, x, y, z, maxL);
      return;
    }

    // течение
    if (here === flow) {
      // попытка стать бесконечным источником (только вода)
      if (kind === 'water' && this.tryFormInfiniteSource(x, y, z)) return;
      const d = this.desiredLevel(kind, x, y, z);
      if (d.level <= 0) { this.setFlow(kind, x, y, z, 0); return; } // нет питания -> исчезает
      const cur = World.getLevel(x, y, z);
      if (d.level !== cur) {
        World.setLevel(x, y, z, d.level);
        this.markChunk(x, z);
        this.touchAround(x, y, z);
      }
      // под ячейкой воздух -> падать вниз (приоритет)
      if (World.getBlock(x, y - 1, z) === BLOCK.AIR) { this.setFlow(kind, x, y - 1, z, maxL - 1); return; }
      if (d.falling) return; // падающее течение вбок не растекается
      // если эта клетка — сток в ямку (под ней столб ещё течёт вниз), она уходит вниз
      // и НЕ разливается по сторонам -> вода не переливается за ямку
      if (this._canDrainDown(kind, x, y, z)) return;
      this.spreadSides(kind, x, y, z, d.level);
    }
  },

  update(dt) {
    // вода и лава тикают с разной частотой; собираем «созревшие» ячейки
    this.waterAcc += dt; this.lavaAcc += dt;
    const doWater = this.waterAcc >= this.waterRate;
    const doLava = this.lavaAcc >= this.lavaRate;
    if (!doWater && !doLava) return;
    if (doWater) this.waterAcc = 0;
    if (doLava) this.lavaAcc = 0;
    if (this.queue.length === 0) return;

    // переносим текущую очередь, обрабатываем подходящие по типу/частоте
    const pending = this.queue;
    this.queue = [];
    const deferred = [];
    let processed = 0;
    for (const k of pending) {
      this.inQueue.delete(k);
      if (processed >= this.MAX_PER_TICK) { deferred.push(k); continue; }
      const [x, y, z] = k.split(',').map(Number);
      const b = World.getBlock(x, y, z);
      let kind = liquidKind(b);
      if (kind === null) {
        // воздух у границы жидкости — определим тип по соседям
        const nbs = [World.getBlock(x+1,y,z),World.getBlock(x-1,y,z),World.getBlock(x,y,z+1),World.getBlock(x,y,z-1),World.getBlock(x,y+1,z)];
        for (const nb of nbs) { const kk = liquidKind(nb); if (kk) { kind = kk; break; } }
      }
      if (kind === null) continue;
      const ready = kind === 'water' ? doWater : doLava;
      if (!ready) { deferred.push(k); this.inQueue.add(k); continue; }
      this.step(kind, x, y, z);
      processed++;
    }
    // вернуть необработанные обратно в очередь
    for (const k of deferred) { if (!this.inQueue.has(k)) { this.inQueue.add(k); } this.queue.push(k); }

    if (this.changedChunks.size > 0) {
      for (const ck of this.changedChunks) { const [cx, cz] = ck.split(',').map(Number); World.markDirty(cx, cz); }
      this.changedChunks.clear();
    }
  },
};

// Обратная совместимость со старыми вызовами WaterSim/LavaSim.touchAround(...)
const WaterSim = { touchAround: (x,y,z)=>LiquidSim.touchAround(x,y,z), get queue(){return LiquidSim.queue;}, get inQueue(){return LiquidSim.inQueue;}, update:()=>{} };
const LavaSim  = { touchAround: (x,y,z)=>LiquidSim.touchAround(x,y,z), get queue(){return LiquidSim.queue;}, get inQueue(){return LiquidSim.inQueue;}, get changedChunks(){return LiquidSim.changedChunks;}, update:()=>{} };

// ============================================================
//  Огонь — горит на горючих блоках, распространяется, гаснет
// ============================================================
const FLAMMABLE = {};
[BLOCK.WOOD, BLOCK.PLANKS, BLOCK.LEAVES, BLOCK.CRAFTING_TABLE, BLOCK.CHEST,
 BLOCK.DOOR_BOTTOM, BLOCK.DOOR_TOP].forEach(b => FLAMMABLE[b] = true);
function isFlammable(b) { return !!FLAMMABLE[b]; }

const FireSim = {
  fires: new Map(),   // "x,y,z" -> возраст (сек)
  tickAcc: 0, tickRate: 0.5,

  add(x, y, z) {
    if (World.getBlock(x, y, z) !== BLOCK.AIR) return;
    // огонь держится только если под ним или рядом есть горючее
    World.setBlock(x, y, z, BLOCK.FIRE, true);
    this.fires.set(x+','+y+','+z, 0);
    rebuildAround(x, z);
  },
  remove(x, y, z) {
    const k = x+','+y+','+z;
    if (this.fires.has(k)) this.fires.delete(k);
    if (World.getBlock(x, y, z) === BLOCK.FIRE) { World.setBlock(x, y, z, BLOCK.AIR, true); rebuildAround(x, z); }
  },
  hasFuel(x, y, z) {
    const dirs = [[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,1,0]];
    for (const [dx,dy,dz] of dirs) if (isFlammable(World.getBlock(x+dx,y+dy,z+dz))) return true;
    return false;
  },
  update(dt) {
    this.tickAcc += dt;
    if (this.tickAcc < this.tickRate) return;
    this.tickAcc = 0;
    if (this.fires.size === 0) return;
    const toRemove = [];
    const toBurn = [];
    for (const [k, age] of this.fires) {
      const [x,y,z] = k.split(',').map(Number);
      if (World.getBlock(x,y,z) !== BLOCK.FIRE) { toRemove.push([x,y,z]); continue; }
      const newAge = age + this.tickRate;
      this.fires.set(k, newAge);
      // нет топлива рядом — гаснет
      if (!this.hasFuel(x,y,z)) { if (newAge > 1.5) toRemove.push([x,y,z]); continue; }
      // шанс распространиться на соседние горючие блоки (создавая огонь в воздухе над ними)
      if (Math.random() < 0.25) {
        const dirs = [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,1,0],[0,-1,0]];
        const [dx,dy,dz] = dirs[(Math.random()*dirs.length)|0];
        const fx=x+dx, fy=y+dy, fz=z+dz;
        if (isFlammable(World.getBlock(fx,fy,fz))) {
          // зажечь воздух над горючим блоком
          if (World.getBlock(fx,fy+1,fz) === BLOCK.AIR) toBurn.push([fx,fy+1,fz]);
        }
      }
      // шанс сжечь горючий блок под огнём (превратить в воздух) при долгом горении
      if (newAge > 2 && Math.random() < 0.3) {
        const bx=x, by=y-1, bz=z;
        if (isFlammable(World.getBlock(bx,by,bz))) {
          World.setBlock(bx,by,bz,BLOCK.AIR);
          rebuildAround(bx,bz);
          scheduleLeafDecayAround(bx,by,bz);
        }
      }
      // огонь живёт ограниченное время
      if (newAge > 8 + Math.random()*6) toRemove.push([x,y,z]);
    }
    for (const [x,y,z] of toBurn) this.add(x,y,z);
    for (const [x,y,z] of toRemove) this.remove(x,y,z);
  },
  clear() { this.fires.clear(); this.tickAcc = 0; },
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

// ============================================================
//  Ориентация блоков (facing)
// ============================================================
// Ориентация = индекс грани (в системе FACES.mat: 0:+X 1:-X 2:+Y 3:-Y 4:+Z 5:-Z),
// на которую смотрит "перед" блока. По умолчанию перед = +Z (mat 4).
// Для каждого индекса задаём перестановку материалов:
//   newMat[physicalFace] = baseMat[ откуда взять текстуру ]
// Так "передняя" текстура (baseMat[4]) оказывается на нужной физической грани.
const FACE_PX=0, FACE_NX=1, FACE_PY=2, FACE_NY=3, FACE_PZ=4, FACE_NZ=5;

// Перестановки для 6 направлений "переда". perm[phys] = индекс исходной грани.
// Базовые грани: top=2(+Y) bottom=3(-Y) front=4(+Z) back=5(-Z) right=0(+X) left=1(-X)
const ORIENT_PERM = {
  // перед смотрит на +Z (по умолчанию) — без изменений
  [FACE_PZ]: [0,1,2,3,4,5],
  // перед смотрит на -Z: поворот на 180° вокруг Y -> меняем +X<->-X и +Z<->-Z
  [FACE_NZ]: [1,0,2,3,5,4],
  // перед на +X: поворот на -90° вокруг Y. front(+Z)->+X
  [FACE_PX]: [4,5,2,3,1,0],
  // перед на -X: поворот на +90° вокруг Y. front(+Z)->-X
  [FACE_NX]: [5,4,2,3,0,1],
  // перед вверх (+Y): наклон. front(+Z)->+Y, top(+Y)->-Z и т.д.
  [FACE_PY]: [0,1,4,5,3,2],
  // перед вниз (-Y)
  [FACE_NY]: [0,1,5,4,2,3],
};

// Перестановки для брёвен: ось определяется значением front (FACE_PX=ось X, FACE_PY=ось Y, FACE_PZ=ось Z)
const LOG_PERM = {
  [FACE_PY]: [0,1,2,3,4,5],   // ось Y (вертикально) — по умолчанию
  [FACE_PX]: [2,3,0,1,4,5],   // ось X — кольца на ±X
  [FACE_PZ]: [0,1,4,5,2,3],   // ось Z — кольца на ±Z
};

// Повернуть произвольный массив материалов по ориентации front (универсальный куб)
function orientedMaterialsFrom(base, front, isLog) {
  if (front === undefined) return base;
  const perm = isLog ? (LOG_PERM[front] || LOG_PERM[FACE_PY]) : ORIENT_PERM[front];
  if (!perm) return base;
  return [base[perm[0]], base[perm[1]], base[perm[2]], base[perm[3]], base[perm[4]], base[perm[5]]];
}
// Повёрнутый массив материалов для блока id и ориентации front
function orientedMaterials(id, front) {
  return orientedMaterialsFrom(MATERIALS[id], front, id === BLOCK.WOOD);
}

// Какие блоки ориентируемые и как.
// 'log' — ориентируется по оси (вертикально/горизонтально), 'horizontal' — только 4 стороны,
// 'full' — по любой из 6 граней.
function orientKind(id) {
  if (id === BLOCK.WOOD) return 'log';
  if (id === BLOCK.FURNACE || id === BLOCK.CHEST || id === BLOCK.CRAFTING_TABLE) return 'horizontal';
  // остальные полные блоки тоже ориентируем «как смотришь» для эффекта
  return 'full';
}

// Вычислить ориентацию-перед при установке, исходя из направления взгляда игрока
// и грани, на которую кликнули. dir — вектор взгляда (нормализован не обязательно).
function computePlaceFront(id, lookDir) {
  const kind = orientKind(id);
  const ax = Math.abs(lookDir.x), ay = Math.abs(lookDir.y), az = Math.abs(lookDir.z);

  if (kind === 'log') {
    // бревно ориентируется вдоль оси взгляда (доминирующая ось)
    if (ay >= ax && ay >= az) return FACE_PY;        // вертикально (ось Y)
    if (ax >= az) return FACE_PX;                     // ось X
    return FACE_PZ;                                   // ось Z
  }

  if (kind === 'horizontal') {
    // только горизонтальный «перед» — к игроку (противоположно взгляду)
    if (ax >= az) return lookDir.x > 0 ? FACE_NX : FACE_PX;
    return lookDir.z > 0 ? FACE_NZ : FACE_PZ;
  }

  // full: перед направлен противоположно взгляду (грань «к игроку»)
  if (ay >= ax && ay >= az) return lookDir.y > 0 ? FACE_NY : FACE_PY;
  if (ax >= az) return lookDir.x > 0 ? FACE_NX : FACE_PX;
  return lookDir.z > 0 ? FACE_NZ : FACE_PZ;
}

// поверхность воды в ячейке (0..1) с учётом уровня; полная если сверху вода
function waterSurface(x, y, z) {
  const b = World.getBlock(x, y, z);
  if (!isWaterLiquid(b)) return 0;
  if (isWaterLiquid(World.getBlock(x, y + 1, z))) return 1;
  const lvl = World.getLevel(x, y, z);
  return 0.12 + (lvl / WATER_MAX) * 0.86;
}
// поверхность любой жидкости (вода или лава) в ячейке (0..1)
function liquidSurface(x, y, z) {
  const b = World.getBlock(x, y, z);
  if (!isLiquid(b)) return 0;
  const lava = isLavaLiquid(b);
  const above = World.getBlock(x, y + 1, z);
  const sameAbove = lava ? isLavaLiquid(above) : isWaterLiquid(above);
  if (sameAbove) return 1;
  const lvl = World.getLevel(x, y, z);
  const mx = lava ? LAVA_MAX : WATER_MAX;
  return lava ? (0.25 + (lvl / mx) * 0.7) : (0.12 + (lvl / mx) * 0.86);
}

// какие блоки вообще могут иметь ориентацию (для пропуска лишних строковых ключей в мешере)
const CAN_ORIENT = {};
[BLOCK.WOOD, BLOCK.FURNACE, BLOCK.CHEST, BLOCK.CRAFTING_TABLE,
 BLOCK.GRASS, BLOCK.DIRT, BLOCK.STONE, BLOCK.SAND, BLOCK.PLANKS,
 BLOCK.COBBLESTONE, BLOCK.GLASS, BLOCK.LEAVES, BLOCK.COAL_ORE,
 BLOCK.IRON_ORE, BLOCK.COPPER_ORE].forEach(b => CAN_ORIENT[b] = true);

function buildChunkMesh(c) {
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
          if (!buf) { buf = { positions: [], normals: [], uvs: [], indices: [], water:false }; byMat.set(mi, buf); }
          const ab = doorAABB(wx, y, wz);
          const x1=ab.x1, x2=ab.x2, z1=ab.z1, z2=ab.z2;
          const addQuad = (p, nrm) => {
            const base = buf.positions.length/3;
            for (const v of p){ buf.positions.push(lx+v[0], y+v[1], lz+v[2]); buf.normals.push(nrm[0],nrm[1],nrm[2]); }
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

        // ---- Огонь: пара перекрещенных плоскостей (билборд-крест) ----
        if (b === BLOCK.FIRE) {
          const mat = MATERIALS[BLOCK.FIRE][0];
          const mi = getMatIndex(mat);
          let buf = byMat.get(mi);
          if (!buf) { buf = { positions: [], normals: [], uvs: [], indices: [], water:false, fire:true }; byMat.set(mi, buf); }
          const addQuad = (p) => {
            const base = buf.positions.length/3;
            for (const v of p){ buf.positions.push(lx+v[0], y+v[1], lz+v[2]); buf.normals.push(0,1,0); }
            buf.uvs.push(0,0,1,0,1,1,0,1);
            buf.indices.push(base,base+1,base+2,base,base+2,base+3);
          };
          // два диагональных «полотна» пламени
          addQuad([[0.08,0,0.08],[0.92,0,0.92],[0.92,1,0.92],[0.08,1,0.08]]);
          addQuad([[0.92,0,0.08],[0.08,0,0.92],[0.08,1,0.92],[0.92,1,0.08]]);
          continue;
        }

        // ---- Портал в Ад: тонкая «панель» (как стекло), а не целый блок ----
        if (b === BLOCK.NETHER_PORTAL) {
          const mat = MATERIALS[BLOCK.NETHER_PORTAL][0];
          const mi = getMatIndex(mat);
          let buf = byMat.get(mi);
          if (!buf) { buf = { positions: [], normals: [], uvs: [], indices: [], water:false }; byMat.set(mi, buf); }
          // ось панели: вдоль X (порталы/обсидиан по ±X) -> тонкая по Z; иначе тонкая по X
          const nbX = World.getBlock(wx+1,y,wz)===BLOCK.NETHER_PORTAL || World.getBlock(wx-1,y,wz)===BLOCK.NETHER_PORTAL ||
                      World.getBlock(wx+1,y,wz)===BLOCK.OBSIDIAN || World.getBlock(wx-1,y,wz)===BLOCK.OBSIDIAN;
          const TH = 0.12;
          const addQuad = (p, nrm) => {
            const base = buf.positions.length/3;
            for (const v of p){ buf.positions.push(lx+v[0], y+v[1], lz+v[2]); buf.normals.push(nrm[0],nrm[1],nrm[2]); }
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
        const blockMats = (front !== undefined && MATERIALS[b])
          ? orientedMaterialsFrom(baseMats, front, b === BLOCK.WOOD) : baseMats;

        // высота поверхности жидкости (0..1) по уровню; если сверху та же жидкость — полная
        let waterTop = 1;
        if (liquid) {
          const above = World.getBlock(wx, y + 1, wz);
          const sameAbove = lava ? isLavaLiquid(above) : isWaterLiquid(above);
          if (sameAbove) {
            waterTop = 1; // жидкость под жидкостью — полный куб
          } else {
            const lvl = World.getLevel(wx, y, wz);
            const mx = lava ? LAVA_MAX : WATER_MAX;
            waterTop = lava ? (0.25 + (lvl / mx) * 0.7) : (0.12 + (lvl / mx) * 0.86);
          }
        }

        for (const f of FACES) {
          const nb = World.getBlock(wx + f.dir[0], y + f.dir[1], wz + f.dir[2]);
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
            if (!isTransparent(nb)) continue;
            // между двумя блоками листвы грань не рисуем (избегаем двойных граней)
            if (b === BLOCK.LEAVES && nb === BLOCK.LEAVES) continue;
            if (b === BLOCK.NETHER_PORTAL && nb === BLOCK.NETHER_PORTAL) continue;
            if (b === BLOCK.GLASS && nb === BLOCK.GLASS) continue;
          }
          const material = blockMats[f.mat];
          const mi = getMatIndex(material);
          let buf = byMat.get(mi);
          if (!buf) { buf = { positions: [], normals: [], uvs: [], indices: [], water: liquid }; byMat.set(mi, buf); }
          const base = buf.positions.length / 3;
          for (const cv of f.corners) {
            // у жидкости верхние вершины опускаем до уровня поверхности
            const vy = liquid && cv[1] === 1 ? y + waterTop : y + cv[1];
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
    if (SHADOWS_ON && !buf.water) { mesh.castShadow = true; mesh.receiveShadow = true; }
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

// Тени (по умолчанию включены, настраивается)
let SHADOWS_ON = (localStorage.getItem('minicraft_shadows') ?? '1') === '1';
renderer.shadowMap.enabled = SHADOWS_ON;
renderer.shadowMap.type = THREE.PCFShadowMap;
// КЛЮЧЕВАЯ ОПТИМИЗАЦИЯ: не пересчитывать карту теней каждый кадр.
// Обновляем её вручную только когда мир/солнце реально изменились (флаг shadowNeedsUpdate).
renderer.shadowMap.autoUpdate = false;
let shadowNeedsUpdate = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, RENDER_DISTANCE * CHUNK_SIZE * 0.6, RENDER_DISTANCE * CHUNK_SIZE);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Солнце — отбрасывает тени; следует за игроком
const sun = new THREE.DirectionalLight(0xffffff, 0.85);
sun.position.set(40, 80, 30);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
const SHADOW_AREA = 48;
sun.shadow.camera.left = -SHADOW_AREA; sun.shadow.camera.right = SHADOW_AREA;
sun.shadow.camera.top = SHADOW_AREA; sun.shadow.camera.bottom = -SHADOW_AREA;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 260;
sun.shadow.bias = -0.0012;
sun.castShadow = SHADOWS_ON;
scene.add(sun);
scene.add(sun.target);
const ambient = new THREE.AmbientLight(0xffffff, 0.55);
scene.add(ambient);

// ============================================================
//  Небо: видимое солнце + облака
// ============================================================
// Солнечный диск (билборд, всегда вдалеке за игроком относительно света)
const sunDiscMat = new THREE.SpriteMaterial({
  map: (() => {
    const c = document.createElement('canvas'); c.width = 64; c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32,32,4, 32,32,32);
    g.addColorStop(0, '#fffef0'); g.addColorStop(0.5, '#fff3b0'); g.addColorStop(0.85, 'rgba(255,225,120,0.5)'); g.addColorStop(1, 'rgba(255,220,110,0)');
    x.fillStyle = g; x.fillRect(0,0,64,64);
    const t = new THREE.CanvasTexture(c); return t;
  })(),
  // depthTest:true -> солнце перекрывается блоками (не просвечивает сквозь землю)
  transparent: true, depthWrite: false, depthTest: true, fog: false,
});
const sunDisc = new THREE.Sprite(sunDiscMat);
sunDisc.scale.set(34, 34, 1);
sunDisc.renderOrder = 2; // рисуем после непрозрачной геометрии, но с проверкой глубины
scene.add(sunDisc);

// Облака: плоские белые «пиксельные» спрайты, медленно дрейфуют
const clouds = [];
const cloudGroup = new THREE.Group();
scene.add(cloudGroup);
function makeCloudTexture() {
  const c = document.createElement('canvas'); c.width = 32; c.height = 16;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  x.clearRect(0,0,32,16);
  // компактное пиксельное облако
  let s = (Math.random()*1e9)>>>0; const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  for (let i=0;i<26;i++){ const bx=2+(rnd()*26)|0, by=3+(rnd()*9)|0, w=2+(rnd()*5)|0, h=2+(rnd()*3)|0; x.fillStyle = rnd()<0.5?'rgba(255,255,255,0.92)':'rgba(238,243,250,0.88)'; x.fillRect(bx,by,w,h); }
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  return t;
}
const CLOUD_Y = 60, CLOUD_AREA = 260;
function buildClouds() {
  for (const cl of clouds) cloudGroup.remove(cl.mesh);
  clouds.length = 0;
  for (let i=0;i<16;i++){
    const mat = new THREE.MeshBasicMaterial({ map: makeCloudTexture(), transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide, opacity: 0.8 });
    const w = 26 + Math.random()*32, d = 16 + Math.random()*20;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    mesh.rotation.x = -Math.PI/2;
    mesh.position.set((Math.random()-0.5)*CLOUD_AREA, CLOUD_Y + (Math.random()-0.5)*6, (Math.random()-0.5)*CLOUD_AREA);
    cloudGroup.add(mesh);
    clouds.push({ mesh });
  }
}
buildClouds();
function updateClouds(dt) {
  // дрейф по X; облака следуют за игроком по «ячейке», чтобы всегда окружали
  cloudGroup.position.x = PLAYER.pos.x;
  cloudGroup.position.z = PLAYER.pos.z;
  for (const cl of clouds) {
    cl.mesh.position.x += dt * 1.4; // медленный ветер
    if (cl.mesh.position.x > CLOUD_AREA/2) cl.mesh.position.x -= CLOUD_AREA;
  }
}

// ============================================================
//  Анимация текстур (лава бурлит, огонь мерцает, вода переливается)
// ============================================================
let _animAcc = 0, _animFrame = 0;
function updateAnimatedTextures(dt) {
  _animAcc += dt;
  if (_animAcc < 0.12) return; // ~8 fps анимация
  _animAcc = 0;
  _animFrame++;
  // перерисовать canvas-текстуры лавы/огня/воды и пометить на обновление
  redrawLavaTex(_animFrame);
  redrawFireTex(_animFrame);
  redrawPortalTex(_animFrame);
  if (MATERIALS[BLOCK.LAVA] && MATERIALS[BLOCK.LAVA][0].map) MATERIALS[BLOCK.LAVA][0].map.needsUpdate = true;
  if (MATERIALS[BLOCK.FIRE] && MATERIALS[BLOCK.FIRE][0].map) MATERIALS[BLOCK.FIRE][0].map.needsUpdate = true;
  if (MATERIALS[BLOCK.NETHER_PORTAL] && MATERIALS[BLOCK.NETHER_PORTAL][0].map) MATERIALS[BLOCK.NETHER_PORTAL][0].map.needsUpdate = true;
}
function redrawPortalTex(frame) {
  const ctx = TEX.portal.getContext('2d');
  const seed = 2727 + frame * 53;
  pixelFillRegion(ctx, 0, 0, 16, 16, ['#7a2fb8','#5a1f9a','#9a4fd8','#3a1268','#6a2aa8'], [4,4,3,3,3], seed);
  let s = (seed*2246822519)>>>0; const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  ctx.fillStyle = '#c79cff';
  for (let i=0;i<5;i++) ctx.fillRect((rnd()*15)|0,(rnd()*15)|0,1,1);
}
function redrawLavaTex(frame) {
  const ctx = TEX.lava.getContext('2d');
  const seed = 6161 + frame * 37;
  pixelFillRegion(ctx, 0, 0, 16, 16, ['#d83a10','#b82c08','#e85a18','#a02404'], [5,4,3,3], seed);
  let s = (seed*2654435761)>>>0; const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  ctx.fillStyle = '#ffb030';
  for (let i=0;i<5;i++) ctx.fillRect((rnd()*14)|0,(rnd()*14)|0,2,2);
  ctx.fillStyle = '#ffe070';
  for (let i=0;i<3;i++) ctx.fillRect((rnd()*15)|0,(rnd()*15)|0,1,1);
  ctx.fillStyle = '#6a1404';
  ctx.fillRect(0, (frame*3)%16, 16, 1);
}
function redrawFireTex(frame) {
  const ctx = TEX.fire.getContext('2d');
  ctx.clearRect(0,0,16,16);
  const j = (frame % 3) - 1; // лёгкое колебание языков
  const layer = (color, pts) => { ctx.fillStyle = color; for (const [gx,gy,w,h] of pts) ctx.fillRect(gx+ (Math.abs(gy-16)<8?j:0),gy,w,h); };
  layer('#d8400e', [[3,9,10,7],[4,6,8,4],[6,3,4,4],[7,1,2,3]]);
  layer('#ff8a20', [[5,10,6,6],[5,7,6,3],[6,4,4,3],[7,2,2,2]]);
  layer('#ffd24a', [[6,11,4,5],[7,8,2,3],[7,5,2,2]]);
  layer('#fff0a0', [[7,12,2,3]]);
}

function setShadows(on) {
  SHADOWS_ON = on;
  localStorage.setItem('minicraft_shadows', on ? '1' : '0');
  renderer.shadowMap.enabled = on;
  sun.castShadow = on;
  // компенсируем яркость: с тенями солнце сильнее, амбиент слабее
  sun.intensity = on ? 0.9 : 0.85;
  ambient.intensity = on ? 0.5 : 0.55;
  // пометить все материалы на пересборку теней
  scene.traverse(o => { if (o.material) { if (Array.isArray(o.material)) o.material.forEach(m=>m.needsUpdate=true); else o.material.needsUpdate=true; } });
  for (const c of World.chunks.values()) c.dirty = true; // перестроить меши с тенями
  shadowNeedsUpdate = true;
}

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
  hp: 20,            // здоровье (0..20 = 10 сердец)
  maxHp: 20,
  hunger: 20,        // голод (0..20 = 10 кусков)
  maxHunger: 20,
  exhaustion: 0,     // накопитель истощения -> расход голода
  regenTimer: 0,
  starveTimer: 0,
  damageFlash: 0,    // вспышка урона на экране
  burnTimer: 0,      // таймер горения (лава/огонь)
  lavaTick: 0,
  fireTick: 0,
  dead: false,       // мёртв (показан экран смерти)
  inLiquid: false,
  riding: null,      // лодка, в которой плывём
  armor: { helmet: null, chestplate: null, leggings: null, boots: null }, // надетая броня
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
    // очистить оба измерения
    World.dims.overworld = makeDimStore();
    World.dims.nether = makeDimStore();
    World.setDimension('overworld');
    PLAYER.armor = { helmet: null, chestplate: null, leggings: null, boots: null };
    openFurnacePos = null;
    openChestPos = null;
    // очистить сущности
    for (const d of drops) { scene.remove(d.mesh); }
    drops.length = 0;
    for (const s of fallingSand) { scene.remove(s.mesh); }
    fallingSand.length = 0;
    sandCheckQueue.length = 0; sandInQueue.clear();
    LiquidSim.queue.length = 0; LiquidSim.inQueue.clear(); LiquidSim.changedChunks.clear();
    FireSim.clear();
    leafDecay.length = 0; leafDecaySet.clear();
    // свиньи
    for (const p of mobs) scene.remove(p.mesh);
    mobs.length = 0;
    for (const b of boats) scene.remove(b.mesh);
    boats.length = 0;
    PLAYER.riding = null;
    PLAYER.dead = false;
    document.getElementById('deathScreen').classList.remove('on');
    mobSpawnTimer = 4;
    // инвентарь / крафт
    for (let i = 0; i < TOTAL_SLOTS; i++) slots[i] = null;
    for (let i = 0; i < craftSlots.length; i++) craftSlots[i] = null;
    cursorItem = null; craftResult = null;
    discovered = new Set();
    activeSlot = 0;
    PLAYER.vel.set(0, 0, 0);
    PLAYER.oxygen = PLAYER.maxOxygen;
    PLAYER.hp = PLAYER.maxHp;
    PLAYER.hunger = PLAYER.maxHunger;
    PLAYER.exhaustion = 0;
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
    startWorldLoading();
  },

  // сохранить текущий мир в localStorage
  // сериализовать состояние одного измерения в компактный объект
  serializeDim(s) {
    return {
      edits: Array.from(s.edits.entries()).map(([k, v]) => k + ':' + v),
      doors: Array.from(s.doorState.entries()).map(([k, v]) => k + ':' + (v.open ? 1 : 0) + ':' + (v.hinge || 'right')),
      furnaces: Array.from(s.furnaces.entries()).map(([k, f]) => ({ k, input: f.input, fuel: f.fuel, output: f.output })),
      chests: Array.from(s.chests.entries()).map(([k, arr]) => ({ k, items: arr.map(x => x ? { id: x.id, count: x.count } : null) })),
      facing: Array.from(s.facing.entries()).map(([k, v]) => k + ':' + v),
      doubleChests: Array.from(s.doubleChests.entries()).map(([k, v]) => k + '>' + v),
    };
  },
  // восстановить состояние измерения из объекта
  deserializeDim(s, d) {
    if (!d) return;
    for (const e of (d.edits || [])) { const i = e.lastIndexOf(':'); s.edits.set(e.slice(0, i), parseInt(e.slice(i+1), 10)); }
    for (const e of (d.doors || [])) { const p = e.split(':'); s.doorState.set(p[0], { open: p[1]==='1', hinge: p[2]==='left'?'left':'right' }); }
    for (const f of (d.furnaces || [])) s.furnaces.set(f.k, { input: f.input||null, fuel: f.fuel||null, output: f.output||null, burn:0, burnMax:0, cook:0 });
    for (const ch of (d.chests || [])) { const arr = new Array(CHEST_SIZE).fill(null); const it = ch.items||[]; for (let i=0;i<CHEST_SIZE;i++) arr[i] = it[i]?{id:it[i].id,count:it[i].count}:null; s.chests.set(ch.k, arr); }
    for (const e of (d.doubleChests || [])) { const i = e.indexOf('>'); if (i>0) s.doubleChests.set(e.slice(0,i), e.slice(i+1)); }
    for (const e of (d.facing || [])) { const i = e.lastIndexOf(':'); s.facing.set(e.slice(0,i), parseInt(e.slice(i+1), 10)); }
  },

  save() {
    if (!this.current) return false;
    const armorOut = {};
    for (const sl of ['helmet','chestplate','leggings','boots']) {
      const a = PLAYER.armor && PLAYER.armor[sl];
      armorOut[sl] = a ? { id: a.id, dur: a.dur } : null;
    }
    const data = {
      seed: WORLD_SEED,
      dim: World.dim,
      dimReturn: _dimReturn,
      player: {
        x: PLAYER.pos.x, y: PLAYER.pos.y, z: PLAYER.pos.z,
        yaw: PLAYER.yaw, pitch: PLAYER.pitch,
        oxygen: PLAYER.oxygen, hp: PLAYER.hp, hunger: PLAYER.hunger,
      },
      armor: armorOut,
      slots: slots.map(s => s ? { id: s.id, count: s.count, dur: s.dur } : null),
      activeSlot,
      discovered: Array.from(discovered),
      // оба измерения
      overworld: this.serializeDim(World.dims.overworld),
      nether: this.serializeDim(World.dims.nether),
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

    // восстановить оба измерения (со старой совместимостью: старый формат хранил поля прямо в data)
    if (data.overworld || data.nether) {
      this.deserializeDim(World.dims.overworld, data.overworld);
      this.deserializeDim(World.dims.nether, data.nether);
    } else {
      // старый сейв (одно измерение) -> overworld
      this.deserializeDim(World.dims.overworld, data);
    }
    if (data.dimReturn) { _dimReturn.overworld = data.dimReturn.overworld || null; _dimReturn.nether = data.dimReturn.nether || null; }
    World.setDimension(data.dim || 'overworld');

    // открытые рецепты (справочник)
    discovered = new Set((data.discovered || []).map(Number));
    // инвентарь
    if (Array.isArray(data.slots)) {
      for (let i = 0; i < TOTAL_SLOTS; i++) {
        const d = data.slots[i];
        slots[i] = d ? { id: d.id, count: d.count, ...(d.dur!==undefined?{dur:d.dur}:{}) } : null;
      }
    }
    // броня
    PLAYER.armor = { helmet: null, chestplate: null, leggings: null, boots: null };
    if (data.armor) {
      for (const sl of ['helmet','chestplate','leggings','boots']) {
        const a = data.armor[sl];
        if (a) PLAYER.armor[sl] = { id: a.id, ...(a.dur!==undefined?{dur:a.dur}:{}) };
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
    PLAYER.hp = p.hp ?? PLAYER.maxHp;
    PLAYER.hunger = p.hunger ?? PLAYER.maxHunger;
    PLAYER.exhaustion = 0;

    // пере-запустить воду и песок вокруг изменённых клеток текущего измерения
    for (const k of World.edits.keys()) {
      const [x, y, z] = k.split(',').map(Number);
      WaterSim.touchAround(x, y, z);
      checkSandAround(x, y, z);
    }

    startWorldLoading();
  },

  delete(name) {
    localStorage.removeItem(this.LS_PREFIX + name);
    this.saveIndex(this.list().filter(w => w.name !== name));
    renderWorldList();
  },
};

// ============================================================
//  Экран загрузки: предгенерация чанков перед стартом (без лагов)
// ============================================================
const LOADING_TIPS = [
  'Совет: каменная кирка добывает быстрее деревянной.',
  'Совет: уголь горит дольше дерева — отличное топливо.',
  'Совет: переплавь дерево в печи, чтобы получить древесный уголь.',
  'Совет: открывай рецепты, добывая новые ресурсы (клавиша J).',
  'Совет: свиньи и коровы дают мясо — пожарь его в печи.',
  'Совет: уголь встречается в камне глубоко под землёй.',
  'Совет: держи голод полным, чтобы восстанавливать здоровье.',
];

function startWorldLoading() {
  const ls = document.getElementById('loadingScreen');
  const bar = document.getElementById('loadBar');
  const sub = document.getElementById('loadSub');
  const tip = document.getElementById('loadTip');
  overlay.classList.add('hidden');
  ls.classList.add('on');
  tip.textContent = LOADING_TIPS[(Math.random()*LOADING_TIPS.length)|0];
  bar.style.width = '0%';

  // центр прогрузки — около игрока
  const pcx = Math.floor(PLAYER.pos.x / CHUNK_SIZE);
  const pcz = Math.floor(PLAYER.pos.z / CHUNK_SIZE);
  // список чанков в радиусе, отсортированный от центра
  const list = [];
  for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++)
    for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++)
      list.push({ cx: pcx + dx, cz: pcz + dz, dist: dx*dx + dz*dz });
  list.sort((a, b) => a.dist - b.dist);

  const totalSteps = list.length * 2; // генерация + меширование
  let done = 0;
  let i = 0;       // индекс для генерации
  let j = 0;       // индекс для меширования
  let phase = 0;   // 0 — генерируем, 1 — мешируем

  function step() {
    const t0 = performance.now();
    // работаем кусками по времени, чтобы не было фриза (макс ~12мс за кадр)
    while (performance.now() - t0 < 12) {
      if (phase === 0) {
        if (i >= list.length) { phase = 1; sub.textContent = 'Построение чанков'; continue; }
        const it = list[i++];
        World.getChunk(it.cx, it.cz); // генерация (кешируется)
        done++;
      } else {
        if (j >= list.length) break;
        const it = list[j++];
        const c = World.getChunk(it.cx, it.cz);
        const k = World.key(it.cx, it.cz);
        if (!loadedMeshes.has(k)) {
          const mesh = buildChunkMesh(c);
          scene.add(mesh);
          loadedMeshes.set(k, mesh);
          c.dirty = false;
        }
        done++;
      }
    }
    bar.style.width = Math.min(100, Math.round(done / totalSteps * 100)) + '%';

    if (j >= list.length && phase === 1) {
      // готово — небольшая пауза для плавности, затем старт
      bar.style.width = '100%';
      sub.textContent = 'Готово!';
      setTimeout(() => { ls.classList.remove('on'); beginGame(); }, 250);
    } else {
      requestAnimationFrame(step);
    }
  }
  requestAnimationFrame(step);
}

// запустить игровой процесс (после предзагрузки чанков)
function beginGame() {
  gameStarted = true;
  overlay.classList.add('hidden');
  document.getElementById('menuBtn').style.display = 'block';
  initAudio();
  canvas.requestPointerLock();
  // автосохранение каждые 10 секунд (чаще — надёжнее)
  if (!WorldManager._autosave) {
    WorldManager._autosave = setInterval(() => { if (gameStarted) WorldManager.save(); }, 10000);
  }
}

// отложенное сохранение после изменений (дебаунс, чтобы не писать каждый кадр)
let _saveDebounce = null;
function requestSave() {
  if (!gameStarted) return;
  clearTimeout(_saveDebounce);
  _saveDebounce = setTimeout(() => { if (gameStarted) WorldManager.save(); }, 1500);
}

// сохранять при выходе со страницы
window.addEventListener('beforeunload', (e) => {
  if (gameStarted) {
    WorldManager.save();
    // подтверждение ухода — защита от случайного Ctrl+W / закрытия вкладки
    e.preventDefault();
    e.returnValue = '';
    return '';
  }
});
// сохранять при сворачивании вкладки / потере фокуса (надёжность сейвов)
document.addEventListener('visibilitychange', () => {
  if (document.hidden && gameStarted) WorldManager.save();
});
window.addEventListener('pagehide', () => { if (gameStarted) WorldManager.save(); });

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

// Универсальный блокировщик: гасит почти все сочетания пока мы в игре,
// чтобы Ctrl+S/Ctrl+D/Ctrl+P/Ctrl+F/Tab/Space и пр. не мешали.
function blockBrowserShortcut(e) {
  if (!gameStarted) return;                 // в меню — не трогаем
  const typing = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
  if (typing) return;                       // в полях ввода — не трогаем
  const code = e.code;
  // Любая модификаторная комбинация в игре — гасим (кроме совсем уж зарезервированных,
  // которые всё равно не отменяются, но preventDefault не повредит).
  if (e.ctrlKey || e.metaKey || e.altKey) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  // Tab и Space без модификаторов: Tab уводит фокус, Space скроллит — гасим.
  if (code === 'Tab' || code === 'Space') {
    e.preventDefault();
  }
}

document.addEventListener('keydown', (e) => {
  // игнорировать игровые клавиши, когда печатаем в поле ввода или мир ещё не запущен
  const typing = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
  if (typing) return;

  blockBrowserShortcut(e);

  keys[e.code] = true;
  if (!gameStarted) return;
  if (e.code === 'KeyE') { toggleInventory(); }
  if (e.code === 'KeyJ') { toggleInventory('guide'); } // справочник рецептов
  if (e.code.startsWith('Digit')) {
    const n = parseInt(e.code.slice(5), 10);
    if (n >= 1 && n <= HOTBAR_SIZE) selectSlot(n - 1);
  }
  // Escape обрабатывается в отдельном обработчике ниже (инвентарь/меню)
});
document.addEventListener('keyup', (e) => {
  blockBrowserShortcut(e);
  keys[e.code] = false;
});

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
  if (e.button === 0) {
    // сначала пробуем ударить свинью; если попали — не ломаем блок
    if (!tryAttackMob()) leftHeld = true;       // удержание = непрерывное ломание
  }
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

  let time = BREAK_TIME[mining.block] || 1;
  const held = activeItem();
  const heldId = held ? held.id : 0;
  // множитель скорости в зависимости от уровня инструмента
  const speedMul = (tier) => tier >= 4 ? 0.13 : tier === 3 ? 0.17 : tier === 2 ? 0.22 : tier === 1 ? 0.35 : 1;
  if (needsPickaxe(mining.block)) {
    const tier = pickaxeTier(heldId);
    time *= tier > 0 ? speedMul(tier) : 2.2; // без кирки — медленно
  } else if (axeBlock(mining.block) && isAxe(heldId)) {
    time *= speedMul(axeTier(heldId));
  } else if (shovelBlock(mining.block) && isShovel(heldId)) {
    time *= speedMul(shovelTier(heldId));
  }
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

// Открытые ресурсы (для справочника): id предметов, которые игрок держал в руках
let discovered = new Set();
// отметить ресурс как полученный (открывает связанные рецепты в справочнике)
function onObtain(id) {
  if (id === undefined || id === null) return;
  if (!discovered.has(id)) {
    discovered.add(id);
    // если открыт справочник — обновить
    if (invOpen && craftMode === 'guide') renderInventory();
  }
}

function maxStack(id) { return MAX_STACK; }

// ---- Базовые операции со стопками ----
function addToInventory(id, n = 1) {
  onObtain(id); // открыть ресурс для справочника
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

// ---- Иконки блоков и предметов ----
function iconCanvas(id, size) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Предметы рисуем вручную
  if (id === ITEM.STICK) {
    ctx.strokeStyle = '#7a5326'; ctx.lineWidth = Math.max(2, size/9);
    ctx.beginPath(); ctx.moveTo(size*0.7, size*0.2); ctx.lineTo(size*0.3, size*0.8); ctx.stroke();
    return c;
  }
  // цвет головки инструмента по материалу
  const toolHeadColor = (idd) => {
    if (idd === ITEM.STONE_PICKAXE || idd === ITEM.STONE_AXE || idd === ITEM.STONE_SHOVEL || idd === ITEM.STONE_SWORD) return '#8a8a8a';
    if (idd === ITEM.COPPER_PICKAXE || idd === ITEM.COPPER_AXE || idd === ITEM.COPPER_SHOVEL || idd === ITEM.COPPER_SWORD) return '#d07a40';
    if (idd === ITEM.IRON_PICKAXE || idd === ITEM.IRON_AXE || idd === ITEM.IRON_SHOVEL || idd === ITEM.IRON_SWORD) return '#e2e2e8';
    if (idd === ITEM.DIAMOND_PICKAXE || idd === ITEM.DIAMOND_AXE || idd === ITEM.DIAMOND_SHOVEL || idd === ITEM.DIAMOND_SWORD) return '#3fd6e0';
    return '#b98e4d'; // деревянный
  };
  // алмаз — гранёный голубой кристалл
  if (id === ITEM.DIAMOND) {
    const u = size/16;
    ctx.fillStyle = '#3fd6e0';
    ctx.beginPath();
    ctx.moveTo(8*u,2*u); ctx.lineTo(13*u,7*u); ctx.lineTo(8*u,14*u); ctx.lineTo(3*u,7*u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#bff7ff'; // верхняя грань (блик)
    ctx.beginPath(); ctx.moveTo(8*u,2*u); ctx.lineTo(13*u,7*u); ctx.lineTo(8*u,7*u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1f9fb0'; // нижняя тень
    ctx.beginPath(); ctx.moveTo(3*u,7*u); ctx.lineTo(8*u,14*u); ctx.lineTo(8*u,7*u); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#0d6f80'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(8*u,2*u); ctx.lineTo(13*u,7*u); ctx.lineTo(8*u,14*u); ctx.lineTo(3*u,7*u); ctx.closePath(); ctx.stroke();
    return c;
  }
  // кремень — тёмно-серый осколок
  if (id === ITEM.FLINT) {
    const u = size/16;
    ctx.fillStyle = '#3a3a3e';
    ctx.beginPath();
    ctx.moveTo(4*u,11*u); ctx.lineTo(6*u,5*u); ctx.lineTo(11*u,4*u); ctx.lineTo(13*u,9*u); ctx.lineTo(9*u,13*u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#56565c'; // грань-блик
    ctx.beginPath(); ctx.moveTo(6*u,5*u); ctx.lineTo(11*u,4*u); ctx.lineTo(9*u,8*u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1f1f22';
    ctx.fillRect(9*u,10*u,2*u,2*u);
    return c;
  }
  // зажигалка — кремень + стальное огниво
  if (id === ITEM.FLINT_AND_STEEL) {
    const u = size/16;
    // стальная скоба
    ctx.strokeStyle = '#c4c8cf'; ctx.lineWidth = Math.max(2,u*1.4);
    ctx.beginPath(); ctx.moveTo(4*u,5*u); ctx.quadraticCurveTo(3*u,11*u,9*u,12*u); ctx.stroke();
    ctx.strokeStyle = '#8a9098'; ctx.lineWidth = Math.max(1,u);
    ctx.beginPath(); ctx.moveTo(5*u,6*u); ctx.lineTo(4*u,9*u); ctx.stroke();
    // кремень
    ctx.fillStyle = '#3a3a3e';
    ctx.beginPath(); ctx.moveTo(9*u,3*u); ctx.lineTo(13*u,4*u); ctx.lineTo(12*u,8*u); ctx.lineTo(9*u,7*u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#56565c'; ctx.fillRect(10*u,4*u,1*u,1*u);
    // искра
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(11*u,9*u,1*u,1*u); ctx.fillRect(12*u,10*u,1*u,1*u);
    return c;
  }
  // лодка — деревянная иконка
  if (id === ITEM.BOAT) {
    const u = size/16;
    ctx.fillStyle = '#9c6b35';
    ctx.beginPath();
    ctx.moveTo(2*u,7*u); ctx.lineTo(14*u,7*u); ctx.lineTo(12*u,12*u); ctx.lineTo(4*u,12*u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7a5326'; ctx.fillRect(3*u,8*u,10*u,1*u); // борт-тень
    ctx.fillStyle = '#b98e4d'; ctx.fillRect(2*u,7*u,12*u,1*u); // верхний борт
    // весло
    ctx.strokeStyle = '#6e4a22'; ctx.lineWidth = Math.max(1,u);
    ctx.beginPath(); ctx.moveTo(11*u,5*u); ctx.lineTo(14*u,9*u); ctx.stroke();
    return c;
  }
  // кожа — коричневый кусок шкуры
  if (id === ITEM.LEATHER) {
    const u = size/16;
    ctx.fillStyle = '#8a5a32';
    ctx.fillRect(3*u,4*u,10*u,8*u);
    ctx.fillStyle = '#a06a3c'; ctx.fillRect(4*u,5*u,8*u,3*u);
    ctx.fillStyle = '#6e472488'; ctx.fillRect(3*u,10*u,10*u,1*u);
    ctx.strokeStyle = '#5e3a1e'; ctx.lineWidth=1; ctx.strokeRect(3*u,4*u,10*u,8*u);
    // стежки
    ctx.fillStyle = '#c89a6a'; for (let i=4;i<12;i+=2) ctx.fillRect(i*u,4*u,1*u,1*u);
    return c;
  }
  // броня — рисуем по типу куска + цвету материала
  if (isArmor(id)) {
    const u = size/16;
    const mat = (id>=ITEM.DIAMOND_HELMET)?'#3fd6e0':(id>=ITEM.IRON_HELMET)?'#cfd3da':'#8a5a32';
    const dark = (id>=ITEM.DIAMOND_HELMET)?'#1f9fb0':(id>=ITEM.IRON_HELMET)?'#9aa0a8':'#5e3a1e';
    const sl = armorSlotOf(id);
    ctx.fillStyle = mat;
    if (sl === 'helmet') { ctx.fillRect(4*u,3*u,8*u,5*u); ctx.fillStyle=dark; ctx.fillRect(4*u,7*u,8*u,1*u); ctx.fillStyle='#0008'; ctx.fillRect(6*u,5*u,4*u,2*u); }
    else if (sl === 'chestplate') { ctx.fillRect(3*u,3*u,10*u,3*u); ctx.fillRect(4*u,6*u,8*u,7*u); ctx.fillStyle=dark; ctx.fillRect(4*u,9*u,8*u,1*u); ctx.fillStyle=mat; ctx.fillRect(2*u,4*u,2*u,4*u); ctx.fillRect(12*u,4*u,2*u,4*u); }
    else if (sl === 'leggings') { ctx.fillRect(4*u,3*u,8*u,4*u); ctx.fillRect(4*u,7*u,3*u,7*u); ctx.fillRect(9*u,7*u,3*u,7*u); ctx.fillStyle=dark; ctx.fillRect(7*u,4*u,2*u,3*u); }
    else { ctx.fillRect(3*u,8*u,4*u,5*u); ctx.fillRect(9*u,8*u,4*u,5*u); ctx.fillStyle=dark; ctx.fillRect(3*u,12*u,4*u,1*u); ctx.fillRect(9*u,12*u,4*u,1*u); }
    return c;
  }
  // ведро (пустое/вода/лава)
  if (id === ITEM.BUCKET || id === ITEM.WATER_BUCKET || id === ITEM.LAVA_BUCKET) {
    const u = size/16;
    // содержимое внутри ведра
    if (id === ITEM.WATER_BUCKET) { ctx.fillStyle = '#3a86d8'; ctx.fillRect(4*u,5*u,8*u,3*u); }
    if (id === ITEM.LAVA_BUCKET) { ctx.fillStyle = '#e85a18'; ctx.fillRect(4*u,5*u,8*u,3*u); ctx.fillStyle='#ffd24a'; ctx.fillRect(6*u,5*u,2*u,1*u); }
    // корпус ведра (трапеция) — железо
    ctx.fillStyle = '#c4c8cf';
    ctx.beginPath();
    ctx.moveTo(3*u,7*u); ctx.lineTo(13*u,7*u); ctx.lineTo(11*u,14*u); ctx.lineTo(5*u,14*u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(3*u,7*u,10*u,1*u); // ободок
    ctx.fillStyle = '#e6e9ee'; ctx.fillRect(5*u,8*u,1*u,5*u);  // блик
    // ручка-дужка
    ctx.strokeStyle = '#8a9098'; ctx.lineWidth = Math.max(1,u);
    ctx.beginPath(); ctx.moveTo(4*u,7*u); ctx.quadraticCurveTo(8*u,2*u,12*u,7*u); ctx.stroke();
    return c;
  }
  // меч: ручка-крестовина + клинок
  if (isSword(id)) {
    const u = size/16;
    // рукоять (по диагонали снизу-справа)
    ctx.strokeStyle = '#7a5326'; ctx.lineWidth = Math.max(2, size/9);
    ctx.beginPath(); ctx.moveTo(11*u, 12*u); ctx.lineTo(13*u, 14*u); ctx.stroke();
    // крестовина (гарда)
    ctx.strokeStyle = '#5b4423'; ctx.lineWidth = Math.max(2, size/10);
    ctx.beginPath(); ctx.moveTo(8*u, 12*u); ctx.lineTo(12*u, 8*u); ctx.stroke();
    // клинок
    ctx.fillStyle = toolHeadColor(id);
    ctx.beginPath();
    ctx.moveTo(2*u,14*u); ctx.lineTo(11*u,5*u); ctx.lineTo(13*u,3*u); ctx.lineTo(12*u,2*u);
    ctx.lineTo(10*u,4*u); ctx.lineTo(3*u,12*u); ctx.closePath(); ctx.fill();
    // блик на клинке
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(4*u,11*u); ctx.lineTo(10*u,5*u); ctx.stroke();
    return c;
  }
  if (isPickaxe(id)) {
    // ручка
    ctx.strokeStyle = '#7a5326'; ctx.lineWidth = Math.max(2, size/8);
    ctx.beginPath(); ctx.moveTo(size*0.62, size*0.28); ctx.lineTo(size*0.34, size*0.82); ctx.stroke();
    ctx.strokeStyle = toolHeadColor(id);
    ctx.lineWidth = Math.max(3, size/6);
    ctx.beginPath(); ctx.moveTo(size*0.3, size*0.32); ctx.quadraticCurveTo(size*0.62, size*0.18, size*0.82, size*0.34); ctx.stroke();
    return c;
  }
  // топор: ручка + клиновидное лезвие сбоку
  if (isAxe(id)) {
    const u = size/16;
    ctx.strokeStyle = '#7a5326'; ctx.lineWidth = Math.max(2, size/8);
    ctx.beginPath(); ctx.moveTo(size*0.6, size*0.28); ctx.lineTo(size*0.36, size*0.82); ctx.stroke();
    ctx.fillStyle = toolHeadColor(id);
    // лезвие топора (треугольный блок у верхушки слева)
    ctx.beginPath();
    ctx.moveTo(5*u,3*u); ctx.lineTo(11*u,3*u); ctx.lineTo(11*u,7*u); ctx.lineTo(5*u,9*u); ctx.closePath(); ctx.fill();
    return c;
  }
  // лопата: ручка + прямоугольный ковш снизу
  if (isShovel(id)) {
    const u = size/16;
    ctx.strokeStyle = '#7a5326'; ctx.lineWidth = Math.max(2, size/8);
    ctx.beginPath(); ctx.moveTo(size*0.62, size*0.22); ctx.lineTo(size*0.42, size*0.66); ctx.stroke();
    ctx.fillStyle = toolHeadColor(id);
    // ковш
    ctx.fillRect(4*u,9*u,5*u,5*u);
    return c;
  }
  // слитки: железный (серебристый) и медный (оранжевый)
  if (id === ITEM.IRON_INGOT || id === ITEM.COPPER_INGOT) {
    const u = size/16;
    const copper = (id === ITEM.COPPER_INGOT);
    const mid  = copper ? '#cf7e44' : '#d2d2da';
    const top  = copper ? '#ec9a5e' : '#eeeef4';
    const bot  = copper ? '#a0552a' : '#9a9aa6';
    ctx.fillStyle = mid; ctx.fillRect(3*u,6*u,10*u,5*u);
    ctx.fillStyle = top; ctx.fillRect(4*u,6*u,8*u,1*u);   // блик сверху
    ctx.fillStyle = bot; ctx.fillRect(3*u,10*u,10*u,1*u); // тень снизу
    return c;
  }
  // уголь / древесный уголь — кусочек угля
  if (id === ITEM.COAL || id === ITEM.CHARCOAL) {
    const u = size/16;
    const base = (id === ITEM.CHARCOAL) ? '#3a2e26' : '#202020';
    const hi = (id === ITEM.CHARCOAL) ? '#5a463a' : '#3c3c3c';
    ctx.fillStyle = base;
    ctx.fillRect(4*u,4*u,8*u,8*u); ctx.fillRect(3*u,6*u,10*u,5*u); ctx.fillRect(5*u,3*u,6*u,10*u);
    ctx.fillStyle = hi; // блики-грани
    ctx.fillRect(5*u,5*u,2*u,1*u); ctx.fillRect(9*u,6*u,2*u,1*u); ctx.fillRect(6*u,9*u,3*u,1*u);
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(4*u,11*u,8*u,1*u); ctx.fillRect(11*u,5*u,1*u,6*u);
    return c;
  }
  if (id === ITEM.DOOR) {
    ctx.fillStyle = '#9c6b35'; ctx.fillRect(size*0.28, size*0.08, size*0.44, size*0.84);
    ctx.strokeStyle = '#6e4a22'; ctx.lineWidth = 1; ctx.strokeRect(size*0.28, size*0.08, size*0.44, size*0.84);
    ctx.fillStyle = 'rgba(150,200,230,0.6)'; ctx.fillRect(size*0.36, size*0.16, size*0.28, size*0.18);
    ctx.fillStyle = '#3a2712'; ctx.fillRect(size*0.62, size*0.5, size*0.07, size*0.07);
    return c;
  }
  // мясо: кусок с косточкой; сырое — розовое, жареное — коричневое
  if (id === ITEM.PORK_RAW || id === ITEM.PORK_COOKED || id === ITEM.BEEF_RAW || id === ITEM.BEEF_COOKED) {
    const cooked = (id === ITEM.PORK_COOKED || id === ITEM.BEEF_COOKED);
    const beef = (id === ITEM.BEEF_RAW || id === ITEM.BEEF_COOKED);
    let meat, edge;
    if (cooked) { meat = beef ? '#7a4a28' : '#9c6038'; edge = '#4f2e18'; }
    else        { meat = beef ? '#c45a4e' : '#e89aa0'; edge = beef ? '#8e3a32' : '#c06b72'; }
    const u = size/16;
    // мякоть (скруглённый кусок)
    ctx.fillStyle = meat;
    ctx.fillRect(4*u,4*u,9*u,8*u);
    ctx.fillRect(3*u,6*u,11*u,5*u);
    ctx.fillStyle = edge; // контур-тень снизу/справа
    ctx.fillRect(4*u,11*u,9*u,1*u); ctx.fillRect(12*u,5*u,1*u,6*u);
    // прожилки жира (у сырого светлее, у жареного — тёмные)
    ctx.fillStyle = cooked ? '#3a2414' : '#f6c9cf';
    ctx.fillRect(6*u,6*u,4*u,1*u); ctx.fillRect(5*u,9*u,5*u,1*u);
    // косточка
    ctx.fillStyle = '#efe6cf';
    ctx.fillRect(11*u,3*u,3*u,2*u); ctx.fillRect(12*u,4*u,3*u,2*u);
    ctx.fillStyle = '#cfc4a6'; ctx.fillRect(13*u,3*u,1*u,1*u);
    return c;
  }
  // курятина — ножка/окорочок с косточкой
  if (id === ITEM.CHICKEN_RAW || id === ITEM.CHICKEN_COOKED) {
    const cooked = (id === ITEM.CHICKEN_COOKED);
    const u = size/16;
    const meat = cooked ? '#b9763a' : '#f0d2b0';
    const edge = cooked ? '#7a4a22' : '#caa884';
    ctx.fillStyle = meat;
    ctx.fillRect(5*u,3*u,6*u,7*u);          // округлая мякоть
    ctx.fillRect(4*u,4*u,8*u,5*u);
    ctx.fillStyle = edge;
    ctx.fillRect(4*u,8*u,8*u,1*u); ctx.fillRect(11*u,4*u,1*u,5*u);
    // косточка снизу
    ctx.fillStyle = '#efe6cf';
    ctx.fillRect(7*u,9*u,2*u,4*u); ctx.fillRect(6*u,12*u,4*u,2*u);
    ctx.fillStyle = '#cfc4a6'; ctx.fillRect(6*u,13*u,1*u,1*u); ctx.fillRect(9*u,13*u,1*u,1*u);
    return c;
  }

  // Блоки — рисуем текстуру верхней/боковой грани
  let tex = TEX.stone;
  if (id === BLOCK.GRASS) tex = TEX.grass_side;
  else if (id === BLOCK.DIRT) tex = TEX.dirt;
  else if (id === BLOCK.STONE) tex = TEX.stone;
  else if (id === BLOCK.BEDROCK) tex = TEX.bedrock;
  else if (id === BLOCK.WATER) tex = TEX.water;
  else if (id === BLOCK.LAVA || id === BLOCK.LAVA_FLOW) tex = TEX.lava;
  else if (id === BLOCK.FIRE) tex = TEX.fire;
  else if (id === BLOCK.SAND) tex = TEX.sand;
  else if (id === BLOCK.WOOD) tex = TEX.wood_side;
  else if (id === BLOCK.LEAVES) tex = TEX.leaves;
  else if (id === BLOCK.PLANKS) tex = TEX.planks;
  else if (id === BLOCK.CRAFTING_TABLE) tex = TEX.craft_top;
  else if (id === BLOCK.COBBLESTONE) tex = TEX.cobble;
  else if (id === BLOCK.COAL_ORE) tex = TEX.coal_ore;
  else if (id === BLOCK.IRON_ORE) tex = TEX.iron_ore;
  else if (id === BLOCK.COPPER_ORE) tex = TEX.copper_ore;
  else if (id === BLOCK.DIAMOND_ORE) tex = TEX.diamond_ore;
  else if (id === BLOCK.GRAVEL) tex = TEX.gravel;
  else if (id === BLOCK.OBSIDIAN) tex = TEX.obsidian;
  else if (id === BLOCK.NETHERRACK) tex = TEX.netherrack;
  else if (id === BLOCK.GLOWSTONE) tex = TEX.glowstone;
  else if (id === BLOCK.GLASS) tex = TEX.glass;
  else if (id === BLOCK.FURNACE) tex = TEX.furnace_front;
  else if (id === BLOCK.CHEST) tex = TEX.chest_front;
  else if (id === BLOCK.DOOR_BOTTOM || id === BLOCK.DOOR_TOP) tex = TEX.door_bottom;
  // фон для прозрачных текстур
  if (id === BLOCK.LEAVES) { ctx.fillStyle = '#2f6e22'; ctx.fillRect(0,0,size,size); }
  if (id === BLOCK.GLASS) { ctx.fillStyle = 'rgba(180,215,235,0.25)'; ctx.fillRect(0,0,size,size); }
  ctx.drawImage(tex, 0, 0, size, size);
  return c;
}

// Пиксельная иконка пламени (для печи), lit=горит
function makeFlameIcon(lit) {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  if (lit) {
    // внешнее пламя
    x.fillStyle = '#ff7a18';
    x.fillRect(6,4,4,9); x.fillRect(5,7,6,6); x.fillRect(4,10,8,4);
    // среднее
    x.fillStyle = '#ffb52e';
    x.fillRect(6,7,4,6); x.fillRect(5,10,6,4);
    // ядро
    x.fillStyle = '#ffe96b';
    x.fillRect(7,10,2,4);
    // искры сверху
    x.fillStyle = '#ff7a18'; x.fillRect(7,2,2,2);
  } else {
    // потухшее — серый контур пламени
    x.fillStyle = '#6a6a6a';
    x.fillRect(6,5,4,8); x.fillRect(5,8,6,5);
    x.fillStyle = '#555'; x.fillRect(7,9,2,4);
  }
  c.style.width = '18px'; c.style.height = '18px'; c.style.imageRendering = 'pixelated';
  return c;
}

// Пиксельная стрелка прогресса (для крафта)
function makeArrowIcon() {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.fillStyle = '#555';
  x.fillRect(2,7,9,2);          // стержень
  x.fillRect(10,4,2,2); x.fillRect(12,6,2,4); x.fillRect(10,10,2,2); // наконечник
  c.style.width = '22px'; c.style.height = '22px'; c.style.imageRendering = 'pixelated';
  return c;
}

// ---- Хотбар (нижняя панель) ----
const hotbarEl = document.getElementById('hotbar');
// полоска прочности под иконкой (для предметов с прочностью, напр. зажигалка)
function addDurabilityBar(el, item) {
  if (!item || !hasDurability(item.id) || item.dur === undefined) return;
  const max = MAX_DURABILITY[item.id];
  if (item.dur >= max) return; // полная — не показываем
  const frac = Math.max(0, item.dur / max);
  const bar = document.createElement('div');
  bar.style.cssText = 'position:absolute;left:3px;right:3px;bottom:3px;height:3px;background:#000;border-radius:1px;';
  const fill = document.createElement('div');
  // цвет от зелёного к красному
  const hue = Math.round(frac * 120);
  fill.style.cssText = `height:100%;width:${(frac*100).toFixed(0)}%;background:hsl(${hue},85%,45%);border-radius:1px;`;
  bar.appendChild(fill);
  el.style.position = 'relative';
  el.appendChild(bar);
}

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
      addDurabilityBar(slot, item);
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
const P = BLOCK.PLANKS, S = ITEM.STICK, C = BLOCK.COBBLESTONE, O = 0, I = ITEM.IRON_INGOT, U = ITEM.COPPER_INGOT, D = ITEM.DIAMOND, L = ITEM.LEATHER;
// шаблоны брони (3x3): шлем/нагрудник/поножи/ботинки
function armorRecipe(m, helmet, chest, legs, boots) {
  return [
    { shaped:true, w:3, h:2, need3x3:true, cells:[m,m,m, m,O,m], result:{ id: helmet, count:1 } },
    { shaped:true, w:3, h:3, need3x3:true, cells:[m,O,m, m,m,m, m,m,m], result:{ id: chest, count:1 } },
    { shaped:true, w:3, h:3, need3x3:true, cells:[m,m,m, m,O,m, m,O,m], result:{ id: legs, count:1 } },
    { shaped:true, w:3, h:2, need3x3:true, cells:[m,O,m, m,O,m], result:{ id: boots, count:1 } },
  ];
}
const RECIPES = [
  // 1 дерево -> 4 доски (бесформенно)
  { shapeless: true, ingredients: { [BLOCK.WOOD]: 1 }, result: { id: BLOCK.PLANKS, count: 4 } },
  // 2 доски -> 4 палки (бесформенно, как в майне столбиком, но упростим)
  { shapeless: true, ingredients: { [BLOCK.PLANKS]: 2 }, result: { id: ITEM.STICK, count: 4 } },
  // 4 доски 2x2 -> верстак
  { shaped: true, w: 2, h: 2, cells: [P,P, P,P], result: { id: BLOCK.CRAFTING_TABLE, count: 1 } },
  // деревянная кирка: ряд досок + 2 палки (3x3)
  { shaped: true, w: 3, h: 3, need3x3: true,
    cells: [P,P,P,
            O,S,O,
            O,S,O], result: { id: ITEM.WOODEN_PICKAXE, count: 1 } },
  // каменная кирка: ряд булыжника + 2 палки (3x3)
  { shaped: true, w: 3, h: 3, need3x3: true,
    cells: [C,C,C,
            O,S,O,
            O,S,O], result: { id: ITEM.STONE_PICKAXE, count: 1 } },
  // медная кирка: ряд медных слитков + 2 палки (3x3) — золотая середина
  { shaped: true, w: 3, h: 3, need3x3: true,
    cells: [U,U,U,
            O,S,O,
            O,S,O], result: { id: ITEM.COPPER_PICKAXE, count: 1 } },
  // железная кирка: ряд слитков + 2 палки (3x3)
  { shaped: true, w: 3, h: 3, need3x3: true,
    cells: [I,I,I,
            O,S,O,
            O,S,O], result: { id: ITEM.IRON_PICKAXE, count: 1 } },

  // ---- Топоры (2 материала углом + 2 палки) ----
  { shaped: true, w: 2, h: 3, need3x3: true, cells: [P,P, P,S, O,S], result: { id: ITEM.WOODEN_AXE, count: 1 } },
  { shaped: true, w: 2, h: 3, need3x3: true, cells: [C,C, C,S, O,S], result: { id: ITEM.STONE_AXE, count: 1 } },
  { shaped: true, w: 2, h: 3, need3x3: true, cells: [U,U, U,S, O,S], result: { id: ITEM.COPPER_AXE, count: 1 } },
  { shaped: true, w: 2, h: 3, need3x3: true, cells: [I,I, I,S, O,S], result: { id: ITEM.IRON_AXE, count: 1 } },

  // ---- Лопаты (1 материал + 2 палки в столбик) ----
  { shaped: true, w: 1, h: 3, need3x3: true, cells: [P, S, S], result: { id: ITEM.WOODEN_SHOVEL, count: 1 } },
  { shaped: true, w: 1, h: 3, need3x3: true, cells: [C, S, S], result: { id: ITEM.STONE_SHOVEL, count: 1 } },
  { shaped: true, w: 1, h: 3, need3x3: true, cells: [U, S, S], result: { id: ITEM.COPPER_SHOVEL, count: 1 } },
  { shaped: true, w: 1, h: 3, need3x3: true, cells: [I, S, S], result: { id: ITEM.IRON_SHOVEL, count: 1 } },

  // ---- Мечи (2 материала в столбик + палка-рукоять) ----
  { shaped: true, w: 1, h: 3, need3x3: true, cells: [P, P, S], result: { id: ITEM.WOODEN_SWORD, count: 1 } },
  { shaped: true, w: 1, h: 3, need3x3: true, cells: [C, C, S], result: { id: ITEM.STONE_SWORD, count: 1 } },
  { shaped: true, w: 1, h: 3, need3x3: true, cells: [U, U, S], result: { id: ITEM.COPPER_SWORD, count: 1 } },
  { shaped: true, w: 1, h: 3, need3x3: true, cells: [I, I, S], result: { id: ITEM.IRON_SWORD, count: 1 } },
  { shaped: true, w: 1, h: 3, need3x3: true, cells: [D, D, S], result: { id: ITEM.DIAMOND_SWORD, count: 1 } },

  // ---- Алмазные инструменты ----
  { shaped: true, w: 3, h: 3, need3x3: true, cells: [D,D,D, O,S,O, O,S,O], result: { id: ITEM.DIAMOND_PICKAXE, count: 1 } },
  { shaped: true, w: 2, h: 3, need3x3: true, cells: [D,D, D,S, O,S], result: { id: ITEM.DIAMOND_AXE, count: 1 } },
  { shaped: true, w: 1, h: 3, need3x3: true, cells: [D, S, S], result: { id: ITEM.DIAMOND_SHOVEL, count: 1 } },

  // ---- Ведро (3 железных слитка V-образно) ----
  { shaped: true, w: 3, h: 2, need3x3: true, cells: [I,O,I, O,I,O], result: { id: ITEM.BUCKET, count: 1 } },
  // Зажигалка: железо + кремень (по диагонали)
  { shaped: true, w: 2, h: 2, need3x3: true, cells: [I,O, O,ITEM.FLINT], result: { id: ITEM.FLINT_AND_STEEL, count: 1 } },
  // Лодка: 5 досок «U» (2x3 без центра верха)
  { shaped: true, w: 3, h: 2, need3x3: true, cells: [P,O,P, P,P,P], result: { id: ITEM.BOAT, count: 1 } },
  // ---- Броня ----
  ...armorRecipe(L, ITEM.LEATHER_HELMET, ITEM.LEATHER_CHESTPLATE, ITEM.LEATHER_LEGGINGS, ITEM.LEATHER_BOOTS),
  ...armorRecipe(I, ITEM.IRON_HELMET, ITEM.IRON_CHESTPLATE, ITEM.IRON_LEGGINGS, ITEM.IRON_BOOTS),
  ...armorRecipe(D, ITEM.DIAMOND_HELMET, ITEM.DIAMOND_CHESTPLATE, ITEM.DIAMOND_LEGGINGS, ITEM.DIAMOND_BOOTS),
  // дверь: 2 в ширину, 3 в высоту из досок (6 досок) -> предмет двери.
  // (полный столбец 2x3, чтобы не путать с верстаком 2x2)
  { shaped: true, w: 2, h: 3, need3x3: true,
    cells: [P,P,
            P,P,
            P,P], result: { id: ITEM.DOOR, count: 1 } },
  // печь: 8 булыжника по периметру (центр пуст) 3x3 -> печь
  { shaped: true, w: 3, h: 3, need3x3: true,
    cells: [C,C,C,
            C,O,C,
            C,C,C], result: { id: BLOCK.FURNACE, count: 1 } },
  // сундук: 8 досок по периметру (центр пуст) 3x3 -> сундук
  { shaped: true, w: 3, h: 3, need3x3: true,
    cells: [P,P,P,
            P,O,P,
            P,P,P], result: { id: BLOCK.CHEST, count: 1 } },
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

// id-сетка крафта (0 для пустых) размером size x size
function craftIdGrid(size) {
  const g = [];
  for (let r = 0; r < size; r++) { g.push([]); for (let cc = 0; cc < size; cc++) { const s = craftSlots[r*size+cc]; g[r].push(s ? s.id : 0); } }
  return g;
}

// совпадает ли формовый рецепт при заданном смещении (or, oc) в сетке size
function shapedFits(rec, grid, size, or, oc) {
  for (let r = 0; r < size; r++) for (let cc = 0; cc < size; cc++) {
    let want = 0;
    if (r >= or && r < or + rec.h && cc >= oc && cc < oc + rec.w) {
      want = rec.cells[(r - or) * rec.w + (cc - oc)];
    }
    if (grid[r][cc] !== want) return false;
  }
  return true;
}

// набор уникальных id-ингредиентов рецепта (для справочника)
function recipeIngredients(rec) {
  const set = new Set();
  if (rec.shapeless) { for (const k of Object.keys(rec.ingredients)) set.add(+k); }
  else if (rec.cells) { for (const c of rec.cells) if (c) set.add(c); }
  return [...set];
}
// рецепт открыт, если игрок держал все его ингредиенты
function recipeUnlocked(rec) {
  return recipeIngredients(rec).every(id => discovered.has(id));
}
// список ячеек рецепта для отображения сетки (нормализованный до w×h; SMELT — особый)
function recipeGridCells(rec) {
  if (rec.shapeless) {
    // разложить ингредиенты по ячейкам 3x3 подряд
    const cells = [];
    for (const k of Object.keys(rec.ingredients)) for (let i = 0; i < rec.ingredients[k]; i++) cells.push(+k);
    while (cells.length < 4) cells.push(0);
    return { w: 2, h: 2, cells: cells.slice(0, 4) };
  }
  return { w: rec.w, h: rec.h, cells: rec.cells };
}

function matchRecipe(size) {
  const totals = craftTotals(size);
  const totalCount = Object.values(totals).reduce((a,b)=>a+b,0);
  if (totalCount === 0) return null;
  const grid = craftIdGrid(size);
  for (const rec of RECIPES) {
    if (rec.need3x3 && size < 3) continue;
    if (rec.shapeless) {
      const keys = Object.keys(rec.ingredients);
      if (keys.length !== Object.keys(totals).length) continue;
      let ok = true;
      for (const k of keys) if ((totals[k]||0) !== rec.ingredients[k]) ok = false;
      if (ok) return rec;
    } else if (rec.shaped) {
      if (rec.h > size || rec.w > size) continue;
      for (let or = 0; or + rec.h <= size; or++)
        for (let oc = 0; oc + rec.w <= size; oc++)
          if (shapedFits(rec, grid, size, or, oc)) return rec;
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
  // списать ингредиенты
  if (rec.shapeless) {
    // по нужному количеству каждого ингредиента (может лежать в одном слоте стопкой)
    const need = { ...rec.ingredients };
    for (let i = 0; i < size*size; i++) {
      const s = craftSlots[i]; if (!s) continue;
      if (need[s.id] > 0) {
        const take = Math.min(need[s.id], s.count);
        s.count -= take; need[s.id] -= take;
        if (s.count <= 0) craftSlots[i] = null;
      }
    }
  } else {
    // формовый: по одному из каждого занятого слота
    for (let i = 0; i < size*size; i++) {
      if (craftSlots[i]) { craftSlots[i].count--; if (craftSlots[i].count<=0) craftSlots[i]=null; }
    }
  }
  if (cursorItem) cursorItem.count += res.count;
  else cursorItem = { id: res.id, count: res.count };
  onObtain(res.id); // открыть рецепт результата в справочнике
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
    addDurabilityBar(el, item);
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
// клик по слотам печи (поля input/fuel/output)
function furnaceSlotClick(f, field, rightClick) {
  if (field === 'output') {
    // только забрать
    const s = f.output;
    if (!s) return;
    onObtain(s.id); // переплавленный предмет открывает рецепт
    if (!cursorItem) { cursorItem = s; f.output = null; }
    else if (cursorItem.id === s.id && cursorItem.count + s.count <= MAX_STACK) { cursorItem.count += s.count; f.output = null; }
    refreshUI(); return;
  }
  const s = f[field];
  if (!cursorItem) {
    if (!s) return;
    if (rightClick) { const half=Math.ceil(s.count/2); cursorItem={id:s.id,count:half}; s.count-=half; if(s.count<=0) f[field]=null; }
    else { cursorItem = s; f[field] = null; }
  } else {
    // для input принимаем только плавимое, для fuel — только топливо
    if (field === 'input' && !isSmeltable(cursorItem.id)) return;
    if (field === 'fuel' && !isFuel(cursorItem.id)) return;
    if (!s) {
      if (rightClick) { f[field] = {id:cursorItem.id,count:1}; cursorItem.count--; if(cursorItem.count<=0) cursorItem=null; }
      else { f[field] = cursorItem; cursorItem = null; }
    } else if (s.id === cursorItem.id) {
      const space = MAX_STACK - s.count;
      const move = rightClick ? Math.min(1, space) : Math.min(space, cursorItem.count);
      s.count += move; cursorItem.count -= move; if (cursorItem.count<=0) cursorItem=null;
    } else {
      const tmp = f[field]; f[field] = cursorItem; cursorItem = tmp;
    }
  }
  refreshUI();
}

function makeFurnaceSlot(f, field) {
  const el = document.createElement('div');
  el.className = 'inv-slot';
  const item = f[field];
  if (item) {
    el.appendChild(iconCanvas(item.id, 34));
    if (item.count > 1) { const c=document.createElement('div'); c.className='count'; c.textContent=item.count; el.appendChild(c); }
    el.title = BLOCK_NAMES[item.id] || '';
  }
  el.addEventListener('mousedown', (e) => { e.preventDefault(); furnaceSlotClick(f, field, e.button === 2); });
  el.addEventListener('contextmenu', e => e.preventDefault());
  return el;
}

// мини-иконка рецепта (без интерактива)
function recipeIconEl(id, size) {
  const el = document.createElement('div');
  el.className = 'guide-cell' + (id ? '' : ' empty');
  if (id) { el.appendChild(iconCanvas(id, size)); el.title = BLOCK_NAMES[id] || ''; }
  return el;
}

// Справочник рецептов — открывается постепенно по мере добычи ресурсов
function renderGuide() {
  const wrap = document.createElement('div');
  wrap.className = 'guide-wrap';

  const intro = document.createElement('div');
  intro.className = 'guide-intro';
  const total = RECIPES.length + Object.keys(SMELT).length;
  let unlocked = RECIPES.filter(recipeUnlocked).length +
                 Object.keys(SMELT).filter(k => discovered.has(+k)).length;
  intro.textContent = 'Справочник рецептов — открыто ' + unlocked + ' из ' + total +
                      '. Добывайте новые ресурсы, чтобы открыть больше.';
  wrap.appendChild(intro);

  // --- Крафт-рецепты ---
  for (const rec of RECIPES) {
    const row = document.createElement('div');
    row.className = 'guide-row';
    const un = recipeUnlocked(rec);
    if (!un) {
      row.classList.add('locked');
      const q = document.createElement('div'); q.className = 'guide-locked';
      q.textContent = '??? — добудьте: ' +
        recipeIngredients(rec).map(id => BLOCK_NAMES[id] || '?').join(', ');
      row.appendChild(q);
      wrap.appendChild(row);
      continue;
    }
    const g = recipeGridCells(rec);
    const grid = document.createElement('div'); grid.className = 'guide-grid';
    grid.style.gridTemplateColumns = `repeat(${g.w}, 24px)`;
    for (let i = 0; i < g.w * g.h; i++) grid.appendChild(recipeIconEl(g.cells[i] || 0, 20));
    row.appendChild(grid);
    const arr = document.createElement('div'); arr.className = 'guide-arrow'; arr.appendChild(makeArrowIcon());
    row.appendChild(arr);
    const res = recipeIconEl(rec.result.id, 24); res.classList.add('guide-result');
    if (rec.result.count > 1) { const c=document.createElement('span'); c.className='guide-count'; c.textContent='×'+rec.result.count; res.appendChild(c); }
    row.appendChild(res);
    const nm = document.createElement('div'); nm.className = 'guide-name';
    nm.textContent = BLOCK_NAMES[rec.result.id] || '';
    row.appendChild(nm);
    wrap.appendChild(row);
  }

  // --- Плавка (печь) ---
  const smHdr = document.createElement('div'); smHdr.className = 'guide-intro'; smHdr.style.marginTop = '8px';
  smHdr.textContent = 'Плавка в печи:';
  wrap.appendChild(smHdr);
  for (const k of Object.keys(SMELT)) {
    const inId = +k, out = SMELT[k];
    const row = document.createElement('div'); row.className = 'guide-row';
    if (!discovered.has(inId)) {
      row.classList.add('locked');
      const q = document.createElement('div'); q.className = 'guide-locked';
      q.textContent = '??? — добудьте: ' + (BLOCK_NAMES[inId] || '?');
      row.appendChild(q); wrap.appendChild(row); continue;
    }
    const inCell = recipeIconEl(inId, 24); row.appendChild(inCell);
    const fl = document.createElement('div'); fl.className = 'guide-arrow'; fl.appendChild(makeFlameIcon(true)); row.appendChild(fl);
    const res = recipeIconEl(out.id, 24); res.classList.add('guide-result'); row.appendChild(res);
    const nm = document.createElement('div'); nm.className = 'guide-name'; nm.textContent = BLOCK_NAMES[out.id] || '';
    row.appendChild(nm);
    wrap.appendChild(row);
  }

  invGrid.appendChild(wrap);
}

// вкладки переключения Инвентарь/Справочник
function makeTabs() {
  const tabs = document.createElement('div');
  tabs.className = 'inv-tabs';
  const t1 = document.createElement('div');
  t1.className = 'inv-tab' + (craftMode !== 'guide' ? ' active' : '');
  t1.textContent = 'Инвентарь';
  t1.addEventListener('click', () => { if (craftMode === 'guide') { craftMode = '2x2'; document.getElementById('invTitle').textContent = 'Инвентарь'; updateCraftResult(); renderInventory(); } });
  const t2 = document.createElement('div');
  t2.className = 'inv-tab' + (craftMode === 'guide' ? ' active' : '');
  t2.textContent = 'Справочник (J)';
  t2.addEventListener('click', () => { if (craftMode !== 'guide') { clearCraftToInventory(); craftMode = 'guide'; document.getElementById('invTitle').textContent = 'Справочник'; renderInventory(); } });
  tabs.appendChild(t1); tabs.appendChild(t2);
  return tabs;
}

function renderInventory() {
  // строим всю панель заново (заголовок задан в HTML)
  invGrid.innerHTML = '';

  // вкладки показываем только в обычном инвентаре и справочнике
  if (craftMode === '2x2' || craftMode === 'guide') {
    invGrid.appendChild(makeTabs());
  }

  if (craftMode === 'guide') {
    renderGuide();
    return; // справочник занимает всю панель
  }

  if (craftMode === 'chest') {
    // --- Сундук: 27 слотов (одиночный) или 54 (двойной) ---
    const chest = chestView(openChestPos.x, openChestPos.y, openChestPos.z);
    const count = chestSlotCount(openChestPos.x, openChestPos.y, openChestPos.z);
    const cz = document.createElement('div');
    cz.className = 'inv-storage';
    for (let i = 0; i < count; i++) cz.appendChild(makeSlotEl(chest, i, 34));
    invGrid.appendChild(cz);
    const lbl = document.createElement('div'); lbl.className = 'inv-label';
    lbl.textContent = count > CHEST_SIZE ? 'Большой сундук' : 'Сундук';
    invGrid.appendChild(lbl);
  } else if (craftMode === 'furnace') {
    // --- Интерфейс печи ---
    const f = getFurnace(openFurnacePos.x, openFurnacePos.y, openFurnacePos.z);
    const fz = document.createElement('div'); fz.className = 'furnace-zone';
    const col = document.createElement('div'); col.className = 'furnace-col';
    col.appendChild(makeFurnaceSlot(f, 'input'));   // вверху — что плавим
    const flame = document.createElement('div'); flame.className = 'furnace-flame' + (f.burn > 0 ? ' lit' : '');
    flame.appendChild(makeFlameIcon(f.burn > 0));   // пиксельная иконка пламени
    col.appendChild(flame);
    col.appendChild(makeFurnaceSlot(f, 'fuel'));    // внизу — топливо
    fz.appendChild(col);

    // прогресс-стрелка
    const prog = document.createElement('div'); prog.className = 'furnace-prog';
    const fill = document.createElement('div'); fill.className = 'furnace-prog-fill';
    fill.style.width = Math.round((f.cook / COOK_TIME) * 100) + '%';
    prog.appendChild(fill);
    fz.appendChild(prog);

    fz.appendChild(makeFurnaceSlot(f, 'output'));
    invGrid.appendChild(fz);

    const lbl = document.createElement('div'); lbl.className='inv-label';
    lbl.textContent = 'Печь: песок -> стекло, мясо -> жареное (топливо: доски/дерево/двери/верстак/сундук)';
    invGrid.appendChild(lbl);
  } else {
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
    arrow.className = 'craft-arrow'; arrow.appendChild(makeArrowIcon());
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
  }

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
    const title = craftMode === '3x3' ? 'Верстак' : (craftMode === 'furnace' ? 'Печь' : (craftMode === 'chest' ? 'Сундук' : (craftMode === 'guide' ? 'Справочник' : 'Инвентарь')));
    document.getElementById('invTitle').textContent = title;
    document.exitPointerLock();
    updateCraftResult();
    renderInventory();
  } else {
    // вернуть предметы из крафта только в режимах с сеткой крафта
    if (craftMode !== 'furnace' && craftMode !== 'chest') clearCraftToInventory();
    if (cursorItem) { addToInventory(cursorItem.id, cursorItem.count); cursorItem = null; } // курсор в инвентарь
    openFurnacePos = null;
    openChestPos = null;
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
  } else if (kind === 'oink') {
    // хрюканье свиньи — короткий «носовой» звук
    pigOink(false);
  } else if (kind === 'oink_hurt') {
    pigOink(true);
  } else if (kind === 'moo') {
    cowMoo(false);
  } else if (kind === 'moo_hurt') {
    cowMoo(true);
  } else if (kind === 'eat') {
    // звук еды — несколько коротких «чавканий»
    noiseBurst(0.06, 800, 0.25, 'lowpass');
    setTimeout(() => noiseBurst(0.06, 700, 0.22, 'lowpass'), 130);
    setTimeout(() => noiseBurst(0.05, 900, 0.2, 'lowpass'), 260);
  } else if (kind === 'cluck') {
    chickenCluck(false);
  } else if (kind === 'cluck_hurt') {
    chickenCluck(true);
  } else if (kind === 'hurt') {
    playerHurt();
  } else if (kind === 'burp') {
    playerBurp();
  }
}

// клохтание курицы — пара коротких высоких чирков
function chickenCluck(hurt) {
  if (!AudioEngine.ctx) return;
  const ctx = AudioEngine.ctx;
  const chirp = (t0, f) => {
    const osc = ctx.createOscillator(); osc.type = 'square';
    osc.frequency.setValueAtTime(f, t0);
    osc.frequency.linearRampToValueAtTime(f * 1.4, t0 + 0.05);
    osc.frequency.linearRampToValueAtTime(f * 0.9, t0 + 0.1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(hurt ? 0.32 : 0.2, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1);
    const filt = ctx.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 2200; filt.Q.value = 3;
    osc.connect(filt); filt.connect(g); g.connect(AudioEngine.sfxGain);
    osc.start(t0); osc.stop(t0 + 0.12);
  };
  const now = ctx.currentTime;
  chirp(now, hurt ? 1100 : 900);
  chirp(now + 0.12, hurt ? 1300 : 1000);
  if (!hurt) chirp(now + 0.26, 850);
}

// звук урона игрока — глухой удар «ой»
function playerHurt() {
  if (!AudioEngine.ctx) return;
  const ctx = AudioEngine.ctx;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator(); osc.type = 'triangle';
  osc.frequency.setValueAtTime(330, t0);
  osc.frequency.exponentialRampToValueAtTime(140, t0 + 0.18);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.4, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
  osc.connect(g); g.connect(AudioEngine.sfxGain);
  osc.start(t0); osc.stop(t0 + 0.24);
  // короткий шумовой «удар»
  noiseBurst(0.08, 500, 0.25, 'lowpass');
}

// отрыжка после еды
function playerBurp() {
  if (!AudioEngine.ctx) return;
  const ctx = AudioEngine.ctx;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator(); osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(140, t0);
  osc.frequency.linearRampToValueAtTime(70, t0 + 0.28);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
  const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 500;
  // лёгкое «бульканье» через периодическую модуляцию частоты
  const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 18;
  const lfoGain = ctx.createGain(); lfoGain.gain.value = 25;
  lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
  osc.connect(filt); filt.connect(g); g.connect(AudioEngine.sfxGain);
  osc.start(t0); osc.stop(t0 + 0.32); lfo.start(t0); lfo.stop(t0 + 0.32);
}

// процедурное хрюканье
function pigOink(hurt) {
  if (!AudioEngine.ctx) return;
  const ctx = AudioEngine.ctx;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  const base = hurt ? 360 : 220;
  osc.frequency.setValueAtTime(base, t0);
  osc.frequency.linearRampToValueAtTime(base * (hurt ? 1.5 : 0.7), t0 + 0.14);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(hurt ? 0.4 : 0.28, t0 + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
  const filt = ctx.createBiquadFilter();
  filt.type = 'bandpass'; filt.frequency.value = 700; filt.Q.value = 2;
  osc.connect(filt); filt.connect(g); g.connect(AudioEngine.sfxGain);
  osc.start(t0); osc.stop(t0 + 0.2);
}

// мычание коровы — низкий протяжный звук с лёгким понижением
function cowMoo(hurt) {
  if (!AudioEngine.ctx) return;
  const ctx = AudioEngine.ctx;
  const t0 = ctx.currentTime;
  const dur = hurt ? 0.35 : 0.7;
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  const base = hurt ? 200 : 150;
  osc.frequency.setValueAtTime(base, t0);
  osc.frequency.linearRampToValueAtTime(base * 1.25, t0 + dur * 0.35);
  osc.frequency.linearRampToValueAtTime(base * 0.8, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(hurt ? 0.42 : 0.34, t0 + 0.06);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass'; filt.frequency.value = 900;
  osc.connect(filt); filt.connect(g); g.connect(AudioEngine.sfxGain);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
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
function getTargetBlock(maxDist = 6, includeLiquid = false) {
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
    if (b !== BLOCK.AIR && (includeLiquid || !isLiquid(b))) { // обычно луч проходит сквозь жидкости
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

const _itemDropMat = {}; // кеш материалов-иконок для предметов
function itemDropMaterial(id) {
  if (_itemDropMat[id]) return _itemDropMat[id];
  const t = new THREE.CanvasTexture(iconCanvas(id, 32));
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
  _itemDropMat[id] = m;
  return m;
}

function spawnDrop(id, x, y, z) {
  let mesh;
  if (isBlock(id) && MATERIALS[id]) {
    mesh = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.28), MATERIALS[id]);
  } else {
    // предмет — плоский «спрайт»
    mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), itemDropMaterial(id));
  }
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
    const b = World.getBlock(x, y, z);
    if (!isFalling(b)) continue;           // песок или гравий
    if (canFallInto(World.getBlock(x, y - 1, z))) {
      startFallingSand(b, x, y, z);
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
      // если место занято (вода) — всё равно ставим блок, вытесняя воду
      World.setBlock(s.x, placeY, s.z, s.id);
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
//  Мобы (свиньи, коровы): модель, ИИ, анимации, звуки
// ============================================================
const mobs = [];
const MAX_MOBS = 10;

// ============================================================
//  Лодки (прототип): плавают по воде, тонут если залить сверху, горят на лаве
// ============================================================
const boats = [];
let _boatMat = null;
function boatMaterial() {
  if (_boatMat) return _boatMat;
  _boatMat = texToMaterial(makeTex(ctx => {
    noiseFill(ctx, 0x9c6b35, 12);
    ctx.fillStyle = '#7a5326';
    for (let y=2;y<16;y+=4) ctx.fillRect(0,y,16,1);
  }));
  return _boatMat;
}
function buildBoatMesh() {
  const g = new THREE.Group();
  const mat = boatMaterial();
  const box = (w,h,d) => { const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat); if (SHADOWS_ON) m.castShadow=true; return m; };
  // дно
  const floor = box(1.2, 0.12, 1.6); floor.position.set(0, 0.06, 0); g.add(floor);
  // борта
  const sideL = box(0.12, 0.34, 1.6); sideL.position.set(-0.54, 0.22, 0); g.add(sideL);
  const sideR = box(0.12, 0.34, 1.6); sideR.position.set( 0.54, 0.22, 0); g.add(sideR);
  const front = box(1.2, 0.34, 0.12); front.position.set(0, 0.22, -0.74); g.add(front);
  const back  = box(1.2, 0.34, 0.12); back.position.set(0, 0.22, 0.74); g.add(back);
  return g;
}
function spawnBoat(x, y, z) {
  const mesh = buildBoatMesh();
  mesh.position.set(x, y, z);
  scene.add(mesh);
  boats.push({ mesh, pos: new THREE.Vector3(x,y,z), vel: new THREE.Vector3(0,0,0), yaw: PLAYER.yaw, rider: false, sink: 0 });
}
function nearestBoat(maxD) {
  let best=null, bd=maxD*maxD;
  for (const b of boats) {
    const dx=b.pos.x-PLAYER.pos.x, dy=b.pos.y-PLAYER.pos.y, dz=b.pos.z-PLAYER.pos.z;
    const d=dx*dx+dy*dy+dz*dz;
    if (d<bd){bd=d;best=b;}
  }
  return best;
}
function updateBoats(dt) {
  for (let i = boats.length - 1; i >= 0; i--) {
    const b = boats[i];
    const bx = Math.floor(b.pos.x), by = Math.floor(b.pos.y), bz = Math.floor(b.pos.z);
    const inLava = isLavaLiquid(World.getBlock(bx, by, bz)) || isLavaLiquid(World.getBlock(bx, Math.floor(b.pos.y+0.2), bz));
    // на лаве — сгорает
    if (inLava) {
      scene.remove(b.mesh); boats.splice(i, 1);
      if (b.rider) { b.rider = false; PLAYER.riding = null; }
      playSound('break', BLOCK.WOOD);
      continue;
    }
    const blockHere = World.getBlock(bx, by, bz);
    const blockAbove = World.getBlock(bx, by + 1, bz);
    const onWater = isWaterLiquid(blockHere) || isWaterLiquid(World.getBlock(bx, by - 1, bz));
    const covered = isWaterLiquid(blockAbove); // воду налили сверху -> тонет (как в Minecraft)

    if (b.rider) {
      // управление: WASD относительно взгляда игрока
      b.yaw = PLAYER.yaw;
      const fwd = (keys['KeyW']?1:0) - (keys['KeyS']?1:0);
      const acc = 11; // быстрее разгон
      if (fwd !== 0) {
        b.vel.x += -Math.sin(b.yaw) * fwd * acc * dt;
        b.vel.z += -Math.cos(b.yaw) * fwd * acc * dt;
      }
      // поворот рулём A/D
      // (поворот следует за камерой через yaw)
    }
    // трение (чуть меньше, чтобы лодка дольше скользила и была быстрее)
    b.vel.x *= 0.92; b.vel.z *= 0.92;
    const sp = Math.hypot(b.vel.x, b.vel.z);
    const MAXSP = 9; // выше максимальная скорость
    if (sp > MAXSP) { b.vel.x *= MAXSP/sp; b.vel.z *= MAXSP/sp; }

    // вертикаль: плавучесть на воде / гравитация в воздухе / погружение если залито
    const surfaceY = by + 0.86; // примерная поверхность блока воды
    if (covered) {
      // залито сверху — идёт ко дну
      b.sink += dt;
      b.vel.y -= GRAVITY * 0.3 * dt;
      if (b.vel.y < -4) b.vel.y = -4;
    } else if (onWater) {
      b.sink = 0;
      // мягко держим у поверхности
      const targetY = surfaceY;
      b.vel.y += (targetY - b.pos.y) * 6 * dt;
      b.vel.y *= 0.8;
    } else {
      // в воздухе — падаем
      b.vel.y -= GRAVITY * dt;
      if (b.vel.y < -55) b.vel.y = -55;
    }

    // примитивная коллизия по осям (как у мобов, но проще)
    const tryMove = (axis, amt) => {
      b.pos[axis] += amt;
      const nbx = Math.floor(b.pos.x), nby = Math.floor(b.pos.y), nbz = Math.floor(b.pos.z);
      const solid = (X,Y,Z)=>{const bb=World.getBlock(X,Y,Z); return bb!==BLOCK.AIR && !isLiquid(bb);};
      if (solid(nbx, nby, nbz)) {
        b.pos[axis] -= amt;
        if (axis==='y' && amt<0) b.vel.y = 0;
        else b.vel[axis] = 0;
      }
    };
    tryMove('y', b.vel.y * dt);
    tryMove('x', b.vel.x * dt);
    tryMove('z', b.vel.z * dt);

    // если затонула слишком глубоко — ломается (роняет лодку-предмет)
    if (b.sink > 2.2 || b.pos.y < -8) {
      scene.remove(b.mesh); boats.splice(i, 1);
      if (b.rider) { b.rider = false; PLAYER.riding = null; }
      spawnDrop(ITEM.BOAT, b.pos.x, b.pos.y + 0.3, b.pos.z);
      continue;
    }

    b.mesh.position.copy(b.pos);
    b.mesh.rotation.y = b.yaw;

    // везём игрока
    if (b.rider) {
      PLAYER.pos.x = b.pos.x; PLAYER.pos.z = b.pos.z;
      PLAYER.pos.y = b.pos.y + 0.3;
      PLAYER.vel.set(0,0,0);
    }
  }
}

// Материалы мобов (строятся лениво)
const MOB_MAT = {};
function buildMobMaterials() {
  // --- Свинья ---
  MOB_MAT.pig_body = texToMaterial(makeTex(ctx => {
    noiseFill(ctx, 0xeaa0a8, 8);
    ctx.fillStyle = '#d98a93';
    for (let i=0;i<6;i++) ctx.fillRect((Math.random()*14)|0,(Math.random()*14)|0,2,2);
  }));
  MOB_MAT.pig_snout = texToMaterial(makeTex(ctx => {
    noiseFill(ctx, 0xd07f88, 6);
    ctx.fillStyle = '#9c5a62'; ctx.fillRect(4,6,3,4); ctx.fillRect(9,6,3,4); // ноздри
  }));
  // --- Корова ---
  MOB_MAT.cow_body = texToMaterial(makeTex(ctx => {
    noiseFill(ctx, 0x4a3526, 6);             // тёмно-коричневая основа
    ctx.fillStyle = '#e8e2d8';               // белые пятна
    ctx.fillRect(2,3,5,5); ctx.fillRect(9,8,5,5); ctx.fillRect(7,2,3,3);
    ctx.fillStyle = '#3a2a1c';
    ctx.fillRect(11,4,3,3); ctx.fillRect(3,10,3,3);
  }));
  MOB_MAT.cow_head = texToMaterial(makeTex(ctx => {
    noiseFill(ctx, 0x4a3526, 6);
    ctx.fillStyle = '#e8e2d8'; ctx.fillRect(5,4,6,5); // белая морда
  }));
  MOB_MAT.cow_snout = texToMaterial(makeTex(ctx => {
    noiseFill(ctx, 0xb98a8a, 6);
    ctx.fillStyle = '#7a5050'; ctx.fillRect(4,7,3,3); ctx.fillRect(9,7,3,3);
  }));
  MOB_MAT.horn = texToMaterial(makeTex(ctx => noiseFill(ctx, 0xe8e2cf, 6)));
  // --- Курица ---
  MOB_MAT.chicken_body = texToMaterial(makeTex(ctx => {
    noiseFill(ctx, 0xf2f2f2, 6);             // белые перья
    ctx.fillStyle = '#dcdcdc';
    for (let i=0;i<5;i++) ctx.fillRect((Math.random()*14)|0,(Math.random()*14)|0,2,1);
  }));
  MOB_MAT.chicken_beak = texToMaterial(makeTex(ctx => noiseFill(ctx, 0xe8a83a, 4))); // оранжевый клюв/лапы
  MOB_MAT.chicken_comb = texToMaterial(makeTex(ctx => noiseFill(ctx, 0xc83a2a, 4))); // красный гребень
  // --- Зомбифицированный пиглин ---
  MOB_MAT.piglin_skin = texToMaterial(makeTex(ctx => {        // зеленовато-розовая зомби-кожа
    noiseFill(ctx, 0x6a8a5a, 8);
    ctx.fillStyle = '#7a5a6a'; for (let i=0;i<6;i++) ctx.fillRect((Math.random()*14)|0,(Math.random()*14)|0,2,2);
  }));
  MOB_MAT.piglin_snout = texToMaterial(makeTex(ctx => {       // характерный нос-пятак
    noiseFill(ctx, 0xc88a98, 6);
    ctx.fillStyle = '#7a4a58'; ctx.fillRect(4,7,3,3); ctx.fillRect(9,7,3,3);
  }));
  MOB_MAT.piglin_cloth = texToMaterial(makeTex(ctx => noiseFill(ctx, 0x8a6a2a, 6))); // золотистая одежда/штаны
}

const EYE_MAT = () => new THREE.MeshBasicMaterial({ color: 0x1a1a1a });

// Определения видов мобов
const MOB_TYPES = {
  pig: {
    spawnOn: BLOCK.GRASS, drop: ITEM.PORK_RAW, dropCount: () => 1 + (Math.random()*2|0),
    idleSound: 'oink', hurtSound: 'oink_hurt',
    build() {
      const g = new THREE.Group();
      const box = (w,h,d,mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat||MOB_MAT.pig_body); if (SHADOWS_ON) m.castShadow=true; return m; };
      const body = box(0.9, 0.7, 1.3); body.position.set(0, 0.65, 0); g.add(body);
      const head = new THREE.Group();
      head.add(box(0.62, 0.6, 0.55));
      const snout = box(0.34, 0.28, 0.18, MOB_MAT.pig_snout); snout.position.set(0,-0.05,0.36); head.add(snout);
      const eL = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,0.02), EYE_MAT()); eL.position.set(-0.18,0.1,0.28); head.add(eL);
      const eR = eL.clone(); eR.position.x = 0.18; head.add(eR);
      head.position.set(0, 0.78, 0.78); g.add(head); g.userData.head = head;
      const legs = []; const lp = [[-0.28,0.45],[0.28,0.45],[-0.28,-0.45],[0.28,-0.45]];
      for (const [lx,lz] of lp) { const leg = box(0.26,0.55,0.26); leg.geometry.translate(0,-0.275,0); leg.position.set(lx,0.55,lz); g.add(leg); legs.push(leg); }
      g.userData.legs = legs;
      return g;
    },
    width: 0.9, height: 0.95, hp: 10,
  },
  cow: {
    spawnOn: BLOCK.GRASS, drop: ITEM.BEEF_RAW, dropCount: () => 1 + (Math.random()*2|0),
    idleSound: 'moo', hurtSound: 'moo_hurt',
    build() {
      const g = new THREE.Group();
      const box = (w,h,d,mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat||MOB_MAT.cow_body); if (SHADOWS_ON) m.castShadow=true; return m; };
      const body = box(1.0, 0.8, 1.5); body.position.set(0, 0.78, 0); g.add(body);
      const head = new THREE.Group();
      head.add(box(0.6, 0.6, 0.55, MOB_MAT.cow_head));
      const snout = box(0.4, 0.32, 0.16, MOB_MAT.cow_snout); snout.position.set(0,-0.08,0.34); head.add(snout);
      const eL = new THREE.Mesh(new THREE.BoxGeometry(0.09,0.09,0.02), EYE_MAT()); eL.position.set(-0.18,0.12,0.28); head.add(eL);
      const eR = eL.clone(); eR.position.x = 0.18; head.add(eR);
      // рожки
      const hL = box(0.08,0.16,0.08, MOB_MAT.horn); hL.position.set(-0.2,0.35,0.05); head.add(hL);
      const hR = hL.clone(); hR.position.x = 0.2; head.add(hR);
      head.position.set(0, 0.92, 0.92); g.add(head); g.userData.head = head;
      const legs = []; const lp = [[-0.32,0.52],[0.32,0.52],[-0.32,-0.52],[0.32,-0.52]];
      for (const [lx,lz] of lp) { const leg = box(0.28,0.7,0.28); leg.geometry.translate(0,-0.35,0); leg.position.set(lx,0.7,lz); g.add(leg); legs.push(leg); }
      g.userData.legs = legs;
      return g;
    },
    width: 1.0, height: 1.2, hp: 10,
  },
  chicken: {
    spawnOn: BLOCK.GRASS, drop: ITEM.CHICKEN_RAW, dropCount: () => 1 + (Math.random()*2|0),
    idleSound: 'cluck', hurtSound: 'cluck_hurt',
    build() {
      const g = new THREE.Group();
      const box = (w,h,d,mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat||MOB_MAT.chicken_body); if (SHADOWS_ON) m.castShadow=true; return m; };
      const body = box(0.42, 0.4, 0.5); body.position.set(0, 0.45, 0); g.add(body);
      const head = new THREE.Group();
      head.add(box(0.3, 0.3, 0.3));
      // гребень
      const comb = box(0.1, 0.12, 0.18, MOB_MAT.chicken_comb); comb.position.set(0, 0.2, 0); head.add(comb);
      // клюв
      const beak = box(0.12, 0.1, 0.14, MOB_MAT.chicken_beak); beak.position.set(0, -0.02, 0.2); head.add(beak);
      const eL = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,0.02), EYE_MAT()); eL.position.set(-0.1,0.04,0.14); head.add(eL);
      const eR = eL.clone(); eR.position.x = 0.1; head.add(eR);
      head.position.set(0, 0.72, 0.2); g.add(head); g.userData.head = head;
      // крылья (для лёгкой анимации можно как ноги)
      const legs = []; const lp = [[-0.12,0.05],[0.12,0.05]];
      for (const [lx,lz] of lp) { const leg = box(0.1,0.28,0.1, MOB_MAT.chicken_beak); leg.geometry.translate(0,-0.14,0); leg.position.set(lx,0.3,lz); g.add(leg); legs.push(leg); }
      g.userData.legs = legs;
      return g;
    },
    width: 0.5, height: 0.7, hp: 4,
  },
  piglin: {
    spawnOn: BLOCK.NETHERRACK, drop: ITEM.PORK_RAW, dropCount: () => 1 + (Math.random()*2|0),
    idleSound: 'oink', hurtSound: 'oink_hurt',
    hostile: true,      // может атаковать игрока (после агра)
    pack: true,         // вся стая агрится при ударе по одному
    build() {
      const g = new THREE.Group();
      const box = (w,h,d,mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat||MOB_MAT.piglin_skin); if (SHADOWS_ON) m.castShadow=true; return m; };
      // ноги
      const legs = []; const lp = [[-0.16,0],[0.16,0]];
      for (const [lx,lz] of lp) { const leg = box(0.26,0.7,0.26, MOB_MAT.piglin_cloth); leg.geometry.translate(0,-0.35,0); leg.position.set(lx,0.7,lz); g.add(leg); legs.push(leg); }
      g.userData.legs = legs;
      // тело
      const body = box(0.6, 0.75, 0.34, MOB_MAT.piglin_cloth); body.position.set(0, 1.05, 0); g.add(body);
      const torso = box(0.6, 0.3, 0.34); torso.position.set(0, 1.34, 0); g.add(torso);
      // руки
      const armL = box(0.2,0.7,0.2); armL.geometry.translate(0,-0.35,0); armL.position.set(-0.4,1.42,0); g.add(armL);
      const armR = armL.clone(); armR.position.x = 0.4; g.add(armR);
      g.userData.legs.push(armL, armR); // руки качаются вместе с ногами
      // голова
      const head = new THREE.Group();
      head.add(box(0.55,0.5,0.5));
      const snout = box(0.42,0.2,0.16, MOB_MAT.piglin_snout); snout.position.set(0,-0.08,0.3); head.add(snout);
      // уши
      const earL = box(0.1,0.18,0.06, MOB_MAT.piglin_snout); earL.position.set(-0.3,0.1,0); head.add(earL);
      const earR = earL.clone(); earR.position.x = 0.3; head.add(earR);
      const eL = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,0.02), EYE_MAT()); eL.position.set(-0.14,0.06,0.26); head.add(eL);
      const eR = eL.clone(); eR.position.x = 0.14; head.add(eR);
      head.position.set(0, 1.75, 0); g.add(head); g.userData.head = head;
      return g;
    },
    width: 0.6, height: 2.0, hp: 16,
  },
};

function spawnMob(type, x, y, z) {
  if (!MOB_MAT.pig_body) buildMobMaterials();
  const def = MOB_TYPES[type];
  const mesh = def.build();
  mesh.position.set(x, y, z);
  scene.add(mesh);
  mobs.push({
    type, def, mesh, pos: new THREE.Vector3(x, y, z), vel: new THREE.Vector3(0,0,0),
    yaw: Math.random()*Math.PI*2, width: def.width, height: def.height,
    onGround: false, state: 'idle', stateT: 1+Math.random()*2,
    walkPhase: 0, hp: def.hp, hurtT: 0, idleT: 3+Math.random()*8, flee: 0,
    aggro: 0,           // >0 — преследует игрока (агрессивен)
    attackCd: 0,        // кулдаун атаки
  });
}

// спавн мобов рядом с игроком на траве
let mobSpawnTimer = 4;
function trySpawnMobs(dt) {
  mobSpawnTimer -= dt;
  if (mobSpawnTimer > 0) return;
  mobSpawnTimer = 6 + Math.random()*6;
  if (mobs.length >= MAX_MOBS) return;
  // в Аду спавнятся зомбифицированные пиглины, в обычном мире — мирные животные
  let type;
  if (World.dim === 'nether') {
    type = 'piglin';
  } else {
    const r = Math.random();
    type = r < 0.4 ? 'pig' : (r < 0.75 ? 'chicken' : 'cow');
  }
  for (let tries = 0; tries < 8; tries++) {
    const ang = Math.random()*Math.PI*2;
    const dist = 12 + Math.random()*12;
    const px = Math.floor(PLAYER.pos.x + Math.cos(ang)*dist);
    const pz = Math.floor(PLAYER.pos.z + Math.sin(ang)*dist);
    for (let y = WORLD_HEIGHT-2; y > 1; y--) {
      const below = World.getBlock(px, y-1, pz);
      const here = World.getBlock(px, y, pz);
      const above = World.getBlock(px, y+1, pz);
      if (below === MOB_TYPES[type].spawnOn && here === BLOCK.AIR && above === BLOCK.AIR) {
        spawnMob(type, px + 0.5, y, pz + 0.5);
        return;
      }
    }
  }
}

// твёрдый ли блок для моба
function mobSolid(x, y, z) {
  const b = World.getBlock(x, y, z);
  if (b === BLOCK.AIR || isLiquid(b)) return false;
  if (b === BLOCK.NETHER_PORTAL) return false;
  if (isDoor(b) && isDoorOpen(x, y, z)) return false;
  return true;
}

// коллизия AABB для моба по одной оси
function mobCollide(p, axis, amount) {
  const hw = p.width/2, h = p.height;
  p.pos[axis] += amount;
  const minX = Math.floor(p.pos.x - hw), maxX = Math.floor(p.pos.x + hw);
  const minY = Math.floor(p.pos.y), maxY = Math.floor(p.pos.y + h);
  const minZ = Math.floor(p.pos.z - hw), maxZ = Math.floor(p.pos.z + hw);
  for (let x=minX;x<=maxX;x++) for (let y=minY;y<=maxY;y++) for (let z=minZ;z<=maxZ;z++) {
    if (!mobSolid(x,y,z)) continue;
    if (axis==='x'){ p.pos.x = amount>0 ? x-hw-1e-3 : x+1+hw+1e-3; p.vel.x=0; }
    else if (axis==='y'){ if(amount>0){p.pos.y=y-h-1e-3;p.vel.y=0;} else {p.pos.y=y+1+1e-3;p.vel.y=0;p.onGround=true;} }
    else { p.pos.z = amount>0 ? z-hw-1e-3 : z+1+hw+1e-3; p.vel.z=0; }
    return true;
  }
  return false;
}

function updateMobs(dt) {
  trySpawnMobs(dt);
  const pcx = Math.floor(PLAYER.pos.x / CHUNK_SIZE);
  const pcz = Math.floor(PLAYER.pos.z / CHUNK_SIZE);

  for (let i = mobs.length - 1; i >= 0; i--) {
    const p = mobs[i];

    // выгрузка слишком далёких мобов
    const dcx = Math.floor(p.pos.x / CHUNK_SIZE) - pcx;
    const dcz = Math.floor(p.pos.z / CHUNK_SIZE) - pcz;
    if (Math.abs(dcx) > RENDER_DISTANCE + 2 || Math.abs(dcz) > RENDER_DISTANCE + 2) {
      scene.remove(p.mesh); mobs.splice(i, 1); continue;
    }

    // --- ИИ ---
    p.hurtT = Math.max(0, p.hurtT - dt);
    p.attackCd = Math.max(0, (p.attackCd || 0) - dt);
    p.idleT -= dt;
    if (p.idleT <= 0) { p.idleT = 6 + Math.random()*10; if (dist2ToPlayer(p) < 26*26) playSound(p.def.idleSound); }

    let moving = false;
    let chasing = false;
    if ((p.aggro || 0) > 0) {
      // --- Агрессия: преследуем игрока и атакуем вблизи ---
      p.aggro -= dt;
      const d2 = dist2ToPlayer(p);
      if (d2 > 40*40) { p.aggro = 0; } // слишком далеко — теряем цель
      else {
        const ax = PLAYER.pos.x - p.pos.x, az = PLAYER.pos.z - p.pos.z;
        p.yaw = Math.atan2(ax, az);
        chasing = true; moving = true;
        // атака при контакте
        if (d2 < 2.0*2.0 && p.attackCd <= 0 && !PLAYER.dead) {
          p.attackCd = 1.0;
          damagePlayer(3, 'Вас убил зомби-пиглин');
          // отбросить игрока
          const len = Math.hypot(ax, az) || 1;
          PLAYER.vel.x += (ax/len)*3; PLAYER.vel.z += (az/len)*3; PLAYER.vel.y = 4;
        }
      }
    }
    if (!chasing) {
      if (p.flee > 0) {
        p.flee -= dt;
        const ax = p.pos.x - PLAYER.pos.x, az = p.pos.z - PLAYER.pos.z;
        p.yaw = Math.atan2(ax, az);
        moving = true;
      } else {
        p.stateT -= dt;
        if (p.stateT <= 0) {
          if (Math.random() < 0.5) { p.state = 'walk'; p.yaw = Math.random()*Math.PI*2; p.stateT = 2+Math.random()*4; }
          else { p.state = 'idle'; p.stateT = 1.5+Math.random()*3; }
        }
        moving = (p.state === 'walk');
      }
    }

    const speed = chasing ? 3.6 : (p.flee > 0 ? 3.2 : 1.4);
    if (moving) {
      const dirx = Math.sin(p.yaw), dirz = Math.cos(p.yaw);
      // избегать захода в воду: если впереди вода — развернуться (мобы реже сидят в воде)
      const ahx = Math.floor(p.pos.x + dirx*0.8), ahz = Math.floor(p.pos.z + dirz*0.8);
      const ahy = Math.floor(p.pos.y);
      const aheadWater = isWaterLiquid(World.getBlock(ahx, ahy, ahz)) || isWaterLiquid(World.getBlock(ahx, ahy-1, ahz));
      // не убегая в панике от воды разворачиваемся; при бегстве — продолжаем
      if (aheadWater && p.flee <= 0) {
        p.yaw += Math.PI * (0.5 + Math.random()*0.5);
        p.vel.x = 0; p.vel.z = 0;
        p.stateT = Math.min(p.stateT, 0.3);
      } else {
        p.vel.x = dirx * speed; p.vel.z = dirz * speed;
        const fx = Math.floor(p.pos.x + dirx*0.6), fz = Math.floor(p.pos.z + dirz*0.6);
        const fy = Math.floor(p.pos.y);
        if (p.onGround && mobSolid(fx, fy, fz) && !mobSolid(fx, fy+1, fz)) { p.vel.y = 7; p.onGround = false; }
      }
    } else { p.vel.x = 0; p.vel.z = 0; }

    // ВОДА (не лава): моб активно всплывает и держится на поверхности — «не дышит под водой».
    const headBlk = World.getBlock(Math.floor(p.pos.x), Math.floor(p.pos.y + p.height*0.7), Math.floor(p.pos.z));
    const feetBlk = World.getBlock(Math.floor(p.pos.x), Math.floor(p.pos.y + 0.2), Math.floor(p.pos.z));
    const headInWater = isWaterLiquid(headBlk);
    const inWater = isWaterLiquid(feetBlk) || headInWater;
    if (inWater) {
      // плавучесть ПЕРЕКРЫВАЕТ гравитацию: задаём целевую скорость всплытия,
      // чтобы моб поднимался к поверхности и держался на ней (не тонул, не «дышал под водой»).
      const target = headInWater ? 3.2 : 1.4;   // под водой — всплывать быстрее
      p.vel.y += (target - p.vel.y) * Math.min(1, dt * 8); // плавно к целевой
      // паническое стремление к ближайшей суше
      if (p.flee <= 0) { p.state = 'walk'; p.stateT = Math.max(p.stateT, 0.5); }
    } else {
      p.vel.y -= GRAVITY * dt;
      if (p.vel.y < -55) p.vel.y = -55;
    }

    // ЛАВА/ОГОНЬ: мобы горят и получают урон (как и игрок)
    const inLava = isLavaLiquid(feetBlk) || isLavaLiquid(headBlk) ||
                   isLavaLiquid(World.getBlock(Math.floor(p.pos.x), Math.floor(p.pos.y+p.height*0.4), Math.floor(p.pos.z)));
    const inFire = feetBlk === BLOCK.FIRE || World.getBlock(Math.floor(p.pos.x), Math.floor(p.pos.y+p.height*0.4), Math.floor(p.pos.z)) === BLOCK.FIRE;
    if (inLava) { p.burnTimer = Math.max(p.burnTimer || 0, 1.2); }
    else if (inFire) { p.burnTimer = Math.max(p.burnTimer || 0, 0.8); }
    if ((p.burnTimer || 0) > 0) {
      if (!inWater) {  // вода тушит
        p.burnTimer -= dt;
        p.burnTick = (p.burnTick || 0) + dt;
        const interval = inLava ? 0.5 : 1.0;
        if (p.burnTick >= interval) {
          p.burnTick = 0;
          p.hp -= inLava ? 3 : 1;
          p.hurtT = 0.3;
          if (p.hp <= 0) {
            // погиб от огня/лавы — выпадает (по возможности приготовленный) дроп
            const n = p.def.dropCount();
            const cookedMap = { [ITEM.PORK_RAW]: ITEM.PORK_COOKED, [ITEM.BEEF_RAW]: ITEM.BEEF_COOKED, [ITEM.CHICKEN_RAW]: ITEM.CHICKEN_COOKED };
            const dropId = cookedMap[p.def.drop] || p.def.drop;
            for (let k = 0; k < n; k++) spawnDrop(dropId, p.pos.x + (Math.random()-0.5)*0.4, p.pos.y + 0.4, p.pos.z + (Math.random()-0.5)*0.4);
            if (p.type === 'cow') { const lc=1+(Math.random()*2|0); for(let k=0;k<lc;k++) spawnDrop(ITEM.LEATHER, p.pos.x+(Math.random()-0.5)*0.4, p.pos.y+0.4, p.pos.z+(Math.random()-0.5)*0.4); }
            scene.remove(p.mesh); mobs.splice(i, 1); continue;
          }
        }
      } else { p.burnTimer = 0; }
    }

    p.onGround = false;
    mobCollide(p, 'y', p.vel.y * dt);
    mobCollide(p, 'x', p.vel.x * dt);
    mobCollide(p, 'z', p.vel.z * dt);

    if (moving && Math.abs(p.vel.x) < 0.01 && Math.abs(p.vel.z) < 0.01 && p.onGround && p.flee <= 0) {
      p.yaw = Math.random()*Math.PI*2; p.stateT = Math.min(p.stateT, 0.4);
    }

    if (p.pos.y < -8) { scene.remove(p.mesh); mobs.splice(i, 1); continue; }

    // --- Анимация ---
    p.mesh.position.copy(p.pos);
    let dy = p.yaw - p.mesh.rotation.y;
    while (dy > Math.PI) dy -= Math.PI*2; while (dy < -Math.PI) dy += Math.PI*2;
    p.mesh.rotation.y += dy * Math.min(1, dt*10);

    const legs = p.mesh.userData.legs;
    if (moving) {
      p.walkPhase += dt * (p.flee>0?14:8);
      const sw = Math.sin(p.walkPhase) * 0.6;
      // шагаем безопасно для любого числа ног (4 у свиньи/коровы, 2 у курицы)
      if (legs) for (let li = 0; li < legs.length; li++) {
        // передние/задние в противофазе, диагонали синхронны
        const dir = (li % 2 === 0) ? 1 : -1;
        legs[li].rotation.x = sw * dir;
      }
    } else if (legs) {
      for (const l of legs) l.rotation.x *= (1 - Math.min(1, dt*8));
    }
    const head = p.mesh.userData.head;
    if (head) head.rotation.x = Math.sin(p.walkPhase*0.5) * 0.05;
    p.mesh.scale.setScalar(p.hurtT > 0 ? 1.0 + Math.sin(p.hurtT*40)*0.06 : 1.0);
  }
}

function dist2ToPlayer(p) {
  const dx = p.pos.x - PLAYER.pos.x, dy = p.pos.y - PLAYER.pos.y, dz = p.pos.z - PLAYER.pos.z;
  return dx*dx + dy*dy + dz*dz;
}

// атака по мобу из прицела (вызывается при ЛКМ)
function tryAttackMob() {
  const origin = new THREE.Vector3(PLAYER.pos.x, PLAYER.pos.y + (PLAYER.crouching?PLAYER.crouchEye:PLAYER.eye), PLAYER.pos.z);
  const dir = new THREE.Vector3(
    -Math.sin(PLAYER.yaw)*Math.cos(PLAYER.pitch),
    Math.sin(PLAYER.pitch),
    -Math.cos(PLAYER.yaw)*Math.cos(PLAYER.pitch)
  ).normalize();
  let best = null, bestT = 4.0;
  for (const p of mobs) {
    const hw = p.width/2;
    const bmin = new THREE.Vector3(p.pos.x-hw, p.pos.y, p.pos.z-hw);
    const bmax = new THREE.Vector3(p.pos.x+hw, p.pos.y+p.height, p.pos.z+hw);
    const tHit = rayAABB(origin, dir, bmin, bmax);
    if (tHit !== null && tHit < bestT) { bestT = tHit; best = p; }
  }
  if (best) { hurtMob(best); return true; }
  return false;
}

function rayAABB(o, d, mn, mx) {
  let tmin = -Infinity, tmax = Infinity;
  for (const ax of ['x','y','z']) {
    if (Math.abs(d[ax]) < 1e-8) {
      if (o[ax] < mn[ax] || o[ax] > mx[ax]) return null;
    } else {
      let t1 = (mn[ax]-o[ax])/d[ax], t2 = (mx[ax]-o[ax])/d[ax];
      if (t1 > t2) { const tmp=t1;t1=t2;t2=tmp; }
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }
  }
  return tmin >= 0 ? tmin : (tmax >= 0 ? 0 : null);
}

function hurtMob(p) {
  // урон зависит от оружия: меч бьёт сильнее, кулак — 1
  const held = activeItem();
  const heldId = held ? held.id : 0;
  const dmg = isSword(heldId) ? swordDamage(heldId) : 1;
  p.hp -= dmg;
  p.hurtT = 0.3;
  addExhaustion(0.1); // атака тратит голод
  playSound(p.def.hurtSound);
  // Враждебные пачные мобы (пиглины): при ударе агрятся сами + вся стая (пока кто-то жив)
  if (p.def && p.def.hostile) {
    p.aggro = 30;
    if (p.def.pack) {
      for (const m of mobs) if (m.type === p.type && dist2Between(m, p) < 24*24) m.aggro = Math.max(m.aggro||0, 30);
    }
  } else {
    p.flee = 3 + Math.random()*2; // мирные — убегают
  }
  const ax = p.pos.x - PLAYER.pos.x, az = p.pos.z - PLAYER.pos.z;
  const len = Math.hypot(ax, az) || 1;
  p.vel.x += (ax/len) * 4; p.vel.z += (az/len) * 4; p.vel.y = 4;
  if (p.hp <= 0) {
    // выпадает дроп
    const n = p.def.dropCount();
    for (let k = 0; k < n; k++) spawnDrop(p.def.drop, p.pos.x + (Math.random()-0.5)*0.4, p.pos.y + 0.4, p.pos.z + (Math.random()-0.5)*0.4);
    // коровы дополнительно роняют кожу
    if (p.type === 'cow') { const lc = 1 + (Math.random()*2|0); for (let k=0;k<lc;k++) spawnDrop(ITEM.LEATHER, p.pos.x+(Math.random()-0.5)*0.4, p.pos.y+0.4, p.pos.z+(Math.random()-0.5)*0.4); }
    const idx = mobs.indexOf(p);
    scene.remove(p.mesh);
    if (idx >= 0) mobs.splice(idx, 1);
  }
}
function dist2Between(a, b) {
  const dx=a.pos.x-b.pos.x, dy=a.pos.y-b.pos.y, dz=a.pos.z-b.pos.z;
  return dx*dx+dy*dy+dz*dz;
}


// ============================================================
//  Ломать / ставить
// ============================================================
function finishBreak(t) {
  if (!t) return;
  if (t.block === BLOCK.BEDROCK) return; // бедрок не ломается
  const broken = t.block;

  // Двери: ломаем обе половины
  if (isDoor(broken)) {
    const byd = broken === BLOCK.DOOR_BOTTOM ? t.y : t.y - 1;
    const otherY = broken === BLOCK.DOOR_BOTTOM ? t.y + 1 : t.y - 1;
    World.setBlock(t.x, t.y, t.z, BLOCK.AIR);
    if (isDoor(World.getBlock(t.x, otherY, t.z))) World.setBlock(t.x, otherY, t.z, BLOCK.AIR);
    World.doorState.delete(World.ekey(t.x, byd, t.z));
    spawnDrop(ITEM.DOOR, t.x + 0.5, t.y + 0.5, t.z + 0.5);
    rebuildAround(t.x, t.z);
    playSound('break', BLOCK.PLANKS);
    return;
  }

  // Печь: вернуть содержимое и удалить состояние
  if (broken === BLOCK.FURNACE) {
    const fk = World.ekey(t.x, t.y, t.z);
    const f = World.furnaces.get(fk);
    if (f) {
      for (const it of [f.input, f.fuel, f.output]) if (it) spawnDrop(it.id, t.x + 0.5, t.y + 0.7, t.z + 0.5);
      World.furnaces.delete(fk);
    }
    if (openFurnacePos && fk === World.ekey(openFurnacePos.x, openFurnacePos.y, openFurnacePos.z) && invOpen) {
      toggleInventory();
    }
  }

  // Сундук: выбросить содержимое только этой половины и разорвать связь двойного
  if (broken === BLOCK.CHEST) {
    const ck = World.ekey(t.x, t.y, t.z);
    // если открыт интерфейс этого (или партнёрского) сундука — закрыть
    if (openChestPos && invOpen) {
      const ok = World.ekey(openChestPos.x, openChestPos.y, openChestPos.z);
      const part = World.doubleChests.get(ck);
      if (ok === ck || ok === part) toggleInventory();
    }
    // разорвать связь двойного сундука
    const partner = World.doubleChests.get(ck);
    if (partner) { World.doubleChests.delete(ck); World.doubleChests.delete(partner); }
    const arr = World.chests.get(ck);
    if (arr) {
      for (const it of arr) if (it) for (let n = 0; n < it.count; n++) spawnDrop(it.id, t.x + 0.5, t.y + 0.7, t.z + 0.5);
      World.chests.delete(ck);
    }
  }

  World.setBlock(t.x, t.y, t.z, BLOCK.AIR);

  // что выпадает
  let dropId = broken;
  const held = activeItem();
  const tier = held ? pickaxeTier(held.id) : 0;
  const havePick = tier >= 1;

  if (broken === BLOCK.GRASS) dropId = BLOCK.DIRT;
  else if (broken === BLOCK.LEAVES) dropId = null;       // из листвы ничего
  else if (broken === BLOCK.GLASS) dropId = null;        // стекло разбивается
  else if (broken === BLOCK.STONE) dropId = havePick ? BLOCK.COBBLESTONE : null; // камень -> булыжник только киркой
  else if (broken === BLOCK.COBBLESTONE) dropId = havePick ? BLOCK.COBBLESTONE : null;
  else if (broken === BLOCK.FURNACE) dropId = havePick ? BLOCK.FURNACE : null;
  else if (broken === BLOCK.COAL_ORE) dropId = havePick ? ITEM.COAL : null; // уголь только киркой
  else if (broken === BLOCK.IRON_ORE) dropId = (tier >= 2) ? BLOCK.IRON_ORE : null; // железную руду — каменной киркой+, плавить в печи
  else if (broken === BLOCK.COPPER_ORE) dropId = (tier >= 2) ? BLOCK.COPPER_ORE : null; // медную руду — каменной киркой+, плавить в печи
  else if (broken === BLOCK.DIAMOND_ORE) dropId = (tier >= 4) ? ITEM.DIAMOND : null; // алмаз — только железной киркой+
  else if (broken === BLOCK.OBSIDIAN) dropId = (tier >= 5) ? BLOCK.OBSIDIAN : null; // обсидиан — только алмазной киркой
  else if (broken === BLOCK.GRAVEL) dropId = (Math.random() < 0.16) ? ITEM.FLINT : BLOCK.GRAVEL; // 16% шанс кремня, иначе гравий
  else if (broken === BLOCK.NETHERRACK) dropId = havePick ? BLOCK.NETHERRACK : null;
  else if (broken === BLOCK.GLOWSTONE) dropId = havePick ? BLOCK.GLOWSTONE : null;

  if (dropId !== null) {
    spawnDrop(dropId, t.x + 0.5, t.y + 0.5, t.z + 0.5);
    onObtain(dropId); // отметить как открытый ресурс (для справочника)
  }

  addExhaustion(0.05); // ломание блоков тратит голод
  rebuildAround(t.x, t.z);
  playSound('break', broken);
  WaterSim.touchAround(t.x, t.y, t.z); LavaSim.touchAround(t.x, t.y, t.z); // вода/лава может затечь в дыру
  checkSandAround(t.x, t.y, t.z);      // песок сверху может обвалиться

  // сломали ствол — листва вокруг начнёт затухать (проверяем зону)
  if (broken === BLOCK.WOOD || broken === BLOCK.LEAVES) {
    scheduleLeafDecayAround(t.x, t.y, t.z);
  }

  // если над сломанным блоком стояла дверь без опоры — она падает (ломается)
  if (World.getBlock(t.x, t.y + 1, t.z) === BLOCK.DOOR_BOTTOM) {
    World.setBlock(t.x, t.y + 1, t.z, BLOCK.AIR);
    if (World.getBlock(t.x, t.y + 2, t.z) === BLOCK.DOOR_TOP) World.setBlock(t.x, t.y + 2, t.z, BLOCK.AIR);
    World.doorState.delete(World.ekey(t.x, t.y + 1, t.z));
    spawnDrop(ITEM.DOOR, t.x + 0.5, t.y + 1.5, t.z + 0.5);
    rebuildAround(t.x, t.z);
  }
}

// заменить ОДНУ единицу из активного слота на другой предмет (для вёдер)
function swapActiveOneTo(newId) {
  const slot = activeItem();
  if (!slot) return;
  if (slot.count <= 1) {
    slots[activeSlot] = { id: newId, count: 1 };
  } else {
    slot.count--;
    // положить новый предмет в инвентарь
    addToInventory(newId, 1);
  }
  onObtain(newId);
  refreshUI();
}

// Ведро: пустое — набрать ИСТОЧНИК воды/лавы; полное — вылить источник.
// Проверка: целевая ячейка (внутри проёма) — часть портала в Ад?
// Простой критерий: с обеих сторон по одной из горизонтальных осей стоит обсидиан,
// и снизу тоже обсидиан (рамка). Этого достаточно для триггера-заглушки.
function isNetherPortalSpot(x, y, z) {
  // под ячейкой должен быть обсидиан (основание рамки)
  if (World.getBlock(x, y - 1, z) !== BLOCK.OBSIDIAN) return false;
  // обе стороны вдоль оси заканчиваются обсидианом в пределах 4 клеток (проём рамки)
  const axisHasWalls = (dx, dz) => {
    let posWall = false, negWall = false;
    for (let s = 1; s <= 4; s++) {
      const a = World.getBlock(x + dx*s, y, z + dz*s);
      if (!posWall) { if (a === BLOCK.OBSIDIAN) posWall = true; else if (a !== BLOCK.AIR && a !== BLOCK.FIRE) break; }
    }
    for (let s = 1; s <= 4; s++) {
      const b = World.getBlock(x - dx*s, y, z - dz*s);
      if (!negWall) { if (b === BLOCK.OBSIDIAN) negWall = true; else if (b !== BLOCK.AIR && b !== BLOCK.FIRE) break; }
    }
    return posWall && negWall;
  };
  return axisHasWalls(1, 0) || axisHasWalls(0, 1);
}

// Активировать портал: залить внутренний проём рамки блоками портала.
// Возвращает true, если портал зажёгся. (Телепортации нет — пока заглушка.)
function activateNetherPortal(x, y, z) {
  // ось проёма: вдоль X или Z (где стоят обсидиановые стенки)
  const axisX = (() => { // стенки слева/справа по X => проём по X
    let p=false,n=false;
    for (let s=1;s<=4;s++){const a=World.getBlock(x+s,y,z); if(!p){if(a===BLOCK.OBSIDIAN)p=true; else if(a!==BLOCK.AIR&&a!==BLOCK.FIRE)break;}}
    for (let s=1;s<=4;s++){const b=World.getBlock(x-s,y,z); if(!n){if(b===BLOCK.OBSIDIAN)n=true; else if(b!==BLOCK.AIR&&b!==BLOCK.FIRE)break;}}
    return p&&n;
  })();
  const dirX = axisX ? 1 : 0, dirZ = axisX ? 0 : 1;
  // flood-fill проёма (воздух/огонь), ограничен обсидианом, лимит на размер
  const fill = [];
  const seen = new Set();
  const stack = [[x,y,z]];
  let ok = true;
  while (stack.length) {
    const [cx,cy,cz] = stack.pop();
    const k = cx+','+cy+','+cz;
    if (seen.has(k)) continue;
    seen.add(k);
    const b = World.getBlock(cx,cy,cz);
    if (b === BLOCK.OBSIDIAN) continue;          // граница
    if (b !== BLOCK.AIR && b !== BLOCK.FIRE && b !== BLOCK.NETHER_PORTAL) { ok = false; break; } // не замкнут
    fill.push([cx,cy,cz]);
    if (fill.length > 30) { ok = false; break; } // слишком большой/открытый — не портал
    // распространяемся вверх/вниз и вдоль оси проёма
    stack.push([cx,cy+1,cz]); stack.push([cx,cy-1,cz]);
    stack.push([cx+dirX,cy,cz+dirZ]); stack.push([cx-dirX,cy,cz-dirZ]);
  }
  if (!ok || fill.length === 0) return false;
  for (const [cx,cy,cz] of fill) World.setBlock(cx, cy, cz, BLOCK.NETHER_PORTAL);
  for (const [cx,cy,cz] of fill) rebuildAround(cx, cz);
  return true;
}

// Зажигалка: поджечь блок (создать огонь над ним) или активировать портал.
function useFlintAndSteel(t, slot) {
  if (!t) return;
  const nx = t.x + t.face[0], ny = t.y + t.face[1], nz = t.z + t.face[2];
  if (ny < 0 || ny >= WORLD_HEIGHT) return;
  // Портал в Ад: активируется (заливается порталом), ведёт в Ад
  if (isNetherPortalSpot(nx, ny, nz)) {
    if (activateNetherPortal(nx, ny, nz)) {
      showToast('Портал активирован');
      playSound('place', BLOCK.WOOD);
      if (useDurability(slot) || (slot.count <= 0)) { if (slot.count <= 0) slots[activeSlot] = null; }
      refreshUI();
    }
    return;
  }
  // огонь ставится только в воздух и на «опору» снизу/сбоку
  if (World.getBlock(nx, ny, nz) !== BLOCK.AIR) return;
  const support = World.getBlock(nx, ny - 1, nz);
  const canLight = support !== BLOCK.AIR && !isLiquid(support);
  if (!canLight) return;
  FireSim.add(nx, ny, nz);
  playSound('place', BLOCK.WOOD);
  // расход прочности
  if (useDurability(slot) || (slot.count <= 0)) { if (slot.count <= 0) slots[activeSlot] = null; }
  refreshUI();
}

// Лодка: поставить на воду/землю перед игроком
function placeBoat(t, slot) {
  if (!t) return;
  const nx = t.x + t.face[0], ny = t.y + t.face[1], nz = t.z + t.face[2];
  if (ny < 0 || ny >= WORLD_HEIGHT) return;
  // ставим лодку в воздух/на воду
  const target = World.getBlock(nx, ny, nz);
  if (target !== BLOCK.AIR && !isWaterLiquid(target)) return;
  spawnBoat(nx + 0.5, ny + 0.2, nz + 0.5);
  slot.count--; if (slot.count <= 0) slots[activeSlot] = null;
  refreshUI();
  playSound('place', BLOCK.PLANKS);
}

function useBucket(slot) {
  if (slot.id === ITEM.BUCKET) {
    // целимся в жидкость (луч останавливается на жидкости)
    const t = getTargetBlock(6, true);
    if (!t) return;
    if (t.block === BLOCK.WATER) {
      World.clearLevel(t.x, t.y, t.z); World.setBlock(t.x, t.y, t.z, BLOCK.AIR);
      LiquidSim.touchAround(t.x, t.y, t.z); rebuildAround(t.x, t.z);
      swapActiveOneTo(ITEM.WATER_BUCKET); playSound('splash');
    } else if (t.block === BLOCK.LAVA) {
      World.clearLevel(t.x, t.y, t.z); World.setBlock(t.x, t.y, t.z, BLOCK.AIR);
      LiquidSim.touchAround(t.x, t.y, t.z); rebuildAround(t.x, t.z);
      swapActiveOneTo(ITEM.LAVA_BUCKET); playSound('splash');
    }
    // течение (flow) нельзя набрать — только источник (как просил пользователь)
    return;
  }
  // полное ведро — вылить источник в воздух/на грань блока
  const t = getTargetBlock(6, false);
  if (!t) return;
  let nx = t.x + t.face[0], ny = t.y + t.face[1], nz = t.z + t.face[2];
  // если целимся в жидкость — заменить её саму
  const tgt = World.getBlock(nx, ny, nz);
  if (tgt !== BLOCK.AIR && !isLiquid(tgt)) return; // только в воздух/жидкость
  if (ny < 0 || ny >= WORLD_HEIGHT) return;
  const liquid = slot.id === ITEM.WATER_BUCKET ? BLOCK.WATER : BLOCK.LAVA;
  World.clearLevel(nx, ny, nz);
  World.setBlock(nx, ny, nz, liquid);
  LiquidSim.touchAround(nx, ny, nz);
  rebuildAround(nx, nz);
  swapActiveOneTo(ITEM.BUCKET); // ведро пустеет
  playSound('splash');
}

function placeBlock() {
  // сесть в ближайшую лодку (если смотрим в её сторону и она рядом)
  if (!PLAYER.riding) {
    const b = nearestBoat(2.4);
    if (b) { b.rider = true; PLAYER.riding = b; PLAYER.vel.set(0,0,0); return; }
  }

  const t = getTargetBlock();
  if (!t) return;

  // ПКМ по верстаку — открыть крафт 3x3
  if (t.block === BLOCK.CRAFTING_TABLE) {
    toggleInventory('3x3');
    return;
  }
  // ПКМ по печи — открыть интерфейс плавки
  if (t.block === BLOCK.FURNACE) {
    openFurnace(t.x, t.y, t.z);
    return;
  }
  // ПКМ по сундуку — открыть хранилище
  if (t.block === BLOCK.CHEST) {
    openChest(t.x, t.y, t.z);
    return;
  }
  // ПКМ по двери — открыть/закрыть
  if (isDoor(t.block)) {
    toggleDoor(t.x, t.y, t.z);
    return;
  }

  const slot = activeItem();
  if (!slot || slot.count <= 0) return;
  // вёдра — особая обработка (набрать/вылить жидкость)
  if (slot.id === ITEM.BUCKET || slot.id === ITEM.WATER_BUCKET || slot.id === ITEM.LAVA_BUCKET) { useBucket(slot); return; }
  // зажигалка — поджечь
  if (slot.id === ITEM.FLINT_AND_STEEL) { useFlintAndSteel(t, slot); return; }
  // лодка — спустить на воду
  if (slot.id === ITEM.BOAT) { placeBoat(t, slot); return; }
  // броня — надеть по ПКМ
  if (isArmor(slot.id)) { equipArmor(slot); return; }
  // еда — съедаем по ПКМ
  if (isFood(slot.id)) { tryEat(); return; }
  // палка/кирка не ставятся
  if (!isBlock(slot.id) && slot.id !== ITEM.DOOR) return;

  const nx = t.x + t.face[0];
  const ny = t.y + t.face[1];
  const nz = t.z + t.face[2];
  if (ny < 0 || ny >= WORLD_HEIGHT) return;
  const target = World.getBlock(nx, ny, nz);
  if (target !== BLOCK.AIR && !isLiquid(target)) return; // можно ставить только в воздух/воду

  // ---- Дверь: два блока в высоту ----
  if (slot.id === ITEM.DOOR) {
    const aboveOk = World.getBlock(nx, ny + 1, nz);
    if (ny + 1 >= WORLD_HEIGHT || (aboveOk !== BLOCK.AIR && !isLiquid(aboveOk))) return;
    if (intersectsPlayer(nx, ny, nz) || intersectsPlayer(nx, ny + 1, nz)) return;
    // нужна опора снизу
    if (canFallInto(World.getBlock(nx, ny - 1, nz))) return;
    slot.count--; if (slot.count <= 0) slots[activeSlot] = null;
    refreshUI();
    // ориентация двери по взгляду: «перед» (лицо) смотрит на игрока
    const lookD = new THREE.Vector3(
      -Math.sin(PLAYER.yaw) * Math.cos(PLAYER.pitch),
      Math.sin(PLAYER.pitch),
      -Math.cos(PLAYER.yaw) * Math.cos(PLAYER.pitch)
    );
    let dfront, frontAxis, frontSide;
    if (Math.abs(lookD.x) >= Math.abs(lookD.z)) {
      dfront = lookD.x > 0 ? FACE_NX : FACE_PX; frontAxis = 'x'; frontSide = (dfront === FACE_PX) ? 1 : -1;
    } else {
      dfront = lookD.z > 0 ? FACE_NZ : FACE_PZ; frontAxis = 'z'; frontSide = (dfront === FACE_PZ) ? 1 : -1;
    }
    // выбор стороны петли: по умолчанию справа (если смотреть со стороны лица).
    // если у «правого» косяка нет опоры, а у «левого» есть дверь/блок — петля слева.
    // право/лево наблюдателя, стоящего перед дверью лицом к ней:
    let rightCell, leftCell; // соседние ячейки [dx,dz]
    if (frontAxis === 'z') {
      // лицо вдоль Z. при front=+Z право = -X, при front=-Z право = +X
      const rx = (frontSide > 0) ? -1 : 1;
      rightCell = [rx, 0]; leftCell = [-rx, 0];
    } else {
      // лицо вдоль X. при front=+X право = +Z, при front=-X право = -Z
      const rz = (frontSide > 0) ? 1 : -1;
      rightCell = [0, rz]; leftCell = [0, -rz];
    }
    const isWallOrDoor = (cx, cz) => {
      const bb = World.getBlock(cx, ny, cz);
      const bt = World.getBlock(cx, ny + 1, cz);
      return (bb !== BLOCK.AIR && !isLiquid(bb)) || (bt !== BLOCK.AIR && !isLiquid(bt));
    };
    let hinge = 'right';
    const rightHasNeighbor = isWallOrDoor(nx + rightCell[0], nz + rightCell[1]);
    const leftHasNeighbor  = isWallOrDoor(nx + leftCell[0],  nz + leftCell[1]);
    // петля прислоняется к соседней стене: если стена справа — петля справа; если только слева — слева
    if (!rightHasNeighbor && leftHasNeighbor) hinge = 'left';
    World.setBlock(nx, ny, nz, BLOCK.DOOR_BOTTOM);
    World.setBlock(nx, ny + 1, nz, BLOCK.DOOR_TOP);
    World.facing.set(World.ekey(nx, ny, nz), dfront);
    World.facing.set(World.ekey(nx, ny + 1, nz), dfront);
    World.doorState.set(World.ekey(nx, ny, nz), { open: false, hinge });
    rebuildAround(nx, nz);
    playSound('place', BLOCK.PLANKS);
    return;
  }

  // не ставить блок внутрь игрока
  if (intersectsPlayer(nx, ny, nz)) return;

  const placeId = slot.id;
  // списать 1 штуку из активного слота
  slot.count--; if (slot.count <= 0) slots[activeSlot] = null;
  refreshUI();

  World.setBlock(nx, ny, nz, placeId);
  // ориентация по направлению взгляда игрока
  const look = new THREE.Vector3(
    -Math.sin(PLAYER.yaw) * Math.cos(PLAYER.pitch),
    Math.sin(PLAYER.pitch),
    -Math.cos(PLAYER.yaw) * Math.cos(PLAYER.pitch)
  );
  const front = computePlaceFront(placeId, look);
  const isLogBlock = (placeId === BLOCK.WOOD);
  // для брёвен «по умолчанию» (без записи) — вертикаль; поэтому пишем запись для X/Z осей
  const defaultFront = isLogBlock ? FACE_PY : FACE_PZ;
  if (front !== defaultFront) World.facing.set(World.ekey(nx, ny, nz), front);
  else World.facing.delete(World.ekey(nx, ny, nz));

  // ---- Двойной сундук: при установке рядом с одиночным объединяем (если не зажат Shift) ----
  if (placeId === BLOCK.CHEST && !PLAYER.crouching) {
    const merge = findChestToMerge(nx, ny, nz, World.facing.get(World.ekey(nx, ny, nz)));
    if (merge) {
      const k1 = World.ekey(nx, ny, nz), k2 = World.ekey(merge.x, merge.y, merge.z);
      World.doubleChests.set(k1, k2);
      World.doubleChests.set(k2, k1);
    }
  }

  rebuildAround(nx, nz);
  playSound('place', placeId);
  WaterSim.touchAround(nx, ny, nz); LavaSim.touchAround(nx, ny, nz); // вытеснение/перетекание жидкостей
  if (isFalling(placeId)) checkSand(nx, ny, nz); // поставленный песок может упасть
}

// ============================================================
//  Печь (плавка)
// ============================================================
// Что во что плавится
const SMELT = {
  [BLOCK.SAND]: { id: BLOCK.GLASS, count: 1 },
  [ITEM.PORK_RAW]: { id: ITEM.PORK_COOKED, count: 1 },
  [ITEM.BEEF_RAW]: { id: ITEM.BEEF_COOKED, count: 1 },
  [ITEM.CHICKEN_RAW]: { id: ITEM.CHICKEN_COOKED, count: 1 },
  [BLOCK.WOOD]: { id: ITEM.CHARCOAL, count: 1 }, // дерево -> древесный уголь
  [BLOCK.IRON_ORE]: { id: ITEM.IRON_INGOT, count: 1 }, // железная руда -> слиток
  [BLOCK.COPPER_ORE]: { id: ITEM.COPPER_INGOT, count: 1 }, // медная руда -> медный слиток
};
function isSmeltable(id) { return SMELT[id] !== undefined; }
// Топливо: сколько предметов сжигает 1 единица (больше = горит дольше)
const FUEL = {
  [BLOCK.PLANKS]: 1.5,
  [BLOCK.WOOD]: 1.5,
  [ITEM.DOOR]: 1,
  [ITEM.STICK]: 0.5,
  [BLOCK.CRAFTING_TABLE]: 1.5,
  [BLOCK.CHEST]: 1.5,
  [ITEM.CHARCOAL]: 8,  // древесный уголь — золотая середина
  [ITEM.COAL]: 10,     // уголь — лучшее топливо
};
function isFuel(id) { return FUEL[id] !== undefined; }

const COOK_TIME = 4; // сек на 1 предмет

let openFurnacePos = null; // {x,y,z} текущая открытая печь
let openChestPos = null;   // {x,y,z} текущий открытый сундук
const CHEST_SIZE = 27;     // слотов в сундуке

function getChest(x, y, z) {
  const k = World.ekey(x, y, z);
  let arr = World.chests.get(k);
  if (!arr) { arr = new Array(CHEST_SIZE).fill(null); World.chests.set(k, arr); }
  return arr;
}

// партнёр двойного сундука: возвращает {x,y,z} или null
function chestPartner(x, y, z) {
  const k = World.ekey(x, y, z);
  const pk = World.doubleChests.get(k);
  if (!pk) return null;
  // проверяем, что партнёр всё ещё сундук
  const [px, py, pz] = pk.split(',').map(Number);
  if (World.getBlock(px, py, pz) !== BLOCK.CHEST) { World.doubleChests.delete(k); World.doubleChests.delete(pk); return null; }
  return { x: px, y: py, z: pz };
}

// найти соседний одиночный сундук той же ориентации для объединения в двойной
function findChestToMerge(x, y, z, front) {
  const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
  for (const [dx, dz] of dirs) {
    const nx = x+dx, nz = z+dz, k = World.ekey(nx, y, nz);
    if (World.getBlock(nx, y, nz) !== BLOCK.CHEST) continue;
    if (World.doubleChests.has(k)) continue;           // уже двойной
    // объединяем только сундуки с одинаковой ориентацией
    const nf = World.facing.get(k);
    if (nf !== front) continue;
    // двойной должен расширяться перпендикулярно «переду» (как в майне), но упростим: любой сосед
    return { x: nx, y, z: nz };
  }
  return null;
}

// Объединённый «вид» слотов сундука: 27 (одиночный) или 54 (двойной).
// Возвращает Proxy-массив, чтение/запись которого идёт в реальные хранилища.
function chestView(x, y, z) {
  const a = getChest(x, y, z);
  const partner = chestPartner(x, y, z);
  if (!partner) return a;
  // упорядочим: «первичная» половина — с меньшим ключом, чтобы порядок был стабилен
  const b = getChest(partner.x, partner.y, partner.z);
  const k1 = World.ekey(x,y,z), k2 = World.ekey(partner.x,partner.y,partner.z);
  const first = (k1 <= k2) ? a : b, second = (k1 <= k2) ? b : a;
  return new Proxy({}, {
    get(_, prop) {
      if (prop === 'length') return CHEST_SIZE * 2;
      const i = +prop;
      if (Number.isInteger(i)) return i < CHEST_SIZE ? first[i] : second[i - CHEST_SIZE];
      return undefined;
    },
    set(_, prop, val) {
      const i = +prop;
      if (Number.isInteger(i)) { if (i < CHEST_SIZE) first[i] = val; else second[i - CHEST_SIZE] = val; }
      return true;
    }
  });
}

function chestSlotCount(x, y, z) { return chestPartner(x, y, z) ? CHEST_SIZE * 2 : CHEST_SIZE; }

function openChest(x, y, z) {
  openChestPos = { x, y, z };
  toggleInventory('chest');
}

function getFurnace(x, y, z) {
  const k = World.ekey(x, y, z);
  let f = World.furnaces.get(k);
  if (!f) { f = { input: null, fuel: null, output: null, burn: 0, burnMax: 0, cook: 0 }; World.furnaces.set(k, f); }
  return f;
}

function openFurnace(x, y, z) {
  openFurnacePos = { x, y, z };
  toggleInventory('furnace');
}

// прогресс плавки во всех активных печах
function updateFurnaces(dt) {
  for (const [k, f] of World.furnaces) {
    const wasLit = f.burn > 0;
    const canSmelt = f.input && isSmeltable(f.input.id) &&
      (!f.output || (f.output.id === SMELT[f.input.id].id && f.output.count < MAX_STACK));
    // зажечь топливо при необходимости
    if (f.burn <= 0 && canSmelt && f.fuel && isFuel(f.fuel.id)) {
      f.burnMax = FUEL[f.fuel.id] * COOK_TIME;
      f.burn = f.burnMax;
      f.fuel.count--; if (f.fuel.count <= 0) f.fuel = null;
    }
    if (f.burn > 0) {
      f.burn -= dt;
      if (canSmelt) {
        f.cook += dt;
        if (f.cook >= COOK_TIME) {
          f.cook = 0;
          const res = SMELT[f.input.id];
          f.input.count--; if (f.input.count <= 0) f.input = null;
          if (!f.output) f.output = { id: res.id, count: res.count };
          else f.output.count += res.count;
          playSound('place', res.id);
        }
      } else {
        f.cook = 0;
      }
    } else {
      f.cook = 0;
    }
    // если изменилось состояние «горит/потухла» — перестроить чанк (для текстуры топки)
    const nowLit = f.burn > 0;
    if (nowLit !== wasLit) {
      const [fx, , fz] = k.split(',').map(Number);
      rebuildAround(fx, fz);
    }
    // обновить UI, если эта печь открыта
    if (openFurnacePos && World.ekey(openFurnacePos.x, openFurnacePos.y, openFurnacePos.z) === k && invOpen) {
      renderInventory();
    }
  }
}

// открыть/закрыть дверь (упрощённо: убираем/возвращаем коллизию делая её проходимой)
function toggleDoor(x, y, z) {
  // найти нижнюю половину
  let by = y;
  if (World.getBlock(x, y, z) === BLOCK.DOOR_TOP) by = y - 1;
  const key = World.ekey(x, by, z);
  const st = World.doorState.get(key) || { open: false, hinge: 'right' };
  st.open = !st.open;
  if (!st.hinge) st.hinge = 'right';
  World.doorState.set(key, st);
  rebuildAround(x, z);
  playSound('place', BLOCK.PLANKS);
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
    shadowNeedsUpdate = true; // геометрия изменилась — обновить тени
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
// твёрдый ли блок для коллизий
function isSolidForPlayer(x, y, z) {
  const bb = World.getBlock(x, y, z);
  if (bb === BLOCK.AIR || isLiquid(bb)) return false;
  if (bb === BLOCK.NETHER_PORTAL) return false; // сквозь портал можно пройти
  if (isDoor(bb)) return false; // двери обрабатываются отдельно (тонкая AABB)
  return true;
}

// мировая AABB двери (тонкая панель). Возвращает {x1,x2,z1,z2} в мировых координатах.
function doorWorldBox(x, y, z) {
  const ab = doorAABB(x, y, z);
  return { x1: x + ab.x1, x2: x + ab.x2, z1: z + ab.z1, z2: z + ab.z2 };
}

// пересекает ли текущий AABB игрока тонкую панель двери в ячейке (x,y,z)
function playerHitsDoor(x, y, z) {
  const hw = PLAYER.width / 2;
  const pminX = PLAYER.pos.x - hw, pmaxX = PLAYER.pos.x + hw;
  const pminY = PLAYER.pos.y, pmaxY = PLAYER.pos.y + PLAYER.height;
  const pminZ = PLAYER.pos.z - hw, pmaxZ = PLAYER.pos.z + hw;
  if (pmaxY <= y || pminY >= y + 1) return null; // по высоте не пересекается
  const bx = doorWorldBox(x, y, z);
  if (pmaxX <= bx.x1 || pminX >= bx.x2) return null;
  if (pmaxZ <= bx.z1 || pminZ >= bx.z2) return null;
  return bx;
}

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
        // ---- Двери: тонкая коллизия (закрытая блокирует только свою панель) ----
        if (isDoor(bb)) {
          if (isDoorOpen(x, y, z)) continue; // открытая дверь сквозная (через свою панель)
          const bx = playerHitsDoor(x, y, z);
          if (!bx) continue;
          if (amount === 0) return true;
          if (axis === 'x') {
            if (amount > 0) PLAYER.pos.x = bx.x1 - hw - 1e-3;
            else PLAYER.pos.x = bx.x2 + hw + 1e-3;
            PLAYER.vel.x = 0;
          } else if (axis === 'z') {
            if (amount > 0) PLAYER.pos.z = bx.z1 - hw - 1e-3;
            else PLAYER.pos.z = bx.z2 + hw + 1e-3;
            PLAYER.vel.z = 0;
          } else { // y — дверь полная по высоте, ведём себя как обычно
            if (amount > 0) { PLAYER.pos.y = y - h - 1e-3; PLAYER.vel.y = 0; }
            else { PLAYER.pos.y = y + 1 + 1e-3; PLAYER.vel.y = 0; PLAYER.onGround = true; }
          }
          return true;
        }
        if (!isSolidForPlayer(x, y, z)) continue;
        if (amount === 0) return true;
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

// проверка: пересекает ли AABB игрока хоть один твёрдый блок (засыпало/застрял)
function playerStuck() {
  const hw = PLAYER.width / 2;
  const h = PLAYER.height;
  const minX = Math.floor(PLAYER.pos.x - hw + 1e-3);
  const maxX = Math.floor(PLAYER.pos.x + hw - 1e-3);
  const minY = Math.floor(PLAYER.pos.y + 1e-3);
  const maxY = Math.floor(PLAYER.pos.y + h - 1e-3);
  const minZ = Math.floor(PLAYER.pos.z - hw + 1e-3);
  const maxZ = Math.floor(PLAYER.pos.z + hw - 1e-3);
  for (let x = minX; x <= maxX; x++)
    for (let y = minY; y <= maxY; y++)
      for (let z = minZ; z <= maxZ; z++)
        if (isSolidForPlayer(x, y, z)) return true;
  return false;
}

// Если игрока зажало блоками (например, засыпало песком) — мягко выталкиваем ВВЕРХ,
// как в Minecraft, вместо швыряния по горизонтали.
function antiSuffocate(dt) {
  if (!playerStuck()) return;
  PLAYER.vel.x = 0; PLAYER.vel.z = 0;
  // поднимаем понемногу, пока не освободимся (с ограничением за кадр)
  let steps = 0;
  while (playerStuck() && steps < 8) {
    PLAYER.pos.y += 0.25;
    PLAYER.vel.y = 0;
    steps++;
  }
  // плавный «выдавливающий» импульс вверх, чтобы выбраться над поверхностью
  PLAYER.vel.y = Math.max(PLAYER.vel.y, 1.5);
  PLAYER.onGround = false;
}

function updatePlayer(dt) {
  PLAYER.crouching = !!keys['ShiftLeft'];

  // --- В лодке: физикой управляет лодка; выходим по Space/Shift ---
  if (PLAYER.riding) {
    // если лодка пропала из массива — слезть
    if (!boats.includes(PLAYER.riding)) { PLAYER.riding = null; }
    else {
      if (keys['Space'] || keys['ShiftLeft']) {
        PLAYER.riding.rider = false; PLAYER.riding = null;
        PLAYER.pos.y += 0.6; PLAYER.vel.set(0, 1, 0);
      }
      return; // движение игрока — через updateBoats
    }
  }

  // направление ввода (относительно взгляда по горизонтали)
  const forward = new THREE.Vector3(-Math.sin(PLAYER.yaw), 0, -Math.cos(PLAYER.yaw));
  const right = new THREE.Vector3(Math.cos(PLAYER.yaw), 0, -Math.sin(PLAYER.yaw));

  const move = new THREE.Vector3();
  if (keys['KeyW']) move.add(forward);
  if (keys['KeyS']) move.sub(forward);
  if (keys['KeyD']) move.add(right);
  if (keys['KeyA']) move.sub(right);
  if (move.lengthSq() > 0) move.normalize();

  // в воде ли игрок (ноги / голова) — только ВОДА считается для плавания
  const feetBlock = blockAtPlayer(0.2);
  const headY = PLAYER.pos.y + (PLAYER.crouching ? PLAYER.crouchEye : PLAYER.eye);
  const headBlock = World.getBlock(
    Math.floor(PLAYER.pos.x), Math.floor(headY), Math.floor(PLAYER.pos.z)
  );
  const feetInWater = isWaterLiquid(feetBlock);
  const headInWater = isWaterLiquid(headBlock);
  // в ЛАВЕ ли игрок (ноги/тело/голова) — лава тоже среда для плавания, но вязкая
  const feetInLava = isLavaLiquid(feetBlock);
  const headInLava = isLavaLiquid(headBlock);
  const inLava = feetInLava || headInLava || isLavaLiquid(blockAtPlayer(0.9));
  const wasInWater = PLAYER.inWater;
  PLAYER.inWater = feetInWater || headInWater;        // именно вода (для дыхания/мокроты)
  PLAYER.inLiquid = PLAYER.inWater || inLava;          // любая жидкость — для физики плавания
  PLAYER.submerged = headInWater;                      // голова под водой (кислород/туман)
  PLAYER.submergedLava = headInLava;                   // голова в лаве (красный экран)
  if (PLAYER.inWater !== wasInWater) playSound('splash'); // всплеск при входе/выходе

  // ---- Урон/поджог от лавы и огня ----
  const fBlk = blockAtPlayer(0.1);
  const bBlk = blockAtPlayer(0.9);
  const inFire = fBlk === BLOCK.FIRE || bBlk === BLOCK.FIRE;
  // ---- Портал в Ад: после паузы в портале — телепортация в другое измерение ----
  if (fBlk === BLOCK.NETHER_PORTAL || bBlk === BLOCK.NETHER_PORTAL) {
    PLAYER._portalT = (PLAYER._portalT || 0) + dt;
    if (PLAYER._portalT >= 1.2 && !PLAYER._porting) {
      PLAYER._porting = true;
      teleportDimension(World.dim === 'overworld' ? 'nether' : 'overworld');
    }
  } else { PLAYER._portalT = 0; PLAYER._porting = false; }
  if (inLava) {
    PLAYER.burnTimer = Math.max(PLAYER.burnTimer || 0, 1.2); // лава поджигает надолго
    PLAYER.lavaTick = (PLAYER.lavaTick || 0) + dt;
    if (PLAYER.lavaTick >= 0.5) { PLAYER.lavaTick = 0; damagePlayer(4, "Вы сгорели в лаве"); } // лава жжёт сильно
  } else if (inFire) {
    PLAYER.burnTimer = Math.max(PLAYER.burnTimer || 0, 0.8);
  }
  // догорание (после выхода из лавы/огня игрок ещё горит)
  if (PLAYER.burnTimer > 0 && !inLava) {
    PLAYER.burnTimer -= dt;
    PLAYER.fireTick = (PLAYER.fireTick || 0) + dt;
    if (PLAYER.fireTick >= 1.0) { PLAYER.fireTick = 0; if (PLAYER.hp > 0) damagePlayer(1, "Вы сгорели"); }
    // вода тушит огонь
    if (PLAYER.inWater) PLAYER.burnTimer = 0;
  }

  let speed = PLAYER.speed;
  if (keys['ControlLeft']) speed *= PLAYER.sprintMul; // спринт
  if (PLAYER.crouching) speed *= 0.45;

  if (PLAYER.inLiquid) {
    // ---- плавание (вода или лава) ----
    // ЛАВА вязче воды: медленнее плывём, медленнее гребём вверх, сильнее тонем.
    const swimMul   = inLava ? 0.30 : 0.55;  // горизонтальная скорость
    const drag      = inLava ? 0.62 : 0.86;  // сопротивление (меньше = вязче)
    const gravMul   = inLava ? 0.45 : 0.28;  // погружающая сила
    const paddleUp  = inLava ? 1.6  : 3.2;   // скорость гребка вверх
    const buoyancy  = inLava ? 0.5  : 1.2;   // пассивное всплытие
    const swimSpeed = PLAYER.speed * swimMul;
    PLAYER.vel.x = move.x * swimSpeed;
    PLAYER.vel.z = move.z * swimSpeed;
    PLAYER.vel.y -= GRAVITY * gravMul * dt;   // ослабленная гравитация
    PLAYER.vel.y *= drag;                       // сопротивление среды
    if (keys['Space']) PLAYER.vel.y = paddleUp; // грести вверх / всплывать
    else if (keys['ShiftLeft']) PLAYER.vel.y -= (inLava ? 1.6 : 3.0) * dt; // нырять
    const maxDown = inLava ? -3 : -6;
    if (PLAYER.vel.y < maxDown) PLAYER.vel.y = maxDown;
    // лёгкое всплытие, если игрок не нажимает вниз
    if (!keys['ShiftLeft'] && !keys['Space']) PLAYER.vel.y += buoyancy * dt;
  } else {
    // ---- обычная физика ----
    PLAYER.vel.x = move.x * speed;
    PLAYER.vel.z = move.z * speed;
    PLAYER.vel.y -= GRAVITY * dt;
    if (PLAYER.vel.y < -55) PLAYER.vel.y = -55;
    if (keys['Space'] && PLAYER.onGround) {
      PLAYER.vel.y = PLAYER.jumpV;
      PLAYER.onGround = false;
      addExhaustion(0.2); // прыжок тратит голод
    }
  }

  // отслеживание высоты падения для урона
  const wasOnGround = PLAYER.onGround;
  if (!PLAYER.onGround && PLAYER.vel.y < 0 && !PLAYER.inLiquid) {
    PLAYER.fallStart = (PLAYER.fallStart === undefined) ? PLAYER.pos.y : Math.max(PLAYER.fallStart, PLAYER.pos.y);
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

  // антизастревание: если зажало блоками (засыпало песком) — выдавить вверх,
  // а не швырять с огромной скоростью под текстуры
  antiSuffocate(dt);

  // урон от падения при приземлении
  if (!wasOnGround && PLAYER.onGround && PLAYER.fallStart !== undefined) {
    const fall = PLAYER.fallStart - PLAYER.pos.y;
    if (fall > 3 && !PLAYER.inLiquid) {
      damagePlayer(Math.floor(fall - 3), "Вы разбились при падении");
    }
    PLAYER.fallStart = undefined;
  }
  if (PLAYER.onGround) PLAYER.fallStart = undefined;

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
      addExhaustion(keys['ControlLeft'] ? 0.06 : 0.03); // ходьба/бег тратят голод
    }
  }

  // не провалиться сквозь дно мира
  if (PLAYER.pos.y < -10) { PLAYER.pos.set(8, 60, 8); PLAYER.vel.set(0,0,0); }
}

// ---- Кислород / утопление ----
// ---- Голод, регенерация, урон ----
function updateSurvival(dt) {
  // истощение -> расход голода (4 единицы истощения = 1 голод)
  if (PLAYER.exhaustion >= 4) {
    PLAYER.exhaustion -= 4;
    if (PLAYER.hunger > 0) PLAYER.hunger -= 1;
  }
  // регенерация: если голод высокий и здоровье не полное
  if (PLAYER.hunger >= 18 && PLAYER.hp < PLAYER.maxHp) {
    PLAYER.regenTimer += dt;
    if (PLAYER.regenTimer >= 3.5) {
      PLAYER.regenTimer = 0;
      PLAYER.hp = Math.min(PLAYER.maxHp, PLAYER.hp + 1);
      PLAYER.exhaustion += 1.5; // регенерация тратит голод
    }
  } else { PLAYER.regenTimer = 0; }
  // голодание: при 0 голода — урон
  if (PLAYER.hunger <= 0) {
    PLAYER.starveTimer += dt;
    if (PLAYER.starveTimer >= 4) {
      PLAYER.starveTimer = 0;
      if (PLAYER.hp > 1) damagePlayer(1); // голод не убивает до 1 hp (как в normal)
    }
  } else { PLAYER.starveTimer = 0; }

  if (PLAYER.damageFlash > 0) PLAYER.damageFlash = Math.max(0, PLAYER.damageFlash - dt * 2);
}

// добавить истощения (расход голода)
function addExhaustion(v) { PLAYER.exhaustion += v; }

// нанести урон игроку
// сумма очков брони (0..20)
function totalArmorPoints() {
  let p = 0;
  for (const sl of ['helmet','chestplate','leggings','boots']) {
    const a = PLAYER.armor && PLAYER.armor[sl];
    if (a) p += armorPointsOf(a.id);
  }
  return Math.min(20, p);
}
function damagePlayer(amount, reason) {
  if (PLAYER.dead) return;             // уже мертвы — больше не получаем урон (фикс лишнего догорания)
  // броня поглощает часть урона (как в MC: каждое очко ~4% защиты)
  const ap = totalArmorPoints();
  if (ap > 0) amount = amount * (1 - Math.min(0.8, ap * 0.04));
  amount = Math.max(0, amount);
  PLAYER.hp = Math.max(0, PLAYER.hp - amount);
  PLAYER.damageFlash = 1;
  playSound('hurt');
  if (PLAYER.hp <= 0) onDeath(reason);
}

// Смерть: остановить симуляцию игрока, показать экран смерти
function onDeath(reason) {
  if (PLAYER.dead) return;
  PLAYER.dead = true;
  PLAYER.vel.set(0, 0, 0);
  PLAYER.burnTimer = 0;                // погасить горение, чтобы не «доуронивало»
  PLAYER.damageFlash = 0;
  document.exitPointerLock();
  const reasonEl = document.getElementById('deathReason');
  if (reasonEl) reasonEl.textContent = reason || 'Игра окончена';
  document.getElementById('deathScreen').classList.add('on');
}

// возрождение (по кнопке)
function respawnPlayer() {
  PLAYER.dead = false;
  PLAYER.hp = PLAYER.maxHp;
  PLAYER.hunger = PLAYER.maxHunger;
  PLAYER.oxygen = PLAYER.maxOxygen;
  PLAYER.exhaustion = 0;
  PLAYER.burnTimer = 0;
  PLAYER.vel.set(0,0,0);
  PLAYER.fallStart = undefined;
  spawnPlayer();
  document.getElementById('deathScreen').classList.remove('on');
  refreshUI();
  if (overlay.classList.contains('hidden')) canvas.requestPointerLock();
}

// маленькое уведомление (тост) внизу-сверху экрана
let _toastTimer = null;
function showToast(text, ms = 2200) {
  const el = document.getElementById('toastMsg');
  if (!el) return;
  el.textContent = text;
  el.classList.add('on');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => el.classList.remove('on'), ms);
}

// съесть еду из активного слота
// надеть броню из активного слота в соответствующий слот брони
function equipArmor(slot) {
  if (!slot || !isArmor(slot.id)) return;
  const sl = armorSlotOf(slot.id);
  const prev = PLAYER.armor[sl];
  // надеть новую (с прочностью предмета, если была)
  PLAYER.armor[sl] = { id: slot.id, ...(slot.dur!==undefined?{dur:slot.dur}:{}) };
  // убрать одну единицу из слота
  slot.count--; if (slot.count <= 0) slots[activeSlot] = null;
  // если был старый предмет — вернуть в инвентарь
  if (prev) addToInventory(prev.id, 1);
  playSound('place', BLOCK.PLANKS);
  onObtain(slot.id);
  refreshUI();
  if (typeof requestSave === 'function') requestSave();
}

function tryEat() {
  const slot = activeItem();
  if (!slot || !isFood(slot.id)) return false;
  if (PLAYER.hunger >= PLAYER.maxHunger) return false; // сыт
  PLAYER.hunger = Math.min(PLAYER.maxHunger, PLAYER.hunger + FOOD[slot.id]);
  slot.count--; if (slot.count <= 0) slots[activeSlot] = null;
  refreshUI();
  playSound('eat');
  // отрыжка после поедания (как в майнкрафте — звук насыщения)
  setTimeout(() => playSound('burp'), 520);
  return true;
}

function updateOxygen(dt) {
  if (PLAYER.submerged) {
    // под водой — расход воздуха
    PLAYER.oxygen -= dt * (10 / 12); // полный запас на ~12 секунд
    if (PLAYER.oxygen <= 0) {
      PLAYER.oxygen = 0;
      // нет воздуха — урон от утопления каждые ~1с
      PLAYER.drownTimer += dt;
      if (PLAYER.drownTimer >= 1.0) {
        PLAYER.drownTimer = 0;
        damagePlayer(2, "Вы утонули");
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
//  Телепортация между измерениями (Обычный мир <-> Ад)
// ============================================================
// сохранённые координаты входа в каждом измерении (чтобы возвращаться рядом)
const _dimReturn = { overworld: null, nether: null };

// построить аварийный портал-площадку у точки назначения (рамка обсидиана + портал)
function buildArrivalPortal(px, py, pz) {
  // небольшая платформа из обсидиана + 2x3 проём, залитый порталом, ось по X
  for (let dx = -1; dx <= 2; dx++) for (let dz = -1; dz <= 1; dz++) {
    World.setBlock(px + dx, py - 1, pz + dz, BLOCK.OBSIDIAN); // пол
  }
  // рамка (стойки на px-1 и px+2), проём px..px+1, высота 3
  for (let dy = 0; dy <= 3; dy++) { World.setBlock(px-1, py+dy, pz, BLOCK.OBSIDIAN); World.setBlock(px+2, py+dy, pz, BLOCK.OBSIDIAN); }
  for (let dx = 0; dx <= 1; dx++) { World.setBlock(px+dx, py+3, pz, BLOCK.OBSIDIAN); }
  // воздух в проёме + портал
  for (let dx = 0; dx <= 1; dx++) for (let dy = 0; dy <= 2; dy++) {
    World.setBlock(px+dx, py+dy, pz, BLOCK.NETHER_PORTAL);
  }
  // воздух перед порталом, чтобы было где встать
  for (let dx = 0; dx <= 1; dx++) for (let dy = 0; dy <= 2; dy++) {
    if (World.getBlock(px+dx, py+dy, pz+1) !== BLOCK.OBSIDIAN) World.setBlock(px+dx, py+dy, pz+1, BLOCK.AIR);
  }
}

let _teleporting = false;
function teleportDimension(target) {
  if (_teleporting) return;
  _teleporting = true;
  // запомнить точку выхода в текущем измерении
  _dimReturn[World.dim] = { x: PLAYER.pos.x, y: PLAYER.pos.y, z: PLAYER.pos.z };

  // выгрузить меши текущего измерения
  for (const [, mesh] of loadedMeshes) { scene.remove(mesh); disposeGroup(mesh); }
  loadedMeshes.clear();
  // очистить сущности (мобы/дропы своего измерения)
  for (const p of mobs) scene.remove(p.mesh); mobs.length = 0;
  for (const d of drops) { scene.remove(d.mesh); } drops.length = 0;
  for (const b of boats) { scene.remove(b.mesh); } boats.length = 0;
  PLAYER.riding = null;
  LiquidSim.queue.length = 0; LiquidSim.inQueue.clear(); LiquidSim.changedChunks.clear();
  FireSim.clear();
  fallingSand.length = 0; sandCheckQueue.length = 0; sandInQueue.clear();

  // переключить измерение
  World.setDimension(target);

  // координаты назначения: в Аду делим X/Z на 8 (как в Minecraft)
  let tx, ty, tz;
  if (_dimReturn[target]) {
    tx = Math.floor(_dimReturn[target].x); ty = Math.floor(_dimReturn[target].y); tz = Math.floor(_dimReturn[target].z);
  } else if (target === 'nether') {
    tx = Math.floor(PLAYER.pos.x / 8); tz = Math.floor(PLAYER.pos.z / 8);
    // найти безопасную высоту над лавой
    ty = 24; for (let y = WORLD_HEIGHT-4; y > 20; y--) { if (World.getBlock(tx,y,tz)===BLOCK.AIR && World.getBlock(tx,y-1,tz)!==BLOCK.AIR && !isLiquid(World.getBlock(tx,y-1,tz))) { ty = y; break; } }
  } else {
    tx = Math.floor(PLAYER.pos.x * 8); tz = Math.floor(PLAYER.pos.z * 8);
    ty = terrainHeight(tx, tz) + 1;
  }
  // построить площадку-портал в точке назначения, чтобы было куда вернуться
  buildArrivalPortal(tx, ty, tz);
  PLAYER.pos.set(tx + 1.5, ty, tz + 1.5);  // встать рядом с порталом, не в нём
  PLAYER.vel.set(0,0,0);
  PLAYER._portalT = 0; PLAYER._porting = true; // не телепортироваться сразу обратно

  showToast(target === 'nether' ? 'Добро пожаловать в Ад!' : 'Вы вернулись в обычный мир');

  // предзагрузить чанки вокруг и перестроить меши, затем снять флаг
  const pcx = Math.floor(PLAYER.pos.x / CHUNK_SIZE), pcz = Math.floor(PLAYER.pos.z / CHUNK_SIZE);
  for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++)
    for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++)
      World.getChunk(pcx+dx, pcz+dz);
  updateChunks();
  _teleporting = false;
  WorldManager.save();
}

// ============================================================
//  HUD
// ============================================================
const hudEl = document.getElementById('hud');
const waterOverlayEl = document.getElementById('waterOverlay');
const fireOverlayEl = document.getElementById('fireOverlay');
const statusBarsEl = document.getElementById('statusBars');
const oxygenRowEl = document.getElementById('oxygenRow');
const armorBarEl = document.getElementById('armorBar');
const heartsBarEl = document.getElementById('heartsBar');
const hungerBarEl = document.getElementById('hungerBar');
const damageFlashEl = document.getElementById('damageFlash');

// --- Пиксель-арт иконки статуса (рисуем на 9x9, масштаб x2) ---
const ICON_PX = 9, ICON_SCALE = 2;
function statusCanvas(draw) {
  const c = document.createElement('canvas');
  c.width = ICON_PX; c.height = ICON_PX;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  draw(x);
  c.style.width = (ICON_PX*ICON_SCALE) + 'px';
  c.style.height = (ICON_PX*ICON_SCALE) + 'px';
  c.style.imageRendering = 'pixelated';
  return c;
}
function px(x, c, gx, gy, w, h) { x.fillStyle = c; x.fillRect(gx, gy, w||1, h||1); }

// сердце: full | half | empty
function heartIcon(state) {
  return statusCanvas(x => {
    const back = '#3b1414';
    // фон-контур (пустое сердце всегда виден как тёмная подложка)
    const shape = [
      [1,1],[2,1],[6,1],[7,1],
      [0,2],[1,2],[2,2],[3,2],[5,2],[6,2],[7,2],[8,2],
      [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],
      [1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],
      [2,5],[3,5],[4,5],[5,5],[6,5],
      [3,6],[4,6],[5,6],
      [4,7],
    ];
    // тёмная подложка чуть больше
    for (const [gx,gy] of shape) px(x, back, gx, gy);
    if (state === 'empty') return;
    const red = '#e22';
    const hi = '#ff7a7a';
    for (const [gx,gy] of shape) {
      if (state === 'half' && gx > 4) continue; // правая половина пустая
      px(x, red, gx, gy);
    }
    // блик
    px(x, hi, 1, 2); px(x, hi, 2, 2);
    if (state === 'full') { px(x, hi, 6, 2); }
  });
}

// голод (ножка/drumstick): full | half | empty
function hungerIcon(state) {
  return statusCanvas(x => {
    const back = '#241a0c';
    const meat = '#9c5a2a', meatHi = '#c47a3e';
    const bone = '#efe6cf';
    // форма мяса (округлый верх) + кость снизу-справа
    const shape = [
      [2,1],[3,1],[4,1],[5,1],
      [1,2],[2,2],[3,2],[4,2],[5,2],[6,2],
      [1,3],[2,3],[3,3],[4,3],[5,3],[6,3],
      [1,4],[2,4],[3,4],[4,4],[5,4],[6,4],
      [2,5],[3,5],[4,5],[5,5],
      [3,6],[4,6],
    ];
    for (const [gx,gy] of shape) px(x, back, gx, gy);
    if (state !== 'empty') {
      for (const [gx,gy] of shape) {
        if (state === 'half' && gx > 3) continue;
        px(x, meat, gx, gy);
      }
      px(x, meatHi, 2, 2); px(x, meatHi, 3, 2);
    }
    // кость (всегда видна, торчит вниз-вправо)
    px(x, bone, 4, 6); px(x, bone, 5, 6); px(x, bone, 5, 7); px(x, bone, 6, 7);
    px(x, '#cfc4a6', 6, 6);
  });
}

// пузырёк воздуха: full | half(лопается) | empty
function bubbleIcon(state) {
  return statusCanvas(x => {
    if (state === 'empty') return;
    const ring = '#0a2a4a', fill = '#3a86d8', hi = '#bfe3ff';
    const shape = [
      [3,1],[4,1],[5,1],
      [2,2],[3,2],[4,2],[5,2],[6,2],
      [1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],
      [1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],
      [2,5],[3,5],[4,5],[5,5],[6,5],
      [3,6],[4,6],[5,6],
    ];
    // контур
    for (const [gx,gy] of shape) px(x, ring, gx, gy);
    if (state === 'full') {
      // заливка чуть внутри
      const inner = [[3,2],[4,2],[5,2],[2,3],[3,3],[4,3],[5,3],[6,3],[2,4],[3,4],[4,4],[5,4],[6,4],[3,5],[4,5],[5,5],[4,6]];
      for (const [gx,gy] of inner) px(x, fill, gx, gy);
      px(x, hi, 3, 2); px(x, hi, 2, 3); // блик
    } else {
      // half — лопающийся, частичная заливка
      const inner = [[3,2],[4,2],[2,3],[3,3],[4,3],[5,3],[3,4],[4,4],[5,4]];
      for (const [gx,gy] of inner) px(x, fill, gx, gy);
      px(x, hi, 3, 2);
    }
  });
}

// иконка брони (нагрудник): full | half | empty
function armorIcon(state) {
  return statusCanvas(x => {
    const back = '#23262b';
    const shape = [
      [1,1],[2,1],[6,1],[7,1],
      [1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],
      [1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],
      [2,4],[3,4],[4,4],[5,4],[6,4],
      [2,5],[3,5],[4,5],[5,5],[6,5],
      [2,6],[3,6],[5,6],[6,6],
    ];
    for (const [gx,gy] of shape) px(x, back, gx, gy);
    if (state === 'empty') return;
    const steel = '#c4c8cf', hi = '#eef1f5';
    for (const [gx,gy] of shape) {
      if (state === 'half' && gx > 4) continue;
      px(x, steel, gx, gy);
    }
    px(x, hi, 2, 2); px(x, hi, 3, 2);
    if (state === 'full') px(x, hi, 6, 2);
  });
}

let _lastStatus = '';
function updateWaterUI() {
  // синий оверлей когда голова под водой
  waterOverlayEl.classList.toggle('on', !!PLAYER.submerged);
  // оранжевый оверлей огня при горении
  fireOverlayEl.classList.toggle('on', (PLAYER.burnTimer || 0) > 0 || !!PLAYER.submergedLava);
  // красная вспышка урона
  damageFlashEl.style.background = 'rgba(180,20,20,' + (PLAYER.damageFlash * 0.35).toFixed(3) + ')';

  // показываем полосы в игре
  const inGame = gameStarted && overlay.classList.contains('hidden');
  statusBarsEl.classList.toggle('on', inGame);
  if (!inGame) return;

  // подпись состояния, чтобы не перерисовывать каждый кадр
  const hp = Math.max(0, Math.round(PLAYER.hp));
  const hunger = Math.max(0, Math.round(PLAYER.hunger));
  const oxy = Math.max(0, Math.ceil(PLAYER.oxygen));
  const showOxy = PLAYER.submerged || PLAYER.oxygen < PLAYER.maxOxygen - 0.01;
  const armorPts = totalArmorPoints();
  const sig = hp + '|' + hunger + '|' + (showOxy ? oxy : 'x') + '|' + armorPts;
  if (sig === _lastStatus) return;
  _lastStatus = sig;

  // --- броня (10 иконок = 20 очков) слева сверху, показываем только если есть броня ---
  armorBarEl.innerHTML = '';
  if (armorPts > 0) {
    for (let i = 0; i < 10; i++) {
      const v = armorPts - i * 2;
      const st = v >= 2 ? 'full' : (v === 1 ? 'half' : 'empty');
      armorBarEl.appendChild(armorIcon(st));
    }
  }

  // --- сердца (10 шт = 20 hp) ---
  heartsBarEl.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const v = hp - i * 2;
    const st = v >= 2 ? 'full' : (v === 1 ? 'half' : 'empty');
    heartsBarEl.appendChild(heartIcon(st));
  }
  // --- голод (10 шт = 20) справа, рисуем в обратном порядке (визуально как в MC) ---
  hungerBarEl.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const idxR = 9 - i; // правый край = первый
    const v = hunger - idxR * 2;
    const st = v >= 2 ? 'full' : (v === 1 ? 'half' : 'empty');
    hungerBarEl.appendChild(hungerIcon(st));
  }
  // --- кислород (только под водой) ---
  oxygenRowEl.innerHTML = '';
  oxygenRowEl.classList.toggle('hidden', !showOxy);
  if (showOxy) {
    for (let i = 0; i < 10; i++) {
      const v = oxy - i * 1; // 10 пузырьков = maxOxygen(10)
      const st = v >= 1 ? 'full' : 'empty';
      if (st !== 'empty') oxygenRowEl.appendChild(bubbleIcon(st));
      else { const sp = document.createElement('canvas'); sp.width=ICON_PX; sp.height=ICON_PX; sp.style.width=(ICON_PX*ICON_SCALE)+'px'; sp.style.height=(ICON_PX*ICON_SCALE)+'px'; oxygenRowEl.appendChild(sp); }
    }
  }
}

let fpsTime = 0, fpsCount = 0, fps = 0;
function updateHUD(t) {
  const targetName = t ? (BLOCK_NAMES[t.block] || '—') : '—';
  hudEl.innerHTML =
    `MiniCraft<br>` +
    `Мир: ${WorldManager.current || '—'} · Сид: ${WORLD_SEED}<br>` +
    `XYZ: ${PLAYER.pos.x.toFixed(1)}, ${PLAYER.pos.y.toFixed(1)}, ${PLAYER.pos.z.toFixed(1)}<br>` +
    `Чанков: ${loadedMeshes.size} · FPS: ${fps}<br>` +
    `${PLAYER.inWater ? 'В воде' : (PLAYER.crouching ? 'Присел' : 'Выживание')}<br>` +
    `Цель: ${targetName}`;
}

// ============================================================
//  Главный цикл
// ============================================================
let last = performance.now();
let _sunFollowX = 1e9, _sunFollowY = 1e9, _sunFollowZ = 1e9;
let _shadowAcc = 0;
function loop(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.1) dt = 0.1; // ограничить спайки

  // пока мир не выбран — ничего не симулируем и не рисуем
  if (!gameStarted) { requestAnimationFrame(loop); return; }

  if (!PLAYER.dead && overlay.classList.contains('hidden') && !invOpen) {
    updatePlayer(dt);
    updateOxygen(dt);
    updateSurvival(dt);
    updateDrops(dt);
    updateMining(dt);
  } else if (mining.active) {
    resetMining();
  }

  LiquidSim.update(dt);
  FireSim.update(dt);
  updateFallingSand(dt);
  updateLeafDecay(dt);
  updateFurnaces(dt);
  updateAnimatedTextures(dt);
  updateClouds(dt);
  if (!PLAYER.dead && overlay.classList.contains('hidden')) updateBoats(dt);
  if (!invOpen && overlay.classList.contains('hidden')) updateMobs(dt);
  updateChunks();

  // солнце и облака не видны в Аду
  const overworldSky = World.dim === 'overworld';
  sunDisc.visible = overworldSky;
  cloudGroup.visible = overworldSky;
  // в Аду равномерное освещение (нет солнечных теней) — поднимем амбиент
  ambient.intensity = overworldSky ? (SHADOWS_ON ? 0.5 : 0.55) : 0.95;
  sun.visible = overworldSky;
  // солнечный диск в небе — в направлении источника света, далеко от игрока
  sunDisc.position.set(PLAYER.pos.x + 140, PLAYER.pos.y + 230, PLAYER.pos.z + 95);

  // солнце следует за игроком (чтобы тени были вокруг него).
  // ОПТИМИЗАЦИЯ: пересчитываем тень только когда игрок заметно сместился —
  // обновление shadow camera каждый кадр заставляет рендерить shadow map заново.
  if (SHADOWS_ON) {
    const dxs = PLAYER.pos.x - _sunFollowX, dzs = PLAYER.pos.z - _sunFollowZ, dys = PLAYER.pos.y - _sunFollowY;
    if (dxs*dxs + dzs*dzs + dys*dys > 64) { // сдвиг > 8 блоков (реже двигаем источник = реже перерисовка теней)
      _sunFollowX = PLAYER.pos.x; _sunFollowY = PLAYER.pos.y; _sunFollowZ = PLAYER.pos.z;
      sun.target.position.set(PLAYER.pos.x, PLAYER.pos.y, PLAYER.pos.z);
      sun.position.set(PLAYER.pos.x + 50, PLAYER.pos.y + 90, PLAYER.pos.z + 35);
      sun.target.updateMatrixWorld();
      shadowNeedsUpdate = true; // солнце сдвинулось — обновить карту теней
    }
    // применяем отложенное обновление карты теней, но не чаще ~3 раз в секунду,
    // чтобы перерисовка shadow map не убивала кадры при движении/частых правках
    _shadowAcc += dt;
    if (shadowNeedsUpdate && _shadowAcc >= 0.33) {
      renderer.shadowMap.needsUpdate = true; shadowNeedsUpdate = false; _shadowAcc = 0;
    }
  }

  // камера
  const eyeY = PLAYER.pos.y + (PLAYER.crouching ? PLAYER.crouchEye : PLAYER.eye);
  camera.position.set(PLAYER.pos.x, eyeY, PLAYER.pos.z);
  const dir = new THREE.Vector3(
    -Math.sin(PLAYER.yaw) * Math.cos(PLAYER.pitch),
    Math.sin(PLAYER.pitch),
    -Math.cos(PLAYER.yaw) * Math.cos(PLAYER.pitch)
  );
  camera.lookAt(camera.position.clone().add(dir));

  // подсветка цели (один raycast на кадр, переиспользуется в HUD)
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
  // атмосфера: вода / Ад / обычный мир
  if (PLAYER.submerged) {
    scene.fog.color.setHex(0x2a5aa0);
    scene.fog.near = 1; scene.fog.far = 18;
    scene.background.setHex(0x2a5aa0);
  } else if (World.dim === 'nether') {
    // Ад: багровый сумрак, плотный туман, без солнца/облаков
    scene.fog.color.setHex(0x330808);
    scene.fog.near = 4; scene.fog.far = RENDER_DISTANCE * CHUNK_SIZE * 0.85;
    scene.background.setHex(0x330808);
  } else {
    scene.fog.color.setHex(0x87ceeb);
    scene.fog.near = RENDER_DISTANCE * CHUNK_SIZE * 0.6;
    scene.fog.far = RENDER_DISTANCE * CHUNK_SIZE;
    scene.background.setHex(0x87ceeb);
  }

  updateWaterUI();
  // HUD обновляем не каждый кадр (innerHTML дорогой) — ~6 раз в секунду
  hudAcc += dt;
  if (hudAcc >= 0.16) { hudAcc = 0; updateHUD(t); }

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
let hudAcc = 0;

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

const shadowToggleEl = document.getElementById('shadowToggle');
shadowToggleEl.checked = SHADOWS_ON;
shadowToggleEl.addEventListener('change', () => {
  setShadows(shadowToggleEl.checked);
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

// Экран смерти: возродиться / в главное меню
document.getElementById('respawnBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  respawnPlayer();
});
document.getElementById('deathMenuBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  // выйти в меню, оставив игрока «мёртвым» — при возврате в мир он возродится
  PLAYER.dead = false;
  PLAYER.hp = PLAYER.maxHp; PLAYER.hunger = PLAYER.maxHunger;
  PLAYER.oxygen = PLAYER.maxOxygen; PLAYER.burnTimer = 0; PLAYER.vel.set(0,0,0);
  spawnPlayer();
  document.getElementById('deathScreen').classList.remove('on');
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
