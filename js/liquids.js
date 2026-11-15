/* ============================================================
   MiniCraft — liquids · Симуляция воды и лавы
   (модуль 4 из 33; строки 2422–2771 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Единая симуляция жидкостей (вода и лава) — модель Minecraft.
//  Вода: источник=8, течение 7..1 (до 7 клеток), бесконечный источник
//        (если у течения ≥2 соседа-источника воды — становится источником).
//  Лава: источник=4, течение 3..1 (короткая дальность), течёт медленнее.
//  Контакты вода+лава: лава-источник→ОБСИДИАН, лава-течение→БУЛЫЖНИК,
//        вода, льющаяся НА лаву сверху → КАМЕНЬ.
// ============================================================
function liquidKind(b) {
  if (b === BLOCK.WATER || b === BLOCK.WATER_FLOW) return 'water';
  if (b === BLOCK.LAVA || b === BLOCK.LAVA_FLOW) return 'lava';
  return null;
}

const LiquidSim = {
  queue: [],
  inQueue: new Set(),
  tickAcc: 0,
  waterAcc: 0, lavaAcc: 0,
  // Скорости как в MC: вода — раз в 5 тиков (0.25 с);
  // лава в обычном мире — раз в 30 тиков (1.5 с), в Аду — раз в 10 тиков (0.5 с)
  waterRate: 0.25,
  lavaRate: 1.5,
  MAX_PER_TICK: 240,
  changedChunks: new Set(),

  enqueue(x, y, z) {
    if (y < 0 || y >= WORLD_HEIGHT) return;
    const k = x + ',' + y + ',' + z;
    if (this.inQueue.has(k)) return;
    this.inQueue.add(k);
    this.queue.push(k);
  },
  touchAround(x, y, z) {
    this.enqueue(x, y, z);
    this.enqueue(x + 1, y, z); this.enqueue(x - 1, y, z);
    this.enqueue(x, y, z + 1); this.enqueue(x, y, z - 1);
    this.enqueue(x, y + 1, z); this.enqueue(x, y - 1, z);
  },
  markChunk(x, z) {
    const cx = Math.floor(x / CHUNK_SIZE), cz = Math.floor(z / CHUNK_SIZE);
    this.changedChunks.add(cx + ',' + cz);
    const lx = x - cx * CHUNK_SIZE, lz = z - cz * CHUNK_SIZE;
    if (lx === 0) this.changedChunks.add((cx - 1) + ',' + cz);
    if (lx === CHUNK_SIZE - 1) this.changedChunks.add((cx + 1) + ',' + cz);
    if (lz === 0) this.changedChunks.add(cx + ',' + (cz - 1));
    if (lz === CHUNK_SIZE - 1) this.changedChunks.add(cx + ',' + (cz + 1));
  },

  // максимальный уровень / блоки по типу жидкости.
  // В Аду лава течёт дальше, чем в обычном мире (в MC — 8 блоков против 3)
  maxLevel(kind) { return kind === 'water' ? WATER_MAX : (World.dim === 'nether' ? 8 : LAVA_MAX); },
  srcBlock(kind) { return kind === 'water' ? BLOCK.WATER : BLOCK.LAVA; },
  flowBlock(kind) { return kind === 'water' ? BLOCK.WATER_FLOW : BLOCK.LAVA_FLOW; },

  setFlow(kind, x, y, z, lvl) {
    if (y < 0 || y >= WORLD_HEIGHT) return; // защита от выхода за границы мира
    if (lvl <= 0) {
      World.clearLevel(x, y, z);
      World.setBlock(x, y, z, BLOCK.AIR, true);
    } else {
      World.setLevel(x, y, z, lvl);
      World.setBlock(x, y, z, this.flowBlock(kind), true);
    }
    this.markChunk(x, z);
    this.touchAround(x, y, z);
  },

  // Контакт лавы с водой -> затвердевание (как в Minecraft).
  // Возвращает true, если ячейка превратилась в камень/обсидиан/булыжник.
  contactSolidify(x, y, z) {
    const here = World.getBlock(x, y, z);
    if (!isLavaLiquid(here)) return false;
    const dirs = [[1,0,0],[-1,0,0],[0,0,1],[0,0,-1],[0,1,0]];
    let waterNear = false;
    for (const [dx,dy,dz] of dirs) if (isWaterLiquid(World.getBlock(x+dx,y+dy,z+dz))) { waterNear = true; break; }
    if (!waterNear) return false;
    World.clearLevel(x, y, z);
    // лава-источник + вода -> ОБСИДИАН; лава-течение + вода -> БУЛЫЖНИК
    World.setBlock(x, y, z, (here === BLOCK.LAVA) ? BLOCK.OBSIDIAN : BLOCK.COBBLESTONE);
    this.markChunk(x, z);
    this.touchAround(x, y, z);
    playSound('splash');
    return true;
  },

  // есть ли поблизости горючий блок (радиус 2 по горизонтали, 1 по высоте)?
  _flammableNear(x, y, z) {
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -2; dx <= 2; dx++)
        for (let dz = -2; dz <= 2; dz++)
          if (isFlammable(World.getBlock(x+dx, y+dy, z+dz))) return true;
    return false;
  },
  // Лава поджигает близкие горючие блоки: ищет вокруг (радиус ~2 по горизонтали, 1 по высоте)
  // горючий блок, рядом с которым есть воздух, и ставит туда огонь.
  _igniteNear(x, y, z) {
    for (let tries = 0; tries < 4; tries++) {
      const dx = (Math.random()*5|0) - 2; // -2..2
      const dz = (Math.random()*5|0) - 2;
      const dy = (Math.random()*3|0) - 1; // -1..1
      const fx = x+dx, fy = y+dy, fz = z+dz;
      if (!isFlammable(World.getBlock(fx, fy, fz))) continue;
      // зажечь воздух СВЕРХУ или сбоку от горючего блока
      const spots = [[fx,fy+1,fz],[fx+1,fy,fz],[fx-1,fy,fz],[fx,fy,fz+1],[fx,fy,fz-1]];
      for (const [ax,ay,az] of spots) {
        if (World.getBlock(ax,ay,az) === BLOCK.AIR) { FireSim.add(ax, ay, az); return; }
      }
    }
  },

  // желаемый уровень течения исходя из питания соседями (kind-специфично)
  desiredLevel(kind, x, y, z) {
    const src = this.srcBlock(kind), flow = this.flowBlock(kind);
    const maxL = this.maxLevel(kind);
    // питание сверху -> «падающее» течение (полный «почти-источник», вбок не растекается)
    const above = World.getBlock(x, y + 1, z);
    if (above === src || above === flow) return { level: maxL - 1, falling: true };
    let best = 0;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dx, dz] of dirs) {
      const nx = x + dx, nz = z + dz;
      const nb = World.getBlock(nx, y, nz);
      if (nb === src) {
        best = Math.max(best, maxL - 1);
      } else if (nb === flow) {
        // падающий сосед (под ним есть куда стекать вниз) вбок НЕ питает —
        // иначе вода переливается через ямку вместо того, чтобы уходить в неё.
        if (this._canDrainDown(kind, nx, y, nz)) continue;
        best = Math.max(best, World.getLevel(nx, y, nz) - 1);
      }
    }
    return { level: best, falling: false };
  },

  // Бесконечный источник воды: течение, у которого ≥2 соседа-источника воды
  // И снизу опора (как в MC) — само становится источником (классика Minecraft).
  tryFormInfiniteSource(x, y, z) {
    if (World.getBlock(x, y, z) !== BLOCK.WATER_FLOW) return false;
    // под ячейкой должна быть опора (твёрдый блок или источник) — иначе не формируется
    const below = World.getBlock(x, y - 1, z);
    if (below === BLOCK.AIR || below === BLOCK.WATER_FLOW) return false;
    let srcN = 0;
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (const [dx, dz] of dirs) if (World.getBlock(x+dx, y, z+dz) === BLOCK.WATER) srcN++;
    if (srcN >= 2) {
      World.clearLevel(x, y, z);
      World.setBlock(x, y, z, BLOCK.WATER, true);
      this.markChunk(x, z);
      this.touchAround(x, y, z);
      return true;
    }
    return false;
  },

  // Может ли жидкость данного вида занять ячейку (воздух или своё течение меньшего уровня)
  _canFlowInto(kind, x, y, z) {
    const b = World.getBlock(x, y, z);
    if (b === BLOCK.AIR) return true;
    if (b === this.flowBlock(kind)) return true;
    // другая жидкость — пройти можно (для поиска дыры), но не своя-источник/твёрдое
    return false;
  },
  // может ли жидкость в (x,y,z) стекать ВНИЗ (под ней пустота или своё течение)?
  // Такая клетка — «падающая» (сток): уходит вниз и НЕ питает горизонтальных соседей,
  // поэтому вода в ямку утекает, а не переливается дальше по каналу.
  _canDrainDown(kind, x, y, z) {
    const below = World.getBlock(x, y - 1, z);
    if (below === BLOCK.AIR) return true;
    if (below === this.flowBlock(kind)) return true; // столб ещё течёт вниз
    return false;
  },
  // Глубина поиска «дыры» (как в Minecraft — до 5 клеток по горизонтали)
  // Поиск кратчайшего расстояния до дыры (ячейки, где есть провал вниз) в направлении (dx,dz).
  // Возвращает расстояние 1..MAX или Infinity, если дыры нет.
  _distanceToHole(kind, x, y, z, dx, dz) {
    const MAX = 5;
    for (let d = 1; d <= MAX; d++) {
      const cx = x + dx * d, cz = z + dz * d;
      // путь должен оставаться проходимым по горизонтали
      if (!this._canFlowInto(kind, cx, y, cz)) return Infinity;
      // под этой ячейкой провал? тогда это «дыра»
      const below = World.getBlock(cx, y - 1, cz);
      if (below === BLOCK.AIR || (this._canFlowInto(kind, cx, y - 1, cz) && below !== this.srcBlock(kind))) {
        return d; // провал (в т.ч. столб собственного течения вниз) — это «дыра»
      }
    }
    return Infinity;
  },
  spreadSides(kind, x, y, z, lvl) {
    const next = lvl - 1;
    if (next <= 0) return;
    const flow = this.flowBlock(kind);
    const dirs = [[1,0],[-1,0],[0,1],[0,-1]];

    // --- Поиск кратчайшего пути к «дыре» (модель воды Minecraft) ---
    // Если хотя бы в одном направлении вода может стечь в провал — она течёт
    // ТОЛЬКО в направление(я) с минимальным расстоянием до дыры (не разливается во все стороны).
    let minDist = Infinity;
    const dist = dirs.map(([dx, dz]) => {
      const nx = x + dx, nz = z + dz;
      // направление доступно только если соседняя ячейка свободна для затекания
      if (!this._canFlowInto(kind, nx, y, nz) && !(isLiquid(World.getBlock(nx,y,nz)) && liquidKind(World.getBlock(nx,y,nz)) !== kind)) return Infinity;
      const dd = this._distanceToHole(kind, x, y, z, dx, dz);
      if (dd < minDist) minDist = dd;
      return dd;
    });

    for (let i = 0; i < dirs.length; i++) {
      const [dx, dz] = dirs[i];
      // если есть достижимая дыра — растекаемся только в кратчайшие направления
      if (minDist !== Infinity && dist[i] !== minDist) continue;
      const nx = x + dx, nz = z + dz;
      const nb = World.getBlock(nx, y, nz);
      if (nb === BLOCK.AIR) {
        this.setFlow(kind, nx, y, nz, next);
      } else if (isLiquid(nb) && liquidKind(nb) !== kind) {
        // встретили другую жидкость — пометить для затвердевания
        this.touchAround(nx, y, nz);
      } else if (nb === flow && World.getLevel(nx, y, nz) < next) {
        World.setLevel(nx, y, nz, next);
        this.markChunk(nx, nz);
        this.touchAround(nx, y, nz);
      }
    }
  },

  step(kind, x, y, z) {
    const src = this.srcBlock(kind), flow = this.flowBlock(kind), maxL = this.maxLevel(kind);
    const here = World.getBlock(x, y, z);

    // пустая ячейка — может заполниться от питания
    if (here === BLOCK.AIR) {
      const d = this.desiredLevel(kind, x, y, z);
      if (d.level > 0) this.setFlow(kind, x, y, z, d.level);
      return;
    }

    // лава, соприкоснувшаяся с водой сбоку/сверху — затвердевает (вода пришла к лаве):
    // источник + вода -> ОБСИДИАН, течение + вода -> БУЛЫЖНИК (как в MC)
    if (kind === 'lava' && this.contactSolidify(x, y, z)) return;

    // лава поджигает горючие блоки рядом (как в Minecraft): иногда зажигает воздух
    // у горючих блоков в радиусе 1-2 клеток вокруг лавы.
    if (kind === 'lava' && this._flammableNear(x, y, z)) {
      if (Math.random() < 0.5) this._igniteNear(x, y, z);
      // держим клетку лавы «активной» С ИНТЕРВАЛОМ (random tick, как в MC),
      // чтобы деревянные постройки у лавового океана не тикали каждый кадр
      if (Math.random() < 0.25) this.enqueue(x, y, z);
    }

    // лава над водой: если ПОД лавой вода — лава стекает в воду и застывает КАМНЁМ
    // (в MC лава, втекающая в воду, даёт камень; источник при этом — обсидиан)
    if (kind === 'lava' && (here === src || here === flow)) {
      const below = World.getBlock(x, y - 1, z);
      if (isWaterLiquid(below)) {
        World.clearLevel(x, y, z);
        World.setBlock(x, y, z, (here === BLOCK.LAVA) ? BLOCK.OBSIDIAN : BLOCK.STONE);
        this.markChunk(x, z); this.touchAround(x, y, z);
        playSound('splash');
        return;
      }
    }

    // вода, льющаяся НА лаву сверху, превращает лаву под собой (вода приходит к лаве):
    // источник лавы -> ОБСИДИАН, течение лавы -> БУЛЫЖНИК (как в MC)
    if (kind === 'water' && (here === src || here === flow)) {
      const below = World.getBlock(x, y - 1, z);
      if (below === BLOCK.LAVA) { World.clearLevel(x, y-1, z); World.setBlock(x, y-1, z, BLOCK.OBSIDIAN); this.markChunk(x,z); this.touchAround(x,y-1,z); playSound('splash'); }
      else if (below === BLOCK.LAVA_FLOW) { World.clearLevel(x, y-1, z); World.setBlock(x, y-1, z, BLOCK.COBBLESTONE); this.markChunk(x,z); this.touchAround(x,y-1,z); playSound('splash'); }
    }

    // источник: льёт вниз и растекается вбок
    if (here === src) {
      if (World.getBlock(x, y - 1, z) === BLOCK.AIR) this.setFlow(kind, x, y - 1, z, maxL - 1);
      else this.spreadSides(kind, x, y, z, maxL);
      return;
    }

    // течение
    if (here === flow) {
      // попытка стать бесконечным источником (только вода)
      if (kind === 'water' && this.tryFormInfiniteSource(x, y, z)) return;
      const d = this.desiredLevel(kind, x, y, z);
      if (d.level <= 0) { this.setFlow(kind, x, y, z, 0); return; } // нет питания -> исчезает
      const cur = World.getLevel(x, y, z);
      if (d.level !== cur) {
        World.setLevel(x, y, z, d.level);
        this.markChunk(x, z);
        this.touchAround(x, y, z);
      }
      // под ячейкой воздух -> падать вниз (приоритет)
      if (World.getBlock(x, y - 1, z) === BLOCK.AIR) { this.setFlow(kind, x, y - 1, z, maxL - 1); return; }
      // (убран прежний «if (d.falling) return» — вода, упавшая на землю,
      //  растекается на 7 блоков от точки падения, как в Minecraft)
      // если эта клетка — сток в ямку (под ней столб ещё течёт вниз), она уходит вниз
      // и НЕ разливается по сторонам -> вода не переливается за ямку
      if (this._canDrainDown(kind, x, y, z)) return;
      this.spreadSides(kind, x, y, z, d.level);
    }
  },

  update(dt) {
    // лава в Аду тикает в 3 раза быстрее (как в MC)
    this.lavaRate = (World.dim === 'nether') ? 0.5 : 1.5;
    // вода и лава тикают с разной частотой; собираем «созревшие» ячейки
    this.waterAcc += dt; this.lavaAcc += dt;
    const doWater = this.waterAcc >= this.waterRate;
    const doLava = this.lavaAcc >= this.lavaRate;
    if (!doWater && !doLava) return;
    if (doWater) this.waterAcc = 0;
    if (doLava) this.lavaAcc = 0;
    if (this.queue.length === 0) return;

    // переносим текущую очередь, обрабатываем подходящие по типу/частоте
    const pending = this.queue;
    this.queue = [];
    const deferred = [];
    let processed = 0;
    for (const k of pending) {
      this.inQueue.delete(k);
      if (processed >= this.MAX_PER_TICK) { deferred.push(k); continue; }
      const [x, y, z] = k.split(',').map(Number);
      const b = World.getBlock(x, y, z);
      let kind = liquidKind(b);
      if (kind === null) {
        // воздух у границы жидкости — определим тип по соседям
        const nbs = [World.getBlock(x+1,y,z),World.getBlock(x-1,y,z),World.getBlock(x,y,z+1),World.getBlock(x,y,z-1),World.getBlock(x,y+1,z)];
        for (const nb of nbs) { const kk = liquidKind(nb); if (kk) { kind = kk; break; } }
      }
      if (kind === null) continue;
      const ready = kind === 'water' ? doWater : doLava;
      if (!ready) { deferred.push(k); this.inQueue.add(k); continue; }
      this.step(kind, x, y, z);
      processed++;
    }
    // вернуть необработанные обратно в очередь
    for (const k of deferred) { if (!this.inQueue.has(k)) { this.inQueue.add(k); } this.queue.push(k); }

    if (this.changedChunks.size > 0) {
      for (const ck of this.changedChunks) { const [cx, cz] = ck.split(',').map(Number); World.markDirty(cx, cz); }
      this.changedChunks.clear();
    }
  },
};

// Обратная совместимость со старыми вызовами WaterSim/LavaSim.touchAround(...)
const WaterSim = { touchAround: (x,y,z)=>LiquidSim.touchAround(x,y,z), get queue(){return LiquidSim.queue;}, get inQueue(){return LiquidSim.inQueue;}, update:()=>{} };
const LavaSim  = { touchAround: (x,y,z)=>LiquidSim.touchAround(x,y,z), get queue(){return LiquidSim.queue;}, get inQueue(){return LiquidSim.inQueue;}, get changedChunks(){return LiquidSim.changedChunks;}, update:()=>{} };

