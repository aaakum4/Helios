const { app, BrowserWindow, ipcMain, nativeTheme, screen } = require("electron");
const path = require("path");
const { PostHog } = require("posthog-node");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Dynamic minimum window size scaling
// Baseline ratios from 1800x1169 screen → 1320x850 min size
const WIDTH_RATIO = 1320 / 1800;  // ~73.33%
const HEIGHT_RATIO = 850 / 1169;  // ~72.71%
const MIN_WIDTH_CLAMP = 800;       // absolute minimum
const MAX_WIDTH_CLAMP = 2560;      // absolute maximum
const MIN_HEIGHT_CLAMP = 600;      // absolute minimum
const MAX_HEIGHT_CLAMP = 1600;     // absolute maximum

function computeMinimumWindowSize() {
  const display = screen.getPrimaryDisplay();
  const { width: workWidth, height: workHeight } = display.workAreaSize;
  
  // Calculate proportional minimums from work area
  let minWidth = Math.round(workWidth * WIDTH_RATIO);
  let minHeight = Math.round(workHeight * HEIGHT_RATIO);
  
  // Apply safety clamps to prevent extreme values
  minWidth = Math.max(MIN_WIDTH_CLAMP, Math.min(minWidth, MAX_WIDTH_CLAMP));
  minHeight = Math.max(MIN_HEIGHT_CLAMP, Math.min(minHeight, MAX_HEIGHT_CLAMP));
  
  return { minWidth, minHeight, workWidth, workHeight };
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
  const { minWidth, minHeight } = computeMinimumWindowSize();
  
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
  
  // Store current min size for IPC queries
  win.minSizeData = { minWidth, minHeight };
}

ipcMain.handle("native-theme:get", () => getNativeThemePayload());

// Expose current minimum window size to renderer
ipcMain.handle("window:get-min-size", () => {
  const { minWidth, minHeight } = computeMinimumWindowSize();
  return { minWidth, minHeight };
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

// Recalculate minimum window size when display configuration changes
screen.on("display-metrics-changed", () => {
  const allWindows = BrowserWindow.getAllWindows();
  allWindows.forEach((win) => {
    const { minWidth, minHeight } = computeMinimumWindowSize();
    win.setMinimumSize(minWidth, minHeight);
    win.minSizeData = { minWidth, minHeight };
    // Notify renderer that min size changed
    win.webContents.send("window:min-size-changed", { minWidth, minHeight });
  });
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
