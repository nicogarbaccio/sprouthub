import { useSearchParams } from 'react-router-dom';
import { useEffect } from 'react';

interface UsePaginationUrlProps {
 currentPage: number;
 onPageChange: (page: number) => void;
 resetToFirstPage: () => void;
 enabled?: boolean;
}

/**
 * Hook to synchronize pagination with URL search params
 * Manages ?page=2 in the URL and browser navigation
 */
export const usePaginationUrl = ({
 currentPage,
 onPageChange,
 resetToFirstPage,
 enabled = true,
}: UsePaginationUrlProps) => {
 const [searchParams, setSearchParams] = useSearchParams();

 // Read page from URL on mount and when URL changes
 useEffect(() => {
  if (!enabled) return;
  const pageFromUrl = searchParams.get('page');
  if (pageFromUrl) {
   const pageNumber = parseInt(pageFromUrl, 10);
   if (pageNumber > 0 && pageNumber !== currentPage) {
    onPageChange(pageNumber);
   }
  } else if (currentPage !== 1) {
   // If no page in URL but currentPage is not 1, reset to 1
   resetToFirstPage();
  }
 }, [searchParams, enabled, currentPage]);

 // Update URL when page changes
 const updateUrl = (page: number) => {
  if (!enabled) return;
  const newSearchParams = new URLSearchParams(searchParams);
  
  if (page === 1) {
   // Remove page param for page 1 (cleaner URLs)
   newSearchParams.delete('page');
  } else {
   newSearchParams.set('page', page.toString());
  }
  
  setSearchParams(newSearchParams, { replace: true });
 };

 // Function to handle page change with URL update
 const handlePageChange = (page: number) => {
  onPageChange(page);
  updateUrl(page);
 };

 const handleNextPage = () => {
  const nextPage = currentPage + 1;
  onPageChange(nextPage);
  updateUrl(nextPage);
 };

 const handlePreviousPage = () => {
  const prevPage = Math.max(1, currentPage - 1);
  onPageChange(prevPage);
  updateUrl(prevPage);
 };

 // Reset to first page and update URL
 const handleResetToFirstPage = () => {
  resetToFirstPage();
  updateUrl(1);
 };

 return {
  handlePageChange,
  handleNextPage,
  handlePreviousPage,
  handleResetToFirstPage,
 };
}; 