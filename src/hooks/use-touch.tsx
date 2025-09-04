import { useState, useEffect, useRef, useCallback } from "react";

interface TouchState {
 startX: number;
 startY: number;
 currentX: number;
 currentY: number;
 deltaX: number;
 deltaY: number;
 isTouch: boolean;
 duration: number;
}

interface SwipeOptions {
 threshold?: number;
 preventDefaultTouchmoveEvent?: boolean;
 deltaXThreshold?: number;
 deltaYThreshold?: number;
}

interface SwipeHandlers {
 onSwipeLeft?: () => void;
 onSwipeRight?: () => void;
 onSwipeUp?: () => void;
 onSwipeDown?: () => void;
 onTap?: () => void;
}

export function useSwipe(handlers: SwipeHandlers, options: SwipeOptions = {}) {
 const {
 threshold = 50,
 preventDefaultTouchmoveEvent = false,
 deltaXThreshold = 50,
 deltaYThreshold = 50,
 } = options;

 const touchState = useRef<TouchState>({
 startX: 0,
 startY: 0,
 currentX: 0,
 currentY: 0,
 deltaX: 0,
 deltaY: 0,
 isTouch: false,
 duration: 0,
 });

 const handleTouchStart = useCallback((e: React.TouchEvent) => {
 const touch = e.touches[0];
 touchState.current = {
  startX: touch.clientX,
  startY: touch.clientY,
  currentX: touch.clientX,
  currentY: touch.clientY,
  deltaX: 0,
  deltaY: 0,
  isTouch: true,
  duration: Date.now(),
 };
 }, []);

 const handleTouchMove = useCallback(
 (e: React.TouchEvent) => {
  if (!touchState.current.isTouch) return;

  const touch = e.touches[0];
  touchState.current.currentX = touch.clientX;
  touchState.current.currentY = touch.clientY;
  touchState.current.deltaX = touch.clientX - touchState.current.startX;
  touchState.current.deltaY = touch.clientY - touchState.current.startY;

  if (preventDefaultTouchmoveEvent) {
  e.preventDefault();
  }
 },
 [preventDefaultTouchmoveEvent]
 );

 const handleTouchEnd = useCallback(() => {
 if (!touchState.current.isTouch) return;

 const { deltaX, deltaY, duration } = touchState.current;
 const absDeltaX = Math.abs(deltaX);
 const absDeltaY = Math.abs(deltaY);
 const timeDiff = Date.now() - duration;

 touchState.current.isTouch = false;

 // Check for tap (short duration, minimal movement)
 if (timeDiff < 200 && absDeltaX < 10 && absDeltaY < 10) {
  handlers.onTap?.();
  return;
 }

 // Check for swipe gestures
 if (absDeltaX > threshold || absDeltaY > threshold) {
  if (absDeltaX > absDeltaY) {
  // Horizontal swipe
  if (deltaX > deltaXThreshold) {
   handlers.onSwipeRight?.();
  } else if (deltaX < -deltaXThreshold) {
   handlers.onSwipeLeft?.();
  }
  } else {
  // Vertical swipe
  if (deltaY > deltaYThreshold) {
   handlers.onSwipeDown?.();
  } else if (deltaY < -deltaYThreshold) {
   handlers.onSwipeUp?.();
  }
  }
 }
 }, [handlers, threshold, deltaXThreshold, deltaYThreshold]);

 return {
 onTouchStart: handleTouchStart,
 onTouchMove: handleTouchMove,
 onTouchEnd: handleTouchEnd,
 };
}

// Pull-to-refresh hook
interface PullToRefreshOptions {
 threshold?: number;
 maxPullDistance?: number;
 onRefresh?: () => Promise<void> | void;
}

export function usePullToRefresh(options: PullToRefreshOptions = {}) {
 const { threshold = 80, maxPullDistance = 120, onRefresh } = options;
 const [pullDistance, setPullDistance] = useState(0);
 const [isRefreshing, setIsRefreshing] = useState(false);
 const [isPulling, setIsPulling] = useState(false);

 const touchState = useRef({
 startY: 0,
 isAtTop: false,
 isPulling: false,
 });

 const handleTouchStart = useCallback((e: TouchEvent) => {
 const touch = e.touches[0];
 const isAtTop = window.scrollY === 0;

 touchState.current = {
  startY: touch.clientY,
  isAtTop,
  isPulling: false,
 };
 }, []);

 const handleTouchMove = useCallback(
 (e: TouchEvent) => {
  if (!touchState.current.isAtTop) return;

  const touch = e.touches[0];
  const deltaY = touch.clientY - touchState.current.startY;

  if (deltaY > 0) {
  touchState.current.isPulling = true;
  setIsPulling(true);

  const distance = Math.min(deltaY * 0.5, maxPullDistance);
  setPullDistance(distance);

  // Prevent default scrolling when pulling
  e.preventDefault();
  }
 },
 [maxPullDistance]
 );

 const handleTouchEnd = useCallback(async () => {
 if (!touchState.current.isPulling) return;

 setIsPulling(false);

 if (pullDistance >= threshold) {
  setIsRefreshing(true);
  try {
  await onRefresh?.();
  } finally {
  setIsRefreshing(false);
  setPullDistance(0);
  }
 } else {
  setPullDistance(0);
 }

 touchState.current.isPulling = false;
 }, [pullDistance, threshold, onRefresh]);

 return {
 pullDistance,
 isRefreshing,
 isPulling,
 onTouchStart: handleTouchStart,
 onTouchMove: handleTouchMove,
 onTouchEnd: handleTouchEnd,
 };
}

// Haptic feedback hook
export function useHaptic() {
 const vibrate = useCallback((pattern: number | number[]) => {
 if ("vibrate" in navigator) {
  navigator.vibrate(pattern);
 }
 }, []);

 const lightImpact = useCallback(() => {
 vibrate(10);
 }, [vibrate]);

 const mediumImpact = useCallback(() => {
 vibrate(20);
 }, [vibrate]);

 const heavyImpact = useCallback(() => {
 vibrate([30, 10, 30]);
 }, [vibrate]);

 const success = useCallback(() => {
 vibrate([10, 10, 10]);
 }, [vibrate]);

 const error = useCallback(() => {
 vibrate([50, 20, 50]);
 }, [vibrate]);

 return {
 vibrate,
 lightImpact,
 mediumImpact,
 heavyImpact,
 success,
 error,
 };
}
