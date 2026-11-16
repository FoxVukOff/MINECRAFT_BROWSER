/* ============================================================
   MiniCraft — hud · HUD: здоровье, голод, броня, отладка F3
   (модуль 29 из 33; строки 10928–11156 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  HUD
// ============================================================
const hudEl = document.getElementById('hud');
const waterOverlayEl = document.getElementById('waterOverlay');
const fireOverlayEl = document.getElementById('fireOverlay');
const statusBarsEl = document.getElementById('statusBars');
const oxygenRowEl = document.getElementById('oxygenRow');
const armorBarEl = document.getElementById('armorBar');
const heartsBarEl = document.getElementById('heartsBar');
const hungerBarEl = document.getElementById('hungerBar');
const fireResRowEl = document.getElementById('fireResRow');
const damageFlashEl = document.getElementById('damageFlash');

// --- Пиксель-арт иконки статуса (рисуем на 9x9, масштаб x2) ---
const ICON_PX = 9, ICON_SCALE = 2;
function statusCanvas(draw) {
  const c = document.createElement('canvas');
  c.width = ICON_PX; c.height = ICON_PX;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  draw(x);
  c.style.width = (ICON_PX*ICON_SCALE) + 'px';
  c.style.height = (ICON_PX*ICON_SCALE) + 'px';
  c.style.imageRendering = 'pixelated';
  return c;
}
function px(x, c, gx, gy, w, h) { x.fillStyle = c; x.fillRect(gx, gy, w||1, h||1); }

// сердце: full | half | empty
function heartIcon(state) {
  return statusCanvas(x => {
    const back = '#3b1414';
    // фон-контур (пустое сердце всегда виден как тёмная подложка)
    const shape = [
      [1,1],[2,1],[6,1],[7,1],
      [0,2],[1,2],[2,2],[3,2],[5,2],[6,2],[7,2],[8,2],
      [0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],
      [1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],
      [2,5],[3,5],[4,5],[5,5],[6,5],
      [3,6],[4,6],[5,6],
      [4,7],
    ];
    // тёмная подложка чуть больше
    for (const [gx,gy] of shape) px(x, back, gx, gy);
    if (state === 'empty') return;
    const red = '#e22';
    const hi = '#ff7a7a';
    for (const [gx,gy] of shape) {
      if (state === 'half' && gx > 4) continue; // правая половина пустая
      px(x, red, gx, gy);
    }
    // блик
    px(x, hi, 1, 2); px(x, hi, 2, 2);
    if (state === 'full') { px(x, hi, 6, 2); }
  });
}

// язычок огня — индикатор огнестойкости (зелье из бартера пиглинов)
function flameIcon() {
  return statusCanvas(x => {
    px(x, '#5a2000', 3, 6, 3, 2);           // основание
    px(x, '#e8641c', 3, 4, 3, 2); px(x, '#e8641c', 4, 3, 1, 1);
    px(x, '#ffb44c', 3, 2, 2, 2); px(x, '#ffd98a', 4, 1, 1, 1);
    px(x, '#fff3c8', 4, 3, 1, 1);           // яркое ядро
  });
}

// голод (ножка/drumstick): full | half | empty
function hungerIcon(state) {
  return statusCanvas(x => {
    const back = '#241a0c';
    const meat = '#9c5a2a', meatHi = '#c47a3e';
    const bone = '#efe6cf';
    // форма мяса (округлый верх) + кость снизу-справа
    const shape = [
      [2,1],[3,1],[4,1],[5,1],
      [1,2],[2,2],[3,2],[4,2],[5,2],[6,2],
      [1,3],[2,3],[3,3],[4,3],[5,3],[6,3],
      [1,4],[2,4],[3,4],[4,4],[5,4],[6,4],
      [2,5],[3,5],[4,5],[5,5],
      [3,6],[4,6],
    ];
    for (const [gx,gy] of shape) px(x, back, gx, gy);
    if (state !== 'empty') {
      for (const [gx,gy] of shape) {
        if (state === 'half' && gx > 3) continue;
        px(x, meat, gx, gy);
      }
      px(x, meatHi, 2, 2); px(x, meatHi, 3, 2);
    }
    // кость (всегда видна, торчит вниз-вправо)
    px(x, bone, 4, 6); px(x, bone, 5, 6); px(x, bone, 5, 7); px(x, bone, 6, 7);
    px(x, '#cfc4a6', 6, 6);
  });
}

// пузырёк воздуха: full | half(лопается) | empty
function bubbleIcon(state) {
  return statusCanvas(x => {
    if (state === 'empty') return;
    const ring = '#0a2a4a', fill = '#3a86d8', hi = '#bfe3ff';
    const shape = [
      [3,1],[4,1],[5,1],
      [2,2],[3,2],[4,2],[5,2],[6,2],
      [1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],
      [1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],
      [2,5],[3,5],[4,5],[5,5],[6,5],
      [3,6],[4,6],[5,6],
    ];
    // контур
    for (const [gx,gy] of shape) px(x, ring, gx, gy);
    if (state === 'full') {
      // заливка чуть внутри
      const inner = [[3,2],[4,2],[5,2],[2,3],[3,3],[4,3],[5,3],[6,3],[2,4],[3,4],[4,4],[5,4],[6,4],[3,5],[4,5],[5,5],[4,6]];
      for (const [gx,gy] of inner) px(x, fill, gx, gy);
      px(x, hi, 3, 2); px(x, hi, 2, 3); // блик
    } else {
      // half — лопающийся, частичная заливка
      const inner = [[3,2],[4,2],[2,3],[3,3],[4,3],[5,3],[3,4],[4,4],[5,4]];
      for (const [gx,gy] of inner) px(x, fill, gx, gy);
      px(x, hi, 3, 2);
    }
  });
}

// иконка брони (нагрудник): full | half | empty
function armorIcon(state) {
  return statusCanvas(x => {
    const back = '#23262b';
    const shape = [
      [1,1],[2,1],[6,1],[7,1],
      [1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],
      [1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],
      [2,4],[3,4],[4,4],[5,4],[6,4],
      [2,5],[3,5],[4,5],[5,5],[6,5],
      [2,6],[3,6],[5,6],[6,6],
    ];
    for (const [gx,gy] of shape) px(x, back, gx, gy);
    if (state === 'empty') return;
    const steel = '#c4c8cf', hi = '#eef1f5';
    for (const [gx,gy] of shape) {
      if (state === 'half' && gx > 4) continue;
      px(x, steel, gx, gy);
    }
    px(x, hi, 2, 2); px(x, hi, 3, 2);
    if (state === 'full') px(x, hi, 6, 2);
  });
}

let _lastStatus = '';
function updateWaterUI() {
  // синий оверлей когда голова под водой
  waterOverlayEl.classList.toggle('on', !!PLAYER.submerged);
  // оранжевый оверлей огня при горении
  fireOverlayEl.classList.toggle('on', (PLAYER.burnTimer || 0) > 0 || !!PLAYER.submergedLava);
  // красная вспышка урона
  damageFlashEl.style.background = 'rgba(180,20,20,' + (PLAYER.damageFlash * 0.35).toFixed(3) + ')';

  // показываем полосы в игре; в КРЕАТИВЕ полос нет (parity MC)
  const inGame = gameStarted && overlay.classList.contains('hidden') && !window.__creative;
  statusBarsEl.classList.toggle('on', inGame);
  if (!inGame) { _lastStatus = ''; return; }

  // подпись состояния, чтобы не перерисовывать каждый кадр
  const hp = Math.max(0, Math.round(PLAYER.hp));
  const hunger = Math.max(0, Math.round(PLAYER.hunger));
  const oxy = Math.max(0, Math.ceil(PLAYER.oxygen));
  const showOxy = PLAYER.submerged || PLAYER.oxygen < PLAYER.maxOxygen - 0.01;
  const armorPts = totalArmorPoints();
  const fr = Math.ceil(PLAYER.fireResT || 0); // огнестойкость (бартер) — до целых секунд
  const sig = hp + '|' + hunger + '|' + (showOxy ? oxy : 'x') + '|' + armorPts + '|' + fr;
  if (sig === _lastStatus) return;
  _lastStatus = sig;

  // --- броня (10 иконок = 20 очков) слева сверху, показываем только если есть броня ---
  armorBarEl.innerHTML = '';
  if (armorPts > 0) {
    for (let i = 0; i < 10; i++) {
      const v = armorPts - i * 2;
      const st = v >= 2 ? 'full' : (v === 1 ? 'half' : 'empty');
      armorBarEl.appendChild(armorIcon(st));
    }
  }

  // --- огнестойкость (зелье из бартера пиглинов): огонёк + таймер ---
  fireResRowEl.innerHTML = '';
  fireResRowEl.classList.toggle('hidden', fr <= 0);
  if (fr > 0) {
    fireResRowEl.appendChild(flameIcon());
    const frText = document.createElement('span');
    const mm2 = Math.floor(fr / 60), ss2 = (fr % 60).toString().padStart(2, '0');
    frText.textContent = mm2 + ':' + ss2;
    fireResRowEl.appendChild(frText);
  }

  // --- сердца (10 шт = 20 hp) ---
  heartsBarEl.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const v = hp - i * 2;
    const st = v >= 2 ? 'full' : (v === 1 ? 'half' : 'empty');
    heartsBarEl.appendChild(heartIcon(st));
  }
  // --- голод (10 шт = 20) справа, рисуем в обратном порядке (визуально как в MC) ---
  hungerBarEl.innerHTML = '';
  for (let i = 0; i < 10; i++) {
    const idxR = 9 - i; // правый край = первый
    const v = hunger - idxR * 2;
    const st = v >= 2 ? 'full' : (v === 1 ? 'half' : 'empty');
    hungerBarEl.appendChild(hungerIcon(st));
  }
  // --- кислород (только под водой) ---
  oxygenRowEl.innerHTML = '';
  oxygenRowEl.classList.toggle('hidden', !showOxy);
  if (showOxy) {
    for (let i = 0; i < 10; i++) {
      const v = oxy - i * 1; // 10 пузырьков = maxOxygen(10)
      const st = v >= 1 ? 'full' : 'empty';
      if (st !== 'empty') oxygenRowEl.appendChild(bubbleIcon(st));
      else { const sp = document.createElement('canvas'); sp.width=ICON_PX; sp.height=ICON_PX; sp.style.width=(ICON_PX*ICON_SCALE)+'px'; sp.style.height=(ICON_PX*ICON_SCALE)+'px'; oxygenRowEl.appendChild(sp); }
    }
  }
}

let fpsTime = 0, fpsCount = 0, fps = 0;
let debugOpen = false; // F3-экран выключен по умолчанию (как в MC)
function updateHUD(t) {
  // F3-экран: ТОЛЬКО координаты и FPS (остальное убрано из игрового HUD).
  // Когда закрыт — innerHTML не трогаем вовсе (экономия DOM-обновлений).
  if (debugOpen) {
    hudEl.textContent =
      `XYZ: ${PLAYER.pos.x.toFixed(2)} / ${PLAYER.pos.y.toFixed(2)} / ${PLAYER.pos.z.toFixed(2)}\n` +
      `FPS: ${fps}`;
  }
  // всплывающая подсказка с названием блока под прицелом
  const tip = document.getElementById('blockTooltip');
  if (tip) {
    if (t && t.block !== BLOCK.AIR) {
      const held = activeItem();
      let txt = BLOCK_NAMES[t.block] || '';
      if (held && held.id && BLOCK_NAMES[held.id]) {
        txt += '  ·  ' + BLOCK_NAMES[held.id];
      }
      tip.textContent = txt;
      tip.classList.add('on');
    } else {
      tip.classList.remove('on');
    }
  }
  // индикатор времени суток скрыт по запросу (убран из HUD)
}

