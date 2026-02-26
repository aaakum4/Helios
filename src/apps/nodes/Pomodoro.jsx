import { useRef, useEffect, useState } from "react";
import { useLocalStorage } from "../../core/useLocalStorage";
import { useAppContext } from "../../core/AppContext";
import './Pomodoro.css'

const DEFAULT_WORK_TIME = 25 * 60;
const DEFAULT_BREAK_TIME = 5 * 60;
const SUBJECT_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
];

function createId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default function Pomodoro() {
    const { focusSubjects, setFocusSubjects, setStudySessions } = useAppContext();
    const [workTime, setWorkTime] = useLocalStorage('pomodoro:workTime', DEFAULT_WORK_TIME);
    const [breakTime, setBreakTime] = useLocalStorage('pomodoro:breakTime', DEFAULT_BREAK_TIME);
    const [sessionTime, setSessionTime] = useLocalStorage('pomodoro:sessionTime', workTime);
    const [isRunning, setIsRunning] = useLocalStorage('pomodoro:isRunning', false);
    const [isWorkSession, setIsWorkSession] = useLocalStorage('pomodoro:isWorkSession', true);
    const [sessionsCompleted, setSessionsCompleted] = useLocalStorage('pomodoro:sessionsCompleted', 0);
    const [selectedSubjectId, setSelectedSubjectId] = useLocalStorage('pomodoro:selectedSubjectId', '');
    const [activeStudySession, setActiveStudySession] = useLocalStorage('pomodoro:activeStudySession', null);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [subjectError, setSubjectError] = useState('');
    const [elapsed, setElapsed] = useState(0);
    const sessionStartTimeRef = useRef(null);
    const timerIntervalRef = useRef(null);

    const createStudySession = () => {
        if (!selectedSubjectId || activeStudySession) return false;
        const startTime = Date.now();
        const session = {
            id: createId(),
            subjectId: selectedSubjectId,
            startTime,
            endTime: null,
            duration: 0,
            type: 'pomodoro',
            completed: false,
        };

        setActiveStudySession(session);
        setStudySessions((prev) => {
            if (prev.some((entry) => entry.id === session.id)) {
                return prev;
            }
            return [...prev, session];
        });
        return true;
    };

    const finalizeStudySession = (completed) => {
        if (!activeStudySession) return;
        const endTime = Date.now();
        const duration = Math.max(
            0,
            Math.floor((endTime - activeStudySession.startTime) / 1000)
        );

        setStudySessions((prev) => prev.map((entry) => {
            if (entry.id !== activeStudySession.id) return entry;
            return {
                ...entry,
                endTime,
                duration,
                completed,
            };
        }));
        setActiveStudySession(null);
    };

    const handleAddSubject = () => {
        const trimmed = newSubjectName.trim();
        if (!trimmed) return;
        const newSubject = {
            id: createId(),
            name: trimmed,
            color: SUBJECT_COLORS[focusSubjects.length % SUBJECT_COLORS.length],
            createdAt: Date.now(),
        };
        setFocusSubjects((prev) => {
            const exists = prev.some((subject) => subject.name.toLowerCase() === trimmed.toLowerCase());
            if (exists) return prev;
            return [...prev, newSubject];
        });
        setSelectedSubjectId(newSubject.id);
        setNewSubjectName('');
        setSubjectError('');
    };

    useEffect(() => {
        if (!isRunning) {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
            return;
        }

        if (sessionStartTimeRef.current === null) {
            sessionStartTimeRef.current = Date.now();
            setElapsed(0);
        }

        timerIntervalRef.current = setInterval(() => {
            const currentElapsed = Math.floor((Date.now() - sessionStartTimeRef.current) / 1000);
            setElapsed(currentElapsed);

            const remaining = sessionTime - currentElapsed;

            if (remaining <= 0) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
                
                if (isWorkSession) {
                    finalizeStudySession(true);
                    setSessionsCompleted((prev) => prev + 1);
                    setIsWorkSession(false);
                    setSessionTime(breakTime);
                } else {
                    setIsWorkSession(true);
                    setSessionTime(workTime);
                }
                sessionStartTimeRef.current = Date.now();
                setElapsed(0);
                if (isRunning && !isWorkSession) {
                    createStudySession();
                }
            }
        }, 100);

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        };
    }, [isRunning, isWorkSession, sessionTime, breakTime, workTime]);

const handlePlayPause = () => {
    if (!isRunning) {
        if (isWorkSession && !selectedSubjectId) {
            setSubjectError('Select a subject to start a focus session.');
            return;
        }
        sessionStartTimeRef.current = Date.now();
        setElapsed(0);
        if (isWorkSession) {
            createStudySession();
        }
    } else if (isWorkSession) {
        finalizeStudySession(false);
    }
    setIsRunning(!isRunning);
    if (subjectError) setSubjectError('');
};
const handleReset = () => {
    if (isWorkSession) {
        finalizeStudySession(false);
    }
    setIsRunning(false);
    setIsWorkSession(true);
    setSessionTime(workTime);
    sessionStartTimeRef.current = null;
    setElapsed(0);
};

const remaining = Math.max(0, sessionTime - elapsed);
const minutes = Math.floor(remaining / 60);
const seconds = remaining % 60;
const progress = ((sessionTime - remaining) / sessionTime) * 100;

return (
    <div className="pomodoro-container">
        <div className="pomodoro-layout">
            <div className="pomodoro-main">
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
                    <button
                        className="pomodoro-button"
                        onClick={handlePlayPause}
                        disabled={isWorkSession && !selectedSubjectId}
                    >
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

            <div className="pomodoro-side">
                <div className="pomodoro-subject-panel">
            <div className="pomodoro-subject-header">
                <span>Subject</span>
                <span className="pomodoro-subject-status">
                    {isWorkSession ? 'Focus' : 'Break'}
                </span>
            </div>

            <select
                className="pomodoro-subject-select"
                value={selectedSubjectId}
                onChange={(e) => {
                    setSelectedSubjectId(e.target.value);
                    setSubjectError('');
                }}
                disabled={isRunning}
            >
                <option value="">Select a subject...</option>
                {focusSubjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                        {subject.name}
                    </option>
                ))}
            </select>

            {selectedSubjectId && (
                <div className="pomodoro-active-subject">
                    Current: {focusSubjects.find((s) => s.id === selectedSubjectId)?.name || 'Subject'}
                </div>
            )}

            {subjectError && (
                <div className="pomodoro-subject-error">{subjectError}</div>
            )}

            <div className="pomodoro-subject-add">
                <input
                    type="text"
                    className="pomodoro-subject-input"
                    placeholder="Add new subject"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    disabled={isRunning}
                />
                <button
                    className="pomodoro-subject-add-btn"
                    onClick={handleAddSubject}
                    disabled={isRunning || !newSubjectName.trim()}
                    type="button"
                >
                    Add
                </button>
            </div>
                </div>
            </div>
        </div>
    </div>
);
}