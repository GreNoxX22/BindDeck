# BindDeck

Turn your phone into a customizable macro pad for your Windows PC.
Open a page on your phone, tap a tile, and the PC receives the key press bound to it — as if you had pressed it on the keyboard.

*powered by Z*

## Features

- **Tiles and groups** – plain tiles, or group tiles holding several small buttons (e.g. a mode switch).
- **Any key, including ones your keyboard does not have** – F13–F24 and a set of extra "virtual" keys that never collide with anything. Ctrl / Shift / Alt combinations are supported too.
- **Launch tiles** – a tile can open a program, shortcut, file, folder or website instead of sending a key.
- **Profiles** – one profile per game or app, each with its own tiles, binds, images, colors and size.
- **Images on tiles** – drop your own PNG / JPG / WebP files into the profile's image folder and pick them in the editor.
- **Themes** – seven colors drive the whole look; save them as named color profiles.
- **Selection highlight** – the last pressed tile in each group stays marked, toggles show on/off.
- **Export / import** – a whole profile (tiles, colors, images) in a single `.binddeck` file.
- **QR connect** – scan the code shown on the PC and the phone is connected.
- **Live sync** – change something on the PC and every connected phone updates instantly, and the other way round.
- **13 languages** – English, Hungarian, German, French, Spanish, Italian, Portuguese, Dutch, Polish, Czech, Romanian, Turkish, Russian.
- **Tray app** – closing the window keeps BindDeck running in the system tray; optional start with Windows.
- **Update notice** – BindDeck tells you when a newer release is available.

No account, no cloud: the phone talks to the PC directly over your local network.

## Install

1. Download `BindDeck-Setup-x.y.z.exe` from the [Releases](../../releases) page and run it.
   The installer adds a Windows Firewall rule for TCP port 7010 so the phone can reach the PC.
2. Start BindDeck. On first launch the **Connect a phone** window opens.
3. Scan the QR code with your phone (it must be on the same Wi-Fi / network as the PC).

The installer is not code-signed, so Windows SmartScreen may show a warning: choose *More info → Run anyway*.

**Updating:** run the newer installer over the existing one; your profiles are kept.
**Uninstalling:** Windows Settings → Apps → BindDeck → Uninstall. Your data in `%APPDATA%\BindDeck` is left in place; delete that folder too if you want everything gone.

## Using it

| Where | What |
|---|---|
| Phone icon (PC only) | QR code, address and the 6-digit code for connecting a phone |
| Profile list | Switch profile, create a new one, import one from a file |
| Sliders icon | Language, vibration, colors, size, color profiles |
| Edit | Tap a tile to change its name, color, image and action (send a key, or open a program / website); add tiles and small buttons; rename, export or delete the profile |

Binding a key in another program: click that program's bind field, and when it waits for a key, tap the tile on the phone.

The key press always goes to the window that is currently focused. To reach programs running as administrator, run BindDeck as administrator too.

### Your own images

Each profile has its own folder. Open it from the tray menu (**Open images folder**), copy your images into the profile's folder, then pick them in the tile editor.
File names may contain letters, digits, spaces, dots, dashes and underscores.

### Data location

`%APPDATA%\BindDeck\data` – `data.json` (profiles), `kod.json` (your connect code), `images\` (tile images).

## Security

- BindDeck listens on your local network only and is protected by a 6-digit code; after 10 wrong attempts a device is locked out for 5 minutes.
- The connection is plain HTTP. Use it on networks you trust (your home network), not on public Wi-Fi.
- Anyone who has the address and the code can press your tiles and edit key binds. What a launch tile opens can only be set on the PC itself, never from a phone, and imported profile files never carry launch targets.

## Build from source

Requires Node.js 20+ and Windows.

```
npm install
npm start          # run the desktop app
npm run server     # run only the server (data is stored next to the source)
npm run dist       # build the installer into dist/
```

How it works: an Express server (`server.js`) serves the page in `public/` and receives tile presses; a long-lived PowerShell helper (`keys.ps1`) injects the keys with `SendInput`, using scancodes so games see them like real keys. `main.js` is the Electron shell (window + tray).

Adding a language: copy a block in `public/lang-more.js`, translate it and add it to `LANGS_MORE`. Missing keys fall back to English.

Update check: set `binddeck.updateRepo` in `package.json` to your `owner/repo`; the app then compares its version with the latest GitHub release.

## Fair use

BindDeck sends ordinary key presses and nothing else. It ships without any game assets. You are responsible for following the rules of the games and services you use it with.

## License

[MIT](LICENSE) © 2026 Z
