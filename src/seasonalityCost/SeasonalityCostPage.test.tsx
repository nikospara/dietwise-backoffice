import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import { SeasonalityCostPage, formatSeasonality, parseSeasonality } from './SeasonalityCostPage';
import {
	type SeasonalityCell,
	type SeasonalityCostGrid,
	fetchSeasonalityCostGrid,
	stageCost,
	stageSeasonality,
} from './seasonalityCost';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('./seasonalityCost', () => ({
	fetchSeasonalityCostGrid: vi.fn(),
	stageSeasonality: vi.fn(),
	stageCost: vi.fn(),
}));

const fetchGridMock = vi.mocked(fetchSeasonalityCostGrid);
const stageSeasonalityMock = vi.mocked(stageSeasonality);
const stageCostMock = vi.mocked(stageCost);

function gridFixture(): SeasonalityCostGrid {
	return {
		countries: ['BE', 'GR', 'LT'],
		rows: [
			{
				id: 'ai-lentils',
				name: 'Lentils',
				published: true,
				seasonality: {
					BE: { monthFrom: 3, monthTo: 5, staged: false, version: 0 },
					GR: { monthFrom: null, monthTo: null, staged: false, version: 0 },
					LT: { monthFrom: 8, monthTo: 8, staged: true, version: 1 },
				},
				cost: {
					BE: { cost: 'LO', staged: false, version: 0 },
					GR: { cost: null, staged: false, version: 0 },
					LT: { cost: 'HI', staged: true, version: 1 },
				},
			},
			{
				id: 'ai-tofu',
				name: 'Tofu',
				published: false,
				seasonality: {
					BE: { monthFrom: null, monthTo: null, staged: false, version: 0 },
					GR: { monthFrom: null, monthTo: null, staged: false, version: 0 },
					LT: { monthFrom: null, monthTo: null, staged: false, version: 0 },
				},
				cost: {
					BE: { cost: null, staged: false, version: 0 },
					GR: { cost: null, staged: false, version: 0 },
					LT: { cost: null, staged: false, version: 0 },
				},
			},
		],
	};
}

function seasonalityInput(name: string, country: string): HTMLInputElement {
	return screen.getByLabelText(`seasonalityCost.seasonalityCell ${name} ${country}`) as HTMLInputElement;
}

function costSelect(name: string, country: string): HTMLSelectElement {
	return screen.getByLabelText(`seasonalityCost.costCell ${name} ${country}`) as HTMLSelectElement;
}

describe('parseSeasonality', () => {
	it('accepts a single month as an equal range', () => {
		expect(parseSeasonality('8')).toEqual({ monthFrom: 8, monthTo: 8 });
	});

	it('accepts a plain range and a wrap-around range', () => {
		expect(parseSeasonality('1-5')).toEqual({ monthFrom: 1, monthTo: 5 });
		expect(parseSeasonality('11-2')).toEqual({ monthFrom: 11, monthTo: 2 });
	});

	it('treats an empty string as a clear', () => {
		expect(parseSeasonality('')).toEqual({ monthFrom: null, monthTo: null });
		expect(parseSeasonality('   ')).toEqual({ monthFrom: null, monthTo: null });
	});

	it('rejects months out of 1..12 and malformed input', () => {
		expect(parseSeasonality('0')).toBeNull();
		expect(parseSeasonality('13')).toBeNull();
		expect(parseSeasonality('3-13')).toBeNull();
		expect(parseSeasonality('1-')).toBeNull();
		expect(parseSeasonality('1-2-3')).toBeNull();
		expect(parseSeasonality('abc')).toBeNull();
	});
});

describe('formatSeasonality', () => {
	it('renders a range and an equal range, empty when there is no value', () => {
		expect(formatSeasonality({ monthFrom: 3, monthTo: 5, staged: false, version: 0 })).toBe('3-5');
		expect(formatSeasonality({ monthFrom: 8, monthTo: 8, staged: false, version: 0 })).toBe('8-8');
		expect(formatSeasonality({ monthFrom: null, monthTo: null, staged: false, version: 0 })).toBe('');
	});

	it('renders empty (never "undefined") when the backend omits the null month fields', () => {
		expect(formatSeasonality({ staged: false, version: 0 } as unknown as SeasonalityCell)).toBe('');
	});
});

describe('SeasonalityCostPage', () => {
	beforeEach(() => {
		fetchGridMock.mockReset().mockResolvedValue(gridFixture());
		stageSeasonalityMock.mockReset().mockResolvedValue(undefined);
		stageCostMock.mockReset().mockResolvedValue(undefined);
	});

	it('renders effective values, empty cells and staged highlighting', async () => {
		render(<SeasonalityCostPage />);

		expect(
			((await screen.findByLabelText('seasonalityCost.seasonalityCell Lentils BE')) as HTMLInputElement).value,
		).toBe('3-5');
		expect(seasonalityInput('Lentils', 'GR').value).toBe('');
		expect(seasonalityInput('Lentils', 'LT').value).toBe('8-8');
		expect(seasonalityInput('Lentils', 'LT').className).toContain('bg-warning');
		expect(seasonalityInput('Lentils', 'BE').className).not.toContain('bg-warning');

		expect(costSelect('Lentils', 'BE').value).toBe('LO');
		expect(costSelect('Lentils', 'GR').value).toBe('');
		expect(costSelect('Lentils', 'LT').value).toBe('HI');
		expect(costSelect('Lentils', 'LT').className).toContain('bg-warning');
	});

	it('stages a valid seasonality edit and reloads', async () => {
		render(<SeasonalityCostPage />);
		const input = await screen.findByLabelText('seasonalityCost.seasonalityCell Lentils BE');

		fireEvent.change(input, { target: { value: '6-8' } });
		fireEvent.blur(input);

		await waitFor(() => expect(stageSeasonalityMock).toHaveBeenCalledWith('ai-lentils', 'BE', 6, 8, 0));
		await waitFor(() => expect(fetchGridMock).toHaveBeenCalledTimes(2));
	});

	it('reverts an invalid seasonality entry to the previous value without staging', async () => {
		render(<SeasonalityCostPage />);
		const input = (await screen.findByLabelText('seasonalityCost.seasonalityCell Lentils BE')) as HTMLInputElement;

		fireEvent.change(input, { target: { value: '13-14' } });
		fireEvent.blur(input);

		await waitFor(() => expect(input.value).toBe('3-5'));
		expect(stageSeasonalityMock).not.toHaveBeenCalled();
	});

	it('does not stage when a valid entry equals the current value', async () => {
		render(<SeasonalityCostPage />);
		const input = await screen.findByLabelText('seasonalityCost.seasonalityCell Lentils LT');

		fireEvent.change(input, { target: { value: '8' } });
		fireEvent.blur(input);

		await waitFor(() => expect((input as HTMLInputElement).value).toBe('8-8'));
		expect(stageSeasonalityMock).not.toHaveBeenCalled();
	});

	it('stages a cost change and reloads', async () => {
		render(<SeasonalityCostPage />);
		const select = await screen.findByLabelText('seasonalityCost.costCell Lentils GR');

		fireEvent.change(select, { target: { value: 'MED' } });

		await waitFor(() => expect(stageCostMock).toHaveBeenCalledWith('ai-lentils', 'GR', 'MED', 0));
		await waitFor(() => expect(fetchGridMock).toHaveBeenCalledTimes(2));
	});

	it('clears a cost to empty', async () => {
		render(<SeasonalityCostPage />);
		const select = await screen.findByLabelText('seasonalityCost.costCell Lentils BE');

		fireEvent.change(select, { target: { value: '' } });

		await waitFor(() => expect(stageCostMock).toHaveBeenCalledWith('ai-lentils', 'BE', null, 0));
	});

	it('warns and reloads on a 409 conflict', async () => {
		stageSeasonalityMock.mockRejectedValue(new ApiError(409, 'conflict'));
		render(<SeasonalityCostPage />);
		const input = await screen.findByLabelText('seasonalityCost.seasonalityCell Lentils BE');

		fireEvent.change(input, { target: { value: '6-8' } });
		fireEvent.blur(input);

		expect(await screen.findByText('seasonalityCost.staleReload')).not.toBeNull();
		await waitFor(() => expect(fetchGridMock).toHaveBeenCalledTimes(2));
	});

	it('shows a load error when the grid cannot be fetched', async () => {
		fetchGridMock.mockReset().mockRejectedValue(new Error('boom'));
		render(<SeasonalityCostPage />);

		expect(await screen.findByText('seasonalityCost.loadError')).not.toBeNull();
	});

	it('marks a Working-Copy-only ingredient as new', async () => {
		render(<SeasonalityCostPage />);
		await screen.findByLabelText('seasonalityCost.seasonalityCell Tofu BE');

		expect(screen.getByText('seasonalityCost.newBadge')).not.toBeNull();
	});
});
