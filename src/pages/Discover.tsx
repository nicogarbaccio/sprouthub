import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Sun, Snowflake, CloudRain, Flower, X, Loader2 } from 'lucide-react';
import { CascadingContainer } from '@/components/ui/cascading-container';
import { LoadingTransition } from '@/components/ui/loading-transition';
import { Skeleton } from '@/components/ui/skeleton';
import BlogPostCard, { BlogPostCardSkeleton } from '@/components/blog/BlogPostCard';
import ArticleRow from '@/components/blog/ArticleRow';
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
  spring: { label: 'Spring', icon: Flower },
  summer: { label: 'Summer', icon: Sun },
  fall: { label: 'Fall', icon: CloudRain },
  winter: { label: 'Winter', icon: Snowflake },
};

const DiscoverSkeleton = () => (
  <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-3.5 lg:pt-7">
    {/* Header */}
    <div className="px-1.5 lg:px-0 space-y-2">
      <Skeleton className="h-9 lg:h-10 w-40 rounded-xl" />
      <Skeleton className="h-4 w-80 max-w-full" />
    </div>
    {/* Search and plant chips */}
    <Skeleton className="mt-3.5 h-[52px] w-full lg:max-w-xl rounded-[18px]" />
    <div className="flex gap-2 overflow-hidden mt-2.5">
      {[88, 72, 104, 80, 96].map((w, i) => (
        <Skeleton key={i} className="h-10 shrink-0 rounded-full" style={{ width: w }} />
      ))}
    </div>
    {/* Seasonal: a feature tile beside smaller cards */}
    <Skeleton className="mt-6 h-6 w-48 rounded-lg mx-1.5 lg:mx-0" />
    <div className="mt-3 grid gap-2.5 lg:gap-3.5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)]">
      <Skeleton className="h-[320px] lg:h-auto lg:min-h-[420px] rounded-tile" />
      <div className="hidden lg:grid grid-cols-2 gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          <BlogPostCardSkeleton key={i} />
        ))}
      </div>
    </div>
    {/* General: article rows */}
    <Skeleton className="mt-[26px] h-6 w-40 rounded-lg mx-1.5 lg:mx-0" />
    <div className="mt-3 grid gap-2 lg:grid-cols-2 lg:gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-2 rounded-3xl bg-card">
          <Skeleton className="w-[76px] h-[76px] shrink-0 rounded-[18px]" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-3 w-3/5" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        </div>
      ))}
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

  const [featuredPost, ...moreSeasonalPosts] = seasonalPosts ?? [];

  return (
    <div className="bg-background pb-32 lg:pb-10" data-testid="discover-page">
      <LoadingTransition loading={pageLoading} skeleton={<DiscoverSkeleton />}>
      <main>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-3.5 lg:pt-7">
          <CascadingContainer delay={0}>
            <div className="px-1.5 lg:px-0">
              <h1 className="font-display text-[28px] lg:text-[34px] font-bold tracking-[-0.04em] text-foreground">
                Discover
              </h1>
              <p className="text-sm lg:text-[15px] font-medium text-muted-foreground mt-0.5">
                Curated plant care articles from trusted gardening sources, updated weekly.
              </p>
            </div>
          </CascadingContainer>

          {/* Search by plant, with quick picks underneath */}
          <CascadingContainer delay={50}>
            <section className="mt-3.5" data-testid="browse-by-plant-section" aria-labelledby="browse-heading">
              <h2 id="browse-heading" className="sr-only">Browse by Plant</h2>
              <div className="relative lg:max-w-xl">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
                <input
                  type="search"
                  placeholder="Search articles by plant, e.g. Monstera"
                  aria-label="Search articles by plant"
                  value={plantSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full h-[52px] rounded-[18px] bg-card pl-12 pr-4 text-[15px] font-medium text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  data-testid="plant-search-input"
                />
              </div>

              <div
                className="flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 mt-2.5 lg:mx-0 lg:px-0 lg:flex-wrap"
                data-testid="plant-chips"
              >
                {suggestedPlants.map((name) => {
                  const isActive = debouncedSearch === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      aria-pressed={isActive}
                      className={`flex-none h-10 px-3.5 rounded-full flex items-center gap-1 text-sm font-bold transition-colors ${
                        isActive ? 'bg-foreground text-background' : 'bg-card text-foreground'
                      }`}
                      onClick={() => handleChipClick(name)}
                    >
                      {name}
                      {isActive && <X className="h-3.5 w-3.5" />}
                    </button>
                  );
                })}
              </div>

              {debouncedSearch ? (
                <div className="mt-4">
                  {plantSearchLoading ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : plantPosts && plantPosts.length > 0 ? (
                    <div className="animate-in fade-in duration-300">
                      <ArticleRow
                        title={`Articles about ${debouncedSearch}`}
                        posts={plantPosts}
                        viewAllTo={
                          plantPosts.length >= 4
                            ? `/discover/articles?mode=plant&plant=${encodeURIComponent(debouncedSearch)}`
                            : undefined
                        }
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground px-1.5 animate-in fade-in duration-300">
                      No articles found for &ldquo;{debouncedSearch}&rdquo;. Try a different plant name.
                    </p>
                  )}
                </div>
              ) : null}
            </section>
          </CascadingContainer>

          {/* Seasonal: a featured story, then the rest of the season's picks */}
          <CascadingContainer delay={100}>
            <div className="mt-6 space-y-3">
              <div className="flex items-baseline justify-between px-1.5 lg:px-0" data-testid="seasonal-section">
                <h2 className="font-display text-lg lg:text-[22px] font-bold tracking-[-0.03em] text-foreground flex items-center gap-2">
                  <SeasonIcon className="h-5 w-5" />
                  {seasonConfig.label} Plant Care
                </h2>
                {seasonalPosts && seasonalPosts.length >= 4 && (
                  <Link
                    to={`/discover/articles?mode=seasonal&season=${season}`}
                    className="text-sm font-bold text-link"
                  >
                    See all
                  </Link>
                )}
              </div>

              {featuredPost ? (
                <div className="grid gap-2.5 lg:gap-3.5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,2fr)]">
                  <BlogPostCard post={featuredPost} variant="feature" tone="forest" />
                  {moreSeasonalPosts.length > 0 && (
                    <div className="flex gap-2.5 overflow-x-auto scrollbar-none snap-x -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-2 lg:gap-3.5 lg:overflow-visible">
                      {moreSeasonalPosts.slice(0, 4).map((post) => (
                        <div key={post.id} className="flex-none w-[200px] sm:w-[240px] lg:w-auto snap-start">
                          <BlogPostCard post={post} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground px-1.5">
                  No seasonal articles available right now. Check back soon!
                </p>
              )}
            </div>
          </CascadingContainer>

          {/* For Your Plants - only for logged-in users with plants */}
          {user && myPlantNames.length > 0 && (
            <CascadingContainer delay={200}>
              <div className="mt-[26px]">
                <MyPlantsBlogSection plantNames={myPlantNames} />
              </div>
            </CascadingContainer>
          )}

          {/* General Plant Care, as a compact list */}
          <CascadingContainer delay={user && myPlantNames.length > 0 ? 300 : 200}>
            <div className="mt-[26px] space-y-3">
              <div className="flex items-baseline justify-between px-1.5 lg:px-0" data-testid="general-section">
                <h2 className="font-display text-lg lg:text-[22px] font-bold tracking-[-0.03em] text-foreground">
                  Plant Care Tips
                </h2>
                {generalPosts && generalPosts.length >= 4 && (
                  <Link to="/discover/articles?mode=general" className="text-sm font-bold text-link">
                    See all
                  </Link>
                )}
              </div>

              {generalPosts && generalPosts.length > 0 ? (
                <div className="grid gap-2 lg:grid-cols-2 lg:gap-3">
                  {generalPosts.slice(0, 6).map((post) => (
                    <BlogPostCard key={post.id} post={post} variant="row" />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground px-1.5">
                  No general articles available yet. Check back soon!
                </p>
              )}
            </div>
          </CascadingContainer>
        </div>
      </main>
      </LoadingTransition>
    </div>
  );
};

export default Discover;
