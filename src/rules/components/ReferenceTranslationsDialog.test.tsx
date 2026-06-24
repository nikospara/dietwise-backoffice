import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Language, ReferenceDetails } from '@/rules/rules';
import { ReferenceTranslationsDialog } from './ReferenceTranslationsDialog';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

const TRANSLATIONS: Record<Language, ReferenceDetails> = {
	EL: { name: 'Βόειο', explanationForLlm: 'Κόκκινο κρέας.', version: 2, published: true },
	LT: { name: null, explanationForLlm: null, version: 0, published: false },
	NL: { name: 'Rundvlees', explanationForLlm: null, version: 0, published: true },
};

function renderDialog(overrides: Partial<Parameters<typeof ReferenceTranslationsDialog>[0]> = {}) {
	const props = {
		referenceId: 'id1',
		title: 'Edit Trigger Ingredient translations',
		englishName: 'Beef',
		loadTranslations: vi.fn().mockResolvedValue(TRANSLATIONS),
		onStage: vi.fn(),
		onRevert: vi.fn(),
		onCancel: vi.fn(),
		...overrides,
	};
	render(<ReferenceTranslationsDialog {...props} />);
	return props;
}

describe('ReferenceTranslationsDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('pre-fills each language name and explanation and shows the English source', async () => {
		renderDialog();

		expect(((await screen.findByLabelText('EL rules.editName')) as HTMLInputElement).value).toBe('Βόειο');
		expect((screen.getByLabelText('EL rules.editExplanation') as HTMLTextAreaElement).value).toBe('Κόκκινο κρέας.');
		expect((screen.getByLabelText('NL rules.editName') as HTMLInputElement).value).toBe('Rundvlees');
		expect((screen.getByLabelText('LT rules.editName') as HTMLInputElement).value).toBe('');
		expect(screen.getByText('Beef', { exact: false })).not.toBeNull();
	});

	it('offers revert only for a staged language and reverts it against its version', async () => {
		const { onRevert } = renderDialog();

		await screen.findByLabelText('EL rules.editName');
		expect(screen.getAllByText('rules.translationRevert')).toHaveLength(1);
		fireEvent.click(screen.getByText('rules.translationRevert'));

		expect(onRevert).toHaveBeenCalledWith('EL', 2);
	});

	it('disables save until a language is edited, then stages its name and explanation against its version', async () => {
		const { onStage } = renderDialog();

		const greekName = (await screen.findByLabelText('EL rules.editName')) as HTMLInputElement;
		expect((screen.getAllByText('rules.translationSave')[0] as HTMLButtonElement).disabled).toBe(true);
		fireEvent.change(greekName, { target: { value: 'Μοσχάρι' } });
		expect((screen.getAllByText('rules.translationSave')[0] as HTMLButtonElement).disabled).toBe(false);
		fireEvent.click(screen.getAllByText('rules.translationSave')[0]);

		expect(onStage).toHaveBeenCalledWith('EL', 'Μοσχάρι', 'Κόκκινο κρέας.', 2);
	});

	it('refreshes the saved language version and resets its draft while keeping other languages’ edits', async () => {
		const loadTranslations = vi
			.fn()
			.mockResolvedValueOnce(TRANSLATIONS)
			.mockResolvedValue({
				...TRANSLATIONS,
				EL: { name: 'Μοσχάρι', explanationForLlm: 'Κόκκινο κρέας.', version: 5, published: true },
			});
		const onStage = vi.fn().mockResolvedValue(undefined);
		renderDialog({ loadTranslations, onStage });

		const greekName = (await screen.findByLabelText('EL rules.editName')) as HTMLInputElement;
		fireEvent.change(greekName, { target: { value: 'Μοσχάρι' } });
		fireEvent.change(screen.getByLabelText('LT rules.editName'), { target: { value: 'Jautiena' } });
		fireEvent.click(screen.getAllByText('rules.translationSave')[0]);

		expect(onStage).toHaveBeenCalledWith('EL', 'Μοσχάρι', 'Κόκκινο κρέας.', 2);
		// After the reconcile, the saved language matches its refreshed value, so its save button disables again.
		await waitFor(() =>
			expect((screen.getAllByText('rules.translationSave')[0] as HTMLButtonElement).disabled).toBe(true),
		);
		// The unsaved Lithuanian edit survives because the dialog stayed open.
		expect((screen.getByLabelText('LT rules.editName') as HTMLInputElement).value).toBe('Jautiena');

		// Editing and saving the same language again stages against the refreshed version, not the stale one.
		fireEvent.change(screen.getByLabelText('EL rules.editName'), { target: { value: 'Μοσχαράκι' } });
		fireEvent.click(screen.getAllByText('rules.translationSave')[0]);
		expect(onStage).toHaveBeenLastCalledWith('EL', 'Μοσχαράκι', 'Κόκκινο κρέας.', 5);
		await waitFor(() =>
			expect((screen.getAllByText('rules.translationSave')[0] as HTMLButtonElement).disabled).toBe(true),
		);
	});

	it('stages a null name and explanation when a language is cleared', async () => {
		const { onStage } = renderDialog();

		const greekName = (await screen.findByLabelText('EL rules.editName')) as HTMLInputElement;
		fireEvent.change(greekName, { target: { value: '   ' } });
		fireEvent.change(screen.getByLabelText('EL rules.editExplanation'), { target: { value: '' } });
		fireEvent.click(screen.getAllByText('rules.translationSave')[0]);

		expect(onStage).toHaveBeenCalledWith('EL', null, null, 2);
	});

	it('calls onCancel when closed', async () => {
		const { onCancel } = renderDialog();

		await screen.findByLabelText('EL rules.editName');
		fireEvent.click(screen.getByText('rules.translationsClose'));

		expect(onCancel).toHaveBeenCalled();
	});

	it('shows an error and no language inputs when the translations cannot be loaded', async () => {
		renderDialog({ loadTranslations: vi.fn().mockRejectedValue(new Error('boom')) });

		expect(await screen.findByText('rules.translationsLoadError')).not.toBeNull();
		expect(screen.queryByLabelText('EL rules.editName')).toBeNull();
	});
});
