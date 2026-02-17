import { createContext, useState, useContext } from 'react';
import { useLocalStorage } from './useLocalStorage';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [settings, setSettings] = useState({
        soundEnabled: true,
        theme: 'dark',
        focusMode: false,
    });

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
    const [focusLogs, setFocusLogs] = useLocalStorage("focusLogs", []);

    return (
        <AppContext.Provider value={{ 
            settings,
            setSettings,
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
            focusLogs,
            setFocusLogs,
        }}>
        {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    return useContext(AppContext);
}