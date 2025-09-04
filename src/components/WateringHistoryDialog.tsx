import { useState, useEffect } from "react";
import {
 Dialog,
 DialogContent,
 DialogHeader,
 DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, Droplets, FileText, AlertTriangle } from "lucide-react";
import { computeOverwateringRisk } from "@/utils/overwatering";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface WateringRecord {
 id: string;
 watered_at: string;
 notes?: string;
}

interface Plant {
 id: string;
 nickname: string;
 plant_type: string;
 image?: string;
 room?: string;
 suggested_watering_days?: number;
}

interface WateringHistoryDialogProps {
 plant: Plant | null;
 isOpen: boolean;
 onClose: () => void;
}

const WateringHistoryDialog = ({
 plant,
 isOpen,
 onClose,
}: WateringHistoryDialogProps) => {
 const { toast } = useToast();
 const [wateringRecords, setWateringRecords] = useState<WateringRecord[]>([]);
 const [isLoading, setIsLoading] = useState(false);

 useEffect(() => {
  if (plant && isOpen) {
   loadWateringRecords(plant.id);
  }
 }, [plant, isOpen]);

 const loadWateringRecords = async (plantId: string) => {
  setIsLoading(true);
  try {
   const { data, error } = await supabase
    .from("watering_records")
    .select("*")
    .eq("plant_id", plantId)
    .order("watered_at", { ascending: false });

   if (error) throw error;
   setWateringRecords(data || []);
  } catch (error) {
   console.error("Error loading watering records:", error);
   toast({
    title: "Error",
    description: "Failed to load watering records",
    variant: "destructive",
   });
  } finally {
   setIsLoading(false);
  }
 };

 const formatDate = (dateString: string) => {
  try {
   return format(new Date(dateString), "PPP 'at' p");
  } catch {
   return "Invalid date";
  }
 };

 const getWateringStats = () => {
  if (wateringRecords.length === 0) return null;

  const totalWaterings = wateringRecords.length;
  const suggestedDays = plant?.suggested_watering_days || 7;

  // Calculate average watering frequency
  if (totalWaterings > 1) {
   const dates = wateringRecords
    .map((record) => new Date(record.watered_at))
    .sort((a, b) => a.getTime() - b.getTime());
   const intervals = [];

   for (let i = 1; i < dates.length; i++) {
    const daysBetween = Math.ceil(
     (dates[i].getTime() - dates[i - 1].getTime()) / (1000 * 60 * 60 * 24)
    );
    intervals.push(daysBetween);
   }

   const avgInterval = Math.round(
    intervals.reduce((sum, interval) => sum + interval, 0) /
     intervals.length
   );

   return {
    totalWaterings,
    avgInterval,
    suggestedInterval: suggestedDays,
    isOnTrack: Math.abs(avgInterval - suggestedDays) <= 2,
   };
  }

  return {
   totalWaterings,
   avgInterval: null,
   suggestedInterval: suggestedDays,
   isOnTrack: null,
  };
 };

 const stats = getWateringStats();
 const risk = computeOverwateringRisk({
  records: wateringRecords.map((r) => ({ watered_at: r.watered_at, notes: r.notes })),
  suggestedDays: plant?.suggested_watering_days || 7,
 });

 if (!plant) return null;

 return (
  <Dialog open={isOpen} onOpenChange={onClose}>
   <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
    <DialogHeader className="border-b border-sprout-cream/30 dark:border-sprout-cream/20 pb-4 mb-6">
     <DialogTitle className="flex items-center gap-2">
      <Droplets className="w-5 h-5 text-sprout-water" />
      Watering History for {plant.nickname}
     </DialogTitle>
    </DialogHeader>

    <div className="space-y-6">
     {/* Plant Overview */}
     <div className="bg-sprout-pale dark:bg-sprout-dark/20 rounded-lg p-4">
      <div className="flex items-center gap-4">
       {plant.image && (
        <img
         src={plant.image}
         alt={plant.nickname}
         className="w-16 h-16 rounded-lg object-cover"
        />
       )}
       <div>
        <h3 className="font-semibold text-lg">{plant.nickname}</h3>
        <p className="text-muted-foreground">{plant.plant_type}</p>
        <p className="text-sm text-sprout-medium">
         Suggested watering: Every {plant.suggested_watering_days || 7}{" "}
         days
        </p>
       </div>
      </div>
     </div>

     {/* Statistics */}
     {stats && stats.totalWaterings > 0 && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
       <div className="bg-card rounded-lg p-4 border">
        <div className="text-center">
         <div className="text-2xl font-bold text-sprout-cream dark:text-sprout-cream">
          {stats.totalWaterings}
         </div>
         <div className="text-sm text-muted-foreground">
          Total Waterings
         </div>
        </div>
       </div>

       {stats.avgInterval && (
        <div className="bg-card rounded-lg p-4 border">
         <div className="text-center">
          <div className="text-2xl font-bold text-sprout-cream dark:text-sprout-cream">
           {stats.avgInterval}
          </div>
          <div className="text-sm text-muted-foreground">
           Avg Days Between
          </div>
         </div>
        </div>
       )}

       {risk.level !== 'none' && (
        <div className={`rounded-lg p-4 border ${
         risk.level === 'high' ? 'bg-red-600/10 border-red-600/30' : 'bg-orange-500/10 border-orange-500/30'
        }`}>
         <div className="flex items-center justify-center gap-2 text-sm">
          <AlertTriangle className={`w-4 h-4 ${risk.level === 'high' ? 'text-red-600' : 'text-orange-500'}`} />
          <span className="font-medium">
           {risk.level === 'high' ? 'Possible overwatering' : 'Watch watering frequency'}
          </span>
         </div>
         <p className="text-center text-xs text-muted-foreground mt-1">
          {risk.count} in last {risk.windowDays} days{risk.avgIntervalDays ? ` • avg ${risk.avgIntervalDays}d vs ${plant?.suggested_watering_days || 7}d` : ''}
         </p>
        </div>
       )}

       {/* Only show schedule tracking when we have enough data (2+ waterings) */}
       {stats.avgInterval && (
        <div className="bg-card rounded-lg p-4 border">
         <div className="text-center">
          <div
           className={`text-2xl font-bold ${
            stats.isOnTrack
             ? "text-sprout-cream dark:text-sprout-cream"
             : stats.isOnTrack === false
             ? "text-sprout-warning dark:text-sprout-warning"
             : "text-sprout-cream dark:text-sprout-cream"
           }`}
          >
           {stats.isOnTrack === true
            ? "✓"
            : stats.isOnTrack === false
            ? "!"
            : "?"}
          </div>
          <div className="text-sm text-muted-foreground">
           {stats.isOnTrack === true
            ? "On Schedule"
            : stats.isOnTrack === false
            ? "Off Schedule"
            : "Need More Data"}
          </div>
         </div>
        </div>
       )}
      </div>
     )}

     {/* Watering Records */}
     <div>
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
       <Calendar className="w-5 h-5" />
       Watering Records
      </h3>

      {isLoading ? (
       <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sprout-primary mx-auto"></div>
        <p className="text-muted-foreground mt-2">
         Loading watering history...
        </p>
       </div>
      ) : wateringRecords.length === 0 ? (
       <div className="text-center py-8 bg-card rounded-lg border border-dashed">
        <Droplets className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-muted-foreground">
         No watering records found
        </p>
        <p className="text-sm text-muted-foreground mt-2">
         Start tracking by watering your plant!
        </p>
       </div>
      ) : (
       <div className="space-y-3">
        {wateringRecords.map((record) => (
         <div
          key={record.id}
          className="flex items-start gap-4 p-4 bg-card rounded-lg border hover:shadow-sm transition-shadow"
         >
          <div className="flex-shrink-0">
           <div className="w-10 h-10 bg-sprout-water/20 rounded-full flex items-center justify-center">
            <Droplets className="w-5 h-5 text-sprout-water" />
           </div>
          </div>

          <div className="flex-1 min-w-0">
           <div className="flex items-center justify-between mb-1">
            <p className="font-medium text-foreground">Watered</p>
            <span className="text-sm text-muted-foreground">
             {formatDate(record.watered_at)}
            </span>
           </div>

           {record.notes && (
            <div className="flex items-start gap-2 mt-2">
             <FileText className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
             <p className="text-sm text-muted-foreground">
              {record.notes}
             </p>
            </div>
           )}
          </div>
         </div>
        ))}
       </div>
      )}
     </div>

     {/* Action Buttons */}
     <div className="flex justify-end pt-4 border-t">
      <Button variant="outline" onClick={onClose}>
       Close
      </Button>
     </div>
    </div>
   </DialogContent>
  </Dialog>
 );
};

export default WateringHistoryDialog;
