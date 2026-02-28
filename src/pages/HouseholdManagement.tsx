import React, { useState, useEffect } from "react";
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

  if (loading) {
    return (
      <div>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <HouseholdDetailsSkeleton />
        </div>
      </div>
    );
  }

  if (!household) {
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

  const currentUserMember = household.household_members.find(
    (member) => member.user_id === user.id
  );

  const canManage =
    currentUserMember && ["owner", "admin"].includes(currentUserMember.role);
  const isOwner = currentUserMember?.role === "owner";

  const handleDeleteHousehold = async () => {
    if (!isOwner) return;

    const success = await deleteHousehold(household.id);
    if (success) {
      toast.success("Household deleted successfully");
      navigate("/households");
    }
  };

  return (
    <div>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <CascadingContainer delay={0}>
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {household.name}
                </h1>
                {household.description && (
                  <p className="mt-2 text-gray-600 dark:text-gray-300">
                    {household.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    currentUserMember?.role === "owner" ? "default" : "secondary"
                  }
                >
                  {currentUserMember?.role?.charAt(0).toUpperCase() +
                    currentUserMember?.role?.slice(1)}
                </Badge>
              </div>
            </div>
          </div>
        </CascadingContainer>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Household Members */}
            <CascadingContainer delay={100}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5" />
                      <CardTitle>Members</CardTitle>
                    </div>
                    {canManage && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInviteDialogOpen(true)}
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invite Member
                      </Button>
                    )}
                  </div>
                  <CardDescription>
                    Manage household members and their roles
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

            {/* Household Plants */}
            <CascadingContainer delay={200}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Household Plants</CardTitle>
                      <CardDescription>
                        Plants shared within this household (
                        {householdPlants.length} plants)
                      </CardDescription>
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
                    <div className="text-center py-8">
                      <Home className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-600 dark:text-gray-300 mb-4">
                        No household plants yet. Add plants to this household to
                        get started with collaborative plant care.
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
                            className="border border-sprout-cream rounded-lg p-4 hover:shadow-md transition-shadow"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h4
                                  className="font-semibold text-lg text-gray-900 dark:text-white cursor-pointer transition-colors duration-200 hover:underline group"
                                  style={
                                    {
                                      "--hover-color": "#0fa3b1",
                                    } as React.CSSProperties
                                  }
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.color = "#0fa3b1";
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.color = "";
                                  }}
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
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {plant.plant_type}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
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
                            </div>

                            <div className="space-y-2 text-sm mb-4">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">
                                  Last watered:
                                </span>
                                <span className="font-medium">
                                  {plant.latest_watering
                                    ? formatDate(plant.latest_watering)
                                    : "Unknown"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">
                                  Next watering:
                                </span>
                                <span className="font-medium">
                                  {wateringCalc.daysUntilWatering === 999
                                    ? "Unknown"
                                    : `In ${wateringCalc.daysUntilWatering} days`}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">
                                  Status:
                                </span>
                                <Badge
                                  variant={
                                    wateringCalc.isOverdue
                                      ? "destructive"
                                      : wateringCalc.daysUntilWatering === 0
                                      ? "default"
                                      : "secondary"
                                  }
                                  className="text-xs"
                                >
                                  {wateringCalc.isOverdue
                                    ? "Overdue"
                                    : wateringCalc.daysUntilWatering === 0
                                    ? "Due today"
                                    : `Water in ${wateringCalc.daysUntilWatering} days`}
                                </Badge>
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
                                    <Droplets className="w-4 h-4 mr-2" />
                                    Water Now
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
            {/* Household Settings */}
            <CascadingContainer delay={300}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    <CardTitle>Settings</CardTitle>
                  </div>
                  <CardDescription>
                    Manage household settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <p>
                      <strong>Created:</strong>{" "}
                      {new Date(household.created_at).toLocaleDateString()}
                    </p>
                    <p>
                      <strong>Members:</strong> {household.member_count}
                    </p>
                    <p>
                      <strong>Your Role:</strong> {currentUserMember?.role}
                    </p>
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
      </div>
    </div>
  );
};

export default HouseholdManagement;
