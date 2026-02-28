import { Badge } from "@/components/ui/badge";
import { getRoomIcon, getRoomLabel } from "@/utils/rooms";
import type { UserPlant } from "@/hooks/useUserPlants";
import type { CatalogPlant } from "@/data/types";

interface PlantDetailHeaderProps {
  plant: UserPlant;
  catalogPlant?: CatalogPlant;
  statusInfo: { color: string; text: string };
}

const PlantDetailHeader = ({
  plant,
  catalogPlant,
  statusInfo,
}: PlantDetailHeaderProps) => {
  return (
    <div className="text-left mb-4">
      <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
        {plant.nickname}
      </h1>
      <p className="text-base text-muted-foreground mb-2">{plant.plant_type}</p>

      {(plant.alternative_names?.length > 0 ||
        catalogPlant?.otherNames?.length > 0) && (
        <p className="text-xs sm:text-sm text-muted-foreground mb-2">
          <span className="font-semibold">Also known as:</span>{" "}
          {(plant.alternative_names?.length > 0
            ? plant.alternative_names
            : catalogPlant?.otherNames
          )?.join(", ")}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {plant.room && (
          <Badge variant="secondary" className="text-xs">
            <span className="mr-1">{getRoomIcon(plant.room)}</span>
            {getRoomLabel(plant.room)}
          </Badge>
        )}
        {plant.is_outdoor_plant && (
          <Badge variant="secondary" className="text-xs">
            Outdoor Plant
          </Badge>
        )}
        <Badge className={`${statusInfo.color} text-xs`}>
          {statusInfo.text}
        </Badge>
      </div>
    </div>
  );
};

export default PlantDetailHeader;
