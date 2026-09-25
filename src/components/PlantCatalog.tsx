import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight } from "lucide-react";
import { AuthUpsell } from "./auth/AuthUpsell";
import PlantCatalogHeader from "./catalog/PlantCatalogHeader";
import PlantSearchFilters from "./catalog/PlantSearchFilters";
import PlantResultsSummary from "./catalog/PlantResultsSummary";
import PlantGrid from "./catalog/PlantGrid";
import PaginationControls from "./catalog/PaginationControls";
import AddPlantDialog from "./AddPlantDialog";
import { usePaginationUrl } from "@/hooks/usePaginationUrl";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { useDebounce } from "@/hooks/useDebounce";
import {
 plants,
 getUniqueCategories,
 getUniqueCareLevels,
 getUniqueLightRequirements,
 Plant,
} from "@/data/plantData";
import { homepagePlants } from "@/data/homepagePlants";

interface PlantCatalogProps {
 isHomepage?: boolean;
 isDashboard?: boolean;
 isLoading?: boolean;
}

const PlantCatalog = ({
 isHomepage = false,
 isDashboard = false,
 isLoading = false,
}: PlantCatalogProps) => {
 const [searchTerm, setSearchTerm] = useState("");
 const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
 const [selectedPlantData, setSelectedPlantData] = useState<Plant | null>(
 null
 );
 const [isFilterOpen, setIsFilterOpen] = useState(false);
 const [selectedCategory, setSelectedCategory] = useState("all");
 const [selectedCareLevel, setSelectedCareLevel] = useState("all");
 const [selectedLightRequirement, setSelectedLightRequirement] =
 useState("all");

 // Pagination state
 const [currentPage, setCurrentPage] = useState(1);
 const ITEMS_PER_PAGE = 24;

 // Loading states for better UX
 const [isChangingPage, setIsChangingPage] = useState(false);

 // Debounced search to prevent excessive filtering
 const debouncedSearchTerm = useDebounce(searchTerm, 300);

 const navigate = useNavigate();
 const location = useLocation();
 const { user } = useAuth();

 // Use lightweight plant data for homepage, full dataset for catalog
 const plantsToUse = isHomepage ? homepagePlants : plants;

 // Get unique values for filter options
 const categories = getUniqueCategories();
 const careLevels = getUniqueCareLevels();
 const lightRequirements = getUniqueLightRequirements();

 // Filter plants based on all criteria
 let filteredPlants = plantsToUse.filter((plant) => {
 const matchesSearch =
  plant.name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
  plant.botanicalName
  .toLowerCase()
  .includes(debouncedSearchTerm.toLowerCase());
 const matchesCategory =
  selectedCategory === "all" || plant.category === selectedCategory;
 const matchesCareLevel =
  selectedCareLevel === "all" || plant.careLevel === selectedCareLevel;
 const matchesLight =
  selectedLightRequirement === "all" ||
  plant.lightRequirement === selectedLightRequirement;

 return matchesSearch && matchesCategory && matchesCareLevel && matchesLight;
 });

 // Always sort alphabetically by name unless a different sort is applied
 filteredPlants = filteredPlants.sort((a, b) =>
 a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
 );

 // Calculate pagination values
 const totalPages = Math.ceil(filteredPlants.length / ITEMS_PER_PAGE);
 const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
 const endIndex = startIndex + ITEMS_PER_PAGE;

 // Reset to page 1 when filters change (use debounced search term)
 useEffect(() => {
 setCurrentPage(1);
 // Also reset URL for non-homepage
 if (!isHomepage && urlPagination) {
  urlPagination.handleResetToFirstPage();
 }
 }, [
 debouncedSearchTerm,
 selectedCategory,
 selectedCareLevel,
 selectedLightRequirement,
 isHomepage,
 ]);

 // Get plants for current page or homepage display
 // For homepage (logged-out users): show 2 rows across all screen sizes
 const getHomepagePlantCount = () => {
 if (!isHomepage) return 0;
 const width = window.innerWidth;

 // Grid layout: 1 col (mobile) | 2 cols (md) | 3 cols (lg) | 4 cols (xl)
 // Show 2 rows on all screen sizes
 if (width < 768) return 4;  // mobile: 1 col × 4 rows (show more rows on mobile)
 if (width < 1024) return 4; // md/tablet: 2 cols × 2 rows
 if (width < 1280) return 6; // lg: 3 cols × 2 rows
 return 8; // xl/desktop: 4 cols × 2 rows
 };

 const [homepagePlantCount, setHomepagePlantCount] = useState(
 getHomepagePlantCount()
 );

 // Update plant count on window resize for homepage
 useEffect(() => {
 if (!isHomepage) return;

 const handleResize = () => {
  const newCount = getHomepagePlantCount();
  if (newCount !== homepagePlantCount) {
  setHomepagePlantCount(newCount);
  }
 };

 window.addEventListener("resize", handleResize);
 return () => window.removeEventListener("resize", handleResize);
 }, [isHomepage, homepagePlantCount]);

 const displayedPlants = isHomepage
 ? filteredPlants.slice(0, homepagePlantCount) // Homepage: 2 rows (4-8 plants based on screen size)
 : filteredPlants.slice(startIndex, endIndex); // Catalog shows 24 per page

 // Enhanced pagination handlers with loading states
 const handlePageChange = async (page: number) => {
 if (!isHomepage) {
  setIsChangingPage(true);
 }

 setCurrentPage(page);

 // Immediately clear loading state for better performance
 if (!isHomepage) {
  setIsChangingPage(false);
 }
 };

 const handleNextPage = async () => {
 if (currentPage < totalPages) {
  await handlePageChange(currentPage + 1);
 }
 };

 const handlePreviousPage = async () => {
 if (currentPage > 1) {
  await handlePageChange(currentPage - 1);
 }
 };

 // URL synchronization (only for full catalog, not homepage)
 const urlPagination = usePaginationUrl({
 currentPage: currentPage,
 onPageChange: handlePageChange,
 resetToFirstPage: () => setCurrentPage(1),
 enabled: !!user && !isHomepage,
 });

 // Use URL-aware handlers for non-homepage
 const paginationHandlers =
 isHomepage || !user
  ? {
   onPageChange: handlePageChange,
   onNextPage: handleNextPage,
   onPreviousPage: handlePreviousPage,
  }
  : {
   onPageChange: urlPagination.handlePageChange,
   onNextPage: urlPagination.handleNextPage,
   onPreviousPage: urlPagination.handlePreviousPage,
  };

 // Add keyboard navigation for non-homepage
 useKeyboardNavigation({
 onNextPage: paginationHandlers.onNextPage,
 onPreviousPage: paginationHandlers.onPreviousPage,
 hasNextPage: currentPage < totalPages,
 hasPreviousPage: currentPage > 1,
 isEnabled: !isHomepage && !isLoading,
 });

 // Auto-scroll to top on page change
 useScrollToTop({
 currentPage,
 isEnabled: !isHomepage,
 offset: 100,
 });

 const handleViewDetails = (plantName: string) => {
 const plantPath = plantName.toLowerCase().replace(/\s+/g, "-");
 navigate(`/plant-details/${plantPath}`);
 };

 const handleAddToCollection = (plant: Plant) => {
 setSelectedPlantData(plant);
 setIsAddDialogOpen(true);
 };

 const handleCloseAddDialog = () => {
 setIsAddDialogOpen(false);
 setSelectedPlantData(null);
 };

 const clearAllFilters = () => {
 setSelectedCategory("all");
 setSelectedCareLevel("all");
 setSelectedLightRequirement("all");
 setSearchTerm("");
 // Reset pagination when clearing filters
 if (!isHomepage) {
  urlPagination.handleResetToFirstPage();
 }
 };

 const hasActiveFilters =
 selectedCategory !== "all" ||
 selectedCareLevel !== "all" ||
 selectedLightRequirement !== "all" ||
 searchTerm !== "";

 const handleViewAllPlants = () => {
 navigate("/plant-catalog");
 };

 const handleSignInToAdd = () => {
 const currentPath = encodeURIComponent(location.pathname);
 navigate(`/auth?redirect=${currentPath}`);
 };

 // Calculate display info for results summary
 const startItem = filteredPlants.length === 0 ? 0 : startIndex + 1;
 const endItem = Math.min(endIndex, filteredPlants.length);

 return (
 <section
  className={isHomepage ? "py-12 bg-background" : "pt-3.5 pb-8 lg:pt-7 bg-background"}
  data-testid="plant-catalog"
 >
  <div className="max-w-7xl mx-auto px-4 lg:px-8">
  {isDashboard ? (
   <div className="text-center mb-8">
   <h2 className="font-display text-2xl md:text-3xl font-bold tracking-[-0.03em] text-foreground mb-2">
    Discover New Plants
   </h2>
   <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
    Browse our plant catalog to find your next green companion
   </p>
   </div>
  ) : (
   <PlantCatalogHeader
    isHomepage={isHomepage}
    totalPlants={plantsToUse.length}
    categoryCount={categories.length}
   />
  )}

  {!isHomepage && (
   <>
   {user ? (
    <PlantSearchFilters
    searchTerm={searchTerm}
    setSearchTerm={setSearchTerm}
    isFilterOpen={isFilterOpen}
    setIsFilterOpen={setIsFilterOpen}
    selectedCategory={selectedCategory}
    setSelectedCategory={setSelectedCategory}
    selectedCareLevel={selectedCareLevel}
    setSelectedCareLevel={setSelectedCareLevel}
    selectedLightRequirement={selectedLightRequirement}
    setSelectedLightRequirement={setSelectedLightRequirement}
    categories={categories}
    careLevels={careLevels}
    lightRequirements={lightRequirements}
    hasActiveFilters={hasActiveFilters}
    clearAllFilters={clearAllFilters}
    />
   ) : (
    <div className="h-[18px]" />
   )}

   <PlantResultsSummary
    filteredCount={filteredPlants.length}
    totalCount={plants.length}
    hasActiveFilters={hasActiveFilters}
    startItem={startItem}
    endItem={endItem}
    isPaginated={true}
   />
   </>
  )}

  <PlantGrid
   plants={displayedPlants}
   onAddToCollection={handleAddToCollection}
   onViewDetails={handleViewDetails}
   hasActiveFilters={hasActiveFilters}
   clearAllFilters={clearAllFilters}
   isLoading={isLoading}
   isChangingPage={isChangingPage}
   isAuthenticated={!!user}
   onSignInToAdd={handleSignInToAdd}
  />

  {/* Pagination Controls - Only show on full catalog page */}
  {!isHomepage &&
   totalPages > 1 &&
   (user ? (
   <PaginationControls
    currentPage={currentPage}
    totalPages={totalPages}
    hasNextPage={currentPage < totalPages}
    hasPreviousPage={currentPage > 1}
    isChangingPage={isChangingPage}
    onPageChange={paginationHandlers.onPageChange}
    onNextPage={paginationHandlers.onNextPage}
    onPreviousPage={paginationHandlers.onPreviousPage}
    className="mt-8"
   />
   ) : (
   <div className="mt-8">
    <AuthUpsell variant="card" source="catalog" />
   </div>
   ))}

  {isHomepage && (
   <div className="mt-8 flex justify-center">
   {user ? (
    <button
    type="button"
    onClick={handleViewAllPlants}
    className="h-14 px-6 rounded-[22px] bg-sprout-dark text-sprout-cream font-display font-bold inline-flex items-center gap-2 shadow-[inset_0_0_0_2px_#dfc490]"
    data-testid="view-all-plants"
    >
    View All Plants
    <ArrowRight className="w-5 h-5" />
    </button>
   ) : (
    <AuthUpsell variant="card" source="homepage" />
   )}
   </div>
  )}

  {user && (
   <AddPlantDialog
   isOpen={isAddDialogOpen}
   onClose={handleCloseAddDialog}
   plantData={selectedPlantData}
   />
  )}
  </div>
 </section>
 );
};

export default PlantCatalog;
