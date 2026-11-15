/* ============================================================
   MiniCraft — worldgen · Шум, генераторы измерений, хранилище мира (World)
   (модуль 3 из 33; строки 1730–2421 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Шум для генерации мира (детерминированный value-noise + сид)
// ============================================================
let WORLD_SEED = 0; // устанавливается при создании/загрузке мира

// Превратить строковый сид в число (как в майнкрафте: число или хеш строки)
function parseSeed(str) {
  if (str == null) return (Math.random() * 2147483647) | 0;
  str = String(str).trim();
  if (str === '') return (Math.random() * 2147483647) | 0;
  // если это просто число — используем его
  if (/^-?\d+$/.test(str)) return parseInt(str, 10) | 0;
  // иначе — хешируем строку
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 2654435761);
    h ^= h >>> 15;
  }
  return h | 0;
}

function hash2(x, z) {
  // целочисленный хеш с полным 32-битным диапазоном (0..1), зависящий от сида
  let h = (x | 0) * 374761393 + (z | 0) * 668265263 + Math.imul(WORLD_SEED, 2246822519);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function smooth(t) { return t * t * (3 - 2 * t); }
function valueNoise(x, z) {
  const xi = Math.floor(x), zi = Math.floor(z);
  const xf = x - xi, zf = z - zi;
  const v00 = hash2(xi, zi), v10 = hash2(xi + 1, zi);
  const v01 = hash2(xi, zi + 1), v11 = hash2(xi + 1, zi + 1);
  const u = smooth(xf), v = smooth(zf);
  return THREE.MathUtils.lerp(
    THREE.MathUtils.lerp(v00, v10, u),
    THREE.MathUtils.lerp(v01, v11, u),
    v
  );
}
// 3D value-noise — для пещер и рудных жил
function hash3i(x, y, z, s) {
  let h = (x | 0) * 73856093 ^ (y | 0) * 19349663 ^ (z | 0) * 83492791 ^ Math.imul(WORLD_SEED + (s | 0), 2654435761);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
function valueNoise3D(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = smooth(xf), v = smooth(yf), w = smooth(zf);
  const c000 = hash3i(xi, yi, zi, 17), c100 = hash3i(xi + 1, yi, zi, 17);
  const c010 = hash3i(xi, yi + 1, zi, 17), c110 = hash3i(xi + 1, yi + 1, zi, 17);
  const c001 = hash3i(xi, yi, zi + 1, 17), c101 = hash3i(xi + 1, yi, zi + 1, 17);
  const c011 = hash3i(xi, yi + 1, zi + 1, 17), c111 = hash3i(xi + 1, yi + 1, zi + 1, 17);
  const x00 = THREE.MathUtils.lerp(c000, c100, u), x10 = THREE.MathUtils.lerp(c010, c110, u);
  const x01 = THREE.MathUtils.lerp(c001, c101, u), x11 = THREE.MathUtils.lerp(c011, c111, u);
  return THREE.MathUtils.lerp(THREE.MathUtils.lerp(x00, x10, v), THREE.MathUtils.lerp(x01, x11, v), w);
}
// Пещеры: сырные полости 3D-шумом (2 октавы). Карвим только глубже 4 блоков
// от поверхности, чтобы не прорезать дно водоёмов (вода не утечёт в пещеру).
function isCave(wx, y, wz, h) {
  if (y < 5 || y > h - 4) return false;
  const n = valueNoise3D(wx * 0.085, y * 0.11, wz * 0.085) * 0.62 +
            valueNoise3D(wx * 0.17 + 31, y * 0.22 + 7, wz * 0.17 + 11) * 0.38;
  return n > 0.635;
}

// Рудные жилы: кластеры на сетке 8×8×8 (как в MC — руда растёт жилами,
// а не россыпью одиночных блоков). Возвращают id руды или 0.
// Y-диапазоны приближены к ванильным (учитывая высоту мира 96 и уровень моря 46).
function oreVeinAt(wx, y, wz) {
  const gx = wx >> 3, gy = y >> 3, gz = wz >> 3;
  const sel = hash3i(gx, gy, gz, 55);          // есть ли жила в этой ячейке
  // вероятности по типам — подбираются так, чтобы суммарная плотность
  // была сопоставима с прежней россыпью, но кластеризована
  let ore = 0;
  if (y >= 5 && y <= 54 && sel < 0.34) ore = BLOCK.COAL_ORE;
  else if (y >= 20 && y <= 50 && sel >= 0.34 && sel < 0.55) ore = BLOCK.COPPER_ORE;
  else if (y >= 2 && y <= 42 && sel >= 0.55 && sel < 0.74) ore = BLOCK.IRON_ORE;
  else if (y >= 1 && y <= 14 && sel >= 0.74 && sel < 0.86) ore = BLOCK.REDSTONE_ORE;
  else if (y >= 1 && y <= 14 && sel >= 0.86 && sel < 0.94) ore = BLOCK.DIAMOND_ORE;
  // золото: в MC (1.18+) — треугольное распределение с пиком у дна (-64..32, пик -16);
  // у нас — y 1..30, большинство жил ниже уровня глубосланца (14) — «на дне», как в MC
  else if (y >= 1 && y <= 30 && sel >= 0.94 && sel < 0.995) ore = BLOCK.GOLD_ORE;
  else return 0;
  // центр и радиус жилы (детерминированные по ячейке)
  const cx = gx * 8 + 1 + hash3i(gx, gy, gz, 101) * 6;
  const cy = gy * 8 + 1 + hash3i(gx, gy, gz, 202) * 6;
  const cz = gz * 8 + 1 + hash3i(gx, gy, gz, 303) * 6;
  const r = 1.5 + hash3i(gx, gy, gz, 404) * 1.3;   // жила ~4–14 блоков
  const dx = wx - cx, dy = y - cy, dz = wz - cz;
  if (dx * dx + dy * dy + dz * dz > r * r) return 0;
  return ore;
}
function terrainHeight(wx, wz) {
  let h = 0, amp = 1, freq = 0.011, sum = 0;
  for (let o = 0; o < 4; o++) {
    h += valueNoise(wx * freq, wz * freq) * amp;
    sum += amp; amp *= 0.5; freq *= 2;
  }
  h /= sum; // 0..1
  // расширенная вариация: впадины уходят ниже уровня моря -> озёра/моря.
  // Рельеф поднят на DEPTH, чтобы снизу осталось много места для глубоких пещер и руд.
  return Math.floor(12 + DEPTH + h * 26); // диапазон ~(12+DEPTH)..(38+DEPTH)
}

// Высота поверхности незерака в Аду (холмы с лавовыми низинами)
function netherHeight(wx, wz) {
  let h = 0, amp = 1, freq = 0.02, sum = 0;
  for (let o = 0; o < 3; o++) {
    h += valueNoise((wx+5000) * freq, (wz+5000) * freq) * amp;
    sum += amp; amp *= 0.5; freq *= 2;
  }
  h /= sum; // 0..1
  // Незерак-острова парят над лавовым океаном; рельеф поднят как и в обычном мире.
  return Math.floor(14 + DEPTH + h * 22);
}

// Нижняя кромка ПОТОЛКА Ада (незерак + бедрок сверху, как в Minecraft).
// Неровная: 86..91, чтобы потолок выглядел грубым, а не плоским.
const NETHER_CEIL_MIN = 86;
function netherCeilBottom(wx, wz) {
  let h = 0, amp = 1, freq = 0.05, sum = 0;
  for (let o = 0; o < 2; o++) {
    h += valueNoise((wx+3300) * freq, (wz+3300) * freq) * amp;
    sum += amp; amp *= 0.5; freq *= 2;
  }
  h /= sum; // 0..1
  return NETHER_CEIL_MIN + Math.floor(h * 5);
}

// 3D-хеш для размещения руды (детерминированно, зависит от сида)
function oreHash(x, y, z) {
  let h = (x | 0) * 73856093 ^ (y | 0) * 19349663 ^ (z | 0) * 83492791 ^ Math.imul(WORLD_SEED, 2654435761);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// отдельный хеш для решений о деревьях (не зависит от рельефного шума)
function treeHash(wx, wz) {
  let h = (wx | 0) * 1597334677 + (wz | 0) * 3812015801 + Math.imul(WORLD_SEED, 22695477);
  h = Math.imul(h ^ (h >>> 15), 2246822519);
  h ^= h >>> 13;
  return (h >>> 0) / 4294967296;
}

// растёт ли дерево в этой колонке (на суше, выше уровня моря, разрежено)
function treeAt(wx, wz) {
  const h = terrainHeight(wx, wz);
  if (h <= SEA_LEVEL + 1) return 0;     // не на пляже/воде
  if (treeHash(wx, wz) > 0.018) return 0; // ~1.8% колонок
  // высота ствола 4..6
  return 4 + Math.floor(treeHash(wx + 99, wz - 99) * 3);
}

// есть ли рядом (в радиусе r) вода/низина у уровня моря — признак «возле озера»
function nearWater(wx, wz, r) {
  for (let dx = -r; dx <= r; dx += 2) for (let dz = -r; dz <= r; dz += 2) {
    if (terrainHeight(wx + dx, wz + dz) <= SEA_LEVEL) return true;
  }
  return false;
}

// Лавовые озёра: детерминированные центры на сетке LAKE_GRID.
// Озеро появляется только на суше ВОЗЛЕ воды (как просил игрок — «каменное озеро с лавой у озера»).
const LAKE_GRID = 56;
function lavaLakeHash(gx, gz) {
  let h = (gx | 0) * 2120969693 ^ (gz | 0) * 3266489917 ^ Math.imul(WORLD_SEED, 374761393);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}
// вернуть центр лавового озера для данной грид-ячейки или null
function lavaLakeCenter(gx, gz) {
  if (lavaLakeHash(gx, gz) > 0.45) return null;            // ~45% грид-ячеек имеют озеро-кандидат
  // джиттер центра внутри ячейки
  const cx = gx * LAKE_GRID + Math.floor(lavaLakeHash(gx + 13, gz + 7) * LAKE_GRID);
  const cz = gz * LAKE_GRID + Math.floor(lavaLakeHash(gx + 31, gz + 91) * LAKE_GRID);
  const baseH = terrainHeight(cx, cz);
  if (baseH <= SEA_LEVEL + 1) return null;                 // центр должен быть на суше
  if (!nearWater(cx, cz, 16)) return null;                 // только ВОЗЛЕ воды
  const radius = 2 + Math.floor(lavaLakeHash(gx + 5, gz + 5) * 3); // 2..4
  return { cx, cz, baseH, radius };
}
// вписать лавовое озеро в чанк (каменная чаша + лава внутри)
function carveLavaLake(blocks, ccx, ccz) {
  const x0 = ccx * CHUNK_SIZE, z0 = ccz * CHUNK_SIZE;
  // перебрать ближние грид-ячейки, чьи озёра могут пересечь этот чанк
  const gminX = Math.floor((x0 - LAKE_GRID) / LAKE_GRID), gmaxX = Math.floor((x0 + CHUNK_SIZE) / LAKE_GRID);
  const gminZ = Math.floor((z0 - LAKE_GRID) / LAKE_GRID), gmaxZ = Math.floor((z0 + CHUNK_SIZE) / LAKE_GRID);
  const setL = (wx, wy, wz, id) => {
    const lx = wx - x0, lz = wz - z0;
    if (lx < 0 || lx >= CHUNK_SIZE || lz < 0 || lz >= CHUNK_SIZE) return;
    if (wy < 0 || wy >= WORLD_HEIGHT) return;
    blocks[idx(lx, wy, lz)] = id;
  };
  for (let gx = gminX; gx <= gmaxX; gx++) for (let gz = gminZ; gz <= gmaxZ; gz++) {
    const lake = lavaLakeCenter(gx, gz);
    if (!lake) continue;
    const { cx, cz, baseH, radius } = lake;
    // top — уровень поверхности земли (верхний блок земли = top-1).
    // Озеро: открытая чаша, лава доходит почти до уровня земли, сверху — ВОЗДУХ.
    const top = baseH;
    const depth = radius + 1;   // глубина чаши
    const R = radius + 1;       // внешний радиус каменной кромки
    const lavaTop = top - 1;    // верхний уровень лавы (вровень с поверхностью земли)
    for (let dx = -R; dx <= R; dx++) for (let dz = -R; dz <= R; dz++) {
      const wx = cx + dx, wz = cz + dz;
      if (wx < x0 || wx >= x0 + CHUNK_SIZE || wz < z0 || wz >= z0 + CHUNK_SIZE) continue;
      const dist = Math.sqrt(dx*dx + dz*dz);
      if (dist > R + 0.5) continue;
      const inside = dist <= radius - 0.2;          // зона лавы
      const rim    = dist > radius - 0.2 && dist <= R + 0.5; // каменный бортик/стенки
      // глубина чаши в этой точке (чем ближе к центру — тем глубже)
      const bowlDepth = Math.max(1, Math.round(depth * (1 - dist / (R + 0.3))));
      const bottom = lavaTop - bowlDepth;           // дно чаши
      for (let y = bottom - 1; y <= top + 1; y++) {
        if (inside) {
          if (y <= bottom - 1) setL(wx, y, wz, BLOCK.STONE);     // каменное дно
          else if (y <= lavaTop) setL(wx, y, wz, BLOCK.LAVA);    // лава
          else setL(wx, y, wz, BLOCK.AIR);                       // открыто сверху
        } else if (rim) {
          // каменный бортик до уровня земли, чуть выше лавы (чтобы лава не вытекала)
          if (y <= top - 1) setL(wx, y, wz, BLOCK.STONE);
          else setL(wx, y, wz, BLOCK.AIR);
        }
      }
    }
  }
}

// ============================================================
//  Хранилище мира (чанки)
// ============================================================
// Каждое измерение хранит свой набор Map'ов состояния.
// ============================================================
//  Чистые генераторы ландшафта (БЕЗ состояния мира) — используются
//  и на главном потоке, и в воркере генерации чанков (WorldGenPool):
//  источник воркера собирается из этих же функций, поэтому чанки
//  гарантированно идентичны в обоих потоках.
// ============================================================
function generateOverworldData(cx, cz) {
    const blocks = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = cx * CHUNK_SIZE + lx;
        const wz = cz * CHUNK_SIZE + lz;
        const h = terrainHeight(wx, wz);
        const underwater = h <= SEA_LEVEL; // эта колонка под/у уровня моря
        // Пляжи/дно: верх рядом с уровнем моря (немного выше и до 3 блоков под водой) — песок
        const beach = (h >= SEA_LEVEL - 3 && h <= SEA_LEVEL + 1);
        for (let y = 0; y < WORLD_HEIGHT; y++) {
          let b = BLOCK.AIR;
          // Самый низ — глубинный камень вместо бедрока (мир продолжается ниже)
          if (y === 0) b = BLOCK.DEEPSLATE;
          else if (y < h - 4) {
            // Ниже DEEPSLATE_LEVEL — глубинный камень, выше — обычный
            b = (y < DEEPSLATE_LEVEL) ? BLOCK.DEEPSLATE : BLOCK.STONE;
            // Пещеры (3D-шум) — вырезаем полости, но не дно водоёмов
            if (isCave(wx, y, wz, h)) {
              b = BLOCK.AIR;
            } else {
              // Руды — ЖИЛАМИ (кластеры на сетке 8³), а не россыпью
              const vein = oreVeinAt(wx, y, wz);
              if (vein) b = vein;
              // Гравий — карманы под землёй (как в Minecraft), небольшими залежами
              else if (oreHash(wx + 8000, y, wz + 8000) < 0.028) b = BLOCK.GRAVEL;
              // Лавовые карманы — очень глубоко (на дне пещер)
              else if (y >= 2 && y <= 6 + DEPTH && oreHash(wx + 3000, y, wz + 3000) < 0.011) b = BLOCK.LAVA;
            }
          }
          else if (y < h - 1) b = beach ? BLOCK.SAND : BLOCK.DIRT; // под верхним слоем тоже песок на пляже
          else if (y < h) {
            // верхний слой
            if (beach) b = BLOCK.SAND;             // берег / дно реки
            else b = underwater ? BLOCK.DIRT : BLOCK.GRASS;
          } else if (y <= SEA_LEVEL) {
            b = BLOCK.WATER; // заливаем впадины водой до уровня моря
          }
          blocks[idx(lx, y, lz)] = b;
        }
      }
    }

    // ---- Лавовые озёра убраны по просьбе игрока (раньше: carveLavaLake) ----

    // ---- Деревья ----
    // Проверяем колонки в расширенной области (±2), чтобы кроны на границе чанков попадали внутрь.
    const x0c = cx * CHUNK_SIZE, z0c = cz * CHUNK_SIZE;
    const setLocal = (wx, wy, wz, id, overwrite) => {
      const llx = wx - x0c, llz = wz - z0c;
      if (llx < 0 || llx >= CHUNK_SIZE || llz < 0 || llz >= CHUNK_SIZE) return;
      if (wy < 0 || wy >= WORLD_HEIGHT) return;
      const cur = blocks[idx(llx, wy, llz)];
      // листву ставим только в воздух; ствол перекрывает листву
      if (!overwrite && cur !== BLOCK.AIR && cur !== BLOCK.LEAVES) return;
      blocks[idx(llx, wy, llz)] = id;
    };
    for (let ox = -2; ox < CHUNK_SIZE + 2; ox++) {
      for (let oz = -2; oz < CHUNK_SIZE + 2; oz++) {
        const wx = x0c + ox, wz = z0c + oz;
        const trunkH = treeAt(wx, wz);
        if (!trunkH) continue;
        const baseY = terrainHeight(wx, wz); // верхний блок земли = baseY-1, ствол с baseY
        // не сажать дерево, если в основании лава/камень озера (внутри чанка)
        {
          const llx = wx - x0c, llz = wz - z0c;
          if (llx >= 0 && llx < CHUNK_SIZE && llz >= 0 && llz < CHUNK_SIZE) {
            const ground = blocks[idx(llx, Math.max(0, baseY - 1), llz)];
            if (ground === BLOCK.LAVA || ground === BLOCK.STONE || ground === BLOCK.AIR) continue;
          }
        }
        const topY = baseY + trunkH - 1;
        // под стволом — земля (как в MC: трава заменяется на dirt)
        setLocal(wx, baseY - 1, wz, BLOCK.DIRT, true);
        // крона: шар листвы вокруг верхушки
        for (let ly = topY - 2; ly <= topY + 1; ly++) {
          const rad = (ly >= topY) ? 1 : 2; // верх уже
          for (let dx = -rad; dx <= rad; dx++)
            for (let dz = -rad; dz <= rad; dz++) {
              if (Math.abs(dx) === rad && Math.abs(dz) === rad && rad === 2 && treeHash(wx+dx, wz+dz) < 0.5) continue; // скруглить углы
              setLocal(wx + dx, ly, wz + dz, BLOCK.LEAVES, false);
            }
        }
        // ствол
        for (let i = 0; i < trunkH; i++) setLocal(wx, baseY + i, wz, BLOCK.WOOD, true);
      }
    }

    return blocks;
}

// --- Генерация Ада: незерак, потолок/пол из бедрока, озёра лавы, светопыль ---
function generateNetherData(cx, cz) {
    const blocks = new Uint8Array(CHUNK_SIZE * WORLD_HEIGHT * CHUNK_SIZE);
    // Ад как в Minecraft: замкнутая полость — снизу бедрок и незерак (deepslate
    // в Незере НЕ генерируется — parity MC), сверху потолок из незерака с бедроком.
    // Внизу НЕГЛУБОКОЕ лавовое море (2-3 блока лавы над каменным дном, как в MC —
    // раньше лава занимала ~38 слоёв, что грузило свет/меширование/симуляцию),
    // над морём — острова незерака, а где шум рельефа высокий — СТЕНЫ/СТОЛБЫ,
    // дорастающие до самого потолка. Светопыль — на потолке и в гроздьях под островами.
    const LAVA_SEA = 20 + DEPTH;        // уровень лавового океана
    const LAVA_BED = LAVA_SEA - 2;      // лава занимает LAVA_BED+1..LAVA_SEA (мелкое море)
    const FLOOR = 6;                    // толщина глубинного дна под лавой
    const CEIL_BEDROCK = WORLD_HEIGHT - 1; // верхний слой — бедрок (как в MC)
    for (let lx = 0; lx < CHUNK_SIZE; lx++) {
      for (let lz = 0; lz < CHUNK_SIZE; lz++) {
        const wx = cx * CHUNK_SIZE + lx, wz = cz * CHUNK_SIZE + lz;
        // карта островов: плотный 2D-шум — где значение высокое, там парит остров
        const island = valueNoise((wx + 700) * 0.045, (wz + 700) * 0.045);
        const surf = netherHeight(wx, wz);          // потенциальная высота вершины острова
        const islandTop = LAVA_SEA + 2 + Math.floor((surf - (14 + DEPTH)) * 0.9);
        const hasIsland = island > 0.56;            // порог появления острова
        // толщина острова растёт к его центру (по величине шума)
        const thickness = hasIsland ? 3 + Math.floor((island - 0.56) * 26) : 0;
        const islandBottom = islandTop - thickness;
        // где шум совсем высокий — остров вырастает в СТЕНУ до потолка
        const isWall = island > 0.64;
        // потолок: незерак от ceilBottom+1 до бедрока
        const ceilBottom = netherCeilBottom(wx, wz);
        for (let y = 0; y < WORLD_HEIGHT; y++) {
          let b = BLOCK.AIR;
          if (y === 0) {
            b = BLOCK.BEDROCK;                       // самый нижний слой Ада — бедрок (неразрушим)
          } else if (y === CEIL_BEDROCK) {
            b = BLOCK.BEDROCK;                       // потолок Ада — бедрок (как в MC)
          } else if (y < FLOOR) {
            // дно под лавой — НЕЗАРАК (parity MC: в Незере нет глубинного камня;
            // в нижних слоях бедрок вперемешку с незераком, как в MC)
            b = oreHash(wx, y + 31000, wz) < 0.45 ? BLOCK.BEDROCK : BLOCK.NETHERRACK;
          } else if (y <= LAVA_BED) {
            b = BLOCK.NETHERRACK;                    // толща дна — незерак (никакого deepslate в Аду)
          } else if (y <= LAVA_SEA) {
            b = BLOCK.LAVA;                          // мелкое лавовое море (2-3 слоя)
          } else if (y > ceilBottom) {
            b = BLOCK.NETHERRACK;                    // свод потолка
          }
          // парящий остров из незерака
          if (hasIsland && y >= islandBottom && y <= islandTop && y > FLOOR && y <= LAVA_SEA + 30) {
            b = BLOCK.NETHERRACK;
          }
          // стена/столб: остров дорастает до потолка (незерак от islandTop до потолка)
          if (isWall && y > islandTop && y <= ceilBottom && y > LAVA_SEA) {
            b = BLOCK.NETHERRACK;
          }
          blocks[idx(lx, y, lz)] = b;
        }
        // пещеры/пустоты в толще островов и стен (3D-шум)
        for (let y = FLOOR + 1; y < WORLD_HEIGHT - 2; y++) {
          if (blocks[idx(lx, y, lz)] === BLOCK.NETHERRACK && oreHash(wx + 13000, y, wz + 13000) < 0.08 && y > LAVA_SEA + 2 && y < NETHER_CEIL_MIN - 2) {
            blocks[idx(lx, y, lz)] = BLOCK.AIR;
          }
        }
        // Незерская золотая руда (parity MC): россыпь по незераку островов/стен/свода —
        // щедро, как в MC (руда дешёвая: дропает самородки, а не блок)
        for (let y = LAVA_SEA + 1; y < NETHER_CEIL_MIN - 2; y++) {
          if (blocks[idx(lx, y, lz)] === BLOCK.NETHERRACK && oreHash(wx + 51000, y, wz + 51000) < 0.014) {
            blocks[idx(lx, y, lz)] = BLOCK.NETHER_GOLD_ORE;
          }
        }
        // СВЕТОКАМЕНЬ — только ГРОЗДЯМИ-СГУСТКАМИ на потолке (как в MC): редкие
        // кластеры, приросшие к нижней кромке свода и свисающие вниз. Россыпь
        // одиночных блоков по островам/стенам/своду убрана — раньше светокамень
        // был «повсюду», теперь — редкие красивые грозди на потолках.
        {
          const CELL = 6; // гнездовая ячейка грозди (6×6 колонок)
          const gx = Math.floor(wx / CELL), gz = Math.floor(wz / CELL);
          if (oreHash(gx + 41000, 5, gz + 41000) < 0.055) { // ~5.5% ячеек растят гроздь
            // центр грозди — внутри ячейки (детерминированный)
            const ccx = gx * CELL + 1 + (oreHash(gx + 42000, 6, gz + 42000) * (CELL - 2) | 0);
            const ccz = gz * CELL + 1 + (oreHash(gx + 43000, 7, gz + 43000) * (CELL - 2) | 0);
            const dx = wx - ccx, dz = wz - ccz;
            const R = 1.15 + oreHash(ccx + 44000, 8, ccz + 44000) * 1.35; // радиус 1.15..2.5
            const d2 = dx * dx + dz * dz;
            if (d2 <= R * R) {
              // в центре гроздь свисает глубже, по краю — один блок кромки
              const t = 1 - Math.sqrt(d2) / R;
              const hang = 1 + Math.round(t * 2.6 + oreHash(wx + 45000, 9, wz + 45000) * 0.8);
              for (let k = 0; k < hang; k++) {
                const yy = ceilBottom + 1 - k; // от нижнего слоя свода — вниз
                if (yy > LAVA_SEA && yy < WORLD_HEIGHT - 1) blocks[idx(lx, yy, lz)] = BLOCK.GLOWSTONE;
              }
            }
          }
        }
        // светящиеся «сталактиты» снизу островов: РЕДКИЕ подвесные грозди светопыли
        if (hasIsland && islandBottom > LAVA_SEA + 1) {
          if (oreHash(wx + 17000, islandBottom, wz + 17000) < 0.035) {
            const hang = 1 + (oreHash(wx + 19000, 0, wz + 19000) * 2 | 0);
            for (let k = 1; k <= hang; k++) {
              const yy = islandBottom - k;
              if (yy > LAVA_SEA) blocks[idx(lx, yy, lz)] = BLOCK.GLOWSTONE;
            }
          }
        }
      }
    }
    return blocks;
}

// единая точка входа генерации (какой мир — такой генератор)
function generateChunkData(cx, cz, dim) {
  return dim === 'nether' ? generateNetherData(cx, cz) : generateOverworldData(cx, cz);
}

function makeDimStore() {
  return {
    chunks: new Map(),       // "cx,cz" -> { blocks:Uint8Array, mesh, dirty }
    edits: new Map(),        // "x,y,z" -> blockId
    waterLevel: new Map(),   // "x,y,z" -> уровень жидкости
    doorState: new Map(),
    furnaces: new Map(),
    chests: new Map(),
    doubleChests: new Map(),
    facing: new Map(),
    entMobs: [],             // снимок мобов измерения (когда оно не активно/при сохранении)
    entDrops: [],            // снимок выпавших предметов
    entBoats: [],            // снимок лодок измерения
    portals: [],             // [{x,y,z}] — координаты активных порталов (для связывания/мультипорталов)
    levers: new Map(),       // "x,y,z" -> {on:bool, facing} — состояние рычагов
    buttons: new Map(),      // "x,y,z" -> {pressed:bool, timer:sec, facing}
    pistons: new Set(),      // "x,y,z" выдвинутых поршней
    cmdBlocks: new Map(),    // "x,y,z" -> {cmd:string, always:bool} — командные блоки
    // индекс ИСТОЧНИКОВ света (факелы и пр.): "x,y,z" -> уровень 0..15.
    // Нужен, чтобы свет факела из соседнего чанка заходил в наш чанк
    // дальше, чем 2-блочный бордюр световой сетки.
    lightEmitters: new Map(),
  };
}

const World = {
  // активные ссылки (переключаются вместе с измерением)
  chunks: null, edits: null, waterLevel: null, doorState: null,
  furnaces: null, chests: null, doubleChests: null, facing: null, portals: null,
  lightEmitters: null,               // индекс источников света активного измерения
  cmdBlocks: null,                   // командные блоки активного измерения
  dim: 'overworld',                 // текущее измерение
  dims: { overworld: makeDimStore(), nether: makeDimStore() },

  // переключить активное измерение (меняет ссылки на Map'ы)
  setDimension(name) {
    if (!this.dims[name]) { console.warn('Неизвестное измерение:', name); return; }
    this.dim = name;
    const s = this.dims[name];
    this.chunks = s.chunks; this.edits = s.edits; this.waterLevel = s.waterLevel;
    this.doorState = s.doorState; this.furnaces = s.furnaces; this.chests = s.chests;
    this.doubleChests = s.doubleChests; this.facing = s.facing;
    this.portals = s.portals; this.lightEmitters = s.lightEmitters;
    this.cmdBlocks = s.cmdBlocks;
    this._lastChunk = null; // мемо-чанк принадлежал старому измерению
  },

  key(cx, cz) { return cx + ',' + cz; },
  ekey(x, y, z) { return x + ',' + y + ',' + z; },

  // Уровень жидкости в ячейке: вода — источник=8/течение=1..7; лава — источник=4/течение=1..3; нет=0
  getLevel(x, y, z) {
    const b = this.getBlock(x, y, z);
    if (b === BLOCK.LAVA) return LAVA_MAX;
    if (b === BLOCK.LAVA_FLOW) return this.waterLevel.get(this.ekey(x, y, z)) || 1;
    if (b === BLOCK.WATER) return WATER_MAX;
    if (b === BLOCK.WATER_FLOW) return this.waterLevel.get(this.ekey(x, y, z)) || 1;
    return 0;
  },
  setLevel(x, y, z, lvl) {
    this.waterLevel.set(this.ekey(x, y, z), lvl);
  },
  clearLevel(x, y, z) {
    this.waterLevel.delete(this.ekey(x, y, z));
  },

  generateChunk(cx, cz) {
    // тонкая обёртка: сама генерация — в чистых функциях выше (их же
    // использует воркер WorldGenPool, см. «Пул воркеров генерации чанков»)
    return { blocks: generateChunkData(cx, cz, this.dim), mesh: null, dirty: true, cx, cz };
  },


  getChunk(cx, cz) {
    const k = this.key(cx, cz);
    let c = this.chunks.get(k);
    if (!c) {
      c = this.generateChunk(cx, cz);
      // применить сохранённые правки
      this.chunks.set(k, c);
      this.applyEditsToChunk(c);
      this._lastChunk = null; // новый чанк мог заменить мемо-ссылку
    }
    return c;
  },

  applyEditsToChunk(c) {
    if (this.edits.size === 0) return;
    // один проход по сохранённым правкам (их обычно намного меньше, чем блоков в чанке) —
    // вместо O(24 576) строковых ключей на каждый загружаемый чанк
    const x0 = c.cx * CHUNK_SIZE, z0 = c.cz * CHUNK_SIZE;
    const x1 = x0 + CHUNK_SIZE - 1, z1 = z0 + CHUNK_SIZE - 1;
    for (const [ek, v] of this.edits) {
      const i1 = ek.indexOf(',');
      const i2 = ek.indexOf(',', i1 + 1);
      const ex = +ek.slice(0, i1), ey = +ek.slice(i1 + 1, i2), ez = +ek.slice(i2 + 1);
      if (ex < x0 || ex > x1 || ez < z0 || ez > z1) continue;
      if (ey < 0 || ey >= WORLD_HEIGHT) continue;
      c.blocks[idx(ex - x0, ey, ez - z0)] = v;
    }
  },

  getBlock(wx, wy, wz) {
    if (wy < 0 || wy >= WORLD_HEIGHT) return BLOCK.AIR;
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    // мемо последнего чанка: 90%+ обращений — к одному и тому же чанку
    // (мешер/свет/симуляции опрашивают соседей пачками) — убираем строковый ключ+Map.get
    let c = this._lastChunk;
    if (!c || c.cx !== cx || c.cz !== cz) {
      c = this.getChunk(cx, cz);
      this._lastChunk = c;
    }
    const lx = wx - cx * CHUNK_SIZE;
    const lz = wz - cz * CHUNK_SIZE;
    return c.blocks[idx(lx, wy, lz)];
  },

  // «Мягкое» чтение: как getBlock, но НЕ генерирует отсутствующий чанк —
  // возвращает AIR. Нужно мешбилдеру/освечению на краю прогрузки: они не должны
  // провоцировать синхронную генерацию (иначе — фризы). Когда чанк приедет из
  // воркера, соседние чанки помечаются dirty и пересобираются — швы затягиваются.
  getBlockSoft(wx, wy, wz) {
    if (wy < 0 || wy >= WORLD_HEIGHT) return BLOCK.AIR;
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    let c = this._lastChunk;
    if (!c || c.cx !== cx || c.cz !== cz) {
      c = this.chunks.get(this.key(cx, cz)); // только уже существующие
      if (!c) return BLOCK.AIR;
    }
    const lx = wx - cx * CHUNK_SIZE;
    const lz = wz - cz * CHUNK_SIZE;
    return c.blocks[idx(lx, wy, lz)];
  },

  // transient=true: изменение от симуляции воды, его не сохраняем как правку игрока
  setBlock(wx, wy, wz, id, transient = false) {
    if (wy < 0 || wy >= WORLD_HEIGHT) return;
    const cx = Math.floor(wx / CHUNK_SIZE);
    const cz = Math.floor(wz / CHUNK_SIZE);
    const c = this.getChunk(cx, cz);
    const lx = wx - cx * CHUNK_SIZE;
    const lz = wz - cz * CHUNK_SIZE;
    c.blocks[idx(lx, wy, lz)] = id;
    c.dirty = true;
    // индекс источников света: добавляем/убираем эмиттер при установке блока
    {
      const ek = this.ekey(wx, wy, wz);
      const em = lightEmission(id);
      if (em > 0) this.lightEmitters.set(ek, em);
      else if (this.lightEmitters.has(ek)) this.lightEmitters.delete(ek);
    }
    if (!transient) { this.edits.set(this.ekey(wx, wy, wz), id); if (typeof requestSave === 'function') requestSave(); }
    // уровень храним только для течения (вода/лава); иначе чистим
    if (id !== BLOCK.WATER_FLOW && id !== BLOCK.LAVA_FLOW) this.clearLevel(wx, wy, wz);
    // воздух — сбросить ориентацию
    if (id === BLOCK.AIR) this.facing.delete(this.ekey(wx, wy, wz));

    // пометить соседние чанки dirty если на границе (включая диагонали —
    // иначе свет/меши в угловых соседях остаются устаревшими)
    if (lx === 0) { this.markDirty(cx - 1, cz); if (lz === 0) this.markDirty(cx - 1, cz - 1); else if (lz === CHUNK_SIZE - 1) this.markDirty(cx - 1, cz + 1); }
    if (lx === CHUNK_SIZE - 1) { this.markDirty(cx + 1, cz); if (lz === 0) this.markDirty(cx + 1, cz - 1); else if (lz === CHUNK_SIZE - 1) this.markDirty(cx + 1, cz + 1); }
    if (lz === 0) this.markDirty(cx, cz - 1);
    if (lz === CHUNK_SIZE - 1) this.markDirty(cx, cz + 1);
  },

  markDirty(cx, cz) {
    const c = this.chunks.get(this.key(cx, cz));
    if (c) c.dirty = true;
  },

  // Выгрузка дальних чанков из памяти (эвикция): данные чанков детерминированы
  // сидом + правками игрока, поэтому их можно выгружать и регенерировать при возврате.
  // Без этого длинное путешествие съедало ~245 КБ на каждый чанк навсегда.
  evictFarChunks(pcx, pcz) {
    const limit = RENDER_DISTANCE + 4;
    for (const [k, c] of this.chunks) {
      if (Math.abs(c.cx - pcx) > limit || Math.abs(c.cz - pcz) > limit) {
        if (c.dirty) continue; // грязные не выгружаем — пусть сначала перестроятся
        this.chunks.delete(k);
        if (this._lastChunk === c) this._lastChunk = null;
      }
    }
  },
};
World.setDimension('overworld'); // инициализировать активные ссылки на Map'ы

function idx(x, y, z) {
  return y * CHUNK_SIZE * CHUNK_SIZE + z * CHUNK_SIZE + x;
}

// открыта ли дверь в данной ячейке (учитывая, что состояние хранится по нижней половине)
function isDoorOpen(x, y, z) {
  const b = World.getBlock(x, y, z);
  if (!isDoor(b)) return false;
  const by = (b === BLOCK.DOOR_TOP) ? y - 1 : y;
  const st = World.doorState.get(World.ekey(x, by, z));
  return !!(st && st.open);
}

// Тонкая AABB двери в локальных координатах [0..1] -> {x1,x2,z1,z2}.
// «front» — куда смотрит лицевая сторона; закрытая дверь — тонкая панель у стороны back,
// открытая — повёрнута на 90° вокруг петли (hinge). thickness ~0.19.
// hinge: 'left'|'right' — с какой стороны (если смотреть со стороны front) находится петля.
function doorHinge(x, y, z) {
  const b = World.getBlock(x, y, z);
  if (!isDoor(b)) return 'left';
  const by = (b === BLOCK.DOOR_TOP) ? y - 1 : y;
  const st = World.doorState.get(World.ekey(x, by, z));
  return (st && st.hinge) ? st.hinge : 'left';
}
function doorAABB(x, y, z) {
  const TH = 0.19;
  const open = isDoorOpen(x, y, z);
  const front = World.facing.get(World.ekey(x, y, z));
  const hinge = doorHinge(x, y, z);
  // ось front и его знак
  let frontAxis, frontSide;
  if (front === FACE_PX) { frontAxis='x'; frontSide=1; }
  else if (front === FACE_NX) { frontAxis='x'; frontSide=-1; }
  else if (front === FACE_PZ) { frontAxis='z'; frontSide=1; }
  else { frontAxis='z'; frontSide=-1; } // FACE_NZ или undefined -> -Z

  if (!open) {
    // Закрытая: тонкая панель в плоскости стены (перпендикулярно проходу),
    // прижата к лицевой стороне front. Полностью перекрывает проём по другой оси.
    if (frontAxis === 'z') {
      const z = (frontSide > 0) ? { z1: 1 - TH, z2: 1 } : { z1: 0, z2: TH };
      return { x1: 0, x2: 1, z1: z.z1, z2: z.z2 };
    } else {
      const x1 = (frontSide > 0) ? 1 - TH : 0;
      const x2 = (frontSide > 0) ? 1 : TH;
      return { x1, x2, z1: 0, z2: 1 };
    }
  } else {
    // Открытая: поворот на 90° вокруг петли. Панель уходит вдоль оси front,
    // прижата к стороне петли (боковой край ячейки) -> проём свободен.
    if (frontAxis === 'z') {
      // ось прохода — Z; петля на X-краю. left/right относительно взгляда вдоль front.
      // при front=+Z (смотрим в +Z): right=+X, left=-X (право от наблюдателя)
      const onPlusX = (frontSide > 0) ? (hinge === 'right') : (hinge === 'left');
      const x1 = onPlusX ? 1 - TH : 0;
      const x2 = onPlusX ? 1 : TH;
      return { x1, x2, z1: 0, z2: 1 };
    } else {
      // ось прохода — X; петля на Z-краю.
      const onPlusZ = (frontSide > 0) ? (hinge === 'left') : (hinge === 'right');
      const z1 = onPlusZ ? 1 - TH : 0;
      const z2 = onPlusZ ? 1 : TH;
      return { x1: 0, x2: 1, z1, z2 };
    }
  }
}

