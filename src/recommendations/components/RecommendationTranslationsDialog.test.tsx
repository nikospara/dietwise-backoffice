import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_LENGTHS } from '@/api/fieldLimits';
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
		humanFriendlyDisplay: 'Εμφάνιση κρέατος.',
		version: 2,
	},
	LT: { name: null, componentForScoring: null, explanationForLlm: null, humanFriendlyDisplay: null, version: 0 },
	NL: {
		name: 'Rood vlees',
		componentForScoring: 'rood vlees',
		explanationForLlm: null,
		humanFriendlyDisplay: null,
		version: 0,
	},
};

function renderDialog(overrides: Partial<Parameters<typeof RecommendationTranslationsDialog>[0]> = {}) {
	const props = {
		recommendationId: 'id1',
		englishName: 'Decrease red meat',
		englishComponent: 'red meat',
		englishExplanation: 'Cured and smoked red meat.',
		englishHumanFriendlyDisplay: 'Cured and smoked display.',
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

	it('pre-fills each language name, component, explanation and human friendly display and shows the English source', async () => {
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
		expect(
			(screen.getByLabelText('EL recommendations.columnHumanFriendlyDisplay') as HTMLTextAreaElement).value,
		).toBe('Εμφάνιση κρέατος.');
		expect((screen.getByLabelText('LT recommendations.columnName') as HTMLInputElement).value).toBe('');
		expect(screen.getByText('Decrease red meat', { exact: false })).not.toBeNull();
		expect(screen.getByText('red meat')).not.toBeNull();
	});

	it('blocks only the offending language when one of its fields is longer than the backend accepts', async () => {
		renderDialog();

		const elName = (await screen.findByLabelText('EL recommendations.columnName')) as HTMLInputElement;
		fireEvent.change(elName, { target: { value: 'n'.repeat(MAX_LENGTHS.recommendationName + 1) } });

		expect(screen.getAllByText('validation.tooLong')).toHaveLength(1);
		const saves = screen.getAllByText('recommendations.translationSave') as HTMLButtonElement[];
		expect(saves[0].disabled).toBe(true);
		expect(elName.className).toContain('border-error');
		expect(
			(screen.getByLabelText('EL recommendations.columnComponent') as HTMLInputElement).className,
		).not.toContain('border-error');
	});

	it('reports each over-long field of a language separately', async () => {
		renderDialog();

		const elName = (await screen.findByLabelText('EL recommendations.columnName')) as HTMLInputElement;
		fireEvent.change(elName, { target: { value: 'n'.repeat(MAX_LENGTHS.recommendationName + 1) } });
		fireEvent.change(screen.getByLabelText('EL recommendations.columnExplanation'), {
			target: { value: 'e'.repeat(MAX_LENGTHS.recommendationExplanation + 1) },
		});

		expect(screen.getAllByText('validation.tooLong')).toHaveLength(2);
	});

	it('shows the English source as placeholder so an empty field reads as falling back to English', async () => {
		renderDialog();

		const ltName = (await screen.findByLabelText('LT recommendations.columnName')) as HTMLInputElement;
		expect(ltName.placeholder).toBe('Decrease red meat');
		expect((screen.getByLabelText('LT recommendations.columnComponent') as HTMLInputElement).placeholder).toBe(
			'red meat',
		);
		expect((screen.getByLabelText('LT recommendations.columnExplanation') as HTMLTextAreaElement).placeholder).toBe(
			'Cured and smoked red meat.',
		);
		expect(
			(screen.getByLabelText('LT recommendations.columnHumanFriendlyDisplay') as HTMLTextAreaElement).placeholder,
		).toBe('Cured and smoked display.');
	});

	it('falls back to the field name as placeholder when there is no English source', async () => {
		renderDialog({ englishExplanation: null, englishHumanFriendlyDisplay: null });

		const ltExplanation = (await screen.findByLabelText(
			'LT recommendations.columnExplanation',
		)) as HTMLTextAreaElement;
		expect(ltExplanation.placeholder).toBe('recommendations.columnExplanation');
		expect(
			(screen.getByLabelText('LT recommendations.columnHumanFriendlyDisplay') as HTMLTextAreaElement).placeholder,
		).toBe('recommendations.columnHumanFriendlyDisplay');
	});

	it('offers revert only for a staged language and reverts it against its version', async () => {
		const { onRevert } = renderDialog();

		await screen.findByLabelText('EL recommendations.columnName');
		expect(screen.getAllByText('recommendations.translationRevert')).toHaveLength(1);
		fireEvent.click(screen.getByText('recommendations.translationRevert'));

		expect(onRevert).toHaveBeenCalledWith('EL', 2);
	});

	it('disables save until a language is edited, then stages all four fields against its version', async () => {
		const { onStage } = renderDialog();

		const greekName = (await screen.findByLabelText('EL recommendations.columnName')) as HTMLInputElement;
		expect((screen.getAllByText('recommendations.translationSave')[0] as HTMLButtonElement).disabled).toBe(true);
		fireEvent.change(greekName, { target: { value: 'Μοσχάρι' } });
		expect((screen.getAllByText('recommendations.translationSave')[0] as HTMLButtonElement).disabled).toBe(false);
		fireEvent.click(screen.getAllByText('recommendations.translationSave')[0]);

		expect(onStage).toHaveBeenCalledWith(
			'EL',
			'Μοσχάρι',
			'κόκκινο κρέας',
			'Λιγότερο κρέας.',
			'Εμφάνιση κρέατος.',
			2,
		);
	});

	it('stages an edited human friendly display for a language against its version', async () => {
		const { onStage } = renderDialog();

		const greekDisplay = (await screen.findByLabelText(
			'EL recommendations.columnHumanFriendlyDisplay',
		)) as HTMLTextAreaElement;
		fireEvent.change(greekDisplay, { target: { value: 'Νέα εμφάνιση.' } });
		fireEvent.click(screen.getAllByText('recommendations.translationSave')[0]);

		expect(onStage).toHaveBeenCalledWith(
			'EL',
			'Κόκκινο κρέας',
			'κόκκινο κρέας',
			'Λιγότερο κρέας.',
			'Νέα εμφάνιση.',
			2,
		);
	});

	it('stages null fields when a language is cleared', async () => {
		const { onStage } = renderDialog();

		const greekName = (await screen.findByLabelText('EL recommendations.columnName')) as HTMLInputElement;
		fireEvent.change(greekName, { target: { value: '   ' } });
		fireEvent.change(screen.getByLabelText('EL recommendations.columnComponent'), { target: { value: '' } });
		fireEvent.change(screen.getByLabelText('EL recommendations.columnExplanation'), { target: { value: '' } });
		fireEvent.change(screen.getByLabelText('EL recommendations.columnHumanFriendlyDisplay'), {
			target: { value: '' },
		});
		fireEvent.click(screen.getAllByText('recommendations.translationSave')[0]);

		expect(onStage).toHaveBeenCalledWith('EL', null, null, null, null, 2);
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
					humanFriendlyDisplay: 'Εμφάνιση κρέατος.',
					version: 5,
				},
			});
		const onStage = vi.fn().mockResolvedValue(undefined);
		renderDialog({ loadTranslations, onStage });

		const greekName = (await screen.findByLabelText('EL recommendations.columnName')) as HTMLInputElement;
		fireEvent.change(greekName, { target: { value: 'Μοσχάρι' } });
		fireEvent.change(screen.getByLabelText('LT recommendations.columnName'), { target: { value: 'Jautiena' } });
		fireEvent.click(screen.getAllByText('recommendations.translationSave')[0]);

		expect(onStage).toHaveBeenCalledWith(
			'EL',
			'Μοσχάρι',
			'κόκκινο κρέας',
			'Λιγότερο κρέας.',
			'Εμφάνιση κρέατος.',
			2,
		);
		await waitFor(() =>
			expect((screen.getAllByText('recommendations.translationSave')[0] as HTMLButtonElement).disabled).toBe(
				true,
			),
		);
		expect((screen.getByLabelText('LT recommendations.columnName') as HTMLInputElement).value).toBe('Jautiena');

		fireEvent.change(screen.getByLabelText('EL recommendations.columnName'), { target: { value: 'Μοσχαράκι' } });
		fireEvent.click(screen.getAllByText('recommendations.translationSave')[0]);
		expect(onStage).toHaveBeenLastCalledWith(
			'EL',
			'Μοσχαράκι',
			'κόκκινο κρέας',
			'Λιγότερο κρέας.',
			'Εμφάνιση κρέατος.',
			5,
		);
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
