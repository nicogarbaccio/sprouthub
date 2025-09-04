import React from "react";
import { RefreshCw, ArrowDown } from "lucide-react";
import { usePullToRefresh } from "@/hooks/use-touch";
import { cn } from "@/lib/utils";

interface PullToRefreshProps {
 onRefresh: () => Promise<void> | void;
 children: React.ReactNode;
 threshold?: number;
 maxPullDistance?: number;
 className?: string;
 disabled?: boolean;
}

export function PullToRefresh({
 onRefresh,
 children,
 threshold = 80,
 maxPullDistance = 120,
 className,
 disabled = false,
}: PullToRefreshProps) {
 const {
 pullDistance,
 isRefreshing,
 isPulling,
 onTouchStart,
 onTouchMove,
 onTouchEnd,
 } = usePullToRefresh({
 threshold,
 maxPullDistance,
 onRefresh: disabled ? undefined : onRefresh,
 });

 React.useEffect(() => {
 if (disabled) return;

 document.addEventListener("touchstart", onTouchStart, { passive: false });
 document.addEventListener("touchmove", onTouchMove, { passive: false });
 document.addEventListener("touchend", onTouchEnd, { passive: false });

 return () => {
  document.removeEventListener("touchstart", onTouchStart);
  document.removeEventListener("touchmove", onTouchMove);
  document.removeEventListener("touchend", onTouchEnd);
 };
 }, [onTouchStart, onTouchMove, onTouchEnd, disabled]);

 const progress = Math.min(pullDistance / threshold, 1);
 const isTriggered = pullDistance >= threshold;

 return (
 <div className={cn("relative", className)}>
  {/* Pull indicator */}
  {isPulling && (
  <div
   className="fixed top-0 left-0 right-0 z-50 bg-plant-primary/10 backdrop-blur-sm transition-all duration-200"
   style={{
   height: `${Math.min(pullDistance, maxPullDistance)}px`,
   transform: `translateY(-${Math.max(
    0,
    maxPullDistance - pullDistance
   )}px)`,
   }}
  >
   <div className="flex items-center justify-center h-full">
   <div className="flex flex-col items-center space-y-2">
    {isTriggered ? (
    <div className="animate-bounce">
     <RefreshCw className="w-6 h-6 text-plant-primary" />
    </div>
    ) : (
    <div
     className="transition-transform duration-200"
     style={{
     transform: `rotate(${progress * 180}deg)`,
     }}
    >
     <ArrowDown className="w-6 h-6 text-plant-primary" />
    </div>
    )}
    <span className="text-xs text-plant-primary font-medium">
    {isTriggered ? "Release to refresh" : "Pull to refresh"}
    </span>
   </div>
   </div>
  </div>
  )}

  {/* Loading indicator */}
  {isRefreshing && (
  <div className="fixed top-0 left-0 right-0 z-50 bg-plant-primary/10 backdrop-blur-sm h-16">
   <div className="flex items-center justify-center h-full">
   <div className="flex items-center space-x-2">
    <RefreshCw className="w-5 h-5 text-plant-primary animate-spin" />
    <span className="text-sm text-plant-primary font-medium">
    Refreshing...
    </span>
   </div>
   </div>
  </div>
  )}

  {/* Content */}
  <div
  className="transition-transform duration-200"
  style={{
   transform: isRefreshing
   ? "translateY(64px)"
   : isPulling
   ? `translateY(${Math.min(pullDistance, maxPullDistance)}px)`
   : "translateY(0)",
  }}
  >
  {children}
  </div>
 </div>
 );
}

// Simplified version for specific use cases
export function PlantListPullToRefresh({
 onRefresh,
 children,
 className,
}: {
 onRefresh: () => Promise<void> | void;
 children: React.ReactNode;
 className?: string;
}) {
 return (
 <PullToRefresh
  onRefresh={onRefresh}
  threshold={60}
  maxPullDistance={100}
  className={className}
 >
  {children}
 </PullToRefresh>
 );
}
