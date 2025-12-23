import { useState, useCallback, useRef, useEffect } from 'react';

interface UseAsyncStateOptions<T> {
  /**
   * Initial data value
   */
  initialData?: T;
  /**
   * Callback when the async operation succeeds
   */
  onSuccess?: (data: T) => void;
  /**
   * Callback when the async operation fails
   */
  onError?: (error: Error) => void;
}

interface UseAsyncStateReturn<T> {
  /**
   * The current data
   */
  data: T | undefined;
  /**
   * Loading state
   */
  isLoading: boolean;
  /**
   * Error object if operation failed
   */
  error: Error | null;
  /**
   * Execute the async operation
   */
  execute: (asyncFn: () => Promise<T>) => Promise<void>;
  /**
   * Reset the state to initial values
   */
  reset: () => void;
  /**
   * Set data manually
   */
  setData: (data: T) => void;
}

/**
 * Custom hook for managing async operations with consistent loading/error states
 *
 * @example
 * ```tsx
 * const { data, isLoading, error, execute } = useAsyncState<Plant[]>();
 *
 * useEffect(() => {
 *   execute(async () => {
 *     const response = await fetch('/api/plants');
 *     return response.json();
 *   });
 * }, []);
 *
 * if (isLoading) return <LoadingState />;
 * if (error) return <ErrorState message={error.message} onRetry={() => execute(...)} />;
 * return <PlantList plants={data} />;
 * ```
 */
export function useAsyncState<T = any>(
  options: UseAsyncStateOptions<T> = {}
): UseAsyncStateReturn<T> {
  const { initialData, onSuccess, onError } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(
    async (asyncFn: () => Promise<T>) => {
      setIsLoading(true);
      setError(null);

      try {
        const result = await asyncFn();

        if (isMountedRef.current) {
          setData(result);
          setIsLoading(false);
          onSuccess?.(result);
        }
      } catch (err) {
        const error = err instanceof Error ? err : new Error('An error occurred');

        if (isMountedRef.current) {
          setError(error);
          setIsLoading(false);
          onError?.(error);
        }
      }
    },
    [onSuccess, onError]
  );

  const reset = useCallback(() => {
    setData(initialData);
    setIsLoading(false);
    setError(null);
  }, [initialData]);

  return {
    data,
    isLoading,
    error,
    execute,
    reset,
    setData,
  };
}
