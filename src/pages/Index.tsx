import { useEffect, useState } from "react";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import PlantCatalog from "@/components/PlantCatalog";
import Dashboard from "@/components/Dashboard";

import ErrorBoundary from "@/components/ErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import { PWADebugPanel, usePWADebug } from "@/components/pwa/PWADebugPanel";
import { Skeleton } from "@/components/ui/skeleton";
import { DelayedSkeleton } from "@/components/ui/loading-transition";

/**
 * Content-only marketing skeleton (no Navigation/Footer - those stay mounted at the top level).
 * Uses neutral skeleton colors to avoid the green flickering box issue.
 */
const MarketingContentSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-3.5 lg:pt-7 space-y-2.5 md:space-y-3.5">
      <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-2.5 md:gap-3.5">
        <Skeleton className="h-[320px] rounded-tile" />
        <Skeleton className="hidden lg:block h-[320px] rounded-tile" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 md:gap-3.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[88px] rounded-card" />
        ))}
      </div>
      <div className="pt-6 space-y-2">
        <Skeleton className="h-8 w-72 rounded-2xl" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 md:gap-3.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-44 rounded-card" />
        ))}
      </div>
    </div>
  );
};

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { showDebugPanel } = usePWADebug();
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    // Check for Supabase session in localStorage to show correct skeleton
    // The key format is usually `sb-${projectId}-auth-token`
    const checkSession = () => {
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key?.startsWith('sb-') && key?.endsWith('-auth-token')) {
            setHasSession(true);
            return;
          }
        }
      } catch (e) {
        // Ignore localStorage errors
      }
    };
    checkSession();
  }, []);

  return (
    <div className="bg-background pb-28 lg:pb-0">
      {/* PWA Debug Panel - Development only */}
      {showDebugPanel && (
        <PWADebugPanel className="fixed top-20 right-4 w-80 z-40" />
      )}

      {user || (authLoading && hasSession) ? (
        // Dashboard view — rendered as soon as we know a session exists so that
        // Dashboard's own LoadingTransition manages a single, continuous
        // skeleton→content crossfade (no unmount/remount flicker between
        // Index's skeleton and Dashboard's skeleton).
        <ErrorBoundary>
          <Dashboard />
        </ErrorBoundary>
      ) : authLoading ? (
        // No session detected — show marketing skeleton while auth resolves
        <DelayedSkeleton>
          <MarketingContentSkeleton />
        </DelayedSkeleton>
      ) : (
        // Marketing view for non-signed-in users with smooth fade-in
        <div className="animate-fade-in">
          <HeroSection />
          <FeaturesSection />
          <PlantCatalog isHomepage={true} />
        </div>
      )}
    </div>
  );
};

export default Index;
