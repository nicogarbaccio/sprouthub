import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ThemeAwareLogo } from "@/components/ui/theme-aware-logo";

// The auth check usually resolves in ~100ms; only fade placeholders in if it takes
// longer than this, so a fast check doesn't flash gray boxes
const PLACEHOLDER_DELAY_CLASSES = "animate-in fade-in fill-mode-both delay-300 duration-200";

export const NavigationSkeleton = () => {
  return (
    <nav
      className="bg-background dark:bg-sprout-dark shadow-sm border-b border-sprout-cream/30 dark:border-sprout-cream/20 transition-colors backdrop-blur-sm sticky top-0 z-40"
      data-testid="navigation-skeleton"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo doesn't depend on auth, so render the real one (matches Navigation) */}
          <Link to="/" className="flex items-center gap-3 group">
            <ThemeAwareLogo className="h-8 w-auto" />
            <span className="text-2xl font-bold text-sprout-primary dark:text-sprout-cream transition-colors duration-200">
              sprouthub
            </span>
          </Link>

          {/* Desktop Nav Skeleton */}
          <div className={`hidden lg:flex items-center space-x-4 ${PLACEHOLDER_DELAY_CLASSES}`}>
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-full" />
          </div>

          {/* Mobile Menu Skeleton */}
          <div className={`flex lg:hidden items-center space-x-2 ${PLACEHOLDER_DELAY_CLASSES}`}>
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-9 w-9 rounded-lg" />
          </div>
        </div>
      </div>
    </nav>
  );
};
