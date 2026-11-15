/* ============================================================
   MiniCraft — textures · Процедурные текстуры (canvas) и материалы
   (модуль 2 из 33; строки 559–1729 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Текстуры (генерируются на canvas, без внешних ассетов)
// ============================================================
const TEX = {};

function makeTex(drawFn) {
  const c = document.createElement('canvas');
  c.width = 16; c.height = 16;
  const ctx = c.getContext('2d');
  drawFn(ctx);
  return c;
}

function noiseFill(ctx, base, variance) {
  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const v = (Math.random() - 0.5) * variance;
      ctx.fillStyle = shade(base, v);
      ctx.fillRect(x, y, 1, 1);
    }
  }
}

// Детерминированная пиксель-заливка из палитры (для чёткого пиксель-арта).
// palette — массив цветов '#..'; weights — относит. частоты. seed — для стабильности.
function pixelFillRegion(ctx, ox, oy, w, h, palette, weights, seed) {
  let s = (seed || 1) >>> 0;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const total = weights.reduce((a,b)=>a+b,0);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    let r = rnd() * total, idx = 0;
    while (r > weights[idx] && idx < weights.length-1) { r -= weights[idx]; idx++; }
    ctx.fillStyle = palette[idx];
    ctx.fillRect(ox + x, oy + y, 1, 1);
  }
}
function pixelFill(ctx, palette, weights, seed) {
  pixelFillRegion(ctx, 0, 0, 16, 16, palette, weights, seed);
}

function shade(hex, amt) {
  let r = (hex >> 16) & 255, g = (hex >> 8) & 255, b = hex & 255;
  r = Math.max(0, Math.min(255, r + amt));
  g = Math.max(0, Math.min(255, g + amt));
  b = Math.max(0, Math.min(255, b + amt));
  return `rgb(${r|0},${g|0},${b|0})`;
}

function buildTextures() {
  // --- Фаза 3: объёмный пиксель-арт (свет сверху, тень снизу, органические пятна) ---
  // трава сверху — кластеры светлых «лопухов» по тёмной зелени (как в MC)
  TEX.grass_top  = makeTex(ctx => {
    pixelFill(ctx, ['#5d9c3f','#549136','#66a847','#4b8230','#6fb050'], [4,4,3,3,2], 101);
    // светлые «островки» травы (2x2 со скошенным краем)
    ctx.fillStyle = '#79bd58';
    for (const [gx,gy] of [[1,2],[9,1],[5,6],[12,8],[3,11],[8,12],[13,3],[0,8]]) {
      ctx.fillRect(gx,gy,2,1); ctx.fillRect(gx,gy+1,1,1);
    }
    // тёмные точки-тени между кустиками
    ctx.fillStyle = '#3f7026';
    for (const [gx,gy] of [[4,3],[11,5],[7,9],[2,13],[13,12],[6,1]]) ctx.fillRect(gx,gy,1,1);
  });
  // земля — комковатая, с камешками и корневыми точками
  const dirtDraw = (ctx) => {
    pixelFill(ctx, ['#8a6a40','#7d5e36','#96754a','#6e5430','#84633a'], [4,4,3,3,2], 202);
    // комки: светлый верх + тёмная кромка снизу (объём)
    ctx.fillStyle = '#a0804f';
    for (const [gx,gy] of [[2,2],[11,3],[6,6],[13,9],[3,12],[8,10]]) ctx.fillRect(gx,gy,2,1);
    ctx.fillStyle = '#5e4628';
    for (const [gx,gy] of [[2,3],[11,4],[6,7],[13,10],[3,13],[8,11]]) ctx.fillRect(gx,gy,2,1);
    // редкие серые камешки
    ctx.fillStyle = '#9a9288';
    for (const [gx,gy] of [[10,7],[1,9],[7,14]]) ctx.fillRect(gx,gy,1,1);
  };
  TEX.dirt    = makeTex(dirtDraw);
  // бок травы — земля + пышная неровная кромка с тёмной «подложкой» и свесами
  TEX.grass_side = makeTex(ctx => {
    dirtDraw(ctx);
    // тёмная подложка кромки (тень травы на земле)
    pixelFillRegion(ctx, 0, 0, 16, 3, ['#456f2b','#3d6425'], [3,2], 302);
    // основная зелёная кромка 3-4px
    pixelFillRegion(ctx, 0, 0, 16, 3, ['#5d9c3f','#549136','#66a847'], [4,4,3], 303);
    // неровный свисающий край (глубина 1-2px, детерминированно)
    for (let x = 0; x < 16; x++) {
      const d = ((x * 73 + 29) % 7) < 3 ? 1 : 0;      // 0 или 1 доп. пиксель
      const d2 = ((x * 41 + 13) % 11) < 2 ? 2 : 0;    // редкие длинные свесы
      ctx.fillStyle = '#549136';
      ctx.fillRect(x, 3, 1, d + d2);
      if (d + d2 > 0) { ctx.fillStyle = '#4b8230'; ctx.fillRect(x, 3 + d + d2 - 1, 1, 1); }
    }
    // блики травы
    ctx.fillStyle = '#79bd58';
    for (const [gx,gy] of [[2,1],[7,0],[12,2],[5,2],[14,1]]) ctx.fillRect(gx,gy,1,1);
  });
  // камень — светлые «валуны» с тёмной окантовкой (фактурный MC-стиль)
  TEX.stone   = makeTex(ctx => {
    pixelFill(ctx, ['#8a8a8a','#7f7f7f','#949494','#757575'], [4,4,3,2], 404);
    const rock = (x, y, w, h) => {
      ctx.fillStyle = '#9e9e9e'; ctx.fillRect(x, y, w, h - 1);
      ctx.fillStyle = '#6e6e6e'; ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x + w - 1, y, 1, h - 1);
      ctx.fillStyle = '#b0b0b0'; ctx.fillRect(x + 1, y, w - 2, 1);
    };
    rock(1,1,5,3); rock(8,0,6,3); rock(0,6,4,3); rock(6,5,5,4); rock(12,6,4,4);
    rock(2,11,6,3); rock(10,12,5,3);
    // трещинки
    ctx.fillStyle = '#646464';
    for (const [gx,gy] of [[5,4],[12,5],[4,10],[9,9],[14,11]]) ctx.fillRect(gx,gy,1,1);
  });
  TEX.bedrock = makeTex(ctx => {
    // грубые угловатые пласты чёрного/серого с жёсткими краями (как в MC)
    pixelFill(ctx, ['#3a3a3a','#4a4a4a','#2c2c2c','#565656'], [4,4,3,2], 505);
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0,3,7,2); ctx.fillRect(9,6,7,2); ctx.fillRect(3,11,6,2); ctx.fillRect(12,0,4,2); ctx.fillRect(0,8,3,2);
    ctx.fillStyle = '#666666';
    ctx.fillRect(7,3,5,2); ctx.fillRect(1,6,5,2); ctx.fillRect(8,9,6,2); ctx.fillRect(2,1,4,2); ctx.fillRect(11,13,5,2);
  });
  // глубинный камень — тёмный зернистый с ВЕРТИКАЛЬНЫМИ бороздами (как MC deepslate;
  // раньше были горизонтальные напластования — выглядело как доски, переделано)
  TEX.deepslate = makeTex(ctx => {
    pixelFill(ctx, ['#4c4c53','#45454c','#53535b','#3d3d44','#57575f'], [4,4,3,2,2], 3434);
    // вертикальные борозды-штрихи (грубая шероховатость, короткие прерывистые)
    ctx.fillStyle = '#33333a';
    for (const [gx,gy,h] of [[1,1,5],[3,6,4],[5,2,3],[7,8,6],[9,0,4],[11,5,5],[13,9,4],[14,3,3],[0,10,5],[6,12,4],[12,13,3]]) {
      ctx.fillRect(gx, gy, 1, h);
    }
    // светлые гребни рядом с бороздами (объём)
    ctx.fillStyle = '#5e5e66';
    for (const [gx,gy,h] of [[2,2,4],[6,3,2],[8,9,5],[10,6,4],[13,4,3],[1,11,4]]) {
      ctx.fillRect(gx, gy, 1, h);
    }
    // редкие крапинки слюды
    ctx.fillStyle = '#68686f';
    for (const [gx,gy] of [[4,4],[9,7],[13,12],[2,8],[11,1]]) ctx.fillRect(gx,gy,1,1);
    ctx.fillStyle = '#2c2c32';
    for (const [gx,gy] of [[5,10],[12,8],[0,5],[8,13]]) ctx.fillRect(gx,gy,1,1);
  });
  TEX.water   = makeTex(ctx => {
    pixelFill(ctx, ['#3a6ea5','#3566a0','#4078b0','#315f96'], [5,4,3,2], 606);
    // волны-блики (длинные штрихи с изломом, как блики на воде MC)
    ctx.fillStyle = '#5a90c8';
    ctx.fillRect(1,3,5,1); ctx.fillRect(5,4,3,1); ctx.fillRect(9,5,5,1); ctx.fillRect(4,11,4,1); ctx.fillRect(8,12,3,1); ctx.fillRect(12,13,3,1);
    ctx.fillStyle = '#7ab0e0';
    ctx.fillRect(2,3,2,1); ctx.fillRect(10,5,2,1); ctx.fillRect(5,11,2,1);
    ctx.fillStyle = '#2a5288';
    ctx.fillRect(2,4,3,1); ctx.fillRect(10,9,4,1); ctx.fillRect(5,12,4,1); ctx.fillRect(0,7,4,1);
  });
  // лава — раскалённая, тёмно-красная основа с ярко-оранжевыми «жилами» магмы
  TEX.lava    = makeTex(ctx => {
    pixelFill(ctx, ['#d83a10','#b82c08','#e85a18','#a02404'], [5,4,3,3], 6161);
    // яркие сгустки магмы
    ctx.fillStyle = '#ffb030';
    for (const [gx,gy] of [[3,4],[10,3],[6,9],[12,11],[2,12]]) ctx.fillRect(gx,gy,2,2);
    ctx.fillStyle = '#ffe070';
    for (const [gx,gy] of [[4,5],[11,4],[7,10]]) ctx.fillRect(gx,gy,1,1);
    // тёмная застывшая корка
    ctx.fillStyle = '#6a1404';
    ctx.fillRect(0,7,16,1); ctx.fillRect(8,0,1,6);
  });
  // огонь — языки пламени снизу вверх (для билборд-креста)
  TEX.fire    = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    // основание — широкое, верх — узкий
    const layer = (color, pts) => { ctx.fillStyle = color; for (const [gx,gy,w,h] of pts) ctx.fillRect(gx,gy,w,h); };
    layer('#d8400e', [[3,9,10,7],[4,6,8,4],[6,3,4,4],[7,1,2,3]]);          // внешнее
    layer('#ff8a20', [[5,10,6,6],[5,7,6,3],[6,4,4,3],[7,2,2,2]]);          // среднее
    layer('#ffd24a', [[6,11,4,5],[7,8,2,3],[7,5,2,2]]);                     // ядро
    layer('#fff0a0', [[7,12,2,3]]);                                        // самое яркое
  });
  // портал в Ад — фиолетовая «дымка» (анимируется)
  TEX.portal = makeTex(ctx => {
    pixelFill(ctx, ['#7a2fb8','#5a1f9a','#9a4fd8','#3a1268','#6a2aa8'], [4,4,3,3,3], 2727);
    ctx.fillStyle = '#c79cff';
    for (const [gx,gy] of [[4,3],[10,6],[6,10],[12,12],[2,8]]) ctx.fillRect(gx,gy,1,1);
  });
  // песок — мелкозернистый с лёгкой рябью дюн
  TEX.sand    = makeTex(ctx => {
    pixelFill(ctx, ['#ddd2a0','#e6dcae','#d4c894','#cfc088','#e2d8a8'], [4,4,3,2,2], 707);
    // диагональная рябь (полосы-дюны)
    ctx.fillStyle = '#c8b87e';
    for (let i = 0; i < 16; i++) {
      const x = (i * 2 + (i % 3)) % 16, y = (i + 4) % 16;
      ctx.fillRect(x, y, 2, 1);
    }
    // светлые песчинки
    ctx.fillStyle = '#f2ecc4';
    for (const [gx,gy] of [[2,2],[8,5],[13,9],[5,12],[10,14]]) ctx.fillRect(gx,gy,1,1);
    // тёмные крупинки
    ctx.fillStyle = '#b8a86e';
    for (const [gx,gy] of [[6,3],[11,7],[3,8],[14,2],[7,11]]) ctx.fillRect(gx,gy,1,1);
  });

  // дерево: бок — кора с глубокими вертикальными бороздами
  TEX.wood_side = makeTex(ctx => {
    pixelFill(ctx, ['#6b4f2a','#5e4424','#785931','#523c20'], [5,4,3,2], 808);
    // глубокие тёмные борозды (изогнутые)
    ctx.fillStyle = '#3d2c15';
    for (const bx of [1,4,8,12,14]) {
      for (let y = 0; y < 16; y++) {
        const wob = ((y + bx * 7) % 5 < 2) ? 1 : 0;
        ctx.fillRect(bx + wob, y, 1, 1);
      }
    }
    // светлые гребни рядом с бороздами (объём коры)
    ctx.fillStyle = '#8a6a3c';
    for (const [gx,gy] of [[2,1],[5,4],[9,2],[13,6],[3,10],[10,9],[6,13]]) ctx.fillRect(gx,gy,1,2);
    // сучок
    ctx.fillStyle = '#2e2110'; ctx.fillRect(10,6,2,2);
    ctx.fillStyle = '#5e4424'; ctx.fillRect(10,6,1,1);
  });
  // дерево: торец — годовые кольца с корой по краю
  TEX.wood_top = makeTex(ctx => {
    // спил с КОНТРАСТНЫМИ кольцами и сучком (как в MC)
    pixelFill(ctx, ['#b08a50','#a8854c','#ba9458','#9c7842'], [4,4,3,2], 909);
    // кора по периметру (толстая, с трещинами)
    ctx.strokeStyle = '#5e4424'; ctx.lineWidth = 1.5;
    ctx.strokeRect(0.5, 0.5, 15, 15);
    ctx.fillStyle = '#4a3418';
    ctx.fillRect(2,0,1,2); ctx.fillRect(12,1,1,2); ctx.fillRect(0,10,2,1); ctx.fillRect(14,7,1,2);
    // кольца — чередование тёмных/светлых с шагом 2 (контрастные)
    for (let r = 2; r < 8; r += 2) {
      ctx.strokeStyle = (r % 4 === 0) ? '#6b4a22' : '#c8a668';
      ctx.beginPath(); ctx.arc(8, 8, r, 0, Math.PI*2); ctx.stroke();
    }
    // сердцевина и трещины от центра
    ctx.fillStyle = '#5e4628'; ctx.fillRect(7,7,2,2);
    ctx.fillStyle = '#caa868'; ctx.fillRect(8,8,1,1);
    ctx.strokeStyle = '#7a5c30';
    ctx.beginPath(); ctx.moveTo(8,8); ctx.lineTo(12,3); ctx.moveTo(8,8); ctx.lineTo(3,11); ctx.moveTo(8,8); ctx.lineTo(13,12); ctx.stroke();
    // сучок (небольшое тёмное колечко)
    ctx.strokeStyle = '#6b4a22';
    ctx.beginPath(); ctx.arc(11, 11, 1.2, 0, Math.PI*2); ctx.stroke();
    ctx.fillStyle = '#4a3418'; ctx.fillRect(11,11,1,1);
  });
  // листва — двухъярусная зелень: тёмный низ кроны + светлые листья поверх, с дырками
  TEX.leaves = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    let s = 1212>>>0; const rnd=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
    const pal = ['#3f8b2e','#357a26','#4a9c36','#2e6b20'];
    for (let y=0;y<16;y++) for (let x=0;x<16;x++) {
      if (rnd() < 0.13) continue; // дырки
      ctx.fillStyle = pal[(rnd()*pal.length)|0];
      ctx.fillRect(x,y,1,1);
    }
    // светлые «листики»-блики верхнего яруса
    ctx.fillStyle = '#5cb040';
    for (const [gx,gy] of [[1,1],[4,2],[8,1],[12,3],[2,6],[10,6],[6,9],[13,10],[3,12],[9,12]]) {
      ctx.fillRect(gx,gy,1,1); ctx.fillRect(gx+1,gy+1,1,1);
    }
    // тёмные «прожилки» нижнего яруса
    ctx.fillStyle = '#245418';
    for (const [gx,gy] of [[6,3],[11,7],[1,9],[14,13],[4,14]]) ctx.fillRect(gx,gy,1,1);
  });
  // доски — 4 горизонтальные доски с фаской, волокнами и гвоздями
  TEX.planks = makeTex(ctx => {
    const rows = [['#bd9252','#b08549','#c79c5d'],['#b58c4e','#a87e45','#bf965a'],['#c09050','#b3884a','#c99e5d'],['#b98e4d','#ac8244','#c2975a']];
    for (let r = 0; r < 4; r++) {
      pixelFillRegion(ctx, 0, r*4, 16, 4, rows[r], [4,3,2], 1313 + r*17);
      // тёмный шов между досками
      ctx.fillStyle = '#7a5a30'; ctx.fillRect(0, r*4 + 3, 16, 1);
      // светлый верхний фас доски (свет сверху)
      ctx.fillStyle = '#d4a868'; ctx.fillRect(0, r*4, 16, 1);
      // вертикальный стык (вразбежку)
      const jx = [7,3,11,6][r];
      ctx.fillStyle = '#8a663a'; ctx.fillRect(jx, r*4, 1, 3);
      // гвоздики у стыка
      ctx.fillStyle = '#6e5228';
      ctx.fillRect((jx+2)%15, r*4+1, 1, 1);
      // волокна-риски
      ctx.fillStyle = '#a37c40';
      for (const gx of [1,5,9,13]) if ((gx + r) % 2) ctx.fillRect((gx + r*3) % 15, r*4 + 1 + ((gx*7+r*5)%2), 2, 1);
    }
  });
  // верстак: верх — сетка инструментов, бок — доски с полосой
  TEX.craft_top = makeTex(ctx => {
    noiseFill(ctx, 0xb98e4d, 12);
    ctx.fillStyle = '#5b4423';
    ctx.fillRect(1,1,6,6); ctx.fillRect(9,1,6,6); ctx.fillRect(1,9,6,6); ctx.fillRect(9,9,6,6);
    ctx.fillStyle = '#7a5c2f'; ctx.fillRect(2,2,4,4); ctx.fillRect(10,2,4,4);
  });
  TEX.craft_side = makeTex(ctx => {
    noiseFill(ctx, 0xb98e4d, 12);
    ctx.fillStyle = '#5b4423';
    ctx.fillRect(0,5,16,2); ctx.fillRect(0,9,16,1);
    for (let y=0;y<16;y++){ ctx.fillRect(3,y,1,1); ctx.fillRect(11,y,1,1); }
  });

  // булыжник — крупные округлые камни в тёмном растворе, с бликами
  TEX.cobble = makeTex(ctx => {
    pixelFill(ctx, ['#7d7d7d','#6f6f6f','#888888','#656565'], [5,4,3,2], 1414);
    // тёмные швы-раствор
    ctx.fillStyle = '#474747';
    ctx.fillRect(0,5,16,1); ctx.fillRect(0,10,16,1);
    ctx.fillRect(6,0,1,5); ctx.fillRect(10,6,1,4); ctx.fillRect(4,11,1,5); ctx.fillRect(11,11,1,5);
    // объём каждого камня: свет сверху-слева, тень снизу-справа
    const stones = [[1,1,4,3],[8,1,6,3],[0,6,5,3],[7,7,3,2],[12,7,3,2],[1,11,2,4],[5,11,5,4],[12,12,3,3]];
    for (const [sx,sy,sw,sh] of stones) {
      ctx.fillStyle = '#9a9a9a'; ctx.fillRect(sx, sy, sw, 1); ctx.fillRect(sx, sy, 1, sh); // свет
      ctx.fillStyle = '#585858'; ctx.fillRect(sx, sy+sh-1, sw, 1); ctx.fillRect(sx+sw-1, sy, 1, sh); // тень
      ctx.fillStyle = '#b0b0b0'; ctx.fillRect(sx+1, sy+1, 1, 1); // блик
    }
  });
  // угольная руда — камень с ГРАНЁННЫМИ чёрными кусками угля
  TEX.coal_ore = makeTex(ctx => {
    pixelFill(ctx, ['#8a8a8a','#7f7f7f','#949494','#757575'], [4,4,3,2], 404);
    const blobs = [[3,3,3,2],[10,4,3,3],[5,9,4,3],[11,10,2,3],[2,12,2,2]];
    ctx.fillStyle = '#161616';
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle = '#3a3a3a'; // грань-блик
    for (const [bx,by] of blobs) ctx.fillRect(bx,by,1,1);
    ctx.fillStyle = '#4a4a4a'; // трещинки на угле
    for (const [bx,by,b2] of [[4,4],[6,10],[11,5]]) ctx.fillRect(bx,by,1,1);
  });
  // железная руда — камень с бежево-розоватыми крупинками руды
  TEX.iron_ore = makeTex(ctx => {
    pixelFill(ctx, ['#8a8a8a','#7f7f7f','#949494','#757575'], [4,4,3,2], 404);
    const blobs = [[3,4,3,2],[9,3,3,3],[6,9,4,3],[11,10,2,2],[2,11,2,2]];
    ctx.fillStyle = '#d8c4b0';                 // светлый бежево-серый металл
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle = '#efe2d4';                 // светлый блик
    for (const [bx,by] of blobs) ctx.fillRect(bx,by,1,1);
    ctx.fillStyle = '#a08a72';                 // тень
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx+bw-1,by+bh-1,1,1);
  });
  // медная руда — камень с оранжево-рыжими вкраплениями
  TEX.copper_ore = makeTex(ctx => {
    pixelFill(ctx, ['#8a8a8a','#7f7f7f','#949494','#757575'], [4,4,3,2], 404);
    // медные кластеры с НЕРОВНЫМИ краями: несколько смещённых пятен + 3 тона объёма
    const blob = (x, y) => {
      ctx.fillStyle = '#8a4620';                                 // тёмный ободок
      ctx.fillRect(x-1, y, 4, 3); ctx.fillRect(x, y-1, 3, 4);
      ctx.fillStyle = '#c87038';                                 // основная медь
      ctx.fillRect(x, y, 3, 2); ctx.fillRect(x+1, y+1, 2, 2);
      ctx.fillStyle = '#e89a5a';                                 // блик
      ctx.fillRect(x, y, 1, 1); ctx.fillRect(x+1, y+1, 1, 1);
      ctx.fillStyle = '#6e3818';                                 // глубокая тень
      ctx.fillRect(x+2, y+2, 1, 1);
    };
    blob(3,3); blob(10,2); blob(2,10); blob(9,9); blob(12,12); blob(6,7);
  });
  // алмазная руда — камень с огранёнными бирюзовыми кристаллами
  TEX.diamond_ore = makeTex(ctx => {
    pixelFill(ctx, ['#8a8a8a','#7f7f7f','#949494','#757575'], [4,4,3,2], 404);
    const blobs = [[3,4,3,2],[10,3,2,3],[5,10,3,2],[11,11,2,2],[2,11,2,2]];
    ctx.fillStyle = '#3fd6e0';                 // яркая бирюза
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle = '#bff7ff';                 // блик-грань
    for (const [bx,by] of blobs) ctx.fillRect(bx,by,1,1);
    ctx.fillStyle = '#1f8fa0';                 // тень-грань
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx+bw-1,by+bh-1,1,1);
    ctx.fillStyle = '#eaffff';                 // искра
    ctx.fillRect(4,4,1,1); ctx.fillRect(6,11,1,1);
  });
  // золотая руда — камень с яркими золотыми вкраплениями
  TEX.gold_ore = makeTex(ctx => {
    pixelFill(ctx, ['#8a8a8a','#7f7f7f','#949494','#757575'], [4,4,3,2], 404);
    const blobs = [[3,4,3,2],[9,3,3,3],[6,9,4,3],[11,10,2,2],[2,11,2,2]];
    ctx.fillStyle = '#f0c832';                 // тёплое золото
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle = '#fbe27a';                 // светлый блик
    for (const [bx,by] of blobs) ctx.fillRect(bx,by,1,1);
    ctx.fillStyle = '#a8841c';                 // тень
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx+bw-1,by+bh-1,1,1);
  });
  // незерская золотая руда — незерак с золотыми крупинками (как в MC)
  TEX.nether_gold_ore = makeTex(ctx => {
    pixelFill(ctx, ['#5a1f1f','#6e2626','#4a1818','#7a2c2c','#3e1414'], [5,4,4,2,2], 2828);
    ctx.fillStyle = '#2c0e0e';
    for (const [gx,gy] of [[3,3],[12,9],[2,12]]) ctx.fillRect(gx,gy,2,2);
    ctx.fillStyle = '#8a3434';
    for (const [gx,gy] of [[3,3],[12,9],[2,12]]) ctx.fillRect(gx,gy-1,2,1);
    const blobs = [[4,2,3,2],[9,5,3,3],[3,8,3,2],[11,11,2,2],[7,12,2,2]];
    ctx.fillStyle = '#f0c832';
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx,by,bw,bh);
    ctx.fillStyle = '#fbe27a';
    for (const [bx,by] of blobs) ctx.fillRect(bx,by,1,1);
    ctx.fillStyle = '#a8841c';
    for (const [bx,by,bw,bh] of blobs) ctx.fillRect(bx+bw-1,by+bh-1,1,1);
  });
  // золотой блок — слитое золото с объёмной фаской и чеканкой (как в MC)
  TEX.gold_block = makeTex(ctx => {
    pixelFill(ctx, ['#f0c832','#e8bc28','#f6d24a','#dfae1e'], [5,4,3,2], 4747);
    // светлая фаска сверху/слева
    ctx.fillStyle = '#fdf0a0';
    ctx.fillRect(0,0,16,1); ctx.fillRect(0,0,1,16);
    // тёмная фаска снизу/справа
    ctx.fillStyle = '#a8841c';
    ctx.fillRect(0,15,16,1); ctx.fillRect(15,0,1,16);
    // центральная чеканка
    ctx.fillStyle = '#f6d24a';
    ctx.fillRect(4,4,8,8);
    ctx.fillStyle = '#fdf0a0';
    ctx.fillRect(4,4,8,1); ctx.fillRect(4,4,1,8);
    ctx.fillStyle = '#c8981e';
    ctx.fillRect(4,11,8,1); ctx.fillRect(11,4,1,8);
    // искристые блики
    ctx.fillStyle = '#fff8cc';
    ctx.fillRect(6,6,1,1); ctx.fillRect(9,8,1,1);
  });
  // гравий — округлая галька разных тонов с мокрыми бликами
  TEX.gravel = makeTex(ctx => {
    pixelFill(ctx, ['#8a8480','#9a938c','#76706a','#a39c94','#6a625c'], [5,4,4,2,2], 2424);
    // галька: каждая — со светом сверху и тенью снизу
    const pebbles = [[2,2],[7,1],[12,4],[4,7],[9,8],[1,11],[6,12],[12,11]];
    for (const [gx,gy] of pebbles) {
      ctx.fillStyle = '#5a544e'; ctx.fillRect(gx,gy,2,2);
      ctx.fillStyle = '#8a8480'; ctx.fillRect(gx,gy,2,1);
      ctx.fillStyle = '#b0a89e'; ctx.fillRect(gx,gy,1,1);
    }
    // светлые блестящие камешки
    ctx.fillStyle = '#c8c0b4';
    for (const [gx,gy] of [[10,2],[3,9],[13,8],[8,14]]) ctx.fillRect(gx,gy,1,1);
  });
  // обсидиан — стеклянисто-чёрный с фиолетовым отливом и сколами
  TEX.obsidian = makeTex(ctx => {
    pixelFill(ctx, ['#140d22','#0e0a1a','#1c1430','#0a0814'], [5,4,3,3], 2525);
    // диагональные стеклянные блики
    ctx.fillStyle = '#3a2a5c';
    for (let i = 0; i < 9; i++) ctx.fillRect(2 + i, 12 - i, 1, 1);
    ctx.fillStyle = '#5a3f8a';
    for (let i = 0; i < 5; i++) ctx.fillRect(9 + i, 14 - i, 1, 1);
    // острые сколы-грани
    ctx.fillStyle = '#2e2050';
    ctx.fillRect(3,3,1,2); ctx.fillRect(12,6,1,3); ctx.fillRect(6,10,2,1);
    // редкие фиолетовые искры
    ctx.fillStyle = '#8a6ad0';
    ctx.fillRect(5,5,1,1); ctx.fillRect(11,12,1,1);
  });
  // незерак — багровый пористый камень с «порами»-кратерами
  TEX.netherrack = makeTex(ctx => {
    pixelFill(ctx, ['#5a1f1f','#6e2626','#4a1818','#7a2c2c','#3e1414'], [5,4,4,2,2], 2828);
    // поры: тёмные кратеры со светлым верхним ободком
    const pores = [[3,3],[10,2],[6,7],[12,9],[2,12],[8,13],[13,5]];
    for (const [gx,gy] of pores) {
      ctx.fillStyle = '#2c0e0e'; ctx.fillRect(gx,gy,2,2);
      ctx.fillStyle = '#8a3434'; ctx.fillRect(gx,gy-1,2,1);
    }
    // мясистые светлые наросты
    ctx.fillStyle = '#933c3c';
    for (const [gx,gy] of [[1,1],[7,5],[12,12],[4,10],[14,1]]) ctx.fillRect(gx,gy,2,1);
    ctx.fillStyle = '#b04545';
    for (const [gx,gy] of [[2,1],[8,5],[13,12]]) ctx.fillRect(gx,gy,1,1);
  });
  // светопыль — мозаика ярких светящихся «зёрен» в янтарной кайме (как в MC)
  TEX.glowstone = makeTex(ctx => {
    pixelFill(ctx, ['#d49028','#c07c1c','#b06e14'], [4,3,3], 2929);
    // яркая мозаика: блоки 3x3/2x2 светло-жёлтых зёрен
    const grains = [[1,1,3,3],[6,1,3,2],[11,2,3,3],[2,6,2,3],[6,6,3,3],[11,7,2,3],[1,12,3,2],[6,12,3,2],[11,12,3,2],[4,4,2,2],[9,4,2,2]];
    for (const [gx,gy,gw,gh] of grains) {
      ctx.fillStyle = '#f8d878'; ctx.fillRect(gx,gy,gw,gh);
      ctx.fillStyle = '#fff0a8'; ctx.fillRect(gx,gy,gw-1,1); ctx.fillRect(gx,gy,1,gh-1);
      ctx.fillStyle = '#e8b84a'; ctx.fillRect(gx+gw-1,gy+gh-1,1,1);
    }
    // тёмные швы между зёрнами
    ctx.fillStyle = '#8a5a10';
    ctx.fillRect(0,5,16,1); ctx.fillRect(0,11,16,1);
    ctx.fillRect(5,0,1,16); ctx.fillRect(10,0,1,16);
  });
  // кожа — текстура для предметной иконки рисуется кодом; здесь не нужна
  // стекло — прозрачное с рамкой, угловыми швами и бликом
  TEX.glass = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    // рамка со слегка «старым» стеклом
    ctx.strokeStyle = 'rgba(225,242,255,0.95)'; ctx.lineWidth=1;
    ctx.strokeRect(0.5,0.5,15,15);
    // швы в углах (свинцовая раскладка)
    ctx.fillStyle = 'rgba(200,225,245,0.75)';
    ctx.fillRect(0,0,2,1); ctx.fillRect(0,0,1,2); ctx.fillRect(14,0,2,1); ctx.fillRect(15,0,1,2);
    ctx.fillRect(0,14,2,2); ctx.fillRect(14,14,2,2);
    // диагональные блики
    ctx.strokeStyle = 'rgba(235,250,255,0.55)';
    ctx.beginPath(); ctx.moveTo(3,12); ctx.lineTo(10,4); ctx.stroke();
    ctx.strokeStyle = 'rgba(235,250,255,0.35)';
    ctx.beginPath(); ctx.moveTo(6,13); ctx.lineTo(12,6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(9,13); ctx.lineTo(13,8); ctx.stroke();
    // точечный блеск
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(4,10,1,1); ctx.fillRect(10,4,1,1);
  });
  // печь: бок/верх — гладкий камень; перед — топка с решёткой
  TEX.furnace_side = makeTex(ctx => {
    noiseFill(ctx, 0x8a8a8a, 10);
    // тёмная рамка по краю
    ctx.strokeStyle = '#6c6c6c'; ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 15, 15);
    // лёгкие сколы
    ctx.fillStyle = '#787878'; ctx.fillRect(3,4,2,1); ctx.fillRect(11,9,2,1); ctx.fillRect(6,12,2,1);
    ctx.fillStyle = '#9a9a9a'; ctx.fillRect(2,10,1,2); ctx.fillRect(12,3,1,2);
  });
  TEX.furnace_top = makeTex(ctx => {
    noiseFill(ctx, 0x8a8a8a, 10);
    ctx.strokeStyle = '#6c6c6c'; ctx.lineWidth = 1; ctx.strokeRect(0.5,0.5,15,15);
    // дымоход в центре
    ctx.fillStyle = '#5a5a5a'; ctx.fillRect(5,5,6,6);
    ctx.fillStyle = '#3a3a3a'; ctx.fillRect(6,6,4,4);
  });
  TEX.furnace_front = makeTex(ctx => {
    noiseFill(ctx, 0x8a8a8a, 10);
    ctx.strokeStyle = '#6c6c6c'; ctx.lineWidth = 1; ctx.strokeRect(0.5,0.5,15,15);
    // тёмная топка
    ctx.fillStyle = '#3a3128'; ctx.fillRect(3,4,10,9);
    ctx.fillStyle = '#1c1712'; ctx.fillRect(4,5,8,7);
    // решётка-вентиляция
    ctx.fillStyle = '#555'; for (let x=4;x<12;x+=2) ctx.fillRect(x,5,1,7);
    // нижняя металлическая планка
    ctx.fillStyle = '#777'; ctx.fillRect(3,12,10,1);
    // огонёк (потухший)
    ctx.fillStyle = '#3a2a18'; ctx.fillRect(6,9,4,3);
  });
  // печь зажжённая — светящаяся топка
  TEX.furnace_front_lit = makeTex(ctx => {
    noiseFill(ctx, 0x8a8a8a, 10);
    ctx.strokeStyle = '#6c6c6c'; ctx.lineWidth = 1; ctx.strokeRect(0.5,0.5,15,15);
    ctx.fillStyle = '#2a1c10'; ctx.fillRect(3,4,10,9);
    ctx.fillStyle = '#1c1712'; ctx.fillRect(4,5,8,7);
    ctx.fillStyle = '#555'; for (let x=4;x<12;x+=2) ctx.fillRect(x,5,1,7);
    ctx.fillStyle = '#777'; ctx.fillRect(3,12,10,1);
    // пламя
    ctx.fillStyle = '#ff6a1a'; ctx.fillRect(5,9,6,3);
    ctx.fillStyle = '#ffb030'; ctx.fillRect(6,10,4,2);
    ctx.fillStyle = '#ffe060'; ctx.fillRect(7,11,2,1);
  });
  // дверь: верхняя половинка (с окошком) и нижняя
  TEX.door_top = makeTex(ctx => {
    noiseFill(ctx, 0x9c6b35, 14);
    ctx.fillStyle = '#6e4a22'; ctx.strokeStyle='#6e4a22';
    ctx.strokeRect(1.5,1.5,13,13);
    ctx.fillStyle = 'rgba(150,200,230,0.6)'; ctx.fillRect(4,3,8,5); // окошко
    // ручка только на нижней половине (как в MC)
  });
  TEX.door_bottom = makeTex(ctx => {
    // нижняя половина двери: рама + филёнка-панель (как двери MC)
    noiseFill(ctx, 0x9c6b35, 12);
    ctx.strokeStyle = '#6e4a22'; ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, 15, 15);         // внешняя рама
    // панель-филёнка с объёмом (тень сверху, блик снизу)
    ctx.fillStyle = '#8a5c2c'; ctx.fillRect(2, 1, 12, 13);
    ctx.fillStyle = '#6e4a22'; ctx.fillRect(2, 1, 12, 1); ctx.fillRect(2, 1, 1, 13);   // верх/лево тень
    ctx.fillStyle = '#b98e4d'; ctx.fillRect(2, 13, 12, 1); ctx.fillRect(13, 1, 1, 13); // низ/право блик
    ctx.fillStyle = '#7a5326';
    ctx.fillRect(4, 4, 8, 1); ctx.fillRect(4, 10, 8, 1);    // внутренние каннелюры
    // ручка
    ctx.fillStyle = '#3a2712'; ctx.fillRect(12,7,2,2);
    ctx.fillStyle = '#5a3d1d'; ctx.fillRect(12,7,1,1);
  });
  // сундук: доски с тёмной обвязкой по краям и фактурой древесины
  const woodGrain = (ctx, base) => {
    noiseFill(ctx, base, 10);
    // горизонтальные волокна
    ctx.globalAlpha = 0.35;
    for (let y=1;y<16;y+=2){ ctx.fillStyle = shade(base, -14); ctx.fillRect(0,y,16,1); }
    ctx.globalAlpha = 1;
  };
  TEX.chest_top = makeTex(ctx => {
    woodGrain(ctx, 0xb07a36);
    // обвязка по периметру
    ctx.fillStyle = '#4d3416';
    ctx.fillRect(0,0,16,2); ctx.fillRect(0,14,16,2); ctx.fillRect(0,0,2,16); ctx.fillRect(14,0,2,16);
    // средняя планка
    ctx.fillRect(7,0,2,16);
    ctx.fillStyle = '#6b4a20'; ctx.fillRect(2,2,5,12); ctx.fillRect(9,2,5,12);
  });
  TEX.chest_front = makeTex(ctx => {
    woodGrain(ctx, 0xb07a36);
    ctx.fillStyle = '#4d3416';
    ctx.fillRect(0,0,16,2); ctx.fillRect(0,14,16,2); ctx.fillRect(0,0,2,16); ctx.fillRect(14,0,2,16);
    ctx.fillRect(0,7,16,2);                                  // линия крышки
    // петли
    ctx.fillStyle = '#3a2712'; ctx.fillRect(2,7,2,2); ctx.fillRect(12,7,2,2);
    // замок (металл)
    ctx.fillStyle = '#6e6e6e'; ctx.fillRect(6,6,4,5);
    ctx.fillStyle = '#9a9a9a'; ctx.fillRect(7,7,2,3);
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(7,8,2,2);       // скважина
  });
  TEX.chest_side = makeTex(ctx => {
    woodGrain(ctx, 0xa3712f);
    ctx.fillStyle = '#4d3416';
    ctx.fillRect(0,0,16,2); ctx.fillRect(0,14,16,2); ctx.fillRect(0,0,2,16); ctx.fillRect(14,0,2,16);
    ctx.fillRect(0,7,16,2);                                  // линия крышки
    ctx.fillStyle = '#6b4a20'; ctx.fillRect(2,2,12,5); ctx.fillRect(2,9,12,5);
  });
  // двойной сундук: половинки с цельным рисунком (лево/право)
  // передняя грань — левая и правая половины большого сундука
  TEX.dchest_front_left = makeTex(ctx => {
    woodGrain(ctx, 0xb07a36);
    ctx.fillStyle = '#4d3416';
    ctx.fillRect(0,0,16,2); ctx.fillRect(0,14,16,2); ctx.fillRect(0,0,2,16);
    ctx.fillRect(0,7,16,2);                                   // линия крышки
    ctx.fillStyle = '#3a2712'; ctx.fillRect(2,7,2,2);        // петля слева
    // правый край замка (замок на стыке)
    ctx.fillStyle = '#6e6e6e'; ctx.fillRect(13,6,3,5);
    ctx.fillStyle = '#9a9a9a'; ctx.fillRect(14,7,2,3);
  });
  TEX.dchest_front_right = makeTex(ctx => {
    woodGrain(ctx, 0xb07a36);
    ctx.fillStyle = '#4d3416';
    ctx.fillRect(0,0,16,2); ctx.fillRect(0,14,16,2); ctx.fillRect(14,0,2,16);
    ctx.fillRect(0,7,16,2);
    ctx.fillStyle = '#3a2712'; ctx.fillRect(12,7,2,2);       // петля справа
    // левый край замка (замок на стыке)
    ctx.fillStyle = '#6e6e6e'; ctx.fillRect(0,6,3,5);
    ctx.fillStyle = '#9a9a9a'; ctx.fillRect(0,7,2,3);
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(0,8,2,2);        // скважина
  });
  // верх двойного сундука: левая/правая половины (средняя планка только на внешних краях)
  TEX.dchest_top_left = makeTex(ctx => {
    woodGrain(ctx, 0xb07a36);
    ctx.fillStyle = '#4d3416';
    ctx.fillRect(0,0,16,2); ctx.fillRect(0,14,16,2); ctx.fillRect(0,0,2,16);
    ctx.fillStyle = '#6b4a20'; ctx.fillRect(2,2,13,12);
    ctx.fillStyle = '#4d3416'; ctx.fillRect(14,0,2,16);     // стык-планка
  });
  TEX.dchest_top_right = makeTex(ctx => {
    woodGrain(ctx, 0xb07a36);
    ctx.fillStyle = '#4d3416';
    ctx.fillRect(0,0,16,2); ctx.fillRect(0,14,16,2); ctx.fillRect(14,0,2,16);
    ctx.fillStyle = '#6b4a20'; ctx.fillRect(1,2,13,12);
    ctx.fillStyle = '#4d3416'; ctx.fillRect(0,0,2,16);      // стык-планка
  });
  // шерсть (белая по умолчанию) — вязаное плетение «v-стежками»
  TEX.wool = makeTex(ctx => {
    // шерсть с выраженным плетением: волнистые ряды стежков (как в MC)
    pixelFill(ctx, ['#e9e9ec','#dedee2','#f2f2f4','#d2d2d6'], [5,4,3,2], 3333);
    // диагональная вязка «ёлочкой» — чёткие стежки по всей площади
    for (let y = 0; y < 16; y += 2) {
      const off = (y % 4 === 0) ? 0 : 2;
      for (let x = 0; x < 16; x += 4) {
        ctx.fillStyle = '#c2c2c8';
        ctx.fillRect((x + off) % 16, y, 1, 1);
        ctx.fillRect((x + off + 1) % 16, y + 1, 1, 1);
        ctx.fillRect((x + off + 2) % 16, y, 1, 1);
        ctx.fillStyle = '#f8f8fa';
        ctx.fillRect((x + off + 1) % 16, y - 0 < 0 ? 0 : y, 1, 1);
      }
    }
    // вмятины-завитки ворса
    ctx.fillStyle = '#c8c8cd';
    for (const [gx,gy] of [[1,1],[7,3],[13,5],[4,7],[10,9],[2,11],[8,13],[14,14]]) {
      ctx.fillRect(gx,gy,1,1); ctx.fillRect(gx+1,gy+1,1,1);
    }
  });
  // факел — палочка с пламенем (для предметной иконки/билборда)
  TEX.torch = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    // палка
    ctx.fillStyle = '#6b4a24'; ctx.fillRect(7,7,2,8);
    ctx.fillStyle = '#5a3d1d'; ctx.fillRect(7,7,1,8);
    // навершие-уголёк
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(6,5,4,2);
    // пламя
    ctx.fillStyle = '#ff8a20'; ctx.fillRect(6,2,4,4);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(7,3,2,3);
    ctx.fillStyle = '#fff0a0'; ctx.fillRect(7,4,1,1);
  });
  // кровать: верх (одеяло + подушка), бок, торец
  TEX.bed_top_head = makeTex(ctx => {
    // изголовье сверху: красное одеяло + БЕЛАЯ подушка с объёмом (как в MC)
    pixelFill(ctx, ['#b5342e','#a52a24','#c2443d'], [5,4,2], 3131);
    // подушка — пухлая: блик сверху, тень снизу, вертикальные складки
    ctx.fillStyle = '#f4f4f6'; ctx.fillRect(3,2,10,5);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(3,2,10,1);          // блик кромки
    ctx.fillStyle = '#d8d8dc'; ctx.fillRect(3,6,10,1);          // тень снизу
    ctx.fillRect(6,3,1,3); ctx.fillRect(9,3,1,3);               // складки ткани
    // валик-оголовник у стены
    ctx.fillStyle = '#8e211d'; ctx.fillRect(0,0,16,1);
    // тёмный стык одеяла с половиной ножки
    ctx.fillStyle = '#8e211d'; ctx.fillRect(0,15,16,1);
    // блик на одеяле
    ctx.fillStyle = '#d0544d';
    for (const [gx,gy] of [[4,9],[10,10],[6,12],[12,13]]) ctx.fillRect(gx,gy,2,1);
  });
  TEX.bed_top_foot = makeTex(ctx => {
    // ножка сверху: одеяло с поперечными складками и загибом у торца (как в MC)
    pixelFill(ctx, ['#b5342e','#a52a24','#c2443d'], [5,4,2], 3132);
    // тёмный стык с изголовьем
    ctx.fillStyle = '#8e211d'; ctx.fillRect(0,0,16,1);
    // поперечные складки одеяла (свет+тень парами)
    for (const y of [4, 8, 12]) {
      ctx.fillStyle = '#8e211d'; ctx.fillRect(0, y, 16, 1);
      ctx.fillStyle = '#d0544d'; ctx.fillRect(0, y + 1, 16, 1);
    }
    // загиб одеяла у торца (отогнутый угол)
    ctx.fillStyle = '#e8776f'; ctx.fillRect(0,14,16,2);
    ctx.fillStyle = '#c2443d'; ctx.fillRect(0,13,16,1);
  });
  TEX.bed_side = makeTex(ctx => {
    // бок: красный матрас + деревянная рама понизу. Ножки больше НЕ рисуем в
    // текстуре — они честная 3D-геометрия по внешним углам кровати (как в MC)
    pixelFill(ctx, ['#b5342e','#a52a24','#c2443d'], [5,4,2], 3133);
    // блик и кромка матраса
    ctx.fillStyle = '#d0544d'; ctx.fillRect(0,1,16,1);
    ctx.fillStyle = '#8e211d'; ctx.fillRect(0,8,16,1);
    // деревянная рама (доски с волокнами) — во всю ширину торца
    ctx.fillStyle = '#7a5326'; ctx.fillRect(0,9,16,7);
    ctx.fillStyle = '#8f6533'; ctx.fillRect(0,10,16,1);         // блик доски
    ctx.fillStyle = '#6e4a26'; ctx.fillRect(0,13,16,1);         // нижний пояс доски
    ctx.fillStyle = '#5e401d'; ctx.fillRect(0,12,16,1);         // тень доски
    ctx.fillStyle = '#5e401d'; ctx.fillRect(0,15,16,1);         // тень под рамой
  });
  TEX.bed_end = makeTex(ctx => {
    // торец: матрас + подушка видна срезом сверху + рама (ножки — 3D-геометрия)
    pixelFill(ctx, ['#b5342e','#a52a24','#c2443d'], [5,4,2], 3134);
    // срез подушки сверху
    ctx.fillStyle = '#f4f4f6'; ctx.fillRect(1,0,14,2);
    ctx.fillStyle = '#d8d8dc'; ctx.fillRect(1,2,14,1);
    // блик матраса
    ctx.fillStyle = '#d0544d'; ctx.fillRect(0,4,16,1);
    ctx.fillStyle = '#8e211d'; ctx.fillRect(0,8,16,1);
    // деревянная рама во всю ширину
    ctx.fillStyle = '#7a5326'; ctx.fillRect(0,9,16,7);
    ctx.fillStyle = '#8f6533'; ctx.fillRect(0,10,16,1);
    ctx.fillStyle = '#6e4a26'; ctx.fillRect(0,13,16,1);
    ctx.fillStyle = '#5e401d'; ctx.fillRect(0,12,16,1);
    ctx.fillStyle = '#5e401d'; ctx.fillRect(0,15,16,1);
  });
  // редстоуновая руда: камень с красными вкраплениями
  TEX.redstone_ore = makeTex(ctx => {
    pixelFill(ctx, ['#888888','#7a7a7a','#969696','#6e6e6e'], [5,4,3,2], 1818);
    // красные кристаллы редстоуна
    ctx.fillStyle = '#c0201a';
    const spots = [[3,3],[8,2],[12,5],[5,8],[10,10],[2,11],[13,12],[7,13]];
    for (const [gx,gy] of spots) { ctx.fillRect(gx,gy,2,2); }
    ctx.fillStyle = '#ff4830'; // блик
    for (const [gx,gy] of [[3,3],[8,2],[12,5],[5,8]]) ctx.fillRect(gx,gy,1,1);
  });
  // редстоуновая руда (светящаяся, при клике/наступании)
  TEX.redstone_ore_lit = makeTex(ctx => {
    pixelFill(ctx, ['#888888','#7a7a7a','#969696','#6e6e6e'], [5,4,3,2], 1819);
    ctx.fillStyle = '#ff3020';
    const spots = [[3,3],[8,2],[12,5],[5,8],[10,10],[2,11],[13,12],[7,13]];
    for (const [gx,gy] of spots) { ctx.fillRect(gx,gy,2,2); }
    ctx.fillStyle = '#ffd060'; // яркое свечение
    for (const [gx,gy] of spots) ctx.fillRect(gx,gy,1,1);
  });
  // редстоуновая пыль: плоский крест/линия на прозрачном фоне
  TEX.redstone_dust = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    // рассыпанная пыль: дорожки с РВАНЫМИ краями и россыпь крапинок (не «прицел»)
    const dk = '#8e1414', md = '#b81818', lt = '#d82820';
    // горизонтальная дорожка (извилистая: чуть смещаем строки)
    ctx.fillStyle = md;
    ctx.fillRect(1,7,14,2);
    ctx.fillStyle = dk;                                   // рваный нижний край
    for (let x = 0; x < 16; x++) if ((x*7+3)%3) ctx.fillRect(x, 9, 1, 1);
    ctx.fillStyle = lt;                                   // рваный верхний край
    for (let x = 1; x < 15; x++) if ((x*5)%4 < 2) ctx.fillRect(x, 6, 1, 1);
    // вертикальная дорожка
    ctx.fillStyle = md;
    ctx.fillRect(7,1,2,14);
    ctx.fillStyle = dk;
    for (let y = 0; y < 16; y++) if ((y*11+5)%3) ctx.fillRect(9, y, 1, 1);
    ctx.fillStyle = lt;
    for (let y = 1; y < 15; y++) if ((y*3)%4 < 2) ctx.fillRect(6, y, 1, 1);
    // россыпь крупинок вокруг (как просыпанная пыль)
    ctx.fillStyle = dk;
    for (const [gx,gy] of [[2,5],[5,10],[12,4],[13,10],[3,13],[11,12],[1,11],[14,7]]) ctx.fillRect(gx,gy,1,1);
    ctx.fillStyle = md;
    for (const [gx,gy] of [[4,6],[10,9],[12,12],[3,4],[13,3],[6,13]]) ctx.fillRect(gx,gy,1,1);
    // блик в центре
    ctx.fillStyle = '#ff4838'; ctx.fillRect(7,7,2,1); ctx.fillRect(7,8,1,1);
  });
  TEX.redstone_dust_on = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    // горящая пыль — ярче, с раскалённым ядром
    const dk = '#c01010', md = '#f02818', lt = '#ff6840';
    ctx.fillStyle = md;
    ctx.fillRect(1,7,14,2);
    ctx.fillStyle = dk;
    for (let x = 0; x < 16; x++) if ((x*7+3)%3) ctx.fillRect(x, 9, 1, 1);
    ctx.fillStyle = lt;
    for (let x = 1; x < 15; x++) if ((x*5)%4 < 2) ctx.fillRect(x, 6, 1, 1);
    ctx.fillStyle = md;
    ctx.fillRect(7,1,2,14);
    ctx.fillStyle = dk;
    for (let y = 0; y < 16; y++) if ((y*11+5)%3) ctx.fillRect(9, y, 1, 1);
    ctx.fillStyle = lt;
    for (let y = 1; y < 15; y++) if ((y*3)%4 < 2) ctx.fillRect(6, y, 1, 1);
    ctx.fillStyle = dk;
    for (const [gx,gy] of [[2,5],[5,10],[12,4],[13,10],[3,13],[11,12],[1,11],[14,7]]) ctx.fillRect(gx,gy,1,1);
    ctx.fillStyle = md;
    for (const [gx,gy] of [[4,6],[10,9],[12,12],[3,4],[13,3],[6,13]]) ctx.fillRect(gx,gy,1,1);
    ctx.fillStyle = '#ffa890'; ctx.fillRect(7,7,2,1); ctx.fillRect(7,8,1,1);
    ctx.fillStyle = '#ffd0b8'; ctx.fillRect(7,7,1,1);
  });
  // редстоуновый факел: красная палочка с огоньком
  TEX.redstone_torch = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    ctx.fillStyle = '#6b4a24'; ctx.fillRect(7,7,2,8);   // палка
    ctx.fillStyle = '#5a3d1d'; ctx.fillRect(7,7,1,8);
    ctx.fillStyle = '#3a2a1a'; ctx.fillRect(6,5,4,2);
    ctx.fillStyle = '#d82018'; ctx.fillRect(6,2,4,4);   // красный огонёк
    ctx.fillStyle = '#ff5040'; ctx.fillRect(7,3,2,3);
    ctx.fillStyle = '#ffb060'; ctx.fillRect(7,4,1,1);
  });
  // рычаг: корпус + ручка
  TEX.lever = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    // основание (камень)
    ctx.fillStyle = '#7a7a7a'; ctx.fillRect(5,10,6,4);
    ctx.fillStyle = '#5a5a5a'; ctx.fillRect(5,13,6,1);
    // ручка (деревянная палка вверх)
    ctx.fillStyle = '#6b4a24'; ctx.fillRect(7,3,2,8);
    ctx.fillStyle = '#5a3d1d'; ctx.fillRect(7,3,1,8);
    // шарик на конце
    ctx.fillStyle = '#8a6a3f'; ctx.fillRect(6,2,4,3);
    ctx.fillStyle = '#5a3d1d'; ctx.fillRect(6,4,4,1);
  });
  // кнопка: каменное основание + выступающая круглая кнопка (нажата/отпущена)
  TEX.button = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    // каменное основание с фактурой (крошка как у stone)
    pixelFill(ctx, ['#7f7f7f','#8a8a8a','#757575','#949494'], [4,4,3,2], 7171);
    ctx.fillStyle = '#5e5e5e';
    ctx.fillRect(1,13,14,1); ctx.fillRect(14,1,1,14);          // тень граней
    ctx.fillStyle = '#a2a2a2';
    ctx.fillRect(1,1,14,1); ctx.fillRect(1,1,1,14);            // блик граней
    // выпуклая кнопка-камень (как в MC — небольшой прямоугольный выступ)
    ctx.fillStyle = '#8a8a8a'; ctx.fillRect(4,6,8,5);
    ctx.fillStyle = '#a8a8a8'; ctx.fillRect(4,6,8,1); ctx.fillRect(4,6,1,5);   // блик
    ctx.fillStyle = '#5a5a5a'; ctx.fillRect(4,10,8,1); ctx.fillRect(11,6,1,5); // тень
    ctx.fillStyle = '#707070'; ctx.fillRect(5,7,6,3);           // сглаженная грань
    ctx.fillStyle = '#b8b8b8'; ctx.fillRect(5,7,2,1);           // искра
  });
  TEX.button_pressed = makeTex(ctx => {
    ctx.clearRect(0,0,16,16);
    pixelFill(ctx, ['#7f7f7f','#8a8a8a','#757575','#949494'], [4,4,3,2], 7172);
    ctx.fillStyle = '#5e5e5e';
    ctx.fillRect(1,13,14,1); ctx.fillRect(14,1,1,14);
    ctx.fillStyle = '#a2a2a2';
    ctx.fillRect(1,1,14,1); ctx.fillRect(1,1,1,14);
    // кнопка ВДАВЛЕНА: тёмное углубление вместо выступа
    ctx.fillStyle = '#3e3e3e'; ctx.fillRect(4,7,8,5);
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(4,11,8,1); ctx.fillRect(11,7,1,5);
    ctx.fillStyle = '#565656'; ctx.fillRect(4,7,8,1);           // кромка ямки
  });
  // поршень: корпус + лицевая панель
  TEX.piston_side = makeTex(ctx => {
    // бок поршня как в MC: деревянная планка сверху + каменный низ
    pixelFill(ctx, ['#8a8a8a','#7d7d7d','#969696','#717171'], [4,4,3,2], 4040);
    // каменные трещинки
    ctx.fillStyle = '#5e5e5e';
    for (const [gx,gy] of [[3,9],[10,8],[6,12],[12,11],[1,7]]) ctx.fillRect(gx,gy,1,1);
    // деревянная планка сверху (доска с волокнами)
    ctx.fillStyle = '#9c7842'; ctx.fillRect(0,0,16,4);
    ctx.fillStyle = '#b08c50'; ctx.fillRect(0,1,16,1);          // блик доски
    ctx.fillStyle = '#7a5c30';
    for (const gx of [3, 8, 13]) ctx.fillRect(gx,0,1,4);        // швы доски
    // тень от планки на камне
    ctx.fillStyle = '#4a4a4a'; ctx.fillRect(0,4,16,1);
    // болты по углам
    ctx.fillStyle = '#3a3a3e'; ctx.fillRect(1,6,2,2); ctx.fillRect(13,6,2,2);
    ctx.fillStyle = '#56565c'; ctx.fillRect(1,6,1,1); ctx.fillRect(13,6,1,1);
  });
  TEX.piston_top = makeTex(ctx => {
    pixelFill(ctx, ['#8a7a5a','#7a6a4a','#9a8a6a','#6a5a3a'], [5,4,3,2], 4041);
  });
  TEX.piston_face = makeTex(ctx => {
    // серая металлическая лицевая панель
    pixelFill(ctx, ['#6a6a6e','#5a5a5e','#7a7a7e','#4a4a4e'], [5,4,3,2], 4042);
    // центральная втулка (куда выходит шток)
    ctx.fillStyle = '#3a3a3e'; ctx.fillRect(5,5,6,6);
    ctx.fillStyle = '#5a5a5e'; ctx.fillRect(6,6,4,4);
  });
  // голова поршня (выдвинутая) — деревянная plank-плита на штоке
  TEX.piston_head_face = makeTex(ctx => {
    pixelFill(ctx, ['#b98e4d','#a87e3d','#c99e5d','#976e2d'], [5,4,3,2], 4043);
  });
  TEX.piston_head_side = makeTex(ctx => {
    // деревянная плита-голова на металлическом штоке (как в MC)
    ctx.fillStyle = '#8f8f94'; ctx.fillRect(6,0,4,7);           // шток
    ctx.fillStyle = '#6a6a70'; ctx.fillRect(6,0,1,7);           // тень штока
    ctx.fillStyle = '#b8b8c0'; ctx.fillRect(9,0,1,7);           // блик штока
    ctx.fillStyle = '#4a4a4e'; ctx.fillRect(5,0,1,7); ctx.fillRect(10,0,1,7); // канавки штока
    // голова — доска с волокнами и кромкой
    ctx.fillStyle = '#b98e4d'; ctx.fillRect(2,7,12,9);
    ctx.fillStyle = '#c99e5d'; ctx.fillRect(2,8,12,1);          // блик
    ctx.fillStyle = '#a87e3d'; ctx.fillRect(2,14,12,2);         // низ темнее
    ctx.fillStyle = '#8a6a34'; ctx.fillRect(2,7,1,9); ctx.fillRect(13,7,1,9); // торцы
    ctx.fillStyle = '#9c7842';
    for (const gy of [10, 13]) ctx.fillRect(3,gy,10,1);         // волокна
  });
  // ---- Командный блок (импульсный, как в MC: тёмный с оранжевым узором) ----
  TEX.cmd_side = makeTex(ctx => {
    // корпус КБ: тёмная однородная база + «экран» со строками команды (как в MC)
    pixelFill(ctx, ['#3f3a30','#38332b','#463f35','#332e27'], [5,4,3,2], 5051);
    // оранжевая рамка-кайма по краю (фирменный узор КБ)
    ctx.fillStyle = '#c87f0e';
    ctx.fillRect(0,0,16,1); ctx.fillRect(0,15,16,1); ctx.fillRect(0,0,1,16); ctx.fillRect(15,0,1,16);
    ctx.fillStyle = '#8a5a10'; // тень рамки
    ctx.fillRect(1,1,14,1); ctx.fillRect(1,14,14,1); ctx.fillRect(1,1,1,14); ctx.fillRect(14,1,1,14);
    // «экран» — тёмная вставка с зелёными строками команды (как консоль)
    ctx.fillStyle = '#23201b'; ctx.fillRect(3,3,10,10);
    ctx.fillStyle = '#57b04a';                                  // строки кода
    ctx.fillRect(4,4,6,1); ctx.fillRect(4,6,8,1); ctx.fillRect(4,8,5,1);
    ctx.fillStyle = '#9ad48a';                                  // яркая строка (курсор)
    ctx.fillRect(4,10,3,1); ctx.fillRect(8,10,1,1);
    ctx.fillStyle = '#c87f0e';                                  // жёлтая ошибка-строка
    ctx.fillRect(11,8,1,1);
  });
  TEX.cmd_front = makeTex(ctx => {
    // перед с оранжевой стрелкой «команда» (импульсный КБ)
    pixelFill(ctx, ['#4a4238','#3e382e','#544c40','#35302a'], [5,4,3,2], 5052);
    ctx.fillStyle = '#c87f0e';
    ctx.fillRect(0,0,16,1); ctx.fillRect(0,15,16,1); ctx.fillRect(0,0,1,16); ctx.fillRect(15,0,1,16);
    // оранжевая стрелка вверх (как у impulse-блока MC)
    ctx.fillStyle = '#e89020';
    ctx.beginPath();
    ctx.moveTo(8,3); ctx.lineTo(12,8); ctx.lineTo(10,8); ctx.lineTo(10,12);
    ctx.lineTo(6,12); ctx.lineTo(6,8); ctx.lineTo(4,8); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ffd070'; ctx.fillRect(8,4,1,3); // блик стрелки
    // «> _» — строка команды
    ctx.fillStyle = '#e8a020';
    ctx.fillRect(3,13,2,1); ctx.fillRect(4,12,1,1); ctx.fillRect(5,13,2,1); // стрелка-промпт
    ctx.fillRect(8,13,4,1);
  });
}

buildTextures();

// ---------- Текстуры трещин (анимация ломания, 10 стадий) ----------
const CRACK_TEX = [];
function buildCrackTextures() {
  for (let stage = 0; stage < 10; stage++) {
    const c = document.createElement('canvas');
    c.width = 16; c.height = 16;
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, 16, 16);
    ctx.strokeStyle = 'rgba(0,0,0,0.55)';
    ctx.lineWidth = 1;
    // чем выше стадия — тем больше трещин
    const cracks = stage + 1;
    // детерминированный псевдослучай по стадии
    let seed = 12345 + stage * 777;
    const rnd = () => { seed = (Math.imul(seed, 1103515245) + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
    for (let i = 0; i < cracks; i++) {
      let x = 2 + rnd() * 12;
      let y = 2 + rnd() * 12;
      ctx.beginPath();
      ctx.moveTo(x, y);
      const segs = 2 + (rnd() * 3 | 0);
      for (let s = 0; s < segs; s++) {
        x += (rnd() - 0.5) * 8;
        y += (rnd() - 0.5) * 8;
        x = Math.max(0, Math.min(16, x));
        y = Math.max(0, Math.min(16, y));
        ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    const t = new THREE.CanvasTexture(c);
    t.magFilter = THREE.NearestFilter;
    t.minFilter = THREE.NearestFilter;
    CRACK_TEX.push(t);
  }
}
buildCrackTextures();

// ------------------------------------------------------------
//  Двухканальное запечённое освещение.
//  В цвете вершин храним ТРИ канала: color.r = свет от источников
//  (факелы/лава, 0..1), color.g = небесный свет (0..1), color.b =
//  затенение грани/AO (направление + ambient occlusion).
//  Итоговую яркость миксует шейдер: max(sky * uDayFactor, block) —
//  поэтому смена времени суток меняет один юниформ на GPU и НЕ требует
//  перестройки чанков (раньше каждое «щелчковое» изменение уровня неба
//  перестраивало ВСЕ чанки — постоянные фризы на рассвете/закате).
// ------------------------------------------------------------
// Фактор неба: 1.0 = полдень, ~0.27 = ночь (соответствует старому 4..15)
const DAY_LIGHT_UNIFORM = { value: 1.0 };
function applyDayMixShader(mat) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uDayFactor = DAY_LIGHT_UNIFORM;
    shader.vertexShader = 'uniform float uDayFactor;\n' + shader.vertexShader.replace(
      '#include <color_vertex>',
      [
        '#include <color_vertex>',
        '#ifdef USE_COLOR',
        '  float _mcl = max(color.g * uDayFactor, color.r);',
        '  vColor.rgb = vec3((0.05 + pow(_mcl, 1.35) * 0.95) * color.b);', // vColor — vec4 (three r139+)
        '#endif',
      ].join('\n')
    );
  };
  // общий суффикс программного кеша для всех запатченных материалов
  mat.customProgramCacheKey = () => 'minicraft-daymix';
  return mat;
}

function texToMaterial(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  // vertexColors — для запечённого освещения (skylight + факелы)
  return applyDayMixShader(new THREE.MeshLambertMaterial({ map: t, vertexColors: true }));
}

function waterMaterial(canvas) {
  const t = new THREE.CanvasTexture(canvas);
  t.magFilter = THREE.NearestFilter;
  t.minFilter = THREE.NearestFilter;
  return applyDayMixShader(new THREE.MeshLambertMaterial({
    map: t, transparent: true, opacity: 0.72,
    depthWrite: false, side: THREE.DoubleSide, vertexColors: true,
  }));
}

// Материалы по граням: [px, nx, py, ny, pz, nz] (Three.js BoxGeometry порядок)
let MATERIALS = {};
function buildMaterials() {
  const mGrassTop  = texToMaterial(TEX.grass_top);
  const mGrassSide = texToMaterial(TEX.grass_side);
  const mDirt      = texToMaterial(TEX.dirt);
  const mStone     = texToMaterial(TEX.stone);
  const mBedrock   = texToMaterial(TEX.bedrock);
  const mWater     = waterMaterial(TEX.water);
  const mSand      = texToMaterial(TEX.sand);
  const mWoodSide  = texToMaterial(TEX.wood_side);
  const mWoodTop   = texToMaterial(TEX.wood_top);
  const mPlanks    = texToMaterial(TEX.planks);
  const mCraftTop  = texToMaterial(TEX.craft_top);
  const mCraftSide = texToMaterial(TEX.craft_side);
  const mCobble    = texToMaterial(TEX.cobble);
  const mCoalOre   = texToMaterial(TEX.coal_ore);
  const mIronOre   = texToMaterial(TEX.iron_ore);
  const mCopperOre = texToMaterial(TEX.copper_ore);
  const mDiamondOre= texToMaterial(TEX.diamond_ore);
  const mGoldOre   = texToMaterial(TEX.gold_ore);
  const mNGoldOre  = texToMaterial(TEX.nether_gold_ore);
  const mGoldBlock = texToMaterial(TEX.gold_block);
  const mGravel    = texToMaterial(TEX.gravel);
  const mObsidian  = texToMaterial(TEX.obsidian);
  const mNetherrack= texToMaterial(TEX.netherrack);
  const mDeepslate = texToMaterial(TEX.deepslate);
  const mWool      = texToMaterial(TEX.wool);
  // светопыль — яркая, не затемняется (свечение)
  const mGlowstone = (() => {
    const t = new THREE.CanvasTexture(TEX.glowstone);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return new THREE.MeshBasicMaterial({ map: t });
  })();
  const mFurSide   = texToMaterial(TEX.furnace_side);
  const mFurTop    = texToMaterial(TEX.furnace_top);
  const mFurFront  = texToMaterial(TEX.furnace_front);
  const mDoorTop   = texToMaterial(TEX.door_top);
  const mDoorBot   = texToMaterial(TEX.door_bottom);
  const mChestTop  = texToMaterial(TEX.chest_top);
  const mChestFront= texToMaterial(TEX.chest_front);
  const mChestSide = texToMaterial(TEX.chest_side);
  const mDChestFL  = texToMaterial(TEX.dchest_front_left);
  const mDChestFR  = texToMaterial(TEX.dchest_front_right);
  const mDChestTL  = texToMaterial(TEX.dchest_top_left);
  const mDChestTR  = texToMaterial(TEX.dchest_top_right);
  const mBedTopHead= texToMaterial(TEX.bed_top_head);
  const mBedTopFoot= texToMaterial(TEX.bed_top_foot);
  const mBedSide   = texToMaterial(TEX.bed_side);
  const mBedEnd    = texToMaterial(TEX.bed_end);
  // листва: прозрачные «дырки», видна с обеих сторон
  const mLeaves = (() => {
    const t = new THREE.CanvasTexture(TEX.leaves);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return applyDayMixShader(new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, vertexColors: true }));
  })();
  // стекло: прозрачное
  const mGlass = (() => {
    const t = new THREE.CanvasTexture(TEX.glass);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return applyDayMixShader(new THREE.MeshLambertMaterial({ map: t, transparent: true, opacity: 0.55, side: THREE.DoubleSide, vertexColors: true }));
  })();
  // дверь: тонкая, с прозрачностью у окошка
  const mDoorTopT = (() => {
    const t = new THREE.CanvasTexture(TEX.door_top);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return applyDayMixShader(new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.1, side: THREE.DoubleSide, vertexColors: true }));
  })();

  MATERIALS[BLOCK.GRASS]   = [mGrassSide, mGrassSide, mGrassTop, mDirt, mGrassSide, mGrassSide];
  MATERIALS[BLOCK.DIRT]    = [mDirt, mDirt, mDirt, mDirt, mDirt, mDirt];
  MATERIALS[BLOCK.STONE]   = [mStone, mStone, mStone, mStone, mStone, mStone];
  MATERIALS[BLOCK.BEDROCK] = [mBedrock, mBedrock, mBedrock, mBedrock, mBedrock, mBedrock];
  MATERIALS[BLOCK.WATER]      = [mWater, mWater, mWater, mWater, mWater, mWater];
  MATERIALS[BLOCK.WATER_FLOW] = [mWater, mWater, mWater, mWater, mWater, mWater];
  // лава: яркая (MeshBasicMaterial — не затемняется тенями/освещением, «светится»)
  const mLava = (() => {
    const t = new THREE.CanvasTexture(TEX.lava);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return new THREE.MeshBasicMaterial({ map: t });
  })();
  MATERIALS[BLOCK.LAVA]      = [mLava, mLava, mLava, mLava, mLava, mLava];
  MATERIALS[BLOCK.LAVA_FLOW] = [mLava, mLava, mLava, mLava, mLava, mLava];
  // огонь: прозрачный билборд, светится, виден с обеих сторон
  const mFire = (() => {
    const t = new THREE.CanvasTexture(TEX.fire);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.25, side: THREE.DoubleSide, depthWrite: false });
  })();
  MATERIALS[BLOCK.FIRE] = [mFire, mFire, mFire, mFire, mFire, mFire];
  // портал — полупрозрачный фиолетовый, светится (Basic), виден с обеих сторон
  const mPortal = (() => {
    const t = new THREE.CanvasTexture(TEX.portal);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: 0.7, side: THREE.DoubleSide, depthWrite: false });
  })();
  MATERIALS[BLOCK.NETHER_PORTAL] = [mPortal, mPortal, mPortal, mPortal, mPortal, mPortal];
  MATERIALS[BLOCK.SAND]    = [mSand, mSand, mSand, mSand, mSand, mSand];
  MATERIALS[BLOCK.WOOD]    = [mWoodSide, mWoodSide, mWoodTop, mWoodTop, mWoodSide, mWoodSide];
  MATERIALS[BLOCK.LEAVES]  = [mLeaves, mLeaves, mLeaves, mLeaves, mLeaves, mLeaves];
  MATERIALS[BLOCK.PLANKS]  = [mPlanks, mPlanks, mPlanks, mPlanks, mPlanks, mPlanks];
  MATERIALS[BLOCK.CRAFTING_TABLE] = [mCraftSide, mCraftSide, mCraftTop, mPlanks, mCraftSide, mCraftSide];
  MATERIALS[BLOCK.COBBLESTONE] = [mCobble, mCobble, mCobble, mCobble, mCobble, mCobble];
  MATERIALS[BLOCK.COAL_ORE] = [mCoalOre, mCoalOre, mCoalOre, mCoalOre, mCoalOre, mCoalOre];
  MATERIALS[BLOCK.IRON_ORE] = [mIronOre, mIronOre, mIronOre, mIronOre, mIronOre, mIronOre];
  MATERIALS[BLOCK.COPPER_ORE] = [mCopperOre, mCopperOre, mCopperOre, mCopperOre, mCopperOre, mCopperOre];
  MATERIALS[BLOCK.DIAMOND_ORE] = [mDiamondOre, mDiamondOre, mDiamondOre, mDiamondOre, mDiamondOre, mDiamondOre];
  MATERIALS[BLOCK.GOLD_ORE] = [mGoldOre, mGoldOre, mGoldOre, mGoldOre, mGoldOre, mGoldOre];
  MATERIALS[BLOCK.NETHER_GOLD_ORE] = [mNGoldOre, mNGoldOre, mNGoldOre, mNGoldOre, mNGoldOre, mNGoldOre];
  MATERIALS[BLOCK.GOLD_BLOCK] = [mGoldBlock, mGoldBlock, mGoldBlock, mGoldBlock, mGoldBlock, mGoldBlock];
  MATERIALS[BLOCK.GRAVEL] = [mGravel, mGravel, mGravel, mGravel, mGravel, mGravel];
  MATERIALS[BLOCK.OBSIDIAN] = [mObsidian, mObsidian, mObsidian, mObsidian, mObsidian, mObsidian];
  MATERIALS[BLOCK.NETHERRACK] = [mNetherrack, mNetherrack, mNetherrack, mNetherrack, mNetherrack, mNetherrack];
  MATERIALS[BLOCK.GLOWSTONE] = [mGlowstone, mGlowstone, mGlowstone, mGlowstone, mGlowstone, mGlowstone];
  MATERIALS[BLOCK.DEEPSLATE] = [mDeepslate, mDeepslate, mDeepslate, mDeepslate, mDeepslate, mDeepslate];
  MATERIALS[BLOCK.WOOL] = [mWool, mWool, mWool, mWool, mWool, mWool];
  // факел — светящийся билборд (как огонь), рисуется отдельно в мешере
  const mTorch = (() => {
    const t = new THREE.CanvasTexture(TEX.torch);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, depthWrite: true });
  })();
  MATERIALS[BLOCK.TORCH] = [mTorch, mTorch, mTorch, mTorch, mTorch, mTorch];
  // Кровать: ножная часть (foot) и изголовье (head). Грани: [+X,-X,+Y,-Y,+Z,-Z]
  // ориентация задаётся facing; базово «перед» = +Z (открытый торец у ножной части)
  MATERIALS[BLOCK.BED_FOOT] = [mBedSide, mBedSide, mBedTopFoot, mPlanks, mBedEnd, mBedEnd];
  MATERIALS[BLOCK.BED_HEAD] = [mBedSide, mBedSide, mBedTopHead, mPlanks, mBedEnd, mBedEnd];
  MATERIALS[BLOCK.GLASS]   = [mGlass, mGlass, mGlass, mGlass, mGlass, mGlass];
  // печь: перед — топка (+Z), остальное булыжник
  MATERIALS[BLOCK.FURNACE] = [mFurSide, mFurSide, mFurTop, mFurTop, mFurFront, mFurSide];
  MATERIALS.FURNACE_LIT = [mFurSide, mFurSide, mFurTop, mFurTop, texToMaterial(TEX.furnace_front_lit), mFurSide];
  MATERIALS[BLOCK.DOOR_BOTTOM] = [mDoorBot, mDoorBot, mDoorBot, mDoorBot, mDoorBot, mDoorBot];
  MATERIALS[BLOCK.DOOR_TOP]    = [mDoorTopT, mDoorTopT, mDoorTopT, mDoorTopT, mDoorTopT, mDoorTopT];
  // сундук: перед — замок (+Z), верх/низ — крышка, бока — обвязка
  MATERIALS[BLOCK.CHEST]   = [mChestSide, mChestSide, mChestTop, mChestTop, mChestFront, mChestSide];
  // двойной сундук — половинки (выбираются в мешере по facing/стороне стыка)
  MATERIALS.DCHEST_LEFT  = [mChestSide, mChestSide, mDChestTL, mChestTop, mDChestFL, mChestSide];
  MATERIALS.DCHEST_RIGHT = [mChestSide, mChestSide, mDChestTR, mChestTop, mDChestFR, mChestSide];

  // --- Редстоун ---
  const mRedOre = texToMaterial(TEX.redstone_ore);
  MATERIALS[BLOCK.REDSTONE_ORE] = [mRedOre, mRedOre, mRedOre, mRedOre, mRedOre, mRedOre];
  // светящаяся руда (включается при клике/наступании) — яркая, без затенения
  const mRedOreLit = (() => {
    const t = new THREE.CanvasTexture(TEX.redstone_ore_lit);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return new THREE.MeshBasicMaterial({ map: t });
  })();
  MATERIALS.REDSTONE_ORE_LIT = [mRedOreLit, mRedOreLit, mRedOreLit, mRedOreLit, mRedOreLit, mRedOreLit];
  // пыль — плоский «ковёр» (прозрачный, рисуется как верхняя грань)
  const mDustOff = (() => {
    const t = new THREE.CanvasTexture(TEX.redstone_dust);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return applyDayMixShader(new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide, vertexColors: true }));
  })();
  const mDustOn = (() => {
    const t = new THREE.CanvasTexture(TEX.redstone_dust_on);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.2, side: THREE.DoubleSide });
  })();
  MATERIALS[BLOCK.REDSTONE_DUST] = [mDustOff, mDustOff, mDustOff, mDustOff, mDustOff, mDustOff];
  MATERIALS.REDSTONE_DUST_ON = [mDustOn, mDustOn, mDustOn, mDustOn, mDustOn, mDustOn];
  // редстоуновый факел — светящийся билборд
  const mRTorch = (() => {
    const t = new THREE.CanvasTexture(TEX.redstone_torch);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, depthWrite: true });
  })();
  MATERIALS[BLOCK.REDSTONE_TORCH] = [mRTorch, mRTorch, mRTorch, mRTorch, mRTorch, mRTorch];
  // рычаг — билборд-перекладина
  const mLever = (() => {
    const t = new THREE.CanvasTexture(TEX.lever);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return applyDayMixShader(new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, vertexColors: true }));
  })();
  MATERIALS[BLOCK.LEVER] = [mLever, mLever, mLever, mLever, mLever, mLever];

  // Кнопка — билборд на стене (как рычаг), есть нажатое состояние
  const mButton = (() => {
    const t = new THREE.CanvasTexture(TEX.button);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return applyDayMixShader(new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, vertexColors: true }));
  })();
  const mButtonPressed = (() => {
    const t = new THREE.CanvasTexture(TEX.button_pressed);
    t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    return applyDayMixShader(new THREE.MeshLambertMaterial({ map: t, transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, vertexColors: true }));
  })();
  MATERIALS[BLOCK.BUTTON] = [mButton, mButton, mButton, mButton, mButton, mButton];
  MATERIALS.BUTTON_PRESSED = [mButtonPressed, mButtonPressed, mButtonPressed, mButtonPressed, mButtonPressed, mButtonPressed];

  // Командный блок: перед (+Z по facing) — со стрелкой, остальное — узор с рамкой
  const mCmdSide = texToMaterial(TEX.cmd_side);
  const mCmdFront = texToMaterial(TEX.cmd_front);
  MATERIALS[BLOCK.COMMAND_BLOCK] = [mCmdSide, mCmdSide, mCmdSide, mCmdSide, mCmdFront, mCmdSide];

  // Поршень: корпус (бока/верх) + лицевая панель по направлению (facing)
  const mPistonSide = texToMaterial(TEX.piston_side);
  const mPistonTop  = texToMaterial(TEX.piston_top);
  const mPistonFace = texToMaterial(TEX.piston_face);
  MATERIALS[BLOCK.PISTON] = [mPistonSide, mPistonSide, mPistonTop, mPistonTop, mPistonFace, mPistonSide];
  // голова поршня: лицевая плита + бока со штоком
  const mPistonHeadFace = texToMaterial(TEX.piston_head_face);
  const mPistonHeadSide = texToMaterial(TEX.piston_head_side);
  MATERIALS[BLOCK.PISTON_HEAD] = [mPistonHeadSide, mPistonHeadSide, mPistonHeadFace, mPistonHeadFace, mPistonHeadFace, mPistonHeadSide];
}
buildMaterials();

// Цвет для иконок в UI
const BLOCK_COLOR = {
  [BLOCK.GRASS]: '#5f9e3a',
  [BLOCK.DIRT]: '#8a6a3f',
  [BLOCK.STONE]: '#888888',
  [BLOCK.BEDROCK]: '#4a4a4a',
};

