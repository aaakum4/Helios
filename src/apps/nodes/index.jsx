import { lazy } from 'react';

const PomodoroComponent = lazy(() => import('./Pomodoro'));
const TimetableComponent = lazy(() => import('./Timetable'));
const PeacefulDisplayComponent = lazy(() => import('./PeacefulDisplay'));
const TodoComponent = lazy(() => import('./Todo'));
const GoalsComponent = lazy(() => import('./Goals'));
const FocusTrackerComponent = lazy(() => import('./FocusTracker'));
const ReflectionComponent = lazy(() => import('./Reflection'));
const InteractiveCalendarComponent = lazy(() => import('./InteractiveCalendar'));

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
    id: 'goals',
    title: 'Goals',
    description: 'Set intent-led goals to guide focus.',
    icon: '􀢊',
    component: GoalsComponent,
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
  },
  {
    id: 'interactiveCalendar',
    title: 'Calendar',
    description: 'Interactive calendar to manage your schedule.',
    icon: '􀉉',
    component: InteractiveCalendarComponent,
  }
];

export function getNodeById(id) {
  return nodes.find((n) => n.id === id);
}