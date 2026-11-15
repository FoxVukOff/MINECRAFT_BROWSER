/* ============================================================
   MiniCraft — fire · Огонь: распространение и выгорание
   (модуль 5 из 33; строки 2772–2905 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Огонь — parity Minecraft: ставится сверху И СБОКУ блоков,
//  распространяется на соседние/диагональные горючие (вбок и вверх),
//  постепенно СЪЕДАЕТ топливо (сгоревший блок замещается огнём)
// ============================================================
const FLAMMABLE = {};
[BLOCK.WOOD, BLOCK.PLANKS, BLOCK.LEAVES, BLOCK.CRAFTING_TABLE, BLOCK.CHEST,
 BLOCK.DOOR_BOTTOM, BLOCK.DOOR_TOP].forEach(b => FLAMMABLE[b] = true);
function isFlammable(b) { return !!FLAMMABLE[b]; }

// Как быстро топливо сгорает ДОТЛА за тик (0.5 с): листва вспыхивает мгновенно,
// доски/верстак — быстро, брёвна — тлеют долго (как в MC: fire «съедает» блок).
// Сундук горит (огонь рядом живёт), но НЕ сгорает дотла — иначе пропадал бы
// весь лут внутри, а система выброса содержимого при сгорании не предусмотрена.
const BURN_AWAY_CHANCE = {
  [BLOCK.LEAVES]:        0.30,
  [BLOCK.PLANKS]:        0.16,
  [BLOCK.CRAFTING_TABLE]:0.14,
  [BLOCK.WOOD]:          0.06,
  [BLOCK.DOOR_BOTTOM]:   0.12,
  [BLOCK.DOOR_TOP]:      0.12,
};

const FireSim = {
  fires: new Map(),   // "x,y,z" -> { age, att }  (att — грань крепления, см. ATTACH_DIRS)
  tickAcc: 0, tickRate: 0.5,
  MAX_FIRES: 400,     // предохранитель производительности при лесном пожаре

  // К каким граням может крепиться огонь: 0 — стоит на блоке снизу,
  // 1..4 — «прилип» к боковой грани соседа (боковой огонь, как в MC)
  ATTACH_DIRS: [[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]],

  // автоматически определить крепление огня в этой ячейке
  findAttach(x, y, z) {
    if (isSolidForPlayer(x, y - 1, z)) return 0;
    const sides = [1, 2, 3, 4];
    // приоритет — горючая опора (огонь на топливе горит ярче/дольше)
    for (const i of sides) {
      const d = this.ATTACH_DIRS[i];
      if (isFlammable(World.getBlock(x + d[0], y + d[1], z + d[2]))) return i;
    }
    for (const i of sides) {
      const d = this.ATTACH_DIRS[i];
      if (isSolidForPlayer(x + d[0], y + d[1], z + d[2])) return i;
    }
    return 0;
  },

  add(x, y, z, att) {
    if (this.fires.size >= this.MAX_FIRES) return;
    if (World.getBlock(x, y, z) !== BLOCK.AIR) return;
    if (att === undefined) att = this.findAttach(x, y, z);
    World.setBlock(x, y, z, BLOCK.FIRE, true);
    this.fires.set(x+','+y+','+z, { age: 0, att });
    rebuildAround(x, z);
  },
  remove(x, y, z) {
    const k = x+','+y+','+z;
    if (this.fires.has(k)) this.fires.delete(k);
    if (World.getBlock(x, y, z) === BLOCK.FIRE) { World.setBlock(x, y, z, BLOCK.AIR, true); rebuildAround(x, z); }
  },
  hasFuel(x, y, z) {
    const dirs = [[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,1,0]];
    for (const [dx,dy,dz] of dirs) if (isFlammable(World.getBlock(x+dx,y+dy,z+dz))) return true;
    return false;
  },
  update(dt) {
    this.tickAcc += dt;
    if (this.tickAcc < this.tickRate) return;
    this.tickAcc = 0;
    if (this.fires.size === 0) return;
    const toRemove = [];
    const toBurn = [];
    for (const [k, st] of this.fires) {
      const [x,y,z] = k.split(',').map(Number);
      if (World.getBlock(x,y,z) !== BLOCK.FIRE) { toRemove.push([x,y,z]); continue; }
      st.age += this.tickRate;
      // опора исчезла (сгорела/сломана) — перекрепиться или со временем погаснуть
      const ad = this.ATTACH_DIRS[st.att];
      if (!isSolidForPlayer(x+ad[0], y+ad[1], z+ad[2])) st.att = this.findAttach(x, y, z);
      // вечный огонь на незераке (parity MC): не гаснет без причины
      const eternal = World.getBlock(x, y-1, z) === BLOCK.NETHERRACK;
      // нет топлива рядом — гаснет (кроме вечного огня на незераке)
      if (!eternal && !this.hasFuel(x,y,z)) { if (st.age > 1.5) toRemove.push([x,y,z]); continue; }

      // --- СГОРАНИЕ ТОПЛИВА: огонь съедает соседний горючий блок,
      //     а на его месте остаётся огонь (как в MC) ---
      const dirs6 = [[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,1,0]];
      for (const [dx,dy,dz] of dirs6) {
        const b = World.getBlock(x+dx, y+dy, z+dz);
        if (BURN_AWAY_CHANCE[b] !== undefined && Math.random() < BURN_AWAY_CHANCE[b]) {
          const bx=x+dx, by=y+dy, bz=z+dz;
          World.setBlock(bx, by, bz, BLOCK.AIR);
          scheduleLeafDecayAround(bx, by, bz);
          spawnParticles(bx+0.5, by+0.6, bz+0.5, 4, '#5e5e5e'); // дым сгоревшего блока
          // двери сгорают целиком (обе половины)
          if (isDoor(b)) {
            const oy = (b === BLOCK.DOOR_BOTTOM) ? by + 1 : by - 1;
            if (isDoor(World.getBlock(bx, oy, bz))) World.setBlock(bx, oy, bz, BLOCK.AIR);
          }
          toBurn.push([bx, by, bz]); // пламя займёт место сгоревшего блока
          break; // не более одного съеденного блока за тик на один огонь
        }
      }

      // --- РАСПРОСТРАНЕНИЕ (умное, как в MC): пламя перебрасывается вбок/вверх
      //     на соседние и диагональные клетки, если рядом с ними есть топливо.
      //     Так огонь «облизывает» ствол со всех сторон и лезет по дереву вверх,
      //     а не только сжигает блок под собой ---
      if (Math.random() < 0.55) {
        for (let attempt = 0; attempt < 3; attempt++) {
          const dx = ((Math.random()*3)|0) - 1;
          const dz = ((Math.random()*3)|0) - 1;
          // вверх и вровень — часто, вниз — редко (в MC огонь почти не идёт вниз)
          const dy = (Math.random() < 0.7) ? ((Math.random()*2)|0) : -1;
          const tx = x+dx, ty = y+dy, tz = z+dz;
          if (World.getBlock(tx, ty, tz) !== BLOCK.AIR) continue;
          let ok = false;
          for (const [ax,ay,az] of dirs6) {
            if (isFlammable(World.getBlock(tx+ax, ty+ay, tz+az))) { ok = true; break; }
          }
          if (ok) { toBurn.push([tx, ty, tz]); break; }
        }
      }

      // огонь живёт ограниченное время (вечный на незераке — не гаснет)
      if (!eternal && st.age > 8 + Math.random()*6) toRemove.push([x,y,z]);
    }
    for (const [x,y,z] of toBurn) this.add(x, y, z);
    for (const [x,y,z] of toRemove) this.remove(x, y, z);
  },
  clear() { this.fires.clear(); this.tickAcc = 0; },
};

