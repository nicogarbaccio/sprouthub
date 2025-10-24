import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SeasonalReviewBanner } from '@/components/SeasonalReviewBanner';
import { SeasonalTransition, Season } from '@/services/seasonalDetectionService';
import { mockSeasonalTransitions } from '../../utils/mock-plant-data';

describe('SeasonalReviewBanner', () => {
  const mockOnReviewClick = vi.fn();
  const mockOnDismiss = vi.fn();
  const mockOnSnooze = vi.fn();

  const createMockTransition = (
    fromSeason: Season,
    toSeason: Season,
    confidence: 'high' | 'medium' | 'low' = 'high',
    factors: string[] = ['Test factor']
  ): SeasonalTransition => ({
    from_season: fromSeason,
    to_season: toSeason,
    transition_date: new Date('2025-09-10T12:00:00Z'),
    confidence,
    triggering_factors: factors
  });

  const defaultProps = {
    transition: mockSeasonalTransitions.summerToFall,
    plantsNeedingReview: 3,
    onReviewClick: mockOnReviewClick,
    onDismiss: mockOnDismiss,
    onSnooze: mockOnSnooze
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render with correct season message', () => {
      render(<SeasonalReviewBanner {...defaultProps} />);

      expect(screen.getByText('🍂 Fall has arrived!')).toBeInTheDocument();
    });

    it('should display correct plant count with singular form', () => {
      render(<SeasonalReviewBanner {...defaultProps} plantsNeedingReview={1} />);

      expect(screen.getByText(/1 plant needs seasonal/)).toBeInTheDocument();
    });

    it('should display correct plant count with plural form', () => {
      render(<SeasonalReviewBanner {...defaultProps} plantsNeedingReview={5} />);

      expect(screen.getByText(/5 plants need seasonal/)).toBeInTheDocument();
    });

    it('should show confidence badge', () => {
      render(<SeasonalReviewBanner {...defaultProps} />);

      expect(screen.getByText('high confidence')).toBeInTheDocument();
    });

    it('should display triggering factors when available', () => {
      const transition = createMockTransition('summer', 'fall', 'high', [
        'Daylight hours below 12 hours',
        'Temperature below 18°C with falling trend'
      ]);

      render(<SeasonalReviewBanner {...defaultProps} transition={transition} />);

      expect(screen.getByText('Detected changes:')).toBeInTheDocument();
      expect(screen.getByText(/Daylight hours below 12 hours.*Temperature below 18°C/)).toBeInTheDocument();
    });

    it('should not show triggering factors when none available', () => {
      const transition = createMockTransition('summer', 'fall', 'high', []);

      render(<SeasonalReviewBanner {...defaultProps} transition={transition} />);

      expect(screen.queryByText('Detected changes:')).not.toBeInTheDocument();
    });
  });

  describe('season-specific styling and icons', () => {
    // Parameterized test for all seasons
    it.each([
      {
        season: 'spring',
        fromSeason: 'winter',
        emoji: '🌸',
        textClass: 'text-green-600',
        bgClass: 'bg-green-50',
        borderClass: 'border-green-200'
      },
      {
        season: 'summer',
        fromSeason: 'spring',
        emoji: '☀️',
        textClass: 'text-yellow-600',
        bgClass: 'bg-yellow-50',
        borderClass: 'border-yellow-200'
      },
      {
        season: 'fall',
        fromSeason: 'summer',
        emoji: '🍂',
        textClass: 'text-orange-600',
        bgClass: 'bg-orange-50',
        borderClass: 'border-orange-200'
      },
      {
        season: 'winter',
        fromSeason: 'fall',
        emoji: '❄️',
        textClass: 'text-blue-600',
        bgClass: 'bg-blue-50',
        borderClass: 'border-blue-200'
      }
    ])('should display $season styling and emoji', ({ season, fromSeason, emoji, textClass, bgClass, borderClass }) => {
      const transition = createMockTransition(fromSeason as any, season as any);
      render(<SeasonalReviewBanner {...defaultProps} transition={transition} />);

      // Check for season-specific emoji and text
      const seasonCapitalized = season.charAt(0).toUpperCase() + season.slice(1);
      expect(screen.getByText(`${emoji} ${seasonCapitalized} has arrived!`)).toBeInTheDocument();

      // Check for season-specific styling
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass(textClass, bgClass, borderClass);
    });
  });

  describe('confidence level styling', () => {
    // Parameterized test for all confidence levels
    it.each([
      {
        confidence: 'high',
        bgClass: 'bg-green-100',
        textClass: 'text-green-800'
      },
      {
        confidence: 'medium',
        bgClass: 'bg-yellow-100',
        textClass: 'text-yellow-800'
      },
      {
        confidence: 'low',
        bgClass: 'bg-gray-100',
        textClass: 'text-gray-800'
      }
    ])('should display $confidence confidence with appropriate styling', ({ confidence, bgClass, textClass }) => {
      const transition = createMockTransition('summer', 'fall', confidence as any);
      render(<SeasonalReviewBanner {...defaultProps} transition={transition} />);

      const badge = screen.getByText(`${confidence} confidence`);
      expect(badge).toHaveClass(bgClass, textClass);
    });
  });

  describe('user interactions', () => {
    it('should call onReviewClick when review button is clicked', async () => {
      const user = userEvent.setup();
      render(<SeasonalReviewBanner {...defaultProps} />);

      const reviewButton = screen.getByText('Review Schedules');
      await user.click(reviewButton);

      expect(mockOnReviewClick).toHaveBeenCalledTimes(1);
    });

    it('should call onDismiss when dismiss button is clicked', async () => {
      const user = userEvent.setup();
      render(<SeasonalReviewBanner {...defaultProps} />);

      const dismissButton = screen.getByRole('button', { name: /close|dismiss/i });
      await user.click(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should call onSnooze with 1 week when 1 week button is clicked', async () => {
      const user = userEvent.setup();
      render(<SeasonalReviewBanner {...defaultProps} />);

      const oneWeekButton = screen.getByText('1 week');
      await user.click(oneWeekButton);

      expect(mockOnSnooze).toHaveBeenCalledWith(1);
    });

    it('should call onSnooze with 2 weeks when 2 weeks button is clicked', async () => {
      const user = userEvent.setup();
      render(<SeasonalReviewBanner {...defaultProps} />);

      const twoWeeksButton = screen.getByText('2 weeks');
      await user.click(twoWeeksButton);

      expect(mockOnSnooze).toHaveBeenCalledWith(2);
    });
  });

  describe('accessibility', () => {
    it('should have proper alert role', () => {
      render(<SeasonalReviewBanner {...defaultProps} />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();
    });

    it('should have accessible button labels', () => {
      render(<SeasonalReviewBanner {...defaultProps} />);

      expect(screen.getByRole('button', { name: /review schedules/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /1 week/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /2 weeks/i })).toBeInTheDocument();
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<SeasonalReviewBanner {...defaultProps} />);

      // Tab to review button
      await user.tab();
      const reviewButton = screen.getByText('Review Schedules');
      expect(reviewButton).toHaveFocus();

      // Press Enter to activate
      await user.keyboard('{Enter}');
      expect(mockOnReviewClick).toHaveBeenCalledTimes(1);

      // Tab to snooze buttons
      await user.tab();
      const oneWeekButton = screen.getByText('1 week');
      expect(oneWeekButton).toHaveFocus();

      await user.keyboard('{Enter}');
      expect(mockOnSnooze).toHaveBeenCalledWith(1);
    });
  });

  describe('visual elements', () => {
    it('should display appropriate icons', () => {
      render(<SeasonalReviewBanner {...defaultProps} />);

      // Check for presence of icon elements (using class selectors since icons are SVGs)
      const icons = screen.container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);

      // Should have various icons: season icon, droplets, calendar, clock, X
      const iconClasses = Array.from(icons).map(icon => icon.className);
      const hasSeasonIcon = iconClasses.some(className => className.includes('h-6 w-6'));
      const hasDropletsIcon = iconClasses.some(className => className.includes('h-4 w-4'));

      expect(hasSeasonIcon).toBe(true);
      expect(hasDropletsIcon).toBe(true);
    });

    it('should have proper layout structure', () => {
      render(<SeasonalReviewBanner {...defaultProps} />);

      // Should have main content area and dismiss button
      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('border-l-4'); // Left border styling

      // Should have button group layout
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4); // Review, 1 week, 2 weeks, dismiss
    });
  });

  describe('edge cases and data handling', () => {
    it('should handle zero plants needing review', () => {
      render(<SeasonalReviewBanner {...defaultProps} plantsNeedingReview={0} />);

      expect(screen.getByText(/0 plants need seasonal/)).toBeInTheDocument();
    });

    it('should handle large numbers of plants', () => {
      render(<SeasonalReviewBanner {...defaultProps} plantsNeedingReview={100} />);

      expect(screen.getByText(/100 plants need seasonal/)).toBeInTheDocument();
    });

    it('should handle long triggering factors list', () => {
      const transition = createMockTransition('summer', 'fall', 'high', [
        'Very long triggering factor description that might wrap to multiple lines',
        'Another factor with detailed explanation about weather conditions',
        'Third factor describing plant-specific requirements'
      ]);

      render(<SeasonalReviewBanner {...defaultProps} transition={transition} />);

      expect(screen.getByText('Detected changes:')).toBeInTheDocument();
      // Should display all factors joined by commas
      expect(screen.getByText(/Very long triggering factor.*Another factor.*Third factor/)).toBeInTheDocument();
    });

    it('should handle single triggering factor', () => {
      const transition = createMockTransition('summer', 'fall', 'high', [
        'Single triggering factor'
      ]);

      render(<SeasonalReviewBanner {...defaultProps} transition={transition} />);

      expect(screen.getByText('Detected changes:')).toBeInTheDocument();
      expect(screen.getByText('Single triggering factor')).toBeInTheDocument();
    });
  });

  describe('responsive behavior', () => {
    it('should have responsive layout classes', () => {
      render(<SeasonalReviewBanner {...defaultProps} />);

      const alert = screen.getByRole('alert');
      expect(alert).toBeInTheDocument();

      // Check for flex layout that should work on mobile
      const contentArea = alert.querySelector('.flex-1');
      expect(contentArea).toBeInTheDocument();

      const buttonArea = alert.querySelector('.flex-wrap');
      expect(buttonArea).toBeInTheDocument();
    });
  });

  describe('banner styling consistency', () => {
    it('should maintain consistent spacing and borders', () => {
      render(<SeasonalReviewBanner {...defaultProps} />);

      const alert = screen.getByRole('alert');
      expect(alert).toHaveClass('mb-6'); // Bottom margin
      expect(alert).toHaveClass('border-l-4'); // Left border

      // Should have proper internal spacing
      expect(alert.querySelector('.space-x-3')).toBeInTheDocument();
      expect(alert.querySelector('.space-x-2')).toBeInTheDocument();
    });

    it('should have proper button styling for different types', () => {
      render(<SeasonalReviewBanner {...defaultProps} />);

      const reviewButton = screen.getByText('Review Schedules');
      expect(reviewButton).toHaveClass('bg-white/80');

      const snoozeButtons = screen.getAllByText(/week/);
      snoozeButtons.forEach(button => {
        expect(button.closest('button')).toHaveClass('opacity-75');
      });

      const dismissButton = screen.getByRole('button', { name: /close|dismiss/i });
      expect(dismissButton.closest('button')).toHaveClass('opacity-50');
    });
  });

  describe('test data compatibility', () => {
    it('should work with mock seasonal transitions from test utils', () => {
      render(<SeasonalReviewBanner {...defaultProps} transition={mockSeasonalTransitions.winterToSpring} />);

      expect(screen.getByText('🌸 Spring has arrived!')).toBeInTheDocument();
    });

    it('should work with different mock transitions', () => {
      Object.values(mockSeasonalTransitions).forEach((transition) => {
        const { unmount } = render(<SeasonalReviewBanner {...defaultProps} transition={transition} />);

        // Should render without errors for each transition type
        expect(screen.getByRole('alert')).toBeInTheDocument();

        unmount();
      });
    });
  });
});