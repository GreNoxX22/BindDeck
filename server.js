// BindDeck: csempes weboldal telefonra, a csempek billentyuleutest kuldenek erre a gepre.
// Onalloan is fut (node server.js), a telepitett alkalmazasban a main.js tolti be.

const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const QRCode = require('qrcode');

const PORT = process.env.PORT || 7010;
// adatmappa: telepitett alkalmazasnal a felhasznalo sajat mappaja (BINDDECK_DATA), kulonben a program mappaja
const DATADIR = process.env.BINDDECK_DATA || __dirname;
const DATA = path.join(DATADIR, 'data.json');
const HOLD_MS = 40;

// event.code -> [scancode (set 1), extended]
const SCAN = {};
const add = (code, sc, ext) => { SCAN[code] = [sc, ext ? 1 : 0]; };
const row = (letters, start) => [...letters].forEach((c, i) => add('Key' + c, start + i));

row('QWERTYUIOP', 0x10);
row('ASDFGHJKL', 0x1e);
row('ZXCVBNM', 0x2c);
for (let i = 1; i <= 9; i++) add('Digit' + i, 0x01 + i);
add('Digit0', 0x0b);
for (let i = 1; i <= 10; i++) add('F' + i, 0x3a + i);
add('F11', 0x57);
add('F12', 0x58);
for (let i = 13; i <= 23; i++) add('F' + i, 0x64 + (i - 13));
add('F24', 0x76);
[
  ['Numpad0', 0x52], ['Numpad1', 0x4f], ['Numpad2', 0x50], ['Numpad3', 0x51], ['Numpad4', 0x4b],
  ['Numpad5', 0x4c], ['Numpad6', 0x4d], ['Numpad7', 0x47], ['Numpad8', 0x48], ['Numpad9', 0x49],
  ['NumpadMultiply', 0x37], ['NumpadSubtract', 0x4a], ['NumpadAdd', 0x4e], ['NumpadDecimal', 0x53],
  ['NumpadDivide', 0x35, 1], ['NumpadEnter', 0x1c, 1],
  ['Space', 0x39], ['Enter', 0x1c], ['Tab', 0x0f], ['Escape', 0x01], ['Backspace', 0x0e],
  ['CapsLock', 0x3a], ['ScrollLock', 0x46],
  ['ControlLeft', 0x1d], ['ShiftLeft', 0x2a], ['AltLeft', 0x38],
  ['ControlRight', 0x1d, 1], ['ShiftRight', 0x36], ['AltRight', 0x38, 1],
  ['ArrowUp', 0x48, 1], ['ArrowDown', 0x50, 1], ['ArrowLeft', 0x4b, 1], ['ArrowRight', 0x4d, 1],
  ['Insert', 0x52, 1], ['Delete', 0x53, 1], ['Home', 0x47, 1], ['End', 0x4f, 1],
  ['PageUp', 0x49, 1], ['PageDown', 0x51, 1],
  ['Minus', 0x0c], ['Equal', 0x0d], ['BracketLeft', 0x1a], ['BracketRight', 0x1b],
  ['Semicolon', 0x27], ['Quote', 0x28], ['Backquote', 0x29], ['Backslash', 0x2b],
  ['Comma', 0x33], ['Period', 0x34], ['Slash', 0x35], ['IntlBackslash', 0x56]
].forEach(([code, sc, ext]) => add(code, sc, ext));

// "extra" billentyuk: fizikailag egy billentyuzeten sincsenek rajta, ezert semmivel nem utkoznek.
// Virtualis kodot (vk) ES egy szinten nem hasznalt scancode-ot kuldunk egyutt: [scan, ext, vk].
// Igy a bongeszoben mindharom azonosito egyedi: key (a vk-bol), keyCode (a vk), code (a scancode-bol).
[
  ['XSelect', 0x29, 0x73], ['XExecute', 0x2b, 0x7d], ['XAttn', 0xf6, 0x70], ['XCrSel', 0xf7, 0x71],
  ['XExSel', 0xf8, 0x72], ['XEraseEof', 0xf9, 0x78], ['XClear', 0xfe, 0x77], ['XConvert', 0x1c, 0x79],
  ['XNonConvert', 0x1d, 0x7b], ['XAccept', 0x1e, 0x08, 1], ['XModeChange', 0x1f, 0x59],
  ['XJunjaMode', 0x17, 0x7e], ['XFinalMode', 0x18, 0x3b, 1]
].forEach(([code, vk, sc, ext]) => { SCAN[code] = [sc, ext ? 1 : 0, vk]; });

// ---- adatok ----

const PINFILE = path.join(DATADIR, 'kod.json');
const HEX = /^#[0-9a-f]{6}$/i;

// szinbeallitas: ebbol a het szinbol szarmazik az oldal osszes tobbi szine (lasd style.css)
const LOOK_KEYS = ['bg', 'panel', 'line', 'text', 'accent', 'accent2', 'sel'];
const PINK = { bg: '#120b15', panel: '#1d1222', line: '#4a2a52', text: '#fdeef7', accent: '#ff4fa3', accent2: '#b46bff', sel: '#36e6ff' };
const BLUE = { bg: '#0f1115', panel: '#181b22', line: '#2c313c', text: '#eef0f4', accent: '#3e8ef7', accent2: '#8b93a3', sel: '#30d158' };

let data;
try {
  data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
} catch (e) {
  data = {
    tiles: [
      { id: 'copy', name: 'Copy', color: '#ff2e88', keys: ['ControlLeft', 'KeyC'] },
      { id: 'paste', name: 'Paste', color: '#6f7bff', keys: ['ControlLeft', 'KeyV'] },
      { id: 'undo', name: 'Undo', color: '#c44dff', keys: ['ControlLeft', 'KeyZ'] }
    ]
  };
}
// jatekprofilok: mindegyiknek sajat csempei, jelolesei, szinei, merete es kepmappaja van
if (!data.games) {
  data.games = [{
    id: 'general',
    name: 'General',
    folder: 'General',
    tiles: data.tiles || [],
    active: data.active || {},
    look: data.look || { profile: 'Pink', colors: PINK },
    zoom: 100
  }];
  data.game = 'general';
  delete data.tiles;
  delete data.active;
  delete data.look;
}
const game = () => data.games.find((g) => g.id === data.game) || data.games[0];

// a kepek jatekonkent kulon mappaban vannak, oda a felhasznalo is masolhat sajatot
const IMGDIR = process.env.BINDDECK_DATA ? path.join(DATADIR, 'images') : path.join(__dirname, '..', 'kepek');
const IMG = /^[\w .-]{1,40}\/[\w .-]{1,80}\.(png|jpe?g|webp|svg)$/i;
const okImg = (s) => typeof s === 'string' && IMG.test(s) && !s.includes('..');
for (const g of data.games) fs.mkdirSync(path.join(IMGDIR, g.folder), { recursive: true });

if (!data.profiles) {
  data.profiles = [
    { name: 'Pink', colors: PINK, tileColors: {} },
    { name: 'Blue', colors: BLUE, tileColors: {} }
  ];
}

// a kod kulon fajlban van, igy a data.json (csempek, bindek, szinprofilok) atkuldheto masnak
let pin;
try {
  pin = String(JSON.parse(fs.readFileSync(PINFILE, 'utf8')).pin);
} catch (e) {
  pin = data.pin || String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  fs.writeFileSync(PINFILE, JSON.stringify({ pin }, null, 2));
}
delete data.pin;
save();

function save() {
  fs.writeFileSync(DATA, JSON.stringify(data, null, 2));
}

// kozos resz a csempekben es a csoportok kis gombjaiban: id, nev, billentyuk
// pickRun: megadja, mit nyisson meg a gomb billentyu helyett (lasd cleanTiles)
function cleanItem(t, pickRun) {
  if (!t || typeof t.id !== 'string' || typeof t.name !== 'string') return null;
  if (!Array.isArray(t.keys) || t.keys.length > 4) return null;
  if (!t.keys.every((k) => typeof k === 'string' && Object.hasOwn(SCAN, k))) return null;
  const item = { id: t.id.slice(0, 40), name: t.name.slice(0, 40), keys: [...new Set(t.keys)] };
  // opcionalis kep: "<jatek mappa>/<fajl>" a kepek mappabol
  if (okImg(t.img)) item.img = t.img;
  const run = pickRun(t);
  if (run) {
    item.run = run;
    item.keys = [];
  }
  return item;
}

// A "run" (program, fajl vagy weboldal megnyitasa) csak a geprol allithato be: tavoli keresnel (local = false)
// a keresben levo erteket eldobjuk, es a regi csempek (old) erteke marad. Igy a kod ismereteben sem lehet
// telefonrol tetszoleges programot beallitani.
function cleanTiles(input, local, old) {
  if (!Array.isArray(input) || input.length > 200) return null;
  const oldRun = new Map(); // "csempe id" vagy "csempe id/kis gomb id" -> run
  for (const t of old || []) {
    if (t.run) oldRun.set(t.id, t.run);
    for (const b of t.buttons || []) if (b.run) oldRun.set(t.id + '/' + b.id, b.run);
  }
  const pick = (prefix) => (x) => (local
    ? (typeof x.run === 'string' ? x.run.trim().slice(0, 400) : '')
    : oldRun.get(prefix + x.id) || '');
  const out = [];
  for (const t of input) {
    const item = cleanItem(t, pick(''));
    if (!item || !/^#[0-9a-f]{6}$/i.test(t.color)) return null;
    item.color = t.color;
    // csoport csempe: sajat bind helyett kis gombok
    if (t.buttons !== undefined) {
      if (!Array.isArray(t.buttons) || t.buttons.length > 12) return null;
      item.buttons = t.buttons.map((b) => cleanItem(b, pick(item.id + '/')));
      delete item.run;
      if (item.buttons.includes(null)) return null;
      item.keys = [];
    }
    out.push(item);
  }
  return out;
}

// ---- billentyu kuldes (tartos PowerShell folyamat) ----

// a telepitett alkalmazasban a kod egy archivumban (app.asar) van, de a PowerShell csak rendes fajlt tud futtatni
const KEYS_PS1 = path.join(__dirname, 'keys.ps1').replace('app.asar', 'app.asar.unpacked');

let ps = null;

function startPs() {
  ps = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', KEYS_PS1], {
    windowsHide: true
  });
  ps.stdout.resume();
  ps.stderr.resume();
  ps.on('exit', () => {
    ps = null;
    setTimeout(startPs, 1000);
  });
}

// megnyitas ugy, mintha a Windowsban duplan kattintanal ra: exe (nevvel is, pl. notepad.exe),
// parancsikon, fajl, mappa, webcim, pl. spotify:
function openTarget(target) {
  // a cel kornyezeti valtozoban megy at, igy semmi nem ertelmezi parancskent
  spawn('powershell.exe', ['-NoProfile', '-WindowStyle', 'Hidden', '-Command', 'Start-Process -FilePath $env:BINDDECK_TARGET'], {
    env: { ...process.env, BINDDECK_TARGET: target },
    detached: true,
    stdio: 'ignore',
    windowsHide: true
  }).unref();
}

function sendKeys(codes) {
  if (!ps) return false;
  ps.stdin.write(HOLD_MS + ' ' + codes.map((c) => SCAN[c].join(':')).join(',') + '\n');
  return true;
}

// ---- web ----

const app = express();
const smallJson = express.json({ limit: '200kb' });
const bigJson = express.json({ limit: '40mb' });
app.use((req, res, next) => (req.path === '/api/import' ? bigJson : smallJson)(req, res, next));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/kepek', express.static(IMGDIR));

const isLocal = (ip) => ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1';
const fails = new Map(); // ip -> { n, until }

// a geprol magarol nem kell kod, halozatrol igen
app.use('/api', (req, res, next) => {
  const ip = req.socket.remoteAddress;
  if (isLocal(ip)) return next();
  const f = fails.get(ip);
  if (f && f.until > Date.now()) return res.status(429).json({ error: 'tul sok proba' });
  // az EventSource nem tud fejlecet kuldeni, ott a kod a cimben jon
  if ((req.get('X-Pin') || (req.path === '/events' ? req.query.pin : '')) === pin) {
    fails.delete(ip);
    return next();
  }
  const n = (f ? f.n : 0) + 1;
  fails.set(ip, { n, until: n >= 10 ? Date.now() + 5 * 60 * 1000 : 0 });
  res.status(401).json({ error: 'kod kell' });
});

// elo frissites (SSE): minden sikeres modositas utan szolunk a tobbi megnyitott oldalnak,
// igy amit a gepen allitasz, az a telefonon is azonnal latszik, es forditva
const clients = new Set();

app.use('/api', (req, res, next) => {
  if (req.method !== 'GET') {
    res.on('finish', () => {
      if (res.statusCode !== 200) return;
      const press = req.path === '/press';
      const msg = JSON.stringify({ type: press ? 'active' : 'reload', from: req.get('X-Client') || '', active: press ? game().active || {} : undefined });
      for (const c of clients) c.write('data: ' + msg + '\n\n');
    });
  }
  next();
});

app.get('/api/events', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  res.flushHeaders();
  res.write('retry: 2000\n\n');
  clients.add(res);
  req.on('close', () => clients.delete(res));
});

// nehany halozati eszkoz bontja a csendes kapcsolatot
setInterval(() => { for (const c of clients) c.write(': ping\n\n'); }, 25000).unref();

app.get('/api/state', (req, res) => {
  const g = game();
  res.json({
    tiles: g.tiles,
    keys: Object.keys(SCAN),
    active: g.active || {},
    look: g.look,
    zoom: g.zoom || 100,
    profiles: data.profiles,
    games: data.games.map(({ id, name, folder }) => ({ id, name, folder, dir: path.join(IMGDIR, folder) })),
    game: g.id
  });
});

// telefon csatlakoztatasa: cim + kod + QR-kod. Csak a geprol kerheto le, mert benne van a kod.
app.get('/api/connect', async (req, res) => {
  if (!isLocal(req.socket.remoteAddress)) return res.status(403).json({ error: 'csak a geprol' });
  let url = '';
  for (const list of Object.values(os.networkInterfaces())) {
    for (const a of list) {
      if (!url && a.family === 'IPv4' && !a.internal && !a.address.startsWith('169.254.')) url = 'http://' + a.address + ':' + PORT;
    }
  }
  const qr = url ? await QRCode.toString(url + '/?pin=' + pin, { type: 'svg', margin: 0 }) : '';
  res.json({ url, pin, qr });
});

// ---- jatekprofilok ----

const cleanName = (s) => (typeof s === 'string' ? s.trim().slice(0, 30) : '');

app.put('/api/game', (req, res) => {
  const g = data.games.find((x) => x.id === (req.body && req.body.id));
  if (!g) return res.status(404).json({ error: 'nincs ilyen jatek' });
  data.game = g.id;
  save();
  res.json({ ok: true });
});

// uj, ures jatekprofil a mostani szinekkel; sajat kepmappat kap
function newGame(name) {
  // mappanev a nevbol (ekezetek es kulonleges jelek nelkul), egyedive teve
  const base = name.normalize('NFD').replace(/[^\w -]/g, '').trim() || 'Game';
  let folder = base;
  for (let i = 2; data.games.some((g) => g.folder.toLowerCase() === folder.toLowerCase()); i++) folder = base + ' ' + i;
  fs.mkdirSync(path.join(IMGDIR, folder), { recursive: true });
  const cur = game();
  const g = { id: 'g' + Date.now().toString(36), name, folder, tiles: [], active: {}, look: JSON.parse(JSON.stringify(cur.look)), zoom: cur.zoom || 100 };
  data.games.push(g);
  data.game = g.id;
  return g;
}

app.post('/api/games', (req, res) => {
  const name = cleanName(req.body && req.body.name);
  if (!name || data.games.length >= 30) return res.status(400).json({ error: 'hibas adat' });
  const g = newGame(name);
  save();
  res.json({ ok: true, id: g.id });
});

// ---- export / import: egy jatekprofil egyetlen fajlban (csempek, szinek, meret, kepek) ----

const eachItem = (tiles, fn) => { for (const t of tiles) { fn(t); (t.buttons || []).forEach(fn); } };

app.get('/api/games/:id/export', (req, res) => {
  const g = data.games.find((x) => x.id === req.params.id);
  if (!g) return res.status(404).json({ error: 'nincs ilyen jatek' });
  const tiles = JSON.parse(JSON.stringify(g.tiles));
  const images = {};
  // a kepek a fajlba kerulnek (base64), a csempekben csak a fajlnev marad
  eachItem(tiles, (x) => {
    if (!x.img) return;
    const file = x.img.split('/').pop();
    try {
      if (!images[file]) images[file] = fs.readFileSync(path.join(IMGDIR, x.img)).toString('base64');
      x.img = file;
    } catch (e) {
      delete x.img;
    }
  });
  res.json({ binddeck: 1, name: g.name, look: g.look, zoom: g.zoom || 100, tiles, images });
});

app.post('/api/import', (req, res) => {
  const b = req.body || {};
  const name = cleanName(b.name);
  if (b.binddeck !== 1 || !name || !Array.isArray(b.tiles) || data.games.length >= 30) return res.status(400).json({ error: 'hibas fajl' });
  // elobb ellenorzunk, csak utana hozunk letre barmit
  const probe = JSON.parse(JSON.stringify(b.tiles));
  eachItem(probe, (x) => { delete x.img; });
  if (!cleanTiles(probe)) return res.status(400).json({ error: 'hibas fajl' });

  const g = newGame(name);
  const saved = new Set();
  for (const [file, b64] of Object.entries(b.images || {}).slice(0, 300)) {
    if (!okImg(g.folder + '/' + file) || typeof b64 !== 'string' || b64.length > 4000000) continue;
    fs.writeFileSync(path.join(IMGDIR, g.folder, file), Buffer.from(b64, 'base64'));
    saved.add(file);
  }
  eachItem(b.tiles, (x) => {
    if (typeof x.img === 'string' && saved.has(x.img)) x.img = g.folder + '/' + x.img;
    else delete x.img;
  });
  g.tiles = cleanTiles(b.tiles);
  const colors = cleanColors(b.look && b.look.colors);
  if (colors) g.look = { profile: cleanName(b.look.profile), colors };
  if (Number.isFinite(b.zoom)) g.zoom = Math.min(150, Math.max(50, Math.round(b.zoom)));
  save();
  res.json({ ok: true, id: g.id });
});

app.put('/api/games/:id', (req, res) => {
  const g = data.games.find((x) => x.id === req.params.id);
  const name = cleanName(req.body && req.body.name);
  if (!g || !name) return res.status(400).json({ error: 'hibas adat' });
  g.name = name;
  save();
  res.json({ ok: true });
});

// teljes torles: a profil es a sajat kepmappaja is (az utolso profil nem torolheto)
app.delete('/api/games/:id', (req, res) => {
  const g = data.games.find((x) => x.id === req.params.id);
  if (data.games.length < 2 || !g) return res.status(400).json({ error: 'nem torolheto' });
  data.games = data.games.filter((x) => x !== g);
  fs.rmSync(path.join(IMGDIR, g.folder), { recursive: true, force: true });
  data.game = game().id;
  save();
  res.json({ ok: true });
});

// az aktualis jatek kepmappajanak tartalma (a kepvalasztohoz)
app.get('/api/images', (req, res) => {
  const folder = game().folder;
  let files = [];
  try {
    files = fs.readdirSync(path.join(IMGDIR, folder)).filter((f) => okImg(folder + '/' + f)).sort();
  } catch (e) {}
  res.json({ folder, dir: path.join(IMGDIR, folder), files });
});

function cleanColors(c) {
  if (!c || typeof c !== 'object') return null;
  const out = {};
  for (const k of LOOK_KEYS) {
    if (typeof c[k] !== 'string' || !HEX.test(c[k])) return null;
    out[k] = c[k].toLowerCase();
  }
  return out;
}

// az epp hasznalt szinek (+ melyik profilbol jottek)
app.put('/api/look', (req, res) => {
  const body = req.body || {};
  const colors = cleanColors(body.colors);
  if (!colors) return res.status(400).json({ error: 'hibas adat' });
  const g = game();
  g.look = { profile: typeof body.profile === 'string' ? body.profile.slice(0, 30) : '', colors };
  if (Number.isFinite(body.zoom)) g.zoom = Math.min(150, Math.max(50, Math.round(body.zoom)));
  save();
  res.json({ ok: true });
});

// elmentett szinprofilok: az oldal szinei + a csempek szinei (csempe id -> szin)
app.put('/api/profiles', (req, res) => {
  const list = req.body && req.body.profiles;
  if (!Array.isArray(list) || list.length > 30) return res.status(400).json({ error: 'hibas adat' });
  const out = [];
  for (const p of list) {
    const colors = cleanColors(p && p.colors);
    if (!colors || typeof p.name !== 'string' || !p.name.trim()) return res.status(400).json({ error: 'hibas adat' });
    const tileColors = {};
    for (const [id, c] of Object.entries(p.tileColors || {}).slice(0, 200)) {
      if (typeof c === 'string' && HEX.test(c)) tileColors[id.slice(0, 40)] = c;
    }
    out.push({ name: p.name.trim().slice(0, 30), colors, tileColors });
  }
  data.profiles = out;
  save();
  res.json({ ok: true });
});

app.put('/api/tiles', (req, res) => {
  const tiles = cleanTiles(req.body && req.body.tiles, isLocal(req.socket.remoteAddress), game().tiles);
  if (!tiles) return res.status(400).json({ error: 'hibas adat' });
  game().tiles = tiles;
  save();
  res.json({ ok: true });
});

app.post('/api/press', (req, res) => {
  const body = req.body || {};
  const g = game();
  const top = g.tiles.find((t) => t.id === body.id);
  const tile = top && top.buttons ? top.buttons.find((b) => b.id === body.btn) : top;
  if (!tile) return res.status(404).json({ error: 'nincs ilyen csempe' });
  // mark: csak a jelolest allitjuk at, billentyut nem kuldunk (ha a kapcsolo jelzese elcsuszott)
  if (!body.mark) {
    if (tile.run) openTarget(tile.run);
    else if (!tile.keys.length) return res.status(400).json({ error: 'nincs bind' });
    else if (!sendKeys(tile.keys)) return res.status(503).json({ error: 'a billentyu-kuldo nem fut' });
  }
  // megjegyezzuk, mi volt utoljara megnyomva - ezt jeloli zolddel az oldal
  const active = g.active || (g.active = {});
  if (!top.buttons) active._tiles = top.id; // sima csempek: egy lehet kivalasztva
  else if (top.buttons.length === 1) active[top.id] = active[top.id] ? '' : tile.id; // egygombos csoport = ki/be kapcsolo
  else active[top.id] = tile.id; // csoport: az utoljara nyomott kis gomb
  save();
  res.json({ ok: true, active });
});

// hibas keres (pl. rossz JSON): belso hibauzenet ne menjen ki
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: 'hibas keres' });
});

startPs();
const server = app.listen(PORT, '0.0.0.0');
module.exports = { server, PORT, DATADIR, IMGDIR };
