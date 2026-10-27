import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import WateringInsightLearnMore, { getLearnMoreContent } from '../WateringInsightLearnMore';
import type { PatternInsight } from '@/types/wateringPatternTypes';

// Every insight type that can appear without a schedule suggestion gets Dismiss + Learn More.
// A type missing here used to render a Learn More button that opened nothing.
const ADVICE_ONLY_TYPES: PatternInsight['type'][] = [
  'consistency_improvement',
  'overwatering_risk',
  'underwatering_risk',
  'postponement_pattern',
];

describe('WateringInsightLearnMore', () => {
  it.each(ADVICE_ONLY_TYPES)('has an article for %s', (type) => {
    expect(getLearnMoreContent(type)).not.toBeNull();
  });

  it('opens the frequent postponements article', () => {
    render(
      <WateringInsightLearnMore
        isOpen
        onClose={() => {}}
        plantName="Monstera"
        insight={{
          type: 'postponement_pattern',
          severity: 'medium',
          title: 'Frequent Postponements Detected',
          description: "You've postponed watering 3 times recently.",
          actionable: true,
        }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Understanding Frequent Postponements' })).toBeTruthy();
    expect(screen.getByText(/pushed back watering Monstera several times/)).toBeTruthy();
  });
});
