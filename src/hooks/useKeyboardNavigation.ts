import { useEffect, useRef } from 'react';

interface UseKeyboardNavigationProps {
 onNextPage: () => void;
 onPreviousPage: () => void;
 hasNextPage: boolean;
 hasPreviousPage: boolean;
 isEnabled?: boolean;
}

/**
 * Hook for keyboard navigation in pagination
 * Supports arrow keys and prevents conflicts with form inputs
 */
export const useKeyboardNavigation = ({
 onNextPage,
 onPreviousPage,
 hasNextPage,
 hasPreviousPage,
 isEnabled = true,
}: UseKeyboardNavigationProps) => {
 // Use refs to stabilize callback references and prevent event listener churn
 const callbacksRef = useRef({
  onNextPage,
  onPreviousPage,
 });

 // Update refs when callbacks change
 useEffect(() => {
  callbacksRef.current = {
   onNextPage,
   onPreviousPage,
  };
 }, [onNextPage, onPreviousPage]);

 useEffect(() => {
 if (!isEnabled) return;

 const handleKeyDown = (event: KeyboardEvent) => {
  // Ignore if user is typing in an input field
  const target = event.target as HTMLElement;
  if (
  target.tagName === 'INPUT' ||
  target.tagName === 'TEXTAREA' ||
  target.contentEditable === 'true'
  ) {
  return;
  }

  // Handle arrow key navigation
  if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
  if (hasNextPage) {
   event.preventDefault();
   callbacksRef.current.onNextPage();
  }
  } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
  if (hasPreviousPage) {
   event.preventDefault();
   callbacksRef.current.onPreviousPage();
  }
  }
 };

 document.addEventListener('keydown', handleKeyDown);
 return () => document.removeEventListener('keydown', handleKeyDown);
 }, [hasNextPage, hasPreviousPage, isEnabled]); // Callbacks now accessed via ref to prevent listener churn
}; 