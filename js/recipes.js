/* ============================================================
   MiniCraft — recipes · Рецепты крафта
   (модуль 13 из 33; строки 5409–5685 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Рецепты крафта
// ============================================================
// Каждый рецепт: { shapeless?, pattern (для формовых), result:{id,count} }
// Для простоты: формовые задаются как массив строк с символами,
// бесформенные — как набор {id:count}.
const P = BLOCK.PLANKS, S = ITEM.STICK, C = BLOCK.COBBLESTONE, O = 0, I = ITEM.IRON_INGOT, U = ITEM.COPPER_INGOT, D = ITEM.DIAMOND, L = ITEM.LEATHER, W = BLOCK.WOOL, CO = ITEM.COAL;
// шаблоны брони (3x3): шлем/нагрудник/поножи/ботинки
function armorRecipe(m, helmet, chest, legs, boots) {
  return [
    { shaped:true, w:3, h:2, need3x3:true, cells:[m,m,m, m,O,m], result:{ id: helmet, count:1 } },
    { shaped:true, w:3, h:3, need3x3:true, cells:[m,O,m, m,m,m, m,m,m], result:{ id: chest, count:1 } },
    { shaped:true, w:3, h:3, need3x3:true, cells:[m,m,m, m,O,m, m,O,m], result:{ id: legs, count:1 } },
    { shaped:true, w:3, h:2, need3x3:true, cells:[m,O,m, m,O,m], result:{ id: boots, count:1 } },
  ];
}
const RECIPES = [
  // 1 дерево -> 4 доски (бесформенно)
  { shapeless: true, ingredients: { [BLOCK.WOOD]: 1 }, result: { id: BLOCK.PLANKS, count: 4 } },
  // 2 доски -> 4 палки (бесформенно, как в майне столбиком, но упростим)
  { shapeless: true, ingredients: { [BLOCK.PLANKS]: 2 }, result: { id: ITEM.STICK, count: 4 } },
  // 4 доски 2x2 -> верстак
  { shaped: true, w: 2, h: 2, cells: [P,P, P,P], result: { id: BLOCK.CRAFTING_TABLE, count: 1 } },
  // деревянная кирка: ряд досок + 2 палки (3x3)
  { shaped: true, w: 3, h: 3, need3x3: true,
    cells: [P,P,P,
            O,S,O,
            O,S,O], result: { id: ITEM.WOODEN_PICKAXE, count: 1 } },
  // каменная кирка: ряд булыжника + 2 палки (3x3)
  { shaped: true, w: 3, h: 3, need3x3: true,
    cells: [C,C,C,
            O,S,O,
            O,S,O], result: { id: ITEM.STONE_PICKAXE, count: 1 } },
  // медная кирка: ряд медных слитков + 2 палки (3x3) — золотая середина
  { shaped: true, w: 3, h: 3, need3x3: true,
    cells: [U,U,U,
            O,S,O,
            O,S,O], result: { id: ITEM.COPPER_PICKAXE, count: 1 } },
  // железная кирка: ряд слитков + 2 палки (3x3)
  { shaped: true, w: 3, h: 3, need3x3: true,
    cells: [I,I,I,
            O,S,O,
            O,S,O], result: { id: ITEM.IRON_PICKAXE, count: 1 } },

  // ---- Топоры (2 материала углом + 2 палки) ----
  { shaped: true, w: 2, h: 3, need3x3: true, cells: [P,P, P,S, O,S], result: { id: ITEM.WOODEN_AXE, count: 1 } },
  { shaped: true, w: 2, h: 3, need3x3: true, cells: [C,C, C,S, O,S], result: { id: ITEM.STONE_AXE, count: 1 } },
  { shaped: true, w: 2, h: 3, need3x3: true, cells: [U,U, U,S, O,S], result: { id: ITEM.COPPER_AXE, count: 1 } },
  { shaped: true, w: 2, h: 3, need3x3: true, cells: [I,I, I,S, O,S], result: { id: ITEM.IRON_AXE, count: 1 } },

  // ---- Лопаты (1 материал + 2 палки в столбик) ----
  { shaped: true, w: 1, h: 3, need3x3: true, cells: [P, S, S], result: { id: ITEM.WOODEN_SHOVEL, count: 1 } },
  { shaped: true, w: 1, h: 3, need3x3: true, cells: [C, S, S], result: { id: ITEM.STONE_SHOVEL, count: 1 } },
  { shaped: true, w: 1, h: 3, need3x3: true, cells: [U, S, S], result: { id: ITEM.COPPER_SHOVEL, count: 1 } },
  { shaped: true, w: 1, h: 3, need3x3: true, cells: [I, S, S], result: { id: ITEM.IRON_SHOVEL, count: 1 } },

  // ---- Мечи (2 материала в столбик + палка-рукоять) ----
  { shaped: true, w: 1, h: 3, need3x3: true, cells: [P, P, S], result: { id: ITEM.WOODEN_SWORD, count: 1 } },
  { shaped: true, w: 1, h: 3, need3x3: true, cells: [C, C, S], result: { id: ITEM.STONE_SWORD, count: 1 } },
  { shaped: true, w: 1, h: 3, need3x3: true, cells: [U, U, S], result: { id: ITEM.COPPER_SWORD, count: 1 } },
  { shaped: true, w: 1, h: 3, need3x3: true, cells: [I, I, S], result: { id: ITEM.IRON_SWORD, count: 1 } },
  { shaped: true, w: 1, h: 3, need3x3: true, cells: [D, D, S], result: { id: ITEM.DIAMOND_SWORD, count: 1 } },

  // ---- Алмазные инструменты ----
  { shaped: true, w: 3, h: 3, need3x3: true, cells: [D,D,D, O,S,O, O,S,O], result: { id: ITEM.DIAMOND_PICKAXE, count: 1 } },
  { shaped: true, w: 2, h: 3, need3x3: true, cells: [D,D, D,S, O,S], result: { id: ITEM.DIAMOND_AXE, count: 1 } },
  { shaped: true, w: 1, h: 3, need3x3: true, cells: [D, S, S], result: { id: ITEM.DIAMOND_SHOVEL, count: 1 } },

  // ---- Ведро (3 железных слитка V-образно) ----
  { shaped: true, w: 3, h: 2, need3x3: true, cells: [I,O,I, O,I,O], result: { id: ITEM.BUCKET, count: 1 } },
  // Зажигалка: железо + кремень (по диагонали)
  { shaped: true, w: 2, h: 2, need3x3: true, cells: [I,O, O,ITEM.FLINT], result: { id: ITEM.FLINT_AND_STEEL, count: 1 } },
  // Лодка: 5 досок «U» (2x3 без центра верха)
  { shaped: true, w: 3, h: 2, need3x3: true, cells: [P,O,P, P,P,P], result: { id: ITEM.BOAT, count: 1 } },
  // ---- Броня ----
  ...armorRecipe(L, ITEM.LEATHER_HELMET, ITEM.LEATHER_CHESTPLATE, ITEM.LEATHER_LEGGINGS, ITEM.LEATHER_BOOTS),
  ...armorRecipe(U, ITEM.COPPER_HELMET, ITEM.COPPER_CHESTPLATE, ITEM.COPPER_LEGGINGS, ITEM.COPPER_BOOTS),
  ...armorRecipe(I, ITEM.IRON_HELMET, ITEM.IRON_CHESTPLATE, ITEM.IRON_LEGGINGS, ITEM.IRON_BOOTS),
  ...armorRecipe(D, ITEM.DIAMOND_HELMET, ITEM.DIAMOND_CHESTPLATE, ITEM.DIAMOND_LEGGINGS, ITEM.DIAMOND_BOOTS),
  // факел: уголь/древесный уголь над палкой -> 4 факела
  { shaped:true, w:1, h:2, cells:[CO, S], result:{ id: BLOCK.TORCH, count:4 } },
  { shaped:true, w:1, h:2, cells:[ITEM.CHARCOAL, S], result:{ id: BLOCK.TORCH, count:4 } },
  // кровать: 3 шерсти + 3 доски (3x2) -> кровать
  { shaped:true, w:3, h:2, need3x3:true, cells:[W,W,W, P,P,P], result:{ id: BLOCK.BED_FOOT, count:1 } },
  // дверь: 2 в ширину, 3 в высоту из досок (6 досок) -> предмет двери.
  // (полный столбец 2x3, чтобы не путать с верстаком 2x2)
  { shaped: true, w: 2, h: 3, need3x3: true,
    cells: [P,P,
            P,P,
            P,P], result: { id: ITEM.DOOR, count: 1 } },
  // печь: 8 булыжника по периметру (центр пуст) 3x3 -> печь
  { shaped: true, w: 3, h: 3, need3x3: true,
    cells: [C,C,C,
            C,O,C,
            C,C,C], result: { id: BLOCK.FURNACE, count: 1 } },
  // сундук: 8 досок по периметру (центр пуст) 3x3 -> сундук
  { shaped: true, w: 3, h: 3, need3x3: true,
    cells: [P,P,P,
            P,O,P,
            P,P,P], result: { id: BLOCK.CHEST, count: 1 } },
  // ножницы: 2 железных слитка по диагонали (2x2) -> ножницы
  { shaped: true, w: 2, h: 2,
    cells: [I,O,
            O,I], result: { id: ITEM.SHEARS, count: 1 } },
  // рычаг: булыжник + палка (столбик) -> рычаг
  { shaped: true, w: 1, h: 2,
    cells: [C, S], result: { id: BLOCK.LEVER, count: 1 } },
  // редстоуновый факел: редстоун над палкой -> 1 факел
  { shaped: true, w: 1, h: 2,
    cells: [ITEM.REDSTONE, S], result: { id: BLOCK.REDSTONE_TORCH, count: 1 } },
  // кнопка: 1 булыжник (одиночный блок) -> 1 кнопка
  { shaped: true, w: 1, h: 1, cells: [C], result: { id: BLOCK.BUTTON, count: 1 } },
  // поршень: 3 доски сверху + 4 булыжника + железо + редстоун (3x3)
  { shaped: true, w: 3, h: 3, need3x3: true,
    cells: [P,P,P,
            C,I,C,
            C,ITEM.REDSTONE,C], result: { id: BLOCK.PISTON, count: 1 } },
];

// Категории для справочника (J): раскладываем рецепты по группам.
// Явный rec.cat важнее; остальное выводим из результата.
const RECIPE_CATS = [
  { id: 'basics',  title: 'Основное' },
  { id: 'tools',   title: 'Инструменты' },
  { id: 'combat',  title: 'Оружие и броня' },
  { id: 'redstone', title: 'Механизмы (редстоун)' },
];
for (const rec of RECIPES) {
  if (rec.cat !== undefined) continue;
  const id = rec.result.id;
  if (isSword(id) || isArmor(id)) rec.cat = 'combat';
  else if (isPickaxe(id) || isAxe(id) || isShovel(id)) rec.cat = 'tools';
  else if (id === BLOCK.LEVER || id === BLOCK.BUTTON || id === BLOCK.REDSTONE_TORCH || id === BLOCK.PISTON) rec.cat = 'redstone';
  else rec.cat = 'basics';
}

// нормализовать содержимое сетки крафта к компактной матрице (обрезать пустые края)
function craftMatrix(size) {
  const n = size; // 2 или 3
  const grid = [];
  for (let r = 0; r < n; r++) { grid.push([]); for (let cc = 0; cc < n; cc++) grid[r].push(craftSlots[r*n+cc]); }
  // границы непустых
  let minR=n, maxR=-1, minC=n, maxC=-1;
  for (let r=0;r<n;r++) for (let cc=0;cc<n;cc++) if (grid[r][cc]) { minR=Math.min(minR,r);maxR=Math.max(maxR,r);minC=Math.min(minC,cc);maxC=Math.max(maxC,cc); }
  if (maxR<0) return null;
  const m=[];
  for (let r=minR;r<=maxR;r++){const row=[];for (let cc=minC;cc<=maxC;cc++)row.push(grid[r][cc]?grid[r][cc].id:0);m.push(row);}
  return m;
}

function craftTotals(size) {
  const n = size; const tot = {};
  for (let i=0;i<n*n;i++){const s=craftSlots[i];if(s)tot[s.id]=(tot[s.id]||0)+1;}
  return tot;
}

// id-сетка крафта (0 для пустых) размером size x size
function craftIdGrid(size) {
  const g = [];
  for (let r = 0; r < size; r++) { g.push([]); for (let cc = 0; cc < size; cc++) { const s = craftSlots[r*size+cc]; g[r].push(s ? s.id : 0); } }
  return g;
}

// совпадает ли формовый рецепт при заданном смещении (or, oc) в сетке size
function shapedFits(rec, grid, size, or, oc) {
  for (let r = 0; r < size; r++) for (let cc = 0; cc < size; cc++) {
    let want = 0;
    if (r >= or && r < or + rec.h && cc >= oc && cc < oc + rec.w) {
      want = rec.cells[(r - or) * rec.w + (cc - oc)];
    }
    if (grid[r][cc] !== want) return false;
  }
  return true;
}

// набор уникальных id-ингредиентов рецепта (для справочника)
function recipeIngredients(rec) {
  const set = new Set();
  if (rec.shapeless) { for (const k of Object.keys(rec.ingredients)) set.add(+k); }
  else if (rec.cells) { for (const c of rec.cells) if (c) set.add(c); }
  return [...set];
}
// рецепт открыт, если игрок держал все его ингредиенты
function recipeUnlocked(rec) {
  return recipeIngredients(rec).every(id => discovered.has(id));
}
// список ячеек рецепта для отображения сетки (нормализованный до w×h; SMELT — особый)
function recipeGridCells(rec) {
  if (rec.shapeless) {
    // разложить ингредиенты по ячейкам 3x3 подряд
    const cells = [];
    for (const k of Object.keys(rec.ingredients)) for (let i = 0; i < rec.ingredients[k]; i++) cells.push(+k);
    while (cells.length < 4) cells.push(0);
    return { w: 2, h: 2, cells: cells.slice(0, 4) };
  }
  return { w: rec.w, h: rec.h, cells: rec.cells };
}

function matchRecipe(size) {
  const totals = craftTotals(size);
  const totalCount = Object.values(totals).reduce((a,b)=>a+b,0);
  if (totalCount === 0) return null;
  const grid = craftIdGrid(size);
  for (const rec of RECIPES) {
    if (rec.need3x3 && size < 3) continue;
    if (rec.shapeless) {
      const keys = Object.keys(rec.ingredients);
      if (keys.length !== Object.keys(totals).length) continue;
      let ok = true;
      for (const k of keys) if ((totals[k]||0) !== rec.ingredients[k]) ok = false;
      if (ok) return rec;
    } else if (rec.shaped) {
      if (rec.h > size || rec.w > size) continue;
      for (let or = 0; or + rec.h <= size; or++)
        for (let oc = 0; oc + rec.w <= size; oc++)
          if (shapedFits(rec, grid, size, or, oc)) return rec;
    }
  }
  return null;
}

function updateCraftResult() {
  const size = craftMode === '3x3' ? 3 : 2;
  const rec = matchRecipe(size);
  craftResult = rec ? { ...rec.result } : null;
}

// забрать результат крафта (списать ингредиенты)
function takeCraftResult() {
  const size = craftMode === '3x3' ? 3 : 2;
  const rec = matchRecipe(size);
  if (!rec) return;
  const res = rec.result;
  // если на курсоре уже есть предмет — складываем, иначе берём
  if (cursorItem && (cursorItem.id !== res.id || cursorItem.count + res.count > maxStack(res.id))) return;
  // списать ингредиенты
  if (rec.shapeless) {
    // по нужному количеству каждого ингредиента (может лежать в одном слоте стопкой)
    const need = { ...rec.ingredients };
    for (let i = 0; i < size*size; i++) {
      const s = craftSlots[i]; if (!s) continue;
      if (need[s.id] > 0) {
        const take = Math.min(need[s.id], s.count);
        s.count -= take; need[s.id] -= take;
        if (s.count <= 0) craftSlots[i] = null;
      }
    }
  } else {
    // формовый: по одному из каждого занятого слота
    for (let i = 0; i < size*size; i++) {
      if (craftSlots[i]) { craftSlots[i].count--; if (craftSlots[i].count<=0) craftSlots[i]=null; }
    }
  }
  if (cursorItem) cursorItem.count += res.count;
  else cursorItem = { id: res.id, count: res.count };
  onObtain(res.id); // открыть рецепт результата в справочнике
  playSound('place', res.id);
  updateCraftResult();
  refreshUI();
}

// вернуть предметы из сетки крафта в инвентарь (при закрытии); не влезшее — выбросить под ноги
function clearCraftToInventory() {
  const n = 3;
  for (let i=0;i<n*n;i++){
    if (craftSlots[i]) {
      const s = craftSlots[i];
      if (!addToInventory(s.id, s.count, s.dur)) tossDropForward(s.id);
      craftSlots[i]=null;
    }
  }
  if (cursorItem) {
    if (!addToInventory(cursorItem.id, cursorItem.count, cursorItem.dur)) tossDropForward(cursorItem.id);
    cursorItem = null;
  }
}

