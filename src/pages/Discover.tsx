import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, Search, Sun, Snowflake, CloudRain, Flower, X, Loader2 } from 'lucide-react';
import Navigation from '@/components/Navigation';
import Footer from '@/components/Footer';
import { CascadingContainer } from '@/components/ui/cascading-container';
import { LoadingTransition } from '@/components/ui/loading-transition';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHero } from '@/components/ui/page-hero';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel';
import BlogPostCard from '@/components/blog/BlogPostCard';
import MyPlantsBlogSection from '@/components/blog/MyPlantsBlogSection';
import { useAuth } from '@/contexts/AuthContext';
import { useUserPlants } from '@/hooks/useUserPlants';
import {
  useSeasonalBlogPosts,
  useGeneralBlogPosts,
  usePlantBlogPosts,
} from '@/hooks/useBlogPosts';
import { useFilterHidden } from '@/hooks/useHiddenArticles';

function getCurrentSeason(): 'spring' | 'summer' | 'fall' | 'winter' {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'fall';
  return 'winter';
}

const SEASON_CONFIG = {
  spring: { label: 'Spring', icon: Flower, color: 'text-green-500' },
  summer: { label: 'Summer', icon: Sun, color: 'text-yellow-500' },
  fall: { label: 'Fall', icon: CloudRain, color: 'text-orange-500' },
  winter: { label: 'Winter', icon: Snowflake, color: 'text-blue-400' },
};

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

const DiscoverSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
    {/* Header */}
    <div className="space-y-2">
      <Skeleton className="h-8 w-40" />
      <Skeleton className="h-6 w-96 max-w-full" />
    </div>
    {/* Seasonal section */}
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-40" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <BlogPostCardSkeleton key={i} />
        ))}
      </div>
    </div>
    {/* General section */}
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-36" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <BlogPostCardSkeleton key={`g-${i}`} />
        ))}
      </div>
    </div>
    {/* Browse by Plant section */}
    <div className="rounded-xl border bg-card p-6 space-y-4">
      <div className="flex items-center gap-2">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-36" />
      </div>
      <Skeleton className="h-10 w-full max-w-md rounded-md" />
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-6 w-20 rounded-full" />
        ))}
      </div>
    </div>
  </div>
);

const POPULAR_PLANTS = [
  'Monstera', 'Pothos', 'Snake Plant', 'Peace Lily', 'Fiddle Leaf Fig',
  'Philodendron', 'Spider Plant', 'ZZ Plant', 'Aloe Vera', 'Orchid',
];

const Discover = () => {
  const [plantSearch, setPlantSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const { user } = useAuth();
  const { plants } = useUserPlants();
  const myPlantNames = useMemo(
    () => [...new Set(plants.map((p) => p.plant_type).filter(Boolean))],
    [plants]
  );

  const season = useMemo(() => getCurrentSeason(), []);
  const seasonConfig = SEASON_CONFIG[season];
  const SeasonIcon = seasonConfig.icon;

  const { data: rawSeasonalPosts, isLoading: seasonalLoading } = useSeasonalBlogPosts(season);
  const { data: rawGeneralPosts, isLoading: generalLoading } = useGeneralBlogPosts(12);
  const { data: rawPlantPosts, isLoading: plantSearchLoading } = usePlantBlogPosts(
    debouncedSearch || undefined
  );

  const seasonalPosts = useFilterHidden(rawSeasonalPosts);
  const generalPosts = useFilterHidden(rawGeneralPosts);
  const plantPosts = useFilterHidden(rawPlantPosts);

  // Gate the page on the two always-visible sections so we crossfade once
  // instead of showing skeletons that independently pop to content.
  const pageLoading = seasonalLoading || generalLoading;

  // Debounce plant search
  const handleSearchChange = (value: string) => {
    setPlantSearch(value);
    const timeout = setTimeout(() => setDebouncedSearch(value.trim()), 400);
    return () => clearTimeout(timeout);
  };

  const handleChipClick = (name: string) => {
    if (debouncedSearch === name) {
      setPlantSearch('');
      setDebouncedSearch('');
    } else {
      setPlantSearch(name);
      setDebouncedSearch(name);
    }
  };

  // Build suggested chips: user's plants first, then popular (no duplicates)
  const suggestedPlants = useMemo(() => {
    const userLower = myPlantNames.map((n) => n.toLowerCase());
    const userSet = new Set(userLower);
    // Also collect genus (first word) so "Monstera Deliciosa" suppresses "Monstera"
    const userGenusSet = new Set(userLower.map((n) => n.split(/[\s''']/)[0]));
    const popular = POPULAR_PLANTS.filter((p) => {
      const lower = p.toLowerCase();
      return !userSet.has(lower) && !userGenusSet.has(lower);
    });
    return [...myPlantNames, ...popular].slice(0, 10);
  }, [myPlantNames]);

  return (
    <div className="min-h-dvh bg-background pb-28 lg:pb-0" data-testid="discover-page">
      <Navigation />
      <LoadingTransition loading={pageLoading} skeleton={<DiscoverSkeleton />}>
      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
          {/* Page Header */}
          <CascadingContainer delay={0}>
            <PageHero
              icon={SeasonIcon}
              title="Discover"
              subtitle="Curated plant care articles from trusted gardening sources, updated weekly."
            />
          </CascadingContainer>

          {/* Seasonal Spotlight */}
          <CascadingContainer delay={100}>
            <div className="space-y-4">
              <div className="flex items-center gap-2" data-testid="seasonal-section">
                <div className="p-2 rounded-xl bg-sprout-success/10"><SeasonIcon className={`h-5 w-5 ${seasonConfig.color}`} /></div>
                <h2 className="text-lg font-semibold">Seasonal Plant Care</h2>
                {seasonalPosts && seasonalPosts.length >= 4 && (
                  <Link
                    to={`/discover/articles?mode=seasonal&season=${season}`}
                    className="ml-auto text-sm text-primary hover:underline"
                  >
                    View all
                  </Link>
                )}
              </div>

              {seasonalPosts && seasonalPosts.length > 0 ? (
                <Carousel opts={{ align: 'start', loop: false }} className="w-full">
                  <CarouselContent className="-ml-3">
                    {seasonalPosts.map((post) => (
                      <CarouselItem
                        key={post.id}
                        className="pl-3 basis-[240px] sm:basis-[260px] lg:basis-[280px]"
                      >
                        <BlogPostCard post={post} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {seasonalPosts.length > 2 && (
                    <>
                      <CarouselPrevious className="hidden lg:flex" />
                      <CarouselNext className="hidden lg:flex" />
                    </>
                  )}
                </Carousel>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No seasonal articles available right now. Check back soon!
                </p>
              )}
            </div>
          </CascadingContainer>

          {/* For Your Plants - only for logged-in users with plants */}
          {user && myPlantNames.length > 0 && (
            <CascadingContainer delay={200}>
              <MyPlantsBlogSection plantNames={myPlantNames} />
            </CascadingContainer>
          )}

          {/* General Plant Care */}
          <CascadingContainer delay={user && myPlantNames.length > 0 ? 300 : 200}>
            <div className="space-y-4">
              <div className="flex items-center gap-2" data-testid="general-section">
                <div className="p-2 rounded-xl bg-sprout-primary/10"><Leaf className="h-5 w-5 text-primary" /></div>
                <h2 className="text-lg font-semibold">Plant Care Tips</h2>
                {generalPosts && generalPosts.length >= 4 && (
                  <Link
                    to="/discover/articles?mode=general"
                    className="ml-auto text-sm text-primary hover:underline"
                  >
                    View all
                  </Link>
                )}
              </div>

              {generalPosts && generalPosts.length > 0 ? (
                <Carousel opts={{ align: 'start', loop: false }} className="w-full">
                  <CarouselContent className="-ml-3">
                    {generalPosts.map((post) => (
                      <CarouselItem
                        key={post.id}
                        className="pl-3 basis-[240px] sm:basis-[260px] lg:basis-[280px]"
                      >
                        <BlogPostCard post={post} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  {generalPosts.length > 2 && (
                    <>
                      <CarouselPrevious className="hidden lg:flex" />
                      <CarouselNext className="hidden lg:flex" />
                    </>
                  )}
                </Carousel>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No general articles available yet. Check back soon!
                </p>
              )}
            </div>
          </CascadingContainer>

          {/* Browse by Plant */}
          <CascadingContainer delay={user && myPlantNames.length > 0 ? 400 : 300}>
            <div className="rounded-xl border-0 bg-card shadow-md overflow-hidden" data-testid="browse-by-plant-section">
              <div className="h-1 bg-gradient-to-r from-sprout-water via-sprout-success to-sprout-medium" />
              <div className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-sprout-primary/10"><Search className="h-5 w-5 text-sprout-primary" /></div>
                <h2 className="text-lg font-semibold">Browse by Plant</h2>
                {debouncedSearch && plantPosts && plantPosts.length >= 4 && (
                  <Link
                    to={`/discover/articles?mode=plant&plant=${encodeURIComponent(debouncedSearch)}`}
                    className="ml-auto text-sm text-primary hover:underline"
                  >
                    View all
                  </Link>
                )}
              </div>
              <div className="max-w-md">
                <Input
                  placeholder="Search for a plant (e.g. Monstera, Peace Lily)..."
                  value={plantSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full"
                  data-testid="plant-search-input"
                />
              </div>

              <div className="flex flex-wrap gap-2" data-testid="plant-chips">
                {suggestedPlants.map((name) => {
                  const isActive = debouncedSearch === name;
                  return (
                    <Badge
                      key={name}
                      variant={isActive ? 'default' : 'outline'}
                      className={`cursor-pointer transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                          : 'hover:bg-primary/10'
                      }`}
                      onClick={() => handleChipClick(name)}
                    >
                      {name}
                      {isActive && <X className="ml-1 h-3 w-3" />}
                    </Badge>
                  );
                })}
              </div>

              {debouncedSearch ? (
                plantSearchLoading ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : plantPosts && plantPosts.length > 0 ? (
                  <div className="animate-in fade-in duration-300">
                    <Carousel opts={{ align: 'start', loop: false }} className="w-full">
                      <CarouselContent className="-ml-3">
                        {plantPosts.map((post) => (
                          <CarouselItem
                            key={post.id}
                            className="pl-3 basis-[240px] sm:basis-[260px] lg:basis-[280px]"
                          >
                            <BlogPostCard post={post} />
                          </CarouselItem>
                        ))}
                      </CarouselContent>
                      {plantPosts.length > 2 && (
                        <>
                          <CarouselPrevious className="hidden lg:flex" />
                          <CarouselNext className="hidden lg:flex" />
                        </>
                      )}
                    </Carousel>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground animate-in fade-in duration-300">
                    No articles found for &ldquo;{debouncedSearch}&rdquo;. Try a different plant name.
                  </p>
                )
              ) : null}
              </div>
            </div>
          </CascadingContainer>
        </div>
      </main>
      </LoadingTransition>
      <Footer />
    </div>
  );
};

export default Discover;
