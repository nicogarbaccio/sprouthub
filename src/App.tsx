import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileDataProvider } from "@/contexts/ProfileDataContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { NotificationPreferencesProvider } from "@/contexts/NotificationPreferencesContext";
import { setNotificationNavigate } from "@/utils/notifications/generator";
import { useEffect, Suspense, lazy } from "react";
import { App as CapacitorApp } from '@capacitor/app';
import * as Sentry from "@sentry/react";
import { useIOSOptimizations } from "@/hooks/useIOSOptimizations";
import { useStatusBar } from "@/hooks/useStatusBar";
import ScrollToTop from "./components/ScrollToTop";
import BottomNav from "./components/BottomNav";
import { AnimatedRoutes } from "./components/AnimatedRoutes";
import { OfflineBanner } from "./components/OfflineBanner";
import { SplashScreen } from "./components/SplashScreen";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { GlobalNotifications } from "./components/GlobalNotifications";

// Retry dynamic imports once on failure (handles stale chunks after deploys)
function lazyWithRetry(importFn: () => Promise<{ default: React.ComponentType<unknown> }>) {
  return lazy(() =>
    importFn().catch(() => {
      const hasReloaded = sessionStorage.getItem('chunk-reload');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk-reload', '1');
        window.location.reload();
        return new Promise(() => {}); // never resolves — page is reloading
      }
      sessionStorage.removeItem('chunk-reload');
      return importFn(); // rethrow on second failure
    })
  );
}

// Lazy load pages for better performance
const Index = lazyWithRetry(() => import("./pages/Index"));
const Auth = lazyWithRetry(() => import("./pages/Auth"));
const Onboarding = lazyWithRetry(() => import("./pages/Onboarding"));
const ForgotPassword = lazyWithRetry(() => import("./pages/ForgotPassword"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const PlantCatalogPage = lazyWithRetry(() => import("./pages/PlantCatalog"));
const PlantDetails = lazyWithRetry(() => import("./pages/PlantDetails"));
const MyPlants = lazyWithRetry(() => import("./pages/MyPlants"));
const MyPlantDetails = lazyWithRetry(() => import("./pages/MyPlantDetails"));
const Households = lazyWithRetry(() => import("./pages/Households"));
const HouseholdManagement = lazyWithRetry(() => import("./pages/HouseholdManagement"));
const Profile = lazyWithRetry(() => import("./pages/Profile"));
const Settings = lazyWithRetry(() => import("./pages/Settings"));
const About = lazyWithRetry(() => import("./pages/About"));
const Analytics = lazyWithRetry(() => import("./pages/Analytics"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazyWithRetry(() => import("./pages/TermsOfService"));
const Discover = lazyWithRetry(() => import("./pages/Discover"));
const ArticlesGrid = lazyWithRetry(() => import("./pages/ArticlesGrid"));
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000, // 30s — reuse cached data across navigations
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Inner component to access useNavigate
const AppRoutes = () => {
  const navigate = useNavigate();

  // Enable iOS-specific optimizations (swipe-to-go-back, haptics)
  useIOSOptimizations();

  // Manage iOS status bar theming
  useStatusBar();

  // Set up navigation for notification actions
  useEffect(() => {
    setNotificationNavigate(navigate);
  }, [navigate]);

  // Handle Hardware Back Button (Android)
  useEffect(() => {
    CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (canGoBack) {
        navigate(-1);
      } else {
        CapacitorApp.exitApp();
      }
    });

    return () => {
      CapacitorApp.removeAllListeners();
    };
  }, [navigate]);

  const location = useLocation();

  return (
    <>
      <SplashScreen />
      <ScrollToTop />
      <OfflineBanner />
      <GlobalNotifications />
      <BottomNav />
      <Suspense fallback={<div className="min-h-dvh bg-background" />}>
        <AnimatedRoutes>
          <Routes location={location}>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/plant-catalog" element={<PlantCatalogPage />} />
            <Route
              path="/plant-details/:plantName"
              element={<PlantDetails />}
            />
            <Route path="/my-plants" element={<ProtectedRoute><MyPlants /></ProtectedRoute>} />
            <Route
              path="/my-plants/:plantId"
              element={<ProtectedRoute><MyPlantDetails /></ProtectedRoute>}
            />
            <Route path="/households" element={<ProtectedRoute><Households /></ProtectedRoute>} />
            <Route
              path="/households/:id"
              element={<ProtectedRoute><HouseholdManagement /></ProtectedRoute>}
            />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/discover/articles" element={<ArticlesGrid />} />
            <Route path="/about" element={<About />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms-of-service" element={<TermsOfService />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnimatedRoutes>
      </Suspense>
    </>
  );
};

/**
 * Combines all app-level context providers in a single component
 * Reduces nesting complexity and improves readability
 */
const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="sprouthub-ui-theme">
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <ProfileDataProvider>
              <NotificationPreferencesProvider>
                <NotificationProvider>
                  {children}
                </NotificationProvider>
              </NotificationPreferencesProvider>
            </ProfileDataProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

const App = () => (
  <Sentry.ErrorBoundary
    fallback={({ error, resetError }) => (
      <div className="min-h-dvh bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-6 space-y-4">
          <h1 className="text-2xl font-bold text-destructive">
            Oops! Something went wrong
          </h1>
          <p className="text-muted-foreground">
            We're sorry, but something unexpected happened. The error has been
            reported and we'll look into it.
          </p>
          {import.meta.env.DEV && (
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Error details (dev only)
              </summary>
              <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                {error instanceof Error ? error.message : 'An unknown error occurred'}
              </pre>
            </details>
          )}
          <button
            onClick={() => {
              resetError();
              window.location.href = "/";
            }}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 px-4 rounded-lg font-medium transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    )}
    showDialog={false}
  >
    <AppProviders>
      <AppRoutes />
    </AppProviders>
  </Sentry.ErrorBoundary>
);

export default App;
