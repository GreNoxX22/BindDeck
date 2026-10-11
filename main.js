// BindDeck asztali alkalmazas (Electron): elinditja a szervert, ablakot es talcaikont ad.
// Az ablak ugyanazt az oldalt mutatja, mint a telefon, csak itt kod nelkul es a csatlakozas (QR) gombbal.

const { app, BrowserWindow, Tray, Menu, shell, dialog, ipcMain } = require('electron');
const fs = require('fs');
const path = require('path');
const pkg = require('./package.json');

const ICON = path.join(__dirname, 'build', 'icon.ico');
const HIDDEN = process.argv.includes('--hidden'); // a Windowszal indulva csak a talcara ul be
// frissites-ellenorzes: a GitHub repo "tulajdonos/nev" alakban (package.json -> binddeck.updateRepo); uresen nincs ellenorzes
const UPDATE_REPO = (pkg.binddeck && pkg.binddeck.updateRepo) || '';

let win = null;
let tray = null;
let quitting = false;
let srv = null;
let update = null; // { version, url } ha van ujabb kiadas

// a felhasznalo adatai (profilok, kod, kepek) a sajat mappajaba kerulnek, nem a program melle
process.env.BINDDECK_DATA = path.join(app.getPath('userData'), 'data');
fs.mkdirSync(process.env.BINDDECK_DATA, { recursive: true });

function showWindow(hash) {
  if (win) {
    win.show();
    win.focus();
    return;
  }
  win = new BrowserWindow({
    width: 460,
    height: 820,
    minWidth: 360,
    minHeight: 480,
    icon: ICON,
    title: 'BindDeck',
    backgroundColor: '#120b15',
    autoHideMenuBar: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js') }
  });
  win.setMenu(null);
  win.loadURL('http://127.0.0.1:' + srv.PORT + '/' + (hash || ''));
  // az ablak bezarasa nem lep ki: a program a talcan fut tovabb
  win.on('close', (e) => {
    if (quitting) return;
    e.preventDefault();
    win.hide();
  });
  win.on('closed', () => { win = null; });
  // kulso linkek a rendes bongeszoben nyiljanak
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

// programindito csempehez: fajl kivalasztasa
ipcMain.handle('pick-file', async () => {
  const r = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'Programs and shortcuts', extensions: ['exe', 'lnk', 'url', 'bat', 'cmd'] },
      { name: 'All files', extensions: ['*'] }
    ]
  });
  return r.canceled ? '' : r.filePaths[0];
});

function trayMenu() {
  const items = [];
  if (update) {
    items.push({ label: 'Update available: v' + update.version + ' - download', click: () => shell.openExternal(update.url) });
    items.push({ type: 'separator' });
  }
  items.push(
    { label: 'Open BindDeck', click: () => showWindow() },
    { label: 'Open images folder', click: () => shell.openPath(srv.IMGDIR) },
    { type: 'separator' },
    {
      label: 'Start with Windows',
      type: 'checkbox',
      checked: app.getLoginItemSettings({ args: ['--hidden'] }).openAtLogin,
      click: (item) => {
        app.setLoginItemSettings({ openAtLogin: item.checked, args: ['--hidden'] });
        tray.setContextMenu(trayMenu());
      }
    },
    { label: 'Check for updates', enabled: !!UPDATE_REPO, click: () => checkUpdate(true) },
    { type: 'separator' },
    { label: 'BindDeck v' + app.getVersion(), enabled: false },
    { label: 'Quit', click: () => { quitting = true; app.quit(); } }
  );
  return Menu.buildFromTemplate(items);
}

// "1.2.10" > "1.2.9"
function newer(a, b) {
  const x = a.split('.').map(Number);
  const y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0);
  }
  return false;
}

// A GitHub legfrissebb kiadasat nezi. Ha van ujabb, szol, es a letoltesi oldalra visz;
// az uj telepito futtatasa a meglevot frissiti, a profilok megmaradnak.
async function checkUpdate(manual) {
  if (!UPDATE_REPO) return;
  try {
    const r = await fetch('https://api.github.com/repos/' + UPDATE_REPO + '/releases/latest', {
      headers: { 'User-Agent': 'BindDeck', Accept: 'application/vnd.github+json' }
    });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const rel = await r.json();
    const latest = String(rel.tag_name || '').replace(/^v/, '');
    if (!newer(latest, app.getVersion())) {
      if (manual) dialog.showMessageBox({ type: 'info', title: 'BindDeck', message: 'BindDeck is up to date (v' + app.getVersion() + ').' });
      return;
    }
    const first = !update || update.version !== latest;
    update = { version: latest, url: rel.html_url };
    tray.setContextMenu(trayMenu());
    tray.setToolTip('BindDeck - update available (v' + latest + ')');
    if (!first && !manual) return; // ugyanarrol a verziorol csak egyszer szolunk
    const ask = await dialog.showMessageBox({
      type: 'info',
      title: 'BindDeck',
      message: 'A new version of BindDeck is available: v' + latest,
      detail: 'You have v' + app.getVersion() + '. Download the new installer and run it - your profiles are kept.',
      buttons: ['Download', 'Later'],
      defaultId: 0,
      cancelId: 1
    });
    if (ask.response === 0) shell.openExternal(update.url);
  } catch (e) {
    if (manual) dialog.showMessageBox({ type: 'warning', title: 'BindDeck', message: 'Could not check for updates.', detail: String(e.message || e) });
  }
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => showWindow());

  app.whenReady().then(() => {
    const firstRun = !fs.existsSync(path.join(process.env.BINDDECK_DATA, 'data.json'));
    srv = require('./server.js');
    srv.server.on('error', (err) => {
      dialog.showErrorBox('BindDeck', err.code === 'EADDRINUSE'
        ? 'Port ' + srv.PORT + ' is already in use. Is another BindDeck running?'
        : String(err));
      quitting = true;
      app.quit();
    });
    srv.server.on('listening', () => {
      tray = new Tray(ICON);
      tray.setToolTip('BindDeck');
      tray.setContextMenu(trayMenu());
      tray.on('click', () => showWindow());
      // elso inditaskor rogton a telefon csatlakoztatasa ablak jon fel
      if (!HIDDEN) showWindow(firstRun ? '#connect' : '');
      setTimeout(() => checkUpdate(false), 5000);
      setInterval(() => checkUpdate(false), 6 * 60 * 60 * 1000);
    });
  });

  // ablak nelkul is fut tovabb (talca)
  app.on('window-all-closed', () => {});
  app.on('before-quit', () => { quitting = true; });
}
