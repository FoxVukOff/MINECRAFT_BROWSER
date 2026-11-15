/* ============================================================
   MiniCraft — interaction · Ломание и установка блоков, портал
   (модуль 21 из 33; строки 8360–9199 исходного game.js)
   ============================================================ */

'use strict';
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
    // листва: только ножницы дают дроп листвы; иначе — ничего (как в Minecraft);
    // изредка выпадает ЯБЛОКО (0.5%, как в MC — из листвы дуба)
    dropId = haveShears ? BLOCK.LEAVES : (Math.random() < 0.005 ? ITEM.APPLE : null);
  }
  else if (broken === BLOCK.GLASS) dropId = null;        // стекло разбивается
  else if (broken === BLOCK.STONE) dropId = havePick ? BLOCK.COBBLESTONE : null; // камень -> булыжник только киркой
  else if (broken === BLOCK.COBBLESTONE) dropId = havePick ? BLOCK.COBBLESTONE : null;
  else if (broken === BLOCK.FURNACE) dropId = havePick ? BLOCK.FURNACE : null;
  else if (broken === BLOCK.COAL_ORE) dropId = havePick ? ITEM.COAL : null; // уголь только киркой
  else if (broken === BLOCK.IRON_ORE) dropId = (tier >= 2) ? BLOCK.IRON_ORE : null; // железную руду — каменной киркой+, плавить в печи
  else if (broken === BLOCK.COPPER_ORE) dropId = (tier >= 2) ? BLOCK.COPPER_ORE : null; // медную руду — каменной киркой+, плавить в печи
  else if (broken === BLOCK.GOLD_ORE) dropId = (tier >= 4) ? BLOCK.GOLD_ORE : null; // золотую руду — только ЖЕЛЕЗНОЙ киркой+ (как в MC), плавить в печи
  else if (broken === BLOCK.NETHER_GOLD_ORE) {
    // незерская золотая руда: любой киркой, дроп — 2-6 самородков (как в MC)
    dropId = havePick ? ITEM.GOLD_NUGGET : null;
    dropCount = havePick ? (2 + (Math.random()*5|0)) : 1;
  }
  else if (broken === BLOCK.GOLD_BLOCK) dropId = (tier >= 4) ? BLOCK.GOLD_BLOCK : null; // золотой блок — только железной киркой+ (как в MC)
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

  // износ инструмента за сломанный блок (в MC — 1 прочность за блок).
  // useDurability сам очищает нужный контейнер (рука/вторая рука) — ничего не дублируем
  if (held && hasDurability(held.id) && !(broken === BLOCK.LEAVES && held.id === ITEM.SHEARS) && broken !== BLOCK.WOOL) {
    useDurability(held);
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
      // износ зажигалки: useDurability сам чистит контейнер (рука ИЛИ вторая рука —
      // фикс: раньше при поломке предмета из ВТОРОЙ руки удалялся предмет из основной)
      useDurability(slot);
      refreshUI();
    }
    return;
  }
  // огонь ставится в воздух — на блоке снизу ИЛИ на боковой грани clicked-блока
  // (parity MC: flint&steel зажигает и боковые грани — боковой огонь)
  if (World.getBlock(nx, ny, nz) !== BLOCK.AIR) return;
  const belowOk = isSolidForPlayer(nx, ny - 1, nz);
  const sideOk = isSolidForPlayer(t.x, t.y, t.z); // кликнули в бок твёрдого блока
  if (!belowOk && !sideOk) return;
  FireSim.add(nx, ny, nz); // крепление (сверху/сбоку) определится автоматически
  playSound('place', BLOCK.WOOD);
  // расход прочности (контейнер — рука или вторая рука — чистится внутри useDurability)
  useDurability(slot);
  refreshUI();
}

// Яйцо спавна: призвать моба по месту клика — на грань блока (как в MC).
// Рыба призывается только в воду (parity MC: водные яйца требуют воду).
function useSpawnEgg(t, slot) {
  const egg = SPAWN_EGGS[slot.id];
  if (!egg || !t) return;
  const def = MOB_TYPES[egg.mob];
  if (!def) return;
  const nx = t.x + t.face[0], ny = t.y + t.face[1], nz = t.z + t.face[2];
  if (ny < 0 || ny >= WORLD_HEIGHT) return;
  const at = World.getBlock(nx, ny, nz);
  if (def.aquatic) {
    if (!isWaterLiquid(at)) { showToast('Рыбу можно призвать только в воду'); return; }
    spawnMob(egg.mob, nx + 0.5, ny + 0.2, nz + 0.5);
  } else {
    if (at !== BLOCK.AIR && !isLiquid(at)) return; // грань занята — не спавним
    spawnMob(egg.mob, nx + 0.5, ny, nz + 0.5);
  }
  // дымок призыва (цвет по мобу)
  spawnParticles(nx + 0.5, ny + 0.7, nz + 0.5, 10, egg.mob === 'zombie' ? '#7ca844' : (egg.mob === 'phantom' ? '#7ea8b0' : '#e8e8e8'));
  playSound('place', BLOCK.WOOL);
  consumeHeldItem(slot); // в креативе не расходуется (parity MC)
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
        if (useDurability(slot0)) playSound('break', BLOCK.IRON_ORE);
        refreshUI();
        return;
      } else {
        showToast('Нужны ножницы, чтобы состричь овцу');
      }
    }
  }

  // Основная рука; если ПУСТА — действует предмет из ВТОРОЙ руки (parity MC:
  // ПКМ работает offhand-предметом, когда основная рука не может)
  const slot = activeItem() || PLAYER.offhand;
  if (!slot || slot.count <= 0) return;
  // вёдра — особая обработка (набрать/вылить жидкость)
  if (slot.id === ITEM.BUCKET || slot.id === ITEM.WATER_BUCKET || slot.id === ITEM.LAVA_BUCKET) { useBucket(slot); return; }
  // зажигалка — поджечь
  if (slot.id === ITEM.FLINT_AND_STEEL) { useFlintAndSteel(t, slot); return; }
  // лодка — спустить на воду
  if (slot.id === ITEM.BOAT) { placeBoat(t, slot); return; }
  // яйцо спавна — призвать моба по месту клика
  if (SPAWN_EGGS[slot.id]) { useSpawnEgg(t, slot); return; }
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
  // Замещаемые блоки (parity MC «replaceable»): воздух, жидкости и ОГОНЬ —
  // блок ставится прямо на место огня, как в Minecraft
  const replaceable = (b) => b === BLOCK.AIR || isLiquid(b) || b === BLOCK.FIRE;
  if (!replaceable(target)) return;

  // ---- Дверь: два блока в высоту ----
  if (slot.id === ITEM.DOOR) {
    const aboveOk = World.getBlock(nx, ny + 1, nz);
    if (ny + 1 >= WORLD_HEIGHT || !replaceable(aboveOk)) return;
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
    if (!replaceable(hb)) return;                      // место под изголовье
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
    if (!replaceable(target)) return;
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

