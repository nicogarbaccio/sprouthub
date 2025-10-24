/**
 * Array utility functions for common operations
 *
 * Provides reusable, type-safe array manipulation helpers
 * to reduce code duplication and improve readability.
 */

/**
 * Extracts unique values from an array using a selector function
 *
 * @param arr - Array to process
 * @param selector - Function to extract the value to deduplicate by
 * @returns Array of unique values
 *
 * @example
 * const users = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }, { id: 1, name: 'Alice' }];
 * const uniqueIds = getUniqueValues(users, u => u.id);
 * // Returns: [1, 2]
 */
export const getUniqueValues = <T, K>(
  arr: T[],
  selector: (item: T) => K
): K[] => {
  return Array.from(new Set(arr.map(selector)));
};

/**
 * Deduplicates an array of objects by a specific key
 *
 * @param arr - Array to deduplicate
 * @param keySelector - Function to extract the unique key
 * @returns Deduplicated array (keeps first occurrence)
 *
 * @example
 * const plants = [
 *   { id: '1', name: 'Rose' },
 *   { id: '2', name: 'Tulip' },
 *   { id: '1', name: 'Rose Duplicate' }
 * ];
 * const unique = deduplicateByKey(plants, p => p.id);
 * // Returns: [{ id: '1', name: 'Rose' }, { id: '2', name: 'Tulip' }]
 */
export const deduplicateByKey = <T, K>(
  arr: T[],
  keySelector: (item: T) => K
): T[] => {
  return Array.from(
    new Map(arr.map(item => [keySelector(item), item])).values()
  );
};

/**
 * Groups an array of items by a specific key
 *
 * @param arr - Array to group
 * @param keySelector - Function to extract the grouping key
 * @returns Map of grouped items
 *
 * @example
 * const plants = [
 *   { id: '1', household: 'A', name: 'Rose' },
 *   { id: '2', household: 'B', name: 'Tulip' },
 *   { id: '3', household: 'A', name: 'Lily' }
 * ];
 * const grouped = groupBy(plants, p => p.household);
 * // Returns: Map { 'A' => [{...}, {...}], 'B' => [{...}] }
 */
export const groupBy = <T, K>(
  arr: T[],
  keySelector: (item: T) => K
): Map<K, T[]> => {
  const groups = new Map<K, T[]>();

  arr.forEach(item => {
    const key = keySelector(item);
    const group = groups.get(key) || [];
    group.push(item);
    groups.set(key, group);
  });

  return groups;
};

/**
 * Creates a lookup map from an array
 *
 * @param arr - Array to convert to map
 * @param keySelector - Function to extract the map key
 * @returns Map for O(1) lookups
 *
 * @example
 * const users = [{ id: '1', name: 'Alice' }, { id: '2', name: 'Bob' }];
 * const userMap = toMap(users, u => u.id);
 * const alice = userMap.get('1');
 */
export const toMap = <T, K>(
  arr: T[],
  keySelector: (item: T) => K
): Map<K, T> => {
  return new Map(arr.map(item => [keySelector(item), item]));
};

/**
 * Chunks an array into smaller arrays of specified size
 *
 * @param arr - Array to chunk
 * @param size - Size of each chunk
 * @returns Array of chunks
 *
 * @example
 * const numbers = [1, 2, 3, 4, 5, 6, 7];
 * const chunks = chunk(numbers, 3);
 * // Returns: [[1, 2, 3], [4, 5, 6], [7]]
 */
export const chunk = <T>(arr: T[], size: number): T[][] => {
  if (size <= 0) {
    throw new Error('Chunk size must be greater than 0');
  }

  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
};

/**
 * Filters an array and narrows the type using a type guard
 *
 * @param arr - Array to filter
 * @param predicate - Type guard predicate
 * @returns Filtered array with narrowed type
 *
 * @example
 * const items: (string | number)[] = ['a', 1, 'b', 2];
 * const strings = filterWithTypeGuard(items, (item): item is string => typeof item === 'string');
 * // Type: string[]
 */
export const filterWithTypeGuard = <T, S extends T>(
  arr: T[],
  predicate: (item: T) => item is S
): S[] => {
  return arr.filter(predicate);
};

/**
 * Safely gets the first element of an array
 *
 * @param arr - Array to get first element from
 * @returns First element or undefined
 *
 * @example
 * const first = getFirst([1, 2, 3]); // Returns: 1
 * const empty = getFirst([]); // Returns: undefined
 */
export const getFirst = <T>(arr: T[]): T | undefined => {
  return arr[0];
};

/**
 * Safely gets the last element of an array
 *
 * @param arr - Array to get last element from
 * @returns Last element or undefined
 *
 * @example
 * const last = getLast([1, 2, 3]); // Returns: 3
 * const empty = getLast([]); // Returns: undefined
 */
export const getLast = <T>(arr: T[]): T | undefined => {
  return arr[arr.length - 1];
};

/**
 * Checks if an array has elements (type guard)
 *
 * @param arr - Array to check
 * @returns True if array has elements
 *
 * @example
 * const items: string[] = [];
 * if (hasElements(items)) {
 *   const first = items[0]; // Type-safe access
 * }
 */
export const hasElements = <T>(arr: T[]): arr is [T, ...T[]] => {
  return arr.length > 0;
};

/**
 * Partitions an array into two arrays based on a predicate
 *
 * @param arr - Array to partition
 * @param predicate - Predicate function
 * @returns Tuple of [matching, notMatching]
 *
 * @example
 * const numbers = [1, 2, 3, 4, 5, 6];
 * const [even, odd] = partition(numbers, n => n % 2 === 0);
 * // even: [2, 4, 6], odd: [1, 3, 5]
 */
export const partition = <T>(
  arr: T[],
  predicate: (item: T) => boolean
): [T[], T[]] => {
  const matching: T[] = [];
  const notMatching: T[] = [];

  arr.forEach(item => {
    if (predicate(item)) {
      matching.push(item);
    } else {
      notMatching.push(item);
    }
  });

  return [matching, notMatching];
};

/**
 * Removes falsy values from an array
 *
 * @param arr - Array to compact
 * @returns Array without falsy values
 *
 * @example
 * const values = [1, null, 2, undefined, 3, false, 4, '', 0];
 * const compacted = compact(values);
 * // Returns: [1, 2, 3, 4]
 */
export const compact = <T>(arr: (T | null | undefined | false | '' | 0)[]): T[] => {
  return arr.filter(Boolean) as T[];
};

/**
 * Creates an array of numbers in a range
 *
 * @param start - Start of range (inclusive)
 * @param end - End of range (exclusive)
 * @param step - Step size (default: 1)
 * @returns Array of numbers
 *
 * @example
 * const numbers = range(1, 5); // Returns: [1, 2, 3, 4]
 * const evens = range(0, 10, 2); // Returns: [0, 2, 4, 6, 8]
 */
export const range = (start: number, end: number, step: number = 1): number[] => {
  if (step === 0) {
    throw new Error('Step cannot be 0');
  }

  const result: number[] = [];
  if (step > 0) {
    for (let i = start; i < end; i += step) {
      result.push(i);
    }
  } else {
    for (let i = start; i > end; i += step) {
      result.push(i);
    }
  }

  return result;
};
