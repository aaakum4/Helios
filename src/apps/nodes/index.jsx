import PomodoroComponent from './Pomodoro';
import TimetableComponent from './Timetable';
import PeacefulDisplayComponent from './PeacefulDisplay';
import TodoComponent from './Todo';
import FocusTrackerComponent from './FocusTracker';
import ReflectionComponent from './Reflection';

export const nodes = [
  {
    id: 'pomodoro',
    title: 'Pomodoro',
    description: 'Focus timer and productivity.',
    icon: '􀐱',
    component: PomodoroComponent,
  },
  {
    id: 'timetable',
    title: 'Timetable',
    description: 'Schedule and organize your time.',
    icon: '􂫑',
    component: TimetableComponent,
  },
  {
    id: 'peacefulDisplay',
    title: 'Peaceful Display',
    description: 'Calming visuals and ambient focus.',
    icon: '􁗛',
    component: PeacefulDisplayComponent,
  },
  {
    id: 'todo',
    title: 'Todo',
    description: 'Track your tasks.',
    icon: '􀷾',
    component: TodoComponent,
  },
  {
    id: 'focusTracker',
    title: 'Focus Tracker',
    description: 'Light focus check-ins to monitor your focus levels.',
    icon: '􁃑',
    component: FocusTrackerComponent,
  },
  {
    id: 'reflection',
    title: 'Reflection',
    description: 'Wellbeing and reflection to stay in tune with your needs.',
    icon: '􀤟',
    component: ReflectionComponent,
  }
];

export function getNodeById(id) {
  return nodes.find((n) => n.id === id);
}