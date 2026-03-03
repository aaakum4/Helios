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
          Helios needs at least {minWidth}px width and {minHeight}px height for this display.
          <br />
          <br />
          Increase the window size to continue.
          <br />
          <br />
          Sorry for the inconvenience! We're working on improving this experience in a future update.
        </p>
      </div>
    </div>
  );
}
