import { createContext, useContext, useState, useEffect } from 'react';

const TimeContext = createContext();

export function TimeProvider({ children }) {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <TimeContext.Provider value={{ time }}>
            {children}
        </TimeContext.Provider>
    );
}

export function useTime() {
    return useContext(TimeContext);
}