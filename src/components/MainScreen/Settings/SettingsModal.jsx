import React, { useEffect, useState } from "react";
import "./SettingsModal.css";

export default function SettingsModal({ onClose }) {
    const getInitialDark = () => {
        try {
            const stored = localStorage.getItem("theme");
            if (stored === "dark") return true;
            if (stored === "light") return false;
        } catch (e) {}
        return (
            typeof window !== "undefined" &&
            window.matchMedia &&
            window.matchMedia("(prefers-color-scheme: dark)").matches
        );
    };

    const getInitialGlow = () => {
        try {
            return localStorage.getItem("glow") || "none";
        } catch (e) {}
        return "none";
    };

    const getInitialSound = () => {
        try {
            const stored = localStorage.getItem("soundEnabled");
            if (stored === "true") return true;
            if (stored === "false") return false;
        } catch (e) {}
        return true;
    };

    const [isDark, setIsDark] = useState(() => getInitialDark());
    const [glowColor, setGlowColor] = useState(() => getInitialGlow());
    const [soundEnabled, setSoundEnabled] = useState(() => getInitialSound());

    useEffect(() => {
        try {
            document.documentElement.classList.toggle("dark-theme", isDark);
            localStorage.setItem("theme", isDark ? "dark" : "light");
        } catch (e) {}
    }, [isDark]);

    useEffect(() => {
        try {
            const appContainer = document.querySelector(".app-container");
            if (appContainer) {
                appContainer.classList.remove("glow-none", "glow-blue", "glow-red", "glow-orange", "glow-purple", "glow-green", "glow-pink");
                appContainer.classList.add(`glow-${glowColor}`);
                localStorage.setItem("glow", glowColor);
            }
        } catch (e) {}
    }, [glowColor]);

    useEffect (() => {
        try {
            localStorage.setItem("soundEnabled", soundEnabled);
        } catch (e) {}
    }, [soundEnabled]);

    return (
        <div className="settings-backdrop" onClick={onClose}>
            <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
                <h2>Settings</h2>

                <div className="settings-section">
                    <label>App theme</label>
                    <div className="theme-switch" onClick={() => setIsDark((v) => !v)} style={{ cursor: "pointer" }}>
                        <input
                            id="theme-toggle"
                            type="checkbox"
                            checked={isDark}
                            onChange={() => setIsDark((v) => !v)}
                        />
                        <label className="switch-track" htmlFor="theme-toggle">
                            <span className="switch-knob" />
                        </label>
                    </div>
                </div>
                <div className="settings-section">
                    <label>Startup sound</label>
                    <div className="theme-switch" onClick={() => setSoundEnabled((v) => !v)} style={{ cursor: "pointer" }}>
                        <input
                            id="sound-toggle"
                            type="checkbox"
                            checked={soundEnabled}
                            onChange={() =>setSoundEnabled((v) => !v)}
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
                    <button className="settings-close" onClick={onClose}>Close</button>
                </div>
            </div>
        </div>
    );
}