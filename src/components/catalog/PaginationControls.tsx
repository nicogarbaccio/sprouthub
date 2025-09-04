import { Button } from "@/components/ui/button";
import {
 ChevronLeft,
 ChevronRight,
 MoreHorizontal,
 Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
 currentPage: number;
 totalPages: number;
 hasNextPage: boolean;
 hasPreviousPage: boolean;
 isChangingPage?: boolean;
 onPageChange: (page: number) => void;
 onNextPage: () => void;
 onPreviousPage: () => void;
 className?: string;
}

/**
 * Generate page numbers array with ellipsis logic
 * Shows up to 5 page numbers with smart ellipsis placement
 */
const generatePageNumbers = (currentPage: number, totalPages: number) => {
 const pages: (number | "ellipsis")[] = [];
 const maxVisiblePages = 5;

 if (totalPages <= maxVisiblePages) {
  // Show all pages if total is less than max visible
  for (let i = 1; i <= totalPages; i++) {
   pages.push(i);
  }
 } else {
  // Always show first page
  pages.push(1);

  if (currentPage <= 3) {
   // Show pages 2, 3, 4 and ellipsis
   for (let i = 2; i <= 4; i++) {
    pages.push(i);
   }
   if (totalPages > 4) {
    pages.push("ellipsis");
    pages.push(totalPages);
   }
  } else if (currentPage >= totalPages - 2) {
   // Show ellipsis and last few pages
   if (totalPages > 4) {
    pages.push("ellipsis");
   }
   for (let i = totalPages - 3; i <= totalPages; i++) {
    if (i > 1) pages.push(i);
   }
  } else {
   // Show ellipsis, current page area, ellipsis
   pages.push("ellipsis");
   for (let i = currentPage - 1; i <= currentPage + 1; i++) {
    pages.push(i);
   }
   pages.push("ellipsis");
   pages.push(totalPages);
  }
 }

 return pages;
};

/**
 * Enhanced pagination controls with loading states and animations
 */
const PaginationControls = ({
 currentPage,
 totalPages,
 hasNextPage,
 hasPreviousPage,
 isChangingPage = false,
 onPageChange,
 onNextPage,
 onPreviousPage,
 className,
}: PaginationControlsProps) => {
 // Don't render if there's only one page or no pages
 if (totalPages <= 1) {
  return null;
 }

 const pageNumbers = generatePageNumbers(currentPage, totalPages);

 return (
  <div
   className={cn(
    "flex flex-col sm:flex-row items-center justify-center gap-4 transition-opacity duration-200",
    isChangingPage && "opacity-60",
    className
   )}
   data-testid="pagination-controls"
  >
   {/* Mobile: Simple Previous/Next */}
   <div className="flex sm:hidden items-center gap-2">
    <Button
     variant="outline"
     size="sm"
     onClick={onPreviousPage}
     disabled={!hasPreviousPage || isChangingPage}
     className="bg-card border-border hover:bg-muted text-foreground disabled:opacity-50 transition-all duration-200"
     data-testid="previous-page"
    >
     {isChangingPage ? (
      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
     ) : (
      <ChevronLeft className="w-4 h-4 mr-1" />
     )}
     Previous
    </Button>

    <div className="text-sm text-foreground px-4 min-w-[100px] text-center">
     Page {currentPage} of {totalPages}
    </div>

    <Button
     variant="outline"
     size="sm"
     onClick={onNextPage}
     disabled={!hasNextPage || isChangingPage}
     className="bg-card border-border hover:bg-muted text-foreground disabled:opacity-50 transition-all duration-200"
     data-testid="next-page"
    >
     Next
     {isChangingPage ? (
      <Loader2 className="w-4 h-4 ml-1 animate-spin" />
     ) : (
      <ChevronRight className="w-4 h-4 ml-1" />
     )}
    </Button>
   </div>

   {/* Desktop: Full pagination with numbers */}
   <div className="hidden sm:flex items-center gap-1">
    {/* Previous Button */}
    <Button
     variant="outline"
     size="sm"
     onClick={onPreviousPage}
     disabled={!hasPreviousPage || isChangingPage}
     className="bg-card border-border hover:bg-muted text-foreground disabled:opacity-50 mr-2 transition-all duration-200"
    >
     {isChangingPage ? (
      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
     ) : (
      <ChevronLeft className="w-4 h-4 mr-1" />
     )}
     Previous
    </Button>

    {/* Page Numbers */}
    {pageNumbers.map((page, index) => {
     if (page === "ellipsis") {
      return (
       <div
        key={`ellipsis-${index}`}
        className="flex items-center justify-center w-8 h-8"
       >
        <MoreHorizontal className="w-4 h-4 text-muted-foreground" />
       </div>
      );
     }

     const isCurrentPage = page === currentPage;

     return (
      <Button
       key={page}
       variant={isCurrentPage ? "default" : "outline"}
       size="sm"
       onClick={() => onPageChange(page)}
       disabled={isChangingPage}
       className={cn(
        "w-8 h-8 p-0 transition-all duration-200 transform",
        isCurrentPage
         ? "bg-sprout-primary hover:bg-sprout-primary/90 text-white border-sprout-primary shadow-sm dark:bg-sprout-light dark:hover:bg-sprout-light/90 dark:text-sprout-dark dark:border-sprout-light"
         : "bg-card border-border hover:bg-muted text-foreground hover:border-border",
        isChangingPage && "opacity-60"
       )}
      >
       {isChangingPage && isCurrentPage ? (
        <Loader2 className="w-3 h-3 animate-spin" />
       ) : (
        page
       )}
      </Button>
     );
    })}

    {/* Next Button */}
    <Button
     variant="outline"
     size="sm"
     onClick={onNextPage}
     disabled={!hasNextPage || isChangingPage}
     className="bg-card border-border hover:bg-muted text-foreground disabled:opacity-50 ml-2 transition-all duration-200"
    >
     Next
     {isChangingPage ? (
      <Loader2 className="w-4 h-4 ml-1 animate-spin" />
     ) : (
      <ChevronRight className="w-4 h-4 ml-1" />
     )}
    </Button>
   </div>

   {/* Keyboard navigation hint */}
   <div className="hidden lg:block text-xs text-muted-foreground/70 mt-2">
    Use ← → arrow keys to navigate
   </div>
  </div>
 );
};

export default PaginationControls;
