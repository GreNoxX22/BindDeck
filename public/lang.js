// Forditasok. Uj nyelv: masold le az egyik blokkot, ird at a szovegeket, es add hozza a LANGS listahoz.
// A {0} helyere valtozo ertek kerul.
// a tovabbi nyelvek a lang-more.js-ben vannak (LANGS_MORE, I18N_MORE), az elobb toltodik be
const LANGS = [['en', 'English'], ['hu', 'Magyar'], ['de', 'Deutsch'], ...LANGS_MORE];

const I18N = {
  hu: {
    'edit': 'Szerkesztés', 'done': 'Kész', 'name': 'Név', 'delete': 'Törlés', 'cancel': 'Mégse', 'save': 'Mentés',
    'color': 'Szín', 'image': 'Kép', 'key': 'Billentyű', 'none': '(nincs)',
    'pin.title': 'Kód', 'pin.hint': 'Írd be a kódot, amit a BindDeck indításkor kiír a számítógépen.', 'pin.enter': 'Belépés',
    'game.profile': 'Játékprofil', 'game.ph': 'pl. CS2', 'game.new': '+ Új játék...', 'game.newTitle': 'Új játékprofil',
    'game.bar': 'Játékprofil: {0}  -  átnevezés / törlés', 'game.folder': 'Képmappa a gépen: {0}',
    'game.newHint': 'Az új játék üres csempékkel és a mostani színekkel indul, és saját képmappát kap.',
    'game.export': 'Exportálás fájlba', 'game.import': 'Importálás fájlból...', 'game.imported': 'Profil importálva', 'game.exported': 'Profil elmentve fájlba', 'set.community': 'Közösség (Discord) - profilok megosztása', 'err.import': 'Ez nem BindDeck profilfájl',
    'game.confirm': 'Biztosan törlöd a(z) "{0}" játékprofilt? A csempéi és a képmappája is végleg törlődnek.',
    'set.title': 'Beállítások', 'set.lang': 'Nyelv', 'set.vibrate': 'Rezgés gombnyomáskor',
    'set.connect': 'Telefon csatlakoztatása',
    'set.connectHint': 'Olvasd be a QR-kódot a telefon kamerájával (ugyanazon a Wi-Fi-n legyen), vagy írd be a telefon böngészőjébe a címet, majd a kódot.',
    'set.address': 'Cím', 'set.code': 'Kód', 'set.colors': 'Színek és méret',
    'look.profile': 'Színprofil', 'look.size': 'Méret', 'look.sizeNote': '(ehhez a játékhoz mentve)',
    'look.saveAs': 'Mentés ezen a néven (a csempék színeit is elmenti)', 'look.ph': 'pl. Saját', 'look.custom': '(egyéni)',
    'look.needName': 'Adj nevet a profilnak', 'look.saved': 'Profil elmentve: {0}', 'look.deleted': 'Profil törölve: {0}',
    'c.bg': 'Háttér', 'c.panel': 'Gombok', 'c.line': 'Keretek', 'c.text': 'Szöveg', 'c.accent': 'Kiemelő 1', 'c.accent2': 'Kiemelő 2', 'c.sel': 'Kijelölt gomb',
    'tile.ph': 'pl. AK', 'tile.new': 'Új csempe', 'tile.edit': 'Csempe szerkesztése', 'sub.new': 'Új kis gomb', 'sub.edit': 'Kis gomb szerkesztése',
    'group.check': 'Csoport: több kis gomb van benne', 'capture': 'Rögzítés billentyűzetről', 'capture.wait': 'Nyomd meg a billentyűt...',
    'action': 'Mit csináljon', 'action.key': 'Billentyűt küld', 'action.run': 'Programot, fájlt vagy weboldalt nyit meg',
    'run.ph': 'pl. C:\\...\\app.exe  vagy  https://...', 'run.browse': 'Tallózás...',
    'run.hint': 'Program (.exe), parancsikon (.lnk), fájl, mappa vagy webcím. Példák: https://youtube.com vagy spotify:',
    'run.localOnly': 'Biztonsági okból ez csak a számítógépen állítható be, telefonról nem.', 'run.empty': 'Add meg, mit nyisson meg',
    'nobind': 'nincs bind', 'press.nobind': 'Ehhez a gombhoz nincs billentyű kötve',
    'key.used': 'Ez a billentyű már foglalt: {0}', 'key.unknown': 'Ezt a billentyűt nem ismerem: {0}',
    'img.none': 'nincs', 'img.hint': 'Saját kép: másold a gépen ebbe a mappába: {0} (png, jpg, webp), aztán nyisd meg újra ezt az ablakot.',
    'err.pin': 'Kód kell', 'err.tooMany': 'Túl sok hibás kód, várj 5 percet', 'err.http': 'Hiba ({0})',
    'err.conn': 'Nincs kapcsolat a géppel (fut a BindDeck?)', 'err.save': 'Nem sikerült menteni', 'err.fail': 'Nem sikerült',
    'k.rightSide': 'Jobb {0}', 'k.up': 'Fel', 'k.down': 'Le', 'k.left': 'Balra', 'k.right': 'Jobbra',
    'k.minus': '- (0 mellett)', 'k.equal': '= (Backspace mellett)', 'k.backquote': '` (Esc alatt)', 'k.intl': '< (bal Shift mellett)'
  },
  en: {
    'edit': 'Edit', 'done': 'Done', 'name': 'Name', 'delete': 'Delete', 'cancel': 'Cancel', 'save': 'Save',
    'color': 'Color', 'image': 'Image', 'key': 'Key', 'none': '(none)',
    'pin.title': 'Code', 'pin.hint': 'Enter the code BindDeck shows on the computer at startup.', 'pin.enter': 'Enter',
    'game.profile': 'Game profile', 'game.ph': 'e.g. CS2', 'game.new': '+ New game...', 'game.newTitle': 'New game profile',
    'game.bar': 'Game profile: {0}  -  rename / delete', 'game.folder': 'Image folder on the computer: {0}',
    'game.newHint': 'The new game starts with no tiles and the current colors, and gets its own image folder.',
    'game.export': 'Export to file', 'game.import': 'Import from file...', 'game.imported': 'Profile imported', 'game.exported': 'Profile saved to file', 'set.community': 'Community (Discord) - share profiles', 'err.import': 'This is not a BindDeck profile file',
    'game.confirm': 'Delete the game profile "{0}"? Its tiles and its image folder will be permanently removed.',
    'set.title': 'Settings', 'set.lang': 'Language', 'set.vibrate': 'Vibrate on press',
    'set.connect': 'Connect a phone',
    'set.connectHint': 'Scan the QR code with your phone camera (it must be on the same Wi-Fi), or type the address into the phone browser and then enter the code.',
    'set.address': 'Address', 'set.code': 'Code', 'set.colors': 'Colors and size',
    'look.profile': 'Color profile', 'look.size': 'Size', 'look.sizeNote': '(saved for this game)',
    'look.saveAs': 'Save under this name (tile colors included)', 'look.ph': 'e.g. Mine', 'look.custom': '(custom)',
    'look.needName': 'Give the profile a name', 'look.saved': 'Profile saved: {0}', 'look.deleted': 'Profile deleted: {0}',
    'c.bg': 'Background', 'c.panel': 'Buttons', 'c.line': 'Borders', 'c.text': 'Text', 'c.accent': 'Accent 1', 'c.accent2': 'Accent 2', 'c.sel': 'Selected button',
    'tile.ph': 'e.g. AK', 'tile.new': 'New tile', 'tile.edit': 'Edit tile', 'sub.new': 'New small button', 'sub.edit': 'Edit small button',
    'group.check': 'Group: contains several small buttons', 'capture': 'Record from keyboard', 'capture.wait': 'Press the key...',
    'action': 'Action', 'action.key': 'Send a key', 'action.run': 'Open a program, file or website',
    'run.ph': 'e.g. C:\\...\\app.exe  or  https://...', 'run.browse': 'Browse...',
    'run.hint': 'A program (.exe), shortcut (.lnk), file, folder or web address. Examples: https://youtube.com or spotify:',
    'run.localOnly': 'For safety this can only be set on the computer, not from a phone.', 'run.empty': 'Enter what to open',
    'nobind': 'no bind', 'press.nobind': 'No key is bound to this button',
    'key.used': 'This key is already used by: {0}', 'key.unknown': 'Unknown key: {0}',
    'img.none': 'none', 'img.hint': 'Your own image: on the computer, copy it into this folder: {0} (png, jpg, webp), then reopen this window.',
    'err.pin': 'Code required', 'err.tooMany': 'Too many wrong codes, wait 5 minutes', 'err.http': 'Error ({0})',
    'err.conn': 'No connection to the computer (is BindDeck running?)', 'err.save': 'Could not save', 'err.fail': 'Failed',
    'k.rightSide': 'Right {0}', 'k.up': 'Up', 'k.down': 'Down', 'k.left': 'Left', 'k.right': 'Right',
    'k.minus': '- (next to 0)', 'k.equal': '= (next to Backspace)', 'k.backquote': '` (below Esc)', 'k.intl': '< (next to left Shift)'
  },
  de: {
    'edit': 'Bearbeiten', 'done': 'Fertig', 'name': 'Name', 'delete': 'Löschen', 'cancel': 'Abbrechen', 'save': 'Speichern',
    'color': 'Farbe', 'image': 'Bild', 'key': 'Taste', 'none': '(keine)',
    'pin.title': 'Code', 'pin.hint': 'Gib den Code ein, den BindDeck beim Start am Computer anzeigt.', 'pin.enter': 'Anmelden',
    'game.profile': 'Spielprofil', 'game.ph': 'z. B. CS2', 'game.new': '+ Neues Spiel...', 'game.newTitle': 'Neues Spielprofil',
    'game.bar': 'Spielprofil: {0}  -  umbenennen / löschen', 'game.folder': 'Bildordner am Computer: {0}',
    'game.newHint': 'Das neue Spiel startet ohne Kacheln mit den aktuellen Farben und bekommt einen eigenen Bildordner.',
    'game.export': 'In Datei exportieren', 'game.import': 'Aus Datei importieren...', 'game.imported': 'Profil importiert', 'game.exported': 'Profil in Datei gespeichert', 'set.community': 'Community (Discord) - Profile teilen', 'err.import': 'Das ist keine BindDeck-Profildatei',
    'game.confirm': 'Spielprofil "{0}" löschen? Seine Kacheln und sein Bildordner werden endgültig entfernt.',
    'set.title': 'Einstellungen', 'set.lang': 'Sprache', 'set.vibrate': 'Vibration beim Drücken',
    'set.connect': 'Handy verbinden',
    'set.connectHint': 'Scanne den QR-Code mit der Handykamera (im selben WLAN) oder gib die Adresse im Handybrowser ein und dann den Code.',
    'set.address': 'Adresse', 'set.code': 'Code', 'set.colors': 'Farben und Größe',
    'look.profile': 'Farbprofil', 'look.size': 'Größe', 'look.sizeNote': '(für dieses Spiel gespeichert)',
    'look.saveAs': 'Unter diesem Namen speichern (inkl. Kachelfarben)', 'look.ph': 'z. B. Meins', 'look.custom': '(eigene)',
    'look.needName': 'Gib dem Profil einen Namen', 'look.saved': 'Profil gespeichert: {0}', 'look.deleted': 'Profil gelöscht: {0}',
    'c.bg': 'Hintergrund', 'c.panel': 'Tasten', 'c.line': 'Rahmen', 'c.text': 'Text', 'c.accent': 'Akzent 1', 'c.accent2': 'Akzent 2', 'c.sel': 'Ausgewählte Taste',
    'tile.ph': 'z. B. AK', 'tile.new': 'Neue Kachel', 'tile.edit': 'Kachel bearbeiten', 'sub.new': 'Neue kleine Taste', 'sub.edit': 'Kleine Taste bearbeiten',
    'group.check': 'Gruppe: enthält mehrere kleine Tasten', 'capture': 'Von der Tastatur aufnehmen', 'capture.wait': 'Taste drücken...',
    'action': 'Aktion', 'action.key': 'Taste senden', 'action.run': 'Programm, Datei oder Website öffnen',
    'run.ph': 'z. B. C:\\...\\app.exe  oder  https://...', 'run.browse': 'Durchsuchen...',
    'run.hint': 'Programm (.exe), Verknüpfung (.lnk), Datei, Ordner oder Webadresse. Beispiele: https://youtube.com oder spotify:',
    'run.localOnly': 'Aus Sicherheitsgründen nur am Computer einstellbar, nicht vom Handy.', 'run.empty': 'Gib an, was geöffnet werden soll',
    'nobind': 'keine Taste', 'press.nobind': 'Dieser Schaltfläche ist keine Taste zugewiesen',
    'key.used': 'Diese Taste ist bereits belegt: {0}', 'key.unknown': 'Unbekannte Taste: {0}',
    'img.none': 'keins', 'img.hint': 'Eigenes Bild: kopiere es am Computer in diesen Ordner: {0} (png, jpg, webp) und öffne dieses Fenster erneut.',
    'err.pin': 'Code erforderlich', 'err.tooMany': 'Zu viele falsche Codes, warte 5 Minuten', 'err.http': 'Fehler ({0})',
    'err.conn': 'Keine Verbindung zum Computer (läuft BindDeck?)', 'err.save': 'Speichern fehlgeschlagen', 'err.fail': 'Fehlgeschlagen',
    'k.rightSide': 'Rechte {0}', 'k.up': 'Hoch', 'k.down': 'Runter', 'k.left': 'Links', 'k.right': 'Rechts',
    'k.minus': '- (neben 0)', 'k.equal': '= (neben Backspace)', 'k.backquote': '` (unter Esc)', 'k.intl': '< (neben linker Shift)'
  }
};

Object.assign(I18N, I18N_MORE);

let lang = '';
try { lang = localStorage.getItem('lang') || ''; } catch (e) {}
const langChosen = !!I18N[lang];
// elso megnyitaskor a bongeszo nyelvebol tippelunk, a valasztot ugyis feldobjuk
if (!langChosen) lang = I18N[(navigator.language || '').slice(0, 2)] ? navigator.language.slice(0, 2) : 'en';

function t(key, ...args) {
  const s = (I18N[lang] && I18N[lang][key]) || I18N.en[key] || key;
  return s.replace(/\{(\d)\}/g, (m, i) => args[i]);
}

// a HTML-ben levo feliratok: data-i18n (szoveg), data-i18n-ph (placeholder), data-i18n-aria (aria-label)
function applyI18n() {
  document.documentElement.lang = lang;
  for (const n of document.querySelectorAll('[data-i18n]')) n.textContent = t(n.dataset.i18n);
  for (const n of document.querySelectorAll('[data-i18n-ph]')) n.placeholder = t(n.dataset.i18nPh);
  for (const n of document.querySelectorAll('[data-i18n-aria]')) n.setAttribute('aria-label', t(n.dataset.i18nAria));
}

function setLang(code) {
  lang = code;
  try { localStorage.setItem('lang', code); } catch (e) {}
  applyI18n();
}
