// Feluleti teszt valodi kattintasokkal (nem ment semmit). Hasznalat: UI_URL=http://127.0.0.1:7010/ UI_GAME=Rust electron build/uitest.js
const { app, BrowserWindow } = require('electron');
const url = process.env.UI_URL;
const gameName = process.env.UI_GAME;
process.on("unhandledRejection",(e)=>{console.log("HIBA: "+(e&&e.stack||e));app.exit(1)});
console.log("indul");
app.whenReady().then(async () => {
  console.log("ready");
  const win = new BrowserWindow({ show: false, width: 460, height: 820, webPreferences: { offscreen: true } });
  const errors = [];
  win.webContents.on('console-message', (e) => { if (e.level === 'error' || e.level === 3) errors.push(e.message + ' @' + e.lineNumber); });
  await win.loadURL(url);
  const js = (code) => win.webContents.executeJavaScript(code, true);
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const click = async (sel, nth) => {
    const p = await js(`(() => { const n = document.querySelectorAll(${JSON.stringify(sel)})[${nth || 0}]; if (!n) return null; n.scrollIntoView({ block: 'center' }); const r = n.getBoundingClientRect(); const x = Math.round(r.left + r.width / 2), y = Math.round(r.top + r.height / 2); const top = document.elementFromPoint(x, y); return { x, y, hit: top === n || n.contains(top), top: top ? top.tagName + '.' + top.className : '' }; })()`);
    if (!p) return 'nincs ilyen elem';
    win.webContents.sendInputEvent({ type: 'mouseDown', x: p.x, y: p.y, button: 'left', clickCount: 1 });
    win.webContents.sendInputEvent({ type: 'mouseUp', x: p.x, y: p.y, button: 'left', clickCount: 1 });
    await wait(600);
    return p.hit ? 'ok' : 'TAKARJA: ' + p.top;
  };
  const dlgOpen = () => js(`document.querySelector('#editDlg').open`);
  const closeDlg = () => js(`document.querySelector('#editDlg').open && document.querySelector('#editDlg').close()`);
  await wait(1500);
  await js(`window.__err = []; window.addEventListener('error', (e) => window.__err.push(e.message + ' @' + e.lineno)); window.addEventListener('unhandledrejection', (e) => window.__err.push('promise: ' + (e.reason && e.reason.message)));`);
  const out = {};
  if (await js(`document.querySelector('#langDlg') && document.querySelector('#langDlg').open`)) out.lang = await click('#langBtns button');
  await js(`[...document.querySelectorAll('dialog[open]')].forEach((d) => d.close())`);
  // jatekvaltas a listabol (a szerver allapotat atallitja, a vegen vissza)
  const start = await js(`document.querySelector('#gameSel').value`);
  const target = await js(`(() => { const o = [...document.querySelector('#gameSel').options].find((o) => o.textContent === ${JSON.stringify(gameName)}); return o ? o.value : ''; })()`);
  if (!target) { console.log('nincs ilyen jatek: ' + gameName); app.exit(0); return; }
  await js(`(() => { const s = document.querySelector('#gameSel'); s.value = ${JSON.stringify(target)}; s.dispatchEvent(new Event('change')); })()`);
  await wait(1200);
  out.game = await js(`document.querySelector('#gameSel').selectedOptions[0].textContent`);
  out.zoom = await js(`document.querySelector('#grid').style.zoom`);
  out.edit = await click('#editBtn');
  out.editing = await js(`document.body.classList.contains('editing')`);
  out.tileClick = await click('.tile:not(.group):not(.add)');
  out.tileEditor = await dlgOpen(); await closeDlg();
  out.tile5Click = await click('.tile:not(.group):not(.add)', 5);
  out.tile5Editor = await dlgOpen(); await closeDlg();
  out.subClick = await click('.sub:not(.add)');
  out.subEditor = await dlgOpen(); await closeDlg();
  out.groupNameClick = await click('.tile.group > .name');
  out.groupEditor = await dlgOpen(); await closeDlg();
  out.addClick = await click('.tile.add:not(.gamebar)');
  out.addEditor = await dlgOpen(); await closeDlg();
  out.pageErrors = await js(`window.__err`);
  await js(`document.querySelector('#editBtn').click()`);
  await js(`(() => { const s = document.querySelector('#gameSel'); s.value = ${JSON.stringify(start)}; s.dispatchEvent(new Event('change')); })()`);
  await wait(800);
  console.log(JSON.stringify(out, null, 1));
  console.log('konzol hibak: ' + JSON.stringify(errors));
  app.exit(0);
});
