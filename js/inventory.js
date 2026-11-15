/* ============================================================
   MiniCraft — inventory · Инвентарь: слоты, стопки, иконки, хотбар
   (модуль 12 из 33; строки 4769–5408 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Инвентарь по слотам (как в Minecraft) + крафт
// ============================================================
const HOTBAR_SIZE = 9;
const INV_ROWS = 3, INV_COLS = 9;       // основное хранилище 27
const TOTAL_SLOTS = HOTBAR_SIZE + INV_ROWS * INV_COLS; // 36
let activeSlot = 0;
let invOpen = false;
let craftMode = '2x2';                   // '2x2' (инвентарь) или '3x3' (верстак)

// Слоты: 0..8 — хотбар, 9..35 — хранилище. Каждый: {id, count} или null
const slots = new Array(TOTAL_SLOTS).fill(null);
// Слоты крафта (до 9) и результат
const craftSlots = new Array(9).fill(null);
let craftResult = null;
// Предмет «на курсоре» (взятый мышью)
let cursorItem = null;

// Открытые ресурсы (для справочника): id предметов, которые игрок держал в руках
let discovered = new Set();
// отметить ресурс как полученный (открывает связанные рецепты в справочнике)
function onObtain(id) {
  if (id === undefined || id === null) return;
  if (!discovered.has(id)) {
    discovered.add(id);
    // если открыт справочник — обновить
    if (invOpen && craftMode === 'guide') renderInventory();
  }
}

// Максимальный размер стопки (как в MC): инструменты/броня не складываются,
// вёдра и двери — по 16, остальное — 64
function maxStack(id) {
  if (isTool(id) || isArmor(id) || id === ITEM.SHEARS || id === ITEM.FLINT_AND_STEEL || id === ITEM.BOAT) return 1;
  if (id === ITEM.BUCKET || id === ITEM.WATER_BUCKET || id === ITEM.LAVA_BUCKET || id === ITEM.DOOR) return 16;
  return MAX_STACK;
}

// ---- Базовые операции со стопками ----
function addToInventory(id, n = 1, dur) {
  onObtain(id); // открыть ресурс для справочника
  let firstDur = dur; // прочность переносится на первую положенную единицу
  // сначала докинуть в существующие стопки
  for (let i = 0; i < TOTAL_SLOTS && n > 0; i++) {
    const s = slots[i];
    if (s && s.id === id && s.count < maxStack(id) && s.dur === undefined) {
      const can = Math.min(n, maxStack(id) - s.count);
      s.count += can; n -= can;
    }
  }
  // затем в пустые слоты (приоритет хотбару)
  for (let i = 0; i < TOTAL_SLOTS && n > 0; i++) {
    if (!slots[i]) {
      const can = Math.min(n, maxStack(id));
      slots[i] = { id, count: can, ...(firstDur !== undefined ? { dur: firstDur } : {}) };
      firstDur = undefined; // прочность — только у первой единицы
      n -= can;
    }
  }
  refreshUI();
  return n === 0; // false если не всё влезло
}

function countItem(id) {
  let c = 0;
  for (const s of slots) if (s && s.id === id) c += s.count;
  return c;
}

// убрать n штук id из инвентаря (для постановки блока)
function removeFromInventory(id, n = 1) {
  if (countItem(id) < n) return false;
  for (let i = 0; i < TOTAL_SLOTS && n > 0; i++) {
    const s = slots[i];
    if (s && s.id === id) {
      const take = Math.min(n, s.count);
      s.count -= take; n -= take;
      if (s.count <= 0) slots[i] = null;
    }
  }
  refreshUI();
  return true;
}

function selectSlot(i) { activeSlot = i; renderHotbar(); }

// активный предмет хотбара (для постановки блоков)
function activeItem() { return slots[activeSlot]; }

// предмет во второй руке (parity MC offhand)
function offhandItem() { return PLAYER.offhand; }

// F — поменять местами активный слот и вторую руку (как в Minecraft)
function swapOffhand() {
  const main = slots[activeSlot];
  slots[activeSlot] = PLAYER.offhand;
  PLAYER.offhand = main;
  playSound('pop');
  refreshUI();
  if (typeof requestSave === 'function') requestSave();
}

// списать 1 предмет из ВТОРОЙ РУКИ при использовании (креатив — бесконечно)
function consumeOffhandItem(slot) {
  if (window.__creative) return;
  slot.count--;
  if (slot.count <= 0) PLAYER.offhand = null;
}

// списать 1 предмет при использовании/постановке (активная рука ИЛИ вторая —
// контейнер определяется по самому объекту). Креатив: бесконечно (parity MC)
function consumeHeldItem(slot) {
  if (window.__creative) return;
  slot.count--;
  if (slot.count <= 0) {
    if (PLAYER.offhand && slot === PLAYER.offhand) PLAYER.offhand = null;
    else if (slots[activeSlot] && slot === slots[activeSlot]) slots[activeSlot] = null;
  }
}

// ---- Иконки блоков и предметов ----
function iconCanvas(id, size) {
  const c = document.createElement('canvas');
  c.width = size; c.height = size;
  const ctx = c.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Предметы рисуем вручную
  if (id === ITEM.STICK) {
    ctx.strokeStyle = '#7a5326'; ctx.lineWidth = Math.max(2, size/9);
    ctx.beginPath(); ctx.moveTo(size*0.7, size*0.2); ctx.lineTo(size*0.3, size*0.8); ctx.stroke();
    return c;
  }
  // цвет головки инструмента по материалу
  const toolHeadColor = (idd) => {
    if (idd === ITEM.STONE_PICKAXE || idd === ITEM.STONE_AXE || idd === ITEM.STONE_SHOVEL || idd === ITEM.STONE_SWORD) return '#8a8a8a';
    if (idd === ITEM.COPPER_PICKAXE || idd === ITEM.COPPER_AXE || idd === ITEM.COPPER_SHOVEL || idd === ITEM.COPPER_SWORD) return '#d07a40';
    if (idd === ITEM.IRON_PICKAXE || idd === ITEM.IRON_AXE || idd === ITEM.IRON_SHOVEL || idd === ITEM.IRON_SWORD) return '#e2e2e8';
    if (idd === ITEM.DIAMOND_PICKAXE || idd === ITEM.DIAMOND_AXE || idd === ITEM.DIAMOND_SHOVEL || idd === ITEM.DIAMOND_SWORD) return '#3fd6e0';
    return '#b98e4d'; // деревянный
  };
  // алмаз — гранёный голубой кристалл
  if (id === ITEM.DIAMOND) {
    const u = size/16;
    ctx.fillStyle = '#3fd6e0';
    ctx.beginPath();
    ctx.moveTo(8*u,2*u); ctx.lineTo(13*u,7*u); ctx.lineTo(8*u,14*u); ctx.lineTo(3*u,7*u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#bff7ff'; // верхняя грань (блик)
    ctx.beginPath(); ctx.moveTo(8*u,2*u); ctx.lineTo(13*u,7*u); ctx.lineTo(8*u,7*u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1f9fb0'; // нижняя тень
    ctx.beginPath(); ctx.moveTo(3*u,7*u); ctx.lineTo(8*u,14*u); ctx.lineTo(8*u,7*u); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#0d6f80'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(8*u,2*u); ctx.lineTo(13*u,7*u); ctx.lineTo(8*u,14*u); ctx.lineTo(3*u,7*u); ctx.closePath(); ctx.stroke();
    return c;
  }
  // кремень — тёмно-серый осколок
  if (id === ITEM.FLINT) {
    const u = size/16;
    ctx.fillStyle = '#3a3a3e';
    ctx.beginPath();
    ctx.moveTo(4*u,11*u); ctx.lineTo(6*u,5*u); ctx.lineTo(11*u,4*u); ctx.lineTo(13*u,9*u); ctx.lineTo(9*u,13*u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#56565c'; // грань-блик
    ctx.beginPath(); ctx.moveTo(6*u,5*u); ctx.lineTo(11*u,4*u); ctx.lineTo(9*u,8*u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1f1f22';
    ctx.fillRect(9*u,10*u,2*u,2*u);
    return c;
  }
  // зажигалка — кремень + стальное огниво
  if (id === ITEM.FLINT_AND_STEEL) {
    const u = size/16;
    // стальная скоба
    ctx.strokeStyle = '#c4c8cf'; ctx.lineWidth = Math.max(2,u*1.4);
    ctx.beginPath(); ctx.moveTo(4*u,5*u); ctx.quadraticCurveTo(3*u,11*u,9*u,12*u); ctx.stroke();
    ctx.strokeStyle = '#8a9098'; ctx.lineWidth = Math.max(1,u);
    ctx.beginPath(); ctx.moveTo(5*u,6*u); ctx.lineTo(4*u,9*u); ctx.stroke();
    // кремень
    ctx.fillStyle = '#3a3a3e';
    ctx.beginPath(); ctx.moveTo(9*u,3*u); ctx.lineTo(13*u,4*u); ctx.lineTo(12*u,8*u); ctx.lineTo(9*u,7*u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#56565c'; ctx.fillRect(10*u,4*u,1*u,1*u);
    // искра
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(11*u,9*u,1*u,1*u); ctx.fillRect(12*u,10*u,1*u,1*u);
    return c;
  }
  // лодка — деревянная иконка
  if (id === ITEM.BOAT) {
    const u = size/16;
    ctx.fillStyle = '#9c6b35';
    ctx.beginPath();
    ctx.moveTo(2*u,7*u); ctx.lineTo(14*u,7*u); ctx.lineTo(12*u,12*u); ctx.lineTo(4*u,12*u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7a5326'; ctx.fillRect(3*u,8*u,10*u,1*u); // борт-тень
    ctx.fillStyle = '#b98e4d'; ctx.fillRect(2*u,7*u,12*u,1*u); // верхний борт
    // весло
    ctx.strokeStyle = '#6e4a22'; ctx.lineWidth = Math.max(1,u);
    ctx.beginPath(); ctx.moveTo(11*u,5*u); ctx.lineTo(14*u,9*u); ctx.stroke();
    return c;
  }
  // кожа — коричневый кусок шкуры
  if (id === ITEM.LEATHER) {
    const u = size/16;
    ctx.fillStyle = '#8a5a32';
    ctx.fillRect(3*u,4*u,10*u,8*u);
    ctx.fillStyle = '#a06a3c'; ctx.fillRect(4*u,5*u,8*u,3*u);
    ctx.fillStyle = '#6e472488'; ctx.fillRect(3*u,10*u,10*u,1*u);
    ctx.strokeStyle = '#5e3a1e'; ctx.lineWidth=1; ctx.strokeRect(3*u,4*u,10*u,8*u);
    // стежки
    ctx.fillStyle = '#c89a6a'; for (let i=4;i<12;i+=2) ctx.fillRect(i*u,4*u,1*u,1*u);
    return c;
  }
  // ПЕРО (фикс: раньше не было своей иконки и рисовалось серым квадратом-фолбэком)
  if (id === ITEM.FEATHER) {
    const u = size/16;
    // стержень по диагонали (снизу-слева вверх-направо)
    ctx.strokeStyle = '#c9b892'; ctx.lineWidth = Math.max(1, u*0.9);
    ctx.beginPath(); ctx.moveTo(3.4*u, 13.4*u); ctx.lineTo(12.6*u, 2.6*u); ctx.stroke();
    // опахало — белые «борозды» по обе стороны от стержня
    const barbs = [
      // верхняя сторона (выше стержня)
      [6,11,8,9], [8,9,10,7], [10,7,12,5], [11.6,5.4,13,4],
      // нижняя сторона (ниже стержня)
      [5,10,7,8.4], [7,8,9,6], [9,6,11,4.4],
    ];
    ctx.fillStyle = '#f4f4f0';
    for (const [x1,y1,x2,y2] of barbs) {
      ctx.beginPath();
      ctx.moveTo(x1*u, y1*u);
      ctx.lineTo(x2*u, y2*u);
      ctx.lineTo((x2-0.6)*u, (y2+1.2)*u);
      ctx.lineTo((x1-0.6)*u, (y1+1.4)*u);
      ctx.closePath(); ctx.fill();
    }
    // тень-гребень на опахале (лёгкий серый оттенок снизу)
    ctx.fillStyle = '#d8d8d2';
    ctx.beginPath(); ctx.moveTo(5*u,11.6*u); ctx.lineTo(7*u,9.6*u); ctx.lineTo(6.4*u,10.8*u); ctx.closePath(); ctx.fill();
    // очин — светлое основание стержня
    ctx.fillStyle = '#e8e0c8';
    ctx.fillRect(3*u,13*u,2*u,2*u);
    // контур опахала сверху
    ctx.strokeStyle = '#c2c2ba'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(6*u,10.2*u); ctx.lineTo(12.4*u,3.8*u); ctx.stroke();
    return c;
  }
  // НИТЬ (выпадает с пауков — как в MC): моток светло-серых волокон
  if (id === ITEM.STRING) {
    const u = size/16;
    // моток: три наложенных «кольца»
    const rings = [
      { cx: 8, cy: 8, rx: 4.6, ry: 2.6, rot: -0.5, main: '#e8e4da', dark: '#b8b2a4' },
      { cx: 8, cy: 8, rx: 3.4, ry: 4.4, rot:  0.6, main: '#dcd6c8', dark: '#a8a294' },
      { cx: 8, cy: 8, rx: 2.2, ry: 3.2, rot: -0.2, main: '#f2efe6', dark: '#c4beb0' },
    ];
    for (const r of rings) {
      ctx.save();
      ctx.translate(r.cx*u, r.cy*u); ctx.rotate(r.rot);
      ctx.strokeStyle = r.main; ctx.lineWidth = Math.max(2, u*1.6);
      ctx.beginPath(); ctx.ellipse(0, 0, r.rx*u, r.ry*u, 0, 0, Math.PI*2); ctx.stroke();
      ctx.strokeStyle = r.dark; ctx.lineWidth = Math.max(1, u*0.6);
      ctx.beginPath(); ctx.ellipse(0, 0, r.rx*u, r.ry*u, 0, Math.PI*0.15, Math.PI*1.05); ctx.stroke();
      ctx.restore();
    }
    // свисающий кончик нити
    ctx.strokeStyle = '#dcd6c8'; ctx.lineWidth = Math.max(1, u*0.9);
    ctx.beginPath(); ctx.moveTo(11.6*u, 9.2*u); ctx.quadraticCurveTo(13*u, 11*u, 12.2*u, 13.4*u); ctx.stroke();
    return c;
  }
  // фантомная мембрана — серо-бирюзовая кожистая плёнка с прожилками (как в MC)
  if (id === ITEM.PHANTOM_MEMBRANE) {
    const u = size/16;
    // тело плёнки — неровный многоугольник
    ctx.fillStyle = '#5d7a82';
    ctx.beginPath();
    ctx.moveTo(3.6*u,6.8*u); ctx.lineTo(6.2*u,3.8*u); ctx.lineTo(11*u,3.2*u);
    ctx.lineTo(13.4*u,6.4*u); ctx.lineTo(12.4*u,11.2*u); ctx.lineTo(8.6*u,13.6*u);
    ctx.lineTo(4.4*u,12.4*u); ctx.lineTo(2.8*u,9.4*u); ctx.closePath(); ctx.fill();
    // светлая кромка сверху
    ctx.fillStyle = '#7e9ba3';
    ctx.beginPath();
    ctx.moveTo(6.2*u,3.8*u); ctx.lineTo(11*u,3.2*u); ctx.lineTo(13.4*u,6.4*u);
    ctx.lineTo(10.4*u,6.2*u); ctx.lineTo(6.8*u,5.2*u); ctx.closePath(); ctx.fill();
    // прожилки (тёмные ветвящиеся линии)
    ctx.strokeStyle = '#3d565e'; ctx.lineWidth = Math.max(1, u*0.8);
    ctx.beginPath();
    ctx.moveTo(5*u,11.6*u); ctx.quadraticCurveTo(7.4*u,9*u,7.2*u,6.2*u);
    ctx.moveTo(7.4*u,9.4*u); ctx.quadraticCurveTo(10*u,8.6*u,12.2*u,6.8*u);
    ctx.moveTo(6*u,10.6*u); ctx.quadraticCurveTo(9.4*u,11.4*u,11.4*u,10.4*u);
    ctx.stroke();
    // блик
    ctx.fillStyle = '#9cb8be';
    ctx.fillRect(5.4*u,4.6*u,1.4*u,1.4*u);
    return c;
  }
  // Яйца спавна мобов: форма яйца + крапинки (цвета как в MC, по типу моба)
  if (SPAWN_EGGS[id]) {
    const e = SPAWN_EGGS[id];
    const u = size/16;
    // скорлупа (основной цвет)
    ctx.fillStyle = e.base;
    ctx.beginPath();
    ctx.moveTo(8*u, 2.2*u);
    ctx.bezierCurveTo(12.2*u, 2.2*u, 13.6*u, 7.5*u, 13.6*u, 9.4*u);
    ctx.bezierCurveTo(13.6*u, 12.6*u, 11.2*u, 14.2*u, 8*u, 14.2*u);
    ctx.bezierCurveTo(4.8*u, 14.2*u, 2.4*u, 12.6*u, 2.4*u, 9.4*u);
    ctx.bezierCurveTo(2.4*u, 7.5*u, 3.8*u, 2.2*u, 8*u, 2.2*u);
    ctx.closePath(); ctx.fill();
    // крапинки (второй цвет моба)
    ctx.fillStyle = e.spots;
    const dots = [[5.2,7.2,1.4],[8.4,5.4,1.2],[10.8,8.6,1.5],[6.4,10.8,1.3],[9.2,11.8,1.0],[4.6,11.4,0.9],[11.6,11.4,0.8]];
    for (const [ddx, ddy, ddr] of dots) { ctx.beginPath(); ctx.arc(ddx*u, ddy*u, ddr*u, 0, Math.PI*2); ctx.fill(); }
    // блик сверху-слева
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.beginPath(); ctx.ellipse(5.6*u, 5.6*u, 1.1*u, 1.7*u, -0.6, 0, Math.PI*2); ctx.fill();
    return c;
  }
  // броня — рисуем по типу куска + цвету материала
  if (isArmor(id)) {
    const u = size/16;
    const isDia = (id>=ITEM.DIAMOND_HELMET), isIron = (id>=ITEM.IRON_HELMET && id<=ITEM.IRON_BOOTS);
    const isCopper = (id>=ITEM.COPPER_HELMET && id<=ITEM.COPPER_BOOTS);
    const mat = isDia ? '#3fd6e0' : isIron ? '#cfd3da' : isCopper ? '#d07a40' : '#8a5a32';
    const dark = isDia ? '#1f9fb0' : isIron ? '#9aa0a8' : isCopper ? '#9c4f22' : '#5e3a1e';
    const sl = armorSlotOf(id);
    ctx.fillStyle = mat;
    if (sl === 'helmet') { ctx.fillRect(4*u,3*u,8*u,5*u); ctx.fillStyle=dark; ctx.fillRect(4*u,7*u,8*u,1*u); ctx.fillStyle='#0008'; ctx.fillRect(6*u,5*u,4*u,2*u); }
    else if (sl === 'chestplate') { ctx.fillRect(3*u,3*u,10*u,3*u); ctx.fillRect(4*u,6*u,8*u,7*u); ctx.fillStyle=dark; ctx.fillRect(4*u,9*u,8*u,1*u); ctx.fillStyle=mat; ctx.fillRect(2*u,4*u,2*u,4*u); ctx.fillRect(12*u,4*u,2*u,4*u); }
    else if (sl === 'leggings') { ctx.fillRect(4*u,3*u,8*u,4*u); ctx.fillRect(4*u,7*u,3*u,7*u); ctx.fillRect(9*u,7*u,3*u,7*u); ctx.fillStyle=dark; ctx.fillRect(7*u,4*u,2*u,3*u); }
    else { ctx.fillRect(3*u,8*u,4*u,5*u); ctx.fillRect(9*u,8*u,4*u,5*u); ctx.fillStyle=dark; ctx.fillRect(3*u,12*u,4*u,1*u); ctx.fillRect(9*u,12*u,4*u,1*u); }
    return c;
  }
  // ведро (пустое/вода/лава)
  if (id === ITEM.BUCKET || id === ITEM.WATER_BUCKET || id === ITEM.LAVA_BUCKET) {
    const u = size/16;
    // содержимое внутри ведра
    if (id === ITEM.WATER_BUCKET) { ctx.fillStyle = '#3a86d8'; ctx.fillRect(4*u,5*u,8*u,3*u); }
    if (id === ITEM.LAVA_BUCKET) { ctx.fillStyle = '#e85a18'; ctx.fillRect(4*u,5*u,8*u,3*u); ctx.fillStyle='#ffd24a'; ctx.fillRect(6*u,5*u,2*u,1*u); }
    // корпус ведра (трапеция) — железо
    ctx.fillStyle = '#c4c8cf';
    ctx.beginPath();
    ctx.moveTo(3*u,7*u); ctx.lineTo(13*u,7*u); ctx.lineTo(11*u,14*u); ctx.lineTo(5*u,14*u); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9aa0a8'; ctx.fillRect(3*u,7*u,10*u,1*u); // ободок
    ctx.fillStyle = '#e6e9ee'; ctx.fillRect(5*u,8*u,1*u,5*u);  // блик
    // ручка-дужка
    ctx.strokeStyle = '#8a9098'; ctx.lineWidth = Math.max(1,u);
    ctx.beginPath(); ctx.moveTo(4*u,7*u); ctx.quadraticCurveTo(8*u,2*u,12*u,7*u); ctx.stroke();
    return c;
  }
  // меч: ручка-крестовина + клинок
  if (isSword(id)) {
    const u = size/16;
    // рукоять (по диагонали снизу-справа)
    ctx.strokeStyle = '#7a5326'; ctx.lineWidth = Math.max(2, size/9);
    ctx.beginPath(); ctx.moveTo(11*u, 12*u); ctx.lineTo(13*u, 14*u); ctx.stroke();
    // крестовина (гарда)
    ctx.strokeStyle = '#5b4423'; ctx.lineWidth = Math.max(2, size/10);
    ctx.beginPath(); ctx.moveTo(8*u, 12*u); ctx.lineTo(12*u, 8*u); ctx.stroke();
    // клинок
    ctx.fillStyle = toolHeadColor(id);
    ctx.beginPath();
    ctx.moveTo(2*u,14*u); ctx.lineTo(11*u,5*u); ctx.lineTo(13*u,3*u); ctx.lineTo(12*u,2*u);
    ctx.lineTo(10*u,4*u); ctx.lineTo(3*u,12*u); ctx.closePath(); ctx.fill();
    // блик на клинке
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(4*u,11*u); ctx.lineTo(10*u,5*u); ctx.stroke();
    return c;
  }
  if (isPickaxe(id)) {
    // ручка
    ctx.strokeStyle = '#7a5326'; ctx.lineWidth = Math.max(2, size/8);
    ctx.beginPath(); ctx.moveTo(size*0.62, size*0.28); ctx.lineTo(size*0.34, size*0.82); ctx.stroke();
    ctx.strokeStyle = toolHeadColor(id);
    ctx.lineWidth = Math.max(3, size/6);
    ctx.beginPath(); ctx.moveTo(size*0.3, size*0.32); ctx.quadraticCurveTo(size*0.62, size*0.18, size*0.82, size*0.34); ctx.stroke();
    return c;
  }
  // топор: ручка + клиновидное лезвие сбоку
  if (isAxe(id)) {
    const u = size/16;
    ctx.strokeStyle = '#7a5326'; ctx.lineWidth = Math.max(2, size/8);
    ctx.beginPath(); ctx.moveTo(size*0.6, size*0.28); ctx.lineTo(size*0.36, size*0.82); ctx.stroke();
    ctx.fillStyle = toolHeadColor(id);
    // лезвие топора (треугольный блок у верхушки слева)
    ctx.beginPath();
    ctx.moveTo(5*u,3*u); ctx.lineTo(11*u,3*u); ctx.lineTo(11*u,7*u); ctx.lineTo(5*u,9*u); ctx.closePath(); ctx.fill();
    return c;
  }
  // лопата: ручка + прямоугольный ковш снизу
  if (isShovel(id)) {
    const u = size/16;
    ctx.strokeStyle = '#7a5326'; ctx.lineWidth = Math.max(2, size/8);
    ctx.beginPath(); ctx.moveTo(size*0.62, size*0.22); ctx.lineTo(size*0.42, size*0.66); ctx.stroke();
    ctx.fillStyle = toolHeadColor(id);
    // ковш
    ctx.fillRect(4*u,9*u,5*u,5*u);
    return c;
  }
  // слитки: железный (серебристый) и медный (оранжевый)
  if (id === ITEM.IRON_INGOT || id === ITEM.COPPER_INGOT) {
    const u = size/16;
    const copper = (id === ITEM.COPPER_INGOT);
    const mid  = copper ? '#cf7e44' : '#d2d2da';
    const top  = copper ? '#ec9a5e' : '#eeeef4';
    const bot  = copper ? '#a0552a' : '#9a9aa6';
    ctx.fillStyle = mid; ctx.fillRect(3*u,6*u,10*u,5*u);
    ctx.fillStyle = top; ctx.fillRect(4*u,6*u,8*u,1*u);   // блик сверху
    ctx.fillStyle = bot; ctx.fillRect(3*u,10*u,10*u,1*u); // тень снизу
    return c;
  }
  // уголь / древесный уголь — кусочек угля
  if (id === ITEM.COAL || id === ITEM.CHARCOAL) {
    const u = size/16;
    const base = (id === ITEM.CHARCOAL) ? '#3a2e26' : '#202020';
    const hi = (id === ITEM.CHARCOAL) ? '#5a463a' : '#3c3c3c';
    ctx.fillStyle = base;
    ctx.fillRect(4*u,4*u,8*u,8*u); ctx.fillRect(3*u,6*u,10*u,5*u); ctx.fillRect(5*u,3*u,6*u,10*u);
    ctx.fillStyle = hi; // блики-грани
    ctx.fillRect(5*u,5*u,2*u,1*u); ctx.fillRect(9*u,6*u,2*u,1*u); ctx.fillRect(6*u,9*u,3*u,1*u);
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(4*u,11*u,8*u,1*u); ctx.fillRect(11*u,5*u,1*u,6*u);
    return c;
  }
  if (id === ITEM.DOOR) {
    ctx.fillStyle = '#9c6b35'; ctx.fillRect(size*0.28, size*0.08, size*0.44, size*0.84);
    ctx.strokeStyle = '#6e4a22'; ctx.lineWidth = 1; ctx.strokeRect(size*0.28, size*0.08, size*0.44, size*0.84);
    ctx.fillStyle = 'rgba(150,200,230,0.6)'; ctx.fillRect(size*0.36, size*0.16, size*0.28, size*0.18);
    ctx.fillStyle = '#3a2712'; ctx.fillRect(size*0.62, size*0.5, size*0.07, size*0.07);
    return c;
  }
  // мясо: кусок с косточкой; сырое — розовое, жареное — коричневое
  if (id === ITEM.PORK_RAW || id === ITEM.PORK_COOKED || id === ITEM.BEEF_RAW || id === ITEM.BEEF_COOKED) {
    const cooked = (id === ITEM.PORK_COOKED || id === ITEM.BEEF_COOKED);
    const beef = (id === ITEM.BEEF_RAW || id === ITEM.BEEF_COOKED);
    let meat, edge;
    if (cooked) { meat = beef ? '#7a4a28' : '#9c6038'; edge = '#4f2e18'; }
    else        { meat = beef ? '#c45a4e' : '#e89aa0'; edge = beef ? '#8e3a32' : '#c06b72'; }
    const u = size/16;
    // мякоть (скруглённый кусок)
    ctx.fillStyle = meat;
    ctx.fillRect(4*u,4*u,9*u,8*u);
    ctx.fillRect(3*u,6*u,11*u,5*u);
    ctx.fillStyle = edge; // контур-тень снизу/справа
    ctx.fillRect(4*u,11*u,9*u,1*u); ctx.fillRect(12*u,5*u,1*u,6*u);
    // прожилки жира (у сырого светлее, у жареного — тёмные)
    ctx.fillStyle = cooked ? '#3a2414' : '#f6c9cf';
    ctx.fillRect(6*u,6*u,4*u,1*u); ctx.fillRect(5*u,9*u,5*u,1*u);
    // косточка
    ctx.fillStyle = '#efe6cf';
    ctx.fillRect(11*u,3*u,3*u,2*u); ctx.fillRect(12*u,4*u,3*u,2*u);
    ctx.fillStyle = '#cfc4a6'; ctx.fillRect(13*u,3*u,1*u,1*u);
    return c;
  }
  // курятина — ножка/окорочок с косточкой
  if (id === ITEM.CHICKEN_RAW || id === ITEM.CHICKEN_COOKED) {
    const cooked = (id === ITEM.CHICKEN_COOKED);
    const u = size/16;
    const meat = cooked ? '#b9763a' : '#f0d2b0';
    const edge = cooked ? '#7a4a22' : '#caa884';
    ctx.fillStyle = meat;
    ctx.fillRect(5*u,3*u,6*u,7*u);          // округлая мякоть
    ctx.fillRect(4*u,4*u,8*u,5*u);
    ctx.fillStyle = edge;
    ctx.fillRect(4*u,8*u,8*u,1*u); ctx.fillRect(11*u,4*u,1*u,5*u);
    // косточка снизу
    ctx.fillStyle = '#efe6cf';
    ctx.fillRect(7*u,9*u,2*u,4*u); ctx.fillRect(6*u,12*u,4*u,2*u);
    ctx.fillStyle = '#cfc4a6'; ctx.fillRect(6*u,13*u,1*u,1*u); ctx.fillRect(9*u,13*u,1*u,1*u);
    return c;
  }
  // баранина — кусок мяса (как свинина, но другой оттенок)
  if (id === ITEM.MUTTON_RAW || id === ITEM.MUTTON_COOKED) {
    const cooked = (id === ITEM.MUTTON_COOKED);
    const u = size/16;
    const meat = cooked ? '#8a4a2c' : '#d06860';
    const edge = cooked ? '#5a2e18' : '#a04640';
    ctx.fillStyle = meat; ctx.fillRect(4*u,4*u,9*u,8*u); ctx.fillRect(3*u,6*u,11*u,5*u);
    ctx.fillStyle = edge; ctx.fillRect(4*u,11*u,9*u,1*u); ctx.fillRect(12*u,5*u,1*u,6*u);
    ctx.fillStyle = cooked ? '#3a2414' : '#e89a92'; ctx.fillRect(6*u,6*u,4*u,1*u); ctx.fillRect(5*u,9*u,5*u,1*u);
    ctx.fillStyle = '#efe6cf'; ctx.fillRect(11*u,3*u,3*u,2*u); ctx.fillRect(12*u,4*u,3*u,2*u);
    return c;
  }
  // рыба — целая рыбка с хвостом
  if (id === ITEM.FISH_RAW || id === ITEM.FISH_COOKED) {
    const cooked = (id === ITEM.FISH_COOKED);
    const u = size/16;
    const body = cooked ? '#c79352' : '#9bb6c4';
    const belly = cooked ? '#e0bd80' : '#d6e4ec';
    const edge = cooked ? '#8a6230' : '#6a8a9c';
    // тело
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.moveTo(3*u,8*u); ctx.lineTo(7*u,4*u); ctx.lineTo(12*u,5*u); ctx.lineTo(13*u,8*u);
    ctx.lineTo(12*u,11*u); ctx.lineTo(7*u,12*u); ctx.closePath(); ctx.fill();
    // брюшко
    ctx.fillStyle = belly; ctx.fillRect(6*u,8*u,6*u,3*u);
    // хвост
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.moveTo(3*u,8*u); ctx.lineTo(1*u,5*u); ctx.lineTo(1*u,11*u); ctx.closePath(); ctx.fill();
    // глаз
    ctx.fillStyle = '#1a1a1a'; ctx.fillRect(11*u,7*u,1*u,1*u);
    ctx.fillStyle = edge; ctx.fillRect(7*u,4*u,1*u,1*u);
    return c;
  }
  // гнилая плоть — зеленовато-бурый кусок с «плесенью»
  if (id === ITEM.ROTTEN_FLESH) {
    const u = size/16;
    ctx.fillStyle = '#8a5a3c'; ctx.fillRect(3*u,4*u,10*u,9*u);        // основа — тухлое мясо
    ctx.fillStyle = '#a8744c'; ctx.fillRect(4*u,5*u,8*u,3*u);         // светлая мякоть
    ctx.fillStyle = '#5a7a3a';                                        // зелёные пятна гнили
    ctx.fillRect(5*u,8*u,3*u,2*u); ctx.fillRect(10*u,6*u,2*u,2*u); ctx.fillRect(8*u,10*u,3*u,2*u);
    ctx.fillStyle = '#3a5a24'; ctx.fillRect(6*u,11*u,2*u,1*u);        // тёмная гниль
    ctx.fillStyle = '#c8d8b0'; ctx.fillRect(4*u,9*u,1*u,1*u); ctx.fillRect(11*u,9*u,1*u,1*u); // «личинки»-блики
    ctx.strokeStyle = '#4a3220'; ctx.lineWidth=1; ctx.strokeRect(3*u,4*u,10*u,9*u);
    return c;
  }
  // факел — палка с пламенем
  if (id === BLOCK.TORCH) {
    const u = size/16;
    ctx.fillStyle = '#6b4a24'; ctx.fillRect(7*u,7*u,2*u,8*u);
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(6*u,5*u,4*u,2*u);
    ctx.fillStyle = '#ff8a20'; ctx.fillRect(6*u,2*u,4*u,4*u);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(7*u,3*u,2*u,3*u);
    ctx.fillStyle = '#fff0a0'; ctx.fillRect(7*u,4*u,1*u,1*u);
    return c;
  }
  // кровать — иконка с одеялом и подушкой
  if (id === BLOCK.BED_FOOT || id === BLOCK.BED_HEAD) {
    const u = size/16;
    ctx.fillStyle = '#6b4a24'; ctx.fillRect(2*u,9*u,12*u,4*u);  // деревянная рама
    ctx.fillStyle = '#c0352f'; ctx.fillRect(2*u,5*u,12*u,5*u);  // одеяло
    ctx.fillStyle = '#f2f2f4'; ctx.fillRect(3*u,6*u,4*u,3*u);   // подушка
    ctx.fillStyle = '#922420'; ctx.fillRect(2*u,9*u,12*u,1*u);
    return c;
  }

  // Ножницы — два железных лезвия + центральный винт
  if (id === ITEM.SHEARS) {
    const u = size/16;
    // лезвия (серебристые, X-образно)
    ctx.fillStyle = '#c4c8cf';
    ctx.fillRect(4*u,3*u,2*u,6*u);  ctx.fillRect(10*u,3*u,2*u,6*u);
    ctx.fillRect(5*u,8*u,2*u,5*u);  ctx.fillRect(9*u,8*u,2*u,5*u);
    // тёмный контур
    ctx.fillStyle = '#7a8088';
    ctx.fillRect(4*u,8*u,1*u,4*u);  ctx.fillRect(11*u,8*u,1*u,4*u);
    // отверстия-кольца внизу
    ctx.fillStyle = '#3a3e44';
    ctx.fillRect(5*u,12*u,2*u,2*u); ctx.fillRect(9*u,12*u,2*u,2*u);
    // центральный винт
    ctx.fillStyle = '#5a5e64'; ctx.fillRect(7*u,6*u,2*u,2*u);
    ctx.fillStyle = '#e6e9ee'; ctx.fillRect(7*u,6*u,1*u,1*u);
    return c;
  }
  // Редстоун — кучка красных кристаллов
  if (id === ITEM.REDSTONE) {
    const u = size/16;
    ctx.fillStyle = '#3a3a3e'; ctx.fillRect(2*u,8*u,12*u,5*u); // подложка
    ctx.fillStyle = '#c0201a';
    const pts = [[3,9],[6,8],[9,9],[12,8],[4,11],[8,11],[11,11]];
    for (const [gx,gy] of pts) ctx.fillRect(gx*u,gy*u,2*u,2*u);
    ctx.fillStyle = '#ff4830';
    for (const [gx,gy] of [[3,9],[6,8],[9,9]]) ctx.fillRect(gx*u,gy*u,1*u,1*u);
    ctx.fillStyle = '#ff8060'; ctx.fillRect(7*u,9*u,1*u,1*u);
    return c;
  }

  // Блоки — рисуем текстуру верхней/боковой грани
  let tex = TEX.stone;
  if (id === BLOCK.GRASS) tex = TEX.grass_side;
  else if (id === BLOCK.DIRT) tex = TEX.dirt;
  else if (id === BLOCK.STONE) tex = TEX.stone;
  else if (id === BLOCK.BEDROCK) tex = TEX.bedrock;
  else if (id === BLOCK.WATER) tex = TEX.water;
  else if (id === BLOCK.LAVA || id === BLOCK.LAVA_FLOW) tex = TEX.lava;
  else if (id === BLOCK.FIRE) tex = TEX.fire;
  else if (id === BLOCK.SAND) tex = TEX.sand;
  else if (id === BLOCK.WOOD) tex = TEX.wood_side;
  else if (id === BLOCK.LEAVES) tex = TEX.leaves;
  else if (id === BLOCK.PLANKS) tex = TEX.planks;
  else if (id === BLOCK.CRAFTING_TABLE) tex = TEX.craft_top;
  else if (id === BLOCK.COBBLESTONE) tex = TEX.cobble;
  else if (id === BLOCK.COAL_ORE) tex = TEX.coal_ore;
  else if (id === BLOCK.IRON_ORE) tex = TEX.iron_ore;
  else if (id === BLOCK.COPPER_ORE) tex = TEX.copper_ore;
  else if (id === BLOCK.DIAMOND_ORE) tex = TEX.diamond_ore;
  else if (id === BLOCK.GRAVEL) tex = TEX.gravel;
  else if (id === BLOCK.OBSIDIAN) tex = TEX.obsidian;
  else if (id === BLOCK.NETHERRACK) tex = TEX.netherrack;
  else if (id === BLOCK.GLOWSTONE) tex = TEX.glowstone;
  else if (id === BLOCK.DEEPSLATE) tex = TEX.deepslate;
  else if (id === BLOCK.REDSTONE_ORE) tex = TEX.redstone_ore;
  else if (id === BLOCK.REDSTONE_DUST) { ctx.fillStyle = '#3a3a3e'; ctx.fillRect(0,0,size,size); tex = TEX.redstone_dust; }
  else if (id === BLOCK.REDSTONE_TORCH) tex = TEX.redstone_torch;
  else if (id === BLOCK.LEVER) tex = TEX.lever;
  else if (id === BLOCK.BUTTON) tex = TEX.button;
  else if (id === BLOCK.PISTON) tex = TEX.piston_face;
  else if (id === BLOCK.PISTON_HEAD) tex = TEX.piston_head_face;
  else if (id === BLOCK.COMMAND_BLOCK) tex = TEX.cmd_front;
  else if (id === BLOCK.WOOL) tex = TEX.wool;
  else if (id === BLOCK.GLASS) tex = TEX.glass;
  else if (id === BLOCK.FURNACE) tex = TEX.furnace_front;
  else if (id === BLOCK.CHEST) tex = TEX.chest_front;
  else if (id === BLOCK.DOOR_BOTTOM || id === BLOCK.DOOR_TOP) tex = TEX.door_bottom;
  // фон для прозрачных текстур
  if (id === BLOCK.LEAVES) { ctx.fillStyle = '#2f6e22'; ctx.fillRect(0,0,size,size); }
  if (id === BLOCK.GLASS) { ctx.fillStyle = 'rgba(180,215,235,0.25)'; ctx.fillRect(0,0,size,size); }
  ctx.drawImage(tex, 0, 0, size, size);
  return c;
}

// Пиксельная иконка пламени (для печи), lit=горит
function makeFlameIcon(lit) {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  if (lit) {
    // внешнее пламя
    x.fillStyle = '#ff7a18';
    x.fillRect(6,4,4,9); x.fillRect(5,7,6,6); x.fillRect(4,10,8,4);
    // среднее
    x.fillStyle = '#ffb52e';
    x.fillRect(6,7,4,6); x.fillRect(5,10,6,4);
    // ядро
    x.fillStyle = '#ffe96b';
    x.fillRect(7,10,2,4);
    // искры сверху
    x.fillStyle = '#ff7a18'; x.fillRect(7,2,2,2);
  } else {
    // потухшее — серый контур пламени
    x.fillStyle = '#6a6a6a';
    x.fillRect(6,5,4,8); x.fillRect(5,8,6,5);
    x.fillStyle = '#555'; x.fillRect(7,9,2,4);
  }
  c.style.width = '18px'; c.style.height = '18px'; c.style.imageRendering = 'pixelated';
  return c;
}

// Пиксельная стрелка прогресса (для крафта)
function makeArrowIcon() {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const x = c.getContext('2d');
  x.imageSmoothingEnabled = false;
  x.fillStyle = '#555';
  x.fillRect(2,7,9,2);          // стержень
  x.fillRect(10,4,2,2); x.fillRect(12,6,2,4); x.fillRect(10,10,2,2); // наконечник
  c.style.width = '22px'; c.style.height = '22px'; c.style.imageRendering = 'pixelated';
  return c;
}

// ---- Хотбар (нижняя панель) ----
const hotbarEl = document.getElementById('hotbar');
// полоска прочности под иконкой (для предметов с прочностью, напр. зажигалка)
function addDurabilityBar(el, item) {
  if (!item || !hasDurability(item.id) || item.dur === undefined) return;
  const max = MAX_DURABILITY[item.id];
  if (item.dur >= max) return; // полная — не показываем
  const frac = Math.max(0, item.dur / max);
  const bar = document.createElement('div');
  bar.style.cssText = 'position:absolute;left:3px;right:3px;bottom:3px;height:3px;background:#000;border-radius:1px;';
  const fill = document.createElement('div');
  // цвет от зелёного к красному
  const hue = Math.round(frac * 120);
  fill.style.cssText = `height:100%;width:${(frac*100).toFixed(0)}%;background:hsl(${hue},85%,45%);border-radius:1px;`;
  bar.appendChild(fill);
  el.style.position = 'relative';
  el.appendChild(bar);
}

function renderHotbar() {
  hotbarEl.innerHTML = '';
  // Вторая рука (parity MC): отдельный слот СЛЕВА от хотбара, не выбирается
  const off = document.createElement('div');
  off.className = 'slot offhand-slot';
  off.title = 'Вторая рука (F — поменять местами с рукой)';
  const offItem = PLAYER.offhand;
  if (offItem) {
    off.appendChild(iconCanvas(offItem.id, 40));
    if (offItem.count > 1) {
      const c = document.createElement('div');
      c.className = 'count'; c.textContent = offItem.count;
      off.appendChild(c);
    }
    addDurabilityBar(off, offItem);
  }
  hotbarEl.appendChild(off);
  for (let i = 0; i < HOTBAR_SIZE; i++) {
    const slot = document.createElement('div');
    slot.className = 'slot' + (i === activeSlot ? ' active' : '');
    const item = slots[i];
    if (item) {
      slot.appendChild(iconCanvas(item.id, 40));
      if (item.count > 1) {
        const cnt = document.createElement('div');
        cnt.className = 'count'; cnt.textContent = item.count;
        slot.appendChild(cnt);
      }
      addDurabilityBar(slot, item);
    }
    slot.addEventListener('click', () => { if (!invOpen) selectSlot(i); });
    hotbarEl.appendChild(slot);
  }
}

