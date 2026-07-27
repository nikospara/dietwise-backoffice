import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_LENGTHS } from '@/api/fieldLimits';
import type { ReferenceDetails } from '@/components/referenceData';
import { ReferenceEditDialog } from './ReferenceEditDialog';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({ t: (key: string) => key }),
}));

const BEEF: ReferenceDetails = { name: 'Beef', explanationForLlm: 'Red meat.', version: 2, published: true };

function renderDialog(overrides: Partial<Parameters<typeof ReferenceEditDialog>[0]> = {}) {
	const props = {
		referenceId: 'id1',
		title: 'Edit Trigger Ingredient',
		blastRadius: 'Affects 3 rules',
		takenNames: ['soy sauce'],
		loadDetails: vi.fn().mockResolvedValue(BEEF),
		onSubmit: vi.fn().mockResolvedValue(undefined),
		onRevert: vi.fn(),
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

		const name = (await screen.findByLabelText('reference.editName')) as HTMLInputElement;
		expect(name.value).toBe('Beef');
		expect((screen.getByLabelText('reference.editExplanation') as HTMLTextAreaElement).value).toBe('Red meat.');
		expect(screen.getByText('Affects 3 rules')).not.toBeNull();
	});

	it('caps the name and explanation at the lengths the backend accepts', async () => {
		renderDialog();

		const name = (await screen.findByLabelText('reference.editName')) as HTMLInputElement;
		expect(name.maxLength).toBe(MAX_LENGTHS.referenceName);
		expect((screen.getByLabelText('reference.editExplanation') as HTMLTextAreaElement).maxLength).toBe(
			MAX_LENGTHS.referenceExplanation,
		);
	});

	it('omits the blast radius when none is given', async () => {
		renderDialog({ blastRadius: null });

		await screen.findByLabelText('reference.editName');
		expect(screen.queryByText('Affects 3 rules')).toBeNull();
	});

	it('blocks saving and warns when the name collides with another entry, case-insensitively', async () => {
		renderDialog({
			loadDetails: vi
				.fn()
				.mockResolvedValue({ name: 'Beef', explanationForLlm: null, version: 0, published: true }),
		});

		const name = (await screen.findByLabelText('reference.editName')) as HTMLInputElement;
		fireEvent.change(name, { target: { value: 'Soy Sauce' } });

		expect(screen.getByText('reference.editDuplicateName')).not.toBeNull();
		expect((screen.getByText('reference.editSave') as HTMLButtonElement).disabled).toBe(true);
	});

	it('disables saving when the name is blank', async () => {
		renderDialog();

		const name = (await screen.findByLabelText('reference.editName')) as HTMLInputElement;
		fireEvent.change(name, { target: { value: '   ' } });

		expect((screen.getByText('reference.editSave') as HTMLButtonElement).disabled).toBe(true);
	});

	it('submits the edited name and explanation against the loaded version', async () => {
		const { onSubmit } = renderDialog();

		const name = (await screen.findByLabelText('reference.editName')) as HTMLInputElement;
		fireEvent.change(name, { target: { value: '  Bovine  ' } });
		fireEvent.click(screen.getByText('reference.editSave'));

		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Bovine', 'Red meat.', 2));
	});

	it('submits a null explanation when the explanation is cleared', async () => {
		const { onSubmit } = renderDialog();

		await screen.findByLabelText('reference.editName');
		fireEvent.change(screen.getByLabelText('reference.editExplanation'), { target: { value: '' } });
		fireEvent.click(screen.getByText('reference.editSave'));

		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith('Beef', null, 2));
	});

	it('calls onCancel when cancelled', async () => {
		const { onCancel } = renderDialog();

		await screen.findByLabelText('reference.editName');
		fireEvent.click(screen.getByText('reference.editCancel'));

		expect(onCancel).toHaveBeenCalled();
	});

	it('shows an error and hides save when the details cannot be loaded', async () => {
		renderDialog({ loadDetails: vi.fn().mockRejectedValue(new Error('boom')) });

		expect(await screen.findByText('reference.editLoadError')).not.toBeNull();
		expect(screen.queryByText('reference.editSave')).toBeNull();
	});

	it('offers Revert for a staged edit on a published entity and reverts against its version', async () => {
		const { onRevert } = renderDialog();

		await screen.findByLabelText('reference.editName');
		fireEvent.click(screen.getByText('reference.editRevert'));

		expect(onRevert).toHaveBeenCalledWith(2);
	});

	it('hides Revert when there is no staged edit', async () => {
		renderDialog({
			loadDetails: vi
				.fn()
				.mockResolvedValue({ name: 'Beef', explanationForLlm: null, version: 0, published: true }),
		});

		await screen.findByLabelText('reference.editName');
		expect(screen.queryByText('reference.editRevert')).toBeNull();
	});

	it('hides Revert for a Working-Copy-only entity that has never been published', async () => {
		renderDialog({
			loadDetails: vi
				.fn()
				.mockResolvedValue({ name: 'Tempeh', explanationForLlm: null, version: 2, published: false }),
		});

		await screen.findByLabelText('reference.editName');
		expect(screen.queryByText('reference.editRevert')).toBeNull();
	});
});
