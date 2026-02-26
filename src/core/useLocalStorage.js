import { useState, useEffect } from 'react';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = (value) => {
    try {
      setStoredValue((prev) => {
        const valueToStore = value instanceof Function ? value(prev) : value;
        if (import.meta.env.DEV && key === 'focusSubjects') {
          console.debug('[useLocalStorage] setValue', {
            key,
            prevLength: Array.isArray(prev) ? prev.length : undefined,
            nextLength: Array.isArray(valueToStore) ? valueToStore.length : undefined,
          });
        }
        window.localStorage.setItem(key, JSON.stringify(valueToStore));

        // Dispatch custom event to sync across components
        window.dispatchEvent(new CustomEvent('localStorageChange', {
          detail: { key, value: valueToStore }
        }));

        return valueToStore;
      });
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Listen for changes from other components
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.detail?.key === key) {
        if (import.meta.env.DEV && key === 'focusSubjects') {
          console.debug('[useLocalStorage] localStorageChange', {
            key,
            nextLength: Array.isArray(e.detail.value) ? e.detail.value.length : undefined,
          });
        }
        setStoredValue(e.detail.value);
      }
    };

    window.addEventListener('localStorageChange', handleStorageChange);
    return () => {
      window.removeEventListener('localStorageChange', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
}