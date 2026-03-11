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
  const [cloudHydrationVersion, setCloudHydrationVersion] = useState(0);
  const autosaveInFlightRef = useRef(false);

  useEffect(() => {
    initializeTheme();
    initializePalette();
  }, []);

  useEffect(() => {
    const handleStartupCloudSync = (event) => {
      const detail = event?.detail || {};

      if (detail.outcome === "applied") {
        setCloudHydrationVersion((value) => value + 1);
      }

      window.posthog?.capture("app_observed_startup_cloud_sync", {
        outcome: detail.outcome || "unknown",
        cloudSavedAtMs: detail.cloudSavedAtMs ?? null,
        localLastWriteAtMs: detail.localLastWriteAtMs ?? null,
        snapshotKeyCount: detail.snapshotKeyCount ?? null,
      });
    };

    window.addEventListener("helios:startup-cloud-sync", handleStartupCloudSync);
    return () => {
      window.removeEventListener("helios:startup-cloud-sync", handleStartupCloudSync);
    };
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
          <MainScreen key={cloudHydrationVersion} onBack={() => setLaunched(false)} />
        )}
      </div>
  );
}
