import React, { useState, useEffect } from "react";
import {
  Plus,
  Droplets,
  Home,
  ListChecks,
  Search,
  X,
  BarChart3,
} from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Skeleton, SearchFilterBarSkeleton, RoomSectionSkeleton } from "@/components/ui/skeleton";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { LoadingTransition } from "@/components/ui/loading-transition";
import RoomSection from "./RoomSection";
import EditPlantDialog from "./EditPlantDialog";
import AddPlantDialog from "./AddPlantDialog";
import WateringHistoryDialog from "./WateringHistoryDialog";
import { useUserPlants, UserPlant } from "@/hooks/useUserPlants";
import { useAuth } from "@/contexts/AuthContext";
import { groupPlantsByRoom } from "@/utils/rooms";
import { calculateWateringSchedule } from "@/utils/watering/schedule";
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
  statusOptions,
  sortOptions,
  type PlantStatus,
  type SortOption,
} from "@/components/SearchFilterBar";
import { applyFiltersAndSort, getUniqueRooms } from "@/utils/plants/filtering";
import {
  useManualNotifications,
} from "@/hooks/usePlantNotifications";
import { generatePlantNotifications } from "@/utils/notifications/generator";
import { useRainDelay } from "@/hooks/useRainDelay";
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
    logFertilization,
  } = useUserPlants();
  const { enterSelectionMode, isSelectionMode } = useBulkSelection();
  const [editingPlant, setEditingPlant] = useState<UserPlant | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [historyPlant, setHistoryPlant] = useState<UserPlant | null>(null);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);

  // Search and filter state. `?q=`, `?filter=` and `?sort=` (from links on Home) seed the
  // initial view.
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") ?? "");
  const [searchOpen, setSearchOpen] = useState(() => !!searchParams.get("q"));
  const [statusFilter, setStatusFilter] = useState<PlantStatus>(() => {
    const filter = searchParams.get("filter");
    return statusOptions.find((o) => o.value === filter)?.value ?? "all";
  });
  const [roomFilter, setRoomFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortOption>(() => {
    const sort = searchParams.get("sort");
    return sortOptions.find((o) => o.value === sort)?.value ?? "name-asc";
  });

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

  const myPlantsSkeletonContent = (
    <section className="pt-3.5 lg:pt-7 pb-32 lg:pb-10 bg-background">
      <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <div className="flex items-end justify-between gap-3 px-1.5 lg:px-0">
          <div className="space-y-2">
            <Skeleton className="h-9 lg:h-10 w-40 rounded-xl" />
            <Skeleton className="h-4 w-32" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <Skeleton className="h-12 w-12 rounded-2xl" />
            <Skeleton className="h-12 w-12 lg:w-36 rounded-2xl" />
          </div>
        </div>
        <div className="mt-[18px]">
          <SearchFilterBarSkeleton />
        </div>
        <RoomSectionSkeleton cardCount={4} />
        <RoomSectionSkeleton cardCount={2} />
      </div>
    </section>
  );

  // Manual notification helpers
  const { notifyWateringSuccess, notifyBulkWatering } =
    useManualNotifications();
  const { addNotification } = useNotifications();

  // Same rain delay advice the Dashboard and notification center use.
  const { rainDelayByPlantId } = useRainDelay(plants);

  // Listen for push permission granted event to trigger immediate notification check
  useEffect(() => {
    const handlePushPermissionGranted = () => {
      console.log(
        "[MyPlantsCollection] Push permission granted, triggering immediate notification check..."
      );

      // Generate notifications immediately when push permission is granted
      if (plants.length > 0) {
        const notifications = generatePlantNotifications(
          plants,
          rainDelayByPlantId
        );
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
  }, [plants, addNotification, rainDelayByPlantId]);

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

  const { dueToday } = plantStats;

  // Room statistics, across the whole collection rather than the filtered view
  const roomCount = Object.keys(groupPlantsByRoom(plants)).length;

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
  const handleWaterPlant = async (
    plantId: string,
    notes?: string,
    wateredAt?: Date
  ) => {
    const plant = plants.find((p) => p.id === plantId);
    await waterPlant(plantId, notes, wateredAt);
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

  return (
    <LoadingTransition loading={loading} skeleton={myPlantsSkeletonContent}>
    <React.Fragment>
      <PullToRefresh
        onRefresh={async () => {
          await fetchPlants();
        }}
        // Tall enough on phones to pull from anywhere; desktop has no pull gesture
        className="min-h-[calc(100vh-4rem)] lg:min-h-0"
      >
        <section
          data-testid="my-plants-collection"
          className="pt-3.5 pb-8 lg:pt-7 bg-background"
        >
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
        <CascadingContainer delay={0}>
          <div className="flex justify-between items-end gap-3 px-1.5 lg:px-0">
            <div className="min-w-0">
              <h2
                data-testid="collection-header"
                className="font-display text-[28px] lg:text-[34px] font-bold tracking-[-0.04em] text-foreground"
              >
                My Plants
              </h2>
              <p className="text-sm lg:text-[15px] font-medium text-muted-foreground mt-0.5">
                {plants.length} plant{plants.length !== 1 ? "s" : ""}
                {roomCount > 0 && ` · ${roomCount} room${roomCount !== 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              {plants.length > 0 && (
                <>
                  <HeaderButton
                    label="Search"
                    onClick={() => setSearchOpen((open) => !open)}
                    pressed={searchOpen || searchQuery !== ""}
                  >
                    <Search className="w-[22px] h-[22px]" />
                  </HeaderButton>
                  <HeaderButton label="Select plants" onClick={enterSelectionMode} pressed={isSelectionMode}>
                    <ListChecks className="w-[22px] h-[22px]" />
                  </HeaderButton>
                </>
              )}
              <button
                data-testid="add-plant-button"
                onClick={handleAddPlant}
                aria-label="Add New Plant"
                className="h-12 w-12 lg:w-auto lg:px-5 rounded-2xl bg-sprout-cream text-sprout-dark flex items-center justify-center gap-2 font-bold text-[15px]"
              >
                <Plus className="w-[22px] h-[22px]" strokeWidth={2.5} />
                <span className="hidden lg:inline">Add plant</span>
              </button>
            </div>
          </div>
        </CascadingContainer>

        {/* Search and Filter Bar */}
        {plants.length > 0 && (
          <CascadingContainer delay={100}>
            <div className="mt-[18px]">
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
                searchOpen={searchOpen}
                onSearchOpenChange={setSearchOpen}
                totalCount={plants.length}
                thirstyCount={dueToday}
              />
            </div>
          </CascadingContainer>
        )}

        {plants.length === 0 ? (
          <CascadingContainer delay={200}>
            <div
              data-testid="empty-collection-state"
              className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-2.5"
            >
              <div className="col-span-2 rounded-tile bg-sprout-cream text-sprout-dark p-6 md:p-8 relative overflow-hidden">
                <div className="absolute -right-10 -bottom-16 w-56 h-56 rounded-full bg-sprout-dark opacity-[0.08]" aria-hidden="true" />
                <h3 className="relative font-display text-[26px] md:text-[32px] font-bold tracking-[-0.04em] leading-tight">
                  Start your collection
                </h3>
                <p className="relative text-[15px] md:text-base font-medium mt-2 max-w-[40ch]">
                  Add a plant and we'll track its watering, organize it by room, and learn how you care for it.
                </p>
                <button
                  data-testid="add-first-plant-button"
                  onClick={handleAddPlant}
                  className="relative mt-5 h-14 px-6 rounded-[22px] bg-sprout-dark text-sprout-cream font-display font-bold flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" strokeWidth={2.5} />
                  Add your first plant
                </button>
              </div>
              <EmptyTile className="bg-sprout-water" icon={Droplets} title="Smart watering" body="Schedules that adapt to how you water" />
              <EmptyTile className="bg-sprout-primary text-sprout-cream" icon={Home} title="By room" body="Group plants where they live" />
              <EmptyTile className="bg-sprout-warning col-span-2 md:col-span-4" icon={BarChart3} title="Growth tracking" body="Journal, history, and care insights for every plant" />
            </div>
          </CascadingContainer>
        ) : filteredPlants.length === 0 ? (
          <CascadingContainer delay={200}>
            <div className="mt-6 rounded-tile bg-card p-10 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-60" />
              <h3 className="font-display text-xl font-bold text-foreground mb-1">
                No plants found
              </h3>
              <p className="text-muted-foreground mb-5">
                Try a different search or filter
              </p>
              <button
                onClick={handleClearFilters}
                className="h-11 px-5 rounded-full bg-foreground text-background font-bold text-sm inline-flex items-center gap-1.5"
              >
                <X className="h-4 w-4" />
                Clear filters
              </button>
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
                  onFertilizePlant={logFertilization}
                  formatDate={formatDate}
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
    </LoadingTransition>
  );
};

const HeaderButton = ({
  label,
  onClick,
  pressed,
  children,
}: {
  label: string;
  onClick: () => void;
  pressed?: boolean;
  children: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    aria-label={label}
    aria-pressed={pressed}
    className={cn(
      "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors",
      pressed ? "bg-foreground text-background" : "bg-card text-foreground"
    )}
  >
    {children}
  </button>
);

const EmptyTile = ({
  icon: Icon,
  title,
  body,
  className,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  className?: string;
}) => (
  <div className={cn("rounded-card p-4 min-h-[130px] flex flex-col justify-between text-sprout-dark", className)}>
    <Icon className="w-6 h-6" />
    <div>
      <div className="text-[17px] font-bold">{title}</div>
      <div className="text-[13px] font-semibold opacity-80">{body}</div>
    </div>
  </div>
);

const MyPlantsCollection = () => {
  return (
    <BulkSelectionProvider>
      <MyPlantsCollectionContent />
    </BulkSelectionProvider>
  );
};

export default MyPlantsCollection;
