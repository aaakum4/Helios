import React, { useState, useEffect } from "react";
import StartupScreen from "./components/StartupScreen";
import MainScreen from "./components/MainScreen/MainScreen";
import UnsupportedScreen from "./components/UnsupportedScreen";
import ErrorBoundary from "./components/ErrorBoundary";
import './App.css'
import { initializeTheme } from "./core/theme";
import { initializePalette } from "./core/palette";
import { useWindowWidth } from "./hooks/useWindowWidth";

const MIN_SUPPORTED_WIDTH = 1320;
const MIN_SUPPORTED_HEIGHT = 850;

export default function App() {
  const [launched, setLaunched] = useState(false);
  const { width, height } = useWindowWidth();

  useEffect(() => {
    initializeTheme();
    initializePalette();
  }, []);

  if (width < MIN_SUPPORTED_WIDTH || height < MIN_SUPPORTED_HEIGHT) {
    return <UnsupportedScreen />;
  }

  return (
    <ErrorBoundary>
      {!launched ? (
        <StartupScreen onLaunch={() => setLaunched(true)} />
      ) : (
        <MainScreen onBack={() => setLaunched(false)} />
      )}
    </ErrorBoundary>
  );
}
