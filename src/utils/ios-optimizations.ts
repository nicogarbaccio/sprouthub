import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

/**
 * iOS-specific optimization utilities
 * Provides native iOS feel and interactions
 */

export const isIOS = () => {
  return Capacitor.getPlatform() === 'ios';
};

export const isNative = () => {
  return Capacitor.isNativePlatform();
};

/**
 * Add iOS-style swipe gesture detection
 * Returns cleanup function
 */
export function setupSwipeToGoBack(onSwipeBack: () => void): () => void {
  if (!isIOS()) return () => {};

  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;

  const handleTouchStart = (e: TouchEvent) => {
    // Only trigger if touch starts from left edge (within 50px)
    if (e.touches[0].clientX < 50) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      isSwiping = true;
    }
  };

  const handleTouchMove = async (e: TouchEvent) => {
    if (!isSwiping) return;

    const touchEndX = e.touches[0].clientX;
    const touchEndY = e.touches[0].clientY;
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;

    // Check if horizontal swipe (not vertical scroll)
    if (Math.abs(deltaX) > Math.abs(deltaY) && deltaX > 100) {
      isSwiping = false;
      await Haptics.impact({ style: ImpactStyle.Light });
      onSwipeBack();
    }
  };

  const handleTouchEnd = () => {
    isSwiping = false;
  };

  document.addEventListener('touchstart', handleTouchStart, { passive: true });
  document.addEventListener('touchmove', handleTouchMove, { passive: true });
  document.addEventListener('touchend', handleTouchEnd, { passive: true });

  return () => {
    document.removeEventListener('touchstart', handleTouchStart);
    document.removeEventListener('touchmove', handleTouchMove);
    document.removeEventListener('touchend', handleTouchEnd);
  };
}

/**
 * Add long-press detection with haptic feedback
 */
export function setupLongPress(
  element: HTMLElement,
  onLongPress: () => void,
  duration = 500
): () => void {
  if (!isNative()) return () => {};

  let pressTimer: NodeJS.Timeout | null = null;
  let hasFiredLongPress = false;

  const handleTouchStart = async () => {
    hasFiredLongPress = false;
    pressTimer = setTimeout(async () => {
      hasFiredLongPress = true;
      await Haptics.impact({ style: ImpactStyle.Medium });
      onLongPress();
    }, duration);
  };

  const handleTouchEnd = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  const handleTouchMove = () => {
    if (pressTimer && !hasFiredLongPress) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  element.addEventListener('touchstart', handleTouchStart);
  element.addEventListener('touchend', handleTouchEnd);
  element.addEventListener('touchmove', handleTouchMove);

  return () => {
    if (pressTimer) clearTimeout(pressTimer);
    element.removeEventListener('touchstart', handleTouchStart);
    element.removeEventListener('touchend', handleTouchEnd);
    element.removeEventListener('touchmove', handleTouchMove);
  };
}

/**
 * Provide haptic feedback for selection/interaction
 */
export async function selectionHaptic() {
  if (!isNative()) return;

  try {
    await Haptics.selectionStart();
    await Haptics.selectionChanged();
    await Haptics.selectionEnd();
  } catch (e) {
    console.debug('Haptics not supported', e);
  }
}

/**
 * Provide impact haptic feedback
 */
export async function impactHaptic(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (!isNative()) return;

  const styleMap = {
    light: ImpactStyle.Light,
    medium: ImpactStyle.Medium,
    heavy: ImpactStyle.Heavy,
  };

  try {
    await Haptics.impact({ style: styleMap[style] });
  } catch (e) {
    console.debug('Haptics not supported', e);
  }
}

/**
 * Add iOS-style page transition class
 */
export function getPageTransitionClass(isEntering: boolean): string {
  if (!isIOS()) return '';
  return isEntering ? 'ios-page-enter' : 'ios-page-exit';
}

/**
 * Check if device has notch/dynamic island
 */
export function hasNotch(): boolean {
  if (!isIOS()) return false;

  // Check for safe area insets
  const root = document.documentElement;
  const safeAreaTop = getComputedStyle(root).getPropertyValue('--safe-area-top');
  return safeAreaTop !== '0px' && safeAreaTop !== '';
}

/**
 * Get safe area insets
 */
export function getSafeAreaInsets() {
  const root = document.documentElement;
  return {
    top: getComputedStyle(root).getPropertyValue('--safe-area-top') || '0px',
    bottom: getComputedStyle(root).getPropertyValue('--safe-area-bottom') || '0px',
  };
}
