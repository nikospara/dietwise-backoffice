import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import {
	type Recommendation,
	fetchRecommendations,
	revertExplanation,
	stageExplanation,
} from '@/recommendations/recommendations';
import { RecommendationsPage } from './RecommendationsPage';

vi.mock('@/recommendations/recommendations', () => ({
	fetchRecommendations: vi.fn(),
	stageExplanation: vi.fn(),
	revertExplanation: vi.fn(),
	LANGUAGES: ['EL', 'LT', 'NL'],
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const fetchRecommendationsMock = vi.mocked(fetchRecommendations);
const stageExplanationMock = vi.mocked(stageExplanation);
const revertExplanationMock = vi.mocked(revertExplanation);

const LIMITED_RECOMMENDATION: Recommendation = {
	id: '1',
	name: 'Decrease processed meat',
	componentForScoring: 'processed meat',
	weight: 'LIMITED',
	explanationForLlm: 'Cured and smoked red meat.',
	explanationChanged: false,
	version: 0,
	translations: { EL: 'PRESENT', LT: 'MISSING', NL: 'STAGED' },
};

const ENCOURAGED_RECOMMENDATION: Recommendation = {
	id: '2',
	name: 'Increase legumes',
	componentForScoring: 'legumes',
	weight: 'ENCOURAGED',
	explanationForLlm: null,
	explanationChanged: false,
	version: 0,
	translations: { EL: 'MISSING', LT: 'MISSING', NL: 'MISSING' },
};

const CHANGED_RECOMMENDATION: Recommendation = {
	...LIMITED_RECOMMENDATION,
	explanationForLlm: 'Staged explanation.',
	explanationChanged: true,
	version: 3,
};

describe('RecommendationsPage', () => {
	beforeEach(() => {
		fetchRecommendationsMock.mockReset();
		stageExplanationMock.mockReset();
		revertExplanationMock.mockReset();
	});

	it('renders one row per recommendation with its name, component and explanation', async () => {
		fetchRecommendationsMock.mockResolvedValue([LIMITED_RECOMMENDATION, ENCOURAGED_RECOMMENDATION]);

		render(<RecommendationsPage />);

		expect(await screen.findByText('Decrease processed meat')).not.toBeNull();
		expect(screen.getByText('processed meat')).not.toBeNull();
		expect(screen.getByDisplayValue('Cured and smoked red meat.')).not.toBeNull();
		expect(screen.getByText('Increase legumes')).not.toBeNull();
		expect(screen.getByText('legumes')).not.toBeNull();
	});

	it('shows a green thumbs-up for ENCOURAGED and a red thumbs-down for LIMITED', async () => {
		fetchRecommendationsMock.mockResolvedValue([LIMITED_RECOMMENDATION, ENCOURAGED_RECOMMENDATION]);

		render(<RecommendationsPage />);

		expect(await screen.findByLabelText('recommendations.weightLimited')).not.toBeNull();
		expect(screen.getByLabelText('recommendations.weightEncouraged')).not.toBeNull();
	});

	it('shows an empty editable explanation for a recommendation without one', async () => {
		fetchRecommendationsMock.mockResolvedValue([ENCOURAGED_RECOMMENDATION]);

		render(<RecommendationsPage />);

		const input = (await screen.findByLabelText('recommendations.explanationEditLabel')) as HTMLInputElement;
		expect(input.value).toBe('');
	});

	it('renders a translation chip per language', async () => {
		fetchRecommendationsMock.mockResolvedValue([LIMITED_RECOMMENDATION]);

		render(<RecommendationsPage />);

		await screen.findByText('Decrease processed meat');
		expect(screen.getByText('EL')).not.toBeNull();
		expect(screen.getByText('LT')).not.toBeNull();
		expect(screen.getByText('NL')).not.toBeNull();
	});

	it('stages an edited explanation against its base version and highlights it', async () => {
		fetchRecommendationsMock.mockResolvedValue([LIMITED_RECOMMENDATION]);
		stageExplanationMock.mockResolvedValue(1);

		render(<RecommendationsPage />);

		const input = (await screen.findByLabelText('recommendations.explanationEditLabel')) as HTMLInputElement;
		fireEvent.change(input, { target: { value: 'Processed and cured meats.' } });
		fireEvent.blur(input);

		await waitFor(() => expect(stageExplanationMock).toHaveBeenCalledWith('1', 'Processed and cured meats.', 0));
		const highlighted = (await screen.findByLabelText('recommendations.explanationEditLabel')) as HTMLInputElement;
		expect(highlighted.className).toContain('bg-warning');
	});

	it('offers revert for a changed explanation and reverts it against the staged version', async () => {
		fetchRecommendationsMock
			.mockResolvedValueOnce([CHANGED_RECOMMENDATION])
			.mockResolvedValueOnce([LIMITED_RECOMMENDATION]);
		revertExplanationMock.mockResolvedValue(undefined);

		render(<RecommendationsPage />);

		fireEvent.click(await screen.findByText('recommendations.revert'));

		await waitFor(() => expect(revertExplanationMock).toHaveBeenCalledWith('1', 3));
	});

	it('warns and refreshes the grid when a save is rejected as stale', async () => {
		fetchRecommendationsMock.mockResolvedValue([LIMITED_RECOMMENDATION]);
		stageExplanationMock.mockRejectedValue(new ApiError(409, 'conflict'));

		render(<RecommendationsPage />);

		const input = (await screen.findByLabelText('recommendations.explanationEditLabel')) as HTMLInputElement;
		fireEvent.change(input, { target: { value: 'Changed.' } });
		fireEvent.blur(input);

		expect(await screen.findByText('recommendations.staleReload')).not.toBeNull();
		await waitFor(() => expect(fetchRecommendationsMock).toHaveBeenCalledTimes(2));
	});

	it('shows an error message when loading fails', async () => {
		fetchRecommendationsMock.mockRejectedValue(new Error('boom'));

		render(<RecommendationsPage />);

		expect(await screen.findByText('recommendations.loadError')).not.toBeNull();
	});
});
