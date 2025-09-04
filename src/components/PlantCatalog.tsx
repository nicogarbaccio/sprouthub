import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
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
 const displayedPlants = isHomepage
 ? filteredPlants.slice(0, 16) // Homepage shows first 16 plants
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
  className={`py-8 ${
  isDashboard ? "bg-background" : "bg-plant-neutral dark:bg-background"
  }`}
  data-testid="plant-catalog"
 >
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
  {isDashboard ? (
   <div className="text-center mb-12">
   <h2 className="text-2xl md:text-3xl font-semibold text-foreground mb-4">
    Discover New Plants
   </h2>
   <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
    Browse our plant catalog to find your next green companion
   </p>
   </div>
  ) : (
   <PlantCatalogHeader />
  )}

  {!isHomepage && (
   <>
   {user && (
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
    className="mt-12"
   />
   ) : (
   <div className="mt-12">
    <AuthUpsell variant="card" source="catalog" />
   </div>
   ))}

  {isHomepage && (
   <div className="mt-12">
   {user ? (
    <Button
    onClick={handleViewAllPlants}
    className="bg-sprout-dark hover:bg-sprout-dark/90 dark:bg-sprout-cream dark:hover:bg-sprout-cream/90 text-sprout-white dark:text-sprout-dark px-8 py-3 rounded-xl font-medium text-lg"
    data-testid="view-all-plants"
    >
    View All Plants
    <ArrowRight className="ml-2 w-5 h-5" />
    </Button>
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
