import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SmartSuggestionsDialog, type PlantSuggestion } from '../SmartSuggestionsDialog';
import type { PatternInsight } from '@/types/wateringPatternTypes';

const postponementAdvice: PatternInsight = {
  type: 'postponement_pattern',
  severity: 'medium',
  title: 'Frequent Postponements Detected',
  description: "You've postponed watering 4 times recently.",
  actionable: true,
};

const scheduleChange: PatternInsight = {
  type: 'schedule_adjustment',
  severity: 'medium',
  title: 'Schedule Extension Suggested',
  description: 'Consider extending the schedule to 8 days.',
  actionable: true,
  suggestion: {
    currentSchedule: 6,
    suggestedSchedule: 8,
    adjustmentType: 'increase',
    confidence: 'high',
    reasoning: ['You usually water 2 days late'],
    potentialBenefits: [],
  },
};

function renderDialog(insights: PatternInsight[]) {
  const props = {
    isOpen: true,
    onClose: vi.fn(),
    plantSuggestions: [
      { plantId: 'p1', plantName: 'Disco Pothos', plantType: 'Pothos', insights },
    ] satisfies PlantSuggestion[],
    onApplyAllSuggestions: vi.fn().mockResolvedValue(undefined),
    onApplySuggestion: vi.fn().mockResolvedValue(undefined),
    onDismissAllSuggestions: vi.fn(),
    onDismissPlantSuggestions: vi.fn(),
    onViewPlantHistory: vi.fn(),
  };
  render(<SmartSuggestionsDialog {...props} />);
  return props;
}

describe('SmartSuggestionsDialog footer', () => {
  it('offers a single "Got it" when there is only advice to acknowledge', async () => {
    const props = renderDialog([postponementAdvice]);

    expect(screen.queryByRole('button', { name: 'Dismiss All' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Apply All/ })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: /Got it/ }));

    await waitFor(() => expect(props.onClose).toHaveBeenCalled());
    expect(props.onApplyAllSuggestions).toHaveBeenCalled();
  });

  it('offers Dismiss All and Apply All when there is a schedule change to apply', () => {
    renderDialog([scheduleChange]);

    expect(screen.getByRole('button', { name: 'Dismiss All' })).toBeTruthy();
    expect(screen.getByRole('button', { name: /Apply All/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Got it/ })).toBeNull();
  });
});
