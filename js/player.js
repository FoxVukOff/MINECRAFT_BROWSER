/* ============================================================
   MiniCraft — player · Игрок: состояние, управление, ввод
   (модуль 9 из 33; строки 4044–4091 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Игрок и физика
// ============================================================
const PLAYER = {
  pos: new THREE.Vector3(8, 50, 8),
  vel: new THREE.Vector3(0, 0, 0),
  width: 0.6,
  height: 1.8,
  eye: 1.62,       // высота глаз стоя
  crouchEye: 1.32, // присев
  onGround: false,
  crouching: false,
  yaw: 0,
  pitch: 0,
  speed: 4.3,
  sprintMul: 1.3, // спринт ×1.3 — как в MC (5.6 м/с)
  jumpV: 8.2,
  inWater: false,
  submerged: false,
  oxygen: 10,        // запас воздуха (0..10 «пузырьков»)
  maxOxygen: 10,
  drownTimer: 0,
  hp: 20,            // здоровье (0..20 = 10 сердец)
  maxHp: 20,
  hunger: 20,        // голод (0..20 = 10 кусков)
  maxHunger: 20,
  exhaustion: 0,     // накопитель истощения -> расход голода
  regenTimer: 0,
  starveTimer: 0,
  damageFlash: 0,    // вспышка урона на экране
  burnTimer: 0,      // таймер горения (лава/огонь)
  lavaTick: 0,
  fireTick: 0,
  dead: false,       // мёртв (показан экран смерти)
  inLiquid: false,
  riding: null,      // лодка, в которой плывём
  armor: { helmet: null, chestplate: null, leggings: null, boots: null }, // надетая броня
  offhand: null,     // вторая рука (левая рука, как в MC): {id,count,dur?} или null
  spawnPoint: null,  // точка возрождения (устанавливается сном в кровати)
};

const GRAVITY = 26;
const keys = {};

// ---------- Управление ----------
let pointerLocked = false;
let gameStarted = false; // true после загрузки/создания мира
const overlay = document.getElementById('overlay');

