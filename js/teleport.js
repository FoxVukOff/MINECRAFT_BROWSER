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

// построить портал прибытия у точки назначения — РОВНО рамка, как PortalForcer
// в MC: обсидиановая рамка 4×5 с проёмом 2×3, залитым порталом (ось по X).
// Раньше вместе с рамкой клалась «безопасная площадка» 4×3 — 8 ЛИШНИХ блоков
// обсидиана спереди и сзади выхода. По просьбе убрано: лишнего обсидиана,
// как в ванилле, не появляется — только рамка.
function buildArrivalPortal(px, py, pz) {
  // нижняя перекладина рамки (4 блока — углы + низ проёма)
  for (let dx = -1; dx <= 2; dx++) World.setBlock(px + dx, py - 1, pz, BLOCK.OBSIDIAN);
  // стойки по краям проёма (высота 4, включая верхние углы)
  for (let dy = 0; dy <= 3; dy++) { World.setBlock(px-1, py+dy, pz, BLOCK.OBSIDIAN); World.setBlock(px+2, py+dy, pz, BLOCK.OBSIDIAN); }
  // верхняя перекладина между углами
  for (let dx = 0; dx <= 1; dx++) { World.setBlock(px+dx, py+3, pz, BLOCK.OBSIDIAN); }
  // проём — блоки портала
  for (let dx = 0; dx <= 1; dx++) for (let dy = 0; dy <= 2; dy++) {
    World.setBlock(px+dx, py+dy, pz, BLOCK.NETHER_PORTAL);
  }
  // расчистка вокруг проёма (как PortalForcer в MC): спереди и сзади ставим
  // воздух, чтобы игрока не замуровало в стене и было куда выйти
  for (const dz of [1, -1]) for (let dx = 0; dx <= 1; dx++) for (let dy = 0; dy <= 2; dy++) {
    if (World.getBlock(px+dx, py+dy, pz+dz) !== BLOCK.OBSIDIAN) World.setBlock(px+dx, py+dy, pz+dz, BLOCK.AIR);
  }
}

let _teleporting = false;
// Длительность «расплывания» экрана до старта загрузки (parity MC: экран
// затягивает лиловой дымкой с размытием, и только потом — экран загрузки).
const PORTAL_FX_MS = 950;

// Телепортация с анимацией: 1) экран расплывается (мир ещё живёт под дымкой),
// 2) затем — сама смена измерения + экран загрузки, 3) по готовности дымка
// спадает уже поверх нового мира. opts.onArrived — колбэк вызывающего кода
// (например, возрождение у кровати после возврата из Ада).
function teleportDimension(target, opts) {
  if (_teleporting || _dimLoading) return;
  _teleporting = true;
  // токен отмены: если за время анимации умрём или переключим мир из меню —
  // отложенный переход не выполнится (общий токен с экранами загрузки)
  const myToken = ++startWorldLoading._gen;
  // 1) фаза «расплывания»: нарастающее размытие + лиловая дымка (CSS #portalFx)
  const fx = document.getElementById('portalFx');
  if (fx) fx.classList.add('on');
  if (typeof playSound === 'function') playSound('portal');
  // 2) когда экран полностью затянуло — телепортация и загрузка измерения
  setTimeout(() => {
    // успели умереть или мир уже переключили — отменяем переход
    if (PLAYER.dead || myToken !== startWorldLoading._gen) {
      if (fx) fx.classList.remove('on');
      _teleporting = false;
      return;
    }
    _doTeleport(target, opts);
  }, PORTAL_FX_MS);
}

function _doTeleport(target, opts) {
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
    // как в MC: выходим стоя ВНУТРИ портала (на нижней перекладине рамки),
    // а не на отдельной площадке — её больше нет
    PLAYER.pos.set(tx + 1, ty + 0.01, tz + 0.5);
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
    // дымка спадает уже поверх нового измерения — мягкое «проявление» мира
    const fx = document.getElementById('portalFx');
    if (fx) fx.classList.remove('on');
    // отложенная логика вызывающего кода (например, возрождение у кровати)
    if (opts && typeof opts.onArrived === 'function') opts.onArrived();
  });
}
startWorldLoading._gen = 0;
