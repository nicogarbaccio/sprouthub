import { ExternalLink, Leaf, Bookmark, BookmarkCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BlogPost } from '@/types/blogTypes';
import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSavedArticleIds, useToggleSavedArticle } from '@/hooks/useSavedArticles';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/** Proxy an external image through Supabase Edge Function to bypass hotlink protection */
function proxyImageUrl(url: string): string {
  if (url.includes('cloudinary.com') || url.includes('supabase.co')) return url;
  return `${SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(url)}`;
}

interface BlogPostCardProps {
  post: BlogPost;
  matchedPlants?: string[];
}

const BlogPostCard = ({ post, matchedPlants }: BlogPostCardProps) => {
  const [imgFailed, setImgFailed] = React.useState(false);
  const { user } = useAuth();
  const { data: savedIds } = useSavedArticleIds();
  const { mutate: toggleSave, isPending } = useToggleSavedArticle();

  const isSaved = savedIds?.has(post.id) ?? false;

  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const imageUrl = post.image_url ? proxyImageUrl(post.image_url) : null;
  const showPlaceholder = !imageUrl || imgFailed;
  const visiblePlants = matchedPlants?.slice(0, 2);

  return (
    <Card className="h-full overflow-hidden border-0 shadow-md [@media(hover:hover)]:hover:shadow-lg [@media(hover:hover)]:hover:-translate-y-0.5 transition-all duration-300 flex flex-col relative group" data-testid="blog-post-card">
      <div className="relative">
        {showPlaceholder ? (
          <div className="aspect-[16/9] overflow-hidden bg-sprout-pale/50 dark:bg-sprout-medium/20 flex items-center justify-center">
            <Leaf className="w-10 h-10 text-sprout-primary/30 dark:text-sprout-cream/20" />
          </div>
        ) : (
          <div className="aspect-[16/9] overflow-hidden">
            <img
              src={imageUrl!}
              alt={post.title}
              className="w-full h-full object-cover transition-transform [@media(hover:hover)]:group-hover:scale-105"
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
          </div>
        )}
        {user && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              toggleSave({ blogPostId: post.id, wasSaved: isSaved });
            }}
            disabled={isPending}
            className="absolute top-2 right-2 z-10 p-1.5 rounded-full bg-background shadow-md hover:bg-background/90 transition-colors disabled:opacity-50"
            aria-label={isSaved ? 'Unsave article' : 'Save article'}
          >
            {isSaved ? (
              <BookmarkCheck className="h-5 w-5 text-sprout-primary" />
            ) : (
              <Bookmark className="h-5 w-5 text-muted-foreground" />
            )}
          </button>
        )}
        {visiblePlants && visiblePlants.length > 0 && (
          <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
            {visiblePlants.map((name) => (
              <Badge
                key={name}
                variant="secondary"
                className="text-[10px] px-1.5 py-0 bg-background/90 backdrop-blur-sm shadow-sm"
              >
                {name}
              </Badge>
            ))}
            {matchedPlants!.length > 2 && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 bg-background/90 backdrop-blur-sm shadow-sm"
              >
                +{matchedPlants!.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
      <CardContent className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-1.5 [@media(hover:hover)]:group-hover:text-primary transition-colors">
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="after:absolute after:inset-0"
          >
            {post.title}
          </a>
        </h3>
        {post.summary && (
          <p className="text-xs text-muted-foreground line-clamp-3 mb-2">
            {post.summary}
          </p>
        )}
        <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground mt-auto">
          <span className="flex items-center gap-1 min-w-0">
            <span className="truncate">{post.source_name}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </span>
          {formattedDate && <span className="shrink-0">{formattedDate}</span>}
        </div>
      </CardContent>
    </Card>
  );
};

export default BlogPostCard;
