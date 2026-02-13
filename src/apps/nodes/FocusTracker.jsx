import { useLocalStorage } from '../../core/useLocalStorage';
import './FocusTracker.css';

const DEFAULT_FOCUS = [
    { id: 'focus-1', time: '09:00', level: 'high', pomodoro: true },
    { id: 'focus-2', time: '13:00', level: 'medium', pomodoro: false },
    { id: 'focus-3', time: '17:00', level: 'low', pomodoro: true },
];

export default function FocusTracker() {
    const [focusEntries] = useLocalStorage('focus:data', DEFAULT_FOCUS);

    return (
        <div className="focus-container">
            <div className="focus-header">
                <h2>Focus Tracker</h2>
                <p>Light check-ins that link your focus, time of day, and other factors.</p>
            </div>

            <div className="focus-insight">
                <div className="focus-gradient"></div>
                <div className="focus-legend">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                </div>
            </div>

            <div className="focus-list">
                {focusEntries.map((entry) => (
                    <div key={entry.id} className={`focus-row focus-${entry.level}`}>
                        <div>
                            <strong>{entry.time}</strong>
                            <span className="focus-level">{entry.level}</span>
                        </div>
                        <span className="focus-note">
                            {entry.pomodoro ? 'Pomodoro completed' : 'No session'}
                        </span>
                    </div>
                ))}
            </div>
            
            <div className="focus-note">
                <span>Focus insights will feed Goals and the Calendar.</span>
            </div>
        </div>
    );
}