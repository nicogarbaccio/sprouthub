import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Droplets, AlertTriangle, Edit, Clock, History, User } from "lucide-react";
import type { OverwateringRisk } from "@/utils/overwatering";
import { shouldShowOverwateringWarning } from "@/utils/overwatering";
import PlantImage from "@/components/ui/plant-image";
import WaterConfirmationDialog from "@/components/WaterConfirmationDialog";
import FullscreenImageModal from "@/components/ui/fullscreen-image-modal";
import { useNavigate } from "react-router-dom";
import { calculateWateringSchedule } from "@/utils/watering-schedule";

interface HouseholdPlantCardProps {
  plant: {
    id: string;
    nickname: string;
    plant_type: string;
    image?: string;
    latest_watering?: string;
    suggested_watering_days?: number;
    household?: { name: string };
    plant_owner?: { email: string };
    is_owned_by_user: boolean;
  };
  overwateringRisk?: OverwateringRisk;
  onClick: () => void;
  onWater: () => void;
  onEdit: () => void;
  onPostpone?: () => void;
  onViewHistory?: () => void;
}

const HouseholdPlantCard = ({
  plant,
  overwateringRisk,
  onClick,
  onWater,
  onEdit,
  onPostpone,
  onViewHistory,
}: HouseholdPlantCardProps) => {
  const [isWaterDialogOpen, setIsWaterDialogOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const navigate = useNavigate();

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const wateringCalc = calculateWateringSchedule(plant);
  const showOverwateringWarning = shouldShowOverwateringWarning(
    overwateringRisk,
    plant.suggested_watering_days || 7
  );

  const handleWaterClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWaterDialogOpen(true);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit();
  };

  const handleHistoryClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewHistory?.();
  };

  const handlePostponeClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPostpone?.();
  };

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsImageModalOpen(true);
  };

  const getOwnerDisplayName = () => {
    if (plant.is_owned_by_user) {
      return "You";
    }
    if (plant.plant_owner?.email) {
      return plant.plant_owner.email.split('@')[0]; // Show username part
    }
    return "Unknown";
  };

  return (
    <>
      <div
        className="group relative bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden"
        onClick={onClick}
      >
        {/* Plant Image */}
        <div className="relative aspect-[4/3] overflow-hidden">
          <PlantImage
            src={
              plant.image ||
              "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400&h=300&fit=crop"
            }
            alt={plant.nickname}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onClick={handleImageClick}
          />
          
          {/* Ownership Badge */}
          <div className="absolute top-2 left-2">
            <div className={`px-2 py-1 rounded-full text-xs font-medium ${
              plant.is_owned_by_user 
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' 
                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            }`}>
              <User className="w-3 h-3 inline mr-1" />
              {getOwnerDisplayName()}
            </div>
          </div>

          {/* Household Badge */}
          {plant.household && (
            <div className="absolute top-2 right-2">
              <div className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                🏠 {plant.household.name}
              </div>
            </div>
          )}

          {/* Watering Status Badge */}
          <div className="absolute bottom-2 right-2">
            <div
              className={`px-2 py-1 rounded-full text-xs font-medium ${
                wateringCalc.isOverdue
                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                  : wateringCalc.daysUntilWatering === 0
                  ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200"
                  : "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
              }`}
            >
              {wateringCalc.isOverdue
                ? "Overdue"
                : wateringCalc.daysUntilWatering === 0
                ? "Due today"
                : `Water in ${wateringCalc.daysUntilWatering} days`}
            </div>
          </div>

          {/* Overwatering Warning */}
          {showOverwateringWarning && (
            <div className="absolute bottom-2 left-2">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                <AlertTriangle className="w-3 h-3" />
                Watch watering
              </div>
            </div>
          )}
        </div>

        {/* Plant Info */}
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-lg text-gray-900 dark:text-white group-hover:text-sprout-primary transition-colors">
              {plant.nickname}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {plant.plant_type}
            </p>
          </div>

          {/* Watering Info */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Last watered:</span>
              <span className="font-medium">
                {plant.latest_watering
                  ? formatDate(plant.latest_watering)
                  : "Unknown"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Next watering:</span>
              <span className="font-medium">
                {wateringCalc.nextWateringDue}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              className="flex-1 bg-sprout-primary hover:bg-sprout-primary/90 text-white"
              onClick={handleWaterClick}
            >
              <Droplets className="w-4 h-4 mr-1" />
              Water Now
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleEditClick}
              disabled={!plant.is_owned_by_user} // Only owner can edit
            >
              <Edit className="w-4 h-4" />
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={handleHistoryClick}
            >
              <History className="w-4 h-4" />
            </Button>
          </div>

          {/* Postpone Button for Overdue Plants */}
          {wateringCalc.isOverdue && onPostpone && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={handlePostponeClick}
            >
              <Clock className="w-4 h-4 mr-1" />
              Push to Tomorrow
            </Button>
          )}
        </div>
      </div>

      {/* Water Confirmation Dialog */}
      <WaterConfirmationDialog
        isOpen={isWaterDialogOpen}
        onClose={() => setIsWaterDialogOpen(false)}
        onConfirm={onWater}
        plantName={plant.nickname}
      />

      {/* Fullscreen Image Modal */}
      <FullscreenImageModal
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
        imageUrl={
          plant.image ||
          "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=400&h=300&fit=crop"
        }
        alt={plant.nickname}
      />
    </>
  );
};

export default HouseholdPlantCard;
