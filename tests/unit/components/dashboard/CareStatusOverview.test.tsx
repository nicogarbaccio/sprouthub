import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CareStatusOverview } from '@/components/dashboard/CareStatusOverview';

describe('CareStatusOverview', () => {
  const defaultProps = {
    totalPlants: 10,
    plantsNeedingWaterToday: 3,
    overduePlants: 1,
    recentlyAddedCount: 2,
  };

  it('renders all four metric cards', () => {
    render(<CareStatusOverview {...defaultProps} />);

    expect(screen.getByText('Total Plants')).toBeInTheDocument();
    expect(screen.getByText('Need Water Today')).toBeInTheDocument();
    expect(screen.getByText('Overdue')).toBeInTheDocument();
    expect(screen.getByText('New This Week')).toBeInTheDocument();
  });

  it('displays correct total plants count', () => {
    render(<CareStatusOverview {...defaultProps} />);

    const totalPlantsCard = screen.getByText('Total Plants').closest('div');
    expect(totalPlantsCard).toHaveTextContent('10');
  });

  it('displays correct plants needing water count', () => {
    render(<CareStatusOverview {...defaultProps} />);

    const needWaterCard = screen.getByText('Need Water Today').closest('div');
    expect(needWaterCard).toHaveTextContent('3');
  });

  it('displays correct overdue plants count', () => {
    render(<CareStatusOverview {...defaultProps} />);

    const overdueCard = screen.getByText('Overdue').closest('div');
    expect(overdueCard).toHaveTextContent('1');
  });

  it('displays correct recently added count', () => {
    render(<CareStatusOverview {...defaultProps} />);

    const newThisWeekCard = screen.getByText('New This Week').closest('div');
    expect(newThisWeekCard).toHaveTextContent('2');
  });

  describe('Zero State', () => {
    it('handles all zeros gracefully', () => {
      render(
        <CareStatusOverview
          totalPlants={0}
          plantsNeedingWaterToday={0}
          overduePlants={0}
          recentlyAddedCount={0}
        />
      );

      expect(screen.getByText('Total Plants').closest('div')).toHaveTextContent('0');
      expect(screen.getByText('Need Water Today').closest('div')).toHaveTextContent('0');
      expect(screen.getByText('Overdue').closest('div')).toHaveTextContent('0');
      expect(screen.getByText('New This Week').closest('div')).toHaveTextContent('0');
    });
  });

  describe('Large Numbers', () => {
    it('handles large plant counts', () => {
      render(
        <CareStatusOverview
          totalPlants={999}
          plantsNeedingWaterToday={150}
          overduePlants={50}
          recentlyAddedCount={25}
        />
      );

      expect(screen.getByText('Total Plants').closest('div')).toHaveTextContent('999');
      expect(screen.getByText('Need Water Today').closest('div')).toHaveTextContent('150');
      expect(screen.getByText('Overdue').closest('div')).toHaveTextContent('50');
      expect(screen.getByText('New This Week').closest('div')).toHaveTextContent('25');
    });
  });

  describe('Critical Scenarios', () => {
    it('highlights when all plants are overdue', () => {
      render(
        <CareStatusOverview
          totalPlants={5}
          plantsNeedingWaterToday={5}
          overduePlants={5}
          recentlyAddedCount={0}
        />
      );

      const overdueCard = screen.getByText('Overdue').closest('div');
      expect(overdueCard).toHaveTextContent('5');
    });

    it('shows healthy garden state (no overdue, no water needed)', () => {
      render(
        <CareStatusOverview
          totalPlants={20}
          plantsNeedingWaterToday={0}
          overduePlants={0}
          recentlyAddedCount={5}
        />
      );

      expect(screen.getByText('Need Water Today').closest('div')).toHaveTextContent('0');
      expect(screen.getByText('Overdue').closest('div')).toHaveTextContent('0');
    });
  });
});
