import React, { useState, useEffect, useRef } from "react";
import "./StartupScreen.css";

export default function StartupScreen({ onLaunch }) {
  const [animate, setAnimate] = useState(false);
  const audioRef = useRef(null); // <--- must define this

  const handleClick = () => {
    // Reset animation if already running
    setAnimate(false);
    void document.getElementById("helios-icon").offsetWidth; // force reflow
    setAnimate(true);

    // play bump sound near end of jump
setTimeout(() => {
  if (audioRef.current) audioRef.current.play();
}, 800); // matches new jump duration
    };

  useEffect(() => {
    if (animate) {
      const timer = setTimeout(() => {
        onLaunch(); // switch to main screen after fade
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [animate, onLaunch]);

  return (
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

      {/* bump sound */}
      <audio ref={audioRef} src="/bump.wav" preload="auto" />
    </div>
  );
}