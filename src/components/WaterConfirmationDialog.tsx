import { useState } from "react";
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogHeader,
 AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Droplets, AlertTriangle, History, X, ChevronLeft } from "lucide-react";
import { addDays, format, parse } from "date-fns";
import { buildWateringNotes } from "@/utils/watering/notesPrefixes";
import { getDaysSinceWateringLabel } from "@/utils/watering/status";
import PlantImage from "@/components/ui/plant-image";
import { cn } from "@/lib/utils";
import { SheetGrabber, sheetClasses } from "@/components/ui/bento-sheet";

interface WaterConfirmationDialogProps {
 open: boolean;
 onOpenChange: (open: boolean) => void;
 onConfirm: (notes?: string) => void;
 /**
  * Called when the user records a watering that already happened.
  * `date` is the calendar day they picked, resolved to local noon.
  */
 onAlreadyWatered?: (date: Date, notes?: string) => void;
 plantName: string;
 /** Optional thumbnail shown beside the title */
 plantImage?: string;
 showOverwateringWarning?: boolean;
 daysSinceLastWatered?: number;
 wateringScheduleDays?: number;
 lastWateredDate?: string;
}

const HEALTH_OPTIONS = [
 { value: 'stressed', label: 'Thirsty or stressed' },
 { value: 'healthy', label: 'Looked healthy, soil was still okay' },
 { value: null, label: "I didn't check closely" },
] as const;

export function WaterConfirmationDialog({
 open,
 onOpenChange,
 onConfirm,
 onAlreadyWatered,
 plantName,
 plantImage,
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
 const [healthObservation, setHealthObservation] = useState<'healthy' | 'stressed' | null>(null);

 // Show health prompt when the plant is being watered more than 1 day past its schedule
 const isLateWatering =
  daysSinceLastWatered !== undefined &&
  daysSinceLastWatered > wateringScheduleDays + 1;

 // Calculate next watering date
 const nextWateringDate = addDays(new Date(), wateringScheduleDays);
 const nextWateringFormatted = format(nextWateringDate, "MMM d");

 const lastWateredLabel = getDaysSinceWateringLabel(lastWateredDate);

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
   // Parse the yyyy-MM-dd input as a LOCAL date. `new Date("2026-07-20")` would be
   // parsed as UTC midnight, which lands on the previous day for anyone west of UTC.
   // Noon keeps the date stable regardless of timezone or DST.
   const wateredOn = parse(alreadyWateredDate, "yyyy-MM-dd", new Date());
   wateredOn.setHours(12, 0, 0, 0);

   onAlreadyWatered(wateredOn, finalNotes ?? undefined);
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

 const thumbnail = (
  <div className="w-[52px] h-[52px] shrink-0 rounded-[18px] overflow-hidden bg-sprout-water text-sprout-dark flex items-center justify-center">
   {plantImage ? (
    <PlantImage src={plantImage} alt="" className="w-full h-full" />
   ) : (
    <Droplets className="w-6 h-6" />
   )}
  </div>
 );

 if (showAlreadyWatered) {
  return (
   <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent data-testid="already-watered-dialog" className={sheetClasses}>
     <SheetGrabber />
     <AlertDialogHeader className="flex-row items-center gap-3 space-y-0 mt-[18px] sm:mt-0 px-1.5 text-left">
      <button
       type="button"
       onClick={() => setShowAlreadyWatered(false)}
       className="w-11 h-11 shrink-0 rounded-2xl bg-card text-foreground flex items-center justify-center"
       aria-label="Back"
      >
       <ChevronLeft className="w-5 h-5" />
      </button>
      <AlertDialogTitle className="font-display text-2xl font-bold tracking-[-0.03em] text-foreground">
       Already watered {plantName}?
      </AlertDialogTitle>
     </AlertDialogHeader>
     <AlertDialogDescription asChild>
      <div className="mt-4 space-y-2 text-foreground">
       <p className="text-sm text-muted-foreground px-1.5">Record when you last watered this plant.</p>
       <div className="rounded-3xl bg-card p-4 space-y-2">
        <Label htmlFor="already-watered-date" className="text-xs font-bold tracking-[0.8px] uppercase text-muted-foreground">
         Date watered
        </Label>
        <Input
         id="already-watered-date"
         type="date"
         value={alreadyWateredDate}
         onChange={(e) => setAlreadyWateredDate(e.target.value)}
         max={format(new Date(), "yyyy-MM-dd")}
         className="w-full h-12 rounded-2xl border-0 bg-field text-[15px] font-semibold"
        />
       </div>
       <Textarea
        id="already-watered-notes"
        aria-label="Notes (optional)"
        placeholder="Any observations about the watering?"
        value={alreadyWateredNotes}
        onChange={(e) => setAlreadyWateredNotes(e.target.value)}
        rows={2}
        className="resize-none rounded-[20px] border-0 bg-card px-4 py-3.5 text-[15px]"
       />
      </div>
     </AlertDialogDescription>
     <button
      type="button"
      onClick={handleAlreadyWateredSubmit}
      className="mt-3 w-full h-[60px] rounded-[22px] bg-sprout-dark text-sprout-cream flex items-center justify-center gap-2 font-bold text-base shadow-[inset_0_0_0_2px_#dfc490]"
     >
      <History className="w-5 h-5" />
      Record watering
     </button>
    </AlertDialogContent>
   </AlertDialog>
  );
 }

 return (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
   <AlertDialogContent data-testid="water-confirmation-dialog" className={sheetClasses}>
    <SheetGrabber />
    <AlertDialogHeader className="flex-row items-center gap-3 space-y-0 mt-[18px] sm:mt-0 px-1.5 text-left">
     {thumbnail}
     <div className="flex-1 min-w-0">
      <AlertDialogTitle
       data-testid="water-confirmation-title"
       className="font-display text-2xl font-bold tracking-[-0.03em] text-foreground"
      >
       Water {plantName}?
      </AlertDialogTitle>
      <p className="text-sm font-medium text-muted-foreground">
       {lastWateredLabel
        ? lastWateredLabel === "Today" || lastWateredLabel === "Yesterday"
         ? `Last watered ${lastWateredLabel.toLowerCase()}`
         : `Last watered ${lastWateredLabel}`
        : "No watering logged yet"}
      </p>
     </div>
     <AlertDialogCancel
      data-testid="water-cancel-button"
      onClick={handleCancel}
      className="mt-0 w-11 h-11 p-0 shrink-0 self-start rounded-2xl border-0 bg-card text-foreground hover:bg-card"
      aria-label="Cancel"
     >
      <X className="w-5 h-5" />
     </AlertDialogCancel>
    </AlertDialogHeader>

    <AlertDialogDescription data-testid="water-confirmation-description" asChild>
     <div className="text-foreground">
      <div className="grid grid-cols-2 gap-2 mt-4">
       <div className="rounded-[22px] bg-sprout-water text-sprout-dark p-3.5">
        <div className="text-xs font-bold uppercase tracking-[0.8px]">Next watering</div>
        <div className="font-display text-lg font-bold mt-1">{nextWateringFormatted}</div>
       </div>
       <div className="rounded-[22px] bg-sprout-warning text-sprout-dark p-3.5">
        <div className="text-xs font-bold uppercase tracking-[0.8px]">Schedule</div>
        <div className="font-display text-lg font-bold mt-1">Every {wateringScheduleDays}d</div>
       </div>
      </div>

      {/* Overwatering Warning */}
      {showOverwateringWarning && (
       <div data-testid="overwatering-warning" className="flex items-start gap-2.5 mt-2 rounded-3xl bg-sprout-cream text-sprout-dark p-4">
        <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0" />
        <div className="text-sm">
         <p className="font-bold mb-0.5">Remember not to water too much!</p>
         <p className="font-medium">
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
       <div className="rounded-3xl bg-card p-4 mt-2" role="radiogroup" aria-label={`How did ${plantName} look when you watered it?`}>
        <p className="text-[15px] font-bold">How did {plantName} look when you watered it?</p>
        <div className="flex flex-col gap-1.5 mt-2.5">
         {HEALTH_OPTIONS.map(({ value, label }) => {
          const selected = healthObservation === value;
          return (
           <button
            key={String(value)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => setHealthObservation(value)}
            className={cn(
             "min-h-12 px-3.5 rounded-2xl flex items-center gap-2.5 text-[15px] font-semibold text-left",
             selected ? "bg-sprout-cream text-sprout-dark" : "bg-field text-foreground"
            )}
           >
            <span className="w-5 h-5 shrink-0 rounded-full border-2 border-current flex items-center justify-center">
             <span className={cn("w-2.5 h-2.5 rounded-full bg-current", !selected && "opacity-0")} />
            </span>
            {label}
           </button>
          );
         })}
        </div>
       </div>
      )}

      {/* Optional Notes */}
      <Textarea
       id="watering-notes"
       aria-label="Notes (optional)"
       placeholder={isLateWatering ? "Any other observations?" : "Notes, e.g. soil was very dry"}
       value={notes}
       onChange={(e) => setNotes(e.target.value)}
       rows={2}
       className="mt-2 resize-none rounded-[20px] border-0 bg-card px-4 py-3.5 text-[15px] placeholder:text-neutral-medium"
      />
     </div>
    </AlertDialogDescription>

    <div className="flex gap-2 mt-3">
     {onAlreadyWatered && (
      <button
       type="button"
       onClick={() => setShowAlreadyWatered(true)}
       className="flex-1 h-[60px] rounded-[22px] bg-card text-foreground font-bold text-[15px]"
      >
       Already watered
      </button>
     )}
     <AlertDialogAction
      data-testid="water-confirm-button"
      onClick={handleConfirm}
      className="flex-[1.3] h-[60px] rounded-[22px] bg-sprout-dark text-sprout-cream font-bold text-base gap-2 shadow-[inset_0_0_0_2px_#dfc490] hover:bg-sprout-water hover:text-sprout-dark hover:shadow-none focus-visible:bg-sprout-water focus-visible:text-sprout-dark transition-colors"
     >
      <Droplets className="w-5 h-5" />
      Water now
     </AlertDialogAction>
    </div>
   </AlertDialogContent>
  </AlertDialog>
 );
}

export default WaterConfirmationDialog;
