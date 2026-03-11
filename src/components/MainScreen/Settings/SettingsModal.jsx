import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import "./SettingsModal.css";
import { useLocalStorage } from "../../../core/useLocalStorage";
import { getStoredThemeMode, setThemeMode as applyThemeMode } from "../../../core/theme";
import { PALETTES, getStoredPalette, applyPalette } from "../../../core/palette";
import { getSupabaseClient, isSupabaseConfigured } from "../../../lib/supabase";
import { loadFromCloud, saveToCloud } from "../../../lib/sync";
import {
    buildCloudPayload,
    extractSnapshotFromCloudPayload,
    rehydrateLocalStorage,
} from "../../../lib/cloudStorageSnapshot";

export default function SettingsModal({ onClose }) {
    const [themeMode, setThemeMode] = useLocalStorage("settings:themeMode", () => getStoredThemeMode());
    const [glowColor, setGlowColor] = useLocalStorage("settings:glowColor", "none");
    const [soundEnabled, setSoundEnabled] = useLocalStorage("settings:soundEnabled", true);
    const [palette, setPaletteState] = useState(() => getStoredPalette());
    const [cloudEmail, setCloudEmail] = useState("");
    const [cloudPassword, setCloudPassword] = useState("");
    const [cloudAuthBusy, setCloudAuthBusy] = useState(false);
    const [cloudSaving, setCloudSaving] = useState(false);
    const [cloudRestoring, setCloudRestoring] = useState(false);
    const [cloudResetBusy, setCloudResetBusy] = useState(false);
    const [cloudAccountEmail, setCloudAccountEmail] = useState("");
    const [cloudStatus, setCloudStatus] = useState({ type: "idle", message: "" });
    const cloudConfigured = isSupabaseConfigured();

    const getFriendlyCloudError = (error, fallbackMessage) => {
        const message = error?.message || "";
        if (/VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY|Cloud sync is not configured/i.test(message)) {
            return "Cloud sync is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.";
        }
        if (/email.*not.*confirm|not.*verified|email not confirmed/i.test(message)) {
            return "Your email is not verified yet. Check your inbox for the verification email, verify your account, then log in again.";
        }
        return message || fallbackMessage;
    };

    const refreshCloudSessionUser = async () => {
        if (!cloudConfigured) {
            setCloudAccountEmail("");
            return;
        }

        try {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase.auth.getUser();
            if (error) {
                throw error;
            }
            setCloudAccountEmail(data?.user?.email || "");
        } catch {
            setCloudAccountEmail("");
        }
    };

    useEffect(() => {
        refreshCloudSessionUser();
    }, []);

    const restoreLatestCloudData = async ({ reloadOnSuccess = true, noBackupMessage = "No cloud backup found for this account." } = {}) => {
        const cloudPayload = await loadFromCloud();
        if (!cloudPayload) {
            setCloudStatus({
                type: "info",
                message: noBackupMessage,
            });
            return;
        }

        const snapshot = extractSnapshotFromCloudPayload(cloudPayload);
        rehydrateLocalStorage(snapshot);

        setCloudStatus({
            type: "success",
            message: "Cloud restore complete. Reloading app...",
        });

        window.posthog?.capture("settings_cloud_restore_success", {
            restored_key_count: Object.keys(snapshot).length,
        });

        if (reloadOnSuccess) {
            setTimeout(() => {
                window.location.reload();
            }, 700);
        }
    };

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

    const handleOpenDevlog = () => {
        window.open("https://github.com/aaakum4/Helios", "_blank", "noopener,noreferrer");
        window.posthog?.capture("settings_devlog_opened", {});
    };

    const handleCreateAccount = async () => {
        if (!cloudConfigured) {
            setCloudStatus({
                type: "error",
                message: "Cloud sync is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
            });
            return;
        }

        const email = cloudEmail.trim();
        const password = cloudPassword;
        if (!email || !password) {
            setCloudStatus({ type: "error", message: "Enter email and password to create your account." });
            return;
        }

        setCloudAuthBusy(true);
        setCloudStatus({ type: "idle", message: "" });

        try {
            const supabase = getSupabaseClient();
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) {
                throw error;
            }

            setCloudAccountEmail(data?.user?.email || email);

            if (!data?.session) {
                setCloudStatus({
                    type: "info",
                    message: "Account created. Check your email inbox for the verification email, verify your account, then log in.",
                });
                return;
            }

            await restoreLatestCloudData({
                reloadOnSuccess: true,
                noBackupMessage: "Account created. No cloud backup yet.",
            });
        } catch (error) {
            setCloudStatus({ type: "error", message: getFriendlyCloudError(error, "Unable to create account.") });
        } finally {
            setCloudAuthBusy(false);
        }
    };

    const handleLogin = async () => {
        if (!cloudConfigured) {
            setCloudStatus({
                type: "error",
                message: "Cloud sync is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
            });
            return;
        }

        const email = cloudEmail.trim();
        const password = cloudPassword;
        if (!email || !password) {
            setCloudStatus({ type: "error", message: "Enter email and password to log in." });
            return;
        }

        setCloudAuthBusy(true);
        setCloudStatus({ type: "idle", message: "" });

        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) {
                throw error;
            }

            setCloudAccountEmail(email);
            await restoreLatestCloudData({ reloadOnSuccess: true });
            window.posthog?.capture("settings_cloud_login_success", {});
        } catch (error) {
            setCloudStatus({ type: "error", message: getFriendlyCloudError(error, "Unable to log in.") });
            window.posthog?.capture("settings_cloud_login_failed", { message: error?.message || "unknown" });
        } finally {
            setCloudAuthBusy(false);
        }
    };

    const handleLogout = async () => {
        if (!cloudConfigured) {
            return;
        }

        setCloudAuthBusy(true);
        setCloudStatus({ type: "idle", message: "" });

        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.signOut();
            if (error) {
                throw error;
            }

            setCloudAccountEmail("");
            setCloudPassword("");
            setCloudStatus({ type: "success", message: "Logged out of cloud account." });
            window.posthog?.capture("settings_cloud_logout", {});
        } catch (error) {
            setCloudStatus({ type: "error", message: getFriendlyCloudError(error, "Unable to log out.") });
        } finally {
            setCloudAuthBusy(false);
        }
    };

    const handleResetPassword = async () => {
        if (!cloudConfigured) {
            setCloudStatus({
                type: "error",
                message: "Cloud sync is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
            });
            return;
        }

        const email = cloudEmail.trim();
        if (!email) {
            setCloudStatus({ type: "error", message: "Enter your account email to reset password." });
            return;
        }

        setCloudResetBusy(true);
        setCloudStatus({ type: "idle", message: "" });

        try {
            const supabase = getSupabaseClient();
            const { error } = await supabase.auth.resetPasswordForEmail(email);
            if (error) {
                throw error;
            }

            setCloudStatus({
                type: "info",
                message: "Password reset email sent. Check your email inbox and follow the verification steps to reset your password.",
            });
            window.posthog?.capture("settings_cloud_reset_requested", {});
        } catch (error) {
            setCloudStatus({ type: "error", message: getFriendlyCloudError(error, "Unable to send password reset email.") });
        } finally {
            setCloudResetBusy(false);
        }
    };

    const handleCloudSave = async () => {
        if (!cloudAccountEmail) {
            setCloudStatus({ type: "error", message: "Log in first to save to cloud." });
            return;
        }

            setCloudSaving(true);
            setCloudStatus({ type: "idle", message: "" });

            try {
                await saveToCloud(buildCloudPayload());

                setCloudStatus({
                    type: "success",
                    message: "Cloud save complete.",
                });

                window.posthog?.capture("settings_cloud_save_success", {
                    account_email: cloudAccountEmail,
                });
            } catch (error) {
                const message = getFriendlyCloudError(error, "Cloud save failed. Please try again.");
                setCloudStatus({ type: "error", message });
                window.posthog?.capture("settings_cloud_save_failed", { message });
            } finally {
                setCloudSaving(false);
            }
    };

    const handleRestoreFromCloud = async () => {
            if (!cloudAccountEmail) {
                setCloudStatus({ type: "error", message: "Log in first to restore from cloud." });
                return;
            }

            setCloudRestoring(true);
            setCloudStatus({ type: "idle", message: "" });

            try {
                await restoreLatestCloudData({ reloadOnSuccess: true });
            } catch (error) {
                const message = getFriendlyCloudError(error, "Cloud restore failed. Please try again.");
                setCloudStatus({ type: "error", message });
                window.posthog?.capture("settings_cloud_restore_failed", { message });
            } finally {
                setCloudRestoring(false);
            }
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
                            { value: "oled", label: "OLED" },
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

                <div className="settings-section">
                    <button className="reset-tutorials-btn" onClick={handleOpenDevlog}>Devlog</button>
                </div>

                <div className="settings-section cloud-save-label-section">
                    <label>Cloud save account</label>
                </div>

                <div className="cloud-save-group">
                    {!cloudConfigured ? (
                        <p className="cloud-save-status cloud-save-status--error">
                            Cloud sync is not configured. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
                        </p>
                    ) : null}

                    <input
                        type="email"
                        className="cloud-save-input"
                        placeholder="Account email"
                        value={cloudEmail}
                        onChange={(event) => setCloudEmail(event.target.value)}
                        autoComplete="email"
                        disabled={!cloudConfigured || cloudAuthBusy || cloudSaving || cloudRestoring || cloudResetBusy}
                    />
                    <input
                        type="password"
                        className="cloud-save-input"
                        placeholder="Password"
                        value={cloudPassword}
                        onChange={(event) => setCloudPassword(event.target.value)}
                        autoComplete="current-password"
                        disabled={!cloudConfigured || cloudAuthBusy || cloudSaving || cloudRestoring || cloudResetBusy}
                    />

                    <div className="cloud-account-meta">
                        {cloudAccountEmail ? `Logged in as ${cloudAccountEmail}` : "Not logged in"}
                    </div>

                    <div className="cloud-auth-actions">
                        <button
                            className="cloud-restore-btn"
                            onClick={handleLogin}
                            disabled={!cloudConfigured || cloudAuthBusy || cloudSaving || cloudRestoring || cloudResetBusy}
                        >
                            {cloudAuthBusy ? "Working..." : "Log In"}
                        </button>
                        <button
                            className="cloud-restore-btn"
                            onClick={handleCreateAccount}
                            disabled={!cloudConfigured || cloudAuthBusy || cloudSaving || cloudRestoring || cloudResetBusy}
                        >
                            {cloudAuthBusy ? "Working..." : "Create Account"}
                        </button>
                    </div>

                    <div className="cloud-auth-actions">
                        <button
                            className="cloud-restore-btn"
                            onClick={handleResetPassword}
                            disabled={!cloudConfigured || cloudAuthBusy || cloudSaving || cloudRestoring || cloudResetBusy}
                        >
                            {cloudResetBusy ? "Sending..." : "Forgot Password"}
                        </button>
                        <button
                            className="cloud-restore-btn"
                            onClick={handleLogout}
                            disabled={!cloudConfigured || !cloudAccountEmail || cloudAuthBusy || cloudSaving || cloudRestoring || cloudResetBusy}
                        >
                            {cloudAuthBusy ? "Working..." : "Log Out"}
                        </button>
                    </div>

                    <button
                        className="cloud-save-btn"
                        onClick={handleCloudSave}
                        disabled={!cloudConfigured || !cloudAccountEmail || cloudAuthBusy || cloudSaving || cloudRestoring || cloudResetBusy}
                    >
                        {cloudSaving ? "Saving..." : "Cloud Save"}
                    </button>
                    <button
                        className="cloud-restore-btn"
                        onClick={handleRestoreFromCloud}
                        disabled={!cloudConfigured || !cloudAccountEmail || cloudAuthBusy || cloudSaving || cloudRestoring || cloudResetBusy}
                    >
                        {cloudRestoring ? "Restoring..." : "Restore From Cloud"}
                    </button>
                    {cloudStatus.message ? (
                        <p className={`cloud-save-status cloud-save-status--${cloudStatus.type}`}>
                            {cloudStatus.message}
                        </p>
                    ) : null}
                </div>

                <div className="settings-section shortcuts-label-section">
                    <label>Keyboard shortcuts</label>
                </div>

                <div className="shortcut-list" aria-label="Keyboard shortcuts">
                    <div className="shortcut-row"><span>Open settings</span><kbd>Cmd/Ctrl + ,</kbd></div>
                    <div className="shortcut-row"><span>Toggle side panel</span><kbd>Cmd/Ctrl + B</kbd></div>
                    <div className="shortcut-row"><span>Quick add todo modal</span><kbd>Cmd/Ctrl + Shift + A</kbd></div>
                    <div className="shortcut-row"><span>Open Todo node</span><kbd>Cmd/Ctrl + Shift + T</kbd></div>
                    <div className="shortcut-row"><span>Open node by position</span><kbd>Cmd/Ctrl + 1-6</kbd></div>
                    <div className="shortcut-row"><span>Close modal/panel/node</span><kbd>Esc</kbd></div>
                    <div className="shortcut-row"><span>Search todos</span><kbd>Cmd/Ctrl + F</kbd></div>
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