/* ============================================================
   MiniCraft — sand · Падающие блоки (песок/гравий), затухание листвы
   (модуль 19 из 33; строки 6944–7100 исходного game.js)
   ============================================================ */

'use strict';
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

