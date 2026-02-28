import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  setupSwipeToGoBack,
  setupLongPress,
  selectionHaptic,
  impactHaptic,
  isIOS,
  isNative,
} from '@/utils/ios-optimizations';

/**
 * Hook for iOS-specific optimizations and gestures
 */
export function useIOSOptimizations() {
  const navigate = useNavigate();

  // Setup swipe-to-go-back gesture
  useEffect(() => {
    if (!isIOS()) return;

    const cleanup = setupSwipeToGoBack(() => {
      // Check if we can go back in history
      if (window.history.length > 1) {
        navigate(-1);
      }
    });

    return cleanup;
  }, [navigate]);

  return {
    isIOS: isIOS(),
    isNative: isNative(),
    selectionHaptic,
    impactHaptic,
  };
}

/**
 * Hook for long-press with haptic feedback
 */
export function useLongPress(
  onLongPress: () => void,
  duration = 500
) {
  const elementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const cleanup = setupLongPress(element, onLongPress, duration);
    return cleanup;
  }, [onLongPress, duration]);

  return elementRef;
}

/**
 * Hook for pull-to-refresh functionality
 */
export function usePullToRefresh(onRefresh: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPulling = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !isNative()) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only start pull if scrolled to top
      if (container.scrollTop === 0) {
        startY.current = e.touches[0].clientY;
        isPulling.current = true;
      }
    };

    const handleTouchMove = async (e: TouchEvent) => {
      if (!isPulling.current) return;

      currentY.current = e.touches[0].clientY;
      const pullDistance = currentY.current - startY.current;

      // Trigger refresh if pulled down more than 80px
      if (pullDistance > 80 && !isRefreshing) {
        await impactHaptic('medium');
      }
    };

    const handleTouchEnd = async () => {
      if (!isPulling.current) return;

      const pullDistance = currentY.current - startY.current;

      if (pullDistance > 80 && !isRefreshing) {
        setIsRefreshing(true);
        await onRefresh();
        setIsRefreshing(false);
      }

      isPulling.current = false;
      startY.current = 0;
      currentY.current = 0;
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: true });
    container.addEventListener('touchend', handleTouchEnd);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onRefresh, isRefreshing]);

  return { containerRef, isRefreshing };
}

/**
 * Hook for keyboard management on iOS
 */
export function useIOSKeyboard() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    if (!isIOS()) return;

    // iOS reports keyboard via viewport resize
    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const diff = windowHeight - viewportHeight;

      if (diff > 50) {
        // Keyboard is likely visible
        setKeyboardHeight(diff);
        setIsKeyboardVisible(true);
      } else {
        setKeyboardHeight(0);
        setIsKeyboardVisible(false);
      }
    };

    window.visualViewport?.addEventListener('resize', handleResize);
    window.addEventListener('resize', handleResize);

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return { keyboardHeight, isKeyboardVisible };
}
