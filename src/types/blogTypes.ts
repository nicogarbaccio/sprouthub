export interface BlogPost {
  id: string;
  title: string;
  url: string;
  summary: string | null;
  image_url: string | null;
  source_name: string;
  source_url: string;
  published_at: string | null;
  fetched_at: string;
  categories: string[];
  is_seasonal: boolean;
  season: 'spring' | 'summer' | 'fall' | 'winter' | null;
  is_general: boolean;
}

export interface SavedArticle {
  id: string;
  user_id: string;
  blog_post_id: string;
  created_at: string;
}
