const THEME_STORAGE_KEY = "theme";
const VALID_MODES = new Set(["light", "dark", "oled", "system"]);

let currentMode = null;
let unsubscribeNativeTheme = null;
let unsubscribeMediaTheme = null;

function reportThemeWarning(context, error) {
  if (import.meta.env.DEV) {
    console.warn(`[theme] ${context}`, error);
  }
}

function getSystemThemeFromMedia() {
  if (typeof window === "undefined") {
    return "light";
  }

  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }

  return "light";
}

function getSystemThemeFromPayload(payload) {
  if (payload && typeof payload.shouldUseDarkColors === "boolean") {
    return payload.shouldUseDarkColors ? "dark" : "light";
  }

  return getSystemThemeFromMedia();
}

function applyResolvedTheme(theme, mode) {
  if (typeof document === "undefined") {
    return;
  }

  const style = document.createElement("style");
  style.textContent = "* { transition: none !important; }";
  document.head.appendChild(style);

  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.setAttribute("data-theme-mode", mode || theme);

  // Force a reflow so the suppression takes effect before transitions are restored
  document.documentElement.offsetHeight; // eslint-disable-line no-unused-expressions

  document.head.removeChild(style);
}

async function getNativeThemePayload() {
  if (typeof window === "undefined") {
    return null;
  }

  if (window.nativeTheme && typeof window.nativeTheme.get === "function") {
    try {
      return await window.nativeTheme.get();
    } catch (e) {
      return null;
    }
  }

  return null;
}

function cleanupSystemListeners() {
  if (unsubscribeNativeTheme) {
    unsubscribeNativeTheme();
    unsubscribeNativeTheme = null;
  }

  if (unsubscribeMediaTheme) {
    unsubscribeMediaTheme();
    unsubscribeMediaTheme = null;
  }
}

function attachMediaListener() {
  if (!window.matchMedia) {
    return;
  }

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  const handler = (event) => {
    if (currentMode !== "system") {
      return;
    }

    applyResolvedTheme(event.matches ? "dark" : "light", "system");
  };

  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", handler);
    unsubscribeMediaTheme = () => mediaQuery.removeEventListener("change", handler);
  } else if (typeof mediaQuery.addListener === "function") {
    mediaQuery.addListener(handler);
    unsubscribeMediaTheme = () => mediaQuery.removeListener(handler);
  }
}

function attachNativeThemeListener() {
  if (!window.nativeTheme || typeof window.nativeTheme.onUpdated !== "function") {
    return false;
  }

  unsubscribeNativeTheme = window.nativeTheme.onUpdated((payload) => {
    if (currentMode !== "system") {
      return;
    }

    applyResolvedTheme(getSystemThemeFromPayload(payload), "system");
  });

  return true;
}

async function applySystemTheme() {
  const payload = await getNativeThemePayload();
  applyResolvedTheme(getSystemThemeFromPayload(payload), "system");
}

export function getStoredThemeMode() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (VALID_MODES.has(stored)) {
      return stored;
    }
  } catch (error) {
    reportThemeWarning("Unable to read stored theme mode.", error);
  }

  return "system";
}

export async function setThemeMode(mode, options = {}) {
  const nextMode = VALID_MODES.has(mode) ? mode : "system";
  currentMode = nextMode;

  if (options.persist !== false) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextMode);
    } catch (error) {
      reportThemeWarning("Unable to persist theme mode.", error);
    }
  }

  if (nextMode === "system") {
    await applySystemTheme();
    cleanupSystemListeners();
    const hasNativeListener = attachNativeThemeListener();
    if (!hasNativeListener) {
      attachMediaListener();
    }
    return;
  }

  if (nextMode === "oled") {
    cleanupSystemListeners();
    applyResolvedTheme("dark", "oled");
    return;
  }

  cleanupSystemListeners();
  applyResolvedTheme(nextMode, nextMode);
}

export async function initializeTheme() {
  const stored = getStoredThemeMode();
  await setThemeMode(stored);
}
