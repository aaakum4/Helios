import React, { useState } from "react";
import StartupScreen from "./components/StartupScreen";
import MainScreen from "./components/MainScreen/MainScreen";
import './App.css'

export default function App() {
  const [launched, setLaunched] = useState(false);

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
