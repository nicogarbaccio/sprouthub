import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AuthUpsellProps {
 title?: string;
 description?: string;
 variant?: "inline" | "card";
 source?: "homepage" | "catalog" | "generic";
 className?: string;
}

export function AuthUpsell({
 title,
 description,
 variant = "card",
 source = "generic",
 className,
}: AuthUpsellProps) {
 const navigate = useNavigate();
 const location = useLocation();
 const redirect = useMemo(
 () => encodeURIComponent(location.pathname + location.search),
 [location]
 );

 const defaultCopy =
 source === "homepage"
  ? {
   title: "Create an account or sign in to view the entire collection",
   description: "Get full access to all plants, care guides, and more.",
  }
  : {
   title: "You’re viewing a preview",
   description:
   "Sign up or sign in to browse the full catalog and all pages.",
  };

 const heading = title ?? defaultCopy.title;
 const body = description ?? defaultCopy.description;

 return (
 <div
  className={cn(
  variant === "card" && "rounded-tile bg-sprout-cream text-sprout-dark p-5 md:p-6",
  className
  )}
  data-testid="auth-upsell"
 >
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
  <div>
   <h3 className="font-display text-xl font-bold tracking-[-0.02em]">{heading}</h3>
   <p className={cn("text-[15px] font-medium mt-0.5", variant === "inline" && "text-muted-foreground")}>{body}</p>
  </div>
  <div className="flex gap-2 shrink-0">
   <button
   type="button"
   onClick={() => navigate(`/auth?mode=sign-up&redirect=${redirect}`)}
   className="h-12 px-5 rounded-[18px] bg-sprout-dark text-sprout-cream font-bold text-[15px] shadow-[inset_0_0_0_2px_#dfc490]"
   data-testid="upsell-sign-up"
   >
   Sign up free
   </button>
   <button
   type="button"
   onClick={() => navigate(`/auth?mode=sign-in&redirect=${redirect}`)}
   className="h-12 px-5 rounded-[18px] border-[1.5px] border-current font-bold text-[15px]"
   data-testid="upsell-sign-in"
   >
   Sign in
   </button>
  </div>
  </div>
 </div>
 );
}
