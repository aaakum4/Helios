const { app, BrowserWindow, ipcMain, nativeTheme } = require("electron");
const path = require("path");
const { PostHog } = require("posthog-node");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

// PostHog client — uses env vars so keys are never hardcoded
const posthog = new PostHog(process.env.POSTHOG_API_KEY, {
  host: process.env.POSTHOG_HOST || "https://us.i.posthog.com",
  enableExceptionAutocapture: true,
});

// Stable anonymous distinct ID for this installation (persisted across sessions).
// Initialized lazily after app is ready (app.getPath requires app to be ready).
let DISTINCT_ID = "helios-anonymous";

function initDistinctId() {
  try {
    const fs = require("fs");
    const { randomUUID } = require("crypto");
    const storePath = path.join(app.getPath("userData"), ".posthog-distinct-id");
    if (fs.existsSync(storePath)) {
      DISTINCT_ID = fs.readFileSync(storePath, "utf8").trim();
    } else {
      DISTINCT_ID = randomUUID();
      fs.writeFileSync(storePath, DISTINCT_ID, "utf8");
    }
  } catch {
    // Keep the fallback value
  }
}

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
    minWidth: 1320,
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

// PostHog IPC bridge — renderer sends events to the main process for capture
ipcMain.on("posthog:capture", (_event, { eventName, properties }) => {
  try {
    posthog.capture({
      distinctId: DISTINCT_ID,
      event: eventName,
      properties: properties || {},
    });
  } catch (err) {
    posthog.captureException(err, DISTINCT_ID);
  }
});

// Expose the distinct ID to the renderer if needed for correlation
ipcMain.handle("posthog:get-distinct-id", () => DISTINCT_ID);

nativeTheme.on("updated", () => {
  broadcastNativeTheme();
});

app.whenReady().then(() => {
  initDistinctId();
  createWindow();
  posthog.capture({
    distinctId: DISTINCT_ID,
    event: "app_launched",
    properties: {
      platform: process.platform,
      arch: process.arch,
      electron_version: process.versions.electron,
      node_version: process.versions.node,
      app_version: app.getVersion(),
    },
  });
});

app.on("window-all-closed", async () => {
  await posthog.shutdown();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Capture unhandled exceptions in the main process
process.on("uncaughtException", (err) => {
  posthog.captureException(err, DISTINCT_ID);
});

process.on("unhandledRejection", (reason) => {
  posthog.captureException(reason instanceof Error ? reason : new Error(String(reason)), DISTINCT_ID);
});
