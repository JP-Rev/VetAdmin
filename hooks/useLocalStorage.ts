
import { useState, useEffect, Dispatch, SetStateAction } from 'react';

function useLocalStorage<T,>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const getStoredValue = (): T => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        return JSON.parse(item);
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
    // If initialValue is a function, call it to get the actual initial value. Otherwise, use initialValue directly.
    return initialValue instanceof Function ? initialValue() : initialValue;
  };

  const [storedValue, setStoredValue] = useState<T>(getStoredValue);

  // Removed problematic useEffect:
  // useEffect(() => {
  //   setStoredValue(getStoredValue());
  // }, [key]);


  const setValue: Dispatch<SetStateAction<T>> = (valueOrFn) => {
    // This function now behaves exactly like a React state setter
    // It can accept a value or a function that receives the previous state
    setStoredValue(currentStoredValue => {
      const newValue = valueOrFn instanceof Function ? valueOrFn(currentStoredValue) : valueOrFn;
      try {
        window.localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
      return newValue;
    });
  };

  return [storedValue, setValue];
}

export default useLocalStorage;