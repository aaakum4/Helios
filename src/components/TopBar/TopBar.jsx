import React from "react";
import "./TopBar.css";

export default function TopBar({ text, onChange, showCounter, maxChars }) {
  return (
    <div className="top-bar">
      <div className="left-area">
        <div className="input-wrapper">
          <input
            type="text"
            className="top-input"
            placeholder="Type something…"
            value={text}
            onChange={onChange}
          />
          {showCounter && (
            <div className="char-counter">{maxChars - text.length}</div>
          )}
        </div>
      </div>

      <div className="right-area">
        <div className="settings-cog">⚙</div>
      </div>
    </div>
  );
}