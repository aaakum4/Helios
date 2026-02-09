import { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export function AppProvider({ children }) {
    const [settings, setSettings] = useState({
        soundEnabled: true,
        theme: 'dark',
        focusMode: false,
    });

    return (
        <AppContext.Provider value={{ settings, setSettings}}>
            {children}
        </AppContext.Provider>
    );
}

export function useAppContext() {
    return useContext(AppContext);
}