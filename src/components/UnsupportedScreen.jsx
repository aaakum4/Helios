import React from 'react';
import './UnsupportedScreen.css';

export default function UnsupportedScreen() {
  return (
    <div className="unsupported-screen">
      <div className="unsupported-content">
        <h1 className="unsupported-heading">Helios</h1>
        <p className="unsupported-message">
          Helios is not currently available for mobile devices or screens smaller than 1320px wide and 850px tall. Sorry for the inconvenience.
        </p>
      </div>
    </div>
  );
}
