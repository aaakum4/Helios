import React from 'react';
import './UnsupportedScreen.css';

export default function UnsupportedScreen({ visible = false, minWidth = 1230, minHeight = 815 }) {
  return (
    <div
      className={`unsupported-screen ${visible ? 'unsupported-screen--visible' : ''}`}
      aria-hidden={!visible}
    >
      <div className="unsupported-content">
        <h1 className="unsupported-heading">Helios</h1>
        <p className="unsupported-message">
          Helios requires at least {minWidth}px and {minHeight}px for this display.
          <br />
          <br />
          Please increase the window size to continue, or use ⌘ - (Mac) / Ctrl - (Windows) to adjust the zoom temporarily.
          <br />
          <br />
          Sorry for the inconvenience — we're working on improving this in a future update.
        </p>
      </div>
    </div>
  );
}
