import React, { useState } from "react";
import {
  SettingsCard,
  confirmCancelClasses,
  confirmDestructiveClasses,
  confirmDialogClasses,
  confirmTitleClasses,
} from "@/components/settings/SettingsUI";
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
import { Trash2, AlertTriangle } from "lucide-react";

interface DangerZoneProps {
 handleDeleteAccount: () => Promise<void>;
 isLoading: boolean;
}

const DangerZone: React.FC<DangerZoneProps> = ({
 handleDeleteAccount,
 isLoading,
}) => {
 const [showConfirmDialog, setShowConfirmDialog] = useState(false);

 const handleConfirmDelete = async () => {
  setShowConfirmDialog(false);
  await handleDeleteAccount();
 };

 return (
 <>
  <SettingsCard
   title="Danger Zone"
   description="Permanently delete your account and everything in it"
   icon={Trash2}
   iconClasses="bg-sprout-warning text-sprout-dark"
  >
   <button
    type="button"
    onClick={() => setShowConfirmDialog(true)}
    disabled={isLoading}
    className="w-full h-14 rounded-[18px] bg-sprout-warning text-sprout-dark font-bold text-[15px] disabled:opacity-50 inline-flex items-center justify-center gap-2"
   >
    {isLoading ? "Deleting..." : "Delete Account"}
   </button>
  </SettingsCard>

  <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
   <AlertDialogContent className={confirmDialogClasses}>
    <AlertDialogHeader>
     <div className="flex items-center gap-3 mb-2">
      <div className="w-12 h-12 bg-sprout-warning text-sprout-dark rounded-2xl flex items-center justify-center">
       <AlertTriangle className="w-6 h-6" />
      </div>
      <AlertDialogTitle className={confirmTitleClasses}>Delete Account?</AlertDialogTitle>
     </div>
     <AlertDialogDescription className="space-y-3 text-base">
      <p className="font-semibold text-foreground">
       This action cannot be undone. This will permanently delete your account and remove all of your data from our servers.
      </p>
      <p>You will lose:</p>
      <ul className="space-y-2 ml-4">
       <li className="flex items-start gap-2">
        <span className="text-destructive mt-1">•</span>
        <span>All your plants and their care history</span>
       </li>
       <li className="flex items-start gap-2">
        <span className="text-destructive mt-1">•</span>
        <span>Your watering schedules and reminders</span>
       </li>
       <li className="flex items-start gap-2">
        <span className="text-destructive mt-1">•</span>
        <span>All photos and plant collections</span>
       </li>
       <li className="flex items-start gap-2">
        <span className="text-destructive mt-1">•</span>
        <span>Your preferences and settings</span>
       </li>
       <li className="flex items-start gap-2">
        <span className="text-destructive mt-1">•</span>
        <span>Access to your account permanently</span>
       </li>
      </ul>
     </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
     <AlertDialogCancel className={confirmCancelClasses}>Cancel</AlertDialogCancel>
     <AlertDialogAction
      onClick={handleConfirmDelete}
      className={confirmDestructiveClasses}
     >
      Yes, Delete My Account
     </AlertDialogAction>
    </AlertDialogFooter>
   </AlertDialogContent>
  </AlertDialog>
 </>
 );
};

export default DangerZone;
