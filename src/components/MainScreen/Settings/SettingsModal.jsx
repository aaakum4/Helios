import React, { useEffect, useState } from "react";
import "./SettingsModal.css";
import { useLocalStorage } from "../../../core/useLocalStorage";
import { getStoredThemeMode, setThemeMode as applyThemeMode } from "../../../core/theme";

export default function SettingsModal({ onClose }) {
  const [themeMode, setThemeMode] = useLocalStorage("settings:themeMode", () => getStoredThemeMode());
  const [glowColor, setGlowColor] = useLocalStorage("settings:glowColor", "none");
  const [soundEnabled, setSoundEnabled] = useLocalStorage("settings:soundEnabled", true);

  useEffect(() => {
    applyThemeMode(themeMode);
  }, [themeMode]);

  useEffect(() => {
    try {
      const appContainer = document.querySelector(".app-container");
      if (appContainer) {
        appContainer.classList.remove("glow-none", "glow-blue", "glow-red", "glow-orange", "glow-purple", "glow-green", "glow-pink");
        appContainer.classList.add(`glow-${glowColor}`);
      }
    } catch (e) {}
  }, [glowColor]);

    return (
        <div className="settings-backdrop" onClick={onClose}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Settings</h2>

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
                                    onChange={() => setThemeMode(option.value)}
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
                                onChange={(e) => setGlowColor(e.target.value)}
                            />
                            <span className="glow-radio-label">{color.charAt(0).toUpperCase() + color.slice(1)}</span>
                        </label>
                    ))}
                </div>

                <div className="settings-actions">
                    <button className="settings-close" onClick={onClose}>✕</button>
                </div>
            </div>
        </div>
    );
}