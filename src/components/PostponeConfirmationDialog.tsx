import React from "react";
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
import { Clock, Calendar } from "lucide-react";

interface PostponeConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  plantName: string;
  currentNextWatering: string;
  postponedNextWatering: string;
}

export function PostponeConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  plantName,
  currentNextWatering,
  postponedNextWatering,
}: PostponeConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <Clock className="w-5 h-5 mr-2 text-sprout-water" />
            Postpone watering for {plantName}?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-3">
            <p>
              Are you sure you want to postpone watering{" "}
              <strong>{plantName}</strong>?
            </p>

            <div className="flex items-center space-x-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
              <div className="text-sm">
                <div className="text-blue-800 dark:text-blue-200 font-medium">
                  Current next watering: {currentNextWatering}
                </div>
                <div className="text-blue-700 dark:text-blue-300">
                  New next watering: {postponedNextWatering}
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              This will delay watering by 1 day. You can still water the plant
              manually if needed.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-sprout-water hover:bg-sprout-water/90 text-sprout-white"
          >
            <Clock className="w-4 h-4 mr-2" />
            Push to Tomorrow
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default PostponeConfirmationDialog;
