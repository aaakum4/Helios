import { useLocalStorage } from '../../core/useLocalStorage';
import './InteractiveCalendar.css';

const DEFAULT_CALENDAR = [
  { id: 'block-0', day: 'Sun', label: 'Week Planning', intensity: 1 },
  { id: 'block-1', day: 'Mon', label: 'Deep work', intensity: 3 },
  { id: 'block-2', day: 'Tue', label: 'Planning', intensity: 1 },
  { id: 'block-3', day: 'Wed', label: 'Meetings', intensity: 2 },
  { id: 'block-4', day: 'Thu', label: 'Focused work', intensity: 3 },
  { id: 'block-5', day: 'Fri', label: 'Review', intensity: 1 },
  { id: 'block-6', day: 'Sat', label: 'Rest', intensity: 0 },
];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function InteractiveCalendar() {
  const [blocks] = useLocalStorage('calendar:blocks', DEFAULT_CALENDAR);

  return (
    <div className="calendar-container">
        <div className="calendar-header">
            <h2>Interactive Calendar</h2>
            <p>Visualize your week with blocks that connect to your goals.</p>
        </div>

        <div className="calendar-grid">
            {WEEK_DAYS.map((day) => {
                const dayBlocks = blocks.filter((block) => block.day === day);
                const intensity = dayBlocks.reduce((sum, block) => sum + block.intensity, 0);
                return (
            <div key={day} className={`calendar-day intensity-${Math.min(intensity, 3)}`}>
              <div className="calendar-day-label">{day}</div>
              {dayBlocks.map((block) => (
                <div key={block.id} className="calendar-block">
                  {block.label}
                  <button className="calendar-action">Start</button>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <div className="calendar-note">
        <span>Timetable and Todo items will sync here.</span>
      </div>
    </div>
  );
}