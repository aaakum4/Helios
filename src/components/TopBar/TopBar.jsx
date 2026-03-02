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
          􀣋
        </motion.button>
      </div>
    </div>
  );
}