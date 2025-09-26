import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SeasonalReviewDialog } from '@/components/SeasonalReviewDialog';
import { SeasonalScheduleSuggestion } from '@/services/scheduleVersioningService';
import { Season } from '@/services/seasonalDetectionService';

describe('SeasonalReviewDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnApplySuggestion = vi.fn();
  const mockOnApplyAll = vi.fn();
  const mockOnCustomize = vi.fn();

  const mockSuggestions: SeasonalScheduleSuggestion[] = [
    {
      plant_id: 'plant-1',
      plant_nickname: 'Monstera Deliciosa',
      current_watering_days: 7,
      suggested_days: 5,
      confidence: 'high',
      reasoning: [
        'Spring growing season needs more frequent watering',
        'Indoor plant - less seasonal variation needed'
      ],
      based_on: 'weather_conditions'
    },
    {
      plant_id: 'plant-2',
      plant_nickname: 'Snake Plant',
      current_watering_days: 14,
      suggested_days: 16,
      confidence: 'medium',
      reasoning: [
        'Temperature cooling down in fall',
        'Plant type requires less water in cooler months'
      ],
      based_on: 'previous_year',
      previous_schedule: {
        year: 2024,
        days: 15,
        performance: 'good'
      }
    },
    {
      plant_id: 'plant-3',
      plant_nickname: 'Outdoor Rose',
      current_watering_days: 3,
      suggested_days: 2,
      confidence: 'low',
      reasoning: [
        'Hot summer weather',
        'Outdoor plant - more sensitive to seasonal changes'
      ],
      based_on: 'hybrid'
    }
  ];

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    season: 'spring' as Season,
    suggestions: mockSuggestions,
    isLoading: false,
    onApplySuggestion: mockOnApplySuggestion,
    onApplyAll: mockOnApplyAll,
    onCustomize: mockOnCustomize,
    appliedSuggestions: new Set<string>()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render dialog with correct title', () => {
      render(<SeasonalReviewDialog {...defaultProps} />);

      expect(screen.getByText('Spring Schedule Review')).toBeInTheDocument();
      expect(
        screen.getByText(/Review and update your plant watering schedules/i)
      ).toBeInTheDocument();
    });

    it('should render all plant suggestions', () => {
      render(<SeasonalReviewDialog {...defaultProps} />);

      expect(screen.getByText('Monstera Deliciosa')).toBeInTheDocument();
      expect(screen.getByText('Snake Plant')).toBeInTheDocument();
      expect(screen.getByText('Outdoor Rose')).toBeInTheDocument();
    });

    it('should display summary statistics correctly', () => {
      render(<SeasonalReviewDialog {...defaultProps} />);

      // Total plants
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('Total Plants')).toBeInTheDocument();

      // Applied (0 initially)
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('Updated')).toBeInTheDocument();

      // Pending (3 initially)
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });

    it('should display updated statistics when suggestions are applied', () => {
      const appliedSuggestions = new Set(['plant-1', 'plant-2']);
      render(<SeasonalReviewDialog {...defaultProps} appliedSuggestions={appliedSuggestions} />);

      // Updated count should be 2
      const updateCells = screen.getAllByText('2');
      expect(updateCells.length).toBeGreaterThan(0);

      // Pending count should be 1
      const pendingCells = screen.getAllByText('1');
      expect(pendingCells.length).toBeGreaterThan(0);
    });

    it('should not render when dialog is closed', () => {
      render(<SeasonalReviewDialog {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Spring Schedule Review')).not.toBeInTheDocument();
    });
  });

  describe('confidence badges', () => {
    it('should display confidence levels with correct styling', () => {
      render(<SeasonalReviewDialog {...defaultProps} />);

      const highBadge = screen.getByText('high');
      const mediumBadge = screen.getByText('medium');
      const lowBadge = screen.getByText('low');

      expect(highBadge).toBeInTheDocument();
      expect(mediumBadge).toBeInTheDocument();
      expect(lowBadge).toBeInTheDocument();

      // Check that badges have appropriate styling classes
      expect(highBadge.closest('.bg-green-100')).toBeInTheDocument();
      expect(mediumBadge.closest('.bg-yellow-100')).toBeInTheDocument();
      expect(lowBadge.closest('.bg-gray-100')).toBeInTheDocument();
    });

    it('should display based_on information', () => {
      render(<SeasonalReviewDialog {...defaultProps} />);

      expect(screen.getByText('weather conditions')).toBeInTheDocument();
      expect(screen.getByText('previous year')).toBeInTheDocument();
      expect(screen.getByText('hybrid')).toBeInTheDocument();
    });
  });

  describe('schedule changes display', () => {
    it('should show current and suggested schedules', () => {
      render(<SeasonalReviewDialog {...defaultProps} />);

      // Current schedules
      expect(screen.getByText('Every 7 days')).toBeInTheDocument();
      expect(screen.getByText('Every 14 days')).toBeInTheDocument();
      expect(screen.getByText('Every 3 days')).toBeInTheDocument();

      // Suggested schedules
      expect(screen.getByText('Every 5 days')).toBeInTheDocument();
      expect(screen.getByText('Every 16 days')).toBeInTheDocument();
      expect(screen.getByText('Every 2 days')).toBeInTheDocument();
    });

    it('should display change direction icons correctly', () => {
      render(<SeasonalReviewDialog {...defaultProps} />);

      // Should have trending down for 7->5 days (more frequent)
      // Should have trending up for 14->16 days (less frequent)
      // Should have trending down for 3->2 days (more frequent)

      const trendingIcons = screen.container.querySelectorAll('svg');
      expect(trendingIcons.length).toBeGreaterThan(0);
    });

    it('should show reasoning for each suggestion', () => {
      render(<SeasonalReviewDialog {...defaultProps} />);

      expect(screen.getByText('Spring growing season needs more frequent watering')).toBeInTheDocument();
      expect(screen.getByText('Temperature cooling down in fall')).toBeInTheDocument();
      expect(screen.getByText('Hot summer weather')).toBeInTheDocument();
      expect(screen.getByText('Outdoor plant - more sensitive to seasonal changes')).toBeInTheDocument();
    });

    it('should display previous schedule performance when available', () => {
      render(<SeasonalReviewDialog {...defaultProps} />);

      expect(screen.getByText('Last Year')).toBeInTheDocument();
      expect(screen.getByText('15 days (good performance)')).toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('should call onClose when close button is clicked', async () => {
      const user = userEvent.setup();
      render(<SeasonalReviewDialog {...defaultProps} />);

      const closeButton = screen.getByText('Close');
      await user.click(closeButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should apply individual suggestions', async () => {
      const user = userEvent.setup();
      render(<SeasonalReviewDialog {...defaultProps} />);

      const applyButtons = screen.getAllByText('Apply Suggestion');
      await user.click(applyButtons[0]);

      expect(mockOnApplySuggestion).toHaveBeenCalledWith('plant-1', 5);
    });

    it('should apply all suggestions at once', async () => {
      const user = userEvent.setup();
      render(<SeasonalReviewDialog {...defaultProps} />);

      const applyAllButton = screen.getByText('Apply All (3)');
      await user.click(applyAllButton);

      expect(mockOnApplyAll).toHaveBeenCalledTimes(1);
    });

    it('should not show apply all button when no unapplied suggestions', () => {
      const allApplied = new Set(['plant-1', 'plant-2', 'plant-3']);
      render(<SeasonalReviewDialog {...defaultProps} appliedSuggestions={allApplied} />);

      expect(screen.queryByText(/Apply All/)).not.toBeInTheDocument();
    });
  });

  describe('customization mode', () => {
    it('should enter customization mode when customize button is clicked', async () => {
      const user = userEvent.setup();
      render(<SeasonalReviewDialog {...defaultProps} />);

      const customizeButton = screen.getAllByText('Customize')[0];
      await user.click(customizeButton);

      expect(screen.getByDisplayValue('5')).toBeInTheDocument(); // Input with suggested value
      expect(screen.getByText('Apply Custom')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should allow changing custom values', async () => {
      const user = userEvent.setup();
      render(<SeasonalReviewDialog {...defaultProps} />);

      // Enter customization mode
      const customizeButton = screen.getAllByText('Customize')[0];
      await user.click(customizeButton);

      // Change the value
      const input = screen.getByDisplayValue('5');
      await user.clear(input);
      await user.type(input, '8');

      expect(input).toHaveValue(8);
    });

    it('should apply custom values', async () => {
      const user = userEvent.setup();
      render(<SeasonalReviewDialog {...defaultProps} />);

      // Enter customization mode
      const customizeButton = screen.getAllByText('Customize')[0];
      await user.click(customizeButton);

      // Change the value
      const input = screen.getByDisplayValue('5');
      await user.clear(input);
      await user.type(input, '8');

      // Apply custom value
      const applyCustomButton = screen.getByText('Apply Custom');
      await user.click(applyCustomButton);

      expect(mockOnCustomize).toHaveBeenCalledWith('plant-1', 8);
    });

    it('should cancel customization mode', async () => {
      const user = userEvent.setup();
      render(<SeasonalReviewDialog {...defaultProps} />);

      // Enter customization mode
      const customizeButton = screen.getAllByText('Customize')[0];
      await user.click(customizeButton);

      // Cancel customization
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(screen.queryByText('Apply Custom')).not.toBeInTheDocument();
      expect(screen.getByText('Apply Suggestion')).toBeInTheDocument();
    });

    it('should validate custom input values', async () => {
      const user = userEvent.setup();
      render(<SeasonalReviewDialog {...defaultProps} />);

      // Enter customization mode
      const customizeButton = screen.getAllByText('Customize')[0];
      await user.click(customizeButton);

      // Try invalid values
      const input = screen.getByDisplayValue('5');

      // Test minimum boundary (0 should be rejected)
      await user.clear(input);
      await user.type(input, '0');
      expect(input).toHaveValue(5); // Should not change

      // Test maximum boundary (31 should be rejected)
      await user.clear(input);
      await user.type(input, '31');
      expect(input).toHaveValue(5); // Should not change

      // Test valid value
      await user.clear(input);
      await user.type(input, '10');
      expect(input).toHaveValue(10); // Should accept
    });
  });

  describe('applied suggestions display', () => {
    it('should show applied state for completed suggestions', () => {
      const appliedSuggestions = new Set(['plant-1']);
      render(<SeasonalReviewDialog {...defaultProps} appliedSuggestions={appliedSuggestions} />);

      // Find the applied suggestion card
      const monsteraCard = screen.getByText('Monstera Deliciosa').closest('.opacity-75');
      expect(monsteraCard).toBeInTheDocument();

      // Should show "Applied" status
      expect(screen.getByText('Applied')).toBeInTheDocument();

      // Should show check icon
      const checkIcons = screen.container.querySelectorAll('svg');
      const hasCheckIcon = Array.from(checkIcons).some(icon =>
        icon.classList.contains('text-green-500') || icon.classList.contains('text-green-600')
      );
      expect(hasCheckIcon).toBe(true);
    });

    it('should not show action buttons for applied suggestions', () => {
      const appliedSuggestions = new Set(['plant-1']);
      render(<SeasonalReviewDialog {...defaultProps} appliedSuggestions={appliedSuggestions} />);

      const applyButtons = screen.getAllByText('Apply Suggestion');

      // Should have fewer apply buttons (only for unapplied suggestions)
      expect(applyButtons).toHaveLength(2); // Only for plant-2 and plant-3
    });
  });

  describe('loading states', () => {
    it('should disable buttons when loading', () => {
      render(<SeasonalReviewDialog {...defaultProps} isLoading={true} />);

      const applyButtons = screen.getAllByText('Apply Suggestion');
      applyButtons.forEach(button => {
        expect(button).toBeDisabled();
      });

      const applyAllButton = screen.getByText(/Applying.../);
      expect(applyAllButton).toBeDisabled();
    });

    it('should show loading state in apply all button', () => {
      render(<SeasonalReviewDialog {...defaultProps} isLoading={true} />);

      expect(screen.getByText('Applying...')).toBeInTheDocument();

      // Should show loading spinner
      const loadingIcon = screen.container.querySelector('.animate-spin');
      expect(loadingIcon).toBeInTheDocument();
    });

    it('should disable custom apply button when loading', async () => {
      const user = userEvent.setup();
      render(<SeasonalReviewDialog {...defaultProps} isLoading={true} />);

      // Enter customization mode
      const customizeButton = screen.getAllByText('Customize')[0];
      await user.click(customizeButton);

      const applyCustomButton = screen.getByText('Apply Custom');
      expect(applyCustomButton).toBeDisabled();
    });
  });

  describe('empty states', () => {
    it('should handle empty suggestions list', () => {
      render(<SeasonalReviewDialog {...defaultProps} suggestions={[]} />);

      expect(screen.getByText('Spring Schedule Review')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // Total plants count
      expect(screen.queryByText('Apply All')).not.toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper dialog attributes', () => {
      render(<SeasonalReviewDialog {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();
      expect(dialog).toHaveAttribute('aria-labelledby');
      expect(dialog).toHaveAttribute('aria-describedby');
    });

    it('should have proper labels for inputs', async () => {
      const user = userEvent.setup();
      render(<SeasonalReviewDialog {...defaultProps} />);

      // Enter customization mode
      const customizeButton = screen.getAllByText('Customize')[0];
      await user.click(customizeButton);

      const input = screen.getByLabelText('Custom days');
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute('type', 'number');
      expect(input).toHaveAttribute('min', '1');
      expect(input).toHaveAttribute('max', '30');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<SeasonalReviewDialog {...defaultProps} />);

      // Tab to first apply button
      await user.tab();
      const firstButton = screen.getAllByText('Apply Suggestion')[0];
      expect(firstButton).toHaveFocus();

      // Press Enter to activate
      await user.keyboard('{Enter}');
      expect(mockOnApplySuggestion).toHaveBeenCalledWith('plant-1', 5);
    });
  });

  describe('season display', () => {
    it('should capitalize season name correctly', () => {
      render(<SeasonalReviewDialog {...defaultProps} season="summer" />);
      expect(screen.getByText('Summer Schedule Review')).toBeInTheDocument();
    });

    it('should work with all season types', () => {
      const seasons: Season[] = ['spring', 'summer', 'fall', 'winter'];

      seasons.forEach(season => {
        const { unmount } = render(<SeasonalReviewDialog {...defaultProps} season={season} />);
        const expectedTitle = season.charAt(0).toUpperCase() + season.slice(1) + ' Schedule Review';
        expect(screen.getByText(expectedTitle)).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe('async operations', () => {
    it('should handle async apply suggestion', async () => {
      const user = userEvent.setup();
      mockOnApplySuggestion.mockResolvedValueOnce(undefined);

      render(<SeasonalReviewDialog {...defaultProps} />);

      const applyButton = screen.getAllByText('Apply Suggestion')[0];
      await user.click(applyButton);

      await waitFor(() => {
        expect(mockOnApplySuggestion).toHaveBeenCalledWith('plant-1', 5);
      });
    });

    it('should handle async apply all', async () => {
      const user = userEvent.setup();
      mockOnApplyAll.mockResolvedValueOnce(undefined);

      render(<SeasonalReviewDialog {...defaultProps} />);

      const applyAllButton = screen.getByText('Apply All (3)');
      await user.click(applyAllButton);

      await waitFor(() => {
        expect(mockOnApplyAll).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle async customize', async () => {
      const user = userEvent.setup();
      mockOnCustomize.mockResolvedValueOnce(undefined);

      render(<SeasonalReviewDialog {...defaultProps} />);

      // Enter customization mode and apply custom value
      const customizeButton = screen.getAllByText('Customize')[0];
      await user.click(customizeButton);

      const input = screen.getByDisplayValue('5');
      await user.clear(input);
      await user.type(input, '8');

      const applyCustomButton = screen.getByText('Apply Custom');
      await user.click(applyCustomButton);

      await waitFor(() => {
        expect(mockOnCustomize).toHaveBeenCalledWith('plant-1', 8);
      });
    });
  });
});