import { BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import BlogPostCard from './BlogPostCard';
import { usePlantBlogPosts } from '@/hooks/useBlogPosts';
import { useFilterHidden } from '@/hooks/useHiddenArticles';

interface BlogPostsSectionProps {
  plantName: string;
}

const BlogPostCardSkeleton = () => (
  <div className="rounded-lg border bg-card shadow-sm overflow-hidden">
    <Skeleton className="aspect-[16/9] w-full rounded-none" />
    <div className="p-4 space-y-2">
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

const BlogPostsSection = ({ plantName }: BlogPostsSectionProps) => {
  const { data: rawPosts, isLoading } = usePlantBlogPosts(plantName);
  const posts = useFilterHidden(rawPosts);

  if (!isLoading && (!posts || posts.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">Related Articles</h2>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <BlogPostCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <Carousel
          opts={{ align: 'start', loop: false }}
          className="w-full"
        >
          <CarouselContent className="-ml-3">
            {posts!.map((post) => (
              <CarouselItem
                key={post.id}
                className="pl-3 basis-[240px] sm:basis-[260px] lg:basis-[280px]"
              >
                <BlogPostCard post={post} />
              </CarouselItem>
            ))}
          </CarouselContent>
          {posts!.length > 2 && (
            <>
              <CarouselPrevious className="hidden lg:flex" />
              <CarouselNext className="hidden lg:flex" />
            </>
          )}
        </Carousel>
      )}
    </div>
  );
};

export default BlogPostsSection;
