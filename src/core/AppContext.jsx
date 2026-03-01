import { createContext, useContext } from 'react';
import { useLocalStorage } from './useLocalStorage';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [timetableData, setTimetableData] = useLocalStorage("timetableData", {
        blocks: [],
        rotationMode: "weekly",
        activeWeekIndex: 0,
        activeMonthWeek: 1,
    });

    const setTimetableBlocks = (value) => {
        setTimetableData((prev) => {
            const nextBlocks = typeof value === "function" ? value(prev.blocks || []) : value;
            return {
                ...prev,
                blocks: nextBlocks,
            };
        });
    };

    const setRotationMode = (value) => {
        setTimetableData((prev) => ({
            ...prev,
            rotationMode: value,
        }));
    };

    const setActiveWeekIndex = (value) => {
        setTimetableData((prev) => ({
            ...prev,
            activeWeekIndex: value,
        }));
    };

    const setActiveMonthWeek = (value) => {
        setTimetableData((prev) => ({
            ...prev,
            activeMonthWeek: value,
        }));
    };

    const [focusSubjects, setFocusSubjects] = useLocalStorage("focusSubjects", []);
    const [studySessions, setStudySessions] = useLocalStorage("studySessions", []);

    // Shared FocusTracker active-session state — written by both FocusTracker and Pomodoro
    const [ftActiveSubjectId, setFtActiveSubjectId] = useLocalStorage('focustracker:activeSubjectId', null);
    const [ftSessionStartTime, setFtSessionStartTime] = useLocalStorage('focustracker:sessionStartTime', null);
    const [ftSessionStartDate, setFtSessionStartDate] = useLocalStorage('focustracker:sessionStartDate', null);
    // 'manual' = started by FocusTracker, 'pomodoro' = started by Pomodoro
    const [ftSessionSource, setFtSessionSource] = useLocalStorage('focustracker:sessionSource', null);

    return (
        <AppContext.Provider value={{ 
            timetableBlocks: timetableData.blocks || [],
            rotationMode: timetableData.rotationMode || 'weekly',
            activeWeekIndex: typeof timetableData.activeWeekIndex === "number" ? timetableData.activeWeekIndex : 0,
            activeMonthWeek: typeof timetableData.activeMonthWeek === "number" ? timetableData.activeMonthWeek : 1,
            setTimetableBlocks,
            setRotationMode,
            setActiveWeekIndex,
            setActiveMonthWeek,
            focusSubjects,
            setFocusSubjects,
            studySessions,
            setStudySessions,
            ftActiveSubjectId, setFtActiveSubjectId,
            ftSessionStartTime, setFtSessionStartTime,
            ftSessionStartDate, setFtSessionStartDate,
            ftSessionSource, setFtSessionSource,
        }}>
        {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    return useContext(AppContext);
}