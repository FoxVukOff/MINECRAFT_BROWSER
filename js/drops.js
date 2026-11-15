/* ============================================================
   MiniCraft — drops · Выпавшие предметы (дропы)
   (модуль 18 из 33; строки 6743–6943 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Дропы предметов (выпадение блоков)
// ============================================================
const drops = []; // {mesh, pos, vel, id, age, picked}

const _itemDropMat = {}; // кеш материалов-иконок для предметов
function itemDropMaterial(id) {
  if (_itemDropMat[id]) return _itemDropMat[id];
  const t = new THREE.CanvasTexture(iconCanvas(id, 32));
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  const m = new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide });
  _itemDropMat[id] = m;
  return m;
}

// Блоки с нестандартной/плоской геометрией — их дроп рендерим как 2D-спрайт (плоскость),
// а не как 3D-куб (как в Minecraft: факел, редстоуновая пыль/факел, рычаг, кнопка лежат плоско).
function isFlatDropBlock(id) {
  return id === BLOCK.TORCH || id === BLOCK.REDSTONE_TORCH ||
         id === BLOCK.REDSTONE_DUST || id === BLOCK.LEVER ||
         id === BLOCK.BUTTON || id === BLOCK.FIRE ||
         id === BLOCK.NETHER_PORTAL;
}

// создать меш дропа для предмета/блока
function makeDropMesh(id) {
  if (isBlock(id) && MATERIALS[id] && !isFlatDropBlock(id)) {
    return new THREE.Mesh(whiteColors(new THREE.BoxGeometry(0.28, 0.28, 0.28)), MATERIALS[id]);
  }
  // плоский 2D-спрайт (для предметов и «тонких» блоков)
  return new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), itemDropMaterial(id));
}

// добавить белые цвета вершин (для геометрий, использующих vertexColors-материалы блоков)
function whiteColors(geo) {
  const n = geo.attributes.position.count;
  const arr = new Float32Array(n * 3).fill(1);
  geo.setAttribute('color', new THREE.Float32BufferAttribute(arr, 3));
  return geo;
}

function spawnDrop(id, x, y, z, count) {
  const n = count || 1;
  const mesh = makeDropMesh(id);
  mesh.position.set(x, y, z);
  scene.add(mesh);
  drops.push({
    mesh, id, count: n,
    pos: new THREE.Vector3(x, y, z),
    vel: new THREE.Vector3((Math.random()-0.5)*2, 3, (Math.random()-0.5)*2),
    age: 0, picked: false, pickDelay: 0.5,
  });
}

// Выбросить предмет вперёд от игрока (с задержкой подбора, чтобы не подобрать сразу).
// Стак выбрасывается ОДНОЙ сущностью (фикс: раньше 64 предмета = 64 меша).
function tossDropForward(id, count) {
  const n = count || 1;
  const ex = PLAYER.pos.x, ey = PLAYER.pos.y + (PLAYER.crouching?PLAYER.crouchEye:PLAYER.eye) - 0.2, ez = PLAYER.pos.z;
  const dir = new THREE.Vector3(
    -Math.sin(PLAYER.yaw) * Math.cos(PLAYER.pitch),
    Math.sin(PLAYER.pitch),
    -Math.cos(PLAYER.yaw) * Math.cos(PLAYER.pitch)
  ).normalize();
  const mesh = makeDropMesh(id);
  const sx = ex + dir.x*0.6, sy = ey + dir.y*0.6, sz = ez + dir.z*0.6;
  mesh.position.set(sx, sy, sz);
  scene.add(mesh);
  drops.push({
    mesh, id, count: n,
    pos: new THREE.Vector3(sx, sy, sz),
    vel: new THREE.Vector3(dir.x*6, dir.y*6 + 2.5, dir.z*6),
    age: 0, picked: false, pickDelay: 1.6,  // подбор только спустя 1.6с
  });
}

// Выбросить: из активного слота (1 шт или весь стак), либо предмет с курсора (в инвентаре)
function dropFromHand(all) {
  if (invOpen && cursorItem) {
    // в инвентаре с курсора: выкинуть весь курсор (или 1 при !all)
    const n = all ? cursorItem.count : 1;
    const isLast = (cursorItem.count - n) <= 0;
    tossDropForward(cursorItem.id, n);
    if (isLast && cursorItem.dur !== undefined) { /* последняя единица уносит прочность */ }
    cursorItem.count -= n;
    if (cursorItem.count <= 0) cursorItem = null;
    renderCursor(); refreshUI();
    return;
  }
  const slot = activeItem();
  if (!slot) return;
  const n = all ? slot.count : 1;
  tossDropForward(slot.id, n);
  slot.count -= n;
  if (slot.count <= 0) slots[activeSlot] = null;
  refreshUI();
}

const DROP_LIFETIME = 300; // 5 минут — как в Minecraft
// простая проверка прямой видимости (нет сплошных блоков между дропом и игроком)
function dropHasLOS(d) {
  const sx = d.pos.x, sy = d.pos.y + 0.1, sz = d.pos.z;
  const tx = PLAYER.pos.x, ty = PLAYER.pos.y + 0.9, tz = PLAYER.pos.z;
  const steps = 4;
  for (let s = 1; s < steps; s++) {
    const t = s / steps;
    const bx = Math.floor(sx + (tx - sx) * t), by = Math.floor(sy + (ty - sy) * t), bz = Math.floor(sz + (tz - sz) * t);
    const b = World.getBlock(bx, by, bz);
    if (b !== BLOCK.AIR && !isLiquid(b) && !isTransparent(b)) return false;
  }
  return true;
}
function updateDrops(dt) {
  for (let i = drops.length - 1; i >= 0; i--) {
    const d = drops[i];
    d.age += dt;
    // деспавн через 5 минут (фикс: раньше дропы копились вечно)
    if (d.age > DROP_LIFETIME) {
      scene.remove(d.mesh); d.mesh.geometry.dispose();
      drops.splice(i, 1); continue;
    }
    // гравитация; в воде дропы всплывают, в ЛАВЕ — тонут (в MC предмет проваливается
    // в лаву и сгорает, а не «сидит» на её поверхности)
    const cellBlk = World.getBlock(Math.floor(d.pos.x), Math.floor(d.pos.y + 0.1), Math.floor(d.pos.z));
    const inWater = isWaterLiquid(cellBlk);
    const inLavaCell = isLavaLiquid(cellBlk);
    if (inWater) {
      d.vel.y += (1.2 - d.vel.y) * Math.min(1, dt * 4); // плавучесть
      d.vel.x *= 0.9; d.vel.z *= 0.9;
    } else if (inLavaCell) {
      d.vel.y += (-1.0 - d.vel.y) * Math.min(1, dt * 3); // медленно тонет в лаве
      d.vel.x *= 0.9; d.vel.z *= 0.9;
    } else {
      d.vel.y -= GRAVITY * dt;
    }
    d.pos.x += d.vel.x * dt;
    d.pos.y += d.vel.y * dt;
    d.pos.z += d.vel.z * dt;
    // приземление на поверхность — только на ТВЁРДОЕ: лава и огонь не «пол»,
    // предмет проваливается в них и сгорает (фикс: раньше дроп лежал на лаве/огне)
    const groundY = Math.floor(d.pos.y - 0.14);
    const groundBlk = World.getBlock(Math.floor(d.pos.x), groundY, Math.floor(d.pos.z));
    if (groundBlk !== BLOCK.AIR && !isLiquid(groundBlk) && groundBlk !== BLOCK.FIRE) {
      if (d.vel.y < 0) {
        d.pos.y = groundY + 1 + 0.14;
        d.vel.y = 0;
        d.vel.x *= 0.6; d.vel.z *= 0.6;
      }
    }
    d.mesh.position.copy(d.pos);
    d.mesh.position.y += Math.sin(d.age * 3) * 0.05 + 0.05; // покачивание
    // плоские дропы (факел и т.д.) — билборд к камере; 3D-кубы — вращаются
    if (isFlatDropBlock(d.id) || !isBlock(d.id)) {
      d.mesh.lookAt(camera.position.x, d.mesh.position.y, camera.position.z);
    } else {
      d.mesh.rotation.y += dt * 1.5;
    }

    // предметы СГОРАЮТ в лаве/огне: короткое шипение с дымом, затем исчезают
    const inBlk = World.getBlock(Math.floor(d.pos.x), Math.floor(d.pos.y + 0.1), Math.floor(d.pos.z));
    if (isLavaLiquid(inBlk) || inBlk === BLOCK.FIRE) {
      d.burnT = (d.burnT || 0) + dt;
      if (d.burnT > 0.3) {
        playSound('break', BLOCK.FIRE);
        spawnParticles(d.pos.x, d.pos.y + 0.3, d.pos.z, 6, '#8a8a84'); // дым сгоревшего предмета
        scene.remove(d.mesh);
        if (d.mesh.geometry) d.mesh.geometry.dispose();
        drops.splice(i, 1);
        continue;
      }
    } else {
      d.burnT = 0;
    }

    // подбор
    if (d.age > d.pickDelay && !PLAYER.dead) {
      const dx = d.pos.x - PLAYER.pos.x;
      const dy = d.pos.y - (PLAYER.pos.y + 0.9);
      const dz = d.pos.z - PLAYER.pos.z;
      const distSq = dx*dx + dy*dy + dz*dz;
      // мягкое притяжение в радиусе ~2 блоков, но НЕ сквозь стены (LOS)
      if (distSq < 2.0 * 2.0 && dropHasLOS(d)) {
        d.pos.x -= dx * dt * 3;
        d.pos.y -= dy * dt * 3;
        d.pos.z -= dz * dt * 3;
      }
      if (distSq < 0.8 * 0.8) {
        // при полном инвентаре дроп НЕ исчезает — попробует подобраться позже (фикс потери)
        if (addToInventory(d.id, 1)) {
          playSound('pickup');
          scene.remove(d.mesh);
          d.mesh.geometry.dispose();
          drops.splice(i, 1);
        } else {
          d.pickDelay = d.age + 1.0; // повторная попытка через секунду
        }
      }
    }
  }
}

