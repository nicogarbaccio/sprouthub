import { useState } from "react";
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
import { Droplets, AlertTriangle, Clock, History, Leaf } from "lucide-react";
import { addDays, format } from "date-fns";
import { buildWateringNotes } from "@/utils/watering/notesPrefixes";

interface WaterConfirmationDialogProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 onConfirm: (notes?: string) => void;
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
 onAlreadyWatered,
 plantName,
 showOverwateringWarning = false,
 daysSinceLastWatered,
 wateringScheduleDays = 7,
}: WaterConfirmationDialogProps) {
 const [notes, setNotes] = useState("");
 const [showAlreadyWatered, setShowAlreadyWatered] = useState(false);
 const [alreadyWateredDate, setAlreadyWateredDate] = useState(
  format(new Date(), "yyyy-MM-dd")
 );
 const [alreadyWateredNotes, setAlreadyWateredNotes] = useState("");
 const [healthObservation, setHealthObservation] = useState<'healthy' | 'stressed' | null>(null);

 // Show health prompt when the plant is being watered more than 1 day past its schedule
 const isLateWatering =
  daysSinceLastWatered !== undefined &&
  daysSinceLastWatered > wateringScheduleDays + 1;

 // Calculate next watering date
 const nextWateringDate = addDays(new Date(), wateringScheduleDays);
 const nextWateringFormatted = format(nextWateringDate, "MMM d, yyyy");

 const handleConfirm = () => {
  const finalNotes = buildWateringNotes(
   isLateWatering ? healthObservation : null,
   notes
  );
  onConfirm(finalNotes ?? undefined);
  setNotes("");
  setHealthObservation(null);
 };

 const handleAlreadyWateredSubmit = () => {
  if (onAlreadyWatered) {
   const finalNotes = buildWateringNotes(
    isLateWatering ? healthObservation : null,
    alreadyWateredNotes
   );
   onAlreadyWatered(alreadyWateredDate, finalNotes ?? undefined);
   setShowAlreadyWatered(false);
   setAlreadyWateredNotes("");
   setHealthObservation(null);
   onOpenChange(false);
  }
 };

 const handleCancel = () => {
  setNotes("");
  setHealthObservation(null);
  setShowAlreadyWatered(false);
  onOpenChange(false);
 };

 if (showAlreadyWatered) {
  return (
   <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent data-testid="already-watered-dialog">
     <AlertDialogHeader>
      <AlertDialogTitle className="flex items-center">
       <History className="w-5 h-5 mr-2 text-sprout-water" />
       Already Watered {plantName}?
      </AlertDialogTitle>
      <AlertDialogDescription asChild>
       <div className="space-y-4">
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
       </div>
      </AlertDialogDescription>
     </AlertDialogHeader>
     <AlertDialogFooter className="flex-col sm:flex-row gap-3">
      <Button variant="outline" onClick={() => setShowAlreadyWatered(false)}>
       Back
      </Button>
      <Button onClick={handleAlreadyWateredSubmit} className="bg-sprout-water hover:bg-sprout-water/90 text-sprout-white">
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
   <AlertDialogContent data-testid="water-confirmation-dialog" className="max-w-lg">
    <AlertDialogHeader>
     <AlertDialogTitle data-testid="water-confirmation-title" className="flex items-center">
      <Droplets className="w-5 h-5 mr-2 text-sprout-water" />
      Water {plantName}?
     </AlertDialogTitle>
     <AlertDialogDescription data-testid="water-confirmation-description" asChild>
      <div className="space-y-3">
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

       {/* Overwatering Warning */}
       {showOverwateringWarning && (
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

       {/* Late watering health observation prompt */}
       {isLateWatering && (
        <div className="space-y-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
         <div className="flex items-center gap-2">
          <Leaf className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
           How did {plantName} look when you watered it?
          </p>
         </div>
         <div className="flex flex-col gap-1.5 pl-1">
          {([
           { value: 'stressed', label: 'Thirsty or stressed' },
           { value: 'healthy', label: 'Looked healthy, soil was still okay' },
           { value: null, label: "I didn't check closely" },
          ] as const).map(({ value, label }) => (
           <label key={String(value)} className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200 cursor-pointer">
            <input
             type="radio"
             name="health-observation"
             checked={healthObservation === value}
             onChange={() => setHealthObservation(value)}
             className="accent-amber-600"
            />
            {label}
           </label>
          ))}
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
         placeholder={isLateWatering ? "Any other observations?" : "e.g., Leaves looking dry, soil was very dry..."}
         value={notes}
         onChange={(e) => setNotes(e.target.value)}
         rows={2}
         className="resize-none text-sm"
        />
       </div>
      </div>
     </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter className="flex-col sm:flex-row gap-2">
     <AlertDialogCancel data-testid="water-cancel-button" onClick={handleCancel} className="flex-1 bg-red-600 hover:bg-red-700 text-white border-red-600 hover:border-red-700">
      Cancel
     </AlertDialogCancel>
     {onAlreadyWatered && (
      <Button
       variant="outline"
       onClick={() => setShowAlreadyWatered(true)}
       className="flex-1 bg-green-700 hover:bg-green-800 text-white border-green-700 hover:border-green-800"
      >
       <History className="w-4 h-4 mr-2" />
       Already Watered
      </Button>
     )}
     <AlertDialogAction
      data-testid="water-confirm-button"
      onClick={handleConfirm}
      className="flex-1 bg-sprout-water hover:bg-sprout-water/80 transition-colors text-sprout-white"
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
