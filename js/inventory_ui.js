/* ============================================================
   MiniCraft — inventory_ui · Окно инвентаря: слоты, перетаскивание, справочник
   (модуль 14 из 33; строки 5686–5960 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Окно инвентаря (слоты, перетаскивание, разделение)
// ============================================================
const invPanel = document.getElementById('inventory');

function refreshUI() {
  renderHotbar();
  if (invOpen) renderInventory();
  renderCursor();
}

// клик по слоту инвентаря/хотбара (массив slots[index]); shift — быстрый перенос как в MC
function slotClick(arr, index, rightClick, shiftKey) {
  const s = arr[index];

  // ---- Shift+ЛКМ: быстрый перенос (как в Minecraft) ----
  if (shiftKey && !cursorItem && s) {
    if (arr === slots) {
      // Shift+клик по броне в инвентаре игрока — сразу надеть (как в MC)
      if (isArmor(s.id) && (craftMode === '2x2' || craftMode === 'creative')) {
        const sl = armorSlotOf(s.id);
        const prev = PLAYER.armor[sl];
        PLAYER.armor[sl] = { id: s.id, count: 1, ...(s.dur !== undefined ? { dur: s.dur } : {}) };
        s.count--;
        if (s.count <= 0) slots[index] = null;
        if (prev && !addToInventory(prev.id, 1, prev.dur)) spawnDrop(prev.id, PLAYER.pos.x, PLAYER.pos.y + 0.5, PLAYER.pos.z);
        playSound('place', BLOCK.PLANKS);
        refreshUI();
        if (typeof requestSave === 'function') requestSave();
        return;
      }
      // открыт сундук — переносим в сундук (в т.ч. из двойного)
      if (craftMode === 'chest' && openChestPos) {
        const chest = chestView(openChestPos.x, openChestPos.y, openChestPos.z);
        const cnt = chestSlotCount(openChestPos.x, openChestPos.y, openChestPos.z);
        let moved = 0;
        for (let ci = 0; ci < cnt && s.count > 0; ci++) {
          const c = chest[ci];
          if (c && c.id === s.id && c.dur === undefined && s.dur === undefined && c.count < maxStack(s.id)) {
            const can = Math.min(s.count, maxStack(s.id) - c.count); c.count += can; moved += can; s.count -= can;
          }
        }
        for (let ci = 0; ci < cnt && s.count > 0; ci++) {
          if (!chest[ci]) { const can = Math.min(s.count, maxStack(s.id)); chest[ci] = { id: s.id, count: can, ...(s.dur !== undefined ? { dur: s.dur } : {}) }; if (s.dur !== undefined) s.dur = undefined; moved += can; s.count -= can; }
        }
        if (moved > 0) { if (s.count <= 0) slots[index] = null; refreshUI(); return; }
      }
      // открыта печь — плавимое в input, топливо в fuel
      if (craftMode === 'furnace' && openFurnacePos) {
        const f = getFurnace(openFurnacePos.x, openFurnacePos.y, openFurnacePos.z);
        const target = isSmeltable(s.id) ? 'input' : (isFuel(s.id) ? 'fuel' : null);
        if (target) {
          const dst = f[target];
          if (!dst) { f[target] = { id: s.id, count: s.count, ...(s.dur !== undefined ? { dur: s.dur } : {}) }; slots[index] = null; }
          else if (dst.id === s.id && dst.count < maxStack(s.id)) { const can = Math.min(s.count, maxStack(s.id) - dst.count); dst.count += can; s.count -= can; if (s.count <= 0) slots[index] = null; }
          refreshUI(); return;
        }
      }
      // обычный инвентарь/верстак: хотбар <-> рюкзак
      const from = index < HOTBAR_SIZE; // true: хотбар -> рюкзак
      const lo = from ? HOTBAR_SIZE : 0;
      const hi = from ? TOTAL_SLOTS : HOTBAR_SIZE;
      let moved = false;
      for (let i = lo; i < hi && s.count > 0; i++) {
        const d = slots[i];
        if (d && d.id === s.id && d.dur === undefined && s.dur === undefined && d.count < maxStack(s.id)) {
          const can = Math.min(s.count, maxStack(s.id) - d.count); d.count += can; s.count -= can; moved = true;
        }
      }
      for (let i = lo; i < hi && s.count > 0; i++) {
        if (!slots[i]) { slots[i] = s; slots[index] = null; moved = true; break; }
      }
      if (moved) { if (slots[index] && slots[index].count <= 0) slots[index] = null; updateCraftResult(); refreshUI(); return; }
    } else if (arr !== craftSlots && craftMode !== 'chest') {
      // из сундука в инвентарь
      if (addToInventory(s.id, s.count, s.dur)) { arr[index] = null; refreshUI(); return; }
    }
  }

  if (!cursorItem) {
    if (!s) return;
    if (rightClick) {
      // взять половину (прочность переносится — фикс «бесплатного ремонта» перекладыванием)
      const half = Math.ceil(s.count / 2);
      cursorItem = { id: s.id, count: half, ...(s.dur !== undefined ? { dur: s.dur } : {}) };
      s.count -= half; if (s.count <= 0) arr[index] = null;
    } else {
      cursorItem = s; arr[index] = null; // взять всю стопку
    }
  } else {
    if (!s) {
      if (rightClick) {
        // положить 1 (с прочностью, если предмет один)
        const one = (cursorItem.count === 1 && cursorItem.dur !== undefined);
        arr[index] = { id: cursorItem.id, count: 1, ...(one ? { dur: cursorItem.dur } : {}) };
        if (one) cursorItem.dur = undefined;
        cursorItem.count--; if (cursorItem.count <= 0) cursorItem = null;
      } else {
        arr[index] = cursorItem; cursorItem = null;
      }
    } else if (s.id === cursorItem.id && s.dur === undefined && cursorItem.dur === undefined) {
      // объединить стопки (только предметы без прочности)
      const space = maxStack(s.id) - s.count;
      if (rightClick) {
        if (space > 0) { s.count++; cursorItem.count--; if (cursorItem.count<=0) cursorItem=null; }
      } else {
        const move = Math.min(space, cursorItem.count);
        s.count += move; cursorItem.count -= move;
        if (cursorItem.count <= 0) cursorItem = null;
      }
    } else {
      // обмен
      arr[index] = cursorItem; cursorItem = s;
    }
  }
  updateCraftResult();
  refreshUI();
}

function makeSlotEl(arr, index, size) {
  const el = document.createElement('div');
  el.className = 'inv-slot';
  const item = arr[index];
  if (item) {
    el.appendChild(iconCanvas(item.id, size));
    if (item.count > 1) {
      const cnt = document.createElement('div');
      cnt.className = 'count'; cnt.textContent = item.count;
      el.appendChild(cnt);
    }
    addDurabilityBar(el, item);
    el.title = BLOCK_NAMES[item.id] || '';
  }
  el.addEventListener('mousedown', (e) => {
    e.preventDefault();
    slotClick(arr, index, e.button === 2, e.shiftKey);
  });
  el.addEventListener('contextmenu', e => e.preventDefault());
  return el;
}

// ============================================================
//  Слоты брони и второй руки (parity MC): в инвентаре игрока слева —
//  4 слота брони + слот offhand. Броню можно надевать/снимать кликом
//  (фикс: раньше надетую броню снять было НЕВОЗМОЖНО — только смерть).
// ============================================================
const ARMOR_SLOT_ICONS = { helmet: '⌒', chestplate: '▣', leggings: '║', boots: '⌄', offhand: '✋' };
const ARMOR_SLOT_NAMES = {
  helmet: 'Шлем', chestplate: 'Нагрудник', leggings: 'Поножи', boots: 'Ботинки', offhand: 'Вторая рука (F — обмен)',
};

// клик по слоту брони: надеть/снять/обменять (как в MC)
function armorSlotClick(slotName) {
  const cur = PLAYER.armor[slotName];
  if (!cursorItem) {
    if (!cur) return;                       // пусто и на курсоре пусто — ничего
    // снять броню на курсор (прочность сохраняется)
    cursorItem = { id: cur.id, count: 1, ...(cur.dur !== undefined ? { dur: cur.dur } : {}) };
    PLAYER.armor[slotName] = null;
  } else {
    if (!isArmor(cursorItem.id) || armorSlotOf(cursorItem.id) !== slotName) return; // не та броня
    // надеть одну штуку с курсора; старую — обратно на курсор
    const one = { id: cursorItem.id, count: 1, ...(cursorItem.dur !== undefined ? { dur: cursorItem.dur } : {}) };
    cursorItem.count--;
    if (cursorItem.count <= 0) cursorItem = null;
    const prev = PLAYER.armor[slotName];
    PLAYER.armor[slotName] = one;
    if (prev) {
      const back = { id: prev.id, count: 1, ...(prev.dur !== undefined ? { dur: prev.dur } : {}) };
      if (!cursorItem) cursorItem = back;
      else if (!addToInventory(back.id, 1, back.dur)) spawnDrop(back.id, PLAYER.pos.x, PLAYER.pos.y + 0.5, PLAYER.pos.z);
    }
  }
  playSound('place', BLOCK.PLANKS);
  refreshUI();
  if (typeof requestSave === 'function') requestSave();
}

// клик по слоту второй руки: любой предмет, поддержка стопок (как в MC)
function offhandSlotClick(rightClick) {
  const cur = PLAYER.offhand;
  if (!cursorItem) {
    if (!cur) return;
    if (rightClick) {
      const half = Math.ceil(cur.count / 2);
      cursorItem = { id: cur.id, count: half, ...(cur.dur !== undefined ? { dur: cur.dur } : {}) };
      cur.count -= half;
      if (cur.count <= 0) PLAYER.offhand = null;
    } else {
      cursorItem = cur; PLAYER.offhand = null;
    }
  } else if (!cur) {
    if (rightClick) {
      const one = (cursorItem.count === 1 && cursorItem.dur !== undefined);
      PLAYER.offhand = { id: cursorItem.id, count: 1, ...(one ? { dur: cursorItem.dur } : {}) };
      if (one) cursorItem.dur = undefined;
      cursorItem.count--; if (cursorItem.count <= 0) cursorItem = null;
    } else {
      PLAYER.offhand = cursorItem; cursorItem = null;
    }
  } else if (cur.id === cursorItem.id && cur.dur === undefined && cursorItem.dur === undefined) {
    const space = maxStack(cur.id) - cur.count;
    const move = rightClick ? Math.min(1, space) : Math.min(space, cursorItem.count);
    cur.count += move; cursorItem.count -= move;
    if (cursorItem.count <= 0) cursorItem = null;
  } else {
    const tmp = PLAYER.offhand; PLAYER.offhand = cursorItem; cursorItem = tmp; // обмен
  }
  refreshUI();
  if (typeof requestSave === 'function') requestSave();
}

// элемент слота брони (slotName) / второй руки ('offhand')
function makeArmorSlotEl(slotName) {
  const el = document.createElement('div');
  el.className = 'inv-slot ' + slotName;
  const item = (slotName === 'offhand') ? PLAYER.offhand : PLAYER.armor[slotName];
  if (item) {
    el.appendChild(iconCanvas(item.id, 34));
    if (item.count > 1) { const c = document.createElement('div'); c.className = 'count'; c.textContent = item.count; el.appendChild(c); }
    addDurabilityBar(el, item);
    el.title = (BLOCK_NAMES[item.id] || '') + ' — ' + ARMOR_SLOT_NAMES[slotName];
  } else {
    const ghost = document.createElement('div');
    ghost.className = 'ghost'; ghost.textContent = ARMOR_SLOT_ICONS[slotName] || '';
    el.appendChild(ghost);
    el.title = ARMOR_SLOT_NAMES[slotName];
  }
  el.addEventListener('mousedown', (e) => {
    e.preventDefault();
    if (slotName === 'offhand') offhandSlotClick(e.button === 2);
    else armorSlotClick(slotName);
  });
  el.addEventListener('contextmenu', e => e.preventDefault());
  return el;
}

const invGrid = document.getElementById('invGrid');
// клик по слотам печи (поля input/fuel/output) — с сохранением прочности
function furnaceSlotClick(f, field, rightClick) {
  if (field === 'output') {
    // только забрать
    const s = f.output;
    if (!s) return;
    onObtain(s.id); // переплавленный предмет открывает рецепт
    if (!cursorItem) { cursorItem = s; f.output = null; }
    else if (cursorItem.id === s.id && cursorItem.dur === undefined && s.dur === undefined && cursorItem.count + s.count <= maxStack(s.id)) { cursorItem.count += s.count; f.output = null; }
    refreshUI(); return;
  }
  const s = f[field];
  if (!cursorItem) {
    if (!s) return;
    if (rightClick) { const half=Math.ceil(s.count/2); cursorItem={id:s.id,count:half,...(s.dur!==undefined?{dur:s.dur}:{})}; s.count-=half; if(s.count<=0) f[field]=null; }
    else { cursorItem = s; f[field] = null; }
  } else {
    // для input принимаем только плавимые, для fuel — только топливо
    if (field === 'input' && !isSmeltable(cursorItem.id)) return;
    if (field === 'fuel' && !isFuel(cursorItem.id)) return;
    if (!s) {
      if (rightClick) { const one = (cursorItem.count === 1 && cursorItem.dur !== undefined); f[field] = {id:cursorItem.id,count:1,...(one?{dur:cursorItem.dur}:{})}; if (one) cursorItem.dur = undefined; cursorItem.count--; if(cursorItem.count<=0) cursorItem=null; }
      else { f[field] = cursorItem; cursorItem = null; }
    } else if (s.id === cursorItem.id && s.dur === undefined && cursorItem.dur === undefined) {
      const space = maxStack(s.id) - s.count;
      const move = rightClick ? Math.min(1, space) : Math.min(space, cursorItem.count);
      s.count += move; cursorItem.count -= move; if (cursorItem.count<=0) cursorItem=null;
    } else {
      const tmp = f[field]; f[field] = cursorItem; cursorItem = tmp;
    }
  }
  refreshUI();
}

function makeFurnaceSlot(f, field) {
  const el = document.createElement('div');
  el.className = 'inv-slot';
  const item = f[field];
  if (item) {
    el.appendChild(iconCanvas(item.id, 34));
    if (item.count > 1) { const c=document.createElement('div'); c.className='count'; c.textContent=item.count; el.appendChild(c); }
    el.title = BLOCK_NAMES[item.id] || '';
  }
  el.addEventListener('mousedown', (e) => { e.preventDefault(); furnaceSlotClick(f, field, e.button === 2); });
  el.addEventListener('contextmenu', e => e.preventDefault());
  return el;
}

// мини-иконка рецепта (без интерактива)
function recipeIconEl(id, size) {
  const el = document.createElement('div');
  el.className = 'guide-cell' + (id ? '' : ' empty');
  if (id) { el.appendChild(iconCanvas(id, size)); el.title = BLOCK_NAMES[id] || ''; }
  return el;
}

// Справочник рецептов — открывается постепенно по мере добычи ресурсов
function renderGuide() {
  const wrap = document.createElement('div');
  wrap.className = 'guide-wrap';

  const intro = document.createElement('div');
  intro.className = 'guide-intro';
  const total = RECIPES.length + Object.keys(SMELT).length;
  let unlocked = RECIPES.filter(recipeUnlocked).length +
                 Object.keys(SMELT).filter(k => discovered.has(+k)).length;
  intro.textContent = 'Справочник рецептов — открыто ' + unlocked + ' из ' + total +
                      '. Добывайте новые ресурсы, чтобы открыть больше.';
  wrap.appendChild(intro);
  // заметка о некрафтяемых вещах (parity MC)
  const extra = document.createElement('div');
  extra.className = 'guide-intro';
  extra.style.marginTop = '6px';
  extra.innerHTML = 'Не крафтится (как в Minecraft): командный блок — только <b>креатив-инвентарь (E)</b> или <code>/give command_block</code>. ' +
    'Яйца спавна мобов — тоже только креатив: <code>/give spawn_egg_pig</code> (и т.п. — sheep, cow, chicken, fish, zombie, zombie_piglin, phantom). ' +
    'Креатив: <code>/gamemode c</code> или при создании мира — полёт, бесконечные предметы.<br>' +
    '<b>Бессонница:</b> если не спать 3 ночи подряд, на 4-ю ночь прилетят <b>фантомы</b> (кучкой, горят на рассвете). Сон в кровати или смерть сбрасывает счётчик.<br>' +
    '<b>Броня и вторая рука:</b> слоты брони — слева в инвентаре (клик — надеть/снять, Shift+клик — быстро надеть). ' +
    'Вторая рука: <b>F</b> — обменять предмет между рукой и второй рукой (например, факелы — в левую, чтобы подсвечивать копая). ' +
    'Зомби теперь спавнятся как в Minecraft: пачками по 1-4, только в полной темноте — <b>факелы вокруг базы защищают от спавна</b>.';
  wrap.appendChild(extra);

  // строка рецепта (сетка -> стрелка -> результат)
  const appendRecipeRow = (row, cells, w, h, resultId, resultCount) => {
    const grid = document.createElement('div'); grid.className = 'guide-grid';
    grid.style.gridTemplateColumns = `repeat(${w}, 24px)`;
    for (let i = 0; i < w * h; i++) grid.appendChild(recipeIconEl(cells[i] || 0, 20));
    row.appendChild(grid);
    const arr = document.createElement('div'); arr.className = 'guide-arrow'; arr.appendChild(makeArrowIcon());
    row.appendChild(arr);
    const res = recipeIconEl(resultId, 24); res.classList.add('guide-result');
    if (resultCount > 1) { const c=document.createElement('span'); c.className='guide-count'; c.textContent='×'+resultCount; res.appendChild(c); }
    row.appendChild(res);
    const nm = document.createElement('div'); nm.className = 'guide-name';
    nm.textContent = BLOCK_NAMES[resultId] || '';
    row.appendChild(nm);
  };

  // --- Крафт-рецепты по категориям ---
  for (const cat of RECIPE_CATS) {
    const recs = RECIPES.filter(r => r.cat === cat.id);
    if (!recs.length) continue;
    const hdr = document.createElement('div'); hdr.className = 'guide-intro';
    hdr.style.marginTop = '8px';
    hdr.textContent = cat.title + ':';
    wrap.appendChild(hdr);
    for (const rec of recs) {
      const row = document.createElement('div');
      row.className = 'guide-row';
      const un = recipeUnlocked(rec);
      if (!un) {
        row.classList.add('locked');
        const q = document.createElement('div'); q.className = 'guide-locked';
        q.textContent = '??? — добудьте: ' +
          recipeIngredients(rec).map(id => BLOCK_NAMES[id] || '?').join(', ');
        row.appendChild(q);
        wrap.appendChild(row);
        continue;
      }
      const g = recipeGridCells(rec);
      appendRecipeRow(row, g.cells, g.w, g.h, rec.result.id, rec.result.count);
      wrap.appendChild(row);
    }
  }

  // --- Плавка (печь) ---
  const smHdr = document.createElement('div'); smHdr.className = 'guide-intro'; smHdr.style.marginTop = '8px';
  smHdr.textContent = 'Плавка в печи:';
  wrap.appendChild(smHdr);
  for (const k of Object.keys(SMELT)) {
    const inId = +k, out = SMELT[k];
    const row = document.createElement('div'); row.className = 'guide-row';
    if (!discovered.has(inId)) {
      row.classList.add('locked');
      const q = document.createElement('div'); q.className = 'guide-locked';
      q.textContent = '??? — добудьте: ' + (BLOCK_NAMES[inId] || '?');
      row.appendChild(q); wrap.appendChild(row); continue;
    }
    const inCell = recipeIconEl(inId, 24); row.appendChild(inCell);
    const fl = document.createElement('div'); fl.className = 'guide-arrow'; fl.appendChild(makeFlameIcon(true)); row.appendChild(fl);
    const res = recipeIconEl(out.id, 24); res.classList.add('guide-result'); row.appendChild(res);
    const nm = document.createElement('div'); nm.className = 'guide-name'; nm.textContent = BLOCK_NAMES[out.id] || '';
    row.appendChild(nm);
    wrap.appendChild(row);
  }

  invGrid.appendChild(wrap);
}

