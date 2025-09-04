import React from "react";
import { cn } from "@/lib/utils";

interface CascadingContainerProps {
 children: React.ReactNode;
 delay?: number;
 className?: string;
 isVisible?: boolean;
}

export const CascadingContainer = ({
 children,
 delay = 0,
 className = "",
 isVisible = true,
}: CascadingContainerProps) => {
 if (!isVisible) return null;

 return (
  <div
   className={cn("animate-slide-up", className)}
   style={{
    animationDelay: `${delay}ms`,
    animationFillMode: "both",
   }}
  >
   {children}
  </div>
 );
};
