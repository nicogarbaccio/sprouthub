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

  const heading = (
    <div className="flex items-center gap-2">
      <BookOpen className="h-5 w-5 text-primary" />
      <h2 className="text-lg font-semibold">Related Articles</h2>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {heading}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <BlogPostCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <Carousel
      opts={{ align: 'start', loop: false }}
      className="w-full overflow-visible space-y-4"
    >
      {/* Arrows sit in the header row: positioned outside the carousel's edges, as the
          primitive does by default, they pushed past the page and made it scroll sideways */}
      <div className="flex items-center justify-between gap-2">
        {heading}
        {posts!.length > 2 && (
          <div className="hidden lg:flex items-center gap-2">
            <CarouselPrevious className="static translate-y-0" />
            <CarouselNext className="static translate-y-0" />
          </div>
        )}
      </div>
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
    </Carousel>
  );
};

export default BlogPostsSection;
