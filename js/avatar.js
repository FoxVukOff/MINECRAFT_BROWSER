/* ============================================================
   MiniCraft — avatar · F5-перспектива (1-е/3-е лицо), модель
   игрока (Стив), броня на модели, предметы в обеих руках,
   рука с предметом от 1-го лица (viewmodel)
   ============================================================ */

'use strict';

// режим камеры: 0 — 1-е лицо, 1 — 3-е лицо (за спиной), 2 — 3-е (спереди)
let camMode = 0;

// --- материалы Стива (ленивые, 16x16 текстуры как у мобов) ---
const AVATAR_MAT = {};
function buildAvatarMaterials() {
  if (AVATAR_MAT.ready) return;
  AVATAR_MAT.skin  = mobTex(makeTex(ctx => { noiseFill(ctx, 0xc79763, 10); }));
  AVATAR_MAT.shirt = mobTex(makeTex(ctx => { noiseFill(ctx, 0x00a8a0, 12); }));
  AVATAR_MAT.pants = mobTex(makeTex(ctx => { noiseFill(ctx, 0x3d3d96, 12); }));
  AVATAR_MAT.shoes = mobTex(makeTex(ctx => { noiseFill(ctx, 0x6b6b6b, 10); }));
  AVATAR_MAT.hair  = mobTex(makeTex(ctx => { noiseFill(ctx, 0x3a2a1a, 8); }));
  AVATAR_MAT.ready = true;
}

// цвет брони по материалу (для накладок на модели игрока)
function armorColorOf(id) {
  if (id == null) return null;
  if (id >= ITEM.LEATHER_HELMET && id <= ITEM.LEATHER_BOOTS) return 0x8a5a32;
  if (id >= ITEM.COPPER_HELMET && id <= ITEM.COPPER_BOOTS) return 0xd07a40;
  if (id >= ITEM.IRON_HELMET && id <= ITEM.IRON_BOOTS) return 0xd8dce2;
  if (id >= ITEM.DIAMOND_HELMET && id <= ITEM.DIAMOND_BOOTS) return 0x3fd6e0;
  if (id >= ITEM.GOLD_HELMET && id <= ITEM.GOLD_BOOTS) return 0xf0c832;
  if (id >= ITEM.SOUL_BOOTS_I && id <= ITEM.SOUL_BOOTS_III) return 0xd8dce2; // железные с чарами
  return 0x999999;
}

// --- модель игрока (рост 1.8, как хитбокс; ноги 0.675 + тело 0.675 + голова 0.45) ---
let avatar = null;            // THREE.Group — видна только в 3-м лице
let avatarWalkPhase = 0;      // фаза шага (анимация рук/ног)
let avatarSwingT = 0;         // взмах рукой при ударе/установке (0..1)
let _avatarHandSig = '';      // подпись предметов в руках (перестройка при смене)
let _avatarArmorSig = '';     // подпись брони (цвета накладок)

function buildAvatar() {
  buildAvatarMaterials();
  const g = new THREE.Group();
  const box = (w, h, d, mat) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    if (SHADOWS_ON) m.castShadow = true;
    return m;
  };

  // ноги (штаны + ботинки снизу), пивот в бедре
  const legs = [];
  for (const lx of [-0.1575, 0.1575]) {
    const leg = box(0.27, 0.675, 0.27, AVATAR_MAT.pants);
    leg.geometry.translate(0, -0.3375, 0);       // вращение вокруг бедра
    leg.position.set(lx, 0.675, 0);
    g.add(leg); legs.push(leg);
    const shoe = box(0.29, 0.16, 0.31, AVATAR_MAT.shoes);
    shoe.position.set(0, -0.6, 0.02);
    leg.add(shoe);
  }

  // тело (бирюзовая футболка Стива)
  const body = box(0.6, 0.675, 0.33, AVATAR_MAT.shirt);
  body.position.set(0, 1.0125, 0);
  g.add(body);

  // руки: пивот в плече, длина как у ног; кожа (короткий рукав)
  const arms = [];
  for (const ax of [-0.4125, 0.4125]) {
    const arm = box(0.225, 0.675, 0.225, AVATAR_MAT.skin);
    arm.geometry.translate(0, -0.3375, 0);
    arm.position.set(ax, 1.3, 0);
    g.add(arm); arms.push(arm);
  }

  // голова + волосы + глаза + нос (лицо смотрит в +Z, как у мобов)
  const head = new THREE.Group();
  head.add(box(0.45, 0.45, 0.45, AVATAR_MAT.skin));
  const hairTop = box(0.48, 0.14, 0.48, AVATAR_MAT.hair);
  hairTop.position.y = 0.17; head.add(hairTop);
  const hairBack = box(0.48, 0.2, 0.1, AVATAR_MAT.hair);
  hairBack.position.set(0, 0.06, -0.19); head.add(hairBack);
  for (const exx of [-0.09, 0.09]) {
    const eye = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.02),
      new THREE.MeshBasicMaterial({ color: 0xffffff }));
    eye.position.set(exx, 0.03, 0.228); head.add(eye);
    const pupil = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, 0.022),
      new THREE.MeshBasicMaterial({ color: 0x3a2fa8 }));
    pupil.position.set(exx, 0.025, 0.231); head.add(pupil);
  }
  const mouth = box(0.12, 0.04, 0.02, AVATAR_MAT.hair);
  mouth.position.set(0, -0.12, 0.228); head.add(mouth);
  head.position.set(0, 1.575, 0);
  g.add(head);
  g.userData.head = head;

  // --- накладки брони (цвет по материалу; показываются, когда надета) ---
  const armorMesh = (w, h, d) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d),
      new THREE.MeshLambertMaterial({ color: 0xffffff }));
    m.visible = false; if (SHADOWS_ON) m.castShadow = true;
    return m;
  };
  const helmetOv = armorMesh(0.5, 0.2, 0.5); helmetOv.position.y = 0.15; head.add(helmetOv);
  const chestOv  = armorMesh(0.66, 0.56, 0.38); chestOv.position.set(0, 1.05, 0); g.add(chestOv);
  const pantsOv  = armorMesh(0.63, 0.34, 0.36); pantsOv.position.set(0, 0.55, 0); g.add(pantsOv);
  const bootsOvL = armorMesh(0.31, 0.2, 0.33); bootsOvL.position.set(0, -0.58, 0.02); legs[0].add(bootsOvL);
  const bootsOvR = armorMesh(0.31, 0.2, 0.33); bootsOvR.position.set(0, -0.58, 0.02); legs[1].add(bootsOvR);
  g.userData.armorOv = { helmet: helmetOv, chestplate: chestOv, leggings: pantsOv, boots: [bootsOvL, bootsOvR] };

  // --- крепления предметов в руках: ПРАВАЯ рука — активный слот, ЛЕВАЯ — вторая рука ---
  const rightHand = new THREE.Group();
  rightHand.position.set(0.02, -0.62, 0.16); // у кисти, чуть впереди
  arms[1].add(rightHand);                     // arms[1] — правая рука (x>0)
  const leftHand = new THREE.Group();
  leftHand.position.set(-0.02, -0.62, 0.16);
  arms[0].add(leftHand);
  g.userData.hands = { right: rightHand, left: leftHand };

  g.userData.legs = legs;
  g.userData.arms = arms;
  g.visible = false;             // в 1-м лице модель скрыта
  scene.add(g);
  avatar = g;
}

// меш предмета для руки/вьюмодели (блок — кубик, предмет — спрайт)
function handItemMesh(id, scaleBlock, scaleSprite) {
  const m = makeDropMesh(id);
  if (m.geometry.type === 'PlaneGeometry') m.scale.setScalar(scaleSprite);
  else m.scale.setScalar(scaleBlock);
  if (SHADOWS_ON && m.isMesh) m.castShadow = true;
  return m;
}

// перестроить предметы в руках 3-го лица (при смене слота/offhand)
function refreshAvatarHands() {
  if (!avatar) return;
  const { right, left } = avatar.userData.hands;
  for (const h of [right, left]) {
    while (h.children.length) {
      const c = h.children[h.children.length - 1];
      h.remove(c);
      if (c.geometry) c.geometry.dispose();
    }
  }
  const held = activeItem();
  if (held) right.add(handItemMesh(held.id, 1.5, 1.25));
  if (PLAYER.offhand) left.add(handItemMesh(PLAYER.offhand.id, 1.5, 1.25));
}

// накладки брони: видимость + цвет по надетым кускам
function refreshAvatarArmor() {
  if (!avatar) return;
  const ov = avatar.userData.armorOv;
  for (const slot of ['helmet', 'chestplate', 'leggings', 'boots']) {
    const col = armorColorOf(PLAYER.armor[slot] ? PLAYER.armor[slot].id : null);
    const meshes = slot === 'boots' ? ov.boots : [ov[slot]];
    for (const m of meshes) {
      m.visible = col != null;
      if (col != null) m.material.color.setHex(col);
    }
  }
}

// взмах рукой (вызывается при ЛКМ-ударе и ПКМ-установке)
function avatarSwing() { avatarSwingT = 1; }

// ============================================================
//  ВЬЮМОДЕЛЬ от 1-го лица: предмет в правой нижней части экрана
//  (прикреплён к камере; качается при ходьбе, взмах при клике)
// ============================================================
let vm = null;                 // группа на камере
let vmItemId = undefined;      // какой предмет сейчас в руке (undefined — ещё не строили)
let vmBobPhase = 0;

function ensureViewModel() {
  if (vm) return;
  vm = new THREE.Group();
  camera.add(vm);
  scene.add(camera);           // дети камеры рендерятся только если камера в сцене
}

function updateViewModel(dt, moving) {
  ensureViewModel();
  const show = camMode === 0 && gameStarted && overlay.classList.contains('hidden') && !PLAYER.dead;
  vm.visible = show;
  if (!show) { vmItemId = undefined; return; }

  // главный предмет; пусто в руке — берём offhand (как ПКМ в MC)
  const held = activeItem() || PLAYER.offhand;
  const id = held ? held.id : null;
  if (id !== vmItemId) {
    vmItemId = id;
    while (vm.children.length) {
      const c = vm.children[vm.children.length - 1];
      vm.remove(c);
      if (c.geometry) c.geometry.dispose();
    }
    if (id != null) {
      const m = handItemMesh(id, 1.7, 1.6);
      vm.add(m);
    } else {
      // пустая рука: короткий рукав кожи
      buildAvatarMaterials();
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.46), AVATAR_MAT.skin);
      arm.rotation.x = 0.2;
      vm.add(arm);
    }
  }

  // покачивание при ходьбе + взмах
  if (moving) vmBobPhase += dt * 9;
  avatarSwingT = Math.max(0, avatarSwingT - dt * 3.4);
  const sw = Math.sin(avatarSwingT * Math.PI);       // 0→1→0 за взмах
  const bobX = Math.sin(vmBobPhase) * 0.014;
  const bobY = Math.abs(Math.cos(vmBobPhase)) * 0.012;
  vm.position.set(0.44 + bobX, -0.42 + bobY, -0.72);
  vm.rotation.set(-0.25 - sw * 1.0, 0.55 - sw * 0.5, 0.12 + sw * 0.35);
}

// ============================================================
//  Обновление аватара (каждый кадр из mainloop):
//  поза, анимация ходьбы, броня, предметы — при виде от 3-го лица
// ============================================================
function updateAvatar(dt) {
  if (!avatar) buildAvatar();
  const third = camMode > 0;
  avatar.visible = third;
  if (third) {
    avatar.position.set(PLAYER.pos.x, PLAYER.pos.y, PLAYER.pos.z);
    // модель смотрит туда же, куда игрок: у мобов «вперёд» = +Z,
    // взгляд игрока = (-sin yaw, -cos yaw) => поворот на yaw + PI
    avatar.rotation.y = PLAYER.yaw + Math.PI;
    // присед: наклон вперёд + чуть ниже
    const cr = PLAYER.crouching ? 0.28 : 0;
    avatar.rotation.x = cr;
    avatar.position.y += PLAYER.crouching ? -0.08 : 0;

    // анимация ходьбы: ноги и руки в противофазе
    const hspd = Math.hypot(PLAYER.vel.x, PLAYER.vel.z);
    if (hspd > 0.3) avatarWalkPhase += dt * (2.0 + hspd * 1.35);
    const amp = Math.min(0.62, 0.14 + hspd * 0.11);
    const legs = avatar.userData.legs, arms = avatar.userData.arms;
    legs[0].rotation.x = Math.sin(avatarWalkPhase) * amp;
    legs[1].rotation.x = -Math.sin(avatarWalkPhase) * amp;
    // руки: при взмахе правая бьёт вперёд, иначе маховая анимация
    avatarSwingT = Math.max(0, avatarSwingT - dt * 3.4);
    const sw = avatarSwingT > 0 ? Math.sin(avatarSwingT * Math.PI) : 0;
    arms[0].rotation.x = -Math.sin(avatarWalkPhase) * amp * 0.85;
    arms[1].rotation.x = Math.sin(avatarWalkPhase) * amp * 0.85 - sw * 1.5;
    arms[1].rotation.z = -sw * 0.4;

    // броня и предметы: перестройка только при смене
    const aSig = ['helmet','chestplate','leggings','boots'].map(s => PLAYER.armor[s] ? PLAYER.armor[s].id : 0).join(',');
    if (aSig !== _avatarArmorSig) { _avatarArmorSig = aSig; refreshAvatarArmor(); }
    const held = activeItem();
    const hSig = (held ? held.id : 0) + '|' + (PLAYER.offhand ? PLAYER.offhand.id : 0);
    if (hSig !== _avatarHandSig) { _avatarHandSig = hSig; refreshAvatarHands(); }
  } else {
    // в 1-м лице сбрасываем подпись рук (модель скрыта)
    _avatarHandSig = '';
  }
  // вьюмодель от 1-го лица (внутри сама скрывается в 3-м лице)
  const moving = Math.hypot(PLAYER.vel.x, PLAYER.vel.z) > 0.3;
  updateViewModel(dt, moving);
}
