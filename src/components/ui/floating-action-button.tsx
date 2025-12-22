import React, { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FloatingActionButtonProps {
  onClick: () => void;
  icon?: React.ReactNode;
  label?: string;
  className?: string;
  hideOnScroll?: boolean;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onClick,
  icon = <Plus className="w-6 h-6" />,
  label = "Add Plant",
  className,
  hideOnScroll = true,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (!hideOnScroll) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Show when scrolling up, hide when scrolling down
      if (currentScrollY < lastScrollY || currentScrollY < 100) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [lastScrollY, hideOnScroll]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            onClick={onClick}
            className={cn(
              "fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg",
              "bg-gradient-to-r from-green-500 to-emerald-500",
              "hover:from-green-600 hover:to-emerald-600",
              "hover:shadow-xl hover:scale-110",
              "transition-all duration-300",
              "flex items-center justify-center",
              !isVisible && "translate-y-20 opacity-0 pointer-events-none",
              className
            )}
            size="icon"
            data-testid="floating-action-button"
          >
            {icon}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>{label}</p>
          <p className="text-xs text-muted-foreground">Press 'A' for shortcut</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
