const { app, BrowserWindow, ipcMain, nativeTheme } = require("electron");
const path = require("path");

function getNativeThemePayload() {
  return {
    shouldUseDarkColors: nativeTheme.shouldUseDarkColors,
    shouldUseHighContrastColors: nativeTheme.shouldUseHighContrastColors,
    shouldUseInvertedColorScheme: nativeTheme.shouldUseInvertedColorScheme,
    themeSource: nativeTheme.themeSource,
  };
}

function broadcastNativeTheme() {
  const payload = getNativeThemePayload();
  BrowserWindow.getAllWindows().forEach((win) => {
    win.webContents.send("native-theme:updated", payload);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1350,
    minHeight: 850,
    show: false,
    vibrancy: "sidebar",
    titleBarStyle: "hiddenInset",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.once("ready-to-show", () => {
    win.show();
  });

  win.loadURL("http://localhost:5173");
}

ipcMain.handle("native-theme:get", () => getNativeThemePayload());

nativeTheme.on("updated", () => {
  broadcastNativeTheme();
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
