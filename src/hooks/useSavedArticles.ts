import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import type { BlogPost } from '@/types/blogTypes';
import type { BlogPostWithPlants } from '@/hooks/useBlogPosts';

const SAVED_IDS_KEY = ['saved-articles', 'ids'] as const;
const SAVED_FULL_KEY = ['saved-articles', 'full'] as const;

/** Returns a Set of saved blog_post_ids for the current user (lightweight, cached). */
export function useSavedArticleIds() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...SAVED_IDS_KEY, user?.id],
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from('saved_articles')
        .select('blog_post_id')
        .eq('user_id', user!.id);

      if (error) throw error;
      return new Set(data.map((r) => r.blog_post_id));
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
}

/** Returns full BlogPostWithPlants[] for saved articles (used by My Articles page). */
export function useSavedArticles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...SAVED_FULL_KEY, user?.id],
    queryFn: async (): Promise<BlogPostWithPlants[]> => {
      const { data, error } = await supabase
        .from('saved_articles')
        .select('blog_post_id, created_at, blog_posts(*)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const posts = data
        .map((row) => row.blog_posts as unknown as BlogPost | null)
        .filter((post): post is BlogPost => post !== null);

      if (posts.length === 0) return [];

      // Fetch the user's plant types and plant tags in parallel
      const postIds = posts.map((p) => p.id);
      const [{ data: userPlants }, { data: plantData }] = await Promise.all([
        supabase
          .from('user_plants')
          .select('plant_type')
          .eq('user_id', user!.id),
        supabase
          .from('blog_post_plants')
          .select('blog_post_id, plant_name')
          .in('blog_post_id', postIds),
      ]);

      // Build a set of the user's plant types (lowercased) for matching
      const myPlantTypes = new Set(
        (userPlants ?? [])
          .map((p) => p.plant_type?.toLowerCase())
          .filter(Boolean) as string[]
      );

      // For each post's tags, find which of the user's plants match and show
      // the user's plant name (not the tag name), matching the "For Your Plants" behavior
      const plantMap = new Map<string, string[]>();
      for (const row of plantData ?? []) {
        if (!row.plant_name) continue;
        const tagLower = row.plant_name.toLowerCase();
        for (const pt of myPlantTypes) {
          // Only match if the user's plant type equals or contains the tag
          // (e.g. user has "Peperomia" → matches tag "Peperomia" but NOT "Watermelon Peperomia")
          if (tagLower === pt || tagLower.includes(pt)) {
            const existing = plantMap.get(row.blog_post_id) ?? [];
            // Store the user's plant type name (title-cased from the original list)
            const originalName = (userPlants ?? []).find(
              (p) => p.plant_type?.toLowerCase() === pt
            )?.plant_type;
            if (originalName && !existing.includes(originalName)) {
              existing.push(originalName);
              plantMap.set(row.blog_post_id, existing);
            }
            break;
          }
        }
      }

      return posts.map((post) => ({
        ...post,
        matchedPlants: plantMap.get(post.id) ?? [],
      }));
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 60,
  });
}

/** Toggle save/unsave for a blog post. Optimistic update on the IDs set. */
export function useToggleSavedArticle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ blogPostId, wasSaved }: { blogPostId: string; wasSaved: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      if (wasSaved) {
        // Unsave
        const { error } = await supabase
          .from('saved_articles')
          .delete()
          .eq('user_id', user.id)
          .eq('blog_post_id', blogPostId);
        if (error) throw error;
        return { action: 'unsaved' as const };
      } else {
        // Save
        const { error } = await supabase
          .from('saved_articles')
          .insert({ user_id: user.id, blog_post_id: blogPostId });
        if (error) throw error;
        return { action: 'saved' as const };
      }
    },

    onMutate: async ({ blogPostId }: { blogPostId: string; wasSaved: boolean }) => {
      if (!user) return;

      // Cancel in-flight queries
      await queryClient.cancelQueries({ queryKey: [...SAVED_IDS_KEY, user.id] });

      // Snapshot previous value
      const previousIds = queryClient.getQueryData<Set<string>>([
        ...SAVED_IDS_KEY,
        user.id,
      ]);

      // Optimistic update
      queryClient.setQueryData<Set<string>>(
        [...SAVED_IDS_KEY, user.id],
        (old) => {
          const next = new Set(old);
          if (next.has(blogPostId)) {
            next.delete(blogPostId);
          } else {
            next.add(blogPostId);
          }
          return next;
        }
      );

      return { previousIds };
    },

    onError: (_err, _vars, context) => {
      // Rollback optimistic update
      if (context?.previousIds && user) {
        queryClient.setQueryData([...SAVED_IDS_KEY, user.id], context.previousIds);
      }
      toast.error('Failed to update saved articles');
    },

    onSuccess: (result) => {
      if (result.action === 'saved') {
        toast.success('Article saved');
      } else {
        toast.success('Article removed from saved');
      }
    },

    onSettled: () => {
      if (!user) return;
      // Refetch both queries to ensure consistency
      queryClient.invalidateQueries({ queryKey: [...SAVED_IDS_KEY, user.id] });
      queryClient.invalidateQueries({ queryKey: [...SAVED_FULL_KEY, user.id] });
    },
  });
}
