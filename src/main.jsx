import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { TimeProvider } from "./core/TimeProvider.jsx";
import { AppProvider } from "./core/AppContext.jsx";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/react";
import "../styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <TimeProvider>
      <AppProvider>
        <App />
        <Analytics />
        <SpeedInsights />
      </AppProvider>
    </TimeProvider>
  </React.StrictMode>
);