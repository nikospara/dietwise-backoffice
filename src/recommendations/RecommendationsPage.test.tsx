import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type Recommendation, fetchRecommendations } from '@/recommendations/recommendations';
import { RecommendationsPage } from './RecommendationsPage';

vi.mock('@/recommendations/recommendations', () => ({
	fetchRecommendations: vi.fn(),
	LANGUAGES: ['EL', 'LT', 'NL'],
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const fetchRecommendationsMock = vi.mocked(fetchRecommendations);

const LIMITED_RECOMMENDATION: Recommendation = {
	id: '1',
	name: 'Decrease processed meat',
	componentForScoring: 'processed meat',
	weight: 'LIMITED',
	explanationForLlm: 'Cured and smoked red meat.',
	translations: { EL: 'PRESENT', LT: 'MISSING', NL: 'STAGED' },
};

const ENCOURAGED_RECOMMENDATION: Recommendation = {
	id: '2',
	name: 'Increase legumes',
	componentForScoring: 'legumes',
	weight: 'ENCOURAGED',
	explanationForLlm: null,
	translations: { EL: 'MISSING', LT: 'MISSING', NL: 'MISSING' },
};

describe('RecommendationsPage', () => {
	beforeEach(() => {
		fetchRecommendationsMock.mockReset();
	});

	it('renders one row per recommendation with its name, component and explanation', async () => {
		fetchRecommendationsMock.mockResolvedValue([LIMITED_RECOMMENDATION, ENCOURAGED_RECOMMENDATION]);

		render(<RecommendationsPage />);

		expect(await screen.findByText('Decrease processed meat')).not.toBeNull();
		expect(screen.getByText('processed meat')).not.toBeNull();
		expect(screen.getByText('Cured and smoked red meat.')).not.toBeNull();
		expect(screen.getByText('Increase legumes')).not.toBeNull();
		expect(screen.getByText('legumes')).not.toBeNull();
	});

	it('shows a green thumbs-up for ENCOURAGED and a red thumbs-down for LIMITED', async () => {
		fetchRecommendationsMock.mockResolvedValue([LIMITED_RECOMMENDATION, ENCOURAGED_RECOMMENDATION]);

		render(<RecommendationsPage />);

		expect(await screen.findByLabelText('recommendations.weightLimited')).not.toBeNull();
		expect(screen.getByLabelText('recommendations.weightEncouraged')).not.toBeNull();
	});

	it('blanks a missing explanation rather than erroring', async () => {
		fetchRecommendationsMock.mockResolvedValue([ENCOURAGED_RECOMMENDATION]);

		render(<RecommendationsPage />);

		await screen.findByText('Increase legumes');
		expect(screen.getByText('—')).not.toBeNull();
	});

	it('renders a translation chip per language', async () => {
		fetchRecommendationsMock.mockResolvedValue([LIMITED_RECOMMENDATION]);

		render(<RecommendationsPage />);

		await screen.findByText('Decrease processed meat');
		expect(screen.getByText('EL')).not.toBeNull();
		expect(screen.getByText('LT')).not.toBeNull();
		expect(screen.getByText('NL')).not.toBeNull();
	});

	it('shows an error message when loading fails', async () => {
		fetchRecommendationsMock.mockRejectedValue(new Error('boom'));

		render(<RecommendationsPage />);

		expect(await screen.findByText('recommendations.loadError')).not.toBeNull();
	});
});
