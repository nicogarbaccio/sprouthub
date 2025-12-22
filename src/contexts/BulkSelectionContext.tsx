import React, { createContext, useContext, useState, useCallback } from 'react';

interface BulkSelectionContextType {
  selectedPlantIds: Set<string>;
  isSelectionMode: boolean;
  togglePlantSelection: (plantId: string) => void;
  selectAllPlants: (plantIds: string[]) => void;
  deselectAllPlants: () => void;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
  isPlantSelected: (plantId: string) => boolean;
  selectedCount: number;
}

const BulkSelectionContext = createContext<BulkSelectionContextType | undefined>(undefined);

export const BulkSelectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedPlantIds, setSelectedPlantIds] = useState<Set<string>>(new Set());
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const togglePlantSelection = useCallback((plantId: string) => {
    setSelectedPlantIds((prev) => {
      const next = new Set(prev);
      if (next.has(plantId)) {
        next.delete(plantId);
      } else {
        next.add(plantId);
      }
      return next;
    });
  }, []);

  const selectAllPlants = useCallback((plantIds: string[]) => {
    setSelectedPlantIds(new Set(plantIds));
  }, []);

  const deselectAllPlants = useCallback(() => {
    setSelectedPlantIds(new Set());
  }, []);

  const enterSelectionMode = useCallback(() => {
    setIsSelectionMode(true);
  }, []);

  const exitSelectionMode = useCallback(() => {
    setIsSelectionMode(false);
    setSelectedPlantIds(new Set());
  }, []);

  const isPlantSelected = useCallback(
    (plantId: string) => {
      return selectedPlantIds.has(plantId);
    },
    [selectedPlantIds]
  );

  return (
    <BulkSelectionContext.Provider
      value={{
        selectedPlantIds,
        isSelectionMode,
        togglePlantSelection,
        selectAllPlants,
        deselectAllPlants,
        enterSelectionMode,
        exitSelectionMode,
        isPlantSelected,
        selectedCount: selectedPlantIds.size,
      }}
    >
      {children}
    </BulkSelectionContext.Provider>
  );
};

export const useBulkSelection = () => {
  const context = useContext(BulkSelectionContext);
  if (!context) {
    throw new Error('useBulkSelection must be used within BulkSelectionProvider');
  }
  return context;
};
