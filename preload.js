// Az asztali ablak oldala ezen keresztul eri el a fajlvalasztot (a bongeszos / telefonos oldalon ez nincs).
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('binddeck', {
  pickFile: () => ipcRenderer.invoke('pick-file')
});
