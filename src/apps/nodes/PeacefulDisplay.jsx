import { useState, useEffect, useRef } from 'react';
import { useLocalStorage } from '../../core/useLocalStorage';
import { useAppContext } from '../../core/AppContext';
import { useTime } from '../../core/TimeProvider';
import './PeacefulDisplay.css';

const DEFAULT_WORK_TIME = 25 * 60;
const DEFAULT_BREAK_TIME = 5 * 60;

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export default function PeacefulDisplay() {
  const { time } = useTime();

  const [mode, setMode] = useLocalStorage('peacefulDisplay:Mode', 'summer');
  const [clockFont, setClockFont] = useLocalStorage('peacefulDisplay:clockFont', 'sans');
  const [clockColor, setClockColor] = useLocalStorage('peacefulDisplay:clockColor', 'white');
  const [clockFormat, setClockFormat] = useLocalStorage('peacefulDisplay:clockFormat', 24);
  const [showClockSettings, setShowClockSettings] = useState(false);
  const [hasSeenClockTutorial, setHasSeenClockTutorial] = useLocalStorage('peacefulDisplay:hasSeenClockTutorial', false);

  const [particles, setParticles] = useState([]);

  // Spawn particles at a steady interval.
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      const particleType = mode === 'winter' ? 'snow' : mode === 'autumn' ? 'leaf' : null;
      if (!particleType) return;
      
      const newParticle = {
        id: `${Date.now()}-${Math.random()}`,
        left: Math.random() * 100,
        type: particleType,
      };
      setParticles(prev => [...prev, newParticle]);
    }, 1200);
    
    return () => clearInterval(spawnInterval);
  }, [mode]);

  // Clean up particles after animation completes.
  useEffect(() => {
    const cleanup = setInterval(() => {
      setParticles(prev => {
        const now = Date.now();
        return prev.filter(p => {
          const timestamp = parseInt(p.id.split('-')[0]);
          return (now - timestamp) < 16000;
        });
      });
    }, 500);
    
    return () => clearInterval(cleanup);
  }, []);

  // Pomodoro state shared with the Pomodoro node.
  const {
    focusSubjects, setStudySessions,
    ftActiveSubjectId, setFtActiveSubjectId,
    ftSessionStartTime, setFtSessionStartTime,
    ftSessionStartDate, setFtSessionStartDate,
    ftSessionSource, setFtSessionSource,
  } = useAppContext();

  const [workTime] = useLocalStorage('pomodoro:workTime', DEFAULT_WORK_TIME);
  const [breakTime] = useLocalStorage('pomodoro:breakTime', DEFAULT_BREAK_TIME);
  const [sessionTime, setSessionTime] = useLocalStorage('pomodoro:sessionTime', DEFAULT_WORK_TIME);
  const [isRunning, setIsRunning] = useLocalStorage('pomodoro:isRunning', false);
  const [isWorkSession, setIsWorkSession] = useLocalStorage('pomodoro:isWorkSession', true);
  const [sessionsCompleted, setSessionsCompleted] = useLocalStorage('pomodoro:sessionsCompleted', 0);
  const [selectedSubjectId, setSelectedSubjectId] = useLocalStorage('pomodoro:selectedSubjectId', '');
  const [activeStudySession, setActiveStudySession] = useLocalStorage('pomodoro:activeStudySession', null);
  const [sessionStartTime, setSessionStartTime] = useLocalStorage('pomodoro:sessionStartTime', null);
  const [pausedElapsed, setPausedElapsed] = useLocalStorage('pomodoro:pausedElapsed', 0);
  const [subjectError, setSubjectError] = useState('');
  const [sessionFlash, setSessionFlash] = useState(false);

  const [elapsed, setElapsed] = useState(() => {
    try {
      const running = JSON.parse(localStorage.getItem('pomodoro:isRunning'));
      const start = JSON.parse(localStorage.getItem('pomodoro:sessionStartTime'));
      const paused = JSON.parse(localStorage.getItem('pomodoro:pausedElapsed') || '0');
      if (running && start) return Math.floor((Date.now() - start) / 1000);
      if (!running && paused) return paused;
    } catch {}
    return 0;
  });

  const sessionStartTimeRef = useRef(null);
  const timerIntervalRef = useRef(null);

  useEffect(() => {
    if (isRunning && sessionStartTime) {
      sessionStartTimeRef.current = sessionStartTime;
    }
  }, []);

  const getTodayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  const startFocusTrackerSession = (startTimeMs) => {
    if (!selectedSubjectId) return;
    if (ftActiveSubjectId && ftActiveSubjectId !== selectedSubjectId && ftSessionStartTime && ftSessionSource === 'manual') {
      const dur = Math.floor((Date.now() - ftSessionStartTime) / 1000);
      if (dur > 0) {
        setStudySessions((prev) => [...prev, {
          id: createId(), subjectId: ftActiveSubjectId,
          startTime: ftSessionStartTime, endTime: Date.now(),
          duration: dur, type: 'manual', completed: true,
        }]);
      }
    }
    setFtActiveSubjectId(selectedSubjectId);
    setFtSessionStartTime(startTimeMs);
    setFtSessionStartDate(getTodayKey());
    setFtSessionSource('pomodoro');
  };

  const stopFocusTrackerSession = () => {
    if (!ftActiveSubjectId || !ftSessionStartTime || ftSessionSource !== 'pomodoro') return;
    const dur = Math.floor((Date.now() - ftSessionStartTime) / 1000);
    if (dur > 0) {
      setStudySessions((prev) => [...prev, {
        id: createId(), subjectId: ftActiveSubjectId,
        startTime: ftSessionStartTime, endTime: Date.now(),
        duration: dur, type: 'manual', completed: true,
      }]);
    }
    setFtActiveSubjectId(null);
    setFtSessionStartTime(null);
    setFtSessionStartDate(null);
    setFtSessionSource(null);
  };

  const createStudySession = () => {
    if (!selectedSubjectId || activeStudySession) return false;
    const startTime = Date.now();
    const session = { id: createId(), subjectId: selectedSubjectId, startTime, endTime: null, duration: 0, type: 'pomodoro', completed: false };
    setActiveStudySession(session);
    setStudySessions((prev) => prev.some((e) => e.id === session.id) ? prev : [...prev, session]);
    return true;
  };

  const finalizeStudySession = (completed) => {
    if (!activeStudySession) return;
    const endTime = Date.now();
    const duration = Math.max(0, Math.floor((endTime - activeStudySession.startTime) / 1000));
    setStudySessions((prev) => prev.map((e) => e.id !== activeStudySession.id ? e : { ...e, endTime, duration, completed }));
    setActiveStudySession(null);
  };

  useEffect(() => {
    if (!isRunning) {
      if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; }
      return;
    }
    timerIntervalRef.current = setInterval(() => {
      const currentElapsed = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
      setElapsed(currentElapsed);
      const remaining = sessionTime - currentElapsed;
      if (remaining <= 0) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
        setSessionFlash(true);
        setTimeout(() => setSessionFlash(false), 600);
        if (isWorkSession) {
          finalizeStudySession(true);
          setSessionsCompleted((prev) => prev + 1);
          setIsWorkSession(false);
          setSessionTime(breakTime);
        } else {
          setIsWorkSession(true);
          setSessionTime(workTime);
        }
        const newStart = Date.now();
        sessionStartTimeRef.current = newStart;
        setSessionStartTime(newStart);
        setElapsed(0);
        if (isRunning && !isWorkSession) createStudySession();
      }
    }, 100);
    return () => { if (timerIntervalRef.current) { clearInterval(timerIntervalRef.current); timerIntervalRef.current = null; } };
  }, [isRunning, isWorkSession, sessionTime, breakTime, workTime]);

  const handlePlayPause = () => {
    if (!isRunning) {
      if (pausedElapsed > 0) {
        const resumeStart = Date.now() - pausedElapsed * 1000;
        sessionStartTimeRef.current = resumeStart;
        setSessionStartTime(resumeStart);
        setPausedElapsed(0);
      } else {
        const now = Date.now();
        sessionStartTimeRef.current = now;
        setSessionStartTime(now);
        setElapsed(0);
      }
      if (isWorkSession) { createStudySession(); startFocusTrackerSession(Date.now()); }
    } else {
      const currentElapsed = sessionStartTimeRef.current ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000) : elapsed;
      setPausedElapsed(currentElapsed);
      finalizeStudySession(false);
      if (isWorkSession) { stopFocusTrackerSession(); }
    }
    setIsRunning(!isRunning);
    if (subjectError) setSubjectError('');
  };

  const handleReset = () => {
    finalizeStudySession(false);
    if (isWorkSession) { stopFocusTrackerSession(); }
    setIsRunning(false);
    setIsWorkSession(true);
    setSessionTime(workTime);
    sessionStartTimeRef.current = null;
    setSessionStartTime(null);
    setPausedElapsed(0);
    setElapsed(0);
  };

  const remaining = Math.max(0, sessionTime - elapsed);
  const pomMinutes = Math.floor(remaining / 60);
  const pomSeconds = remaining % 60;
  const progress = ((sessionTime - remaining) / sessionTime) * 100;
  const selectedSubject = focusSubjects.find((s) => s.id === selectedSubjectId);

  const hours24 = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();
  const formattedTime =
    clockFormat === 24
      ? `${String(hours24).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      : `${String(((hours24 + 11) % 12) + 1).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')} ${hours24 >= 12 ? 'PM' : 'AM'}`;

  const isWarmSeason = mode === 'summer';
  const handleModeCycle = () => { const modes = ['summer', 'autumn', 'winter']; setMode(modes[(modes.indexOf(mode) + 1) % modes.length]); };

  const handleClockClick = () => {
    if (!hasSeenClockTutorial) {
      setHasSeenClockTutorial(true);
    }
    setShowClockSettings(!showClockSettings);
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
      <div className="peaceful-display-particles">
        {particles.map((particle) => (
          <span 
            key={particle.id} 
            className={`particle particle-${particle.type}`}
            style={{ 
              left: `${particle.left}%`
            }}
          />
        ))}
      </div>
    </div>
    
    {/* Clock */}
    {showClockSettings && (
      <div className="peaceful-clock-backdrop" onClick={() => setShowClockSettings(false)} />
    )}
    <div className="peaceful-display-clock-wrap">
      {!hasSeenClockTutorial && (
        <div className="clock-tutorial">
          <div className="clock-tutorial-arrow" />
          <div className="clock-tutorial-text">Try pressing the clock...</div>
        </div>
      )}
      <button
        type="button"
        className={`peaceful-display-clock clock-font-${clockFont} clock-color-${clockColor}`}
        onClick={handleClockClick}
        aria-expanded={showClockSettings}
      >
        {formattedTime}
      </button>

      {showClockSettings && (
        <div className="peaceful-display-settings" role="dialog" aria-label="Clock Settings" onClick={(e) => e.stopPropagation()}>
          <div className="setting-row">
            <span className="settings-label">Font:</span>
            <div className="settings-options">
              <button type="button" onClick={() => setClockFont('serif')} className={clockFont === 'serif' ? 'is-active' : ''}>Serif</button>
              <button type="button" onClick={() => setClockFont('sans')} className={clockFont === 'sans' ? 'is-active' : ''}>Sans</button>
              <button type="button" onClick={() => setClockFont('mono')} className={clockFont === 'mono' ? 'is-active' : ''}>Mono</button>
            </div>
          </div>
          <div className="setting-row">
            <span className="settings-label">Color:</span>
            <div className="settings-options">
              <button type="button" onClick={() => setClockColor('black')} className={clockColor === 'black' ? 'is-active' : ''}>Black</button>
              <button type="button" onClick={() => setClockColor('grey')} className={clockColor === 'grey' ? 'is-active' : ''}>Grey</button>
              <button type="button" onClick={() => setClockColor('white')} className={clockColor === 'white' ? 'is-active' : ''}>White</button>
              <button type="button" onClick={() => setClockColor('blue')} className={clockColor === 'blue' ? 'is-active' : ''}>Blue</button>
              <button type="button" onClick={() => setClockColor('orange')} className={clockColor === 'orange' ? 'is-active' : ''}>Orange</button>
              <button type="button" onClick={() => setClockColor('green')} className={clockColor === 'green' ? 'is-active' : ''}>Green</button>
            </div>
          </div>
          <div className="setting-row">
            <span className="settings-label">Format:</span>
            <div className="settings-options">
              <button type="button" onClick={() => setClockFormat(12)} className={clockFormat === 12 ? 'is-active' : ''}>12h</button>
              <button type="button" onClick={() => setClockFormat(24)} className={clockFormat === 24 ? 'is-active' : ''}>24h</button>
            </div>
          </div>
          <div className="setting-row">
            <span className="settings-label">Mode:</span>
            <div className="settings-options">
              <button type="button" onClick={handleModeCycle}>Change Season</button>
            </div>
          </div>
        </div>
      )}
    </div>

    {/* Pomodoro widget */}
    <div className="pd-pom-wrap">
      <div className={`pd-pom${sessionFlash ? ' pd-pom--flash' : ''}`}>
        {/* Session label + subject */}
        <div className="pd-pom-meta">
          <span className={`pd-pom-badge ${isWorkSession ? 'pd-pom-badge--work' : 'pd-pom-badge--break'}`}>
            {isWorkSession ? 'Focus' : 'Break'}
          </span>
          {selectedSubject && (
            <span className="pd-pom-subject" style={{ color: selectedSubject.color }}>
              {selectedSubject.name}
            </span>
          )}
        </div>

        {/* Timer */}
        <div className={`pd-pom-timer clock-font-${clockFont} clock-color-${clockColor}`}>
          {String(pomMinutes).padStart(2, '0')}:{String(pomSeconds).padStart(2, '0')}
        </div>

        {/* Progress bar */}
        <div className="pd-pom-bar">
          <div className="pd-pom-bar-fill" style={{ width: `${progress}%` }} />
        </div>

        {/* Subject selector — always rendered to keep fixed height */}
        <select
          className="pd-pom-select"
          value={selectedSubjectId}
          onChange={(e) => { setSelectedSubjectId(e.target.value); setSubjectError(''); }}
          disabled={isRunning}
          style={{
            visibility: (!isRunning && focusSubjects.length > 0 && isWorkSession) ? 'visible' : 'hidden',
            pointerEvents: (!isRunning && focusSubjects.length > 0 && isWorkSession) ? 'auto' : 'none',
          }}
        >
          <option value="">Select subject…</option>
          {focusSubjects.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {subjectError && <div className="pd-pom-error">{subjectError}</div>}

        {/* Controls */}
        <div className="pd-pom-controls">
          <button
            className={`pd-pom-btn pd-pom-btn--play${isRunning ? ' is-running' : ''}`}
            onClick={handlePlayPause}
            aria-label={isRunning ? 'Pause' : 'Start'}
          >
            {isRunning ? (
              /* pause icon */
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="2" y="2" width="4" height="10" rx="1.5" fill="currentColor"/><rect x="8" y="2" width="4" height="10" rx="1.5" fill="currentColor"/></svg>
            ) : (
              /* play icon */
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 2.5L12 7L3 11.5V2.5Z" fill="currentColor"/></svg>
            )}
            {isRunning ? 'Pause' : 'Start'}
          </button>
          <button className="pd-pom-btn pd-pom-btn--reset" onClick={handleReset} aria-label="Reset">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M2 6.5A4.5 4.5 0 1 1 6.5 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/><path d="M2 3.5V6.5H5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>

        {sessionsCompleted > 0 && (
          <div className="pd-pom-sessions">
            {Array.from({ length: sessionsCompleted }).map((_, i) => (
              <span key={i} className="pd-pom-dot" />
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  );
}
