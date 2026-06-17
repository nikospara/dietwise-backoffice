import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReferenceDetails } from '@/api/rules';
import { ReferenceEditDialog } from './ReferenceEditDialog';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string, opts?: { count?: number }) => (opts?.count === undefined ? key : `${key}:${opts.count}`),
	}),
}));

const BEEF: ReferenceDetails = { name: 'Beef', explanationForLlm: 'Red meat.', version: 2 };

function renderDialog(overrides: Partial<Parameters<typeof ReferenceEditDialog>[0]> = {}) {
	const props = {
		referenceId: 'id1',
		title: 'Edit Trigger Ingredient',
		affectedCount: 3,
		takenNames: ['soy sauce'],
		loadDetails: vi.fn().mockResolvedValue(BEEF),
		onSubmit: vi.fn().mockResolvedValue(undefined),
		onCancel: vi.fn(),
		...overrides,
	};
	render(<ReferenceEditDialog {...props} />);
	return props;
}

describe('ReferenceEditDialog', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('pre-fills the loaded name and explanation and shows the blast radius', async () => {
		renderDialog();

		const name = (await screen.findByLabelText('rules.editName')) as HTMLInputElement;
		expect(name.value).toBe('Beef');
		expect((screen.getByLabelText('rules.editExplanation') as HTMLTextAreaElement).value).toBe('Red meat.');
		expect(screen.getByText('rules.editBlastRadius:3')).not.toBeNull();
	});

	it('blocks saving and warns when the name collides with another entry, case-insensitively', async () => {
		renderDialog({ loadDetails: vi.fn().mockResolvedValue({ name: 'Beef', explanationForLlm: null, version: 0 }) });

		const name = (await screen.findByLabelText('rules.editName')) as HTMLInputElement;
		fireEvent.change(name, { target: { value: 'Soy Sauce' } });

		expect(screen.getByText('rules.editDuplicateName')).not.toBeNull();
		expect((screen.getByText('rules.editSave') as HTMLButtonElement).disabled).toBe(true);
	});

	it('disables saving when the name is blank', async () => {
		renderDialog();

		const name = (await screen.findByLabelText('rules.editName')) as HTMLInputElement;
		fireEvent.change(name, { target: { value: '   ' } });

		expect((screen.getByText('rules.editSave') as HTMLButtonElement).disabled).toBe(true);
	});

	it('submits the edited name and explanation against the loaded version', async () => {
		const { onSubmit } = renderDialog();

		const name = (await screen.findByLabelText('rules.editName')) as HTMLInputElement;
		fireEvent.change(name, { target: { value: '  Bovine  ' } });
		fireEvent.click(screen.getByText('rules.editSave'));

		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Bovine', 'Red meat.', 2));
	});

	it('submits a null explanation when the explanation is cleared', async () => {
		const { onSubmit } = renderDialog();

		await screen.findByLabelText('rules.editName');
		fireEvent.change(screen.getByLabelText('rules.editExplanation'), { target: { value: '' } });
		fireEvent.click(screen.getByText('rules.editSave'));

		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Beef', null, 2));
	});

	it('calls onCancel when cancelled', async () => {
		const { onCancel } = renderDialog();

		await screen.findByLabelText('rules.editName');
		fireEvent.click(screen.getByText('rules.editCancel'));

		expect(onCancel).toHaveBeenCalled();
	});

	it('shows an error and hides save when the details cannot be loaded', async () => {
		renderDialog({ loadDetails: vi.fn().mockRejectedValue(new Error('boom')) });

		expect(await screen.findByText('rules.editLoadError')).not.toBeNull();
		expect(screen.queryByText('rules.editSave')).toBeNull();
	});
});
