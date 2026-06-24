import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Language, VersionedText } from '@/rules/rules';
import { TemplateFieldTranslationsDialog } from './TemplateFieldTranslationsDialog';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

const TRANSLATIONS: Record<Language, VersionedText> = {
	EL: { text: 'Ελληνικά', version: 2 },
	LT: { text: null, version: 0 },
	NL: { text: 'Nederlands', version: 0 },
};

function renderDialog(overrides: Partial<Parameters<typeof TemplateFieldTranslationsDialog>[0]> = {}) {
	const props = {
		templateId: 's1',
		field: 'RESTRICTION' as const,
		title: 'Restriction — Brown lentils',
		englishValue: 'No binder needed.',
		loadTranslations: vi.fn().mockResolvedValue(TRANSLATIONS),
		onStage: vi.fn(),
		onRevert: vi.fn(),
		onCancel: vi.fn(),
		...overrides,
	};
	render(<TemplateFieldTranslationsDialog {...props} />);
	return props;
}

describe('TemplateFieldTranslationsDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('loads the chosen field for the template and pre-fills each language, showing the English source', async () => {
		const { loadTranslations } = renderDialog();

		expect(((await screen.findByLabelText('EL')) as HTMLTextAreaElement).value).toBe('Ελληνικά');
		expect((screen.getByLabelText('LT') as HTMLTextAreaElement).value).toBe('');
		expect((screen.getByLabelText('NL') as HTMLTextAreaElement).value).toBe('Nederlands');
		expect(screen.getByText('No binder needed.', { exact: false })).not.toBeNull();
		expect(loadTranslations).toHaveBeenCalledWith('s1', 'RESTRICTION');
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

	it('stages a null value when a language is cleared', async () => {
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
