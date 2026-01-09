import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { isIOS, isNative } from '@/utils/ios-optimizations';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Hook to manage iOS status bar theming
 * Automatically syncs with app theme and provides dynamic styling
 */
export function useStatusBar() {
  const { theme } = useTheme();

  useEffect(() => {
    if (!isNative() || !isIOS()) return;

    const setupStatusBar = async () => {
      try {
        // Determine status bar style based on theme
        const isDark = theme === 'dark' ||
          (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        // Set status bar style
        await StatusBar.setStyle({
          style: isDark ? Style.Dark : Style.Light,
        });

        // Set background color to match app theme
        await StatusBar.setBackgroundColor({
          color: isDark ? '#1d3c28' : '#ffffff',
        });

        // Show status bar
        await StatusBar.show();
      } catch (error) {
        console.debug('Status bar configuration failed:', error);
      }
    };

    setupStatusBar();

    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        setupStatusBar();
      }
    };

    mediaQuery.addEventListener('change', handleChange);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme]);
}

/**
 * Hook to hide/show status bar based on scroll position or fullscreen mode
 */
export function useDynamicStatusBar(options?: {
  hideOnScroll?: boolean;
  threshold?: number;
}) {
  const { hideOnScroll = false, threshold = 100 } = options || {};

  useEffect(() => {
    if (!isNative() || !isIOS() || !hideOnScroll) return;

    let lastScrollY = 0;
    let isHidden = false;

    const handleScroll = async () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY > threshold && currentScrollY > lastScrollY && !isHidden) {
        // Scrolling down, hide status bar
        try {
          await StatusBar.hide();
          isHidden = true;
        } catch (error) {
          console.debug('Failed to hide status bar:', error);
        }
      } else if (currentScrollY < lastScrollY && isHidden) {
        // Scrolling up, show status bar
        try {
          await StatusBar.show();
          isHidden = false;
        } catch (error) {
          console.debug('Failed to show status bar:', error);
        }
      }

      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      // Always show status bar on cleanup
      if (isHidden) {
        StatusBar.show().catch(() => {});
      }
    };
  }, [hideOnScroll, threshold]);
}

/**
 * Hook to temporarily hide status bar (e.g., for fullscreen images)
 */
export function useFullscreenStatusBar(isFullscreen: boolean) {
  useEffect(() => {
    if (!isNative() || !isIOS()) return;

    const handleFullscreen = async () => {
      try {
        if (isFullscreen) {
          await StatusBar.hide();
        } else {
          await StatusBar.show();
        }
      } catch (error) {
        console.debug('Failed to toggle status bar:', error);
      }
    };

    handleFullscreen();

    // Cleanup: always show status bar
    return () => {
      if (isFullscreen) {
        StatusBar.show().catch(() => {});
      }
    };
  }, [isFullscreen]);
}
