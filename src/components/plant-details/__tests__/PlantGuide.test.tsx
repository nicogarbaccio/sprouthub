import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import PlantGuide from '../PlantGuide';
import { getCatalogPlant } from '@/data/plantData';
import { toleratedLightText, repotIntervalText, winterWateringText } from '@/utils/plants/careText';

describe('careText', () => {
    it('describes the range of tolerated light', () => {
        expect(
            toleratedLightText({ ideal: 'medium', tolerates: ['bright_indirect', 'low', 'medium'], directSun: 'avoid' })
        ).toBe('Low light to bright indirect light');
        expect(toleratedLightText({ ideal: 'direct', tolerates: ['direct'], directSun: 'full' })).toBeNull();
    });

    it('formats repotting intervals', () => {
        expect(repotIntervalText([1, 1])).toBe('Every year');
        expect(repotIntervalText([2, 2])).toBe('Every 2 years');
        expect(repotIntervalText([2, 3])).toBe('Every 2-3 years');
    });

    it('keeps winter intervals approximate, and flags the no-water placeholders', () => {
        expect(winterWateringText(14)).toBe('About every 14 days');
        expect(winterWateringText(90)).toMatch(/^Barely at all/);
    });
});

describe('PlantGuide', () => {
    it('shows every section for a researched plant', () => {
        render(<PlantGuide plant={getCatalogPlant('ZZ Plant')!} />);
        expect(screen.getByRole('heading', { name: 'Care details' })).toBeInTheDocument();
        expect(screen.getByText('Let the soil dry out completely between waterings')).toBeInTheDocument();
        expect(screen.getByText('Keep it above 60°F')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: "What's normal" })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Propagation' })).toBeInTheDocument();

        const pets = screen.getByRole('list', { name: 'Pet safety by animal' });
        expect(within(pets).getByText('Cats').nextSibling).toHaveTextContent('Toxic');
        expect(within(pets).getByText('Horses').nextSibling).toHaveTextContent('Unknown');
        expect(screen.getByRole('link', { name: '(888) 426-4435' })).toHaveAttribute('href', 'tel:+18884264435');
    });

    it('leaves out sections an unresearched plant has no data for', () => {
        render(<PlantGuide plant={getCatalogPlant('Pink Quill')!} showPetSummary />);
        expect(screen.queryByRole('heading', { name: 'Care details' })).not.toBeInTheDocument();
        expect(screen.queryByRole('heading', { name: "What's normal" })).not.toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Pet safety' })).toBeInTheDocument();
        expect(screen.getByText(/^Pet safety unknown/)).toBeInTheDocument();
        // No poison-control prompt when nothing is rated toxic
        expect(screen.queryByRole('link', { name: '(888) 426-4435' })).not.toBeInTheDocument();
    });

    it('only repeats the pet safety summary when asked', () => {
        const plant = getCatalogPlant('Calathea')!;
        const { rerender } = render(<PlantGuide plant={plant} />);
        expect(screen.queryByText(plant.toxicity!)).not.toBeInTheDocument();
        rerender(<PlantGuide plant={plant} showPetSummary />);
        expect(screen.getByText(plant.toxicity!)).toBeInTheDocument();
    });
});
