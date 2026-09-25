import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useBulkSelection } from '@/contexts/BulkSelectionContext';
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
import {
  confirmCancelClasses,
  confirmDestructiveClasses,
  confirmDialogClasses,
  confirmIconClasses,
  confirmTitleClasses,
} from '@/components/settings/SettingsUI';

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
  const [showWaterConfirm, setShowWaterConfirm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const allSelected = selectedCount === allPlantIds.length && allPlantIds.length > 0;

  const handleToggleSelectAll = () => {
    if (allSelected) {
      deselectAllPlants();
    } else {
      selectAllPlants(allPlantIds);
    }
  };

  const handleBulkWater = () => {
    setShowWaterConfirm(true);
  };

  const confirmBulkWater = async () => {
    setIsProcessing(true);
    try {
      await onBulkWater(Array.from(selectedPlantIds));
      setShowWaterConfirm(false);
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

  const content = (
    <>
      {/*
        IMPORTANT: Using React Portal to render directly to document.body,
        ensuring this component is completely outside any transform/positioning contexts
        that could break position: fixed behavior.
      */}
      <div
        className={cn(
          // Pinned to the bottom of the viewport, over the bottom nav, in the nav's colours
          'fixed left-0 right-0 bottom-0 bg-nav text-sprout-cream rounded-t-[28px] shadow-[0_-8px_30px_rgba(29,60,40,0.25)] pb-safe',
          className
        )}
        style={{ zIndex: 50 }}
        role="toolbar"
        aria-label="Bulk actions"
      >
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {/* Left side - Selection info */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exitSelectionMode}
                className="w-11 h-11 shrink-0 rounded-2xl bg-sprout-cream/10 hover:bg-sprout-cream/15 flex items-center justify-center"
                aria-label="Cancel selection"
              >
                <X className="h-5 w-5" />
              </button>

              <span className="font-display text-lg font-bold whitespace-nowrap px-1" aria-live="polite">
                {selectedCount} selected
              </span>

              <button
                type="button"
                onClick={handleToggleSelectAll}
                className="ml-auto md:ml-2 h-10 px-3.5 rounded-full border-[1.5px] border-sprout-cream/40 text-[13px] font-bold inline-flex items-center gap-1.5 hover:bg-sprout-cream/10"
              >
                {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                {allSelected ? 'Deselect all' : 'Select all'}
              </button>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <button
                type="button"
                onClick={handleBulkWater}
                disabled={selectedCount === 0 || isProcessing}
                className="h-12 flex-1 md:flex-none md:px-6 rounded-[18px] bg-sprout-water text-sprout-dark font-bold text-[15px] inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Droplets className="h-5 w-5" />
                Water
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={selectedCount === 0 || isProcessing}
                className="h-12 flex-1 md:flex-none md:px-6 rounded-[18px] bg-sprout-warning text-sprout-dark font-bold text-[15px] inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Trash2 className="h-5 w-5" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className={confirmDialogClasses}>
          <AlertDialogHeader className="text-left">
            <div className="flex items-center gap-3 mb-1">
              <div className={cn(confirmIconClasses, 'bg-sprout-warning text-sprout-dark')}>
                <Trash2 className="w-6 h-6" />
              </div>
              <AlertDialogTitle className={confirmTitleClasses}>
                Delete {selectedCount} Plant{selectedCount !== 1 ? 's' : ''}?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-[15px]">
              This will permanently delete the selected plant{selectedCount !== 1 ? 's' : ''} and all their watering history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={confirmCancelClasses}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className={confirmDestructiveClasses}
              disabled={isProcessing}
            >
              {isProcessing ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Water Confirmation Dialog */}
      <AlertDialog open={showWaterConfirm} onOpenChange={setShowWaterConfirm}>
        <AlertDialogContent className={confirmDialogClasses}>
          <AlertDialogHeader className="text-left">
            <div className="flex items-center gap-3 mb-1">
              <div className={cn(confirmIconClasses, 'bg-sprout-water text-sprout-dark')}>
                <Droplets className="w-6 h-6" />
              </div>
              <AlertDialogTitle className={confirmTitleClasses}>
                Water {selectedCount} Plant{selectedCount !== 1 ? 's' : ''}?
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-[15px]">
              Are you sure you want to mark {selectedCount} plant{selectedCount !== 1 ? 's' : ''} as watered?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className={confirmCancelClasses}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkWater}
              className="h-12 rounded-[18px] bg-sprout-water text-sprout-dark hover:bg-sprout-water/90 font-bold"
              disabled={isProcessing}
            >
              {isProcessing ? 'Watering...' : 'Water'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  return createPortal(content, document.body);
};
