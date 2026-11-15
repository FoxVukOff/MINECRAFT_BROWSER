/* ============================================================
   MiniCraft — furnace · Печь: плавка
   (модуль 22 из 33; строки 9200–9385 исходного game.js)
   ============================================================ */

'use strict';
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

