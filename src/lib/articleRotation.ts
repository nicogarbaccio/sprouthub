import type { BlogPost } from '@/types/blogTypes';

/** A post that matched one of the user's plants, with how strongly it matched (0–1). */
export interface RotationCandidate {
  post: BlogPost;
  relevance: number;
  /** The user's plant this post is about, used to keep one plant from filling the row */
  plantKey: string;
}

/** A post's weight halves every this many days, so new articles surface first */
const FRESHNESS_HALF_LIFE_DAYS = 60;
/** Old evergreen guides still get an occasional turn */
const MIN_FRESHNESS = 0.1;

/** Stable 32-bit hash so the same day always yields the same picks */
function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Deterministic 0–1 value for a post on a given day */
function seededUnit(seed: string, id: string): number {
  // Avoid exactly 0, which would break the weighted-sampling key below
  return (hashString(`${seed}:${id}`) + 1) / 4294967297;
}

function freshness(post: BlogPost, now: Date): number {
  const published = new Date(post.published_at ?? post.fetched_at).getTime();
  const ageDays = Math.max(0, (now.getTime() - published) / 86_400_000);
  return Math.max(MIN_FRESHNESS, 0.5 ** (ageDays / FRESHNESS_HALF_LIFE_DAYS));
}

/**
 * Picks `limit` posts that change from day to day: a weighted random draw (favoring
 * relevant, recent posts) seeded by `seed`, capped at `perPlantCap` posts per plant,
 * returned newest first.
 */
export function pickRotatingPosts(
  candidates: RotationCandidate[],
  { limit, seed, now = new Date(), perPlantCap = 3 }: {
    limit: number;
    seed: string;
    now?: Date;
    perPlantCap?: number;
  }
): RotationCandidate[] {
  // Weighted sampling without replacement (Efraimidis–Spirakis): key = u^(1/w)
  const ranked = candidates
    .map((c) => {
      const weight = Math.max(c.relevance, 0.01) * freshness(c.post, now);
      return { c, key: seededUnit(seed, c.post.id) ** (1 / weight) };
    })
    .sort((a, b) => b.key - a.key)
    .map(({ c }) => c);

  const picked: RotationCandidate[] = [];
  const overflow: RotationCandidate[] = [];
  const perPlant = new Map<string, number>();

  for (const c of ranked) {
    if (picked.length >= limit) break;
    const count = perPlant.get(c.plantKey) ?? 0;
    if (count >= perPlantCap) {
      overflow.push(c);
      continue;
    }
    perPlant.set(c.plantKey, count + 1);
    picked.push(c);
  }

  // With only a plant or two, the cap would leave the row short; fill it back up
  for (const c of overflow) {
    if (picked.length >= limit) break;
    picked.push(c);
  }

  return picked.sort(
    (a, b) =>
      new Date(b.post.published_at ?? b.post.fetched_at).getTime() -
      new Date(a.post.published_at ?? a.post.fetched_at).getTime()
  );
}
