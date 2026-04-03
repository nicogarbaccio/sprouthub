import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BlogPost } from '@/types/blogTypes';

export function usePlantBlogPosts(plantName: string | undefined) {
  return useQuery({
    queryKey: ['blog-posts', 'plant', plantName],
    queryFn: async (): Promise<BlogPost[]> => {
      if (!plantName) return [];

      // Partial match on plant_name in junction table
      const { data, error } = await supabase
        .from('blog_post_plants')
        .select('relevance_score, blog_posts(*)')
        .ilike('plant_name', `%${plantName}%`)
        .order('relevance_score', { ascending: false })
        .limit(6);

      if (error) throw error;

      const seen = new Set<string>();
      const posts = (data ?? [])
        .map((row) => row.blog_posts as unknown as BlogPost)
        .filter((post) => {
          if (!post || seen.has(post.id)) return false;
          seen.add(post.id);
          return true;
        });

      if (posts.length >= 3) return posts;

      // Fallback: search post titles/summaries directly
      const { data: searchData, error: searchError } = await supabase
        .from('blog_posts')
        .select('*')
        .or(`title.ilike.%${plantName}%,summary.ilike.%${plantName}%`)
        .order('published_at', { ascending: false })
        .limit(6);

      if (searchError) throw searchError;

      for (const post of (searchData ?? []) as unknown as BlogPost[]) {
        if (!seen.has(post.id)) {
          posts.push(post);
          seen.add(post.id);
        }
      }

      return posts.slice(0, 6);
    },
    enabled: !!plantName,
    staleTime: 1000 * 60 * 60,
  });
}

export function useGeneralBlogPosts(limit = 10) {
  return useQuery({
    queryKey: ['blog-posts', 'general', limit],
    queryFn: async (): Promise<BlogPost[]> => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_general', true)
        .order('published_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data ?? []) as unknown as BlogPost[];
    },
    staleTime: 1000 * 60 * 60,
  });
}

export interface BlogPostWithPlants extends BlogPost {
  matchedPlants: string[];
}

export function useMyPlantsBlogPosts(plantNames: string[]) {
  return useQuery({
    queryKey: ['blog-posts', 'my-plants', plantNames],
    queryFn: async (): Promise<BlogPostWithPlants[]> => {
      if (plantNames.length === 0) return [];

      // First try the pre-computed junction table.
      // Use ilike per plant name so "Monstera" matches "Monstera Deliciosa", etc.
      const ilikeFilters = plantNames.map((n) => `plant_name.ilike.%${n}%`).join(',');
      const { data: junctionData, error: junctionError } = await supabase
        .from('blog_post_plants')
        .select('relevance_score, plant_name, blog_posts(*)')
        .or(ilikeFilters)
        .order('relevance_score', { ascending: false })
        .limit(12);

      if (junctionError) throw junctionError;

      const seen = new Set<string>();
      const plantMap = new Map<string, string[]>();
      const posts: BlogPost[] = [];

      for (const row of junctionData ?? []) {
        const post = row.blog_posts as unknown as BlogPost;
        if (!post) continue;

        // Track matched plants per post
        const existing = plantMap.get(post.id) ?? [];
        if (row.plant_name) existing.push(row.plant_name);
        plantMap.set(post.id, existing);

        if (!seen.has(post.id)) {
          seen.add(post.id);
          posts.push(post);
        }
      }

      // Find user plants with no junction table matches
      const junctionMatchedSet = new Set<string>();
      for (const names of plantMap.values()) {
        for (const name of names) junctionMatchedSet.add(name.toLowerCase());
      }
      const unmatchedPlants = plantNames.filter((n) => {
        const nLower = n.toLowerCase();
        return ![...junctionMatchedSet].some(
          (jn) => jn.includes(nLower) || nLower.includes(jn)
        );
      });

      if (unmatchedPlants.length > 0 || posts.length < 3) {
        // Fallback: search post titles/summaries for plant names directly,
        // plus broad indoor/houseplant terms since most user plants are houseplants.
        // For unmatched plants, also search by genus (first word if >= 6 chars)
        // so e.g. "Monstera Deliciosa" finds posts about any Monstera species.
        const searchPlants = unmatchedPlants.length > 0 ? unmatchedPlants : plantNames;
        const nameFilters = searchPlants.flatMap((name) => {
          const filters = [
            `title.ilike.%${name}%`,
            `summary.ilike.%${name}%`,
          ];
          const firstWord = name.split(/[\s''']/)[0];
          if (firstWord.length >= 6 && firstWord !== name) {
            filters.push(`title.ilike.%${firstWord}%`, `summary.ilike.%${firstWord}%`);
          }
          return filters;
        });
        const broadFilters = [
          'title.ilike.%houseplant%',
          'title.ilike.%house plant%',
          'title.ilike.%indoor plant%',
          'summary.ilike.%houseplant%',
          'summary.ilike.%house plant%',
          'summary.ilike.%indoor plant%',
        ];
        const orFilters = [...nameFilters, ...broadFilters].join(',');

        const { data: searchData, error: searchError } = await supabase
          .from('blog_posts')
          .select('*')
          .or(orFilters)
          .order('published_at', { ascending: false })
          .limit(12);

        if (searchError) throw searchError;

        for (const post of (searchData ?? []) as unknown as BlogPost[]) {
          if (!seen.has(post.id)) {
            posts.push(post);
            seen.add(post.id);
            // Text-match fallback: check which plant names appear in content,
            // also matching by genus (first word) for multi-word plant names
            const text = `${post.title} ${post.summary ?? ''}`.toLowerCase();
            const matched = plantNames.filter((n) => {
              if (text.includes(n.toLowerCase())) return true;
              const firstWord = n.split(/[\s''']/)[0];
              return firstWord.length >= 6 && firstWord !== n && text.includes(firstWord.toLowerCase());
            });
            if (matched.length > 0) plantMap.set(post.id, matched);
          }
        }
      }

      return posts.slice(0, 12).map((post) => ({
        ...post,
        matchedPlants: plantMap.get(post.id) ?? [],
      }));
    },
    enabled: plantNames.length > 0,
    staleTime: 1000 * 60 * 60,
  });
}

export function useSeasonalBlogPosts(season: string | null) {
  return useQuery({
    queryKey: ['blog-posts', 'seasonal', season],
    queryFn: async (): Promise<BlogPost[]> => {
      if (!season) return [];

      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('is_seasonal', true)
        .eq('season', season)
        .order('published_at', { ascending: false })
        .limit(8);

      if (error) throw error;
      return (data ?? []) as unknown as BlogPost[];
    },
    enabled: !!season,
    staleTime: 1000 * 60 * 60,
  });
}
