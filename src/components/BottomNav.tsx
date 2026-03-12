import { Home, BookOpen, Flower2, MoreHorizontal, LogIn, User, Users, BarChart3, Settings, Moon, Sun, LogOut, X, Newspaper } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { authToast } from "@/utils/notifications/toast";
import { Sheet, SheetContent, SheetClose } from "@/components/ui/sheet";
import * as React from "react";

interface NavTab {
  label: string;
  icon: React.ElementType;
  to: string;
}

const BottomNav = () => {
  const { user, signOut } = useAuth();
  const { actualTheme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [moreOpen, setMoreOpen] = React.useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      authToast.signOutSuccess();
      navigate("/");
      setMoreOpen(false);
    } catch (error) {
      console.error("Sign out error:", error);
      authToast.signOutError();
    }
  };

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
            onClick={() => setMoreOpen(true)}
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

      {/* More menu sheet */}
      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl bg-background dark:bg-sprout-dark p-0 max-h-[70vh]"
          closeClassName="hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="flex items-center justify-between p-4 border-b">
            <span className="text-lg font-semibold text-foreground dark:text-sprout-cream">
              More
            </span>
            <SheetClose className="rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </SheetClose>
          </div>
          <div className="flex flex-col gap-1 p-4">
            <MoreLink icon={BookOpen} label="Plant Catalog" to="/plant-catalog" onNavigate={() => setMoreOpen(false)} />
            {user && (
              <>
                <MoreLink icon={User} label="Profile" to="/profile" onNavigate={() => setMoreOpen(false)} />
                <MoreLink icon={Users} label="Households" to="/households" onNavigate={() => setMoreOpen(false)} />
                <MoreLink icon={BarChart3} label="Analytics" to="/analytics" onNavigate={() => setMoreOpen(false)} />
                <MoreLink icon={Settings} label="Settings" to="/settings" onNavigate={() => setMoreOpen(false)} />
              </>
            )}
            <button
              onClick={() => {
                setTheme(actualTheme === "dark" ? "light" : "dark");
              }}
              className="w-full text-left text-foreground hover:bg-muted flex items-center gap-3 h-12 px-4 rounded-lg font-medium transition-colors"
            >
              {actualTheme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              <span>{actualTheme === "dark" ? "Light Mode" : "Dark Mode"}</span>
            </button>
            {user && (
              <>
                <div className="border-t my-1" />
                <button
                  onClick={handleSignOut}
                  className="w-full text-left text-sprout-warning hover:bg-muted flex items-center gap-3 h-12 px-4 rounded-lg font-medium transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

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
      className={`flex items-center gap-3 h-12 px-4 rounded-lg font-medium transition-colors ${
        active
          ? "text-sprout-primary dark:text-sprout-cream bg-muted"
          : "text-foreground hover:bg-muted"
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </Link>
  );
};

export default BottomNav;
