// src/components/StartupScreen.jsx
import React, { useState, useEffect, use } from "react";
import "./StartupScreen.css";

export default function StartupScreen({ onLaunch}) {
   const [animate, setAnimate] = useState(false);

   const handleClick = () => {
         setAnimate(true); //this triggers the animation
   };

   useEffect(() => {
            if (animate) {
                const timer = setTimeout(() => {
                    onLaunch(); //after the animation duration, call onLaunch to switch screens
                }, 800); //match this duration to the CSS animation duration
                return () => clearTimeout(timer);
            }
        }, [animate, onLaunch]);
    
    return (
        <div className={`startup-screen ${animate ? "fade-out" : "fade-in"}`} onClick={handleClick}>
            <h1 className="startup-title">Welcome to Helios</h1>
            <img
            src="assets/icon.png"
            alt="Helios Icon"
            className="startup-icon"
            />
            <p className="startup-subtext">Click anywhere to launch</p>
        </div>
    );
}