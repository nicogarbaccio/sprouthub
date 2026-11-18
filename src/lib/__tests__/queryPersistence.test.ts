import { describe, it, expect } from 'vitest';
import type { Query } from '@tanstack/react-query';
import { persistOptions, clearPersistedQueries } from '../queryPersistence';

const fakeQuery = (meta: Record<string, unknown> | undefined, status: 'success' | 'error' | 'pending') =>
  ({ meta, state: { status } }) as unknown as Query;

describe('queryPersistence', () => {
  const shouldSave = persistOptions.dehydrateOptions.shouldDehydrateQuery;

  it('saves only queries that opt in', () => {
    expect(shouldSave(fakeQuery({ persist: true }, 'success'))).toBe(true);
    expect(shouldSave(fakeQuery(undefined, 'success'))).toBe(false);
    expect(shouldSave(fakeQuery({ persist: false }, 'success'))).toBe(false);
  });

  it('never saves failed or unfinished queries', () => {
    expect(shouldSave(fakeQuery({ persist: true }, 'error'))).toBe(false);
    expect(shouldSave(fakeQuery({ persist: true }, 'pending'))).toBe(false);
  });

  it('removes the saved snapshot when cleared', () => {
    localStorage.setItem('sprouthub-query-cache', '{"clientState":{}}');
    clearPersistedQueries();
    expect(localStorage.getItem('sprouthub-query-cache')).toBeNull();
  });
});
