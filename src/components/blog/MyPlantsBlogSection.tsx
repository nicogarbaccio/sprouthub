import { Link } from 'react-router-dom';
import { Flower2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import BlogPostCard from './BlogPostCard';
import { useMyPlantsBlogPosts } from '@/hooks/useBlogPosts';
import { useFilterHidden } from '@/hooks/useHiddenArticles';

interface MyPlantsBlogSectionProps {
  plantNames: string[];
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

const MyPlantsBlogSection = ({ plantNames }: MyPlantsBlogSectionProps) => {
  const { data: rawPosts, isLoading } = useMyPlantsBlogPosts(plantNames);
  const posts = useFilterHidden(rawPosts);

  if (!isLoading && (!posts || posts.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-4" data-testid="my-plants-blog-section">
      <div className="flex items-center gap-2">
        <Flower2 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold">For Your Plants</h2>
        {posts && posts.length >= 4 && (
          <Link
            to="/discover/articles?mode=my-plants"
            className="ml-auto text-sm text-primary hover:underline"
          >
            View all
          </Link>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <BlogPostCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <Carousel opts={{ align: 'start', loop: false }} className="w-full overflow-visible">
          <CarouselContent className="-ml-3 py-2">
            {posts!.map((post) => (
              <CarouselItem
                key={post.id}
                className="pl-3 basis-[240px] sm:basis-[260px] lg:basis-[280px]"
              >
                <BlogPostCard post={post} matchedPlants={post.matchedPlants} />
              </CarouselItem>
            ))}
          </CarouselContent>
          {posts!.length > 3 && (
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

export default MyPlantsBlogSection;
