import { BookOpen } from 'lucide-react';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import BlogPostCard, { BlogPostCardSkeleton } from './BlogPostCard';
import { usePlantBlogPosts } from '@/hooks/useBlogPosts';
import { useFilterHidden } from '@/hooks/useHiddenArticles';

interface BlogPostsSectionProps {
  plantName: string;
}

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
          className="w-full overflow-visible"
        >
          <CarouselContent className="-ml-3 py-2">
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
