import {
  Home,
  BookOpen,
  Newspaper,
  User,
  LogOut,
  Flower2,
  Users,
  Settings as SettingsIcon,
  Bell,
  BarChart3,
  Bookmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useProfileData } from "@/contexts/ProfileDataContext";
import { useNavigate, Link } from "react-router-dom";
import * as React from "react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { useTheme } from "@/contexts/ThemeContext";
import { authToast } from "@/utils/notifications/toast";
import { ThemeAwareLogo } from "@/components/ui/theme-aware-logo";
import { useNotifications } from "@/contexts/NotificationContext";
import { NotificationCenter } from "@/components/NotificationCenter";
import { Badge } from "@/components/ui/badge";
import { QuickActionsMenu } from "@/components/QuickActionsMenu";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";
import { NavigationSkeleton } from "@/components/NavigationSkeleton";

const Navigation = () => {
  const { user, signOut, loading } = useAuth();
  const { profileData } = useProfileData();
  const { actualTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [showNotificationCenter, setShowNotificationCenter] = React.useState(false);
  const [showQuickActions, setShowQuickActions] = React.useState(false);

  // Global keyboard shortcuts
  useGlobalShortcuts({
    onQuickActionsOpen: () => setShowQuickActions(true),
    onNotificationsOpen: () => setShowNotificationCenter(true),
    onThemeToggle: () => setTheme(actualTheme === 'dark' ? 'light' : 'dark'),
  });

  const handleSignIn = () => {
    console.log("Navigation: Sign in button clicked, current user:", user);
    console.log("Navigation: Navigating to /auth");
    navigate("/auth");
  };

  const handleSignOut = async (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    try {
      console.log("Attempting to sign out...");
      await signOut();
      console.log("Sign out successful, navigating to home...");
      authToast.signOutSuccess();
      navigate("/");
    } catch (error) {
      console.error("Sign out error:", error);
      authToast.signOutError();
    }
  };

  // Helper to get initials for fallback
  const getInitials = () => {
    if (profileData.first_name && profileData.last_name) {
      return `${profileData.first_name.charAt(0)}${profileData.last_name.charAt(
        0
      )}`.toUpperCase();
    }
    return `${profileData.email.charAt(0)}${profileData.email.charAt(
      1
    )}`.toUpperCase();
  };

  // Show skeleton while authentication is loading
  if (loading) {
    return <NavigationSkeleton />;
  }

  return (
    <React.Fragment>
      <nav
        className="bg-background dark:bg-sprout-dark shadow-sm border-b border-sprout-cream/30 dark:border-sprout-cream/20 transition-colors backdrop-blur-sm sticky top-0 z-40"
        data-testid="navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              to="/"
              className="flex items-center gap-3 group"
              data-testid="logo"
            >
              <ThemeAwareLogo className="h-8 w-auto" />
              <span className="text-2xl font-bold text-sprout-primary dark:text-sprout-cream transition-colors duration-200">
                sprouthub
              </span>
            </Link>

            {/* Desktop Nav - Grouped with user section */}
            <div className="hidden lg:flex items-center space-x-4">
              <ThemeToggle />
              {user && (
                <Link to="/">
                  <Button
                    variant="ghost"
                    className="text-foreground hover:text-white hover:bg-sprout-medium dark:hover:bg-sprout-medium/20 dark:hover:text-white flex items-center space-x-2 transition-all duration-200 rounded-lg font-medium"
                    data-testid="nav-dashboard-button"
                  >
                    <Home className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Button>
                </Link>
              )}
              <Link to="/discover">
                <Button
                  variant="ghost"
                  className="text-foreground hover:text-white hover:bg-sprout-medium dark:hover:bg-sprout-medium/20 dark:hover:text-white flex items-center space-x-2 transition-all duration-200 rounded-lg font-medium"
                  data-testid="nav-discover-button"
                >
                  <Newspaper className="w-4 h-4" />
                  <span>Discover</span>
                </Button>
              </Link>
              <Link to="/plant-catalog">
                <Button
                  variant="ghost"
                  className="text-foreground hover:text-white hover:bg-sprout-medium dark:hover:bg-sprout-medium/20 dark:hover:text-white flex items-center space-x-2 transition-all duration-200 rounded-lg font-medium"
                  data-testid="nav-plant-catalog-button"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Plant Catalog</span>
                </Button>
              </Link>
              {user && (
                <Link to="/my-plants">
                  <Button
                    variant="ghost"
                    className="text-foreground hover:text-white hover:bg-sprout-medium dark:hover:bg-sprout-medium/20 dark:hover:text-white flex items-center space-x-2 transition-all duration-200 rounded-lg font-medium"
                    data-testid="nav-my-plants-button"
                  >
                    <Flower2 className="w-4 h-4" />
                    <span>My Plants</span>
                  </Button>
                </Link>
              )}
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-foreground hover:text-white hover:bg-sprout-medium dark:hover:bg-sprout-medium/20 dark:hover:text-white transition-all duration-200 rounded-lg"
                  onClick={() => setShowNotificationCenter(true)}
                  data-testid="nav-notifications-button"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-xs flex items-center justify-center"
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              )}

              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-neutral-medium hover:text-sprout-primary p-0 !border-none !ring-0 !outline-none !focus:outline-none !focus-visible:outline-none focus:shadow-none focus-visible:shadow-none rounded-full data-[state=open]:outline-none data-[state=open]:ring-0 data-[state=open]:shadow-none group"
                      data-testid="user-dropdown-trigger"
                      style={{
                        background: "none",
                        border: "none",
                        outline: "none",
                        boxShadow: "none",
                        boxSizing: "border-box",
                      }}
                    >
                      <Avatar
                        className="w-10 h-10 transition-all duration-200 hover:ring-4 hover:ring-sprout-primary dark:hover:ring-white hover:ring-offset-2 dark:hover:ring-offset-background hover:shadow-lg"
                        style={{
                          border: "none",
                          outline: "none",
                          boxShadow: "none",
                        }}
                      >
                        <AvatarImage
                          src={profileData.avatar_url}
                          alt="User avatar"
                        />
                        <AvatarFallback className="text-xs font-medium bg-sprout-pale dark:bg-sprout-medium/30 text-sprout-primary dark:text-white transition-all duration-200 group-hover:bg-sprout-primary group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-sprout-primary">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => navigate("/profile")}
                      className="cursor-pointer"
                    >
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/households")}
                      className="cursor-pointer"
                    >
                      <Users className="w-4 h-4 mr-2" />
                      Households
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/analytics")}
                      className="cursor-pointer"
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Analytics
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/my-articles")}
                      className="cursor-pointer"
                    >
                      <Bookmark className="w-4 h-4 mr-2" />
                      My Articles
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => navigate("/settings")}
                      className="cursor-pointer"
                    >
                      <SettingsIcon className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={(event) => handleSignOut(event)}
                      className="text-sprout-warning dark:text-sprout-warning cursor-pointer"
                      data-testid="sign-out-button"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button
                  onClick={handleSignIn}
                  className="bg-sprout-dark hover:bg-sprout-primary dark:hover:bg-sprout-medium/20 text-sprout-white font-medium shadow-sm"
                  data-testid="nav-sign-in-button"
                >
                  Sign In
                </Button>
              )}
            </div>

            {/* Mobile Nav - minimal top bar, main nav is in BottomNav */}
            <div className="lg:hidden flex items-center gap-2">
              {user && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative text-foreground"
                  onClick={() => setShowNotificationCenter(true)}
                  data-testid="mobile-nav-notifications-button"
                >
                  <Bell className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] flex items-center justify-center"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Notification Center */}
      <NotificationCenter
        open={showNotificationCenter}
        onOpenChange={setShowNotificationCenter}
      />

      {/* Quick Actions Menu */}
      <QuickActionsMenu
        open={showQuickActions}
        onOpenChange={setShowQuickActions}
      />
    </React.Fragment>
  );
};

export default Navigation;
