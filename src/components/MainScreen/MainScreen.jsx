import { useState, useRef, useEffect } from "react";
import TopBar from "../TopBar/TopBar";
import SettingsModal from "./Settings/SettingsModal";
import "./MainScreen.css";

const MAX_CHARS = 50;

export default function MainScreen() {
  const [text, setText] = useState("");
  const [showCounter, setShowCounter] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const hideTimer = useRef(null);
  const appContainerRef = useRef(null);

  useEffect(() => {
    try {
      const savedGlow = localStorage.getItem("glow") || "none";
      if (appContainerRef.current) {
        appContainerRef.current.classList.add(`glow-${savedGlow}`);
      }
    } catch (e) {}
  }, []);

  const handleChange = (e) => {
    const value = e.target.value;
    if (value.length <= MAX_CHARS) {
      setText(value);
    }

    setShowCounter(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setShowCounter(false), 1000);
};
    
return (
  <div className="app-container" ref={appContainerRef}>
      <div className="main-screen">
        <TopBar
            text={text}
            onChange={handleChange}
            showCounter={showCounter}
            maxChars={MAX_CHARS}
            onSettingsClick={() => setShowSettings(true)}
        />

        {showSettings && <SettingsModal onClose={() => setShowSettings(false)} />}
      
        <div className="helios-corner">Helios</div>
      </div>
    </div>
  );
}