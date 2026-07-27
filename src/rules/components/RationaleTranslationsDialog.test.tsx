import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_LENGTHS } from '@/api/fieldLimits';
import type { Language, VersionedText } from '@/components/referenceData';
import { RationaleTranslationsDialog } from './RationaleTranslationsDialog';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

const TRANSLATIONS: Record<Language, VersionedText> = {
	EL: { text: 'Ελληνικά', version: 2 },
	LT: { text: null, version: 0 },
	NL: { text: 'Nederlands', version: 0 },
};

function renderDialog(overrides: Partial<Parameters<typeof RationaleTranslationsDialog>[0]> = {}) {
	const props = {
		ruleId: 'r1',
		englishRationale: 'English rationale.',
		loadTranslations: vi.fn().mockResolvedValue(TRANSLATIONS),
		onStage: vi.fn(),
		onRevert: vi.fn(),
		onCancel: vi.fn(),
		...overrides,
	};
	render(<RationaleTranslationsDialog {...props} />);
	return props;
}

describe('RationaleTranslationsDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('pre-fills each language from its effective translation and shows the English source', async () => {
		renderDialog();

		expect(((await screen.findByLabelText('EL')) as HTMLTextAreaElement).value).toBe('Ελληνικά');
		expect((screen.getByLabelText('LT') as HTMLTextAreaElement).value).toBe('');
		expect((screen.getByLabelText('NL') as HTMLTextAreaElement).value).toBe('Nederlands');
		expect(screen.getByText('English rationale.', { exact: false })).not.toBeNull();
	});

	it('shows the English source as placeholder so an empty field reads as falling back to English', async () => {
		renderDialog();

		expect(((await screen.findByLabelText('LT')) as HTMLTextAreaElement).placeholder).toBe('English rationale.');
	});

	it('caps every language at the length the backend accepts', async () => {
		renderDialog();

		await screen.findByLabelText('EL');
		for (const lang of ['EL', 'LT', 'NL']) {
			expect((screen.getByLabelText(lang) as HTMLTextAreaElement).maxLength).toBe(MAX_LENGTHS.ruleRationale);
		}
	});

	it('falls back to the field name as placeholder when there is no English source', async () => {
		renderDialog({ englishRationale: null });

		expect(((await screen.findByLabelText('LT')) as HTMLTextAreaElement).placeholder).toBe('rules.columnRationale');
	});

	it('disables save until a language is edited, then stages it against its version', async () => {
		const { onStage } = renderDialog();

		const greek = (await screen.findByLabelText('EL')) as HTMLTextAreaElement;
		expect((screen.getAllByText('rules.translationSave')[0] as HTMLButtonElement).disabled).toBe(true);

		fireEvent.change(greek, { target: { value: 'Νέα μετάφραση.' } });
		expect((screen.getAllByText('rules.translationSave')[0] as HTMLButtonElement).disabled).toBe(false);
		fireEvent.click(screen.getAllByText('rules.translationSave')[0]);

		expect(onStage).toHaveBeenCalledWith('EL', 'Νέα μετάφραση.', 2);
	});

	it('offers revert only for a staged language and reverts it against its version', async () => {
		const { onRevert } = renderDialog();

		await screen.findByLabelText('EL');
		expect(screen.getAllByText('rules.translationRevert')).toHaveLength(1);
		fireEvent.click(screen.getByText('rules.translationRevert'));

		expect(onRevert).toHaveBeenCalledWith('EL', 2);
	});

	it('stages a null translation when a language is cleared', async () => {
		const { onStage } = renderDialog();

		const dutch = (await screen.findByLabelText('NL')) as HTMLTextAreaElement;
		fireEvent.change(dutch, { target: { value: '   ' } });
		fireEvent.click(screen.getAllByText('rules.translationSave')[2]);

		expect(onStage).toHaveBeenCalledWith('NL', null, 0);
	});

	it('calls onCancel when closed', async () => {
		const { onCancel } = renderDialog();

		await screen.findByLabelText('EL');
		fireEvent.click(screen.getByText('rules.translationsClose'));

		expect(onCancel).toHaveBeenCalled();
	});

	it('shows an error and no language inputs when the translations cannot be loaded', async () => {
		renderDialog({ loadTranslations: vi.fn().mockRejectedValue(new Error('boom')) });

		expect(await screen.findByText('rules.translationsLoadError')).not.toBeNull();
		expect(screen.queryByLabelText('EL')).toBeNull();
	});
});
