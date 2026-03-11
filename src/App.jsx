import React, { useState, useEffect, useRef } from "react";
import StartupScreen from "./components/StartupScreen";
import MainScreen from "./components/MainScreen/MainScreen";
import './App.css'
import { initializeTheme } from "./core/theme";
import { initializePalette } from "./core/palette";
import { getSupabaseClient, isSupabaseConfigured } from "./lib/supabase";
import { saveToCloud } from "./lib/sync";
import { buildCloudPayload } from "./lib/cloudStorageSnapshot";

const CLOUD_AUTOSAVE_INTERVAL_MS = 60 * 1000;

export default function App() {
  const [launched, setLaunched] = useState(false);
  const autosaveInFlightRef = useRef(false);

  useEffect(() => {
    initializeTheme();
    initializePalette();
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const attemptAutoSave = async (reason) => {
      if (autosaveInFlightRef.current) {
        return;
      }

      autosaveInFlightRef.current = true;
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
      } finally {
        autosaveInFlightRef.current = false;
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

    const handleCloudSaveRequest = (event) => {
      const reason = event?.detail?.reason || "requested";
      void attemptAutoSave(reason);
    };

    const intervalId = window.setInterval(() => {
      void attemptAutoSave("interval");
    }, CLOUD_AUTOSAVE_INTERVAL_MS);

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("helios:cloud-save-request", handleCloudSaveRequest);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("helios:cloud-save-request", handleCloudSaveRequest);
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
