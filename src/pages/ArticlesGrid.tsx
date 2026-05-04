import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Leaf, Sun, Snowflake, CloudRain, Flower, Sprout } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import BlogPostCard from '@/components/blog/BlogPostCard';
import PaginationControls from '@/components/catalog/PaginationControls';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPlants } from '@/hooks/useUserPlants';
import { useBlogPostsGrid } from '@/hooks/useBlogPosts';
import { useFilterHidden } from '@/hooks/useHiddenArticles';
import type { GridMode } from '@/hooks/useBlogPosts';
import { usePaginationUrl } from '@/hooks/usePaginationUrl';

const PAGE_SIZE = 24;

const SEASON_LABELS: Record<string, { label: string; icon: typeof Sun }> = {
  spring: { label: 'Spring Plant Care', icon: Flower },
  summer: { label: 'Summer Plant Care', icon: Sun },
  fall: { label: 'Fall Plant Care', icon: CloudRain },
  winter: { label: 'Winter Plant Care', icon: Snowflake },
};

function getTitle(mode: string, params: { season?: string; plant?: string }): string {
  if (mode === 'seasonal' && params.season) {
    return SEASON_LABELS[params.season]?.label ?? 'Seasonal Plant Care';
  }
  if (mode === 'general') return 'Plant Care Tips';
  if (mode === 'my-plants') return 'For Your Plants';
  if (mode === 'plant' && params.plant) return `${params.plant} Articles`;
  return 'Articles';
}

function getTitleIcon(mode: string, season?: string) {
  if (mode === 'seasonal' && season) {
    const Icon = SEASON_LABELS[season]?.icon ?? Leaf;
    return <Icon className="h-6 w-6" />;
  }
  if (mode === 'my-plants') return <Sprout className="h-6 w-6" />;
  return <Leaf className="h-6 w-6" />;
}

const CardSkeleton = () => (
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

const ArticlesGrid = () => {
  const [searchParams] = useSearchParams();
  const mode = (searchParams.get('mode') ?? 'general') as GridMode;
  const season = searchParams.get('season') ?? undefined;
  const plant = searchParams.get('plant') ?? undefined;

  const { user } = useAuth();
  const { plants } = useUserPlants();
  const myPlantNames = useMemo(
    () => [...new Set(plants.map((p) => p.plant_type).filter(Boolean))],
    [plants]
  );

  const [currentPage, setCurrentPage] = useState(1);

  const gridParams = useMemo(() => {
    if (mode === 'seasonal') return { season };
    if (mode === 'plant') return { plantName: plant };
    if (mode === 'my-plants') return { plantNames: myPlantNames };
    return {};
  }, [mode, season, plant, myPlantNames]);

  const { data, isLoading } = useBlogPostsGrid(mode, gridParams, currentPage, PAGE_SIZE);
  const rawPosts = data?.posts ?? [];
  const posts = useFilterHidden(rawPosts) ?? [];
  const totalCount = data?.totalCount ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  const { handlePageChange, handleNextPage, handlePreviousPage } = usePaginationUrl({
    currentPage,
    onPageChange: setCurrentPage,
    resetToFirstPage: () => setCurrentPage(1),
  });

  const title = getTitle(mode, { season, plant });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navigation />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <Link
          to="/discover"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Discover
        </Link>

        <div className="flex items-center gap-2 mb-6">
          {getTitleIcon(mode, season)}
          <h1 className="text-2xl font-bold">{title}</h1>
          {totalCount > 0 && (
            <span className="text-sm text-muted-foreground">({totalCount} articles)</span>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        ) : posts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {posts.map((post) => (
                <BlogPostCard key={post.id} post={post} />
              ))}
            </div>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              hasNextPage={currentPage < totalPages}
              hasPreviousPage={currentPage > 1}
              onPageChange={handlePageChange}
              onNextPage={handleNextPage}
              onPreviousPage={handlePreviousPage}
              className="mt-8"
            />
          </>
        ) : (
          <div className="text-center py-16">
            <Leaf className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">
              {mode === 'my-plants' && !user
                ? 'Sign in to see articles for your plants.'
                : 'No articles found. Check back soon!'}
            </p>
            <Link
              to="/discover"
              className="inline-block mt-4 text-sm text-primary hover:underline"
            >
              Back to Discover
            </Link>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ArticlesGrid;
