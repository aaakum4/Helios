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

const normalizeKey = (key) => {
    const parsed = parseYYYYMMDD(key);
    if (!parsed) {
        return String(key).replace(/_/g, '-');
    }
    const { year, month, day } = parsed;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const normalizeDataMap = (data) => {
    if (!data || typeof data !== 'object') {
        return {};
    }
    return Object.keys(data).reduce((acc, key) => {
        const normalizedKey = normalizeKey(key);
        acc[normalizedKey] = data[key];
        return acc;
    }, {});
};

export default function Reflection() {
    // Unified archive keyed by date.
    const [reflectionArchive, setReflectionArchive] = useLocalStorage('reflection:archive', {});
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

    const getArchiveEntryByDate = (year, month, day) => {
        const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const entry = reflectionArchive[key];
        if (entry) {
            return entry;
        }
        // Fallback for legacy key formats.
        for (const archiveKey in reflectionArchive) {
            const parsed = parseYYYYMMDD(archiveKey);
            if (parsed && parsed.year === year && parsed.month === month && parsed.day === day) {
                return reflectionArchive[archiveKey];
            }
        }
        return undefined;
    };

    const normalizedArchiveKeys = useMemo(() => {
        return Object.keys(reflectionArchive).map(key => {
            const parsed = parseYYYYMMDD(key);
            if (parsed) {
                return `${parsed.year}-${String(parsed.month).padStart(2, '0')}-${String(parsed.day).padStart(2, '0')}`;
            }
            return key;
        });
    }, [reflectionArchive]);

    const availableYears = useMemo(() => {
        const today = new Date();
        const currentYear = today.getFullYear();
        // Start from earliest log year, or current year when empty.
        const logYears = normalizedArchiveKeys
            .map(k => parseYYYYMMDD(k)?.year)
            .filter(Boolean);
        const minYear = logYears.length > 0 ? Math.min(...logYears) : currentYear;
        return Array.from({ length: currentYear - minYear + 1 }, (_, i) => currentYear - i);
    }, [normalizedArchiveKeys]);

    const availableMonths = useMemo(() => {
        const today = new Date();
        const maxMonth = archiveYear === today.getFullYear() ? today.getMonth() + 1 : 12;
        return Array.from({ length: maxMonth }, (_, i) => i + 1);
    }, [archiveYear]);

    const availableDays = useMemo(() => {
        const today = new Date();
        const rawMax = new Date(archiveYear, archiveMonth, 0).getDate();
        const isCurrentMonth =
            archiveYear === today.getFullYear() && archiveMonth === today.getMonth() + 1;
        const maxDay = isCurrentMonth ? today.getDate() : rawMax;
        return Array.from({ length: maxDay }, (_, i) => i + 1);
    }, [archiveYear, archiveMonth]);

    // Months and days that have log entries.
    const logMonthsInYear = useMemo(() => {
        return new Set(
            normalizedArchiveKeys
                .map(k => parseYYYYMMDD(k))
                .filter(p => p && p.year === archiveYear)
                .map(p => p.month)
        );
    }, [normalizedArchiveKeys, archiveYear]);

    const logDaysInMonth = useMemo(() => {
        return new Set(
            normalizedArchiveKeys
                .map(k => parseYYYYMMDD(k))
                .filter(p => p && p.year === archiveYear && p.month === archiveMonth)
                .map(p => p.day)
        );
    }, [normalizedArchiveKeys, archiveYear, archiveMonth]);

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
        
        const currentDateParsed = parseYYYYMMDD(currentDayKey);
        if (!currentDateParsed) {
            setCurrentQuestion(0);
            setAnswers(Array(QUESTIONS.length).fill(''));
            setJournalTitle('');
            setJournalBody('');
            return;
        }

        const archiveEntry = getArchiveEntryByDate(currentDateParsed.year, currentDateParsed.month, currentDateParsed.day);

        if (archiveEntry && archiveEntry.reflection && archiveEntry.reflection.answers) {
            setCurrentQuestion(0);
            setAnswers(archiveEntry.reflection.answers);
        } else {
            setCurrentQuestion(0);
            setAnswers(Array(QUESTIONS.length).fill(''));
        }

        if (archiveEntry && archiveEntry.journal) {
            setJournalTitle(archiveEntry.journal.title || '');
            setJournalBody(archiveEntry.journal.body || '');
        } else {
            setJournalTitle('');
            setJournalBody('');
        }

        setJournalFeedback('');
        if (feedbackTimeoutRef.current) {
            clearTimeout(feedbackTimeoutRef.current);
            feedbackTimeoutRef.current = null;
        }
    }, [currentDayKey, reflectionArchive]);

    const handleQuestionSubmit = () => {
        const currentDateParsedForQuestion = parseYYYYMMDD(currentDayKey);
        if (!currentDateParsedForQuestion) {
            return;
        }

        setReflectionArchive(prev => {
            const next = { ...prev };
            const key = currentDayKey;
            const entry = next[key] || {};

            entry.reflection = {
                answers: answers,
                submittedAt: new Date().toISOString(),
            };

            next[key] = entry;
            return next;
        });

        const answeredCount = answers.filter((a) => a.trim().length > 0).length;
        window.posthog?.capture("reflection_submitted", {
            questions_answered: answeredCount,
            total_questions: QUESTIONS.length,
            date: currentDayKey,
        });

        setCurrentQuestion(0);
        setAnswers(Array(QUESTIONS.length).fill(''));
    };

    const handleJournalSubmit = () => {
        if (!journalTitle.trim() && !journalBody.trim()) {
            return;
        }

        const currentDateParsedForJournal = parseYYYYMMDD(currentDayKey);
        if (!currentDateParsedForJournal) {
            return;
        }

        const archiveEntry = getArchiveEntryByDate(currentDateParsedForJournal.year, currentDateParsedForJournal.month, currentDateParsedForJournal.day);
        const isEdited = !!archiveEntry && !!archiveEntry.journal && (
            (archiveEntry.journal.title || '') !== journalTitle || (archiveEntry.journal.body || '') !== journalBody
        );

        setReflectionArchive(prev => {
            const next = { ...prev };
            const key = currentDayKey;
            const entry = next[key] || {};

            entry.journal = {
                title: journalTitle,
                body: journalBody,
                submittedAt: new Date().toISOString(),
            };
            
            next[key] = entry;
            return next;
        });

        window.posthog?.capture("journal_entry_saved", {
            is_edit: isEdited,
            has_title: !!journalTitle.trim(),
            body_length: journalBody.trim().length,
            date: currentDayKey,
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
    const archiveEntry = getArchiveEntryByDate(archiveYear, archiveMonth, archiveDay);
    const archiveJournal = archiveEntry?.journal;
    const archiveReflection = archiveEntry?.reflection;
    
    const hasArchiveData = !!archiveEntry;

    const deleteEntryForDate = (type) => {
        setReflectionArchive(prev => {
            const next = { ...prev };
            const entry = next[archiveKey];
            
            if (!entry) {
                return next;
            }
            
            if (type === 'journal') {
                delete entry.journal;
            } else if (type === 'reflection') {
                delete entry.reflection;
            }

            if (!entry.journal && !entry.reflection) {
                delete next[archiveKey];
            } else {
                next[archiveKey] = entry;
            }
            
            return next;
        });
    };

    const handleDeleteArchiveJournal = () => {
        const confirmed = window.confirm(`Delete the journal entry for ${formatDate(archiveYear, archiveMonth, archiveDay)}?`);
        if (!confirmed) {
            return;
        }
        deleteEntryForDate('journal');
    };

    const handleDeleteArchiveReflection = () => {
        const confirmed = window.confirm(`Delete the reflection answers for ${formatDate(archiveYear, archiveMonth, archiveDay)}?`);
        if (!confirmed) {
            return;
        }
        deleteEntryForDate('reflection');
    };

    const currentDateParsed = parseYYYYMMDD(currentDayKey);
    const currentYear = currentDateParsed?.year || new Date().getFullYear();
    const currentMonth = currentDateParsed?.month || (new Date().getMonth() + 1);
    const currentDay = currentDateParsed?.day || new Date().getDate();
    
    const currentArchiveEntry = getArchiveEntryByDate(currentYear, currentMonth, currentDay);
    const isReflectionCompleted = !!currentArchiveEntry?.reflection;
    const isJournalEdited = !!currentArchiveEntry?.journal && (
        (currentArchiveEntry.journal.title || '') !== journalTitle || (currentArchiveEntry.journal.body || '') !== journalBody
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
                                    className={`reflection-btn reflection-btn--primary${journalFeedback ? ' reflection-btn--success' : ''}`}
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
                                        const newYear = parseInt(e.target.value);
                                        setArchiveYear(newYear);
                                        setArchiveMonth(1);
                                        const daysInNewMonth = new Date(newYear, 1, 0).getDate();
                                        setArchiveDay(d => Math.min(d, daysInNewMonth));
                                    }}
                                >
                                    {availableYears.map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="archive-selector-group">
                                <label className="archive-label">Month</label>
                                <select
                                    className="archive-select"
                                    value={archiveMonth}
                                    onChange={(e) => {
                                        const newMonth = parseInt(e.target.value);
                                        setArchiveMonth(newMonth);
                                        const daysInNewMonth = new Date(archiveYear, newMonth, 0).getDate();
                                        setArchiveDay(d => Math.min(d, daysInNewMonth));
                                    }}
                                >
                                    {availableMonths.map((month) => (
                                        <option key={month} value={month}>
                                            {logMonthsInYear.has(month) ? '✓ ' : ''}{MONTHS[month - 1]}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="archive-selector-group">
                                <label className="archive-label">Day</label>
                                <select
                                    className="archive-select"
                                    value={archiveDay}
                                    onChange={(e) => setArchiveDay(parseInt(e.target.value))}
                                >
                                    {availableDays.map((day) => (
                                        <option key={day} value={day}>
                                            {logDaysInMonth.has(day) ? '✓ ' : ''}{day}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="archive-view-container">
                            {!hasArchiveData ? (
                                <div className="archive-empty">
                                    <p>No log for {formatDate(archiveYear, archiveMonth, archiveDay)}.</p>
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