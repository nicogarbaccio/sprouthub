import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { HouseholdPlantsCollection } from "@/components/HouseholdPlantsCollection";
import { HouseholdPlant } from "@/hooks/useHouseholdPlants";
import AddPlantDialog from "@/components/AddPlantDialog";
import EditPlantDialog from "@/components/EditPlantDialog";
import { useHouseholdPlants } from "@/hooks/useHouseholdPlants";

const HouseholdPlantsPage: React.FC = () => {
  const navigate = useNavigate();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingPlant, setEditingPlant] = useState<HouseholdPlant | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { plants, loading, addPlant, updatePlant, deletePlant, refetch } = useHouseholdPlants();

  const handlePlantClick = (plant: HouseholdPlant) => {
    navigate(`/my-plants/${plant.id}`);
  };

  const handleAddPlant = async (plantData: {
    nickname: string;
    plant_type: string;
    image?: string;
    room?: string;
    suggested_watering_days: number;
    is_outdoor_plant?: boolean;
    household_id?: string;
  }) => {
    try {
      await addPlant(plantData);
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding plant:", error);
    }
  };

  const handleEditPlant = (plant: HouseholdPlant) => {
    setEditingPlant(plant);
    setIsEditDialogOpen(true);
  };

  const handleUpdatePlant = async (plantId: string, updates: Partial<{
    nickname: string;
    plant_type: string;
    image?: string;
    room?: string;
    suggested_watering_days: number;
    is_outdoor_plant?: boolean;
    household_id?: string;
  }>) => {
    try {
      await updatePlant(plantId, updates);
      setIsEditDialogOpen(false);
      setEditingPlant(null);
    } catch (error) {
      console.error("Error updating plant:", error);
    }
  };

  const handleDeletePlant = async (plantId: string) => {
    try {
      await deletePlant(plantId);
      setIsEditDialogOpen(false);
      setEditingPlant(null);
    } catch (error) {
      console.error("Error deleting plant:", error);
    }
  };

  // Calculate statistics
  const totalPlants = plants.length;
  const personalPlants = plants.filter(p => p.is_owned_by_user).length;
  const householdPlants = plants.filter(p => !p.is_owned_by_user).length;
  const rooms = [...new Set(plants.map(p => p.room || 'Unassigned'))].length;
  const dueToday = plants.filter(p => {
    const wateringCalc = calculateWateringSchedule(p);
    return wateringCalc.isOverdue || wateringCalc.daysUntilWatering === 0;
  }).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sprout-cream via-white to-sprout-cream/30 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Household Plant Collection
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Collaborate on plant care with your household members
            </p>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-sprout-primary hover:bg-sprout-primary/90 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add New Plant
          </Button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {totalPlants}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              plants total
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {rooms}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              rooms
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {personalPlants}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              personal
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">
              {householdPlants}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              shared
            </div>
          </div>
        </div>

        {/* Plants Collection */}
        <HouseholdPlantsCollection onPlantClick={handlePlantClick} />

        {/* Add Plant Dialog */}
        <AddPlantDialog
          isOpen={isAddDialogOpen}
          onClose={() => setIsAddDialogOpen(false)}
          onAddPlant={handleAddPlant}
        />

        {/* Edit Plant Dialog */}
        <EditPlantDialog
          plant={editingPlant}
          isOpen={isEditDialogOpen}
          onClose={() => {
            setIsEditDialogOpen(false);
            setEditingPlant(null);
          }}
          onUpdate={refetch}
        />
      </div>
    </div>
  );
};

// Import the calculateWateringSchedule function
import { calculateWateringSchedule } from "@/utils/watering-schedule";

export default HouseholdPlantsPage;
