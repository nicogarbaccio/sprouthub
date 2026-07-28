import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useHouseholds } from "@/hooks/useHouseholds";
import { useHouseholdPlants } from "@/hooks/useHouseholdPlants";
import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { LoadingTransition } from "@/components/ui/loading-transition";
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
  ChevronDown,
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
import { getRoomIcon, getRoomLabel } from "@/utils/rooms";
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
    } catch (error) {
      console.error("Error watering plant:", error);
      toast.error("Failed to water plant");
    }
  };

  const handlePostponePlant = async (plantId: string) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await postponeWatering(
        plantId,
        tomorrow,
        "Postponed by household member"
      );
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
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Please sign in to manage households
            </h1>
          </div>
        </div>
      </div>
    );
  }

  if (!loading && !household) {
    return (
      <div>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <Home className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Household not found
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              The household you're looking for doesn't exist or you don't have
              access to it.
            </p>
            <Link to="/households">
              <Button>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Households
              </Button>
            </Link>
          </div>
        </div>
      </div>
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

  const getRoleBadge = (role: string | undefined) => {
    switch (role) {
      case 'owner':
        return (
          <Badge className="bg-sprout-cream/20 text-sprout-cream border-sprout-cream/30 font-medium">
            <Crown className="w-3 h-3 mr-1" />
            Owner
          </Badge>
        );
      case 'admin':
        return (
          <Badge className="bg-sprout-water/20 text-sprout-water border-sprout-water/30 font-medium">
            <Shield className="w-3 h-3 mr-1" />
            Admin
          </Badge>
        );
      default:
        return (
          <Badge className="bg-white/20 text-white border-white/30 font-medium">
            Member
          </Badge>
        );
    }
  };

  const overduePlants = householdPlants.filter(p => calculateWateringSchedule(p).isOverdue);
  const dueTodayPlants = householdPlants.filter(p => {
    const calc = calculateWateringSchedule(p);
    return !calc.isOverdue && calc.daysUntilWatering === 0;
  });

  return (
    <div>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <LoadingTransition loading={loading} skeleton={<HouseholdDetailsSkeleton />}>
        {/* Hero Header */}
        <CascadingContainer delay={0}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-sprout-dark via-sprout-primary to-sprout-medium p-6 sm:p-8 mb-8">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-sprout-light/10 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-sprout-cream/10 rounded-full translate-y-1/2 -translate-x-1/4" />
            <div className="absolute top-1/2 right-1/4 w-24 h-24 bg-sprout-water/10 rounded-full" />

            <div className="relative z-10">
              {/* Back link */}
              <Link
                to="/households"
                className="inline-flex items-center gap-1.5 text-sprout-light/80 hover:text-white text-sm mb-4 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                All Households
              </Link>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-white/15 rounded-xl backdrop-blur-sm">
                      <Home className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white">
                      {household.name}
                    </h1>
                    {getRoleBadge(currentUserMember?.role)}
                  </div>
                  {household.description && (
                    <p className="text-sprout-light text-base max-w-lg mt-1">
                      {household.description}
                    </p>
                  )}
                </div>
                {canManage && (
                  <Button
                    onClick={() => setInviteDialogOpen(true)}
                    className="w-full sm:w-auto bg-white text-sprout-dark hover:bg-sprout-pale font-semibold shadow-lg shadow-black/10"
                    size="lg"
                  >
                    <UserPlus className="w-5 h-5 mr-2" />
                    Invite Member
                  </Button>
                )}
              </div>

              {/* Quick stats */}
              <div className="flex flex-wrap gap-3 mt-5">
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-white/90">
                  <Users className="w-4 h-4" />
                  <span className="font-medium">{household.member_count}</span> member{household.member_count !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-white/90">
                  <Leaf className="w-4 h-4" />
                  <span className="font-medium">{householdPlants.length}</span> plant{householdPlants.length !== 1 ? 's' : ''}
                </div>
                {overduePlants.length > 0 && (
                  <div className="flex items-center gap-2 bg-sprout-warning/20 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-sprout-cream">
                    <Droplets className="w-4 h-4" />
                    <span className="font-medium">{overduePlants.length}</span> overdue
                  </div>
                )}
                {dueTodayPlants.length > 0 && (
                  <div className="flex items-center gap-2 bg-sprout-water/20 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-sprout-water">
                    <Droplets className="w-4 h-4" />
                    <span className="font-medium">{dueTodayPlants.length}</span> due today
                  </div>
                )}
              </div>
            </div>
          </div>
        </CascadingContainer>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Household Plants */}
            <CascadingContainer delay={100}>
              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-sprout-water via-sprout-success to-sprout-medium" />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-sprout-success/10">
                        <Leaf className="w-5 h-5 text-sprout-success" />
                      </div>
                      <div>
                        <CardTitle>Household Plants</CardTitle>
                        <CardDescription>
                          {householdPlants.length} plant{householdPlants.length !== 1 ? 's' : ''} shared in this household
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      onClick={() => setIsAddPlantDialogOpen(true)}
                      size="sm"
                      className="bg-sprout-success hover:bg-sprout-success/90 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add Plant
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {plantsLoading ? (
                    <div className="space-y-4">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center space-x-4">
                          <Skeleton className="h-16 w-16 rounded-lg" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : householdPlants.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto rounded-full bg-sprout-pale dark:bg-sprout-dark/50 flex items-center justify-center mb-4">
                        <Sprout className="w-8 h-8 text-sprout-medium dark:text-sprout-light" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No plants yet
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-sm mx-auto">
                        Add plants to this household so everyone can help with watering and care.
                      </p>
                      <Button
                        onClick={() => setIsAddPlantDialogOpen(true)}
                        className="bg-sprout-success hover:bg-sprout-success/90 text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add First Plant
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {householdPlants.map((plant) => {
                        const wateringCalc = calculateWateringSchedule(plant);
                        const formatDate = (dateString: string) => {
                          return new Date(dateString).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          );
                        };

                        return (
                          <div
                            key={plant.id}
                            className="group relative border rounded-xl p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 bg-white dark:bg-sprout-dark/30"
                          >
                            {/* Status indicator strip */}
                            <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl ${
                              wateringCalc.isOverdue
                                ? 'bg-gradient-to-r from-sprout-error to-sprout-warning'
                                : wateringCalc.daysUntilWatering === 0
                                ? 'bg-gradient-to-r from-sprout-water to-sprout-water/60'
                                : 'bg-gradient-to-r from-sprout-success to-sprout-light'
                            }`} />

                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4
                                  className="font-semibold text-lg text-gray-900 dark:text-white cursor-pointer hover:text-sprout-water transition-colors"
                                  onClick={() =>
                                    navigate(`/my-plants/${plant.id}`)
                                  }
                                  role="button"
                                  tabIndex={0}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                      e.preventDefault();
                                      navigate(`/my-plants/${plant.id}`);
                                    }
                                  }}
                                  aria-label={`View details for ${plant.nickname}`}
                                >
                                  {plant.nickname}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                  {plant.plant_type}
                                </p>
                                <div className="flex items-center gap-2 mt-2 flex-wrap">
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-sprout-pale dark:bg-sprout-dark/30 text-sprout-dark dark:text-sprout-pale"
                                  >
                                    {plant.is_owned_by_user
                                      ? "Owner: You"
                                      : `Owner: ${
                                          plant.plant_owner?.email?.split(
                                            "@"
                                          )[0] || "Unknown"
                                        }`}
                                  </Badge>
                                  {plant.room && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs bg-sprout-pale dark:bg-sprout-dark/30 text-sprout-dark dark:text-sprout-pale"
                                    >
                                      <span className="mr-1">
                                        {getRoomIcon(plant.room)}
                                      </span>
                                      {getRoomLabel(plant.room)}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                              {/* Status badge */}
                              <Badge
                                className={`text-xs shrink-0 ${
                                  wateringCalc.isOverdue
                                    ? 'bg-sprout-error/10 text-sprout-error border-sprout-error/20'
                                    : wateringCalc.daysUntilWatering === 0
                                    ? 'bg-sprout-water/10 text-sprout-water border-sprout-water/20'
                                    : 'bg-sprout-success/10 text-sprout-success border-sprout-success/20'
                                }`}
                              >
                                {wateringCalc.hasUnknownWateringDate
                                  ? "Unknown"
                                  : wateringCalc.isOverdue
                                  ? "Overdue"
                                  : wateringCalc.daysUntilWatering === 0
                                  ? "Due today"
                                  : `${wateringCalc.daysUntilWatering}d`}
                              </Badge>
                            </div>

                            <div className="space-y-1.5 text-sm mb-4 text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-2">
                                <Droplets className="w-3.5 h-3.5 text-sprout-water" />
                                <span>
                                  Last watered:{" "}
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {plant.latest_watering
                                      ? formatDate(plant.latest_watering)
                                      : "Never"}
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CalendarDays className="w-3.5 h-3.5 text-sprout-medium" />
                                <span>
                                  Next:{" "}
                                  <span className="font-medium text-gray-900 dark:text-white">
                                    {wateringCalc.hasUnknownWateringDate
                                      ? "Unknown"
                                      : wateringCalc.daysUntilWatering === 0
                                      ? "Today"
                                      : `In ${wateringCalc.daysUntilWatering} days`}
                                  </span>
                                </span>
                              </div>
                            </div>

                            <div>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="sm"
                                    className="w-full bg-sprout-water hover:bg-sprout-water/90 text-white"
                                    aria-label="Plant actions menu"
                                  >
                                    Actions
                                    <ChevronDown className="w-4 h-4 ml-2" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                  <DropdownMenuItem
                                    onClick={() => handleWaterPlant(plant.id)}
                                    className="cursor-pointer"
                                  >
                                    <Droplets className="w-4 h-4 mr-2 text-sprout-water" />
                                    Water Now
                                  </DropdownMenuItem>

                                  {wateringCalc.isOverdue && (
                                    <DropdownMenuItem
                                      onClick={() =>
                                        handlePostponePlant(plant.id)
                                      }
                                      className="cursor-pointer"
                                    >
                                      <Clock className="w-4 h-4 mr-2" />
                                      Push to Tomorrow
                                    </DropdownMenuItem>
                                  )}

                                  {wateringCalc.isOverdue ? (
                                    <DropdownMenuSeparator />
                                  ) : null}

                                  <DropdownMenuItem
                                    onClick={() => handleWateringHistory(plant)}
                                    className="cursor-pointer"
                                  >
                                    <History className="w-4 h-4 mr-2" />
                                    View Watering History
                                  </DropdownMenuItem>

                                  <DropdownMenuItem
                                    onClick={() => handleEditPlant(plant)}
                                    className="cursor-pointer"
                                    disabled={!plant.is_owned_by_user}
                                  >
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Plant
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </CascadingContainer>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Members Card */}
            <CascadingContainer delay={200}>
              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-sprout-primary via-sprout-medium to-sprout-light" />
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-sprout-primary/10">
                        <Users className="w-5 h-5 text-sprout-primary dark:text-sprout-light" />
                      </div>
                      <CardTitle>Members</CardTitle>
                    </div>
                    {canManage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInviteDialogOpen(true)}
                        className="hover:bg-sprout-water/10 hover:border-sprout-water hover:text-sprout-water transition-colors"
                      >
                        <UserPlus className="w-4 h-4 mr-1" />
                        Invite
                      </Button>
                    )}
                  </div>
                  <CardDescription>
                    {household.member_count} member{household.member_count !== 1 ? 's' : ''} in this household
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <HouseholdMembersCard
                    household={household}
                    currentUserId={user.id}
                    canManage={canManage}
                    onRemoveMember={removeMember}
                    onLeaveHousehold={leaveHousehold}
                  />
                </CardContent>
              </Card>
            </CascadingContainer>

            {/* Household Settings */}
            <CascadingContainer delay={300}>
              <Card className="border-0 shadow-md overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600" />
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gray-100 dark:bg-gray-700">
                      <Settings className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </div>
                    <CardTitle>Settings</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <CalendarDays className="w-4 h-4" />
                        Created
                      </span>
                      <span className="font-medium">
                        {new Date(household.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Members
                      </span>
                      <span className="font-medium">{household.member_count}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                        <Crown className="w-4 h-4" />
                        Your Role
                      </span>
                      <span className="font-medium capitalize">{currentUserMember?.role}</span>
                    </div>
                  </div>

                  {isOwner && (
                    <div className="pt-4 border-t">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteDialogOpen(true)}
                        className="w-full bg-sprout-error hover:bg-sprout-error/90 text-white"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Household
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
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
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Household</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{household.name}"? This action
                cannot be undone. All household data, including shared plants
                and member information, will be permanently removed.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteHousehold}
                className="bg-sprout-error hover:bg-sprout-error/90 text-white"
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

export default HouseholdManagement;
