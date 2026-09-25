import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, Leaf, Bookmark, BookmarkCheck, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BlogPost } from '@/types/blogTypes';
import * as React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSavedArticleIds, useToggleSavedArticle } from '@/hooks/useSavedArticles';
import { useHideArticle } from '@/hooks/useHiddenArticles';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/** Proxy an external image through Supabase Edge Function to bypass hotlink protection */
function proxyImageUrl(url: string): string {
  if (url.includes('cloudinary.com') || url.includes('supabase.co')) return url;
  return `${SUPABASE_URL}/functions/v1/image-proxy?url=${encodeURIComponent(url)}`;
}

export type BlogPostCardTone = 'surface' | 'cream' | 'water' | 'terracotta' | 'forest';

interface BlogPostCardProps {
  post: BlogPost;
  matchedPlants?: string[];
  showHideButton?: boolean;
  /** Bento tile colour. Coloured tones drop the summary so the title carries the card. */
  tone?: BlogPostCardTone;
  /** `card` is the default tile; `feature` is the large hero; `row` is a compact list row */
  variant?: 'card' | 'feature' | 'row';
}

const TONE_CLASSES: Record<BlogPostCardTone, string> = {
  surface: 'bg-card text-foreground',
  cream: 'bg-sprout-cream text-sprout-dark',
  water: 'bg-sprout-water text-sprout-dark',
  terracotta: 'bg-sprout-warning text-sprout-dark',
  forest: 'bg-sprout-primary text-sprout-cream',
};

const BlogPostCard = ({
  post,
  matchedPlants,
  showHideButton = true,
  tone = 'surface',
  variant = 'card',
}: BlogPostCardProps) => {
  const [imgFailed, setImgFailed] = React.useState(false);
  const { user } = useAuth();
  const { data: savedIds } = useSavedArticleIds();
  const { mutate: toggleSave, isPending } = useToggleSavedArticle();
  const { mutate: hideArticle, isPending: isHidePending } = useHideArticle();

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

  const isRow = variant === 'row';
  const isFeature = variant === 'feature';
  const isSurface = tone === 'surface';
  const eyebrow = visiblePlants?.[0] ?? (isFeature ? (post.is_seasonal ? 'Seasonal' : null) : null);

  const saveButton = user && (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleSave({ blogPostId: post.id, wasSaved: isSaved });
      }}
      disabled={isPending}
      className={cn(
        'z-10 rounded-full bg-card text-foreground shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center',
        isRow ? 'relative w-10 h-10 shrink-0' : 'absolute top-2 right-2 w-9 h-9'
      )}
      aria-label={isSaved ? 'Unsave article' : 'Save article'}
    >
      {isSaved ? (
        <BookmarkCheck className="h-[18px] w-[18px] text-link" />
      ) : (
        <Bookmark className="h-[18px] w-[18px] text-muted-foreground" />
      )}
    </button>
  );

  const hideButton = user && showHideButton && !isSaved && (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        hideArticle({ blogPostId: post.id });
      }}
      disabled={isHidePending}
      className="absolute top-2 left-2 z-10 w-8 h-8 rounded-full bg-card/80 shadow-sm hover:bg-card transition-colors disabled:opacity-50 flex items-center justify-center"
      aria-label="Hide article"
    >
      <EyeOff className="h-4 w-4 text-muted-foreground" />
    </button>
  );

  const image = showPlaceholder ? (
    <div
      className={cn(
        'w-full h-full flex items-center justify-center',
        isSurface ? 'bg-field' : 'bg-sprout-dark/10'
      )}
    >
      <Leaf className={cn('w-8 h-8', isSurface ? 'text-muted-foreground/40' : 'opacity-30')} />
    </div>
  ) : (
    <img
      src={imageUrl!}
      alt={post.title}
      className="w-full h-full object-cover transition-transform [@media(hover:hover)]:group-hover:scale-105"
      loading="lazy"
      onError={() => setImgFailed(true)}
    />
  );

  const titleLink = (
    <a
      href={post.url}
      target="_blank"
      rel="noopener noreferrer"
      className="after:absolute after:inset-0 [@media(hover:hover)]:group-hover:underline underline-offset-2"
    >
      {post.title}
    </a>
  );

  if (isRow) {
    return (
      <div
        className={cn('relative group flex items-center gap-3 p-2 rounded-3xl', TONE_CLASSES[tone])}
        data-testid="blog-post-card"
      >
        <div className="w-[76px] h-[76px] shrink-0 rounded-[18px] overflow-hidden">{image}</div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold leading-tight line-clamp-2">{titleLink}</h3>
          <div className="flex items-center gap-1 text-[13px] text-muted-foreground mt-1 min-w-0">
            <span className="truncate">{post.source_name}</span>
            {formattedDate && <span className="shrink-0">· {formattedDate}</span>}
          </div>
        </div>
        {saveButton}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'h-full relative group flex flex-col p-2',
        isFeature ? 'rounded-tile' : 'rounded-card',
        TONE_CLASSES[tone]
      )}
      data-testid="blog-post-card"
    >
      <div
        className={cn(
          'relative overflow-hidden',
          isFeature ? 'h-[190px] md:h-[240px] lg:h-auto lg:min-h-[240px] lg:flex-1 rounded-3xl' : 'aspect-[16/10] rounded-well'
        )}
      >
        {image}
        {saveButton}
        {hideButton}
        {isFeature && eyebrow && (
          <span className="absolute bottom-2.5 left-2.5 text-xs font-bold px-2.5 py-[5px] rounded-full bg-sprout-cream text-sprout-dark">
            {eyebrow}
          </span>
        )}
      </div>
      <div className={cn('flex flex-col', isFeature ? 'px-3 pt-3.5 pb-3 lg:flex-none' : 'flex-1 px-1.5 pt-2.5 pb-1.5')}>
        {!isFeature && visiblePlants && visiblePlants.length > 0 && (
          <div
            className="flex gap-1.5 text-xs font-bold uppercase tracking-[0.8px] min-w-0 overflow-hidden"
            data-testid="matched-plants"
          >
            {visiblePlants.map((name) => (
              <span key={name} className="truncate" data-testid="matched-plant">{name}</span>
            ))}
            {matchedPlants!.length > 2 && <span>+{matchedPlants!.length - 2}</span>}
          </div>
        )}
        <h3
          className={cn(
            'leading-tight line-clamp-3 mt-0.5',
            isFeature
              ? 'font-display text-xl md:text-2xl font-bold tracking-[-0.02em] text-pretty'
              : 'text-base font-bold'
          )}
        >
          {titleLink}
        </h3>
        {isSurface && !isFeature && post.summary && (
          <p className="text-[13px] text-muted-foreground line-clamp-2 mt-1.5">{post.summary}</p>
        )}
        <div
          className={cn(
            'flex items-center justify-between gap-3 text-xs font-semibold mt-auto pt-2',
            isSurface ? 'text-muted-foreground' : 'opacity-80'
          )}
        >
          <span className="flex items-center gap-1 min-w-0">
            <span className="truncate">{post.source_name}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </span>
          {formattedDate && <span className="shrink-0">{formattedDate}</span>}
        </div>
      </div>
    </div>
  );
};

export default BlogPostCard;

/** Loading placeholder shaped like a BlogPostCard */
export const BlogPostCardSkeleton = () => (
  <div className="rounded-card bg-card overflow-hidden p-2">
    <Skeleton className="aspect-[16/9] w-full rounded-well" />
    <div className="p-3 space-y-2">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-2/3" />
      <div className="flex justify-between pt-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-3 w-16" />
      </div>
    </div>
  </div>
);
