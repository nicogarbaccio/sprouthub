import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

 const Wrapper: any = variant === "inline" ? "div" : Card;

 return (
 <Wrapper className={className} data-testid="auth-upsell">
  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4">
  <div className="text-center sm:text-left">
   <h3 className="text-lg font-semibold">{heading}</h3>
   <p className="text-muted-foreground">{body}</p>
  </div>
  <div className="flex gap-3">
   <Button
   onClick={() =>
    navigate(`/auth?mode=sign-up&redirect=${redirect}`)
   }
   className="bg-sprout-success hover:bg-sprout-success/90 text-white"
   data-testid="upsell-sign-up"
   >
   Sign up free
   </Button>
   <Button
   variant="outline"
   onClick={() => navigate(`/auth?mode=sign-in&redirect=${redirect}`)}
   data-testid="upsell-sign-in"
   >
   Sign in
   </Button>
  </div>
  </div>
 </Wrapper>
 );
}


