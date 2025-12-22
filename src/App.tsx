import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProfileDataProvider } from "@/contexts/ProfileDataContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import PlantCatalogPage from "./pages/PlantCatalog";
import PlantDetails from "./pages/PlantDetails";
import MyPlants from "./pages/MyPlants";
import MyPlantDetails from "./pages/MyPlantDetails";
import Households from "./pages/Households";
import HouseholdManagement from "./pages/HouseholdManagement";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import About from "./pages/About";
import Analytics from "./pages/Analytics";
import SkeletonDemo from "./pages/SkeletonDemo";
import ToastDemo from "./components/ToastDemo";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="system" storageKey="sprouthub-ui-theme">
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <ProfileDataProvider>
              <NotificationProvider>
                <ScrollToTop />
                <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
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
                <Route path="/skeleton-demo" element={<SkeletonDemo />} />
                <Route path="/toast-demo" element={<ToastDemo />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </NotificationProvider>
            </ProfileDataProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
