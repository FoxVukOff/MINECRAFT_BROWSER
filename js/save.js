/* ============================================================
   MiniCraft — save · Профиль игрока, экспорт/импорт миров
   (модуль 33 из 33; строки 11870–11989 исходного game.js)
   ============================================================ */

'use strict';
// ============================================================
//  Профиль игрока — никнейм в localStorage
// ============================================================
const NICK_LS = 'minicraft_nick';
const playerNickEl = document.getElementById('playerNick');
function getPlayerNick() {
  return (localStorage.getItem(NICK_LS) || '').trim();
}
function setPlayerNick(nick) {
  localStorage.setItem(NICK_LS, nick);
}
// загрузить сохранённый ник в поле ввода
playerNickEl.value = getPlayerNick();
playerNickEl.addEventListener('change', () => {
  const v = playerNickEl.value.trim().slice(0, 20);
  playerNickEl.value = v;
  setPlayerNick(v);
});
playerNickEl.addEventListener('input', () => {
  // автосохранение при вводе
  setPlayerNick(playerNickEl.value.trim().slice(0, 20));
});

// ============================================================
//  Экспорт / Импорт миров
// ============================================================
// Экспорт: собрать данные текущего (или выбранного) мира в JSON и скачать файлом
function exportWorld(name) {
  name = name || WorldManager.current;
  if (!name) { alert('Сначала выберите или создайте мир для экспорта'); return; }
  let data;
  try { data = JSON.parse(localStorage.getItem(WorldManager.LS_PREFIX + name)); }
  catch (e) { data = null; }
  if (!data) { alert('Мир «' + name + '» не найден'); return; }
  // если это текущий активный мир — сначала сохранить свежее состояние
  if (WorldManager.current === name) {
    WorldManager.save();
    try { data = JSON.parse(localStorage.getItem(WorldManager.LS_PREFIX + name)); } catch (e) {}
  }
  const payload = {
    format: 'minicraft-world',
    version: 1,
    name: name,
    exportedAt: new Date().toISOString(),
    data: data,
  };
  const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  // безопасное имя файла
  const safe = name.replace(/[^\wа-яА-ЯёЁ0-9 \-_]/g, '_').slice(0, 40) || 'world';
  a.download = safe + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Импорт: считать JSON-файл и записать в базу сохранений
function importWorld(file) {
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const payload = JSON.parse(ev.target.result);
      let data, name;
      if (payload && payload.format === 'minicraft-world' && payload.data) {
        data = payload.data;
        name = payload.name || ('Импорт ' + new Date().toLocaleString());
      } else {
        // совместимость: считаем что файл — это сам data-объект
        data = payload;
        name = 'Импорт ' + new Date().toLocaleString();
      }
      // уникальное имя, чтобы не перезаписать существующий мир
      let finalName = name;
      const existing = WorldManager.list();
      let n = 1;
      while (existing.some(w => w.name === finalName)) {
        finalName = name + ' (' + n + ')';
        n++;
      }
      localStorage.setItem(WorldManager.LS_PREFIX + finalName, JSON.stringify(data));
      const arr = WorldManager.list();
      arr.push({ name: finalName, seed: data.seed | 0, updated: Date.now() });
      WorldManager.saveIndex(arr);
      renderWorldList();
      alert('Мир «' + finalName + '» успешно импортирован!');
    } catch (err) {
      alert('Не удалось импортировать мир: ' + err.message);
    }
  };
  reader.readAsText(file);
}

// кнопки экспорта/импорта в меню
document.getElementById('exportWorldBtn').addEventListener('click', () => {
  // если есть текущий мир — экспортируем его; иначе просим выбрать
  if (WorldManager.current) {
    exportWorld(WorldManager.current);
  } else {
    const worlds = WorldManager.list().sort((a,b) => b.updated - a.updated);
    if (worlds.length === 0) { alert('Нет миров для экспорта'); return; }
    // экспортируем самый свежий
    exportWorld(worlds[0].name);
  }
});
document.getElementById('importWorldBtn').addEventListener('click', () => {
  document.getElementById('importFileInput').click();
});
document.getElementById('importFileInput').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) importWorld(file);
  e.target.value = ''; // сбросить, чтобы можно было выбрать тот же файл снова
});

renderHotbar();
renderWorldList();

requestAnimationFrame(loop);
