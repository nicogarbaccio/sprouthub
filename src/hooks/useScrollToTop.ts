import { useEffect } from 'react';

interface UseScrollToTopProps {
 currentPage: number;
 isEnabled?: boolean;
 offset?: number;
}

/**
 * Hook to scroll to top when page changes
 * Provides smooth scrolling experience during pagination
 */
export const useScrollToTop = ({
 currentPage,
 isEnabled = true,
 offset = 0,
}: UseScrollToTopProps) => {
 useEffect(() => {
 if (!isEnabled || currentPage === 1) return;

 // Smooth scroll to top with optional offset
 const targetPosition = offset;
 
 window.scrollTo({
  top: targetPosition,
  behavior: 'smooth',
 });
 }, [currentPage, isEnabled, offset]);
}; 