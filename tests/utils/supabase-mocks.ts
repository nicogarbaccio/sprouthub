import { vi } from 'vitest';

/**
 * Shared Supabase mock utilities for unit tests
 *
 * These utilities help reduce duplication and make tests more maintainable
 * by providing consistent mocking patterns for Supabase queries.
 */

type MockData = any;
type MockError = Error | null;

interface QueryResult {
  data: MockData;
  error: MockError;
}

/**
 * Creates a chainable mock object that can be used for nested method calls
 *
 * @example
 * const mock = createChainableMock({
 *   eq: createChainableMock({
 *     order: () => Promise.resolve({ data: [], error: null })
 *   })
 * });
 */
export function createChainableMock(methods: Record<string, any>) {
  const mock: any = {};

  for (const [key, value] of Object.entries(methods)) {
    if (typeof value === 'function') {
      mock[key] = vi.fn(value);
    } else if (typeof value === 'object' && value !== null) {
      mock[key] = vi.fn(() => value);
    } else {
      mock[key] = value;
    }
  }

  return mock;
}

/**
 * Creates a standard Supabase select query mock
 *
 * @param data - The data to return from the query
 * @param error - Optional error to return
 *
 * @example
 * vi.mocked(supabase.from).mockReturnValue(
 *   createSelectMock(mockRecords)
 * );
 */
export function createSelectMock(data: MockData = [], error: MockError = null) {
  return createChainableMock({
    select: createChainableMock({
      eq: createChainableMock({
        order: () => Promise.resolve({ data, error })
      })
    })
  });
}

/**
 * Creates a Supabase select query mock with multiple eq() filters
 *
 * @param data - The data to return from the query
 * @param filterCount - Number of eq() filters in the chain (default: 3)
 * @param error - Optional error to return
 *
 * @example
 * // For queries like: select().eq().eq().eq().single()
 * vi.mocked(supabase.from).mockReturnValue(
 *   createMultiEqSelectMock(mockData, 3)
 * );
 */
export function createMultiEqSelectMock(
  data: MockData = null,
  filterCount: number = 3,
  error: MockError = null,
  finalMethod: 'single' | 'order' = 'single'
) {
  let chain: any;

  if (finalMethod === 'single') {
    chain = { single: () => Promise.resolve({ data, error }) };
  } else {
    chain = { order: () => Promise.resolve({ data, error }) };
  }

  // Build the eq chain from the inside out
  for (let i = 0; i < filterCount; i++) {
    chain = { eq: vi.fn(() => chain) };
  }

  return createChainableMock({
    select: vi.fn(() => chain)
  });
}

/**
 * Creates a Supabase delete query mock
 *
 * @param error - Optional error to return
 *
 * @example
 * vi.mocked(supabase.from).mockReturnValue(
 *   createDeleteMock()
 * );
 */
export function createDeleteMock(error: MockError = null) {
  return createChainableMock({
    delete: createChainableMock({
      eq: () => Promise.resolve({ data: null, error })
    })
  });
}

/**
 * Creates a Supabase insert query mock
 *
 * @param data - The data to return (usually null for inserts)
 * @param error - Optional error to return
 *
 * @example
 * vi.mocked(supabase.from).mockReturnValue(
 *   createInsertMock()
 * );
 */
export function createInsertMock(data: MockData = null, error: MockError = null) {
  return createChainableMock({
    insert: () => Promise.resolve({ data, error })
  });
}

/**
 * Creates a Supabase update query mock
 *
 * @param data - The data to return
 * @param error - Optional error to return
 *
 * @example
 * vi.mocked(supabase.from).mockReturnValue(
 *   createUpdateMock(updatedRecord)
 * );
 */
export function createUpdateMock(data: MockData = null, error: MockError = null) {
  return createChainableMock({
    update: createChainableMock({
      eq: createChainableMock({
        select: () => Promise.resolve({ data, error })
      })
    })
  });
}

/**
 * Creates a Supabase upsert query mock
 *
 * @param data - The data to return
 * @param error - Optional error to return
 *
 * @example
 * vi.mocked(supabase.from).mockReturnValue(
 *   createUpsertMock()
 * );
 */
export function createUpsertMock(data: MockData = null, error: MockError = null) {
  return createChainableMock({
    upsert: () => Promise.resolve({ data, error })
  });
}

/**
 * Creates a complete Supabase table mock with common CRUD operations
 *
 * @param options - Configuration for each operation
 *
 * @example
 * vi.mocked(supabase.from).mockReturnValue(
 *   createTableMock({
 *     select: { data: mockRecords },
 *     delete: { error: null },
 *     insert: { error: null }
 *   })
 * );
 */
export function createTableMock(options: {
  select?: { data?: MockData; error?: MockError };
  delete?: { error?: MockError };
  insert?: { data?: MockData; error?: MockError };
  update?: { data?: MockData; error?: MockError };
  upsert?: { data?: MockData; error?: MockError };
} = {}) {
  const mock: any = {};

  if (options.select !== undefined) {
    const { data = [], error = null } = options.select;
    mock.select = vi.fn(() => createChainableMock({
      eq: createChainableMock({
        order: () => Promise.resolve({ data, error })
      })
    }));
  }

  if (options.delete !== undefined) {
    const { error = null } = options.delete;
    mock.delete = vi.fn(() => createChainableMock({
      eq: () => Promise.resolve({ data: null, error })
    }));
  }

  if (options.insert !== undefined) {
    const { data = null, error = null } = options.insert;
    mock.insert = vi.fn(() => Promise.resolve({ data, error }));
  }

  if (options.update !== undefined) {
    const { data = null, error = null } = options.update;
    mock.update = vi.fn(() => createChainableMock({
      eq: createChainableMock({
        select: () => Promise.resolve({ data, error })
      })
    }));
  }

  if (options.upsert !== undefined) {
    const { data = null, error = null } = options.upsert;
    mock.upsert = vi.fn(() => Promise.resolve({ data, error }));
  }

  return mock;
}

/**
 * Creates a mock that returns different results based on table name
 *
 * @param tableMocks - Map of table names to their mock configurations
 *
 * @example
 * vi.mocked(supabase.from).mockImplementation(
 *   createTableRouter({
 *     'watering_records': createTableMock({ select: { data: mockRecords } }),
 *     'plants': createTableMock({ select: { data: mockPlants } })
 *   })
 * );
 */
export function createTableRouter(tableMocks: Record<string, any>) {
  return (tableName: string) => {
    return tableMocks[tableName] || createTableMock();
  };
}

/**
 * Creates a controllable promise for testing async operations
 * Useful for testing loading states and race conditions
 *
 * @returns Object with promise and resolve function
 *
 * @example
 * const { promise, resolve } = createControllablePromise();
 * vi.mocked(supabase.from).mockReturnValue({
 *   select: () => ({ eq: () => ({ order: () => promise }) })
 * });
 *
 * // Later in test:
 * resolve({ data: mockData, error: null });
 */
export function createControllablePromise<T = QueryResult>() {
  let resolveFn: (value: T) => void;
  let rejectFn: (error: any) => void;

  const promise = new Promise<T>((resolve, reject) => {
    resolveFn = resolve;
    rejectFn = reject;
  });

  return {
    promise,
    resolve: (value: T) => resolveFn(value),
    reject: (error: any) => rejectFn(error)
  };
}
