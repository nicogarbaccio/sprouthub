import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
 Popover,
 PopoverContent,
 PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface WateringRecordFormProps {
 onAddWatering: (date: Date, notes: string) => Promise<void>;
}

const WateringRecordForm = ({ onAddWatering }: WateringRecordFormProps) => {
 const [newWateringDate, setNewWateringDate] = useState<Date>();
 const [newWateringNotes, setNewWateringNotes] = useState("");

 const handleAddWatering = async () => {
 if (!newWateringDate) return;

 await onAddWatering(newWateringDate, newWateringNotes);
 setNewWateringDate(undefined);
 setNewWateringNotes("");
 };

 return (
 <div className="p-4 border rounded-lg space-y-3">
  <h4 className="font-medium">Add Watering Record</h4>

  <div className="space-y-2">
  <Label>Date Watered</Label>
  <Popover>
   <PopoverTrigger asChild>
   <Button
    variant="outline"
    className={cn(
    "w-full justify-start text-left font-normal",
    !newWateringDate && "text-muted-foreground"
    )}
   >
    <CalendarIcon className="mr-2 h-4 w-4" />
    {newWateringDate ? format(newWateringDate, "PPP") : "Pick a date"}
   </Button>
   </PopoverTrigger>
   <PopoverContent className="w-auto p-0" align="start">
   <Calendar
    mode="single"
    selected={newWateringDate}
    onSelect={setNewWateringDate}
    initialFocus
   />
   </PopoverContent>
  </Popover>
  </div>

  <div className="space-y-2">
  <Label htmlFor="notes">Notes (optional)</Label>
  <Textarea
   id="notes"
   value={newWateringNotes}
   onChange={(e) => setNewWateringNotes(e.target.value)}
   placeholder="Add any notes about this watering..."
   rows={2}
  />
  </div>

  <Button
  onClick={handleAddWatering}
  disabled={!newWateringDate}
  className="w-full bg-plant-water text-white hover:bg-plant-water/90 hover:text-white"
  >
  <Plus className="w-4 h-4 mr-2" />
  Add Watering Record
  </Button>
 </div>
 );
};

export default WateringRecordForm;
