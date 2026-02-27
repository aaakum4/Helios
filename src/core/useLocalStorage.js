import { useState, useEffect, useRef } from 'react';

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

  // Tracks whether the upcoming localStorageChange event was dispatched by
  // this hook instance so the listener can ignore it and avoid a self-update loop.
  const isInternalUpdateRef = useRef(false);
  // Skip the effect on the very first render (value was just loaded from storage).
  const isInitialMountRef = useRef(true);

  // setValue is now a pure React state updater — no side effects inside the updater.
  // Side effects are handled by the useEffect below, which runs AFTER React commits
  // the final state (i.e. never during React's StrictMode "dry-run" invocations).
  const setValue = (value) => {
    try {
      setStoredValue((prev) => {
        return value instanceof Function ? value(prev) : value;
      });
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Persist to localStorage and notify other hook instances whenever the value changes.
  // useEffect only runs once per committed state update, so StrictMode double-invocation
  // of the state updater above does NOT double-fire this effect.
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    try {
      if (import.meta.env.DEV && key === 'focusSubjects') {
        console.debug('[useLocalStorage] persisting', {
          key,
          length: Array.isArray(storedValue) ? storedValue.length : undefined,
        });
      }
      window.localStorage.setItem(key, JSON.stringify(storedValue));

      // Mark as an internal dispatch so our own listener skips it.
      // dispatchEvent is synchronous: the listener runs before we return from dispatchEvent,
      // so the flag is guaranteed to be set when the listener checks it.
      isInternalUpdateRef.current = true;
      window.dispatchEvent(new CustomEvent('localStorageChange', {
        detail: { key, value: storedValue },
      }));
    } catch (error) {
      console.error(`Error persisting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Listen for changes from OTHER hook instances sharing the same key.
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.detail?.key !== key) return;

      // Skip events that this instance dispatched to avoid a self-update loop.
      if (isInternalUpdateRef.current) {
        isInternalUpdateRef.current = false;
        return;
      }

      if (import.meta.env.DEV && key === 'focusSubjects') {
        console.debug('[useLocalStorage] cross-component update', {
          key,
          length: Array.isArray(e.detail.value) ? e.detail.value.length : undefined,
        });
      }
      setStoredValue(e.detail.value);
    };

    window.addEventListener('localStorageChange', handleStorageChange);
    return () => {
      window.removeEventListener('localStorageChange', handleStorageChange);
    };
  }, [key]);

  return [storedValue, setValue];
}