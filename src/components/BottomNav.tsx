import { Home, BookOpen, Flower2, MoreHorizontal, LogIn, User, Users, BarChart3, Settings, Moon, Sun, LogOut, X, Newspaper } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { authToast } from "@/utils/notifications/toast";
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
  const location = useLocation();
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
        { label: "My Plants", icon: Flower2, to: "/my-plants" },
        { label: "Discover", icon: Newspaper, to: "/discover" },
      ]
    : [
        { label: "Home", icon: Home, to: "/" },
        { label: "Discover", icon: Newspaper, to: "/discover" },
        { label: "Sign In", icon: LogIn, to: "/auth" },
      ];

  const isActive = (to: string) => {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  };

  const moreRoutes = ["/plant-catalog", "/profile", "/households", "/analytics", "/settings"];
  const isMoreActive = moreOpen || moreRoutes.some((r) => location.pathname.startsWith(r));

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

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 bg-background dark:bg-sprout-dark border-t border-border lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="flex items-center justify-around h-16">
          {tabs.map((tab) => {
            const active = isActive(tab.to);
            return (
              <Link
                key={tab.to}
                to={tab.to}
                className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                  active
                    ? "text-sprout-primary dark:text-sprout-cream"
                    : "text-muted-foreground"
                }`}
              >
                <tab.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </Link>
            );
          })}

          {/* More tab */}
          <button
            onClick={handleOpen}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
              isMoreActive
                ? "text-sprout-primary dark:text-sprout-cream"
                : "text-muted-foreground"
            }`}
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* Overlay — stays pointer-events:auto during close animation to block iOS touch passthrough */}
      <div
        className={`fixed inset-0 z-50 bg-black/80 lg:hidden transition-opacity duration-200 ${
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
        className={`fixed inset-x-0 bottom-0 z-50 rounded-t-2xl bg-background dark:bg-sprout-dark p-0 max-h-[70vh] border-t shadow-lg lg:hidden transition-transform duration-250 ease-out ${
          moreOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <SheetContent
          user={!!user}
          actualTheme={actualTheme}
          setTheme={setTheme}
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
  onClose,
  onSignOut,
}: {
  user: boolean;
  actualTheme: "light" | "dark";
  setTheme: (theme: "light" | "dark" | "system") => void;
  onClose: () => void;
  onSignOut: () => void;
}) => {
  return (
    <>
      <div className="flex items-center justify-between p-4 border-b">
        <span className="text-lg font-semibold text-foreground dark:text-sprout-cream">
          More
        </span>
        <button
          onClick={onClose}
          className="rounded-sm opacity-70 focus:outline-none"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
      </div>
      <div className="flex flex-col gap-1 p-4">
        <MoreLink icon={BookOpen} label="Plant Catalog" to="/plant-catalog" onNavigate={onClose} />
        {user && (
          <>
            <MoreLink icon={User} label="Profile" to="/profile" onNavigate={onClose} />
            <MoreLink icon={Users} label="Households" to="/households" onNavigate={onClose} />
            <MoreLink icon={BarChart3} label="Analytics" to="/analytics" onNavigate={onClose} />
            <MoreLink icon={Settings} label="Settings" to="/settings" onNavigate={onClose} />
          </>
        )}
        <button
          onClick={() => {
            setTheme(actualTheme === "dark" ? "light" : "dark");
          }}
          className="w-full text-left text-foreground flex items-center gap-3 h-12 px-4 rounded-lg font-medium"
          style={{ transition: "none" }}
        >
          {actualTheme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          <span>{actualTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>
        </button>
        {user && (
          <>
            <div className="border-t my-1" />
            <button
              onClick={onSignOut}
              className="w-full text-left text-sprout-warning flex items-center gap-3 h-12 px-4 rounded-lg font-medium"
              style={{ transition: "none" }}
            >
              <LogOut className="w-5 h-5" style={{ transition: "none" }} />
              <span style={{ transition: "none" }}>Sign Out</span>
            </button>
          </>
        )}
      </div>
    </>
  );
});

SheetContent.displayName = "SheetContent";

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
  const location = useLocation();
  const active = location.pathname.startsWith(to);
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={`flex items-center gap-3 h-12 px-4 rounded-lg font-medium ${
        active
          ? "text-sprout-primary dark:text-sprout-cream bg-muted"
          : "text-foreground"
      }`}
      style={{ transition: "none" }}
    >
      <Icon className="w-5 h-5" style={{ transition: "none" }} />
      <span style={{ transition: "none" }}>{label}</span>
    </Link>
  );
};

export default BottomNav;
