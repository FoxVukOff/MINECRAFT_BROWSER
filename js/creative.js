/* ============================================================
   MiniCraft — creative · Креатив-инвентарь со поиском
   (модуль 15 из 33; строки 5961–6248 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Креатив-инвентарь: ВСЕ предметы/блоки + поиск (parity MC)
// ============================================================
// Что доступно в креативе: все ставимые блоки (кроме технических) + все предметы
const CREATIVE_ITEMS = [
  // природные блоки
  BLOCK.GRASS, BLOCK.DIRT, BLOCK.STONE, BLOCK.COBBLESTONE, BLOCK.DEEPSLATE, BLOCK.BEDROCK,
  BLOCK.SAND, BLOCK.GRAVEL, BLOCK.WOOD, BLOCK.LEAVES, BLOCK.PLANKS,
  // руды и материалы
  BLOCK.COAL_ORE, BLOCK.COPPER_ORE, BLOCK.IRON_ORE, BLOCK.DIAMOND_ORE, BLOCK.REDSTONE_ORE,
  BLOCK.GOLD_ORE, BLOCK.NETHER_GOLD_ORE, BLOCK.GOLD_BLOCK,
  BLOCK.OBSIDIAN, BLOCK.GLASS, BLOCK.WOOL, BLOCK.NETHERRACK, BLOCK.GLOWSTONE,
  ITEM.COAL, ITEM.CHARCOAL, ITEM.IRON_INGOT, ITEM.COPPER_INGOT, ITEM.DIAMOND, ITEM.REDSTONE,
  ITEM.GOLD_INGOT, ITEM.GOLD_NUGGET, ITEM.APPLE, ITEM.GOLDEN_APPLE,
  ITEM.STICK, ITEM.FLINT, ITEM.LEATHER, ITEM.FEATHER, ITEM.STRING,
  // инструменты (по возрастанию)
  ITEM.WOODEN_PICKAXE, ITEM.STONE_PICKAXE, ITEM.COPPER_PICKAXE, ITEM.IRON_PICKAXE, ITEM.DIAMOND_PICKAXE, ITEM.GOLD_PICKAXE,
  ITEM.WOODEN_AXE, ITEM.STONE_AXE, ITEM.COPPER_AXE, ITEM.IRON_AXE, ITEM.DIAMOND_AXE, ITEM.GOLD_AXE,
  ITEM.WOODEN_SHOVEL, ITEM.STONE_SHOVEL, ITEM.COPPER_SHOVEL, ITEM.IRON_SHOVEL, ITEM.DIAMOND_SHOVEL, ITEM.GOLD_SHOVEL,
  ITEM.WOODEN_SWORD, ITEM.STONE_SWORD, ITEM.COPPER_SWORD, ITEM.IRON_SWORD, ITEM.DIAMOND_SWORD, ITEM.GOLD_SWORD,
  ITEM.SHEARS, ITEM.FLINT_AND_STEEL, ITEM.BUCKET, ITEM.WATER_BUCKET, ITEM.LAVA_BUCKET, ITEM.BOAT,
  // броня
  ITEM.LEATHER_HELMET, ITEM.LEATHER_CHESTPLATE, ITEM.LEATHER_LEGGINGS, ITEM.LEATHER_BOOTS,
  ITEM.COPPER_HELMET, ITEM.COPPER_CHESTPLATE, ITEM.COPPER_LEGGINGS, ITEM.COPPER_BOOTS,
  ITEM.IRON_HELMET, ITEM.IRON_CHESTPLATE, ITEM.IRON_LEGGINGS, ITEM.IRON_BOOTS,
  ITEM.DIAMOND_HELMET, ITEM.DIAMOND_CHESTPLATE, ITEM.DIAMOND_LEGGINGS, ITEM.DIAMOND_BOOTS,
  ITEM.GOLD_HELMET, ITEM.GOLD_CHESTPLATE, ITEM.GOLD_LEGGINGS, ITEM.GOLD_BOOTS,
  // функциональные блоки
  BLOCK.CRAFTING_TABLE, BLOCK.FURNACE, BLOCK.CHEST, ITEM.DOOR, BLOCK.TORCH, BLOCK.BED_FOOT,
  // редстоун + механизмы
  BLOCK.REDSTONE_TORCH, BLOCK.LEVER, BLOCK.BUTTON, BLOCK.PISTON, BLOCK.COMMAND_BLOCK,
  // еда
  ITEM.PORK_RAW, ITEM.PORK_COOKED, ITEM.BEEF_RAW, ITEM.BEEF_COOKED,
  ITEM.CHICKEN_RAW, ITEM.CHICKEN_COOKED, ITEM.MUTTON_RAW, ITEM.MUTTON_COOKED,
  ITEM.FISH_RAW, ITEM.FISH_COOKED, ITEM.ROTTEN_FLESH, ITEM.APPLE, ITEM.GOLDEN_APPLE,
  // яйца спавна мобов (как в MC — только креатив)
  ITEM.SPAWN_EGG_SHEEP, ITEM.SPAWN_EGG_PIG, ITEM.SPAWN_EGG_COW, ITEM.SPAWN_EGG_CHICKEN,
  ITEM.SPAWN_EGG_FISH, ITEM.SPAWN_EGG_ZOMBIE, ITEM.SPAWN_EGG_PIGLIN, ITEM.SPAWN_EGG_PHANTOM,
  ITEM.SPAWN_EGG_SPIDER,
  // мембрана фантома (трофей с фантомов)
  ITEM.PHANTOM_MEMBRANE,
];
let creativeSearchQuery = '';

function renderCreativeInv() {
  const wrap = document.createElement('div');
  wrap.className = 'creative-wrap';

  // поиск по названию (как вкладка поиска в креативе MC)
  const search = document.createElement('input');
  search.type = 'text';
  search.className = 'creative-search';
  search.placeholder = 'Поиск (например: алмаз, кирка, дверь)…';
  search.value = creativeSearchQuery;
  search.addEventListener('input', () => {
    creativeSearchQuery = search.value;
    renderInventory();
    // вернуть фокус в поле поиска после перерисовки
    const el = invGrid.querySelector('.creative-search');
    if (el) { el.focus(); el.setSelectionRange(el.value.length, el.value.length); }
  });
  // не даём E/Esc в поле поиска закрывать инвентарь (это просто ввод)
  search.addEventListener('keydown', (e) => { e.stopPropagation(); });
  wrap.appendChild(search);

  const q = creativeSearchQuery.trim().toLowerCase();
  const items = CREATIVE_ITEMS.filter(id => {
    const nm = (BLOCK_NAMES[id] || '').toLowerCase();
    return !q || nm.includes(q);
  });

  const grid = document.createElement('div');
  grid.className = 'creative-grid';
  if (items.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'creative-note';
    empty.style.gridColumn = '1 / -1';
    empty.textContent = 'Ничего не найдено: ' + creativeSearchQuery;
    grid.appendChild(empty);
  }
  for (const id of items) {
    const cell = document.createElement('div');
    cell.className = 'creative-cell';
    cell.appendChild(iconCanvas(id, 34));
    const nm = BLOCK_NAMES[id] || '';
    cell.title = nm + (isBlock(id) || id === ITEM.DOOR || id === ITEM.REDSTONE ? ' (блок)' : '');
    // ЛКМ — взять полный стак на курсор; ПКМ — одну штуку (как в MC)
    cell.addEventListener('mousedown', (e) => {
      e.preventDefault();
      const stackSize = (e.button === 2) ? 1 : Math.min(maxStack(id), isBlock(id) ? 64 : maxStack(id));
      const stack = { id, count: stackSize };
      if (hasDurability(id)) { stack.dur = MAX_DURABILITY[id]; stack.count = 1; }
      // клик с предметом на курсоре по сетке креатива = заменить (как «выбросить» в MC)
      cursorItem = stack;
      renderCursor();
      playSound('pop');
    });
    cell.addEventListener('contextmenu', e => e.preventDefault());
    grid.appendChild(cell);
  }
  wrap.appendChild(grid);

  const note = document.createElement('div');
  note.className = 'creative-note';
  note.textContent = 'ЛКМ — стак на курсор · ПКМ — одна штука · положить — кликом по слотам ниже · командный блок — только здесь и /give';
  wrap.appendChild(note);

  invGrid.appendChild(wrap);
}

// вкладки переключения Инвентарь/Креатив/Справочник
function makeTabs() {
  const tabs = document.createElement('div');
  tabs.className = 'inv-tabs';
  const setMode = (mode, title) => {
    if (craftMode === mode) return;
    if (craftMode !== 'furnace' && craftMode !== 'chest') clearCraftToInventory();
    craftMode = mode;
    document.getElementById('invTitle').textContent = title;
    updateCraftResult();
    renderInventory();
  };
  // в креативе первой — вкладка «Креатив»
  if (window.__creative) {
    const t0 = document.createElement('div');
    t0.className = 'inv-tab' + (craftMode === 'creative' ? ' active' : '');
    t0.textContent = 'Креатив';
    t0.addEventListener('click', () => setMode('creative', 'Креатив'));
    tabs.appendChild(t0);
  }
  const t1 = document.createElement('div');
  t1.className = 'inv-tab' + (craftMode !== 'guide' && craftMode !== 'creative' ? ' active' : '');
  t1.textContent = 'Инвентарь';
  t1.addEventListener('click', () => setMode('2x2', 'Инвентарь'));
  const t2 = document.createElement('div');
  t2.className = 'inv-tab' + (craftMode === 'guide' ? ' active' : '');
  t2.textContent = 'Справочник (J)';
  t2.addEventListener('click', () => setMode('guide', 'Справочник'));
  tabs.appendChild(t1); tabs.appendChild(t2);
  return tabs;
}

function renderInventory() {
  // строим всю панель заново (заголовок задан в HTML)
  invGrid.innerHTML = '';

  // вкладки показываем в обычном инвентаре, креативе и справочнике
  if (craftMode === '2x2' || craftMode === 'guide' || craftMode === 'creative') {
    invGrid.appendChild(makeTabs());
  }

  if (craftMode === 'guide') {
    renderGuide();
    return; // справочник занимает всю панель
  }
  if (craftMode === 'creative') {
    // Креатив: сетка всех предметов + обычные слоты игрока ниже
    // (фикс: раньше в креативе слоты игрока не отображались — предметы
    // из курсора класть было некуда, они пропадали при закрытии)
    renderCreativeInv();
    appendPlayerSlots(true);
    return;
  }

  if (craftMode === 'chest') {
    // --- Сундук: 27 слотов (одиночный) или 54 (двойной) ---
    const chest = chestView(openChestPos.x, openChestPos.y, openChestPos.z);
    const count = chestSlotCount(openChestPos.x, openChestPos.y, openChestPos.z);
    const cz = document.createElement('div');
    cz.className = 'inv-storage';
    for (let i = 0; i < count; i++) cz.appendChild(makeSlotEl(chest, i, 34));
    invGrid.appendChild(cz);
    const lbl = document.createElement('div'); lbl.className = 'inv-label';
    lbl.textContent = count > CHEST_SIZE ? 'Большой сундук' : 'Сундук';
    invGrid.appendChild(lbl);
  } else if (craftMode === 'furnace') {
    // --- Интерфейс печи ---
    const f = getFurnace(openFurnacePos.x, openFurnacePos.y, openFurnacePos.z);
    const fz = document.createElement('div'); fz.className = 'furnace-zone';
    const col = document.createElement('div'); col.className = 'furnace-col';
    col.appendChild(makeFurnaceSlot(f, 'input'));   // вверху — что плавим
    const flame = document.createElement('div'); flame.className = 'furnace-flame' + (f.burn > 0 ? ' lit' : '');
    flame.appendChild(makeFlameIcon(f.burn > 0));   // пиксельная иконка пламени
    col.appendChild(flame);
    col.appendChild(makeFurnaceSlot(f, 'fuel'));    // внизу — топливо
    fz.appendChild(col);

    // прогресс-стрелка
    const prog = document.createElement('div'); prog.className = 'furnace-prog';
    const fill = document.createElement('div'); fill.className = 'furnace-prog-fill';
    fill.style.width = Math.round((f.cook / COOK_TIME) * 100) + '%';
    prog.appendChild(fill);
    fz.appendChild(prog);

    fz.appendChild(makeFurnaceSlot(f, 'output'));
    invGrid.appendChild(fz);

    const lbl = document.createElement('div'); lbl.className='inv-label';
    lbl.textContent = 'Печь: песок→стекло, руда→слиток (в т.ч. золотая), мясо→жареное, золотая броня→самородки · Топливо: уголь (8), доски, дерево, палки, верстак, ведро лавы (100)';
    invGrid.appendChild(lbl);
  } else {
    // --- Зона крафта + колонка брони/второй руки (как в MC) ---
    const topWrap = document.createElement('div');
    topWrap.className = 'inv-top-row';

    // колонка брони: шлем/нагрудник/поножи/ботинки + вторая рука (parity MC)
    const armorCol = document.createElement('div');
    armorCol.className = 'armor-col';
    armorCol.appendChild(makeArmorSlotEl('helmet'));
    armorCol.appendChild(makeArmorSlotEl('chestplate'));
    armorCol.appendChild(makeArmorSlotEl('leggings'));
    armorCol.appendChild(makeArmorSlotEl('boots'));
    armorCol.appendChild(makeArmorSlotEl('offhand'));
    topWrap.appendChild(armorCol);

    const craftWrap = document.createElement('div');
    craftWrap.className = 'craft-zone';
    const size = craftMode === '3x3' ? 3 : 2;
    const grid = document.createElement('div');
    grid.className = 'craft-grid';
    grid.style.gridTemplateColumns = `repeat(${size}, 44px)`;
    for (let i = 0; i < size*size; i++) grid.appendChild(makeSlotEl(craftSlots, i, 34));
    craftWrap.appendChild(grid);

    const arrow = document.createElement('div');
    arrow.className = 'craft-arrow'; arrow.appendChild(makeArrowIcon());
    craftWrap.appendChild(arrow);

    const resSlot = document.createElement('div');
    resSlot.className = 'inv-slot craft-result';
    if (craftResult) {
      resSlot.appendChild(iconCanvas(craftResult.id, 34));
      if (craftResult.count > 1) { const c=document.createElement('div'); c.className='count'; c.textContent=craftResult.count; resSlot.appendChild(c); }
      resSlot.title = BLOCK_NAMES[craftResult.id] || '';
    }
    resSlot.addEventListener('mousedown', (e) => { e.preventDefault(); takeCraftResult(); });
    craftWrap.appendChild(resSlot);
    topWrap.appendChild(craftWrap);
    invGrid.appendChild(topWrap);

    const lbl = document.createElement('div');
    lbl.className = 'inv-label';
    lbl.textContent = craftMode === '3x3' ? 'Крафт 3×3 (верстак)' : 'Крафт 2×2 · Броня — клик по слоту слева (Shift+клик — надеть)';
    invGrid.appendChild(lbl);
  }

  appendPlayerSlots(false);
}

// слоты игрока: рюкзак + хотбар (+ колонка брони в креативе)
function appendPlayerSlots(withArmor) {
  if (withArmor) {
    const topWrap = document.createElement('div');
    topWrap.className = 'inv-top-row';
    const armorCol = document.createElement('div');
    armorCol.className = 'armor-col';
    armorCol.style.gridTemplateColumns = 'repeat(5, 42px)';
    armorCol.appendChild(makeArmorSlotEl('helmet'));
    armorCol.appendChild(makeArmorSlotEl('chestplate'));
    armorCol.appendChild(makeArmorSlotEl('leggings'));
    armorCol.appendChild(makeArmorSlotEl('boots'));
    armorCol.appendChild(makeArmorSlotEl('offhand'));
    topWrap.appendChild(armorCol);
    invGrid.appendChild(topWrap);
  }
  // --- Основное хранилище (27) ---
  const storage = document.createElement('div');
  storage.className = 'inv-storage';
  for (let i = HOTBAR_SIZE; i < TOTAL_SLOTS; i++) storage.appendChild(makeSlotEl(slots, i, 34));
  invGrid.appendChild(storage);

  // --- Хотбар (9) внутри инвентаря ---
  const hb = document.createElement('div');
  hb.className = 'inv-hotbar';
  for (let i = 0; i < HOTBAR_SIZE; i++) hb.appendChild(makeSlotEl(slots, i, 34));
  invGrid.appendChild(hb);
}

// предмет на курсоре
const cursorEl = document.getElementById('cursorItem');
function renderCursor() {
  cursorEl.innerHTML = '';
  if (cursorItem) {
    cursorEl.style.display = 'block';
    cursorEl.appendChild(iconCanvas(cursorItem.id, 36));
    if (cursorItem.count > 1) { const c=document.createElement('div'); c.className='count'; c.textContent=cursorItem.count; cursorEl.appendChild(c); }
  } else {
    cursorEl.style.display = 'none';
  }
}
document.addEventListener('mousemove', (e) => {
  if (cursorItem && invOpen) {
    cursorEl.style.left = e.clientX + 'px';
    cursorEl.style.top = e.clientY + 'px';
  }
});

function toggleInventory(mode) {
  invOpen = !invOpen;
  if (invOpen) {
    // по умолчанию в креативе открывается креатив-инвентарь (parity MC)
    craftMode = mode || (window.__creative ? 'creative' : '2x2');
    invPanel.classList.add('open');
    const title = craftMode === '3x3' ? 'Верстак' : (craftMode === 'furnace' ? 'Печь' : (craftMode === 'chest' ? 'Сундук' : (craftMode === 'guide' ? 'Справочник' : (craftMode === 'creative' ? 'Креатив' : 'Инвентарь'))));
    document.getElementById('invTitle').textContent = title;
    document.exitPointerLock();
    updateCraftResult();
    renderInventory();
  } else {
    // вернуть предметы из крафта только в режимах с сеткой крафта
    if (craftMode !== 'furnace' && craftMode !== 'chest' && craftMode !== 'creative' && craftMode !== 'guide') clearCraftToInventory();
    if (cursorItem) {
      // фикс: при полном инвентаре предмет с курсора выпадает под ноги, а не исчезает
      if (!addToInventory(cursorItem.id, cursorItem.count, cursorItem.dur)) tossDropForward(cursorItem.id);
      cursorItem = null;
    }
    openFurnacePos = null;
    openChestPos = null;
    _furnaceUISig = '';
    craftMode = '2x2';
    invPanel.classList.remove('open');
    refreshUI();
    if (overlay.classList.contains('hidden') && !chatOpen) canvas.requestPointerLock();
  }
  if (typeof updateChatMiniVisibility === 'function') updateChatMiniVisibility();
}

renderHotbar();

