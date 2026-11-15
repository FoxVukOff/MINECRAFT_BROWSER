/* ============================================================
   MiniCraft — audio · Звук и музыка (Web Audio, процедурно)
   (модуль 16 из 33; строки 6249–6692 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Звук и музыка (Web Audio API, всё процедурно, без файлов)
// ============================================================
const AudioEngine = {
  ctx: null,
  master: null,
  musicGain: null,
  sfxGain: null,
  musicTimer: null,
  enabled: true,
};

function initAudio() {
  if (AudioEngine.ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  AudioEngine.ctx = new AC();
  if (AudioEngine.ctx.state === 'suspended') AudioEngine.ctx.resume();
  AudioEngine.master = AudioEngine.ctx.createGain();
  AudioEngine.master.gain.value = 0.8;
  AudioEngine.master.connect(AudioEngine.ctx.destination);

  AudioEngine.sfxGain = AudioEngine.ctx.createGain();
  AudioEngine.sfxGain.gain.value = 0.6;
  AudioEngine.sfxGain.connect(AudioEngine.master);

  AudioEngine.musicGain = AudioEngine.ctx.createGain();
  AudioEngine.musicGain.gain.value = 0.18;
  AudioEngine.musicGain.connect(AudioEngine.master);

  startMusic();
}

// --- Звуковые эффекты ---
function noiseBurst(dur, filterFreq, gainVal, type = 'lowpass') {
  const ctx = AudioEngine.ctx;
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const env = 1 - i / len;
    data[i] = (Math.random() * 2 - 1) * env * env;
  }
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const filt = ctx.createBiquadFilter();
  filt.type = type;
  filt.frequency.value = filterFreq;
  const g = ctx.createGain();
  g.gain.value = gainVal;
  src.connect(filt); filt.connect(g); g.connect(AudioEngine.sfxGain);
  src.start();
  src.stop(ctx.currentTime + dur);
}

function tone(freq, dur, gainVal, type = 'sine') {
  const ctx = AudioEngine.ctx;
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = ctx.createGain();
  g.gain.setValueAtTime(gainVal, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  osc.connect(g); g.connect(AudioEngine.sfxGain);
  osc.start();
  osc.stop(ctx.currentTime + dur);
}

// Параметры звука по материалу
function soundProfile(block) {
  switch (block) {
    case BLOCK.STONE:   return { freq: 380, dur: 0.12, type: 'lowpass' };        // звонкий камень
    case BLOCK.BEDROCK: return { freq: 300, dur: 0.14, type: 'lowpass' };
    case BLOCK.DEEPSLATE: return { freq: 320, dur: 0.16, type: 'lowpass' };       // глухой глубинный
    case BLOCK.COBBLESTONE: return { freq: 360, dur: 0.13, type: 'lowpass' };
    case BLOCK.DIRT:    return { freq: 700, dur: 0.10, type: 'lowpass' };         // глухая земля
    case BLOCK.GRASS:   return { freq: 1200, dur: 0.10, type: 'lowpass' };        // мягкая трава
    // песок: мягкое сыпучее «шшш» — высокочастотный шум через highpass
    case BLOCK.SAND:    return { freq: 2600, dur: 0.16, type: 'highpass', sand: true };
    case BLOCK.GRAVEL:  return { freq: 1500, dur: 0.14, type: 'bandpass' };       // хруст гравия
    case BLOCK.WOOD:    return { freq: 520, dur: 0.13, type: 'lowpass' };         // глухое дерево
    case BLOCK.PLANKS:  return { freq: 600, dur: 0.12, type: 'lowpass' };
    case BLOCK.CRAFTING_TABLE: return { freq: 560, dur: 0.12, type: 'lowpass' };
    case BLOCK.LEAVES:  return { freq: 3000, dur: 0.12, type: 'highpass' };       // шуршание листвы
    case BLOCK.GLASS:   return { freq: 2200, dur: 0.10, type: 'highpass' };       // звон стекла
    case BLOCK.WOOL:    return { freq: 900, dur: 0.08, type: 'lowpass' };         // мягкая шерсть
    case BLOCK.WATER:   return { freq: 800, dur: 0.14, type: 'lowpass' };         // всплеск воды
    case BLOCK.NETHERRACK: return { freq: 420, dur: 0.12, type: 'lowpass' };
    case BLOCK.REDSTONE_ORE: return { freq: 380, dur: 0.12, type: 'lowpass' };
    case BLOCK.REDSTONE_DUST: return { freq: 2800, dur: 0.06, type: 'highpass' };
    case BLOCK.COMMAND_BLOCK: return { freq: 320, dur: 0.15, type: 'lowpass' };  // глухой «системный» блок
    case BLOCK.IRON_ORE:
    case BLOCK.COPPER_ORE:
    case BLOCK.COAL_ORE:
    case BLOCK.DIAMOND_ORE: return { freq: 360, dur: 0.13, type: 'lowpass' };
    default:            return { freq: 600, dur: 0.10, type: 'lowpass' };
  }
}

function playSound(kind, block) {
  if (!AudioEngine.ctx || !AudioEngine.enabled) return;
  const p = soundProfile(block);
  if (kind === 'dig') {
    noiseBurst(p.dur, p.freq, 0.35, p.type);
  } else if (kind === 'break') {
    noiseBurst(p.dur * 1.6, p.freq * 1.2, 0.5, p.type);
  } else if (kind === 'place') {
    noiseBurst(p.dur * 1.3, p.freq, 0.45, p.type);
  } else if (kind === 'step') {
    noiseBurst(0.07, p.freq * 0.8, 0.18, p.type);
  } else if (kind === 'pickup') {
    // характерный "поп" подбора, как в майнкрафте — короткий тон с подъёмом
    tone(600, 0.08, 0.25, 'square');
    setTimeout(() => tone(900, 0.07, 0.2, 'square'), 35);
  } else if (kind === 'splash') {
    noiseBurst(0.25, 900, 0.3, 'lowpass');
  } else if (kind === 'sandfall') {
    // мягкий сыпучий звук падения песка
    noiseBurst(0.22, 2400, 0.22, 'highpass');
  } else if (kind === 'oink') {
    // хрюканье свиньи — короткий «носовой» звук
    pigOink(false);
  } else if (kind === 'oink_hurt') {
    pigOink(true);
  } else if (kind === 'moo') {
    cowMoo(false);
  } else if (kind === 'moo_hurt') {
    cowMoo(true);
  } else if (kind === 'eat') {
    // звук еды — несколько коротких «чавканий»
    noiseBurst(0.06, 800, 0.25, 'lowpass');
    setTimeout(() => noiseBurst(0.06, 700, 0.22, 'lowpass'), 130);
    setTimeout(() => noiseBurst(0.05, 900, 0.2, 'lowpass'), 260);
  } else if (kind === 'cluck') {
    chickenCluck(false);
  } else if (kind === 'cluck_hurt') {
    chickenCluck(true);
  } else if (kind === 'zombie') {
    zombieGroan(false);
  } else if (kind === 'zombie_hurt') {
    zombieGroan(true);
  } else if (kind === 'phantom') {
    phantomScreech(false);
  } else if (kind === 'phantom_hurt') {
    phantomScreech(true);
  } else if (kind === 'hurt') {
    playerHurt();
  } else if (kind === 'burp') {
    playerBurp();
  } else if (kind === 'click') {
    // щелчок рычага/кнопки — короткий деревянный «клак»
    tone(420, 0.05, 0.25, 'square');
    setTimeout(() => tone(280, 0.06, 0.2, 'square'), 30);
  } else if (kind === 'shear') {
    // стрижка — шуршащий «вжик»
    noiseBurst(0.22, 3200, 0.28, 'highpass');
  } else if (kind === 'cave') {
    // жуткий пещерный эмбиент — выбираем случайный вариант из набора
    playCaveAmbient();
  } else if (kind === 'piston') {
    // поршень — механический «вжик» с лёгким стуком
    tone(180, 0.08, 0.3, 'square');
    noiseBurst(0.12, 1200, 0.2, 'lowpass');
    setTimeout(() => tone(140, 0.06, 0.18, 'square'), 70);
  }
}

// пещерный эмбиент: случайные жуткие звуки под землём при низком освещении
// пещерный эмбиент: набор из 4 вариантов жутких звуков (выбирается случайно)
function playCaveAmbient() {
  if (!AudioEngine.ctx) return;
  const variant = Math.floor(Math.random() * 4);
  if (variant === 0) {
    // низкий гул + далёкий звон (классика)
    playCaveDrone(70, 0.12, 3.0, true);
  } else if (variant === 1) {
    // ветреный вой — отфильтрованный шум
    playCaveWind();
  } else if (variant === 2) {
    // капли воды — редкие высокие «плонки»
    playCaveDrips();
  } else {
    // далёкий рёв — низкий медленный разворот
    playCaveDrone(55, 0.18, 4.0, false);
  }
}

// базовый пещерный гул
function playCaveDrone(baseFreq, gainVal, dur, withOvertone) {
  const ctx = AudioEngine.ctx;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator(); osc.type = 'sine';
  osc.frequency.setValueAtTime(baseFreq + Math.random()*20, t0);
  osc.frequency.linearRampToValueAtTime(baseFreq * 0.8, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gainVal, t0 + dur*0.3);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 220;
  osc.connect(filt); filt.connect(g); g.connect(AudioEngine.sfxGain);
  osc.start(t0); osc.stop(t0 + dur + 0.2);
  if (withOvertone) {
    const osc2 = ctx.createOscillator(); osc2.type = 'sine';
    const f2 = 400 + Math.random()*400;
    osc2.frequency.setValueAtTime(f2, t0 + dur*0.4);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.0001, t0 + dur*0.4);
    g2.gain.exponentialRampToValueAtTime(0.05, t0 + dur*0.5);
    g2.gain.exponentialRampToValueAtTime(0.0001, t0 + dur*0.8);
    osc2.connect(g2); g2.connect(AudioEngine.sfxGain);
    osc2.start(t0 + dur*0.4); osc2.stop(t0 + dur);
  }
}

// ветреный вой в пещере
function playCaveWind() {
  const ctx = AudioEngine.ctx;
  const t0 = ctx.currentTime;
  const len = Math.floor(ctx.sampleRate * 2.5);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const env = Math.sin(i / len * Math.PI);
    data[i] = (Math.random()*2 - 1) * env * 0.5;
  }
  const src = ctx.createBufferSource(); src.buffer = buf;
  const filt = ctx.createBiquadFilter(); filt.type = 'bandpass'; filt.Q.value = 1.5;
  filt.frequency.setValueAtTime(400, t0);
  filt.frequency.linearRampToValueAtTime(900, t0 + 2.0);
  filt.frequency.linearRampToValueAtTime(500, t0 + 2.5);
  const g = ctx.createGain(); g.gain.value = 0.15;
  src.connect(filt); filt.connect(g); g.connect(AudioEngine.sfxGain);
  src.start(t0); src.stop(t0 + 2.5);
}

// капли воды
function playCaveDrips() {
  const ctx = AudioEngine.ctx;
  const t0 = ctx.currentTime;
  const drop = (start, freq) => {
    const osc = ctx.createOscillator(); osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t0 + start);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t0 + start + 0.15);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0 + start);
    g.gain.exponentialRampToValueAtTime(0.18, t0 + start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + start + 0.2);
    osc.connect(g); g.connect(AudioEngine.sfxGain);
    osc.start(t0 + start); osc.stop(t0 + start + 0.25);
  };
  drop(0.0, 1200);
  drop(0.7, 900);
  drop(1.5, 1400);
  drop(2.1, 800);
}

// визг фантома — резкий нисходящий «свист пике» (hurt — короткий вскрик)
function phantomScreech(hurt) {
  if (!AudioEngine.ctx) return;
  const ctx = AudioEngine.ctx;
  const t0 = ctx.currentTime;
  const dur = hurt ? 0.22 : 0.7;
  const base = (hurt ? 640 : 430) + Math.random() * 90;
  const osc = ctx.createOscillator(); osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(base, t0);
  // резкий нисходящий визг пикирующей твари
  osc.frequency.exponentialRampToValueAtTime(base * 0.42, t0 + dur);
  const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 24;
  const lfoG = ctx.createGain(); lfoG.gain.value = base * 0.07;
  lfo.connect(lfoG); lfoG.connect(osc.frequency);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(hurt ? 0.24 : 0.16, t0 + dur * 0.2);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  // «кожистый» тембр — полосовой фильтр
  const filt = ctx.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 950; filt.Q.value = 1.4;
  osc.connect(filt); filt.connect(g); g.connect(AudioEngine.sfxGain);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
  lfo.start(t0); lfo.stop(t0 + dur + 0.05);
}
// стон зомби — низкий «раскисший» рык с вибрато (hurt — короткий вскрик-рык)
function zombieGroan(hurt) {
  if (!AudioEngine.ctx) return;
  const ctx = AudioEngine.ctx;
  const t0 = ctx.currentTime;
  const dur = hurt ? 0.28 : 0.85;
  const base = (hurt ? 150 : 95) + Math.random() * 30;
  const osc = ctx.createOscillator(); osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(base, t0);
  // нисходящий стон с лёгким вибрато
  osc.frequency.linearRampToValueAtTime(base * 0.7, t0 + dur);
  const lfo = ctx.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = hurt ? 9 : 5;
  const lfoG = ctx.createGain(); lfoG.gain.value = base * 0.08;
  lfo.connect(lfoG); lfoG.connect(osc.frequency);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(hurt ? 0.3 : 0.2, t0 + dur * 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  // «гнилой» тембр — срезаем верха
  const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 480; filt.Q.value = 2;
  osc.connect(filt); filt.connect(g); g.connect(AudioEngine.sfxGain);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
  lfo.start(t0); lfo.stop(t0 + dur + 0.05);
}

// клохтание курицы — пара коротких высоких чирков
function chickenCluck(hurt) {
  if (!AudioEngine.ctx) return;
  const ctx = AudioEngine.ctx;
  const chirp = (t0, f) => {
    const osc = ctx.createOscillator(); osc.type = 'square';
    osc.frequency.setValueAtTime(f, t0);
    osc.frequency.linearRampToValueAtTime(f * 1.4, t0 + 0.05);
    osc.frequency.linearRampToValueAtTime(f * 0.9, t0 + 0.1);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(hurt ? 0.32 : 0.2, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.1);
    const filt = ctx.createBiquadFilter(); filt.type = 'bandpass'; filt.frequency.value = 2200; filt.Q.value = 3;
    osc.connect(filt); filt.connect(g); g.connect(AudioEngine.sfxGain);
    osc.start(t0); osc.stop(t0 + 0.12);
  };
  const now = ctx.currentTime;
  chirp(now, hurt ? 1100 : 900);
  chirp(now + 0.12, hurt ? 1300 : 1000);
  if (!hurt) chirp(now + 0.26, 850);
}

// звук урона игрока — глухой удар «ой»
function playerHurt() {
  if (!AudioEngine.ctx) return;
  const ctx = AudioEngine.ctx;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator(); osc.type = 'triangle';
  osc.frequency.setValueAtTime(330, t0);
  osc.frequency.exponentialRampToValueAtTime(140, t0 + 0.18);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.4, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
  osc.connect(g); g.connect(AudioEngine.sfxGain);
  osc.start(t0); osc.stop(t0 + 0.24);
  // короткий шумовой «удар»
  noiseBurst(0.08, 500, 0.25, 'lowpass');
}

// отрыжка после еды
function playerBurp() {
  if (!AudioEngine.ctx) return;
  const ctx = AudioEngine.ctx;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator(); osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(140, t0);
  osc.frequency.linearRampToValueAtTime(70, t0 + 0.28);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.04);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
  const filt = ctx.createBiquadFilter(); filt.type = 'lowpass'; filt.frequency.value = 500;
  // лёгкое «бульканье» через периодическую модуляцию частоты
  const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 18;
  const lfoGain = ctx.createGain(); lfoGain.gain.value = 25;
  lfo.connect(lfoGain); lfoGain.connect(osc.frequency);
  osc.connect(filt); filt.connect(g); g.connect(AudioEngine.sfxGain);
  osc.start(t0); osc.stop(t0 + 0.32); lfo.start(t0); lfo.stop(t0 + 0.32);
}

// процедурное хрюканье
function pigOink(hurt) {
  if (!AudioEngine.ctx) return;
  const ctx = AudioEngine.ctx;
  const t0 = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  const base = hurt ? 360 : 220;
  osc.frequency.setValueAtTime(base, t0);
  osc.frequency.linearRampToValueAtTime(base * (hurt ? 1.5 : 0.7), t0 + 0.14);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(hurt ? 0.4 : 0.28, t0 + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
  const filt = ctx.createBiquadFilter();
  filt.type = 'bandpass'; filt.frequency.value = 700; filt.Q.value = 2;
  osc.connect(filt); filt.connect(g); g.connect(AudioEngine.sfxGain);
  osc.start(t0); osc.stop(t0 + 0.2);
}

// мычание коровы — низкий протяжный звук с лёгким понижением
function cowMoo(hurt) {
  if (!AudioEngine.ctx) return;
  const ctx = AudioEngine.ctx;
  const t0 = ctx.currentTime;
  const dur = hurt ? 0.35 : 0.7;
  const osc = ctx.createOscillator();
  osc.type = 'sawtooth';
  const base = hurt ? 200 : 150;
  osc.frequency.setValueAtTime(base, t0);
  osc.frequency.linearRampToValueAtTime(base * 1.25, t0 + dur * 0.35);
  osc.frequency.linearRampToValueAtTime(base * 0.8, t0 + dur);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(hurt ? 0.42 : 0.34, t0 + 0.06);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass'; filt.frequency.value = 900;
  osc.connect(filt); filt.connect(g); g.connect(AudioEngine.sfxGain);
  osc.start(t0); osc.stop(t0 + dur + 0.05);
}

// --- Атмосферная музыка (медленные аккорды/арпеджио, спокойный мажор) ---
const MUSIC_NOTES = [220.00, 261.63, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
function musicVoice(freq, dur) {
  const ctx = AudioEngine.ctx;
  const osc = ctx.createOscillator();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  const g = ctx.createGain();
  const t0 = ctx.currentTime;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.4);   // мягкая атака
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur); // длинный затухающий хвост
  const filt = ctx.createBiquadFilter();
  filt.type = 'lowpass';
  filt.frequency.value = 1400;
  osc.connect(filt); filt.connect(g); g.connect(AudioEngine.musicGain);
  osc.start(t0);
  osc.stop(t0 + dur + 0.1);
}

function startMusic() {
  if (AudioEngine.musicTimer) return;
  const scheduleNote = () => {
    if (!AudioEngine.enabled) { AudioEngine.musicTimer = setTimeout(scheduleNote, 2000); return; }
    // случайная нота из гаммы, иногда аккорд
    const n = MUSIC_NOTES[Math.floor(Math.random() * MUSIC_NOTES.length)];
    musicVoice(n, 2.5 + Math.random() * 2);
    if (Math.random() < 0.4) {
      const n2 = MUSIC_NOTES[Math.floor(Math.random() * MUSIC_NOTES.length)];
      musicVoice(n2 * 0.5, 3 + Math.random() * 2); // басовая нота октавой ниже
    }
    AudioEngine.musicTimer = setTimeout(scheduleNote, 1800 + Math.random() * 2600);
  };
  scheduleNote();
}

