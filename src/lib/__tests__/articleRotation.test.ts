import { describe, it, expect } from 'vitest';
import { pickRotatingPosts, type RotationCandidate } from '../articleRotation';
import type { BlogPost } from '@/types/blogTypes';

const NOW = new Date('2026-11-18T12:00:00Z');

const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000).toISOString();

const candidate = (id: string, plantKey: string, ageDays: number, relevance = 0.9): RotationCandidate => ({
  post: {
    id,
    title: id,
    url: `https://example.com/${id}`,
    summary: null,
    image_url: null,
    source_name: 'Test',
    source_url: 'https://example.com',
    published_at: daysAgo(ageDays),
    fetched_at: daysAgo(ageDays),
    categories: [],
    is_seasonal: false,
    season: null,
    is_general: false,
  } satisfies BlogPost,
  relevance,
  plantKey,
});

const pool = Array.from({ length: 40 }, (_, i) =>
  candidate(`post-${i}`, ['Pothos', 'ZZ Plant', 'Monstera', 'Rubber Plant'][i % 4], i * 10)
);

const ids = (picked: RotationCandidate[]) => picked.map((c) => c.post.id);

describe('pickRotatingPosts', () => {
  it('returns the same picks for the same day', () => {
    const a = pickRotatingPosts(pool, { limit: 12, seed: '2026-11-18', now: NOW });
    const b = pickRotatingPosts(pool, { limit: 12, seed: '2026-11-18', now: NOW });
    expect(ids(a)).toEqual(ids(b));
  });

  it('changes the picks from one day to the next', () => {
    const today = pickRotatingPosts(pool, { limit: 12, seed: '2026-11-18', now: NOW });
    const tomorrow = pickRotatingPosts(pool, { limit: 12, seed: '2026-11-19', now: NOW });
    expect(ids(today)).not.toEqual(ids(tomorrow));
  });

  it('rotates through more than the top few posts over a couple of weeks', () => {
    const seen = new Set<string>();
    for (let day = 1; day <= 14; day++) {
      const seed = `2026-11-${String(day).padStart(2, '0')}`;
      ids(pickRotatingPosts(pool, { limit: 12, seed, now: NOW })).forEach((id) => seen.add(id));
    }
    expect(seen.size).toBeGreaterThan(20);
  });

  it('caps how many posts one plant gets when others have posts too', () => {
    const lopsided = [
      ...Array.from({ length: 20 }, (_, i) => candidate(`pothos-${i}`, 'Pothos', i)),
      ...Array.from({ length: 5 }, (_, i) => candidate(`zz-${i}`, 'ZZ Plant', 200 + i)),
      ...Array.from({ length: 5 }, (_, i) => candidate(`fig-${i}`, 'Rubber Plant', 200 + i)),
    ];
    const picked = pickRotatingPosts(lopsided, { limit: 9, seed: '2026-11-18', now: NOW, perPlantCap: 3 });
    expect(picked).toHaveLength(9);
    expect(picked.filter((c) => c.plantKey === 'Pothos')).toHaveLength(3);
  });

  it('fills the row past the cap when there is only one plant', () => {
    const single = Array.from({ length: 10 }, (_, i) => candidate(`pothos-${i}`, 'Pothos', i));
    expect(pickRotatingPosts(single, { limit: 8, seed: 'x', now: NOW })).toHaveLength(8);
  });

  it('returns picks newest first', () => {
    const picked = pickRotatingPosts(pool, { limit: 12, seed: '2026-11-18', now: NOW });
    const times = picked.map((c) => new Date(c.post.published_at!).getTime());
    expect(times).toEqual([...times].sort((a, b) => b - a));
  });

  it('favors recent posts over old ones', () => {
    const mixed = [
      ...Array.from({ length: 20 }, (_, i) => candidate(`new-${i}`, `p${i}`, i)),
      ...Array.from({ length: 20 }, (_, i) => candidate(`old-${i}`, `q${i}`, 900 + i)),
    ];
    const picked = pickRotatingPosts(mixed, { limit: 10, seed: '2026-11-18', now: NOW });
    expect(picked.filter((c) => c.post.id.startsWith('new-')).length).toBeGreaterThanOrEqual(8);
  });
});
