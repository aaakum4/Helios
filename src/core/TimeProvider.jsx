import { createContext, useContext, useState, useEffect, useMemo } from 'react';

const TimeContext = createContext();

export function TimeProvider({ children }) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Memoize the context value to prevent unnecessary re-renders
    const value = useMemo(() => ({ time }), [time]);

    return (
        <TimeContext.Provider value={value}>
            {children}
        </TimeContext.Provider>
    );
}

export function useTime() {
    return useContext(TimeContext);
}

// Hook to get only the hours for time-of-day, updates less frequently
export function useTimeOfDay() {
    const { time } = useTime();
    return useMemo(() => {
        const h = time.getHours();
        if (h >= 4 && h < 8)  return 'dawn';
        if (h >= 8 && h < 12) return 'morning';
        if (h >= 12 && h < 16) return 'midday';
        if (h >= 16 && h < 20) return 'evening';
        return 'night';
    }, [time.getHours()]);
}