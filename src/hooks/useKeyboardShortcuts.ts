import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  meta?: boolean;
  action: () => void;
  description: string;
  enabled?: boolean;
}

interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Hook for registering global keyboard shortcuts
 *
 * Example usage:
 * ```tsx
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     { key: 'a', action: () => openAddPlantDialog(), description: 'Add new plant' },
 *     { key: 'w', shift: true, action: () => waterAllPlants(), description: 'Water all due plants' },
 *   ]
 * });
 * ```
 */
export const useKeyboardShortcuts = ({
  shortcuts,
  enabled = true,
}: UseKeyboardShortcutsOptions) => {
  const location = useLocation();
  const shortcutsRef = useRef(shortcuts);

  // Update shortcuts ref when shortcuts change
  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when user is typing in an input/textarea
      const target = event.target as HTMLElement;
      const isFormElement =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable;

      if (isFormElement) return;

      // Find matching shortcut
      const matchingShortcut = shortcutsRef.current.find((shortcut) => {
        if (shortcut.enabled === false) return false;

        const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
        const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatches = shortcut.alt ? event.altKey : !event.altKey;
        const metaMatches = shortcut.meta ? event.metaKey : !event.metaKey;

        return keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches;
      });

      if (matchingShortcut) {
        event.preventDefault();
        matchingShortcut.action();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [enabled, location.pathname]);

  return {
    shortcuts: shortcutsRef.current,
  };
};

/**
 * Hook for getting formatted keyboard shortcut display text
 */
export const useKeyboardShortcutDisplay = (shortcut: KeyboardShortcut): string => {
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  const parts: string[] = [];

  if (shortcut.meta) {
    parts.push(isMac ? "⌘" : "Ctrl");
  }
  if (shortcut.ctrl) {
    parts.push("Ctrl");
  }
  if (shortcut.alt) {
    parts.push(isMac ? "⌥" : "Alt");
  }
  if (shortcut.shift) {
    parts.push(isMac ? "⇧" : "Shift");
  }

  parts.push(shortcut.key.toUpperCase());

  return parts.join(isMac ? "" : "+");
};

/**
 * Get display text for keyboard shortcuts (handles special keys)
 */
export const getDisplayKey = (shortcut: string): string => {
  const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;

  // Replace modifier keys with symbols
  return shortcut
    .replace(/Shift\+/gi, isMac ? "⇧" : "Shift+")
    .replace(/Ctrl\+/gi, isMac ? "⌃" : "Ctrl+")
    .replace(/Alt\+/gi, isMac ? "⌥" : "Alt+")
    .replace(/Meta\+/gi, isMac ? "⌘" : "Ctrl+")
    .replace(/Cmd\+/gi, isMac ? "⌘" : "Ctrl+");
};

/**
 * Common keyboard shortcuts for plant management
 */
export const createPlantShortcuts = (actions: {
  onAddPlant?: () => void;
  onWaterPlant?: () => void;
  onPostponePlant?: () => void;
  onEditPlant?: () => void;
  onWaterAllDue?: () => void;
}) => {
  const shortcuts: KeyboardShortcut[] = [];

  if (actions.onAddPlant) {
    shortcuts.push({
      key: "a",
      action: actions.onAddPlant,
      description: "Add new plant",
    });
  }

  if (actions.onWaterPlant) {
    shortcuts.push({
      key: "w",
      action: actions.onWaterPlant,
      description: "Water selected plant",
    });
  }

  if (actions.onPostponePlant) {
    shortcuts.push({
      key: "p",
      action: actions.onPostponePlant,
      description: "Postpone watering",
    });
  }

  if (actions.onEditPlant) {
    shortcuts.push({
      key: "e",
      action: actions.onEditPlant,
      description: "Edit selected plant",
    });
  }

  if (actions.onWaterAllDue) {
    shortcuts.push({
      key: "w",
      shift: true,
      action: actions.onWaterAllDue,
      description: "Water all plants due today",
    });
  }

  // Always include Escape to close dialogs
  shortcuts.push({
    key: "Escape",
    action: () => {
      // Trigger escape key event to close any open dialogs
      const escapeEvent = new KeyboardEvent("keydown", {
        key: "Escape",
        bubbles: true,
        cancelable: true,
      });
      document.dispatchEvent(escapeEvent);
    },
    description: "Close dialog",
  });

  return shortcuts;
};
