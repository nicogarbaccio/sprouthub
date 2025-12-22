import React, { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Droplets, AlertTriangle, Calendar, Clock, History } from "lucide-react";
import { addDays, format } from "date-fns";

interface WaterConfirmationDialogProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 onConfirm: (notes?: string) => void;
 onPostpone?: () => void;
 onAlreadyWatered?: (date: string, notes?: string) => void;
 plantName: string;
 showOverwateringWarning?: boolean;
 daysSinceLastWatered?: number;
 wateringScheduleDays?: number;
 lastWateredDate?: string;
}

export function WaterConfirmationDialog({
 open,
 onOpenChange,
 onConfirm,
 onPostpone,
 onAlreadyWatered,
 plantName,
 showOverwateringWarning = false,
 daysSinceLastWatered,
 wateringScheduleDays = 7,
 lastWateredDate,
}: WaterConfirmationDialogProps) {
 const [notes, setNotes] = useState("");
 const [showAlreadyWatered, setShowAlreadyWatered] = useState(false);
 const [alreadyWateredDate, setAlreadyWateredDate] = useState(
  format(new Date(), "yyyy-MM-dd")
 );
 const [alreadyWateredNotes, setAlreadyWateredNotes] = useState("");

 // Calculate next watering date
 const nextWateringDate = addDays(new Date(), wateringScheduleDays);
 const nextWateringFormatted = format(nextWateringDate, "MMM d, yyyy");

 // Auto-suggest postpone if recently watered (within 30% of schedule)
 const shouldSuggestPostpone =
  showOverwateringWarning &&
  daysSinceLastWatered !== undefined &&
  daysSinceLastWatered < wateringScheduleDays * 0.3;

 const handleConfirm = () => {
  onConfirm(notes);
  setNotes(""); // Reset notes after confirming
 };

 const handleAlreadyWateredSubmit = () => {
  if (onAlreadyWatered) {
   onAlreadyWatered(alreadyWateredDate, alreadyWateredNotes);
   setShowAlreadyWatered(false);
   setAlreadyWateredNotes("");
   onOpenChange(false);
  }
 };

 const handleCancel = () => {
  setNotes("");
  setShowAlreadyWatered(false);
  onOpenChange(false);
 };

 if (showAlreadyWatered) {
  return (
   <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent data-testid="already-watered-dialog">
     <AlertDialogHeader>
      <AlertDialogTitle className="flex items-center">
       <History className="w-5 h-5 mr-2 text-blue-500" />
       Already Watered {plantName}?
      </AlertDialogTitle>
      <AlertDialogDescription className="space-y-4">
       <p>Record when you last watered this plant.</p>

       <div className="space-y-2">
        <Label htmlFor="already-watered-date">Date Watered</Label>
        <Input
         id="already-watered-date"
         type="date"
         value={alreadyWateredDate}
         onChange={(e) => setAlreadyWateredDate(e.target.value)}
         max={format(new Date(), "yyyy-MM-dd")}
         className="w-full"
        />
       </div>

       <div className="space-y-2">
        <Label htmlFor="already-watered-notes">Notes (optional)</Label>
        <Textarea
         id="already-watered-notes"
         placeholder="Any observations about the watering?"
         value={alreadyWateredNotes}
         onChange={(e) => setAlreadyWateredNotes(e.target.value)}
         rows={2}
         className="resize-none"
        />
       </div>
      </AlertDialogDescription>
     </AlertDialogHeader>
     <AlertDialogFooter>
      <Button variant="outline" onClick={() => setShowAlreadyWatered(false)}>
       Back
      </Button>
      <Button onClick={handleAlreadyWateredSubmit} className="bg-blue-500 hover:bg-blue-600">
       <History className="w-4 h-4 mr-2" />
       Record Watering
      </Button>
     </AlertDialogFooter>
    </AlertDialogContent>
   </AlertDialog>
  );
 }

 return (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
   <AlertDialogContent data-testid="water-confirmation-dialog" className="max-w-md">
    <AlertDialogHeader>
     <AlertDialogTitle data-testid="water-confirmation-title" className="flex items-center">
      <Droplets className="w-5 h-5 mr-2 text-sprout-water" />
      Water {plantName}?
     </AlertDialogTitle>
     <AlertDialogDescription data-testid="water-confirmation-description" className="space-y-3">
      <p>
       Are you sure you want to water <strong>{plantName}</strong> now?
      </p>

      {/* Next Watering Preview */}
      <div className="flex items-start space-x-2 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
       <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
       <div className="text-sm text-blue-800 dark:text-blue-200">
        <p className="font-medium">Next watering</p>
        <p>{nextWateringFormatted}</p>
       </div>
      </div>

      {/* Auto-suggest Postpone Warning */}
      {shouldSuggestPostpone && onPostpone && (
       <div data-testid="postpone-suggestion" className="flex items-start space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-amber-800 dark:text-amber-200">
         <p className="font-medium mb-1">Consider postponing</p>
         <p className="mb-2">
          This plant was watered {daysSinceLastWatered === 0 ? "today" : daysSinceLastWatered === 1 ? "yesterday" : `${daysSinceLastWatered} days ago`}. It might not need water yet.
         </p>
         <Button
          size="sm"
          variant="outline"
          onClick={() => {
           onPostpone();
           onOpenChange(false);
          }}
          className="border-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900"
         >
          <Calendar className="w-3 h-3 mr-1" />
          Postpone Instead
         </Button>
        </div>
       </div>
      )}

      {/* Standard Overwatering Warning */}
      {showOverwateringWarning && !shouldSuggestPostpone && (
       <div data-testid="overwatering-warning" className="flex items-start space-x-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
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

      {/* Optional Notes */}
      <div className="space-y-2 pt-2">
       <Label htmlFor="watering-notes" className="text-sm font-medium">
        Notes (optional)
       </Label>
       <Textarea
        id="watering-notes"
        placeholder="e.g., Leaves looking dry, soil was very dry..."
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        className="resize-none text-sm"
       />
      </div>
     </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
     <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
      <AlertDialogCancel data-testid="water-cancel-button" onClick={handleCancel}>
       Cancel
      </AlertDialogCancel>
      {onAlreadyWatered && (
       <Button
        variant="outline"
        onClick={() => setShowAlreadyWatered(true)}
        size="sm"
       >
        <History className="w-4 h-4 mr-2" />
        Already Watered
       </Button>
      )}
     </div>
     <AlertDialogAction
      data-testid="water-confirm-button"
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
