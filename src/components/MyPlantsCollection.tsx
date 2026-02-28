import React, { useState, useEffect } from "react";
import {
  Plus,
  Droplets,
  Home,
  ListChecks,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton, SearchFilterBarSkeleton, RoomSectionSkeleton } from "@/components/ui/skeleton";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { useGracefulLoading } from "@/hooks/useGracefulLoading";
import RoomSection from "./RoomSection";
import EditPlantDialog from "./EditPlantDialog";
import AddPlantDialog from "./AddPlantDialog";
import WateringHistoryDialog from "./WateringHistoryDialog";
import { useUserPlants, UserPlant } from "@/hooks/useUserPlants";
import { useAuth } from "@/contexts/AuthContext";
import { groupPlantsByRoom } from "@/utils/rooms";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  calculateWateringSchedule,
  getNextWateringDate as getNextWateringDateUtil,
  isPlantOverdue,
} from "@/utils/watering/schedule";
import { updatePlantWateringSchedule } from "@/utils/watering/scheduleUpdater";
import { utilityToast } from "@/utils/notifications/toast";
import { toast } from "sonner";
import {
  useKeyboardShortcuts,
  createPlantShortcuts,
} from "@/hooks/useKeyboardShortcuts";
import {
  BulkSelectionProvider,
  useBulkSelection,
} from "@/contexts/BulkSelectionContext";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import {
  SearchFilterBar,
  type PlantStatus,
  type SortOption,
} from "@/components/SearchFilterBar";
import { applyFiltersAndSort, getUniqueRooms } from "@/utils/plants/filtering";
import {
  usePlantNotifications,
  useManualNotifications,
} from "@/hooks/usePlantNotifications";
import { generatePlantNotifications } from "@/utils/notifications/generator";
import { useNotifications } from "@/contexts/NotificationContext";

const MyPlantsCollectionContent = () => {
  const { user } = useAuth();
  const {
    plants,
    loading,
    fetchPlants,
    waterPlant,
    postponeWatering,
    overwateringByPlantId,
    deletePlant,
  } = useUserPlants();
  const { enterSelectionMode, isSelectionMode } = useBulkSelection();
  const [editingPlant, setEditingPlant] = useState<UserPlant | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [historyPlant, setHistoryPlant] = useState<UserPlant | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PlantStatus>("all");
  const [roomFilter, setRoomFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>("name-asc");

  // Apply filters and sorting
  const filteredPlants = applyFiltersAndSort(plants, {
    searchQuery,
    status: statusFilter,
    room: roomFilter,
    sortBy,
  });

  const availableRooms = getUniqueRooms(plants);

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setRoomFilter("all");
  };

  const { showLoading, isReady } = useGracefulLoading(loading, {
    minLoadingTime: 0,
    staggerDelay: 0,
  });

  // Automatically generate notifications from plant data
  usePlantNotifications(plants, !loading);

  // Manual notification helpers
  const { notifyWateringSuccess, notifyBulkWatering } =
    useManualNotifications();
  const { addNotification } = useNotifications();

  // Listen for push permission granted event to trigger immediate notification check
  useEffect(() => {
    const handlePushPermissionGranted = () => {
      console.log(
        "[MyPlantsCollection] Push permission granted, triggering immediate notification check..."
      );

      // Generate notifications immediately when push permission is granted
      if (plants.length > 0) {
        const notifications = generatePlantNotifications(plants);
        notifications.forEach((notification) => {
          addNotification(notification);
        });
        console.log(
          `[MyPlantsCollection] Added ${notifications.length} notification(s)`
        );
      }
    };

    window.addEventListener(
      "push-permission-granted",
      handlePushPermissionGranted
    );

    return () => {
      window.removeEventListener(
        "push-permission-granted",
        handlePushPermissionGranted
      );
    };
  }, [plants, addNotification]);

  // Setup keyboard shortcuts - MUST be before any early returns
  useKeyboardShortcuts({
    shortcuts: createPlantShortcuts({
      onAddPlant: () => {
        setIsAddDialogOpen(true);
      },
    }),
  });

  if (!user) {
    return null;
  }

  if (showLoading) {
    return (
      <section className="py-8 bg-background min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header Skeleton */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
            <div>
              <Skeleton className="h-10 w-80 mb-4" />
              <div className="flex flex-wrap gap-4">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-24 rounded-full" />
                <Skeleton className="h-6 w-28 rounded-full" />
              </div>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <Skeleton className="h-10 w-24 rounded-xl" />
              <Skeleton className="h-10 w-36 rounded-xl" />
            </div>
          </div>

          {/* Search/Filter Bar Skeleton */}
          <div className="mb-6">
            <SearchFilterBarSkeleton />
          </div>

          {/* Room Section Skeletons */}
          <RoomSectionSkeleton cardCount={4} />
          <RoomSectionSkeleton cardCount={3} />
        </div>
      </section>
    );
  }

  if (!isReady) {
    return (
      <section className="py-8 bg-background min-h-[calc(100vh-4rem)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 opacity-0">
          {/* Invisible content to maintain height */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
            <div>
              <div className="h-10 w-80 mb-4" />
              <div className="flex flex-wrap gap-4">
                <div className="h-6 w-20" />
                <div className="h-6 w-24" />
                <div className="h-6 w-28" />
              </div>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <div className="h-10 w-24" />
              <div className="h-10 w-36" />
            </div>
          </div>
          <div className="h-10 mb-6" />
          <div className="mb-12">
            <div className="h-24 mb-6" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-80" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Calculate plant statistics using the new watering calculation utility
  const plantStats = plants.reduce(
    (stats, plant) => {
      const wateringCalc = calculateWateringSchedule(plant);

      if (wateringCalc.hasUnknownWateringDate) {
        stats.unknownWateringCount++;
      } else if (wateringCalc.isOverdue) {
        stats.overdueCount++;
        stats.dueToday++;
      } else if (wateringCalc.daysUntilWatering === 0) {
        // Only count plants that are actually due today, not postponed ones
        stats.dueToday++;
      }
      // Note: postponed plants are intentionally not counted as "due today"

      return stats;
    },
    { overdueCount: 0, dueToday: 0, unknownWateringCount: 0 }
  );

  const { overdueCount, dueToday, unknownWateringCount } = plantStats;

  const overwateringCount = plants.filter((p) => {
    const risk = overwateringByPlantId[p.id];
    return risk && risk.level !== "none";
  }).length;

  // Room statistics
  const roomGroups = groupPlantsByRoom(filteredPlants);
  const roomCount = Object.keys(roomGroups).length;

  const handleEditPlant = (plant: UserPlant) => {
    setEditingPlant(plant);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setIsEditDialogOpen(false);
    setEditingPlant(null);
  };

  const handleUpdatePlant = () => {
    fetchPlants();
  };

  const handleAddPlant = () => {
    setIsAddDialogOpen(true);
  };

  const handleCloseAddDialog = () => {
    setIsAddDialogOpen(false);
  };

  const handleViewHistory = (plant: UserPlant) => {
    setHistoryPlant(plant);
    setIsHistoryDialogOpen(true);
  };

  const handleCloseHistoryDialog = () => {
    setIsHistoryDialogOpen(false);
    setHistoryPlant(null);
  };

  // Individual plant water handler with notification
  const handleWaterPlant = async (plantId: string) => {
    const plant = plants.find((p) => p.id === plantId);
    await waterPlant(plantId);
    if (plant) {
      notifyWateringSuccess(plant.nickname);
    }
  };

  // Bulk action handlers
  const handleBulkWater = async (plantIds: string[]) => {
    try {
      await Promise.all(plantIds.map((id) => waterPlant(id)));
      toast.success(
        `Successfully watered ${plantIds.length} plant${
          plantIds.length > 1 ? "s" : ""
        }`
      );
      notifyBulkWatering(plantIds.length);
    } catch (error) {
      toast.error("Failed to water some plants");
    }
  };

  const handleBulkDelete = async (plantIds: string[]) => {
    try {
      await Promise.all(plantIds.map((id) => deletePlant(id)));
      toast.success(
        `Successfully deleted ${plantIds.length} plant${
          plantIds.length > 1 ? "s" : ""
        }`
      );
    } catch (error) {
      toast.error("Failed to delete some plants");
    }
  };

  // Handle schedule adjustment from pattern suggestions
  const handleScheduleAdjustment = async (
    plantId: string,
    newSchedule: number
  ): Promise<void> => {
    try {
      const result = await updatePlantWateringSchedule(plantId, newSchedule);

      if (result.success) {
        utilityToast.info(
          "Schedule Updated",
          `Watering schedule updated from ${result.previousSchedule} to ${result.newSchedule} days`
        );

        // Refresh plants data to show updated schedule
        await fetchPlants();
      } else {
        throw new Error(result.error || "Failed to update schedule");
      }
    } catch (error) {
      console.error("Error updating plant schedule:", error);
      utilityToast.error(
        "Update Failed",
        error instanceof Error
          ? error.message
          : "Failed to update watering schedule"
      );
    }
  };

  const formatDate = (dateString: string) => {
    // Use UTC date to avoid timezone conversion issues
    // This ensures consistent calendar-based display
    const date = new Date(dateString);

    // Handle early morning waterings (00:00-04:00 UTC) as previous day
    // This accounts for late evening waterings that cross midnight due to timezone
    let displayDate = new Date(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    );
    if (date.getUTCHours() < 4) {
      displayDate.setUTCDate(displayDate.getUTCDate() - 1);
    }

    return displayDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    });
  };

  // Wrapper functions for backward compatibility with RoomSection
  const getNextWateringDate = (
    lastWatered: string | undefined,
    daysAgo: number | undefined,
    wateringSchedule: number
  ) => {
    return getNextWateringDateUtil(
      lastWatered,
      daysAgo,
      wateringSchedule,
      formatDate
    );
  };

  const isOverdue = (
    daysAgo: number | undefined,
    wateringSchedule: number,
    hasLastWatered: boolean
  ) => {
    return isPlantOverdue(daysAgo, wateringSchedule, hasLastWatered);
  };

  return (
    <React.Fragment>
      <PullToRefresh
        onRefresh={async () => {
          await fetchPlants();
        }}
        className="min-h-[calc(100vh-4rem)]"
      >
        <section
          data-testid="my-plants-collection"
          className="py-8 bg-background"
        >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <CascadingContainer delay={0}>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-12">
            <div>
              <h2
                data-testid="collection-header"
                className="text-3xl md:text-4xl font-semibold text-foreground mb-4"
              >
                My Plant Collection
              </h2>
              <div
                data-testid="collection-stats"
                className="flex flex-wrap gap-4 text-sm"
              >
                <span
                  data-testid="plants-total-badge"
                  className="bg-sprout-medium text-white px-3 py-1 rounded-full"
                >
                  {plants.length} plants total
                </span>
                {roomCount > 0 && (
                  <span
                    data-testid="room-count-badge"
                    className="bg-sprout-water text-white px-3 py-1 rounded-full"
                  >
                    {roomCount} room{roomCount !== 1 ? "s" : ""}
                  </span>
                )}
                {overdueCount > 0 && (
                  <span
                    data-testid="overdue-count-badge"
                    className="bg-sprout-error text-white px-3 py-1 rounded-full"
                  >
                    {overdueCount} overdue
                  </span>
                )}
                {dueToday > 0 && (
                  <span
                    data-testid="due-today-badge"
                    className="bg-sprout-warning text-white px-3 py-1 rounded-full"
                  >
                    {dueToday} due today
                  </span>
                )}
                {unknownWateringCount > 0 && (
                  <span
                    data-testid="unknown-schedule-badge"
                    className="bg-neutral-light text-neutral-dark px-3 py-1 rounded-full"
                  >
                    {unknownWateringCount} unknown schedule
                  </span>
                )}
                {overwateringCount > 0 && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span
                          data-testid="overwatering-risk-badge"
                          className="bg-red-100 text-red-700 px-3 py-1 rounded-full cursor-help"
                        >
                          {overwateringCount} overwatering risk
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          We flag possible overwatering when a plant is watered
                          2+ times within its suggested window (e.g., 7 days),
                          or when the average interval is less than half the
                          suggested days.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>

            <div className="flex gap-2 mt-4 md:mt-0">
              <Button
                variant="outline"
                onClick={enterSelectionMode}
                className="rounded-xl font-medium"
              >
                <ListChecks className="w-4 h-4 mr-2" />
                Select
              </Button>
              <Button
                data-testid="add-plant-button"
                onClick={handleAddPlant}
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add New Plant
              </Button>
            </div>
          </div>
        </CascadingContainer>

        {/* Search and Filter Bar */}
        {plants.length > 0 && (
          <CascadingContainer delay={150}>
            <div className="mb-6">
              <SearchFilterBar
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                status={statusFilter}
                onStatusChange={setStatusFilter}
                room={roomFilter}
                onRoomChange={setRoomFilter}
                sortBy={sortBy}
                onSortChange={setSortBy}
                availableRooms={availableRooms}
                onClearAll={handleClearFilters}
              />
            </div>
          </CascadingContainer>
        )}

        {plants.length === 0 ? (
          <CascadingContainer delay={200}>
            <div
              data-testid="empty-collection-state"
              className="bg-gradient-to-br from-plant-secondary/10 to-plant-primary/5 rounded-3xl p-12 text-center"
            >
              <div className="w-32 h-32 bg-gradient-to-br from-plant-primary to-plant-secondary rounded-full flex items-center justify-center mx-auto mb-8 shadow-lg">
                <img
                  src="/LogoDark.svg"
                  alt="sprouthub Logo"
                  className="w-20 h-20"
                />
              </div>
              <h3 className="text-3xl font-semibold text-foreground mb-4">
                Welcome to Your Plant Collection
              </h3>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Start your journey as a plant parent! Track watering schedules,
                organize plants by room, and watch your green family grow.
              </p>

              {/* Benefits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="flex flex-col items-center p-4">
                  <div className="w-12 h-12 bg-sprout-water/20 rounded-full flex items-center justify-center mb-3">
                    <Droplets className="w-6 h-6 text-sprout-water" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Smart Watering
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Never forget to water with personalized schedules
                  </p>
                </div>
                <div className="flex flex-col items-center p-4">
                  <div className="w-12 h-12 bg-sprout-light/20 rounded-full flex items-center justify-center mb-3">
                    <Home className="w-6 h-6 text-amber-100" />
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Room Organization
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Organize plants by location in your home
                  </p>
                </div>
                <div className="flex flex-col items-center p-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-3">
                    <span className="text-lg">📊</span>
                  </div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Growth Tracking
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Monitor your plants' health and progress
                  </p>
                </div>
              </div>

              <Button
                data-testid="add-first-plant-button"
                onClick={handleAddPlant}
                size="lg"
                className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add Your First Plant
              </Button>
            </div>
          </CascadingContainer>
        ) : filteredPlants.length === 0 ? (
          <CascadingContainer delay={200}>
            <div className="bg-muted/50 rounded-lg p-12 text-center">
              <Search className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                No plants found
              </h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filters
              </p>
              <Button variant="outline" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CascadingContainer>
        ) : (
          <>
            {/* Render Plants by Room */}
            {Object.entries(groupPlantsByRoom(filteredPlants)).map(
              ([roomKey, roomPlants], index) => (
                <RoomSection
                  key={roomKey}
                  roomKey={roomKey}
                  plants={roomPlants}
                  onWaterPlant={handleWaterPlant}
                  onEditPlant={handleEditPlant}
                  onAddPlant={handleAddPlant}
                  onPostponeWatering={postponeWatering}
                  onViewHistory={handleViewHistory}
                  onScheduleAdjustment={handleScheduleAdjustment}
                  formatDate={formatDate}
                  getNextWateringDate={getNextWateringDate}
                  isOverdue={isOverdue}
                  delay={200 + index * 100}
                  overwateringByPlantId={overwateringByPlantId}
                />
              )
            )}
          </>
        )}

        {/* Spacer for bulk actions bar when visible */}
        {isSelectionMode && (
          <div className="h-32 md:h-24" aria-hidden="true" />
        )}

        <EditPlantDialog
          plant={editingPlant}
          isOpen={isEditDialogOpen}
          onClose={handleCloseEditDialog}
          onUpdate={handleUpdatePlant}
        />

        <AddPlantDialog
          isOpen={isAddDialogOpen}
          onClose={handleCloseAddDialog}
          onPlantAdded={fetchPlants}
        />

        <WateringHistoryDialog
          plant={historyPlant}
          isOpen={isHistoryDialogOpen}
          onClose={handleCloseHistoryDialog}
          onScheduleAdjustment={handleScheduleAdjustment}
          onPlantDataChange={fetchPlants}
        />
        </div>
        </section>
      </PullToRefresh>

      {/* Bulk Actions Bar - MUST be outside PullToRefresh to avoid transform stacking context */}
      <BulkActionsBar
        onBulkWater={handleBulkWater}
        onBulkDelete={handleBulkDelete}
        allPlantIds={plants.map((p) => p.id)}
      />
    </React.Fragment>
  );
};

const MyPlantsCollection = () => {
  return (
    <BulkSelectionProvider>
      <MyPlantsCollectionContent />
    </BulkSelectionProvider>
  );
};

export default MyPlantsCollection;
