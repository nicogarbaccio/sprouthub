import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDialogState } from '@/hooks/useDialogState';

describe('useDialogState', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initialization', () => {
    it('initializes with closed state by default', () => {
      const { result } = renderHook(() => useDialogState());

      expect(result.current.isOpen).toBe(false);
      expect(result.current.data).toBe(null);
    });

    it('initializes with custom open state', () => {
      const { result } = renderHook(() => useDialogState(true));

      expect(result.current.isOpen).toBe(true);
      expect(result.current.data).toBe(null);
    });

    it('initializes with custom data', () => {
      const initialData = { id: '123', name: 'Test Plant' };
      const { result } = renderHook(() => useDialogState(false, initialData));

      expect(result.current.isOpen).toBe(false);
      expect(result.current.data).toEqual(initialData);
    });

    it('initializes with both open state and data', () => {
      const initialData = { id: '456' };
      const { result } = renderHook(() => useDialogState(true, initialData));

      expect(result.current.isOpen).toBe(true);
      expect(result.current.data).toEqual(initialData);
    });
  });

  describe('open()', () => {
    it('opens the dialog', () => {
      const { result } = renderHook(() => useDialogState());

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('opens the dialog with data', () => {
      const { result } = renderHook(() => useDialogState<{ id: string }>());
      const testData = { id: 'plant-123' };

      act(() => {
        result.current.open(testData);
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.data).toEqual(testData);
    });

    it('replaces existing data when opening with new data', () => {
      const { result } = renderHook(() => useDialogState<{ id: string }>(false, { id: 'old' }));

      act(() => {
        result.current.open({ id: 'new' });
      });

      expect(result.current.data).toEqual({ id: 'new' });
    });

    it('keeps existing data when opening without new data', () => {
      const initialData = { id: 'existing' };
      const { result } = renderHook(() => useDialogState(false, initialData));

      act(() => {
        result.current.open();
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.data).toEqual(initialData);
    });
  });

  describe('close()', () => {
    it('closes the dialog', () => {
      const { result } = renderHook(() => useDialogState(true));

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('clears data after delay', () => {
      const { result } = renderHook(() => useDialogState(true, { id: 'test' }));

      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
      expect(result.current.data).toEqual({ id: 'test' }); // Still has data immediately

      act(() => {
        vi.advanceTimersByTime(150); // Wait for the 150ms delay
      });

      expect(result.current.data).toBe(null); // Data cleared after delay
    });
  });

  describe('toggle()', () => {
    it('toggles from closed to open', () => {
      const { result } = renderHook(() => useDialogState(false));

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(true);
    });

    it('toggles from open to closed', () => {
      const { result } = renderHook(() => useDialogState(true));

      act(() => {
        result.current.toggle();
      });

      expect(result.current.isOpen).toBe(false);
    });

    it('toggles multiple times', () => {
      const { result } = renderHook(() => useDialogState(false));

      act(() => {
        result.current.toggle(); // Open
      });
      expect(result.current.isOpen).toBe(true);

      act(() => {
        result.current.toggle(); // Close
      });
      expect(result.current.isOpen).toBe(false);

      act(() => {
        result.current.toggle(); // Open again
      });
      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('setData()', () => {
    it('sets new data', () => {
      const { result } = renderHook(() => useDialogState<{ name: string }>());

      act(() => {
        result.current.setData({ name: 'Monstera' });
      });

      expect(result.current.data).toEqual({ name: 'Monstera' });
    });

    it('replaces existing data', () => {
      const { result } = renderHook(() => useDialogState(false, { name: 'Old' }));

      act(() => {
        result.current.setData({ name: 'New' });
      });

      expect(result.current.data).toEqual({ name: 'New' });
    });

    it('clears data when set to null', () => {
      const { result } = renderHook(() => useDialogState(false, { name: 'Test' }));

      act(() => {
        result.current.setData(null);
      });

      expect(result.current.data).toBe(null);
    });

    it('does not affect open state', () => {
      const { result } = renderHook(() => useDialogState(true));

      act(() => {
        result.current.setData({ id: '123' });
      });

      expect(result.current.isOpen).toBe(true);
    });
  });

  describe('Type Safety', () => {
    it('works with typed data', () => {
      interface PlantData {
        id: string;
        nickname: string;
        wateringDays: number;
      }

      const { result } = renderHook(() => useDialogState<PlantData>());

      const plantData: PlantData = {
        id: 'plant-1',
        nickname: 'Fern',
        wateringDays: 7,
      };

      act(() => {
        result.current.open(plantData);
      });

      expect(result.current.data).toEqual(plantData);
    });
  });

  describe('Real-world Scenarios', () => {
    it('handles edit dialog workflow', () => {
      interface EditData {
        plantId: string;
        currentName: string;
      }

      const { result } = renderHook(() => useDialogState<EditData>());

      // Open dialog with plant to edit
      act(() => {
        result.current.open({ plantId: '123', currentName: 'Monstera' });
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.data?.plantId).toBe('123');

      // Close after editing
      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);

      // Data should be cleared after delay
      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(result.current.data).toBe(null);
    });

    it('handles confirmation dialog workflow', () => {
      const { result } = renderHook(() => useDialogState<string>());

      // Open confirmation with plant ID
      act(() => {
        result.current.open('plant-to-delete-123');
      });

      expect(result.current.isOpen).toBe(true);
      expect(result.current.data).toBe('plant-to-delete-123');

      // Cancel/close
      act(() => {
        result.current.close();
      });

      expect(result.current.isOpen).toBe(false);
    });
  });
});
