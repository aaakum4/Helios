const DEMO_VERSION_KEY = "helios:demoDataVersion";
const DEMO_VERSION = "2026-03-onboarding";

function hasStorageKey(key) {
  return localStorage.getItem(key) !== null;
}

function addDays(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function createTodosDemo() {
  return {
    subheadings: [
      {
        id: "inbox-default",
        title: "Inbox",
        todos: [
          {
            id: "todo-demo-1",
            title: "Plan top 3 priorities for today",
            completed: false,
            dueDate: addDays(0),
          },
          {
            id: "todo-demo-2",
            title: "Review notes from yesterday",
            completed: false,
            dueDate: addDays(1),
          },
        ],
      },
      {
        id: "subheading-demo-deep-work",
        title: "Deep Work",
        todos: [
          {
            id: "todo-demo-3",
            title: "Ship one meaningful feature",
            completed: false,
            dueDate: addDays(2),
          },
          {
            id: "todo-demo-4",
            title: "Archive completed tasks",
            completed: true,
            dueDate: "",
          },
        ],
      },
    ],
  };
}

function createTimetableDemo() {
  return {
    blocks: [
      {
        id: "block-demo-1",
        title: "Morning Focus",
        dayIndex: 1,
        startMinutes: 9 * 60,
        endMinutes: 11 * 60,
        color: "#4f86f7",
        rotation: "weekly",
        isPriority: true,
        info: "Start with your hardest task while energy is high.",
        attachments: [],
      },
      {
        id: "block-demo-2",
        title: "Admin + Messages",
        dayIndex: 1,
        startMinutes: 11 * 60 + 15,
        endMinutes: 12 * 60,
        color: "#f2b632",
        rotation: "weekly",
        isPriority: false,
        info: "Batch quick tasks in one window.",
        attachments: [],
      },
      {
        id: "block-demo-3",
        title: "Exercise / Walk",
        dayIndex: 1,
        startMinutes: 17 * 60,
        endMinutes: 18 * 60,
        color: "#2bb673",
        rotation: "weekly",
        isPriority: false,
        info: "Protect recovery to sustain consistency.",
        attachments: [],
      },
    ],
    rotationMode: "weekly",
    activeWeekIndex: 0,
    activeMonthWeek: 1,
  };
}

function createFocusSubjectsDemo() {
  return [
    { id: "subject-demo-1", name: "Project Build", color: "#4f86f7" },
    { id: "subject-demo-2", name: "Learning", color: "#2bb673" },
  ];
}

export function initializeDemoData() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (localStorage.getItem(DEMO_VERSION_KEY) === DEMO_VERSION) {
      return;
    }

    const shouldSeedTodos = !hasStorageKey("todosData");
    const shouldSeedTimetable = !hasStorageKey("timetableData");
    const shouldSeedFocusSubjects = !hasStorageKey("focusSubjects");

    if (shouldSeedTodos) {
      localStorage.setItem("todosData", JSON.stringify(createTodosDemo()));
    }

    if (shouldSeedTimetable) {
      localStorage.setItem("timetableData", JSON.stringify(createTimetableDemo()));
    }

    if (shouldSeedFocusSubjects) {
      localStorage.setItem("focusSubjects", JSON.stringify(createFocusSubjectsDemo()));
    }

    localStorage.setItem(DEMO_VERSION_KEY, DEMO_VERSION);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[demo-data] Unable to initialize demo data.", error);
    }
  }
}
