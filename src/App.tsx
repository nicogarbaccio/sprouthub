import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileDataProvider } from "@/contexts/ProfileDataContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { NotificationPreferencesProvider } from "@/contexts/NotificationPreferencesContext";
import { setNotificationNavigate } from "@/utils/notification-generator";
import { useEffect, Suspense, lazy } from "react";
import { App as CapacitorApp } from '@capacitor/app';
import * as Sentry from "@sentry/react";
import { useIOSOptimizations } from "@/hooks/useIOSOptimizations";
import { useStatusBar } from "@/hooks/useStatusBar";
import ScrollToTop from "./components/ScrollToTop";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PlantCatalogPage = lazy(() => import("./pages/PlantCatalog"));
const PlantDetails = lazy(() => import("./pages/PlantDetails"));
const MyPlants = lazy(() => import("./pages/MyPlants"));
const MyPlantDetails = lazy(() => import("./pages/MyPlantDetails"));
const Households = lazy(() => import("./pages/Households"));
const HouseholdManagement = lazy(() => import("./pages/HouseholdManagement"));
const Profile = lazy(() => import("./pages/Profile"));
const Settings = lazy(() => import("./pages/Settings"));
const About = lazy(() => import("./pages/About"));
const Analytics = lazy(() => import("./pages/Analytics"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const SkeletonDemo = lazy(() => import("./pages/SkeletonDemo"));
const ToastDemo = lazy(() => import("./components/ToastDemo"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

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

  return (
    <>
      <ScrollToTop />
      <Suspense fallback={<div className="min-h-screen bg-background" />}>
        <Routes>
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
          <Route path="/my-plants" element={<MyPlants />} />
          <Route
            path="/my-plants/:plantId"
            element={<MyPlantDetails />}
          />
          <Route path="/households" element={<Households />} />
          <Route
            path="/households/:id"
            element={<HouseholdManagement />}
          />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/about" element={<About />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/skeleton-demo" element={<SkeletonDemo />} />
          <Route path="/toast-demo" element={<ToastDemo />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
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
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-lg shadow-lg p-6 space-y-4">
          <h1 className="text-2xl font-bold text-destructive">
            Oops! Something went wrong
          </h1>
          <p className="text-muted-foreground">
            We're sorry, but something unexpected happened. The error has been
            reported and we'll look into it.
          </p>
          <details className="text-sm">
            <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
              Error details
            </summary>
            <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
              {error instanceof Error ? error.message : 'An unknown error occurred'}
            </pre>
          </details>
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
