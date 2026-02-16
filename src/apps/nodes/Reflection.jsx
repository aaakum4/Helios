import { useLocalStorage } from '../../core/useLocalStorage';
import { useEffect, useMemo, useRef, useState } from 'react';
import './Reflection.css';

const QUESTIONS = [
    'How was the weather today?',
    'How was your general mood today?',
    'How did those around you make you feel?',
    'What bought you the most joy today?',
    'What are you grateful for?', 
];

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const getTodayKey = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

const normalizeKey = (key) => String(key).replace(/_/g, '-');

const formatDate = (year, month, day) => {
    const monthName = MONTHS[month - 1];
    return `${day} ${monthName} ${year}`;
};

const parseYYYYMMDD = (key) => {
    const parts = String(key).split(/[-_]/);
    if (parts.length < 3) {
        return null;
    }
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const day = parseInt(parts[2], 10);
    if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) {
        return null;
    }
    return { year, month, day };
};

const normalizeDataMap = (data) => Object.keys(data || {}).reduce((acc, key) => {
    acc[normalizeKey(key)] = data[key];
    return acc;
}, {});

export default function Reflection() {
    const [reflectionsData, setReflectionsData] = useLocalStorage('reflection:responses', {});
    const [journalData, setJournalData] = useLocalStorage('journal:entries', {});
    const [activeTab, setActiveTab] = useState('reflect');

    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState(Array(QUESTIONS.length).fill(''));

    const [journalTitle, setJournalTitle] = useState('');
    const [journalBody, setJournalBody] = useState('');
    const [journalFeedback, setJournalFeedback] = useState('');
    const feedbackTimeoutRef = useRef(null);

    const [currentDayKey, setCurrentDayKey] = useState(getTodayKey());
    const prevDayKeyRef = useRef(null);

    const [archiveYear, setArchiveYear] = useState(new Date().getFullYear());
    const [archiveMonth, setArchiveMonth] = useState(new Date().getMonth() + 1);
    const [archiveDay, setArchiveDay] = useState(new Date().getDate());

    const normalizedReflections = useMemo(() => normalizeDataMap(reflectionsData), [reflectionsData]);
    const normalizedJournals = useMemo(() => normalizeDataMap(journalData), [journalData]);

    const availableYears = useMemo(() => {
        const allKeys = Object.keys(normalizedReflections).concat(Object.keys(normalizedJournals));
        const years = new Set(allKeys.map(k => {
            const p = parseYYYYMMDD(k);
            return p ? p.year : null;
        }).filter(Boolean));
        if (years.size === 0) return [];
        return Array.from(years).sort((a, b) => b - a);
    }, [normalizedReflections, normalizedJournals]);

    const availableMonths = useMemo(() => {
        const allKeys = Object.keys(normalizedReflections).concat(Object.keys(normalizedJournals));
        const months = new Set(allKeys.map(k => parseYYYYMMDD(k)).filter(Boolean)
            .filter(p => p.year === archiveYear)
            .map(p => p.month));
        return Array.from(months).sort((a, b) => a - b);
    }, [normalizedReflections, normalizedJournals, archiveYear]);

    const availableDays = useMemo(() => {
        const allKeys = Object.keys(normalizedReflections).concat(Object.keys(normalizedJournals));
        const days = new Set(allKeys.map(k => parseYYYYMMDD(k)).filter(Boolean)
            .filter(p => p.year === archiveYear && p.month === archiveMonth)
            .map(p => p.day));
        return Array.from(days).sort((a, b) => a - b);
    }, [normalizedReflections, normalizedJournals, archiveYear, archiveMonth]);

    const handleQuestionNext = () => {
        const newAnswers = [...answers];
        newAnswers[currentQuestion] = answers[currentQuestion];
        setAnswers(newAnswers);
        if (currentQuestion < QUESTIONS.length - 1) {
            setCurrentQuestion(currentQuestion + 1);
        }
    };
    
    const handleQuestionBack = () => {
        if (currentQuestion > 0) {
            setCurrentQuestion(currentQuestion - 1);
        }
    };

    useEffect(() => {
        const intervalId = setInterval(() => {
            const nextKey = getTodayKey();
            setCurrentDayKey((prevKey) => (prevKey === nextKey ? prevKey : nextKey));
        }, 60000);

        return () => clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (prevDayKeyRef.current === currentDayKey) {
            return;
        }

        prevDayKeyRef.current = currentDayKey;
        setCurrentQuestion(0);
        setAnswers(Array(QUESTIONS.length).fill(''));

        const existingJournal = normalizedJournals[currentDayKey];
        if (existingJournal) {
            setJournalTitle(existingJournal.title || '');
            setJournalBody(existingJournal.body || '');
        } else {
            setJournalTitle('');
            setJournalBody('');
        }

        setJournalFeedback('');
        if (feedbackTimeoutRef.current) {
            clearTimeout(feedbackTimeoutRef.current);
            feedbackTimeoutRef.current = null;
        }
    }, [currentDayKey, normalizedJournals]);

    const handleQuestionSubmit = () => {
        setReflectionsData(prev => {
            const next = { ...prev };
            delete next[currentDayKey.replace(/-/g, '_')];
            next[currentDayKey] = {
                answers: answers,
                submittedAt: new Date().toISOString(),
            };
            return next;
        });
        setCurrentQuestion(0);
        setAnswers(Array(QUESTIONS.length).fill(''));
    };

    const handleJournalSubmit = () => {
        if (!journalTitle.trim() && !journalBody.trim()) {
            return;
        }

        const savedJournal = normalizedJournals[currentDayKey];
        const isEdited = !!savedJournal && (
            (savedJournal.title || '') !== journalTitle || (savedJournal.body || '') !== journalBody
        );

        setJournalData(prev => {
            const next = { ...prev };
            delete next[currentDayKey.replace(/-/g, '_')];
            next[currentDayKey] = {
                title: journalTitle,
                body: journalBody,
                submittedAt: new Date().toISOString(),
            };
            return next;
        });

        const nextFeedback = isEdited ? 'Edited!' : 'Saved!';
        setJournalFeedback(nextFeedback);
        if (feedbackTimeoutRef.current) {
            clearTimeout(feedbackTimeoutRef.current);
        }
        feedbackTimeoutRef.current = setTimeout(() => {
            setJournalFeedback('');
            feedbackTimeoutRef.current = null;
        }, 1400);
    };

    const archiveKey = `${archiveYear}-${String(archiveMonth).padStart(2, '0')}-${String(archiveDay).padStart(2, '0')}`;
    const archiveReflection = normalizedReflections[archiveKey];
    const archiveJournal = normalizedJournals[archiveKey];
    const hasArchiveData = archiveReflection || archiveJournal;

    const deleteEntryForDate = (setter, key) => {
        setter((prev) => {
            const next = { ...prev };
            delete next[key];
            delete next[key.replace(/-/g, '_')];
            return next;
        });
    };

    const handleDeleteArchiveJournal = () => {
        deleteEntryForDate(setJournalData, archiveKey);
    };

    const handleDeleteArchiveReflection = () => {
        deleteEntryForDate(setReflectionsData, archiveKey);
    };

    const savedReflection = normalizedReflections[currentDayKey];
    const isReflectionCompleted = !!savedReflection;

    const savedJournal = normalizedJournals[currentDayKey];
    const isJournalEdited = !!savedJournal && (
        (savedJournal.title || '') !== journalTitle || (savedJournal.body || '') !== journalBody
    );

    return (
        <div className="reflection-root">
            <div className="reflection-nav">
                <button
                    className={`reflection-nav-btn ${activeTab === 'reflect' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('reflect')}
                    type="button"
                >
                    Reflect
                </button>
                <button
                    className={`reflection-nav-btn ${activeTab === 'journal' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('journal')}
                    type="button"
                >
                    Journal
                </button>
                <button
                    className={`reflection-nav-btn ${activeTab === 'archive' ? 'is-active' : ''}`}
                    onClick={() => setActiveTab('archive')}
                    type="button"
                >
                    Archive
                </button>
            </div>

            <div className="reflection-content">
                {activeTab === 'reflect' && (
                    <div className="reflection-view">
                        <h2 className="reflection-view-title">How are you feeling?</h2>
                        {isReflectionCompleted ? (
                            <div className="reflection-complete">
                                <p className="reflection-complete-title">Completed.</p>
                                <p className="reflection-complete-subtitle">Your reflection is saved for today.</p>
                            </div>
                        ) : (
                            <>
                                <div className="reflection-question-container">
                                    <div className="reflection-question">
                                        <p>{QUESTIONS[currentQuestion]}</p>
                                    </div>
                                    <textarea
                                        className="reflection-answer-input"
                                        value={answers[currentQuestion]}
                                        onChange={(e) => {
                                            const newAnswers = [...answers];
                                            newAnswers[currentQuestion] = e.target.value;
                                            setAnswers(newAnswers);
                                        }}
                                        placeholder="Type your answer here..."
                                        rows={5}
                                    />
                                </div>

                                <div className="reflection-controls">
                                    {currentQuestion > 0 && (
                                        <button className="reflection-btn reflection-btn--secondary" onClick={handleQuestionBack} type="button">
                                            Back
                                        </button>
                                    )}
                                    <div style={{ flex: 1 }} />
                                    {currentQuestion < QUESTIONS.length - 1 ? (
                                        <button className="reflection-btn reflection-btn--primary" onClick={handleQuestionNext} type="button">
                                            Next
                                        </button>
                                    ) : (
                                        <button className="reflection-btn reflection-btn--primary" onClick={handleQuestionSubmit} type="button">
                                            Submit
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {activeTab === 'journal' && (
                    <div className="reflection-view">
                        <h2 className="reflection-view-title">Your Journal</h2>
                        <div className="journal-form">
                            <input
                                type="text"
                                className="journal-title-input"
                                value={journalTitle}
                                onChange={(e) => setJournalTitle(e.target.value)}
                                placeholder="Entry title..."
                            />
                            <textarea
                                className="journal-body-input"
                                value={journalBody}
                                onChange={(e) => setJournalBody(e.target.value)}
                                placeholder="Write your thoughts here..."
                                rows={8}
                            />
                            <div className="journal-footer">
                                <p className="journal-date">Today</p>
                                <button
                                    className={`reflection-btn reflection-btn--primary ${journalFeedback ? 'reflection-btn--success' : ''}`}
                                    onClick={handleJournalSubmit}
                                    type="button"
                                >
                                    {journalFeedback || (isJournalEdited ? 'Edit entry' : 'Save entry')}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'archive' && (
                    <div className="reflection-view">
                        <h2 className="reflection-view-title">Filing Cabinet</h2>
                        <div className="archive-selectors">
                            <div className="archive-selector-group">
                                <label className="archive-label">Year</label>
                                <select
                                    className="archive-select"
                                    value={archiveYear}
                                    onChange={(e) => {
                                        setArchiveYear(parseInt(e.target.value))
                                        setArchiveMonth(1);
                                        setArchiveDay(1);
                                    }}
                                >
                                    {availableYears.length === 0 ? (
                                        <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                                    ) : (
                                        availableYears.map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div className="archive-selector-group">
                                <label className="archive-label">Month</label>
                                <select
                                    className="archive-select"
                                    value={archiveMonth}
                                    onChange={(e) => {
                                        setArchiveMonth(parseInt(e.target.value));
                                        setArchiveDay(1);
                                    }}
                                >
                                    {availableMonths.length === 0 ? (
                                        <option value={1}>Select a month</option>
                                    ) : (
                                        availableMonths.map((month) => (
                                            <option key={month} value={month}>
                                                {MONTHS[month - 1]}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div className="archive-selector-group">
                                <label className="archive-label">Day</label>
                                <select
                                    className="archive-select"
                                    value={archiveDay}
                                    onChange={(e) => setArchiveDay(parseInt(e.target.value))}
                                >
                                    {availableDays.length === 0 ? (
                                        <option value={1}>Select a day</option>
                                    ) : (
                                        availableDays.map((day) => (
                                            <option key={day} value={day}>
                                                {day}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                        </div>

                        <div className="archive-view-container">
                            {!hasArchiveData ? (
                                <div className="archive-empty">
                                    <p>No entries yet.</p>
                                </div>
                            ) : (
                                <div className='archive-entries'>
                                    <div className="archive-date-row">
                                        <p className="archive-date-header">{formatDate(archiveYear, archiveMonth, archiveDay)}</p>
                                        <div className="archive-actions">
                                            <button className="archive-action-btn" onClick={handleDeleteArchiveJournal} type="button">
                                                Delete journal
                                            </button>
                                            <button className="archive-action-btn" onClick={handleDeleteArchiveReflection} type="button">
                                                Delete questions
                                            </button>
                                        </div>
                                    </div>

                                    {archiveJournal ? (
                                        <div className="archive-entry archive-entry--journal">
                                            <h4 className="archive-entry-title">{archiveJournal.title || 'Untitled Entry'}</h4>
                                            <p className="archive-entry-body">{archiveJournal.body}</p>
                                        </div>
                                      ) : (
                    <div className="archive-missing">
                      <p>No journal log on this date.</p>
                    </div>
                  )}

                                    {archiveReflection ? (
                    <div className="archive-entry archive-entry--reflection">
                      <h4 className="archive-entry-title">Reflection Responses</h4>
                      <div className="archive-qa-list">
                        {QUESTIONS.map((q, idx) => (
                          <div key={idx} className="archive-qa">
                            <p className="archive-q">{q}</p>
                                                        <p className="archive-a">{archiveReflection.answers[idx] || '(no response)'}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="archive-missing">
                      <p>No questions answered on this date.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}