import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useHouseholds } from "@/hooks/useHouseholds";
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  Settings,
  Users,
  UserPlus,
  Trash2,
  Home,
} from "lucide-react";
import { InviteMemberDialog } from "@/components/households/InviteMemberDialog";
import { HouseholdMembersCard } from "@/components/households/HouseholdMembersCard";
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

  // Find the current household
  const household = households.find((h) => h.id === householdId);

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
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-8 w-64" />
            </div>
            <Skeleton className="h-64 w-full" />
          </div>
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
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link to="/households">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </Link>
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
                {currentUserMember?.role}
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Household Members */}
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

            {/* Household Plants */}
            <Card>
              <CardHeader>
                <CardTitle>Household Plants</CardTitle>
                <CardDescription>
                  Plants shared within this household
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Home className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600 dark:text-gray-300">
                    No household plants yet. Plants will appear here when
                    members add them to this household.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Household Settings */}
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
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Household
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialogs */}
        <InviteMemberDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          householdId={household.id}
          onSubmit={inviteToHousehold}
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
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
