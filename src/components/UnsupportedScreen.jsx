import React from 'react';
import './UnsupportedScreen.css';

export default function UnsupportedScreen({ minWidth = 1320, minHeight = 850 }) {
  return (
    <div className="unsupported-screen">
      <div className="unsupported-content">
        <h1 className="unsupported-heading">Helios</h1>
        <p className="unsupported-message">
          Helios is not currently available for mobile devices or screens smaller than {minWidth}px wide and {minHeight}px tall. Sorry for the inconvenience.
        </p>
      </div>
    </div>
  );
}
