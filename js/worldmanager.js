/* ============================================================
   MiniCraft — worldmanager · Менеджер миров: создание/сохранение/загрузка
   (модуль 10 из 33; строки 4092–4463 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Менеджер миров (создание, сохранение, загрузка, сиды)
// ============================================================
const WorldManager = {
  current: null, // имя текущего мира
  cheatsEnabled: false, // читы текущего мира (false для старых/без-читов миров)
  rules: { legacyDurability: false }, // правила мира (задаются при создании, потом неизменны)
  LS_INDEX: 'minicraft_worlds',     // список миров
  LS_PREFIX: 'minicraft_world_',    // данные мира

  list() {
    try { return JSON.parse(localStorage.getItem(this.LS_INDEX) || '[]'); }
    catch (e) { return []; }
  },
  saveIndex(arr) {
    localStorage.setItem(this.LS_INDEX, JSON.stringify(arr));
  },

  // сбросить мир в памяти перед загрузкой/созданием нового
  resetState() {
    // удалить меши
    for (const [, mesh] of loadedMeshes) { scene.remove(mesh); disposeGroup(mesh); }
    loadedMeshes.clear();
    // очистить оба измерения
    World.dims.overworld = makeDimStore();
    World.dims.nether = makeDimStore();
    World.setDimension('overworld');
    World._lastChunk = null; // сброс мемо-чанка
    PLAYER.armor = { helmet: null, chestplate: null, leggings: null, boots: null };
    PLAYER.offhand = null;
    openFurnacePos = null;
    openChestPos = null;
    // полное состояние нового мира (фикс: раньше новый мир наследовал
    // время суток, точку возрождения и редстоун-состояние предыдущего)
    DAY.time = 0.30; DAY_LIGHT_UNIFORM.value = 1;
    PLAYER.spawnPoint = null;
    _dimReturn.overworld = null; _dimReturn.nether = null;
    if (typeof resetRedstoneState === 'function') resetRedstoneState();
    // очистить сущности (с освобождением геометрии — фикс утечки GPU-памяти)
    for (const d of drops) { scene.remove(d.mesh); disposeGroup(d.mesh); }
    drops.length = 0;
    for (const s of fallingSand) { scene.remove(s.mesh); disposeGroup(s.mesh); }
    fallingSand.length = 0;
    sandCheckQueue.length = 0; sandInQueue.clear();
    LiquidSim.queue.length = 0; LiquidSim.inQueue.clear(); LiquidSim.changedChunks.clear();
    FireSim.clear();
    leafDecay.length = 0; leafDecaySet.clear();
    for (const p of mobs) { scene.remove(p.mesh); disposeGroup(p.mesh); }
    mobs.length = 0;
    for (const b of boats) { scene.remove(b.mesh); disposeGroup(b.mesh); }
    boats.length = 0;
    if (particleGroup) { for (const pt of particles) { particleGroup.remove(pt.mesh); pt.mesh.geometry.dispose(); pt.mesh.material.dispose(); } particles.length = 0; }
    PLAYER.riding = null;
    PLAYER.dead = false;
    PLAYER.burnTimer = 0; PLAYER.fallStart = undefined;
    PLAYER.flying = false;
    window.__creative = false; // креатив сбрасывается при смене мира
    this.rules = { legacyDurability: false }; // правила сбрасываются (зададутся при создании/загрузке)
    document.getElementById('deathScreen').classList.remove('on');
    mobSpawnTimer = 4;
    if (typeof hostileSpawnTimer === 'number') hostileSpawnTimer = 2; // новый мир — монстры не наследуют таймер
    // инвентарь / крафт
    for (let i = 0; i < TOTAL_SLOTS; i++) slots[i] = null;
    for (let i = 0; i < craftSlots.length; i++) craftSlots[i] = null;
    cursorItem = null; craftResult = null;
    discovered = new Set();
    activeSlot = 0;
    PLAYER.vel.set(0, 0, 0);
    PLAYER.oxygen = PLAYER.maxOxygen;
    PLAYER.hp = PLAYER.maxHp;
    PLAYER.hunger = PLAYER.maxHunger;
    PLAYER.exhaustion = 0;
  },

  // создать новый мир
  create(name, seedStr, cheatsEnabled, rules, creative) {
    name = (name || '').trim() || ('Мир ' + (this.list().length + 1));
    const seed = parseSeed(seedStr);
    this.resetState();
    WORLD_SEED = seed;
    // пул воркеров генерации — под сид нового мира (генерация в отдельном потоке)
    WorldGenPool.setDim('overworld');
    WorldGenPool.init();
    this.current = name;
    this.cheatsEnabled = !!cheatsEnabled; // читы для нового мира
    // правила мира: только при создании, дальше неизменны
    this.rules = { legacyDurability: !!(rules && rules.legacyDurability) };
    // режим игры: креатив с создания мира (как в MC — креатив включает читы)
    setGameMode(!!creative, false);
    spawnPlayer();
    renderHotbar();

    const arr = this.list().filter(w => w.name !== name);
    arr.push({ name, seed, updated: Date.now() });
    this.saveIndex(arr);
    this.save(); // первичное сохранение
    startWorldLoading();
  },

  // сохранить текущий мир в localStorage
  // сериализовать состояние одного измерения в компактный объект
  serializeDim(s) {
    return {
      edits: Array.from(s.edits.entries()).map(([k, v]) => k + ':' + v),
      doors: Array.from(s.doorState.entries()).map(([k, v]) => k + ':' + (v.open ? 1 : 0) + ':' + (v.hinge || 'right')),
      // печь: содержимое + прогресс горения/плавки (фикс: раньше прогресс терялся)
      furnaces: Array.from(s.furnaces.entries()).map(([k, f]) => ({
        k,
        input: f.input ? { id: f.input.id, count: f.input.count, ...(f.input.dur !== undefined ? { dur: f.input.dur } : {}) } : null,
        fuel:   f.fuel   ? { id: f.fuel.id,   count: f.fuel.count,   ...(f.fuel.dur   !== undefined ? { dur: f.fuel.dur } : {}) } : null,
        output: f.output ? { id: f.output.id, count: f.output.count, ...(f.output.dur !== undefined ? { dur: f.output.dur } : {}) } : null,
        burn: f.burn || 0, burnMax: f.burnMax || 0, cook: f.cook || 0,
      })),
      // сундук: содержимое с прочностью (фикс: раньше dur терялся — предметы чинились переносом)
      chests: Array.from(s.chests.entries()).map(([k, arr]) => ({ k, items: arr.map(x => x ? { id: x.id, count: x.count, ...(x.dur !== undefined ? { dur: x.dur } : {}) } : null) })),
      facing: Array.from(s.facing.entries()).map(([k, v]) => k + ':' + v),
      doubleChests: Array.from(s.doubleChests.entries()).map(([k, v]) => k + '>' + v),
      // уровни течений — сериализуются, иначе после загрузки вода растекается заново
      waterLevels: Array.from(s.waterLevel.entries()).map(([k, v]) => k + ':' + v),
      mobs: (s.entMobs || []).map(m => ({ t: m.type, x: m.x, y: m.y, z: m.z, yaw: m.yaw, hp: m.hp, sh: m.sheared?1:0 })),
      drops: (s.entDrops || []).map(d => ({ id: d.id, x: d.x, y: d.y, z: d.z, c: d.count || 1 })),
      boats: (s.entBoats || []).map(b => ({ x: b.x, y: b.y, z: b.z, yaw: b.yaw || 0 })),
      portals: (s.portals || []).map(p => p.x + ',' + p.y + ',' + p.z),
      levers: Array.from((s.levers || new Map()).entries()).map(([k, v]) => k + ':' + (v.on ? 1 : 0) + ':' + (v.facing === undefined ? -1 : v.facing)),
      buttons: Array.from((s.buttons || new Map()).entries()).map(([k, v]) => k + ':' + (v.facing === undefined ? -1 : v.facing)),
      pistons: Array.from(s.pistons || []),
      // командные блоки: JSON (в команде могут быть любые символы — запятые, двоеточия)
      cmdBlocks: Array.from((s.cmdBlocks || new Map()).entries()).map(([k, v]) => JSON.stringify([k, v.cmd || '', v.always ? 1 : 0])),
    };
  },
  // восстановить состояние измерения из объекта
  deserializeDim(s, d) {
    if (!d) return;
    for (const e of (d.edits || [])) { const i = e.lastIndexOf(':'); s.edits.set(e.slice(0, i), parseInt(e.slice(i+1), 10)); }
    // индекс источников света (факелы и пр.) — для сквозного света между чанками
    if (s.lightEmitters) {
      s.lightEmitters.clear();
      for (const [k, id] of s.edits) { const em = lightEmission(id); if (em > 0) s.lightEmitters.set(k, em); }
    }
    for (const e of (d.doors || [])) { const p = e.split(':'); s.doorState.set(p[0], { open: p[1]==='1', hinge: p[2]==='left'?'left':'right' }); }
    for (const f of (d.furnaces || [])) {
      s.furnaces.set(f.k, {
        input: f.input ? { id: f.input.id, count: f.input.count, ...(f.input.dur !== undefined ? { dur: f.input.dur } : {}) } : null,
        fuel:   f.fuel   ? { id: f.fuel.id,   count: f.fuel.count,   ...(f.fuel.dur   !== undefined ? { dur: f.fuel.dur } : {}) } : null,
        output: f.output ? { id: f.output.id, count: f.output.count, ...(f.output.dur !== undefined ? { dur: f.output.dur } : {}) } : null,
        burn: f.burn || 0, burnMax: f.burnMax || 0, cook: f.cook || 0,
      });
    }
    for (const ch of (d.chests || [])) { const arr = new Array(CHEST_SIZE).fill(null); const it = ch.items||[]; for (let i=0;i<CHEST_SIZE;i++) arr[i] = it[i] ? { id: it[i].id, count: it[i].count, ...(it[i].dur !== undefined ? { dur: it[i].dur } : {}) } : null; s.chests.set(ch.k, arr); }
    for (const e of (d.doubleChests || [])) { const i = e.indexOf('>'); if (i>0) s.doubleChests.set(e.slice(0,i), e.slice(i+1)); }
    for (const e of (d.facing || [])) { const i = e.lastIndexOf(':'); s.facing.set(e.slice(0,i), parseInt(e.slice(i+1), 10)); }
    for (const e of (d.waterLevels || [])) { const i = e.lastIndexOf(':'); s.waterLevel.set(e.slice(0, i), parseInt(e.slice(i+1), 10)); }
    s.entMobs = (d.mobs || []).map(m => ({ type: m.t, x: m.x, y: m.y, z: m.z, yaw: m.yaw||0, hp: m.hp, sheared: !!m.sh }));
    s.entDrops = (d.drops || []).map(dr => ({ id: dr.id, x: dr.x, y: dr.y, z: dr.z, count: dr.c || 1 }));
    s.entBoats = (d.boats || []).map(b => ({ x: b.x, y: b.y, z: b.z, yaw: b.yaw || 0 }));
    s.portals = (d.portals || []).map(e => { const [x,y,z] = e.split(',').map(Number); return { x, y, z }; });
    // редстоун-состояние
    s.levers = new Map();
    for (const e of (d.levers || [])) { const p = e.split(':'); const on = p[1]==='1'; const facing = parseInt(p[2],10); s.levers.set(p[0], { on, facing: facing<0 ? undefined : facing }); }
    s.buttons = new Map();
    for (const e of (d.buttons || [])) { const p = e.split(':'); const facing = parseInt(p[1],10); s.buttons.set(p[0], { pressed: false, timer: 0, facing: facing<0 ? undefined : facing }); }
    s.pistons = new Set(d.pistons || []);
    // командные блоки
    if (s.cmdBlocks) {
      s.cmdBlocks.clear();
      for (const e of (d.cmdBlocks || [])) {
        try { const [k, cmd, always] = JSON.parse(e); s.cmdBlocks.set(k, { cmd: cmd || '', always: !!always }); } catch (err) {}
      }
    }
  },

  save() {
    if (!this.current) return false;
    captureDimEntities(); // снять текущих мобов/дропы активного измерения в стор
    const armorOut = {};
    for (const sl of ['helmet','chestplate','leggings','boots']) {
      const a = PLAYER.armor && PLAYER.armor[sl];
      armorOut[sl] = a ? { id: a.id, dur: a.dur } : null;
    }
    const data = {
      seed: WORLD_SEED,
      dim: World.dim,
      dimReturn: _dimReturn,
      cheatsEnabled: !!this.cheatsEnabled, // флаг читов для мира
      gameMode: window.__creative ? 'creative' : 'survival', // режим игры (восстанавливается при загрузке)
      rules: { legacyDurability: !!(this.rules && this.rules.legacyDurability) }, // правила мира (неизменны)
      player: {
        x: PLAYER.pos.x, y: PLAYER.pos.y, z: PLAYER.pos.z,
        yaw: PLAYER.yaw, pitch: PLAYER.pitch,
        oxygen: PLAYER.oxygen, hp: PLAYER.hp, hunger: PLAYER.hunger,
        spawn: PLAYER.spawnPoint || null,
      },
      dayTime: DAY.time,
      timeSinceRest: timeSinceRest, // бессонница (для спавна фантомов)
      armor: armorOut,
      offhand: PLAYER.offhand ? { id: PLAYER.offhand.id, count: PLAYER.offhand.count, dur: PLAYER.offhand.dur } : null,
      slots: slots.map(s => s ? { id: s.id, count: s.count, dur: s.dur } : null),
      // предметы в сетке крафта и на курсоре тоже сохраняем (фикс: раньше терялись при автосейве)
      craft: craftSlots.map(s => s ? { id: s.id, count: s.count, dur: s.dur } : null),
      cursor: cursorItem ? { id: cursorItem.id, count: cursorItem.count, dur: cursorItem.dur } : null,
      activeSlot,
      discovered: Array.from(discovered),
      // оба измерения
      overworld: this.serializeDim(World.dims.overworld),
      nether: this.serializeDim(World.dims.nether),
    };
    try {
      localStorage.setItem(this.LS_PREFIX + this.current, JSON.stringify(data));
      const arr = this.list();
      const w = arr.find(x => x.name === this.current);
      if (w) { w.updated = Date.now(); this.saveIndex(arr); }
      return true;
    } catch (e) {
      console.warn('Не удалось сохранить мир:', e);
      // квота localStorage (5 МБ) переполнена — сообщить игроку, а не молчать
      showToast('Не удалось сохранить: хранилище браузера переполнено!', 4000);
      return false;
    }
  },

  // загрузить мир по имени
  load(name) {
    let data;
    try { data = JSON.parse(localStorage.getItem(this.LS_PREFIX + name)); }
    catch (e) { data = null; }
    if (!data) { alert('Мир не найден или повреждён'); return; }

    this.resetState();
    WORLD_SEED = data.seed | 0;
    this.current = name;
    // пул воркеров генерации — под сид загружаемого мира
    WorldGenPool.setDim('overworld');
    WorldGenPool.init();
    // МИГРАЦИЯ: старые миры (без поля cheatsEnabled) — читы выключены (cheatsDisabled = true).
    // Новые миры явно хранят cheatsEnabled (true/false).
    this.cheatsEnabled = (data.cheatsEnabled === true);
    // МИГРАЦИЯ: старые миры без поля rules — правило выключено (ванильная прочность)
    this.rules = (data.rules && typeof data.rules === 'object')
      ? { legacyDurability: !!data.rules.legacyDurability }
      : { legacyDurability: false };
    // восстановить игровой режим (креатив/выживание); старые миры — выживание
    setGameMode(data.gameMode === 'creative', false);

    // восстановить оба измерения (со старой совместимостью: старый формат хранил поля прямо в data)
    if (data.overworld || data.nether) {
      this.deserializeDim(World.dims.overworld, data.overworld);
      this.deserializeDim(World.dims.nether, data.nether);
    } else {
      // старый сейв (одно измерение) -> overworld
      this.deserializeDim(World.dims.overworld, data);
    }
    if (data.dimReturn) { _dimReturn.overworld = data.dimReturn.overworld || null; _dimReturn.nether = data.dimReturn.nether || null; }
    World.setDimension(data.dim || 'overworld');
    WorldGenPool.setDim(World.dim); // воркеры генерируют для активного измерения

    // открытые рецепты (справочник)
    discovered = new Set((data.discovered || []).map(Number));
    // инвентарь
    if (Array.isArray(data.slots)) {
      for (let i = 0; i < TOTAL_SLOTS; i++) {
        const d = data.slots[i];
        slots[i] = d ? { id: d.id, count: d.count, ...(d.dur!==undefined?{dur:d.dur}:{}) } : null;
      }
    }
    // броня
    PLAYER.armor = { helmet: null, chestplate: null, leggings: null, boots: null };
    if (data.armor) {
      for (const sl of ['helmet','chestplate','leggings','boots']) {
        const a = data.armor[sl];
        if (a) PLAYER.armor[sl] = { id: a.id, ...(a.dur!==undefined?{dur:a.dur}:{}) };
      }
    }
    // вторая рука (offhand)
    PLAYER.offhand = null;
    if (data.offhand) PLAYER.offhand = { id: data.offhand.id, count: data.offhand.count, ...(data.offhand.dur!==undefined?{dur:data.offhand.dur}:{}) };
    activeSlot = data.activeSlot || 0;
    // восстановить сетку крафта и предмет на курсоре (сохраняются с версии фикса)
    if (Array.isArray(data.craft)) {
      for (let i = 0; i < craftSlots.length; i++) {
        const c = data.craft[i];
        craftSlots[i] = c ? { id: c.id, count: c.count, ...(c.dur !== undefined ? { dur: c.dur } : {}) } : null;
      }
    }
    if (data.cursor) cursorItem = { id: data.cursor.id, count: data.cursor.count, ...(data.cursor.dur !== undefined ? { dur: data.cursor.dur } : {}) };
    renderHotbar();

    // игрок
    const p = data.player || {};
    PLAYER.pos.set(p.x ?? 8, p.y ?? 50, p.z ?? 8);
    PLAYER.yaw = p.yaw || 0;
    PLAYER.pitch = p.pitch || 0;
    PLAYER.oxygen = p.oxygen ?? PLAYER.maxOxygen;
    // фикс: сейв, сделанный на экране смерти (hp=0), не должен воскрешать «полумёртвым»
    PLAYER.hp = (typeof p.hp === 'number' && p.hp > 0) ? p.hp : PLAYER.maxHp;
    PLAYER.hunger = p.hunger ?? PLAYER.maxHunger;
    PLAYER.exhaustion = 0;
    PLAYER.spawnPoint = p.spawn || null;
    PLAYER.dead = false;
    PLAYER.fallStart = undefined;

    // время суток
    DAY.time = (typeof data.dayTime === 'number') ? data.dayTime : 0.30;
    timeSinceRest = (typeof data.timeSinceRest === 'number') ? data.timeSinceRest : 0;
    DAY_LIGHT_UNIFORM.value = World.dim === 'overworld' ? skyFactor() : 1;

    // восстановить сущности текущего измерения
    restoreDimEntities();

    // пере-запустить воду и песок вокруг изменённых клеток текущего измерения
    for (const k of World.edits.keys()) {
      const [x, y, z] = k.split(',').map(Number);
      WaterSim.touchAround(x, y, z);
      checkSandAround(x, y, z);
    }

    // синхронизировать редстоун-сеть (рычаги восстановлены — пыль должна «загореться»)
    if (typeof markRedstoneDirty === 'function') {
      markRedstoneDirty(Math.floor(PLAYER.pos.x), Math.floor(PLAYER.pos.y), Math.floor(PLAYER.pos.z));
    }

    startWorldLoading();
  },

  delete(name) {
    localStorage.removeItem(this.LS_PREFIX + name);
    this.saveIndex(this.list().filter(w => w.name !== name));
    renderWorldList();
  },
};

// --- Сохранение/восстановление сущностей (мобы и выпавшие предметы) по измерениям ---
// Снять «живые» сущности активного измерения в его стор (компактные данные).
function captureDimEntities() {
  const s = World.dims[World.dim];
  if (!s) return;
  s.entMobs = mobs.map(m => ({
    type: m.type, x: m.pos.x, y: m.pos.y, z: m.pos.z,
    yaw: m.yaw, hp: m.hp, sheared: !!m.sheared,
  }));
  s.entDrops = drops.map(d => ({ id: d.id, x: d.pos.x, y: d.pos.y, z: d.pos.z, count: d.count || 1 }));
  s.entBoats = boats.map(b => ({ x: b.pos.x, y: b.pos.y, z: b.pos.z, yaw: b.yaw }));
  // сохранить состояние редстоуна (рычаги/кнопки/поршни) в стор измерения
  s.levers = leverStates;
  s.buttons = buttonStates;
  s.pistons = pistonExtendedSet;
}
// Восстановить сущности активного измерения из стора (и очистить снимок).
function restoreDimEntities() {
  // убрать текущие живые сущности из сцены (с освобождением геометрии)
  for (const m of mobs) { scene.remove(m.mesh); disposeGroup(m.mesh); } mobs.length = 0;
  for (const d of drops) { scene.remove(d.mesh); disposeGroup(d.mesh); } drops.length = 0;
  for (const b of boats) { scene.remove(b.mesh); disposeGroup(b.mesh); } boats.length = 0;
  const s = World.dims[World.dim];
  if (!s) return;
  for (const e of (s.entMobs || [])) {
    if (!MOB_TYPES[e.type]) continue;
    spawnMob(e.type, e.x, e.y, e.z);
    const m = mobs[mobs.length - 1];
    if (m) { m.yaw = e.yaw || 0; m.hp = e.hp ?? m.hp; m.sheared = !!e.sheared;
      if (m.sheared && m.mesh.userData.wool) m.mesh.userData.wool.scale.set(0.8,0.7,0.85); }
  }
  for (const e of (s.entDrops || [])) {
    spawnDrop(e.id, e.x, e.y, e.z, e.count || 1);
    const d = drops[drops.length - 1];
    if (d) { d.vel.set(0,0,0); d.pickDelay = 0; } // не подпрыгивать заново
  }
  for (const e of (s.entBoats || [])) {
    spawnBoat(e.x, e.y, e.z);
    const b = boats[boats.length - 1];
    if (b && e.yaw) b.yaw = e.yaw;
  }
  s.entMobs = []; s.entDrops = []; s.entBoats = [];
  // восстановить состояние редстоуна из стора в глобальные переменные
  leverStates = s.levers || new Map();
  buttonStates = s.buttons || new Map();
  pistonExtendedSet = s.pistons || new Set();
}

