import { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext } from '../core/AppContext';
import { useTime } from '../core/TimeProvider';
import './FocusTracker.css';

const COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
];

function createId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getTodayKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${string(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getDateRangeForPeriod(period) {
    const now = new Date();
    const todayStr = getTodayKey();

    if (period === 'daily') retyrn [todayStr, todayStr];

    if (period === 'weekly') {
        const getOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset);
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        const startStr = `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
        const endStr = `${sunday.getFullYear()}-${String(sunday.getMonth() + 1).padStart(2, '0')}-${String(sunday.getDate()).padStart(2, '0')}`;
        return [startStr, endStr];
  }

    if (period === 'monthly') {
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const startStr = `${firstDay.getFullYear()}-${String(firstDay.getMonth() + 1).padStart(2, '0')}-${String(firstDay.getDate()).padStart(2, '0')}`;
        const endStr = `${lastDay.getFullYear()}-${String(lastDay.getMonth() + 1).padStart(2, '0')}-${String(lastDay.getDate()).padStart(2, '0')}`;
        return [startStr, endStr];
    }

    if (period === 'yearly') {
        const startStr = `${now.getFullYear()}-01-01`;
        const endStr = `${now.getFullYear()}-12-31`;
        return [startStr, endStr];
    }

    return [todayStr, todayStr];
}

export default function FocusTracker() {
    const { focusSubjects, setFocusSubjects, focusLogs, setFocusLogs } = useAppContext();
    const { hours, minutes, seconds } = useTime();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [newSubjectName, setNewSubjectName] = useState('');
    const [newSubjectColor, setNewSubjectColor] = useState(COLORS[0]);

    const [activeSubjectId, setActiveSubjectId] = useState(null);
    const [sessionStartTime, setSessionStartTime] = useState(null);
    const [sessionStartDate, setSessionStartDate] = useState(null);
    const [todayElapsed, setTodayElapsed] = useState({});

    const [statPeriod, setStatPeriod] = useState('daily');
    const [showStats, setShowStats] = useState(false);

    const timerIntervalRef = useRef(null);

    const currentDateKey = useMemo(() => getTodayKey(), [hours, minutes, seconds]);

    useEffect(() => {
        if (sessionStartDate && sessionStartDate !== currentDateKey) {
            saveCurrentSession();
            setSessionStartTime(Date.now());
            setSessionStartDate(currentDateKey);
        }
    }, [currentDateKey]);

    useEffect(() => {
        if (activeSubjectId) {
            timerIntervalRef.current = setInterval(() => {
                const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
                setTodayElapsed((prev) => ({
                    ...prev,
                    [activeSubjectId]: elapsed,
                }));
            }, 1000);
        } else {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
                timerIntervalRef.current = null;
            }
        }

        return () => {
            if (timerIntervalRef.current) {
                clearInterval(timerIntervalRef.current);
            }
        };
    }, [activeSubjectId, sessionStartTime]);

    useEffect(() => {
        return () => {
            if (activeSubjectId) {
                saveCurrentSession();
            }
        };
    }, []);

    function saveCurrentSession() {
        if (!activeSubjectId || !sessionStartTime || !sessionStartDate) return;

        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
        if(elapsed <= 0) return;

        const Log = {
            id: createId(),
            subjectId: activeSubjectId,
            date: sessionStartDate,
            duration: elapsed,
            timestamp: Date.now(),
        }

        setFocusLogs((prev) => [...prev, log]);
    }

    function handlePlayPause(subjectId) {
        if (activeSubjectId === subjectId) {
            saveCurrentSession();
            setActiveSubjectId(null);
            setSessionStartTime(null);
            setSessionStartDate(null);
            setTodayElapsed((prev) => ({ ...prev, [subjectId]: 0 }));
        } else {
            if (activeSubjectId) {
                saveCurrentSession();
                setTodayElapsed((prev) => ({ ...prev, [activeSubjectId]: 0 }));
            }
            setActiveSubjectId(subjectId);
            setSessionStartTime(Date.now());
            setSessionStartDate(currentDateKey);
            setTodayElapsed((prev) => ({ ...prev, [subjectId]: 0 }));
        }
    }
    
    function handleCreateSubject() {
        if (!newSubjectName.trim()) return;

        const newSubject = {
            id: createId(),
            name: newSubjectName.trim(),
            color: newSubjectColor,
            createdAt: Date.now(),
        };

        setFocusSubjects((prev) => [...prev, subject]);
        setNewSubjectName('');
        setNewSubjectColor(COLORS[0]);
        setShowCreateModal(false);
    }

    function handleDeleteSubject(subjectId) {
        const hasLogs = focusLogs.some(log => log.subjectId === subjectId);

        if (hasLogs) {
            const confirmDelete = window.confirm(
                'This subject has historical data. This subject has historical data. Are you sure you want to delete it? All associated logs will remain but will reference a deleted subject.'
            );
            if (!confirmDelete) return;
        }

        if (activeSubjectId === subjectId) {
            saveCurrentSession();
            setActiveSubjectId(null);
            setSessionStartTime(null);
            setSessionStartDate(null);
        }

        setFocusSubjects((prev) => prev.filter(sub => sub.id !== subjectId));
    }

    const statsData = useMemo(() => {
        const [startDate, endDate] = getDateRangeForPeriod(statPeriod);

        const relevantLogs = focusLogs.filter((los) => {
            return log.date >= startDate && log.date <= endDate;
        });

        const subjectTotals = {};
        relevantLogs.forEach((log) => {
            if (!subjectTotals[log.subjectId]) {
                subjectTotals[log.subjectId] = 0;
            }
            subjectTotals[log.subjectId] += log.duration;
        });

        const entries = Object.entries(subjectTotals).map(([subjectId, totalDuration]) => {
            const subject = focusSubjects.find((s) => s.id === subjectId);
            return {
                subjectId,
                name: subject ? subject.name : 'Deleted Subject',
                color: subject ? subject.color : '#888888',
                duration,
            };
        });

        entries.sort((a, b) => b.duration - a.duration);

        const total = entries.reduce((sum, e) => sum + e.duration, 0);

        return { entries, total };
    }, [focusLogs, focusSubjects, statPeriod]);

    function renderPieChart() {
        const { entries, total } = statsData;

        if (total === 0) return null;

        let currentAngle = -90;
        const paths = [];

        entries.forEach((entry, idx) => {
            const percent = entry.duration / total;
            const angle = percent * 360;
            const endAngle = currentAngle + angle;

            const startRad = (currentAngle * Math.PI) / 180;
            const endRad = (endAngle * Math.PI) / 180;

            const x1 = 50 + 45 * Math.cos(startRad);
            const y1 = 50 + 45 * Math.sin(startRad);
            const x2 = 50 + 45 * Math.cos(endRad);
            const y2 = 50 + 45 * Math.sin(endRad);

            const largeArc = angle > 180 ? 1 : 0;

            const pathData = [
                `M 50 50`,
                `L ${x1} ${y1}`,
                `A 45 45 0 ${largeArc} 1 ${x2} ${y2}`,
                `Z`,
            ].join(' ');

            paths.push(
                <path key={idx} d={pathData} fill={entry.color} />
            );

            currentAngle = endAngle;
        });

        return (
            <svg className="focus-tracker-pie" viewBox="0 0 100 100">
                {paths}
            </svg>
        );
    }

  return (
    <div className="focus-tracker-root">
      <div className="focus-tracker-header">
        <h1 className="focus-tracker-title">Focus Tracker</h1>
        <div className="focus-tracker-actions">
          <button
            className="focus-tracker-btn focus-tracker-btn--secondary"
            onClick={() => setShowStats(!showStats)}
          >
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </button>
          <button
            className="focus-tracker-btn focus-tracker-btn--primary"
            onClick={() => setShowCreateModal(true)}
          >
            + New Subject
          </button>
        </div>
      </div>
      
      {showStats && (
        <div className="focus-tracker-stats">
          <div className="focus-tracker-stats-header">
            <h2 className="focus-tracker-stats-title">Statistics</h2>
            <div className="focus-tracker-period-toggle">
              {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
                <button
                  key={p}
                  className={`focus-tracker-period-btn ${statPeriod === p ? 'is-active' : ''}`}
                  onClick={() => setStatPeriod(p)}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          {statsData.total === 0 ? (
            <div className="focus-tracker-stats-empty">
              No data for this period.
            </div>
          ) : (
            <div className="focus-tracker-stats-content">
              {renderPieChart()}
              <div className="focus-tracker-legend">
                {statsData.entries.map((entry) => (
                  <div key={entry.subjectId} className="focus-tracker-legend-item">
                    <div
                      className="focus-tracker-legend-color"
                      style={{ backgroundColor: entry.color }}
                    />
                    <div className="focus-tracker-legend-info">
                      <div className="focus-tracker-legend-name">{entry.name}</div>
                      <div className="focus-tracker-legend-time">{formatTime(entry.duration)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      <div className="focus-tracker-subjects">
        {focusSubjects.length === 0 ? (
          <div className="focus-tracker-empty">
            No subjects yet. Create one to start tracking!
          </div>
        ) : (
          focusSubjects.map((subject) => {
            const isActive = activeSubjectId === subject.id;
            const elapsed = isActive ? todayElapsed[subject.id] || 0 : 0;
            
            return (
              <div key={subject.id} className="focus-tracker-subject">
                <button
                  className="focus-tracker-play-btn"
                  style={{
                    borderColor: subject.color,
                    color: subject.color,
                  }}
                  onClick={() => handlePlayPause(subject.id)}
                >
                  {isActive ? '⏸' : '▶'}
                </button>
                <div className="focus-tracker-subject-info">
                  <div className="focus-tracker-subject-name">{subject.name}</div>
                  <div className="focus-tracker-subject-time">{formatTime(elapsed)}</div>
                </div>
                <button
                  className="focus-tracker-delete-btn"
                  onClick={() => handleDeleteSubject(subject.id)}
                >
                  ×
                </button>
              </div>
            );
          })
        )}
      </div>
      
      {showCreateModal && (
        <div className="focus-tracker-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="focus-tracker-modal" onClick={(e) => e.stopPropagation()}>
            <div className="focus-tracker-modal-header">
              <h3 className="focus-tracker-modal-title">New Subject</h3>
              <button
                className="focus-tracker-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="focus-tracker-modal-body">
              <div className="focus-tracker-field">
                <label className="focus-tracker-label">Subject Name</label>
                <input
                  type="text"
                  className="focus-tracker-input"
                  value={newSubjectName}
                  onChange={(e) => setNewSubjectName(e.target.value)}
                  placeholder="e.g., Math, Reading, Coding"
                  autoFocus
                />
              </div>
              
              <div className="focus-tracker-field">
                <label className="focus-tracker-label">Color</label>
                <div className="focus-tracker-color-grid">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      className={`focus-tracker-color-swatch ${newSubjectColor === color ? 'is-selected' : ''}`}
                      style={{ backgroundColor: color }}
                      onClick={() => setNewSubjectColor(color)}
                    />
                  ))}
                </div>
              </div>
            </div>
            
            <div className="focus-tracker-modal-footer">
              <button
                className="focus-tracker-btn focus-tracker-btn--secondary"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>
              <button
                className="focus-tracker-btn focus-tracker-btn--primary"
                onClick={handleCreateSubject}
                disabled={!newSubjectName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}