/* ============================================================
   MiniCraft — pathfinding · A*-навигация мобов (зомби, пиглины, пауки)
   (новый модуль; раньше мобы шли «напролом» и застревали в стенах/деревьях)
   ============================================================ */

'use strict';
// ============================================================
//  Поиск пути для враждебных мобов (parity MC: мобы ОБХОДЯТ препятствия)
//  * A* по блочной сетке XZ с шагами вверх (1 блок — моб перепрыгивает)
//    и спуском вниз (до 3 блоков);
//  * ПАУК строит маршрут ПОВЕРХ стен: вертикальное лазание по стене
//    (вверх/вниз) и «шаг с уступа на стену» — сползает по фасаду;
//  * эвристика ДОПУСТИМАЯ (никогда не переоценивает остаток пути):
//    max(hUp·U, H + (hUp−1)·U), где H — манхэттен по XZ, U — блоков
//    вверх до цели. Раньше был (H + 2·U)·1.01 — переоценивал вертикаль,
//    и A* приносил ЗАМЕТНО НЕОПТИМАЛЬНЫЕ маршруты. При равном f
//    раскрываем более глубокий узел (g больше) — путь «цельный»;
//  * вода проходима, но дорого (моб медленно бредёт), лава НЕпроходима;
//  * бюджет: 1600 раскрытий узлов и 4 мс на вызов — кадр не фризится;
//  * путь строится раз в ~0.7 с на моба и когда цель сместилась > 3 блоков;
//  * если пути нет — фолбэк: прямая погоня (а паук лезет по стене).
// ============================================================

// маленькая бинарная куча (min-heap). Компаратор: меньше f, при равном f —
// глубже узел (g больше): A* с допустимой эвристикой находит оптимальный
// путь, а тай-брейк выбирает из равных кандидатов самый продвинутый.
function _pathLess(a, b) {
  return a.f < b.f || (a.f === b.f && a.g > b.g);
}
class _PathHeap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(it) {
    const a = this.a; a.push(it);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (!_pathLess(a[i], a[p])) break;
      const t = a[p]; a[p] = a[i]; a[i] = t; i = p;
    }
  }
  pop() {
    const a = this.a;
    const top = a[0];
    const last = a.pop();
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1, r = l + 1; let m = i;
        if (l < a.length && _pathLess(a[l], a[m])) m = l;
        if (r < a.length && _pathLess(a[r], a[m])) m = r;
        if (m === i) break;
        const t = a[m]; a[m] = a[i]; a[i] = t; i = m;
      }
    }
    return top;
  }
}

// --- Цены переходов (стоимость в «блоках пути») ---
const PATH_COST_STEP       = 1.0;  // шаг по ровной земле
const PATH_COST_WATER      = 2.6;  // шаг по воде (муторно, но можно)
const PATH_COST_STEP_UP    = 1.9;  // прыжок на +1 блок
const PATH_COST_DESCEND    = 0.35; // добавка за каждый блок спуска (до 3)
const PATH_COST_CLIMB_UP   = 1.3;  // паук: блок лазания вверх по стене
const PATH_COST_CLIMB_DOWN = 1.2;  // паук: блок сползания вниз по стене
const PATH_COST_STEP_OFF   = 1.4;  // паук: шаг с уступа на стену (вниз-вбок)

// --- Бюджеты поиска (защита кадра от долгих поисков) ---
const PATH_MAX_NODES = 3000;  // максимум раскрытий на один поиск
const PATH_TIME_MS   = 6;     // и бюджет по времени (главная защита кадра)
const PATH_RADIUS    = 48;    // не ищем дальше 48 блоков
const _PATH_DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// ячейка свободна для ТЕЛА моба (рост: до двух клеток). Лава непроходима —
// мобы не должны строить маршрут через лавовые озёра.
function _pathCellFree(x, y, z) {
  if (y < 0 || y >= WORLD_HEIGHT) return false;
  const b = World.getBlock(x, y, z);
  if (isLavaLiquid(b)) return false; // лаву не переходим
  return !mobSolid(x, y, z);
}
function _pathBodyFits(p, x, y, z) {
  const hCells = p.height > 1.05 ? 2 : 1;   // рослым (зомби) нужно 2 клетки
  if (y < 1 || y + hCells - 1 > WORLD_HEIGHT - 2) return false;
  for (let i = 0; i < hCells; i++) {
    if (!_pathCellFree(x, y + i, z)) return false;
  }
  return true;
}
// есть ли опора под ячейкой (твёрдый блок или вода — по воде мобы всплывают)
function _pathHasGround(x, y, z) {
  return mobSolid(x, y, z) || isWaterLiquid(World.getBlock(x, y, z));
}
// есть ли СТЕНА рядом с ячейкой — за что паук может уцепиться (лазание)
function _pathWallAdj(x, y, z) {
  return mobSolid(x + 1, y, z) || mobSolid(x - 1, y, z) ||
         mobSolid(x, y, z + 1) || mobSolid(x, y, z - 1);
}
// чанк с колонкой загружен? В незагруженные области маршрут не строим
// (и не провоцируем синхронную генерацию чанков на ровном месте)
function _pathChunkLoaded(x, z) {
  const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(z / CHUNK_SIZE);
  return !!World.chunks.get(World.key(cx, cz));
}

// A*: от ног моба до точки (tx,ty,tz). Возвращает массив вейпоинтов
// [{x,y,z}] (координаты БЛОКОВ, центр = +0.5) или null, если пути нет.
function mobFindPath(p, tx, ty, tz) {
  const sx = Math.floor(p.pos.x), sy = Math.floor(p.pos.y + 0.1), sz = Math.floor(p.pos.z);
  const gx = Math.floor(tx), gy = Math.floor(ty + 0.1), gz = Math.floor(tz);
  if (sx === gx && sz === gz) return [];   // уже у цели по XZ
  if (Math.abs(gx - sx) > PATH_RADIUS || Math.abs(gz - sz) > PATH_RADIUS) return null;
  if (sy < 1 || sy >= WORLD_HEIGHT - 2 || gy < 1 || gy >= WORLD_HEIGHT - 2) return null;
  if (!_pathChunkLoaded(gx, gz)) return null; // цель в незагруженном чанке

  const climbs = !!p.def.climbs;   // паук умеет лазать по стенам
  const t0 = performance.now();
  // ДОПУСТИМАЯ эвристика: hUp — цена худшего обязательного «вертикального»
  // блока (лазание у паука дешевле прыжка). Цель принимается с допуском
  // |Δy| <= 1 (клетка на уровень НИЖЕ цели — уже финиш), поэтому U считаем
  // до НИЖНЕЙ принимающей клетки. Никогда не переоценивает истинный
  // остаток => A* даёт ОПТИМАЛЬНЫЙ маршрут (проверено тестом против
  // Дейкстры на случайных картах).
  const hUp = climbs ? PATH_COST_CLIMB_UP : PATH_COST_STEP_UP;
  const heur = (x, y, z) => {
    const H = Math.abs(x - gx) + Math.abs(z - gz);
    const U = Math.max(0, (gy - 1) - y);
    return Math.max(hUp * U, H + (hUp - 1) * U);
  };
  const heap = new _PathHeap();
  const best = new Map();     // key -> g
  const inOpen = new Set();   // ключи в куче (для устаревших записей)
  const key = (x, y, z) => x + ',' + y + ',' + z;

  const start = { x: sx, y: sy, z: sz, g: 0, f: heur(sx, sy, sz), prev: null };
  heap.push(start);
  inOpen.add(key(sx, sy, sz));
  best.set(key(sx, sy, sz), 0);

  let found = null;
  let expanded = 0;
  while (heap.size > 0) {
    if ((expanded & 31) === 0 && performance.now() - t0 > PATH_TIME_MS) break; // бюджет
    const cur = heap.pop();
    const ck = key(cur.x, cur.y, cur.z);
    if (!inOpen.delete(ck)) continue;      // устаревшая копия
    expanded++;
    if (expanded > PATH_MAX_NODES) break;
    // цель: та же колонка, высота ±1 (стоять ровно на клетке игрока не обязательно)
    if (cur.x === gx && cur.z === gz && Math.abs(cur.y - gy) <= 1) { found = cur; break; }

    // добавление соседа (лучший g дубликатами в куче, старые копии
    // отбрасываются при pop через inOpen)
    const tryAdd = (nx, ny, nz, cost) => {
      if (ny < 1 || ny > WORLD_HEIGHT - 2) return;
      const nk = key(nx, ny, nz);
      const ng = cur.g + cost;
      if (best.has(nk) && best.get(nk) <= ng) return;   // уже лучше
      best.set(nk, ng);
      heap.push({ x: nx, y: ny, z: nz, g: ng, f: ng + heur(nx, ny, nz), prev: cur });
      inOpen.add(nk);
    };

    for (const [dx, dz] of _PATH_DIRS) {
      const nx = cur.x + dx, nz = cur.z + dz;
      if (Math.abs(nx - sx) > PATH_RADIUS || Math.abs(nz - sz) > PATH_RADIUS) continue;
      if (!_pathChunkLoaded(nx, nz)) continue;
      let neighbor = null;
      // 1) плоский шаг (по земле или по воде — вода дороже, моб бредёт медленно)
      if (_pathBodyFits(p, nx, cur.y, nz) && _pathHasGround(nx, cur.y - 1, nz)) {
        const wCost = isWaterLiquid(World.getBlock(nx, cur.y, nz)) ? PATH_COST_WATER : PATH_COST_STEP;
        neighbor = { x: nx, y: cur.y, z: nz, cost: wCost };
      } else if (mobSolid(nx, cur.y, nz) && _pathBodyFits(p, nx, cur.y + 1, nz)) {
        // 2) ступенька вверх на 1 блок (моб перепрыгивает — автопрыжок в updateMobs)
        neighbor = { x: nx, y: cur.y + 1, z: nz, cost: PATH_COST_STEP_UP };
      } else {
        // 3) спуск вниз (обрыв до 3 блоков — глубже не идём, как MC-мобы)
        for (let dy = 1; dy <= 3; dy++) {
          const ny = cur.y - dy;
          if (ny < 1) break;
          if (mobSolid(nx, ny, nz)) break;   // стенка — ниже не пройти
          if (_pathBodyFits(p, nx, ny, nz) && _pathHasGround(nx, ny - 1, nz)) {
            neighbor = { x: nx, y: ny, z: nz, cost: 1.0 + dy * PATH_COST_DESCEND };
            break;
          }
        }
      }
      if (neighbor) {
        tryAdd(neighbor.x, neighbor.y, neighbor.z, neighbor.cost);
        continue;
      }
      // 4) ПАУК: шаг с уступа НА СТЕНУ — вниз-вбок без опоры под ногами.
      // Стоя на кромке, паук переносит ноги на фасад и сползает по нему.
      if (climbs && cur.y - 1 >= 1 &&
          _pathBodyFits(p, nx, cur.y - 1, nz) &&
          !_pathHasGround(nx, cur.y - 2, nz) &&
          _pathWallAdj(nx, cur.y - 1, nz)) {
        tryAdd(nx, cur.y - 1, nz, PATH_COST_STEP_OFF);
      }
    }
    // 5) ПАУК: вертикальное лазание в своей колонке (вдоль стены).
    // Вверх — только если на уровне НОВОЙ клетки есть стена, за которую
    // уцепиться; вниз — так же (паук сползает по фасаду).
    if (climbs) {
      if (cur.y + 1 <= WORLD_HEIGHT - 2 &&
          _pathBodyFits(p, cur.x, cur.y + 1, cur.z) &&
          _pathWallAdj(cur.x, cur.y + 1, cur.z)) {
        tryAdd(cur.x, cur.y + 1, cur.z, PATH_COST_CLIMB_UP);
      }
      if (cur.y - 1 >= 1 &&
          _pathBodyFits(p, cur.x, cur.y - 1, cur.z) &&
          _pathWallAdj(cur.x, cur.y - 1, cur.z)) {
        tryAdd(cur.x, cur.y - 1, cur.z, PATH_COST_CLIMB_DOWN);
      }
    }
  }
  if (!found) return null;
  // восстановить цепочку вейпоинтов (от старта к цели)
  const path = [];
  for (let n = found; n; n = n.prev) path.push({ x: n.x, y: n.y, z: n.z });
  path.reverse();
  path.shift(); // первую точку (текущая позиция) пропускаем
  return path;
}

// Куда сейчас повернуть моба по его пути (p.path/p.pathIdx).
// Возвращает угол рыскания или null, если путь закончился/отсутствует.
function mobSteerAlongPath(p) {
  if (!p.path || p.pathIdx >= p.path.length) return null;
  let wp = p.path[p.pathIdx];
  // проскоченные вейпоинты пропускаем (моб уже на них)
  let guard = 0;
  while (guard++ < 10) {
    const dx = (wp.x + 0.5) - p.pos.x, dz = (wp.z + 0.5) - p.pos.z;
    if (dx * dx + dz * dz < 0.45 * 0.45) {
      p.pathIdx++;
      if (p.pathIdx >= p.path.length) return null;
      wp = p.path[p.pathIdx];
    } else break;
  }
  return Math.atan2((wp.x + 0.5) - p.pos.x, (wp.z + 0.5) - p.pos.z);
}

// Обновить маршрут моба к цели (вызывается из ИИ погони раз в кадр —
// сама пересборка не чаще, чем p.pathT, и при смещении цели > 3 блоков).
function mobUpdateChasePath(p, tx, ty, tz, dt) {
  p.pathT = (p.pathT || 0) - dt;
  const gx = Math.floor(tx), gz = Math.floor(tz);
  const goal = p.pathGoal;
  const moved = !goal || (Math.abs(gx - goal.x) + Math.abs(gz - goal.z) > 3);
  if (p.pathT <= 0 || !p.path || moved) {
    p.pathGoal = { x: gx, z: gz };
    p.pathT = 0.7 + Math.random() * 0.3;
    p.path = mobFindPath(p, tx, ty, tz);
    p.pathIdx = 0;
  }
}
