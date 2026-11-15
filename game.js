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
    if (slot.count <= 0) { return true; } // слот опустеет (вызывающий очистит)
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
  // --- Фаза 3: объёмный пиксель-арт (свет сверху, тень снизу, органические пятна) ---
  // трава сверху — кластеры светлых «лопухов» по тёмной зелени (как в MC)
  TEX.grass_top  = makeTex(ctx => {
    pixelFill(ctx, ['#5d9c3f','#549136','#66a847','#4b8230','#6fb050'], [4,4,3,3,2], 101);
    // светлые «островки» травы (2x2 со скошенным краем)
    ctx.fillStyle = '#79bd58';
    for (const [gx,gy] of [[1,2],[9,1],[5,6],[12,8],[3,11],[8,12],[13,3],[0,8]]) {
      ctx.fillRect(gx,gy,2,1); ctx.fillRect(gx,gy+1,1,1);
    }
    // тёмные точки-тени между кустиками
    ctx.fillStyle = '#3f7026';
    for (const [gx,gy] of [[4,3],[11,5],[7,9],[2,13],[13,12],[6,1]]) ctx.fillRect(gx,gy,1,1);
  });
  // земля — комковатая, с камешками и корневыми точками
  const dirtDraw = (ctx) => {
    pixelFill(ctx, ['#8a6a40','#7d5e36','#96754a','#6e5430','#84633a'], [4,4,3,3,2], 202);
    // комки: светлый верх + тёмная кромка снизу (объём)
    ctx.fillStyle = '#a0804f';
    for (const [gx,gy] of [[2,2],[11,3],[6,6],[13,9],[3,12],[8,10]]) ctx.fillRect(gx,gy,2,1);
    ctx.fillStyle = '#5e4628';
    for (const [gx,gy] of [[2,3],[11,4],[6,7],[13,10],[3,13],[8,11]]) ctx.fillRect(gx,gy,2,1);
    // редкие серые камешки
    ctx.fillStyle = '#9a9288';
    for (const [gx,gy] of [[10,7],[1,9],[7,14]]) ctx.fillRect(gx,gy,1,1);
  };
  TEX.dirt    = makeTex(dirtDraw);
  // бок травы — земля + пышная неровная кромка с тёмной «подложкой» и свесами
  TEX.grass_side = makeTex(ctx => {
    dirtDraw(ctx);
    // тёмная подложка кромки (тень травы на земле)
    pixelFillRegion(ctx, 0, 0, 16, 3, ['#456f2b','#3d6425'], [3,2], 302);
    // основная зелёная кромка 3-4px
    pixelFillRegion(ctx, 0, 0, 16, 3, ['#5d9c3f','#549136','#66a847'], [4,4,3], 303);
    // неровный свисающий край (глубина 1-2px, детерминированно)
    for (let x = 0; x < 16; x++) {
      const d = ((x * 73 + 29) % 7) < 3 ? 1 : 0;      // 0 или 1 доп. пиксель
      const d2 = ((x * 41 + 13) % 11) < 2 ? 2 : 0;    // редкие длинные свесы
      ctx.fillStyle = '#549136';
      ctx.fillRect(x, 3, 1, d + d2);
      if (d + d2 > 0) { ctx.fillStyle = '#4b8230'; ctx.fillRect(x, 3 + d + d2 - 1, 1, 1); }
    }
    // блики травы
    ctx.fillStyle = '#79bd58';
    for (const [gx,gy] of [[2,1],[7,0],[12,2],[5,2],[14,1]]) ctx.fillRect(gx,gy,1,1);
  });
  // камень — светлые «валуны» с тёмной окантовкой (фактурный MC-стиль)
  TEX.stone   = makeTex(ctx => {
    pixelFill(ctx, ['#8a8a8a','#7f7f7f','#949494','#757575'], [4,4,3,2], 404);
    const rock = (x, y, w, h) => {
      ctx.fillStyle = '#9e9e9e'; ctx.fillRect(x, y, w, h - 1);
      ctx.fillStyle = '#6e6e6e'; ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x + w - 1, y, 1, h - 1);
      ctx.fillStyle = '#b0b0b0'; ctx.fillRect(x + 1, y, w - 2, 1);
    };
    rock(1,1,5,3); rock(8,0,6,3); rock(0,6,4,3); rock(6,5,5,4); rock(12,6,4,4);
    rock(2,11,6,3); rock(10,12,5,3);
    // трещинки
    ctx.fillStyle = '#646464';
    for (const [gx,gy] of [[5,4],[12,5],[4,10],[9,9],[14,11]]) ctx.fillRect(gx,gy,1,1);
  });
  TEX.bedrock = makeTex(ctx => {
    // грубые угловатые пласты чёрного/серого с жёсткими краями (как в MC)
    pixelFill(ctx, ['#3a3a3a','#4a4a4a','#2c2c2c','#565656'], [4,4,3,2], 505);
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0,3,7,2); ctx.fillRect(9,6,7,2); ctx.fillRect(3,11,6,2); ctx.fillRect(12,0,4,2); ctx.fillRect(0,8,3,2);
    ctx.fillStyle = '#666666';
    ctx.fillRect(7,3,5,2); ctx.fillRect(1,6,5,2); ctx.fillRect(8,9,6,2); ctx.fillRect(2,1,4,2); ctx.fillRect(11,13,5,2);
  });
  // глубинный камень — тёмный слоистый (горизонтальные напластования, как MC deepslate)
  TEX.deepslate = makeTex(ctx => {
    pixelFill(ctx, ['#4a4a52','#42424a','#52525c','#38383f'], [4,4,3,2], 3434);
    // горизонтальные слои: светлый гребень + тёмная борозда
    for (const y of [2,6,10,14]) {
      ctx.fillStyle = '#5a5a64'; ctx.fillRect(0, y, 16, 1);
      ctx.fillStyle = '#303038'; ctx.fillRect(0, y + 1, 16, 1);
    }
    // обрывы слоёв (не сплошные)
    ctx.fillStyle = '#42424a';
    ctx.fillRect(3,2,4,1); ctx.fillRect(10,6,5,1); ctx.fillRect(5,10,4,1); ctx.fillRect(12,14,4,1);
    // редкие светлые вкрапления
    ctx.fillStyle = '#5e5e68';
    for (const [gx,gy] of [[4,4],[9,8],[13,5],[2,12]]) ctx.fillRect(gx,gy,1,1);
  });
  TEX.water   = makeTex(ctx => {
    pixelFill(ctx, ['#3a6ea5','#3566a0','#4078b0','#315f96'], [5,4,3,2], 606);
    // лёгкие волны-блики
    ctx.fillStyle = '#5a90c8';
    ctx.fillRect(1,3,5,1); ctx.fillRect(9,5,5,1); ctx.fillRect(4,11,6,1); ctx.fillRect(12,13,3,1);
    ctx.fillStyle = '#2a5288';
    ctx.fillRect(2,4,3,1); ctx.fillRect(10,9,4,1); ctx.fillRect(5,12,4,1);
  });
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
  // песок — мелкозернистый с лёгкой рябью дюн
  TEX.sand    = makeTex(ctx => {
    pixelFill(ctx, ['#ddd2a0','#e6dcae','#d4c894','#cfc088','#e2d8a8'], [4,4,3,2,2], 707);
    // диагональная рябь (полосы-дюны)
    ctx.fillStyle = '#c8b87e';
    for (let i = 0; i < 16; i++) {
      const x = (i * 2 + (i % 3)) % 16, y = (i + 4) % 16;
      ctx.fillRect(x, y, 2, 1);
    }
    // светлые песчинки
    ctx.fillStyle = '#f2ecc4';
    for (const [gx,gy] of [[2,2],[8,5],[13,9],[5,12],[10,14]]) ctx.fillRect(gx,gy,1,1);
    // тёмные крупинки
    ctx.fillStyle = '#b8a86e';
    for (const [gx,gy] of [[6,3],[11,7],[3,8],[14,2],[7,11]]) ctx.fillRect(gx,gy,1,1);
  });

  // дерево: бок — кора с глубокими вертикальными бороздами
  TEX.wood_side = makeTex(ctx => {
    pixelFill(ctx, ['#6b4f2a','#5e4424','#785931','#523c20'], [5,4,3,2], 808);
    // глубокие тёмные борозды (изогнутые)
    ctx.fillStyle = '#3d2c15';
    for (const bx of [1,4,8,12,14]) {
      for (let y = 0; y < 16; y++) {
        const wob = ((y + bx * 7) % 5 < 2) ? 1 : 0;
        ctx.fillRect(bx + wob, y, 1, 1);
      }
    }
    // светлые гребни рядом с бороздами (объём коры)
    ctx.fillStyle = '#8a6a3c';
    for (const [gx,gy] of [[2,1],[5,4],[9,2],[13,6],[3,10],[10,9],[6,13]]) ctx.fillRect(gx,gy,1,2);
    // сучок
    ctx.fillStyle = '#2e2110'; ctx.fillRect(10,6,2,2);
    ctx.fillStyle = '#5e4424'; ctx.fillRect(10,6,1,1);
  });
  // дерево: торец — годовые кольца с корой по краю
  TEX.wood_top = makeTex(ctx => {
    pixelFill(ctx, ['#9c7842','#8a6a38','#a8854c'], [5,4,2], 909);
    // кора по периметру
    ctx.strokeStyle = '#5e4424'; ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 15, 15);
    // кольца (чередование тонов — как спил)
    for (let r = 2; r < 8; r += 2) {
      ctx.strokeStyle = r % 4 === 0 ? '#6b4f2a' : '#8a6a38';
      ctx.beginPath(); ctx.arc(8, 8, r, 0, Math.PI*2); ctx.stroke();
    }
    // трещины от центра
    ctx.strokeStyle = '#7a5c30';
    ctx.beginPath(); ctx.moveTo(8,8); ctx.lineTo(12,3); ctx.moveTo(8,8); ctx.lineTo(3,11); ctx.stroke();
    ctx.fillStyle = '#5e4628'; ctx.fillRect(7,7,2,2); // сердцевина
    ctx.fillStyle = '#b09055'; ctx.fillRect(8,8,1,1); // блик сердцевины
  });
  // листва — двухъярусная зелень: тёмный низ кроны + светлые листья поверх, с дырками
  TEX.leaves = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    let s = 1212>>>0; const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
    const pal = ['#3f8b2e','#357a26','#4a9c36','#2e6b20'];
    for (let y=0;y<16;y++) for (let x=0;x<16;x++) {
      if (rnd() < 0.13) continue; // дырки
      ctx.fillStyle = pal[(rnd()*pal.length)|0];
      ctx.fillRect(x,y,1,1);
    }
    // светлые «листики»-блики верхнего яруса
    ctx.fillStyle = '#5cb040';
    for (const [gx,gy] of [[1,1],[4,2],[8,1],[12,3],[2,6],[10,6],[6,9],[13,10],[3,12],[9,12]]) {
      ctx.fillRect(gx,gy,1,1); ctx.fillRect(gx+1,gy+1,1,1);
    }
    // тёмные «прожилки» нижнего яруса
    ctx.fillStyle = '#245418';
    for (const [gx,gy] of [[6,3],[11,7],[1,9],[14,13],[4,14]]) ctx.fillRect(gx,gy,1,1);
  });
  // доски — 4 горизонтальные доски с фаской, волокнами и гвоздями
  TEX.planks = makeTex(ctx => {
    const rows = [['#bd9252','#b08549','#c79c5d'],['#b58c4e','#a87e45','#bf965a'],['#c09050','#b3884a','#c99e5d'],['#b98e4d','#ac8244','#c2975a']];
    for (let r = 0; r < 4; r++) {
      pixelFillRegion(ctx, 0, r*4, 16, 4, rows[r], [4,3,2], 1313 + r*17);
      // тёмный шов между досками
      ctx.fillStyle = '#7a5a30'; ctx.fillRect(0, r*4 + 3, 16, 1);
      // светлый верхний фас доски (свет сверху)
      ctx.fillStyle = '#d4a868'; ctx.fillRect(0, r*4, 16, 1);
      // вертикальный стык (вразбежку)
      const jx = [7,3,11,6][r];
      ctx.fillStyle = '#8a663a'; ctx.fillRect(jx, r*4, 1, 3);
      // гвоздики у стыка
      ctx.fillStyle = '#6e5228';
      ctx.fillRect((jx+2)%15, r*4+1, 1, 1);
      // волокна-риски
      ctx.fillStyle = '#a37c40';
      for (const gx of [1,5,9,13]) if ((gx + r) % 2) ctx.fillRect((gx + r*3) % 15, r*4 + 1 + ((gx*7+r*5)%2), 2, 1);
    }
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

  // булыжник — крупные округлые камни в тёмном растворе, с бликами
  TEX.cobble = makeTex(ctx => {
    pixelFill(ctx, ['#7d7d7d','#6f6f6f','#888888','#656565'], [5,4,3,2], 1414);
    // тёмные швы-раствор
    ctx.fillStyle = '#474747';
    ctx.fillRect(0,5,16,1); ctx.fillRect(0,10,16,1);
    ctx.fillRect(6,0,1,5); ctx.fillRect(10,6,1,4); ctx.fillRect(4,11,1,5); ctx.fillRect(11,11,1,5);
    // объём каждого камня: свет сверху-слева, тень снизу-справа
    const stones = [[1,1,4,3],[8,1,6,3],[0,6,5,3],[7,7,3,2],[12,7,3,2],[1,11,2,4],[5,11,5,4],[12,12,3,3]];
    for (const [sx,sy,sw,sh] of stones) {
      ctx.fillStyle = '#9a9a9a'; ctx.fillRect(sx, sy, sw, 1); ctx.fillRect(sx, sy, 1, sh); // свет
      ctx.fillStyle = '#585858'; ctx.fillRect(sx, sy+sh-1, sw, 1); ctx.fillRect(sx+sw-1, sy, 1, sh); // тень
      ctx.fillStyle = '#b0b0b0'; ctx.fillRect(sx+1, sy+1, 1, 1); // блик
    }
  });
  // угольная руда — камень с ГРАНЁННЫМИ чёрными кусками угля
  TEX.coal_ore = makeTex(ctx => {
    pixelFill(ctx, ['#8a8a8a','#7f7f7f','#949494','#757575'], [4,4,3,2], 404);
    const blobs = [[3,3,3,2],[10,4,3,3],[5,9,4,3],[11,10,2,3],[2,12,2,2]];
    ctx.fillStyle = '#161616';
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle = '#3a3a3a'; // грань-блик
    for (const [bx,by] of blobs) ctx.fillRect(bx,by,1,1);
    ctx.fillStyle = '#4a4a4a'; // трещинки на угле
    for (const [bx,by,b2] of [[4,4],[6,10],[11,5]]) ctx.fillRect(bx,by,1,1);
  });
  // железная руда — камень с бежево-розоватыми крупинками руды
  TEX.iron_ore = makeTex(ctx => {
    pixelFill(ctx, ['#8a8a8a','#7f7f7f','#949494','#757575'], [4,4,3,2], 404);
    const blobs = [[3,4,3,2],[9,3,3,3],[6,9,4,3],[11,10,2,2],[2,11,2,2]];
    ctx.fillStyle = '#d8c4b0';                 // светлый бежево-серый металл
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle = '#efe2d4';                 // светлый блик
    for (const [bx,by] of blobs) ctx.fillRect(bx,by,1,1);
    ctx.fillStyle = '#a08a72';                 // тень
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx+bw-1,by+bh-1,1,1);
  });
  // медная руда — камень с оранжево-рыжими вкраплениями
  TEX.copper_ore = makeTex(ctx => {
    pixelFill(ctx, ['#8a8a8a','#7f7f7f','#949494','#757575'], [4,4,3,2], 404);
    const blobs = [[4,3,3,2],[9,4,3,3],[3,9,3,3],[10,10,3,2],[6,12,2,2]];
    ctx.fillStyle = '#c87038';                 // насыщенная медь
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle = '#e89a5a';                 // блик
    for (const [bx,by] of blobs) ctx.fillRect(bx,by,1,1);
    ctx.fillStyle = '#8a4620';                 // тень
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx+bw-1,by+bh-1,1,1);
  });
  // алмазная руда — камень с огранёнными бирюзовыми кристаллами
  TEX.diamond_ore = makeTex(ctx => {
    pixelFill(ctx, ['#8a8a8a','#7f7f7f','#949494','#757575'], [4,4,3,2], 404);
    const blobs = [[3,4,3,2],[10,3,2,3],[5,10,3,2],[11,11,2,2],[2,11,2,2]];
    ctx.fillStyle = '#3fd6e0';                 // яркая бирюза
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle = '#bff7ff';                 // блик-грань
    for (const [bx,by] of blobs) ctx.fillRect(bx,by,1,1);
    ctx.fillStyle = '#1f8fa0';                 // тень-грань
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx+bw-1,by+bh-1,1,1);
    ctx.fillStyle = '#eaffff';                 // искра
    ctx.fillRect(4,4,1,1); ctx.fillRect(6,11,1,1);
  });
  // гравий — округлая галька разных тонов с мокрыми бликами
  TEX.gravel = makeTex(ctx => {
    pixelFill(ctx, ['#8a8480','#9a938c','#76706a','#a39c94','#6a625c'], [5,4,4,2,2], 2424);
    // галька: каждая — со светом сверху и тенью снизу
    const pebbles = [[2,2],[7,1],[12,4],[4,7],[9,8],[1,11],[6,12],[12,11]];
    for (const [gx,gy] of pebbles) {
      ctx.fillStyle = '#5a544e'; ctx.fillRect(gx,gy,2,2);
      ctx.fillStyle = '#8a8480'; ctx.fillRect(gx,gy,2,1);
      ctx.fillStyle = '#b0a89e'; ctx.fillRect(gx,gy,1,1);
    }
    // светлые блестящие камешки
    ctx.fillStyle = '#c8c0b4';
    for (const [gx,gy] of [[10,2],[3,9],[13,8],[8,14]]) ctx.fillRect(gx,gy,1,1);
  });
  // обсидиан — стеклянисто-чёрный с фиолетовым отливом и сколами
  TEX.obsidian = makeTex(ctx => {
    pixelFill(ctx, ['#140d22','#0e0a1a','#1c1430','#0a0814'], [5,4,3,3], 2525);
    // диагональные стеклянные блики
    ctx.fillStyle = '#3a2a5c';
    for (let i = 0; i < 9; i++) ctx.fillRect(2 + i, 12 - i, 1, 1);
    ctx.fillStyle = '#5a3f8a';
    for (let i = 0; i < 5; i++) ctx.fillRect(9 + i, 14 - i, 1, 1);
    // острые сколы-грани
    ctx.fillStyle = '#2e2050';
    ctx.fillRect(3,3,1,2); ctx.fillRect(12,6,1,3); ctx.fillRect(6,10,2,1);
    // редкие фиолетовые искры
    ctx.fillStyle = '#8a6ad0';
    ctx.fillRect(5,5,1,1); ctx.fillRect(11,12,1,1);
  });
  // незерак — багровый пористый камень с «порами»-кратерами
  TEX.netherrack = makeTex(ctx => {
    pixelFill(ctx, ['#5a1f1f','#6e2626','#4a1818','#7a2c2c','#3e1414'], [5,4,4,2,2], 2828);
    // поры: тёмные кратеры со светлым верхним ободком
    const pores = [[3,3],[10,2],[6,7],[12,9],[2,12],[8,13],[13,5]];
    for (const [gx,gy] of pores) {
      ctx.fillStyle = '#2c0e0e'; ctx.fillRect(gx,gy,2,2);
      ctx.fillStyle = '#8a3434'; ctx.fillRect(gx,gy-1,2,1);
    }
    // мясистые светлые наросты
    ctx.fillStyle = '#933c3c';
    for (const [gx,gy] of [[1,1],[7,5],[12,12],[4,10],[14,1]]) ctx.fillRect(gx,gy,2,1);
    ctx.fillStyle = '#b04545';
    for (const [gx,gy] of [[2,1],[8,5],[13,12]]) ctx.fillRect(gx,gy,1,1);
  });
  // светопыль — мозаика ярких светящихся «зёрен» в янтарной кайме (как в MC)
  TEX.glowstone = makeTex(ctx => {
    pixelFill(ctx, ['#d49028','#c07c1c','#b06e14'], [4,3,3], 2929);
    // яркая мозаика: блоки 3x3/2x2 светло-жёлтых зёрен
    const grains = [[1,1,3,3],[6,1,3,2],[11,2,3,3],[2,6,2,3],[6,6,3,3],[11,7,2,3],[1,12,3,2],[6,12,3,2],[11,12,3,2],[4,4,2,2],[9,4,2,2]];
    for (const [gx,gy,gw,gh] of grains) {
      ctx.fillStyle = '#f8d878'; ctx.fillRect(gx,gy,gw,gh);
      ctx.fillStyle = '#fff0a8'; ctx.fillRect(gx,gy,gw-1,1); ctx.fillRect(gx,gy,1,gh-1);
      ctx.fillStyle = '#e8b84a'; ctx.fillRect(gx+gw-1,gy+gh-1,1,1);
    }
    // тёмные швы между зёрнами
    ctx.fillStyle = '#8a5a10';
    ctx.fillRect(0,5,16,1); ctx.fillRect(0,11,16,1);
    ctx.fillRect(5,0,1,16); ctx.fillRect(10,0,1,16);
  });
  // кожа — текстура для предметной иконки рисуется кодом; здесь не нужна
  // стекло — прозрачное с рамкой, угловыми швами и бликом
  TEX.glass = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    // рамка со слегка «старым» стеклом
    ctx.strokeStyle = 'rgba(225,242,255,0.95)'; ctx.lineWidth=1;
    ctx.strokeRect(0.5,0.5,15,15);
    // швы в углах (свинцовая раскладка)
    ctx.fillStyle = 'rgba(200,225,245,0.75)';
    ctx.fillRect(0,0,2,1); ctx.fillRect(0,0,1,2); ctx.fillRect(14,0,2,1); ctx.fillRect(15,0,1,2);
    ctx.fillRect(0,14,2,2); ctx.fillRect(14,14,2,2);
    // диагональные блики
    ctx.strokeStyle = 'rgba(235,250,255,0.55)';
    ctx.beginPath(); ctx.moveTo(3,12); ctx.lineTo(10,4); ctx.stroke();
    ctx.strokeStyle = 'rgba(235,250,255,0.35)';
    ctx.beginPath(); ctx.moveTo(6,13); ctx.lineTo(12,6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(9,13); ctx.lineTo(13,8); ctx.stroke();
    // точечный блеск
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(4,10,1,1); ctx.fillRect(10,4,1,1);
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
    // ручка только на нижней половине (как в MC)
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
  // двойной сундук: половинки с цельным рисунком (лево/право)
  // передняя грань — левая и правая половины большого сундука
  TEX.dchest_front_left = makeTex(ctx => {
    woodGrain(ctx, 0xb07a36);
    ctx.fillStyle = '#4d3416';
    ctx.fillRect(0,0,16,2); ctx.fillRect(0,14,16,2); ctx.fillRect(0,0,2,16);
    ctx.fillRect(0,7,16,2);                                   // линия крышки
    ctx.fillStyle = '#3a2712'; ctx.fillRect(2,7,2,2);        // петля слева
    // правый край замка (замок на стыке)
    ctx.fillStyle = '#6e6e6e'; ctx.fillRect(13,6,3,5);
    ctx.fillStyle = '#9a9a9a'; ctx.fillRect(14,7,2,3);
  });
  TEX.dchest_front_right = makeTex(ctx => {
    woodGrain(ctx, 0xb07a36);
    ctx.fillStyle = '#4d3416';
    ctx.fillRect(0,0,16,2); ctx.fillRect(0,14,16,2); ctx.fillRect(14,0,2,16);
    ctx.fillRect(0,7,16,2);
    ctx.fillStyle = '#3a2712'; ctx.fillRect(12,7,2,2);       // петля справа
    // левый край замка (замок на стыке)
    ctx.fillStyle = '#6e6e6e'; ctx.fillRect(0,6,3,5);
    ctx.fillStyle = '#9a9a9a'; ctx.fillRect(0,7,2,3);
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(0,8,2,2);        // скважина
  });
  // верх двойного сундука: левая/правая половины (средняя планка только на внешних краях)
  TEX.dchest_top_left = makeTex(ctx => {
    woodGrain(ctx, 0xb07a36);
    ctx.fillStyle = '#4d3416';
    ctx.fillRect(0,0,16,2); ctx.fillRect(0,14,16,2); ctx.fillRect(0,0,2,16);
    ctx.fillStyle = '#6b4a20'; ctx.fillRect(2,2,13,12);
    ctx.fillStyle = '#4d3416'; ctx.fillRect(14,0,2,16);     // стык-планка
  });
  TEX.dchest_top_right = makeTex(ctx => {
    woodGrain(ctx, 0xb07a36);
    ctx.fillStyle = '#4d3416';
    ctx.fillRect(0,0,16,2); ctx.fillRect(0,14,16,2); ctx.fillRect(14,0,2,16);
    ctx.fillStyle = '#6b4a20'; ctx.fillRect(1,2,13,12);
    ctx.fillStyle = '#4d3416'; ctx.fillRect(0,0,2,16);      // стык-планка
  });
  // шерсть (белая по умолчанию) — вязаное плетение «v-стежками»
  TEX.wool = makeTex(ctx => {
    pixelFill(ctx, ['#e9e9ec','#dedee2','#f2f2f4','#d2d2d6'], [5,4,3,2], 3333);
    // диагональные стежки вязки (чередующиеся v)
    for (let y = 1; y < 16; y += 2) {
      for (let x = 0; x < 16; x += 4) {
        const ox = (y % 4 === 1) ? 0 : 2;
        ctx.fillStyle = '#c8c8cd';
        ctx.fillRect((x + ox) % 16, y, 1, 1);
        ctx.fillRect((x + ox + 1) % 16, y + 1, 1, 1);
        ctx.fillRect((x + ox + 2) % 16, y, 1, 1);
      }
    }
    // светлые точки ворса
    ctx.fillStyle = '#fafafc';
    for (const [gx,gy] of [[2,2],[9,1],[13,6],[5,8],[11,11],[3,13]]) ctx.fillRect(gx,gy,1,1);
  });
  // факел — палочка с пламенем (для предметной иконки/билборда)
  TEX.torch = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    // палка
    ctx.fillStyle = '#6b4a24'; ctx.fillRect(7,7,2,8);
    ctx.fillStyle = '#5a3d1d'; ctx.fillRect(7,7,1,8);
    // навершие-уголёк
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(6,5,4,2);
    // пламя
    ctx.fillStyle = '#ff8a20'; ctx.fillRect(6,2,4,4);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(7,3,2,3);
    ctx.fillStyle = '#fff0a0'; ctx.fillRect(7,4,1,1);
  });
  // кровать: верх (одеяло + подушка), бок, торец
  TEX.bed_top_head = makeTex(ctx => {
    pixelFill(ctx, ['#c0352f','#aa2a25','#d04a44'], [5,4,2], 3131);
    // подушка
    ctx.fillStyle = '#f2f2f4'; ctx.fillRect(2,1,12,5);
    ctx.fillStyle = '#dadade'; ctx.fillRect(2,5,12,1);
  });
  TEX.bed_top_foot = makeTex(ctx => {
    pixelFill(ctx, ['#c0352f','#aa2a25','#d04a44'], [5,4,2], 3132);
    // складки одеяла
    ctx.fillStyle = '#922420'; ctx.fillRect(0,7,16,1); ctx.fillRect(0,12,16,1);
  });
  TEX.bed_side = makeTex(ctx => {
    pixelFill(ctx, ['#c0352f','#aa2a25','#d04a44'], [5,4,2], 3133);
    ctx.fillStyle = '#6b4a24'; ctx.fillRect(0,11,16,5);   // деревянная рама снизу
    ctx.fillStyle = '#5a3d1d'; ctx.fillRect(0,11,16,1);
  });
  TEX.bed_end = makeTex(ctx => {
    pixelFill(ctx, ['#c0352f','#aa2a25','#d04a44'], [5,4,2], 3134);
    ctx.fillStyle = '#6b4a24'; ctx.fillRect(0,11,16,5);
    ctx.fillStyle = '#5a3d1d'; ctx.fillRect(0,11,16,1);
  });
  // редстоуновая руда: камень с красными вкраплениями
  TEX.redstone_ore = makeTex(ctx => {
    pixelFill(ctx, ['#888888','#7a7a7a','#969696','#6e6e6e'], [5,4,3,2], 1818);
    // красные кристаллы редстоуна
    ctx.fillStyle = '#c0201a';
    const spots = [[3,3],[8,2],[12,5],[5,8],[10,10],[2,11],[13,12],[7,13]];
    for (const [gx,gy] of spots) { ctx.fillRect(gx,gy,2,2); }
    ctx.fillStyle = '#ff4830'; // блик
    for (const [gx,gy] of [[3,3],[8,2],[12,5],[5,8]]) ctx.fillRect(gx,gy,1,1);
  });
  // редстоуновая руда (светящаяся, при клике/наступании)
  TEX.redstone_ore_lit = makeTex(ctx => {
    pixelFill(ctx, ['#888888','#7a7a7a','#969696','#6e6e6e'], [5,4,3,2], 1819);
    ctx.fillStyle = '#ff3020';
    const spots = [[3,3],[8,2],[12,5],[5,8],[10,10],[2,11],[13,12],[7,13]];
    for (const [gx,gy] of spots) { ctx.fillRect(gx,gy,2,2); }
    ctx.fillStyle = '#ffd060'; // яркое свечение
    for (const [gx,gy] of spots) ctx.fillRect(gx,gy,1,1);
  });
  // редстоуновая пыль: плоский крест/линия на прозрачном фоне
  TEX.redstone_dust = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    // фон слегка виден (серый — как «на камне»), но пыль ярко-красная
    ctx.fillStyle = '#b81818';
    // центральный крест (соединяется с соседями)
    ctx.fillRect(6,7,4,2); ctx.fillRect(7,6,2,4);
    // «капли» по краям
    ctx.fillRect(2,7,3,2); ctx.fillRect(11,7,3,2);
    ctx.fillRect(7,2,2,3); ctx.fillRect(7,11,2,3);
    ctx.fillStyle = '#ff3830'; // блик
    ctx.fillRect(7,7,2,2);
  });
  TEX.redstone_dust_on = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    ctx.fillStyle = '#ff2018';
    ctx.fillRect(6,7,4,2); ctx.fillRect(7,6,2,4);
    ctx.fillRect(2,7,3,2); ctx.fillRect(11,7,3,2);
    ctx.fillRect(7,2,2,3); ctx.fillRect(7,11,2,3);
    ctx.fillStyle = '#ff8050'; ctx.fillRect(7,7,2,2);
  });
  // редстоуновый факел: красная палочка с огоньком
  TEX.redstone_torch = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    ctx.fillStyle = '#6b4a24'; ctx.fillRect(7,7,2,8);   // палка
    ctx.fillStyle = '#5a3d1d'; ctx.fillRect(7,7,1,8);
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(6,5,4,2);
    ctx.fillStyle = '#d82018'; ctx.fillRect(6,2,4,4);   // красный огонёк
    ctx.fillStyle = '#ff5040'; ctx.fillRect(7,3,2,3);
    ctx.fillStyle = '#ffb060'; ctx.fillRect(7,4,1,1);
  });
  // рычаг: корпус + ручка
  TEX.lever = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    // основание (камень)
    ctx.fillStyle = '#7a7a7a'; ctx.fillRect(5,10,6,4);
    ctx.fillStyle = '#5a5a5a'; ctx.fillRect(5,13,6,1);
    // ручка (деревянная палка вверх)
    ctx.fillStyle = '#6b4a24'; ctx.fillRect(7,3,2,8);
    ctx.fillStyle = '#5a3d1d'; ctx.fillRect(7,3,1,8);
    // шарик на конце
    ctx.fillStyle = '#8a6a3f'; ctx.fillRect(6,2,4,3);
    ctx.fillStyle = '#5a3d1d'; ctx.fillRect(6,4,4,1);
  });
  // кнопка: каменное основание + выступающая круглая кнопка (нажата/отпущена)
  TEX.button = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    // основание (камень)
    ctx.fillStyle = '#7a7a7a'; ctx.fillRect(3,3,10,10);
    ctx.fillStyle = '#5a5a5a'; ctx.fillRect(3,12,10,1); ctx.fillRect(12,3,1,10);
    ctx.fillStyle = '#9a9a9a'; ctx.fillRect(3,3,10,1); ctx.fillRect(3,3,1,10);
    // кнопка (выступающий круг)
    ctx.fillStyle = '#3a3a3e'; ctx.fillRect(5,5,6,6);
    ctx.fillStyle = '#56565c'; ctx.fillRect(6,6,4,4);
    ctx.fillStyle = '#7a7a80'; ctx.fillRect(6,6,2,2); // блик
  });
  TEX.button_pressed = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    ctx.fillStyle = '#7a7a7a'; ctx.fillRect(3,3,10,10);
    ctx.fillStyle = '#5a5a5a'; ctx.fillRect(3,12,10,1); ctx.fillRect(12,3,1,10);
    ctx.fillStyle = '#9a9a9a'; ctx.fillRect(3,3,10,1); ctx.fillRect(3,3,1,10);
    // кнопка вдавлена
    ctx.fillStyle = '#2a2a2e'; ctx.fillRect(5,5,6,6);
    ctx.fillStyle = '#3a3a3e'; ctx.fillRect(6,6,4,4);
  });
  // поршень: корпус + лицевая панель
  TEX.piston_side = makeTex(ctx => {
    pixelFill(ctx, ['#8a7a5a','#7a6a4a','#9a8a6a','#6a5a3a'], [5,4,3,2], 4040);
    // болты по углам
    ctx.fillStyle = '#3a3a3e'; ctx.fillRect(2,2,2,2); ctx.fillRect(12,2,2,2); ctx.fillRect(2,12,2,2); ctx.fillRect(12,12,2,2);
    ctx.fillStyle = '#56565c'; ctx.fillRect(2,2,1,1); ctx.fillRect(12,2,1,1); ctx.fillRect(2,12,1,1); ctx.fillRect(12,12,1,1);
  });
  TEX.piston_top = makeTex(ctx => {
    pixelFill(ctx, ['#8a7a5a','#7a6a4a','#9a8a6a','#6a5a3a'], [5,4,3,2], 4041);
  });
  TEX.piston_face = makeTex(ctx => {
    // серая металлическая лицевая панель
    pixelFill(ctx, ['#6a6a6e','#5a5a5e','#7a7a7e','#4a4a4e'], [5,4,3,2], 4042);
    // центральная втулка (куда выходит шток)
    ctx.fillStyle = '#3a3a3e'; ctx.fillRect(5,5,6,6);
    ctx.fillStyle = '#5a5a5e'; ctx.fillRect(6,6,4,4);
  });
  // голова поршня (выдвинутая) — деревянная plank-плита на штоке
  TEX.piston_head_face = makeTex(ctx => {
    pixelFill(ctx, ['#b98e4d','#a87e3d','#c99e5d','#976e2d'], [5,4,3,2], 4043);
  });
  TEX.piston_head_side = makeTex(ctx => {
    // шток (каменный стержень) + деревянная голова сверху
    ctx.fillStyle = '#7a7a7e'; ctx.fillRect(6,0,4,8);  // шток
    ctx.fillStyle = '#5a5a5e'; ctx.fillRect(6,0,1,8); ctx.fillStyle = '#9a9a9e'; ctx.fillRect(9,0,1,8);
    ctx.fillStyle = '#b98e4d'; ctx.fillRect(2,8,12,8); // голова-плита
    ctx.fillStyle = '#a87e3d'; ctx.fillRect(2,14,12,2);
  });
  // ---- Командный блок (импульсный, как в MC: тёмный с оранжевым узором) ----
  TEX.cmd_side = makeTex(ctx => {
    // тёмная база (зеленовато-коричневая, как командный блок MC)
    pixelFill(ctx, ['#4a4238','#3e382e','#544c40','#35302a'], [5,4,3,2], 5051);
    // оранжевая рамка-кайма по краю (фирменный узор КБ)
    ctx.fillStyle = '#c87f0e';
    ctx.fillRect(0,0,16,1); ctx.fillRect(0,15,16,1); ctx.fillRect(0,0,1,16); ctx.fillRect(15,0,1,16);
    ctx.fillStyle = '#8a5a10'; // тень рамки
    ctx.fillRect(1,1,14,1); ctx.fillRect(1,14,14,1); ctx.fillRect(1,1,1,14); ctx.fillRect(14,1,1,14);
    // угловые «пины»
    ctx.fillStyle = '#e8a020';
    ctx.fillRect(2,2,2,2); ctx.fillRect(12,2,2,2); ctx.fillRect(2,12,2,2); ctx.fillRect(12,12,2,2);
    // центральные тёмные шестерёнки-намёки
    ctx.fillStyle = '#2a2620';
    ctx.fillRect(5,5,2,2); ctx.fillRect(9,5,2,2); ctx.fillRect(5,9,2,2); ctx.fillRect(9,9,2,2);
    ctx.fillRect(7,7,2,2);
  });
  TEX.cmd_front = makeTex(ctx => {
    // перед с оранжевой стрелкой «команда» (импульсный КБ)
    pixelFill(ctx, ['#4a4238','#3e382e','#544c40','#35302a'], [5,4,3,2], 5052);
    ctx.fillStyle = '#c87f0e';
    ctx.fillRect(0,0,16,1); ctx.fillRect(0,15,16,1); ctx.fillRect(0,0,1,16); ctx.fillRect(15,0,1,16);
    // оранжевая стрелка вверх (как у impulse-блока MC)
    ctx.fillStyle = '#e89020';
    ctx.beginPath();
    ctx.moveTo(8,3); ctx.lineTo(12,8); ctx.lineTo(10,8); ctx.lineTo(10,12);
    ctx.lineTo(6,12); ctx.lineTo(6,8); ctx.lineTo(4,8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd070'; ctx.fillRect(8,4,1,3); // блик стрелки
    // «> _» — строка команды
    ctx.fillStyle = '#e8a020';
    ctx.fillRect(3,13,2,1); ctx.fillRect(4,12,1,1); ctx.fillRect(5,13,2,1); // стрелка-промпт
    ctx.fillRect(8,13,4,1);
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
    const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
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

// ------------------------------------------------------------
//  Двухканальное запечённое освещение.
//  В цвете вершин храним ТРИ канала: color.r = свет от источников
//  (факелы/лава, 0..1), color.g = небесный свет (0..1), color.b =
//  затенение грани/AO (направление + ambient occlusion).
//  Итоговую яркость миксует шейдер: max(sky * uDayFactor, block) —
//  поэтому смена времени суток меняет один юниформ на GPU и НЕ требует
//  перестройки чанков (раньше каждое «щелчковое» изменение уровня неба
//  перестраивало ВСЕ чанки — постоянные фризы на рассвете/закате).
// ------------------------------------------------------------
// Фактор неба: 1.0 = полдень, ~0.27 = ночь (соответствует старому 4..15)
const DAY_LIGHT_UNIFORM = { value: 1.0 };
function applyDayMixShader(mat) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uDayFactor = DAY_LIGHT_UNIFORM;
    shader.vertexShader = 'uniform float uDayFactor;\n' + shader.vertexShader.replace(
      '#include <color_vertex>',
      [
        '#include <color_vertex>',
        '#ifdef USE_COLOR',
        '  float _mcl = max(color.g * uDayFactor, color.r);',
        '  vColor = vec3((0.05 + pow(_mcl, 1.35) * 0.95) * color.b);',
        '#endif',
      ].join('\n')
    );
  };
  // общий суффикс программного кеша для всех запатченных материалов
  mat.customProgramCacheKey = () => 'minicraft-daymix';
  return mat;
}

function texToMaterial(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  // vertexColors — для запечённого освещения (skylight + факелы)
  return applyDayMixShader(new THREE.MeshLambertMaterial({ map: t, vertexColors: true }));
}

function waterMaterial(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  return applyDayMixShader(new THREE.MeshLambertMaterial({
    map: t, transparent: true, opacity: 0.72,
    depthWrite: false, side: THREE.DoubleSide, vertexColors: true,
  }));
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
  const mDeepslate = texToMaterial(TEX.deepslate);
  const mWool      = texToMaterial(TEX.wool);
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
  const mDChestFL  = texToMaterial(TEX.dchest_front_left);
  const mDChestFR  = texToMaterial(TEX.dchest_front_right);
  const mDChestTL  = texToMaterial(TEX.dchest_top_left);
  const mDChestTR  = texToMaterial(TEX.dchest_top_right);
  const mBedTopHead= texToMaterial(TEX.bed_top_head);
  const mBedTopFoot= texToMaterial(TEX.bed_top_foot);
  const mBedSide   = texToMaterial(TEX.bed_side);
  const mBedEnd    = texToMaterial(TEX.bed_end);
  // листва: прозрачные «дырки», видна с обеих сторон
  const mLeaves = (() => {
    const t = new THREE.CanvasTexture(TEX.leaves);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return applyDayMixShader(new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, vertexColors: true }));
  })();
  // стекло: прозрачное
  const mGlass = (() => {
    const t = new THREE.CanvasTexture(TEX.glass);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return applyDayMixShader(new THREE.MeshLambertMaterial({ map: t, transparent: true, opacity: 0.55, side: THREE.DoubleSide, vertexColors: true }));
  })();
  // дверь: тонкая, с прозрачностью у окошка
  const mDoorTopT = (() => {
    const t = new THREE.CanvasTexture(TEX.door_top);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return applyDayMixShader(new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide, vertexColors: true }));
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
  MATERIALS[BLOCK.DEEPSLATE] = [mDeepslate, mDeepslate, mDeepslate, mDeepslate, mDeepslate, mDeepslate];
  MATERIALS[BLOCK.WOOL] = [mWool, mWool, mWool, mWool, mWool, mWool];
  // факел — светящийся билборд (как огонь), рисуется отдельно в мешере
  const mTorch = (() => {
    const t = new THREE.CanvasTexture(TEX.torch);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, depthWrite: true });
  })();
  MATERIALS[BLOCK.TORCH] = [mTorch, mTorch, mTorch, mTorch, mTorch, mTorch];
  // Кровать: ножная часть (foot) и изголовье (head). Грани: [+X,-X,+Y,-Y,+Z,-Z]
  // ориентация задаётся facing; базово «перед» = +Z (открытый торец у ножной части)
  MATERIALS[BLOCK.BED_FOOT] = [mBedSide, mBedSide, mBedTopFoot, mPlanks, mBedEnd, mBedEnd];
  MATERIALS[BLOCK.BED_HEAD] = [mBedSide, mBedSide, mBedTopHead, mPlanks, mBedEnd, mBedEnd];
  MATERIALS[BLOCK.GLASS]   = [mGlass, mGlass, mGlass, mGlass, mGlass, mGlass];
  // печь: перед — топка (+Z), остальное булыжник
  MATERIALS[BLOCK.FURNACE] = [mFurSide, mFurSide, mFurTop, mFurTop, mFurFront, mFurSide];
  MATERIALS.FURNACE_LIT = [mFurSide, mFurSide, mFurTop, mFurTop, texToMaterial(TEX.furnace_front_lit), mFurSide];
  MATERIALS[BLOCK.DOOR_BOTTOM] = [mDoorBot, mDoorBot, mDoorBot, mDoorBot, mDoorBot, mDoorBot];
  MATERIALS[BLOCK.DOOR_TOP]    = [mDoorTopT, mDoorTopT, mDoorTopT, mDoorTopT, mDoorTopT, mDoorTopT];
  // сундук: перед — замок (+Z), верх/низ — крышка, бока — обвязка
  MATERIALS[BLOCK.CHEST]   = [mChestSide, mChestSide, mChestTop, mChestTop, mChestFront, mChestSide];
  // двойной сундук — половинки (выбираются в мешере по facing/стороне стыка)
  MATERIALS.DCHEST_LEFT  = [mChestSide, mChestSide, mDChestTL, mChestTop, mDChestFL, mChestSide];
  MATERIALS.DCHEST_RIGHT = [mChestSide, mChestSide, mDChestTR, mChestTop, mDChestFR, mChestSide];

  // --- Редстоун ---
  const mRedOre = texToMaterial(TEX.redstone_ore);
  MATERIALS[BLOCK.REDSTONE_ORE] = [mRedOre, mRedOre, mRedOre, mRedOre, mRedOre, mRedOre];
  // светящаяся руда (включается при клике/наступании) — яркая, без затенения
  const mRedOreLit = (() => {
    const t = new THREE.CanvasTexture(TEX.redstone_ore_lit);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return new THREE.MeshBasicMaterial({ map: t });
  })();
  MATERIALS.REDSTONE_ORE_LIT = [mRedOreLit, mRedOreLit, mRedOreLit, mRedOreLit, mRedOreLit, mRedOreLit];
  // пыль — плоский «ковёр» (прозрачный, рисуется как верхняя грань)
  const mDustOff = (() => {
    const t = new THREE.CanvasTexture(TEX.redstone_dust);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return applyDayMixShader(new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, vertexColors: true }));
  })();
  const mDustOn = (() => {
    const t = new THREE.CanvasTexture(TEX.redstone_dust_on);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide });
  })();
  MATERIALS[BLOCK.REDSTONE_DUST] = [mDustOff, mDustOff, mDustOff, mDustOff, mDustOff, mDustOff];
  MATERIALS.REDSTONE_DUST_ON = [mDustOn, mDustOn, mDustOn, mDustOn, mDustOn, mDustOn];
  // редстоуновый факел — светящийся билборд
  const mRTorch = (() => {
    const t = new THREE.CanvasTexture(TEX.redstone_torch);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, depthWrite: true });
  })();
  MATERIALS[BLOCK.REDSTONE_TORCH] = [mRTorch, mRTorch, mRTorch, mRTorch, mRTorch, mRTorch];
  // рычаг — билборд-перекладина
  const mLever = (() => {
    const t = new THREE.CanvasTexture(TEX.lever);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return applyDayMixShader(new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, vertexColors: true }));
  })();
  MATERIALS[BLOCK.LEVER] = [mLever, mLever, mLever, mLever, mLever, mLever];

  // Кнопка — билборд на стене (как рычаг), есть нажатое состояние
  const mButton = (() => {
    const t = new THREE.CanvasTexture(TEX.button);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return applyDayMixShader(new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, vertexColors: true }));
  })();
  const mButtonPressed = (() => {
    const t = new THREE.CanvasTexture(TEX.button_pressed);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return applyDayMixShader(new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, vertexColors: true }));
  })();
  MATERIALS[BLOCK.BUTTON] = [mButton, mButton, mButton, mButton, mButton, mButton];
  MATERIALS.BUTTON_PRESSED = [mButtonPressed, mButtonPressed, mButtonPressed, mButtonPressed, mButtonPressed, mButtonPressed];

  // Командный блок: перед (+Z по facing) — со стрелкой, остальное — узор с рамкой
  const mCmdSide = texToMaterial(TEX.cmd_side);
  const mCmdFront = texToMaterial(TEX.cmd_front);
  MATERIALS[BLOCK.COMMAND_BLOCK] = [mCmdSide, mCmdSide, mCmdSide, mCmdSide, mCmdFront, mCmdSide];

  // Поршень: корпус (бока/верх) + лицевая панель по направлению (facing)
  const mPistonSide = texToMaterial(TEX.piston_side);
  const mPistonTop  = texToMaterial(TEX.piston_top);
  const mPistonFace = texToMaterial(TEX.piston_face);
  MATERIALS[BLOCK.PISTON] = [mPistonSide, mPistonSide, mPistonTop, mPistonTop, mPistonFace, mPistonSide];
  // голова поршня: лицевая плита + бока со штоком
  const mPistonHeadFace = texToMaterial(TEX.piston_head_face);
  const mPistonHeadSide = texToMaterial(TEX.piston_head_side);
  MATERIALS[BLOCK.PISTON_HEAD] = [mPistonHeadSide, mPistonHeadSide, mPistonHeadFace, mPistonHeadFace, mPistonHeadFace, mPistonHeadSide];
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
// 3D value-noise — для пещер и рудных жил
function hash3i(x, y, z, s) {
  let h = (x | 0) * 73856093 ^ (y | 0) * 19349663 ^ (z | 0) * 83492791 ^ Math.imul(WORLD_SEED + (s | 0), 2654435761);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function valueNoise3D(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = smooth(xf), v = smooth(yf), w = smooth(zf);
  const c000 = hash3i(xi, yi, zi, 17), c100 = hash3i(xi + 1, yi, zi, 17);
  const c010 = hash3i(xi, yi + 1, zi, 17), c110 = hash3i(xi + 1, yi + 1, zi, 17);
  const c001 = hash3i(xi, yi, zi + 1, 17), c101 = hash3i(xi + 1, yi, zi + 1, 17);
  const c011 = hash3i(xi, yi + 1, zi + 1, 17), c111 = hash3i(xi + 1, yi + 1, zi + 1, 17);
  const x00 = THREE.MathUtils.lerp(c000, c100, u), x10 = THREE.MathUtils.lerp(c010, c110, u);
  const x01 = THREE.MathUtils.lerp(c001, c101, u), x11 = THREE.MathUtils.lerp(c011, c111, u);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(x00, x10, v), THREE.MathUtils.lerp(x01, x11, v), w);
}
// Пещеры: сырные полости 3D-шумом (2 октавы). Карвим только глубже 4 блоков
// от поверхности, чтобы не прорезать дно водоёмов (вода не утечёт в пещеру).
function isCave(wx, y, wz, h) {
  if (y < 5 || y > h - 4) return false;
  const n = valueNoise3D(wx * 0.085, y * 0.11, wz * 0.085) * 0.62 +
            valueNoise3D(wx * 0.17 + 31, y * 0.22 + 7, wz * 0.17 + 11) * 0.38;
  return n > 0.635;
}

// Рудные жилы: кластеры на сетке 8×8×8 (как в MC — руда растёт жилами,
// а не россыпью одиночных блоков). Возвращают id руды или 0.
// Y-диапазоны приближены к ванильным (учитывая высоту мира 96 и уровень моря 46).
function oreVeinAt(wx, y, wz) {
  const gx = wx >> 3, gy = y >> 3, gz = wz >> 3;
  const sel = hash3i(gx, gy, gz, 55);          // есть ли жила в этой ячейке
  // вероятности по типам — подбираются так, чтобы суммарная плотность
  // была сопоставима с прежней россыпью, но кластеризована
  let ore = 0;
  if (y >= 5 && y <= 54 && sel < 0.34) ore = BLOCK.COAL_ORE;
  else if (y >= 20 && y <= 50 && sel >= 0.34 && sel < 0.55) ore = BLOCK.COPPER_ORE;
  else if (y >= 2 && y <= 42 && sel >= 0.55 && sel < 0.74) ore = BLOCK.IRON_ORE;
  else if (y >= 1 && y <= 14 && sel >= 0.74 && sel < 0.86) ore = BLOCK.REDSTONE_ORE;
  else if (y >= 1 && y <= 14 && sel >= 0.86 && sel < 0.94) ore = BLOCK.DIAMOND_ORE;
  else return 0;
  // центр и радиус жилы (детерминированные по ячейке)
  const cx = gx * 8 + 1 + hash3i(gx, gy, gz, 101) * 6;
  const cy = gy * 8 + 1 + hash3i(gx, gy, gz, 202) * 6;
  const cz = gz * 8 + 1 + hash3i(gx, gy, gz, 303) * 6;
  const r = 1.5 + hash3i(gx, gy, gz, 404) * 1.3;   // жила ~4–14 блоков
  const dx = wx - cx, dy = y - cy, dz = wz - cz;
  if (dx * dx + dy * dy + dz * dz > r * r) return 0;
  return ore;
}
function terrainHeight(wx, wz) {
  let h = 0, amp = 1, freq = 0.011, sum = 0;
  for (let o = 0; o < 4; o++) {
    h += valueNoise(wx * freq, wz * freq) * amp;
    sum += amp; amp *= 0.5; freq *= 2;
  }
  h /= sum; // 0..1
  // расширенная вариация: впадины уходят ниже уровня моря -> озёра/моря.
  // Рельеф поднят на DEPTH, чтобы снизу осталось много места для глубоких пещер и руд.
  return Math.floor(12 + DEPTH + h * 26); // диапазон ~(12+DEPTH)..(38+DEPTH)
}

// Высота поверхности незерака в Аду (холмы с лавовыми низинами)
function netherHeight(wx, wz) {
  let h = 0, amp = 1, freq = 0.02, sum = 0;
  for (let o = 0; o < 3; o++) {
    h += valueNoise((wx+5000) * freq, (wz+5000) * freq) * amp;
    sum += amp; amp *= 0.5; freq *= 2;
  }
  h /= sum; // 0..1
  // Незерак-острова парят над лавовым океаном; рельеф поднят как и в обычном мире.
  return Math.floor(14 + DEPTH + h * 22);
}

// Нижняя кромка ПОТОЛКА Ада (незерак + бедрок сверху, как в Minecraft).
// Неровная: 86..91, чтобы потолок выглядел грубым, а не плоским.
const NETHER_CEIL_MIN = 86;
function netherCeilBottom(wx, wz) {
  let h = 0, amp = 1, freq = 0.05, sum = 0;
  for (let o = 0; o < 2; o++) {
    h += valueNoise((wx+3300) * freq, (wz+3300) * freq) * amp;
    sum += amp; amp *= 0.5; freq *= 2;
  }
  h /= sum; // 0..1
  return NETHER_CEIL_MIN + Math.floor(h * 5);
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
    entMobs: [],             // снимок мобов измерения (когда оно не активно/при сохранении)
    entDrops: [],            // снимок выпавших предметов
    entBoats: [],            // снимок лодок измерения
    portals: [],             // [{x,y,z}] — координаты активных порталов (для связывания/мультипорталов)
    levers: new Map(),       // "x,y,z" -> {on:bool, facing} — состояние рычагов
    buttons: new Map(),      // "x,y,z" -> {pressed:bool, timer:sec, facing}
    pistons: new Set(),      // "x,y,z" выдвинутых поршней
    cmdBlocks: new Map(),    // "x,y,z" -> {cmd:string, always:bool} — командные блоки
    // индекс ИСТОЧНИКОВ света (факелы и пр.): "x,y,z" -> уровень 0..15.
    // Нужен, чтобы свет факела из соседнего чанка заходил в наш чанк
    // дальше, чем 2-блочный бордюр световой сетки.
    lightEmitters: new Map(),
  };
}

const World = {
  // активные ссылки (переключаются вместе с измерением)
  chunks: null, edits: null, waterLevel: null, doorState: null,
  furnaces: null, chests: null, doubleChests: null, facing: null, portals: null,
  lightEmitters: null,               // индекс источников света активного измерения
  cmdBlocks: null,                   // командные блоки активного измерения
  dim: 'overworld',                 // текущее измерение
  dims: { overworld: makeDimStore(), nether: makeDimStore() },

  // переключить активное измерение (меняет ссылки на Map'ы)
  setDimension(name) {
    if (!this.dims[name]) { console.warn('Неизвестное измерение:', name); return; }
    this.dim = name;
    const s = this.dims[name];
    this.chunks = s.chunks; this.edits = s.edits; this.waterLevel = s.waterLevel;
    this.doorState = s.doorState; this.furnaces = s.furnaces; this.chests = s.chests;
    this.doubleChests = s.doubleChests; this.facing = s.facing;
    this.portals = s.portals; this.lightEmitters = s.lightEmitters;
    this.cmdBlocks = s.cmdBlocks;
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
          // Самый низ — глубинный камень вместо бедрока (мир продолжается ниже)
          if (y === 0) b = BLOCK.DEEPSLATE;
          else if (y < h - 4) {
            // Ниже DEEPSLATE_LEVEL — глубинный камень, выше — обычный
            b = (y < DEEPSLATE_LEVEL) ? BLOCK.DEEPSLATE : BLOCK.STONE;
            // Пещеры (3D-шум) — вырезаем полости, но не дно водоёмов
            if (isCave(wx, y, wz, h)) {
              b = BLOCK.AIR;
            } else {
              // Руды — ЖИЛАМИ (кластеры на сетке 8³), а не россыпью
              const vein = oreVeinAt(wx, y, wz);
              if (vein) b = vein;
              // Гравий — карманы под землёй (как в Minecraft), небольшими залежами
              else if (oreHash(wx + 8000, y, wz + 8000) < 0.028) b = BLOCK.GRAVEL;
              // Лавовые карманы — очень глубоко (на дне пещер)
              else if (y >= 2 && y <= 6 + DEPTH && oreHash(wx + 3000, y, wz + 3000) < 0.011) b = BLOCK.LAVA;
            }
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

    // ---- Лавовые озёра убраны по просьбе игрока (раньше: carveLavaLake) ----

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
        // под стволом — земля (как в MC: трава заменяется на dirt)
        setLocal(wx, baseY - 1, wz, BLOCK.DIRT, true);
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
    // Ад как в Minecraft: замкнутая полость — снизу бедрок и глубинный камень,
    // сверху потолок из незерака с бедроком, между ними пещера.
    // Внизу НЕГЛУБОКОЕ лавовое море (2-3 блока лавы над каменным дном, как в MC —
    // раньше лава занимала ~38 слоёв, что грузило свет/меширование/симуляцию),
    // над морём — острова незерака, а где шум рельефа высокий — СТЕНЫ/СТОЛБЫ,
    // дорастающие до самого потолка. Светопыль — на потолке и в гроздьях под островами.
    const LAVA_SEA = 20 + DEPTH;        // уровень лавового океана
    const LAVA_BED = LAVA_SEA - 2;      // лава занимает LAVA_BED+1..LAVA_SEA (мелкое море)
    const FLOOR = 6;                    // толщина глубинного дна под лавой
    const CEIL_BEDROCK = WORLD_HEIGHT - 1; // верхний слой — бедрок (как в MC)
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = cx * CHUNK_SIZE + lx, wz = cz * CHUNK_SIZE + lz;
        // карта островов: плотный 2D-шум — где значение высокое, там парит остров
        const island = valueNoise((wx + 700) * 0.045, (wz + 700) * 0.045);
        const surf = netherHeight(wx, wz);          // потенциальная высота вершины острова
        const islandTop = LAVA_SEA + 2 + Math.floor((surf - (14 + DEPTH)) * 0.9);
        const hasIsland = island > 0.56;            // порог появления острова
        // толщина острова растёт к его центру (по величине шума)
        const thickness = hasIsland ? 3 + Math.floor((island - 0.56) * 26) : 0;
        const islandBottom = islandTop - thickness;
        // где шум совсем высокий — остров вырастает в СТЕНУ до потолка
        const isWall = island > 0.64;
        // потолок: незерак от ceilBottom+1 до бедрока
        const ceilBottom = netherCeilBottom(wx, wz);
        for (let y = 0; y < WORLD_HEIGHT; y++) {
          let b = BLOCK.AIR;
          if (y === 0) {
            b = BLOCK.BEDROCK;                       // самый нижний слой Ада — бедрок (неразрушим)
          } else if (y === CEIL_BEDROCK) {
            b = BLOCK.BEDROCK;                       // потолок Ада — бедрок (как в MC)
          } else if (y < FLOOR) {
            b = BLOCK.DEEPSLATE;                     // дно под лавой из глубинного камня
          } else if (y <= LAVA_BED) {
            b = BLOCK.DEEPSLATE;                     // толща дна — камень вместо 38 слоёв лавы
          } else if (y <= LAVA_SEA) {
            b = BLOCK.LAVA;                          // мелкое лавовое море (2-3 слоя)
          } else if (y > ceilBottom) {
            b = BLOCK.NETHERRACK;                    // свод потолка
            if (oreHash(wx + 21000, y, wz + 21000) < 0.012) b = BLOCK.GLOWSTONE;
          }
          // парящий остров из незерака
          if (hasIsland && y >= islandBottom && y <= islandTop && y > FLOOR && y <= LAVA_SEA + 30) {
            b = BLOCK.NETHERRACK;
            // светопыль: гроздьями ближе к низу острова и редкими вкраплениями
            if (oreHash(wx + 11000, y, wz + 11000) < 0.02) b = BLOCK.GLOWSTONE;
          }
          // стена/столб: остров дорастает до потолка (незерак от islandTop до потолка)
          if (isWall && y > islandTop && y <= ceilBottom && y > LAVA_SEA) {
            b = BLOCK.NETHERRACK;
            if (oreHash(wx + 25000, y, wz + 25000) < 0.008) b = BLOCK.GLOWSTONE;
          }
          blocks[idx(lx, y, lz)] = b;
        }
        // пещеры/пустоты в толще островов и стен (3D-шум)
        for (let y = FLOOR + 1; y < WORLD_HEIGHT - 2; y++) {
          if (blocks[idx(lx, y, lz)] === BLOCK.NETHERRACK && oreHash(wx + 13000, y, wz + 13000) < 0.08 && y > LAVA_SEA + 2 && y < NETHER_CEIL_MIN - 2) {
            blocks[idx(lx, y, lz)] = BLOCK.AIR;
          }
        }
        // светящаяся «сталактитная» гроздь под потолком (как светопыль MC на своде)
        if (oreHash(wx + 23000, 0, wz + 23000) < 0.06) {
          const yy = ceilBottom;
          if (blocks[idx(lx, yy, lz)] === BLOCK.NETHERRACK) blocks[idx(lx, yy, lz)] = BLOCK.GLOWSTONE;
        }
        // светящиеся «сталактиты» снизу островов: подвесить грозди светопыли
        if (hasIsland && islandBottom > LAVA_SEA + 1) {
          if (oreHash(wx + 17000, islandBottom, wz + 17000) < 0.12) {
            const hang = 1 + (oreHash(wx + 19000, 0, wz + 19000) * 2 | 0);
            for (let k = 1; k <= hang; k++) {
              const yy = islandBottom - k;
              if (yy > LAVA_SEA) blocks[idx(lx, yy, lz)] = BLOCK.GLOWSTONE;
            }
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
      this._lastChunk = null; // новый чанк мог заменить мемо-ссылку
    }
    return c;
  },

  applyEditsToChunk(c) {
    if (this.edits.size === 0) return;
    // один проход по сохранённым правкам (их обычно намного меньше, чем блоков в чанке) —
    // вместо O(24 576) строковых ключей на каждый загружаемый чанк
    const x0 = c.cx * CHUNK_SIZE, z0 = c.cz * CHUNK_SIZE;
    const x1 = x0 + CHUNK_SIZE - 1, z1 = z0 + CHUNK_SIZE - 1;
    for (const [ek, v] of this.edits) {
      const i1 = ek.indexOf(',');
      const i2 = ek.indexOf(',', i1 + 1);
      const ex = +ek.slice(0, i1), ey = +ek.slice(i1 + 1, i2), ez = +ek.slice(i2 + 1);
      if (ex < x0 || ex > x1 || ez < z0 || ez > z1) continue;
      if (ey < 0 || ey >= WORLD_HEIGHT) continue;
      c.blocks[idx(ex - x0, ey, ez - z0)] = v;
    }
  },

  getBlock(wx, wy, wz) {
    if (wy < 0 || wy >= WORLD_HEIGHT) return BLOCK.AIR;
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    // мемо последнего чанка: 90%+ обращений — к одному и тому же чанку
    // (мешер/свет/симуляции опрашивают соседей пачками) — убираем строковый ключ+Map.get
    let c = this._lastChunk;
    if (!c || c.cx !== cx || c.cz !== cz) {
      c = this.getChunk(cx, cz);
      this._lastChunk = c;
    }
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
    // индекс источников света: добавляем/убираем эмиттер при установке блока
    {
      const ek = this.ekey(wx, wy, wz);
      const em = lightEmission(id);
      if (em > 0) this.lightEmitters.set(ek, em);
      else if (this.lightEmitters.has(ek)) this.lightEmitters.delete(ek);
    }
    if (!transient) { this.edits.set(this.ekey(wx, wy, wz), id); if (typeof requestSave === 'function') requestSave(); }
    // уровень храним только для течения (вода/лава); иначе чистим
    if (id !== BLOCK.WATER_FLOW && id !== BLOCK.LAVA_FLOW) this.clearLevel(wx, wy, wz);
    // воздух — сбросить ориентацию
    if (id === BLOCK.AIR) this.facing.delete(this.ekey(wx, wy, wz));

    // пометить соседние чанки dirty если на границе (включая диагонали —
    // иначе свет/меши в угловых соседях остаются устаревшими)
    if (lx === 0) { this.markDirty(cx - 1, cz); if (lz === 0) this.markDirty(cx - 1, cz - 1); else if (lz === CHUNK_SIZE - 1) this.markDirty(cx - 1, cz + 1); }
    if (lx === CHUNK_SIZE - 1) { this.markDirty(cx + 1, cz); if (lz === 0) this.markDirty(cx + 1, cz - 1); else if (lz === CHUNK_SIZE - 1) this.markDirty(cx + 1, cz + 1); }
    if (lz === 0) this.markDirty(cx, cz - 1);
    if (lz === CHUNK_SIZE - 1) this.markDirty(cx, cz + 1);
  },

  markDirty(cx, cz) {
    const c = this.chunks.get(this.key(cx, cz));
    if (c) c.dirty = true;
  },

  // Выгрузка дальних чанков из памяти (эвикция): данные чанков детерминированы
  // сидом + правками игрока, поэтому их можно выгружать и регенерировать при возврате.
  // Без этого длинное путешествие съедало ~245 КБ на каждый чанк навсегда.
  evictFarChunks(pcx, pcz) {
    const limit = RENDER_DISTANCE + 4;
    for (const [k, c] of this.chunks) {
      if (Math.abs(c.cx - pcx) > limit || Math.abs(c.cz - pcz) > limit) {
        if (c.dirty) continue; // грязные не выгружаем — пусть сначала перестроятся
        this.chunks.delete(k);
        if (this._lastChunk === c) this._lastChunk = null;
      }
    }
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
  // Скорости как в MC: вода — раз в 5 тиков (0.25 с);
  // лава в обычном мире — раз в 30 тиков (1.5 с), в Аду — раз в 10 тиков (0.5 с)
  waterRate: 0.25,
  lavaRate: 1.5,
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

  // максимальный уровень / блоки по типу жидкости.
  // В Аду лава течёт дальше, чем в обычном мире (в MC — 8 блоков против 3)
  maxLevel(kind) { return kind === 'water' ? WATER_MAX : (World.dim === 'nether' ? 8 : LAVA_MAX); },
  srcBlock(kind) { return kind === 'water' ? BLOCK.WATER : BLOCK.LAVA; },
  flowBlock(kind) { return kind === 'water' ? BLOCK.WATER_FLOW : BLOCK.LAVA_FLOW; },

  setFlow(kind, x, y, z, lvl) {
    if (y < 0 || y >= WORLD_HEIGHT) return; // защита от выхода за границы мира
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

  // Бесконечный источник воды: течение, у которого ≥2 соседа-источника воды
  // И снизу опора (как в MC) — само становится источником (классика Minecraft).
  tryFormInfiniteSource(x, y, z) {
    if (World.getBlock(x, y, z) !== BLOCK.WATER_FLOW) return false;
    // под ячейкой должна быть опора (твёрдый блок или источник) — иначе не формируется
    const below = World.getBlock(x, y - 1, z);
    if (below === BLOCK.AIR || below === BLOCK.WATER_FLOW) return false;
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
      if (below === BLOCK.AIR || (this._canFlowInto(kind, cx, y - 1, cz) && below !== this.srcBlock(kind))) {
        return d; // провал (в т.ч. столб собственного течения вниз) — это «дыра»
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

    // лава, соприкоснувшаяся с водой сбоку/сверху — затвердевает (вода пришла к лаве):
    // источник + вода -> ОБСИДИАН, течение + вода -> БУЛЫЖНИК (как в MC)
    if (kind === 'lava' && this.contactSolidify(x, y, z)) return;

    // лава поджигает горючие блоки рядом (как в Minecraft): иногда зажигает воздух
    // у горючих блоков в радиусе 1-2 клеток вокруг лавы.
    if (kind === 'lava' && this._flammableNear(x, y, z)) {
      if (Math.random() < 0.5) this._igniteNear(x, y, z);
      // держим клетку лавы «активной» С ИНТЕРВАЛОМ (random tick, как в MC),
      // чтобы деревянные постройки у лавового океана не тикали каждый кадр
      if (Math.random() < 0.25) this.enqueue(x, y, z);
    }

    // лава над водой: если ПОД лавой вода — лава стекает в воду и застывает КАМНЁМ
    // (в MC лава, втекающая в воду, даёт камень; источник при этом — обсидиан)
    if (kind === 'lava' && (here === src || here === flow)) {
      const below = World.getBlock(x, y - 1, z);
      if (isWaterLiquid(below)) {
        World.clearLevel(x, y, z);
        World.setBlock(x, y, z, (here === BLOCK.LAVA) ? BLOCK.OBSIDIAN : BLOCK.STONE);
        this.markChunk(x, z); this.touchAround(x, y, z);
        playSound('splash');
        return;
      }
    }

    // вода, льющаяся НА лаву сверху, превращает лаву под собой (вода приходит к лаве):
    // источник лавы -> ОБСИДИАН, течение лавы -> БУЛЫЖНИК (как в MC)
    if (kind === 'water' && (here === src || here === flow)) {
      const below = World.getBlock(x, y - 1, z);
      if (below === BLOCK.LAVA) { World.clearLevel(x, y-1, z); World.setBlock(x, y-1, z, BLOCK.OBSIDIAN); this.markChunk(x,z); this.touchAround(x,y-1,z); playSound('splash'); }
      else if (below === BLOCK.LAVA_FLOW) { World.clearLevel(x, y-1, z); World.setBlock(x, y-1, z, BLOCK.COBBLESTONE); this.markChunk(x,z); this.touchAround(x,y-1,z); playSound('splash'); }
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
      // (убран прежний «if (d.falling) return» — вода, упавшая на землю,
      //  растекается на 7 блоков от точки падения, как в Minecraft)
      // если эта клетка — сток в ямку (под ней столб ещё течёт вниз), она уходит вниз
      // и НЕ разливается по сторонам -> вода не переливается за ямку
      if (this._canDrainDown(kind, x, y, z)) return;
      this.spreadSides(kind, x, y, z, d.level);
    }
  },

  update(dt) {
    // лава в Аду тикает в 3 раза быстрее (как в MC)
    this.lavaRate = (World.dim === 'nether') ? 0.5 : 1.5;
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
// Тангенс-смещения к каждому углу грани (для сглаженного освещения):
// по двум осям, касательным грани, в сторону данного угла (±1).
// SMOOTH_T[faceIndex][cornerIndex] = [t1x,t1y,t1z, t2x,t2y,t2z]
const SMOOTH_T = FACES.map(f => {
  const ax = [];
  for (let a = 0; a < 3; a++) if (f.dir[a] === 0) ax.push(a);
  return f.corners.map(cv => {
    const t1 = [0, 0, 0], t2 = [0, 0, 0];
    t1[ax[0]] = cv[ax[0]] === 1 ? 1 : -1;
    t2[ax[1]] = cv[ax[1]] === 1 ? 1 : -1;
    return [t1[0], t1[1], t1[2], t2[0], t2[1], t2[2]];
  });
});
const _cornerOut = [0, 0, 0]; // переиспользуемый буфер углового света

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
// 'full' — по любой из 6 граней, 'none' — изотропный блок, ориентация не пишется
// (фикс: раньше «full» применялся ко всем блокам, и трава, поставленная взглядом вниз,
// теряла травяной верх — теперь изотропные блоки не ориентируются вовсе).
function orientKind(id) {
  if (id === BLOCK.WOOD) return 'log';
  if (id === BLOCK.FURNACE || id === BLOCK.CHEST || id === BLOCK.CRAFTING_TABLE || id === BLOCK.COMMAND_BLOCK) return 'horizontal';
  if (id === BLOCK.PISTON || id === BLOCK.PISTON_HEAD) return 'full';
  return 'none';
}

// Вычислить ориентацию-перед при установке, исходя из направления взгляда игрока
// и грани, на которую кликнули. dir — вектор взгляда (нормализован не обязательно).
function computePlaceFront(id, lookDir) {
  const kind = orientKind(id);
  if (kind === 'none') return undefined; // изотропные блоки не ориентируются
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

// какие блоки вообще могут иметь ориентацию (для пропуска лишних строковых ключей в мешере).
// Сокращено до реально визуально-ориентируемых — устраняет десятки тысяч
// строковых аллокаций за ребилд чанка (трава/руда/земля ориентацию не имеют).
const CAN_ORIENT = {};
[BLOCK.WOOD, BLOCK.FURNACE, BLOCK.CHEST, BLOCK.CRAFTING_TABLE,
 BLOCK.PISTON, BLOCK.PISTON_HEAD].forEach(b => CAN_ORIENT[b] = true);

// ============================================================
//  Цикл день/ночь
// ============================================================
const DAY = {
  time: 0.30,          // 0..1 по кругу суток (0.25 = рассвет, 0.5 = полдень... условно)
  length: 600,         // секунд на полные сутки (10 минут)
};
// солнечная освещённость 0..1 по времени суток (плавный day/night)
function daylight() {
  // солнце над горизонтом примерно с 0.0 до 0.5 цикла
  const a = Math.sin(DAY.time * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5; // 0..1
  return a;
}
// фактор небесного света 0..1 (ночь ~0.27 = уровень 4/15, день 1 = 15/15)
function skyFactor() {
  return Math.min(1, (4 + daylight() * 11) / 15);
}
function updateDayNight(dt) {
  if (World.dim === 'overworld') DAY.time = (DAY.time + dt / DAY.length) % 1; // в Аду суток нет
  // День/ночь теперь меняет ОДИН юниформ на GPU — чанки перестраивать не нужно.
  // (Раньше каждый «щелчок» уровня неба перестраивал ВСЕ чанки — постоянные лаги
  // на рассвете/закате + ступенчатое затемнение.)
  DAY_LIGHT_UNIFORM.value = skyFactor();
}

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
    return World.getBlock(x0 + x, y, z0 + z);
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

        // ---- Кровать: уменьшенная геометрия (матрас ~0.55) на ножках ----
        if (isBed(b)) {
          const mats = MATERIALS[b];
          const mTop  = mats[2]; // верх матраса (подушка/одеяло)
          const mSide = mats[0]; // бок матраса
          const mEnd  = mats[4]; // торец матраса
          const mLeg  = mats[3]; // ножки (дерево)
          // свет: берём освещённость над кроватью (y+1) — матрас приподнят,
          // и гарантируем минимум ~уровень 8, чтобы кровать не выглядела чёрной в тени.
          sampleLight(c, lx, y + 1, lz, _slTmp);
          const blB = Math.max(_slTmp[1], 8) / 15, blS = _slTmp[0] / 15;
          function qB(mat, shade, pts, nrm) {
            const mi = getMatIndex(mat);
            let buf = byMat.get(mi);
            if (!buf) { buf = { positions: [], normals: [], uvs: [], indices: [], colors: [], water:false }; byMat.set(mi, buf); }
            const base = buf.positions.length / 3;
            for (const v of pts) { buf.positions.push(lx+v[0], y+v[1], lz+v[2]); buf.normals.push(nrm[0],nrm[1],nrm[2]); buf.colors.push(blB, blS, shade); }
            buf.uvs.push(0,0, 1,0, 1,1, 0,1);
            buf.indices.push(base,base+1,base+2, base,base+2,base+3);
          }
          // параллелепипед (x1..x2, y1..y2, z1..z2) с материалами по 6 граням
          function boxB(x1,y1,z1,x2,y2,z2, mPx,mNx,mPy,mNy,mPz,mNz) {
            qB(mPx, 0.82, [[x2,y1,z1],[x2,y1,z2],[x2,y2,z2],[x2,y2,z1]], [1,0,0]);
            qB(mNx, 0.82, [[x1,y1,z2],[x1,y1,z1],[x1,y2,z1],[x1,y2,z2]], [-1,0,0]);
            qB(mPy, 1.0,  [[x1,y2,z2],[x2,y2,z2],[x2,y2,z1],[x1,y2,z1]], [0,1,0]);
            qB(mNy, 0.6,  [[x1,y1,z1],[x2,y1,z1],[x2,y1,z2],[x1,y1,z2]], [0,-1,0]);
            qB(mPz, 0.82, [[x1,y1,z2],[x2,y1,z2],[x2,y2,z2],[x1,y2,z2]], [0,0,1]);
            qB(mNz, 0.82, [[x2,y1,z1],[x1,y1,z1],[x1,y2,z1],[x2,y2,z1]], [0,0,-1]);
          }
          // ориентация: front указывает от ножной части к изголовью
          const fr = hasFacing ? World.facing.get(wx + ',' + y + ',' + wz) : undefined;
          let fnx = 0, fnz = 1; // по умолчанию FACE_PZ
          if (fr === FACE_PX) { fnx = 1; fnz = 0; }
          else if (fr === FACE_NX) { fnx = -1; fnz = 0; }
          else if (fr === FACE_PZ) { fnx = 0; fnz = 1; }
          else if (fr === FACE_NZ) { fnx = 0; fnz = -1; }
          const longX = fnx !== 0; // длинная ось кровати — X
          // ножки
          const legW = 0.12, legH = 0.3, legInset = 0.07;
          const corners = [
            [legInset, legInset], [1-legInset-legW, legInset],
            [legInset, 1-legInset-legW], [1-legInset-legW, 1-legInset-legW],
          ];
          for (const cc of corners) boxB(cc[0], 0, cc[1], cc[0]+legW, legH, cc[1]+legW, mLeg,mLeg,mLeg,mLeg,mLeg,mLeg);
          // матрас
          const mIns = 0.08;
          const mY1 = legH, mY2 = legH + 0.22; // 0.3 .. 0.52
          if (longX) {
            // торцы по ±X, бока по ±Z
            boxB(mIns, mY1, mIns, 1-mIns, mY2, 1-mIns, mEnd,mEnd,mTop,mLeg,mSide,mSide);
          } else {
            boxB(mIns, mY1, mIns, 1-mIns, mY2, 1-mIns, mSide,mSide,mTop,mLeg,mEnd,mEnd);
          }
          // изголовье/ножное ограждение
          const bThick = 0.1, bIns = mIns;
          if (b === BLOCK.BED_HEAD) {
            // изголовье у +front (высокое)
            const hbH = 0.82;
            if (longX) { const bx = fnx > 0 ? (1-bIns-bThick) : bIns; boxB(bx, mY1, bIns, bx+bThick, hbH, 1-bIns, mEnd,mEnd,mEnd,mLeg,mEnd,mEnd); }
            else       { const bz = fnz > 0 ? (1-bIns-bThick) : bIns; boxB(bIns, mY1, bz, 1-bIns, hbH, bz+bThick, mEnd,mEnd,mEnd,mLeg,mEnd,mEnd); }
          } else {
            // BED_FOOT: ножное ограждение у -front (низкое)
            const fbH = 0.6;
            if (longX) { const bx = fnx > 0 ? bIns : (1-bIns-bThick); boxB(bx, mY1, bIns, bx+bThick, fbH, 1-bIns, mEnd,mEnd,mEnd,mLeg,mEnd,mEnd); }
            else       { const bz = fnz > 0 ? bIns : (1-bIns-bThick); boxB(bIns, mY1, bz, 1-bIns, fbH, bz+bThick, mEnd,mEnd,mEnd,mLeg,mEnd,mEnd); }
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
            const nb = World.getBlock(wx + f.dir[0], y + f.dir[1], wz + f.dir[2]);
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
            const nb = World.getBlock(wx + f.dir[0], y + f.dir[1], wz + f.dir[2]);
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

        // ---- Огонь: пара перекрещенных плоскостей (билборд-крест) ----
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
          if (!buf) { buf = { positions: [], normals: [], uvs: [], indices: [], colors: [], water:false }; byMat.set(mi, buf); }
          // ось панели: вдоль X (порталы/обсидиан по ±X) -> тонкая по Z; иначе тонкая по X
          const nbX = World.getBlock(wx+1,y,wz)===BLOCK.NETHER_PORTAL || World.getBlock(wx-1,y,wz)===BLOCK.NETHER_PORTAL ||
                      World.getBlock(wx+1,y,wz)===BLOCK.OBSIDIAN || World.getBlock(wx-1,y,wz)===BLOCK.OBSIDIAN;
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
        const nbGet = (nx, ny, nz) => (ny < 0 || ny >= WORLD_HEIGHT) ? BLOCK.BEDROCK : World.getBlock(nx, ny, nz);
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
const ambient = new THREE.AmbientLight(0xffffff, SHADOWS_ON ? 0.5 : 0.55);
scene.add(ambient);
if (SHADOWS_ON) sun.intensity = 0.9; // синхрон с setShadows(true)

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
const CLOUD_Y = 135, CLOUD_AREA = 260;
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
  sprintMul: 1.3, // спринт ×1.3 — как в MC (5.6 м/с)
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
  spawnPoint: null,  // точка возрождения (устанавливается сном в кровати)
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
  cheatsEnabled: false, // читы текущего мира (false для старых/без-читов миров)
  rules: { legacyDurability: false }, // правила мира (задаются при создании, потом неизменны)
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
    World._lastChunk = null; // сброс мемо-чанка
    PLAYER.armor = { helmet: null, chestplate: null, leggings: null, boots: null };
    openFurnacePos = null;
    openChestPos = null;
    // полное состояние нового мира (фикс: раньше новый мир наследовал
    // время суток, точку возрождения и редстоун-состояние предыдущего)
    DAY.time = 0.30; DAY_LIGHT_UNIFORM.value = 1;
    PLAYER.spawnPoint = null;
    _dimReturn.overworld = null; _dimReturn.nether = null;
    if (typeof resetRedstoneState === 'function') resetRedstoneState();
    // очистить сущности (с освобождением геометрии — фикс утечки GPU-памяти)
    for (const d of drops) { scene.remove(d.mesh); disposeGroup(d.mesh); }
    drops.length = 0;
    for (const s of fallingSand) { scene.remove(s.mesh); disposeGroup(s.mesh); }
    fallingSand.length = 0;
    sandCheckQueue.length = 0; sandInQueue.clear();
    LiquidSim.queue.length = 0; LiquidSim.inQueue.clear(); LiquidSim.changedChunks.clear();
    FireSim.clear();
    leafDecay.length = 0; leafDecaySet.clear();
    for (const p of mobs) { scene.remove(p.mesh); disposeGroup(p.mesh); }
    mobs.length = 0;
    for (const b of boats) { scene.remove(b.mesh); disposeGroup(b.mesh); }
    boats.length = 0;
    if (particleGroup) { for (const pt of particles) { particleGroup.remove(pt.mesh); pt.mesh.geometry.dispose(); pt.mesh.material.dispose(); } particles.length = 0; }
    PLAYER.riding = null;
    PLAYER.dead = false;
    PLAYER.burnTimer = 0; PLAYER.fallStart = undefined;
    PLAYER.flying = false;
    window.__creative = false; // креатив сбрасывается при смене мира
    this.rules = { legacyDurability: false }; // правила сбрасываются (зададутся при создании/загрузке)
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
  create(name, seedStr, cheatsEnabled, rules, creative) {
    name = (name || '').trim() || ('Мир ' + (this.list().length + 1));
    const seed = parseSeed(seedStr);
    this.resetState();
    WORLD_SEED = seed;
    this.current = name;
    this.cheatsEnabled = !!cheatsEnabled; // читы для нового мира
    // правила мира: только при создании, дальше неизменны
    this.rules = { legacyDurability: !!(rules && rules.legacyDurability) };
    // режим игры: креатив с создания мира (как в MC — креатив включает читы)
    setGameMode(!!creative, false);
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
      // печь: содержимое + прогресс горения/плавки (фикс: раньше прогресс терялся)
      furnaces: Array.from(s.furnaces.entries()).map(([k, f]) => ({
        k,
        input: f.input ? { id: f.input.id, count: f.input.count, ...(f.input.dur !== undefined ? { dur: f.input.dur } : {}) } : null,
        fuel:   f.fuel   ? { id: f.fuel.id,   count: f.fuel.count,   ...(f.fuel.dur   !== undefined ? { dur: f.fuel.dur } : {}) } : null,
        output: f.output ? { id: f.output.id, count: f.output.count, ...(f.output.dur !== undefined ? { dur: f.output.dur } : {}) } : null,
        burn: f.burn || 0, burnMax: f.burnMax || 0, cook: f.cook || 0,
      })),
      // сундук: содержимое с прочностью (фикс: раньше dur терялся — предметы чинились переносом)
      chests: Array.from(s.chests.entries()).map(([k, arr]) => ({ k, items: arr.map(x => x ? { id: x.id, count: x.count, ...(x.dur !== undefined ? { dur: x.dur } : {}) } : null) })),
      facing: Array.from(s.facing.entries()).map(([k, v]) => k + ':' + v),
      doubleChests: Array.from(s.doubleChests.entries()).map(([k, v]) => k + '>' + v),
      // уровни течений — сериализуются, иначе после загрузки вода растекается заново
      waterLevels: Array.from(s.waterLevel.entries()).map(([k, v]) => k + ':' + v),
      mobs: (s.entMobs || []).map(m => ({ t: m.type, x: m.x, y: m.y, z: m.z, yaw: m.yaw, hp: m.hp, sh: m.sheared?1:0 })),
      drops: (s.entDrops || []).map(d => ({ id: d.id, x: d.x, y: d.y, z: d.z, c: d.count || 1 })),
      boats: (s.entBoats || []).map(b => ({ x: b.x, y: b.y, z: b.z, yaw: b.yaw || 0 })),
      portals: (s.portals || []).map(p => p.x + ',' + p.y + ',' + p.z),
      levers: Array.from((s.levers || new Map()).entries()).map(([k, v]) => k + ':' + (v.on ? 1 : 0) + ':' + (v.facing === undefined ? -1 : v.facing)),
      buttons: Array.from((s.buttons || new Map()).entries()).map(([k, v]) => k + ':' + (v.facing === undefined ? -1 : v.facing)),
      pistons: Array.from(s.pistons || []),
      // командные блоки: JSON (в команде могут быть любые символы — запятые, двоеточия)
      cmdBlocks: Array.from((s.cmdBlocks || new Map()).entries()).map(([k, v]) => JSON.stringify([k, v.cmd || '', v.always ? 1 : 0])),
    };
  },
  // восстановить состояние измерения из объекта
  deserializeDim(s, d) {
    if (!d) return;
    for (const e of (d.edits || [])) { const i = e.lastIndexOf(':'); s.edits.set(e.slice(0, i), parseInt(e.slice(i+1), 10)); }
    // индекс источников света (факелы и пр.) — для сквозного света между чанками
    if (s.lightEmitters) {
      s.lightEmitters.clear();
      for (const [k, id] of s.edits) { const em = lightEmission(id); if (em > 0) s.lightEmitters.set(k, em); }
    }
    for (const e of (d.doors || [])) { const p = e.split(':'); s.doorState.set(p[0], { open: p[1]==='1', hinge: p[2]==='left'?'left':'right' }); }
    for (const f of (d.furnaces || [])) {
      s.furnaces.set(f.k, {
        input: f.input ? { id: f.input.id, count: f.input.count, ...(f.input.dur !== undefined ? { dur: f.input.dur } : {}) } : null,
        fuel:   f.fuel   ? { id: f.fuel.id,   count: f.fuel.count,   ...(f.fuel.dur   !== undefined ? { dur: f.fuel.dur } : {}) } : null,
        output: f.output ? { id: f.output.id, count: f.output.count, ...(f.output.dur !== undefined ? { dur: f.output.dur } : {}) } : null,
        burn: f.burn || 0, burnMax: f.burnMax || 0, cook: f.cook || 0,
      });
    }
    for (const ch of (d.chests || [])) { const arr = new Array(CHEST_SIZE).fill(null); const it = ch.items||[]; for (let i=0;i<CHEST_SIZE;i++) arr[i] = it[i] ? { id: it[i].id, count: it[i].count, ...(it[i].dur !== undefined ? { dur: it[i].dur } : {}) } : null; s.chests.set(ch.k, arr); }
    for (const e of (d.doubleChests || [])) { const i = e.indexOf('>'); if (i>0) s.doubleChests.set(e.slice(0,i), e.slice(i+1)); }
    for (const e of (d.facing || [])) { const i = e.lastIndexOf(':'); s.facing.set(e.slice(0,i), parseInt(e.slice(i+1), 10)); }
    for (const e of (d.waterLevels || [])) { const i = e.lastIndexOf(':'); s.waterLevel.set(e.slice(0, i), parseInt(e.slice(i+1), 10)); }
    s.entMobs = (d.mobs || []).map(m => ({ type: m.t, x: m.x, y: m.y, z: m.z, yaw: m.yaw||0, hp: m.hp, sheared: !!m.sh }));
    s.entDrops = (d.drops || []).map(dr => ({ id: dr.id, x: dr.x, y: dr.y, z: dr.z, count: dr.c || 1 }));
    s.entBoats = (d.boats || []).map(b => ({ x: b.x, y: b.y, z: b.z, yaw: b.yaw || 0 }));
    s.portals = (d.portals || []).map(e => { const [x,y,z] = e.split(',').map(Number); return { x, y, z }; });
    // редстоун-состояние
    s.levers = new Map();
    for (const e of (d.levers || [])) { const p = e.split(':'); const on = p[1]==='1'; const facing = parseInt(p[2],10); s.levers.set(p[0], { on, facing: facing<0 ? undefined : facing }); }
    s.buttons = new Map();
    for (const e of (d.buttons || [])) { const p = e.split(':'); const facing = parseInt(p[1],10); s.buttons.set(p[0], { pressed: false, timer: 0, facing: facing<0 ? undefined : facing }); }
    s.pistons = new Set(d.pistons || []);
    // командные блоки
    if (s.cmdBlocks) {
      s.cmdBlocks.clear();
      for (const e of (d.cmdBlocks || [])) {
        try { const [k, cmd, always] = JSON.parse(e); s.cmdBlocks.set(k, { cmd: cmd || '', always: !!always }); } catch (err) {}
      }
    }
  },

  save() {
    if (!this.current) return false;
    captureDimEntities(); // снять текущих мобов/дропы активного измерения в стор
    const armorOut = {};
    for (const sl of ['helmet','chestplate','leggings','boots']) {
      const a = PLAYER.armor && PLAYER.armor[sl];
      armorOut[sl] = a ? { id: a.id, dur: a.dur } : null;
    }
    const data = {
      seed: WORLD_SEED,
      dim: World.dim,
      dimReturn: _dimReturn,
      cheatsEnabled: !!this.cheatsEnabled, // флаг читов для мира
      gameMode: window.__creative ? 'creative' : 'survival', // режим игры (восстанавливается при загрузке)
      rules: { legacyDurability: !!(this.rules && this.rules.legacyDurability) }, // правила мира (неизменны)
      player: {
        x: PLAYER.pos.x, y: PLAYER.pos.y, z: PLAYER.pos.z,
        yaw: PLAYER.yaw, pitch: PLAYER.pitch,
        oxygen: PLAYER.oxygen, hp: PLAYER.hp, hunger: PLAYER.hunger,
        spawn: PLAYER.spawnPoint || null,
      },
      dayTime: DAY.time,
      armor: armorOut,
      slots: slots.map(s => s ? { id: s.id, count: s.count, dur: s.dur } : null),
      // предметы в сетке крафта и на курсоре тоже сохраняем (фикс: раньше терялись при автосейве)
      craft: craftSlots.map(s => s ? { id: s.id, count: s.count, dur: s.dur } : null),
      cursor: cursorItem ? { id: cursorItem.id, count: cursorItem.count, dur: cursorItem.dur } : null,
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
      // квота localStorage (5 МБ) переполнена — сообщить игроку, а не молчать
      showToast('Не удалось сохранить: хранилище браузера переполнено!', 4000);
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
    // МИГРАЦИЯ: старые миры (без поля cheatsEnabled) — читы выключены (cheatsDisabled = true).
    // Новые миры явно хранят cheatsEnabled (true/false).
    this.cheatsEnabled = (data.cheatsEnabled === true);
    // МИГРАЦИЯ: старые миры без поля rules — правило выключено (ванильная прочность)
    this.rules = (data.rules && typeof data.rules === 'object')
      ? { legacyDurability: !!data.rules.legacyDurability }
      : { legacyDurability: false };
    // восстановить игровой режим (креатив/выживание); старые миры — выживание
    setGameMode(data.gameMode === 'creative', false);

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
    // восстановить сетку крафта и предмет на курсоре (сохраняются с версии фикса)
    if (Array.isArray(data.craft)) {
      for (let i = 0; i < craftSlots.length; i++) {
        const c = data.craft[i];
        craftSlots[i] = c ? { id: c.id, count: c.count, ...(c.dur !== undefined ? { dur: c.dur } : {}) } : null;
      }
    }
    if (data.cursor) cursorItem = { id: data.cursor.id, count: data.cursor.count, ...(data.cursor.dur !== undefined ? { dur: data.cursor.dur } : {}) };
    renderHotbar();

    // игрок
    const p = data.player || {};
    PLAYER.pos.set(p.x ?? 8, p.y ?? 50, p.z ?? 8);
    PLAYER.yaw = p.yaw || 0;
    PLAYER.pitch = p.pitch || 0;
    PLAYER.oxygen = p.oxygen ?? PLAYER.maxOxygen;
    // фикс: сейв, сделанный на экране смерти (hp=0), не должен воскрешать «полумёртвым»
    PLAYER.hp = (typeof p.hp === 'number' && p.hp > 0) ? p.hp : PLAYER.maxHp;
    PLAYER.hunger = p.hunger ?? PLAYER.maxHunger;
    PLAYER.exhaustion = 0;
    PLAYER.spawnPoint = p.spawn || null;
    PLAYER.dead = false;
    PLAYER.fallStart = undefined;

    // время суток
    DAY.time = (typeof data.dayTime === 'number') ? data.dayTime : 0.30;
    DAY_LIGHT_UNIFORM.value = World.dim === 'overworld' ? skyFactor() : 1;

    // восстановить сущности текущего измерения
    restoreDimEntities();

    // пере-запустить воду и песок вокруг изменённых клеток текущего измерения
    for (const k of World.edits.keys()) {
      const [x, y, z] = k.split(',').map(Number);
      WaterSim.touchAround(x, y, z);
      checkSandAround(x, y, z);
    }

    // синхронизировать редстоун-сеть (рычаги восстановлены — пыль должна «загореться»)
    if (typeof markRedstoneDirty === 'function') {
      markRedstoneDirty(Math.floor(PLAYER.pos.x), Math.floor(PLAYER.pos.y), Math.floor(PLAYER.pos.z));
    }

    startWorldLoading();
  },

  delete(name) {
    localStorage.removeItem(this.LS_PREFIX + name);
    this.saveIndex(this.list().filter(w => w.name !== name));
    renderWorldList();
  },
};

// --- Сохранение/восстановление сущностей (мобы и выпавшие предметы) по измерениям ---
// Снять «живые» сущности активного измерения в его стор (компактные данные).
function captureDimEntities() {
  const s = World.dims[World.dim];
  if (!s) return;
  s.entMobs = mobs.map(m => ({
    type: m.type, x: m.pos.x, y: m.pos.y, z: m.pos.z,
    yaw: m.yaw, hp: m.hp, sheared: !!m.sheared,
  }));
  s.entDrops = drops.map(d => ({ id: d.id, x: d.pos.x, y: d.pos.y, z: d.pos.z, count: d.count || 1 }));
  s.entBoats = boats.map(b => ({ x: b.pos.x, y: b.pos.y, z: b.pos.z, yaw: b.yaw }));
  // сохранить состояние редстоуна (рычаги/кнопки/поршни) в стор измерения
  s.levers = leverStates;
  s.buttons = buttonStates;
  s.pistons = pistonExtendedSet;
}
// Восстановить сущности активного измерения из стора (и очистить снимок).
function restoreDimEntities() {
  // убрать текущие живые сущности из сцены (с освобождением геометрии)
  for (const m of mobs) { scene.remove(m.mesh); disposeGroup(m.mesh); } mobs.length = 0;
  for (const d of drops) { scene.remove(d.mesh); disposeGroup(d.mesh); } drops.length = 0;
  for (const b of boats) { scene.remove(b.mesh); disposeGroup(b.mesh); } boats.length = 0;
  const s = World.dims[World.dim];
  if (!s) return;
  for (const e of (s.entMobs || [])) {
    if (!MOB_TYPES[e.type]) continue;
    spawnMob(e.type, e.x, e.y, e.z);
    const m = mobs[mobs.length - 1];
    if (m) { m.yaw = e.yaw || 0; m.hp = e.hp ?? m.hp; m.sheared = !!e.sheared;
      if (m.sheared && m.mesh.userData.wool) m.mesh.userData.wool.scale.set(0.8,0.7,0.85); }
  }
  for (const e of (s.entDrops || [])) {
    spawnDrop(e.id, e.x, e.y, e.z, e.count || 1);
    const d = drops[drops.length - 1];
    if (d) { d.vel.set(0,0,0); d.pickDelay = 0; } // не подпрыгивать заново
  }
  for (const e of (s.entBoats || [])) {
    spawnBoat(e.x, e.y, e.z);
    const b = boats[boats.length - 1];
    if (b && e.yaw) b.yaw = e.yaw;
  }
  s.entMobs = []; s.entDrops = []; s.entBoats = [];
  // восстановить состояние редстоуна из стора в глобальные переменные
  leverStates = s.levers || new Map();
  buttonStates = s.buttons || new Map();
  pistonExtendedSet = s.pistons || new Set();
}

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

  // токен отмены: если во время предзагрузки открыт другой мир —
  // старый цикл загрузки завершится сам (раньше работали два rAF-цикла параллельно)
  const myToken = ++startWorldLoading._gen;

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
    if (myToken !== startWorldLoading._gen) return; // загрузка отменена — новый мир грузится
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
  pausedFromGame = false; // играем, а не на паузе
  document.getElementById('resumeBtn').style.display = 'none';
  overlay.classList.add('hidden');
  document.getElementById('menuBtn').style.display = 'block';
  initAudio();
  canvas.requestPointerLock();
  if (typeof updateChatMiniVisibility === 'function') updateChatMiniVisibility();
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
  if (!pointerLocked && overlay.classList.contains('hidden') && !invOpen && !chatOpen) {
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
  // F3 — отладочный экран (только координаты и FPS), как в MC
  if (e.code === 'F3') {
    e.preventDefault();
    debugOpen = !debugOpen;
    hudEl.classList.toggle('on', debugOpen);
  }
  // Креатив: ДВОЙНОЙ ПРОБЕЛ — вкл/выкл полёта (как в Minecraft)
  if (e.code === 'Space' && window.__creative && !e.repeat) {
    const now = performance.now();
    if (now - _lastSpaceTap < 300) {
      PLAYER.flying = !PLAYER.flying;
      if (PLAYER.flying) PLAYER.vel.y = 0;
      showToast(PLAYER.flying ? 'Полёт включён (двойной пробел)' : 'Полёт выключен');
      _lastSpaceTap = 0;
    } else {
      _lastSpaceTap = now;
    }
  }
  if (e.code === 'KeyE') { toggleInventory(); }
  if (e.code === 'KeyJ') { toggleInventory('guide'); } // справочник рецептов
  // Q — выбросить 1 предмет; Ctrl+Q — выбросить весь стак (работает и в инвентаре с курсора)
  if (e.code === 'KeyQ') { dropFromHand(e.ctrlKey || e.metaKey); e.preventDefault(); }
  if (e.code.startsWith('Digit')) {
    const n = parseInt(e.code.slice(5), 10);
    if (n >= 1 && n <= HOTBAR_SIZE) selectSlot(n - 1);
  }
  // Escape обрабатывается в отдельном обработчике ниже (инвентарь/меню)
});
let _lastSpaceTap = 0;
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
  mining.digTimer = 0; // сброс и таймера звука, иначе звук копания играется дважды
  breakOverlay.visible = false;
}

// Вызывается каждый кадр при удержании ЛКМ.
// preTarget — уже вычисленный лучом кадра блок (экономит повторный raycast)
function updateMining(dt, preTarget) {
  if (!leftHeld || invOpen) { if (mining.active) resetMining(); return; }

  const t = (preTarget !== undefined && preTarget !== null) ? preTarget : getTargetBlock();
  if (!t || t.block === BLOCK.BEDROCK || t.y <= 0) { resetMining(); return; }

  // если смотрим на другой блок — начать заново
  if (!mining.active || mining.x !== t.x || mining.y !== t.y || mining.z !== t.z) {
    mining.active = true;
    mining.x = t.x; mining.y = t.y; mining.z = t.z;
    mining.block = t.block;
    mining.progress = 0;
    mining.digTimer = 0;
    playSound('dig', mining.block);
  }

  const held = activeItem();
  const heldId = held ? held.id : 0;

  let time = computeBreakTime(mining.block, heldId);
  // упрощённый креатив (включается /gamemode c при читах): мгновенное ломание
  if (window.__creative) time = 0.05;
  // в MC под водой блоки ломаются в 5 раз дольше (без акваланга)
  if (PLAYER.submerged) time *= 5;
  if (!isFinite(time)) { resetMining(); return; }
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

// Максимальный размер стопки (как в MC): инструменты/броня не складываются,
// вёдра и двери — по 16, остальное — 64
function maxStack(id) {
  if (isTool(id) || isArmor(id) || id === ITEM.SHEARS || id === ITEM.FLINT_AND_STEEL || id === ITEM.BOAT) return 1;
  if (id === ITEM.BUCKET || id === ITEM.WATER_BUCKET || id === ITEM.LAVA_BUCKET || id === ITEM.DOOR) return 16;
  return MAX_STACK;
}

// ---- Базовые операции со стопками ----
function addToInventory(id, n = 1, dur) {
  onObtain(id); // открыть ресурс для справочника
  let firstDur = dur; // прочность переносится на первую положенную единицу
  // сначала докинуть в существующие стопки
  for (let i = 0; i < TOTAL_SLOTS && n > 0; i++) {
    const s = slots[i];
    if (s && s.id === id && s.count < maxStack(id) && s.dur === undefined) {
      const can = Math.min(n, maxStack(id) - s.count);
      s.count += can; n -= can;
    }
  }
  // затем в пустые слоты (приоритет хотбару)
  for (let i = 0; i < TOTAL_SLOTS && n > 0; i++) {
    if (!slots[i]) {
      const can = Math.min(n, maxStack(id));
      slots[i] = { id, count: can, ...(firstDur !== undefined ? { dur: firstDur } : {}) };
      firstDur = undefined; // прочность — только у первой единицы
      n -= can;
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

// списать 1 предмет из активного слота при использовании/постановке.
// Креатив: предметы БЕСКОНЕЧНЫ и не расходуются (parity MC)
function consumeHeldItem(slot) {
  if (window.__creative) return;
  slot.count--;
  if (slot.count <= 0) slots[activeSlot] = null;
}

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
  // ПЕРО (фикс: раньше не было своей иконки и рисовалось серым квадратом-фолбэком)
  if (id === ITEM.FEATHER) {
    const u = size/16;
    // стержень по диагонали (снизу-слева вверх-направо)
    ctx.strokeStyle = '#c9b892'; ctx.lineWidth = Math.max(1, u*0.9);
    ctx.beginPath(); ctx.moveTo(3.4*u, 13.4*u); ctx.lineTo(12.6*u, 2.6*u); ctx.stroke();
    // опахало — белые «борозды» по обе стороны от стержня
    const barbs = [
      // верхняя сторона (выше стержня)
      [6,11,8,9], [8,9,10,7], [10,7,12,5], [11.6,5.4,13,4],
      // нижняя сторона (ниже стержня)
      [5,10,7,8.4], [7,8,9,6], [9,6,11,4.4],
    ];
    ctx.fillStyle = '#f4f4f0';
    for (const [x1,y1,x2,y2] of barbs) {
      ctx.beginPath();
      ctx.moveTo(x1*u, y1*u);
      ctx.lineTo(x2*u, y2*u);
      ctx.lineTo((x2-0.6)*u, (y2+1.2)*u);
      ctx.lineTo((x1-0.6)*u, (y1+1.4)*u);
      ctx.closePath(); ctx.fill();
    }
    // тень-гребень на опахале (лёгкий серый оттенок снизу)
    ctx.fillStyle = '#d8d8d2';
    ctx.beginPath(); ctx.moveTo(5*u,11.6*u); ctx.lineTo(7*u,9.6*u); ctx.lineTo(6.4*u,10.8*u); ctx.closePath(); ctx.fill();
    // очин — светлое основание стержня
    ctx.fillStyle = '#e8e0c8';
    ctx.fillRect(3*u,13*u,2*u,2*u);
    // контур опахала сверху
    ctx.strokeStyle = '#c2c2ba'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(6*u,10.2*u); ctx.lineTo(12.4*u,3.8*u); ctx.stroke();
    return c;
  }
  // броня — рисуем по типу куска + цвету материала
  if (isArmor(id)) {
    const u = size/16;
    const isDia = (id>=ITEM.DIAMOND_HELMET), isIron = (id>=ITEM.IRON_HELMET && id<=ITEM.IRON_BOOTS);
    const isCopper = (id>=ITEM.COPPER_HELMET && id<=ITEM.COPPER_BOOTS);
    const mat = isDia ? '#3fd6e0' : isIron ? '#cfd3da' : isCopper ? '#d07a40' : '#8a5a32';
    const dark = isDia ? '#1f9fb0' : isIron ? '#9aa0a8' : isCopper ? '#9c4f22' : '#5e3a1e';
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
  // баранина — кусок мяса (как свинина, но другой оттенок)
  if (id === ITEM.MUTTON_RAW || id === ITEM.MUTTON_COOKED) {
    const cooked = (id === ITEM.MUTTON_COOKED);
    const u = size/16;
    const meat = cooked ? '#8a4a2c' : '#d06860';
    const edge = cooked ? '#5a2e18' : '#a04640';
    ctx.fillStyle = meat; ctx.fillRect(4*u,4*u,9*u,8*u); ctx.fillRect(3*u,6*u,11*u,5*u);
    ctx.fillStyle = edge; ctx.fillRect(4*u,11*u,9*u,1*u); ctx.fillRect(12*u,5*u,1*u,6*u);
    ctx.fillStyle = cooked ? '#3a2414' : '#e89a92'; ctx.fillRect(6*u,6*u,4*u,1*u); ctx.fillRect(5*u,9*u,5*u,1*u);
    ctx.fillStyle = '#efe6cf'; ctx.fillRect(11*u,3*u,3*u,2*u); ctx.fillRect(12*u,4*u,3*u,2*u);
    return c;
  }
  // рыба — целая рыбка с хвостом
  if (id === ITEM.FISH_RAW || id === ITEM.FISH_COOKED) {
    const cooked = (id === ITEM.FISH_COOKED);
    const u = size/16;
    const body = cooked ? '#c79352' : '#9bb6c4';
    const belly = cooked ? '#e0bd80' : '#d6e4ec';
    const edge = cooked ? '#8a6230' : '#6a8a9c';
    // тело
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(3*u,8*u); ctx.lineTo(7*u,4*u); ctx.lineTo(12*u,5*u); ctx.lineTo(13*u,8*u);
    ctx.lineTo(12*u,11*u); ctx.lineTo(7*u,12*u); ctx.closePath(); ctx.fill();
    // брюшко
    ctx.fillStyle = belly; ctx.fillRect(6*u,8*u,6*u,3*u);
    // хвост
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.moveTo(3*u,8*u); ctx.lineTo(1*u,5*u); ctx.lineTo(1*u,11*u); ctx.closePath(); ctx.fill();
    // глаз
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(11*u,7*u,1*u,1*u);
    ctx.fillStyle = edge; ctx.fillRect(7*u,4*u,1*u,1*u);
    return c;
  }
  // гнилая плоть — зеленовато-бурый кусок с «плесенью»
  if (id === ITEM.ROTTEN_FLESH) {
    const u = size/16;
    ctx.fillStyle = '#8a5a3c'; ctx.fillRect(3*u,4*u,10*u,9*u);        // основа — тухлое мясо
    ctx.fillStyle = '#a8744c'; ctx.fillRect(4*u,5*u,8*u,3*u);         // светлая мякоть
    ctx.fillStyle = '#5a7a3a';                                        // зелёные пятна гнили
    ctx.fillRect(5*u,8*u,3*u,2*u); ctx.fillRect(10*u,6*u,2*u,2*u); ctx.fillRect(8*u,10*u,3*u,2*u);
    ctx.fillStyle = '#3a5a24'; ctx.fillRect(6*u,11*u,2*u,1*u);        // тёмная гниль
    ctx.fillStyle = '#c8d8b0'; ctx.fillRect(4*u,9*u,1*u,1*u); ctx.fillRect(11*u,9*u,1*u,1*u); // «личинки»-блики
    ctx.strokeStyle = '#4a3220'; ctx.lineWidth=1; ctx.strokeRect(3*u,4*u,10*u,9*u);
    return c;
  }
  // факел — палка с пламенем
  if (id === BLOCK.TORCH) {
    const u = size/16;
    ctx.fillStyle = '#6b4a24'; ctx.fillRect(7*u,7*u,2*u,8*u);
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(6*u,5*u,4*u,2*u);
    ctx.fillStyle = '#ff8a20'; ctx.fillRect(6*u,2*u,4*u,4*u);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(7*u,3*u,2*u,3*u);
    ctx.fillStyle = '#fff0a0'; ctx.fillRect(7*u,4*u,1*u,1*u);
    return c;
  }
  // кровать — иконка с одеялом и подушкой
  if (id === BLOCK.BED_FOOT || id === BLOCK.BED_HEAD) {
    const u = size/16;
    ctx.fillStyle = '#6b4a24'; ctx.fillRect(2*u,9*u,12*u,4*u);  // деревянная рама
    ctx.fillStyle = '#c0352f'; ctx.fillRect(2*u,5*u,12*u,5*u);  // одеяло
    ctx.fillStyle = '#f2f2f4'; ctx.fillRect(3*u,6*u,4*u,3*u);   // подушка
    ctx.fillStyle = '#922420'; ctx.fillRect(2*u,9*u,12*u,1*u);
    return c;
  }

  // Ножницы — два железных лезвия + центральный винт
  if (id === ITEM.SHEARS) {
    const u = size/16;
    // лезвия (серебристые, X-образно)
    ctx.fillStyle = '#c4c8cf';
    ctx.fillRect(4*u,3*u,2*u,6*u);  ctx.fillRect(10*u,3*u,2*u,6*u);
    ctx.fillRect(5*u,8*u,2*u,5*u);  ctx.fillRect(9*u,8*u,2*u,5*u);
    // тёмный контур
    ctx.fillStyle = '#7a8088';
    ctx.fillRect(4*u,8*u,1*u,4*u);  ctx.fillRect(11*u,8*u,1*u,4*u);
    // отверстия-кольца внизу
    ctx.fillStyle = '#3a3e44';
    ctx.fillRect(5*u,12*u,2*u,2*u); ctx.fillRect(9*u,12*u,2*u,2*u);
    // центральный винт
    ctx.fillStyle = '#5a5e64'; ctx.fillRect(7*u,6*u,2*u,2*u);
    ctx.fillStyle = '#e6e9ee'; ctx.fillRect(7*u,6*u,1*u,1*u);
    return c;
  }
  // Редстоун — кучка красных кристаллов
  if (id === ITEM.REDSTONE) {
    const u = size/16;
    ctx.fillStyle = '#3a3a3e'; ctx.fillRect(2*u,8*u,12*u,5*u); // подложка
    ctx.fillStyle = '#c0201a';
    const pts = [[3,9],[6,8],[9,9],[12,8],[4,11],[8,11],[11,11]];
    for (const [gx,gy] of pts) ctx.fillRect(gx*u,gy*u,2*u,2*u);
    ctx.fillStyle = '#ff4830';
    for (const [gx,gy] of [[3,9],[6,8],[9,9]]) ctx.fillRect(gx*u,gy*u,1*u,1*u);
    ctx.fillStyle = '#ff8060'; ctx.fillRect(7*u,9*u,1*u,1*u);
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
  else if (id === BLOCK.DEEPSLATE) tex = TEX.deepslate;
  else if (id === BLOCK.REDSTONE_ORE) tex = TEX.redstone_ore;
  else if (id === BLOCK.REDSTONE_DUST) { ctx.fillStyle = '#3a3a3e'; ctx.fillRect(0,0,size,size); tex = TEX.redstone_dust; }
  else if (id === BLOCK.REDSTONE_TORCH) tex = TEX.redstone_torch;
  else if (id === BLOCK.LEVER) tex = TEX.lever;
  else if (id === BLOCK.BUTTON) tex = TEX.button;
  else if (id === BLOCK.PISTON) tex = TEX.piston_face;
  else if (id === BLOCK.PISTON_HEAD) tex = TEX.piston_head_face;
  else if (id === BLOCK.COMMAND_BLOCK) tex = TEX.cmd_front;
  else if (id === BLOCK.WOOL) tex = TEX.wool;
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
const P = BLOCK.PLANKS, S = ITEM.STICK, C = BLOCK.COBBLESTONE, O = 0, I = ITEM.IRON_INGOT, U = ITEM.COPPER_INGOT, D = ITEM.DIAMOND, L = ITEM.LEATHER, W = BLOCK.WOOL, CO = ITEM.COAL;
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
  ...armorRecipe(U, ITEM.COPPER_HELMET, ITEM.COPPER_CHESTPLATE, ITEM.COPPER_LEGGINGS, ITEM.COPPER_BOOTS),
  ...armorRecipe(I, ITEM.IRON_HELMET, ITEM.IRON_CHESTPLATE, ITEM.IRON_LEGGINGS, ITEM.IRON_BOOTS),
  ...armorRecipe(D, ITEM.DIAMOND_HELMET, ITEM.DIAMOND_CHESTPLATE, ITEM.DIAMOND_LEGGINGS, ITEM.DIAMOND_BOOTS),
  // факел: уголь/древесный уголь над палкой -> 4 факела
  { shaped:true, w:1, h:2, cells:[CO, S], result:{ id: BLOCK.TORCH, count:4 } },
  { shaped:true, w:1, h:2, cells:[ITEM.CHARCOAL, S], result:{ id: BLOCK.TORCH, count:4 } },
  // кровать: 3 шерсти + 3 доски (3x2) -> кровать
  { shaped:true, w:3, h:2, need3x3:true, cells:[W,W,W, P,P,P], result:{ id: BLOCK.BED_FOOT, count:1 } },
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
  // ножницы: 2 железных слитка по диагонали (2x2) -> ножницы
  { shaped: true, w: 2, h: 2,
    cells: [I,O,
            O,I], result: { id: ITEM.SHEARS, count: 1 } },
  // рычаг: булыжник + палка (столбик) -> рычаг
  { shaped: true, w: 1, h: 2,
    cells: [C, S], result: { id: BLOCK.LEVER, count: 1 } },
  // редстоуновый факел: редстоун над палкой -> 1 факел
  { shaped: true, w: 1, h: 2,
    cells: [ITEM.REDSTONE, S], result: { id: BLOCK.REDSTONE_TORCH, count: 1 } },
  // кнопка: 1 булыжник (одиночный блок) -> 1 кнопка
  { shaped: true, w: 1, h: 1, cells: [C], result: { id: BLOCK.BUTTON, count: 1 } },
  // поршень: 3 доски сверху + 4 булыжника + железо + редстоун (3x3)
  { shaped: true, w: 3, h: 3, need3x3: true,
    cells: [P,P,P,
            C,I,C,
            C,ITEM.REDSTONE,C], result: { id: BLOCK.PISTON, count: 1 } },
];

// Категории для справочника (J): раскладываем рецепты по группам.
// Явный rec.cat важнее; остальное выводим из результата.
const RECIPE_CATS = [
  { id: 'basics',  title: 'Основное' },
  { id: 'tools',   title: 'Инструменты' },
  { id: 'combat',  title: 'Оружие и броня' },
  { id: 'redstone', title: 'Механизмы (редстоун)' },
];
for (const rec of RECIPES) {
  if (rec.cat !== undefined) continue;
  const id = rec.result.id;
  if (isSword(id) || isArmor(id)) rec.cat = 'combat';
  else if (isPickaxe(id) || isAxe(id) || isShovel(id)) rec.cat = 'tools';
  else if (id === BLOCK.LEVER || id === BLOCK.BUTTON || id === BLOCK.REDSTONE_TORCH || id === BLOCK.PISTON) rec.cat = 'redstone';
  else rec.cat = 'basics';
}

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

// вернуть предметы из сетки крафта в инвентарь (при закрытии); не влезшее — выбросить под ноги
function clearCraftToInventory() {
  const n = 3;
  for (let i=0;i<n*n;i++){
    if (craftSlots[i]) {
      const s = craftSlots[i];
      if (!addToInventory(s.id, s.count, s.dur)) tossDropForward(s.id);
      craftSlots[i]=null;
    }
  }
  if (cursorItem) {
    if (!addToInventory(cursorItem.id, cursorItem.count, cursorItem.dur)) tossDropForward(cursorItem.id);
    cursorItem = null;
  }
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

// клик по слоту инвентаря/хотбара (массив slots[index]); shift — быстрый перенос как в MC
function slotClick(arr, index, rightClick, shiftKey) {
  const s = arr[index];

  // ---- Shift+ЛКМ: быстрый перенос (как в Minecraft) ----
  if (shiftKey && !cursorItem && s) {
    if (arr === slots) {
      // открыт сундук — переносим в сундук (в т.ч. из двойного)
      if (craftMode === 'chest' && openChestPos) {
        const chest = chestView(openChestPos.x, openChestPos.y, openChestPos.z);
        const cnt = chestSlotCount(openChestPos.x, openChestPos.y, openChestPos.z);
        let moved = 0;
        for (let ci = 0; ci < cnt && s.count > 0; ci++) {
          const c = chest[ci];
          if (c && c.id === s.id && c.dur === undefined && s.dur === undefined && c.count < maxStack(s.id)) {
            const can = Math.min(s.count, maxStack(s.id) - c.count); c.count += can; moved += can; s.count -= can;
          }
        }
        for (let ci = 0; ci < cnt && s.count > 0; ci++) {
          if (!chest[ci]) { const can = Math.min(s.count, maxStack(s.id)); chest[ci] = { id: s.id, count: can, ...(s.dur !== undefined ? { dur: s.dur } : {}) }; if (s.dur !== undefined) s.dur = undefined; moved += can; s.count -= can; }
        }
        if (moved > 0) { if (s.count <= 0) slots[index] = null; refreshUI(); return; }
      }
      // открыта печь — плавимое в input, топливо в fuel
      if (craftMode === 'furnace' && openFurnacePos) {
        const f = getFurnace(openFurnacePos.x, openFurnacePos.y, openFurnacePos.z);
        const target = isSmeltable(s.id) ? 'input' : (isFuel(s.id) ? 'fuel' : null);
        if (target) {
          const dst = f[target];
          if (!dst) { f[target] = { id: s.id, count: s.count, ...(s.dur !== undefined ? { dur: s.dur } : {}) }; slots[index] = null; }
          else if (dst.id === s.id && dst.count < maxStack(s.id)) { const can = Math.min(s.count, maxStack(s.id) - dst.count); dst.count += can; s.count -= can; if (s.count <= 0) slots[index] = null; }
          refreshUI(); return;
        }
      }
      // обычный инвентарь/верстак: хотбар <-> рюкзак
      const from = index < HOTBAR_SIZE; // true: хотбар -> рюкзак
      const lo = from ? HOTBAR_SIZE : 0;
      const hi = from ? TOTAL_SLOTS : HOTBAR_SIZE;
      let moved = false;
      for (let i = lo; i < hi && s.count > 0; i++) {
        const d = slots[i];
        if (d && d.id === s.id && d.dur === undefined && s.dur === undefined && d.count < maxStack(s.id)) {
          const can = Math.min(s.count, maxStack(s.id) - d.count); d.count += can; s.count -= can; moved = true;
        }
      }
      for (let i = lo; i < hi && s.count > 0; i++) {
        if (!slots[i]) { slots[i] = s; slots[index] = null; moved = true; break; }
      }
      if (moved) { if (slots[index] && slots[index].count <= 0) slots[index] = null; updateCraftResult(); refreshUI(); return; }
    } else if (arr !== craftSlots && craftMode !== 'chest') {
      // из сундука в инвентарь
      if (addToInventory(s.id, s.count, s.dur)) { arr[index] = null; refreshUI(); return; }
    }
  }

  if (!cursorItem) {
    if (!s) return;
    if (rightClick) {
      // взять половину (прочность переносится — фикс «бесплатного ремонта» перекладыванием)
      const half = Math.ceil(s.count / 2);
      cursorItem = { id: s.id, count: half, ...(s.dur !== undefined ? { dur: s.dur } : {}) };
      s.count -= half; if (s.count <= 0) arr[index] = null;
    } else {
      cursorItem = s; arr[index] = null; // взять всю стопку
    }
  } else {
    if (!s) {
      if (rightClick) {
        // положить 1 (с прочностью, если предмет один)
        const one = (cursorItem.count === 1 && cursorItem.dur !== undefined);
        arr[index] = { id: cursorItem.id, count: 1, ...(one ? { dur: cursorItem.dur } : {}) };
        if (one) cursorItem.dur = undefined;
        cursorItem.count--; if (cursorItem.count <= 0) cursorItem = null;
      } else {
        arr[index] = cursorItem; cursorItem = null;
      }
    } else if (s.id === cursorItem.id && s.dur === undefined && cursorItem.dur === undefined) {
      // объединить стопки (только предметы без прочности)
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
    slotClick(arr, index, e.button === 2, e.shiftKey);
  });
  el.addEventListener('contextmenu', e => e.preventDefault());
  return el;
}

const invGrid = document.getElementById('invGrid');
// клик по слотам печи (поля input/fuel/output) — с сохранением прочности
function furnaceSlotClick(f, field, rightClick) {
  if (field === 'output') {
    // только забрать
    const s = f.output;
    if (!s) return;
    onObtain(s.id); // переплавленный предмет открывает рецепт
    if (!cursorItem) { cursorItem = s; f.output = null; }
    else if (cursorItem.id === s.id && cursorItem.dur === undefined && s.dur === undefined && cursorItem.count + s.count <= maxStack(s.id)) { cursorItem.count += s.count; f.output = null; }
    refreshUI(); return;
  }
  const s = f[field];
  if (!cursorItem) {
    if (!s) return;
    if (rightClick) { const half=Math.ceil(s.count/2); cursorItem={id:s.id,count:half,...(s.dur!==undefined?{dur:s.dur}:{})}; s.count-=half; if(s.count<=0) f[field]=null; }
    else { cursorItem = s; f[field] = null; }
  } else {
    // для input принимаем только плавимые, для fuel — только топливо
    if (field === 'input' && !isSmeltable(cursorItem.id)) return;
    if (field === 'fuel' && !isFuel(cursorItem.id)) return;
    if (!s) {
      if (rightClick) { const one = (cursorItem.count === 1 && cursorItem.dur !== undefined); f[field] = {id:cursorItem.id,count:1,...(one?{dur:cursorItem.dur}:{})}; if (one) cursorItem.dur = undefined; cursorItem.count--; if(cursorItem.count<=0) cursorItem=null; }
      else { f[field] = cursorItem; cursorItem = null; }
    } else if (s.id === cursorItem.id && s.dur === undefined && cursorItem.dur === undefined) {
      const space = maxStack(s.id) - s.count;
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
  // заметка о некрафтяемых вещах (parity MC)
  const extra = document.createElement('div');
  extra.className = 'guide-intro';
  extra.style.marginTop = '6px';
  extra.innerHTML = 'Не крафтится (как в Minecraft): командный блок — только <b>креатив-инвентарь (E)</b> или <code>/give command_block</code>. ' +
    'Креатив: <code>/gamemode c</code> или при создании мира — полёт, бесконечные предметы.';
  wrap.appendChild(extra);

  // строка рецепта (сетка -> стрелка -> результат)
  const appendRecipeRow = (row, cells, w, h, resultId, resultCount) => {
    const grid = document.createElement('div'); grid.className = 'guide-grid';
    grid.style.gridTemplateColumns = `repeat(${w}, 24px)`;
    for (let i = 0; i < w * h; i++) grid.appendChild(recipeIconEl(cells[i] || 0, 20));
    row.appendChild(grid);
    const arr = document.createElement('div'); arr.className = 'guide-arrow'; arr.appendChild(makeArrowIcon());
    row.appendChild(arr);
    const res = recipeIconEl(resultId, 24); res.classList.add('guide-result');
    if (resultCount > 1) { const c=document.createElement('span'); c.className='guide-count'; c.textContent='×'+resultCount; res.appendChild(c); }
    row.appendChild(res);
    const nm = document.createElement('div'); nm.className = 'guide-name';
    nm.textContent = BLOCK_NAMES[resultId] || '';
    row.appendChild(nm);
  };

  // --- Крафт-рецепты по категориям ---
  for (const cat of RECIPE_CATS) {
    const recs = RECIPES.filter(r => r.cat === cat.id);
    if (!recs.length) continue;
    const hdr = document.createElement('div'); hdr.className = 'guide-intro';
    hdr.style.marginTop = '8px';
    hdr.textContent = cat.title + ':';
    wrap.appendChild(hdr);
    for (const rec of recs) {
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
      appendRecipeRow(row, g.cells, g.w, g.h, rec.result.id, rec.result.count);
      wrap.appendChild(row);
    }
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

// ============================================================
//  Креатив-инвентарь: ВСЕ предметы/блоки + поиск (parity MC)
// ============================================================
// Что доступно в креативе: все ставимые блоки (кроме технических) + все предметы
const CREATIVE_ITEMS = [
  // природные блоки
  BLOCK.GRASS, BLOCK.DIRT, BLOCK.STONE, BLOCK.COBBLESTONE, BLOCK.DEEPSLATE, BLOCK.BEDROCK,
  BLOCK.SAND, BLOCK.GRAVEL, BLOCK.WOOD, BLOCK.LEAVES, BLOCK.PLANKS,
  // руды и материалы
  BLOCK.COAL_ORE, BLOCK.COPPER_ORE, BLOCK.IRON_ORE, BLOCK.DIAMOND_ORE, BLOCK.REDSTONE_ORE,
  BLOCK.OBSIDIAN, BLOCK.GLASS, BLOCK.WOOL, BLOCK.NETHERRACK, BLOCK.GLOWSTONE,
  ITEM.COAL, ITEM.CHARCOAL, ITEM.IRON_INGOT, ITEM.COPPER_INGOT, ITEM.DIAMOND, ITEM.REDSTONE,
  ITEM.STICK, ITEM.FLINT, ITEM.LEATHER, ITEM.FEATHER,
  // инструменты (по возрастанию)
  ITEM.WOODEN_PICKAXE, ITEM.STONE_PICKAXE, ITEM.COPPER_PICKAXE, ITEM.IRON_PICKAXE, ITEM.DIAMOND_PICKAXE,
  ITEM.WOODEN_AXE, ITEM.STONE_AXE, ITEM.COPPER_AXE, ITEM.IRON_AXE, ITEM.DIAMOND_AXE,
  ITEM.WOODEN_SHOVEL, ITEM.STONE_SHOVEL, ITEM.COPPER_SHOVEL, ITEM.IRON_SHOVEL, ITEM.DIAMOND_SHOVEL,
  ITEM.WOODEN_SWORD, ITEM.STONE_SWORD, ITEM.COPPER_SWORD, ITEM.IRON_SWORD, ITEM.DIAMOND_SWORD,
  ITEM.SHEARS, ITEM.FLINT_AND_STEEL, ITEM.BUCKET, ITEM.WATER_BUCKET, ITEM.LAVA_BUCKET, ITEM.BOAT,
  // броня
  ITEM.LEATHER_HELMET, ITEM.LEATHER_CHESTPLATE, ITEM.LEATHER_LEGGINGS, ITEM.LEATHER_BOOTS,
  ITEM.COPPER_HELMET, ITEM.COPPER_CHESTPLATE, ITEM.COPPER_LEGGINGS, ITEM.COPPER_BOOTS,
  ITEM.IRON_HELMET, ITEM.IRON_CHESTPLATE, ITEM.IRON_LEGGINGS, ITEM.IRON_BOOTS,
  ITEM.DIAMOND_HELMET, ITEM.DIAMOND_CHESTPLATE, ITEM.DIAMOND_LEGGINGS, ITEM.DIAMOND_BOOTS,
  // функциональные блоки
  BLOCK.CRAFTING_TABLE, BLOCK.FURNACE, BLOCK.CHEST, ITEM.DOOR, BLOCK.TORCH, BLOCK.BED_FOOT,
  // редстоун + механизмы
  BLOCK.REDSTONE_TORCH, BLOCK.LEVER, BLOCK.BUTTON, BLOCK.PISTON, BLOCK.COMMAND_BLOCK,
  // еда
  ITEM.PORK_RAW, ITEM.PORK_COOKED, ITEM.BEEF_RAW, ITEM.BEEF_COOKED,
  ITEM.CHICKEN_RAW, ITEM.CHICKEN_COOKED, ITEM.MUTTON_RAW, ITEM.MUTTON_COOKED,
  ITEM.FISH_RAW, ITEM.FISH_COOKED, ITEM.ROTTEN_FLESH,
];
let creativeSearchQuery = '';

function renderCreativeInv() {
  const wrap = document.createElement('div');
  wrap.className = 'creative-wrap';

  // поиск по названию (как вкладка поиска в креативе MC)
  const search = document.createElement('input');
  search.type = 'text';
  search.className = 'creative-search';
  search.placeholder = 'Поиск (например: алмаз, кирка, дверь)…';
  search.value = creativeSearchQuery;
  search.addEventListener('input', () => {
    creativeSearchQuery = search.value;
    renderInventory();
    // вернуть фокус в поле поиска после перерисовки
    const el = invGrid.querySelector('.creative-search');
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  });
  // не даём E/Esc в поле поиска закрывать инвентарь (это просто ввод)
  search.addEventListener('keydown', (e) => { e.stopPropagation(); });
  wrap.appendChild(search);

  const q = creativeSearchQuery.trim().toLowerCase();
  const items = CREATIVE_ITEMS.filter(id => {
    const nm = (BLOCK_NAMES[id] || '').toLowerCase();
    return !q || nm.includes(q);
  });

  const grid = document.createElement('div');
  grid.className = 'creative-grid';
  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'creative-note';
    empty.style.gridColumn = '1 / -1';
    empty.textContent = 'Ничего не найдено: ' + creativeSearchQuery;
    grid.appendChild(empty);
  }
  for (const id of items) {
    const cell = document.createElement('div');
    cell.className = 'creative-cell';
    cell.appendChild(iconCanvas(id, 34));
    const nm = BLOCK_NAMES[id] || '';
    cell.title = nm + (isBlock(id) || id === ITEM.DOOR || id === ITEM.REDSTONE ? ' (блок)' : '');
    // ЛКМ — взять полный стак на курсор; ПКМ — одну штуку (как в MC)
    cell.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const stackSize = (e.button === 2) ? 1 : Math.min(maxStack(id), isBlock(id) ? 64 : maxStack(id));
      const stack = { id, count: stackSize };
      if (hasDurability(id)) { stack.dur = MAX_DURABILITY[id]; stack.count = 1; }
      // клик с предметом на курсоре по сетке креатива = заменить (как «выбросить» в MC)
      cursorItem = stack;
      renderCursor();
      playSound('pop');
    });
    cell.addEventListener('contextmenu', e => e.preventDefault());
    grid.appendChild(cell);
  }
  wrap.appendChild(grid);

  const note = document.createElement('div');
  note.className = 'creative-note';
  note.textContent = 'ЛКМ — стак на курсор · ПКМ — одна штука · положить — кликом по слотам ниже · командный блок — только здесь и /give';
  wrap.appendChild(note);

  invGrid.appendChild(wrap);
}

// вкладки переключения Инвентарь/Креатив/Справочник
function makeTabs() {
  const tabs = document.createElement('div');
  tabs.className = 'inv-tabs';
  const setMode = (mode, title) => {
    if (craftMode === mode) return;
    if (craftMode !== 'furnace' && craftMode !== 'chest') clearCraftToInventory();
    craftMode = mode;
    document.getElementById('invTitle').textContent = title;
    updateCraftResult();
    renderInventory();
  };
  // в креативе первой — вкладка «Креатив»
  if (window.__creative) {
    const t0 = document.createElement('div');
    t0.className = 'inv-tab' + (craftMode === 'creative' ? ' active' : '');
    t0.textContent = 'Креатив';
    t0.addEventListener('click', () => setMode('creative', 'Креатив'));
    tabs.appendChild(t0);
  }
  const t1 = document.createElement('div');
  t1.className = 'inv-tab' + (craftMode !== 'guide' && craftMode !== 'creative' ? ' active' : '');
  t1.textContent = 'Инвентарь';
  t1.addEventListener('click', () => setMode('2x2', 'Инвентарь'));
  const t2 = document.createElement('div');
  t2.className = 'inv-tab' + (craftMode === 'guide' ? ' active' : '');
  t2.textContent = 'Справочник (J)';
  t2.addEventListener('click', () => setMode('guide', 'Справочник'));
  tabs.appendChild(t1); tabs.appendChild(t2);
  return tabs;
}

function renderInventory() {
  // строим всю панель заново (заголовок задан в HTML)
  invGrid.innerHTML = '';

  // вкладки показываем в обычном инвентаре, креативе и справочнике
  if (craftMode === '2x2' || craftMode === 'guide' || craftMode === 'creative') {
    invGrid.appendChild(makeTabs());
  }

  if (craftMode === 'guide') {
    renderGuide();
    return; // справочник занимает всю панель
  }
  if (craftMode === 'creative') {
    renderCreativeInv();
    return; // креатив-инвентарь занимает всю панель (слоты ниже — обычные)
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
    lbl.textContent = 'Печь: песок→стекло, руда→слиток, мясо→жареное · Топливо: уголь (8), доски, дерево, палки, верстак, ведро лавы (100)';
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
    // по умолчанию в креативе открывается креатив-инвентарь (parity MC)
    craftMode = mode || (window.__creative ? 'creative' : '2x2');
    invPanel.classList.add('open');
    const title = craftMode === '3x3' ? 'Верстак' : (craftMode === 'furnace' ? 'Печь' : (craftMode === 'chest' ? 'Сундук' : (craftMode === 'guide' ? 'Справочник' : (craftMode === 'creative' ? 'Креатив' : 'Инвентарь'))));
    document.getElementById('invTitle').textContent = title;
    document.exitPointerLock();
    updateCraftResult();
    renderInventory();
  } else {
    // вернуть предметы из крафта только в режимах с сеткой крафта
    if (craftMode !== 'furnace' && craftMode !== 'chest' && craftMode !== 'creative' && craftMode !== 'guide') clearCraftToInventory();
    if (cursorItem) {
      // фикс: при полном инвентаре предмет с курсора выпадает под ноги, а не исчезает
      if (!addToInventory(cursorItem.id, cursorItem.count, cursorItem.dur)) tossDropForward(cursorItem.id);
      cursorItem = null;
    }
    openFurnacePos = null;
    openChestPos = null;
    _furnaceUISig = '';
    craftMode = '2x2';
    invPanel.classList.remove('open');
    refreshUI();
    if (overlay.classList.contains('hidden') && !chatOpen) canvas.requestPointerLock();
  }
  if (typeof updateChatMiniVisibility === 'function') updateChatMiniVisibility();
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
    case BLOCK.STONE:   return { freq: 380, dur: 0.12, type: 'lowpass' };        // звонкий камень
    case BLOCK.BEDROCK: return { freq: 300, dur: 0.14, type: 'lowpass' };
    case BLOCK.DEEPSLATE: return { freq: 320, dur: 0.16, type: 'lowpass' };       // глухой глубинный
    case BLOCK.COBBLESTONE: return { freq: 360, dur: 0.13, type: 'lowpass' };
    case BLOCK.DIRT:    return { freq: 700, dur: 0.10, type: 'lowpass' };         // глухая земля
    case BLOCK.GRASS:   return { freq: 1200, dur: 0.10, type: 'lowpass' };        // мягкая трава
    // песок: мягкое сыпучее «шшш» — высокочастотный шум через highpass
    case BLOCK.SAND:    return { freq: 2600, dur: 0.16, type: 'highpass', sand: true };
    case BLOCK.GRAVEL:  return { freq: 1500, dur: 0.14, type: 'bandpass' };       // хруст гравия
    case BLOCK.WOOD:    return { freq: 520, dur: 0.13, type: 'lowpass' };         // глухое дерево
    case BLOCK.PLANKS:  return { freq: 600, dur: 0.12, type: 'lowpass' };
    case BLOCK.CRAFTING_TABLE: return { freq: 560, dur: 0.12, type: 'lowpass' };
    case BLOCK.LEAVES:  return { freq: 3000, dur: 0.12, type: 'highpass' };       // шуршание листвы
    case BLOCK.GLASS:   return { freq: 2200, dur: 0.10, type: 'highpass' };       // звон стекла
    case BLOCK.WOOL:    return { freq: 900, dur: 0.08, type: 'lowpass' };         // мягкая шерсть
    case BLOCK.WATER:   return { freq: 800, dur: 0.14, type: 'lowpass' };         // всплеск воды
    case BLOCK.NETHERRACK: return { freq: 420, dur: 0.12, type: 'lowpass' };
    case BLOCK.REDSTONE_ORE: return { freq: 380, dur: 0.12, type: 'lowpass' };
    case BLOCK.REDSTONE_DUST: return { freq: 2800, dur: 0.06, type: 'highpass' };
    case BLOCK.COMMAND_BLOCK: return { freq: 320, dur: 0.15, type: 'lowpass' };  // глухой «системный» блок
    case BLOCK.IRON_ORE:
    case BLOCK.COPPER_ORE:
    case BLOCK.COAL_ORE:
    case BLOCK.DIAMOND_ORE: return { freq: 360, dur: 0.13, type: 'lowpass' };
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
  } else if (kind === 'zombie') {
    zombieGroan(false);
  } else if (kind === 'zombie_hurt') {
    zombieGroan(true);
  } else if (kind === 'hurt') {
    playerHurt();
  } else if (kind === 'burp') {
    playerBurp();
  } else if (kind === 'click') {
    // щелчок рычага/кнопки — короткий деревянный «клак»
    tone(420, 0.05, 0.25, 'square');
    setTimeout(() => tone(280, 0.06, 0.2, 'square'), 30);
  } else if (kind === 'shear') {
    // стрижка — шуршащий «вжик»
    noiseBurst(0.22, 3200, 0.28, 'highpass');
  } else if (kind === 'cave') {
    // жуткий пещерный эмбиент — выбираем случайный вариант из набора
    playCaveAmbient();
  } else if (kind === 'piston') {
    // поршень — механический «вжик» с лёгким стуком
    tone(180, 0.08, 0.3, 'square');
    noiseBurst(0.12, 1200, 0.2, 'lowpass');
    setTimeout(() => tone(140, 0.06, 0.18, 'square'), 70);
  }
}

// пещерный эмбиент: случайные жуткие звуки под землём при низком освещении
// пещерный эмбиент: набор из 4 вариантов жутких звуков (выбирается случайно)
function playCaveAmbient() {
  if (!AudioEngine.ctx) return;
  const variant = Math.floor(Math.random() * 4);
  if (variant === 0) {
    // низкий гул + далёкий звон (классика)
    playCaveDrone(70, 0.12, 3.0, true);
  } else if (variant === 1) {
    // ветреный вой — отфильтрованный шум
    playCaveWind();
  } else if (variant === 2) {
    // капли воды — редкие высокие «плонки»
    playCaveDrips();
  } else {
    // далёкий рёв — низкий медленный разворот
    playCaveDrone(55, 0.18, 4.0, false);
  }
}

// базовый пещерный гул
function playCaveDrone(baseFreq, gainVal, dur, withOvertone) {
  const ctx = AudioEngine.ctx;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator(); osc.type = 'sine';
  osc.frequency.setValueAtTime(baseFreq + Math.random()*20, t0);
  osc.frequency.linearRampToValueAtTime(baseFreq * 0.8, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gainVal, t0 + dur*0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 220;
  osc.connect(filt); filt.connect(g); g.connect(AudioEngine.sfxGain);
  osc.start(t0); osc.stop(t0 + dur + 0.2);
  if (withOvertone) {
    const osc2 = ctx.createOscillator(); osc2.type = 'sine';
    const f2 = 400 + Math.random()*400;
    osc2.frequency.setValueAtTime(f2, t0 + dur*0.4);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.0001, t0 + dur*0.4);
    g2.gain.exponentialRampToValueAtTime(0.05, t0 + dur*0.5);
    g2.gain.exponentialRampToValueAtTime(0.0001, t0 + dur*0.8);
    osc2.connect(g2); g2.connect(AudioEngine.sfxGain);
    osc2.start(t0 + dur*0.4); osc2.stop(t0 + dur);
  }
}

// ветреный вой в пещере
function playCaveWind() {
  const ctx = AudioEngine.ctx;
  const t0 = ctx.currentTime;
  const len = Math.floor(ctx.sampleRate * 2.5);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const env = Math.sin(i / len * Math.PI);
    data[i] = (Math.random()*2 - 1) * env * 0.5;
  }
  const src = ctx.createBufferSource(); src.buffer = buf;
  const filt = ctx.createBiquadFilter(); filt.type = 'bandpass'; filt.Q.value = 1.5;
  filt.frequency.setValueAtTime(400, t0);
  filt.frequency.linearRampToValueAtTime(900, t0 + 2.0);
  filt.frequency.linearRampToValueAtTime(500, t0 + 2.5);
  const g = ctx.createGain(); g.gain.value = 0.15;
  src.connect(filt); filt.connect(g); g.connect(AudioEngine.sfxGain);
  src.start(t0); src.stop(t0 + 2.5);
}

// капли воды
function playCaveDrips() {
  const ctx = AudioEngine.ctx;
  const t0 = ctx.currentTime;
  const drop = (start, freq) => {
    const osc = ctx.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0 + start);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t0 + start + 0.15);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0 + start);
    g.gain.exponentialRampToValueAtTime(0.18, t0 + start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + start + 0.2);
    osc.connect(g); g.connect(AudioEngine.sfxGain);
    osc.start(t0 + start); osc.stop(t0 + start + 0.25);
  };
  drop(0.0, 1200);
  drop(0.7, 900);
  drop(1.5, 1400);
  drop(2.1, 800);
}

// стон зомби — низкий «раскисший» рык с вибрато (hurt — короткий вскрик-рык)
function zombieGroan(hurt) {
  if (!AudioEngine.ctx) return;
  const ctx = AudioEngine.ctx;
  const t0 = ctx.currentTime;
  const dur = hurt ? 0.28 : 0.85;
  const base = (hurt ? 150 : 95) + Math.random() * 30;
  const osc = ctx.createOscillator(); osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(base, t0);
  // нисходящий стон с лёгким вибрато
  osc.frequency.linearRampToValueAtTime(base * 0.7, t0 + dur);
  const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = hurt ? 9 : 5;
  const lfoG = ctx.createGain(); lfoG.gain.value = base * 0.08;
  lfo.connect(lfoG); lfoG.connect(osc.frequency);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(hurt ? 0.3 : 0.2, t0 + dur * 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  // «гнилой» тембр — срезаем верха
  const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 480; filt.Q.value = 2;
  osc.connect(filt); filt.connect(g); g.connect(AudioEngine.sfxGain);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
  lfo.start(t0); lfo.stop(t0 + dur + 0.05);
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
// Пул-переменные для raycast (getTargetBlock вызывается каждый кадр)
const _tmpRayDir = new THREE.Vector3();
const _tmpRayOrigin = new THREE.Vector3();

function getTargetBlock(maxDist = 6, includeLiquid = false) {
  const dir = _tmpRayDir.set(
    -Math.sin(PLAYER.yaw) * Math.cos(PLAYER.pitch),
    Math.sin(PLAYER.pitch),
    -Math.cos(PLAYER.yaw) * Math.cos(PLAYER.pitch)
  ).normalize();

  const eyeY = PLAYER.pos.y + (PLAYER.crouching ? PLAYER.crouchEye : PLAYER.eye);
  const origin = _tmpRayOrigin.set(PLAYER.pos.x, eyeY, PLAYER.pos.z);

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

// Блоки с нестандартной/плоской геометрией — их дроп рендерим как 2D-спрайт (плоскость),
// а не как 3D-куб (как в Minecraft: факел, редстоуновая пыль/факел, рычаг, кнопка лежат плоско).
function isFlatDropBlock(id) {
  return id === BLOCK.TORCH || id === BLOCK.REDSTONE_TORCH ||
         id === BLOCK.REDSTONE_DUST || id === BLOCK.LEVER ||
         id === BLOCK.BUTTON || id === BLOCK.FIRE ||
         id === BLOCK.NETHER_PORTAL;
}

// создать меш дропа для предмета/блока
function makeDropMesh(id) {
  if (isBlock(id) && MATERIALS[id] && !isFlatDropBlock(id)) {
    return new THREE.Mesh(whiteColors(new THREE.BoxGeometry(0.28, 0.28, 0.28)), MATERIALS[id]);
  }
  // плоский 2D-спрайт (для предметов и «тонких» блоков)
  return new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), itemDropMaterial(id));
}

// добавить белые цвета вершин (для геометрий, использующих vertexColors-материалы блоков)
function whiteColors(geo) {
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3).fill(1);
  geo.setAttribute('color', new THREE.Float32BufferAttribute(arr, 3));
  return geo;
}

function spawnDrop(id, x, y, z, count) {
  const n = count || 1;
  const mesh = makeDropMesh(id);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  drops.push({
    mesh, id, count: n,
    pos: new THREE.Vector3(x, y, z),
    vel: new THREE.Vector3((Math.random()-0.5)*2, 3, (Math.random()-0.5)*2),
    age: 0, picked: false, pickDelay: 0.5,
  });
}

// Выбросить предмет вперёд от игрока (с задержкой подбора, чтобы не подобрать сразу).
// Стак выбрасывается ОДНОЙ сущностью (фикс: раньше 64 предмета = 64 меша).
function tossDropForward(id, count) {
  const n = count || 1;
  const ex = PLAYER.pos.x, ey = PLAYER.pos.y + (PLAYER.crouching?PLAYER.crouchEye:PLAYER.eye) - 0.2, ez = PLAYER.pos.z;
  const dir = new THREE.Vector3(
    -Math.sin(PLAYER.yaw) * Math.cos(PLAYER.pitch),
    Math.sin(PLAYER.pitch),
    -Math.cos(PLAYER.yaw) * Math.cos(PLAYER.pitch)
  ).normalize();
  const mesh = makeDropMesh(id);
  const sx = ex + dir.x*0.6, sy = ey + dir.y*0.6, sz = ez + dir.z*0.6;
  mesh.position.set(sx, sy, sz);
  scene.add(mesh);
  drops.push({
    mesh, id, count: n,
    pos: new THREE.Vector3(sx, sy, sz),
    vel: new THREE.Vector3(dir.x*6, dir.y*6 + 2.5, dir.z*6),
    age: 0, picked: false, pickDelay: 1.6,  // подбор только спустя 1.6с
  });
}

// Выбросить: из активного слота (1 шт или весь стак), либо предмет с курсора (в инвентаре)
function dropFromHand(all) {
  if (invOpen && cursorItem) {
    // в инвентаре с курсора: выкинуть весь курсор (или 1 при !all)
    const n = all ? cursorItem.count : 1;
    const isLast = (cursorItem.count - n) <= 0;
    tossDropForward(cursorItem.id, n);
    if (isLast && cursorItem.dur !== undefined) { /* последняя единица уносит прочность */ }
    cursorItem.count -= n;
    if (cursorItem.count <= 0) cursorItem = null;
    renderCursor(); refreshUI();
    return;
  }
  const slot = activeItem();
  if (!slot) return;
  const n = all ? slot.count : 1;
  tossDropForward(slot.id, n);
  slot.count -= n;
  if (slot.count <= 0) slots[activeSlot] = null;
  refreshUI();
}

const DROP_LIFETIME = 300; // 5 минут — как в Minecraft
// простая проверка прямой видимости (нет сплошных блоков между дропом и игроком)
function dropHasLOS(d) {
  const sx = d.pos.x, sy = d.pos.y + 0.1, sz = d.pos.z;
  const tx = PLAYER.pos.x, ty = PLAYER.pos.y + 0.9, tz = PLAYER.pos.z;
  const steps = 4;
  for (let s = 1; s < steps; s++) {
    const t = s / steps;
    const bx = Math.floor(sx + (tx - sx) * t), by = Math.floor(sy + (ty - sy) * t), bz = Math.floor(sz + (tz - sz) * t);
    const b = World.getBlock(bx, by, bz);
    if (b !== BLOCK.AIR && !isLiquid(b) && !isTransparent(b)) return false;
  }
  return true;
}
function updateDrops(dt) {
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.age += dt;
    // деспавн через 5 минут (фикс: раньше дропы копились вечно)
    if (d.age > DROP_LIFETIME) {
      scene.remove(d.mesh); d.mesh.geometry.dispose();
      drops.splice(i, 1); continue;
    }
    // гравитация (в воде дропы медленно всплывают)
    const inWater = isWaterLiquid(World.getBlock(Math.floor(d.pos.x), Math.floor(d.pos.y), Math.floor(d.pos.z)));
    if (inWater) {
      d.vel.y += (1.2 - d.vel.y) * Math.min(1, dt * 4); // плавучесть
      d.vel.x *= 0.9; d.vel.z *= 0.9;
    } else {
      d.vel.y -= GRAVITY * dt;
    }
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
    // плоские дропы (факел и т.д.) — билборд к камере; 3D-кубы — вращаются
    if (isFlatDropBlock(d.id) || !isBlock(d.id)) {
      d.mesh.lookAt(camera.position.x, d.mesh.position.y, camera.position.z);
    } else {
      d.mesh.rotation.y += dt * 1.5;
    }

    // предметы СГОРАЮТ в лаве/огне
    const inBlk = World.getBlock(Math.floor(d.pos.x), Math.floor(d.pos.y + 0.1), Math.floor(d.pos.z));
    if (isLavaLiquid(inBlk) || inBlk === BLOCK.FIRE) {
      playSound('break', BLOCK.FIRE);
      scene.remove(d.mesh);
      if (d.mesh.geometry) d.mesh.geometry.dispose();
      drops.splice(i, 1);
      continue;
    }

    // подбор
    if (d.age > d.pickDelay && !PLAYER.dead) {
      const dx = d.pos.x - PLAYER.pos.x;
      const dy = d.pos.y - (PLAYER.pos.y + 0.9);
      const dz = d.pos.z - PLAYER.pos.z;
      const distSq = dx*dx + dy*dy + dz*dz;
      // мягкое притяжение в радиусе ~2 блоков, но НЕ сквозь стены (LOS)
      if (distSq < 2.0 * 2.0 && dropHasLOS(d)) {
        d.pos.x -= dx * dt * 3;
        d.pos.y -= dy * dt * 3;
        d.pos.z -= dz * dt * 3;
      }
      if (distSq < 0.8 * 0.8) {
        // при полном инвентаре дроп НЕ исчезает — попробует подобраться позже (фикс потери)
        if (addToInventory(d.id, 1)) {
          playSound('pickup');
          scene.remove(d.mesh);
          d.mesh.geometry.dispose();
          drops.splice(i, 1);
        } else {
          d.pickDelay = d.age + 1.0; // повторная попытка через секунду
        }
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

  const geo = whiteColors(new THREE.BoxGeometry(0.98, 0.98, 0.98));
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
      // если место занято не-водой (например, факел или другой блок в зазоре) —
      // песок не затирает его, а выпадает предметом (как falling block в MC)
      const cur = World.getBlock(s.x, placeY, s.z);
      if (cur === BLOCK.AIR || isLiquid(cur)) World.setBlock(s.x, placeY, s.z, s.id, true);
      else spawnDrop(s.id, s.x + 0.5, placeY + 0.5, s.z + 0.5);
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
  _boatMat = mobTex(makeTex(ctx => {
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
      scene.remove(b.mesh); disposeGroup(b.mesh); boats.splice(i, 1);
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
    // FPS-независимое трение (раньше зависело от частоты кадров)
    const fr = Math.pow(0.92, dt * 60);
    b.vel.x *= fr; b.vel.z *= fr;
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
      b.vel.y *= Math.pow(0.8, dt * 60);
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
      scene.remove(b.mesh); disposeGroup(b.mesh); boats.splice(i, 1);
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
// материал для мобов — БЕЗ vertexColors (у box-геометрии нет цветов вершин)
function mobTex(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  return new THREE.MeshLambertMaterial({ map: t });
}
function buildMobMaterials() {
  // --- Свинья ---
  MOB_MAT.pig_body = mobTex(makeTex(ctx => {
    noiseFill(ctx, 0xeaa0a8, 8);
    ctx.fillStyle = '#d98a93';
    for (let i=0;i<6;i++) ctx.fillRect((Math.random()*14)|0,(Math.random()*14)|0,2,2);
  }));
  MOB_MAT.pig_snout = mobTex(makeTex(ctx => {
    noiseFill(ctx, 0xd07f88, 6);
    ctx.fillStyle = '#9c5a62'; ctx.fillRect(4,6,3,4); ctx.fillRect(9,6,3,4); // ноздри
  }));
  // --- Корова ---
  MOB_MAT.cow_body = mobTex(makeTex(ctx => {
    noiseFill(ctx, 0x4a3526, 6);             // тёмно-коричневая основа
    ctx.fillStyle = '#e8e2d8';               // белые пятна
    ctx.fillRect(2,3,5,5); ctx.fillRect(9,8,5,5); ctx.fillRect(7,2,3,3);
    ctx.fillStyle = '#3a2a1c';
    ctx.fillRect(11,4,3,3); ctx.fillRect(3,10,3,3);
  }));
  MOB_MAT.cow_head = mobTex(makeTex(ctx => {
    noiseFill(ctx, 0x4a3526, 6);
    ctx.fillStyle = '#e8e2d8'; ctx.fillRect(5,4,6,5); // белая морда
  }));
  MOB_MAT.cow_snout = mobTex(makeTex(ctx => {
    noiseFill(ctx, 0xb98a8a, 6);
    ctx.fillStyle = '#7a5050'; ctx.fillRect(4,7,3,3); ctx.fillRect(9,7,3,3);
  }));
  MOB_MAT.horn = mobTex(makeTex(ctx => noiseFill(ctx, 0xe8e2cf, 6)));
  // --- Курица ---
  MOB_MAT.chicken_body = mobTex(makeTex(ctx => {
    noiseFill(ctx, 0xf2f2f2, 6);             // белые перья
    ctx.fillStyle = '#dcdcdc';
    for (let i=0;i<5;i++) ctx.fillRect((Math.random()*14)|0,(Math.random()*14)|0,2,1);
  }));
  MOB_MAT.chicken_beak = mobTex(makeTex(ctx => noiseFill(ctx, 0xe8a83a, 4))); // оранжевый клюв/лапы
  MOB_MAT.chicken_comb = mobTex(makeTex(ctx => noiseFill(ctx, 0xc83a2a, 4))); // красный гребень
  // --- Зомбифицированный пиглин ---
  MOB_MAT.piglin_skin = mobTex(makeTex(ctx => {        // зеленовато-розовая зомби-кожа
    noiseFill(ctx, 0x6a8a5a, 8);
    ctx.fillStyle = '#7a5a6a'; for (let i=0;i<6;i++) ctx.fillRect((Math.random()*14)|0,(Math.random()*14)|0,2,2);
  }));
  MOB_MAT.piglin_snout = mobTex(makeTex(ctx => {       // характерный нос-пятак
    noiseFill(ctx, 0xc88a98, 6);
    ctx.fillStyle = '#7a4a58'; ctx.fillRect(4,7,3,3); ctx.fillRect(9,7,3,3);
  }));
  MOB_MAT.piglin_cloth = mobTex(makeTex(ctx => noiseFill(ctx, 0x8a6a2a, 6))); // золотистая одежда/штаны
  // --- Овца ---
  MOB_MAT.sheep_wool = mobTex(makeTex(ctx => {               // пушистая шерсть
    pixelFill(ctx, ['#e9e9ec','#dedee2','#f2f2f4','#d2d2d6'], [5,4,3,2], 3333);
    ctx.fillStyle = '#c8c8cd';
    for (let i=0;i<6;i++) ctx.fillRect((Math.random()*14)|0,(Math.random()*14)|0,2,1);
  }));
  MOB_MAT.sheep_skin = mobTex(makeTex(ctx => {               // голая кожа (морда/ноги)
    noiseFill(ctx, 0xd8c2b0, 6);
    ctx.fillStyle = '#c0a890'; ctx.fillRect(4,7,3,3); ctx.fillRect(9,7,3,3);
  }));
  // --- Рыба ---
  MOB_MAT.fish_body = mobTex(makeTex(ctx => {
    noiseFill(ctx, 0x6a93a8, 6);
    ctx.fillStyle = '#9bbccf'; ctx.fillRect(0,6,16,4);     // светлое брюшко-полоса
    ctx.fillStyle = '#4f7286'; for (let i=0;i<5;i++) ctx.fillRect((Math.random()*14)|0,(Math.random()*6)|0,2,1);
  }));
  // --- Зомби ---
  MOB_MAT.zombie_skin = mobTex(makeTex(ctx => {            // гниловато-зелёная кожа
    noiseFill(ctx, 0x5a8a4a, 9);
    ctx.fillStyle = '#446a38'; for (let i=0;i<7;i++) ctx.fillRect((Math.random()*14)|0,(Math.random()*14)|0,2,2);
    ctx.fillStyle = '#6fa05c'; ctx.fillRect(2,2,3,2); ctx.fillRect(10,9,3,2);
  }));
  MOB_MAT.zombie_cloth = mobTex(makeTex(ctx => {           // ветхая синяя роба (рубаха+штаны как в MC)
    noiseFill(ctx, 0x3a5a8a, 7);
    ctx.fillStyle = '#2c4468'; for (let i=0;i<5;i++) ctx.fillRect((Math.random()*14)|0,(Math.random()*14)|0,2,2);
    ctx.fillStyle = '#486aa0'; ctx.fillRect(3,3,4,3); ctx.fillRect(9,10,4,3);
  }));
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
  sheep: {
    spawnOn: BLOCK.GRASS, drop: ITEM.MUTTON_RAW, dropCount: () => 1 + (Math.random()*2|0),
    idleSound: 'moo', hurtSound: 'moo_hurt',  // используем мычание (мягкое) как блеяние
    woolDrop: true,                            // даёт шерсть (при стрижке/смерти)
    build() {
      const g = new THREE.Group();
      const box = (w,h,d,mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat||MOB_MAT.sheep_wool); if (SHADOWS_ON) m.castShadow=true; return m; };
      // пушистое тело (шерсть)
      const body = box(0.95, 0.85, 1.35); body.position.set(0, 0.72, 0); g.add(body); g.userData.wool = body;
      // голова — голая кожа
      const head = new THREE.Group();
      head.add(box(0.5, 0.5, 0.5, MOB_MAT.sheep_skin));
      const eL = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,0.02), EYE_MAT()); eL.position.set(-0.14,0.06,0.24); head.add(eL);
      const eR = eL.clone(); eR.position.x = 0.14; head.add(eR);
      head.position.set(0, 0.82, 0.82); g.add(head); g.userData.head = head;
      const legs = []; const lp = [[-0.28,0.45],[0.28,0.45],[-0.28,-0.45],[0.28,-0.45]];
      for (const [lx,lz] of lp) { const leg = box(0.24,0.5,0.24, MOB_MAT.sheep_skin); leg.geometry.translate(0,-0.25,0); leg.position.set(lx,0.5,lz); g.add(leg); legs.push(leg); }
      g.userData.legs = legs;
      return g;
    },
    width: 0.95, height: 1.05, hp: 8,
  },
  piglin: {
    spawnOn: BLOCK.NETHERRACK, drop: ITEM.PORK_RAW, dropCount: () => 1 + (Math.random()*2|0),
    idleSound: 'oink', hurtSound: 'oink_hurt',
    hostile: true,      // может атаковать игрока (после агра)
    pack: true,         // вся стая агрится при ударе по одному
    name: 'зомби-пиглин',
    dmg: 3,
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
  fish: {
    spawnOn: BLOCK.WATER, drop: ITEM.FISH_RAW, dropCount: () => 1 + (Math.random()*1|0),
    idleSound: 'splash', hurtSound: 'splash',
    aquatic: true,                              // живёт в воде, всплытие не нужно
    build() {
      const g = new THREE.Group();
      const box = (w,h,d,mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat||MOB_MAT.fish_body); if (SHADOWS_ON) m.castShadow=true; return m; };
      const body = box(0.55, 0.32, 0.22); body.position.set(0, 0.2, 0); g.add(body);
      const tail = box(0.18, 0.26, 0.05); tail.position.set(0, 0.2, -0.34); g.add(tail);
      g.userData.tail = tail;
      const eL = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.05,0.02), EYE_MAT()); eL.position.set(-0.1,0.24,0.22); g.add(eL);
      const eR = eL.clone(); eR.position.x = 0.1; g.add(eR);
      g.userData.legs = [];
      return g;
    },
    width: 0.5, height: 0.4, hp: 3,
  },
  zombie: {
    drop: ITEM.ROTTEN_FLESH, dropCount: () => (Math.random()*3|0), // 0-2 гнилой плоти (как в MC)
    idleSound: 'zombie', hurtSound: 'zombie_hurt',
    hostile: true,        // враждебен: преследует и атакует игрока
    burnsInSun: true,     // горит на солнце (MC-парити)
    name: 'зомби',        // имя для сообщения о смерти
    dmg: 3,               // урон по игроку (ваниль normal)
    chaseSpeed: 2.7,      // медленнее игрока — можно убежать (MC-парити)
    build() {
      const g = new THREE.Group();
      const box = (w,h,d,mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat||MOB_MAT.zombie_skin); if (SHADOWS_ON) m.castShadow=true; return m; };
      // ноги (в синих штанах)
      const legs = []; const lp = [[-0.13,0],[0.13,0]];
      for (const [lx,lz] of lp) { const leg = box(0.24,0.75,0.24, MOB_MAT.zombie_cloth); leg.geometry.translate(0,-0.375,0); leg.position.set(lx,0.75,lz); g.add(leg); legs.push(leg); }
      g.userData.legs = legs;
      // тело (синяя рубаха)
      const body = box(0.55, 0.7, 0.3, MOB_MAT.zombie_cloth); body.position.set(0, 1.1, 0); g.add(body);
      // РУКИ ВПЕРЁД — классическая поза зомби (не качаются с ногами)
      const arms = [];
      for (const side of [-1, 1]) {
        const arm = box(0.2,0.65,0.2); arm.geometry.translate(0,-0.325,0);
        arm.position.set(side*0.38, 1.38, 0.1);
        arm.rotation.x = -Math.PI/2;          // вытянуты вперёд
        g.add(arm); arms.push(arm);
      }
      g.userData.arms = arms;
      // голова (зелёная, пустые чёрные глаза)
      const head = new THREE.Group();
      head.add(box(0.5,0.5,0.5));
      const eL = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.08,0.02), EYE_MAT()); eL.position.set(-0.13,0.05,0.26); head.add(eL);
      const eR = eL.clone(); eR.position.x = 0.13; head.add(eR);
      head.position.set(0, 1.7, 0); g.add(head); g.userData.head = head;
      return g;
    },
    width: 0.6, height: 1.9, hp: 20,
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
    sheared: false,     // острижена ли овца (нет шерсти)
    landTimer: 0,       // для рыбы — таймер удушья на суше
  });
}

// спавн мобов рядом с игроком на траве
let mobSpawnTimer = 4;
const MAX_ZOMBIES = 2; // зомби куда меньше, чем в MC (там их десятки за ночь)
function zombieCount() { let n = 0; for (const m of mobs) if (m.type === 'zombie') n++; return n; }
// мирные животные/пиглины — без зомби (у нежити СВОЙ кап, как в MC)
function passiveCount() { return mobs.length - zombieCount(); }
function trySpawnMobs(dt) {
  mobSpawnTimer -= dt;
  if (mobSpawnTimer > 0) return;
  mobSpawnTimer = 10 + Math.random()*10;

  // --- Зомби: только ночью в обычном мире, РЕДКО (гораздо меньше, чем в MC) ---
  // Попытка — примерно раз в минуту ночи; кап отдельный (MAX_ZOMBIES), общий
  // лимит животных зомби не занимает (в MC у монстров свой счётчик спавна).
  if (World.dim === 'overworld' && daylight() < 0.25 && zombieCount() < MAX_ZOMBIES && Math.random() < 0.22) {
    for (let tries = 0; tries < 10; tries++) {
      const ang = Math.random()*Math.PI*2;
      const dist = 16 + Math.random()*10; // не вплотную к игроку
      const px = Math.floor(PLAYER.pos.x + Math.cos(ang)*dist);
      const pz = Math.floor(PLAYER.pos.z + Math.sin(ang)*dist);
      // ищем верхнюю поверхность колонки (сверху вниз): твёрдая опора + 3 воздуха над ней
      for (let y = WORLD_HEIGHT-3; y > 1; y--) {
        const h1 = World.getBlock(px, y, pz);
        if (h1 === BLOCK.AIR) {
          const below = World.getBlock(px, y-1, pz);
          if (below !== BLOCK.AIR && below !== BLOCK.LEAVES && !isLiquid(below) &&
              h1 === BLOCK.AIR && World.getBlock(px, y+1, pz) === BLOCK.AIR && World.getBlock(px, y+2, pz) === BLOCK.AIR) {
            spawnMob('zombie', px + 0.5, y, pz + 0.5);
            return;
          }
        }
      }
    }
    return; // эта попытка ушла на зомби (даже если не вышло — животных в этот тик не спавним)
  }

  // в Аду спавнятся зомбифицированные пиглины, в обычном мире — мирные животные
  let type;
  if (World.dim === 'nether') {
    if (passiveCount() >= MAX_MOBS) return; // пиглины — под тем же капом, что животные
    type = 'piglin';
  } else {
    // кап животных/пиглинов (зомби не считаем — у них свой лимит)
    if (passiveCount() >= MAX_MOBS) return;
    const r = Math.random();
    // pig / chicken / cow / sheep / fish
    if (r < 0.28) type = 'pig';
    else if (r < 0.50) type = 'chicken';
    else if (r < 0.70) type = 'cow';
    else if (r < 0.88) type = 'sheep';
    else type = 'fish';
  }
  for (let tries = 0; tries < 8; tries++) {
    const ang = Math.random()*Math.PI*2;
    const dist = 12 + Math.random()*12;
    const px = Math.floor(PLAYER.pos.x + Math.cos(ang)*dist);
    const pz = Math.floor(PLAYER.pos.z + Math.sin(ang)*dist);
    if (type === 'fish') {
      // рыба спавнится в толще воды (вода сверху и снизу)
      for (let y = WORLD_HEIGHT-2; y > 1; y--) {
        const here = World.getBlock(px, y, pz);
        const below = World.getBlock(px, y-1, pz);
        if (isWaterLiquid(here) && isWaterLiquid(below)) {
          spawnMob(type, px + 0.5, y + 0.2, pz + 0.5);
          return;
        }
      }
      continue;
    }
    for (let y = WORLD_HEIGHT-2; y > 1; y--) {
      const below = World.getBlock(px, y-1, pz);
      const here = World.getBlock(px, y, pz);
      const above = World.getBlock(px, y+1, pz);
      if (below === MOB_TYPES[type].spawnOn && here === BLOCK.AIR && above === BLOCK.AIR) {
        // пачка 1-3 особей (как в MC — животные спавнятся группами)
        const pack = 1 + (Math.random()*3|0);
        spawnMob(type, px + 0.5, y, pz + 0.5);
        for (let pk = 1; pk < pack && passiveCount() < MAX_MOBS; pk++) {
          const ox = px + ((Math.random()*5|0) - 2), oz = pz + ((Math.random()*5|0) - 2);
          const oh = World.getBlock(ox, y, oz), ob = World.getBlock(ox, y - 1, oz), oa = World.getBlock(ox, y + 1, oz);
          if (ob === MOB_TYPES[type].spawnOn && oh === BLOCK.AIR && oa === BLOCK.AIR) spawnMob(type, ox + 0.5, y, oz + 0.5);
        }
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
  if (b === BLOCK.TORCH) return false;
  // тонкие редстоун-компоненты — мобы проходят сквозь них (как в MC)
  if (b === BLOCK.REDSTONE_DUST || b === BLOCK.REDSTONE_TORCH ||
      b === BLOCK.LEVER || b === BLOCK.BUTTON || b === BLOCK.PISTON_HEAD) return false;
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
      scene.remove(p.mesh); disposeGroup(p.mesh); mobs.splice(i, 1); continue;
    }

    // --- ИИ ---
    p.hurtT = Math.max(0, p.hurtT - dt);
    p.hurtResist = Math.max(0, (p.hurtResist || 0) - dt);
    p.attackCd = Math.max(0, (p.attackCd || 0) - dt);
    p.idleT -= dt;
    if (p.idleT <= 0) { p.idleT = 6 + Math.random()*10; if (dist2ToPlayer(p) < 26*26) playSound(p.def.idleSound); }

    // --- Рыба: отдельная «плавательная» логика ---
    if (p.def.aquatic) {
      const cx2 = Math.floor(p.pos.x), cy2 = Math.floor(p.pos.y + 0.1), cz2 = Math.floor(p.pos.z);
      const inWaterF = isWaterLiquid(World.getBlock(cx2, cy2, cz2));
      if (!inWaterF) {
        // на суше задыхается и бьётся; через время гибнет
        p.landTimer = (p.landTimer || 0) + dt;
        p.vel.y -= GRAVITY * dt;
        p.vel.x *= 0.8; p.vel.z *= 0.8;
        p.walkPhase += dt * 18;
        if (p.landTimer > 6 || p.pos.y < -8) {
          for (let k = 0; k < p.def.dropCount(); k++) spawnDrop(p.def.drop, p.pos.x, p.pos.y+0.2, p.pos.z);
          scene.remove(p.mesh); disposeGroup(p.mesh); mobs.splice(i, 1); continue;
        }
      } else {
        p.landTimer = 0;
        // плавное блуждание под водой
        p.stateT -= dt;
        if (p.stateT <= 0) {
          p.yaw = Math.random()*Math.PI*2;
          p.pitchSwim = (Math.random()-0.5)*0.6;
          p.stateT = 1.5 + Math.random()*2.5;
        }
        if (p.flee > 0) { p.flee -= dt; const ax=p.pos.x-PLAYER.pos.x, az=p.pos.z-PLAYER.pos.z; p.yaw=Math.atan2(ax,az); }
        const sp = (p.flee > 0) ? 2.6 : 1.2;
        const dirx = Math.sin(p.yaw), dirz = Math.cos(p.yaw);
        p.vel.x = dirx * sp; p.vel.z = dirz * sp;
        // удерживать глубину: всплывать/нырять, не вылетая из воды
        const aboveWater = !isWaterLiquid(World.getBlock(cx2, cy2+1, cz2));
        let vy = (p.pitchSwim || 0) * sp;
        if (aboveWater && vy > 0) vy = -0.5; // у поверхности — нырнуть
        p.vel.y += (vy - p.vel.y) * Math.min(1, dt*6);
        p.walkPhase += dt * 10;
      }
      // коллизии и перемещение
      p.onGround = false;
      mobCollide(p, 'y', p.vel.y * dt);
      mobCollide(p, 'x', p.vel.x * dt);
      mobCollide(p, 'z', p.vel.z * dt);
      // анимация
      p.mesh.position.copy(p.pos);
      let dyf = p.yaw - p.mesh.rotation.y;
      while (dyf > Math.PI) dyf -= Math.PI*2; while (dyf < -Math.PI) dyf += Math.PI*2;
      p.mesh.rotation.y += dyf * Math.min(1, dt*8);
      if (p.mesh.userData.tail) p.mesh.userData.tail.rotation.y = Math.sin(p.walkPhase) * 0.6;
      p.mesh.scale.setScalar(p.hurtT > 0 ? 1.1 : 1.0);
      continue;
    }

    let moving = false;
    let chasing = false;
    // Зомби: самостоятельно замечают игрока в радиусе 24 блоков (MC-парити)
    if (p.type === 'zombie' && (p.aggro || 0) <= 0 && !PLAYER.dead) {
      if (dist2ToPlayer(p) < 24*24) p.aggro = 12;
    }
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
          damagePlayer(p.def.dmg || 3, 'Вас убил ' + (p.def.name || 'моб'));
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

    // зомби заметно медленнее игрока (2.7), пиглин шустрее (3.6) — от зомби можно убежать
    const speed = chasing ? (p.def.chaseSpeed || 3.6) : (p.flee > 0 ? 3.2 : 1.4);
    if (moving) {
      const dirx = Math.sin(p.yaw), dirz = Math.cos(p.yaw);
      // избегать захода в воду: если впереди вода — развернуться (мобы реже сидят в воде)
      const ahx = Math.floor(p.pos.x + dirx*0.8), ahz = Math.floor(p.pos.z + dirz*0.8);
      const ahy = Math.floor(p.pos.y);
      const aheadWater = isWaterLiquid(World.getBlock(ahx, ahy, ahz)) || isWaterLiquid(World.getBlock(ahx, ahy-1, ahz));
      // не убегая в панике от воды разворачиваемся; при бегстве или ПОГОНЕ (зомби/пиглин лезут в воду) — продолжаем
      if (aheadWater && p.flee <= 0 && !chasing) {
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
      // курица медленно падает, размахивая крыльями (без урона от падения, как в MC)
      if (p.type === 'chicken' && p.vel.y < -2.5) p.vel.y = -2.5;
      if (p.vel.y < -55) p.vel.y = -55;
    }

    // СОЛНЦЕ: нежить (зомби) горит под открытым небом днём (MC-парити).
    // Проверку колонки до неба делаем не чаще 2 раз/с на моба — экономия.
    if (p.def.burnsInSun && World.dim === 'overworld' && daylight() > 0.4) {
      p.sunCheckT = (p.sunCheckT || 0) + dt;
      if (p.sunCheckT >= 0.5) {
        p.sunCheckT = 0;
        p.sunExposed = true;
        const hx = Math.floor(p.pos.x), hz = Math.floor(p.pos.z);
        for (let sy = Math.floor(p.pos.y + p.height); sy < WORLD_HEIGHT; sy++) {
          if (OPAQUE[World.getBlock(hx, sy, hz)]) { p.sunExposed = false; break; } // крыша над головой
        }
      }
      if (p.sunExposed) p.burnTimer = Math.max(p.burnTimer || 0, 1.0);
    } else {
      p.sunCheckT = 0; // ночь/Ад — проверка не нужна
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
            const cookedMap = { [ITEM.PORK_RAW]: ITEM.PORK_COOKED, [ITEM.BEEF_RAW]: ITEM.BEEF_COOKED, [ITEM.CHICKEN_RAW]: ITEM.CHICKEN_COOKED, [ITEM.MUTTON_RAW]: ITEM.MUTTON_COOKED, [ITEM.FISH_RAW]: ITEM.FISH_COOKED };
            const dropId = cookedMap[p.def.drop] || p.def.drop;
            for (let k = 0; k < n; k++) spawnDrop(dropId, p.pos.x + (Math.random()-0.5)*0.4, p.pos.y + 0.4, p.pos.z + (Math.random()-0.5)*0.4);
            if (p.type === 'cow') { const lc=1+(Math.random()*2|0); for(let k=0;k<lc;k++) spawnDrop(ITEM.LEATHER, p.pos.x+(Math.random()-0.5)*0.4, p.pos.y+0.4, p.pos.z+(Math.random()-0.5)*0.4); }
            if (p.type === 'sheep' && !p.sheared) spawnDrop(BLOCK.WOOL, p.pos.x+(Math.random()-0.5)*0.4, p.pos.y+0.4, p.pos.z+(Math.random()-0.5)*0.4);
            scene.remove(p.mesh); disposeGroup(p.mesh); mobs.splice(i, 1); continue;
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

    if (p.pos.y < -8) { scene.remove(p.mesh); disposeGroup(p.mesh); mobs.splice(i, 1); continue; }

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
// моб под прицелом (для стрижки и т.п.)
function mobUnderCursor(maxDist) {
  const origin = new THREE.Vector3(PLAYER.pos.x, PLAYER.pos.y + (PLAYER.crouching?PLAYER.crouchEye:PLAYER.eye), PLAYER.pos.z);
  const dir = new THREE.Vector3(
    -Math.sin(PLAYER.yaw)*Math.cos(PLAYER.pitch),
    Math.sin(PLAYER.pitch),
    -Math.cos(PLAYER.yaw)*Math.cos(PLAYER.pitch)
  ).normalize();
  let best = null, bestT = maxDist || 4.0;
  const blockHit = getTargetBlock(maxDist || 4.0);
  const blockDist = blockHit ? Math.hypot(blockHit.x + 0.5 - origin.x, blockHit.y + 0.5 - origin.y, blockHit.z + 0.5 - origin.z) : Infinity;
  for (const p of mobs) {
    const hw = p.width/2;
    const bmin = new THREE.Vector3(p.pos.x-hw, p.pos.y, p.pos.z-hw);
    const bmax = new THREE.Vector3(p.pos.x+hw, p.pos.y+p.height, p.pos.z+hw);
    const tHit = rayAABB(origin, dir, bmin, bmax);
    if (tHit !== null && tHit < bestT && tHit <= blockDist + 0.4) { bestT = tHit; best = p; }
  }
  return best;
}

// поспать в кровати: только ночью — плавно промотать время ВПЕРЁД к рассвету + spawn у кровати
// bx,by,bz — координаты блока кровати (для точки возрождения и камеры)
let sleepTransition = null; // {from, span, t, dur, sx, sy, sz, camFromX, camFromY, camFromZ}
function sleepInBed(bx, by, bz) {
  // в Аду кровать ВЗРЫВАЕТСЯ (как в Minecraft)
  if (World.dim === 'nether') {
    showToast('Кровать взрывается в Аду!');
    // разрушить саму кровать и блоки вокруг (упрощённый взрыв радиуса 2)
    const cx = bx !== undefined ? bx : Math.floor(PLAYER.pos.x);
    const cy = by !== undefined ? by : Math.floor(PLAYER.pos.y);
    const cz = bz !== undefined ? bz : Math.floor(PLAYER.pos.z);
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) for (let dz = -2; dz <= 2; dz++) {
      if (dx*dx + dy*dy + dz*dz > 6) continue;
      const ex = cx + dx, ey = cy + dy, ez = cz + dz;
      const b = World.getBlock(ex, ey, ez);
      if (b === BLOCK.AIR || b === BLOCK.BEDROCK || isLiquid(b)) continue;
      World.setBlock(ex, ey, ez, BLOCK.AIR);
      // поджечь центр
      if (dx === 0 && dz === 0 && dy === 0) FireSim.add(ex, ey, ez);
    }
    rebuildAround(cx, cz);
    spawnParticles(cx + 0.5, cy + 1, cz + 0.5, 24, '#ff8030');
    playSound('break', BLOCK.STONE);
    damagePlayer(10, 'Кровать взорвалась');
    return;
  }
  const dl = daylight();
  if (dl > 0.3) { showToast('Можно спать только ночью'); return; }
  if (sleepTransition) return; // уже спим
  // Монстры рядом не дают уснуть (как в MC): враждебный моб в радиусе 8 блоков
  {
    let monster = null;
    for (const m of mobs) {
      if (!m.def.hostile) continue;
      const dx = m.pos.x - (bx !== undefined ? bx + 0.5 : PLAYER.pos.x);
      const dy = m.pos.y - (by !== undefined ? by : PLAYER.pos.y);
      const dz = m.pos.z - (bz !== undefined ? bz + 0.5 : PLAYER.pos.z);
      if (dx*dx + dy*dy + dz*dz < 8*8) { monster = m; break; }
    }
    if (monster) { showToast('Вам не даёт спать ' + (monster.def.name || 'монстр') + ' поблизости'); return; }
  }
  // точка возрождения ставится СРАЗУ при засыпании (как в MC), а не после промотки
  if (bx !== undefined) {
    // ищем свободную клетку рядом с кроватью
    const spawn = findBedSpawn(bx, by, bz);
    if (spawn) PLAYER.spawnPoint = spawn;
  }
  // точка возрождения — над кроватью
  const sx = (bx !== undefined ? bx + 0.5 : PLAYER.pos.x);
  const sz = (bz !== undefined ? bz + 0.5 : PLAYER.pos.z);
  const sy = (by !== undefined ? by + 1 : PLAYER.pos.y);
  // Рассвет = DAY.time 0.25 (daylight = 0.5 — реальный рассвет по формуле daylight).
  const DAWN = 0.25;
  let span = (DAWN - DAY.time + 1) % 1;
  if (span < 0.01) span = 1.0; // если уже почти рассвет — крутим полные сутки
  // сохранить позицию камеры для возврата после сна
  const camFromX = PLAYER.pos.x, camFromY = PLAYER.pos.y, camFromZ = PLAYER.pos.z;
  sleepTransition = {
    from: DAY.time, span: span, t: 0, dur: 2.5,
    sx, sy, sz, camFromX, camFromY, camFromZ,
    bedX: sx, bedY: sy, bedZ: sz,
    bedBX: bx, bedBY: by, bedBZ: bz, // точные координаты блока кровати
  };
  showToast('Спокойной ночи…');
  // включить оверлей сна
  const so = document.getElementById('sleepOverlay');
  if (so) so.classList.add('on');
  playSound('pickup');
  if (typeof requestSave === 'function') requestSave();
}
// тикер плавной промотки времени (вызывается из главного цикла)
function endSleepTransition() {
  const so = document.getElementById('sleepOverlay');
  if (so) so.classList.remove('on');
  sleepTransition = null;
  if (typeof requestSave === 'function') requestSave();
}

function updateSleepTransition(dt) {
  if (!sleepTransition) return;
  // погибли во сне (напр. голод) — резко проснуться там, где засыпали
  if (PLAYER.dead) {
    PLAYER.pos.set(sleepTransition.camFromX, sleepTransition.camFromY, sleepTransition.camFromZ);
    PLAYER.vel.set(0, 0, 0);
    endSleepTransition();
    return;
  }
  sleepTransition.t += dt;
  const k = Math.min(1, sleepTransition.t / sleepTransition.dur);
  // ИНКРЕМЕНТИРУЕМ время вперёд (никакого отката назад) до рассвета.
  // Небо теперь меняется юниформом на GPU — без перестройки чанков
  // (раньше конец сна давал «вспышку» полного дня и двойной relight всех чанков).
  DAY.time = (sleepTransition.from + sleepTransition.span * k) % 1;
  DAY_LIGHT_UNIFORM.value = skyFactor();
  // плавно переместить камеру игрока к кровати (лёгкое «опускание» на кровать)
  const kk = k < 0.5 ? k * 2 : 1; // первая половина — движение к кровати
  PLAYER.pos.x = sleepTransition.camFromX + (sleepTransition.bedX - sleepTransition.camFromX) * kk;
  PLAYER.pos.y = sleepTransition.camFromY + (sleepTransition.bedY - sleepTransition.camFromY) * kk;
  PLAYER.pos.z = sleepTransition.camFromZ + (sleepTransition.bedZ - sleepTransition.camFromZ) * kk;
  if (k >= 1) {
    DAY.time = 0.25; // рассвет (daylight = 0.5)
    DAY_LIGHT_UNIFORM.value = skyFactor();
    // Встать в безопасную клетку РЯДОМ с кроватью (фикс: раньше игрок
    // просыпался в точке кровати и мог застрять в блоке над ней)
    let woke = false;
    if (sleepTransition.bedBX !== undefined) {
      const wake = findBedSpawn(sleepTransition.bedBX, sleepTransition.bedBY, sleepTransition.bedBZ);
      if (wake) { PLAYER.pos.set(wake.x, wake.y, wake.z); woke = true; }
    }
    if (!woke) PLAYER.pos.set(sleepTransition.camFromX, sleepTransition.camFromY, sleepTransition.camFromZ);
    PLAYER.vel.set(0, 0, 0);
    PLAYER.fallStart = undefined; // без урона от падения после сна
    showToast('Доброе утро!');
    endSleepTransition();
  }
}

function tryAttackMob() {
  const origin = new THREE.Vector3(PLAYER.pos.x, PLAYER.pos.y + (PLAYER.crouching?PLAYER.crouchEye:PLAYER.eye), PLAYER.pos.z);
  const dir = new THREE.Vector3(
    -Math.sin(PLAYER.yaw)*Math.cos(PLAYER.pitch),
    Math.sin(PLAYER.pitch),
    -Math.cos(PLAYER.yaw)*Math.cos(PLAYER.pitch)
  ).normalize();
  // дистанция до первого блока на луче — цель за стеной недостижима (как в MC)
  const blockHit = getTargetBlock(4.0);
  const blockDist = blockHit ? Math.hypot(blockHit.x + 0.5 - origin.x, blockHit.y + 0.5 - origin.y, blockHit.z + 0.5 - origin.z) : Infinity;
  let best = null, bestT = 4.0;
  for (const p of mobs) {
    const hw = p.width/2;
    const bmin = new THREE.Vector3(p.pos.x-hw, p.pos.y, p.pos.z-hw);
    const bmax = new THREE.Vector3(p.pos.x+hw, p.pos.y+p.height, p.pos.z+hw);
    const tHit = rayAABB(origin, dir, bmin, bmax);
    if (tHit !== null && tHit < bestT) { bestT = tHit; best = p; }
  }
  if (best && bestT <= blockDist + 0.4) { hurtMob(best); return true; }
  // лодка под прицелом — ломаем ударом (дроп предмет-лодка, как в MC)
  for (let bi = boats.length - 1; bi >= 0; bi--) {
    const b = boats[bi];
    const bmin = new THREE.Vector3(b.pos.x-0.75, b.pos.y, b.pos.z-0.95);
    const bmax = new THREE.Vector3(b.pos.x+0.75, b.pos.y+0.6, b.pos.z+0.95);
    const tHit = rayAABB(origin, dir, bmin, bmax);
    if (tHit !== null && tHit <= 3.5 && tHit <= blockDist + 0.4) {
      spawnDrop(ITEM.BOAT, b.pos.x, b.pos.y + 0.3, b.pos.z);
      if (b.rider) { b.rider = false; PLAYER.riding = null; }
      scene.remove(b.mesh); disposeGroup(b.mesh); boats.splice(bi, 1);
      playSound('break', BLOCK.PLANKS);
      return true;
    }
  }
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
  // i-frames как в MC: 0.5с неуязвимости после удара (фикс спам-ЛКМ)
  if ((p.hurtResist || 0) > 0) return;
  p.hurtResist = 0.5;
  // урон зависит от оружия: меч бьёт сильнее, кулак — 1
  // креатив: удар сносит моба с одного раза (как в MC — creative punch)
  const held = activeItem();
  const heldId = held ? held.id : 0;
  const dmg = window.__creative ? 1000 : (isSword(heldId) ? swordDamage(heldId) : (isTool(heldId) ? 2 : 1));
  p.hp -= dmg;
  p.hurtT = 0.3;
  addExhaustion(0.1); // атака тратит голод
  playSound(p.def.hurtSound);
  // износ инструмента при ударе (в MC оружие тоже теряет прочность)
  if (held && hasDurability(held.id)) {
    if (useDurability(held)) slots[activeSlot] = null;
    refreshUI();
  }
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
    // горевший на момент смерти моб роняет ЖАРЕНОЕ мясо (как в MC)
    const cookedMap = { [ITEM.PORK_RAW]: ITEM.PORK_COOKED, [ITEM.BEEF_RAW]: ITEM.BEEF_COOKED,
                        [ITEM.CHICKEN_RAW]: ITEM.CHICKEN_COOKED, [ITEM.MUTTON_RAW]: ITEM.MUTTON_COOKED,
                        [ITEM.FISH_RAW]: ITEM.FISH_COOKED };
    const wasBurning = (p.burnTimer || 0) > 0;
    const dropId = (wasBurning && cookedMap[p.def.drop]) || p.def.drop;
    const n = p.def.dropCount();
    for (let k = 0; k < n; k++) spawnDrop(dropId, p.pos.x + (Math.random()-0.5)*0.4, p.pos.y + 0.4, p.pos.z + (Math.random()-0.5)*0.4);
    // коровы дополнительно роняют 0–2 кожи (как в MC)
    if (p.type === 'cow') { const lc = (Math.random()*3|0); for (let k=0;k<lc;k++) spawnDrop(ITEM.LEATHER, p.pos.x+(Math.random()-0.5)*0.4, p.pos.y+0.4, p.pos.z+(Math.random()-0.5)*0.4); }
    // куры роняют 0–2 пера (как в MC)
    if (p.type === 'chicken') { const fc = (Math.random()*3|0); for (let k=0;k<fc;k++) spawnDrop(ITEM.FEATHER, p.pos.x+(Math.random()-0.5)*0.4, p.pos.y+0.4, p.pos.z+(Math.random()-0.5)*0.4); }
    // овцы роняют 1 шерсть, если ещё не острижены
    if (p.type === 'sheep' && !p.sheared) { spawnDrop(BLOCK.WOOL, p.pos.x+(Math.random()-0.5)*0.4, p.pos.y+0.4, p.pos.z+(Math.random()-0.5)*0.4); }
    const idx = mobs.indexOf(p);
    scene.remove(p.mesh);
    disposeGroup(p.mesh);
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
  // бедрок и командный блок: в ВЫЖИВАНИИ неразрушимы, в КРЕАТИВЕ ломаются (parity MC)
  if (t.block === BLOCK.BEDROCK && !window.__creative) return;
  if (t.block === BLOCK.COMMAND_BLOCK && !window.__creative) return;
  if (t.y <= 0) return; // самый нижний слой мира (дно) — неразрушим, чтобы не упасть в пустоту
  const broken = t.block;

  // Двери: ломаем обе половины
  if (isDoor(broken)) {
    const byd = broken === BLOCK.DOOR_BOTTOM ? t.y : t.y - 1;
    const otherY = broken === BLOCK.DOOR_BOTTOM ? t.y + 1 : t.y - 1;
    World.setBlock(t.x, t.y, t.z, BLOCK.AIR);
    if (isDoor(World.getBlock(t.x, otherY, t.z))) World.setBlock(t.x, otherY, t.z, BLOCK.AIR);
    World.doorState.delete(World.ekey(t.x, byd, t.z));
    if (!window.__creative) spawnDrop(ITEM.DOOR, t.x + 0.5, t.y + 0.5, t.z + 0.5); // креатив: без дропа (как в MC)
    onObtain(ITEM.DOOR);
    rebuildAround(t.x, t.z);
    playSound('break', BLOCK.PLANKS);
    return;
  }

  // Кровать: ломаем обе половины, выпадает 1 предмет-кровать
  if (isBed(broken)) {
    const fr = World.facing.get(World.ekey(t.x, t.y, t.z));
    // найти вторую половину по facing
    let dx2 = 0, dz2 = 0;
    if (fr === FACE_PX) dx2 = 1; else if (fr === FACE_NX) dx2 = -1;
    else if (fr === FACE_PZ) dz2 = 1; else if (fr === FACE_NZ) dz2 = -1;
    // от ножной части голова в +front; от изголовья — назад
    const otherDir = (broken === BLOCK.BED_FOOT) ? 1 : -1;
    const ox = t.x + dx2 * otherDir, oz = t.z + dz2 * otherDir;
    World.setBlock(t.x, t.y, t.z, BLOCK.AIR);
    World.facing.delete(World.ekey(t.x, t.y, t.z));
    if (isBed(World.getBlock(ox, t.y, oz))) { World.setBlock(ox, t.y, oz, BLOCK.AIR); World.facing.delete(World.ekey(ox, t.y, oz)); rebuildAround(ox, oz); }
    if (!window.__creative) spawnDrop(BLOCK.BED_FOOT, t.x + 0.5, t.y + 0.5, t.z + 0.5); // креатив: без дропа
    onObtain(BLOCK.BED_FOOT);
    rebuildAround(t.x, t.z);
    playSound('break', BLOCK.PLANKS);
    return;
  }

  // Печь: вернуть содержимое и удалить состояние
  if (broken === BLOCK.FURNACE) {
    const fk = World.ekey(t.x, t.y, t.z);
    const f = World.furnaces.get(fk);
    if (f) {
      for (const it of [f.input, f.fuel, f.output]) if (it) spawnDrop(it.id, t.x + 0.5, t.y + 0.7, t.z + 0.5, it.count);
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
    // разорвать связь двойного сундука и перестроить меш партнёра (вернуть текстуру одиночного)
    const partner = World.doubleChests.get(ck);
    if (partner) {
      World.doubleChests.delete(ck); World.doubleChests.delete(partner);
      const [px,,pz] = partner.split(',').map(Number);
      rebuildAround(px, pz);
    }
    const arr = World.chests.get(ck);
    if (arr) {
      for (const it of arr) if (it) spawnDrop(it.id, t.x + 0.5, t.y + 0.7, t.z + 0.5, it.count);
      World.chests.delete(ck);
    }
  }

  // Ломаем обсидиан портальной рамки или сам блок портала -> деактивировать портал
  if (broken === BLOCK.OBSIDIAN || broken === BLOCK.NETHER_PORTAL) {
    World.setBlock(t.x, t.y, t.z, BLOCK.AIR);
    deactivatePortalAround(t.x, t.y, t.z);
  } else {
    World.setBlock(t.x, t.y, t.z, BLOCK.AIR);
  }
  // технические блоки — без дропа (фикс: раньше портал выпадал ПРЕДМЕТОМ-блоком,
  // который можно было ставить где угодно)
  if (broken === BLOCK.NETHER_PORTAL || broken === BLOCK.FIRE) {
    rebuildAround(t.x, t.z);
    playSound('break', broken);
    WaterSim.touchAround(t.x, t.y, t.z); LavaSim.touchAround(t.x, t.y, t.z);
    checkSandAround(t.x, t.y, t.z);
    return;
  }

  // что выпадает
  let dropId = broken;
  let dropCount = 1;
  const held = activeItem();
  const tier = held ? pickaxeTier(held.id) : 0;
  const havePick = tier >= 1;
  const haveShears = held && held.id === ITEM.SHEARS;

  if (broken === BLOCK.GRASS) dropId = BLOCK.DIRT;
  else if (broken === BLOCK.LEAVES) {
    // листва: только ножницы дают дроп листвы; иначе — ничего (как в Minecraft)
    dropId = haveShears ? BLOCK.LEAVES : null;
  }
  else if (broken === BLOCK.GLASS) dropId = null;        // стекло разбивается
  else if (broken === BLOCK.STONE) dropId = havePick ? BLOCK.COBBLESTONE : null; // камень -> булыжник только киркой
  else if (broken === BLOCK.COBBLESTONE) dropId = havePick ? BLOCK.COBBLESTONE : null;
  else if (broken === BLOCK.FURNACE) dropId = havePick ? BLOCK.FURNACE : null;
  else if (broken === BLOCK.COAL_ORE) dropId = havePick ? ITEM.COAL : null; // уголь только киркой
  else if (broken === BLOCK.IRON_ORE) dropId = (tier >= 2) ? BLOCK.IRON_ORE : null; // железную руду — каменной киркой+, плавить в печи
  else if (broken === BLOCK.COPPER_ORE) dropId = (tier >= 2) ? BLOCK.COPPER_ORE : null; // медную руду — каменной киркой+, плавить в печи
  else if (broken === BLOCK.DIAMOND_ORE) dropId = (tier >= 4) ? ITEM.DIAMOND : null; // алмаз — только железной киркой+
  else if (broken === BLOCK.OBSIDIAN) dropId = (tier >= 5) ? BLOCK.OBSIDIAN : null; // обсидиан — только алмазной киркой
  else if (broken === BLOCK.GRAVEL) dropId = (Math.random() < 0.10) ? ITEM.FLINT : BLOCK.GRAVEL; // 10% шанс кремня (как в MC)
  else if (broken === BLOCK.NETHERRACK) dropId = havePick ? BLOCK.NETHERRACK : null;
  else if (broken === BLOCK.GLOWSTONE) dropId = BLOCK.GLOWSTONE; // светокамень в MC кирки не требует
  else if (broken === BLOCK.DEEPSLATE) dropId = havePick ? BLOCK.COBBLESTONE : null; // глубинный камень -> булыжник
  else if (broken === BLOCK.WOOL) dropId = BLOCK.WOOL;   // шерсть выпадает как есть
  else if (broken === BLOCK.TORCH) dropId = BLOCK.TORCH; // факел подбирается
  else if (broken === BLOCK.REDSTONE_ORE) {
    // редстоуновая руда: 4-5 пыли, только ЖЕЛЕЗНОЙ киркой+ (как в MC)
    dropId = (tier >= 4) ? ITEM.REDSTONE : null;
    dropCount = (tier >= 4) ? (4 + (Math.random()*2|0)) : 1;
  }
  else if (broken === BLOCK.REDSTONE_DUST) dropId = ITEM.REDSTONE; // пыль подбирается
  else if (broken === BLOCK.REDSTONE_TORCH) dropId = BLOCK.REDSTONE_TORCH;
  else if (broken === BLOCK.LEVER) dropId = BLOCK.LEVER;
  else if (broken === BLOCK.BUTTON) dropId = BLOCK.BUTTON;
  else if (broken === BLOCK.PISTON) dropId = havePick ? BLOCK.PISTON : null;
  else if (broken === BLOCK.PISTON_HEAD) dropId = null; // голова не выпадает
  else if (broken === BLOCK.COMMAND_BLOCK) dropId = null; // командный блок не выпадает (как в MC)

  // КРЕАТИВ: блоки ломаются без дропа (parity MC) — контейнеры содержимое всё же роняют
  if (window.__creative) dropId = null;

  if (dropId !== null) {
    for (let i = 0; i < dropCount; i++) spawnDrop(dropId, t.x + 0.5, t.y + 0.5, t.z + 0.5);
    onObtain(dropId); // отметить как открытый ресурс (для справочника)
  }

  // при ломании редстоун-блоков — пересчитать сеть
  if (broken === BLOCK.REDSTONE_ORE || broken === BLOCK.REDSTONE_DUST ||
      broken === BLOCK.REDSTONE_TORCH || broken === BLOCK.LEVER ||
      broken === BLOCK.BUTTON || broken === BLOCK.PISTON || broken === BLOCK.COMMAND_BLOCK) {
    if (broken === BLOCK.REDSTONE_TORCH) World.facing.delete(World.ekey(t.x, t.y, t.z));
    if (broken === BLOCK.LEVER) { leverStates.delete(ekeyOf(t.x, t.y, t.z)); World.facing.delete(World.ekey(t.x, t.y, t.z)); }
    if (broken === BLOCK.BUTTON) { buttonStates.delete(ekeyOf(t.x, t.y, t.z)); World.facing.delete(World.ekey(t.x, t.y, t.z)); }
    if (broken === BLOCK.PISTON) { pistonExtendedSet.delete(ekeyOf(t.x, t.y, t.z)); World.facing.delete(World.ekey(t.x, t.y, t.z)); }
    if (broken === BLOCK.COMMAND_BLOCK) { World.cmdBlocks.delete(World.ekey(t.x, t.y, t.z)); cmdPoweredSet.delete(ekeyOf(t.x, t.y, t.z)); World.facing.delete(World.ekey(t.x, t.y, t.z)); }
    markRedstoneDirty(t.x, t.y, t.z);
  }
  // свечение руды при ломании (визуальный эффект перед удалением)
  if (broken === BLOCK.REDSTONE_ORE) glowRedstoneOre(t.x, t.y, t.z);

  // износ инструмента за сломанный блок (в MC — 1 прочность за блок)
  if (held && hasDurability(held.id) && !(broken === BLOCK.LEAVES && held.id === ITEM.SHEARS) && broken !== BLOCK.WOOL) {
    if (useDurability(held)) slots[activeSlot] = null;
  }
  addExhaustion(0.005); // ломание блоков тратит голод (ванильное значение MC)
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
    // положить новый предмет в инвентарь; при полном инвентаре — дроп под ноги (фикс потери)
    if (!addToInventory(newId, 1)) spawnDrop(newId, PLAYER.pos.x, PLAYER.pos.y + 0.5, PLAYER.pos.z);
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
    // Внутри уже есть блоки портала -> рамка уже активна (или это «портал в портале»).
    // Такой портал НЕ активируем повторно (фикс: два портала один в другом не зажигаются оба).
    if (b === BLOCK.NETHER_PORTAL) { ok = false; break; }
    if (b !== BLOCK.AIR && b !== BLOCK.FIRE) { ok = false; break; } // не замкнут
    fill.push([cx,cy,cz]);
    if (fill.length > 30) { ok = false; break; } // слишком большой/открытый — не портал
    // распространяемся вверх/вниз и вдоль оси проёма
    stack.push([cx,cy+1,cz]); stack.push([cx,cy-1,cz]);
    stack.push([cx+dirX,cy,cz+dirZ]); stack.push([cx-dirX,cy,cz-dirZ]);
  }
  if (!ok || fill.length === 0) return false;
  for (const [cx,cy,cz] of fill) World.setBlock(cx, cy, cz, BLOCK.NETHER_PORTAL);
  for (const [cx,cy,cz] of fill) rebuildAround(cx, cz);
  // зарегистрировать портал (нижняя-ближняя клетка проёма) для связывания/мультипорталов
  let lo = fill[0];
  for (const c of fill) if (c[1] < lo[1]) lo = c;
  registerPortal(lo[0], lo[1], lo[2]);
  return true;
}

// --- Реестр порталов: регистрация/поиск (мультипорталы + связывание) ---
function registerPortal(x, y, z) {
  if (!World.portals) return;
  // не дублировать близкие записи
  for (const p of World.portals) if (Math.abs(p.x-x)<=2 && Math.abs(p.y-y)<=3 && Math.abs(p.z-z)<=2) return;
  World.portals.push({ x, y, z });
}
function unregisterPortalAt(x, y, z) {
  if (!World.portals) return;
  World.portals = World.dims[World.dim].portals = World.portals.filter(p => !(Math.abs(p.x-x)<=1 && Math.abs(p.y-y)<=2 && Math.abs(p.z-z)<=1));
}
// Деактивировать портал: если рядом разрушена рамка/блок портала — снять связанные блоки портала.
function deactivatePortalAround(x, y, z) {
  // flood-fill по соседним блокам портала и превратить их в воздух
  const stack = [];
  const dirs = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  for (const [dx,dy,dz] of dirs) {
    if (World.getBlock(x+dx,y+dy,z+dz) === BLOCK.NETHER_PORTAL) stack.push([x+dx,y+dy,z+dz]);
  }
  const seen = new Set();
  let any = false; let rx=x, ry=y, rz=z;
  while (stack.length) {
    const [cx,cy,cz] = stack.pop();
    const k = cx+','+cy+','+cz;
    if (seen.has(k)) continue; seen.add(k);
    if (World.getBlock(cx,cy,cz) !== BLOCK.NETHER_PORTAL) continue;
    World.setBlock(cx,cy,cz, BLOCK.AIR);
    rebuildAround(cx,cz);
    any = true; rx=cx; ry=cy; rz=cz;
    for (const [dx,dy,dz] of dirs) stack.push([cx+dx,cy+dy,cz+dz]);
  }
  if (any) unregisterPortalAt(rx, ry, rz);
}

// найти ближайший действующий портал в указанном измерении к точке (tx,ty,tz)
function findNearestPortal(dimName, tx, ty, tz, maxR) {
  const s = World.dims[dimName];
  if (!s || !s.portals || !s.portals.length) return null;
  let best = null, bestD = Infinity;
  for (const p of s.portals) {
    const d = (p.x-tx)**2 + (p.y-ty)**2 + (p.z-tz)**2;
    if (d < bestD) { bestD = d; best = p; }
  }
  // в MC поиск портала: радиус 128 в обычном мире, 16 в Аду; вне радиуса строится новый
  if (best && (maxR === undefined || bestD <= maxR*maxR)) return best;
  return null;
}

// найти безопасную точку возрождения рядом с кроватью (как в MC — не прямо в блоке)
function findBedSpawn(bx, by, bz) {
  // [dx, dz] — прямые соседи, потом диагонали (как в MC ищется клетка у кровати)
  const offs = [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]];
  for (const [dx, dz] of offs) {
    const x = bx + dx, z = bz + dz;
    const feet = World.getBlock(x, by, z), head = World.getBlock(x, by + 1, z);
    const below = World.getBlock(x, by - 1, z);
    if (feet === BLOCK.AIR && head === BLOCK.AIR && below !== BLOCK.AIR && !isLiquid(below)) {
      return { x: x + 0.5, y: by, z: z + 0.5 };
    }
  }
  return null; // безопасной клетки нет
}

// безопасная точка выхода у портала: проверяем 4 горизонтальных соседа нижних клеток
function findSafePortalExit(px, py, pz) {
  const dirs = [[0,1],[1,0],[0,-1],[-1,0]];
  for (const [dx, dz] of dirs) {
    const x = px + dx, z = pz + dz;
    let ok = true;
    for (let dy = 0; dy <= 1; dy++) {
      const b = World.getBlock(x, py + dy, z);
      if (b !== BLOCK.AIR && !isLiquid(b)) { ok = false; break; }
    }
    const below = World.getBlock(x, py - 1, z);
    if (ok && below !== BLOCK.AIR && !isLiquid(below)) {
      return { x: x + 0.5, y: py + 0.01, z: z + 0.5 };
    }
  }
  return { x: px + 0.5, y: py + 0.01, z: pz + 1.5 }; // как раньше
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
  consumeHeldItem(slot);
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
  // вода в Аду мгновенно испаряется (как в MC)
  if (liquid === BLOCK.WATER && World.dim === 'nether') {
    swapActiveOneTo(ITEM.BUCKET);
    spawnParticles(nx + 0.5, ny + 0.5, nz + 0.5, 10, '#c8c8d8');
    playSound('splash');
    showToast('Вода испарилась в Аду');
    return;
  }
  World.clearLevel(nx, ny, nz);
  World.setBlock(nx, ny, nz, liquid);
  LiquidSim.touchAround(nx, ny, nz);
  rebuildAround(nx, nz);
  swapActiveOneTo(ITEM.BUCKET); // ведро пустеет
  playSound('splash');
}

function placeBlock() {
  // сесть в лодку — только если она под прицелом (фикс: раньше любая лодка
  // в радиусе 2.4 перехватывала ПКМ, и рядом с ней нельзя было ставить блоки)
  if (!PLAYER.riding) {
    const origin = new THREE.Vector3(PLAYER.pos.x, PLAYER.pos.y + (PLAYER.crouching?PLAYER.crouchEye:PLAYER.eye), PLAYER.pos.z);
    const dir = new THREE.Vector3(
      -Math.sin(PLAYER.yaw)*Math.cos(PLAYER.pitch),
      Math.sin(PLAYER.pitch),
      -Math.cos(PLAYER.yaw)*Math.cos(PLAYER.pitch)
    ).normalize();
    const b = nearestBoat(3.0);
    if (b) {
      const bmin = new THREE.Vector3(b.pos.x-0.8, b.pos.y, b.pos.z-1.0);
      const bmax = new THREE.Vector3(b.pos.x+0.8, b.pos.y+0.7, b.pos.z+1.0);
      const tHit = rayAABB(origin, dir, bmin, bmax);
      if (tHit !== null && tHit <= 3.0) { b.rider = true; PLAYER.riding = b; PLAYER.vel.set(0,0,0); return; }
    }
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
  // ПКМ по рычагу — переключить (вкл/выкл сигнал)
  if (t.block === BLOCK.LEVER) {
    const st = leverState(t.x, t.y, t.z);
    st.on = !st.on;
    setLeverState(t.x, t.y, t.z, st);
    rebuildAround(t.x, t.z);
    playSound('click');
    markRedstoneDirty(t.x, t.y, t.z);
    return;
  }
  // ПКМ по кнопке — нажать (кратковременный сигнал ~1.5 сек)
  if (t.block === BLOCK.BUTTON) {
    pressButton(t.x, t.y, t.z);
    return;
  }
  // ЛКМ-эффект на редстоуновой руде: свечение (здесь — по ПКМ для теста; основной триггер — наступание/ломание)
  if (t.block === BLOCK.REDSTONE_ORE) {
    glowRedstoneOre(t.x, t.y, t.z);
  }
  // ПКМ по кровати — поспать (промотать к утру), если ночь
  if (isBed(t.block)) {
    sleepInBed(t.x, t.y, t.z);
    return;
  }
  // ПКМ по командному блоку — настроить команду (ранний прототип, как в MC)
  if (t.block === BLOCK.COMMAND_BLOCK) {
    openCmdBlockUI(t.x, t.y, t.z);
    return;
  }

  // ПКМ по овце — состричь шерсть (нужны Ножницы; иначе просто «погладить»)
  {
    const m = mobUnderCursor(4.0);
    if (m && m.type === 'sheep' && !m.sheared) {
      const slot0 = activeItem();
      const haveShears = slot0 && slot0.id === ITEM.SHEARS;
      if (haveShears) {
        m.sheared = true;
        const n = 1 + (Math.random()*2|0);
        for (let k = 0; k < n; k++) spawnDrop(BLOCK.WOOL, m.pos.x+(Math.random()-0.5)*0.4, m.pos.y+0.6, m.pos.z+(Math.random()-0.5)*0.4);
        if (m.mesh.userData.wool) m.mesh.userData.wool.scale.set(0.8, 0.7, 0.85); // визуально «голая»
        playSound('shear');
        // ножницы теряют прочность (через useDurability — действует правило мира)
        if (useDurability(slot0)) { slots[activeSlot] = null; playSound('break', BLOCK.IRON_ORE); }
        refreshUI();
        return;
      } else {
        showToast('Нужны ножницы, чтобы состричь овцу');
      }
    }
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
  // палка/кирка не ставятся (дверь и редстоун-пыль — предметы, ставящиеся как блоки)
  if (!isBlock(slot.id) && slot.id !== ITEM.DOOR && slot.id !== ITEM.REDSTONE) return;

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
    consumeHeldItem(slot);
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
    // дверь той же ориентации сбоку?
    const doorSameFacing = (cx, cz) => {
      const bb = World.getBlock(cx, ny, cz);
      if (!isDoor(bb)) return null;
      const fr = World.facing.get(World.ekey(cx, ny, cz));
      if (fr !== dfront) return null;
      const st = World.doorState.get(World.ekey(cx, ny, cz));
      return st || { hinge: 'right' };
    };
    let hinge = 'right';
    const rightDoor = doorSameFacing(nx + rightCell[0], nz + rightCell[1]);
    const leftDoor  = doorSameFacing(nx + leftCell[0],  nz + leftCell[1]);
    if (rightDoor) {
      // справа уже дверь (петля у неё обычно справа) -> у нас петля СЛЕВА (двустворчато)
      hinge = (rightDoor.hinge === 'right') ? 'left' : 'right';
    } else if (leftDoor) {
      hinge = (leftDoor.hinge === 'left') ? 'right' : 'left';
    } else {
      // иначе петля прислоняется к соседней стене
      const rightHasNeighbor = isWallOrDoor(nx + rightCell[0], nz + rightCell[1]);
      const leftHasNeighbor  = isWallOrDoor(nx + leftCell[0],  nz + leftCell[1]);
      if (!rightHasNeighbor && leftHasNeighbor) hinge = 'left';
    }
    World.setBlock(nx, ny, nz, BLOCK.DOOR_BOTTOM);
    World.setBlock(nx, ny + 1, nz, BLOCK.DOOR_TOP);
    World.facing.set(World.ekey(nx, ny, nz), dfront);
    World.facing.set(World.ekey(nx, ny + 1, nz), dfront);
    World.doorState.set(World.ekey(nx, ny, nz), { open: false, hinge });
    rebuildAround(nx, nz);
    playSound('place', BLOCK.PLANKS);
    return;
  }

  // ---- Факел: ставится на пол или прислоняется к стене ----
  if (slot.id === BLOCK.TORCH) {
    // нужна опора: пол снизу или стена сбоку (грань, на которую кликнули)
    const fb = t.face;
    let okSupport = false, facing;
    if (fb[1] === 1) { // на верхнюю грань блока — на полу
      okSupport = !isTransparent(World.getBlock(nx, ny - 1, nz)) || World.getBlock(nx, ny-1, nz) === BLOCK.TORCH;
      facing = undefined;
    } else if (fb[1] === 0) { // на боковую грань — на стене
      okSupport = !isTransparent(t.block);
      // перед факела смотрит от стены к игроку (противоположно нормали грани)
      if (fb[0] === 1) facing = FACE_PX; else if (fb[0] === -1) facing = FACE_NX;
      else if (fb[2] === 1) facing = FACE_PZ; else facing = FACE_NZ;
    }
    if (!okSupport) return;
    consumeHeldItem(slot);
    refreshUI();
    World.setBlock(nx, ny, nz, BLOCK.TORCH);
    if (facing !== undefined) World.facing.set(World.ekey(nx, ny, nz), facing);
    rebuildAround(nx, nz);
    playSound('place', BLOCK.WOOD);
    return;
  }

  // ---- Кровать: два блока в длину (ножная + изголовье) ----
  if (slot.id === BLOCK.BED_FOOT) {
    // направление «головы» — от игрока (по взгляду)
    const lookD = new THREE.Vector3(-Math.sin(PLAYER.yaw), 0, -Math.cos(PLAYER.yaw));
    let dx2, dz2, footFront;
    if (Math.abs(lookD.x) >= Math.abs(lookD.z)) { dx2 = lookD.x > 0 ? 1 : -1; dz2 = 0; footFront = lookD.x > 0 ? FACE_PX : FACE_NX; }
    else { dx2 = 0; dz2 = lookD.z > 0 ? 1 : -1; footFront = lookD.z > 0 ? FACE_PZ : FACE_NZ; }
    const hx = nx + dx2, hz = nz + dz2;
    const hb = World.getBlock(hx, ny, hz);
    if (hb !== BLOCK.AIR && !isLiquid(hb)) return;        // место под изголовье
    if (canFallInto(World.getBlock(nx, ny - 1, nz)) || canFallInto(World.getBlock(hx, ny - 1, hz))) return; // нужна опора
    if (intersectsPlayer(nx, ny, nz) || intersectsPlayer(hx, ny, hz)) return;
    consumeHeldItem(slot);
    refreshUI();
    World.setBlock(nx, ny, nz, BLOCK.BED_FOOT);
    World.setBlock(hx, ny, hz, BLOCK.BED_HEAD);
    World.facing.set(World.ekey(nx, ny, nz), footFront);
    World.facing.set(World.ekey(hx, ny, hz), footFront);
    rebuildAround(nx, nz); rebuildAround(hx, hz);
    playSound('place', BLOCK.PLANKS);
    return;
  }

  // ---- Редстоуновая пыль: ставится только на твёрдую верхнюю грань ----
  if (slot.id === ITEM.REDSTONE) {
    if (t.face[1] !== 1) return; // только на верхнюю грань
    const support = World.getBlock(t.x, t.y, t.z);
    if (isTransparent(support) || isLiquid(support)) return;
    if (target !== BLOCK.AIR && !isLiquid(target)) return;
    consumeHeldItem(slot);
    refreshUI();
    World.setBlock(nx, ny, nz, BLOCK.REDSTONE_DUST);
    rebuildAround(nx, nz);
    playSound('place', BLOCK.STONE);
    markRedstoneDirty(nx, ny, nz);
    return;
  }

  // ---- Редстоуновый факел: на пол/стену (как обычный факел) ----
  if (slot.id === BLOCK.REDSTONE_TORCH) {
    const fb = t.face;
    let okSupport = false, facing;
    if (fb[1] === 1) { okSupport = !isTransparent(World.getBlock(nx, ny - 1, nz)); facing = undefined; }
    else if (fb[1] === 0) {
      okSupport = !isTransparent(t.block);
      if (fb[0] === 1) facing = FACE_PX; else if (fb[0] === -1) facing = FACE_NX;
      else if (fb[2] === 1) facing = FACE_PZ; else facing = FACE_NZ;
    }
    if (!okSupport) return;
    consumeHeldItem(slot);
    refreshUI();
    World.setBlock(nx, ny, nz, BLOCK.REDSTONE_TORCH);
    if (facing !== undefined) World.facing.set(World.ekey(nx, ny, nz), facing);
    rebuildAround(nx, nz);
    playSound('place', BLOCK.WOOD);
    markRedstoneDirty(nx, ny, nz);
    return;
  }

  // ---- Рычаг: на пол/стену ----
  if (slot.id === BLOCK.LEVER) {
    const fb = t.face;
    let okSupport = false, facing;
    if (fb[1] === 1) { okSupport = !isTransparent(World.getBlock(nx, ny - 1, nz)); facing = FACE_PY; }
    else if (fb[1] === 0) {
      okSupport = !isTransparent(t.block);
      if (fb[0] === 1) facing = FACE_PX; else if (fb[0] === -1) facing = FACE_NX;
      else if (fb[2] === 1) facing = FACE_PZ; else facing = FACE_NZ;
    }
    if (!okSupport) return;
    consumeHeldItem(slot);
    refreshUI();
    World.setBlock(nx, ny, nz, BLOCK.LEVER);
    if (facing !== undefined) World.facing.set(World.ekey(nx, ny, nz), facing);
    setLeverState(nx, ny, nz, { on: false, facing });
    rebuildAround(nx, nz);
    playSound('place', BLOCK.STONE);
    markRedstoneDirty(nx, ny, nz);
    return;
  }

  // ---- Кнопка: на пол/стену (как рычаг, но с авто-выключением) ----
  if (slot.id === BLOCK.BUTTON) {
    const fb = t.face;
    let okSupport = false, facing;
    if (fb[1] === 1) { okSupport = !isTransparent(World.getBlock(nx, ny - 1, nz)); facing = FACE_PY; }
    else if (fb[1] === 0) {
      okSupport = !isTransparent(t.block);
      if (fb[0] === 1) facing = FACE_PX; else if (fb[0] === -1) facing = FACE_NX;
      else if (fb[2] === 1) facing = FACE_PZ; else facing = FACE_NZ;
    }
    if (!okSupport) return;
    consumeHeldItem(slot);
    refreshUI();
    World.setBlock(nx, ny, nz, BLOCK.BUTTON);
    if (facing !== undefined) World.facing.set(World.ekey(nx, ny, nz), facing);
    setButtonState(nx, ny, nz, { pressed: false, timer: 0, facing });
    rebuildAround(nx, nz);
    playSound('place', BLOCK.STONE);
    return;
  }

  // ---- Поршень: на пол/стену, лицо смотрит от опоры ----
  if (slot.id === BLOCK.PISTON) {
    const fb = t.face;
    let okSupport = false, facing;
    if (fb[1] === 1) {
      // на полу: в MC поршень смотрит НА ИГРОКА (горизонтально), а не вверх
      okSupport = !isTransparent(World.getBlock(nx, ny - 1, nz));
      const lx = -Math.sin(PLAYER.yaw), lz = -Math.cos(PLAYER.yaw);
      facing = Math.abs(lx) >= Math.abs(lz) ? (lx > 0 ? FACE_PX : FACE_NX) : (lz > 0 ? FACE_PZ : FACE_NZ);
    }
    else if (fb[1] === -1) { okSupport = !isTransparent(World.getBlock(nx, ny + 1, nz)); facing = FACE_NY; }
    else if (fb[1] === 0) {
      okSupport = !isTransparent(t.block);
      if (fb[0] === 1) facing = FACE_PX; else if (fb[0] === -1) facing = FACE_NX;
      else if (fb[2] === 1) facing = FACE_PZ; else facing = FACE_NZ;
    }
    if (!okSupport) return;
    consumeHeldItem(slot);
    refreshUI();
    World.setBlock(nx, ny, nz, BLOCK.PISTON);
    if (facing !== undefined) World.facing.set(World.ekey(nx, ny, nz), facing);
    rebuildAround(nx, nz);
    playSound('place', BLOCK.STONE);
    markRedstoneDirty(nx, ny, nz);
    return;
  }

  // не ставить блок внутрь игрока
  if (intersectsPlayer(nx, ny, nz)) return;

  const placeId = slot.id;
  // списать 1 штуку из активного слота
  consumeHeldItem(slot);
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
  [ITEM.MUTTON_RAW]: { id: ITEM.MUTTON_COOKED, count: 1 },
  [ITEM.FISH_RAW]: { id: ITEM.FISH_COOKED, count: 1 },
  [BLOCK.WOOD]: { id: ITEM.CHARCOAL, count: 1 }, // дерево -> древесный уголь
  [BLOCK.IRON_ORE]: { id: ITEM.IRON_INGOT, count: 1 }, // железная руда -> слиток
  [BLOCK.COPPER_ORE]: { id: ITEM.COPPER_INGOT, count: 1 }, // медная руда -> медный слиток
};
function isSmeltable(id) { return SMELT[id] !== undefined; }
// Топливо: сколько предметов сжигает 1 единица (больше = горит дольше)
const FUEL = {
  // ванильные значения MC: уголь/древесный уголь плавят 8 предметов,
  // доски/дерево/верстак/сундук — 1.5, палки — 0.5, ведро лавы — 100 (и остаётся пустое ведро)
  [BLOCK.PLANKS]: 1.5,
  [BLOCK.WOOD]: 1.5,
  [ITEM.DOOR]: 1,
  [ITEM.STICK]: 0.5,
  [BLOCK.CRAFTING_TABLE]: 1.5,
  [BLOCK.CHEST]: 1.5,
  [ITEM.CHARCOAL]: 8,
  [ITEM.COAL]: 8,
  [ITEM.LAVA_BUCKET]: 100,
};
function isFuel(id) { return FUEL[id] !== undefined; }

const COOK_TIME = 10; // сек на 1 предмет — как в Minecraft

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
    // расширяться можно только ПЕРПЕНДИКУЛЯРНО «переду» (как в MC, не «в затылок»)
    // front — куда смотрит перед; вдоль этой оси сосед НЕ подходит
    const axisX = (front === FACE_PX || front === FACE_NX);
    if (axisX && dz !== 0) continue;   // перед по X — объединяем только по Z
    if (!axisX && dx !== 0) continue;  // перед по Z — объединяем только по X
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
let _furnaceUISig = '';
function updateFurnaces(dt) {
  for (const [k, f] of World.furnaces) {
    const wasLit = f.burn > 0;
    const canSmelt = f.input && isSmeltable(f.input.id) &&
      (!f.output || (f.output.id === SMELT[f.input.id].id && f.output.count < MAX_STACK));
    // зажечь топливо при необходимости
    if (f.burn <= 0 && canSmelt && f.fuel && isFuel(f.fuel.id)) {
      f.burnMax = FUEL[f.fuel.id] * COOK_TIME;
      f.burn = f.burnMax;
      // ведро лавы после сгорания оставляет пустое ведро (как в MC)
      if (f.fuel.id === ITEM.LAVA_BUCKET) {
        if (!f.output || (f.output.id === ITEM.BUCKET && f.output.count < MAX_STACK)) {
          if (!f.output) f.output = { id: ITEM.BUCKET, count: 1 };
          else f.output.count += 1;
        } else {
          if (!addToInventory(ITEM.BUCKET, 1)) spawnDrop(ITEM.BUCKET, k.split(',')[0] * 1 + 0.5, (k.split(',')[1] * 1 + 1), k.split(',')[2] * 1 + 0.5);
        }
      }
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
    // обновить UI открытой печи БЕЗ полного пересоздания DOM (фикс: раньше —
    // renderInventory() каждый кадр, полный rebuild ~50 слотов и 60+ canvas 60 раз/с)
    if (openFurnacePos && World.ekey(openFurnacePos.x, openFurnacePos.y, openFurnacePos.z) === k && invOpen) {
      const sig = k + '|' + (f.input ? f.input.id + ':' + f.input.count : '-') + '|' +
                  (f.fuel ? f.fuel.id + ':' + f.fuel.count : '-') + '|' +
                  (f.output ? f.output.id + ':' + f.output.count : '-') + '|' + (f.burn > 0 ? 1 : 0);
      if (sig !== _furnaceUISig) {
        _furnaceUISig = sig;
        renderInventory(); // состав слотов изменился — полный рендер (редко)
      } else {
        // иначе обновляем только прогресс-бар и пламя (дёшево)
        const fill = invGrid.querySelector('.furnace-prog-fill');
        if (fill) fill.style.width = Math.round((f.cook / COOK_TIME) * 100) + '%';
        const flame = invGrid.querySelector('.furnace-flame');
        if (flame) flame.classList.toggle('lit', f.burn > 0);
      }
    }
  }
}

// ============================================================
//  Система редстоуна (базовая проводка)
//  - Редстоуновая руда: светится при клике/наступании (визуально, на 3 сек)
//  - Редстоуновая пыль: передаёт сигнал 0..15 по цепочке (до 15 блоков)
//  - Редстоуновый факел: источник сигнала 15 (гаснет, если сам запитан)
//  - Рычаг: источник 15 (вкл/выкл по клику)
//  - Дверь открывается, когда соседняя пыль/факел/рычаг дают сигнал
// ============================================================

// карта «x,y,z» -> уровень мощности (0..15). 0 = нет сигнала (запись отсутствует).
let redstonePower = new Map();      // активная размерность
let leverStates = new Map();        // «x,y,z» -> {on:bool, facing}
let buttonStates = new Map();       // «x,y,z» -> {pressed:bool, timer:sec, facing}
let pistonExtendedSet = new Set();  // набор ekey выдвинутых поршней
let cmdPoweredSet = new Set();      // набор ekey запитанных командных блоков (для фронта сигнала)
let glowingOre = new Map();         // «x,y,z» -> время до истечения свечения (сек)
let particles = [];                 // визуальные частицы (редстоун-руда, поршень)

// сброс состояния редстоуна при смене измерения
function resetRedstoneState() {
  redstonePower = new Map();
  leverStates = new Map();
  buttonStates = new Map();
  pistonExtendedSet = new Set();
  cmdPoweredSet = new Set();
  glowingOre = new Map();
  particles = [];
}

function ekeyOf(x, y, z) { return x + ',' + y + ',' + z; }

// состояние рычага (on по умолчанию false)
function leverState(x, y, z) {
  return leverStates.get(ekeyOf(x, y, z)) || { on: false, facing: FACE_PZ };
}
function setLeverState(x, y, z, st) { leverStates.set(ekeyOf(x, y, z), st); }

// состояние кнопки: pressed + таймер до отпускания
function buttonState(x, y, z) {
  return buttonStates.get(ekeyOf(x, y, z)) || { pressed: false, timer: 0, facing: FACE_PZ };
}
function setButtonState(x, y, z, st) { buttonStates.set(ekeyOf(x, y, z), st); }
// нажать кнопку (включить сигнал на ~1.5 сек)
function pressButton(x, y, z) {
  const old = buttonState(x, y, z);
  setButtonState(x, y, z, { pressed: true, timer: 1.5, facing: old.facing });
  rebuildAround(x, z);
  playSound('click');
  markRedstoneDirty(x, y, z);
}
// тикер кнопок: уменьшать таймер, отпускать
function updateButtons(dt) {
  if (buttonStates.size === 0) return;
  const expired = [];
  let changed = false;
  for (const [k, st] of buttonStates) {
    if (!st.pressed) continue;
    st.timer -= dt;
    if (st.timer <= 0) { expired.push(k); changed = true; }
  }
  for (const k of expired) {
    const st = buttonStates.get(k);
    buttonStates.set(k, { pressed: false, timer: 0, facing: st.facing });
    const [x,y,z] = k.split(',').map(Number);
    rebuildAround(x, z);
    markRedstoneDirty(x, y, z);
  }
}

// поршень: выдвинут ли он
function pistonExtended(x, y, z) {
  return pistonExtendedSet.has(ekeyOf(x, y, z));
}
// направление «лица» поршня (куда толкает)
function pistonFrontDir(x, y, z) {
  const fr = World.facing.get(ekeyOf(x, y, z));
  if (fr === FACE_PX) return [1,0,0];
  if (fr === FACE_NX) return [-1,0,0];
  if (fr === FACE_PY) return [0,1,0];
  if (fr === FACE_NY) return [0,-1,0];
  if (fr === FACE_PZ) return [0,0,1];
  return [0,0,-1]; // FACE_NZ
}
// можно ли толкнуть блок (не бедрок, не воздух, не разрушаемый)
function isPistonPushable(b) {
  if (b === BLOCK.AIR || b === BLOCK.BEDROCK) return false;
  if (isLiquid(b)) return false;
  if (b === BLOCK.PISTON || b === BLOCK.PISTON_HEAD) return false;
  if (b === BLOCK.OBSIDIAN) return false; // обсидиан не двигается
  // контейнеры и блочные сущности поршнем не двигаются (как в MC) — иначе
  // содержимое сундуков дюпилось/терялось при сдвиге
  if (b === BLOCK.CHEST || b === BLOCK.FURNACE) return false;
  // многосоставные блоки (двери/кровати) не двигаются — иначе «призрачные» половины
  if (isDoor(b) || isBed(b)) return false;
  // редстоун-компоненты отламываются предметом (упрощённо — не двигаются)
  if (b === BLOCK.REDSTONE_DUST || b === BLOCK.REDSTONE_TORCH ||
      b === BLOCK.LEVER || b === BLOCK.BUTTON) return false;
  // командный блок — блочная сущность, не двигается (как в MC)
  if (b === BLOCK.COMMAND_BLOCK) return false;
  return true;
}
// активировать поршень: если не выдвинут и спереди толкаемый блок — выдвинуть + толкнуть
function updatePistons(minX, maxX, minZ, maxZ) {
  // Проходим только по чанкам в пределах редстоун-радиуса (а не по всем загруженным).
  // Это убирает сканирование миллионов блоков каждый кадр.
  const ccxMin = Math.floor(minX / CHUNK_SIZE), ccxMax = Math.floor(maxX / CHUNK_SIZE);
  const cczMin = Math.floor(minZ / CHUNK_SIZE), cczMax = Math.floor(maxZ / CHUNK_SIZE);
  const checked = new Set();
  for (let ccx = ccxMin; ccx <= ccxMax; ccx++) {
    for (let ccz = cczMin; ccz <= cczMax; ccz++) {
      const c = World.chunks.get(World.key(ccx, ccz));
      if (!c) continue;
      const x0 = c.cx * CHUNK_SIZE, z0 = c.cz * CHUNK_SIZE;
      for (let lx = 0; lx < CHUNK_SIZE; lx++) for (let lz = 0; lz < CHUNK_SIZE; lz++) for (let y = 0; y < WORLD_HEIGHT; y++) {
      const b = c.blocks[idx(lx, y, lz)];
      if (b !== BLOCK.PISTON) continue;
      const wx = x0 + lx, wz = z0 + lz;
      const k = ekeyOf(wx, y, wz);
      if (checked.has(k)) continue;
      checked.add(k);
      const [dx,dy,dz] = pistonFrontDir(wx, y, wz);
      // поршень питается от соседних блоков с сигналом (пыль/факел/рычаг/кнопка рядом)
      let powered = redstonePowerAt(wx, y, wz) > 0 || sourcePowerAt(wx, y, wz) > 0;
      if (!powered) {
        const neigh = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
        for (const d of neigh) {
          const nx=wx+d[0], ny2=y+d[1], nz=wz+d[2];
          if (redstonePowerAt(nx, ny2, nz) > 0 || sourcePowerAt(nx, ny2, nz) > 0) { powered = true; break; }
        }
      }
      const extended = pistonExtendedSet.has(k);
      if (powered && !extended) {
        // выдвинуть: проверить, что спереди можно толкнуть (или воздух)
        const tx = wx+dx, ty = y+dy, tz = wz+dz;
        const tb = World.getBlock(tx, ty, tz);
        if (tb === BLOCK.AIR || isLiquid(tb)) {
          // не выдвигаться в игрока/мобов (в MC сущность блокирует поршень)
          if (intersectsPlayer(tx, ty, tz)) continue;
          let blockedByMob = false;
          for (const pm of mobs) {
            const phw = pm.width / 2;
            if (tx + 1 > pm.pos.x - phw && tx < pm.pos.x + phw &&
                ty + 1 > pm.pos.y && ty < pm.pos.y + pm.height &&
                tz + 1 > pm.pos.z - phw && tz < pm.pos.z + phw) { blockedByMob = true; break; }
          }
          if (blockedByMob) continue;
          // просто выдвинуть голову, ничего не толкая
          pistonExtendedSet.add(k);
          rebuildAround(wx, wz); rebuildAround(tx, tz);
          playSound('piston');
          // частицы пыли
          spawnParticles(tx + 0.5, ty + 0.5, tz + 0.5, 6, '#9a9a9a');
        } else if (isPistonPushable(tb)) {
          // посчитать цепочку толкаемых блоков (до 12, как в MC)
          const chain = [];
          let cx2 = tx, cy2 = ty, cz2 = tz;
          let ok = true;
          for (let i = 0; i < 12; i++) {
            const cb = World.getBlock(cx2, cy2, cz2);
            if (cb === BLOCK.AIR || isLiquid(cb)) break;
            if (!isPistonPushable(cb)) { ok = false; break; }
            chain.push({x:cx2, y:cy2, z:cz2, b:cb});
            cx2 += dx; cy2 += dy; cz2 += dz;
          }
          if (ok) {
            // место после последнего блока цепочки
            const last = chain.length ? chain[chain.length-1] : null;
            const beyond = last ? {x:last.x+dx, y:last.y+dy, z:last.z+dz} : {x:tx, y:ty, z:tz};
            const bb = World.getBlock(beyond.x, beyond.y, beyond.z);
            if ((bb === BLOCK.AIR || isLiquid(bb)) && !intersectsPlayer(beyond.x, beyond.y, beyond.z)) {
              // сдвинуть цепочку на 1 (с конца)
              for (let i = chain.length-1; i >= 0; i--) {
                const it = chain[i];
                World.setBlock(it.x, it.y, it.z, BLOCK.AIR, true);
                World.setBlock(it.x+dx, it.y+dy, it.z+dz, it.b, true);
              }
              pistonExtendedSet.add(k);
              rebuildAround(wx, wz); rebuildAround(tx, tz); rebuildAround(beyond.x, beyond.z);
              playSound('piston');
              spawnParticles(tx + 0.5, ty + 0.5, tz + 0.5, 8, '#9a9a9a');
            }
          }
        }
      } else if (!powered && extended) {
        // задвинуть
        pistonExtendedSet.delete(k);
        rebuildAround(wx, wz); rebuildAround(wx+dx, wz+dz);
        playSound('piston');
      }
      } // for lx/lz/y
    } // for ccz
  } // for ccx
}

// уровень мощности в точке
function redstonePowerAt(x, y, z) {
  return redstonePower.get(ekeyOf(x, y, z)) || 0;
}
function setRedstonePower(x, y, z, p) {
  if (p > 0) redstonePower.set(ekeyOf(x, y, z), p);
  else redstonePower.delete(ekeyOf(x, y, z));
}

// редстоуновый факел «выключен» (тусклый), если его опорный блок запитан.
// Упрощённая модель strong/weak power: опора считается запитанной, если пыль
// лежит НА ней (сильное питание) или в соседних с опорой клетках (слабое).
function redstoneTorchPowered(x, y, z) {
  const fr = World.facing.get(ekeyOf(x, y, z));
  let sx = x, sy = y - 1, sz = z;
  if (fr === FACE_PX) { sx = x - 1; sy = y; sz = z; }
  else if (fr === FACE_NX) { sx = x + 1; sy = y; sz = z; }
  else if (fr === FACE_PZ) { sx = x; sy = y; sz = z - 1; }
  else if (fr === FACE_NZ) { sx = x; sy = y; sz = z + 1; }
  // пыль прямо на опорном блоке — сильное питание
  if (World.getBlock(sx, sy + 1, sz) === BLOCK.REDSTONE_DUST && redstonePowerAt(sx, sy + 1, sz) > 0) return true;
  // пыль в соседних с опорой клетках — слабое питание (как «weak power» в MC)
  const dirs = [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,1,0]];
  for (const d of dirs) {
    if (World.getBlock(sx + d[0], sy + d[1], sz + d[2]) === BLOCK.REDSTONE_DUST &&
        redstonePowerAt(sx + d[0], sy + d[1], sz + d[2]) > 0) return true;
  }
  // питание от пыли в самой клетке опоры быть не может, но прямой сигнал — может
  if (redstonePowerAt(sx, sy, sz) > 0 && World.getBlock(sx, sy, sz) !== BLOCK.REDSTONE_DUST) return true;
  return false;
}

// является ли блок источником сигнала (факел/рычаг/кнопка)
function isRedstoneSource(b) {
  return b === BLOCK.REDSTONE_TORCH || b === BLOCK.LEVER || b === BLOCK.BUTTON;
}
// проводник сигнала
function isRedstoneConductor(b) {
  return b === BLOCK.REDSTONE_DUST;
}

// источник: какая мощность исходит из блока в данной точке
function sourcePowerAt(x, y, z) {
  const b = World.getBlock(x, y, z);
  if (b === BLOCK.LEVER) return leverState(x, y, z).on ? 15 : 0;
  if (b === BLOCK.BUTTON) return buttonState(x, y, z).pressed ? 15 : 0;
  if (b === BLOCK.REDSTONE_TORCH) return redstoneTorchPowered(x, y, z) ? 0 : 15;
  return 0;
}

// пересчёт редстоун-сети в радиусе вокруг точки (x,y,z).
// Простой BFS: источники дают 15, пыль передаёт мощность-1 соседям-пыли, не ниже 0.
let redstoneDirty = false;
let redstoneDirtyCenter = null;
let redstoneTimer = 0; // аккумулятор для троттлинга (не чаще 6 раз/сек)
function markRedstoneDirty(x, y, z) {
  redstoneDirty = true;
  // расширяем область пересчёта, чтобы два независимых изменения за кадр
  // оба попали в пересчёт (раньше учитывался только первый эпицентр)
  if (!redstoneDirtyCenter) redstoneDirtyCenter = { x, y, z };
  else {
    redstoneDirtyCenter.x = (redstoneDirtyCenter.x + x) / 2;
    redstoneDirtyCenter.y = (redstoneDirtyCenter.y + y) / 2;
    redstoneDirtyCenter.z = (redstoneDirtyCenter.z + z) / 2;
  }
}

const RS_RADIUS = 16; // радиус пересчёта вокруг эпицентра (блоков) — уменьшено для производительности
function updateRedstone(dt) {
  if (!redstoneDirty) return;
  // троттлинг: не чаще 6 раз/сек, чтобы не лагать при быстрых переключениях
  redstoneTimer += dt;
  if (redstoneTimer < 0.16) return;
  redstoneTimer = 0;
  redstoneDirty = false;
  const cx = redstoneDirtyCenter ? redstoneDirtyCenter.x : PLAYER.pos.x;
  const cy = redstoneDirtyCenter ? redstoneDirtyCenter.y : PLAYER.pos.y;
  const cz = redstoneDirtyCenter ? redstoneDirtyCenter.z : PLAYER.pos.z;
  redstoneDirtyCenter = null;

  const minX = Math.floor(cx - RS_RADIUS), maxX = Math.floor(cx + RS_RADIUS);
  const minY = Math.max(0, Math.floor(cy - RS_RADIUS)), maxY = Math.min(WORLD_HEIGHT - 1, Math.floor(cy + RS_RADIUS));
  const minZ = Math.floor(cz - RS_RADIUS), maxZ = Math.floor(cz + RS_RADIUS);

  // новая карта мощностей в области
  const newPower = new Map();
  const get = (x,y,z) => newPower.get(ekeyOf(x,y,z)) || 0;
  const setP = (x,y,z,p) => { if (p > 0) newPower.set(ekeyOf(x,y,z), p); };

  // 1) источники
  const queue = []; // {x,y,z,p}
  for (let x = minX; x <= maxX; x++)
    for (let y = minY; y <= maxY; y++)
      for (let z = minZ; z <= maxZ; z++) {
        const b = World.getBlock(x, y, z);
        if (b === BLOCK.LEVER && leverState(x,y,z).on) { setP(x,y,z,15); queue.push({x,y,z,p:15}); }
        else if (b === BLOCK.BUTTON && buttonState(x,y,z).pressed) { setP(x,y,z,15); queue.push({x,y,z,p:15}); }
        else if (b === BLOCK.REDSTONE_TORCH && !redstoneTorchPowered(x,y,z)) { setP(x,y,z,15); queue.push({x,y,z,p:15}); }
      }
  // 2) распространение по пыли (BFS)
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    if (cur.p <= 1) continue;
    const np = cur.p - 1;
    const neigh = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
    for (const d of neigh) {
      const nx = cur.x+d[0], ny = cur.y+d[1], nz = cur.z+d[2];
      if (nx<minX||nx>maxX||ny<minY||ny>maxY||nz<minZ||nz>maxZ) continue;
      if (World.getBlock(nx,ny,nz) !== BLOCK.REDSTONE_DUST) continue;
      if (get(nx,ny,nz) < np) { setP(nx,ny,nz,np); queue.push({x:nx,y:ny,z:nz,p:np}); }
    }
  }
  // 3) сравнить с прежней картой в этой области — собрать изменившиеся чанки
  const changed = new Set();
  const mark = (x,z) => { const c=World.key(Math.floor(x/CHUNK_SIZE),Math.floor(z/CHUNK_SIZE)); changed.add(c); };
  // проверить все точки новой карты
  for (const [k, p] of newPower) {
    if ((redstonePower.get(k) || 0) !== p) {
      const [x,,z] = k.split(',').map(Number); mark(x,z);
    }
  }
  // проверить исчезнувшие
  for (const [k, p] of redstonePower) {
    const [x,y,z] = k.split(',').map(Number);
    if (x<minX||x>maxX||y<minY||y>maxY||z<minZ||z>maxZ) continue;
    if ((newPower.get(k) || 0) !== p) mark(x,z);
  }
  // заменить карту: удалить старые записи в области, добавить новые
  let __rm = 0;
  for (const [k] of redstonePower) {
    const [x,y,z] = k.split(',').map(Number);
    if (x>=minX&&x<=maxX&&y>=minY&&y<=maxY&&z>=minZ&&z<=maxZ) { redstonePower.delete(k); __rm++; }
  }
  for (const [k, p] of newPower) redstonePower.set(k, p);


  // 4) синхронизировать двери: открыть, если рядом есть сигнал
  syncDoorsWithRedstone(minX,maxX,minY,maxY,minZ,maxZ);

  // 5) активировать поршни (толкают/задвигают по изменению сигнала)
  updatePistons(minX, maxX, minZ, maxZ);

  // 5.5) командные блоки: выполнить команду по фронту сигнала
  updateCommandBlocks(minX, maxX, minZ, maxZ);

  // 6) перестроить изменившиеся чанки
  for (const k of changed) {
    const [cx2, cz2] = k.split(',').map(Number);
    for (let dx=-1;dx<=1;dx++) for (let dz=-1;dz<=1;dz++) World.markDirty(cx2+dx, cz2+dz);
  }
}

// ============================================================
//  Командный блок (ранний прототип, как в MC)
//  — ставится только из креатива//give; в выживании неразрушим
//  — ПКМ — ввести команду (без слэша), флаг «Всегда активен»
//  — выполняется по ФРОНТУ редстоун-сигнала (рычаг/кнопка/пыль рядом)
//  — цель команды: @p/@s/@a/@e/@r или ник (см. isTargetToken)
// ============================================================
function isCmdBlockPowered(wx, y, wz) {
  // питание от своей клетки или от соседей (как у поршня)
  if (redstonePowerAt(wx, y, wz) > 0 || sourcePowerAt(wx, y, wz) > 0) return true;
  const neigh = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  for (const d of neigh) {
    const nx = wx + d[0], ny = y + d[1], nz = wz + d[2];
    if (redstonePowerAt(nx, ny, nz) > 0 || sourcePowerAt(nx, ny, nz) > 0) return true;
  }
  return false;
}

// выполнить команду командного блока
function executeCmdBlock(wx, y, wz, st) {
  const cmd = (st && st.cmd || '').trim();
  if (!cmd) {
    addChatMessage('[КБ ' + wx + ',' + y + ',' + wz + '] Команда не задана (ПКМ по блоку)', 'chat-sys');
    return;
  }
  playSound('click');
  addChatMessage('[КБ ' + wx + ',' + y + ',' + wz + '] Выполняю: /' + cmd, 'chat-sys');
  handleChatCommand('/' + cmd.replace(/^\/+/, ''), { fromCmdBlock: true, pos: { x: wx, y, z: wz } });
}

// тикер командных блоков: срабатывание по фронту сигнала (как updatePistons,
// проходит только по чанкам в области пересчёта редстоуна)
function updateCommandBlocks(minX, maxX, minZ, maxZ) {
  if (World.cmdBlocks.size === 0) return;
  const ccxMin = Math.floor(minX / CHUNK_SIZE), ccxMax = Math.floor(maxX / CHUNK_SIZE);
  const cczMin = Math.floor(minZ / CHUNK_SIZE), cczMax = Math.floor(maxZ / CHUNK_SIZE);
  const checked = new Set();
  for (const [k, st] of World.cmdBlocks) {
    const i1 = k.indexOf(','), i2 = k.indexOf(',', i1 + 1);
    const wx = +k.slice(0, i1), y = +k.slice(i1 + 1, i2), wz = +k.slice(i2 + 1);
    if (wx < ccxMin * CHUNK_SIZE - 1 || wx > (ccxMax + 1) * CHUNK_SIZE || wz < cczMin * CHUNK_SIZE - 1 || wz > (cczMax + 1) * CHUNK_SIZE) continue;
    if (checked.has(k)) continue;
    checked.add(k);
    if (st.always) continue; // «Всегда активен» — редстоун не реагирует (как в MC)
    const powered = isCmdBlockPowered(wx, y, wz);
    const was = cmdPoweredSet.has(k);
    if (powered && !was) {
      cmdPoweredSet.add(k);
      executeCmdBlock(wx, y, wz, st);
    } else if (!powered && was) {
      cmdPoweredSet.delete(k);
    }
  }
}

// ---- UI настройки командного блока (модалка) ----
const cmdBlockBoxEl = document.getElementById('cmdBlockBox');
const cmdBlockInputEl = document.getElementById('cmdBlockInput');
const cmdBlockAlwaysEl = document.getElementById('cmdBlockAlways');
const cmdBlockPosEl = document.getElementById('cmdBlockPos');
let cmdBlockUIOpen = false;
let cmdBlockPos = null; // {x,y,z} настраиваемого блока

function openCmdBlockUI(x, y, z) {
  cmdBlockPos = { x, y, z };
  const st = World.cmdBlocks.get(World.ekey(x, y, z)) || { cmd: '', always: false };
  cmdBlockInputEl.value = st.cmd || '';
  cmdBlockAlwaysEl.checked = !!st.always;
  cmdBlockPosEl.textContent = 'Позиция: ' + x + ', ' + y + ', ' + z;
  cmdBlockBoxEl.classList.add('open');
  cmdBlockUIOpen = true;
  document.exitPointerLock();
  setTimeout(() => cmdBlockInputEl.focus(), 30);
  if (typeof updateChatMiniVisibility === 'function') updateChatMiniVisibility();
}
function closeCmdBlockUI() {
  cmdBlockBoxEl.classList.remove('open');
  cmdBlockUIOpen = false;
  cmdBlockPos = null;
  if (overlay.classList.contains('hidden') && !chatOpen && !invOpen && canvas) canvas.requestPointerLock();
  if (typeof updateChatMiniVisibility === 'function') updateChatMiniVisibility();
}
function saveCmdBlockFromUI() {
  if (!cmdBlockPos) return null;
  const k = World.ekey(cmdBlockPos.x, cmdBlockPos.y, cmdBlockPos.z);
  const cmd = cmdBlockInputEl.value.trim().replace(/^\/+/, '').slice(0, 120);
  const always = cmdBlockAlwaysEl.checked;
  const st = { cmd, always };
  if (cmd) World.cmdBlocks.set(k, st); else World.cmdBlocks.delete(k);
  if (typeof requestSave === 'function') requestSave();
  return st;
}
document.getElementById('cmdBlockDone').addEventListener('click', () => {
  const st = saveCmdBlockFromUI();
  const pos = cmdBlockPos;
  closeCmdBlockUI();
  // «Всегда активен» — выполняется один раз при установке (как в MC)
  if (st && st.always && st.cmd && pos) {
    playSound('click');
    addChatMessage('[КБ ' + pos.x + ',' + pos.y + ',' + pos.z + '] Всегда активен — выполняю: /' + st.cmd, 'chat-sys');
    handleChatCommand('/' + st.cmd, { fromCmdBlock: true, pos });
  }
});
document.getElementById('cmdBlockExec').addEventListener('click', () => {
  const st = saveCmdBlockFromUI();
  const pos = cmdBlockPos;
  closeCmdBlockUI();
  if (st && pos) executeCmdBlock(pos.x, pos.y, pos.z, st);
});
document.getElementById('cmdBlockCancel').addEventListener('click', () => closeCmdBlockUI());
cmdBlockInputEl.addEventListener('keydown', (e) => {
  e.stopPropagation();
  if (e.key === 'Enter') document.getElementById('cmdBlockDone').click();
  if (e.key === 'Escape') closeCmdBlockUI();
});

// открыть/закрыть редстоун-двери в зависимости от сигнала поблизости
function syncDoorsWithRedstone(minX,maxX,minY,maxY,minZ,maxZ) {
  for (const [k, st] of World.doorState) {
    const [x,y,z] = k.split(',').map(Number);
    if (x<minX-1||x>maxX+1||y<minY-1||y>maxY+1||z<minZ-1||z>maxZ+1) continue;
    // сигнал от соседних 4 блоков на уровне нижней половины и верхней
    let powered = false;
    const checks = [[x+1,y,z],[x-1,y,z],[x,y,z+1],[x,y,z-1],
                    [x+1,y+1,z],[x-1,y+1,z],[x,y+1,z+1],[x,y+1,z-1],
                    [x,y-1,z]];
    for (const [cx,cy,cz] of checks) {
      const b = World.getBlock(cx,cy,cz);
      if (b === BLOCK.LEVER && leverState(cx,cy,cz).on) { powered = true; break; }
      if (b === BLOCK.BUTTON && buttonState(cx,cy,cz).pressed) { powered = true; break; }
      if (b === BLOCK.REDSTONE_TORCH && !redstoneTorchPowered(cx,cy,cz)) { powered = true; break; }
      if (redstonePowerAt(cx,cy,cz) > 0) { powered = true; break; }
    }
    if (powered !== st.open) {
      st.open = powered;
      // не играем звук, чтобы не спамить при пересчётах
      for (let dx=-1;dx<=1;dx++) for (let dz=-1;dz<=1;dz++) World.markDirty(Math.floor(x/CHUNK_SIZE)+dx, Math.floor(z/CHUNK_SIZE)+dz);
    }
  }
}

// включить свечение руды (при клике/наступании) на 3 сек
function glowRedstoneOre(x, y, z) {
  glowingOre.set(ekeyOf(x, y, z), 3.0);
  rebuildAround(x, z);
  // частицы активации (красные искры)
  spawnParticles(x + 0.5, y + 0.5, z + 0.5, 10, '#ff4030');
}
// тикер свечения руды
function updateGlowingOre(dt) {
  if (glowingOre.size === 0) return;
  const expired = [];
  for (const [k, t] of glowingOre) {
    const nt = t - dt;
    if (nt <= 0) expired.push(k);
    else glowingOre.set(k, nt);
  }
  for (const k of expired) {
    glowingOre.delete(k);
    const [x,,z] = k.split(',').map(Number);
    rebuildAround(x, z);
  }
}

// ============================================================
//  Система частиц (визуальные эффекты: руда, поршень, шаги)
// ============================================================
let particleGroup = null;
function initParticles() {
  if (particleGroup) return;
  particleGroup = new THREE.Group();
  scene.add(particleGroup);
}
function spawnParticles(x, y, z, count, color) {
  if (!particleGroup) initParticles();
  for (let i = 0; i < count; i++) {
    const geo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x + (Math.random()-0.5)*0.4, y + (Math.random()-0.5)*0.4, z + (Math.random()-0.5)*0.4);
    particleGroup.add(m);
    particles.push({
      mesh: m,
      vel: new THREE.Vector3((Math.random()-0.5)*2.5, 1.5 + Math.random()*1.5, (Math.random()-0.5)*2.5),
      life: 0.6 + Math.random()*0.4,
      maxLife: 1.0,
    });
  }
}
function updateParticles(dt) {
  if (particles.length === 0) return;
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      if (particleGroup) particleGroup.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
      particles.splice(i, 1);
      continue;
    }
    p.vel.y -= 6 * dt; // гравитация частиц
    p.mesh.position.x += p.vel.x * dt;
    p.mesh.position.y += p.vel.y * dt;
    p.mesh.position.z += p.vel.z * dt;
    p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
    p.mesh.scale.setScalar(Math.max(0.1, p.life / p.maxLife));
  }
}

// ============================================================
//  Динамические звуки окружения
//  - пещерный эмбиент: под землёй при низком освещении — редкие жуткие звуки
// ============================================================
let caveAmbientTimer = 8 + Math.random() * 12;
function updateAmbientSounds(dt) {
  if (!AudioEngine.ctx || !AudioEngine.enabled) return;
  // только в обычном мире (в Аду своя атмосфера)
  if (World.dim !== 'overworld') return;
  // игрок под землёй? (есть твердый блок над головой)
  const hx = Math.floor(PLAYER.pos.x), hy = Math.floor(PLAYER.pos.y + 2), hz = Math.floor(PLAYER.pos.z);
  let overhead = 0;
  for (let y = hy; y < Math.min(WORLD_HEIGHT, hy + 8); y++) {
    const b = World.getBlock(hx, y, hz);
    if (b !== BLOCK.AIR && !isLiquid(b) && b !== BLOCK.LEAVES) { overhead++; }
  }
  if (overhead < 3) return; // не достаточно глубоко
  // уровень освещения у игрока (грубо: небесного света нет, если над головой блок)
  const lowLight = overhead >= 3;
  if (!lowLight) return;
  caveAmbientTimer -= dt;
  if (caveAmbientTimer <= 0) {
    playSound('cave');
    caveAmbientTimer = 14 + Math.random() * 22; // редкие интервалы (14..36 сек)
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
let _evictTimer = 0; // троттлинг эвикции чанков (раз в ~5 с)
let _chunkScanAcc = 0;               // троттлинг полного скана области прорисовки
let _lastScanPcx = 1e9, _lastScanPcz = 1e9; // чанк игрока на момент прошлого скана

function updateChunks(dt) {
  const pcx = Math.floor(PLAYER.pos.x / CHUNK_SIZE);
  const pcz = Math.floor(PLAYER.pos.z / CHUNK_SIZE);

  // эвикция дальних чанков из памяти (не чаще раза в 5 с — защита от утечки памяти)
  _evictTimer += dt || 0;
  if (_evictTimer > 5) { _evictTimer = 0; World.evictFarChunks(pcx, pcz); }

  // ОПТИМИЗАЦИЯ: полный скан области прорисовки (строковые ключи + Map.get на каждый
  // чанк — при RD=6 это 169 итераций) раньше шёл КАЖДЫЙ кадр. Теперь — только когда
  // игрок перешёл границу чанка либо раз в ~0.12 с. Правки блоков помечают чанки
  // dirty, они подхватятся ближайшим сканом — задержка незаметна.
  _chunkScanAcc += dt || 0;
  if (_chunkScanAcc < 0.12 && pcx === _lastScanPcx && pcz === _lastScanPcz) return;
  _chunkScanAcc = 0;
  _lastScanPcx = pcx; _lastScanPcz = pcz;

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
  // скан теперь редкий (~8/с вместо 60/с), поэтому бюджет на СКАН выше —
  // иначе поток построения новых чанков при беге/полёте заметно бы просел
  let budget = newCount > 4 ? 8 : 4;
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
  if (bb === BLOCK.TORCH) return false;         // факел не мешает движению
  if (isDoor(bb)) return false; // двери обрабатываются отдельно (тонкая AABB)
  if (isBed(bb)) return false;  // кровать низкая — отдельная коллизия (как плита)
  if (bb === BLOCK.REDSTONE_DUST) return false; // пыль плоская, не мешает
  if (bb === BLOCK.LEVER) return false;         // рычаг тонкий
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

// Пул-переменные для устранения per-frame аллокаций (GC-оптимизация)
const _tmpFwd = new THREE.Vector3();
const _tmpRight = new THREE.Vector3();
const _tmpMove = new THREE.Vector3();

function updatePlayer(dt) {
  // креатив: F — переключить полёт
  if (window.__creative && keys['KeyF'] && !PLAYER._fKeyLock) {
    PLAYER._fKeyLock = true;
    PLAYER.flying = !PLAYER.flying;
    if (PLAYER.flying) PLAYER.vel.y = 0;
    showToast(PLAYER.flying ? 'Полёт включён' : 'Полёт выключен');
  }
  if (!keys['KeyF']) PLAYER._fKeyLock = false;
  PLAYER.crouching = !!keys['ShiftLeft'] && !(window.__creative && PLAYER.flying);

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
  // используем пул-переменные вместо new THREE.Vector3 каждый кадр
  const forward = _tmpFwd.set(-Math.sin(PLAYER.yaw), 0, -Math.cos(PLAYER.yaw));
  const right = _tmpRight.set(Math.cos(PLAYER.yaw), 0, -Math.sin(PLAYER.yaw));

  const move = _tmpMove.set(0, 0, 0);
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
    PLAYER.burnTimer = Math.max(PLAYER.burnTimer || 0, 15); // после лавы горишь 15 с (как в MC)
    PLAYER.lavaTick = (PLAYER.lavaTick || 0) + dt;
    if (PLAYER.lavaTick >= 0.5) { PLAYER.lavaTick = 0; damagePlayer(4, "Вы сгорели в лаве", true); } // лава жжёт сильно
  } else if (inFire) {
    PLAYER.burnTimer = Math.max(PLAYER.burnTimer || 0, 0.8);
  }
  // догорание (после выхода из лавы/огня игрок ещё горит)
  if (PLAYER.burnTimer > 0 && !inLava) {
    PLAYER.burnTimer -= dt;
    PLAYER.fireTick = (PLAYER.fireTick || 0) + dt;
    if (PLAYER.fireTick >= 1.0) { PLAYER.fireTick = 0; if (PLAYER.hp > 0) damagePlayer(1, "Вы сгорели", true); }
    // вода тушит огонь
    if (PLAYER.inWater) PLAYER.burnTimer = 0;
  }

  let speed = PLAYER.speed;
  // спринт как в MC: только ВПЕРЁД и при голоде ≥ 6 (в креативе голод не тратится — всегда можно)
  const sprinting = keys['ControlLeft'] && keys['KeyW'] && !PLAYER.crouching && (PLAYER.hunger >= 6 || window.__creative);
  if (sprinting) speed *= PLAYER.sprintMul;
  if (PLAYER.crouching) speed *= 0.45;

  // креатив-полёт: скорость как в MC (~10.9 м/с, со спринтом ~21)
  if (window.__creative && PLAYER.flying) speed = PLAYER.speed * (sprinting ? 4.8 : 2.5);

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
    // креатив-полёт: Space — вверх, Shift — вниз (скорость как в MC, со спринтом быстрее)
    if (window.__creative && PLAYER.flying) {
      const fspd = sprinting ? 16 : 10;
      PLAYER.vel.y = keys['Space'] ? fspd : (keys['ShiftLeft'] ? -fspd : 0);
    } else {
      PLAYER.vel.y -= GRAVITY * dt;
      if (PLAYER.vel.y < -55) PLAYER.vel.y = -55;
      if (keys['Space'] && PLAYER.onGround) {
        PLAYER.vel.y = PLAYER.jumpV;
        PLAYER.onGround = false;
        addExhaustion(0.05); // прыжок тратит голод (ванильное значение)
      }
    }
  }

  // отслеживание высоты падения для урона
  const wasOnGround = PLAYER.onGround;
  if (!PLAYER.onGround && PLAYER.vel.y < 0 && !PLAYER.inLiquid) {
    PLAYER.fallStart = (PLAYER.fallStart === undefined) ? PLAYER.pos.y : Math.max(PLAYER.fallStart, PLAYER.pos.y);
  }
  // в воде/лаве высота падения обнуляется (в MC вода гасит урон от падения)
  if (PLAYER.inLiquid) PLAYER.fallStart = undefined;

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
      damagePlayer(Math.floor(fall - 3), "Вы разбились при падении", true);
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
      const gx = Math.floor(PLAYER.pos.x), gy = Math.floor(PLAYER.pos.y - 0.1), gz = Math.floor(PLAYER.pos.z);
      const groundBlock = World.getBlock(gx, gy, gz);
      playSound('step', groundBlock || BLOCK.DIRT);
      // наступание на редстоуновую руду — свечение
      if (groundBlock === BLOCK.REDSTONE_ORE) glowRedstoneOre(gx, gy, gz);
      // шаг по пыли — шуршание
      if (groundBlock === BLOCK.WATER || groundBlock === BLOCK.WATER_FLOW) playSound('splash');
      addExhaustion(sprinting ? 0.06 : 0.03); // ходьба/бег тратят голод
    }
  }

  // не провалиться сквозь дно мира
  // не провалиться сквозь дно мира — вернуть на точку возрождения/спавн
  if (PLAYER.pos.y < -10) {
    if (PLAYER.spawnPoint && World.dim === 'overworld') PLAYER.pos.set(PLAYER.spawnPoint.x, PLAYER.spawnPoint.y, PLAYER.spawnPoint.z);
    else spawnPlayer();
    PLAYER.vel.set(0,0,0);
    PLAYER.fallStart = undefined;
  }
}

// ---- Кислород / утопление ----
// ---- Голод, регенерация, урон ----
function updateSurvival(dt) {
  // Креатив: ни голода, ни регенерации, ни урона от истощения (parity MC)
  if (window.__creative) {
    PLAYER.hunger = PLAYER.maxHunger;
    PLAYER.exhaustion = 0;
    return;
  }
  // «Голод» после гнилой плоти: 30 с голод тает заметно быстрее (парити MC)
  if ((PLAYER.foodPoisonT || 0) > 0) {
    PLAYER.foodPoisonT -= dt;
    PLAYER.exhaustion += dt * 0.9; // ~13 единиц истощения за 30 с = ~3 голода
  }
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
      if (PLAYER.hp > 1) damagePlayer(1, "Вы умерли от голода"); // голод не убивает до 1 hp (как в normal)
    }
  } else { PLAYER.starveTimer = 0; }

  if (PLAYER.damageFlash > 0) PLAYER.damageFlash = Math.max(0, PLAYER.damageFlash - dt * 2);
}

// добавить истощения (расход голода)
function addExhaustion(v) { if (window.__creative) return; PLAYER.exhaustion += v; }

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
function damagePlayer(amount, reason, ignoreArmor) {
  if (PLAYER.dead) return;             // уже мертвы — больше не получаем урон (фикс лишнего догорания)
  if (window.__creative) return;       // креатив: игрок неуязвим (как в MC)
  // броня поглощает часть урона (как в MC: каждое очко ~4% защиты),
  // но НЕ защищает от лавы/огня/падения/утопления (как в MC)
  if (!ignoreArmor) {
    const ap = totalArmorPoints();
    if (ap > 0) amount = amount * (1 - Math.min(0.8, ap * 0.04));
  }
  amount = Math.max(0, amount);
  PLAYER.hp = Math.max(0, PLAYER.hp - amount);
  PLAYER.damageFlash = 1;
  playSound('hurt');
  if (PLAYER.hp <= 0) onDeath(reason);
}

// Смерть: дропнуть весь инвентарь (как в MC), остановить симуляцию, показать экран
function onDeath(reason) {
  if (PLAYER.dead) return;
  PLAYER.dead = true;
  PLAYER.vel.set(0, 0, 0);
  PLAYER.burnTimer = 0;                // погасить горение, чтобы не «доуронивало»
  PLAYER.damageFlash = 0;
  // дроп инвентаря на землю (в MC без keepInventory всё выпадает)
  for (let i = 0; i < TOTAL_SLOTS; i++) {
    const s = slots[i];
    if (s) {
      const dx = (Math.random()-0.5)*1.6, dz = (Math.random()-0.5)*1.6;
      spawnDrop(s.id, PLAYER.pos.x + dx, PLAYER.pos.y + 0.8, PLAYER.pos.z + dz, s.count);
      slots[i] = null;
    }
  }
  // сетка крафта и курсор
  for (let i = 0; i < craftSlots.length; i++) {
    const s = craftSlots[i];
    if (s) { spawnDrop(s.id, PLAYER.pos.x, PLAYER.pos.y + 0.8, PLAYER.pos.z, s.count); craftSlots[i] = null; }
  }
  if (cursorItem) { spawnDrop(cursorItem.id, PLAYER.pos.x, PLAYER.pos.y + 0.8, PLAYER.pos.z, cursorItem.count); cursorItem = null; }
  // броня падает тоже
  for (const sl of ['helmet','chestplate','leggings','boots']) {
    const a = PLAYER.armor[sl];
    if (a) { spawnDrop(a.id, PLAYER.pos.x, PLAYER.pos.y + 0.8, PLAYER.pos.z); PLAYER.armor[sl] = null; }
  }
  refreshUI();
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
  // умерли в Аду — возврат в обычный мир (фикс: раньше respawn использовал
  // генератор рельефа оверворлда внутри Ада и ставил игрока в незерак/лаву)
  if (World.dim !== 'overworld') {
    teleportDimension('overworld');
  }
  // если есть точка возрождения (кровать) в обычном мире — проверить, цела ли кровать
  if (PLAYER.spawnPoint && World.dim === 'overworld') {
    const sp = PLAYER.spawnPoint;
    let bedNear = false;
    for (let dx = -1; dx <= 1 && !bedNear; dx++) for (let dz = -1; dz <= 1 && !bedNear; dz++) for (let dy = -1; dy <= 1 && !bedNear; dy++) {
      if (isBed(World.getBlock(Math.floor(sp.x) + dx, Math.floor(sp.y) + dy, Math.floor(sp.z) + dz))) bedNear = true;
    }
    if (bedNear) {
      PLAYER.pos.set(sp.x, sp.y, sp.z);
    } else {
      // кровать уничтожена — «Точка возрождения пропала» (как в MC)
      showToast('Точка возрождения потеряна!');
      PLAYER.spawnPoint = null;
      spawnPlayer();
    }
  } else {
    spawnPlayer();
  }
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
  consumeHeldItem(slot);
  // если был старый предмет — вернуть в инвентарь (не терять!); не влез — под ноги
  if (prev) {
    if (!addToInventory(prev.id, 1, prev.dur)) spawnDrop(prev.id, PLAYER.pos.x, PLAYER.pos.y + 0.5, PLAYER.pos.z);
  }
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
  consumeHeldItem(slot);
  // Гнилая плоть: 80% шанс «Голода» (как в MC) — голод тает быстрее 30 секунд
  if (slot.id === ITEM.ROTTEN_FLESH && Math.random() < 0.8) {
    PLAYER.foodPoisonT = 30;
    showToast('Вы отравились гнилой плотью…');
  }
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
        damagePlayer(2, "Вы утонули", true);
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

  // сохранить сущности покидаемого измерения в его стор (в т.ч. лодки — фикс: раньше исчезали)
  captureDimEntities();

  // выгрузить меши текущего измерения
  for (const [, mesh] of loadedMeshes) { scene.remove(mesh); disposeGroup(mesh); }
  loadedMeshes.clear();
  // очистить сущности (мобы/дропы/лодки уже сняты в стор — освобождаем геометрию)
  for (const p of mobs) { scene.remove(p.mesh); disposeGroup(p.mesh); } mobs.length = 0;
  for (const d of drops) { scene.remove(d.mesh); disposeGroup(d.mesh); } drops.length = 0;
  for (const b of boats) { scene.remove(b.mesh); disposeGroup(b.mesh); } boats.length = 0;
  PLAYER.riding = null;
  LiquidSim.queue.length = 0; LiquidSim.inQueue.clear(); LiquidSim.changedChunks.clear();
  FireSim.clear();
  fallingSand.length = 0; sandCheckQueue.length = 0; sandInQueue.clear();

  // переключить измерение
  World.setDimension(target);
  // сбросить состояние редстоуна/свечения для нового измерения
  resetRedstoneState();
  // восстановить сущности нового измерения (если были)
  restoreDimEntities();

  // координаты-кандидаты назначения: в Аду делим X/Z на 8 (как в Minecraft)
  let tx, tz;
  if (target === 'nether') { tx = Math.floor(PLAYER.pos.x / 8); tz = Math.floor(PLAYER.pos.z / 8); }
  else { tx = Math.floor(PLAYER.pos.x * 8); tz = Math.floor(PLAYER.pos.z * 8); }
  let ty;
  if (target === 'nether') {
    // искать площадку СНИЗУ ПОТОЛКА Ада (потолок из незерака/бедрока начинается
    // не ниже NETHER_CEIL_MIN — раньше поиск мог высадить игрока на крыше Ада)
    ty = 24 + DEPTH; for (let y = NETHER_CEIL_MIN - 2; y > 20; y--) { if (World.getBlock(tx,y,tz)===BLOCK.AIR && World.getBlock(tx,y-1,tz)!==BLOCK.AIR && !isLiquid(World.getBlock(tx,y-1,tz))) { ty = y; break; } }
  } else {
    ty = terrainHeight(tx, tz) + 1;
  }

  // 1) Если в целевом измерении УЖЕ есть портал поблизости — идём к нему (НЕ строим обсидиан -> нет дюпа)
  let arrival = findNearestPortal(target, tx, ty, tz, target === 'overworld' ? 128 : 16);
  if (arrival) {
    // безопасная высадка: ищем свободную площадку у портала (фикс: раньше
    // телепорт мог посадить игрока внутрь портальных блоков или в стену)
    const spot = findSafePortalExit(arrival.x, arrival.y, arrival.z);
    PLAYER.pos.set(spot.x, spot.y, spot.z);
  } else {
    // 2) Иначе строим площадку-портал ОДИН раз и регистрируем её
    buildArrivalPortal(tx, ty, tz);
    registerPortal(tx, ty, tz);
    PLAYER.pos.set(tx + 1.5, ty, tz + 1.5);  // встать рядом с порталом, не в нём
  }
  PLAYER.vel.set(0,0,0);
  PLAYER._portalT = 0; PLAYER._porting = true; // не телепортироваться сразу обратно

  showToast(target === 'nether' ? 'Добро пожаловать в Ад!' : 'Вы вернулись в обычный мир');

  // предзагрузить чанки вокруг и перестроить меши, затем снять флаг
  const pcx = Math.floor(PLAYER.pos.x / CHUNK_SIZE), pcz = Math.floor(PLAYER.pos.z / CHUNK_SIZE);
  for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++)
    for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++)
      World.getChunk(pcx+dx, pcz+dz);
  _lastScanPcx = 1e9; // форсировать полный скан (троттлинг мог бы пропустить этот вызов)
  updateChunks(0);
  _teleporting = false;
  // синхронизировать редстоун в новом измерении (поршни/пыль/двери)
  markRedstoneDirty(Math.floor(PLAYER.pos.x), Math.floor(PLAYER.pos.y), Math.floor(PLAYER.pos.z));
  WorldManager.save();
}
startWorldLoading._gen = 0;

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

  // показываем полосы в игре; в КРЕАТИВЕ полос нет (parity MC)
  const inGame = gameStarted && overlay.classList.contains('hidden') && !window.__creative;
  statusBarsEl.classList.toggle('on', inGame);
  if (!inGame) { _lastStatus = ''; return; }

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
let debugOpen = false; // F3-экран выключен по умолчанию (как в MC)
function updateHUD(t) {
  // F3-экран: ТОЛЬКО координаты и FPS (остальное убрано из игрового HUD).
  // Когда закрыт — innerHTML не трогаем вовсе (экономия DOM-обновлений).
  if (debugOpen) {
    hudEl.textContent =
      `XYZ: ${PLAYER.pos.x.toFixed(2)} / ${PLAYER.pos.y.toFixed(2)} / ${PLAYER.pos.z.toFixed(2)}\n` +
      `FPS: ${fps}`;
  }
  // всплывающая подсказка с названием блока под прицелом
  const tip = document.getElementById('blockTooltip');
  if (tip) {
    if (t && t.block !== BLOCK.AIR) {
      const held = activeItem();
      let txt = BLOCK_NAMES[t.block] || '';
      if (held && held.id && BLOCK_NAMES[held.id]) {
        txt += '  ·  ' + BLOCK_NAMES[held.id];
      }
      tip.textContent = txt;
      tip.classList.add('on');
    } else {
      tip.classList.remove('on');
    }
  }
  // индикатор времени суток скрыт по запросу (убран из HUD)
}

// ============================================================
//  Главный цикл
// ============================================================
let last = performance.now();
let _sunFollowX = 1e9, _sunFollowY = 1e9, _sunFollowZ = 1e9;
let _shadowAcc = 0;
// ОПТИМИЗАЦИЯ: переиспользуемые векторы/цвета главного цикла — раньше каждый кадр
// аллоцировалось до 5 объектов THREE (Vector3/Color), зря дёргая GC
const _camDir = new THREE.Vector3(), _camTarget = new THREE.Vector3();
const _skyDay = new THREE.Color(0x87ceeb), _skyNight = new THREE.Color(0x0a1026);
const _skyDusk = new THREE.Color(0xd9763c), _skyTmp = new THREE.Color();
function loop(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.1) dt = 0.1; // ограничить спайки

  // пока мир не выбран — ничего не симулируем и не рисуем
  if (!gameStarted) { requestAnimationFrame(loop); return; }

  let t = null, tComputed = false; // цель под прицелом — ОДИН raycast на кадр
  if (!PLAYER.dead && overlay.classList.contains('hidden') && !invOpen && !chatOpen) {
    if (sleepTransition) {
      // игрок спит: не ходит и не копает (как в MC — лежит в кровати)
      if (mining.active) resetMining();
      updateOxygen(dt);
      updateSurvival(dt);
      updateDrops(dt);
    } else {
      updatePlayer(dt);
      updateOxygen(dt);
      updateSurvival(dt);
      updateDrops(dt);
      t = getTargetBlock(); tComputed = true;
      updateMining(dt, t); // переиспользуем тот же луч (раньше — второй raycast)
    }
  } else if (mining.active) {
    resetMining();
  }

  // одиночная игра: в меню (пауза) симуляция мира останавливается, как в MC
  const paused = !overlay.classList.contains('hidden');
  if (!paused) {
    LiquidSim.update(dt);
    FireSim.update(dt);
    updateFallingSand(dt);
    updateLeafDecay(dt);
    updateFurnaces(dt);
    updateDayNight(dt);
    updateSleepTransition(dt);
    updateGlowingOre(dt);
    updateButtons(dt);
    updateRedstone(dt);
    updateAmbientSounds(dt);
  }
  updateAnimatedTextures(dt);
  updateClouds(dt);
  updateParticles(dt);
  if (!PLAYER.dead && overlay.classList.contains('hidden')) updateBoats(dt);
  if (!invOpen && overlay.classList.contains('hidden')) updateMobs(dt);
  updateChunks(dt);

  // солнце и облака не видны в Аду
  const overworldSky = World.dim === 'overworld';
  sunDisc.visible = overworldSky;
  cloudGroup.visible = overworldSky;
  // дневной фактор (0 ночь .. 1 день) управляет яркостью солнца/амбиента/неба
  const dl = overworldSky ? daylight() : 1;
  if (overworldSky) {
    sun.intensity = (SHADOWS_ON ? 0.9 : 0.85) * (0.15 + dl * 0.85);
    ambient.intensity = (SHADOWS_ON ? 0.5 : 0.55) * (0.35 + dl * 0.65);
  } else {
    ambient.intensity = 0.95;
  }
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
  _camDir.set(
    -Math.sin(PLAYER.yaw) * Math.cos(PLAYER.pitch),
    Math.sin(PLAYER.pitch),
    -Math.cos(PLAYER.yaw) * Math.cos(PLAYER.pitch)
  );
  camera.lookAt(_camTarget.copy(camera.position).add(_camDir));

  // подсветка цели (в активной игре t уже вычислен; в паузе/меню — луч от стоячей камеры)
  if (!tComputed) t = getTargetBlock();
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
    // цвет неба плавно меняется день->закат->ночь (цвета — предсозданные константы)
    let skyCol;
    if (dl > 0.35) {
      skyCol = _skyTmp.copy(_skyNight).lerp(_skyDay, Math.min(1, (dl - 0.35) / 0.45));
    } else {
      // сумерки: подмешиваем оранжевый у горизонта
      const k = dl / 0.35;
      skyCol = _skyTmp.copy(_skyNight).lerp(_skyDusk, k * 0.6);
    }
    scene.fog.color.copy(skyCol);
    scene.fog.near = RENDER_DISTANCE * CHUNK_SIZE * 0.6;
    scene.fog.far = RENDER_DISTANCE * CHUNK_SIZE;
    scene.background.copy(skyCol);
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
    // флаги читов и правил: из индекса (быстро), для старых миров — из данных (медленно, один раз)
    let cheatsOn = !!w.cheats;
    let legacyOn = !!w.legacy;
    let creativeOn = false;
    try {
      const d = JSON.parse(localStorage.getItem(WorldManager.LS_PREFIX + w.name));
      // режим игры читаем всегда — он может меняться /gamemode в игре
      creativeOn = !!(d && d.gameMode === 'creative');
      if (w.cheats === undefined || w.legacy === undefined) {
        if (w.cheats === undefined) cheatsOn = !!(d && d.cheatsEnabled);
        if (w.legacy === undefined) legacyOn = !!(d && d.rules && d.rules.legacyDurability);
        w.cheats = cheatsOn; w.legacy = legacyOn; // закешировать в индекс
        const arr1 = WorldManager.list();
        const w1 = arr1.find(x => x.name === w.name);
        if (w1) { w1.cheats = cheatsOn; w1.legacy = legacyOn; WorldManager.saveIndex(arr1); }
      }
    } catch (e) {}
    meta.textContent = 'Сид: ' + w.seed + ' · ' + timeAgo(w.updated)
      + (creativeOn ? ' · креатив ✓' : '') + (cheatsOn ? ' · читы ✓' : '') + (legacyOn ? ' · legacy-прочность ✓' : '');
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
  const creative = document.getElementById('creativeToggle').checked;
  // креатив включает читы (как в MC — команды доступны всегда в креативных мирах)
  const cheats = document.getElementById('cheatsToggle').checked || creative;
  const legacyDur = document.getElementById('legacyDurToggle').checked;
  WorldManager.create(name, seed, cheats, { legacyDurability: legacyDur }, creative);
});

// ---- Навигация главного меню: Играть -> подменю миров -> Назад ----
const mainMenuBox = document.getElementById('mainMenuBox');
const worldsMenuBox = document.getElementById('worldsMenuBox');
document.getElementById('playBtn').addEventListener('click', () => {
  mainMenuBox.style.display = 'none';
  worldsMenuBox.style.display = 'block';
  renderWorldList();
});
document.getElementById('backToMainBtn').addEventListener('click', () => {
  worldsMenuBox.style.display = 'none';
  mainMenuBox.style.display = 'block';
});
// обновление подписи чита-тумблера
const cheatsToggleEl = document.getElementById('cheatsToggle');
const cheatsLabelEl = document.getElementById('cheatsLabel');
function updateCheatsLabel() {
  cheatsLabelEl.textContent = cheatsToggleEl.checked ? 'Читы: Вкл' : 'Читы: Выкл';
}
cheatsToggleEl.addEventListener('change', updateCheatsLabel);
updateCheatsLabel();
// подпись тумблера правила «Legacy-прочность»
const legacyDurToggleEl = document.getElementById('legacyDurToggle');
const legacyDurLabelEl = document.getElementById('legacyDurLabel');
function updateLegacyDurLabel() {
  legacyDurLabelEl.textContent = legacyDurToggleEl.checked ? 'Legacy-прочность: Вкл' : 'Legacy-прочность: Выкл';
}
legacyDurToggleEl.addEventListener('change', updateLegacyDurLabel);
updateLegacyDurLabel();

// подпись тумблера режима (креатив/выживание) при создании мира
const creativeToggleEl = document.getElementById('creativeToggle');
const creativeLabelEl = document.getElementById('creativeLabel');
function updateCreativeLabel() {
  creativeLabelEl.textContent = creativeToggleEl.checked ? 'Режим: Креатив' : 'Режим: Выживание';
  // при выборе креатива читы включаются автоматически (как в MC)
  if (creativeToggleEl.checked) {
    cheatsToggleEl.checked = true;
    updateCheatsLabel();
  }
}
creativeToggleEl.addEventListener('change', updateCreativeLabel);
updateCreativeLabel();

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

// пауза открыта ИЗ ИГРЫ (мир загружен и стоит на паузе).
// Если false — меню открыто из главного меню, «продолжать» нечего.
let pausedFromGame = false;

// открыть меню (пауза + менеджер миров)
function openMenu() {
  if (!gameStarted) return;
  WorldManager.save();
  document.exitPointerLock();
  if (invOpen) toggleInventory();
  overlay.classList.remove('hidden');
  pausedFromGame = true; // мир загружен — пауза из игры
  // «Продолжить» доступно только когда есть загруженный мир
  document.getElementById('resumeBtn').style.display = 'block';
  // при паузе из игры — показываем подменю миров (чтобы можно было переключиться/создать)
  mainMenuBox.style.display = 'none';
  worldsMenuBox.style.display = 'block';
  renderWorldList();
  if (typeof updateChatMiniVisibility === 'function') updateChatMiniVisibility();
}

// вернуться в мир БЕЗ перезагрузки: скрыть меню и вернуть управление мышью
function resumeGame() {
  if (!pausedFromGame) return; // мир не загружен (главное меню) — продолжать нечего
  pausedFromGame = false;
  document.getElementById('resumeBtn').style.display = 'none';
  overlay.classList.add('hidden');
  if (typeof updateChatMiniVisibility === 'function') updateChatMiniVisibility();
  if (!PLAYER.dead) canvas.requestPointerLock(); // вернуть захват мыши (как после респавна)
}

document.getElementById('resumeBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  resumeGame();
});

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
  // выйти в меню; при возврате в мир игрок возродится у точки спавна
  PLAYER.dead = false;
  PLAYER.hp = PLAYER.maxHp; PLAYER.hunger = PLAYER.maxHunger;
  PLAYER.oxygen = PLAYER.maxOxygen; PLAYER.burnTimer = 0; PLAYER.vel.set(0,0,0);
  if (World.dim !== 'overworld') teleportDimension('overworld');
  if (PLAYER.spawnPoint && World.dim === 'overworld') PLAYER.pos.set(PLAYER.spawnPoint.x, PLAYER.spawnPoint.y, PLAYER.spawnPoint.z);
  else spawnPlayer();
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
  // чат: T или / открывают окно ввода
  if (!chatOpen && !invOpen && !cmdBlockUIOpen && (e.code === 'KeyT' || (e.key === '/' && e.code !== 'NumpadDivide'))) {
    e.preventDefault();
    openChat(e.key === '/');
    return;
  }
  if (e.code === 'KeyO') {
    if (WorldManager.save()) showSaveToast();
  }
  if (e.code === 'Escape') {
    if (chatOpen) { closeChat(); return; }
    if (cmdBlockUIOpen) { closeCmdBlockUI(); return; } // закрыть настройку командного блока
    if (PLAYER.dead) return;          // на экране смерти Esc ничего не делает
    if (invOpen) toggleInventory();   // открыт инвентарь -> закрыть его
    else if (!overlay.classList.contains('hidden') && pausedFromGame) {
      resumeGame();                   // меню открыто из игры -> сразу вернуться в мир
    }
    else openMenu();                  // иначе -> меню/пауза
  }
});

// ============================================================
//  Чат (T / /) — окно ввода + лог сообщений
// ============================================================
const chatBoxEl = document.getElementById('chatBox');
const chatLogEl = document.getElementById('chatLog');
const chatInputEl = document.getElementById('chatInput');
const chatMiniEl = document.getElementById('chatMini');
let chatOpen = false;
let chatHistory = []; // последние сообщения {text, cls}
const CHAT_HISTORY_MAX = 8;

// ---- Консольные команды (доступны только при включённых читах мира) ----
// Английские алиасы имён для /give (локализация не нужна — это команды)
const GIVE_ALIASES = {
  stone: BLOCK.STONE, dirt: BLOCK.DIRT, grass: BLOCK.GRASS, sand: BLOCK.SAND,
  gravel: BLOCK.GRAVEL, wood: BLOCK.WOOD, log: BLOCK.WOOD, leaves: BLOCK.LEAVES,
  planks: BLOCK.PLANKS, sticks: ITEM.STICK, stick: ITEM.STICK, crafting_table: BLOCK.CRAFTING_TABLE,
  cobblestone: BLOCK.COBBLESTONE, glass: BLOCK.GLASS, furnace: BLOCK.FURNACE,
  chest: BLOCK.CHEST, door: ITEM.DOOR, coal: ITEM.COAL, charcoal: ITEM.CHARCOAL,
  iron_ingot: ITEM.IRON_INGOT, copper_ingot: ITEM.COPPER_INGOT, diamond: ITEM.DIAMOND,
  torch: BLOCK.TORCH, bucket: ITEM.BUCKET, water_bucket: ITEM.WATER_BUCKET, lava_bucket: ITEM.LAVA_BUCKET,
  flint: ITEM.FLINT, flint_and_steel: ITEM.FLINT_AND_STEEL, boat: ITEM.BOAT,
  bread: null, apple: null, feather: ITEM.FEATHER, leather: ITEM.LEATHER,
  wool: BLOCK.WOOL, bed: BLOCK.BED_FOOT, redstone: ITEM.REDSTONE, obsidian: BLOCK.OBSIDIAN,
  command_block: BLOCK.COMMAND_BLOCK, cmd_block: BLOCK.COMMAND_BLOCK,
  sword: ITEM.WOODEN_SWORD, pickaxe: ITEM.WOODEN_PICKAXE, axe: ITEM.WOODEN_AXE, shovel: ITEM.WOODEN_SHOVEL,
  shears: ITEM.SHEARS,
  // инструменты по префиксам
  wooden_pickaxe: ITEM.WOODEN_PICKAXE, wooden_axe: ITEM.WOODEN_AXE, wooden_shovel: ITEM.WOODEN_SHOVEL, wooden_sword: ITEM.WOODEN_SWORD,
  stone_pickaxe: ITEM.STONE_PICKAXE, stone_axe: ITEM.STONE_AXE, stone_shovel: ITEM.STONE_SHOVEL, stone_sword: ITEM.STONE_SWORD,
  copper_pickaxe: ITEM.COPPER_PICKAXE, copper_axe: ITEM.COPPER_AXE, copper_shovel: ITEM.COPPER_SHOVEL, copper_sword: ITEM.COPPER_SWORD,
  iron_pickaxe: ITEM.IRON_PICKAXE, iron_axe: ITEM.IRON_AXE, iron_shovel: ITEM.IRON_SHOVEL, iron_sword: ITEM.IRON_SWORD,
  diamond_pickaxe: ITEM.DIAMOND_PICKAXE, diamond_axe: ITEM.DIAMOND_AXE, diamond_shovel: ITEM.DIAMOND_SHOVEL, diamond_sword: ITEM.DIAMOND_SWORD,
  leather_helmet: ITEM.LEATHER_HELMET, leather_chestplate: ITEM.LEATHER_CHESTPLATE, leather_leggings: ITEM.LEATHER_LEGGINGS, leather_boots: ITEM.LEATHER_BOOTS,
  iron_helmet: ITEM.IRON_HELMET, iron_chestplate: ITEM.IRON_CHESTPLATE, iron_leggings: ITEM.IRON_LEGGINGS, iron_boots: ITEM.IRON_BOOTS,
  diamond_helmet: ITEM.DIAMOND_HELMET, diamond_chestplate: ITEM.DIAMOND_CHESTPLATE, diamond_leggings: ITEM.DIAMOND_LEGGINGS, diamond_boots: ITEM.DIAMOND_BOOTS,
  porkchop: ITEM.PORK_RAW, cooked_porkchop: ITEM.PORK_COOKED, beef: ITEM.BEEF_RAW, cooked_beef: ITEM.BEEF_COOKED,
  chicken: ITEM.CHICKEN_RAW, cooked_chicken: ITEM.CHICKEN_COOKED,
  rotten_flesh: ITEM.ROTTEN_FLESH, zombie_flesh: ITEM.ROTTEN_FLESH,
};

function resolveGiveId(nameOrId) {
  if (/^-?\d+$/.test(nameOrId)) {
    const id = parseInt(nameOrId, 10);
    if (BLOCK_NAMES[id] !== undefined) return id;
    return null;
  }
  const key = String(nameOrId).toLowerCase();
  if (GIVE_ALIASES[key] !== undefined && GIVE_ALIASES[key] !== null) return GIVE_ALIASES[key];
  // поиск по русскому имени из BLOCK_NAMES
  for (const [id, nm] of Object.entries(BLOCK_NAMES)) {
    if (nm.toLowerCase() === key) return +id;
  }
  return null;
}

// ---- Таргетинг команд: @-селекторы и ник (для команд, действующих на игрока) ----
// Single-player: все селекторы (@p/@s/@a/@e/@r) разрешаются в игрока.
// Ник сравнивается регистронезависимо с никнеймом из главного меню.
function isTargetToken(tok) {
  if (tok === undefined || tok === null) return false;
  const t = String(tok).toLowerCase();
  if (t === '@p' || t === '@s' || t === '@a' || t === '@e' || t === '@r') return true;
  const nick = (getPlayerNick() || '').toLowerCase();
  return !!nick && t === nick;
}
// разрешить цель: возвращает true (цель = игрок) или выводит ошибку и возвращает false
function resolveCommandTarget(tok, prefix) {
  if (isTargetToken(tok)) return true;
  addChatMessage((prefix || '') + 'Цель не найдена: ' + tok + ' (доступны @p, @s, @a, @e, @r или ник)', 'chat-sys');
  return false;
}

// Переключение игрового режима (выживание/креатив) — используется /gamemode,
// командным блоком и экраном создания мира
function setGameMode(creative, announce) {
  window.__creative = !!creative;
  if (window.__creative) {
    // при входе в креатив самочувствие игрока не должно висеть «раненым/голодным»
    PLAYER.hp = PLAYER.maxHp;
    PLAYER.hunger = PLAYER.maxHunger;
    PLAYER.oxygen = PLAYER.maxOxygen;
    PLAYER.burnTimer = 0;
    PLAYER.exhaustion = 0;
  } else {
    PLAYER.flying = false; // выход из креатива выключает полёт (как в MC)
  }
  if (typeof requestSave === 'function') requestSave();
  if (announce !== false) {
    addChatMessage(window.__creative
      ? 'Креатив-режим: мгновенное ломание без дропа, бесконечные предметы, полёт (двойной пробел вкл/выкл, Space — вверх, Shift — вниз), E — креатив-инвентарь, урона и голода нет'
      : 'Режим выживания', 'chat-sys');
  }
  if (typeof refreshUI === 'function') refreshUI();
}

function handleChatCommand(msg, opts) {
  opts = opts || {};
  const fromCB = !!opts.fromCmdBlock; // выполняется командным блоком — чит-флаг не нужен
  const cbPrefix = fromCB ? '[КБ] ' : '';
  const parts = msg.slice(1).trim().split(/\s+/);
  const cmd = (parts[0] || '').toLowerCase();
  const args = parts.slice(1);

  const helpText = () => {
    addChatMessage('Команды (нужны читы в мире): /time set day|night|noon|midnight|<0-1>, ' +
      '/tp [цель] <x> <y> <z> (~ — относительно), /give [цель] <имя|id> [кол-во], /seed, /kill [цель], /clear [цель], /gamemode s|c [цель]', 'chat-sys');
    addChatMessage('Цель: @p (ближайший), @s (сам), @a/@e (все), @r (случайный) или ник. Пример: /tp @p ~ ~10 ~', 'chat-sys');
  };

  if (cmd === 'help' || cmd === '?') { helpText(); return; }
  if (!fromCB && !WorldManager.cheatsEnabled) {
    addChatMessage('Команды заблокированы: читы выключены для этого мира. /help для справки.', 'chat-sys');
    return;
  }

  if (cmd === 'time') {
    // /time set day|night|noon|midnight|<число 0..1>
    const sub = (args[0] || '').toLowerCase();
    const val = (args[1] || '').toLowerCase();
    // ВАЖНО: настоящая полночь (daylight=0) — это time 0.0, а 0.75 — только миг заката.
    // Раньше night ставил 0.75: «ночь» оставалась светлой (daylight 0.5) — не работали
    // ни сон, ни спавн зомби. Теперь night/midnight — реальная темнота.
    const map = { day: 0.25, noon: 0.5, night: 0.0, midnight: 0.0, sunrise: 0.25, sunset: 0.75 };
    let t = null;
    if (sub === 'set') {
      if (map[val] !== undefined) t = map[val];
      else if (/^[0-9.]+$/.test(val)) t = Math.max(0, Math.min(0.999, parseFloat(val)));
    }
    if (t === null) { addChatMessage('Использование: /time set day|night|noon|midnight|<0-1>', 'chat-sys'); return; }
    // смена времени во сне — отменяем сон (иначе переход сна перетирал бы время)
    if (sleepTransition) {
      PLAYER.pos.set(sleepTransition.camFromX, sleepTransition.camFromY, sleepTransition.camFromZ);
      endSleepTransition();
    }
    DAY.time = t;
    DAY_LIGHT_UNIFORM.value = skyFactor(); // мгновенно и без перестройки чанков
    addChatMessage('Время установлено: ' + val, 'chat-sys');
    return;
  }

  if (cmd === 'tp') {
    // /tp [цель] <x> <y> <z> (~ — относительно текущей позиции игрока)
    // Цель: @-селектор или ник; без цели — телепортируется сам игрок
    let coords = args;
    if (isTargetToken(args[0])) {
      if (!resolveCommandTarget(args[0], cbPrefix)) return;
      coords = args.slice(1);
    } else if (fromCB) {
      // командный блок без цели действует на ближайшего игрока (@p, как в MC)
    }
    if (coords.length < 3) { addChatMessage(cbPrefix + 'Использование: /tp [цель] <x> <y> <z> (~ — относительно)', 'chat-sys'); return; }
    const rel = (a, cur) => a === '~' ? cur : (String(a).startsWith('~') ? cur + parseFloat(a.slice(1) || '0') : parseFloat(a));
    const nx = rel(coords[0], PLAYER.pos.x), ny = rel(coords[1], PLAYER.pos.y), nz = rel(coords[2], PLAYER.pos.z);
    if (![nx, ny, nz].every(Number.isFinite)) { addChatMessage(cbPrefix + 'Неверные координаты', 'chat-sys'); return; }
    PLAYER.pos.set(nx, Math.max(1, Math.min(WORLD_HEIGHT - 2, ny)), nz);
    PLAYER.vel.set(0, 0, 0);
    PLAYER.fallStart = undefined;
    addChatMessage(cbPrefix + `Телепорт: ${nx.toFixed(1)}, ${PLAYER.pos.y.toFixed(1)}, ${nz.toFixed(1)}`, 'chat-sys');
    return;
  }

  if (cmd === 'give') {
    // /give [цель] <имя|id> [кол-во]
    let rest = args;
    if (isTargetToken(args[0])) {
      if (!resolveCommandTarget(args[0], cbPrefix)) return;
      rest = args.slice(1);
    }
    if (rest.length < 1) { addChatMessage(cbPrefix + 'Использование: /give [цель] <имя|id> [кол-во]', 'chat-sys'); return; }
    const id = resolveGiveId(rest[0]);
    if (id === null) { addChatMessage(cbPrefix + 'Неизвестный предмет: ' + rest[0], 'chat-sys'); return; }
    let n = 1;
    if (rest[1] && /^[0-9]+$/.test(rest[1])) n = Math.max(1, Math.min(64 * 9, parseInt(rest[1], 10)));
    if (addToInventory(id, n)) addChatMessage(cbPrefix + `Выдано: ${BLOCK_NAMES[id] || id} ×${n}`, 'chat-sys');
    else { addChatMessage(cbPrefix + 'Инвентарь полон — предмет выпал под ноги', 'chat-sys'); spawnDrop(id, PLAYER.pos.x, PLAYER.pos.y + 0.5, PLAYER.pos.z, n); }
    return;
  }

  if (cmd === 'seed') {
    addChatMessage('Сид мира: ' + WORLD_SEED, 'chat-sys');
    return;
  }

  if (cmd === 'kill') {
    // /kill [цель] — в креативе урон заблокирован, поэтому убираем напрямую
    if (args.length >= 1) {
      if (!resolveCommandTarget(args[0], cbPrefix)) return;
    }
    PLAYER.hp = 0;
    onDeath('Вы приказали долго жить');
    return;
  }

  if (cmd === 'clear') {
    // /clear [цель] — очистить инвентарь цели
    if (args.length >= 1) {
      if (!resolveCommandTarget(args[0], cbPrefix)) return;
    }
    for (let i = 0; i < TOTAL_SLOTS; i++) slots[i] = null;
    for (let i = 0; i < craftSlots.length; i++) craftSlots[i] = null;
    if (cursorItem) cursorItem = null;
    for (const sl of ['helmet','chestplate','leggings','boots']) PLAYER.armor[sl] = null;
    refreshUI();
    addChatMessage(cbPrefix + 'Инвентарь очищен', 'chat-sys');
    return;
  }

  if (cmd === 'gamemode') {
    // /gamemode s|c [цель] — полноценный креатив (parity MC)
    const gm = (args[0] || '').toLowerCase();
    if (args.length >= 2 && !resolveCommandTarget(args[1], cbPrefix)) return;
    if (gm === 'c' || gm === 'creative' || gm === '1') {
      setGameMode(true);
    } else if (gm === 's' || gm === 'survival' || gm === '0') {
      setGameMode(false);
    } else {
      addChatMessage(cbPrefix + 'Использование: /gamemode s|c [цель]', 'chat-sys');
    }
    return;
  }

  addChatMessage((fromCB ? cbPrefix : '') + 'Неизвестная команда: /' + cmd + '. Введите /help', 'chat-sys');
}

function addChatMessage(text, cls) {
  cls = cls || '';
  chatHistory.push({ text, cls });
  if (chatHistory.length > CHAT_HISTORY_MAX) chatHistory.shift();
  // добавить в полный лог
  const line = document.createElement('div');
  line.className = 'chat-line ' + cls;
  line.textContent = text;
  chatLogEl.appendChild(line);
  // авто-прокрутка вниз (requestAnimationFrame — гарантия после layout)
  requestAnimationFrame(() => { chatLogEl.scrollTop = chatLogEl.scrollHeight; });
  // обновить мини-лог
  renderChatMini();
}
function renderChatMini() {
  chatMiniEl.innerHTML = '';
  for (const m of chatHistory) {
    const line = document.createElement('div');
    line.className = 'chat-line ' + (m.cls || '');
    line.textContent = m.text;
    chatMiniEl.appendChild(line);
  }
}
// скрыть/показать мини-лог чата в зависимости от состояния UI (меню/инвентарь открыты?)
function updateChatMiniVisibility() {
  const uiHidden = !overlay.classList.contains('hidden') || invOpen || chatOpen;
  chatMiniEl.classList.toggle('hidden-ui', uiHidden);
}
function openChat(withSlash) {
  if (chatOpen) return;
  chatOpen = true;
  // сброс «залипших» клавиш движения (фикс: W зажатая до чата продолжала бежать)
  for (const k in keys) keys[k] = false;
  chatBoxEl.classList.add('open');
  chatMiniEl.classList.add('hidden-ui');
  chatInputEl.value = withSlash ? '/' : '';
  chatInputEl.focus();
  // снять захват указателя, чтобы можно было печатать
  if (document.pointerLockElement) document.exitPointerLock();
}
function closeChat() {
  chatOpen = false;
  chatBoxEl.classList.remove('open');
  chatInputEl.blur();
  // мини-лог показывается только если игровой UI активен
  updateChatMiniVisibility();
}
chatInputEl.addEventListener('keydown', (e) => {
  e.stopPropagation();
  if (e.code === 'Escape') { e.preventDefault(); closeChat(); return; }
  if (e.code === 'Enter') {
    e.preventDefault();
    const msg = chatInputEl.value.trim();
    chatInputEl.value = '';
    if (!msg) { closeChat(); return; }
    // обработка команд
    if (msg.startsWith('/')) {
      handleChatCommand(msg);
    } else {
      // обычное сообщение от игрока
      const nick = (getPlayerNick() || 'Игрок');
      addChatMessage('<' + nick + '> ' + msg, 'chat-me');
    }
    closeChat();
  }
});
// блокировать игровые клавиши пока чат открыт
chatInputEl.addEventListener('keyup', (e) => { e.stopPropagation(); });

// ============================================================
//  Профиль игрока — никнейм в localStorage
// ============================================================
const NICK_LS = 'minicraft_nick';
const playerNickEl = document.getElementById('playerNick');
function getPlayerNick() {
  return (localStorage.getItem(NICK_LS) || '').trim();
}
function setPlayerNick(nick) {
  localStorage.setItem(NICK_LS, nick);
}
// загрузить сохранённый ник в поле ввода
playerNickEl.value = getPlayerNick();
playerNickEl.addEventListener('change', () => {
  const v = playerNickEl.value.trim().slice(0, 20);
  playerNickEl.value = v;
  setPlayerNick(v);
});
playerNickEl.addEventListener('input', () => {
  // автосохранение при вводе
  setPlayerNick(playerNickEl.value.trim().slice(0, 20));
});

// ============================================================
//  Экспорт / Импорт миров
// ============================================================
// Экспорт: собрать данные текущего (или выбранного) мира в JSON и скачать файлом
function exportWorld(name) {
  name = name || WorldManager.current;
  if (!name) { alert('Сначала выберите или создайте мир для экспорта'); return; }
  let data;
  try { data = JSON.parse(localStorage.getItem(WorldManager.LS_PREFIX + name)); }
  catch (e) { data = null; }
  if (!data) { alert('Мир «' + name + '» не найден'); return; }
  // если это текущий активный мир — сначала сохранить свежее состояние
  if (WorldManager.current === name) {
    WorldManager.save();
    try { data = JSON.parse(localStorage.getItem(WorldManager.LS_PREFIX + name)); } catch (e) {}
  }
  const payload = {
    format: 'minicraft-world',
    version: 1,
    name: name,
    exportedAt: new Date().toISOString(),
    data: data,
  };
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // безопасное имя файла
  const safe = name.replace(/[^\wа-яА-ЯёЁ0-9 \-_]/g, '_').slice(0, 40) || 'world';
  a.download = safe + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Импорт: считать JSON-файл и записать в базу сохранений
function importWorld(file) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const payload = JSON.parse(ev.target.result);
      let data, name;
      if (payload && payload.format === 'minicraft-world' && payload.data) {
        data = payload.data;
        name = payload.name || ('Импорт ' + new Date().toLocaleString());
      } else {
        // совместимость: считаем что файл — это сам data-объект
        data = payload;
        name = 'Импорт ' + new Date().toLocaleString();
      }
      // уникальное имя, чтобы не перезаписать существующий мир
      let finalName = name;
      const existing = WorldManager.list();
      let n = 1;
      while (existing.some(w => w.name === finalName)) {
        finalName = name + ' (' + n + ')';
        n++;
      }
      localStorage.setItem(WorldManager.LS_PREFIX + finalName, JSON.stringify(data));
      const arr = WorldManager.list();
      arr.push({ name: finalName, seed: data.seed | 0, updated: Date.now() });
      WorldManager.saveIndex(arr);
      renderWorldList();
      alert('Мир «' + finalName + '» успешно импортирован!');
    } catch (err) {
      alert('Не удалось импортировать мир: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// кнопки экспорта/импорта в меню
document.getElementById('exportWorldBtn').addEventListener('click', () => {
  // если есть текущий мир — экспортируем его; иначе просим выбрать
  if (WorldManager.current) {
    exportWorld(WorldManager.current);
  } else {
    const worlds = WorldManager.list().sort((a,b) => b.updated - a.updated);
    if (worlds.length === 0) { alert('Нет миров для экспорта'); return; }
    // экспортируем самый свежий
    exportWorld(worlds[0].name);
  }
});
document.getElementById('importWorldBtn').addEventListener('click', () => {
  document.getElementById('importFileInput').click();
});
document.getElementById('importFileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) importWorld(file);
  e.target.value = ''; // сбросить, чтобы можно было выбрать тот же файл снова
});

renderHotbar();
renderWorldList();

requestAnimationFrame(loop);
