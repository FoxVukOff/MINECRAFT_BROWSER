/* ============================================================
   MiniCraft — physics · Физика игрока (AABB), спавн на поверхности
   (модуль 27 из 33; строки 10205–10822 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Физика игрока (AABB collision)
// ============================================================
// твёрдый ли блок для коллизий
function isSolidForPlayer(x, y, z) {
  const bb = World.getBlock(x, y, z);
  if (bb === BLOCK.AIR || isLiquid(bb)) return false;
  if (bb === BLOCK.NETHER_PORTAL) return false; // сквозь портал можно пройти
  if (bb === BLOCK.FIRE) return false;         // огонь не имеет хитбокса (parity MC): стоять на нём нельзя
  if (bb === BLOCK.TORCH) return false;         // факел не мешает движению
  if (bb === BLOCK.REDSTONE_TORCH) return false; // редстоун-факел — тонкий, как факел (parity MC)
  if (bb === BLOCK.BUTTON) return false;         // кнопка — плоская, стоять на ней нельзя (parity MC)
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

    // ВЫХОД НА БЕРЕГ (фикс «не выбраться из воды/лавы»): в MC из жидкости всегда
    // можно выбраться на уступ высотой 1 блок. Если плывём к стенке и держим
    // прыжок, а перед нами уступ со свободным пространством над ним — резкий
    // вертикальный импульс, чтобы выскочить на берег.
    if (keys['Space'] && (move.x !== 0 || move.z !== 0)) {
      const fy = Math.floor(PLAYER.pos.y + 0.05);
      for (const probe of [0.6, 1.1]) {
        const fx = Math.floor(PLAYER.pos.x + move.x * probe);
        const fz = Math.floor(PLAYER.pos.z + move.z * probe);
        if (isSolidForPlayer(fx, fy, fz) &&
            !isSolidForPlayer(fx, fy + 1, fz) && !isSolidForPlayer(fx, fy + 2, fz)) {
          // импульс как прыжок: в воде — бодрый, в вязкой лаве — послабее
          PLAYER.vel.y = Math.max(PLAYER.vel.y, inLava ? 5.4 : 7.0);
          break;
        }
      }
    }
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
  // предмет из второй руки — тоже (parity MC: при смерти падает всё)
  if (PLAYER.offhand) {
    spawnDrop(PLAYER.offhand.id, PLAYER.pos.x, PLAYER.pos.y + 0.8, PLAYER.pos.z, PLAYER.offhand.count);
    PLAYER.offhand = null;
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
  timeSinceRest = 0;   // смерть обнуляет бессонницу (parity MC: rest при смерти)
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
  // основная рука; пуста — еда из второй руки (parity MC)
  const slot = activeItem() || PLAYER.offhand;
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

