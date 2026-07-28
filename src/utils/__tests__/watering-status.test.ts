/**
 * Tests for the canonical watering status formatter.
 *
 * The plant cards and the plant detail page both render through this, so these tests are
 * what stop the two surfaces from drifting apart again.
 */

import { describe, it, expect } from 'vitest';
import { getWateringStatus } from '../watering/status';
import { calculateWateringSchedule } from '../watering/schedule';
import { getStatusText, getStatusColor } from '@/components/plant-card/PlantCardBadgeUtils';
import { useStatusInfo } from '@/components/plant-details/usePlantStatusInfo';
import { renderHook } from '@testing-library/react';
import type { UserPlant } from '@/hooks/useUserPlants';

const NOW = new Date('2026-06-15T15:00:00Z');

function calc(overrides: Parameters<typeof calculateWateringSchedule>[0]) {
    return calculateWateringSchedule(overrides, { now: NOW });
}

describe('getWateringStatus', () => {
    it('labels an unknown schedule', () => {
        const status = getWateringStatus(calc({ latest_watering: null }), null, NOW);

        expect(status.text).toBe('Unknown schedule');
        expect(status.tone).toBe('unknown');
    });

    it('labels a pending postponement', () => {
        const status = getWateringStatus(
            calc({
                latest_watering: '2026-06-05T15:00:00Z',
                suggested_watering_days: 7,
                postponement_date: '2026-06-16T09:00:00Z',
            }),
            '2026-06-05T15:00:00Z',
            NOW
        );

        expect(status.text).toBe('Postponed until tomorrow');
        expect(status.tone).toBe('postponed');
    });

    it('uses singular wording for a single day overdue', () => {
        const status = getWateringStatus(
            calc({ latest_watering: '2026-06-07T15:00:00Z', suggested_watering_days: 7 }),
            '2026-06-07T15:00:00Z',
            NOW
        );

        expect(status.text).toBe('Overdue by 1 day');
        expect(status.tone).toBe('overdue');
    });

    it('uses plural wording for several days overdue', () => {
        const status = getWateringStatus(
            calc({ latest_watering: '2026-06-05T15:00:00Z', suggested_watering_days: 7 }),
            '2026-06-05T15:00:00Z',
            NOW
        );

        expect(status.text).toBe('Overdue by 3 days');
    });

    it('says "Due today" when due and not recently watered', () => {
        const lastWatered = '2026-06-08T09:00:00Z';
        const status = getWateringStatus(
            calc({ latest_watering: lastWatered, suggested_watering_days: 7 }),
            lastWatered,
            NOW
        );

        expect(status.text).toBe('Due today');
        expect(status.tone).toBe('due');
    });

    it('says "Watered today" when the plant was watered within the last 12 hours', () => {
        // A 0-day-interval plant watered 2 hours ago is technically due, but telling the user
        // that immediately after they watered it is confusing.
        const lastWatered = '2026-06-15T13:00:00Z';
        const status = getWateringStatus(
            { daysUntilWatering: 0, isOverdue: false, isPostponed: false, hasUnknownWateringDate: false },
            lastWatered,
            NOW
        );

        expect(status.text).toBe('Watered today');
        expect(status.tone).toBe('ok');
    });

    it('says "Water tomorrow" one day out', () => {
        const status = getWateringStatus(
            calc({ latest_watering: '2026-06-09T15:00:00Z', suggested_watering_days: 7 }),
            '2026-06-09T15:00:00Z',
            NOW
        );

        expect(status.text).toBe('Water tomorrow');
    });

    it('counts forward for plants not due yet', () => {
        const status = getWateringStatus(
            calc({ latest_watering: '2026-06-14T15:00:00Z', suggested_watering_days: 7 }),
            '2026-06-14T15:00:00Z',
            NOW
        );

        expect(status.text).toBe('Water in 6 days');
        expect(status.tone).toBe('ok');
    });
});

describe('status consistency across surfaces', () => {
    const cases: { name: string; plant: Partial<UserPlant> }[] = [
        { name: 'never watered', plant: { latest_watering: undefined } },
        {
            name: 'due today',
            plant: { latest_watering: '2026-06-08T09:00:00Z', suggested_watering_days: 7 },
        },
        {
            name: 'overdue',
            plant: { latest_watering: '2026-06-01T09:00:00Z', suggested_watering_days: 7 },
        },
        {
            name: 'pending postponement',
            plant: {
                latest_watering: '2026-06-01T09:00:00Z',
                suggested_watering_days: 7,
                postponement_date: '2026-06-18T09:00:00Z',
            },
        },
        {
            name: 'not due yet',
            plant: { latest_watering: '2026-06-14T09:00:00Z', suggested_watering_days: 7 },
        },
    ];

    it.each(cases)(
        'the card and the detail page agree for a plant that is $name',
        ({ plant }) => {
            const fullPlant = plant as UserPlant;
            const calculation = calculateWateringSchedule(fullPlant);

            const cardText = getStatusText(
                calculation.hasUnknownWateringDate,
                calculation.isOverdue,
                calculation.isPostponed,
                calculation.daysUntilWatering,
                fullPlant.latest_watering
            );
            const cardColor = getStatusColor(
                calculation.hasUnknownWateringDate,
                calculation.isOverdue,
                calculation.isPostponed,
                calculation.daysUntilWatering,
                fullPlant.latest_watering
            );

            const { result } = renderHook(() => useStatusInfo(fullPlant));
            const detailStatus = result.current();

            expect(detailStatus.text).toBe(cardText);
            expect(detailStatus.color).toBe(cardColor);
        }
    );
});
