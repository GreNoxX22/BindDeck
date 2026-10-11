const $ = (s) => document.querySelector(s);

const COLORS = ['#ff2e88', '#ff4fa3', '#c44dff', '#6f7bff', '#ffb38a', '#ffa6c9', '#d58cff', '#3e8ef7', '#30a46c', '#f5b800', '#8b93a3'];
const MODS = { ControlLeft: 'mCtrl', ShiftLeft: 'mShift', AltLeft: 'mAlt' };
// a nyelvfuggo billentyunevek (lang.js kulcsok)
const NAMES_T = {
  ControlRight: ['k.rightSide', 'Ctrl'], ShiftRight: ['k.rightSide', 'Shift'],
  ArrowUp: ['k.up'], ArrowDown: ['k.down'], ArrowLeft: ['k.left'], ArrowRight: ['k.right'],
  Minus: ['k.minus'], Equal: ['k.equal'], Backquote: ['k.backquote'], IntlBackslash: ['k.intl']
};
const NAMES = {
  ControlLeft: 'Ctrl', ShiftLeft: 'Shift', AltLeft: 'Alt', AltRight: 'AltGr',
  Space: 'Space', Enter: 'Enter', Tab: 'Tab', Escape: 'Esc', Backspace: 'Backspace',
  CapsLock: 'Caps Lock', ScrollLock: 'Scroll Lock',
  Insert: 'Insert', Delete: 'Delete', Home: 'Home', End: 'End', PageUp: 'Page Up', PageDown: 'Page Down',
  NumpadMultiply: 'Num *', NumpadSubtract: 'Num -', NumpadAdd: 'Num +', NumpadDecimal: 'Num ,',
  NumpadDivide: 'Num /', NumpadEnter: 'Num Enter',
  BracketLeft: '[', BracketRight: ']',
  Semicolon: ';', Quote: "'", Backslash: '\\', Comma: ',', Period: '.', Slash: '/',
  XSelect: 'IntlRo (extra)', XExecute: 'IntlYen (extra)', XAttn: 'KanaMode (extra)', XCrSel: 'Lang2 (extra)',
  XExSel: 'Lang1 (extra)', XEraseEof: 'Lang3 (extra)', XClear: 'Lang4 (extra)', XConvert: 'Convert (extra)',
  XNonConvert: 'NonConvert (extra)', XAccept: 'Undo (extra)', XModeChange: 'NumpadEqual (extra)',
  XJunjaMode: 'NumpadComma (extra)', XFinalMode: 'Help (extra)'
};
const PLUS = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>';

let tiles = [];
let games = []; // jatekprofilok: { id, name, folder }
let gameId = ''; // az epp kivalasztott jatek
let active = {}; // mi van epp kivalasztva: { _tiles: csempe id, <csoport id>: kis gomb id }
let keyList = [];
// amit epp szerkesztunk: kind 'tile' (csempe / csoport) vagy 'sub' (csoport kis gombja)
let cur = { kind: 'tile', tile: null, btn: null };
let color = COLORS[0];
let pin = '';
try { pin = localStorage.getItem('pin') || ''; } catch (e) {}
// a QR-kodban benne van a kod (?pin=...): eltaroljuk, es kivesszuk a cimbol
const urlPin = new URLSearchParams(location.search).get('pin');
if (urlPin) {
  pin = urlPin;
  try { localStorage.setItem('pin', pin); } catch (e) {}
  history.replaceState(null, '', location.pathname + location.hash);
}

const newId = () => 't' + Date.now().toString(36);
const clientId = Math.random().toString(36).slice(2);

function keyLabel(code) {
  if (NAMES_T[code]) return t(...NAMES_T[code]);
  if (NAMES[code]) return NAMES[code];
  let m;
  if ((m = /^(?:Key|Digit)(.)$/.exec(code))) return m[1];
  if ((m = /^Numpad(\d)$/.exec(code))) return 'Num ' + m[1];
  return code;
}

function toast(msg, ok) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.toggle('ok', !!ok);
  el.classList.add('show');
  clearTimeout(toast.t);
  toast.t = setTimeout(() => el.classList.remove('show'), 2200);
}

async function api(url, method, body) {
  const r = await fetch(url, {
    method: method || 'GET',
    headers: { 'Content-Type': 'application/json', 'X-Pin': pin, 'X-Client': clientId },
    body: body ? JSON.stringify(body) : undefined
  });
  if (r.status === 401) {
    askPin();
    throw new Error(t('err.pin'));
  }
  if (r.status === 429) throw new Error(t('err.tooMany'));
  if (!r.ok) throw new Error(t('err.http', r.status));
  return r.json();
}

function askPin() {
  const dlg = $('#pinDlg');
  if (!dlg.open) dlg.showModal();
}

async function load() {
  const s = await api('api/state');
  tiles = s.tiles;
  keyList = s.keys;
  active = s.active || {};
  games = s.games;
  gameId = s.game;
  look = s.look;
  zoom = s.zoom || 100;
  profiles = s.profiles;
  fillGames();
  applyLook();
  applyZoom();
  render();
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (tag === 'button') e.type = 'button';
  e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}

function bindLabel(item) {
  const b = el('span', 'bind' + (item.keys.length || item.run ? '' : ' none'));
  if (item.run) b.textContent = item.run.replace(/[\\/]+$/, '').split(/[\\/]/).pop();
  else b.textContent = item.keys.length ? item.keys.map(keyLabel).join(' + ') : t('nobind');
  return b;
}

function render() {
  const editing = document.body.classList.contains('editing');
  const grid = $('#grid');
  grid.replaceChildren();

  if (editing) {
    const g = games.find((x) => x.id === gameId);
    const bar = el('button', 'tile add gamebar', t('game.bar', g ? g.name : ''));
    bar.addEventListener('click', () => openGame(g));
    grid.append(bar);
  }

  for (const t of tiles) {
    if (t.buttons) {
      grid.append(renderGroup(t, editing));
      continue;
    }
    const b = el('button', 'tile');
    b.dataset.g = '_tiles';
    b.dataset.i = t.id;
    b.style.setProperty('--c', t.color);
    if (t.img) {
      const pic = el('img', 'pic');
      pic.src = 'kepek/' + encodeURI(t.img);
      pic.alt = '';
      pic.draggable = false;
      b.classList.add('has-img');
      b.append(pic);
    }
    b.append(el('span', 'name', t.name), bindLabel(t));
    if (editing) b.addEventListener('click', () => openEditor('tile', t));
    else b.addEventListener('pointerdown', (e) => press(e, b, t, { id: t.id }));
    grid.append(b);
  }

  if (editing || !tiles.length) {
    const add = el('button', 'tile add');
    add.innerHTML = PLUS;
    add.append(el('span', '', t('tile.new')));
    add.addEventListener('click', () => openEditor('tile', null));
    grid.append(add);
  }
  applySel();
}

// zold jeloles: az utoljara megnyomott fegyver / kis gomb, illetve a bekapcsolt kapcsolo
function applySel() {
  for (const n of document.querySelectorAll('[data-g]')) n.classList.toggle('sel', active[n.dataset.g] === n.dataset.i);
}

function setActive(r) {
  active = r.active || {};
  applySel();
}

// csoport csempe: nev + tobb kis gomb, mindegyiknek sajat bindje van
function renderGroup(tile, editing) {
  const g = el('div', 'tile group' + (!editing && tile.buttons.length === 1 ? ' single' : ''));
  g.style.setProperty('--c', tile.color);
  const subs = el('div', 'subs');

  for (const s of tile.buttons) {
    const b = el('button', 'sub');
    b.dataset.g = tile.id;
    b.dataset.i = s.id;
    if (s.img) {
      const pic = el('img', 'pic');
      pic.src = 'kepek/' + encodeURI(s.img);
      pic.alt = '';
      pic.draggable = false;
      b.classList.add('has-img');
      b.append(pic);
    }
    b.append(el('span', 'sub-name', s.name), bindLabel(s));
    if (editing) {
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditor('sub', tile, s);
      });
    } else {
      b.addEventListener('pointerdown', (e) => press(e, b, s, { id: tile.id, btn: s.id }));
    }
    subs.append(b);
  }

  if (editing) {
    const add = el('button', 'sub add');
    add.innerHTML = PLUS;
    add.setAttribute('aria-label', t('sub.new'));
    add.addEventListener('click', (e) => {
      e.stopPropagation();
      openEditor('sub', tile, null);
    });
    subs.append(add);
    g.addEventListener('click', () => openEditor('tile', tile));
  }

  const name = el('span', 'name', tile.name);
  // egygombos kapcsolonal a nevre bokve csak a jelzes valt at, billentyu nem megy ki
  if (!editing && tile.buttons.length === 1) {
    name.classList.add('fix');
    name.addEventListener('click', () => {
      api('api/press', 'POST', { id: tile.id, btn: tile.buttons[0].id, mark: true }).then(setActive).catch((err) => toast(err.message));
    });
  }
  g.append(name, subs);
  return g;
}

function press(e, node, item, body) {
  e.preventDefault();
  node.classList.add('on');
  setTimeout(() => node.classList.remove('on'), 140);
  if (vibrate && navigator.vibrate) navigator.vibrate(12);
  if (!item.keys.length && !item.run) return toast(t('press.nobind'));
  api('api/press', 'POST', body).then(setActive).catch((err) => toast(err.message || t('err.conn')));
}

// ---- szerkeszto ----

function setColor(c) {
  color = c;
  for (const s of $('#fColors').children) s.classList.toggle('sel', s.dataset.c === c);
}

function setKeys(keys) {
  const main = keys.length ? keys[keys.length - 1] : '';
  const mods = keys.slice(0, -1);
  for (const [code, id] of Object.entries(MODS)) $('#' + id).checked = mods.includes(code);
  $('#fKey').value = main;
}

function getKeys() {
  const main = $('#fKey').value;
  if (!main) return [];
  const keys = Object.entries(MODS).filter(([code, id]) => $('#' + id).checked && code !== main).map(([code]) => code);
  keys.push(main);
  return keys;
}

// a billentyulista feltoltese; ami mar masik gombon van, az piros X-et kap
let usedKeys = new Map(); // billentyu -> melyik gomb hasznalja

function fillKeys(self) {
  usedKeys = new Map();
  for (const t of tiles) {
    for (const x of t.buttons || [t]) {
      if (x === self || !x.keys.length) continue;
      usedKeys.set(x.keys[x.keys.length - 1], t.buttons ? t.name + ' / ' + x.name : x.name);
    }
  }
  $('#fKey').replaceChildren(new Option(t('none'), ''), ...keyList.map((k) => {
    const used = usedKeys.has(k);
    const o = new Option(used ? '✕ ' + keyLabel(k) + '  -  ' + usedKeys.get(k) : keyLabel(k), k);
    if (used) o.className = 'used';
    return o;
  }));
}

function showKeyWarn() {
  const where = usedKeys.get($('#fKey').value);
  $('#keyWarn').hidden = !where;
  $('#keyWarn').textContent = where ? '✕ ' + t('key.used', where) : '';
  $('#fKey').classList.toggle('used', !!where);
}

// kepvalaszto: az aktualis jatek kepmappajanak kepei (a felhasznalo is masolhat oda sajatot)
let curImg = '';

function markImg() {
  for (const b of $('#fImgs').children) b.classList.toggle('sel', b.dataset.v === curImg);
}

async function fillImages() {
  const box = $('#fImgs');
  box.replaceChildren();
  let r;
  try { r = await api('api/images'); } catch (e) { return; }
  $('#imgHint').textContent = t('img.hint', r.dir);
  const pick = (val, node) => {
    const b = el('button', 'imgpick');
    b.dataset.v = val;
    b.append(node);
    b.addEventListener('click', () => {
      curImg = val;
      markImg();
    });
    return b;
  };
  const list = r.files.map((f) => r.folder + '/' + f);
  // ha a mostani kep masik mappabol van, az is maradjon valaszthato
  if (curImg && !list.includes(curImg)) list.unshift(curImg);
  box.append(pick('', el('span', '', t('img.none'))), ...list.map((v) => {
    const i = el('img', '');
    i.src = 'kepek/' + encodeURI(v);
    i.alt = i.title = v.split('/').pop();
    i.loading = 'lazy';
    return pick(v, i);
  }));
  markImg();
}

// melyik mezok latszanak: csoportnal semmi, kulonben a valasztott muvelet mezoi
function showAction() {
  const group = $('#fGroup').checked;
  const run = $('#fAction').value === 'run';
  $('#actionField').hidden = group;
  $('#keyField').hidden = group || run;
  $('#runField').hidden = group || !run;
  $('#imgField').hidden = group;
}

$('#fAction').addEventListener('change', showAction);

// tallozas: csak az asztali alkalmazasban van (preload.js)
$('#runBrowse').addEventListener('click', async () => {
  const file = await window.binddeck.pickFile();
  if (file) $('#fRun').value = file;
});

function openEditor(kind, tile, btn) {
  cur = { kind, tile, btn: btn || null };
  const sub = kind === 'sub';
  const item = sub ? cur.btn : tile;
  $('#editTitle').textContent = sub
    ? t(item ? 'sub.edit' : 'sub.new')
    : t(item ? 'tile.edit' : 'tile.new');
  $('#fName').value = item ? item.name : '';
  $('#delBtn').style.visibility = item ? 'visible' : 'hidden';
  $('#colorField').hidden = sub;
  $('#groupField').hidden = sub;
  $('#fGroup').checked = !sub && !!(tile && tile.buttons);
  // megnyitast csak a gepen lehet beallitani (a szerver tavolrol el sem fogadja)
  const local = !!conn;
  $('#fAction').value = item && item.run ? 'run' : 'key';
  $('#fAction').options[1].disabled = !local && !(item && item.run);
  $('#fRun').value = (item && item.run) || '';
  $('#fRun').disabled = !local;
  $('#runBrowse').hidden = !(local && window.binddeck);
  $('#runHint').textContent = t(local ? 'run.hint' : 'run.localOnly');
  showAction();
  curImg = (item && item.img) || '';
  fillImages();
  setColor(tile ? tile.color : COLORS[tiles.length % COLORS.length]);
  fillKeys(item);
  setKeys((item && item.keys) || []);
  showKeyWarn();
  disarm();
  $('#editDlg').showModal();
}

async function saveTiles(next) {
  try {
    await api('api/tiles', 'PUT', { tiles: next });
    tiles = next;
    render();
  } catch (err) {
    toast(err.message || t('err.save'));
  }
}

const swap = (list, old, item) => list.map((x) => (x === old ? item : x));

function arm() {
  $('#capBtn').classList.add('armed');
  $('#capBtn').textContent = t('capture.wait');
}

function disarm() {
  $('#capBtn').classList.remove('armed');
  $('#capBtn').textContent = t('capture');
}

$('#capBtn').addEventListener('click', arm);
$('#capBtn').addEventListener('blur', disarm);
$('#capBtn').addEventListener('keydown', (e) => {
  if (!$('#capBtn').classList.contains('armed')) return;
  e.preventDefault();
  // modosito egyedul: varunk a fo billentyure
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return;
  if (!keyList.includes(e.code)) return toast(t('key.unknown', e.code));
  $('#mCtrl').checked = e.ctrlKey;
  $('#mShift').checked = e.shiftKey;
  $('#mAlt').checked = e.altKey;
  $('#fKey').value = e.code;
  showKeyWarn();
  disarm();
});

$('#fKey').addEventListener('change', showKeyWarn);

$('#fGroup').addEventListener('change', showAction);

$('#fColors').append(...COLORS.map((c) => {
  const b = el('button', 'swatch');
  b.dataset.c = c;
  b.style.setProperty('--c', c);
  b.setAttribute('aria-label', c);
  b.addEventListener('click', () => setColor(c));
  return b;
}));

$('#editForm').addEventListener('submit', () => {
  const name = $('#fName').value.trim();
  const { kind, tile, btn } = cur;
  const run = $('#fAction').value === 'run' ? $('#fRun').value.trim() : '';

  if (kind === 'sub') {
    const b = { id: btn ? btn.id : newId(), name, keys: run ? [] : getKeys() };
    if (run) b.run = run;
    if (curImg) b.img = curImg;
    const buttons = btn ? swap(tile.buttons, btn, b) : [...tile.buttons, b];
    return saveTiles(swap(tiles, tile, { ...tile, buttons }));
  }

  const t = { id: tile ? tile.id : newId(), name, color, keys: [] };
  if ($('#fGroup').checked) t.buttons = (tile && tile.buttons) || [];
  else {
    t.keys = run ? [] : getKeys();
    if (run) t.run = run;
    if (curImg) t.img = curImg;
  }
  saveTiles(tile ? swap(tiles, tile, t) : [...tiles, t]);
});

$('#delBtn').addEventListener('click', () => {
  const { kind, tile, btn } = cur;
  $('#editDlg').close();
  if (kind === 'sub') saveTiles(swap(tiles, tile, { ...tile, buttons: tile.buttons.filter((x) => x !== btn) }));
  else saveTiles(tiles.filter((x) => x !== tile));
});

$('#cancelBtn').addEventListener('click', () => $('#editDlg').close());

// ---- jatekprofilok ----

let gameEdit = null; // a szerkesztett jatek, vagy null ha uj

function fillGames() {
  $('#gameSel').replaceChildren(...games.map((g) => new Option(g.name, g.id)), new Option(t('game.new'), '__new'), new Option(t('game.import'), '__imp'));
  $('#gameSel').value = gameId;
}

function openGame(g) {
  gameEdit = g || null;
  $('#gameTitle').textContent = t(g ? 'game.profile' : 'game.newTitle');
  $('#gName').value = g ? g.name : '';
  $('#gDel').style.visibility = g && games.length > 1 ? 'visible' : 'hidden';
  $('#gExport').hidden = !g;
  $('#gHint').textContent = g
    ? t('game.folder', g.dir)
    : t('game.newHint');
  $('#gameDlg').showModal();
}

const reload = () => load().catch((err) => toast(err.message));

// elo frissites: ha masik eszkozon (vagy a gepen) valtozik valami, itt is azonnal latszik
let events = null;
let pendingReload = false;

function listen() {
  if (events) return;
  events = new EventSource('api/events?pin=' + encodeURIComponent(pin));
  events.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.from === clientId) return;
    if (m.type === 'active') return setActive(m);
    // nyitott ablak (szerkeszto, beallitasok) alol nem rantjuk ki az adatokat: bezaraskor frissitunk
    if (document.querySelector('dialog[open]')) pendingReload = true;
    else reload();
  };
}

for (const d of document.querySelectorAll('dialog')) {
  d.addEventListener('close', () => {
    if (!pendingReload || document.querySelector('dialog[open]')) return;
    pendingReload = false;
    reload();
  });
}
const fail = (err) => toast(err.message || t('err.fail'));

$('#gameSel').addEventListener('change', () => {
  const v = $('#gameSel').value;
  if (v === '__new' || v === '__imp') {
    $('#gameSel').value = gameId;
    return v === '__new' ? openGame(null) : $('#impFile').click();
  }
  api('api/game', 'PUT', { id: v }).then(reload).catch(fail);
});

$('#gameForm').addEventListener('submit', () => {
  const name = $('#gName').value.trim();
  const req = gameEdit ? api('api/games/' + gameEdit.id, 'PUT', { name }) : api('api/games', 'POST', { name });
  req.then(reload).catch(fail);
});

$('#gDel').addEventListener('click', () => {
  if (!confirm(t('game.confirm', gameEdit.name))) return;
  $('#gameDlg').close();
  api('api/games/' + gameEdit.id, 'DELETE').then(reload).catch(fail);
});

$('#gCancel').addEventListener('click', () => $('#gameDlg').close());

// export: az egesz jatekprofil egy fajlba (csempek, szinek, meret, kepek)
$('#gExport').addEventListener('click', async () => {
  try {
    const r = await fetch('api/games/' + gameEdit.id + '/export', { headers: { 'X-Pin': pin } });
    if (!r.ok) throw new Error(t('err.http', r.status));
    const blob = await r.blob();
    const name = (gameEdit.name.replace(/[^\w -]/g, '').trim() || 'profile') + '.binddeck';
    // ahol a bongeszo engedi (gepen, az alkalmazasban), ki lehet valasztani, hova mentse
    if (window.showSaveFilePicker) {
      let handle;
      try {
        handle = await window.showSaveFilePicker({
          suggestedName: name,
          types: [{ description: 'BindDeck profile', accept: { 'application/octet-stream': ['.binddeck'] } }]
        });
      } catch (e) {
        return; // megsem
      }
      const out = await handle.createWritable();
      await out.write(blob);
      await out.close();
      return toast(t('game.exported'), true);
    }
    // kulonben (pl. telefonon) sima letoltes
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  } catch (err) {
    fail(err);
  }
});

// import: uj jatekprofil lesz belole, a meglevoket nem irja felul
$('#impFile').addEventListener('change', async () => {
  const file = $('#impFile').files[0];
  $('#impFile').value = '';
  if (!file) return;
  // a fajl nyersen megy fel, a szerver bontja ki es ellenorzi
  try {
    const r = await fetch('api/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream', 'X-Pin': pin, 'X-Client': clientId },
      body: file
    });
    if (r.status === 400) return toast(t('err.import'));
    if (!r.ok) throw new Error(t('err.http', r.status));
    await load();
    toast(t('game.imported'), true);
  } catch (err) {
    fail(err);
  }
});

// ---- szinek es profilok ----

// ebbol a het szinbol szamolja a style.css az osszes tobbit
const LOOK = [['bg'], ['panel'], ['line'], ['text'], ['accent'], ['accent2'], ['sel']];
let look = { profile: '', colors: {} }; // az epp hasznalt szinek
let profiles = []; // elmentett profilok: { name, colors, tileColors }

function applyLook() {
  for (const [k] of LOOK) {
    if (look.colors[k]) document.documentElement.style.setProperty(k === 'accent2' ? '--accent-2' : '--' + k, look.colors[k]);
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta && look.colors.bg) meta.content = look.colors.bg;
}

const saveLook = () => api('api/look', 'PUT', { ...look, zoom }).catch((err) => toast(err.message || t('err.save')));

function fillLook() {
  const sel = $('#pSel');
  sel.replaceChildren(new Option(t('look.custom'), ''), ...profiles.map((p) => new Option(p.name, p.name)));
  sel.value = profiles.some((p) => p.name === look.profile) ? look.profile : '';
  $('#pName').value = sel.value;
  $('#pDel').style.visibility = sel.value ? 'visible' : 'hidden';
  for (const [k] of LOOK) $('#c_' + k).value = look.colors[k];
}

$('#lookColors').append(...LOOK.map(([k]) => {
  const row = el('label', 'colorrow');
  const label = el('span', '');
  label.dataset.i18n = 'c.' + k;
  row.append(label);
  const inp = el('input', '');
  inp.type = 'color';
  inp.id = 'c_' + k;
  // huzas kozben csak elonezet, elengedeskor mentes
  inp.addEventListener('input', () => {
    look.colors[k] = inp.value;
    applyLook();
  });
  inp.addEventListener('change', saveLook);
  row.append(inp);
  return row;
}));

// profil betoltese: az oldal szinei + a csempek elmentett szinei
$('#pSel').addEventListener('change', () => {
  const p = profiles.find((x) => x.name === $('#pSel').value);
  if (p) {
    look = { profile: p.name, colors: { ...p.colors } };
    applyLook();
    saveLook();
    const next = tiles.map((t) => (p.tileColors[t.id] && p.tileColors[t.id] !== t.color ? { ...t, color: p.tileColors[t.id] } : t));
    if (next.some((t, i) => t !== tiles[i])) saveTiles(next);
  }
  fillLook();
});

async function saveProfiles(next, okMsg) {
  try {
    await api('api/profiles', 'PUT', { profiles: next });
    profiles = next;
    await saveLook();
    fillLook();
    toast(okMsg, true);
  } catch (err) {
    toast(err.message || t('err.save'));
  }
}

$('#pSave').addEventListener('click', () => {
  const name = $('#pName').value.trim();
  if (!name) return toast(t('look.needName'));
  const p = { name, colors: { ...look.colors }, tileColors: Object.fromEntries(tiles.map((t) => [t.id, t.color])) };
  look.profile = name;
  saveProfiles(profiles.some((x) => x.name === name) ? profiles.map((x) => (x.name === name ? p : x)) : [...profiles, p], t('look.saved', name));
});

$('#pDel').addEventListener('click', () => {
  const name = $('#pSel').value;
  if (!name) return;
  look.profile = '';
  saveProfiles(profiles.filter((x) => x.name !== name), t('look.deleted', name));
});

// meret (nagyitas): jatekprofilonkent mentve, a szinekkel egyutt
let zoom = 100;

function applyZoom() {
  $('#grid').style.zoom = zoom / 100;
  $('#zoom').value = zoom;
  $('#zoomVal').textContent = zoom + '%';
}

$('#zoom').addEventListener('input', () => {
  zoom = Number($('#zoom').value);
  applyZoom();
});
$('#zoom').addEventListener('change', () => saveLook());

applyZoom();

$('#lookBtn').addEventListener('click', () => {
  const g = games.find((x) => x.id === gameId);
  $('#lookTitle').textContent = t('set.colors') + (g ? ' - ' + g.name : '');
  fillLook();
  $('#lookDlg').showModal();
});

// ---- nyelv, rezges, telefon csatlakoztatasa ----

let vibrate = true;
try { vibrate = localStorage.getItem('vib') !== '0'; } catch (e) {}
$('#vib').checked = vibrate;
$('#vib').addEventListener('change', () => {
  vibrate = $('#vib').checked;
  try { localStorage.setItem('vib', vibrate ? '1' : '0'); } catch (e) {}
});

// nyelvvaltas utan a JS-bol kirakott feliratokat is frissiteni kell
function changeLang(code) {
  setLang(code);
  $('#langSel').value = code;
  $('#editLabel').textContent = t(document.body.classList.contains('editing') ? 'done' : 'edit');
  disarm();
  if (games.length) {
    const g = games.find((x) => x.id === gameId);
    $('#lookTitle').textContent = t('set.colors') + (g ? ' - ' + g.name : '');
    fillGames();
    fillLook();
    render();
  }
}

$('#langSel').append(...LANGS.map(([code, name]) => new Option(name, code)));
$('#langSel').addEventListener('change', () => changeLang($('#langSel').value));

$('#langBtns').append(...LANGS.map(([code, name]) => {
  const b = el('button', 'btn', name);
  b.addEventListener('click', () => {
    changeLang(code);
    $('#langDlg').close();
  });
  return b;
}));

// QR-kod + cim + kod: a szerver csak a geprol megnyitva adja ki, ezert a gomb is csak ott latszik
let conn = null;

async function loadConnect() {
  try {
    const res = await fetch('api/connect');
    conn = res.ok ? await res.json() : null;
  } catch (e) {
    conn = null;
  }
  $('#connBtn').hidden = !(conn && conn.url);
}

function openConnect() {
  if (!conn || !conn.url) return;
  $('#qr').innerHTML = conn.qr;
  $('#cUrl').textContent = conn.url;
  $('#cPin').textContent = conn.pin;
  $('#connDlg').showModal();
}

$('#connBtn').addEventListener('click', openConnect);

$('#editBtn').addEventListener('click', () => {
  const on = document.body.classList.toggle('editing');
  $('#editLabel').textContent = t(on ? 'done' : 'edit');
  render();
});

$('#pinForm').addEventListener('submit', () => {
  pin = $('#pinInput').value.trim();
  try { localStorage.setItem('pin', pin); } catch (e) {}
  $('#pinInput').value = '';
  load().then(listen).catch((err) => toast(err.message));
});

// a pin ablakot ne lehessen Esc-cel bezarni
$('#pinDlg').addEventListener('cancel', (e) => e.preventDefault());

changeLang(lang);
// elso megnyitaskor nyelvvalaszto
if (!langChosen) $('#langDlg').showModal();

load()
  .then(() => {
    listen();
    // kozvetlen link a szinbeallitashoz: .../#szinek
    if (location.hash === '#szinek') $('#lookBtn').click();
    // az alkalmazas elso inditasakor: .../#connect
    return loadConnect().then(() => {
      if (location.hash === '#connect') openConnect();
    });
  })
  .catch((err) => toast(err.message || t('err.conn')));
