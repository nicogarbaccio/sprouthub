import { useState, useEffect } from 'react';

/**
 * Hook for debouncing rapidly changing values
 * Useful for search inputs to avoid excessive API calls or filtering
 */
export const useDebounce = <T>(value: T, delay: number): T => {
 const [debouncedValue, setDebouncedValue] = useState<T>(value);

 useEffect(() => {
  const handler = setTimeout(() => {
   setDebouncedValue(value);
  }, delay);

  return () => {
   clearTimeout(handler);
  };
 }, [value, delay]);

 return debouncedValue;
}; 