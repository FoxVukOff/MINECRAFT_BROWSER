/* ============================================================
   MiniCraft — scene · Рендерер, сцена, небо/облака, анимация текстур
   (модуль 8 из 33; строки 3853–4043 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Three.js сцена
// ============================================================
const canvas = document.getElementById('game');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
// вывод БЕЗ гамма-коррекции (LinearSRGB) — точный пайплайн r128, каким игра
// была настроена изначально; сцена не должна «поплыть» по цветам после апгрейда
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

// Тени (по умолчанию включены, настраивается)
let SHADOWS_ON = (localStorage.getItem('minicraft_shadows') ?? '1') === '1';
renderer.shadowMap.enabled = SHADOWS_ON;
renderer.shadowMap.type = THREE.PCFShadowMap;
// КЛЮЧЕВАЯ ОПТИМИЗАЦИЯ: не пересчитывать карту теней каждый кадр.
// Обновляем её вручную только когда мир/солнце реально изменились (флаг shadowNeedsUpdate).
renderer.shadowMap.autoUpdate = false;
let shadowNeedsUpdate = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb);
scene.fog = new THREE.Fog(0x87ceeb, RENDER_DISTANCE * CHUNK_SIZE * 0.6, RENDER_DISTANCE * CHUNK_SIZE);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// three r155+: физическая модель света (интенсивность в «канделах»).
// Старые значения яркости (настройка эпохи r128) восстанавливаем множителем PI.
const LIGHT_SCALE = Math.PI;
// Солнце — отбрасывает тени; следует за игроком
const sun = new THREE.DirectionalLight(0xffffff, 0.85 * LIGHT_SCALE);
sun.position.set(40, 80, 30);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
const SHADOW_AREA = 48;
sun.shadow.camera.left = -SHADOW_AREA; sun.shadow.camera.right = SHADOW_AREA;
sun.shadow.camera.top = SHADOW_AREA; sun.shadow.camera.bottom = -SHADOW_AREA;
sun.shadow.camera.near = 1; sun.shadow.camera.far = 260;
sun.shadow.bias = -0.0012;
sun.castShadow = SHADOWS_ON;
scene.add(sun);
scene.add(sun.target);
const ambient = new THREE.AmbientLight(0xffffff, (SHADOWS_ON ? 0.5 : 0.55) * LIGHT_SCALE);
scene.add(ambient);
if (SHADOWS_ON) sun.intensity = 0.9 * LIGHT_SCALE; // синхрон с setShadows(true)

// ============================================================
//  Небо: видимое солнце + облака
// ============================================================
// Солнечный диск (билборд, всегда вдалеке за игроком относительно света)
const sunDiscMat = new THREE.SpriteMaterial({
  map: (() => {
    const c = document.createElement('canvas'); c.width = 64; c.height = 64;
    const x = c.getContext('2d');
    const g = x.createRadialGradient(32,32,4, 32,32,32);
    g.addColorStop(0, '#fffef0'); g.addColorStop(0.5, '#fff3b0'); g.addColorStop(0.85, 'rgba(255,225,120,0.5)'); g.addColorStop(1, 'rgba(255,220,110,0)');
    x.fillStyle = g; x.fillRect(0,0,64,64);
    const t = new THREE.CanvasTexture(c); return t;
  })(),
  // depthTest:true -> солнце перекрывается блоками (не просвечивает сквозь землю)
  transparent: true, depthWrite: false, depthTest: true, fog: false,
});
const sunDisc = new THREE.Sprite(sunDiscMat);
sunDisc.scale.set(34, 34, 1);
sunDisc.renderOrder = 2; // рисуем после непрозрачной геометрии, но с проверкой глубины
scene.add(sunDisc);

// Облака: плоские белые «пиксельные» спрайты, медленно дрейфуют
const clouds = [];
const cloudGroup = new THREE.Group();
scene.add(cloudGroup);
function makeCloudTexture() {
  const c = document.createElement('canvas'); c.width = 32; c.height = 16;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  x.clearRect(0,0,32,16);
  // компактное пиксельное облако
  let s = (Math.random()*1e9)>>>0; const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  for (let i=0;i<26;i++){ const bx=2+(rnd()*26)|0, by=3+(rnd()*9)|0, w=2+(rnd()*5)|0, h=2+(rnd()*3)|0; x.fillStyle = rnd()<0.5?'rgba(255,255,255,0.92)':'rgba(238,243,250,0.88)'; x.fillRect(bx,by,w,h); }
  const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
  return t;
}
const CLOUD_Y = 135, CLOUD_AREA = 260;
function buildClouds() {
  for (const cl of clouds) cloudGroup.remove(cl.mesh);
  clouds.length = 0;
  for (let i=0;i<16;i++){
    const mat = new THREE.MeshBasicMaterial({ map: makeCloudTexture(), transparent: true, depthWrite: false, fog: true, side: THREE.DoubleSide, opacity: 0.8 });
    const w = 26 + Math.random()*32, d = 16 + Math.random()*20;
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
    mesh.rotation.x = -Math.PI/2;
    mesh.position.set((Math.random()-0.5)*CLOUD_AREA, CLOUD_Y + (Math.random()-0.5)*6, (Math.random()-0.5)*CLOUD_AREA);
    cloudGroup.add(mesh);
    clouds.push({ mesh });
  }
}
buildClouds();
function updateClouds(dt) {
  // дрейф по X; облака следуют за игроком по «ячейке», чтобы всегда окружали
  cloudGroup.position.x = PLAYER.pos.x;
  cloudGroup.position.z = PLAYER.pos.z;
  for (const cl of clouds) {
    cl.mesh.position.x += dt * 1.4; // медленный ветер
    if (cl.mesh.position.x > CLOUD_AREA/2) cl.mesh.position.x -= CLOUD_AREA;
  }
}

// ============================================================
//  Анимация текстур (лава бурлит, огонь мерцает, вода переливается)
// ============================================================
let _animAcc = 0, _animFrame = 0;
function updateAnimatedTextures(dt) {
  _animAcc += dt;
  if (_animAcc < 0.12) return; // ~8 fps анимация
  _animAcc = 0;
  _animFrame++;
  // перерисовать canvas-текстуры лавы/огня/воды и пометить на обновление
  redrawLavaTex(_animFrame);
  redrawFireTex(_animFrame);
  redrawPortalTex(_animFrame);
  if (MATERIALS[BLOCK.LAVA] && MATERIALS[BLOCK.LAVA][0].map) MATERIALS[BLOCK.LAVA][0].map.needsUpdate = true;
  if (MATERIALS[BLOCK.FIRE] && MATERIALS[BLOCK.FIRE][0].map) MATERIALS[BLOCK.FIRE][0].map.needsUpdate = true;
  if (MATERIALS[BLOCK.NETHER_PORTAL] && MATERIALS[BLOCK.NETHER_PORTAL][0].map) MATERIALS[BLOCK.NETHER_PORTAL][0].map.needsUpdate = true;
}
function redrawPortalTex(frame) {
  const ctx = TEX.portal.getContext('2d');
  const seed = 2727 + frame * 53;
  pixelFillRegion(ctx, 0, 0, 16, 16, ['#7a2fb8','#5a1f9a','#9a4fd8','#3a1268','#6a2aa8'], [4,4,3,3,3], seed);
  let s = (seed*2246822519)>>>0; const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  ctx.fillStyle = '#c79cff';
  for (let i=0;i<5;i++) ctx.fillRect((rnd()*15)|0,(rnd()*15)|0,1,1);
}
function redrawLavaTex(frame) {
  const ctx = TEX.lava.getContext('2d');
  const seed = 6161 + frame * 37;
  pixelFillRegion(ctx, 0, 0, 16, 16, ['#d83a10','#b82c08','#e85a18','#a02404'], [5,4,3,3], seed);
  let s = (seed*2654435761)>>>0; const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
  ctx.fillStyle = '#ffb030';
  for (let i=0;i<5;i++) ctx.fillRect((rnd()*14)|0,(rnd()*14)|0,2,2);
  ctx.fillStyle = '#ffe070';
  for (let i=0;i<3;i++) ctx.fillRect((rnd()*15)|0,(rnd()*15)|0,1,1);
  ctx.fillStyle = '#6a1404';
  ctx.fillRect(0, (frame*3)%16, 16, 1);
}
function redrawFireTex(frame) {
  const ctx = TEX.fire.getContext('2d');
  ctx.clearRect(0,0,16,16);
  const j = (frame % 3) - 1; // лёгкое колебание языков
  const layer = (color, pts) => { ctx.fillStyle = color; for (const [gx,gy,w,h] of pts) ctx.fillRect(gx+ (Math.abs(gy-16)<8?j:0),gy,w,h); };
  layer('#d8400e', [[3,9,10,7],[4,6,8,4],[6,3,4,4],[7,1,2,3]]);
  layer('#ff8a20', [[5,10,6,6],[5,7,6,3],[6,4,4,3],[7,2,2,2]]);
  layer('#ffd24a', [[6,11,4,5],[7,8,2,3],[7,5,2,2]]);
  layer('#fff0a0', [[7,12,2,3]]);
}

function setShadows(on) {
  SHADOWS_ON = on;
  localStorage.setItem('minicraft_shadows', on ? '1' : '0');
  renderer.shadowMap.enabled = on;
  sun.castShadow = on;
  // компенсируем яркость: с тенями солнце сильнее, амбиент слабее
  sun.intensity = (on ? 0.9 : 0.85) * LIGHT_SCALE;
  ambient.intensity = (on ? 0.5 : 0.55) * LIGHT_SCALE;
  // пометить все материалы на пересборку теней
  scene.traverse(o => { if (o.material) { if (Array.isArray(o.material)) o.material.forEach(m=>m.needsUpdate=true); else o.material.needsUpdate=true; } });
  for (const c of World.chunks.values()) c.dirty = true; // перестроить меши с тенями
  shadowNeedsUpdate = true;
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Подсветка выделенного блока
const highlight = new THREE.LineSegments(
  new THREE.EdgesGeometry(new THREE.BoxGeometry(1.001, 1.001, 1.001)),
  new THREE.LineBasicMaterial({ color: 0x000000, linewidth: 2, transparent: true, opacity: 0.5 })
);
highlight.visible = false;
scene.add(highlight);

// Оверлей трещин (немного больше блока, чтобы не было z-fighting)
const breakOverlay = new THREE.Mesh(
  new THREE.BoxGeometry(1.002, 1.002, 1.002),
  new THREE.MeshBasicMaterial({
    map: CRACK_TEX[0],
    transparent: true,
    polygonOffset: true,
    polygonOffsetFactor: -1,
    polygonOffsetUnits: -1,
    depthWrite: false,
  })
);
breakOverlay.visible = false;
scene.add(breakOverlay);

