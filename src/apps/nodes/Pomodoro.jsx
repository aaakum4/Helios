import { useRef, useEffect, useState } from "react";
import { useLocalStorage } from "../../core/useLocalStorage";
import { useAppContext } from "../../core/AppContext";
import { createId } from "../../core/idGenerator";
import './Pomodoro.css'

const DEFAULT_WORK_TIME = 25 * 60;
const DEFAULT_BREAK_TIME = 5 * 60;
const SUBJECT_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
];

export default function Pomodoro() {
    const {
        focusSubjects, setFocusSubjects, setStudySessions,
        ftActiveSubjectId, setFtActiveSubjectId,
        ftSessionStartTime, setFtSessionStartTime,
        ftSessionStartDate, setFtSessionStartDate,
        ftSessionSource, setFtSessionSource,
    } = useAppContext();
    const [workTime, setWorkTime] = useLocalStorage('pomodoro:workTime', DEFAULT_WORK_TIME);
    const [breakTime, setBreakTime] = useLocalStorage('pomodoro:breakTime', DEFAULT_BREAK_TIME);
    const [sessionTime, setSessionTime] = useLocalStorage('pomodoro:sessionTime', workTime);
    const [isRunning, setIsRunning] = useLocalStorage('pomodoro:isRunning', false);
    const [isWorkSession, setIsWorkSession] = useLocalStorage('pomodoro:isWorkSession', true);
    const [sessionsCompleted, setSessionsCompleted] = useLocalStorage('pomodoro:sessionsCompleted', 0);
    const [selectedSubjectId, setSelectedSubjectId] = useLocalStorage('pomodoro:selectedSubjectId', '');
    const [activeStudySession, setActiveStudySession] = useLocalStorage('pomodoro:activeStudySession', null);
    const [sessionStartTime, setSessionStartTime] = useLocalStorage('pomodoro:sessionStartTime', null);
    const [pausedElapsed, setPausedElapsed] = useLocalStorage('pomodoro:pausedElapsed', 0);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [subjectError, setSubjectError] = useState('');
    // Initialise elapsed from stored start time (running) or stored paused value (paused).
    const [elapsed, setElapsed] = useState(() => {
        try {
            const running = JSON.parse(localStorage.getItem('pomodoro:isRunning'));
            const startTime = JSON.parse(localStorage.getItem('pomodoro:sessionStartTime'));
            const paused = JSON.parse(localStorage.getItem('pomodoro:pausedElapsed') || '0');
            if (running && startTime) return Math.floor((Date.now() - startTime) / 1000);
            if (!running && paused) return paused;
        } catch {}
        return 0;
    });
    const [sessionFlash, setSessionFlash] = useState(false);
    const sessionStartTimeRef = useRef(null);
    const timerIntervalRef = useRef(null);

    // Restore in-memory ref from persisted start time on mount.
    // When paused, offset by pausedElapsed so the ref is correct if the user resumes.
    useEffect(() => {
        if (isRunning && sessionStartTime) {
            sessionStartTimeRef.current = sessionStartTime;
        } else if (!isRunning && pausedElapsed > 0) {
            // Pre-compute what the ref would be so interval starts correctly on resume
            sessionStartTimeRef.current = null; // will be set in handlePlayPause
        }
    }, []);

    // ── FocusTracker sync helpers ──────────────────────────────────────────────

    const getTodayKey = () => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    };

    const startFocusTrackerSession = (startTimeMs) => {
        if (!selectedSubjectId) return;
        // If a different subject is being tracked manually, save and stop it first.
        if (ftActiveSubjectId && ftActiveSubjectId !== selectedSubjectId && ftSessionStartTime && ftSessionSource === 'manual') {
            const dur = Math.floor((Date.now() - ftSessionStartTime) / 1000);
            if (dur > 0) {
                setStudySessions((prev) => [...prev, {
                    id: createId(),
                    subjectId: ftActiveSubjectId,
                    startTime: ftSessionStartTime,
                    endTime: Date.now(),
                    duration: dur,
                    type: 'manual',
                    completed: true,
                }]);
            }
        }
        setFtActiveSubjectId(selectedSubjectId);
        setFtSessionStartTime(startTimeMs);
        setFtSessionStartDate(getTodayKey());
        setFtSessionSource('pomodoro');
    };

    const stopFocusTrackerSession = () => {
        if (!ftActiveSubjectId || !ftSessionStartTime) return;
        
        // Only create a session if this was started manually (not by Pomodoro)
        // Pomodoro manages its own study sessions via finalizeStudySession
        if (ftSessionSource === 'manual') {
            const dur = Math.floor((Date.now() - ftSessionStartTime) / 1000);
            if (dur > 0) {
                setStudySessions((prev) => [...prev, {
                    id: createId(),
                    subjectId: ftActiveSubjectId,
                    startTime: ftSessionStartTime,
                    endTime: Date.now(),
                    duration: dur,
                    type: 'manual',
                    completed: true,
                }]);
            }
        }
        
        setFtActiveSubjectId(null);
        setFtSessionStartTime(null);
        setFtSessionStartDate(null);
        setFtSessionSource(null);
    };

    const createStudySession = (startTime = null) => {
        if (!selectedSubjectId || activeStudySession) return false;
        const sessionStartTime = startTime || sessionStartTimeRef.current || Date.now();
        const session = {
            id: createId(),
            subjectId: selectedSubjectId,
            startTime: sessionStartTime,
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
        window.posthog?.capture("pomodoro_subject_added", {
            total_subjects: focusSubjects.length + 1,
        });
    };

    useEffect(() => {
        if (!isRunning) {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
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
                    stopFocusTrackerSession();
                    setSessionsCompleted((prev) => prev + 1);
                    setIsWorkSession(false);
                    setSessionTime(breakTime);
                    const subjectName = focusSubjects.find((s) => s.id === selectedSubjectId)?.name;
                    window.posthog?.capture("pomodoro_session_completed", {
                        subject_id: selectedSubjectId || null,
                        subject_name: subjectName || null,
                        work_duration_minutes: Math.floor(workTime / 60),
                        sessions_completed: sessionsCompleted + 1,
                    });
                } else {
                    setIsWorkSession(true);
                    setSessionTime(workTime);
                }
                const newStart = Date.now();
                sessionStartTimeRef.current = newStart;
                setSessionStartTime(newStart);
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
        let sessionStart;
        if (pausedElapsed > 0) {
            // Resuming from pause — offset start time so elapsed continues from where it was
            const resumeStart = Date.now() - pausedElapsed * 1000;
            sessionStartTimeRef.current = resumeStart;
            setSessionStartTime(resumeStart);
            setPausedElapsed(0);
            sessionStart = resumeStart;
            // Update the existing session's start time to account for the pause
            if (activeStudySession) {
                setActiveStudySession({
                    ...activeStudySession,
                    startTime: resumeStart,
                });
                setStudySessions((prev) => prev.map((entry) =>
                    entry.id === activeStudySession.id
                        ? { ...entry, startTime: resumeStart }
                        : entry
                ));
            }
            // elapsed state stays at pausedElapsed; interval will recalculate on next tick
        } else {
            // Fresh start
            const now = Date.now();
            sessionStartTimeRef.current = now;
            setSessionStartTime(now);
            setElapsed(0);
            sessionStart = now;
        }
        if (isWorkSession) {
            // Only create a new session if one doesn't exist (fresh start, not resume)
            if (!activeStudySession) {
                createStudySession(sessionStart);
            }
            startFocusTrackerSession(sessionStart);
        }
        const subjectName = focusSubjects.find((s) => s.id === selectedSubjectId)?.name;
        window.posthog?.capture("pomodoro_session_started", {
            session_type: isWorkSession ? "work" : "break",
            subject_id: selectedSubjectId || null,
            subject_name: subjectName || null,
            work_duration_minutes: Math.floor(workTime / 60),
            break_duration_minutes: Math.floor(breakTime / 60),
            is_resume: pausedElapsed > 0,
        });
    } else {
        // Pausing
        const currentElapsed = sessionStartTimeRef.current
            ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
            : elapsed;
        setPausedElapsed(currentElapsed);
        // Don't finalize the session when pausing - keep it active so we can resume it
        // Only finalize when actually completing or resetting
        stopFocusTrackerSession();
        window.posthog?.capture("pomodoro_session_paused", {
            session_type: isWorkSession ? "work" : "break",
            elapsed_seconds: currentElapsed,
            subject_id: selectedSubjectId || null,
        });
    }
    setIsRunning(!isRunning);
    if (subjectError) setSubjectError('');
};
const handleReset = () => {
    if (isRunning || pausedElapsed > 0) {
        window.posthog?.capture("pomodoro_session_reset", {
            session_type: isWorkSession ? "work" : "break",
            was_running: isRunning,
            elapsed_seconds: sessionStartTimeRef.current
                ? Math.floor((Date.now() - sessionStartTimeRef.current) / 1000)
                : pausedElapsed,
            subject_id: selectedSubjectId || null,
        });
    }
    finalizeStudySession(false);
    stopFocusTrackerSession();
    setIsRunning(false);
    setIsWorkSession(true);
    setSessionTime(workTime);
    sessionStartTimeRef.current = null;
    setSessionStartTime(null);
    setPausedElapsed(0);
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
                    <div className={`pomodoro-timer${sessionFlash ? ' pomodoro-timer--flash' : ''}`}>
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