/* ============================================================
   MiniCraft — particles · Система частиц, звуки окружения
   (модуль 25 из 33; строки 9897–10002 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Система частиц (визуальные эффекты: руда, поршень, шаги)
// ============================================================
let particleGroup = null;
function initParticles() {
  if (particleGroup) return;
  particleGroup = new THREE.Group();
  scene.add(particleGroup);
}
function spawnParticles(x, y, z, count, color) {
  if (!particleGroup) initParticles();
  for (let i = 0; i < count; i++) {
    const geo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    const mat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 });
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x + (Math.random()-0.5)*0.4, y + (Math.random()-0.5)*0.4, z + (Math.random()-0.5)*0.4);
    particleGroup.add(m);
    particles.push({
      mesh: m,
      vel: new THREE.Vector3((Math.random()-0.5)*2.5, 1.5 + Math.random()*1.5, (Math.random()-0.5)*2.5),
      life: 0.6 + Math.random()*0.4,
      maxLife: 1.0,
    });
  }
}
function updateParticles(dt) {
  if (particles.length === 0) return;
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) {
      if (particleGroup) particleGroup.remove(p.mesh);
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
      particles.splice(i, 1);
      continue;
    }
    p.vel.y -= 6 * dt; // гравитация частиц
    p.mesh.position.x += p.vel.x * dt;
    p.mesh.position.y += p.vel.y * dt;
    p.mesh.position.z += p.vel.z * dt;
    p.mesh.material.opacity = Math.max(0, p.life / p.maxLife);
    p.mesh.scale.setScalar(Math.max(0.1, p.life / p.maxLife));
  }
}

// ============================================================
//  Динамические звуки окружения
//  - пещерный эмбиент: под землёй при низком освещении — редкие жуткие звуки
// ============================================================
let caveAmbientTimer = 8 + Math.random() * 12;
function updateAmbientSounds(dt) {
  if (!AudioEngine.ctx || !AudioEngine.enabled) return;
  // только в обычном мире (в Аду своя атмосфера)
  if (World.dim !== 'overworld') return;
  // игрок под землёй? (есть твердый блок над головой)
  const hx = Math.floor(PLAYER.pos.x), hy = Math.floor(PLAYER.pos.y + 2), hz = Math.floor(PLAYER.pos.z);
  let overhead = 0;
  for (let y = hy; y < Math.min(WORLD_HEIGHT, hy + 8); y++) {
    const b = World.getBlock(hx, y, hz);
    if (b !== BLOCK.AIR && !isLiquid(b) && b !== BLOCK.LEAVES) { overhead++; }
  }
  if (overhead < 3) return; // не достаточно глубоко
  // уровень освещения у игрока (грубо: небесного света нет, если над головой блок)
  const lowLight = overhead >= 3;
  if (!lowLight) return;
  caveAmbientTimer -= dt;
  if (caveAmbientTimer <= 0) {
    playSound('cave');
    caveAmbientTimer = 14 + Math.random() * 22; // редкие интервалы (14..36 сек)
  }
}

// открыть/закрыть дверь (упрощённо: убираем/возвращаем коллизию делая её проходимой)
function toggleDoor(x, y, z) {
  // найти нижнюю половину
  let by = y;
  if (World.getBlock(x, y, z) === BLOCK.DOOR_TOP) by = y - 1;
  const key = World.ekey(x, by, z);
  const st = World.doorState.get(key) || { open: false, hinge: 'right' };
  st.open = !st.open;
  if (!st.hinge) st.hinge = 'right';
  World.doorState.set(key, st);
  rebuildAround(x, z);
  playSound('place', BLOCK.PLANKS);
}

function intersectsPlayer(bx, by, bz) {
  const px = PLAYER.pos.x, py = PLAYER.pos.y, pz = PLAYER.pos.z;
  const hw = PLAYER.width / 2;
  const minX = px - hw, maxX = px + hw;
  const minY = py, maxY = py + PLAYER.height;
  const minZ = pz - hw, maxZ = pz + hw;
  return (bx + 1 > minX && bx < maxX &&
          by + 1 > minY && by < maxY &&
          bz + 1 > minZ && bz < maxZ);
}

function rebuildAround(wx, wz) {
  const cx = Math.floor(wx / CHUNK_SIZE);
  const cz = Math.floor(wz / CHUNK_SIZE);
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++)
      World.markDirty(cx + dx, cz + dz);
}

