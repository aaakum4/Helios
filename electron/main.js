const { app, BrowserWindow, ipcMain, nativeTheme, screen } = require("electron");
const path = require("path");
const { PostHog } = require("posthog-node");

require("dotenv").config({ path: path.join(__dirname, "../.env") });

// Baseline values for soft linear min-size scaling.
const BASE_DISPLAY_WIDTH = 1800;
const BASE_DISPLAY_HEIGHT = 1169;
const BASE_MIN_WIDTH = 980;
const BASE_MIN_HEIGHT = 620;
const WIDTH_SCALE_FACTOR = 70 / 288;
const HEIGHT_SCALE_FACTOR = 25 / 187;

// Clamp computed minimum window size.
const MIN_WIDTH_CLAMP = 900;
const MAX_WIDTH_CLAMP = 1320;
const MIN_HEIGHT_CLAMP = 560;
const MAX_HEIGHT_CLAMP = 860;

// Baseline values for zoom scaling.
const BASE_SCALE_WIDTH = 1600;
const BASE_SCALE_HEIGHT = 1169;
const MIN_ZOOM_FACTOR = 0.75;
const MAX_ZOOM_FACTOR = 1;

function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

function computeMinimumWindowSizeForDisplay(display) {
  const { width: displayWidth, height: displayHeight } = display.size;

  // Soft linear scaling.
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

function applyWindowZoom(win) {
  if (win.isDestroyed()) {
    return;
  }

  const [contentWidth, contentHeight] = win.getContentSize();
  const fitScale = Math.min(contentWidth / BASE_SCALE_WIDTH, contentHeight / BASE_SCALE_HEIGHT);
  const zoomFactor = clamp(fitScale, MIN_ZOOM_FACTOR, MAX_ZOOM_FACTOR);

  if (Math.abs(win.webContents.getZoomFactor() - zoomFactor) > 0.001) {
    win.webContents.setZoomFactor(zoomFactor);
  }
}

// PostHog client and dev TLS behavior.

function configureDevEnvironment() {
  const isDevMode = process.env.HELIOS_DEV_MODE === "true";

  if (isDevMode && !app.isPackaged) {
    // Development-only TLS relaxation for intercepted HTTPS traffic.
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    console.warn("⚠️  Development mode: TLS verification relaxed for local development");
  }
}

configureDevEnvironment();

const posthog = new PostHog(process.env.POSTHOG_API_KEY, {
  host: process.env.POSTHOG_HOST || "https://us.i.posthog.com",
  enableExceptionAutocapture: true,
});

posthog.on("error", (err) => {
  // Only log in development to avoid exposing stack traces
  if (!app.isPackaged) {
    console.error("PostHog SDK error:", err?.message || err);
  }
});

// Stable anonymous distinct ID for this installation.
// Initialized after app is ready (app.getPath requires readiness).
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
  } catch {}
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
  // Start with defaults, then sync minimum size to the active display.
  const minWidth = 900;
  const minHeight = 560;

  const initialWidth = Math.max(900, minWidth);
  const initialHeight = Math.max(560, minHeight);

  const win = new BrowserWindow({
    width: initialWidth,
    height: initialHeight,
    minWidth,
    minHeight,
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
    applyWindowZoom(win);
    win.show();
  });

  win.loadURL("http://localhost:5173");

  // Re-evaluate while moving between displays.
  win.on("move", () => {
    applyDynamicMinimumSize(win);
    applyWindowZoom(win);
  });

  win.on("resize", () => {
    applyWindowZoom(win);
  });

  // Initial sync after window placement.
  applyDynamicMinimumSize(win);
  applyWindowZoom(win);
}

ipcMain.handle("native-theme:get", () => getNativeThemePayload());

// Expose current minimum window size to renderer.
ipcMain.handle("window:get-min-size", () => {
  const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];

  if (win && win.minSizeData) {
    return win.minSizeData;
  }

  const display = screen.getPrimaryDisplay();
  return computeMinimumWindowSizeForDisplay(display);
});

// PostHog IPC bridge.
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

// Expose distinct ID to the renderer when needed.
ipcMain.handle("posthog:get-distinct-id", () => DISTINCT_ID);

nativeTheme.on("updated", () => {
  broadcastNativeTheme();
});

app.whenReady().then(() => {
  initDistinctId();
  createWindow();

  // Recalculate when display metrics change.
  screen.on("display-metrics-changed", () => {
    BrowserWindow.getAllWindows().forEach((win) => {
      applyDynamicMinimumSize(win);
      applyWindowZoom(win);
    });
  });

  // Recalculate when displays are added or removed.
  screen.on("display-added", () => {
    BrowserWindow.getAllWindows().forEach((win) => {
      applyDynamicMinimumSize(win);
      applyWindowZoom(win);
    });
  });

  screen.on("display-removed", () => {
    BrowserWindow.getAllWindows().forEach((win) => {
      applyDynamicMinimumSize(win);
      applyWindowZoom(win);
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
  }).catch((err) => {
    console.error("PostHog capture error:", err);
  });
});

app.on("window-all-closed", async () => {
  try {
    await posthog.shutdown();
  } catch (err) {
    console.error("PostHog shutdown error:", err);
  }
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

const smtpPort = Number(process.env.SMTP_PORT || 587);
const smtpSecure = process.env.SMTP_SECURE === "true";
const smtpRequiredKeys = ["SMTP_HOST", "SMTP_USER", "SMTP_PASS", "SMTP_FROM"];
const missingSmtpKeys = smtpRequiredKeys.filter((key) => !process.env[key]);
const smtpConfigured = missingSmtpKeys.length === 0;

let mailTransporter = null;

if (smtpConfigured) {
  try {
    const nodemailer = require("nodemailer");
    mailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } catch {
    mailTransporter = null;
  }
}

ipcMain.handle("priority-email:send", async (_event, payload) => {
  try {
    if (!mailTransporter) {
      return {
        ok: false,
        error:
          missingSmtpKeys.length > 0
            ? `SMTP is not configured. Missing: ${missingSmtpKeys.join(", ")}. Add these to .env and restart the app.`
            : "SMTP is not configured. Check SMTP_HOST/SMTP_PORT/SMTP_SECURE/SMTP_USER/SMTP_PASS/SMTP_FROM and restart the app.",
      };
    }

    const toEmail = String(payload?.toEmail || "").trim();
    const subject = String(payload?.subject || "Helios priority reminder").trim();
    const text = String(payload?.text || "").trim();
    const html = String(payload?.html || "").trim();

    if (!toEmail || !text) {
      return { ok: false, error: "Missing required email fields" };
    }

    await mailTransporter.sendMail({
      from: process.env.SMTP_FROM,
      to: toEmail,
      subject,
      text,
      html: html || undefined,
    });

    return { ok: true };
  } catch (error) {
    // Log detailed error for debugging
    console.error("Email send error:", error);
    posthog.captureException(error instanceof Error ? error : new Error(String(error)), DISTINCT_ID);
    
    // Return more detailed error message
    const errorMsg = error?.message || String(error);
    return { 
      ok: false, 
      error: `Failed to send email: ${errorMsg}` 
    };
  }
});
