import React from "react";
import { motion } from 'framer-motion';
import "./TopBar.css";

export default function TopBar({ 
  text, 
  onChange, 
  showCounter, 
  maxChars,
  onSettingsClick,
}) {
  return (
    <div className="top-bar">
      <div className="left-area">
        <div className="input-wrapper">
          <input
            type="text"
            onChange={onChange}
            className="top-input"
            placeholder="Type something…"
            value={text}
          />
          {showCounter && (
            <div className="char-counter">
              {maxChars - text.length}
            </div>
          )}
        </div>
      </div>

      <div className="right-area">
        <motion.button
          className="settings-cog"
          onClick={onSettingsClick}
          whileHover={{ rotate: 55, scale: 1.15 }}
          whileTap={{ scale: 0.88 }}
          transition={{ type: "spring", stiffness: 900, damping: 28 }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-settings-icon lucide-settings"><path d="M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915"/><circle cx="12" cy="12" r="3"/></svg>
        </motion.button>
      </div>
    </div>
  );
}