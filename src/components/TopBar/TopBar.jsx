import React from "react";
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
        <button
          className="settings-cog"
          onClick={onSettingsClick}
        >
          􀣋
        </button>
      </div>
    </div>
  );
}