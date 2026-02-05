const { app, BrowserWindow } = require("electron");
const path = require("path");

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    vibrancy: 'sidebar',
    titleBarStyle: 'hiddenInset',
  });

  win.once("ready-to-show", () => {
    win.show();
  });

  win.loadURL("http://localhost:5173");
}

app.whenReady().then(createWindow);