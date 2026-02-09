const THEME_STORAGE_KEY = "theme";
const VALID_MODES = new Set(["light", "dark", "system"]);

let currentMode = null;
let unsubscribeNativeTheme = null;
let unsubscribeMediaTheme = null;

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

function applyResolvedTheme(theme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.setAttribute("data-theme", theme);
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

    applyResolvedTheme(event.matches ? "dark" : "light");
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

    applyResolvedTheme(getSystemThemeFromPayload(payload));
  });

  return true;
}

async function applySystemTheme() {
  const payload = await getNativeThemePayload();
  applyResolvedTheme(getSystemThemeFromPayload(payload));
}

export function getStoredThemeMode() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (VALID_MODES.has(stored)) {
      return stored;
    }
  } catch (e) {}

  return "system";
}

export async function setThemeMode(mode, options = {}) {
  const nextMode = VALID_MODES.has(mode) ? mode : "system";
  currentMode = nextMode;

  if (options.persist !== false) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, nextMode);
    } catch (e) {}
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

  cleanupSystemListeners();
  applyResolvedTheme(nextMode);
}

export async function initializeTheme() {
  const stored = getStoredThemeMode();
  await setThemeMode(stored);
}
