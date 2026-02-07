import { Skeleton } from "@/components/ui/skeleton";

export const NavigationSkeleton = () => {
  return (
    <nav
      className="bg-background dark:bg-sprout-dark shadow-sm border-b border-sprout-cream/30 dark:border-sprout-cream/20 transition-colors backdrop-blur-sm sticky top-0 z-40"
      data-testid="navigation-skeleton"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo Skeleton */}
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-6 w-32" />
          </div>

          {/* Desktop Nav Skeleton */}
          <div className="hidden lg:flex items-center space-x-4">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>

          {/* Mobile Menu Skeleton */}
          <div className="flex lg:hidden items-center space-x-2">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>
      </div>
    </nav>
  );
};
