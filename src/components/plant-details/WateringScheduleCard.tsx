import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { getDaysSince } from "@/utils/watering/schedule";
import type { UserPlant } from "@/hooks/useUserPlants";

interface WateringScheduleCardProps {
  plant: UserPlant;
}

const WateringScheduleCard = ({ plant }: WateringScheduleCardProps) => {
  return (
    <Card className="flex-1">
      <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
        <CardTitle className="text-xs sm:text-sm font-semibold text-foreground">
          Watering Schedule
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-3 px-3 sm:px-4">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-xs sm:text-sm text-muted-foreground">
              Last watered:
            </span>
            <span className="text-xs sm:text-sm font-medium">
              {plant.latest_watering
                ? format(new Date(plant.latest_watering), "MMM d, yyyy")
                : "Never"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs sm:text-sm text-muted-foreground">
              Frequency:
            </span>
            <span className="text-xs sm:text-sm font-medium">
              Every {plant.suggested_watering_days || 7} days
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs sm:text-sm text-muted-foreground">
              Days since:
            </span>
            <span className="text-xs sm:text-sm font-medium">
              {getDaysSince(plant.latest_watering) ?? 0} days
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default WateringScheduleCard;
