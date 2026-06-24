import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import {
	type Recommendation,
	type RecommendationTranslationDetails,
	fetchRecommendations,
	fetchRecommendationTranslations,
	revertExplanation,
	revertRecommendationTranslation,
	stageExplanation,
	stageRecommendationTranslation,
} from '@/recommendations/recommendations';
import { RecommendationsPage } from './RecommendationsPage';

vi.mock('@/recommendations/recommendations', () => ({
	fetchRecommendations: vi.fn(),
	stageExplanation: vi.fn(),
	revertExplanation: vi.fn(),
	fetchRecommendationTranslations: vi.fn(),
	stageRecommendationTranslation: vi.fn(),
	revertRecommendationTranslation: vi.fn(),
	LANGUAGES: ['EL', 'LT', 'NL'],
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const fetchRecommendationsMock = vi.mocked(fetchRecommendations);
const stageExplanationMock = vi.mocked(stageExplanation);
const revertExplanationMock = vi.mocked(revertExplanation);
const fetchRecommendationTranslationsMock = vi.mocked(fetchRecommendationTranslations);
const stageRecommendationTranslationMock = vi.mocked(stageRecommendationTranslation);
const revertRecommendationTranslationMock = vi.mocked(revertRecommendationTranslation);

const TRANSLATIONS: Record<'EL' | 'LT' | 'NL', RecommendationTranslationDetails> = {
	EL: {
		name: 'Επεξεργασμένο κρέας',
		componentForScoring: 'επεξεργασμένο κρέας',
		explanationForLlm: 'Λιγότερο.',
		version: 2,
	},
	LT: { name: null, componentForScoring: null, explanationForLlm: null, version: 0 },
	NL: { name: null, componentForScoring: null, explanationForLlm: null, version: 0 },
};

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
		fetchRecommendationTranslationsMock.mockReset();
		stageRecommendationTranslationMock.mockReset();
		revertRecommendationTranslationMock.mockReset();
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

	it('opens the translations dialog from the chips and stages a language against its version', async () => {
		fetchRecommendationsMock.mockResolvedValue([LIMITED_RECOMMENDATION]);
		fetchRecommendationTranslationsMock.mockResolvedValue(TRANSLATIONS);
		stageRecommendationTranslationMock.mockResolvedValue(undefined);

		render(<RecommendationsPage />);

		fireEvent.click(await screen.findByLabelText('recommendations.editTranslations'));

		const greekName = (await screen.findByLabelText('EL recommendations.columnName')) as HTMLInputElement;
		expect(greekName.value).toBe('Επεξεργασμένο κρέας');
		fireEvent.change(greekName, { target: { value: 'Αλλαγή' } });
		fireEvent.click(screen.getAllByText('recommendations.translationSave')[0]);

		await waitFor(() =>
			expect(stageRecommendationTranslationMock).toHaveBeenCalledWith(
				'1',
				'EL',
				'Αλλαγή',
				'επεξεργασμένο κρέας',
				'Λιγότερο.',
				2,
			),
		);
	});

	it('reverts a staged language translation against its version', async () => {
		fetchRecommendationsMock.mockResolvedValue([LIMITED_RECOMMENDATION]);
		fetchRecommendationTranslationsMock.mockResolvedValue(TRANSLATIONS);
		revertRecommendationTranslationMock.mockResolvedValue(undefined);

		render(<RecommendationsPage />);

		fireEvent.click(await screen.findByLabelText('recommendations.editTranslations'));
		fireEvent.click(await screen.findByText('recommendations.translationRevert'));

		await waitFor(() => expect(revertRecommendationTranslationMock).toHaveBeenCalledWith('1', 'EL', 2));
	});

	it('warns and refreshes the grid when staging a translation is rejected as stale', async () => {
		fetchRecommendationsMock.mockResolvedValue([LIMITED_RECOMMENDATION]);
		fetchRecommendationTranslationsMock.mockResolvedValue(TRANSLATIONS);
		stageRecommendationTranslationMock.mockRejectedValue(new ApiError(409, 'conflict'));

		render(<RecommendationsPage />);

		fireEvent.click(await screen.findByLabelText('recommendations.editTranslations'));
		const greekName = (await screen.findByLabelText('EL recommendations.columnName')) as HTMLInputElement;
		fireEvent.change(greekName, { target: { value: 'Αλλαγή' } });
		fireEvent.click(screen.getAllByText('recommendations.translationSave')[0]);

		expect(await screen.findByText('recommendations.staleReload')).not.toBeNull();
		await waitFor(() => expect(fetchRecommendationsMock).toHaveBeenCalledTimes(2));
	});
});
