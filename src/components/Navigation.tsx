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
  MoreHorizontal,
  Moon,
  Sun,
  LogIn,
} from "lucide-react";
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
import { useTheme } from "@/contexts/ThemeContext";
import { authToast } from "@/utils/notifications/toast";
import { useNotifications } from "@/contexts/NotificationContext";
import { useGlobalShortcuts } from "@/hooks/useGlobalShortcuts";
import { preloadWhenIdle } from "@/utils/preloadWhenIdle";
import { OPEN_NOTIFICATIONS_EVENT } from "@/utils/appEvents";
import { Logo } from "@/components/ui/logo";
import { cn } from "@/lib/utils";
import { isNavActive, useNavPath } from "@/hooks/useNavPath";

// These panels only open on demand, so keep them out of the main bundle.
// They mount the first time they're opened and are preloaded once the app is idle.
const loadNotificationCenter = () => import("@/components/NotificationCenter");
const loadQuickActionsMenu = () => import("@/components/QuickActionsMenu");
const NotificationCenter = React.lazy(() =>
  loadNotificationCenter().then((m) => ({ default: m.NotificationCenter }))
);
const QuickActionsMenu = React.lazy(() =>
  loadQuickActionsMenu().then((m) => ({ default: m.QuickActionsMenu }))
);

/**
 * Left-hand navigation for tablet landscape and desktop.
 *
 * lg: an icon rail. xl: a full sidebar with labels. Below lg the bottom bar takes over, but this
 * component stays mounted everywhere because it owns the notification center and quick actions.
 */
const Navigation = () => {
  const { user, signOut, loading } = useAuth();
  const { profileData } = useProfileData();
  const { actualTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  const [showNotificationCenter, setShowNotificationCenter] = React.useState(false);
  const [showQuickActions, setShowQuickActions] = React.useState(false);
  // Stay mounted after the first open so the close animation still plays
  const [notificationCenterMounted, setNotificationCenterMounted] = React.useState(false);
  const [quickActionsMounted, setQuickActionsMounted] = React.useState(false);
  if (showNotificationCenter && !notificationCenterMounted) setNotificationCenterMounted(true);
  if (showQuickActions && !quickActionsMounted) setQuickActionsMounted(true);

  React.useEffect(() => preloadWhenIdle([loadNotificationCenter, loadQuickActionsMenu]), []);

  // The Home header bell and the mobile More sheet open the notification center from outside
  React.useEffect(() => {
    const handleOpen = () => setShowNotificationCenter(true);
    window.addEventListener(OPEN_NOTIFICATIONS_EVENT, handleOpen);
    return () => window.removeEventListener(OPEN_NOTIFICATIONS_EVENT, handleOpen);
  }, []);

  // Global keyboard shortcuts
  useGlobalShortcuts({
    onQuickActionsOpen: () => setShowQuickActions(true),
    onNotificationsOpen: () => setShowNotificationCenter(true),
    onThemeToggle: () => setTheme(actualTheme === 'dark' ? 'light' : 'dark'),
  });

  const handleSignOut = async (event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    try {
      await signOut();
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

  // Highlight follows the address bar, not the router's committed location, so it moves the
  // moment a link is clicked even while the next page is still loading
  const navPath = useNavPath();
  const isActive = (to: string) => isNavActive(navPath, to);

  const displayName = profileData.first_name?.trim() || "Account";

  return (
    <React.Fragment>
      <aside
        className="hidden lg:flex fixed inset-y-0 left-0 z-40 w-[92px] xl:w-[248px] flex-col items-center xl:items-stretch gap-1.5 bg-nav text-nav-foreground py-6 xl:py-7 xl:px-4 overflow-y-auto scrollbar-none"
        data-testid="navigation"
      >
        <Link
          to="/"
          className="flex items-center gap-2.5 font-display font-extrabold text-white text-[22px] tracking-tight pb-[18px] xl:pb-6 xl:px-3"
          data-testid="logo"
          aria-label="sprouthub home"
        >
          <Logo onGreen alt="" className="h-10 w-auto shrink-0" />
          <span className="hidden xl:inline"><span className="text-sprout-success">sprout</span><span className="text-sprout-cream">hub</span></span>
        </Link>

        {/* While auth resolves, show only the logo so links don't flash in and out */}
        {!loading && (
          <>
            {user && (
              <NavItem to="/" icon={Home} label="Home" active={isActive("/")} testId="nav-dashboard-button" />
            )}
            {user && (
              <NavItem to="/my-plants" icon={Flower2} label="My Plants" active={isActive("/my-plants")} testId="nav-my-plants-button" />
            )}
            <NavItem to="/discover" icon={Newspaper} label="Discover" active={isActive("/discover")} testId="nav-discover-button" />
            <NavItem to="/plant-catalog" icon={BookOpen} label="Plant Catalog" active={isActive("/plant-catalog")} testId="nav-plant-catalog-button" />
            {user && (
              <NavItem to="/analytics" icon={BarChart3} label="Analytics" active={isActive("/analytics")} testId="nav-analytics-button" />
            )}

            <div className="flex-1" />

            {user ? (
              <>
                <NavButton
                  icon={Bell}
                  label="Notifications"
                  onClick={() => setShowNotificationCenter(true)}
                  testId="nav-notifications-button"
                  badge={unreadCount > 0 ? (unreadCount > 9 ? "9+" : String(unreadCount)) : undefined}
                />
                {/* Households and Settings live in the account menu below, keeping the rail short */}

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="w-14 h-14 xl:w-auto xl:h-[52px] rounded-[18px] flex items-center justify-center xl:justify-start gap-3 xl:px-2 mt-1 font-semibold text-[15px] hover:bg-white/5 hover:text-sprout-cream transition-colors outline-none focus-visible:ring-2 focus-visible:ring-sprout-cream"
                      data-testid="user-dropdown-trigger"
                      aria-label="Account menu"
                    >
                      <MoreHorizontal className="w-[22px] h-[22px] xl:hidden" />
                      <Avatar className="hidden xl:flex w-9 h-9">
                        <AvatarImage src={profileData.avatar_url} alt="User avatar" />
                        <AvatarFallback className="text-xs font-bold bg-sprout-cream text-sprout-dark">
                          {getInitials()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="hidden xl:inline truncate">{displayName}</span>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent side="right" align="end" className="w-56 rounded-2xl">
                    <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/households")} className="cursor-pointer">
                      <Users className="w-4 h-4 mr-2" />
                      Households
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/my-articles")} className="cursor-pointer">
                      <Bookmark className="w-4 h-4 mr-2" />
                      My Articles
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                      <SettingsIcon className="w-4 h-4 mr-2" />
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => setTheme(actualTheme === "dark" ? "light" : "dark")}
                      className="cursor-pointer"
                    >
                      {actualTheme === "dark" ? <Sun className="w-4 h-4 mr-2" /> : <Moon className="w-4 h-4 mr-2" />}
                      {actualTheme === "dark" ? "Light Mode" : "Dark Mode"}
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
              </>
            ) : (
              <>
                <NavButton
                  icon={actualTheme === "dark" ? Sun : Moon}
                  label={actualTheme === "dark" ? "Light Mode" : "Dark Mode"}
                  onClick={() => setTheme(actualTheme === "dark" ? "light" : "dark")}
                />
                <Link
                  to="/auth"
                  className="w-14 h-14 xl:w-auto xl:h-[52px] rounded-[18px] bg-sprout-cream text-sprout-dark flex items-center justify-center xl:justify-start gap-3 xl:px-3.5 font-bold text-[15px]"
                  data-testid="nav-sign-in-button"
                  aria-label="Sign In"
                >
                  <LogIn className="w-[22px] h-[22px]" />
                  <span className="hidden xl:inline">Sign In</span>
                </Link>
              </>
            )}
          </>
        )}
      </aside>

      <React.Suspense fallback={null}>
        {/* Notification Center */}
        {notificationCenterMounted && (
          <NotificationCenter
            open={showNotificationCenter}
            onOpenChange={setShowNotificationCenter}
          />
        )}

        {/* Quick Actions Menu */}
        {quickActionsMounted && (
          <QuickActionsMenu
            open={showQuickActions}
            onOpenChange={setShowQuickActions}
          />
        )}
      </React.Suspense>
    </React.Fragment>
  );
};

const itemClasses = (active: boolean) =>
  cn(
    // No colour transition: a fading highlight briefly leaves the previous item brighter than
    // the new one, which reads as a flicker. The global `*` transition covers the icon and
    // label too, hence [&_*].
    "relative w-14 h-14 xl:w-auto xl:h-[52px] rounded-[18px] flex items-center justify-center xl:justify-start gap-3 xl:px-3.5 text-[15px] transition-none [&_*]:transition-none shrink-0",
    active
      ? "bg-sprout-cream text-sprout-dark font-bold"
      : "font-semibold hover:bg-white/5 hover:text-sprout-cream"
  );

const NavItem = ({
  to,
  icon: Icon,
  label,
  active,
  testId,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  active: boolean;
  testId?: string;
}) => (
  <Link
    to={to}
    className={itemClasses(active)}
    aria-label={label}
    aria-current={active ? "page" : undefined}
    title={label}
    data-testid={testId}
  >
    <Icon className="w-[22px] h-[22px] shrink-0" />
    <span className="hidden xl:inline">{label}</span>
  </Link>
);

const NavButton = ({
  icon: Icon,
  label,
  onClick,
  testId,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  testId?: string;
  badge?: string;
}) => (
  <button
    onClick={onClick}
    className={itemClasses(false)}
    aria-label={label}
    title={label}
    data-testid={testId}
  >
    <Icon className="w-[22px] h-[22px] shrink-0" />
    <span className="hidden xl:inline flex-1 text-left">{label}</span>
    {badge && (
      <span className="absolute top-2 right-2 xl:static min-w-5 h-5 px-1.5 rounded-full bg-sprout-warning text-sprout-dark text-[11px] font-bold flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
);

export default Navigation;
