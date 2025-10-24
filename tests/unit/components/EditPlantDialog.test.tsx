import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EditPlantDialog from '@/components/EditPlantDialog';
import { supabase } from '@/integrations/supabase/client';
import { plantToast, wateringToast } from '@/utils/toast-helpers';

// Mock dependencies
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    }))
  }
}));

vi.mock('@/utils/toast-helpers', () => ({
  plantToast: {
    updated: vi.fn(),
    deleted: vi.fn(),
    error: vi.fn()
  },
  wateringToast: {
    recorded: vi.fn(),
    deleted: vi.fn(),
    error: vi.fn()
  },
  utilityToast: {
    error: vi.fn()
  }
}));

vi.mock('@/hooks/useHouseholds', () => ({
  useHouseholds: () => ({ households: [] })
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'test-user-123' } })
}));

vi.mock('@/utils/rooms', () => ({
  NO_ROOM_VALUE: 'no-room'
}));

// Mock child components
vi.mock('@/components/edit-plant/PlantDetailsForm', () => ({
  default: ({ nickname, setNickname }: any) => (
    <div data-testid="plant-details-form">
      <input
        value={nickname}
        onChange={(e) => setNickname(e.target.value)}
        data-testid="nickname-input"
      />
    </div>
  )
}));

vi.mock('@/components/edit-plant/WateringRecordForm', () => ({
  default: ({ onAddWatering }: any) => (
    <div data-testid="watering-record-form">
      <button
        onClick={() => onAddWatering(new Date('2025-01-15'), 'Test notes')}
        data-testid="add-watering-button"
      >
        Add Watering
      </button>
    </div>
  )
}));

vi.mock('@/components/edit-plant/WateringRecordsList', () => ({
  default: ({ records, onDeleteRecord, deleteLoadingRecords }: any) => (
    <div data-testid="watering-records-list">
      {records.map((record: any) => (
        <div key={record.id} data-testid={`watering-record-${record.id}`}>
          <span>{record.watered_at}</span>
          <button
            onClick={() => onDeleteRecord(record.id)}
            disabled={deleteLoadingRecords?.has(record.id)}
            data-testid={`delete-watering-${record.id}`}
          >
            {deleteLoadingRecords?.has(record.id) ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      ))}
    </div>
  )
}));

vi.mock('@/components/ScheduleHistoryCard', () => ({
  ScheduleHistoryCard: () => <div data-testid="schedule-history-card" />
}));

describe('EditPlantDialog - Watering Record Operations', () => {
  const mockPlant = {
    id: 'test-plant-123',
    nickname: 'Test Plant',
    plant_type: 'Monstera',
    suggested_watering_days: 7,
    room: 'Living Room',
    is_outdoor_plant: false,
    household_id: null
  };

  const mockWateringRecords = [
    {
      id: 'record-1',
      watered_at: '2025-01-10T10:00:00Z',
      notes: 'Regular watering'
    },
    {
      id: 'record-2',
      watered_at: '2025-01-05T10:00:00Z',
      notes: 'Deep watering'
    }
  ];

  const mockOnClose = vi.fn();
  const mockOnUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(supabase.from).mockReturnValue({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: mockWateringRecords,
            error: null
          }))
        }))
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => Promise.resolve({ data: [], error: null }))
        }))
      }))
    } as any);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('Watering Record Deletion', () => {
    it('should await data refresh before showing success toast', async () => {
      const user = userEvent.setup();

      // Track the order of operations
      const operationOrder: string[] = [];

      // Mock loadWateringRecords to track when it's called
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(async () => {
            operationOrder.push('refresh-called');
            // Simulate async delay
            await new Promise(resolve => setTimeout(resolve, 50));
            operationOrder.push('refresh-completed');
            return Promise.resolve({ data: [], error: null });
          })
        }))
      }));

      // Mock successful deletion
      const mockDelete = vi.fn(() => ({
        eq: vi.fn(async () => {
          operationOrder.push('delete-completed');
          return Promise.resolve({ data: null, error: null });
        })
      }));

      // Mock toast to track when it's called
      const mockToastDeleted = vi.fn(() => {
        operationOrder.push('toast-shown');
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'watering_records') {
          return {
            select: mockSelect,
            delete: mockDelete,
            insert: vi.fn(() => Promise.resolve({ data: null, error: null }))
          } as any;
        }
        return {
          select: mockSelect,
          delete: vi.fn(),
          insert: vi.fn(),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        } as any;
      });

      vi.mocked(wateringToast.deleted).mockImplementation(mockToastDeleted);

      render(
        <EditPlantDialog
          plant={mockPlant}
          isOpen={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      // Switch to watering history tab
      const wateringTab = screen.getByText('Watering History');
      await user.click(wateringTab);

      await waitFor(() => {
        expect(screen.getByTestId('watering-records-list')).toBeInTheDocument();
      });

      // Click delete button for first record
      const deleteButton = screen.getByTestId('delete-watering-record-1');
      await user.click(deleteButton);

      // Wait for all operations to complete
      await waitFor(() => {
        expect(mockToastDeleted).toHaveBeenCalled();
      }, { timeout: 1000 });

      // Verify the order of operations
      expect(operationOrder).toEqual([
        'delete-completed',
        'refresh-called',
        'refresh-completed',
        'toast-shown'
      ]);

      // Verify toast is only shown after refresh is complete
      const toastIndex = operationOrder.indexOf('toast-shown');
      const refreshCompleteIndex = operationOrder.indexOf('refresh-completed');
      expect(toastIndex).toBeGreaterThan(refreshCompleteIndex);
    });

    it('should prevent multiple simultaneous deletions of the same record', async () => {
      const user = userEvent.setup();

      // Mock slow deletion to simulate the race condition scenario
      // Use a promise we can control instead of setTimeout for deterministic testing
      let resolveDeletion: () => void;
      const deletionPromise = new Promise<void>(resolve => {
        resolveDeletion = resolve;
      });

      const mockDelete = vi.fn(() => ({
        eq: vi.fn(async () => {
          await deletionPromise;
          return Promise.resolve({ data: null, error: null });
        })
      }));

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'watering_records') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({
                  data: mockWateringRecords,
                  error: null
                }))
              }))
            })),
            delete: mockDelete,
            insert: vi.fn(() => Promise.resolve({ data: null, error: null }))
          } as any;
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          })),
          delete: vi.fn(),
          insert: vi.fn(),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        } as any;
      });

      render(
        <EditPlantDialog
          plant={mockPlant}
          isOpen={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      // Switch to watering history tab
      const wateringTab = screen.getByText('Watering History');
      await user.click(wateringTab);

      await waitFor(() => {
        expect(screen.getByTestId('watering-records-list')).toBeInTheDocument();
      });

      // Try to click delete button multiple times rapidly
      const deleteButton = screen.getByTestId('delete-watering-record-1');

      // First click should work
      await user.click(deleteButton);

      // Verify button shows loading state
      expect(deleteButton).toHaveTextContent('Deleting...');
      expect(deleteButton).toBeDisabled();

      // Second click should be ignored (button is disabled)
      await user.click(deleteButton);
      await user.click(deleteButton);

      // Verify deletion was only called once even before promise resolves
      expect(mockDelete).toHaveBeenCalledTimes(1);

      // Now resolve the deletion to complete the test
      await act(async () => {
        resolveDeletion!();
        await deletionPromise;
      });

      // Verify deletion completed successfully
      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle deletion errors gracefully', async () => {
      const user = userEvent.setup();

      // Mock deletion failure
      const mockDelete = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: null,
          error: new Error('Database error')
        }))
      }));

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'watering_records') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({
                  data: mockWateringRecords,
                  error: null
                }))
              }))
            })),
            delete: mockDelete,
            insert: vi.fn(() => Promise.resolve({ data: null, error: null }))
          } as any;
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          })),
          delete: vi.fn(),
          insert: vi.fn(),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        } as any;
      });

      render(
        <EditPlantDialog
          plant={mockPlant}
          isOpen={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      // Switch to watering history tab
      const wateringTab = screen.getByText('Watering History');
      await user.click(wateringTab);

      await waitFor(() => {
        expect(screen.getByTestId('watering-records-list')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getByTestId('delete-watering-record-1');
      await user.click(deleteButton);

      // Wait for error handling
      await waitFor(() => {
        expect(wateringToast.error).toHaveBeenCalledWith('delete');
      });

      // Verify success toast was NOT called
      expect(wateringToast.deleted).not.toHaveBeenCalled();

      // Verify button is no longer in loading state
      await waitFor(() => {
        expect(deleteButton).not.toBeDisabled();
        expect(deleteButton).toHaveTextContent('Delete');
      });
    });

    it('should show loading state in WateringRecordsList during deletion', async () => {
      const user = userEvent.setup();

      render(
        <EditPlantDialog
          plant={mockPlant}
          isOpen={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      // Switch to watering history tab
      const wateringTab = screen.getByText('Watering History');
      await user.click(wateringTab);

      await waitFor(() => {
        expect(screen.getByTestId('watering-records-list')).toBeInTheDocument();
      });

      // Initially, button should not be in loading state
      const deleteButton = screen.getByTestId('delete-watering-record-1');
      expect(deleteButton).toHaveTextContent('Delete');
      expect(deleteButton).not.toBeDisabled();

      // Start deletion
      await user.click(deleteButton);

      // During deletion, button should show loading state
      expect(deleteButton).toHaveTextContent('Deleting...');
      expect(deleteButton).toBeDisabled();
    });
  });

  describe('Watering Record Addition', () => {
    it('should await data refresh before showing success toast when adding records', async () => {
      const user = userEvent.setup();

      // Track the order of operations
      const operationOrder: string[] = [];

      // Mock loadWateringRecords to track when it's called
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(async () => {
            operationOrder.push('refresh-after-add-called');
            await new Promise(resolve => setTimeout(resolve, 50));
            operationOrder.push('refresh-after-add-completed');
            return Promise.resolve({ data: [...mockWateringRecords], error: null });
          })
        }))
      }));

      // Mock successful insertion
      const mockInsert = vi.fn(async () => {
        operationOrder.push('insert-completed');
        return Promise.resolve({ data: null, error: null });
      });

      // Mock toast to track when it's called
      const mockToastRecorded = vi.fn(() => {
        operationOrder.push('add-toast-shown');
      });

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'watering_records') {
          return {
            select: mockSelect,
            insert: mockInsert,
            delete: vi.fn(() => ({
              eq: vi.fn(() => Promise.resolve({ data: null, error: null }))
            }))
          } as any;
        }
        return {
          select: mockSelect,
          delete: vi.fn(),
          insert: vi.fn(),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        } as any;
      });

      vi.mocked(wateringToast.recorded).mockImplementation(mockToastRecorded);

      render(
        <EditPlantDialog
          plant={mockPlant}
          isOpen={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      // Switch to watering history tab
      const wateringTab = screen.getByText('Watering History');
      await user.click(wateringTab);

      await waitFor(() => {
        expect(screen.getByTestId('watering-record-form')).toBeInTheDocument();
      });

      // Click add watering button
      const addButton = screen.getByTestId('add-watering-button');
      await user.click(addButton);

      // Wait for all operations to complete
      await waitFor(() => {
        expect(mockToastRecorded).toHaveBeenCalled();
      }, { timeout: 1000 });

      // Verify the order of operations
      expect(operationOrder).toEqual([
        'insert-completed',
        'refresh-after-add-called',
        'refresh-after-add-completed',
        'add-toast-shown'
      ]);

      // Verify toast is only shown after refresh is complete
      const toastIndex = operationOrder.indexOf('add-toast-shown');
      const refreshCompleteIndex = operationOrder.indexOf('refresh-after-add-completed');
      expect(toastIndex).toBeGreaterThan(refreshCompleteIndex);
    });
  });

  describe('Loading State Management', () => {
    it('should manage loading states correctly across multiple records', async () => {
      const user = userEvent.setup();

      // Mock slow deletion for testing
      const deleteDelay = 100;
      const mockDelete = vi.fn(() => ({
        eq: vi.fn(async () => {
          await new Promise(resolve => setTimeout(resolve, deleteDelay));
          return Promise.resolve({ data: null, error: null });
        })
      }));

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'watering_records') {
          return {
            select: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => Promise.resolve({
                  data: mockWateringRecords,
                  error: null
                }))
              }))
            })),
            delete: mockDelete,
            insert: vi.fn(() => Promise.resolve({ data: null, error: null }))
          } as any;
        }
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              order: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          })),
          delete: vi.fn(),
          insert: vi.fn(),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        } as any;
      });

      render(
        <EditPlantDialog
          plant={mockPlant}
          isOpen={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      // Switch to watering history tab
      const wateringTab = screen.getByText('Watering History');
      await user.click(wateringTab);

      await waitFor(() => {
        expect(screen.getByTestId('watering-records-list')).toBeInTheDocument();
      });

      // Get buttons for both records
      const deleteButton1 = screen.getByTestId('delete-watering-record-1');
      const deleteButton2 = screen.getByTestId('delete-watering-record-2');

      // Initially neither should be loading
      expect(deleteButton1).toHaveTextContent('Delete');
      expect(deleteButton2).toHaveTextContent('Delete');

      // Start deletion of first record
      await user.click(deleteButton1);

      // First button should be in loading state, second should not
      expect(deleteButton1).toHaveTextContent('Deleting...');
      expect(deleteButton1).toBeDisabled();
      expect(deleteButton2).toHaveTextContent('Delete');
      expect(deleteButton2).not.toBeDisabled();

      // Can still delete second record while first is processing
      await user.click(deleteButton2);

      // Both should now be in loading state
      expect(deleteButton1).toHaveTextContent('Deleting...');
      expect(deleteButton2).toHaveTextContent('Deleting...');
      expect(deleteButton1).toBeDisabled();
      expect(deleteButton2).toBeDisabled();
    });
  });

  describe('Error Recovery', () => {
    it('should still refresh UI even if deletion fails', async () => {
      const user = userEvent.setup();

      const mockSelect = vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: mockWateringRecords,
            error: null
          }))
        }))
      }));

      // Mock deletion failure
      const mockDelete = vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({
          data: null,
          error: new Error('Database error')
        }))
      }));

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'watering_records') {
          return {
            select: mockSelect,
            delete: mockDelete,
            insert: vi.fn(() => Promise.resolve({ data: null, error: null }))
          } as any;
        }
        return {
          select: mockSelect,
          delete: vi.fn(),
          insert: vi.fn(),
          update: vi.fn(() => ({
            eq: vi.fn(() => ({
              select: vi.fn(() => Promise.resolve({ data: [], error: null }))
            }))
          }))
        } as any;
      });

      render(
        <EditPlantDialog
          plant={mockPlant}
          isOpen={true}
          onClose={mockOnClose}
          onUpdate={mockOnUpdate}
        />
      );

      // Switch to watering history tab
      const wateringTab = screen.getByText('Watering History');
      await user.click(wateringTab);

      await waitFor(() => {
        expect(screen.getByTestId('watering-records-list')).toBeInTheDocument();
      });

      // Click delete button
      const deleteButton = screen.getByTestId('delete-watering-record-1');
      await user.click(deleteButton);

      // Wait for error handling
      await waitFor(() => {
        expect(wateringToast.error).toHaveBeenCalledWith('delete');
      });

      // Verify that loadWateringRecords was still called for UI consistency
      expect(mockSelect).toHaveBeenCalledTimes(2); // Once on mount, once on error refresh
    });
  });
});