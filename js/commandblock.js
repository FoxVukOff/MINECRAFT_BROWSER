/* ============================================================
   MiniCraft — commandblock · Командный блок
   (модуль 24 из 33; строки 9733–9896 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Командный блок (ранний прототип, как в MC)
//  — ставится только из креатива//give; в выживании неразрушим
//  — ПКМ — ввести команду (без слэша), флаг «Всегда активен»
//  — выполняется по ФРОНТУ редстоун-сигнала (рычаг/кнопка/пыль рядом)
//  — цель команды: @p/@s/@a/@e/@r или ник (см. isTargetToken)
// ============================================================
function isCmdBlockPowered(wx, y, wz) {
  // питание от своей клетки или от соседей (как у поршня)
  if (redstonePowerAt(wx, y, wz) > 0 || sourcePowerAt(wx, y, wz) > 0) return true;
  const neigh = [[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
  for (const d of neigh) {
    const nx = wx + d[0], ny = y + d[1], nz = wz + d[2];
    if (redstonePowerAt(nx, ny, nz) > 0 || sourcePowerAt(nx, ny, nz) > 0) return true;
  }
  return false;
}

// выполнить команду командного блока
function executeCmdBlock(wx, y, wz, st) {
  const cmd = (st && st.cmd || '').trim();
  if (!cmd) {
    addChatMessage('[КБ ' + wx + ',' + y + ',' + wz + '] Команда не задана (ПКМ по блоку)', 'chat-sys');
    return;
  }
  playSound('click');
  addChatMessage('[КБ ' + wx + ',' + y + ',' + wz + '] Выполняю: /' + cmd, 'chat-sys');
  handleChatCommand('/' + cmd.replace(/^\/+/, ''), { fromCmdBlock: true, pos: { x: wx, y, z: wz } });
}

// тикер командных блоков: срабатывание по фронту сигнала (как updatePistons,
// проходит только по чанкам в области пересчёта редстоуна)
function updateCommandBlocks(minX, maxX, minZ, maxZ) {
  if (World.cmdBlocks.size === 0) return;
  const ccxMin = Math.floor(minX / CHUNK_SIZE), ccxMax = Math.floor(maxX / CHUNK_SIZE);
  const cczMin = Math.floor(minZ / CHUNK_SIZE), cczMax = Math.floor(maxZ / CHUNK_SIZE);
  const checked = new Set();
  for (const [k, st] of World.cmdBlocks) {
    const i1 = k.indexOf(','), i2 = k.indexOf(',', i1 + 1);
    const wx = +k.slice(0, i1), y = +k.slice(i1 + 1, i2), wz = +k.slice(i2 + 1);
    if (wx < ccxMin * CHUNK_SIZE - 1 || wx > (ccxMax + 1) * CHUNK_SIZE || wz < cczMin * CHUNK_SIZE - 1 || wz > (cczMax + 1) * CHUNK_SIZE) continue;
    if (checked.has(k)) continue;
    checked.add(k);
    if (st.always) continue; // «Всегда активен» — редстоун не реагирует (как в MC)
    const powered = isCmdBlockPowered(wx, y, wz);
    const was = cmdPoweredSet.has(k);
    if (powered && !was) {
      cmdPoweredSet.add(k);
      executeCmdBlock(wx, y, wz, st);
    } else if (!powered && was) {
      cmdPoweredSet.delete(k);
    }
  }
}

// ---- UI настройки командного блока (модалка) ----
const cmdBlockBoxEl = document.getElementById('cmdBlockBox');
const cmdBlockInputEl = document.getElementById('cmdBlockInput');
const cmdBlockAlwaysEl = document.getElementById('cmdBlockAlways');
const cmdBlockPosEl = document.getElementById('cmdBlockPos');
let cmdBlockUIOpen = false;
let cmdBlockPos = null; // {x,y,z} настраиваемого блока

function openCmdBlockUI(x, y, z) {
  cmdBlockPos = { x, y, z };
  const st = World.cmdBlocks.get(World.ekey(x, y, z)) || { cmd: '', always: false };
  cmdBlockInputEl.value = st.cmd || '';
  cmdBlockAlwaysEl.checked = !!st.always;
  cmdBlockPosEl.textContent = 'Позиция: ' + x + ', ' + y + ', ' + z;
  cmdBlockBoxEl.classList.add('open');
  cmdBlockUIOpen = true;
  document.exitPointerLock();
  setTimeout(() => cmdBlockInputEl.focus(), 30);
  if (typeof updateChatMiniVisibility === 'function') updateChatMiniVisibility();
}
function closeCmdBlockUI() {
  cmdBlockBoxEl.classList.remove('open');
  cmdBlockUIOpen = false;
  cmdBlockPos = null;
  if (overlay.classList.contains('hidden') && !chatOpen && !invOpen && canvas) canvas.requestPointerLock();
  if (typeof updateChatMiniVisibility === 'function') updateChatMiniVisibility();
}
function saveCmdBlockFromUI() {
  if (!cmdBlockPos) return null;
  const k = World.ekey(cmdBlockPos.x, cmdBlockPos.y, cmdBlockPos.z);
  const cmd = cmdBlockInputEl.value.trim().replace(/^\/+/, '').slice(0, 120);
  const always = cmdBlockAlwaysEl.checked;
  const st = { cmd, always };
  if (cmd) World.cmdBlocks.set(k, st); else World.cmdBlocks.delete(k);
  if (typeof requestSave === 'function') requestSave();
  return st;
}
document.getElementById('cmdBlockDone').addEventListener('click', () => {
  const st = saveCmdBlockFromUI();
  const pos = cmdBlockPos;
  closeCmdBlockUI();
  // «Всегда активен» — выполняется один раз при установке (как в MC)
  if (st && st.always && st.cmd && pos) {
    playSound('click');
    addChatMessage('[КБ ' + pos.x + ',' + pos.y + ',' + pos.z + '] Всегда активен — выполняю: /' + st.cmd, 'chat-sys');
    handleChatCommand('/' + st.cmd, { fromCmdBlock: true, pos });
  }
});
document.getElementById('cmdBlockExec').addEventListener('click', () => {
  const st = saveCmdBlockFromUI();
  const pos = cmdBlockPos;
  closeCmdBlockUI();
  if (st && pos) executeCmdBlock(pos.x, pos.y, pos.z, st);
});
document.getElementById('cmdBlockCancel').addEventListener('click', () => closeCmdBlockUI());
cmdBlockInputEl.addEventListener('keydown', (e) => {
  e.stopPropagation();
  if (e.key === 'Enter') document.getElementById('cmdBlockDone').click();
  if (e.key === 'Escape') closeCmdBlockUI();
});

// открыть/закрыть редстоун-двери в зависимости от сигнала поблизости
function syncDoorsWithRedstone(minX,maxX,minY,maxY,minZ,maxZ) {
  for (const [k, st] of World.doorState) {
    const [x,y,z] = k.split(',').map(Number);
    if (x<minX-1||x>maxX+1||y<minY-1||y>maxY+1||z<minZ-1||z>maxZ+1) continue;
    // сигнал от соседних 4 блоков на уровне нижней половины и верхней
    let powered = false;
    const checks = [[x+1,y,z],[x-1,y,z],[x,y,z+1],[x,y,z-1],
                    [x+1,y+1,z],[x-1,y+1,z],[x,y+1,z+1],[x,y+1,z-1],
                    [x,y-1,z]];
    for (const [cx,cy,cz] of checks) {
      const b = World.getBlock(cx,cy,cz);
      if (b === BLOCK.LEVER && leverState(cx,cy,cz).on) { powered = true; break; }
      if (b === BLOCK.BUTTON && buttonState(cx,cy,cz).pressed) { powered = true; break; }
      if (b === BLOCK.REDSTONE_TORCH && !redstoneTorchPowered(cx,cy,cz)) { powered = true; break; }
      if (redstonePowerAt(cx,cy,cz) > 0) { powered = true; break; }
    }
    if (powered !== st.open) {
      st.open = powered;
      // не играем звук, чтобы не спамить при пересчётах
      for (let dx=-1;dx<=1;dx++) for (let dz=-1;dz<=1;dz++) World.markDirty(Math.floor(x/CHUNK_SIZE)+dx, Math.floor(z/CHUNK_SIZE)+dz);
    }
  }
}

// включить свечение руды (при клике/наступании) на 3 сек
function glowRedstoneOre(x, y, z) {
  glowingOre.set(ekeyOf(x, y, z), 3.0);
  rebuildAround(x, z);
  // частицы активации (красные искры)
  spawnParticles(x + 0.5, y + 0.5, z + 0.5, 10, '#ff4030');
}
// тикер свечения руды
function updateGlowingOre(dt) {
  if (glowingOre.size === 0) return;
  const expired = [];
  for (const [k, t] of glowingOre) {
    const nt = t - dt;
    if (nt <= 0) expired.push(k);
    else glowingOre.set(k, nt);
  }
  for (const k of expired) {
    glowingOre.delete(k);
    const [x,,z] = k.split(',').map(Number);
    rebuildAround(x, z);
  }
}

