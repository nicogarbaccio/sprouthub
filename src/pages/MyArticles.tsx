import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Bookmark, BookOpen } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CascadingContainer } from '@/components/ui/cascading-container';
import { LoadingTransition } from '@/components/ui/loading-transition';
import { FeatureErrorBoundary } from '@/components/ui/feature-error-boundary';
import { useSavedArticles } from '@/hooks/useSavedArticles';
import BlogPostCard, { BlogPostCardSkeleton } from '@/components/blog/BlogPostCard';
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

const MyArticlesSkeleton = () => (
  <div className="max-w-5xl mx-auto">
    <Skeleton className="h-10 w-48 rounded-2xl mb-2" />
    <Skeleton className="h-4 w-64 mb-[18px]" />
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3.5">
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
    <div className="bg-background pb-28 lg:pb-0" data-testid="my-articles-page">
      <main className="px-4 lg:px-8 pt-3.5 lg:pt-7">
        <LoadingTransition loading={isLoading} skeleton={<MyArticlesSkeleton />}>
          <div className="max-w-5xl mx-auto">
            <CascadingContainer delay={0}>
              <div className="flex items-end justify-between gap-3 px-1.5 lg:px-0 mb-[18px]">
                <div className="min-w-0">
                  <h1 className="font-display text-[28px] lg:text-[34px] font-bold tracking-[-0.04em] text-foreground">
                    My Articles
                  </h1>
                  <p className="text-sm lg:text-[15px] font-medium text-muted-foreground mt-0.5">
                    Articles you've saved for later reading
                  </p>
                </div>
                <span className="shrink-0 inline-flex items-center gap-1.5 h-10 px-3.5 rounded-full bg-card text-foreground text-sm font-bold">
                  <Bookmark className="w-4 h-4" />
                  {articles.length} saved
                </span>
              </div>
            </CascadingContainer>

            <CascadingContainer delay={100}>
              {articles.length === 0 ? (
                <div className="rounded-tile bg-sprout-cream text-sprout-dark p-6 md:p-8">
                  <div className="w-14 h-14 rounded-2xl bg-sprout-dark text-sprout-cream flex items-center justify-center">
                    <BookOpen className="w-7 h-7" />
                  </div>
                  <h2 className="font-display text-2xl font-bold tracking-[-0.03em] mt-4">No saved articles yet</h2>
                  <p className="text-[15px] font-medium mt-1.5 max-w-[46ch]">
                    Save articles while browsing to find them here later. Look for the bookmark icon on any article card.
                  </p>
                  <button
                    type="button"
                    onClick={() => navigate('/discover')}
                    className="mt-5 h-14 px-6 rounded-[22px] bg-sprout-dark text-sprout-cream font-display font-bold"
                  >
                    Browse Articles
                  </button>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3.5">
                    {visibleArticles.map((post) => (
                      <BlogPostCard key={post.id} post={post} matchedPlants={post.matchedPlants} showHideButton={false} />
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
    </div>
  );
};

const MyArticles = () => (
  <FeatureErrorBoundary featureName="My Articles">
    <MyArticlesContent />
  </FeatureErrorBoundary>
);

export default MyArticles;
