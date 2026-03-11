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
import { extractSnapshotFromCloudPayload, rehydrateLocalStorage } from "./lib/cloudStorageSnapshot";
import "../styles.css";

initializePosthogWebBridge();
initializePriorityEmailBridge();
initializeDemoData();

async function bootstrapCloudSession() {
  try {
    if (!isSupabaseConfigured()) {
      return;
    }

    const supabase = getSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return;
    }

    const cloudPayload = await loadFromCloud();
    if (!cloudPayload) {
      return;
    }

    const snapshot = extractSnapshotFromCloudPayload(cloudPayload);
    rehydrateLocalStorage(snapshot);
  } catch (error) {
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

renderApp();
bootstrapCloudSession();