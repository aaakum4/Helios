const { app, BrowserWindow, ipcMain, nativeTheme, screen } = require("electron");
const path = require("path");
const { PostHog } = require("posthog-node");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Soft linear scaling model baseline.
const BASE_DISPLAY_WIDTH = 1800;
const BASE_DISPLAY_HEIGHT = 1169;
const BASE_MIN_WIDTH = 1300;
const BASE_MIN_HEIGHT = 840;
const WIDTH_SCALE_FACTOR = 70 / 288;
const HEIGHT_SCALE_FACTOR = 25 / 187;

// Clamps for computed minimum window size.
const MIN_WIDTH_CLAMP = 1230;
const MAX_WIDTH_CLAMP = 1320;
const MIN_HEIGHT_CLAMP = 815;
const MAX_HEIGHT_CLAMP = 860;

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function computeMinimumWindowSizeForDisplay(display) {
  const { width: displayWidth, height: displayHeight } = display.size;

  // Soft linear scaling (not proportional scaling).
  const rawMinWidth = BASE_MIN_WIDTH + (displayWidth - BASE_DISPLAY_WIDTH) * WIDTH_SCALE_FACTOR;
  const rawMinHeight = BASE_MIN_HEIGHT + (displayHeight - BASE_DISPLAY_HEIGHT) * HEIGHT_SCALE_FACTOR;

  const minWidth = Math.round(clamp(rawMinWidth, MIN_WIDTH_CLAMP, MAX_WIDTH_CLAMP));
  const minHeight = Math.round(clamp(rawMinHeight, MIN_HEIGHT_CLAMP, MAX_HEIGHT_CLAMP));

  return {
    minWidth,
    minHeight,
    displayId: display.id,
    displayWidth,
    displayHeight,
  };
}

function getDisplayForWindow(win) {
  return screen.getDisplayMatching(win.getBounds());
}

function applyDynamicMinimumSize(win) {
  if (win.isDestroyed()) {
    return;
  }

  const display = getDisplayForWindow(win);
  const payload = computeMinimumWindowSizeForDisplay(display);
  const previous = win.minSizeData;

  win.setMinimumSize(payload.minWidth, payload.minHeight);
  win.minSizeData = payload;

  const changed =
    !previous ||
    previous.minWidth !== payload.minWidth ||
    previous.minHeight !== payload.minHeight ||
    previous.displayId !== payload.displayId;

  if (changed) {
    win.webContents.send("window:min-size-changed", payload);
  }
}

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
  // Create with baseline minimums first, then immediately sync to active display.
  const minWidth = BASE_MIN_WIDTH;
  const minHeight = BASE_MIN_HEIGHT;
  
  // Ensure initial dimensions are at least the computed minimum
  const initialWidth = Math.max(1200, minWidth);
  const initialHeight = Math.max(800, minHeight);
  
  const win = new BrowserWindow({
    width: initialWidth,
    height: initialHeight,
    minWidth: minWidth,
    minHeight: minHeight,
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

  // Track monitor changes while dragging between displays.
  win.on("move", () => {
    applyDynamicMinimumSize(win);
  });

  // Initial sync after the window has been created and placed.
  applyDynamicMinimumSize(win);
}

ipcMain.handle("native-theme:get", () => getNativeThemePayload());

// Expose current minimum window size to renderer
ipcMain.handle("window:get-min-size", () => {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];

  if (win && win.minSizeData) {
    return win.minSizeData;
  }

  const display = screen.getPrimaryDisplay();
  return computeMinimumWindowSizeForDisplay(display);
});

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

  // Recalculate when OS display metrics are updated.
  screen.on("display-metrics-changed", () => {
    BrowserWindow.getAllWindows().forEach((win) => {
      applyDynamicMinimumSize(win);
    });
  });

  // Recalculate when displays are added or removed.
  screen.on("display-added", () => {
    BrowserWindow.getAllWindows().forEach((win) => {
      applyDynamicMinimumSize(win);
    });
  });

  screen.on("display-removed", () => {
    BrowserWindow.getAllWindows().forEach((win) => {
      applyDynamicMinimumSize(win);
    });
  });
  
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
