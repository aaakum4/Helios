import React, { useState, useEffect, useRef } from "react";
import "./StartupScreen.css";

export default function StartupScreen({ onLaunch }) {
  const [animate, setAnimate] = useState(false);
  const audioRef = useRef(null);

  const getSoundEnabled = () => {
    try {
      const stored = localStorage.getItem("soundEnabled");
      if (stored === "false") return false;
      return true;
    } catch (e) {}
    return true;
  };

  const handleClick = () => {
    setAnimate(false);
    void document.getElementById("helios-icon").offsetWidth; 
    setAnimate(true);

setTimeout(() => {
  if (audioRef.current && getSoundEnabled()) audioRef.current.play();
}, 300);
    };

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        onLaunch();
      }, 1600);
      return () => clearTimeout(timer);
    }
  }, [animate, onLaunch]);

  return (
  <div className="app-container">
    <div
      className={`startup-screen ${animate ? "fade-out" : "fade-in"}`}
      onClick={handleClick}
    >
      <h1 className="startup-title">Helios</h1>
      <img
        id="helios-icon"
        src="/icon.png"
        alt="Helios Icon"
        className={`startup-icon ${animate ? "jump" : ""}`}
      />
      <p className="startup-subtext">Click to launch</p>

      <audio ref={audioRef} src="open.wav" preload="auto" />
    </div>
  </div>
);
}