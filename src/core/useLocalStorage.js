import { useState, useEffect, useRef } from 'react';
import { setLocalWriteTimestamp } from '../lib/cloudStorageSnapshot';

export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item != null) {
        return JSON.parse(item);
      }

      // Match React useState semantics for lazy initial values.
      return initialValue instanceof Function ? initialValue() : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue instanceof Function ? initialValue() : initialValue;
    }
  });

  // Marks events dispatched by this instance to avoid self-update loops.
  const isInternalUpdateRef = useRef(false);
  // Skip persisting on first render because state was loaded from storage.
  const isInitialMountRef = useRef(true);

  const setValue = (value) => {
    try {
      setStoredValue((prev) => {
        return value instanceof Function ? value(prev) : value;
      });
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  // Persist value and notify other hook instances sharing this key.
  useEffect(() => {
    if (isInitialMountRef.current) {
      isInitialMountRef.current = false;
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
      setLocalWriteTimestamp(Date.now());

      // Flag this dispatch so this instance can ignore it.
      isInternalUpdateRef.current = true;
      window.dispatchEvent(new CustomEvent('localStorageChange', {
        detail: { key, value: storedValue },
      }));
    } catch (error) {
      console.error(`Error persisting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Listen for changes from other hook instances sharing this key.
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.detail?.key !== key) return;

      if (isInternalUpdateRef.current) {
        isInternalUpdateRef.current = false;
        return;
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