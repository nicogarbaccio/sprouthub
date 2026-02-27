import { useEffect, useState } from "react";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import PlantCatalog from "@/components/PlantCatalog";
import Dashboard from "@/components/Dashboard";
import { DashboardSkeleton } from "@/components/DashboardSkeleton";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAuth } from "@/contexts/AuthContext";
import Footer from "@/components/Footer";
import { PWADebugPanel, usePWADebug } from "@/components/pwa/PWADebugPanel";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Content-only marketing skeleton (no Navigation/Footer - those stay mounted at the top level).
 * Uses neutral skeleton colors to avoid the green flickering box issue.
 */
const MarketingContentSkeleton = () => {
  return (
    <>
      {/* Hero Section Skeleton */}
      <section className="bg-background py-12 sm:py-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-start">
            <div className="text-center lg:text-left mb-6 sm:mb-8 lg:mb-0 lg:pt-8">
              <Skeleton className="h-12 sm:h-14 lg:h-16 w-3/4 mb-6 mx-auto lg:mx-0" />
              <div className="space-y-2 mb-8 max-w-2xl mx-auto lg:mx-0">
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-full" />
                <Skeleton className="h-5 w-2/3" />
              </div>
              <Skeleton className="h-12 w-40 rounded-xl mx-auto lg:mx-0" />
            </div>
            <div className="relative hidden lg:flex lg:justify-center">
              <div className="bg-card rounded-3xl shadow-lg p-4 sm:p-6 relative overflow-hidden mx-auto lg:mx-0 w-full max-w-sm sm:max-w-md lg:min-w-[400px]">
                <Skeleton className="w-full h-48 sm:h-56 lg:h-64 rounded-3xl mb-4" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-48 mb-1" />
                        <Skeleton className="h-3 w-36" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Tablet Feature Icons Skeleton */}
          <div className="hidden sm:block lg:hidden mt-12">
            <div className="grid grid-cols-3 gap-6 max-w-3xl mx-auto">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center text-center space-y-3">
                  <Skeleton className="w-16 h-16 rounded-2xl" />
                  <div>
                    <Skeleton className="h-4 w-32 mb-1 mx-auto" />
                    <Skeleton className="h-3 w-28 mx-auto" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section Skeleton */}
      <section className="py-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Skeleton className="h-10 w-80 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="bg-card border border-border rounded-2xl p-8 h-full"
              >
                <Skeleton className="w-12 h-12 rounded-xl mb-6" />
                <Skeleton className="h-6 w-32 mb-3" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
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
    <div className="min-h-dvh bg-background pb-20 lg:pb-0">
      {/* Navigation stays mounted at all times to prevent unmount/remount flicker */}
      <Navigation />

      {/* PWA Debug Panel - Development only */}
      {showDebugPanel && (
        <PWADebugPanel className="fixed top-20 right-4 w-80 z-40" />
      )}

      {authLoading ? (
        // Show appropriate skeleton during auth loading
        hasSession ? (
          <DashboardSkeleton />
        ) : (
          <MarketingContentSkeleton />
        )
      ) : user ? (
        // Dashboard view for signed-in users
        <ErrorBoundary>
          <div className="animate-fade-in">
            <Dashboard />
          </div>
        </ErrorBoundary>
      ) : (
        // Marketing view for non-signed-in users with smooth fade-in
        <div className="animate-fade-in">
          <HeroSection />
          <FeaturesSection />
          <PlantCatalog isHomepage={true} />
        </div>
      )}

      {/* Footer stays mounted at all times */}
      <Footer />
    </div>
  );
};

export default Index;
