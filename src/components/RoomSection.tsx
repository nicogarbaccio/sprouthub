import { CascadingContainer } from "@/components/ui/cascading-container";
import MyPlantCard from "./MyPlantCard";
import EmptyRoomState from "./EmptyRoomState";
import { UserPlant } from "@/hooks/useUserPlants";
import { getRoomLabel } from "@/utils/rooms";
import type { OverwateringRisk } from "@/utils/plants/overwatering";
import {
  calculateWateringSchedule,
  formatNextWateringDate,
} from "@/utils/watering/schedule";
import { plants as catalogPlants } from "@/data/plantData";
import { PLANT_FALLBACK_IMAGE } from "@/lib/constants";
import { getPlantFertilizationStatus } from "@/utils/plants/fertilizationAdvice";

interface RoomSectionProps {
  roomKey: string;
  plants: UserPlant[];
  onWaterPlant: (plantId: string, notes?: string, wateredAt?: Date) => void;
  onEditPlant: (plant: UserPlant) => void;
  onAddPlant: () => void;
  onPostponeWatering?: (plantId: string) => void;
  onViewHistory?: (plant: UserPlant) => void;
  onScheduleAdjustment?: (
    plantId: string,
    newSchedule: number
  ) => Promise<void>;
  onFertilizePlant?: (plantId: string) => void;
  formatDate: (dateString: string) => string;
  delay: number;
  overwateringByPlantId?: Record<string, OverwateringRisk>;
}

const RoomSection = ({
  roomKey,
  plants,
  onWaterPlant,
  onEditPlant,
  onAddPlant,
  onPostponeWatering,
  onViewHistory,
  onScheduleAdjustment,
  onFertilizePlant,
  formatDate,
  delay,
  overwateringByPlantId,
}: RoomSectionProps) => {
  const roomLabel = getRoomLabel(roomKey);

  // Calculate room statistics using the new watering schedule utility
  const roomStats = plants.reduce(
    (stats, plant) => {
      const wateringCalc = calculateWateringSchedule(plant);

      if (wateringCalc.hasUnknownWateringDate) {
        stats.unknownCount++;
      } else if (wateringCalc.isPostponed) {
        // Postponed plants are not due today - they've been intentionally delayed
        stats.healthyCount++;
      } else if (wateringCalc.isOverdue) {
        stats.overdueCount++;
      } else if (wateringCalc.daysUntilWatering === 0) {
        stats.dueTodayCount++;
      } else if (wateringCalc.daysUntilWatering > 0) {
        stats.healthyCount++;
      }

      return stats;
    },
    { overdueCount: 0, dueTodayCount: 0, healthyCount: 0, unknownCount: 0 }
  );

  const { overdueCount, dueTodayCount } = roomStats;

  // If no plants in this room, show empty state
  if (plants.length === 0) {
    return (
      <CascadingContainer delay={delay}>
        <div className="mb-12">
          <EmptyRoomState roomKey={roomKey} onAddPlant={onAddPlant} />
        </div>
      </CascadingContainer>
    );
  }

  return (
    <CascadingContainer delay={delay}>
      <div className="mt-6" data-testid="room-section" data-room={roomKey}>
        <div
          className="flex items-center gap-2.5 px-1.5 lg:px-0"
          data-testid="room-header"
        >
          <h3
            className="font-display text-lg lg:text-xl font-bold tracking-[-0.02em] text-foreground"
            data-testid="room-name"
          >
            {roomLabel}
          </h3>
          <span className="text-[13px] font-bold px-[9px] py-[3px] rounded-full bg-card text-muted-foreground">
            {plants.length}
          </span>
          {/* Only call out the rooms that need something today */}
          <div className="flex gap-1.5 ml-auto" data-testid="room-stats">
            {overdueCount > 0 && (
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full bg-sprout-warning text-sprout-dark"
                data-testid="overdue-count-badge"
              >
                {overdueCount} overdue
              </span>
            )}
            {dueTodayCount > 0 && (
              <span
                className="text-xs font-bold px-2.5 py-1 rounded-full bg-sprout-water text-sprout-dark"
                data-testid="due-today-count-badge"
              >
                {dueTodayCount} due
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 md:gap-3.5 mt-3">
          {plants.map((plant) => {
            const wateringCalc = calculateWateringSchedule(plant);

            // Per-plant frequency, not a flat 60-day guess, so the card agrees with the
            // plant's detail page and the reminder banner.
            const isFertilizationDue =
              getPlantFertilizationStatus(plant).status.isDue;

            // Find matching plant data from catalog for image fallback
            const catalogPlant = catalogPlants.find(
              (p) =>
                p.name.toLowerCase() === plant.plant_type.toLowerCase() ||
                p.botanicalName.toLowerCase() === plant.plant_type.toLowerCase()
            );

            return (
              <MyPlantCard
                key={plant.id}
                id={plant.id}
                name={plant.nickname}
                plantType={plant.plant_type}
                image={
                  plant.image || catalogPlant?.image || PLANT_FALLBACK_IMAGE
                }
                lastWatered={
                  plant.latest_watering
                    ? formatDate(plant.latest_watering)
                    : "Unknown"
                }
                lastWateredDate={plant.latest_watering}
                nextWateringDue={formatNextWateringDate(plant, formatDate)}
                isOverdue={wateringCalc.isOverdue}
                daysUntilWatering={wateringCalc.daysUntilWatering}
                hasUnknownWateringDate={wateringCalc.hasUnknownWateringDate}
                isPostponed={wateringCalc.isPostponed}
                suggestedWateringDays={plant.suggested_watering_days || 7}
                householdName={plant.household?.name}
                householdId={plant.household_id}
                overwatering={
                  overwateringByPlantId
                    ? overwateringByPlantId[plant.id]
                    : undefined
                }
                onWater={(notes, wateredAt) =>
                  onWaterPlant(plant.id, notes, wateredAt)
                }
                onEdit={() => onEditPlant(plant)}
                onPostpone={
                  onPostponeWatering
                    ? () => onPostponeWatering(plant.id)
                    : undefined
                }
                onScheduleAdjustment={onScheduleAdjustment}
                onViewHistory={
                  onViewHistory ? () => onViewHistory(plant) : undefined
                }
                isFertilizationDue={isFertilizationDue}
                onFertilize={
                  onFertilizePlant ? () => onFertilizePlant(plant.id) : undefined
                }
              />
            );
          })}
        </div>
      </div>
    </CascadingContainer>
  );
};

export default RoomSection;
