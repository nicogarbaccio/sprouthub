/**
 * Unit tests for useDismissedSuggestions: how long a dismissal lasts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDismissedSuggestions } from '../useDismissedSuggestions';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}));

const DAY_MS = 24 * 60 * 60 * 1000;

describe('useDismissedSuggestions', () => {
  const upsert = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.mocked(supabase.auth.getUser).mockResolvedValue({
      data: { user: { id: 'user-1' } },
    } as never);
    upsert.mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue({
      select: () => ({ eq: () => ({ gt: () => Promise.resolve({ data: [], error: null }) }) }),
      upsert,
    } as never);
  });

  async function renderReady() {
    const { result } = renderHook(() => useDismissedSuggestions());
    // The user id loads asynchronously; dismissals only reach the database once it's known
    await waitFor(() => expect(supabase.from).toHaveBeenCalled());
    return result;
  }

  function savedExpiryDays(): number {
    const rows = upsert.mock.calls[0][0] as Array<{ dismissed_at: string; expires_at: string }>;
    const { dismissed_at, expires_at } = rows[0];
    return (new Date(expires_at).getTime() - new Date(dismissed_at).getTime()) / DAY_MS;
  }

  it('dismisses for 30 days by default', async () => {
    const result = await renderReady();

    await act(() => result.current.dismissSuggestions(['plant-1']));

    expect(savedExpiryDays()).toBe(30);
  });

  it('snoozes for the given number of days', async () => {
    const result = await renderReady();

    await act(() => result.current.dismissSuggestions(['plant-1', 'plant-2'], 'user_dismissed', 7));

    expect(savedExpiryDays()).toBe(7);
    expect(upsert.mock.calls[0][0]).toHaveLength(2);
    expect(result.current.dismissedPlantIds).toEqual(new Set(['plant-1', 'plant-2']));
  });
});
