/* ============================================================
   MiniCraft — mesher · Меширование чанков, ориентация блоков, цикл дня/ночи
   (модуль 6 из 33; строки 2906–3080 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Меширование чанков (объединённая геометрия, только видимые грани)
// ============================================================
// Грани: dir vector + 4 угла (CCW при взгляде снаружи) + uv + материал-индекс
// Порядок углов: [нижн-лев, нижн-прав, верх-прав, верх-лев] относительно грани.
// Индексы: 0,1,2, 0,2,3 — даёт корректную (против часовой) намотку наружу.
const FACES = [
  { dir: [ 1, 0, 0], mat: 0, // +X (смотрим с +X в сторону -X)
    corners: [[1,0,1],[1,0,0],[1,1,0],[1,1,1]] },
  { dir: [-1, 0, 0], mat: 1, // -X
    corners: [[0,0,0],[0,0,1],[0,1,1],[0,1,0]] },
  { dir: [ 0, 1, 0], mat: 2, // +Y (верх)
    corners: [[0,1,1],[1,1,1],[1,1,0],[0,1,0]] },
  { dir: [ 0,-1, 0], mat: 3, // -Y (низ)
    corners: [[0,0,0],[1,0,0],[1,0,1],[0,0,1]] },
  { dir: [ 0, 0, 1], mat: 4, // +Z
    corners: [[0,0,1],[1,0,1],[1,1,1],[0,1,1]] },
  { dir: [ 0, 0,-1], mat: 5, // -Z
    corners: [[1,0,0],[0,0,0],[0,1,0],[1,1,0]] },
];
// Тангенс-смещения к каждому углу грани (для сглаженного освещения):
// по двум осям, касательным грани, в сторону данного угла (±1).
// SMOOTH_T[faceIndex][cornerIndex] = [t1x,t1y,t1z, t2x,t2y,t2z]
const SMOOTH_T = FACES.map(f => {
  const ax = [];
  for (let a = 0; a < 3; a++) if (f.dir[a] === 0) ax.push(a);
  return f.corners.map(cv => {
    const t1 = [0, 0, 0], t2 = [0, 0, 0];
    t1[ax[0]] = cv[ax[0]] === 1 ? 1 : -1;
    t2[ax[1]] = cv[ax[1]] === 1 ? 1 : -1;
    return [t1[0], t1[1], t1[2], t2[0], t2[1], t2[2]];
  });
});
const _cornerOut = [0, 0, 0]; // переиспользуемый буфер углового света

// ============================================================
//  Ориентация блоков (facing)
// ============================================================
// Ориентация = индекс грани (в системе FACES.mat: 0:+X 1:-X 2:+Y 3:-Y 4:+Z 5:-Z),
// на которую смотрит "перед" блока. По умолчанию перед = +Z (mat 4).
// Для каждого индекса задаём перестановку материалов:
//   newMat[physicalFace] = baseMat[ откуда взять текстуру ]
// Так "передняя" текстура (baseMat[4]) оказывается на нужной физической грани.
const FACE_PX=0, FACE_NX=1, FACE_PY=2, FACE_NY=3, FACE_PZ=4, FACE_NZ=5;

// Перестановки для 6 направлений "переда". perm[phys] = индекс исходной грани.
// Базовые грани: top=2(+Y) bottom=3(-Y) front=4(+Z) back=5(-Z) right=0(+X) left=1(-X)
const ORIENT_PERM = {
  // перед смотрит на +Z (по умолчанию) — без изменений
  [FACE_PZ]: [0,1,2,3,4,5],
  // перед смотрит на -Z: поворот на 180° вокруг Y -> меняем +X<->-X и +Z<->-Z
  [FACE_NZ]: [1,0,2,3,5,4],
  // перед на +X: поворот на -90° вокруг Y. front(+Z)->+X
  [FACE_PX]: [4,5,2,3,1,0],
  // перед на -X: поворот на +90° вокруг Y. front(+Z)->-X
  [FACE_NX]: [5,4,2,3,0,1],
  // перед вверх (+Y): наклон. front(+Z)->+Y, top(+Y)->-Z и т.д.
  [FACE_PY]: [0,1,4,5,3,2],
  // перед вниз (-Y)
  [FACE_NY]: [0,1,5,4,2,3],
};

// Перестановки для брёвен: ось определяется значением front (FACE_PX=ось X, FACE_PY=ось Y, FACE_PZ=ось Z)
const LOG_PERM = {
  [FACE_PY]: [0,1,2,3,4,5],   // ось Y (вертикально) — по умолчанию
  [FACE_PX]: [2,3,0,1,4,5],   // ось X — кольца на ±X
  [FACE_PZ]: [0,1,4,5,2,3],   // ось Z — кольца на ±Z
};

// Повернуть произвольный массив материалов по ориентации front (универсальный куб)
function orientedMaterialsFrom(base, front, isLog) {
  if (front === undefined) return base;
  const perm = isLog ? (LOG_PERM[front] || LOG_PERM[FACE_PY]) : ORIENT_PERM[front];
  if (!perm) return base;
  return [base[perm[0]], base[perm[1]], base[perm[2]], base[perm[3]], base[perm[4]], base[perm[5]]];
}
// Повёрнутый массив материалов для блока id и ориентации front
function orientedMaterials(id, front) {
  return orientedMaterialsFrom(MATERIALS[id], front, id === BLOCK.WOOD);
}

// Какие блоки ориентируемые и как.
// 'log' — ориентируется по оси (вертикально/горизонтально), 'horizontal' — только 4 стороны,
// 'full' — по любой из 6 граней, 'none' — изотропный блок, ориентация не пишется
// (фикс: раньше «full» применялся ко всем блокам, и трава, поставленная взглядом вниз,
// теряла травяной верх — теперь изотропные блоки не ориентируются вовсе).
function orientKind(id) {
  if (id === BLOCK.WOOD) return 'log';
  if (id === BLOCK.FURNACE || id === BLOCK.CHEST || id === BLOCK.CRAFTING_TABLE || id === BLOCK.COMMAND_BLOCK) return 'horizontal';
  if (id === BLOCK.PISTON || id === BLOCK.PISTON_HEAD) return 'full';
  return 'none';
}

// Вычислить ориентацию-перед при установке, исходя из направления взгляда игрока
// и грани, на которую кликнули. dir — вектор взгляда (нормализован не обязательно).
function computePlaceFront(id, lookDir) {
  const kind = orientKind(id);
  if (kind === 'none') return undefined; // изотропные блоки не ориентируются
  const ax = Math.abs(lookDir.x), ay = Math.abs(lookDir.y), az = Math.abs(lookDir.z);

  if (kind === 'log') {
    // бревно ориентируется вдоль оси взгляда (доминирующая ось)
    if (ay >= ax && ay >= az) return FACE_PY;        // вертикально (ось Y)
    if (ax >= az) return FACE_PX;                     // ось X
    return FACE_PZ;                                   // ось Z
  }

  if (kind === 'horizontal') {
    // только горизонтальный «перед» — к игроку (противоположно взгляду)
    if (ax >= az) return lookDir.x > 0 ? FACE_NX : FACE_PX;
    return lookDir.z > 0 ? FACE_NZ : FACE_PZ;
  }

  // full: перед направлен противоположно взгляду (грань «к игроку»)
  if (ay >= ax && ay >= az) return lookDir.y > 0 ? FACE_NY : FACE_PY;
  if (ax >= az) return lookDir.x > 0 ? FACE_NX : FACE_PX;
  return lookDir.z > 0 ? FACE_NZ : FACE_PZ;
}

// поверхность воды в ячейке (0..1) с учётом уровня; полная если сверху вода
function waterSurface(x, y, z) {
  const b = World.getBlock(x, y, z);
  if (!isWaterLiquid(b)) return 0;
  if (isWaterLiquid(World.getBlock(x, y + 1, z))) return 1;
  const lvl = World.getLevel(x, y, z);
  return 0.12 + (lvl / WATER_MAX) * 0.86;
}
// поверхность любой жидкости (вода или лава) в ячейке (0..1)
function liquidSurface(x, y, z) {
  const b = World.getBlock(x, y, z);
  if (!isLiquid(b)) return 0;
  const lava = isLavaLiquid(b);
  const above = World.getBlock(x, y + 1, z);
  const sameAbove = lava ? isLavaLiquid(above) : isWaterLiquid(above);
  if (sameAbove) return 1;
  const lvl = World.getLevel(x, y, z);
  const mx = lava ? LAVA_MAX : WATER_MAX;
  return lava ? (0.25 + (lvl / mx) * 0.7) : (0.12 + (lvl / mx) * 0.86);
}

// какие блоки вообще могут иметь ориентацию (для пропуска лишних строковых ключей в мешере).
// Сокращено до реально визуально-ориентируемых — устраняет десятки тысяч
// строковых аллокаций за ребилд чанка (трава/руда/земля ориентацию не имеют).
const CAN_ORIENT = {};
[BLOCK.WOOD, BLOCK.FURNACE, BLOCK.CHEST, BLOCK.CRAFTING_TABLE,
 BLOCK.PISTON, BLOCK.PISTON_HEAD].forEach(b => CAN_ORIENT[b] = true);

// ============================================================
//  Цикл день/ночь
// ============================================================
const DAY = {
  time: 0.30,          // 0..1 по кругу суток (0.25 = рассвет, 0.5 = полдень... условно)
  length: 600,         // секунд на полные сутки (10 минут)
};
// солнечная освещённость 0..1 по времени суток (плавный day/night)
function daylight() {
  // солнце над горизонтом примерно с 0.0 до 0.5 цикла
  const a = Math.sin(DAY.time * Math.PI * 2 - Math.PI / 2) * 0.5 + 0.5; // 0..1
  return a;
}
// фактор небесного света 0..1 (ночь ~0.27 = уровень 4/15, день 1 = 15/15)
function skyFactor() {
  return Math.min(1, (4 + daylight() * 11) / 15);
}
function updateDayNight(dt) {
  if (World.dim === 'overworld') {
    DAY.time = (DAY.time + dt / DAY.length) % 1; // в Аду суток нет
    timeSinceRest += dt;                          // счётчик бессонницы (для фантомов)
  }
  // День/ночь теперь меняет ОДИН юниформ на GPU — чанки перестраивать не нужно.
  // (Раньше каждый «щелчок» уровня неба перестраивал ВСЕ чанки — постоянные лаги
  // на рассвете/закате + ступенчатое затемнение.)
  DAY_LIGHT_UNIFORM.value = skyFactor();
}

