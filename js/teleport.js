/* ============================================================
   MiniCraft — teleport · Телепортация между измерениями
   (модуль 28 из 33; строки 10823–10927 исходного game.js)
   ============================================================ */

'use strict';
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
  if (_teleporting || _dimLoading) return;
  _teleporting = true;
  _dimLoading = true; // замораживаем игровой цикл — дальше экран загрузки (как в MC)
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

  // воркеры переключаются на новое измерение; чанки вокруг нового места
  // запросим в loadDimensionArea (там же полоска прогресса)
  WorldGenPool.setDim(World.dim);
  _lastScanPcx = 1e9; // форсировать полный скан после загрузки
  _meshTodo = [];

  // Красивая загрузка измерения (п.6): полоска прогресса + «Загружаемся в Ад…».
  // Игра стоит на паузе (_dimLoading), чанки генерят воркеры, меши строятся
  // кусочками, GPU прогревается — игрок «выныривает» уже в готовый мир.
  loadDimensionArea(target, () => {
    _dimLoading = false;
    _teleporting = false;
    showToast(target === 'nether' ? 'Добро пожаловать в Ад!' : 'Вы вернулись в обычный мир');
    // синхронизировать редстоун в новом измерении (поршни/пыль/двери)
    markRedstoneDirty(Math.floor(PLAYER.pos.x), Math.floor(PLAYER.pos.y), Math.floor(PLAYER.pos.z));
    WorldManager.save();
  });
}
startWorldLoading._gen = 0;

