
import { useEffect, useMemo, useState } from 'react';

const readStorageValue = <T,>(key: string, initialValue: T): T => {
  if (typeof window === 'undefined') {
    return initialValue;
  }

  try {
    const storedValue = window.localStorage.getItem(key);
    return storedValue ? (JSON.parse(storedValue) as T) : initialValue;
  } catch {
    return initialValue;
  }
};

export const useLocalStorageState = <T,>(key: string, initialValue: T) => {
  const stableInitialValue = useMemo(() => initialValue, []);
  const [value, setValue] = useState<T>(() => readStorageValue(key, stableInitialValue));

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage quota and privacy mode failures.
    }
  }, [key, value]);

  const clearValue = () => {
    setValue(stableInitialValue);
    try {
      window.localStorage.removeItem(key);
    } catch {
      // Ignore storage failures on cleanup.
    }
  };

  return [value, setValue, clearValue] as const;
};
