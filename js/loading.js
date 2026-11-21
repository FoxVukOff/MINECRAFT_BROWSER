/* ============================================================
   MiniCraft — loading · Экран загрузки мира, события ввода, состояние ломания
   (модуль 11 из 33; строки 4464–4768 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Экран загрузки: предгенерация чанков перед стартом (без лагов)
// ============================================================
const LOADING_TIPS = [
  'Совет: каменная кирка добывает быстрее деревянной.',
  'Совет: уголь горит дольше дерева — отличное топливо.',
  'Совет: переплавь дерево в печи, чтобы получить древесный уголь.',
  'Совет: открывай рецепты, добывая новые ресурсы (клавиша J).',
  'Совет: свиньи и коровы дают мясо — пожарь его в печи.',
  'Совет: уголь встречается в камне глубоко под землёй.',
  'Совет: держи голод полным, чтобы восстанавливать здоровье.',
];
const DIM_LOAD_TEXT = { nether: 'Загружаемся в Ад…', overworld: 'Загружаемся в Верхний мир…' };
const DIM_LOAD_TIPS = {
  nether: 'Совет: не стройте дом из досок рядом с лавой.',
  overworld: 'Совет: спите по ночам — иначе прилетят фантомы.',
};

// Флаг «идёт загрузка области» (телепорт между измерениями): пока он true,
// главный цикл НЕ симулирует и НЕ рисует — как в MC во время смены измерения.
let _dimLoading = false;

// Прогрев GPU: компиляция всех шейдерных программ + заливка геометрий/текстур
// ЗА экраном загрузки. Раньше всё это случалось в ПЕРВЫЕ кадры после входа
// в мир — отсюда «подлагивает пока чанки прогружаются» (п.7): лаг был не
// в чанках (они уже готовы), а в разовом прогреве GPU.
function gpuWarmUp() {
  try {
    camera.position.set(PLAYER.pos.x, PLAYER.pos.y + PLAYER.eye, PLAYER.pos.z);
    camera.lookAt(PLAYER.pos.x, PLAYER.pos.y + PLAYER.eye, PLAYER.pos.z - 4);
    if (typeof renderer.compile === 'function') renderer.compile(scene, camera);
    if (SHADOWS_ON) renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);   // заливка буферов/текстур на GPU
    renderer.render(scene, camera);   // второй кадр — страховка (ленивые драйверы)
  } catch (e) { /* прогрев не критичен */ }
}

function startWorldLoading() {
  const ls = document.getElementById('loadingScreen');
  const bar = document.getElementById('loadBar');
  const sub = document.getElementById('loadSub');
  const tip = document.getElementById('loadTip');
  overlay.classList.add('hidden');
  ls.classList.add('on');
  tip.textContent = LOADING_TIPS[(Math.random()*LOADING_TIPS.length)|0];
  bar.style.width = '0%';

  // токен отмены: если во время предзагрузки открыт другой мир —
  // старый цикл загрузки завершится сам (раньше работали два rAF-цикла параллельно)
  const myToken = ++startWorldLoading._gen;

  // центр прогрузки — около игрока
  const pcx = Math.floor(PLAYER.pos.x / CHUNK_SIZE);
  const pcz = Math.floor(PLAYER.pos.z / CHUNK_SIZE);
  // список чанков в радиусе, отсортированный от центра
  const list = [];
  for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++)
    for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++)
      list.push({ cx: pcx + dx, cz: pcz + dz, dist: dx*dx + dz*dz });
  list.sort((a, b) => a.dist - b.dist);

  const totalSteps = list.length * 2; // генерация + меширование
  let done = 0;
  let j = 0;       // индекс для меширования
  let phase = 0;   // 0 — генерируем, 1 — мешируем

  // ФАЗА 0 (генерация) — теперь АСИНХРОННО: чанки делают воркеры в отдельных
  // потоках, главный поток ждёт и лишь обновляет прогресс-бар. Фризов нет:
  // браузер спокойно рисует экран загрузки (и анимацию в нём).
  for (const it of list) WorldGenPool.request(it.cx, it.cz);

  function step() {
    if (myToken !== startWorldLoading._gen) return; // загрузка отменена — новый мир грузится
    if (phase === 0) {
      // сколько чанков уже готово (приехали из воркеров / были в кеше)
      let ready = 0;
      for (const it of list) if (World.chunks.has(World.key(it.cx, it.cz))) ready++;
      done = ready;
      bar.style.width = Math.min(100, Math.round(done / totalSteps * 100)) + '%';
      if (ready >= list.length) { phase = 1; sub.textContent = 'Построение чанков'; }
      else {
        // подстраховка: воркеров нет / пали — добираем синхронно, по ~10мс за кадр
        if (!WorldGenPool.workers.length) {
          const t0 = performance.now();
          while (performance.now() - t0 < 10) {
            const it = list.find(i => !World.chunks.has(World.key(i.cx, i.cz)));
            if (!it) break;
            World.getChunk(it.cx, it.cz); // синхронная генерация (фолбэк)
          }
        }
        requestAnimationFrame(step);
        return;
      }
    }
    // ФАЗА 1 — меширование (по-прежнему кусками по ~12мс за кадр)
    const t0 = performance.now();
    while (performance.now() - t0 < 12) {
      if (j >= list.length) break;
      const it = list[j++];
      const k = World.key(it.cx, it.cz);
      const c = World.chunks.get(k);
      if (c && !loadedMeshes.has(k)) {
        const mesh = buildChunkMesh(c);
        scene.add(mesh);
        loadedMeshes.set(k, mesh);
        c.dirty = false;
        done++;
      }
    }
    bar.style.width = Math.min(100, Math.round(done / totalSteps * 100)) + '%';

    if (j >= list.length && phase === 1) {
      // ФАЗА 2 — прогрев GPU (компиляция шейдеров/загрузка буферов — до входа)
      bar.style.width = '100%';
      sub.textContent = 'Подготовка графики…';
      gpuWarmUp();
      sub.textContent = 'Готово!';
      // готово — небольшая пауза для плавности, затем старт
      setTimeout(() => { ls.classList.remove('on'); beginGame(); }, 250);
    } else {
      requestAnimationFrame(step);
    }
  }
  requestAnimationFrame(step);
}

// ============================================================
//  Загрузка области при смене измерения (полоска прогресса, как в MC:
//  «Загружаемся в Ад…» / «Загружаемся в Верхний мир…»).
//  Вызывается из teleportDimension ПОСЛЕ переключения мира и установки
//  игрока. Ждёт: генерация чанков воркерами -> меширование -> прогрев GPU.
// ============================================================
function loadDimensionArea(dimName, onDone) {
  const ls = document.getElementById('loadingScreen');
  const bar = document.getElementById('loadBar');
  const sub = document.getElementById('loadSub');
  const tip = document.getElementById('loadTip');
  const status = document.getElementById('loadStatus');
  ls.classList.add('on');
  ls.classList.toggle('nether', dimName === 'nether'); // багровая тема Ада
  status.textContent = DIM_LOAD_TEXT[dimName] || 'Загрузка измерения…';
  sub.textContent = 'Генерация чанков';
  tip.textContent = DIM_LOAD_TIPS[dimName] || '';
  bar.style.width = '0%';

  const myToken = ++startWorldLoading._gen; // общий токен отмены со стартовой загрузкой

  const pcx = Math.floor(PLAYER.pos.x / CHUNK_SIZE);
  const pcz = Math.floor(PLAYER.pos.z / CHUNK_SIZE);
  const list = [];
  for (let dx = -RENDER_DISTANCE; dx <= RENDER_DISTANCE; dx++)
    for (let dz = -RENDER_DISTANCE; dz <= RENDER_DISTANCE; dz++)
      list.push({ cx: pcx + dx, cz: pcz + dz, dist: dx*dx + dz*dz });
  list.sort((a, b) => a.dist - b.dist);

  const totalSteps = list.length * 2;
  let done = 0;
  let j = 0;
  let phase = 0;

  for (const it of list) WorldGenPool.request(it.cx, it.cz);

  function step() {
    if (myToken !== startWorldLoading._gen) return; // отменено (грузится другой мир/измерение)
    if (phase === 0) {
      let ready = 0;
      for (const it of list) if (World.chunks.has(World.key(it.cx, it.cz))) ready++;
      done = ready;
      bar.style.width = Math.min(100, Math.round(done / totalSteps * 100)) + '%';
      if (ready >= list.length) { phase = 1; sub.textContent = 'Построение чанков'; }
      else {
        if (!WorldGenPool.workers.length) {
          const t0 = performance.now();
          while (performance.now() - t0 < 10) {
            const it = list.find(i => !World.chunks.has(World.key(i.cx, i.cz)));
            if (!it) break;
            World.getChunk(it.cx, it.cz);
          }
        }
        requestAnimationFrame(step);
        return;
      }
    }
    const t0 = performance.now();
    while (performance.now() - t0 < 12) {
      if (j >= list.length) break;
      const it = list[j++];
      const k = World.key(it.cx, it.cz);
      const c = World.chunks.get(k);
      if (c && !loadedMeshes.has(k)) {
        const mesh = buildChunkMesh(c);
        scene.add(mesh);
        loadedMeshes.set(k, mesh);
        c.dirty = false;
        done++;
      }
    }
    bar.style.width = Math.min(100, Math.round(done / totalSteps * 100)) + '%';

    if (j >= list.length && phase === 1) {
      bar.style.width = '100%';
      sub.textContent = 'Подготовка графики…';
      gpuWarmUp();
      sub.textContent = 'Готово!';
      setTimeout(() => {
        ls.classList.remove('on');
        ls.classList.remove('nether');
        status.textContent = 'Генерация мира…'; // вернуть текст для следующей загрузки мира
        onDone();
      }, 250);
    } else {
      requestAnimationFrame(step);
    }
  }
  requestAnimationFrame(step);
}

// запустить игровой процесс (после предзагрузки чанков)
function beginGame() {
  gameStarted = true;
  pausedFromGame = false; // играем, а не на паузе
  document.getElementById('resumeBtn').style.display = 'none';
  overlay.classList.add('hidden');
  document.getElementById('menuBtn').style.display = 'block';
  initAudio();
  canvas.requestPointerLock();
  if (typeof updateChatMiniVisibility === 'function') updateChatMiniVisibility();
  // автосохранение каждые 10 секунд (чаще — надёжнее)
  if (!WorldManager._autosave) {
    WorldManager._autosave = setInterval(() => { if (gameStarted) WorldManager.save(); }, 10000);
  }
}

// отложенное сохранение после изменений (дебаунс, чтобы не писать каждый кадр)
let _saveDebounce = null;
function requestSave() {
  if (!gameStarted) return;
  clearTimeout(_saveDebounce);
  _saveDebounce = setTimeout(() => { if (gameStarted) WorldManager.save(); }, 1500);
}

// сохранять при выходе со страницы
window.addEventListener('beforeunload', (e) => {
  if (gameStarted) {
    WorldManager.save();
    // подтверждение ухода — защита от случайного Ctrl+W / закрытия вкладки
    e.preventDefault();
    e.returnValue = '';
    return '';
  }
});
// сохранять при сворачивании вкладки / потере фокуса (надёжность сейвов)
document.addEventListener('visibilitychange', () => {
  if (document.hidden && gameStarted) WorldManager.save();
});
window.addEventListener('pagehide', () => { if (gameStarted) WorldManager.save(); });

canvas.addEventListener('click', () => {
  if (!pointerLocked && overlay.classList.contains('hidden') && !invOpen && !chatOpen) {
    canvas.requestPointerLock();
  }
});

document.addEventListener('pointerlockchange', () => {
  pointerLocked = document.pointerLockElement === canvas;
});

document.addEventListener('mousemove', (e) => {
  if (!pointerLocked) return;
  const sens = 0.0022;
  PLAYER.yaw   -= e.movementX * sens;
  PLAYER.pitch -= e.movementY * sens;
  const lim = Math.PI / 2 - 0.01;
  PLAYER.pitch = Math.max(-lim, Math.min(lim, PLAYER.pitch));
});

// Универсальный блокировщик: гасит почти все сочетания пока мы в игре,
// чтобы Ctrl+S/Ctrl+D/Ctrl+P/Ctrl+F/Tab/Space и пр. не мешали.
function blockBrowserShortcut(e) {
  if (!gameStarted) return;                 // в меню — не трогаем
  const typing = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
  if (typing) return;                       // в полях ввода — не трогаем
  const code = e.code;
  // Любая модификаторная комбинация в игре — гасим (кроме совсем уж зарезервированных,
  // которые всё равно не отменяются, но preventDefault не повредит).
  if (e.ctrlKey || e.metaKey || e.altKey) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }
  // Tab и Space без модификаторов: Tab уводит фокус, Space скроллит — гасим.
  if (code === 'Tab' || code === 'Space') {
    e.preventDefault();
  }
}

document.addEventListener('keydown', (e) => {
  // игнорировать игровые клавиши, когда печатаем в поле ввода или мир ещё не запущен
  const typing = e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA');
  if (typing) return;

  blockBrowserShortcut(e);

  keys[e.code] = true;
  if (!gameStarted) return;
  // F3 — отладочный экран (только координаты и FPS), как в MC
  if (e.code === 'F3') {
    e.preventDefault();
    debugOpen = !debugOpen;
    hudEl.classList.toggle('on', debugOpen);
  }
  // F5 — перспектива: 1-е лицо → 3-е (за спиной) → 3-е (спереди) — как в MC
  if (e.code === 'F5' && !chatOpen) {
    e.preventDefault();
    camMode = ((typeof camMode !== 'undefined' ? camMode : 0) + 1) % 3;
    showToast(['Вид от 1-го лица', 'Вид от 3-го лица (за спиной)', 'Вид от 3-го лица (спереди)'][camMode]);
  }
  // Креатив: ДВОЙНОЙ ПРОБЕЛ — вкл/выкл полёта (как в Minecraft)
  if (e.code === 'Space' && window.__creative && !e.repeat) {
    const now = performance.now();
    if (now - _lastSpaceTap < 300) {
      PLAYER.flying = !PLAYER.flying;
      if (PLAYER.flying) PLAYER.vel.y = 0;
      showToast(PLAYER.flying ? 'Полёт включён (двойной пробел)' : 'Полёт выключен');
      _lastSpaceTap = 0;
    } else {
      _lastSpaceTap = now;
    }
  }
  if (e.code === 'KeyE') { toggleInventory(); }
  if (e.code === 'KeyJ') { toggleInventory('guide'); } // справочник рецептов
  // Q — выбросить 1 предмет; Ctrl+Q — выбросить весь стак (работает и в инвентаре с курсора)
  if (e.code === 'KeyQ') { dropFromHand(e.ctrlKey || e.metaKey); e.preventDefault(); }
  // F — поменять местами предмет в руке и второй руке (parity MC, клавиша по умолчанию)
  if (e.code === 'KeyF' && !e.repeat) { swapOffhand(); }
  if (e.code.startsWith('Digit')) {
    const n = parseInt(e.code.slice(5), 10);
    if (n >= 1 && n <= HOTBAR_SIZE) selectSlot(n - 1);
  }
  // Escape обрабатывается в отдельном обработчике ниже (инвентарь/меню)
});
let _lastSpaceTap = 0;
document.addEventListener('keyup', (e) => {
  blockBrowserShortcut(e);
  keys[e.code] = false;
});

// Колесо мыши — смена слота
window.addEventListener('wheel', (e) => {
  if (invOpen) return;
  const dir = e.deltaY > 0 ? 1 : -1;
  selectSlot((activeSlot + dir + HOTBAR_SIZE) % HOTBAR_SIZE);
});

// ---------- Ломание / постановка ----------
let leftHeld = false;
canvas.addEventListener('mousedown', (e) => {
  if (!pointerLocked) return;
  if (e.button === 0) {
    if (typeof avatarSwing === 'function') avatarSwing(); // взмах рукой (F5/вьюмодель)
    // сначала пробуем ударить свинью; если попали — не ломаем блок
    if (!tryAttackMob()) leftHeld = true;       // удержание = непрерывное ломание
  }
  if (e.button === 2) {
    if (typeof avatarSwing === 'function') avatarSwing();
    placeBlock();
  }
});
canvas.addEventListener('mouseup', (e) => {
  if (e.button === 0) { leftHeld = false; resetMining(); }
});
canvas.addEventListener('contextmenu', (e) => e.preventDefault());

// Состояние ломания (как в современном майнкрафте)
const mining = {
  active: false,
  x: 0, y: 0, z: 0,   // координаты блока
  block: BLOCK.AIR,
  progress: 0,        // 0..1
};

function resetMining() {
  mining.active = false;
  mining.progress = 0;
  mining.digTimer = 0; // сброс и таймера звука, иначе звук копания играется дважды
  breakOverlay.visible = false;
}

// Вызывается каждый кадр при удержании ЛКМ.
// preTarget — уже вычисленный лучом кадра блок (экономит повторный raycast)
function updateMining(dt, preTarget) {
  if (!leftHeld || invOpen) { if (mining.active) resetMining(); return; }

  const t = (preTarget !== undefined && preTarget !== null) ? preTarget : getTargetBlock();
  if (!t || t.block === BLOCK.BEDROCK || t.y <= 0) { resetMining(); return; }

  // если смотрим на другой блок — начать заново
  if (!mining.active || mining.x !== t.x || mining.y !== t.y || mining.z !== t.z) {
    mining.active = true;
    mining.x = t.x; mining.y = t.y; mining.z = t.z;
    mining.block = t.block;
    mining.progress = 0;
    mining.digTimer = 0;
    playSound('dig', mining.block);
  }

  const held = activeItem();
  const heldId = held ? held.id : 0;

  let time = computeBreakTime(mining.block, heldId);
  // упрощённый креатив (включается /gamemode c при читах): мгновенное ломание
  if (window.__creative) time = 0.05;
  // в MC под водой блоки ломаются в 5 раз дольше (без акваланга)
  if (PLAYER.submerged) time *= 5;
  if (!isFinite(time)) { resetMining(); return; }
  mining.progress += dt / time;

  // звук копания каждые ~0.25с
  mining.digTimer = (mining.digTimer || 0) + dt;
  if (mining.digTimer > 0.22) { mining.digTimer = 0; playSound('dig', mining.block); }

  if (mining.progress >= 1) {
    finishBreak(t);
    resetMining();
    return;
  }

  // показать трещины
  const stage = Math.min(9, Math.floor(mining.progress * 10));
  breakOverlay.material.map = CRACK_TEX[stage];
  breakOverlay.material.needsUpdate = true;
  breakOverlay.position.set(t.x + 0.5, t.y + 0.5, t.z + 0.5);
  breakOverlay.visible = true;
}

