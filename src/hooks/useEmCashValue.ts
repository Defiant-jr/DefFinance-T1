import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';

const STORAGE_KEY = 'defFinance:emCashValue';

const parseValue = (raw: string | null): number => {
  const parsed = Number.parseFloat(raw ?? '');
  return Number.isFinite(parsed) ? parsed : 0;
};

const readStoredValue = (): number => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return 0;
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return parseValue(stored);
};

const writeStoredValue = (value: number): void => {
  if (typeof window === 'undefined' || !window.localStorage) {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, String(value ?? 0));
};

export const useEmCashValue = (): [number, Dispatch<SetStateAction<number>>] => {
  const [value, setValue] = useState<number>(() => readStoredValue());

  useEffect(() => {
    writeStoredValue(value);
  }, [value]);

  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        setValue(readStoredValue());
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

  return [value, setValue];
};

export const getStoredEmCashValue = (): number => readStoredValue();
