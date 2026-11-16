/* ============================================================
   MiniCraft — chat · Чат и команды
   (модуль 32 из 33; строки 11566–11869 исходного game.js)
   ============================================================ */

'use strict';
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
  bread: null, feather: ITEM.FEATHER, leather: ITEM.LEATHER,
  wool: BLOCK.WOOL, bed: BLOCK.BED_FOOT, redstone: ITEM.REDSTONE, obsidian: BLOCK.OBSIDIAN,
  command_block: BLOCK.COMMAND_BLOCK, cmd_block: BLOCK.COMMAND_BLOCK,
  spawn_egg_sheep: ITEM.SPAWN_EGG_SHEEP, sheep_spawn_egg: ITEM.SPAWN_EGG_SHEEP,
  spawn_egg_pig: ITEM.SPAWN_EGG_PIG, pig_spawn_egg: ITEM.SPAWN_EGG_PIG,
  spawn_egg_cow: ITEM.SPAWN_EGG_COW, cow_spawn_egg: ITEM.SPAWN_EGG_COW,
  spawn_egg_chicken: ITEM.SPAWN_EGG_CHICKEN, chicken_spawn_egg: ITEM.SPAWN_EGG_CHICKEN,
  spawn_egg_fish: ITEM.SPAWN_EGG_FISH, fish_spawn_egg: ITEM.SPAWN_EGG_FISH,
  spawn_egg_zombie: ITEM.SPAWN_EGG_ZOMBIE, zombie_spawn_egg: ITEM.SPAWN_EGG_ZOMBIE,
  spawn_egg_piglin: ITEM.SPAWN_EGG_PIGLIN, piglin_spawn_egg: ITEM.SPAWN_EGG_PIGLIN,
  spawn_egg_zombie_piglin: ITEM.SPAWN_EGG_ZOMBIE_PIGLIN, zombie_piglin_spawn_egg: ITEM.SPAWN_EGG_ZOMBIE_PIGLIN,
  spawn_egg_zpiglin: ITEM.SPAWN_EGG_ZOMBIE_PIGLIN, zombified_piglin_spawn_egg: ITEM.SPAWN_EGG_ZOMBIE_PIGLIN,
  spawn_egg_phantom: ITEM.SPAWN_EGG_PHANTOM, phantom_spawn_egg: ITEM.SPAWN_EGG_PHANTOM,
  spawn_egg_spider: ITEM.SPAWN_EGG_SPIDER, spider_spawn_egg: ITEM.SPAWN_EGG_SPIDER,
  string: ITEM.STRING, thread: ITEM.STRING, нить: ITEM.STRING, apple: ITEM.APPLE,
  phantom_membrane: ITEM.PHANTOM_MEMBRANE, membrane: ITEM.PHANTOM_MEMBRANE,
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
  // золотое (золотое обновление)
  gold_ore: BLOCK.GOLD_ORE, nether_gold_ore: BLOCK.NETHER_GOLD_ORE, gold_block: BLOCK.GOLD_BLOCK, block_of_gold: BLOCK.GOLD_BLOCK,
  gold_ingot: ITEM.GOLD_INGOT, gold_nugget: ITEM.GOLD_NUGGET, golden_apple: ITEM.GOLDEN_APPLE, notched_apple: ITEM.GOLDEN_APPLE,
  gold_pickaxe: ITEM.GOLD_PICKAXE, golden_pickaxe: ITEM.GOLD_PICKAXE, gold_axe: ITEM.GOLD_AXE, golden_axe: ITEM.GOLD_AXE,
  gold_shovel: ITEM.GOLD_SHOVEL, golden_shovel: ITEM.GOLD_SHOVEL, gold_sword: ITEM.GOLD_SWORD, golden_sword: ITEM.GOLD_SWORD,
  gold_helmet: ITEM.GOLD_HELMET, gold_chestplate: ITEM.GOLD_CHESTPLATE, gold_leggings: ITEM.GOLD_LEGGINGS, gold_boots: ITEM.GOLD_BOOTS,
  porkchop: ITEM.PORK_RAW, cooked_porkchop: ITEM.PORK_COOKED, beef: ITEM.BEEF_RAW, cooked_beef: ITEM.BEEF_COOKED,
  chicken: ITEM.CHICKEN_RAW, cooked_chicken: ITEM.CHICKEN_COOKED,
  rotten_flesh: ITEM.ROTTEN_FLESH, zombie_flesh: ITEM.ROTTEN_FLESH,
  // пиглинский бартер (золото ↔ лут)
  crying_obsidian: BLOCK.CRYING_OBSIDIAN, soul_sand: BLOCK.SOUL_SAND,
  nether_brick: BLOCK.NETHER_BRICK, blackstone: BLOCK.BLACKSTONE, dried_ghast: BLOCK.DRIED_GHAST,
  iron_nugget: ITEM.IRON_NUGGET, nether_quartz: ITEM.NETHER_QUARTZ, quartz: ITEM.NETHER_QUARTZ,
  ender_pearl: ITEM.ENDER_PEARL, fire_charge: ITEM.FIRE_CHARGE, spectral_arrow: ITEM.SPECTRAL_ARROW,
  water_bottle: ITEM.WATER_BOTTLE, potion_fire_res: ITEM.POTION_FIRE_RES,
  fire_resistance_potion: ITEM.POTION_FIRE_RES, splash_potion_fire_res: ITEM.SPLASH_POTION_FIRE_RES,
  enchanted_book: ITEM.ENCHANTED_BOOK_SOUL_SPEED, soul_speed_book: ITEM.ENCHANTED_BOOK_SOUL_SPEED,
  soul_boots: ITEM.SOUL_BOOTS_III, soul_speed_boots: ITEM.SOUL_BOOTS_III,
  soul_boots_1: ITEM.SOUL_BOOTS_I, soul_boots_2: ITEM.SOUL_BOOTS_II, soul_boots_3: ITEM.SOUL_BOOTS_III,
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
    // parity MC (MC-146524): мобы мгновенно теряют агрессию к креативному игроку
    if (typeof mobs !== 'undefined') {
      for (const m of mobs) { m.aggro = 0; m.path = null; }
    }
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

// Алиасы мобов для /summon: английские (как в MC) + русские имена.
// Русские без «ё» и через подчёркивания — удобно набирать в чате.
const SUMMON_ALIASES = {
  pig: 'pig', свинья: 'pig',
  cow: 'cow', корова: 'cow',
  chicken: 'chicken', курица: 'chicken',
  sheep: 'sheep', овца: 'sheep',
  fish: 'fish', рыба: 'fish',
  zombie: 'zombie', зомби: 'zombie',
  piglin: 'piglin', пиглин: 'piglin',                                   // обычный пиглин — БАРТЕРЩИК
  zombie_piglin: 'zombie_piglin', зомби_пиглин: 'zombie_piglin',         // зомбифицированный — НЕ торгует
  зомбифицированный_пиглин: 'zombie_piglin', zombified_piglin: 'zombie_piglin',
  phantom: 'phantom', фантом: 'phantom',
  spider: 'spider', паук: 'spider',
};
function resolveMobName(tok) {
  if (tok === undefined || tok === null) return null;
  return SUMMON_ALIASES[String(tok).toLowerCase()] || null;
}
// найти пригодную позицию для спавна моба у (x,y,z): воздух для тела и опора
function summonSpawnSpot(type, x, y, z) {
  const def = MOB_TYPES[type];
  const hCells = def.height > 1.05 ? 2 : 1;
  const fits = (bx, by, bz) => {
    for (let i = 0; i < hCells; i++) {
      if (World.getBlock(bx, by + i, bz) !== BLOCK.AIR) return false;
    }
    return true;
  };
  const bx = Math.floor(x), bz = Math.floor(z);
  let by = Math.max(1, Math.min(WORLD_HEIGHT - 2, Math.floor(y)));
  // ищем свободное место: вверх до 4, потом вниз до 8
  for (let dy = 0; dy <= 4; dy++) {
    if (fits(bx, by + dy, bz)) { by = by + dy; return { x: bx + 0.5, y: by, z: bz + 0.5 }; }
  }
  for (let dy = 1; dy <= 8; dy++) {
    if (by - dy < 1) break;
    if (fits(bx, by - dy, bz)) { by = by - dy; return { x: bx + 0.5, y: by, z: bz + 0.5 }; }
  }
  return null;
}

// /summon — призыв моба. Наш вариант (чуть отходит от MC):
//   /summon <моб>                     — у себя
//   /summon <x> <y> <z> <моб>         — в координатах (~ — относительно себя)
//   /summon <цель> <моб>              — у игрока (@-селектор или ник)
function handleSummonCommand(args, cbPrefix, fromCB) {
  if (args.length < 1) {
    addChatMessage(cbPrefix + 'Использование: /summon <моб> · /summon <x> <y> <z> <моб> · /summon <цель> <моб>', 'chat-sys');
    addChatMessage('Мобы: ' + Object.keys(MOB_TYPES).join(', ') + ' (можно по-русски: зомби, паук, свинья…)', 'chat-sys');
    return;
  }
  let tx = PLAYER.pos.x, ty = PLAYER.pos.y, tz = PLAYER.pos.z;
  let mobTok;
  const isCoordTok = (t) => t !== undefined && /^~?-?\d*\.?\d*$/.test(String(t));
  if (args.length === 1) {
    // /summon <моб> — у себя
    mobTok = args[0];
  } else if (isTargetToken(args[0])) {
    // /summon <цель> <моб> — у игрока (single-player: цель = игрок)
    if (!resolveCommandTarget(args[0], cbPrefix)) return;
    mobTok = args[1];
  } else if (isCoordTok(args[0]) && isCoordTok(args[1]) && isCoordTok(args[2]) && args.length >= 4) {
    // /summon <x> <y> <z> <моб>
    const rel = (a, cur) => a === '~' ? cur : (String(a).startsWith('~') ? cur + parseFloat(a.slice(1) || '0') : parseFloat(a));
    const nx = rel(args[0], PLAYER.pos.x), ny = rel(args[1], PLAYER.pos.y), nz = rel(args[2], PLAYER.pos.z);
    if (![nx, ny, nz].every(Number.isFinite)) { addChatMessage(cbPrefix + 'Неверные координаты', 'chat-sys'); return; }
    tx = nx; ty = ny; tz = nz;
    mobTok = args[3];
  } else {
    addChatMessage(cbPrefix + 'Использование: /summon <моб> · /summon <x> <y> <z> <моб> · /summon <цель> <моб>', 'chat-sys');
    return;
  }
  const type = resolveMobName(mobTok);
  if (!type) {
    addChatMessage(cbPrefix + 'Неизвестный моб: ' + mobTok + '. Доступны: ' + Object.keys(MOB_TYPES).join(', ') +
      ' (и по-русски: зомби, паук, свинья, корова, курица, овца, рыба, пиглин, фантом)', 'chat-sys');
    return;
  }
  const spot = summonSpawnSpot(type, tx, ty, tz);
  if (!spot) { addChatMessage(cbPrefix + 'Нет места для спавна (все клетки заняты?)', 'chat-sys'); return; }
  spawnMob(type, spot.x, spot.y, spot.z);
  addChatMessage(cbPrefix + 'Призван: ' + (MOB_TYPES[type].name || type) +
    ` (${spot.x.toFixed(1)}, ${spot.y.toFixed(1)}, ${spot.z.toFixed(1)})`, 'chat-sys');
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
      '/tp [цель] <x> <y> <z> (~ — относительно), /give [цель] <имя|id> [кол-во], /seed, /kill [цель], /clear [цель], /gamemode s|c [цель], ' +
      '/summon <моб> | <x> <y> <z> <моб> | <цель> <моб>', 'chat-sys');
    addChatMessage('Цель: @p (ближайший), @s (сам), @a/@e (все), @r (случайный) или ник. Пример: /tp @p ~ ~10 ~ · /summon паук', 'chat-sys');
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

  if (cmd === 'summon') {
    // /summon — наш синтаксис: /summon <моб> | <x y z> <моб> | <цель> <моб>
    handleSummonCommand(args, cbPrefix, fromCB);
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

