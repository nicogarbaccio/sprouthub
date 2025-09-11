import React from 'react';
import { useHouseholdPlants } from '@/hooks/useHouseholdPlants';
import HouseholdPlantCard from './HouseholdPlantCard';
import EmptyRoomState from './EmptyRoomState';
import { HouseholdPlant } from '@/hooks/useHouseholdPlants';

interface HouseholdPlantsCollectionProps {
  onPlantClick: (plant: HouseholdPlant) => void;
}

export const HouseholdPlantsCollection: React.FC<HouseholdPlantsCollectionProps> = ({
  onPlantClick,
}) => {
  const { plants, loading, overwateringByPlantId, addWateringRecord, postponeWatering } = useHouseholdPlants();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 dark:bg-gray-700 rounded-lg h-64"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (plants.length === 0) {
    return (
      <EmptyRoomState
        icon="🌱"
        title="No Plants Yet"
        description="Start your plant collection by adding your first plant!"
        actionText="Add Your First Plant"
        onAction={() => {
          // This will be handled by the parent component
        }}
      />
    );
  }

  // Group plants by room and ownership
  const plantsByRoom = plants.reduce((acc, plant) => {
    const room = plant.room || 'Unassigned';
    if (!acc[room]) {
      acc[room] = {
        personal: [],
        household: [],
      };
    }
    
    if (plant.is_owned_by_user) {
      acc[room].personal.push(plant);
    } else {
      acc[room].household.push(plant);
    }
    
    return acc;
  }, {} as Record<string, { personal: HouseholdPlant[]; household: HouseholdPlant[] }>);

  const roomIcons: Record<string, string> = {
    'Living Room': '🛋️',
    'Bedroom': '🛏️',
    'Kitchen': '🍳',
    'Bathroom': '🚿',
    'Office': '💼',
    'Balcony': '🌿',
    'Garden': '🌻',
    'Unassigned': '🏠',
  };

  const handleWater = async (plantId: string) => {
    try {
      await addWateringRecord(plantId, 'Watered by household member');
    } catch (error) {
      console.error('Error watering plant:', error);
    }
  };

  const handlePostpone = async (plantId: string) => {
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await postponeWatering(plantId, tomorrow, 'Postponed by household member');
    } catch (error) {
      console.error('Error postponing watering:', error);
    }
  };

  return (
    <div className="space-y-8">
      {Object.entries(plantsByRoom).map(([room, roomPlants]) => {
        const totalPlants = roomPlants.personal.length + roomPlants.household.length;
        const personalPlants = roomPlants.personal.length;
        const householdPlants = roomPlants.household.length;
        
        return (
          <div key={room} className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{roomIcons[room] || '🏠'}</span>
                <div>
                  <h3 className="text-lg font-semibold">{room}</h3>
                  <p className="text-sm text-muted-foreground">
                    {totalPlants} plant{totalPlants !== 1 ? 's' : ''} total
                    {personalPlants > 0 && ` • ${personalPlants} personal`}
                    {householdPlants > 0 && ` • ${householdPlants} household`}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Personal plants */}
              {roomPlants.personal.map((plant) => (
                <HouseholdPlantCard
                  key={plant.id}
                  plant={plant}
                  overwateringRisk={overwateringByPlantId[plant.id]}
                  onClick={() => onPlantClick(plant)}
                  onWater={() => handleWater(plant.id)}
                  onEdit={() => {
                    // Navigate to edit page - this will be handled by parent
                    onPlantClick(plant);
                  }}
                  onPostpone={() => handlePostpone(plant.id)}
                  onViewHistory={() => {
                    // Navigate to history - this will be handled by parent
                    onPlantClick(plant);
                  }}
                />
              ))}
              
              {/* Household plants */}
              {roomPlants.household.map((plant) => (
                <HouseholdPlantCard
                  key={plant.id}
                  plant={plant}
                  overwateringRisk={overwateringByPlantId[plant.id]}
                  onClick={() => onPlantClick(plant)}
                  onWater={() => handleWater(plant.id)}
                  onEdit={() => {
                    // Navigate to edit page - this will be handled by parent
                    onPlantClick(plant);
                  }}
                  onPostpone={() => handlePostpone(plant.id)}
                  onViewHistory={() => {
                    // Navigate to history - this will be handled by parent
                    onPlantClick(plant);
                  }}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
