import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { TimeProvider } from "./core/TimeProvider.jsx";
import { AppProvider } from "./core/AppContext.jsx";
import { initializePosthogWebBridge } from "./core/posthogWebBridge";
import { initializePriorityEmailBridge } from "./core/priorityEmailWebBridge";
import "../styles.css";

initializePosthogWebBridge();
initializePriorityEmailBridge();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TimeProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </TimeProvider>
  </React.StrictMode>
);