import { useLocalStorage } from "../../core/useLocalStorage";
import './Goals.css';

const DEFAULT_GOALS = [
    {
        id: 'goal-1',
        title: 'Complete tasks before deadline',
        intent: 'before-deadline',
        focusTarget: 'steady',
        alignment: 0.72,
    },
    {
        id: 'goal-2',
        title: 'Finish deep work by midday',
        intent: 'before-noon',
        focusTarget: 'high',
        alignment: 0.58,
    },
];

export default function Goals() {
    const [goals] = useLocalStorage('goals:data', DEFAULT_GOALS);

    return (
        <div className="goals-container">
            <div className="goals-header">
                <h2>Goals</h2>
                <p>Intent-led goals that guide focus and task quality.</p>
            </div>

            <div className="goals-grid">
                {goals.map((goal) => (
                    <div key={goal.id} className="goal-card">
                        <div className="goal-card-top">
                            <span className="goal-tag">{goal.intent.replace('-', ' ')}</span>
                            <span className="goal-alignment">{Math.round(goal.alignment * 100)}% aligned</span>
                        </div>
                        <h3>{goal.title}</h3>
                        <p>Focus tone: {goal.focusTarget}</p>
                        <div className="goal-ring">
                            <div className="goal-ring-fill" style={{ width: `${goal.alignment * 100}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="goals-note">
                <span>Goals will connect to Pomodoro sessions and task timing.</span>
            </div>
        </div>
    );
}