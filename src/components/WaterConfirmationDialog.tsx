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
import { Droplets, AlertTriangle } from "lucide-react";

interface WaterConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  plantName: string;
  showOverwateringWarning?: boolean;
  daysSinceLastWatered?: number;
}

export function WaterConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  plantName,
  showOverwateringWarning = false,
  daysSinceLastWatered,
}: WaterConfirmationDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center">
            <Droplets className="w-5 h-5 mr-2 text-sprout-water" />
            Water {plantName}?
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Are you sure you want to water <strong>{plantName}</strong> now?
            </p>

            {showOverwateringWarning && (
              <div className="flex items-start space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800 dark:text-amber-200">
                  <p className="font-medium mb-1">
                    Remember not to water too much!
                  </p>
                  <p>
                    {daysSinceLastWatered !== undefined &&
                    daysSinceLastWatered <= 2
                      ? `This plant was last watered ${
                          daysSinceLastWatered === 0
                            ? "today"
                            : daysSinceLastWatered === 1
                            ? "yesterday"
                            : `${daysSinceLastWatered} days ago`
                        }. `
                      : ""}
                    Overwatering can harm your plant more than underwatering.
                  </p>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-sprout-water hover:bg-sprout-water/90 text-sprout-white"
          >
            <Droplets className="w-4 h-4 mr-2" />
            Water Now
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default WaterConfirmationDialog;
