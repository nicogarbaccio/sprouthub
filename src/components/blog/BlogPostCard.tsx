import { ExternalLink, Leaf } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { BlogPost } from '@/types/blogTypes';
import * as React from 'react';

interface BlogPostCardProps {
  post: BlogPost;
  matchedPlants?: string[];
}

const BlogPostCard = ({ post, matchedPlants }: BlogPostCardProps) => {
  const [imgFailed, setImgFailed] = React.useState(false);
  const formattedDate = post.published_at
    ? new Date(post.published_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null;

  const showPlaceholder = !post.image_url || imgFailed;
  const visiblePlants = matchedPlants?.slice(0, 2);

  return (
    <Card className="h-full overflow-hidden transition-shadow hover:shadow-md flex flex-col relative group" data-testid="blog-post-card">
      <div className="relative">
        {showPlaceholder ? (
          <div className="aspect-[16/9] overflow-hidden bg-sprout-pale/50 dark:bg-sprout-medium/20 flex items-center justify-center">
            <Leaf className="w-10 h-10 text-sprout-primary/30 dark:text-sprout-cream/20" />
          </div>
        ) : (
          <div className="aspect-[16/9] overflow-hidden">
            <img
              src={post.image_url!}
              alt={post.title}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImgFailed(true)}
            />
          </div>
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
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-1.5 group-hover:text-primary transition-colors">
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
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
          <span className="flex items-center gap-1">
            {post.source_name}
            <ExternalLink className="h-3 w-3" />
          </span>
          {formattedDate && <span>{formattedDate}</span>}
        </div>
      </CardContent>
    </Card>
  );
};

export default BlogPostCard;
