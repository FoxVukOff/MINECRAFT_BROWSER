/* ============================================================
   MiniCraft — core · Константы блоков/предметов, таблицы свойств, время ломания
   (модуль 1 из 33; строки 1–558 исходного game.js)
   ============================================================ */

'use strict';
/* ============================================================
   MiniCraft — основа воксельного движка в духе старого Minecraft
   ============================================================ */

'use strict';

// three.js 0.187 (локальная сборка-бандл). Пайплайн цвета как в r128:
// ColorManagement выключаем ДО создания любых цветов/материалов/текстур —
// все цвета canvas-текстур и запечённый свет используются «как есть»,
// поэтому визуально игра выглядит ровно так же, как раньше.
if (typeof THREE !== 'undefined' && THREE.ColorManagement) {
  THREE.ColorManagement.enabled = false;
}

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
  TORCH:      30, // факел (источник света, ставится на пол/стену)
  BED_FOOT:   31, // кровать, ножная часть
  BED_HEAD:   32, // кровать, изголовье
  WOOL:       33, // шерсть (выпадает с овец)
  DEEPSLATE:  34, // глубинный камень (глубоко под землёй вместо бедрока)
  REDSTONE_ORE:  35, // редстоуновая руда (светится при клике/наступании)
  REDSTONE_DUST: 36, // редстоуновая пыль (плоский блок, передаёт сигнал)
  REDSTONE_TORCH:37, // редстоуновый факел (источник сигнала 15)
  LEVER:      38, // рычаг (источник/выключатель сигнала)
  BUTTON:     39, // кнопка (временный источник сигнала, авто-выкл)
  PISTON:     40, // поршень (толкает блок при сигнале)
  PISTON_HEAD:41, // голова поршня (выдвигается)
  COMMAND_BLOCK: 42, // командный блок (только креатив//give; выполняет команду по редстоун-сигналу)
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
  // Баранина (из овец)
  MUTTON_RAW:     142,
  MUTTON_COOKED:  143,
  // Рыба (ловится/выпадает) и прожарка
  FISH_RAW:       144,
  FISH_COOKED:    145,
  // Гнилая плоть (выпадает с зомби, как в MC)
  ROTTEN_FLESH:   146,
  // Кожа (из коров) и броня
  LEATHER:        200,
  // Кожаная броня
  LEATHER_HELMET:    210,
  LEATHER_CHESTPLATE:211,
  LEATHER_LEGGINGS:  212,
  LEATHER_BOOTS:     213,
  // Медная броня (между кожей и железом)
  COPPER_HELMET:    214,
  COPPER_CHESTPLATE:215,
  COPPER_LEGGINGS:  216,
  COPPER_BOOTS:     217,
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
  // Ножницы (из 2 железных слитков) — стрижка овец, сбор листвы
  SHEARS:            240,
  // Редстоун (предмет — выпадает из руды, ставится как пыль)
  REDSTONE:          241,
  // Перо (выпадает из куриц — как в Minecraft)
  FEATHER:           242,
  // Фантомная мембрана (выпадает с фантомов — как в Minecraft)
  PHANTOM_MEMBRANE:  243,
  // Яйца спавна мобов (креатив/читы — parity MC: не крафтятся)
  SPAWN_EGG_SHEEP:   250,
  SPAWN_EGG_PIG:     251,
  SPAWN_EGG_COW:     252,
  SPAWN_EGG_CHICKEN: 253,
  SPAWN_EGG_FISH:    254,
  SPAWN_EGG_ZOMBIE:  255,
  SPAWN_EGG_PIGLIN:  256,
  SPAWN_EGG_PHANTOM: 257,
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
  [BLOCK.GLOWSTONE]: 'Светокамень',
  [BLOCK.TORCH]:   'Факел',
  [BLOCK.BED_FOOT]: 'Кровать',
  [BLOCK.BED_HEAD]: 'Кровать',
  [BLOCK.WOOL]:    'Шерсть',
  [BLOCK.DEEPSLATE]: 'Глубинный камень',
  [BLOCK.REDSTONE_ORE]: 'Редстоуновая руда',
  [BLOCK.REDSTONE_DUST]: 'Редстоуновая пыль',
  [BLOCK.REDSTONE_TORCH]: 'Редстоуновый факел',
  [BLOCK.LEVER]: 'Рычаг',
  [BLOCK.BUTTON]: 'Кнопка',
  [BLOCK.PISTON]: 'Поршень',
  [BLOCK.PISTON_HEAD]: 'Поршень',
  [BLOCK.COMMAND_BLOCK]: 'Командный блок',
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
  [ITEM.MUTTON_RAW]:     'Сырая баранина',
  [ITEM.MUTTON_COOKED]:  'Жареная баранина',
  [ITEM.FISH_RAW]:       'Сырая рыба',
  [ITEM.FISH_COOKED]:    'Жареная рыба',
  [ITEM.ROTTEN_FLESH]:   'Гнилая плоть',
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
  [ITEM.COPPER_HELMET]:    'Медный шлем',
  [ITEM.COPPER_CHESTPLATE]:'Медный нагрудник',
  [ITEM.COPPER_LEGGINGS]:  'Медные поножи',
  [ITEM.COPPER_BOOTS]:     'Медные ботинки',
  [ITEM.IRON_HELMET]:    'Железный шлем',
  [ITEM.IRON_CHESTPLATE]:'Железный нагрудник',
  [ITEM.IRON_LEGGINGS]:  'Железные поножи',
  [ITEM.IRON_BOOTS]:     'Железные ботинки',
  [ITEM.DIAMOND_HELMET]:    'Алмазный шлем',
  [ITEM.DIAMOND_CHESTPLATE]:'Алмазный нагрудник',
  [ITEM.DIAMOND_LEGGINGS]:  'Алмазные поножи',
  [ITEM.DIAMOND_BOOTS]:     'Алмазные ботинки',
  [ITEM.SHEARS]:   'Ножницы',
  [ITEM.REDSTONE]: 'Редстоун',
  [ITEM.FEATHER]:  'Перо',
  [ITEM.PHANTOM_MEMBRANE]: 'Фантомная мембрана',
  [ITEM.SPAWN_EGG_SHEEP]:   'Яйцо призыва овцы',
  [ITEM.SPAWN_EGG_PIG]:     'Яйцо призыва свиньи',
  [ITEM.SPAWN_EGG_COW]:     'Яйцо призыва коровы',
  [ITEM.SPAWN_EGG_CHICKEN]: 'Яйцо призыва курицы',
  [ITEM.SPAWN_EGG_FISH]:    'Яйцо призыва рыбы',
  [ITEM.SPAWN_EGG_ZOMBIE]:  'Яйцо призыва зомби',
  [ITEM.SPAWN_EGG_PIGLIN]:  'Яйцо призыва зомби-пиглина',
  [ITEM.SPAWN_EGG_PHANTOM]: 'Яйцо призыва фантома',
};

// Еда: сколько голода восстанавливает (ванильные значения Minecraft)
const FOOD = {
  [ITEM.PORK_RAW]:    3,
  [ITEM.PORK_COOKED]: 8,
  [ITEM.BEEF_RAW]:    3,
  [ITEM.BEEF_COOKED]: 8,
  [ITEM.CHICKEN_RAW]:    2,
  [ITEM.CHICKEN_COOKED]: 6,
  [ITEM.MUTTON_RAW]:     2,
  [ITEM.MUTTON_COOKED]:  6,
  [ITEM.FISH_RAW]:       2,
  [ITEM.FISH_COOKED]:    5,
  [ITEM.ROTTEN_FLESH]:   4, // как в MC: 4 единицы, но высок шанс отравления
};
function isFood(id) { return FOOD[id] !== undefined; }

// Яйца спавна мобов (parity MC: только креатив-инвентарь и /give, не крафтятся).
// base — цвет скорлупы, spots — цвет крапинок (как у яиц MC).
const SPAWN_EGGS = {
  [ITEM.SPAWN_EGG_SHEEP]:   { mob: 'sheep',   base: '#e8e8e6', spots: '#b8b0aa' },
  [ITEM.SPAWN_EGG_PIG]:     { mob: 'pig',     base: '#f0a8a0', spots: '#d05858' },
  [ITEM.SPAWN_EGG_COW]:     { mob: 'cow',     base: '#5c4033', spots: '#e8e4dc' },
  [ITEM.SPAWN_EGG_CHICKEN]: { mob: 'chicken', base: '#a8bcc8', spots: '#f0ecdc' },
  [ITEM.SPAWN_EGG_FISH]:    { mob: 'fish',    base: '#8a7a5c', spots: '#c8b888' },
  [ITEM.SPAWN_EGG_ZOMBIE]:  { mob: 'zombie',  base: '#3a6a9c', spots: '#7ca844' },
  [ITEM.SPAWN_EGG_PIGLIN]:  { mob: 'piglin',  base: '#e8a8b8', spots: '#7ca844' },
  [ITEM.SPAWN_EGG_PHANTOM]: { mob: 'phantom', base: '#4a6472', spots: '#a8c8c0' },
};

const MAX_STACK = 64; // максимум в стопке

// Является ли id блоком (а не предметом)
function isBlock(id) { return id < 100; }

// Гравитационные блоки (падают, если под ними нет опоры) — песок и гравий
function isFalling(b) { return b === BLOCK.SAND || b === BLOCK.GRAVEL; }

// Двери (две половинки)
function isDoor(b) { return b === BLOCK.DOOR_BOTTOM || b === BLOCK.DOOR_TOP; }

// Прозрачные блоки (через них видно грани соседей).
// Листва/стекло/дверь/кровать прозрачны для меширования внутренних граней,
// т.к. имеют нестандартную геометрию (кровать низкая, дверь тонкая и т.д.).
function isTransparent(b) {
  return b === BLOCK.AIR || b === BLOCK.WATER || b === BLOCK.WATER_FLOW ||
         b === BLOCK.LEAVES || b === BLOCK.GLASS || isDoor(b) ||
         b === BLOCK.LAVA || b === BLOCK.LAVA_FLOW || b === BLOCK.FIRE ||
         b === BLOCK.NETHER_PORTAL || b === BLOCK.TORCH ||
         b === BLOCK.REDSTONE_DUST || b === BLOCK.REDSTONE_TORCH || b === BLOCK.LEVER ||
         b === BLOCK.BUTTON || b === BLOCK.PISTON_HEAD ||
         b === BLOCK.BED_FOOT || b === BLOCK.BED_HEAD;
}
// Быстрый lookup-массив: OPAQUE[b] = 1 если блок НЕ прозрачен (для face culling).
// Заполняется один раз после определения всех BLOCK-констант.
const OPAQUE = new Uint8Array(256);
function rebuildOpaqueTable() {
  for (let i = 0; i < 256; i++) OPAQUE[i] = isTransparent(i) ? 0 : 1;
}
rebuildOpaqueTable();
// Кровать (две половинки)
function isBed(b) { return b === BLOCK.BED_FOOT || b === BLOCK.BED_HEAD; }
// Жидкости (не твёрдые для коллизий)
function isWaterLiquid(b) { return b === BLOCK.WATER || b === BLOCK.WATER_FLOW; }
function isLavaLiquid(b) { return b === BLOCK.LAVA || b === BLOCK.LAVA_FLOW; }
function isLiquid(b) { return isWaterLiquid(b) || isLavaLiquid(b); }
// Блоки, сквозь которые можно проходить (двери — если открыты; пока проходимы всегда у открытой)
// Максимальный уровень воды (источник). Течение: 7..1, чем дальше — тем меньше
const WATER_MAX = 8;
const LAVA_MAX = 4; // лава течёт недалеко (как в Minecraft overworld)
// Глубина: насколько подняли рельеф вверх, освобождая место для глубоких пещер/руд снизу.
const DEPTH = 24;
// Уровень моря (поднят вместе с рельефом)
const SEA_LEVEL = 22 + DEPTH;
// Ниже этого уровня камень становится глубинным (deepslate); самый низ — тоже deepslate (бедрока нет)
const DEEPSLATE_LEVEL = 14;

// Какие блоки/предметы игрок может держать/ставить
const PLACEABLE = [BLOCK.GRASS, BLOCK.DIRT, BLOCK.STONE, BLOCK.SAND, BLOCK.GRAVEL,
                   BLOCK.WOOD, BLOCK.LEAVES, BLOCK.PLANKS, BLOCK.CRAFTING_TABLE,
                   BLOCK.COBBLESTONE, BLOCK.GLASS, BLOCK.FURNACE, BLOCK.CHEST, ITEM.DOOR,
                   BLOCK.IRON_ORE, BLOCK.COPPER_ORE, BLOCK.DIAMOND_ORE, BLOCK.OBSIDIAN,
                   BLOCK.TORCH, BLOCK.WOOL, BLOCK.BED_FOOT,
                   BLOCK.REDSTONE_ORE, ITEM.REDSTONE, BLOCK.REDSTONE_TORCH, BLOCK.LEVER,
                   BLOCK.BUTTON, BLOCK.PISTON];

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
  // ванильные значения MC: дерево 4, камень 5, железо 6, алмаз 7; медь (кастом) 5
  if (id === ITEM.DIAMOND_SWORD) return 7;
  if (id === ITEM.IRON_SWORD) return 6;
  if (id === ITEM.COPPER_SWORD) return 5;
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
  [ITEM.COPPER_HELMET]:    { slot: 'helmet',     points: 2 },
  [ITEM.COPPER_CHESTPLATE]:{ slot: 'chestplate', points: 4 },
  [ITEM.COPPER_LEGGINGS]:  { slot: 'leggings',   points: 3 },
  [ITEM.COPPER_BOOTS]:     { slot: 'boots',      points: 1 },
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

// --- Прочность предметов (ванильные значения Minecraft) ---
// Инструменты: дерево 59, камень 131, медь (кастом) 180, железо 250, алмаз 1561.
// Броня: кожа 55/80/75/69, медь (кастом) 120/160/150/130, железо 165/240/225/195, алмаз 363/528/495/462.
const MAX_DURABILITY = {
  [ITEM.FLINT_AND_STEEL]: 65,   // как в Minecraft
  [ITEM.SHEARS]: 238,           // как в Minecraft
  [ITEM.WOODEN_PICKAXE]: 59,  [ITEM.WOODEN_AXE]: 59,  [ITEM.WOODEN_SHOVEL]: 59,  [ITEM.WOODEN_SWORD]: 59,
  [ITEM.STONE_PICKAXE]: 131,  [ITEM.STONE_AXE]: 131,  [ITEM.STONE_SHOVEL]: 131,  [ITEM.STONE_SWORD]: 131,
  [ITEM.COPPER_PICKAXE]: 180, [ITEM.COPPER_AXE]: 180, [ITEM.COPPER_SHOVEL]: 180, [ITEM.COPPER_SWORD]: 180,
  [ITEM.IRON_PICKAXE]: 250,   [ITEM.IRON_AXE]: 250,   [ITEM.IRON_SHOVEL]: 250,   [ITEM.IRON_SWORD]: 250,
  [ITEM.DIAMOND_PICKAXE]:1561,[ITEM.DIAMOND_AXE]:1561, [ITEM.DIAMOND_SHOVEL]:1561, [ITEM.DIAMOND_SWORD]:1561,
  [ITEM.LEATHER_HELMET]:55,   [ITEM.LEATHER_CHESTPLATE]:80,  [ITEM.LEATHER_LEGGINGS]:75,  [ITEM.LEATHER_BOOTS]:69,
  [ITEM.COPPER_HELMET]:120,   [ITEM.COPPER_CHESTPLATE]:160,  [ITEM.COPPER_LEGGINGS]:150,  [ITEM.COPPER_BOOTS]:130,
  [ITEM.IRON_HELMET]:165,     [ITEM.IRON_CHESTPLATE]:240,    [ITEM.IRON_LEGGINGS]:225,    [ITEM.IRON_BOOTS]:195,
  [ITEM.DIAMOND_HELMET]:363,  [ITEM.DIAMOND_CHESTPLATE]:528, [ITEM.DIAMOND_LEGGINGS]:495, [ITEM.DIAMOND_BOOTS]:462,
};
function hasDurability(id) { return MAX_DURABILITY[id] !== undefined; }
// израсходовать 1 заряд прочности у предмета в слоте; вернуть true если предмет сломался
function useDurability(slot) {
  if (!slot || !hasDurability(slot.id)) return false;
  // Креатив: инструменты не изнашиваются (как в MC)
  if (window.__creative) return false;
  // ПРАВИЛО МИРА «Legacy-прочность»: включается только при создании мира,
  // после — неизменно. Предметы никогда не изнашиваются (старое поведение).
  // Читом не считается — это просто «как раньше».
  if (WorldManager.rules && WorldManager.rules.legacyDurability) return false;
  if (slot.dur === undefined) slot.dur = MAX_DURABILITY[slot.id];
  slot.dur--;
  if (slot.dur <= 0) {
    // сломалось — убрать одну единицу
    slot.count--;
    if (slot.count <= 0) {
      // очистить контейнер предмета (рука ИЛИ вторая рука — по объекту)
      if (PLAYER.offhand && slot === PLAYER.offhand) PLAYER.offhand = null;
      else if (slots && slots[activeSlot] && slot === slots[activeSlot]) slots[activeSlot] = null;
      return true;
    }
    slot.dur = MAX_DURABILITY[slot.id]; // следующая в стопке (хотя обычно стопка=1)
  }
  return false;
}
// Блоки, по которым эффективен топор / лопата
function axeBlock(b) { return b === BLOCK.WOOD || b === BLOCK.PLANKS || b === BLOCK.CRAFTING_TABLE || b === BLOCK.CHEST || b === BLOCK.DOOR_BOTTOM || b === BLOCK.DOOR_TOP; }
function shovelBlock(b) { return b === BLOCK.DIRT || b === BLOCK.GRASS || b === BLOCK.SAND || b === BLOCK.GRAVEL; }

// Блоки, для добычи которых нужна кирка (иначе ломается, но ничего не выпадает)
function needsPickaxe(b) { return b === BLOCK.STONE || b === BLOCK.COBBLESTONE || b === BLOCK.FURNACE || b === BLOCK.COAL_ORE || b === BLOCK.IRON_ORE || b === BLOCK.COPPER_ORE || b === BLOCK.DIAMOND_ORE || b === BLOCK.OBSIDIAN || b === BLOCK.NETHERRACK || b === BLOCK.DEEPSLATE || b === BLOCK.REDSTONE_ORE || b === BLOCK.PISTON; }
// Минимальный уровень кирки для добычи блока:
//  руды железа/меди — каменная(2)+; алмаз и редстоун — железная(4)+; обсидиан — алмазная(5).
//  Светокамень в MC кирки НЕ требует.
function minePickTier(b) {
  if (b === BLOCK.OBSIDIAN) return 5;
  if (b === BLOCK.DIAMOND_ORE || b === BLOCK.REDSTONE_ORE) return 4; // в MC — только железной киркой+
  if (b === BLOCK.IRON_ORE || b === BLOCK.COPPER_ORE) return 2;
  return 1;
}

// Твёрдость блоков (ванильные значения Minecraft).
// Время ломания считается по формуле MC: hardness × 1.5 (рукой) / делитель инструмента.
// Если блок требует кирку, а её нет/тир недостаточен — hardness × 5 (как в MC, дропа нет).
const HARDNESS = {
  [BLOCK.GRASS]:   0.6,
  [BLOCK.DIRT]:    0.5,
  [BLOCK.STONE]:   1.5,
  [BLOCK.SAND]:    0.5,
  [BLOCK.WOOD]:    2.0,
  [BLOCK.LEAVES]:  0.2,
  [BLOCK.PLANKS]:  2.0,
  [BLOCK.CRAFTING_TABLE]: 2.5,
  [BLOCK.COBBLESTONE]: 2.0,
  [BLOCK.GLASS]:   0.3,
  [BLOCK.FURNACE]: 3.5,
  [BLOCK.DOOR_BOTTOM]: 3.0,
  [BLOCK.DOOR_TOP]: 3.0,
  [BLOCK.CHEST]:   2.5,
  [BLOCK.COAL_ORE]: 3.0,
  [BLOCK.COPPER_ORE]: 3.0,
  [BLOCK.IRON_ORE]: 3.0,
  [BLOCK.DIAMOND_ORE]: 3.0,
  [BLOCK.GRAVEL]:  0.6,
  [BLOCK.OBSIDIAN]: 50.0, // в MC: алмазной киркой 9.4с, рукой 250с
  [BLOCK.NETHERRACK]: 0.4,
  [BLOCK.GLOWSTONE]: 0.3,
  [BLOCK.TORCH]:   0,
  [BLOCK.BED_FOOT]: 0.2,
  [BLOCK.BED_HEAD]: 0.2,
  [BLOCK.WOOL]:    0.8,
  [BLOCK.DEEPSLATE]: 3.0,
  [BLOCK.REDSTONE_ORE]: 3.0,
  [BLOCK.REDSTONE_DUST]: 0,
  [BLOCK.REDSTONE_TORCH]: 0,
  [BLOCK.LEVER]: 0.5,
  [BLOCK.BUTTON]: 0.5,
  [BLOCK.PISTON]: 1.5,
  [BLOCK.PISTON_HEAD]: 1.5,
  [BLOCK.NETHER_PORTAL]: 0, // ломается мгновенно, без дропа
  [BLOCK.FIRE]: 0,          // гасится мгновенно
  [BLOCK.COMMAND_BLOCK]: Infinity, // как в MC: в выживании неразрушим (ломается только в креативе)
  [BLOCK.BEDROCK]: Infinity,
  [BLOCK.WATER]:   Infinity,
  [BLOCK.WATER_FLOW]: Infinity,
  [BLOCK.LAVA]:    Infinity,
  [BLOCK.LAVA_FLOW]: Infinity,
};

// Делители скорости инструментов (ваниль MC: дерево 2, камень 4, железо 6, алмаз 8; медь 5 — кастом)
const TOOL_DIVISOR = { 1: 2, 2: 4, 3: 5, 4: 6, 5: 8 };

// Время ломания блока (сек) с учётом держимого предмета — формула Minecraft
function computeBreakTime(block, heldId) {
  const hard = HARDNESS[block];
  if (hard === undefined) return 1;      // неизвестный блок — умеренно
  if (!isFinite(hard)) return Infinity;  // бедрок/жидкости
  if (hard === 0) return 0.05;           // мгновенные блоки
  const pickNeeded = needsPickaxe(block);
  const tier = pickaxeTier(heldId);
  if (pickNeeded) {
    if (!isPickaxe(heldId) || tier < minePickTier(block)) {
      return hard * 5;                  // не тем инструментом: в MC ×5 и без дропа
    }
    return hard * 1.5 / TOOL_DIVISOR[tier];
  }
  // ножницы по листве/шерсти — очень быстро (делитель 5, как в MC)
  if (heldId === ITEM.SHEARS && (block === BLOCK.LEAVES || block === BLOCK.WOOL)) {
    return Math.max(0.05, hard * 1.5 / 5);
  }
  if (axeBlock(block) && isAxe(heldId)) return hard * 1.5 / TOOL_DIVISOR[axeTier(heldId)];
  if (shovelBlock(block) && isShovel(heldId)) return hard * 1.5 / TOOL_DIVISOR[shovelTier(heldId)];
  return hard * 1.5;
}

// Размеры чанка
const CHUNK_SIZE = 16;
// Высота мира расширена: больше места сверху и СНИЗУ (глубокие пещеры/руды).
const WORLD_HEIGHT = 96;
let RENDER_DISTANCE = parseInt(localStorage.getItem('minicraft_render_dist') || '4', 10); // в чанках, настраивается
if (!Number.isFinite(RENDER_DISTANCE)) RENDER_DISTANCE = 4; // защита от битого значения в localStorage

