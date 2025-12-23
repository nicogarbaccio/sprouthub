import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface UseGlobalShortcutsOptions {
  onQuickActionsOpen?: () => void;
  onNotificationsOpen?: () => void;
  onThemeToggle?: () => void;
  enabled?: boolean;
}

/**
 * Global keyboard shortcuts that work across the entire app
 * These are navigation and system-level shortcuts
 */
export const useGlobalShortcuts = ({
  onQuickActionsOpen,
  onNotificationsOpen,
  onThemeToggle,
  enabled = true,
}: UseGlobalShortcutsOptions = {}) => {
  const navigate = useNavigate();

  // Use refs to stabilize callback references and prevent event listener churn
  const callbacksRef = useRef({
    onQuickActionsOpen,
    onNotificationsOpen,
    onThemeToggle,
  });

  // Update refs when callbacks change
  useEffect(() => {
    callbacksRef.current = {
      onQuickActionsOpen,
      onNotificationsOpen,
      onThemeToggle,
    };
  }, [onQuickActionsOpen, onNotificationsOpen, onThemeToggle]);

  useEffect(() => {
    if (!enabled) return;

    let sequenceKey: string | null = null;
    let sequenceTimeout: NodeJS.Timeout | null = null;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      const isFormElement =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable;

      // Allow Shift+? even in form elements for help
      if (event.key === '?' && event.shiftKey) {
        event.preventDefault();
        callbacksRef.current.onQuickActionsOpen?.();
        return;
      }

      // Don't trigger shortcuts in form elements (except for specific ones above)
      if (isFormElement) return;

      // Handle sequence shortcuts (e.g., "g then d")
      if (sequenceKey === 'g') {
        event.preventDefault();

        switch (event.key.toLowerCase()) {
          case 'd':
            navigate('/');
            break;
          case 'p':
            navigate('/my-plants');
            break;
          case 'c':
            navigate('/plant-catalog');
            break;
          case 'a':
            navigate('/analytics');
            break;
          case 's':
            navigate('/settings');
            break;
          case 'h':
            navigate('/households');
            break;
        }

        sequenceKey = null;
        if (sequenceTimeout) clearTimeout(sequenceTimeout);
        return;
      }

      // Start sequence on 'g'
      if (event.key.toLowerCase() === 'g' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        sequenceKey = 'g';

        // Reset sequence after 2 seconds
        if (sequenceTimeout) clearTimeout(sequenceTimeout);
        sequenceTimeout = setTimeout(() => {
          sequenceKey = null;
        }, 2000);
        return;
      }

      // Single key shortcuts
      switch (event.key.toLowerCase()) {
        case 'n':
          if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
            event.preventDefault();
            callbacksRef.current.onNotificationsOpen?.();
          }
          break;

        case 't':
          if (!event.ctrlKey && !event.metaKey && !event.shiftKey) {
            event.preventDefault();
            callbacksRef.current.onThemeToggle?.();
          }
          break;

        case '/':
          event.preventDefault();
          // Focus search if it exists
          const searchInput = document.querySelector<HTMLInputElement>('input[type="search"], input[placeholder*="Search"]');
          searchInput?.focus();
          break;

        case 'escape':
          // Close any open dialogs/modals
          const closeButton = document.querySelector<HTMLButtonElement>('[data-dialog-close]');
          closeButton?.click();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (sequenceTimeout) clearTimeout(sequenceTimeout);
    };
  }, [enabled, navigate]); // Callbacks now accessed via ref to prevent listener churn
};
