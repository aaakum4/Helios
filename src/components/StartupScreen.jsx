// src/components/StartupScreen.jsx
import React from "react";
import './StartupScreen.css';

export default function StartupScreen({ onLaunch}) {
    return (
        <div className="startup-screen" onClick={onLaunch}>
            <h1 className="startup-title">Welcome to Helios</h1>
            <img
            src="assets/icon.png"
            alt="Helios Logo"
            className="startup-logo"
            />
            <p className="startup-subtext">Click anywhere to launch</p>
        </div>
    );
}