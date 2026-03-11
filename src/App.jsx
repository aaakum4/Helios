import React, { useState, useEffect } from "react";
import StartupScreen from "./components/StartupScreen";
import MainScreen from "./components/MainScreen/MainScreen";
import './App.css'
import { initializeTheme } from "./core/theme";
import { initializePalette } from "./core/palette";
import { getSupabaseClient, isSupabaseConfigured } from "./lib/supabase";
import { saveToCloud } from "./lib/sync";
import { buildCloudPayload } from "./lib/cloudStorageSnapshot";

export default function App() {
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    initializeTheme();
    initializePalette();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const attemptAutoSave = async (reason) => {
      try {
        const supabase = getSupabaseClient();
        const {
          data: { user },
          error,
        } = await supabase.auth.getUser();

        if (error || !user) {
          return;
        }

        await saveToCloud(buildCloudPayload());
        window.posthog?.capture("cloud_autosave_success", { reason });
      } catch (error) {
        window.posthog?.capture("cloud_autosave_failed", {
          reason,
          message: error?.message || "unknown",
        });
      }
    };

    const handleBeforeUnload = () => {
      void attemptAutoSave("beforeunload");
    };

    const handlePageHide = () => {
      void attemptAutoSave("pagehide");
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        void attemptAutoSave("hidden");
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return (
      <div className="app-shell">
        {!launched ? (
          <StartupScreen onLaunch={() => setLaunched(true)} />
        ) : (
          <MainScreen onBack={() => setLaunched(false)} />
        )}
      </div>
  );
}
