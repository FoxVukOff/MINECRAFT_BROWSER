/* ============================================================
   MiniCraft — mobs · Мобы: модели, ИИ, спавн, фантомы, лодки
   (модуль 20 из 33; строки 7101–8359 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Мобы (свиньи, коровы): модель, ИИ, анимации, звуки
// ============================================================
const mobs = [];
const MAX_MOBS = 10;

// ============================================================
//  Лодки (прототип): плавают по воде, тонут если залить сверху, горят на лаве
// ============================================================
const boats = [];
let _boatMat = null;
function boatMaterial() {
  if (_boatMat) return _boatMat;
  _boatMat = mobTex(makeTex(ctx => {
    noiseFill(ctx, 0x9c6b35, 12);
    ctx.fillStyle = '#7a5326';
    for (let y=2;y<16;y+=4) ctx.fillRect(0,y,16,1);
  }));
  return _boatMat;
}
function buildBoatMesh() {
  const g = new THREE.Group();
  const mat = boatMaterial();
  const box = (w,h,d) => { const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat); if (SHADOWS_ON) m.castShadow=true; return m; };
  // дно
  const floor = box(1.2, 0.12, 1.6); floor.position.set(0, 0.06, 0); g.add(floor);
  // борта
  const sideL = box(0.12, 0.34, 1.6); sideL.position.set(-0.54, 0.22, 0); g.add(sideL);
  const sideR = box(0.12, 0.34, 1.6); sideR.position.set( 0.54, 0.22, 0); g.add(sideR);
  const front = box(1.2, 0.34, 0.12); front.position.set(0, 0.22, -0.74); g.add(front);
  const back  = box(1.2, 0.34, 0.12); back.position.set(0, 0.22, 0.74); g.add(back);
  return g;
}
function spawnBoat(x, y, z) {
  const mesh = buildBoatMesh();
  mesh.position.set(x, y, z);
  scene.add(mesh);
  boats.push({ mesh, pos: new THREE.Vector3(x,y,z), vel: new THREE.Vector3(0,0,0), yaw: PLAYER.yaw, rider: false, sink: 0 });
}
function nearestBoat(maxD) {
  let best=null, bd=maxD*maxD;
  for (const b of boats) {
    const dx=b.pos.x-PLAYER.pos.x, dy=b.pos.y-PLAYER.pos.y, dz=b.pos.z-PLAYER.pos.z;
    const d=dx*dx+dy*dy+dz*dz;
    if (d<bd){bd=d;best=b;}
  }
  return best;
}
function updateBoats(dt) {
  for (let i = boats.length - 1; i >= 0; i--) {
    const b = boats[i];
    const bx = Math.floor(b.pos.x), by = Math.floor(b.pos.y), bz = Math.floor(b.pos.z);
    const inLava = isLavaLiquid(World.getBlock(bx, by, bz)) || isLavaLiquid(World.getBlock(bx, Math.floor(b.pos.y+0.2), bz));
    // на лаве — сгорает
    if (inLava) {
      scene.remove(b.mesh); disposeGroup(b.mesh); boats.splice(i, 1);
      if (b.rider) { b.rider = false; PLAYER.riding = null; }
      playSound('break', BLOCK.WOOD);
      continue;
    }
    const blockHere = World.getBlock(bx, by, bz);
    const blockAbove = World.getBlock(bx, by + 1, bz);
    const onWater = isWaterLiquid(blockHere) || isWaterLiquid(World.getBlock(bx, by - 1, bz));
    const covered = isWaterLiquid(blockAbove); // воду налили сверху -> тонет (как в Minecraft)

    if (b.rider) {
      // управление: WASD относительно взгляда игрока
      b.yaw = PLAYER.yaw;
      const fwd = (keys['KeyW']?1:0) - (keys['KeyS']?1:0);
      const acc = 11; // быстрее разгон
      if (fwd !== 0) {
        b.vel.x += -Math.sin(b.yaw) * fwd * acc * dt;
        b.vel.z += -Math.cos(b.yaw) * fwd * acc * dt;
      }
      // поворот рулём A/D
      // (поворот следует за камерой через yaw)
    }
    // трение (чуть меньше, чтобы лодка дольше скользила и была быстрее)
    // FPS-независимое трение (раньше зависело от частоты кадров)
    const fr = Math.pow(0.92, dt * 60);
    b.vel.x *= fr; b.vel.z *= fr;
    const sp = Math.hypot(b.vel.x, b.vel.z);
    const MAXSP = 9; // выше максимальная скорость
    if (sp > MAXSP) { b.vel.x *= MAXSP/sp; b.vel.z *= MAXSP/sp; }

    // вертикаль: плавучесть на воде / гравитация в воздухе / погружение если залито
    const surfaceY = by + 0.86; // примерная поверхность блока воды
    if (covered) {
      // залито сверху — идёт ко дну
      b.sink += dt;
      b.vel.y -= GRAVITY * 0.3 * dt;
      if (b.vel.y < -4) b.vel.y = -4;
    } else if (onWater) {
      b.sink = 0;
      // мягко держим у поверхности
      const targetY = surfaceY;
      b.vel.y += (targetY - b.pos.y) * 6 * dt;
      b.vel.y *= Math.pow(0.8, dt * 60);
    } else {
      // в воздухе — падаем
      b.vel.y -= GRAVITY * dt;
      if (b.vel.y < -55) b.vel.y = -55;
    }

    // примитивная коллизия по осям (как у мобов, но проще)
    const tryMove = (axis, amt) => {
      b.pos[axis] += amt;
      const nbx = Math.floor(b.pos.x), nby = Math.floor(b.pos.y), nbz = Math.floor(b.pos.z);
      const solid = (X,Y,Z)=>{const bb=World.getBlock(X,Y,Z); return bb!==BLOCK.AIR && !isLiquid(bb) && bb!==BLOCK.FIRE;};
      if (solid(nbx, nby, nbz)) {
        b.pos[axis] -= amt;
        if (axis==='y' && amt<0) b.vel.y = 0;
        else b.vel[axis] = 0;
      }
    };
    tryMove('y', b.vel.y * dt);
    tryMove('x', b.vel.x * dt);
    tryMove('z', b.vel.z * dt);

    // если затонула слишком глубоко — ломается (роняет лодку-предмет)
    if (b.sink > 2.2 || b.pos.y < -8) {
      scene.remove(b.mesh); disposeGroup(b.mesh); boats.splice(i, 1);
      if (b.rider) { b.rider = false; PLAYER.riding = null; }
      spawnDrop(ITEM.BOAT, b.pos.x, b.pos.y + 0.3, b.pos.z);
      continue;
    }

    b.mesh.position.copy(b.pos);
    b.mesh.rotation.y = b.yaw;

    // везём игрока
    if (b.rider) {
      PLAYER.pos.x = b.pos.x; PLAYER.pos.z = b.pos.z;
      PLAYER.pos.y = b.pos.y + 0.3;
      PLAYER.vel.set(0,0,0);
    }
  }
}

// Материалы мобов (строятся лениво)
const MOB_MAT = {};
// материал для мобов — БЕЗ vertexColors (у box-геометрии нет цветов вершин)
function mobTex(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  return new THREE.MeshLambertMaterial({ map: t });
}
function buildMobMaterials() {
  // --- Свинья ---
  MOB_MAT.pig_body = mobTex(makeTex(ctx => {
    noiseFill(ctx, 0xeaa0a8, 8);
    ctx.fillStyle = '#d98a93';
    for (let i=0;i<6;i++) ctx.fillRect((Math.random()*14)|0,(Math.random()*14)|0,2,2);
  }));
  MOB_MAT.pig_snout = mobTex(makeTex(ctx => {
    noiseFill(ctx, 0xd07f88, 6);
    ctx.fillStyle = '#9c5a62'; ctx.fillRect(4,6,3,4); ctx.fillRect(9,6,3,4); // ноздри
  }));
  // --- Корова ---
  MOB_MAT.cow_body = mobTex(makeTex(ctx => {
    noiseFill(ctx, 0x4a3526, 6);             // тёмно-коричневая основа
    ctx.fillStyle = '#e8e2d8';               // белые пятна
    ctx.fillRect(2,3,5,5); ctx.fillRect(9,8,5,5); ctx.fillRect(7,2,3,3);
    ctx.fillStyle = '#3a2a1c';
    ctx.fillRect(11,4,3,3); ctx.fillRect(3,10,3,3);
  }));
  MOB_MAT.cow_head = mobTex(makeTex(ctx => {
    noiseFill(ctx, 0x4a3526, 6);
    ctx.fillStyle = '#e8e2d8'; ctx.fillRect(5,4,6,5); // белая морда
  }));
  MOB_MAT.cow_snout = mobTex(makeTex(ctx => {
    noiseFill(ctx, 0xb98a8a, 6);
    ctx.fillStyle = '#7a5050'; ctx.fillRect(4,7,3,3); ctx.fillRect(9,7,3,3);
  }));
  MOB_MAT.horn = mobTex(makeTex(ctx => noiseFill(ctx, 0xe8e2cf, 6)));
  // --- Курица ---
  MOB_MAT.chicken_body = mobTex(makeTex(ctx => {
    noiseFill(ctx, 0xf2f2f2, 6);             // белые перья
    ctx.fillStyle = '#dcdcdc';
    for (let i=0;i<5;i++) ctx.fillRect((Math.random()*14)|0,(Math.random()*14)|0,2,1);
  }));
  MOB_MAT.chicken_beak = mobTex(makeTex(ctx => noiseFill(ctx, 0xe8a83a, 4))); // оранжевый клюв/лапы
  MOB_MAT.chicken_comb = mobTex(makeTex(ctx => noiseFill(ctx, 0xc83a2a, 4))); // красный гребень
  // --- Зомбифицированный пиглин ---
  MOB_MAT.piglin_skin = mobTex(makeTex(ctx => {        // зеленовато-розовая зомби-кожа
    noiseFill(ctx, 0x6a8a5a, 8);
    ctx.fillStyle = '#7a5a6a'; for (let i=0;i<6;i++) ctx.fillRect((Math.random()*14)|0,(Math.random()*14)|0,2,2);
  }));
  MOB_MAT.piglin_snout = mobTex(makeTex(ctx => {       // характерный нос-пятак
    noiseFill(ctx, 0xc88a98, 6);
    ctx.fillStyle = '#7a4a58'; ctx.fillRect(4,7,3,3); ctx.fillRect(9,7,3,3);
  }));
  MOB_MAT.piglin_cloth = mobTex(makeTex(ctx => noiseFill(ctx, 0x8a6a2a, 6))); // золотистая одежда/штаны
  // --- Овца ---
  MOB_MAT.sheep_wool = mobTex(makeTex(ctx => {               // пушистая шерсть
    pixelFill(ctx, ['#e9e9ec','#dedee2','#f2f2f4','#d2d2d6'], [5,4,3,2], 3333);
    ctx.fillStyle = '#c8c8cd';
    for (let i=0;i<6;i++) ctx.fillRect((Math.random()*14)|0,(Math.random()*14)|0,2,1);
  }));
  MOB_MAT.sheep_skin = mobTex(makeTex(ctx => {               // голая кожа (морда/ноги)
    noiseFill(ctx, 0xd8c2b0, 6);
    ctx.fillStyle = '#c0a890'; ctx.fillRect(4,7,3,3); ctx.fillRect(9,7,3,3);
  }));
  // --- Рыба ---
  MOB_MAT.fish_body = mobTex(makeTex(ctx => {
    noiseFill(ctx, 0x6a93a8, 6);
    ctx.fillStyle = '#9bbccf'; ctx.fillRect(0,6,16,4);     // светлое брюшко-полоса
    ctx.fillStyle = '#4f7286'; for (let i=0;i<5;i++) ctx.fillRect((Math.random()*14)|0,(Math.random()*6)|0,2,1);
  }));
  // --- Зомби ---
  MOB_MAT.zombie_skin = mobTex(makeTex(ctx => {            // гниловато-зелёная кожа
    noiseFill(ctx, 0x5a8a4a, 9);
    ctx.fillStyle = '#446a38'; for (let i=0;i<7;i++) ctx.fillRect((Math.random()*14)|0,(Math.random()*14)|0,2,2);
    ctx.fillStyle = '#6fa05c'; ctx.fillRect(2,2,3,2); ctx.fillRect(10,9,3,2);
  }));
  MOB_MAT.zombie_cloth = mobTex(makeTex(ctx => {           // ветхая синяя роба (рубаха+штаны как в MC)
    noiseFill(ctx, 0x3a5a8a, 7);
    ctx.fillStyle = '#2c4468'; for (let i=0;i<5;i++) ctx.fillRect((Math.random()*14)|0,(Math.random()*14)|0,2,2);
    ctx.fillStyle = '#486aa0'; ctx.fillRect(3,3,4,3); ctx.fillRect(9,10,4,3);
  }));
  // --- Фантом ---
  MOB_MAT.phantom_body = mobTex(makeTex(ctx => {          // тёмная сине-бирюзовая мембрана
    pixelFill(ctx, ['#3d5860','#354e56','#46636b','#2e454c'], [5,4,3,2], 4747);
    ctx.fillStyle = '#52717a';                              // светлые разводы по кромке
    for (const [gx,gy] of [[1,1],[7,2],[12,4],[4,7],[10,9],[2,12],[13,12]]) ctx.fillRect(gx,gy,2,1);
    ctx.fillStyle = '#243a40';                              // тёмные пятна-полосы
    for (const [gx,gy,w,h] of [[3,3,2,3],[9,5,2,3],[5,11,3,2],[12,1,2,2]]) ctx.fillRect(gx,gy,w,h);
  }));
  MOB_MAT.phantom_wing = mobTex(makeTex(ctx => {          // крылья: мембрана с прожилками
    pixelFill(ctx, ['#4a6a72','#42626a','#547580','#3a565e'], [5,4,3,2], 4748);
    ctx.strokeStyle = '#2c454c';
    for (const y of [4, 8, 12]) {                           // прожилки-рёбра
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(15, y - 2); ctx.stroke();
    }
    ctx.fillStyle = '#5d7f88';
    for (const [gx,gy] of [[2,2],[8,6],[13,10],[4,13]]) ctx.fillRect(gx,gy,2,1);
  }));
  // --- Паук ---
  MOB_MAT.spider_body = mobTex(makeTex(ctx => {          // тёмно-бурый мохнатый хитин
    noiseFill(ctx, 0x35281e, 9);
    ctx.fillStyle = '#241a12'; for (let i=0;i<8;i++) ctx.fillRect((Math.random()*14)|0,(Math.random()*14)|0,2,2);
    ctx.fillStyle = '#4a382a'; ctx.fillRect(2,2,3,2); ctx.fillRect(10,9,3,2); ctx.fillRect(6,12,2,2);
    ctx.fillStyle = '#171008'; ctx.fillRect(9,3,2,2); ctx.fillRect(4,10,2,2);
  }));
  MOB_MAT.spider_leg = mobTex(makeTex(ctx => noiseFill(ctx, 0x2b2018, 8))); // почти чёрные ноги-суставы
}

const EYE_MAT = () => new THREE.MeshBasicMaterial({ color: 0x1a1a1a });

// Определения видов мобов
const MOB_TYPES = {
  pig: {
    spawnOn: BLOCK.GRASS, drop: ITEM.PORK_RAW, dropCount: () => 1 + (Math.random()*2|0),
    idleSound: 'oink', hurtSound: 'oink_hurt',
    build() {
      const g = new THREE.Group();
      const box = (w,h,d,mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat||MOB_MAT.pig_body); if (SHADOWS_ON) m.castShadow=true; return m; };
      const body = box(0.9, 0.7, 1.3); body.position.set(0, 0.65, 0); g.add(body);
      const head = new THREE.Group();
      head.add(box(0.62, 0.6, 0.55));
      const snout = box(0.34, 0.28, 0.18, MOB_MAT.pig_snout); snout.position.set(0,-0.05,0.36); head.add(snout);
      const eL = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,0.02), EYE_MAT()); eL.position.set(-0.18,0.1,0.28); head.add(eL);
      const eR = eL.clone(); eR.position.x = 0.18; head.add(eR);
      head.position.set(0, 0.78, 0.78); g.add(head); g.userData.head = head;
      const legs = []; const lp = [[-0.28,0.45],[0.28,0.45],[-0.28,-0.45],[0.28,-0.45]];
      for (const [lx,lz] of lp) { const leg = box(0.26,0.55,0.26); leg.geometry.translate(0,-0.275,0); leg.position.set(lx,0.55,lz); g.add(leg); legs.push(leg); }
      g.userData.legs = legs;
      return g;
    },
    width: 0.9, height: 0.95, hp: 10,
  },
  cow: {
    spawnOn: BLOCK.GRASS, drop: ITEM.BEEF_RAW, dropCount: () => 1 + (Math.random()*2|0),
    idleSound: 'moo', hurtSound: 'moo_hurt',
    build() {
      const g = new THREE.Group();
      const box = (w,h,d,mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat||MOB_MAT.cow_body); if (SHADOWS_ON) m.castShadow=true; return m; };
      const body = box(1.0, 0.8, 1.5); body.position.set(0, 0.78, 0); g.add(body);
      const head = new THREE.Group();
      head.add(box(0.6, 0.6, 0.55, MOB_MAT.cow_head));
      const snout = box(0.4, 0.32, 0.16, MOB_MAT.cow_snout); snout.position.set(0,-0.08,0.34); head.add(snout);
      const eL = new THREE.Mesh(new THREE.BoxGeometry(0.09,0.09,0.02), EYE_MAT()); eL.position.set(-0.18,0.12,0.28); head.add(eL);
      const eR = eL.clone(); eR.position.x = 0.18; head.add(eR);
      // рожки
      const hL = box(0.08,0.16,0.08, MOB_MAT.horn); hL.position.set(-0.2,0.35,0.05); head.add(hL);
      const hR = hL.clone(); hR.position.x = 0.2; head.add(hR);
      head.position.set(0, 0.92, 0.92); g.add(head); g.userData.head = head;
      const legs = []; const lp = [[-0.32,0.52],[0.32,0.52],[-0.32,-0.52],[0.32,-0.52]];
      for (const [lx,lz] of lp) { const leg = box(0.28,0.7,0.28); leg.geometry.translate(0,-0.35,0); leg.position.set(lx,0.7,lz); g.add(leg); legs.push(leg); }
      g.userData.legs = legs;
      return g;
    },
    width: 1.0, height: 1.2, hp: 10,
  },
  chicken: {
    spawnOn: BLOCK.GRASS, drop: ITEM.CHICKEN_RAW, dropCount: () => 1 + (Math.random()*2|0),
    idleSound: 'cluck', hurtSound: 'cluck_hurt',
    build() {
      const g = new THREE.Group();
      const box = (w,h,d,mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat||MOB_MAT.chicken_body); if (SHADOWS_ON) m.castShadow=true; return m; };
      const body = box(0.42, 0.4, 0.5); body.position.set(0, 0.45, 0); g.add(body);
      const head = new THREE.Group();
      head.add(box(0.3, 0.3, 0.3));
      // гребень
      const comb = box(0.1, 0.12, 0.18, MOB_MAT.chicken_comb); comb.position.set(0, 0.2, 0); head.add(comb);
      // клюв
      const beak = box(0.12, 0.1, 0.14, MOB_MAT.chicken_beak); beak.position.set(0, -0.02, 0.2); head.add(beak);
      const eL = new THREE.Mesh(new THREE.BoxGeometry(0.06,0.06,0.02), EYE_MAT()); eL.position.set(-0.1,0.04,0.14); head.add(eL);
      const eR = eL.clone(); eR.position.x = 0.1; head.add(eR);
      head.position.set(0, 0.72, 0.2); g.add(head); g.userData.head = head;
      // крылья (для лёгкой анимации можно как ноги)
      const legs = []; const lp = [[-0.12,0.05],[0.12,0.05]];
      for (const [lx,lz] of lp) { const leg = box(0.1,0.28,0.1, MOB_MAT.chicken_beak); leg.geometry.translate(0,-0.14,0); leg.position.set(lx,0.3,lz); g.add(leg); legs.push(leg); }
      g.userData.legs = legs;
      return g;
    },
    width: 0.5, height: 0.7, hp: 4,
  },
  sheep: {
    spawnOn: BLOCK.GRASS, drop: ITEM.MUTTON_RAW, dropCount: () => 1 + (Math.random()*2|0),
    idleSound: 'moo', hurtSound: 'moo_hurt',  // используем мычание (мягкое) как блеяние
    woolDrop: true,                            // даёт шерсть (при стрижке/смерти)
    build() {
      const g = new THREE.Group();
      const box = (w,h,d,mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat||MOB_MAT.sheep_wool); if (SHADOWS_ON) m.castShadow=true; return m; };
      // пушистое тело (шерсть)
      const body = box(0.95, 0.85, 1.35); body.position.set(0, 0.72, 0); g.add(body); g.userData.wool = body;
      // голова — голая кожа
      const head = new THREE.Group();
      head.add(box(0.5, 0.5, 0.5, MOB_MAT.sheep_skin));
      const eL = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,0.02), EYE_MAT()); eL.position.set(-0.14,0.06,0.24); head.add(eL);
      const eR = eL.clone(); eR.position.x = 0.14; head.add(eR);
      head.position.set(0, 0.82, 0.82); g.add(head); g.userData.head = head;
      const legs = []; const lp = [[-0.28,0.45],[0.28,0.45],[-0.28,-0.45],[0.28,-0.45]];
      for (const [lx,lz] of lp) { const leg = box(0.24,0.5,0.24, MOB_MAT.sheep_skin); leg.geometry.translate(0,-0.25,0); leg.position.set(lx,0.5,lz); g.add(leg); legs.push(leg); }
      g.userData.legs = legs;
      return g;
    },
    width: 0.95, height: 1.05, hp: 8,
  },
  piglin: {
    spawnOn: BLOCK.NETHERRACK, drop: ITEM.PORK_RAW, dropCount: () => 1 + (Math.random()*2|0),
    idleSound: 'oink', hurtSound: 'oink_hurt',
    hostile: true,      // может атаковать игрока (после агра)
    pack: true,         // вся стая агрится при ударе по одному
    pathfind: true,     // A*-навигация (в Аду обходят лаву и стены)
    name: 'зомби-пиглин',
    dmg: 3,
    build() {
      const g = new THREE.Group();
      const box = (w,h,d,mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat||MOB_MAT.piglin_skin); if (SHADOWS_ON) m.castShadow=true; return m; };
      // ноги
      const legs = []; const lp = [[-0.16,0],[0.16,0]];
      for (const [lx,lz] of lp) { const leg = box(0.26,0.7,0.26, MOB_MAT.piglin_cloth); leg.geometry.translate(0,-0.35,0); leg.position.set(lx,0.7,lz); g.add(leg); legs.push(leg); }
      g.userData.legs = legs;
      // тело
      const body = box(0.6, 0.75, 0.34, MOB_MAT.piglin_cloth); body.position.set(0, 1.05, 0); g.add(body);
      const torso = box(0.6, 0.3, 0.34); torso.position.set(0, 1.34, 0); g.add(torso);
      // руки
      const armL = box(0.2,0.7,0.2); armL.geometry.translate(0,-0.35,0); armL.position.set(-0.4,1.42,0); g.add(armL);
      const armR = armL.clone(); armR.position.x = 0.4; g.add(armR);
      g.userData.legs.push(armL, armR); // руки качаются вместе с ногами
      // голова
      const head = new THREE.Group();
      head.add(box(0.55,0.5,0.5));
      const snout = box(0.42,0.2,0.16, MOB_MAT.piglin_snout); snout.position.set(0,-0.08,0.3); head.add(snout);
      // уши
      const earL = box(0.1,0.18,0.06, MOB_MAT.piglin_snout); earL.position.set(-0.3,0.1,0); head.add(earL);
      const earR = earL.clone(); earR.position.x = 0.3; head.add(earR);
      const eL = new THREE.Mesh(new THREE.BoxGeometry(0.08,0.08,0.02), EYE_MAT()); eL.position.set(-0.14,0.06,0.26); head.add(eL);
      const eR = eL.clone(); eR.position.x = 0.14; head.add(eR);
      head.position.set(0, 1.75, 0); g.add(head); g.userData.head = head;
      return g;
    },
    width: 0.6, height: 2.0, hp: 16,
  },
  fish: {
    spawnOn: BLOCK.WATER, drop: ITEM.FISH_RAW, dropCount: () => 1 + (Math.random()*1|0),
    idleSound: 'splash', hurtSound: 'splash',
    aquatic: true,                              // живёт в воде, всплытие не нужно
    build() {
      const g = new THREE.Group();
      const box = (w,h,d,mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat||MOB_MAT.fish_body); if (SHADOWS_ON) m.castShadow=true; return m; };
      const body = box(0.55, 0.32, 0.22); body.position.set(0, 0.2, 0); g.add(body);
      const tail = box(0.18, 0.26, 0.05); tail.position.set(0, 0.2, -0.34); g.add(tail);
      g.userData.tail = tail;
      const eL = new THREE.Mesh(new THREE.BoxGeometry(0.05,0.05,0.02), EYE_MAT()); eL.position.set(-0.1,0.24,0.22); g.add(eL);
      const eR = eL.clone(); eR.position.x = 0.1; g.add(eR);
      g.userData.legs = [];
      return g;
    },
    width: 0.5, height: 0.4, hp: 3,
  },
  zombie: {
    drop: ITEM.ROTTEN_FLESH, dropCount: () => (Math.random()*3|0), // 0-2 гнилой плоти (как в MC)
    idleSound: 'zombie', hurtSound: 'zombie_hurt',
    hostile: true,        // враждебен: преследует и атакует игрока
    burnsInSun: true,     // горит на солнце (MC-парити)
    pathfind: true,       // A*-навигация в обход препятствий (не застревает)
    name: 'зомби',        // имя для сообщения о смерти
    dmg: 3,               // урон по игроку (ваниль normal)
    chaseSpeed: 2.7,      // медленнее игрока — можно убежать (MC-парити)
    build() {
      const g = new THREE.Group();
      const box = (w,h,d,mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat||MOB_MAT.zombie_skin); if (SHADOWS_ON) m.castShadow=true; return m; };
      // ноги (в синих штанах)
      const legs = []; const lp = [[-0.13,0],[0.13,0]];
      for (const [lx,lz] of lp) { const leg = box(0.24,0.75,0.24, MOB_MAT.zombie_cloth); leg.geometry.translate(0,-0.375,0); leg.position.set(lx,0.75,lz); g.add(leg); legs.push(leg); }
      g.userData.legs = legs;
      // тело (синяя рубаха)
      const body = box(0.55, 0.7, 0.3, MOB_MAT.zombie_cloth); body.position.set(0, 1.1, 0); g.add(body);
      // РУКИ ВПЕРЁД — классическая поза зомби (не качаются с ногами)
      const arms = [];
      for (const side of [-1, 1]) {
        const arm = box(0.2,0.65,0.2); arm.geometry.translate(0,-0.325,0);
        arm.position.set(side*0.38, 1.38, 0.1);
        arm.rotation.x = -Math.PI/2;          // вытянуты вперёд
        g.add(arm); arms.push(arm);
      }
      g.userData.arms = arms;
      // голова (зелёная, пустые чёрные глаза)
      const head = new THREE.Group();
      head.add(box(0.5,0.5,0.5));
      const eL = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.08,0.02), EYE_MAT()); eL.position.set(-0.13,0.05,0.26); head.add(eL);
      const eR = eL.clone(); eR.position.x = 0.13; head.add(eR);
      head.position.set(0, 1.7, 0); g.add(head); g.userData.head = head;
      return g;
    },
    width: 0.6, height: 1.9, hp: 20,
  },
  spider: {
    // Паук (parity MC): 16 HP, нейтрален при свете >= 12 (днём на поверхности —
    // мирный, если его не трогать), в темноте — враждебен. НЕ горит на солнце.
    // ЛЕЗЕТ ПО СТЕНАМ (climbing) и делает прыжки-атаки с разбега (leap).
    drop: ITEM.STRING, dropCount: () => (Math.random()*3|0), // 0-2 нити (как в MC)
    idleSound: 'spider', hurtSound: 'spider_hurt',
    hostile: true,        // враждебен (в темноте или если ударить)
    pathfind: true,       // A*-навигация
    climbs: true,         // лазает по стенам — фирменная способность MC-паука
    leaps: true,          // прыжок-атака с разбега (~3 блока)
    name: 'паук',
    dmg: 2,               // урон (Normal, как в MC)
    chaseSpeed: 3.5,      // пауки заметно быстрее зомби
    build() {
      const g = new THREE.Group();
      const box = (w,h,d,mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat||MOB_MAT.spider_body); if (SHADOWS_ON) m.castShadow=true; return m; };
      // головогрудь (перед) — отдельный сегмент, приподнят
      const head = box(0.5, 0.4, 0.45); head.position.set(0, 0.48, 0.45); g.add(head);
      // брюшко (зад) — большое, мохнатое, ЧЁТКО отделено от головогруди
      const abd = box(0.82, 0.56, 0.85); abd.position.set(0, 0.5, -0.42); g.add(abd);
      // СВЕТЯЩИЕСЯ красные глаза (MeshBasic — видны в темноте, как в MC)
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xc02020 });
      const eL = new THREE.Mesh(new THREE.BoxGeometry(0.1,0.075,0.02), eyeMat); eL.position.set(-0.12,0.55,0.68); g.add(eL);
      const eR = eL.clone(); eR.position.x = 0.12; g.add(eR);
      const eL2 = new THREE.Mesh(new THREE.BoxGeometry(0.07,0.05,0.02), eyeMat); eL2.position.set(-0.21,0.5,0.66); g.add(eL2);
      const eR2 = eL2.clone(); eR2.position.x = 0.21; g.add(eR2);
      // «жвала» — две тёмные мандибулы спереди
      const fL = box(0.06, 0.1, 0.12, MOB_MAT.spider_leg); fL.position.set(-0.09, 0.4, 0.66); g.add(fL);
      const fR = fL.clone(); fR.position.x = 0.09; g.add(fR);
      // 8 ДВУХСЕГМЕНТНЫХ ног с «коленом» выше тела — фирменный силуэт MC-паука:
      // бедро уходит вверх-в сторону, голень спускается к земле
      const legs = [];
      const zPos = [0.40, 0.20, 0.0, -0.22];
      const UPPER = 0.5, TILT = 0.85, LOWER = 0.85, LOWER_TILT = 0.35;
      for (let s = -1; s <= 1; s += 2) {
        for (let i = 0; i < 4; i++) {
          const hip = new THREE.Group();
          hip.position.set(s * 0.26, 0.48, zPos[i]);
          hip.rotation.y = s * (0.6 - i * 0.4);   // веер: передние вперёд, задние назад
          // бедро (вверх-наружу, колено ВЫШЕ тела)
          const upper = box(0.07, UPPER, 0.07, MOB_MAT.spider_leg);
          upper.geometry.translate(0, UPPER / 2, 0);
          upper.rotation.z = -s * TILT;
          hip.add(upper);
          // голень (от колена вниз-наружу до земли)
          const lower = box(0.07, LOWER, 0.07, MOB_MAT.spider_leg);
          lower.geometry.translate(0, -LOWER / 2, 0);
          lower.position.set(s * Math.sin(TILT) * UPPER, Math.cos(TILT) * UPPER, 0);
          lower.rotation.z = s * LOWER_TILT;
          hip.add(lower);
          g.add(hip); legs.push(hip);
        }
      }
      g.userData.legs = legs;
      return g;
    },
    width: 1.4, height: 0.9, hp: 16,
  },
  phantom: {
    // Фантом (parity MC): летающий кошмар бессонницы — кружит над жертвой и
    // пикирует. Приходит группой, если игрок не спал 3 ночи (см. trySpawnPhantoms).
    drop: ITEM.PHANTOM_MEMBRANE, dropCount: () => (Math.random()*2|0), // 0-1 мембраны
    idleSound: 'phantom', hurtSound: 'phantom_hurt',
    hostile: true,        // враждебен
    flying: true,         // ЛЕТАЮЩИЙ: своя ИИ-логика (круги -> пике -> взлёт)
    burnsInSun: true,     // горит на солнце (как нежить, parity MC)
    name: 'фантом',
    dmg: 6,               // урон пике (Normal, как в MC)
    build() {
      const g = new THREE.Group();
      const box = (w,h,d,mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), mat||MOB_MAT.phantom_body); if (SHADOWS_ON) m.castShadow=true; return m; };
      // плоское широкое тело-«крыло» (длиннее — читаемый силуэт)
      const body = box(0.9, 0.14, 0.62); body.position.set(0, 0.25, 0); g.add(body);
      // блик-хребет сверху
      const crest = box(0.5, 0.05, 0.24, MOB_MAT.phantom_wing); crest.position.set(0, 0.34, 0.05); g.add(crest);
      // голова спереди + СВЕТЯЩИЕСЯ глаза (MeshBasic — видны в темноте)
      const head = new THREE.Group();
      head.add(box(0.46, 0.32, 0.36));
      const eyeMat = new THREE.MeshBasicMaterial({ color: 0xd8f060 });
      const eL = new THREE.Mesh(new THREE.BoxGeometry(0.13,0.09,0.02), eyeMat); eL.position.set(-0.13,0.05,0.19); head.add(eL);
      const eR = eL.clone(); eR.position.x = 0.13; head.add(eR);
      // «зубы» пасти — светлая кромка снизу
      const jaw = box(0.3, 0.06, 0.06, MOB_MAT.phantom_wing); jaw.position.set(0,-0.14,0.14); head.add(jaw);
      head.position.set(0, 0.26, 0.38); g.add(head); g.userData.head = head;
      // крылья по бокам — ШИРОКИЕ (размах ~2 блока: главный маркер силуэта), машут по Z
      const wingL = box(0.5, 0.06, 0.42, MOB_MAT.phantom_wing);
      wingL.geometry.translate(-0.25, 0, 0); wingL.position.set(-0.45, 0.26, 0); g.add(wingL);
      const wingR = box(0.5, 0.06, 0.42, MOB_MAT.phantom_wing);
      wingR.geometry.translate(0.25, 0, 0); wingR.position.set(0.45, 0.26, 0); g.add(wingR);
      g.userData.wings = [wingL, wingR];
      // хвост из 3 сегментов — ДЛИННЫЙ с волной (шаг 0.36)
      const tail = [];
      let tz = -0.31;
      const tsize = [[0.52,0.1],[0.4,0.08],[0.28,0.06]];
      for (let ti = 0; ti < 3; ti++) {
        const [tw,th] = tsize[ti];
        const seg = box(tw, th, 0.34);
        seg.geometry.translate(0, 0, -0.17);   // петля в передней кромке сегмента
        seg.position.set(0, 0.25, tz);
        g.add(seg); tail.push(seg);
        tz -= 0.38;
      }
      g.userData.tail = tail;
      return g;
    },
    width: 0.9, height: 0.55, hp: 20,
  },
};

function spawnMob(type, x, y, z) {
  if (!MOB_MAT.pig_body) buildMobMaterials();
  const def = MOB_TYPES[type];
  const mesh = def.build();
  mesh.position.set(x, y, z);
  scene.add(mesh);
  mobs.push({
    type, def, mesh, pos: new THREE.Vector3(x, y, z), vel: new THREE.Vector3(0,0,0),
    yaw: Math.random()*Math.PI*2, width: def.width, height: def.height,
    onGround: false, state: 'idle', stateT: 1+Math.random()*2,
    walkPhase: 0, hp: def.hp, hurtT: 0, idleT: 3+Math.random()*8, flee: 0,
    aggro: 0,           // >0 — преследует игрока (агрессивен)
    attackCd: 0,        // кулдаун атаки
    sheared: false,     // острижена ли овца (нет шерсти)
    landTimer: 0,       // для рыбы — таймер удушья на суше
    ...(def.flying ? {  // летающим (фантом) — состояние полёта
      flyState: 'circle', orbitA: Math.random()*Math.PI*2,
      orbitDir: Math.random() < 0.5 ? 1 : -1, swoopT: 3+Math.random()*4,
      sunCheckT: 0, sunExposed: false,
    } : {}),
  });
}

// спавн мобов рядом с игроком на траве
let mobSpawnTimer = 4;          // цикл животных (медленный)
let hostileSpawnTimer = 1.5;    // цикл монстров (свой, частый — как в MC)
// Общий кап монстров = ванильный mobcap Minecraft (70). Искусственное
// занижение (макс. 2 зомби, шанс 22%) убрано — плотность задаёт сам алгоритм MC.
const MAX_HOSTILES = 70;
function zombieCount() { let n = 0; for (const m of mobs) if (m.type === 'zombie') n++; return n; }
// монстры: зомби + пауки (верхний мир) + зомби-пиглины (Ад); фантомы — отдельный кап
function hostileCount() { let n = 0; for (const m of mobs) if (m.type === 'zombie' || m.type === 'piglin' || m.type === 'spider') n++; return n; }
// мирные животные (без зомби/пауков/пиглинов/фантомов)
function passiveCount() {
  let n = 0;
  for (const m of mobs) if (m.type !== 'zombie' && m.type !== 'piglin' && m.type !== 'phantom' && m.type !== 'spider') n++;
  return n;
}

// Паук враждебен только в темноте (parity MC): эффективный свет
// max(блокСвет, небСвет·факторДня) >= 12 — паук НЕЙТРАЛЕН (днём на
// поверхности, у факелов/светокамня/лавы). Фикс «hostile днём у кровати»:
// раньше решал грубый hasSkyAccess (прямое небо) + только блок-свет,
// и под крышей/без сетки (bl = -1 < 12) паук ошибочно был враждебен.
// Теперь — честный расчёт через skyLightAt (свет сквозь листву/стекло)
// с фактором времени суток: ночь ~4, день 15 (как в MC).
function spiderAngryAtLight(p) {
  const x = Math.floor(p.pos.x), y = Math.floor(p.pos.y + 0.3), z = Math.floor(p.pos.z);
  const bl = blockLightAt(x, y, z);
  if (bl >= 12) return false;   // факелы/светокамень/лава >= 12 — паук спокоен
  const sl = (typeof skyLightAt === 'function') ? skyLightAt(x, y, z) : -1;
  if (bl < 0 || sl < 0) {
    // сетки света ещё нет (чанк не меширован) — грубая оценка по прямому небу
    return hasSkyAccess(x, y, z) ? daylight() < 0.5 : true;
  }
  const effSky = sl * (4 + daylight() * 11) / 15; // ночь ~4, день 15 (как в MC)
  return Math.max(bl, effSky) < 12;
}

// ============================================================
//  Спавн монстров — parity Minecraft (Java, 1.18+):
//  * зомби: НОЧЬЮ на поверхности И круглосуточно в тёмных пещерах;
//  * уровень БЛОКОВОГО света в точке спавна = 0 — факел/лава/светокамень
//    рядом исключают спавн (совр. MC «spawn in darkness»);
//  * дистанция от игрателя 24+ блоков (ближе MC не спавнит);
//  * pack spawn: пачка 1-4 особи рядом с лидером;
//  * общий кап 70 монстров, MC-деспавн: >32 блока — случайный, >128 — сразу;
//  * зомби-пиглины в Аду: пачки, на любой светлоте (как в MC).
// ============================================================
// годна ли позиция для монстра (воздух + опора + свет)
function hostileSpotOk(type, x, y, z, opts) {
  if (y < 1 || y > WORLD_HEIGHT - 3) return false;
  if (World.getBlock(x, y, z) !== BLOCK.AIR) return false;
  if (World.getBlock(x, y + 1, z) !== BLOCK.AIR) return false;
  if (!mobSolid(x, y - 1, z)) return false;             // опора — только твёрдый блок
  if (type === 'piglin' && World.getBlock(x, y - 1, z) !== BLOCK.NETHERRACK) return false;
  if (opts.light0) {
    // MC 1.18+: спавн только при свете блока 0 (-1 = сетки света нет — мимо,
    // чтобы возле факела в ещё не мешированном чанке не появился зомби)
    if (blockLightAt(x, y, z) !== 0) return false;
    // днём на открытой поверхности монстры не спавнятся — только под землёй
    if (!opts.night && hasSkyAccess(x, y, z)) return false;
  }
  return true;
}
// заспавнить пачку монстров вокруг позиции-лидера; true — если лидер создан
function spawnHostilePack(type, x, y, z, opts) {
  if (!hostileSpotOk(type, x, y, z, opts)) return false;
  spawnMob(type, x + 0.5, y, z + 0.5);
  // pack spawn MC: рядом с лидером до 4 особей (пиглины ходят пачками по 2-4)
  const want = (type === 'piglin' ? 2 + (Math.random() * 3 | 0) : 1 + (Math.random() * 4 | 0));
  for (let pk = 1; pk < want && hostileCount() < MAX_HOSTILES; pk++) {
    const ox = x + ((Math.random() * 5 | 0) - 2), oz = z + ((Math.random() * 5 | 0) - 2);
    for (let oy = y + 1; oy >= y - 1; oy--) {           // та же высота ± 1 блок
      if (hostileSpotOk(type, ox, oy, oz, opts)) { spawnMob(type, ox + 0.5, oy, oz + 0.5); break; }
    }
  }
  return true;
}
// Позиция-кандидат для попытки: случайная высота (пещеры — parity MC) ИЛИ
// поверхность колонки (сверху вниз — основная зона спавна). Одна попытка
// колонки = оба кандидата;大多数 попыток MC тоже отбраковывается.
// Одна попытка спавна: колонка в кольце 24..56 блоков (ближе 24 MC не спавнит,
// дальше 56 — за пределами прорисовки, зомби были бы невидимыми).
function hostileSpawnAttempt(type) {
  const night = daylight() < 0.25;
  // зомби и пауки спавнятся «в темноте» (свет блока 0, ночью — и на поверхности);
  // пиглины в Аду — на любой светлоте (как в MC)
  const opts = (type === 'piglin') ? { light0: false } : { light0: true, night };
  const maxDist = Math.max(32, Math.min(RENDER_DISTANCE * CHUNK_SIZE - 8, 56));
  const ang = Math.random() * Math.PI * 2;
  const dist = 24 + Math.random() * (maxDist - 24);
  const px = Math.floor(PLAYER.pos.x + Math.cos(ang) * dist);
  const pz = Math.floor(PLAYER.pos.z + Math.sin(ang) * dist);

  // кандидат 1: случайная высота по всей колонке (пещеры, как в MC)
  const py = 2 + (Math.random() * (WORLD_HEIGHT - 6) | 0);
  if (spawnHostilePack(type, px, py, pz, opts)) return true;

  // кандидат 2: верхняя «поверхность» колонки (первая валидная ячейка сверху)
  for (let y = WORLD_HEIGHT - 3; y > 1; y--) {
    if (hostileSpotOk(type, px, y, pz, opts)) return spawnHostilePack(type, px, y, pz, opts);
  }
  return false;
}
function trySpawnZombiePack() { return hostileSpawnAttempt('zombie'); }
function trySpawnPiglinPack() { return hostileSpawnAttempt('piglin'); }
function trySpawnSpiderPack() { return hostileSpawnAttempt('spider'); }

// ============================================================
//  ФАНТОМЫ (parity MC): кошмар бессонницы.
//  В MC фантомы прилетают ночью группой 1-4, если игрок не спал
//  3 полных игровых суток (72000 тиков); сон или смерть сбрасывают
//  счётчик. Днём не спавнятся и горят на солнце. Только верхний мир.
// ============================================================
let timeSinceRest = 0;            // игрового времени (сек) с последнего сна/смерти
const MAX_PHANTOMS = 5;           // отдельный кап летающих (как у зомби)
let phantomSpawnTimer = 20;
function phantomCount() { let n = 0; for (const m of mobs) if (m.type === 'phantom') n++; return n; }
function trySpawnPhantoms(dt) {
  if (World.dim !== 'overworld' || PLAYER.dead) return;
  // в креативе фантомы не приходят (parity MC — креативных игроков не таргетят)
  if (window.__creative) return;
  // только НОЧЬЮ и только после 3 суток без сна (4-я ночь — первая с фантомами)
  if (daylight() >= 0.25 || timeSinceRest < 3 * DAY.length) return;
  phantomSpawnTimer -= dt;
  if (phantomSpawnTimer > 0) return;
  phantomSpawnTimer = 24 + Math.random() * 20; // волны раз в ~25-45с
  if (phantomCount() >= MAX_PHANTOMS) return;
  // над игроком открытое небо (в пещере/под крышей бессонница не карается)
  const px = Math.floor(PLAYER.pos.x), pz = Math.floor(PLAYER.pos.z);
  for (let y = Math.floor(PLAYER.pos.y + 2); y < WORLD_HEIGHT; y++) {
    if (OPAQUE[World.getBlock(px, y, pz)]) return;
  }
  // кучка 1-4 высоко над игроком (в MC — 20-34 блока над опорой)
  const ang = Math.random() * Math.PI * 2;
  const dist = 10 + Math.random() * 8;
  const bx = PLAYER.pos.x + Math.cos(ang) * dist;
  const bz = PLAYER.pos.z + Math.sin(ang) * dist;
  const by = Math.min(WORLD_HEIGHT - 6, PLAYER.pos.y + 18 + Math.random() * 10);
  const pack = 1 + (Math.random() * 4 | 0);
  let spawned = 0;
  for (let i = 0; i < pack; i++) {
    const sx = Math.floor(bx + (Math.random() - 0.5) * 8);
    const sz = Math.floor(bz + (Math.random() - 0.5) * 8);
    const sy = Math.floor(by + (Math.random() - 0.5) * 6);
    if (sy < 1 || sy > WORLD_HEIGHT - 3) continue;
    if (World.getBlock(sx, sy, sz) !== BLOCK.AIR || World.getBlock(sx, sy + 1, sz) !== BLOCK.AIR) continue;
    spawnMob('phantom', sx + 0.5, sy + 0.2, sz + 0.5);
    spawned++;
  }
  if (spawned > 0) {
    showToast('Фантомы почуяли вашу бессонницу…');
    playSound('phantom');
  }
}
function trySpawnMobs(dt) {
  // --- Цикл монстров (свой таймер, как в MC у категории monster).
  // Каждые ~1.5-2.5с — одна колонка-кандидат; ночью большинство колонок
  // тёмные => пачка спавнится, за ночь область насыщается до капа (как в MC).
  // В верхнем мире зомби и пауки спавнятся 50/50 (в MC веса почти равны). ---
  hostileSpawnTimer -= dt;
  if (hostileSpawnTimer <= 0) {
    hostileSpawnTimer = 1.5 + Math.random();
    if (hostileCount() < MAX_HOSTILES) {
      const fn = (World.dim !== 'overworld') ? trySpawnPiglinPack
        : (Math.random() < 0.5 ? trySpawnZombiePack : trySpawnSpiderPack);
      fn();
    }
  }

  // --- Цикл животных (медленный; только верхний мир) ---
  mobSpawnTimer -= dt;
  if (mobSpawnTimer > 0) return;
  mobSpawnTimer = 10 + Math.random()*10;
  if (World.dim !== 'overworld') return;
  if (passiveCount() >= MAX_MOBS) return;
  const r = Math.random();
  // pig / chicken / cow / sheep / fish
  let type;
  if (r < 0.28) type = 'pig';
  else if (r < 0.50) type = 'chicken';
  else if (r < 0.70) type = 'cow';
  else if (r < 0.88) type = 'sheep';
  else type = 'fish';
  for (let tries = 0; tries < 8; tries++) {
    const ang = Math.random()*Math.PI*2;
    const dist = 12 + Math.random()*12;
    const px = Math.floor(PLAYER.pos.x + Math.cos(ang)*dist);
    const pz = Math.floor(PLAYER.pos.z + Math.sin(ang)*dist);
    if (type === 'fish') {
      // рыба спавнится в толще воды (вода сверху и снизу)
      for (let y = WORLD_HEIGHT-2; y > 1; y--) {
        const here = World.getBlock(px, y, pz);
        const below = World.getBlock(px, y-1, pz);
        if (isWaterLiquid(here) && isWaterLiquid(below)) {
          spawnMob(type, px + 0.5, y + 0.2, pz + 0.5);
          return;
        }
      }
      continue;
    }
    for (let y = WORLD_HEIGHT-2; y > 1; y--) {
      const below = World.getBlock(px, y-1, pz);
      const here = World.getBlock(px, y, pz);
      const above = World.getBlock(px, y+1, pz);
      if (below === MOB_TYPES[type].spawnOn && here === BLOCK.AIR && above === BLOCK.AIR) {
        // пачка 1-3 особей (как в MC — животные спавнятся группами)
        const pack = 1 + (Math.random()*3|0);
        spawnMob(type, px + 0.5, y, pz + 0.5);
        for (let pk = 1; pk < pack && passiveCount() < MAX_MOBS; pk++) {
          const ox = px + ((Math.random()*5|0) - 2), oz = pz + ((Math.random()*5|0) - 2);
          const oh = World.getBlock(ox, y, oz), ob = World.getBlock(ox, y - 1, oz), oa = World.getBlock(ox, y + 1, oz);
          if (ob === MOB_TYPES[type].spawnOn && oh === BLOCK.AIR && oa === BLOCK.AIR) spawnMob(type, ox + 0.5, y, oz + 0.5);
        }
        return;
      }
    }
  }
}

// твёрдый ли блок для моба
function mobSolid(x, y, z) {
  const b = World.getBlock(x, y, z);
  if (b === BLOCK.AIR || isLiquid(b)) return false;
  if (b === BLOCK.NETHER_PORTAL) return false;
  if (b === BLOCK.FIRE) return false; // огонь проходим и для мобов (нет хитбокса, как в MC)
  if (b === BLOCK.TORCH) return false;
  // тонкие редстоун-компоненты — мобы проходят сквозь них (как в MC)
  if (b === BLOCK.REDSTONE_DUST || b === BLOCK.REDSTONE_TORCH ||
      b === BLOCK.LEVER || b === BLOCK.BUTTON || b === BLOCK.PISTON_HEAD) return false;
  if (isDoor(b) && isDoorOpen(x, y, z)) return false;
  return true;
}

// коллизия AABB для моба по одной оси
function mobCollide(p, axis, amount) {
  const hw = p.width/2, h = p.height;
  const oldPos = p.pos[axis];        // позиция ДО сдвига (для отсева «старых» клеток)
  p.pos[axis] += amount;
  const minX = Math.floor(p.pos.x - hw), maxX = Math.floor(p.pos.x + hw);
  const minY = Math.floor(p.pos.y), maxY = Math.floor(p.pos.y + h);
  const minZ = Math.floor(p.pos.z - hw), maxZ = Math.floor(p.pos.z + hw);
  for (let x=minX;x<=maxX;x++) for (let y=minY;y<=maxY;y++) for (let z=minZ;z<=maxZ;z++) {
    if (!mobSolid(x,y,z)) continue;
    // ФИКС телепортов у широких мобов (паук 1.4): клетка, которую AABB
    // пересекал ЕЩЁ ДО сдвига по этой оси (упёрлись углом), — не наша
    // коллизия. Раньше такой «натянутый угол» выталкивал моба на целый
    // блок вбок (паука швыряло вдоль стены, срывая лазание).
    const oMin = axis === 'y' ? oldPos : oldPos - hw;
    const oMax = axis === 'y' ? oldPos + h : oldPos + hw;
    const cc = axis === 'x' ? x : (axis === 'y' ? y : z);
    const wasOverlap = (cc < oMax - 1e-4) && (cc + 1 > oMin + 1e-4);
    if (wasOverlap) continue;
    if (axis==='x'){ p.pos.x = amount>0 ? x-hw-1e-3 : x+1+hw+1e-3; p.vel.x=0; }
    else if (axis==='y'){ if(amount>0){p.pos.y=y-h-1e-3;p.vel.y=0;} else {p.pos.y=y+1+1e-3;p.vel.y=0;p.onGround=true;} }
    else { p.pos.z = amount>0 ? z-hw-1e-3 : z+1+hw+1e-3; p.vel.z=0; }
    return true;
  }
  return false;
}

// вертикальная коллизия с УЗКИМ хитбоксом (для лазания паука по стене):
// широкие бока (паук 1.4) обхватывают 1-блочную стену/башню, и обычная проверка
// ловила бы «удар головой» о каждый блок стены НАД собой, срывая подъём.
// Узкая центральная колонна (ширина × widthScale) — как в MC: паук прижимается
// к стене и скользит вверх, потолок ловится только по центру.
function mobCollideY(p, amount, widthScale) {
  const hw = p.width / 2 * (widthScale || 1), h = p.height;
  const oldPos = p.pos.y;
  p.pos.y += amount;
  const minX = Math.floor(p.pos.x - hw), maxX = Math.floor(p.pos.x + hw);
  const minY = Math.floor(p.pos.y), maxY = Math.floor(p.pos.y + h);
  const minZ = Math.floor(p.pos.z - hw), maxZ = Math.floor(p.pos.z + hw);
  for (let x = minX; x <= maxX; x++) for (let y = minY; y <= maxY; y++) for (let z = minZ; z <= maxZ; z++) {
    if (!mobSolid(x, y, z)) continue;
    const wasOverlap = (y < oldPos + h - 1e-4) && (y + 1 > oldPos + 1e-4);
    if (wasOverlap) continue;
    if (amount > 0) { p.pos.y = y - h - 1e-3; p.vel.y = 0; }
    else { p.pos.y = y + 1 + 1e-3; p.vel.y = 0; p.onGround = true; }
    return true;
  }
  return false;
}

function updateMobs(dt) {
  trySpawnMobs(dt);
  trySpawnPhantoms(dt);
  const pcx = Math.floor(PLAYER.pos.x / CHUNK_SIZE);
  const pcz = Math.floor(PLAYER.pos.z / CHUNK_SIZE);

  for (let i = mobs.length - 1; i >= 0; i--) {
    const p = mobs[i];

    // выгрузка слишком далёких мобов
    const dcx = Math.floor(p.pos.x / CHUNK_SIZE) - pcx;
    const dcz = Math.floor(p.pos.z / CHUNK_SIZE) - pcz;
    if (Math.abs(dcx) > RENDER_DISTANCE + 2 || Math.abs(dcz) > RENDER_DISTANCE + 2) {
      scene.remove(p.mesh); disposeGroup(p.mesh); mobs.splice(i, 1); continue;
    }

    // --- Деспавн монстров (parity MC): >128 блоков — мгновенно,
    // >32 блоков — случайный шанс (1/800 за тик ≈ 2.5%/сек), как в MC ---
    if (p.def.hostile) {
      const dd = Math.hypot(p.pos.x - PLAYER.pos.x, p.pos.z - PLAYER.pos.z);
      if (dd > 128 || (dd > 32 && Math.random() < dt * 20 / 800)) {
        scene.remove(p.mesh); disposeGroup(p.mesh); mobs.splice(i, 1); continue;
      }
    }

    // --- ИИ ---
    p.hurtT = Math.max(0, p.hurtT - dt);
    p.hurtResist = Math.max(0, (p.hurtResist || 0) - dt);
    p.attackCd = Math.max(0, (p.attackCd || 0) - dt);
    p.idleT -= dt;
    if (p.idleT <= 0) { p.idleT = 6 + Math.random()*10; if (dist2ToPlayer(p) < 26*26) playSound(p.def.idleSound); }

    // --- Рыба: отдельная «плавательная» логика ---
    if (p.def.aquatic) {
      const cx2 = Math.floor(p.pos.x), cy2 = Math.floor(p.pos.y + 0.1), cz2 = Math.floor(p.pos.z);
      const inWaterF = isWaterLiquid(World.getBlock(cx2, cy2, cz2));
      if (!inWaterF) {
        // на суше задыхается и бьётся; через время гибнет
        p.landTimer = (p.landTimer || 0) + dt;
        p.vel.y -= GRAVITY * dt;
        p.vel.x *= 0.8; p.vel.z *= 0.8;
        p.walkPhase += dt * 18;
        if (p.landTimer > 6 || p.pos.y < -8) {
          for (let k = 0; k < p.def.dropCount(); k++) spawnDrop(p.def.drop, p.pos.x, p.pos.y+0.2, p.pos.z);
          scene.remove(p.mesh); disposeGroup(p.mesh); mobs.splice(i, 1); continue;
        }
      } else {
        p.landTimer = 0;
        // плавное блуждание под водой
        p.stateT -= dt;
        if (p.stateT <= 0) {
          p.yaw = Math.random()*Math.PI*2;
          p.pitchSwim = (Math.random()-0.5)*0.6;
          p.stateT = 1.5 + Math.random()*2.5;
        }
        if (p.flee > 0) { p.flee -= dt; const ax=p.pos.x-PLAYER.pos.x, az=p.pos.z-PLAYER.pos.z; p.yaw=Math.atan2(ax,az); }
        const sp = (p.flee > 0) ? 2.6 : 1.2;
        const dirx = Math.sin(p.yaw), dirz = Math.cos(p.yaw);
        p.vel.x = dirx * sp; p.vel.z = dirz * sp;
        // удерживать глубину: всплывать/нырять, не вылетая из воды
        const aboveWater = !isWaterLiquid(World.getBlock(cx2, cy2+1, cz2));
        let vy = (p.pitchSwim || 0) * sp;
        if (aboveWater && vy > 0) vy = -0.5; // у поверхности — нырнуть
        p.vel.y += (vy - p.vel.y) * Math.min(1, dt*6);
        p.walkPhase += dt * 10;
      }
      // коллизии и перемещение
      p.onGround = false;
      mobCollide(p, 'y', p.vel.y * dt);
      mobCollide(p, 'x', p.vel.x * dt);
      mobCollide(p, 'z', p.vel.z * dt);
      // анимация
      p.mesh.position.copy(p.pos);
      let dyf = p.yaw - p.mesh.rotation.y;
      while (dyf > Math.PI) dyf -= Math.PI*2; while (dyf < -Math.PI) dyf += Math.PI*2;
      p.mesh.rotation.y += dyf * Math.min(1, dt*8);
      if (p.mesh.userData.tail) p.mesh.userData.tail.rotation.y = Math.sin(p.walkPhase) * 0.6;
      p.mesh.scale.setScalar(p.hurtT > 0 ? 1.1 : 1.0);
      continue;
    }

    // --- Фантом: летающая логика — КРУЖИТ над жертвой, ПИКИРУЕТ, ВЗЛЕТАЕТ (как в MC) ---
    if (p.def.flying) {
      // плавный доворот скорости к точке
      const steer = (tx, ty, tz, speed, turn) => {
        const dx = tx - p.pos.x, dy = ty - p.pos.y, dz = tz - p.pos.z;
        const len = Math.hypot(dx, dy, dz) || 1;
        const k = Math.min(1, dt * turn);
        p.vel.x += (dx/len*speed - p.vel.x) * k;
        p.vel.y += (dy/len*speed - p.vel.y) * k;
        p.vel.z += (dz/len*speed - p.vel.z) * k;
        return len;
      };
      p.stateT -= dt;
      if (p.flyState === 'circle') {
        // орбита вокруг игрока на высоте ~12 блоков
        p.orbitA += p.orbitDir * dt * 0.55;
        const tx = PLAYER.pos.x + Math.cos(p.orbitA) * 11;
        const tz = PLAYER.pos.z + Math.sin(p.orbitA) * 11;
        const ty = PLAYER.pos.y + 12 + Math.sin(p.orbitA * 2) * 2.5;
        steer(tx, ty, tz, 4.4, 2.2);
        p.swoopT -= dt;
        if (p.swoopT <= 0 && !PLAYER.dead) { p.flyState = 'swoop'; p.stateT = 6; }
      } else if (p.flyState === 'swoop') {
        // ПИКЕ на игрока: быстрый бросок вниз
        const d = steer(PLAYER.pos.x, PLAYER.pos.y + 0.9, PLAYER.pos.z, 9.5, 3.4);
        if (d < 1.8 && p.attackCd <= 0 && !PLAYER.dead) {
          p.attackCd = 1.2;
          damagePlayer(p.def.dmg || 6, 'Вас убил фантом');
          // отбросить игрока (как в MC при укусе пике)
          const ax = PLAYER.pos.x - p.pos.x, az = PLAYER.pos.z - p.pos.z;
          const len = Math.hypot(ax, az) || 1;
          PLAYER.vel.x += (ax/len)*4; PLAYER.vel.z += (az/len)*4; PLAYER.vel.y = 4;
          p.flyState = 'climb'; p.stateT = 1.6 + Math.random();
        } else if (p.stateT <= 0 || p.pos.y < PLAYER.pos.y - 4) {
          // прошёл мимо или упал ниже цели — вверх
          p.flyState = 'climb'; p.stateT = 1.4 + Math.random();
        }
      } else {
        // ВЗЛЁТ после атаки: свеча вверх с торможением по горизонтали
        p.vel.x *= (1 - Math.min(1, dt * 1.6));
        p.vel.z *= (1 - Math.min(1, dt * 1.6));
        p.vel.y += (6.5 - p.vel.y) * Math.min(1, dt * 3);
        if (p.stateT <= 0) { p.flyState = 'circle'; p.swoopT = 4 + Math.random() * 5; }
      }
      // столкновения (при пике об стену — уходим вверх, не застреваем)
      const hitY = mobCollide(p, 'y', p.vel.y * dt);
      const hitX = mobCollide(p, 'x', p.vel.x * dt);
      const hitZ = mobCollide(p, 'z', p.vel.z * dt);
      if ((hitX || hitZ || hitY) && p.flyState === 'swoop') { p.flyState = 'climb'; p.stateT = 1.2; }
      // вода — всплываем (мембрана не тонет), лава/огонь — горим
      const fB = World.getBlock(Math.floor(p.pos.x), Math.floor(p.pos.y + 0.2), Math.floor(p.pos.z));
      const hB = World.getBlock(Math.floor(p.pos.x), Math.floor(p.pos.y + 0.4), Math.floor(p.pos.z));
      if (isWaterLiquid(fB)) { p.vel.y += (3 - p.vel.y) * Math.min(1, dt * 4); p.burnTimer = 0; }
      if (isLavaLiquid(fB) || isLavaLiquid(hB) || fB === BLOCK.FIRE || hB === BLOCK.FIRE) p.burnTimer = Math.max(p.burnTimer || 0, 1.2);
      // СОЛНЦЕ: горит под открытым небом днём (parity MC, как зомби)
      if (World.dim === 'overworld' && daylight() > 0.4) {
        p.sunCheckT = (p.sunCheckT || 0) + dt;
        if (p.sunCheckT >= 0.5) {
          p.sunCheckT = 0; p.sunExposed = true;
          const hx = Math.floor(p.pos.x), hz = Math.floor(p.pos.z);
          for (let sy = Math.floor(p.pos.y + p.height); sy < WORLD_HEIGHT; sy++) {
            if (OPAQUE[World.getBlock(hx, sy, hz)]) { p.sunExposed = false; break; }
          }
        }
        if (p.sunExposed) p.burnTimer = Math.max(p.burnTimer || 0, 1.0);
      } else p.sunCheckT = 0;
      // горение
      if ((p.burnTimer || 0) > 0 && !isWaterLiquid(fB)) {
        p.burnTimer -= dt;
        p.burnTick = (p.burnTick || 0) + dt;
        if (p.burnTick >= 1.0) {
          p.burnTick = 0;
          p.hp -= 1;
          p.hurtT = 0.3;
          if (p.hp <= 0) {
            const n = p.def.dropCount();
            for (let k = 0; k < n; k++) spawnDrop(p.def.drop, p.pos.x + (Math.random()-0.5)*0.4, p.pos.y + 0.3, p.pos.z + (Math.random()-0.5)*0.4);
            scene.remove(p.mesh); disposeGroup(p.mesh); mobs.splice(i, 1); continue;
          }
        }
      }
      if (p.pos.y < -8) { scene.remove(p.mesh); disposeGroup(p.mesh); mobs.splice(i, 1); continue; }
      // --- Анимация: нос по вектору скорости, наклон при пике, машущие крылья, хвост-волна ---
      p.mesh.position.copy(p.pos);
      const hsp = Math.hypot(p.vel.x, p.vel.z);
      if (hsp > 0.25) {
        const tYaw = Math.atan2(p.vel.x, p.vel.z);
        let dyaw = tYaw - p.mesh.rotation.y;
        while (dyaw > Math.PI) dyaw -= Math.PI*2;
        while (dyaw < -Math.PI) dyaw += Math.PI*2;
        p.mesh.rotation.y += dyaw * Math.min(1, dt * 4);
        // тангаж: нос вниз при пике, вверх при взлёте
        const pitch = Math.max(-0.9, Math.min(0.9, -Math.atan2(p.vel.y, hsp) * 0.8));
        p.mesh.rotation.x += (pitch - p.mesh.rotation.x) * Math.min(1, dt * 4);
      }
      p.walkPhase += dt * 9;                     // частые взмахи
      const flap = Math.sin(p.walkPhase) * 0.75; // амплитуда побольше — видно издалека
      if (p.mesh.userData.wings) {
        p.mesh.userData.wings[0].rotation.z =  flap;
        p.mesh.userData.wings[1].rotation.z = -flap;
      }
      if (p.mesh.userData.tail) {
        const tl = p.mesh.userData.tail;
        for (let ti = 0; ti < tl.length; ti++) tl[ti].rotation.x = Math.sin(p.walkPhase * 0.8 - ti * 0.9) * 0.26;
      }
      p.mesh.scale.setScalar(p.hurtT > 0 ? 1.0 + Math.sin(p.hurtT*40)*0.06 : 1.0);
      continue;
    }

    let moving = false;
    let chasing = false;
    // Зомби: самостоятельно замечают игрока в радиусе 35 блоков (MC parity)
    if (p.type === 'zombie' && (p.aggro || 0) <= 0 && !PLAYER.dead) {
      if (dist2ToPlayer(p) < 35*35) p.aggro = 12; // MC: радиус обнаружения зомби 35 блоков
    }
    // Паук: в MC нейтрален при свете >= 12 и враждебен в темноте (16 блоков)
    if (p.type === 'spider' && (p.aggro || 0) <= 0 && !PLAYER.dead) {
      if (dist2ToPlayer(p) < 16*16 && spiderAngryAtLight(p)) p.aggro = 14;
    }
    if ((p.aggro || 0) > 0) {
      // --- Агрессия: преследуем игрока и атакуем вблизи ---
      p.aggro -= dt;
      const d2 = dist2ToPlayer(p);
      if (d2 > 40*40) { p.aggro = 0; p.path = null; } // слишком далеко — теряем цель
      else {
        chasing = true; moving = true;
        // --- НАВИГАЦИЯ: A* в обход стен/оврагов (фикс застреваний) ---
        if (p.def.pathfind && typeof mobUpdateChasePath === 'function') {
          mobUpdateChasePath(p, PLAYER.pos.x, PLAYER.pos.y, PLAYER.pos.z, dt);
          const ang = mobSteerAlongPath(p);
          p.yaw = (ang !== null) ? ang : Math.atan2(PLAYER.pos.x - p.pos.x, PLAYER.pos.z - p.pos.z);
        } else {
          p.yaw = Math.atan2(PLAYER.pos.x - p.pos.x, PLAYER.pos.z - p.pos.z);
        }
        // ПАУК: прыжок-атака с разбега (как в MC — leap attack). Только по БЛИЗКОЙ
        // ГОРИЗОНТАЛЬНО цели на том же уровне (иначе башню/стену надо ЛЕЗТЬ,
        // а не прыгать у подножия)
        if (p.def.leaps && p.onGround && !p.climbing && d2 > 1.5*1.5) {
          const dxh = PLAYER.pos.x - p.pos.x, dzh = PLAYER.pos.z - p.pos.z;
          const dh2 = dxh*dxh + dzh*dzh;
          const dyv = Math.abs(PLAYER.pos.y - p.pos.y);
          if (dh2 > 1.5*1.5 && dh2 < 4.0*4.0 && dyv < 1.5 && Math.random() < dt * 1.4) {
            const llen = Math.hypot(dxh, dzh) || 1;
            p.vel.x = (dxh / llen) * (p.def.chaseSpeed || 3.5) * 1.6;
            p.vel.z = (dzh / llen) * (p.def.chaseSpeed || 3.5) * 1.6;
            p.vel.y = 5.2;
            p.onGround = false;
            p.leapT = 0.8; // летим по инерции — скорость не переназначаем
          }
        }
        // атака при контакте
        if (d2 < 2.0*2.0 && p.attackCd <= 0 && !PLAYER.dead) {
          p.attackCd = 1.0;
          damagePlayer(p.def.dmg || 3, 'Вас убил ' + (p.def.name || 'моб'));
          // отбросить игрока
          const len = Math.hypot(PLAYER.pos.x - p.pos.x, PLAYER.pos.z - p.pos.z) || 1;
          PLAYER.vel.x += ((PLAYER.pos.x - p.pos.x)/len)*3; PLAYER.vel.z += ((PLAYER.pos.z - p.pos.z)/len)*3; PLAYER.vel.y = 4;
        }
      }
    }
    if (!chasing) {
      if (p.flee > 0) {
        p.flee -= dt;
        const ax = p.pos.x - PLAYER.pos.x, az = p.pos.z - PLAYER.pos.z;
        p.yaw = Math.atan2(ax, az);
        moving = true;
      } else {
        p.stateT -= dt;
        if (p.stateT <= 0) {
          if (Math.random() < 0.5) { p.state = 'walk'; p.yaw = Math.random()*Math.PI*2; p.stateT = 2+Math.random()*4; }
          else { p.state = 'idle'; p.stateT = 1.5+Math.random()*3; }
        }
        moving = (p.state === 'walk');
      }
    }

    // зомби заметно медленнее игрока (2.7), пиглин шустрее (3.6) — от зомби можно убежать
    const speed = chasing ? (p.def.chaseSpeed || 3.6) : (p.flee > 0 ? 3.2 : 1.4);
    if (moving && (p.leapT || 0) > 0) {
      // в полёте прыжка-атаки — не переназначаем скорость, летим по инерции
      p.leapT -= dt;
    } else if (moving) {
      const dirx = Math.sin(p.yaw), dirz = Math.cos(p.yaw);
      // избегать захода в воду: если впереди вода — развернуться (мобы реже сидят в воде)
      const ahx = Math.floor(p.pos.x + dirx*0.8), ahz = Math.floor(p.pos.z + dirz*0.8);
      const ahy = Math.floor(p.pos.y);
      const aheadWater = isWaterLiquid(World.getBlock(ahx, ahy, ahz)) || isWaterLiquid(World.getBlock(ahx, ahy-1, ahz));
      // не убегая в панике от воды разворачиваемся; при бегстве или ПОГОНЕ (зомби/пиглин лезут в воду) — продолжаем
      if (aheadWater && p.flee <= 0 && !chasing) {
        p.yaw += Math.PI * (0.5 + Math.random()*0.5);
        p.vel.x = 0; p.vel.z = 0;
        p.stateT = Math.min(p.stateT, 0.3);
      } else {
        p.vel.x = dirx * speed; p.vel.z = dirz * speed;
        const fx = Math.floor(p.pos.x + dirx*0.6), fz = Math.floor(p.pos.z + dirz*0.6);
        const fy = Math.floor(p.pos.y);
        if (p.onGround && mobSolid(fx, fy, fz) && !mobSolid(fx, fy+1, fz)) { p.vel.y = 7; p.onGround = false; }
      }
    } else { p.vel.x = 0; p.vel.z = 0; }

    // ВОДА (не лава): моб активно всплывает и держится на поверхности — «не дышит под водой».
    const headBlk = World.getBlock(Math.floor(p.pos.x), Math.floor(p.pos.y + p.height*0.7), Math.floor(p.pos.z));
    const feetBlk = World.getBlock(Math.floor(p.pos.x), Math.floor(p.pos.y + 0.2), Math.floor(p.pos.z));
    const headInWater = isWaterLiquid(headBlk);
    const inWater = isWaterLiquid(feetBlk) || headInWater;
    if (inWater) {
      // плавучесть ПЕРЕКРЫВАЕТ гравитацию: задаём целевую скорость всплытия,
      // чтобы моб поднимался к поверхности и держался на ней (не тонул, не «дышал под водой»).
      const target = headInWater ? 3.2 : 1.4;   // под воде — всплывать быстрее
      p.vel.y += (target - p.vel.y) * Math.min(1, dt * 8); // плавно к целевой
      // паническое стремление к ближайшей суше
      if (p.flee <= 0) { p.state = 'walk'; p.stateT = Math.max(p.stateT, 0.5); }
    } else if (p.climbing) {
      // ПАУК НА СТЕНЕ: гравитация не действует — ползёт по стене
      // с постоянной скоростью (независимо от FPS: на низких кадрах
      // гравитация успевала гасить импульс подъёма за один кадр и паук
      // «залипал» у подножия). Направление — по ВЕЙПОЙНТУ маршрута:
      // выше — лезет вверх, ниже — плавно СПЛЫВАЕТ вниз (раньше паук
      // всегда лез вверх и не мог слезть со стены к цели ниже)
      const cwp = (p.path && p.pathIdx < p.path.length) ? p.path[p.pathIdx] : null;
      const cty = cwp ? (cwp.y + 0.5) : PLAYER.pos.y;
      p.vel.y = (cty < p.pos.y - 0.6) ? -2.8 : 3.0; // ниже — сползает, выше — лезет
    } else {
      p.vel.y -= GRAVITY * dt;
      // курица медленно падает, размахивая крыльями (без урона от падения, как в MC)
      if (p.type === 'chicken' && p.vel.y < -2.5) p.vel.y = -2.5;
      if (p.vel.y < -55) p.vel.y = -55;
    }

    // СОЛНЦЕ: нежить (зомби) горит под открытым небом днём (MC-парити).
    // Проверку колонки до неба делаем не чаще 2 раз/с на моба — экономия.
    if (p.def.burnsInSun && World.dim === 'overworld' && daylight() > 0.4) {
      p.sunCheckT = (p.sunCheckT || 0) + dt;
      if (p.sunCheckT >= 0.5) {
        p.sunCheckT = 0;
        p.sunExposed = true;
        const hx = Math.floor(p.pos.x), hz = Math.floor(p.pos.z);
        for (let sy = Math.floor(p.pos.y + p.height); sy < WORLD_HEIGHT; sy++) {
          if (OPAQUE[World.getBlock(hx, sy, hz)]) { p.sunExposed = false; break; } // крыша над головой
        }
      }
      if (p.sunExposed) p.burnTimer = Math.max(p.burnTimer || 0, 1.0);
    } else {
      p.sunCheckT = 0; // ночь/Ад — проверка не нужна
    }

    // ЛАВА/ОГОНЬ: мобы горят и получают урон (как и игрок)
    const inLava = isLavaLiquid(feetBlk) || isLavaLiquid(headBlk) ||
                   isLavaLiquid(World.getBlock(Math.floor(p.pos.x), Math.floor(p.pos.y+p.height*0.4), Math.floor(p.pos.z)));
    const inFire = feetBlk === BLOCK.FIRE || World.getBlock(Math.floor(p.pos.x), Math.floor(p.pos.y+p.height*0.4), Math.floor(p.pos.z)) === BLOCK.FIRE;
    if (inLava) { p.burnTimer = Math.max(p.burnTimer || 0, 1.2); }
    else if (inFire) { p.burnTimer = Math.max(p.burnTimer || 0, 0.8); }
    if ((p.burnTimer || 0) > 0) {
      if (!inWater) {  // вода тушит
        p.burnTimer -= dt;
        p.burnTick = (p.burnTick || 0) + dt;
        const interval = inLava ? 0.5 : 1.0;
        if (p.burnTick >= interval) {
          p.burnTick = 0;
          p.hp -= inLava ? 3 : 1;
          p.hurtT = 0.3;
          if (p.hp <= 0) {
            // погиб от огня/лавы — выпадает (по возможности приготовленный) дроп
            const n = p.def.dropCount();
            const cookedMap = { [ITEM.PORK_RAW]: ITEM.PORK_COOKED, [ITEM.BEEF_RAW]: ITEM.BEEF_COOKED, [ITEM.CHICKEN_RAW]: ITEM.CHICKEN_COOKED, [ITEM.MUTTON_RAW]: ITEM.MUTTON_COOKED, [ITEM.FISH_RAW]: ITEM.FISH_COOKED };
            const dropId = cookedMap[p.def.drop] || p.def.drop;
            for (let k = 0; k < n; k++) spawnDrop(dropId, p.pos.x + (Math.random()-0.5)*0.4, p.pos.y + 0.4, p.pos.z + (Math.random()-0.5)*0.4);
            if (p.type === 'cow') { const lc=1+(Math.random()*2|0); for(let k=0;k<lc;k++) spawnDrop(ITEM.LEATHER, p.pos.x+(Math.random()-0.5)*0.4, p.pos.y+0.4, p.pos.z+(Math.random()-0.5)*0.4); }
            if (p.type === 'sheep' && !p.sheared) spawnDrop(BLOCK.WOOL, p.pos.x+(Math.random()-0.5)*0.4, p.pos.y+0.4, p.pos.z+(Math.random()-0.5)*0.4);
            scene.remove(p.mesh); disposeGroup(p.mesh); mobs.splice(i, 1); continue;
          }
        }
      } else { p.burnTimer = 0; }
    }

    p.onGround = false;
    // паук ЛЕЗЕТ/СПЛЗАЕТ по стене: вертикаль — по узкой колонне (иначе блоки
    // стены «бьют» каждый кадр и срывают подъём, а при сползании полная
    // ширина хитбокса цепляется за кромку стены сверху и не даёт спуститься)
    const climbUp = p.climbing && p.vel.y > 0;
    let climbHit = false;
    if (p.climbing) climbHit = mobCollideY(p, p.vel.y * dt, 0.5);
    else mobCollide(p, 'y', p.vel.y * dt);
    // ПАУК: упёрся ГОЛОВОЙ в козырёк/листву, вися на стене — не висеть
    // вечно (стагнат-детектор ниже требует onGround и тут не срабатывает):
    // через 0.7 с отпускаем стену и сразу пересчитываем маршрут
    if (climbUp && climbHit) {
      p._climbBlockT = (p._climbBlockT || 0) + dt;
      if (p._climbBlockT > 0.7) {
        p._climbBlockT = 0; p.climbing = false;
        p.path = null; p.pathT = 0;
      }
    } else if (p.climbing) {
      p._climbBlockT = 0;
    }
    const hitX = mobCollide(p, 'x', p.vel.x * dt);
    const hitZ = mobCollide(p, 'z', p.vel.z * dt);

    // ПАУК: упёрся в стену на погоне/побеге — ЛЕЗЕТ ВВЕРХ (climbing, parity MC).
    // Пока жмётся к стене — не прыгает (прыжок мешает лазанию у подножия)
    if (p.def.climbs && (hitX || hitZ) && ((p.aggro || 0) > 0 || p.flee > 0)) {
      p.onGround = false;
      p.climbing = true;
    } else {
      p.climbing = false;
    }

    // застревание: идём, но скорости нет (упёрся в стену/углы)
    if (moving && Math.abs(p.vel.x) < 0.05 && Math.abs(p.vel.z) < 0.05 && p.onGround) {
      p._stuckT = (p._stuckT || 0) + dt;
      if (p._stuckT > 0.45) {
        p._stuckT = 0;
        if (chasing && p.def.pathfind) {
          p.path = null; p.pathT = 0; // форсируем пересчёт маршрута
        } else if ((p.flee || 0) <= 0) {
          p.yaw = Math.random()*Math.PI*2; p.stateT = Math.min(p.stateT, 0.4);
        }
      }
    } else {
      p._stuckT = 0;
    }

    if (p.pos.y < -8) { scene.remove(p.mesh); disposeGroup(p.mesh); mobs.splice(i, 1); continue; }

    // --- Анимация ---
    p.mesh.position.copy(p.pos);
    let dy = p.yaw - p.mesh.rotation.y;
    while (dy > Math.PI) dy -= Math.PI*2; while (dy < -Math.PI) dy += Math.PI*2;
    p.mesh.rotation.y += dy * Math.min(1, dt*10);

    const legs = p.mesh.userData.legs;
    if (moving) {
      p.walkPhase += dt * (p.flee>0?14:8);
      const sw = Math.sin(p.walkPhase) * 0.6;
      // шагаем безопасно для любого числа ног (4 у свиньи/коровы, 2 у курицы)
      if (legs) for (let li = 0; li < legs.length; li++) {
        // передние/задние в противофазе, диагонали синхронны
        const dir = (li % 2 === 0) ? 1 : -1;
        legs[li].rotation.x = sw * dir;
      }
    } else if (legs) {
      for (const l of legs) l.rotation.x *= (1 - Math.min(1, dt*8));
    }
    const head = p.mesh.userData.head;
    if (head) head.rotation.x = Math.sin(p.walkPhase*0.5) * 0.05;
    p.mesh.scale.setScalar(p.hurtT > 0 ? 1.0 + Math.sin(p.hurtT*40)*0.06 : 1.0);
  }
}

function dist2ToPlayer(p) {
  const dx = p.pos.x - PLAYER.pos.x, dy = p.pos.y - PLAYER.pos.y, dz = p.pos.z - PLAYER.pos.z;
  return dx*dx + dy*dy + dz*dz;
}

// атака по мобу из прицела (вызывается при ЛКМ)
// моб под прицелом (для стрижки и т.п.)
function mobUnderCursor(maxDist) {
  const origin = new THREE.Vector3(PLAYER.pos.x, PLAYER.pos.y + (PLAYER.crouching?PLAYER.crouchEye:PLAYER.eye), PLAYER.pos.z);
  const dir = new THREE.Vector3(
    -Math.sin(PLAYER.yaw)*Math.cos(PLAYER.pitch),
    Math.sin(PLAYER.pitch),
    -Math.cos(PLAYER.yaw)*Math.cos(PLAYER.pitch)
  ).normalize();
  let best = null, bestT = maxDist || 4.0;
  const blockHit = getTargetBlock(maxDist || 4.0);
  const blockDist = blockHit ? Math.hypot(blockHit.x + 0.5 - origin.x, blockHit.y + 0.5 - origin.y, blockHit.z + 0.5 - origin.z) : Infinity;
  for (const p of mobs) {
    const hw = p.width/2;
    const bmin = new THREE.Vector3(p.pos.x-hw, p.pos.y, p.pos.z-hw);
    const bmax = new THREE.Vector3(p.pos.x+hw, p.pos.y+p.height, p.pos.z+hw);
    const tHit = rayAABB(origin, dir, bmin, bmax);
    if (tHit !== null && tHit < bestT && tHit <= blockDist + 0.4) { bestT = tHit; best = p; }
  }
  return best;
}

// поспать в кровати: только ночью — плавно промотать время ВПЕРЁД к рассвету + spawn у кровати
// bx,by,bz — координаты блока кровати (для точки возрождения и камеры)
let sleepTransition = null; // {from, span, t, dur, sx, sy, sz, camFromX, camFromY, camFromZ}
function sleepInBed(bx, by, bz) {
  // в Аду кровать ВЗРЫВАЕТСЯ (как в Minecraft)
  if (World.dim === 'nether') {
    showToast('Кровать взрывается в Аду!');
    // разрушить саму кровать и блоки вокруг (упрощённый взрыв радиуса 2)
    const cx = bx !== undefined ? bx : Math.floor(PLAYER.pos.x);
    const cy = by !== undefined ? by : Math.floor(PLAYER.pos.y);
    const cz = bz !== undefined ? bz : Math.floor(PLAYER.pos.z);
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) for (let dz = -2; dz <= 2; dz++) {
      if (dx*dx + dy*dy + dz*dz > 6) continue;
      const ex = cx + dx, ey = cy + dy, ez = cz + dz;
      const b = World.getBlock(ex, ey, ez);
      if (b === BLOCK.AIR || b === BLOCK.BEDROCK || isLiquid(b)) continue;
      World.setBlock(ex, ey, ez, BLOCK.AIR);
      // поджечь центр
      if (dx === 0 && dz === 0 && dy === 0) FireSim.add(ex, ey, ez);
    }
    rebuildAround(cx, cz);
    spawnParticles(cx + 0.5, cy + 1, cz + 0.5, 24, '#ff8030');
    playSound('break', BLOCK.STONE);
    damagePlayer(10, 'Кровать взорвалась');
    return;
  }
  const dl = daylight();
  if (dl > 0.3) { showToast('Можно спать только ночью'); return; }
  if (sleepTransition) return; // уже спим
  // Монстры рядом не дают уснуть (как в MC): враждебный моб в радиусе 8 блоков
  {
    let monster = null;
    for (const m of mobs) {
      if (!m.def.hostile) continue;
      // нейтральный паук НЕ мешает сну (parity MC: мешают только враждебные
      // прямо сейчас монстры; спокойный паук у кровати днём спать не мешает)
      if (m.type === 'spider' && (m.aggro || 0) <= 0) continue;
      const dx = m.pos.x - (bx !== undefined ? bx + 0.5 : PLAYER.pos.x);
      const dy = m.pos.y - (by !== undefined ? by : PLAYER.pos.y);
      const dz = m.pos.z - (bz !== undefined ? bz + 0.5 : PLAYER.pos.z);
      if (dx*dx + dy*dy + dz*dz < 8*8) { monster = m; break; }
    }
    if (monster) { showToast('Вам не даёт спать ' + (monster.def.name || 'монстр') + ' поблизости'); return; }
  }
  // точка возрождения ставится СРАЗУ при засыпании (как в MC), а не после промотки
  if (bx !== undefined) {
    // ищем свободную клетку рядом с кроватью
    const spawn = findBedSpawn(bx, by, bz);
    if (spawn) PLAYER.spawnPoint = spawn;
  }
  // точка возрождения — над кроватью
  const sx = (bx !== undefined ? bx + 0.5 : PLAYER.pos.x);
  const sz = (bz !== undefined ? bz + 0.5 : PLAYER.pos.z);
  const sy = (by !== undefined ? by + 1 : PLAYER.pos.y);
  // Рассвет = DAY.time 0.25 (daylight = 0.5 — реальный рассвет по формуле daylight).
  const DAWN = 0.25;
  let span = (DAWN - DAY.time + 1) % 1;
  if (span < 0.01) span = 1.0; // если уже почти рассвет — крутим полные сутки
  // сохранить позицию камеры для возврата после сна
  const camFromX = PLAYER.pos.x, camFromY = PLAYER.pos.y, camFromZ = PLAYER.pos.z;
  sleepTransition = {
    from: DAY.time, span: span, t: 0, dur: 2.5,
    sx, sy, sz, camFromX, camFromY, camFromZ,
    bedX: sx, bedY: sy, bedZ: sz,
    bedBX: bx, bedBY: by, bedBZ: bz, // точные координаты блока кровати
  };
  showToast('Спокойной ночи…');
  // включить оверлей сна
  const so = document.getElementById('sleepOverlay');
  if (so) so.classList.add('on');
  playSound('pickup');
  if (typeof requestSave === 'function') requestSave();
}
// тикер плавной промотки времени (вызывается из главного цикла)
function endSleepTransition() {
  const so = document.getElementById('sleepOverlay');
  if (so) so.classList.remove('on');
  sleepTransition = null;
  if (typeof requestSave === 'function') requestSave();
}

function updateSleepTransition(dt) {
  if (!sleepTransition) return;
  // погибли во сне (напр. голод) — резко проснуться там, где засыпали
  if (PLAYER.dead) {
    PLAYER.pos.set(sleepTransition.camFromX, sleepTransition.camFromY, sleepTransition.camFromZ);
    PLAYER.vel.set(0, 0, 0);
    endSleepTransition();
    return;
  }
  sleepTransition.t += dt;
  const k = Math.min(1, sleepTransition.t / sleepTransition.dur);
  // ИНКРЕМЕНТИРУЕМ время вперёд (никакого отката назад) до рассвета.
  // Небо теперь меняется юниформом на GPU — без перестройки чанков
  // (раньше конец сна давал «вспышку» полного дня и двойной relight всех чанков).
  DAY.time = (sleepTransition.from + sleepTransition.span * k) % 1;
  DAY_LIGHT_UNIFORM.value = skyFactor();
  // плавно переместить камеру игрока к кровати (лёгкое «опускание» на кровать)
  const kk = k < 0.5 ? k * 2 : 1; // первая половина — движение к кровати
  PLAYER.pos.x = sleepTransition.camFromX + (sleepTransition.bedX - sleepTransition.camFromX) * kk;
  PLAYER.pos.y = sleepTransition.camFromY + (sleepTransition.bedY - sleepTransition.camFromY) * kk;
  PLAYER.pos.z = sleepTransition.camFromZ + (sleepTransition.bedZ - sleepTransition.camFromZ) * kk;
  if (k >= 1) {
    DAY.time = 0.25; // рассвет (daylight = 0.5)
    DAY_LIGHT_UNIFORM.value = skyFactor();
    timeSinceRest = 0;              // ВЫСПАЛСЯ: бессонница сброшена, фантомы уйдут (parity MC)
    phantomSpawnTimer = 20;
    // Встать в безопасную клетку РЯДОМ с кроватью (фикс: раньше игрок
    // просыпался в точке кровати и мог застрять в блоке над ней)
    let woke = false;
    if (sleepTransition.bedBX !== undefined) {
      const wake = findBedSpawn(sleepTransition.bedBX, sleepTransition.bedBY, sleepTransition.bedBZ);
      if (wake) { PLAYER.pos.set(wake.x, wake.y, wake.z); woke = true; }
    }
    if (!woke) PLAYER.pos.set(sleepTransition.camFromX, sleepTransition.camFromY, sleepTransition.camFromZ);
    PLAYER.vel.set(0, 0, 0);
    PLAYER.fallStart = undefined; // без урона от падения после сна
    showToast('Доброе утро!');
    endSleepTransition();
  }
}

function tryAttackMob() {
  const origin = new THREE.Vector3(PLAYER.pos.x, PLAYER.pos.y + (PLAYER.crouching?PLAYER.crouchEye:PLAYER.eye), PLAYER.pos.z);
  const dir = new THREE.Vector3(
    -Math.sin(PLAYER.yaw)*Math.cos(PLAYER.pitch),
    Math.sin(PLAYER.pitch),
    -Math.cos(PLAYER.yaw)*Math.cos(PLAYER.pitch)
  ).normalize();
  // дистанция до первого блока на луче — цель за стеной недостижима (как в MC)
  const blockHit = getTargetBlock(4.0);
  const blockDist = blockHit ? Math.hypot(blockHit.x + 0.5 - origin.x, blockHit.y + 0.5 - origin.y, blockHit.z + 0.5 - origin.z) : Infinity;
  let best = null, bestT = 4.0;
  for (const p of mobs) {
    const hw = p.width/2;
    const bmin = new THREE.Vector3(p.pos.x-hw, p.pos.y, p.pos.z-hw);
    const bmax = new THREE.Vector3(p.pos.x+hw, p.pos.y+p.height, p.pos.z+hw);
    const tHit = rayAABB(origin, dir, bmin, bmax);
    if (tHit !== null && tHit < bestT) { bestT = tHit; best = p; }
  }
  if (best && bestT <= blockDist + 0.4) { hurtMob(best); return true; }
  // лодка под прицелом — ломаем ударом (дроп предмет-лодка, как в MC)
  for (let bi = boats.length - 1; bi >= 0; bi--) {
    const b = boats[bi];
    const bmin = new THREE.Vector3(b.pos.x-0.75, b.pos.y, b.pos.z-0.95);
    const bmax = new THREE.Vector3(b.pos.x+0.75, b.pos.y+0.6, b.pos.z+0.95);
    const tHit = rayAABB(origin, dir, bmin, bmax);
    if (tHit !== null && tHit <= 3.5 && tHit <= blockDist + 0.4) {
      spawnDrop(ITEM.BOAT, b.pos.x, b.pos.y + 0.3, b.pos.z);
      if (b.rider) { b.rider = false; PLAYER.riding = null; }
      scene.remove(b.mesh); disposeGroup(b.mesh); boats.splice(bi, 1);
      playSound('break', BLOCK.PLANKS);
      return true;
    }
  }
  return false;
}

function rayAABB(o, d, mn, mx) {
  let tmin = -Infinity, tmax = Infinity;
  for (const ax of ['x','y','z']) {
    if (Math.abs(d[ax]) < 1e-8) {
      if (o[ax] < mn[ax] || o[ax] > mx[ax]) return null;
    } else {
      let t1 = (mn[ax]-o[ax])/d[ax], t2 = (mx[ax]-o[ax])/d[ax];
      if (t1 > t2) { const tmp=t1;t1=t2;t2=tmp; }
      tmin = Math.max(tmin, t1); tmax = Math.min(tmax, t2);
      if (tmin > tmax) return null;
    }
  }
  return tmin >= 0 ? tmin : (tmax >= 0 ? 0 : null);
}

function hurtMob(p) {
  // i-frames как в MC: 0.5с неуязвимости после удара (фикс спам-ЛКМ)
  if ((p.hurtResist || 0) > 0) return;
  p.hurtResist = 0.5;
  // урон зависит от оружия: меч бьёт сильнее, кулак — 1
  // креатив: удар сносит моба с одного раза (как в MC — creative punch)
  const held = activeItem();
  const heldId = held ? held.id : 0;
  const dmg = window.__creative ? 1000 : (isSword(heldId) ? swordDamage(heldId) : (isTool(heldId) ? 2 : 1));
  p.hp -= dmg;
  p.hurtT = 0.3;
  addExhaustion(0.1); // атака тратит голод
  playSound(p.def.hurtSound);
  // износ инструмента при ударе (в MC оружие тоже теряет прочность;
  // useDurability сам чистит нужный контейнер)
  if (held && hasDurability(held.id)) {
    useDurability(held);
    refreshUI();
  }
  // Враждебные пачные мобы (пиглины): при ударе агрятся сами + вся стая (пока кто-то жив)
  if (p.def && p.def.hostile) {
    p.aggro = 30;
    if (p.def.pack) {
      for (const m of mobs) if (m.type === p.type && dist2Between(m, p) < 24*24) m.aggro = Math.max(m.aggro||0, 30);
    }
  } else {
    p.flee = 3 + Math.random()*2; // мирные — убегают
  }
  const ax = p.pos.x - PLAYER.pos.x, az = p.pos.z - PLAYER.pos.z;
  const len = Math.hypot(ax, az) || 1;
  p.vel.x += (ax/len) * 4; p.vel.z += (az/len) * 4; p.vel.y = 4;
  if (p.hp <= 0) {
    // горевший на момент смерти моб роняет ЖАРЕНОЕ мясо (как в MC)
    const cookedMap = { [ITEM.PORK_RAW]: ITEM.PORK_COOKED, [ITEM.BEEF_RAW]: ITEM.BEEF_COOKED,
                        [ITEM.CHICKEN_RAW]: ITEM.CHICKEN_COOKED, [ITEM.MUTTON_RAW]: ITEM.MUTTON_COOKED,
                        [ITEM.FISH_RAW]: ITEM.FISH_COOKED };
    const wasBurning = (p.burnTimer || 0) > 0;
    const dropId = (wasBurning && cookedMap[p.def.drop]) || p.def.drop;
    const n = p.def.dropCount();
    for (let k = 0; k < n; k++) spawnDrop(dropId, p.pos.x + (Math.random()-0.5)*0.4, p.pos.y + 0.4, p.pos.z + (Math.random()-0.5)*0.4);
    // коровы дополнительно роняют 0–2 кожи (как в MC)
    if (p.type === 'cow') { const lc = (Math.random()*3|0); for (let k=0;k<lc;k++) spawnDrop(ITEM.LEATHER, p.pos.x+(Math.random()-0.5)*0.4, p.pos.y+0.4, p.pos.z+(Math.random()-0.5)*0.4); }
    // куры роняют 0–2 пера (как в MC)
    if (p.type === 'chicken') { const fc = (Math.random()*3|0); for (let k=0;k<fc;k++) spawnDrop(ITEM.FEATHER, p.pos.x+(Math.random()-0.5)*0.4, p.pos.y+0.4, p.pos.z+(Math.random()-0.5)*0.4); }
    // зомби-пиглины дополнительно роняют 0–1 золотой самородок (как в MC)
    if (p.type === 'piglin') { const gn = (Math.random()*2|0); for (let k=0;k<gn;k++) spawnDrop(ITEM.GOLD_NUGGET, p.pos.x+(Math.random()-0.5)*0.4, p.pos.y+0.4, p.pos.z+(Math.random()-0.5)*0.4); }
    // овцы роняют 1 шерсть, если ещё не острижены
    if (p.type === 'sheep' && !p.sheared) { spawnDrop(BLOCK.WOOL, p.pos.x+(Math.random()-0.5)*0.4, p.pos.y+0.4, p.pos.z+(Math.random()-0.5)*0.4); }
    const idx = mobs.indexOf(p);
    scene.remove(p.mesh);
    disposeGroup(p.mesh);
    if (idx >= 0) mobs.splice(idx, 1);
  }
}
function dist2Between(a, b) {
  const dx=a.pos.x-b.pos.x, dy=a.pos.y-b.pos.y, dz=a.pos.z-b.pos.z;
  return dx*dx+dy*dy+dz*dz;
}


