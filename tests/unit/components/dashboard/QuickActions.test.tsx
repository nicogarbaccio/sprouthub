import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuickActions } from '@/components/dashboard/QuickActions';

describe('QuickActions', () => {
  const mockHandlers = {
    onAddPlantClick: vi.fn(),
    onWaterPlantsClick: vi.fn(),
    onViewAllPlantsClick: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Add Plant Button', () => {
    it('renders Add New Plant button', () => {
      render(<QuickActions plantsNeedingWaterCount={0} {...mockHandlers} />);

      expect(screen.getByRole('button', { name: /add new plant/i })).toBeInTheDocument();
    });

    it('calls onAddPlantClick when Add Plant button is clicked', async () => {
      const user = userEvent.setup();
      render(<QuickActions plantsNeedingWaterCount={0} {...mockHandlers} />);

      await user.click(screen.getByRole('button', { name: /add new plant/i }));

      expect(mockHandlers.onAddPlantClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Water Button - With Plants Needing Water', () => {
    it('shows water button text with plant count (singular)', () => {
      render(<QuickActions plantsNeedingWaterCount={1} {...mockHandlers} />);

      expect(screen.getByRole('button', { name: /water 1 plant/i })).toBeInTheDocument();
    });

    it('shows water button text with plant count (plural)', () => {
      render(<QuickActions plantsNeedingWaterCount={5} {...mockHandlers} />);

      expect(screen.getByRole('button', { name: /water 5 plants/i })).toBeInTheDocument();
    });

    it('calls onWaterPlantsClick when water button clicked with plants needing water', async () => {
      const user = userEvent.setup();
      render(<QuickActions plantsNeedingWaterCount={3} {...mockHandlers} />);

      await user.click(screen.getByRole('button', { name: /water 3 plants/i }));

      expect(mockHandlers.onWaterPlantsClick).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onViewAllPlantsClick).not.toHaveBeenCalled();
    });
  });

  describe('Water Button - No Plants Needing Water', () => {
    it('shows "View All Plants" when no plants need water', () => {
      render(<QuickActions plantsNeedingWaterCount={0} {...mockHandlers} />);

      expect(screen.getByRole('button', { name: /view all plants/i })).toBeInTheDocument();
    });

    it('calls onViewAllPlantsClick when clicked with no plants needing water', async () => {
      const user = userEvent.setup();
      render(<QuickActions plantsNeedingWaterCount={0} {...mockHandlers} />);

      await user.click(screen.getByRole('button', { name: /view all plants/i }));

      expect(mockHandlers.onViewAllPlantsClick).toHaveBeenCalledTimes(1);
      expect(mockHandlers.onWaterPlantsClick).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('handles zero plants needing water', () => {
      render(<QuickActions plantsNeedingWaterCount={0} {...mockHandlers} />);

      expect(screen.getByRole('button', { name: /view all plants/i })).toBeInTheDocument();
    });

    it('handles large number of plants needing water', () => {
      render(<QuickActions plantsNeedingWaterCount={999} {...mockHandlers} />);

      expect(screen.getByRole('button', { name: /water 999 plants/i })).toBeInTheDocument();
    });
  });
});
