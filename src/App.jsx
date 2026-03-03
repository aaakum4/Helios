import React, { useState, useEffect } from "react";
import StartupScreen from "./components/StartupScreen";
import MainScreen from "./components/MainScreen/MainScreen";
import UnsupportedScreen from "./components/UnsupportedScreen";
import ErrorBoundary from "./components/ErrorBoundary";
import './App.css'
import { initializeTheme } from "./core/theme";
import { initializePalette } from "./core/palette";
import { useWindowWidth } from "./hooks/useWindowWidth";

// Fallback for Electron environments without windowApi (e.g., web builds)
const DEFAULT_MIN_WIDTH = 1024;
const DEFAULT_MIN_HEIGHT = 700;

export default function App() {
  const [launched, setLaunched] = useState(false);
  const [minWidth, setMinWidth] = useState(DEFAULT_MIN_WIDTH);
  const [minHeight, setMinHeight] = useState(DEFAULT_MIN_HEIGHT);
  const { width, height } = useWindowWidth();
  const isUnsupportedSize = width < minWidth || height < minHeight;

  useEffect(() => {
    initializeTheme();
    initializePalette();
  }, []);

  // Fetch dynamic min size from main process on mount
  useEffect(() => {
    const fetchMinSize = async () => {
      if (window.windowApi) {
        try {
          const { minWidth: mw, minHeight: mh } = await window.windowApi.getMinSize();
          setMinWidth(mw);
          setMinHeight(mh);
        } catch (err) {
          console.error("Failed to get min size from main process:", err);
        }
      }
    };

    fetchMinSize();

    // Listen for min size changes (e.g., when display changes)
    let unsubscribe;
    if (window.windowApi) {
      unsubscribe = window.windowApi.onMinSizeChanged(({ minWidth: mw, minHeight: mh }) => {
        if (typeof mw === "number") {
          setMinWidth(mw);
        }

        if (typeof mh === "number") {
          setMinHeight(mh);
        }
      });
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  return (
    <ErrorBoundary>
      <div className={`app-shell ${isUnsupportedSize ? "app-shell--unsupported" : ""}`}>
        {!launched ? (
          <StartupScreen onLaunch={() => setLaunched(true)} />
        ) : (
          <MainScreen onBack={() => setLaunched(false)} />
        )}
        <UnsupportedScreen
          visible={isUnsupportedSize}
          minWidth={minWidth}
          minHeight={minHeight}
        />
      </div>
    </ErrorBoundary>
  );
}
