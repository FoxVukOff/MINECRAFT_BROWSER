/* ============================================================
   MiniCraft — menus · UI менеджера миров, меню, настройки
   (модуль 31 из 33; строки 11312–11565 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  UI менеджера миров
// ============================================================
const worldListEl = document.getElementById('worldList');

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return 'только что';
  const m = Math.floor(s / 60); if (m < 60) return m + ' мин назад';
  const h = Math.floor(m / 60); if (h < 24) return h + ' ч назад';
  const d = Math.floor(h / 24); return d + ' дн назад';
}

function renderWorldList() {
  const worlds = WorldManager.list().sort((a, b) => b.updated - a.updated);
  worldListEl.innerHTML = '';
  if (worlds.length === 0) {
    const e = document.createElement('div');
    e.className = 'wm-empty';
    e.textContent = 'Пока нет сохранённых миров — создайте новый выше.';
    worldListEl.appendChild(e);
    return;
  }
  for (const w of worlds) {
    const item = document.createElement('div');
    item.className = 'wm-item';

    const info = document.createElement('div');
    info.className = 'wm-info';
    const nm = document.createElement('div');
    nm.className = 'wm-name';
    nm.textContent = w.name;
    const meta = document.createElement('div');
    meta.className = 'wm-meta';
    // флаги читов и правил: из индекса (быстро), для старых миров — из данных (медленно, один раз)
    let cheatsOn = !!w.cheats;
    let legacyOn = !!w.legacy;
    let creativeOn = false;
    try {
      const d = JSON.parse(localStorage.getItem(WorldManager.LS_PREFIX + w.name));
      // режим игры читаем всегда — он может меняться /gamemode в игре
      creativeOn = !!(d && d.gameMode === 'creative');
      if (w.cheats === undefined || w.legacy === undefined) {
        if (w.cheats === undefined) cheatsOn = !!(d && d.cheatsEnabled);
        if (w.legacy === undefined) legacyOn = !!(d && d.rules && d.rules.legacyDurability);
        w.cheats = cheatsOn; w.legacy = legacyOn; // закешировать в индекс
        const arr1 = WorldManager.list();
        const w1 = arr1.find(x => x.name === w.name);
        if (w1) { w1.cheats = cheatsOn; w1.legacy = legacyOn; WorldManager.saveIndex(arr1); }
      }
    } catch (e) {}
    meta.textContent = 'Сид: ' + w.seed + ' · ' + timeAgo(w.updated)
      + (creativeOn ? ' · креатив ✓' : '') + (cheatsOn ? ' · читы ✓' : '') + (legacyOn ? ' · legacy-прочность ✓' : '');
    info.appendChild(nm); info.appendChild(meta);

    const loadBtn = document.createElement('button');
    loadBtn.className = 'wm-load';
    loadBtn.textContent = 'Играть';
    loadBtn.addEventListener('click', () => WorldManager.load(w.name));

    const delBtn = document.createElement('button');
    delBtn.className = 'wm-del';
    delBtn.textContent = '✕';
    delBtn.title = 'Удалить мир';
    delBtn.addEventListener('click', () => {
      if (confirm('Удалить мир «' + w.name + '»? Это необратимо.')) WorldManager.delete(w.name);
    });

    item.appendChild(info); item.appendChild(loadBtn); item.appendChild(delBtn);
    worldListEl.appendChild(item);
  }
}

document.getElementById('createWorldBtn').addEventListener('click', () => {
  const name = document.getElementById('newWorldName').value;
  const seed = document.getElementById('newWorldSeed').value;
  const creative = document.getElementById('creativeToggle').checked;
  // креатив включает читы (как в MC — команды доступны всегда в креативных мирах)
  const cheats = document.getElementById('cheatsToggle').checked || creative;
  const legacyDur = document.getElementById('legacyDurToggle').checked;
  WorldManager.create(name, seed, cheats, { legacyDurability: legacyDur }, creative);
});

// ---- Навигация главного меню: Играть -> подменю миров -> Назад ----
const mainMenuBox = document.getElementById('mainMenuBox');
const worldsMenuBox = document.getElementById('worldsMenuBox');
document.getElementById('playBtn').addEventListener('click', () => {
  mainMenuBox.style.display = 'none';
  worldsMenuBox.style.display = 'block';
  renderWorldList();
});
document.getElementById('backToMainBtn').addEventListener('click', () => {
  worldsMenuBox.style.display = 'none';
  mainMenuBox.style.display = 'block';
});
// обновление подписи чита-тумблера
const cheatsToggleEl = document.getElementById('cheatsToggle');
const cheatsLabelEl = document.getElementById('cheatsLabel');
function updateCheatsLabel() {
  cheatsLabelEl.textContent = cheatsToggleEl.checked ? 'Читы: Вкл' : 'Читы: Выкл';
}
cheatsToggleEl.addEventListener('change', updateCheatsLabel);
updateCheatsLabel();
// подпись тумблера правила «Legacy-прочность»
const legacyDurToggleEl = document.getElementById('legacyDurToggle');
const legacyDurLabelEl = document.getElementById('legacyDurLabel');
function updateLegacyDurLabel() {
  legacyDurLabelEl.textContent = legacyDurToggleEl.checked ? 'Legacy-прочность: Вкл' : 'Legacy-прочность: Выкл';
}
legacyDurToggleEl.addEventListener('change', updateLegacyDurLabel);
updateLegacyDurLabel();

// подпись тумблера режима (креатив/выживание) при создании мира
const creativeToggleEl = document.getElementById('creativeToggle');
const creativeLabelEl = document.getElementById('creativeLabel');
function updateCreativeLabel() {
  creativeLabelEl.textContent = creativeToggleEl.checked ? 'Режим: Креатив' : 'Режим: Выживание';
  // при выборе креатива читы включаются автоматически (как в MC)
  if (creativeToggleEl.checked) {
    cheatsToggleEl.checked = true;
    updateCheatsLabel();
  }
}
creativeToggleEl.addEventListener('change', updateCreativeLabel);
updateCreativeLabel();

// ---- Настройка прорисовки чанков ----
function setRenderDistance(rd) {
  RENDER_DISTANCE = Math.max(2, Math.min(10, rd | 0));
  localStorage.setItem('minicraft_render_dist', String(RENDER_DISTANCE));
  // обновить туман
  if (!PLAYER.submerged) {
    scene.fog.near = RENDER_DISTANCE * CHUNK_SIZE * 0.6;
    scene.fog.far = RENDER_DISTANCE * CHUNK_SIZE;
  }
  // сразу выгрузить ставшие лишними чанки
  if (gameStarted) {
    const pcx = Math.floor(PLAYER.pos.x / CHUNK_SIZE);
    const pcz = Math.floor(PLAYER.pos.z / CHUNK_SIZE);
    for (const [k, mesh] of loadedMeshes) {
      const [cx, cz] = k.split(',').map(Number);
      if (Math.abs(cx - pcx) > RENDER_DISTANCE + 1 || Math.abs(cz - pcz) > RENDER_DISTANCE + 1) {
        scene.remove(mesh); disposeGroup(mesh); loadedMeshes.delete(k);
      }
    }
  }
}
const renderDistEl = document.getElementById('renderDist');
const rdValueEl = document.getElementById('rdValue');
renderDistEl.value = RENDER_DISTANCE;
rdValueEl.textContent = RENDER_DISTANCE;
renderDistEl.addEventListener('input', () => {
  rdValueEl.textContent = renderDistEl.value;
  setRenderDistance(parseInt(renderDistEl.value, 10));
});

const shadowToggleEl = document.getElementById('shadowToggle');
shadowToggleEl.checked = SHADOWS_ON;
shadowToggleEl.addEventListener('change', () => {
  setShadows(shadowToggleEl.checked);
});

// пауза открыта ИЗ ИГРЫ (мир загружен и стоит на паузе).
// Если false — меню открыто из главного меню, «продолжать» нечего.
let pausedFromGame = false;

// открыть меню (пауза + менеджер миров)
function openMenu() {
  if (!gameStarted) return;
  WorldManager.save();
  document.exitPointerLock();
  if (invOpen) toggleInventory();
  overlay.classList.remove('hidden');
  pausedFromGame = true; // мир загружен — пауза из игры
  // «Продолжить» доступно только когда есть загруженный мир
  document.getElementById('resumeBtn').style.display = 'block';
  // при паузе из игры — показываем подменю миров (чтобы можно было переключиться/создать)
  mainMenuBox.style.display = 'none';
  worldsMenuBox.style.display = 'block';
  renderWorldList();
  if (typeof updateChatMiniVisibility === 'function') updateChatMiniVisibility();
}

// вернуться в мир БЕЗ перезагрузки: скрыть меню и вернуть управление мышью
function resumeGame() {
  if (!pausedFromGame) return; // мир не загружен (главное меню) — продолжать нечего
  pausedFromGame = false;
  document.getElementById('resumeBtn').style.display = 'none';
  overlay.classList.add('hidden');
  if (typeof updateChatMiniVisibility === 'function') updateChatMiniVisibility();
  if (!PLAYER.dead) canvas.requestPointerLock(); // вернуть захват мыши (как после респавна)
}

document.getElementById('resumeBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  resumeGame();
});

document.getElementById('menuBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  openMenu();
});

// Экран смерти: возродиться / в главное меню
document.getElementById('respawnBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  respawnPlayer();
});
document.getElementById('deathMenuBtn').addEventListener('click', (e) => {
  e.stopPropagation();
  // выйти в меню; при возврате в мир игрок возродится у точки спавна
  PLAYER.dead = false;
  PLAYER.hp = PLAYER.maxHp; PLAYER.hunger = PLAYER.maxHunger;
  PLAYER.oxygen = PLAYER.maxOxygen; PLAYER.burnTimer = 0; PLAYER.vel.set(0,0,0);
  // телепорт из Ада теперь С АНИМАЦИЕЙ (асинхронный) — позицию выставляем
  // по завершении перехода (onArrived), а не сразу после вызова
  const placeAtSpawn = () => {
    if (PLAYER.spawnPoint && World.dim === 'overworld') PLAYER.pos.set(PLAYER.spawnPoint.x, PLAYER.spawnPoint.y, PLAYER.spawnPoint.z);
    else spawnPlayer();
  };
  if (World.dim !== 'overworld') teleportDimension('overworld', { onArrived: placeAtSpawn });
  else placeAtSpawn();
  document.getElementById('deathScreen').classList.remove('on');
  openMenu();
});

// тост «Сохранено»
const saveToastEl = document.getElementById('saveToast');
let saveToastTimer = null;
function showSaveToast() {
  saveToastEl.style.display = 'block';
  clearTimeout(saveToastTimer);
  saveToastTimer = setTimeout(() => { saveToastEl.style.display = 'none'; }, 1200);
}

// клавиши: O — сохранить, Esc — меню (когда не открыт инвентарь)
document.addEventListener('keydown', (e) => {
  if (!gameStarted) return;
  // чат: T или / открывают окно ввода
  if (!chatOpen && !invOpen && !cmdBlockUIOpen && (e.code === 'KeyT' || (e.key === '/' && e.code !== 'NumpadDivide'))) {
    e.preventDefault();
    openChat(e.key === '/');
    return;
  }
  if (e.code === 'KeyO') {
    if (WorldManager.save()) showSaveToast();
  }
  if (e.code === 'Escape') {
    if (chatOpen) { closeChat(); return; }
    if (cmdBlockUIOpen) { closeCmdBlockUI(); return; } // закрыть настройку командного блока
    if (PLAYER.dead) return;          // на экране смерти Esc ничего не делает
    if (invOpen) toggleInventory();   // открыт инвентарь -> закрыть его
    else if (!overlay.classList.contains('hidden') && pausedFromGame) {
      resumeGame();                   // меню открыто из игры -> сразу вернуться в мир
    }
    else openMenu();                  // иначе -> меню/пауза
  }
});

