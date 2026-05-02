import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Bookmark, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CascadingContainer } from '@/components/ui/cascading-container';
import { LoadingTransition } from '@/components/ui/loading-transition';
import { FeatureErrorBoundary } from '@/components/ui/feature-error-boundary';
import { PageHero } from '@/components/ui/page-hero';
import { useSavedArticles } from '@/hooks/useSavedArticles';
import BlogPostCard from '@/components/blog/BlogPostCard';
import PaginationControls from '@/components/catalog/PaginationControls';
import { usePaginationUrl } from '@/hooks/usePaginationUrl';

function usePageSize() {
  const getSize = () => {
    if (typeof window === 'undefined') return 12;
    if (window.innerWidth >= 1024) return 12; // lg: 3 cols × 4 rows
    if (window.innerWidth >= 640) return 8;   // sm: 2 cols × 4 rows
    return 6;                                  // mobile: 1 col × 6 rows
  };

  const [pageSize, setPageSize] = useState(getSize);

  useEffect(() => {
    const onResize = () => setPageSize(getSize());
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return pageSize;
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

const MyArticlesSkeleton = () => (
  <div className="max-w-5xl mx-auto">
    <Skeleton className="h-40 w-full rounded-2xl mb-8" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <BlogPostCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

const MyArticlesContent = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { data: articles = [], isLoading: articlesLoading } = useSavedArticles();

  const pageSize = usePageSize();
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.ceil(articles.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const visibleArticles = articles.slice(startIndex, startIndex + pageSize);

  // Reset to page 1 when page size changes (screen resize crosses breakpoint)
  useEffect(() => { setCurrentPage(1); }, [pageSize]);

  const { handlePageChange, handleNextPage, handlePreviousPage } = usePaginationUrl({
    currentPage,
    onPageChange: setCurrentPage,
    resetToFirstPage: () => setCurrentPage(1),
    enabled: !!user,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth?redirect=' + encodeURIComponent(window.location.pathname));
    }
  }, [user, authLoading, navigate]);

  const isLoading = authLoading || articlesLoading;

  if (!isLoading && !user) return null;

  return (
    <div className="min-h-dvh bg-background pb-28 lg:pb-0" data-testid="my-articles-page">
      <Navigation />
      <main className="min-h-[calc(100vh-4rem)] bg-plant-neutral dark:bg-background py-8 px-4">
        <LoadingTransition loading={isLoading} skeleton={<MyArticlesSkeleton />}>
          <div className="max-w-5xl mx-auto">
            <CascadingContainer delay={0}>
              <PageHero
                icon={Bookmark}
                title="My Articles"
                subtitle="Articles you've saved for later reading"
                actions={
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-white/90">
                    <Bookmark className="w-4 h-4" />
                    <span className="font-medium">{articles.length}</span> saved
                  </div>
                }
              />
            </CascadingContainer>

            <CascadingContainer delay={100}>
              {articles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <BookOpen className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No saved articles yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md">
                    Save articles while browsing to find them here later. Look for the bookmark icon on any article card.
                  </p>
                  <Button onClick={() => navigate('/discover')}>
                    Browse Articles
                  </Button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {visibleArticles.map((post) => (
                      <BlogPostCard key={post.id} post={post} matchedPlants={post.matchedPlants} />
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
              )}
            </CascadingContainer>
          </div>
        </LoadingTransition>
      </main>
      <Footer />
    </div>
  );
};

const MyArticles = () => (
  <FeatureErrorBoundary featureName="My Articles">
    <MyArticlesContent />
  </FeatureErrorBoundary>
);

export default MyArticles;
