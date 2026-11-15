/* ============================================================
   MiniCraft — pathfinding · A*-навигация мобов (зомби, пиглины, пауки)
   (новый модуль; раньше мобы шли «напролом» и застревали в стенах/деревьях)
   ============================================================ */

'use strict';
// ============================================================
//  Поиск пути для враждебных мобов (parity MC: мобы ОБХОДЯТ препятствия)
//  * A* по блочной сетке XZ с шагами вверх (1 блок — моб перепрыгивает)
//    и спуском вниз (до 3 блоков);
//  * вода проходима, но дорого (моб медленно бредёт), лава НЕпроходима;
//  * бюджет: 500 раскрытий узлов и 4 мс на вызов — кадр не фризится;
//  * путь строится раз в ~0.7 с на моба и когда цель сместилась > 3 блоков;
//  * если пути нет (игрок на вышке) — фолбэк: прямая погоня как раньше.
// ============================================================

// маленькая бинарная куча (min-heap по полю f)
class _PathHeap {
  constructor() { this.a = []; }
  get size() { return this.a.length; }
  push(it) {
    const a = this.a; a.push(it);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (a[p].f <= a[i].f) break;
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
        if (l < a.length && a[l].f < a[m].f) m = l;
        if (r < a.length && a[r].f < a[m].f) m = r;
        if (m === i) break;
        const t = a[m]; a[m] = a[i]; a[i] = t; i = m;
      }
    }
    return top;
  }
}

const PATH_MAX_NODES = 500;   // максимум раскрытий на один поиск
const PATH_TIME_MS = 4;       // и бюджет по времени
const PATH_RADIUS = 48;       // не ищем дальше 48 блоков
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

// A*: от ног моба до точки (tx,ty,tz). Возвращает массив вейпоинтов
// [{x,y,z}] (координаты БЛОКОВ, центр = +0.5) или null, если пути нет.
function mobFindPath(p, tx, ty, tz) {
  const sx = Math.floor(p.pos.x), sy = Math.floor(p.pos.y + 0.1), sz = Math.floor(p.pos.z);
  const gx = Math.floor(tx), gy = Math.floor(ty + 0.1), gz = Math.floor(tz);
  if (sx === gx && sz === gz) return [];   // уже у цели по XZ
  if (Math.abs(gx - sx) > PATH_RADIUS || Math.abs(gz - sz) > PATH_RADIUS) return null;
  if (sy < 1 || sy >= WORLD_HEIGHT - 2 || gy < 1 || gy >= WORLD_HEIGHT - 2) return null;

  const t0 = performance.now();
  const heur = (x, y, z) => (Math.abs(x - gx) + Math.abs(y - gy) * 2 + Math.abs(z - gz)) * 1.01;
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
    for (const [dx, dz] of _PATH_DIRS) {
      const nx = cur.x + dx, nz = cur.z + dz;
      if (Math.abs(nx - sx) > PATH_RADIUS || Math.abs(nz - sz) > PATH_RADIUS) continue;
      let neighbor = null;
      // 1) плоский шаг (по земле или по воде — вода дороже, моб бредёт медленно)
      if (_pathBodyFits(p, nx, cur.y, nz) && _pathHasGround(nx, cur.y - 1, nz)) {
        const wCost = isWaterLiquid(World.getBlock(nx, cur.y, nz)) ? 2.6 : 1.0;
        neighbor = { x: nx, y: cur.y, z: nz, cost: wCost };
      } else if (mobSolid(nx, cur.y, nz) && _pathBodyFits(p, nx, cur.y + 1, nz)) {
        // 2) ступенька вверх на 1 блок (моб перепрыгивает — автопрыжок в updateMobs)
        neighbor = { x: nx, y: cur.y + 1, z: nz, cost: 1.9 };
      } else {
        // 3) спуск вниз (обрыв до 3 блоков — глубже не идём, как MC-мобы)
        for (let dy = 1; dy <= 3; dy++) {
          const ny = cur.y - dy;
          if (ny < 1) break;
          if (mobSolid(nx, ny, nz)) break;   // стенка — ниже не пройти
          if (_pathBodyFits(p, nx, ny, nz) && _pathHasGround(nx, ny - 1, nz)) {
            neighbor = { x: nx, y: ny, z: nz, cost: 1.0 + dy * 0.35 };
            break;
          }
        }
      }
      if (!neighbor) continue;
      const nk = key(neighbor.x, neighbor.y, neighbor.z);
      const ng = cur.g + neighbor.cost;
      if (best.has(nk) && best.get(nk) <= ng) continue;   // уже лучше
      best.set(nk, ng);
      const node = { x: neighbor.x, y: neighbor.y, z: neighbor.z, g: ng, f: ng + heur(neighbor.x, neighbor.y, neighbor.z), prev: cur };
      heap.push(node);
      inOpen.add(nk);
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
