import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import "./SettingsModal.css";
import { useLocalStorage } from "../../../core/useLocalStorage";
import { getStoredThemeMode, setThemeMode as applyThemeMode } from "../../../core/theme";
import { PALETTES, getStoredPalette, applyPalette } from "../../../core/palette";

export default function SettingsModal({ onClose }) {
  const [themeMode, setThemeMode] = useLocalStorage("settings:themeMode", () => getStoredThemeMode());
  const [glowColor, setGlowColor] = useLocalStorage("settings:glowColor", "none");
  const [soundEnabled, setSoundEnabled] = useLocalStorage("settings:soundEnabled", true);
  const [palette, setPaletteState] = useState(() => getStoredPalette());

  const handlePaletteChange = (id) => {
    setPaletteState(id);
    applyPalette(id);
    window.posthog?.capture("settings_palette_changed", {
      palette: id,
    });
  };

  const handleThemeChange = (value) => {
    setThemeMode(value);
    window.posthog?.capture("settings_theme_changed", {
      theme: value,
    });
  };

  useEffect(() => {
    applyThemeMode(themeMode);
  }, [themeMode]);

  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-glow", glowColor);
        } catch (error) {
            if (import.meta.env.DEV) {
                console.warn("[settings] Unable to apply glow setting.", error);
            }
        }
  }, [glowColor]);

  const handleResetTutorials = () => {
    localStorage.removeItem('peacefulDisplay:hasSeenClockTutorial');
    window.posthog?.capture("settings_reset_tutorials", {});
  };

    return (
        <div className="settings-backdrop" onClick={onClose}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Settings</h2>
                
                <div className="settings-content">
                <div className="settings-section theme-section">
                    <label>Theme</label>
                    <div className="theme-options" data-active={themeMode}>
                        {[
                            { value: "system", label: "System" },
                            { value: "light", label: "Light" },
                            { value: "dark", label: "Dark" },
                        ].map((option) => (
                            <label
                                key={option.value}
                                className={`theme-option ${themeMode === option.value ? "is-active" : ""}`}
                            >
                                <input
                                    type="radio"
                                    name="theme-mode"
                                    value={option.value}
                                    checked={themeMode === option.value}
                                    onChange={() => handleThemeChange(option.value)}
                                />
                                <span className="theme-option-label">{option.label}</span>
                            </label>
                        ))}
                    </div>
                </div>
                <div className="settings-section">
                    <label>Startup sound</label>
                    <div className="theme-switch" style={{ cursor: "pointer" }}>
                        <input
                            id="sound-toggle"
                            type="checkbox"
                            checked={soundEnabled}
                            onChange={() => setSoundEnabled((v) => !v)}
                        />
                        <label className="switch-track" htmlFor="sound-toggle">
                            <span className="switch-knob" />
                        </label>
                    </div>
                </div>
                
                <div className="settings-section palette-label-section">
                    <label>Color palette</label>
                </div>

                <div className="palette-options">
                    {PALETTES.map(({ id, label, swatch }) => (
                        <button
                            key={id}
                            title={label}
                            className={`palette-swatch ${palette === id ? "is-active" : ""}`}
                            style={swatch ? { "--swatch": swatch } : { "--swatch": "#888888" }}
                            onClick={() => handlePaletteChange(id)}
                        >
                            <span className={`palette-swatch-dot${!swatch ? " palette-swatch-dot--default" : ""}`} />
                            <span className="palette-swatch-label">{label}</span>
                        </button>
                    ))}
                </div>

                <div className="settings-section">
                    <button className="reset-tutorials-btn" onClick={handleResetTutorials}>Reset Tutorials</button>
                </div>

                <div className="settings-section glow-label-section">
                    <label>Window glow</label>
                </div>

                <div className="glow-options">
                    {["none", "red", "blue", "green", "orange", "purple", "pink"].map((color) => (
                        <label key={color} className="glow-option">
                            <input
                                type="radio"
                                name="glow"
                                value={color}
                                checked={glowColor === color}
                                onChange={(e) => {
                                    setGlowColor(e.target.value);
                                    window.posthog?.capture("settings_glow_changed", {
                                        glow_color: e.target.value,
                                    });
                                }}
                            />
                            <span className="glow-radio-label">{color.charAt(0).toUpperCase() + color.slice(1)}</span>
                        </label>
                    ))}
                </div>
                </div>

                <div className="settings-actions">
                    <button className="settings-close" onClick={onClose}><X size={18} strokeWidth={2.5} /></button>
                </div>
            </div>
        </div>
    );
}