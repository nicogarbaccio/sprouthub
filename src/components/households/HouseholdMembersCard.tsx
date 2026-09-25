import React, { useState } from "react";
import { cn } from "@/lib/utils";
import {
  confirmDialogClasses,
  confirmTitleClasses,
  confirmCancelClasses,
  confirmDestructiveClasses,
} from "@/components/settings/SettingsUI";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import {
  MoreVertical,
  UserMinus,
  LogOut,
  User,
  Crown,
  Shield,
} from "lucide-react";
import type { HouseholdWithMembers } from "@/hooks/useHouseholds";

interface HouseholdMembersCardProps {
  household: HouseholdWithMembers;
  currentUserId: string;
  canManage: boolean;
  onRemoveMember: (householdId: string, memberId: string) => Promise<boolean>;
  onLeaveHousehold: (householdId: string) => Promise<boolean>;
}

export const HouseholdMembersCard: React.FC<HouseholdMembersCardProps> = ({
  household,
  currentUserId,
  canManage,
  onRemoveMember,
  onLeaveHousehold,
}) => {
  const [confirmRemoveDialog, setConfirmRemoveDialog] = useState<{
    open: boolean;
    memberId: string;
    memberName: string;
  }>({ open: false, memberId: "", memberName: "" });

  const [confirmLeaveDialog, setConfirmLeaveDialog] = useState(false);

  const handleRemoveMember = async () => {
    const success = await onRemoveMember(
      household.id,
      confirmRemoveDialog.memberId
    );
    if (success) {
      setConfirmRemoveDialog({ open: false, memberId: "", memberName: "" });
    }
  };

  const handleLeaveHousehold = async () => {
    const success = await onLeaveHousehold(household.id);
    if (success) {
      setConfirmLeaveDialog(false);
    }
  };

  const currentUserMember = household.household_members.find(
    (member) => member.user_id === currentUserId
  );


  const roleStyle = (role: string) =>
    role === "owner"
      ? { icon: Crown, classes: "bg-sprout-cream text-sprout-dark" }
      : role === "admin"
        ? { icon: Shield, classes: "bg-sprout-water text-sprout-dark" }
        : { icon: User, classes: "bg-card text-foreground" };

  return (
    <>
      <div className="space-y-2">
        <ul className="space-y-2 max-h-72 overflow-y-auto">
          {household.household_members.map((member) => {
            const { icon: RoleIcon, classes } = roleStyle(member.role);
            const name =
              member.user_id === currentUserId ? "You" : `Member ${member.user_id.slice(0, 6)}`;
            return (
              <li
                key={member.id}
                className="flex items-center gap-3 rounded-[18px] bg-field px-3.5 py-2.5"
              >
                <div className={cn("w-9 h-9 shrink-0 rounded-full flex items-center justify-center", classes)}>
                  <RoleIcon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[15px] font-bold text-foreground truncate">{name}</div>
                  <div className="text-[13px] text-muted-foreground capitalize">{member.role}</div>
                </div>

                {canManage &&
                  member.user_id !== currentUserId &&
                  member.role !== "owner" && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="w-9 h-9 rounded-xl bg-card text-foreground flex items-center justify-center"
                          aria-label={`Options for ${name}`}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl">
                        <DropdownMenuItem
                          onClick={() =>
                            setConfirmRemoveDialog({ open: true, memberId: member.id, memberName: name })
                          }
                          className="text-sprout-warning focus:text-sprout-warning"
                        >
                          <UserMinus className="w-4 h-4 mr-2" />
                          Remove Member
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
              </li>
            );
          })}
        </ul>

        {/* Leave Household Button */}
        {currentUserMember?.role !== "owner" && (
          <button
            type="button"
            onClick={() => setConfirmLeaveDialog(true)}
            className="w-full h-12 rounded-[18px] bg-sprout-warning/15 text-foreground font-bold text-[15px] inline-flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Leave Household
          </button>
        )}
      </div>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog
        open={confirmRemoveDialog.open}
        onOpenChange={(open) =>
          !open &&
          setConfirmRemoveDialog({ open: false, memberId: "", memberName: "" })
        }
      >
        <AlertDialogContent className={confirmDialogClasses}>
          <AlertDialogHeader>
            <AlertDialogTitle className={confirmTitleClasses}>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {confirmRemoveDialog.memberName}{" "}
              from this household? They will lose access to all household plants
              and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={confirmCancelClasses}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className={confirmDestructiveClasses}
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Household Confirmation Dialog */}
      <AlertDialog
        open={confirmLeaveDialog}
        onOpenChange={setConfirmLeaveDialog}
      >
        <AlertDialogContent className={confirmDialogClasses}>
          <AlertDialogHeader>
            <AlertDialogTitle className={confirmTitleClasses}>Leave Household</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave "{household.name}"? You will lose
              access to all household plants and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={confirmCancelClasses}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveHousehold}
              className={confirmDestructiveClasses}
            >
              Leave Household
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
