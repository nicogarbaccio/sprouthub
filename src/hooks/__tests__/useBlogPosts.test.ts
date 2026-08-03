import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { supabase } from '@/integrations/supabase/client';
import {
  usePlantBlogPosts,
  useGeneralBlogPosts,
  useSeasonalBlogPosts,
  useMyPlantsBlogPosts,
} from '../useBlogPosts';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

// Mock react-query to run queries synchronously in tests
vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(({ queryFn, enabled }) => {
    if (enabled === false) {
      return { data: undefined, isLoading: false, error: null };
    }

    // We'll track the result via a synchronous call
    let data: unknown = undefined;
    let error: unknown = null;
    let isLoading = true;

    try {
      // queryFn returns a promise; we can't await in mock, so we return loading state
      // Instead, let's use a different approach: execute and capture
      const promise = queryFn();
      // For testing, we set up mocks to resolve synchronously where possible
      // Store the promise for the test to await
      return {
        data: undefined,
        isLoading: true,
        error: null,
        _promise: promise,
      };
    } catch (e) {
      return { data: undefined, isLoading: false, error: e };
    }
  }),
}));

// Helper to build a mock chain for supabase queries
function mockSupabaseChain(finalResult: { data: unknown; error: unknown }) {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.ilike = vi.fn().mockReturnValue(chain);
  chain.in = vi.fn().mockReturnValue(chain);
  chain.or = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockResolvedValue(finalResult);

  vi.mocked(supabase.from).mockReturnValue(chain as any);
  return chain;
}

const makeBlogPost = (id: string, title: string) => ({
  id,
  title,
  url: `https://example.com/${id}`,
  summary: `Summary for ${title}`,
  image_url: null,
  source_name: 'Test Source',
  source_url: 'https://example.com',
  published_at: '2025-06-15T00:00:00Z',
  fetched_at: '2025-06-16T00:00:00Z',
  categories: [],
  is_seasonal: false,
  season: null,
  is_general: true,
});

describe('useBlogPosts hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('useSeasonalBlogPosts', () => {
    it('should query blog_posts with seasonal filters', () => {
      const chain = mockSupabaseChain({ data: [], error: null });

      renderHook(() => useSeasonalBlogPosts('spring'));

      // The hook should call from('blog_posts')
      expect(supabase.from).toHaveBeenCalledWith('blog_posts');
      expect(chain.eq).toHaveBeenCalledWith('is_seasonal', true);
      expect(chain.eq).toHaveBeenCalledWith('season', 'spring');
    });

    it('should not query when season is null', () => {
      renderHook(() => useSeasonalBlogPosts(null));

      // enabled: false means useQuery won't run queryFn
      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('useGeneralBlogPosts', () => {
    it('should query blog_posts with is_general filter', () => {
      const chain = mockSupabaseChain({ data: [], error: null });

      renderHook(() => useGeneralBlogPosts(10));

      expect(supabase.from).toHaveBeenCalledWith('blog_posts');
      expect(chain.eq).toHaveBeenCalledWith('is_general', true);
      expect(chain.limit).toHaveBeenCalledWith(10);
    });
  });

  describe('usePlantBlogPosts', () => {
    it('should search blog_post_plants with ilike wildcard', () => {
      const chain = mockSupabaseChain({
        data: [
          { relevance_score: 0.9, blog_posts: makeBlogPost('p1', 'Monstera Care') },
          { relevance_score: 0.8, blog_posts: makeBlogPost('p2', 'Monstera Guide') },
          { relevance_score: 0.7, blog_posts: makeBlogPost('p3', 'Monstera Tips') },
        ],
        error: null,
      });

      renderHook(() => usePlantBlogPosts('Monstera'));

      expect(supabase.from).toHaveBeenCalledWith('blog_post_plants');
      expect(chain.ilike).toHaveBeenCalledWith('plant_name', '%Monstera%');
    });

    it('should not query when plantName is undefined', () => {
      renderHook(() => usePlantBlogPosts(undefined));

      expect(supabase.from).not.toHaveBeenCalled();
    });
  });

  describe('useMyPlantsBlogPosts', () => {
    it('should query blog_post_plants with plant names using OR ilike filters', () => {
      const chain = mockSupabaseChain({
        data: [
          {
            relevance_score: 0.9,
            plant_name: 'Monstera',
            blog_posts: makeBlogPost('p1', 'Monstera Care'),
          },
        ],
        error: null,
      });

      renderHook(() => useMyPlantsBlogPosts(['Monstera', 'Pothos']));

      expect(supabase.from).toHaveBeenCalledWith('blog_post_plants');
      // The implementation builds an OR-filter with ilike partial matches for each plant name.
      expect(chain.or).toHaveBeenCalledWith(
        'plant_name.ilike.%Monstera%,plant_name.ilike.%Pothos%'
      );
    });

    it('should not query when plantNames array is empty', () => {
      renderHook(() => useMyPlantsBlogPosts([]));

      expect(supabase.from).not.toHaveBeenCalled();
    });
  });
});

describe('usePlantBlogPosts queryFn logic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should deduplicate posts from junction table', async () => {
    const post = makeBlogPost('p1', 'Monstera Care');
    const chain = mockSupabaseChain({
      data: [
        { relevance_score: 0.9, blog_posts: post },
        { relevance_score: 0.8, blog_posts: post }, // duplicate
        { relevance_score: 0.7, blog_posts: makeBlogPost('p2', 'Monstera Tips') },
        { relevance_score: 0.6, blog_posts: makeBlogPost('p3', 'Monstera Guide') },
      ],
      error: null,
    });

    const { result } = renderHook(() => usePlantBlogPosts('Monstera'));

    // The _promise from our mock contains the actual queryFn execution
    const queryResult = await (result.current as any)._promise;
    expect(queryResult).toHaveLength(3);
    expect(queryResult[0].id).toBe('p1');
    expect(queryResult[1].id).toBe('p2');
    expect(queryResult[2].id).toBe('p3');
  });

  it('should fall back to title/summary search when junction has fewer than 3 results', async () => {
    // First call: blog_post_plants returns only 2 results
    const junctionResult = {
      data: [
        { relevance_score: 0.9, blog_posts: makeBlogPost('p1', 'Peace Lily Care') },
        { relevance_score: 0.8, blog_posts: makeBlogPost('p2', 'Peace Lily Guide') },
      ],
      error: null,
    };
    // Second call: blog_posts text search returns additional results
    const searchResult = {
      data: [
        makeBlogPost('p2', 'Peace Lily Guide'), // duplicate
        makeBlogPost('p3', 'Peace Lily Tips'),
      ],
      error: null,
    };

    const chain1: Record<string, ReturnType<typeof vi.fn>> = {};
    chain1.select = vi.fn().mockReturnValue(chain1);
    chain1.ilike = vi.fn().mockReturnValue(chain1);
    chain1.or = vi.fn().mockReturnValue(chain1);
    chain1.order = vi.fn().mockReturnValue(chain1);
    chain1.limit = vi.fn()
      .mockResolvedValueOnce(junctionResult);

    const chain2: Record<string, ReturnType<typeof vi.fn>> = {};
    chain2.select = vi.fn().mockReturnValue(chain2);
    chain2.or = vi.fn().mockReturnValue(chain2);
    chain2.order = vi.fn().mockReturnValue(chain2);
    chain2.limit = vi.fn().mockResolvedValueOnce(searchResult);

    vi.mocked(supabase.from)
      .mockReturnValueOnce(chain1 as any)
      .mockReturnValueOnce(chain2 as any);

    const { result } = renderHook(() => usePlantBlogPosts('Peace Lily'));

    const queryResult = await (result.current as any)._promise;
    // Should have 3 unique posts (p1, p2, p3) with p2 deduplicated
    expect(queryResult).toHaveLength(3);
    expect(queryResult.map((p: any) => p.id)).toEqual(['p1', 'p2', 'p3']);
  });

  it('should throw when supabase returns an error', async () => {
    mockSupabaseChain({
      data: null,
      error: { message: 'Database error', code: '500' },
    });

    const { result } = renderHook(() => usePlantBlogPosts('Monstera'));

    await expect((result.current as any)._promise).rejects.toEqual({
      message: 'Database error',
      code: '500',
    });
  });
});
