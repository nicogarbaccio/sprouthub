import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useHouseholds } from "@/hooks/useHouseholds";
import { useHouseholdPlants, type HouseholdPlant } from "@/hooks/useHouseholdPlants";
import { cn } from "@/lib/utils";
import PlantImage from "@/components/ui/plant-image";
import { PLANT_FALLBACK_IMAGE } from "@/lib/constants";
import { getPlantImageUrl } from "@/utils/plants/images";
import { getWateringStatus } from "@/utils/watering/status";
import {
  SettingsCard,
  confirmDialogClasses,
  confirmTitleClasses,
  confirmCancelClasses,
  confirmDestructiveClasses,
} from "@/components/settings/SettingsUI";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { DelayedSkeleton, LoadingTransition } from "@/components/ui/loading-transition";
import { HouseholdDetailsSkeleton, Skeleton } from "@/components/ui/skeleton";
import {
  Settings,
  Users,
  UserPlus,
  Trash2,
  Home,
  Plus,
  Droplets,
  Edit,
  Clock,
  MoreHorizontal,
  History,
  ArrowLeft,
  Crown,
  Shield,
  Sprout,
  CalendarDays,
  Leaf,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InviteMemberDialog } from "@/components/households/InviteMemberDialog";
import { HouseholdMembersCard } from "@/components/households/HouseholdMembersCard";
import AddPlantDialog from "@/components/AddPlantDialog";
import EditPlantDialog from "@/components/EditPlantDialog";
import WateringHistoryDialog from "@/components/WateringHistoryDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { calculateWateringSchedule } from "@/utils/watering/schedule";
import { getRoomLabel } from "@/utils/rooms";
import { useManualNotifications } from "@/hooks/usePlantNotifications";
import type { UserPlant } from "@/hooks/useUserPlants";

const HouseholdManagement = () => {
  const { id: householdId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const {
    households,
    loading,
    inviteToHousehold,
    leaveHousehold,
    removeMember,
    deleteHousehold,
  } = useHouseholds();

  const { notifyWateringSuccess } = useManualNotifications();

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Household plants functionality
  const {
    plants,
    loading: plantsLoading,
    addWateringRecord,
    postponeWatering,
    refetch: refetchPlants,
  } = useHouseholdPlants();

  const [isAddPlantDialogOpen, setIsAddPlantDialogOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<UserPlant | null>(null);
  const [isEditPlantDialogOpen, setIsEditPlantDialogOpen] = useState(false);
  const [wateringHistoryPlant, setWateringHistoryPlant] =
    useState<UserPlant | null>(null);
  const [isWateringHistoryOpen, setIsWateringHistoryOpen] = useState(false);

  // Find the current household
  const household = households.find((h) => h.id === householdId);

  // Filter plants for this specific household
  const householdPlants = plants.filter(
    (plant) =>
      plant.household_id === householdId ||
      (plant.household_id && plant.household?.name === household?.name)
  );

  // Plant management functions

  const handleEditPlant = (plant: UserPlant) => {
    setEditingPlant(plant);
    setIsEditPlantDialogOpen(true);
  };

  const handleWateringHistory = (plant: UserPlant) => {
    setWateringHistoryPlant(plant);
    setIsWateringHistoryOpen(true);
  };


  const handleWaterPlant = async (plantId: string) => {
    try {
      await addWateringRecord(plantId, "Watered by household member");
      toast.success("Plant watered successfully!");
      const plantName =
        plants.find((p) => p.id === plantId)?.nickname || "Plant";
      notifyWateringSuccess(plantName);
    } catch (error) {
      console.error("Error watering plant:", error);
      toast.error("Failed to water plant");
    }
  };

  const handlePostponePlant = async (plantId: string) => {
    try {
      await postponeWatering(plantId, 1, "Postponed by household member");
      toast.success("Plant watering postponed successfully!");
    } catch (error) {
      console.error("Error postponing plant:", error);
      toast.error("Failed to postpone plant watering");
    }
  };

  useEffect(() => {
    if (!loading && !household && householdId) {
      // Household not found, redirect to households page
      toast.error("Household not found");
      navigate("/households");
    }
  }, [household, householdId, loading, navigate]);

  if (!user) {
    return (
      <div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-foreground">
              Please sign in to manage households
            </h1>
          </div>
        </div>
      </div>
    );
  }

  if (!loading && !household) {
    return (
      <div className="max-w-xl mx-auto px-4 pt-16 pb-32 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-card flex items-center justify-center mb-4">
          <Home className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="font-display text-2xl font-bold text-foreground mb-2">Household not found</h1>
        <p className="text-muted-foreground mb-6">
          It doesn't exist, or you don't have access to it.
        </p>
        <Link
          to="/households"
          className="h-12 px-5 rounded-2xl bg-sprout-dark text-sprout-cream font-bold inline-flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Households
        </Link>
      </div>
    );
  }

  // Still loading: the page reads the household's fields during render, so wait for it
  if (!household) {
    return (
      <DelayedSkeleton>
        <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-3.5 lg:pt-7 pb-32">
          <HouseholdDetailsSkeleton />
        </div>
      </DelayedSkeleton>
    );
  }

  const currentUserMember = household?.household_members.find(
    (member) => member.user_id === user.id
  );

  const canManage =
    currentUserMember && ["owner", "admin"].includes(currentUserMember.role);
  const isOwner = currentUserMember?.role === "owner";

  const handleDeleteHousehold = async () => {
    if (!isOwner || !household) return;

    const success = await deleteHousehold(household.id);
    if (success) {
      toast.success("Household deleted successfully");
      navigate("/households");
    }
  };

  const overduePlants = householdPlants.filter(p => calculateWateringSchedule(p).isOverdue);
  const dueTodayPlants = householdPlants.filter(p => {
    const calc = calculateWateringSchedule(p);
    return !calc.isOverdue && calc.daysUntilWatering === 0;
  });

  const role = currentUserMember?.role;
  const roleConfig =
    role === "owner"
      ? { icon: Crown, label: "Owner", classes: "bg-sprout-cream text-sprout-dark" }
      : role === "admin"
        ? { icon: Shield, label: "Admin", classes: "bg-sprout-water text-sprout-dark" }
        : { icon: Users, label: "Member", classes: "bg-card text-foreground" };
  const RoleIcon = roleConfig.icon;

  return (
    <div className="bg-background pb-32 lg:pb-10">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 pt-3.5 lg:pt-7">
        <LoadingTransition loading={loading} skeleton={<HouseholdDetailsSkeleton />}>
        {/* Header */}
        <CascadingContainer delay={0}>
          <Link
            to="/households"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-full bg-card text-sm font-bold text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            All Households
          </Link>
          <div className="flex items-end justify-between gap-3 mt-3 px-1.5 lg:px-0">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="font-display text-[28px] lg:text-[34px] font-bold tracking-[-0.04em] text-foreground">
                  {household.name}
                </h1>
                <span className={cn("inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full", roleConfig.classes)}>
                  <RoleIcon className="w-3.5 h-3.5" />
                  {roleConfig.label}
                </span>
              </div>
              {household.description && (
                <p className="text-sm lg:text-[15px] font-medium text-muted-foreground mt-0.5 max-w-xl">
                  {household.description}
                </p>
              )}
            </div>
            {canManage && (
              <button
                type="button"
                onClick={() => setInviteDialogOpen(true)}
                aria-label="Invite Member"
                className="shrink-0 h-12 w-12 lg:w-auto lg:px-5 rounded-2xl bg-sprout-cream text-sprout-dark font-bold text-[15px] inline-flex items-center justify-center gap-2"
              >
                <UserPlus className="w-5 h-5" />
                <span className="hidden lg:inline">Invite Member</span>
              </button>
            )}
          </div>
        </CascadingContainer>

        {/* Stat tiles */}
        <CascadingContainer delay={50}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-3.5 mt-[18px]">
            <StatTile icon={Users} value={household.member_count} label={household.member_count === 1 ? "member" : "members"} classes="bg-card text-foreground" />
            <StatTile icon={Leaf} value={householdPlants.length} label={householdPlants.length === 1 ? "plant" : "plants"} classes="bg-sprout-primary text-sprout-cream" />
            <StatTile
              icon={Droplets}
              value={overduePlants.length}
              label="overdue"
              classes={overduePlants.length > 0 ? "bg-sprout-warning text-sprout-dark" : "bg-card text-foreground"}
            />
            <StatTile
              icon={Droplets}
              value={dueTodayPlants.length}
              label="due today"
              classes={dueTodayPlants.length > 0 ? "bg-sprout-water text-sprout-dark" : "bg-card text-foreground"}
            />
          </div>
        </CascadingContainer>

        {/* Columns stretch to the same height so both cards end on the same line */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-3">
          {/* Household Plants */}
          <CascadingContainer delay={100} className="lg:col-span-2">
            <SettingsCard
              className="h-full"
              title="Household Plants"
              description={`${householdPlants.length} plant${householdPlants.length !== 1 ? "s" : ""} shared in this household`}
              icon={Leaf}
              iconClasses="bg-sprout-success text-sprout-dark"
              action={
                <button
                  type="button"
                  onClick={() => setIsAddPlantDialogOpen(true)}
                  aria-label="Add Plant"
                  className="h-10 w-10 sm:w-auto sm:px-3.5 rounded-[14px] bg-sprout-dark text-sprout-cream text-sm font-bold inline-flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" strokeWidth={2.5} />
                  <span className="hidden sm:inline">Add Plant</span>
                </button>
              }
            >
              {plantsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-[72px] rounded-[22px]" />
                  ))}
                </div>
              ) : householdPlants.length === 0 ? (
                <div className="rounded-[22px] bg-field px-5 py-8 text-center">
                  <Sprout className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                  <h3 className="text-[17px] font-bold text-foreground">No plants yet</h3>
                  <p className="text-sm text-muted-foreground mt-1 mb-4 max-w-sm mx-auto">
                    Add plants here so everyone can help with watering and care.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsAddPlantDialogOpen(true)}
                    className="h-12 px-5 rounded-2xl bg-sprout-dark text-sprout-cream font-bold inline-flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" strokeWidth={2.5} />
                    Add First Plant
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {householdPlants.map((plant) => (
                    <HouseholdPlantRow
                      key={plant.id}
                      plant={plant}
                      onOpen={() => navigate(`/my-plants/${plant.id}`)}
                      onWater={() => handleWaterPlant(plant.id)}
                      onPostpone={() => handlePostponePlant(plant.id)}
                      onHistory={() => handleWateringHistory(plant)}
                      onEdit={() => handleEditPlant(plant)}
                    />
                  ))}
                </div>
              )}
            </SettingsCard>
          </CascadingContainer>

          {/* Sidebar: the Settings card takes up any extra height */}
          <div className="flex flex-col gap-3">
            <CascadingContainer delay={150}>
              <SettingsCard
                title="Members"
                description={`${household.member_count} member${household.member_count !== 1 ? "s" : ""} in this household`}
                icon={Users}
                action={
                  canManage ? (
                    <button
                      type="button"
                      onClick={() => setInviteDialogOpen(true)}
                      className="h-10 px-3.5 rounded-[14px] bg-field text-foreground text-sm font-bold inline-flex items-center gap-1.5"
                    >
                      <UserPlus className="w-4 h-4" />
                      Invite
                    </button>
                  ) : undefined
                }
              >
                <HouseholdMembersCard
                  household={household}
                  currentUserId={user.id}
                  canManage={canManage}
                  onRemoveMember={removeMember}
                  onLeaveHousehold={leaveHousehold}
                />
              </SettingsCard>
            </CascadingContainer>

            <CascadingContainer delay={200} className="flex-1 flex flex-col">
              <SettingsCard
                title="Settings"
                icon={Settings}
                className="flex-1 flex flex-col"
                bodyClassName="flex-1 flex flex-col"
              >
                <InfoRow icon={CalendarDays} label="Created">
                  {new Date(household.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </InfoRow>
                <InfoRow icon={Users} label="Members">{household.member_count}</InfoRow>
                <InfoRow icon={Crown} label="Your Role">
                  <span className="capitalize">{currentUserMember?.role}</span>
                </InfoRow>

                {isOwner && (
                  // Pinned to the bottom if the card grows to match the plants column
                  <div className="flex-1 flex items-end">
                    <button
                      type="button"
                      onClick={() => setDeleteDialogOpen(true)}
                      className="w-full h-12 mt-1 rounded-[18px] bg-sprout-warning text-sprout-dark font-bold text-[15px] inline-flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete Household
                    </button>
                  </div>
                )}
              </SettingsCard>
            </CascadingContainer>
          </div>
        </div>

        {/* Dialogs */}
        <InviteMemberDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          householdId={household.id}
          onSubmit={inviteToHousehold}
        />

        <AddPlantDialog
          isOpen={isAddPlantDialogOpen}
          onClose={() => setIsAddPlantDialogOpen(false)}
          onPlantAdded={refetchPlants}
          defaultHouseholdId={householdId}
        />

        <EditPlantDialog
          plant={editingPlant}
          isOpen={isEditPlantDialogOpen}
          onClose={() => {
            setIsEditPlantDialogOpen(false);
            setEditingPlant(null);
          }}
          onUpdate={refetchPlants}
        />

        <WateringHistoryDialog
          plant={wateringHistoryPlant}
          isOpen={isWateringHistoryOpen}
          onClose={() => {
            setIsWateringHistoryOpen(false);
            setWateringHistoryPlant(null);
          }}
          onPlantDataChange={refetchPlants}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent className={confirmDialogClasses}>
            <AlertDialogHeader>
              <AlertDialogTitle className={confirmTitleClasses}>Delete Household</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{household.name}"? This action
                cannot be undone. All household data, including shared plants
                and member information, will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className={confirmCancelClasses}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteHousehold}
                className={confirmDestructiveClasses}
              >
                Delete Household
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        </LoadingTransition>
      </div>
    </div>
  );
};


function StatTile({
  icon: Icon,
  value,
  label,
  classes,
}: {
  icon: React.ElementType;
  value: number;
  label: string;
  classes: string;
}) {
  return (
    <div className={cn("rounded-card px-5 py-4 flex items-center justify-between gap-3", classes)}>
      <div className="min-w-0">
        <div className="font-display text-[28px] md:text-[32px] font-extrabold leading-none tabular-nums">{value}</div>
        <div className="text-[13px] font-bold mt-1.5">{label}</div>
      </div>
      <Icon className="w-7 h-7 shrink-0 opacity-80" aria-hidden="true" />
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[18px] bg-field px-4 py-3 text-[15px]">
      <span className="flex items-center gap-2 text-muted-foreground font-semibold">
        <Icon className="w-4 h-4" />
        {label}
      </span>
      <span className="font-bold text-foreground">{children}</span>
    </div>
  );
}

function HouseholdPlantRow({
  plant,
  onOpen,
  onWater,
  onPostpone,
  onHistory,
  onEdit,
}: {
  plant: HouseholdPlant;
  onOpen: () => void;
  onWater: () => void;
  onPostpone: () => void;
  onHistory: () => void;
  onEdit: () => void;
}) {
  const calc = calculateWateringSchedule(plant);
  const status = getWateringStatus(calc, plant.latest_watering);
  const owner = plant.is_owned_by_user
    ? "You"
    : plant.plant_owner?.email?.split("@")[0] || "Unknown";

  return (
    <div className="flex items-center gap-3 rounded-[22px] bg-field p-2.5">
      <button
        type="button"
        onClick={onOpen}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
        aria-label={`View details for ${plant.nickname}`}
      >
        <div className="w-14 h-14 shrink-0 rounded-2xl overflow-hidden bg-card">
          <PlantImage
            src={getPlantImageUrl(plant.image, plant.plant_type, PLANT_FALLBACK_IMAGE)}
            alt=""
            className="w-full h-full"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-bold text-foreground truncate">{plant.nickname}</h4>
          <p className="text-[13px] text-muted-foreground truncate">
            {plant.plant_type}
            {plant.room ? ` · ${getRoomLabel(plant.room)}` : ""}
          </p>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className={cn("text-[11px] font-bold px-2 py-0.5 rounded-full", status.bentoClasses)}>
              {status.text}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-card text-muted-foreground">
              Owner: {owner}
            </span>
          </div>
        </div>
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="w-10 h-10 shrink-0 rounded-[14px] bg-card text-foreground flex items-center justify-center hover:bg-sprout-cream hover:text-sprout-dark transition-colors"
            aria-label="Plant actions menu"
          >
            <MoreHorizontal className="w-5 h-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-2xl">
          <DropdownMenuItem onClick={onWater} className="cursor-pointer">
            <Droplets className="w-4 h-4 mr-2 text-sprout-water" />
            Water Now
          </DropdownMenuItem>
          {calc.isOverdue && (
            <DropdownMenuItem onClick={onPostpone} className="cursor-pointer">
              <Clock className="w-4 h-4 mr-2" />
              Push to Tomorrow
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onHistory} className="cursor-pointer">
            <History className="w-4 h-4 mr-2" />
            View Watering History
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onEdit} className="cursor-pointer" disabled={!plant.is_owned_by_user}>
            <Edit className="w-4 h-4 mr-2" />
            Edit Plant
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default HouseholdManagement;
