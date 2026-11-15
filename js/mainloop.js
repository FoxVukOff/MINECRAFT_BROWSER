/* ============================================================
   MiniCraft — mainloop · Главный игровой цикл
   (модуль 30 из 33; строки 11157–11311 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Главный цикл
// ============================================================
let last = performance.now();
let _sunFollowX = 1e9, _sunFollowY = 1e9, _sunFollowZ = 1e9;
let _shadowAcc = 0;
// ОПТИМИЗАЦИЯ: переиспользуемые векторы/цвета главного цикла — раньше каждый кадр
// аллоцировалось до 5 объектов THREE (Vector3/Color), зря дёргая GC
const _camDir = new THREE.Vector3(), _camTarget = new THREE.Vector3();
const _skyDay = new THREE.Color(0x87ceeb), _skyNight = new THREE.Color(0x0a1026);
const _skyDusk = new THREE.Color(0xd9763c), _skyTmp = new THREE.Color();
function loop(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.1) dt = 0.1; // ограничить спайки

  // пока мир не выбран — ничего не симулируем и не рисуем.
  // _dimLoading — идёт смена измерения: игра заморожена за экраном загрузки
  // (как в MC), сущности не тикают, игрок не падает.
  if (!gameStarted || _dimLoading) { requestAnimationFrame(loop); return; }

  let t = null, tComputed = false; // цель под прицелом — ОДИН raycast на кадр
  if (!PLAYER.dead && overlay.classList.contains('hidden') && !invOpen && !chatOpen) {
    if (sleepTransition) {
      // игрок спит: не ходит и не копает (как в MC — лежит в кровати)
      if (mining.active) resetMining();
      updateOxygen(dt);
      updateSurvival(dt);
      updateDrops(dt);
    } else {
      updatePlayer(dt);
      updateOxygen(dt);
      updateSurvival(dt);
      updateDrops(dt);
      t = getTargetBlock(); tComputed = true;
      updateMining(dt, t); // переиспользуем тот же луч (раньше — второй raycast)
    }
  } else if (mining.active) {
    resetMining();
  }

  // одиночная игра: в меню (пауза) симуляция мира останавливается, как в MC
  const paused = !overlay.classList.contains('hidden');
  if (!paused) {
    LiquidSim.update(dt);
    FireSim.update(dt);
    updateFallingSand(dt);
    updateLeafDecay(dt);
    updateFurnaces(dt);
    updateDayNight(dt);
    updateSleepTransition(dt);
    updateGlowingOre(dt);
    updateButtons(dt);
    updateRedstone(dt);
    updateAmbientSounds(dt);
  }
  updateAnimatedTextures(dt);
  updateClouds(dt);
  updateParticles(dt);
  if (!PLAYER.dead && overlay.classList.contains('hidden')) updateBoats(dt);
  if (!invOpen && overlay.classList.contains('hidden')) updateMobs(dt);
  updateChunks(dt);

  // солнце и облака не видны в Аду
  const overworldSky = World.dim === 'overworld';
  sunDisc.visible = overworldSky;
  cloudGroup.visible = overworldSky;
  // дневной фактор (0 ночь .. 1 день) управляет яркостью солнца/амбиента/неба
  const dl = overworldSky ? daylight() : 1;
  if (overworldSky) {
    sun.intensity = (SHADOWS_ON ? 0.9 : 0.85) * (0.15 + dl * 0.85) * LIGHT_SCALE;
    ambient.intensity = (SHADOWS_ON ? 0.5 : 0.55) * (0.35 + dl * 0.65) * LIGHT_SCALE;
  } else {
    ambient.intensity = 0.95 * LIGHT_SCALE;
  }
  sun.visible = overworldSky;
  // солнечный диск в небе — в направлении источника света, далеко от игрока
  sunDisc.position.set(PLAYER.pos.x + 140, PLAYER.pos.y + 230, PLAYER.pos.z + 95);

  // солнце следует за игроком (чтобы тени были вокруг него).
  // ОПТИМИЗАЦИЯ: пересчитываем тень только когда игрок заметно сместился —
  // обновление shadow camera каждый кадр заставляет рендерить shadow map заново.
  if (SHADOWS_ON) {
    const dxs = PLAYER.pos.x - _sunFollowX, dzs = PLAYER.pos.z - _sunFollowZ, dys = PLAYER.pos.y - _sunFollowY;
    if (dxs*dxs + dzs*dzs + dys*dys > 64) { // сдвиг > 8 блоков (реже двигаем источник = реже перерисовка теней)
      _sunFollowX = PLAYER.pos.x; _sunFollowY = PLAYER.pos.y; _sunFollowZ = PLAYER.pos.z;
      sun.target.position.set(PLAYER.pos.x, PLAYER.pos.y, PLAYER.pos.z);
      sun.position.set(PLAYER.pos.x + 50, PLAYER.pos.y + 90, PLAYER.pos.z + 35);
      sun.target.updateMatrixWorld();
      shadowNeedsUpdate = true; // солнце сдвинулось — обновить карту теней
    }
    // применяем отложенное обновление карты теней, но не чаще ~3 раз в секунду,
    // чтобы перерисовка shadow map не убивала кадры при движении/частых правках
    _shadowAcc += dt;
    if (shadowNeedsUpdate && _shadowAcc >= 0.33) {
      renderer.shadowMap.needsUpdate = true; shadowNeedsUpdate = false; _shadowAcc = 0;
    }
  }

  // камера
  const eyeY = PLAYER.pos.y + (PLAYER.crouching ? PLAYER.crouchEye : PLAYER.eye);
  camera.position.set(PLAYER.pos.x, eyeY, PLAYER.pos.z);
  _camDir.set(
    -Math.sin(PLAYER.yaw) * Math.cos(PLAYER.pitch),
    Math.sin(PLAYER.pitch),
    -Math.cos(PLAYER.yaw) * Math.cos(PLAYER.pitch)
  );
  camera.lookAt(_camTarget.copy(camera.position).add(_camDir));

  // подсветка цели (в активной игре t уже вычислен; в паузе/меню — луч от стоячей камеры)
  if (!tComputed) t = getTargetBlock();
  if (t) {
    highlight.visible = true;
    highlight.position.set(t.x + 0.5, t.y + 0.5, t.z + 0.5);
  } else {
    highlight.visible = false;
  }

  // fps
  fpsCount++; fpsTime += dt;
  if (fpsTime >= 0.5) { fps = Math.round(fpsCount / fpsTime); fpsCount = 0; fpsTime = 0; }
  // атмосфера: вода / Ад / обычный мир
  if (PLAYER.submerged) {
    scene.fog.color.setHex(0x2a5aa0);
    scene.fog.near = 1; scene.fog.far = 18;
    scene.background.setHex(0x2a5aa0);
  } else if (World.dim === 'nether') {
    // Ад: багровый сумрак, плотный туман, без солнца/облаков
    scene.fog.color.setHex(0x330808);
    scene.fog.near = 4; scene.fog.far = RENDER_DISTANCE * CHUNK_SIZE * 0.85;
    scene.background.setHex(0x330808);
  } else {
    // цвет неба плавно меняется день->закат->ночь (цвета — предсозданные константы)
    let skyCol;
    if (dl > 0.35) {
      skyCol = _skyTmp.copy(_skyNight).lerp(_skyDay, Math.min(1, (dl - 0.35) / 0.45));
    } else {
      // сумерки: подмешиваем оранжевый у горизонта
      const k = dl / 0.35;
      skyCol = _skyTmp.copy(_skyNight).lerp(_skyDusk, k * 0.6);
    }
    scene.fog.color.copy(skyCol);
    scene.fog.near = RENDER_DISTANCE * CHUNK_SIZE * 0.6;
    scene.fog.far = RENDER_DISTANCE * CHUNK_SIZE;
    scene.background.copy(skyCol);
  }

  updateWaterUI();
  // HUD обновляем не каждый кадр (innerHTML дорогой) — ~6 раз в секунду
  hudAcc += dt;
  if (hudAcc >= 0.16) { hudAcc = 0; updateHUD(t); }

  renderer.render(scene, camera);
  requestAnimationFrame(loop);
}
let hudAcc = 0;

