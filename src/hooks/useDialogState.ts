import { useState, useCallback } from 'react';

/**
 * Generic type for dialog data
 */
export type DialogData<T = any> = T | null;

/**
 * Return type for useDialogState hook
 */
export interface DialogState<T = any> {
  isOpen: boolean;
  data: DialogData<T>;
  open: (data?: T) => void;
  close: () => void;
  toggle: () => void;
  setData: (data: DialogData<T>) => void;
}

/**
 * Custom hook for managing dialog state with optional associated data
 *
 * This hook standardizes the pattern used across Dashboard, MyPlantDetails,
 * MyPlantCard, and other components that manage multiple dialog states.
 *
 * @param initialOpen - Whether the dialog should start open (default: false)
 * @param initialData - Initial data to associate with the dialog
 *
 * @example
 * // Simple dialog with no data
 * const confirmDialog = useDialogState();
 *
 * // Dialog with plant data
 * const editDialog = useDialogState<Plant>();
 * editDialog.open(selectedPlant);
 *
 * // Later in JSX
 * <Dialog open={editDialog.isOpen} onOpenChange={(open) => !open && editDialog.close()}>
 *   {editDialog.data && <EditPlantForm plant={editDialog.data} />}
 * </Dialog>
 *
 * @example
 * // Multiple dialogs in one component
 * const waterDialog = useDialogState<{ plantId: string; plantName: string }>();
 * const deleteDialog = useDialogState<{ plantId: string }>();
 * const editDialog = useDialogState<Plant>();
 */
export function useDialogState<T = any>(
  initialOpen = false,
  initialData: DialogData<T> = null
): DialogState<T> {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [data, setData] = useState<DialogData<T>>(initialData);

  /**
   * Opens the dialog, optionally setting associated data
   */
  const open = useCallback((newData?: T) => {
    if (newData !== undefined) {
      setData(newData);
    }
    setIsOpen(true);
  }, []);

  /**
   * Closes the dialog and optionally clears the data
   */
  const close = useCallback(() => {
    setIsOpen(false);
    // Clear data after a short delay to avoid visual flicker
    setTimeout(() => setData(null), 150);
  }, []);

  /**
   * Toggles the dialog open/closed state
   */
  const toggle = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  return {
    isOpen,
    data,
    open,
    close,
    toggle,
    setData,
  };
}

/**
 * Helper type for extracting dialog data type from a DialogState
 */
export type DialogDataType<T> = T extends DialogState<infer U> ? U : never;
