import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Language, RecommendationTranslationDetails } from '@/recommendations/recommendations';
import { RecommendationTranslationsDialog } from './RecommendationTranslationsDialog';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

const TRANSLATIONS: Record<Language, RecommendationTranslationDetails> = {
	EL: {
		name: 'Κόκκινο κρέας',
		componentForScoring: 'κόκκινο κρέας',
		explanationForLlm: 'Λιγότερο κρέας.',
		version: 2,
	},
	LT: { name: null, componentForScoring: null, explanationForLlm: null, version: 0 },
	NL: { name: 'Rood vlees', componentForScoring: 'rood vlees', explanationForLlm: null, version: 0 },
};

function renderDialog(overrides: Partial<Parameters<typeof RecommendationTranslationsDialog>[0]> = {}) {
	const props = {
		recommendationId: 'id1',
		englishName: 'Decrease red meat',
		englishComponent: 'red meat',
		englishExplanation: 'Cured and smoked red meat.',
		loadTranslations: vi.fn().mockResolvedValue(TRANSLATIONS),
		onStage: vi.fn(),
		onRevert: vi.fn(),
		onCancel: vi.fn(),
		...overrides,
	};
	render(<RecommendationTranslationsDialog {...props} />);
	return props;
}

describe('RecommendationTranslationsDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('pre-fills each language name, component and explanation and shows the English source', async () => {
		renderDialog();

		expect(((await screen.findByLabelText('EL recommendations.columnName')) as HTMLInputElement).value).toBe(
			'Κόκκινο κρέας',
		);
		expect((screen.getByLabelText('EL recommendations.columnComponent') as HTMLInputElement).value).toBe(
			'κόκκινο κρέας',
		);
		expect((screen.getByLabelText('EL recommendations.columnExplanation') as HTMLTextAreaElement).value).toBe(
			'Λιγότερο κρέας.',
		);
		expect((screen.getByLabelText('LT recommendations.columnName') as HTMLInputElement).value).toBe('');
		expect(screen.getByText('Decrease red meat', { exact: false })).not.toBeNull();
		expect(screen.getByText('red meat')).not.toBeNull();
	});

	it('offers revert only for a staged language and reverts it against its version', async () => {
		const { onRevert } = renderDialog();

		await screen.findByLabelText('EL recommendations.columnName');
		expect(screen.getAllByText('recommendations.translationRevert')).toHaveLength(1);
		fireEvent.click(screen.getByText('recommendations.translationRevert'));

		expect(onRevert).toHaveBeenCalledWith('EL', 2);
	});

	it('disables save until a language is edited, then stages all three fields against its version', async () => {
		const { onStage } = renderDialog();

		const greekName = (await screen.findByLabelText('EL recommendations.columnName')) as HTMLInputElement;
		expect((screen.getAllByText('recommendations.translationSave')[0] as HTMLButtonElement).disabled).toBe(true);
		fireEvent.change(greekName, { target: { value: 'Μοσχάρι' } });
		expect((screen.getAllByText('recommendations.translationSave')[0] as HTMLButtonElement).disabled).toBe(false);
		fireEvent.click(screen.getAllByText('recommendations.translationSave')[0]);

		expect(onStage).toHaveBeenCalledWith('EL', 'Μοσχάρι', 'κόκκινο κρέας', 'Λιγότερο κρέας.', 2);
	});

	it('stages null fields when a language is cleared', async () => {
		const { onStage } = renderDialog();

		const greekName = (await screen.findByLabelText('EL recommendations.columnName')) as HTMLInputElement;
		fireEvent.change(greekName, { target: { value: '   ' } });
		fireEvent.change(screen.getByLabelText('EL recommendations.columnComponent'), { target: { value: '' } });
		fireEvent.change(screen.getByLabelText('EL recommendations.columnExplanation'), { target: { value: '' } });
		fireEvent.click(screen.getAllByText('recommendations.translationSave')[0]);

		expect(onStage).toHaveBeenCalledWith('EL', null, null, null, 2);
	});

	it('refreshes the saved language version and resets its draft while keeping other languages’ edits', async () => {
		const loadTranslations = vi
			.fn()
			.mockResolvedValueOnce(TRANSLATIONS)
			.mockResolvedValue({
				...TRANSLATIONS,
				EL: {
					name: 'Μοσχάρι',
					componentForScoring: 'κόκκινο κρέας',
					explanationForLlm: 'Λιγότερο κρέας.',
					version: 5,
				},
			});
		const onStage = vi.fn().mockResolvedValue(undefined);
		renderDialog({ loadTranslations, onStage });

		const greekName = (await screen.findByLabelText('EL recommendations.columnName')) as HTMLInputElement;
		fireEvent.change(greekName, { target: { value: 'Μοσχάρι' } });
		fireEvent.change(screen.getByLabelText('LT recommendations.columnName'), { target: { value: 'Jautiena' } });
		fireEvent.click(screen.getAllByText('recommendations.translationSave')[0]);

		expect(onStage).toHaveBeenCalledWith('EL', 'Μοσχάρι', 'κόκκινο κρέας', 'Λιγότερο κρέας.', 2);
		await waitFor(() =>
			expect((screen.getAllByText('recommendations.translationSave')[0] as HTMLButtonElement).disabled).toBe(
				true,
			),
		);
		expect((screen.getByLabelText('LT recommendations.columnName') as HTMLInputElement).value).toBe('Jautiena');

		fireEvent.change(screen.getByLabelText('EL recommendations.columnName'), { target: { value: 'Μοσχαράκι' } });
		fireEvent.click(screen.getAllByText('recommendations.translationSave')[0]);
		expect(onStage).toHaveBeenLastCalledWith('EL', 'Μοσχαράκι', 'κόκκινο κρέας', 'Λιγότερο κρέας.', 5);
	});

	it('calls onCancel when closed', async () => {
		const { onCancel } = renderDialog();

		await screen.findByLabelText('EL recommendations.columnName');
		fireEvent.click(screen.getByText('recommendations.translationsClose'));

		expect(onCancel).toHaveBeenCalled();
	});

	it('shows an error and no language inputs when the translations cannot be loaded', async () => {
		renderDialog({ loadTranslations: vi.fn().mockRejectedValue(new Error('boom')) });

		expect(await screen.findByText('recommendations.translationsLoadError')).not.toBeNull();
		expect(screen.queryByLabelText('EL recommendations.columnName')).toBeNull();
	});
});
