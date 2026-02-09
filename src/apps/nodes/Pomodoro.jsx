import { useRef, useEffect } from "react";
import { useTime } from "../../core/TimeProvider";
import { useLocalStorage } from "../../core/useLocalStorage";
import './Pomodoro.css'

const DEFAULT_WORK_TIME = 25 * 60;
const DEFAULT_BREAK_TIME = 5 * 60;

export default function Pomodoro() {
    const { time } = useTime();
    const [workTime, setWorkTime] = useLocalStorage('pomodoro:workTime', DEFAULT_WORK_TIME);
    const [breakTime, setBreakTime] = useLocalStorage('pomodoro:breakTime', DEFAULT_BREAK_TIME);
    const [sessionTime, setSessionTime] = useLocalStorage('pomodoro:sessionTime', workTime);
    const [isRunning, setIsRunning] = useLocalStorage('pomodoro:isRunning', false);
    const [isWorkSession, setIsWorkSession] = useLocalStorage('pomodoro:isWorkSession', true);
    const [sessionsCompleted, setSessionsCompleted] = useLocalStorage('pomodoro:sessionsCompleted', 0);
    const sessionStartTimeRef = useRef(null);
    const elapsedRef = useRef(0);

    useEffect(() => {
        if (!isRunning) return;
    
        if (sessionStartTimeRef.current === null) {
            sessionStartTimeRef.current = time;
            elapsedRef.current = 0;
        }
    
        const elapsed = Math.floor((time - sessionStartTimeRef.current) / 1000);
        elapsedRef.current = elapsed;

        const remaining = sessionTime - elapsed;

        if (remaining <= 0) {
            if (isWorkSession) {
            setSessionsCompleted(sessionsCompleted + 1);
            setIsWorkSession(false);
            setSessionTime(breakTime);
            } else {
            setIsWorkSession(true);
            setSessionTime(workTime);
            }
            sessionStartTimeRef.current = time;
            elapsedRef.current = 0;
        }
}, [time, isRunning, isWorkSession, sessionTime, breakTime, workTime, sessionsCompleted, sessionsCompleted]);

const handlePlayPause = () => {
    if (!isRunning) {
        sessionStartTimeRef.current = time;
    }
    setIsRunning(!isRunning);
};
const handleReset = () => {
    setIsRunning(false);
    setIsWorkSession(true);
    setSessionTime(workTime);
    sessionStartTimeRef.current = null;
    elapsedRef.current = 0;
};

const remaining = Math.max(0, sessionTime - elapsedRef.current);
const minutes = Math.floor(remaining / 60);
const seconds = remaining % 60;
const progress = ((sessionTime - remaining) / sessionTime) * 100;

return (
    <div className="pomodoro-container">
        <div className="pomodoro-display">
            <div className="pomodoro-timer">
                {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </div>
            <div className="pomodoro-session-type">
                {isWorkSession ? 'Focus Time' : 'Break Time'}
            </div>
            <div className="pomodoro-progress-bar">
                <div
                className="pomodoro-progress-fill"
                style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>

        <div className="pomodoro-controls">
            <button className="pomodoro-button" onClick={handlePlayPause}>
                {isRunning ? 'Pause' : 'Start'}
            </button>
            <button className="pomodoro-button" onClick={handleReset}>
                Reset
            </button>
        </div>

        <div className="pomodoro-stats">
            <div className="pomodoro-stat">
                <label>Sessions:</label>
                <span>{sessionsCompleted}</span>
            </div>
        </div>

        <div className="pomodoro-settings">
            <div className="pomodoro-setting-group">
                <label htmlFor="work-time">Work Time (min):</label>
                <input
                    id="work-time"
                    type="number"
                    min="1"
                    max="60"
                    value={Math.floor(workTime / 60)}
                    onChange={(e) => {
                        const mins = parseInt(e.target.value, 10) || 25;
                        setWorkTime(mins * 60);
                        if (isWorkSession && !isRunning) setSessionTime(mins * 60);
                    }}
                    disabled={isRunning}
                />
            </div>
            <div className="pomodoro-setting-group">
                <label htmlFor="break-time">Break Time (min):</label>
                <input
                    id="break-time"
                    type="number"
                    min="1"
                    max="30"
                    value={Math.floor(breakTime / 60)}
                    onChange={(e) => {
                        const mins = parseInt(e.target.value, 10) || 5;
                        setBreakTime(mins * 60);
                        if (!isWorkSession && !isRunning) setSessionTime(mins * 60);
                    }}
                    disabled={isRunning}
                />
            </div>
        </div>
    </div>
);
}