import { Home, BookOpen, Flower2, MoreHorizontal, LogIn, User, Users, BarChart3, Settings, Moon, Sun, LogOut, X, Newspaper, Plus, Bell, Bookmark } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { authToast } from "@/utils/notifications/toast";
import { useNotifications } from "@/contexts/NotificationContext";
import { openAddPlant, openNotificationCenter } from "@/utils/appEvents";
import { cn } from "@/lib/utils";
import { isNavActive, useNavPath } from "@/hooks/useNavPath";
import * as React from "react";

interface NavTab {
  label: string;
  icon: React.ElementType;
  to: string;
}

const CLOSE_ANIMATION_MS = 300;

const BottomNav = () => {
  const { user, signOut } = useAuth();
  const { actualTheme, setTheme } = useTheme();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = React.useState(false);
  // Tracks whether the overlay should block touches — stays true during close animation
  const [overlayBlocking, setOverlayBlocking] = React.useState(false);

  const handleSignOut = React.useCallback(async () => {
    try {
      await signOut();
      authToast.signOutSuccess();
      navigate("/");
      setMoreOpen(false);
    } catch (error) {
      console.error("Sign out error:", error);
      authToast.signOutError();
    }
  }, [signOut, navigate]);

  const handleOpen = React.useCallback(() => {
    setMoreOpen(true);
    setOverlayBlocking(true);
  }, []);

  const handleClose = React.useCallback(() => {
    setMoreOpen(false);
    // Keep overlay blocking touches until the sheet close animation finishes,
    // preventing iOS from dispatching touches to content behind the sheet
    setTimeout(() => setOverlayBlocking(false), CLOSE_ANIMATION_MS);
  }, []);

  const tabs: NavTab[] = user
    ? [
        { label: "Home", icon: Home, to: "/" },
        { label: "Plants", icon: Flower2, to: "/my-plants" },
        { label: "Discover", icon: Newspaper, to: "/discover" },
      ]
    : [
        { label: "Home", icon: Home, to: "/" },
        { label: "Discover", icon: Newspaper, to: "/discover" },
        { label: "Sign In", icon: LogIn, to: "/auth" },
      ];

  // Highlight follows the address bar so it moves as soon as a tab is tapped (see useNavPath)
  const navPath = useNavPath();
  const isActive = (to: string) => isNavActive(navPath, to);

  const moreRoutes = ["/plant-catalog", "/profile", "/households", "/analytics", "/settings", "/my-articles"];
  const isMoreActive = moreOpen || moreRoutes.some((r) => navPath.startsWith(r));

  // Lock body scroll when sheet is open
  React.useEffect(() => {
    if (moreOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [moreOpen]);

  const renderTab = (tab: NavTab) => {
    const active = isActive(tab.to);
    return (
      <Link
        key={tab.to}
        to={tab.to}
        aria-current={active ? "page" : undefined}
        className={cn(
          "flex flex-col items-center justify-center flex-1 h-full gap-[3px] transition-none [&_*]:transition-none",
          active ? "text-sprout-cream" : "text-nav-foreground"
        )}
      >
        <tab.icon className="w-[22px] h-[22px]" />
        <span className={cn("text-[11px]", active ? "font-bold" : "font-semibold")}>
          {tab.label}
        </span>
      </Link>
    );
  };

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-nav rounded-t-tile lg:hidden"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 10px)" }}
      >
        <div className="flex items-center justify-around h-[72px] px-3">
          {user ? (
            <>
              {renderTab(tabs[0])}
              {renderTab(tabs[1])}
              {/* Add plant — the one primary action, so it gets the raised cream button */}
              <div className="flex-1 flex justify-center">
                <button
                  onClick={openAddPlant}
                  aria-label="Add plant"
                  data-testid="bottom-nav-add-plant"
                  className="w-[60px] h-[60px] -mt-2 rounded-[22px] bg-sprout-cream text-sprout-dark flex items-center justify-center shadow-[0_8px_20px_rgba(29,60,40,0.3)] active:scale-95 transition-transform"
                >
                  <Plus className="w-7 h-7" strokeWidth={2.5} />
                </button>
              </div>
              {renderTab(tabs[2])}
            </>
          ) : (
            tabs.map(renderTab)
          )}

          {/* More tab */}
          <button
            onClick={handleOpen}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full gap-[3px] transition-none [&_*]:transition-none",
              isMoreActive ? "text-sprout-cream" : "text-nav-foreground"
            )}
          >
            <MoreHorizontal className="w-[22px] h-[22px]" />
            <span className={cn("text-[11px]", isMoreActive ? "font-bold" : "font-semibold")}>
              More
            </span>
          </button>
        </div>
      </nav>

      {/* Overlay — stays pointer-events:auto during close animation to block iOS touch passthrough */}
      <div
        className={`fixed inset-0 z-50 bg-sprout-dark/60 lg:hidden transition-opacity duration-200 ${
          moreOpen ? "opacity-100" : "opacity-0"
        } ${overlayBlocking ? "pointer-events-auto" : "pointer-events-none"}`}
        style={{ touchAction: "none" }}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* More menu bottom sheet — fully declarative */}
      <div
        role="dialog"
        aria-modal={moreOpen}
        aria-label="More menu"
        className={`fixed inset-x-0 bottom-0 z-50 rounded-t-[36px] bg-background px-4 pt-2.5 max-h-[80vh] overflow-y-auto shadow-lg lg:hidden transition-transform duration-250 ease-out ${
          moreOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "max(env(safe-area-inset-bottom, 0px), 20px)" }}
      >
        <SheetContent
          user={!!user}
          actualTheme={actualTheme}
          setTheme={setTheme}
          unreadCount={unreadCount}
          onClose={handleClose}
          onSignOut={handleSignOut}
        />
      </div>
    </>
  );
};

// Memoized sheet content — only re-renders when user/theme truly change
const SheetContent = React.memo(({
  user,
  actualTheme,
  setTheme,
  unreadCount,
  onClose,
  onSignOut,
}: {
  user: boolean;
  actualTheme: "light" | "dark";
  setTheme: (theme: "light" | "dark" | "system") => void;
  unreadCount: number;
  onClose: () => void;
  onSignOut: () => void;
}) => {
  return (
    <>
      <div className="w-11 h-[5px] rounded-full bg-muted-foreground/40 mx-auto" aria-hidden="true" />
      <div className="flex items-center justify-between mt-4 px-1.5">
        <span className="font-display text-2xl font-bold tracking-tight text-foreground">
          More
        </span>
        <button
          onClick={onClose}
          className="w-11 h-11 rounded-2xl bg-card flex items-center justify-center text-foreground"
        >
          <X className="h-5 w-5" />
          <span className="sr-only">Close</span>
        </button>
      </div>
      <div className="flex flex-col gap-1.5 mt-4">
        {user && (
          <SheetButton
            icon={Bell}
            label="Notifications"
            onClick={() => {
              onClose();
              openNotificationCenter();
            }}
            badge={unreadCount > 0 ? (unreadCount > 9 ? "9+" : String(unreadCount)) : undefined}
          />
        )}
        <MoreLink icon={BookOpen} label="Plant Catalog" to="/plant-catalog" onNavigate={onClose} />
        {user && (
          <>
            <MoreLink icon={BarChart3} label="Analytics" to="/analytics" onNavigate={onClose} />
            <MoreLink icon={Users} label="Households" to="/households" onNavigate={onClose} />
            <MoreLink icon={Bookmark} label="My Articles" to="/my-articles" onNavigate={onClose} />
            <MoreLink icon={User} label="Profile" to="/profile" onNavigate={onClose} />
            <MoreLink icon={Settings} label="Settings" to="/settings" onNavigate={onClose} />
          </>
        )}
        <SheetButton
          icon={actualTheme === "dark" ? Sun : Moon}
          label={actualTheme === "dark" ? "Light Mode" : "Dark Mode"}
          onClick={() => setTheme(actualTheme === "dark" ? "light" : "dark")}
        />
        {user && (
          <button
            onClick={onSignOut}
            className="w-full text-left flex items-center gap-3 h-14 px-4 mt-1.5 rounded-[18px] bg-sprout-warning text-sprout-dark font-bold"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </button>
        )}
      </div>
    </>
  );
});

SheetContent.displayName = "SheetContent";

const SheetButton = ({
  icon: Icon,
  label,
  onClick,
  badge,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  badge?: string;
}) => (
  <button
    onClick={onClick}
    className="w-full text-left text-foreground flex items-center gap-3 h-14 px-4 rounded-[18px] bg-card font-semibold"
  >
    <Icon className="w-5 h-5" />
    <span className="flex-1">{label}</span>
    {badge && (
      <span className="min-w-6 h-6 px-2 rounded-full bg-sprout-warning text-sprout-dark text-xs font-bold flex items-center justify-center">
        {badge}
      </span>
    )}
  </button>
);

const MoreLink = ({
  icon: Icon,
  label,
  to,
  onNavigate,
}: {
  icon: React.ElementType;
  label: string;
  to: string;
  onNavigate: () => void;
}) => {
  const active = isNavActive(useNavPath(), to);
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 h-14 px-4 rounded-[18px] font-semibold",
        active ? "bg-sprout-cream text-sprout-dark font-bold" : "bg-card text-foreground"
      )}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </Link>
  );
};

export default BottomNav;
