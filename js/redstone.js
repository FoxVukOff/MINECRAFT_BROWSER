/* ============================================================
   MiniCraft — redstone · Редстоун: пыль, рычаги, поршни
   (модуль 23 из 33; строки 9386–9732 исходного game.js)
   ============================================================ */

'use strict';
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

