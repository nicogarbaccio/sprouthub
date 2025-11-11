import { CascadingGrid } from "@/components/ui/cascading-grid";
import { CascadingContainer } from "@/components/ui/cascading-container";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Droplets, CheckCircle, Clock } from "lucide-react";
import MyPlantCard from "./MyPlantCard";
import EmptyRoomState from "./EmptyRoomState";
import { UserPlant } from "@/hooks/useUserPlants";
import { getRoomIcon, getRoomLabel, getRoomTheme } from "@/utils/rooms";
import type { OverwateringRisk } from "@/utils/overwatering";
import {
  calculateWateringSchedule,
  getNextWateringDate as getNextWateringDateUtil,
} from "@/utils/watering-schedule";

interface RoomSectionProps {
  roomKey: string;
  plants: UserPlant[];
  onWaterPlant: (plantId: string) => void;
  onEditPlant: (plant: UserPlant) => void;
  onAddPlant: () => void;
  onPostponeWatering?: (plantId: string) => void;
  onViewHistory?: (plant: UserPlant) => void;
  onScheduleAdjustment?: (plantId: string, newSchedule: number) => Promise<void>;
  formatDate: (dateString: string) => string;
  getNextWateringDate: (
    lastWatered: string | undefined,
    daysAgo: number | undefined,
    wateringSchedule: number
  ) => string;
  isOverdue: (
    daysAgo: number | undefined,
    wateringSchedule: number,
    hasLastWatered: boolean
  ) => boolean;
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
  formatDate,
  getNextWateringDate,
  isOverdue,
  delay,
  overwateringByPlantId,
}: RoomSectionProps) => {
  const roomLabel = getRoomLabel(roomKey);
  const roomIcon = getRoomIcon(roomKey);
  const roomTheme = getRoomTheme(roomKey);

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

  const { overdueCount, dueTodayCount, healthyCount, unknownCount } = roomStats;

  // Room health status
  const getRoomHealthStatus = () => {
    if (overdueCount > 0)
      return {
        status: "needs-attention",
        color: "text-sprout-warning",
        bgColor: "bg-sprout-warning/10",
      };
    if (dueTodayCount > 0)
      return {
        status: "due-today",
        color: "text-sprout-dark",
        bgColor: "bg-sprout-cream/20",
      };
    if (unknownCount > 0)
      return {
        status: "unknown",
        color: "text-neutral-medium",
        bgColor: "bg-neutral-light",
      };
    return {
      status: "healthy",
      color: "text-sprout-success",
      bgColor: "bg-sprout-success/10",
    };
  };

  const roomHealth = getRoomHealthStatus();

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
      <div className="mb-12" data-testid="room-section" data-room={roomKey}>
        {/* Enhanced Room Header */}
        <div
          className={`${roomTheme.background} ${roomTheme.border} border-2 rounded-2xl p-4 sm:p-6 mb-6 transition-all duration-300 hover:shadow-md`}
          data-testid="room-header"
        >
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`${roomTheme.iconBg} p-2 sm:p-3 rounded-xl`}>
                <span className="text-2xl sm:text-3xl">{roomIcon}</span>
              </div>
              <div>
                <h3 className="text-xl sm:text-2xl font-bold text-foreground mb-1" data-testid="room-name">
                  {roomLabel}
                </h3>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-muted-foreground">
                    {plants.length} plant{plants.length !== 1 ? "s" : ""}
                  </p>
                  <div
                    className={`w-2 h-2 rounded-full ${
                      roomHealth.status === "healthy"
                        ? "bg-green-400"
                        : roomHealth.status === "due-today"
                        ? "bg-yellow-400"
                        : roomHealth.status === "needs-attention"
                        ? "bg-red-400"
                        : "bg-gray-400"
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Room Statistics Badges */}
            <div className="flex flex-wrap gap-2" data-testid="room-stats">
              {healthyCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700 hover:bg-green-100 text-xs"
                  data-testid="healthy-count-badge"
                >
                  <CheckCircle className="w-3 h-3 mr-1" />
                  {healthyCount} healthy
                </Badge>
              )}
              {dueTodayCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 text-xs"
                  data-testid="due-today-count-badge"
                >
                  <Clock className="w-3 h-3 mr-1" />
                  {dueTodayCount} due today
                </Badge>
              )}
              {overdueCount > 0 && (
                <Badge
                  variant="destructive"
                  className="bg-red-100 text-red-700 hover:bg-red-100 text-xs"
                  data-testid="overdue-count-badge"
                >
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {overdueCount} overdue
                </Badge>
              )}
              {unknownCount > 0 && (
                <Badge
                  variant="secondary"
                  className="bg-gray-100 text-gray-700 hover:bg-gray-100 text-xs"
                  data-testid="unknown-count-badge"
                >
                  <Droplets className="w-3 h-3 mr-1" />
                  {unknownCount} unknown
                </Badge>
              )}
            </div>
          </div>

          {/* Room Health Summary */}
          {(overdueCount > 0 || dueTodayCount > 0) && (
            <div
              className={`mt-4 p-3 ${
                roomHealth.bgColor
              } rounded-lg border-l-4 ${
                roomHealth.status === "needs-attention"
                  ? "border-sprout-warning"
                  : "border-sprout-cream"
              }`}
            >
              <p className={`text-sm font-medium ${roomHealth.color}`}>
                {overdueCount > 0
                  ? `${overdueCount} plant${
                      overdueCount !== 1 ? "s" : ""
                    } need${overdueCount === 1 ? "s" : ""} immediate attention`
                  : `${dueTodayCount} plant${
                      dueTodayCount !== 1 ? "s" : ""
                    } should be watered today`}
              </p>
            </div>
          )}
        </div>

        {/* Plants Grid */}
        <CascadingGrid
          items={plants}
          renderItem={(plant) => {
            // Use the new watering schedule calculation utility
            const wateringCalc = calculateWateringSchedule(plant);

            return (
              <MyPlantCard
                key={plant.id}
                id={plant.id}
                name={plant.nickname}
                plantType={plant.plant_type}
                image={
                  plant.image ||
                  "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400&h=300&fit=crop"
                }
                lastWatered={
                  plant.latest_watering
                    ? formatDate(plant.latest_watering)
                    : "Unknown"
                }
                lastWateredDate={plant.latest_watering}
                nextWateringDue={getNextWateringDateUtil(
                  plant.latest_watering,
                  plant.latest_watering ? Math.round((new Date().getTime() - new Date(plant.latest_watering).getTime()) / (1000 * 60 * 60 * 24)) : undefined,
                  plant.suggested_watering_days || 7,
                  formatDate,
                  plant.postponement_date
                )}
                isOverdue={wateringCalc.isOverdue}
                daysUntilWatering={wateringCalc.daysUntilWatering}
                hasUnknownWateringDate={wateringCalc.hasUnknownWateringDate}
                isPostponed={wateringCalc.isPostponed}
                suggestedWateringDays={plant.suggested_watering_days || 7}
                householdName={plant.household?.name}
                overwatering={
                  overwateringByPlantId
                    ? overwateringByPlantId[plant.id]
                    : undefined
                }
                onWater={() => onWaterPlant(plant.id)}
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
              />
            );
          }}
          cols={{ default: 1, md: 2, lg: 3, xl: 4 }}
          itemDelay={75}
        />
      </div>
    </CascadingContainer>
  );
};

export default RoomSection;
