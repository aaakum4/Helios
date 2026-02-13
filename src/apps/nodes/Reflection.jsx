import { useLocalStorage } from '../../core/useLocalStorage';
import { useState } from 'react';
import './Reflection.css';

const DEFAULT_REFLECTION = [
    {
        id: 'reflection-1',
        title: 'A gentle check-in.',
        detail: 'You planned 5 tasks today and completed 3. Focus was strongest in the morning.',
    },
    {
        id: 'reflection-2',
        title: 'Patterns to notice',
        detail: 'Tasks finished before deadlines felt easier. Late tasks clustered after 4pm.',
    },
];

export default function Reflection() {
    const [reflections] = useLocalStorage('reflection:data', DEFAULT_REFLECTION);
    const [activeTab, setActiveTab] = useState('insights');
    const [journalEntry, setJournalEntry] = useLocalStorage('reflection:journalEntry', '');

    return (
        <div className="reflection-container">
            <div className="reflection-header">
                <h2>Reflection</h2>
                <p>Take a moment to review your day.</p>
            </div>

            <div className="reflection-tabs">
                <button
                    className={activeTab === 'insights' ? 'active' : ''}
                    onClick={() => setActiveTab('insights')}
                >
                    Insights
                </button>
                <button
                    className={activeTab === 'journal' ? 'active' : ''}
                    onClick={() => setActiveTab('journal')}
                >
                    Journal
                </button>
            </div>

            {activeTab === 'insights' && (
                <div className="reflection-list">
                    {reflections.map((reflection) => (
                        <div key={reflection.id} className="reflection-card">
                            <h3>{reflection.title}</h3>
                            <p>{reflection.detail}</p>
                        </div>
                    ))}
                </div>
            )}

            {activeTab === 'journal' && (
                <div className="journal-panel">
                    <textarea
                        value={journalEntry}
                        onChange={(e) => setJournalEntry(event.target.value)}
                        placeholder="Write your journal entry here..."
                    />
                    <div className="journal-note">Entries are private and stored locally.</div>
                </div>
            )}
        </div>
    );
}
