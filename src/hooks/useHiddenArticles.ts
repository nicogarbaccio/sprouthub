import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const HIDDEN_IDS_KEY = ['hidden-articles', 'ids'] as const;

/** Returns a Set of hidden blog_post_ids for the current user (lightweight, cached). */
export function useHiddenArticleIds() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...HIDDEN_IDS_KEY, user?.id],
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from('hidden_articles')
        .select('blog_post_id')
        .eq('user_id', user!.id);

      if (error) throw error;
      return new Set(data.map((r) => r.blog_post_id));
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 60,
  });
}

/** Hide an article. Optimistic update on the IDs set. Toast with Undo action. */
export function useHideArticle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { mutate: unhide } = useUnhideArticle();

  return useMutation({
    mutationFn: async ({ blogPostId }: { blogPostId: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('hidden_articles')
        .insert({ user_id: user.id, blog_post_id: blogPostId });
      if (error) throw error;
    },

    onMutate: async ({ blogPostId }) => {
      if (!user) return;
      await queryClient.cancelQueries({ queryKey: [...HIDDEN_IDS_KEY, user.id] });

      const previousIds = queryClient.getQueryData<Set<string>>([
        ...HIDDEN_IDS_KEY,
        user.id,
      ]);

      queryClient.setQueryData<Set<string>>(
        [...HIDDEN_IDS_KEY, user.id],
        (old) => {
          const next = new Set(old);
          next.add(blogPostId);
          return next;
        }
      );

      return { previousIds };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousIds && user) {
        queryClient.setQueryData([...HIDDEN_IDS_KEY, user.id], context.previousIds);
      }
      toast.error('Failed to hide article');
    },

    onSuccess: (_data, { blogPostId }) => {
      toast('Article hidden', {
        action: {
          label: 'Undo',
          onClick: () => unhide({ blogPostId }),
        },
        duration: 5000,
      });
    },

    onSettled: () => {
      if (!user) return;
      queryClient.invalidateQueries({ queryKey: [...HIDDEN_IDS_KEY, user.id] });
      queryClient.invalidateQueries({ queryKey: [...HIDDEN_FULL_KEY, user.id] });
    },
  });
}

/** Unhide an article (used by Undo toast). Optimistic update on the IDs set. */
export function useUnhideArticle() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ blogPostId }: { blogPostId: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('hidden_articles')
        .delete()
        .eq('user_id', user.id)
        .eq('blog_post_id', blogPostId);
      if (error) throw error;
    },

    onMutate: async ({ blogPostId }) => {
      if (!user) return;
      await queryClient.cancelQueries({ queryKey: [...HIDDEN_IDS_KEY, user.id] });

      const previousIds = queryClient.getQueryData<Set<string>>([
        ...HIDDEN_IDS_KEY,
        user.id,
      ]);

      queryClient.setQueryData<Set<string>>(
        [...HIDDEN_IDS_KEY, user.id],
        (old) => {
          const next = new Set(old);
          next.delete(blogPostId);
          return next;
        }
      );

      return { previousIds };
    },

    onError: (_err, _vars, context) => {
      if (context?.previousIds && user) {
        queryClient.setQueryData([...HIDDEN_IDS_KEY, user.id], context.previousIds);
      }
      toast.error('Failed to restore article');
    },

    onSuccess: () => {
      toast.success('Article restored');
    },

    onSettled: () => {
      if (!user) return;
      queryClient.invalidateQueries({ queryKey: [...HIDDEN_IDS_KEY, user.id] });
      queryClient.invalidateQueries({ queryKey: [...HIDDEN_FULL_KEY, user.id] });
    },
  });
}

/** Restore all hidden articles at once. */
export function useRestoreAllHidden() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('hidden_articles')
        .delete()
        .eq('user_id', user.id);
      if (error) throw error;
    },

    onSuccess: () => {
      if (!user) return;
      queryClient.setQueryData<Set<string>>([...HIDDEN_IDS_KEY, user.id], new Set());
      queryClient.invalidateQueries({ queryKey: [...HIDDEN_IDS_KEY, user.id] });
      queryClient.invalidateQueries({ queryKey: [...HIDDEN_FULL_KEY, user.id] });
      toast.success('All hidden articles restored');
    },

    onError: () => {
      toast.error('Failed to restore articles');
    },
  });
}

export interface HiddenArticleEntry {
  blog_post_id: string;
  title: string;
  source_name: string | null;
}

const HIDDEN_FULL_KEY = ['hidden-articles', 'full'] as const;

/** Returns full list of hidden articles with title/source for settings management. */
export function useHiddenArticles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [...HIDDEN_FULL_KEY, user?.id],
    queryFn: async (): Promise<HiddenArticleEntry[]> => {
      const { data, error } = await supabase
        .from('hidden_articles')
        .select('blog_post_id, created_at, blog_posts(title, source_name)')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data
        .map((row) => {
          const post = row.blog_posts as unknown as { title: string; source_name: string | null } | null;
          if (!post) return null;
          return {
            blog_post_id: row.blog_post_id,
            title: post.title,
            source_name: post.source_name,
          };
        })
        .filter((entry): entry is HiddenArticleEntry => entry !== null);
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 60,
  });
}

/** Filters out hidden articles from a list. Returns undefined if input is undefined. */
export function useFilterHidden<T extends { id: string }>(posts: T[] | undefined): T[] | undefined {
  const { data: hiddenIds } = useHiddenArticleIds();

  return useMemo(() => {
    if (!posts) return undefined;
    if (!hiddenIds || hiddenIds.size === 0) return posts;
    return posts.filter((p) => !hiddenIds.has(p.id));
  }, [posts, hiddenIds]);
}
