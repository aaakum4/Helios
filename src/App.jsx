import React, { useState, useEffect } from "react";
import StartupScreen from "./components/StartupScreen";
import MainScreen from "./components/MainScreen/MainScreen";
import './App.css'
import { initializeTheme } from "./core/theme";
import { initializePalette } from "./core/palette";

export default function App() {
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    initializeTheme();
    initializePalette();
  }, []);

  return (
    <>
      {!launched ? (
        <StartupScreen onLaunch={() => setLaunched(true)} />
      ) : (
        <MainScreen onBack={() => setLaunched(false)} />
      )}
    </>
  );
}
