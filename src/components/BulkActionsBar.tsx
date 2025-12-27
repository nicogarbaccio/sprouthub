import React, { useState } from 'react';
import { useBulkSelection } from '@/contexts/BulkSelectionContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Droplets,
  Trash2,
  X,
  CheckSquare,
  Square,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface BulkActionsBarProps {
  onBulkWater: (plantIds: string[]) => Promise<void>;
  onBulkDelete: (plantIds: string[]) => Promise<void>;
  allPlantIds: string[];
  className?: string;
}

export const BulkActionsBar: React.FC<BulkActionsBarProps> = ({
  onBulkWater,
  onBulkDelete,
  allPlantIds,
  className,
}) => {
  const {
    selectedPlantIds,
    selectedCount,
    isSelectionMode,
    exitSelectionMode,
    selectAllPlants,
    deselectAllPlants,
  } = useBulkSelection();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const allSelected = selectedCount === allPlantIds.length && allPlantIds.length > 0;
  const someSelected = selectedCount > 0 && selectedCount < allPlantIds.length;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      deselectAllPlants();
    } else {
      selectAllPlants(allPlantIds);
    }
  };

  const handleBulkWater = async () => {
    setIsProcessing(true);
    try {
      await onBulkWater(Array.from(selectedPlantIds));
      exitSelectionMode();
    } catch (error) {
      console.error('Error bulk watering plants:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      await onBulkDelete(Array.from(selectedPlantIds));
      setShowDeleteConfirm(false);
      exitSelectionMode();
    } catch (error) {
      console.error('Error bulk deleting plants:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isSelectionMode) return null;

  return (
    <>
      <div
        className={cn(
          'fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg transform transition-transform duration-200',
          isSelectionMode ? 'translate-y-0' : 'translate-y-full',
          className
        )}
      >
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            {/* Left side - Selection info */}
            <div className="flex items-center justify-between w-full md:w-auto md:justify-start md:gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={exitSelectionMode}
                className="h-9 px-2 md:px-4"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>

              <Badge variant="secondary" className="h-7 px-3 whitespace-nowrap">
                {selectedCount} selected
              </Badge>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleSelectAll}
                className="h-9 px-2 md:px-4"
              >
                {allSelected ? (
                  <CheckSquare className="h-4 w-4 mr-2" />
                ) : (
                  <Square className="h-4 w-4 mr-2" />
                )}
                {allSelected ? 'Deselect All' : 'Select All'}
              </Button>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <Button
                variant="default"
                size="sm"
                onClick={handleBulkWater}
                disabled={selectedCount === 0 || isProcessing}
                className="h-9 flex-1 md:flex-none"
              >
                <Droplets className="h-4 w-4 mr-2" />
                Water
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={selectedCount === 0 || isProcessing}
                className="h-9 flex-1 md:flex-none"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} Plant{selectedCount !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected plant{selectedCount !== 1 ? 's' : ''} and all their watering history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isProcessing}
            >
              {isProcessing ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
