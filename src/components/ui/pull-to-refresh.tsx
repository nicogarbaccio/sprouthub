import React, { useRef, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { impactHaptic, isNative } from '@/utils/ios-optimizations';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
  threshold?: number;
  disabled?: boolean;
}

/**
 * Pull-to-refresh component for iOS-native feel
 * Provides visual feedback and haptic response when pulling down to refresh
 */
export function PullToRefresh({
  onRefresh,
  children,
  className,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);
  const hasTriggeredHaptic = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isNative() || disabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only start pull if scrolled to top
      if (container.scrollTop === 0 && !isRefreshing) {
        startY.current = e.touches[0].clientY;
        setIsPulling(true);
        hasTriggeredHaptic.current = false;
      }
    };

    const handleTouchMove = async (e: TouchEvent) => {
      if (!isPulling || isRefreshing) return;

      currentY.current = e.touches[0].clientY;
      const distance = Math.max(0, currentY.current - startY.current);

      // Apply resistance to pull (makes it feel more natural)
      const resistanceFactor = 0.5;
      const resistedDistance = distance * resistanceFactor;

      setPullDistance(resistedDistance);

      // Trigger haptic when threshold is crossed
      if (resistedDistance > threshold && !hasTriggeredHaptic.current) {
        await impactHaptic('medium');
        hasTriggeredHaptic.current = true;
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling) return;

      const distance = pullDistance;

      if (distance > threshold && !isRefreshing) {
        setIsRefreshing(true);
        await impactHaptic('light');

        try {
          await onRefresh();
        } catch (error) {
          console.error('Refresh failed:', error);
        } finally {
          setIsRefreshing(false);
        }
      }

      setIsPulling(false);
      setPullDistance(0);
      startY.current = 0;
      currentY.current = 0;
      hasTriggeredHaptic.current = false;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isPulling, isRefreshing, pullDistance, threshold, onRefresh, disabled]);

  // Calculate indicator opacity and scale based on pull distance
  const progress = Math.min(pullDistance / threshold, 1);
  const indicatorOpacity = progress;
  const indicatorScale = 0.6 + (progress * 0.4); // Scale from 0.6 to 1.0

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-y-auto', className)}
      style={{
        touchAction: isRefreshing ? 'none' : 'auto',
      }}
    >
      {/* Pull to refresh indicator */}
      {(isPulling || isRefreshing) && (
        <div
          className="absolute top-0 left-0 right-0 flex items-center justify-center transition-all duration-200 z-50"
          style={{
            height: `${Math.max(pullDistance, isRefreshing ? 60 : 0)}px`,
            opacity: isRefreshing ? 1 : indicatorOpacity,
          }}
        >
          <div
            className="flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-full p-3 shadow-lg"
            style={{
              transform: `scale(${isRefreshing ? 1 : indicatorScale})`,
              transition: 'transform 0.2s ease',
            }}
          >
            <Loader2
              className={cn(
                'w-5 h-5 text-primary',
                isRefreshing && 'animate-spin'
              )}
            />
          </div>
        </div>
      )}

      {/* Content with padding when pulling/refreshing */}
      <div
        style={{
          transform: isPulling || isRefreshing
            ? `translateY(${Math.max(pullDistance, isRefreshing ? 60 : 0)}px)`
            : 'translateY(0)',
          transition: isPulling ? 'none' : 'transform 0.3s cubic-bezier(0.36, 0.66, 0.04, 1)',
        }}
      >
        {children}
      </div>
    </div>
  );
}
