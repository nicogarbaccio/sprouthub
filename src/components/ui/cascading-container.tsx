import React, { useState, useEffect } from "react";
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
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    if (!isVisible) return;
    
    const timer = setTimeout(() => {
      setHasAnimated(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, isVisible]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        "transition-all duration-500 ease-out",
        hasAnimated ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4",
        className
      )}
    >
      {children}
    </div>
  );
};
