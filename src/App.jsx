import React, { useState, useEffect } from "react";
import StartupScreen from "./components/StartupScreen";
import MainScreen from "./components/MainScreen/MainScreen";

export default function App() {
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme === "dark") {
        document.documentElement.classList.add("dark-theme");
      }
    } catch (e) {}
  }, []);

  return (
    <>
      {!launched ? (
        <StartupScreen onLaunch={() => setLaunched(true)} />
      ) : (
        <MainScreen />
      )}
    </>
  );
}
