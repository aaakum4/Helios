import { useState } from 'react';
import { useLocalStorage } from '../core/useLocalStorage';
import { useTime } from '../core/TimeProvider';
import './PeacefulDisplay.css';

export default function PeacefulDisplay() {
  const { time } = useTime();
  const [mode, setMode] = useLocalStorage('peacefulDisplay:Mode', 'summer');
  const [clockFont, setClockFont] = useLocalStorage('peacefulDisplay:clockFont', 'sans');
  const [clockColor, setClockColor] = useLocalStorage('peacefulDisplay:clockColor', 'white');
  const [clockFormat, setClockFormat] = useLocalStorage('peacefulDisplay:clockFormat', 24);
  const [showClockSettings, setShowClockSettings] = useState(false);

  const hours24 = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
const formattedTime =
  clockFormat === 24
    ? `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(((hours24 + 11) % 12) + 1).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${
        hours24 >= 12 ? 'PM' : 'AM'}`;

const isWarmSeason = mode === 'summer';

const handleModeCycle = () => {
  const modes = ['summer', 'winter'];
  const currentIndex = modes.indexOf(mode);
  setMode(modes[(currentIndex + 1) % modes.length]);
};

return (
    <><div className={`peaceful-display-container mode-${mode}`}>
      <div className="peaceful-display-scene">
        {isWarmSeason && <div className="peaceful-display-sun" />}
      </div>
      <div className="peaceful-display-hills">
        <div className="peaceful-display-hill hill-back" />
        <div className="peaceful-display-hill hill-mid" />
        <div className="peaceful-display-hill hill-front" />
      </div>
      <div
        className={`peaceful-display-particles ${mode === 'winter' ? 'particles-snow' : 'particles-leaves'}`}
      >
        <span className="particle" />
        <span className="particle" />
        <span className="particle" />
        <span className="particle" />
        <span className="particle" />
      </div>
    </div>
    
    <div className="peaceful-display-clock-wrap">
      <button
        type="button"
        className={`peaceful-display-clock clock-font-${clockFont} clock-color-${clockColor}`}
        onClick={() => setShowClockSettings(!showClockSettings)}
        aria-expanded={showClockSettings}
      >
        {formattedTime}
      </button>

      {showClockSettings && (
        <div className="peaceful-display-settings" role="dialog" aria-label="Clock Settings">
          <div className="setting-row">
            <span className="settings-label">Font:</span>
            <div className="settings-options">
              <button
                type="button"
                onClick={() => setClockFont('serif')}
                className={clockFont === 'serif' ? 'is-active' : ''}
              >

                Serif
              </button>
              <button
                type="button"
                onClick={() => setClockFont('sans')}
                className={clockFont === 'sans' ? 'is-active' : ''}
              >
                Sans
              </button>
              <button
                type="button"
                onClick={() => setClockFont('mono')}
                className={clockFont === 'mono' ? 'is-active' : ''}
              >
                Mono
              </button>
            </div>
          </div>

          <div className="setting-row">
            <span className="settings-label">Color:</span>
            <div className="settings-options">
              <button
                type="button"
                onClick={() => setClockColor('black')}
                className={clockColor === 'black' ? 'is-active' : ''}
              >
                White
              </button>
              <button
                type="button"
                onClick={() => setClockColor('grey')}
                className={clockColor === 'grey' ? 'is-active' : ''}
              >
                Grey
              </button>
              <button
                type="button"
                onClick={() => setClockColor('white')}
                className={clockColor === 'white' ? 'is-active' : ''}
              >
                White
              </button>
              <button
                type="button"
                onClick={() => setClockColor('blue')}
                className={clockColor === 'blue' ? 'is-active' : ''}
              >
                Blue
              </button>
              <button
                type="button"
                onClick={() => setClockColor('orange')}
                className={clockColor === 'orange' ? 'is-active' : ''}
              >
                Orange
              </button>
              <button
                type="button"
                onClick={() => setClockColor('green')}
                className={clockColor === 'green' ? 'is-active' : ''}
              >
                Green
              </button>
            </div>
          </div>

          <div className="setting-row">
            <span className="settings-label">Format:</span>
            <div className="settings-options">
              <button
                type="button"
                onClick={() => setClockFormat(12)}
                className={clockFormat === 12 ? 'is-active' : ''}
              >
                12h
              </button>
              <button
                type="button"
                onClick={() => setClockFormat(24)}
                className={clockFormat === 24 ? 'is-active' : ''}
              >
                24h
              </button>
            </div>
          </div>
        
          <div className="setting-row">
            <span className="settings-label">Mode:</span>
            <div className="settings-options">
              <button
                type="button" onClick={handleModeCycle}>
                  Change Season
              </button>
            </div>
          </div>
          </div>
        )}
      </div>
      </>
    );
  }