// Node registry: metadata and lazy-loaded components for each app node
import { lazy } from 'react';

// Lazy-load node components for performance
const PomodoroComponent = lazy(() => import('./Pomodoro'));
const TimetableComponent = lazy(() => import('./Timetable'));
const PeacefulDisplayComponent = lazy(() => import('./PeacefulDisplay'));
const TodoComponent = lazy(() => import('./Todo'));

export const nodes = [
  {
    id: 'pomodoro',
    title: 'Pomodoro',
    description: 'Focus timer and productivity.',
    icon: '⏱️',
    component: PomodoroComponent,
  },
  {
    id: 'timetable',
    title: 'Timetable',
    description: 'Schedule and organize your time.',
    icon: '📅',
    component: TimetableComponent,
  },
  {
    id: 'peacefulDisplay',
    title: 'Peaceful Display',
    description: 'Calming visuals and ambient focus.',
    icon: '🌸',
    component: PeacefulDisplayComponent,
  },
  {
    id: 'todo',
    title: 'Todo',
    description: 'Track your tasks.',
    icon: '✓',
    component: TodoComponent,
  },
];

export function getNodeById(id) {
  return nodes.find((n) => n.id === id);
}