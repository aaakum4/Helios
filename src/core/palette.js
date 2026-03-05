const PALETTE_STORAGE_KEY = "palette";

export const PALETTES = [
  { id: "default", label: "Default",  swatch: null },
  { id: "purple",  label: "Purple",   swatch: "#7c5cbf" },
  { id: "blue",    label: "Blue",     swatch: "#3b6fd4" },
  { id: "sky",     label: "Sky Blue", swatch: "#0ea5d0" },
  { id: "orange",  label: "Orange",   swatch: "#e07b30" },
  { id: "pink",    label: "Pink",     swatch: "#d44f8f" },
  { id: "green",   label: "Green",    swatch: "#3a9e6c" },
  { id: "red",     label: "Red",      swatch: "#c94040" },
];

const VALID_PALETTES = new Set(PALETTES.map((p) => p.id));

function reportPaletteWarning(context, error) {
  if (import.meta.env.DEV) {
    console.warn(`[palette] ${context}`, error);
  }
}

export function getStoredPalette() {
  try {
    const stored = localStorage.getItem(PALETTE_STORAGE_KEY);
    if (VALID_PALETTES.has(stored)) return stored;
  } catch (error) {
    reportPaletteWarning("Unable to read stored palette.", error);
  }
  return "default";
}

export function applyPalette(id) {
  const next = VALID_PALETTES.has(id) ? id : "default";
  try {
    localStorage.setItem(PALETTE_STORAGE_KEY, next);
    // "default" sets the attribute too — CSS simply has no rules for it,
    // so the neutral base theme vars show through unchanged.
    document.documentElement.setAttribute("data-palette", next);
  } catch (error) {
    reportPaletteWarning("Unable to apply palette.", error);
  }
}

export function initializePalette() {
  applyPalette(getStoredPalette());
}
