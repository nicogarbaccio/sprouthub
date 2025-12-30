import React, { useState } from "react";
import {
 Card,
 CardContent,
 CardDescription,
 CardHeader,
 CardTitle,
} from "@/components/ui/card";
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
import { Button } from "@/components/ui/button";
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
  <Card>
   <CardHeader>
   <div className="flex items-center space-x-2">
    <Trash2 className="w-5 h-5 text-sprout-error dark:text-sprout-error" />
    <CardTitle className="text-sprout-error dark:text-sprout-error">
    Danger Zone
    </CardTitle>
   </div>
   <CardDescription>
    Irreversible actions that affect your account
   </CardDescription>
   </CardHeader>
   <CardContent>
   <Button
    onClick={() => setShowConfirmDialog(true)}
    disabled={isLoading}
    variant="destructive"
    className="w-full bg-sprout-error hover:bg-sprout-error/90 dark:bg-sprout-error/80 dark:hover:bg-sprout-error/70"
   >
    {isLoading ? "Deleting..." : "Delete Account"}
   </Button>
   <p className="text-sm text-muted-foreground mt-2">
    This will permanently delete your account and all associated data.
   </p>
   </CardContent>
  </Card>

  <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
   <AlertDialogContent>
    <AlertDialogHeader>
     <div className="flex items-center gap-3 mb-2">
      <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
       <AlertTriangle className="w-6 h-6 text-destructive" />
      </div>
      <AlertDialogTitle className="text-xl">Delete Account?</AlertDialogTitle>
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
     <AlertDialogCancel>Cancel</AlertDialogCancel>
     <AlertDialogAction
      onClick={handleConfirmDelete}
      className="bg-destructive hover:bg-destructive/90"
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
