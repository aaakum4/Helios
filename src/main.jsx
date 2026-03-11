import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { TimeProvider } from "./core/TimeProvider.jsx";
import { AppProvider } from "./core/AppContext.jsx";
import { initializePosthogWebBridge } from "./core/posthogWebBridge";
import { initializePriorityEmailBridge } from "./core/priorityEmailWebBridge";
import { initializeDemoData } from "./core/demoData";
import { getSupabaseClient, isSupabaseConfigured } from "./lib/supabase";
import { loadFromCloud } from "./lib/sync";
import { applyCloudPayloadIfNewer } from "./lib/cloudStorageSnapshot";
import "../styles.css";

const CLOUD_STARTUP_TIMEOUT_MS = 5000;

initializePosthogWebBridge();
initializePriorityEmailBridge();
initializeDemoData();

function withTimeout(promise, timeoutMs, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      window.setTimeout(() => {
        const timeoutError = new Error(`${label} timed out`);
        timeoutError.code = "TIMEOUT";
        reject(timeoutError);
      }, timeoutMs);
    }),
  ]);
}

function emitStartupSyncOutcome(outcome, details = {}) {
  window.dispatchEvent(
    new CustomEvent("helios:startup-cloud-sync", {
      detail: { outcome, ...details },
    })
  );

  window.posthog?.capture("startup_cloud_sync", {
    outcome,
    ...details,
  });
}

async function bootstrapCloudSession() {
  try {
    if (!isSupabaseConfigured()) {
      emitStartupSyncOutcome("not_configured");
      return;
    }

    const supabase = getSupabaseClient();
    const {
      data: { user },
      error,
    } = await withTimeout(supabase.auth.getUser(), CLOUD_STARTUP_TIMEOUT_MS, "auth lookup");

    if (error || !user) {
      emitStartupSyncOutcome("unauthenticated");
      return;
    }

    const cloudPayload = await withTimeout(loadFromCloud(), CLOUD_STARTUP_TIMEOUT_MS, "cloud fetch");
    if (!cloudPayload) {
      emitStartupSyncOutcome("no_backup");
      return;
    }

    const result = applyCloudPayloadIfNewer(cloudPayload, { dispatchEvents: true });
    emitStartupSyncOutcome(result.applied ? "applied" : result.reason, {
      cloudSavedAtMs: result.cloudSavedAtMs,
      localLastWriteAtMs: result.localLastWriteAtMs,
      snapshotKeyCount: result.snapshotKeyCount,
    });
  } catch (error) {
    const isTimeout = error?.code === "TIMEOUT";
    emitStartupSyncOutcome(isTimeout ? "timeout" : "failed", {
      message: error?.message || "unknown",
    });

    if (import.meta.env.DEV) {
      console.warn("[cloud] Startup restore failed.", error);
    }
  }
}

function renderApp() {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <TimeProvider>
        <AppProvider>
          <App />
        </AppProvider>
      </TimeProvider>
    </React.StrictMode>
  );
}

async function startApp() {
  renderApp();
  void bootstrapCloudSession();
}

void startApp();