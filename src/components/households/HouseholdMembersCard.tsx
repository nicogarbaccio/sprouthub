import React, { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MoreVertical, UserMinus, LogOut } from 'lucide-react';
import type { HouseholdWithMembers } from '@/hooks/useHouseholds';

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
  }>({ open: false, memberId: '', memberName: '' });
  
  const [confirmLeaveDialog, setConfirmLeaveDialog] = useState(false);


  const handleRemoveMember = async () => {
    const success = await onRemoveMember(household.id, confirmRemoveDialog.memberId);
    if (success) {
      setConfirmRemoveDialog({ open: false, memberId: '', memberName: '' });
    }
  };

  const handleLeaveHousehold = async () => {
    const success = await onLeaveHousehold(household.id);
    if (success) {
      setConfirmLeaveDialog(false);
    }
  };

  const currentUserMember = household.household_members.find(
    member => member.user_id === currentUserId
  );

  const otherMembers = household.household_members.filter(
    member => member.user_id !== currentUserId
  );

  const displayMembers = household.household_members.slice(0, 3);
  const remainingCount = Math.max(0, household.household_members.length - 3);

  return (
    <>
      <div className="space-y-3">
        {/* Member Avatars */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {displayMembers.map((member) => (
              <Avatar key={member.id} className="w-8 h-8 border-2 border-white dark:border-gray-800">
                <AvatarFallback className="text-xs">
                  {member.user_id.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
          {remainingCount > 0 && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              +{remainingCount} more
            </span>
          )}
        </div>

        {/* Member List */}
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {household.household_members.map((member) => (
            <div key={member.id} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  User {member.user_id.slice(0, 8)}
                  {member.user_id === currentUserId && ' (You)'}
                </span>
                <Badge variant={member.role === 'owner' ? 'default' : 'secondary'} className="text-xs">
                  {member.role}
                </Badge>
              </div>

              {(canManage && member.user_id !== currentUserId && member.role !== 'owner') && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() =>
                        setConfirmRemoveDialog({
                          open: true,
                          memberId: member.id,
                          memberName: `User ${member.user_id.slice(0, 8)}`,
                        })
                      }
                      className="text-red-600 focus:text-red-600"
                    >
                      <UserMinus className="w-4 h-4 mr-2" />
                      Remove Member
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          ))}
        </div>

        {/* Leave Household Button */}
        {currentUserMember?.role !== 'owner' && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmLeaveDialog(true)}
            className="w-full text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Leave Household
          </Button>
        )}
      </div>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog
        open={confirmRemoveDialog.open}
        onOpenChange={(open) =>
          !open && setConfirmRemoveDialog({ open: false, memberId: '', memberName: '' })
        }
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {confirmRemoveDialog.memberName} from this household?
              They will lose access to all household plants and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-red-600 hover:bg-red-700"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Household Confirmation Dialog */}
      <AlertDialog open={confirmLeaveDialog} onOpenChange={setConfirmLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave Household</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to leave "{household.name}"? You will lose access to all
              household plants and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLeaveHousehold}
              className="bg-red-600 hover:bg-red-700"
            >
              Leave Household
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};