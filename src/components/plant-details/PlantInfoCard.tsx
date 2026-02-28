import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";
import type { UserPlant } from "@/hooks/useUserPlants";

interface PlantInfoCardProps {
  plant: UserPlant;
}

const PlantInfoCard = ({ plant }: PlantInfoCardProps) => {
  return (
    <Card className="flex-1">
      <CardHeader className="pb-2 pt-3 px-3 sm:px-4">
        <CardTitle className="text-xs sm:text-sm font-semibold text-foreground">
          Plant Info
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0 pb-3 px-3 sm:px-4">
        <div className="space-y-1">
          <div className="flex justify-between">
            <span className="text-xs sm:text-sm text-muted-foreground">
              Added:
            </span>
            <span className="text-xs sm:text-sm font-medium">
              {formatDistanceToNow(new Date(plant.created_at), {
                addSuffix: true,
              })}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-xs sm:text-sm text-muted-foreground">
              Updated:
            </span>
            <span className="text-xs sm:text-sm font-medium">
              {formatDistanceToNow(new Date(plant.updated_at), {
                addSuffix: true,
              })}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PlantInfoCard;
