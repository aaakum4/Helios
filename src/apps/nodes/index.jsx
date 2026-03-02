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
    description: 'Put your head down and get something done.',
    icon: '􀐱',
    component: PomodoroComponent,
  },
  {
    id: 'timetable',
    title: 'Timetable',
    description: 'Plan your day before it plans you.',
    icon: '􂫑',
    component: TimetableComponent,
  },
  {
    id: 'peacefulDisplay',
    title: 'Peaceful Display',
    description: 'Step back, breathe, and just be for a moment.',
    icon: '􁗛',
    component: PeacefulDisplayComponent,
  },
  {
    id: 'todo',
    title: 'Todo',
    description: 'Clear your head — get it out of your mind and onto the page.',
    icon: '􀷾',
    component: TodoComponent,
  },
  {
    id: 'focusTracker',
    title: 'Focus Tracker',
    description: 'Check in with yourself and see how you\'re really doing.',
    icon: '􁃑',
    component: FocusTrackerComponent,
  },
  {
    id: 'reflection',
    title: 'Reflection',
    description: 'Take some time to reflect on what matters.',
    icon: '􀤟',
    component: ReflectionComponent,
  }
];

export function getNodeById(id) {
  return nodes.find((n) => n.id === id);
}