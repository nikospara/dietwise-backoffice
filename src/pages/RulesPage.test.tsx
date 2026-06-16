import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import {
	createRoleOrTechnique,
	createRule,
	createTriggerIngredient,
	discardNewRule,
	editRoleOrTechnique,
	editTriggerIngredient,
	fetchNewRuleOptions,
	fetchRoleOrTechnique,
	fetchRules,
	fetchTriggerIngredient,
	revertRationale,
	setActive,
	stageRationale,
	type Rule,
} from '@/api/rules';
import { RulesPage } from './RulesPage';

vi.mock('@/api/rules', () => ({
	fetchRules: vi.fn(),
	stageRationale: vi.fn(),
	revertRationale: vi.fn(),
	setActive: vi.fn(),
	fetchNewRuleOptions: vi.fn(),
	createRule: vi.fn(),
	discardNewRule: vi.fn(),
	createTriggerIngredient: vi.fn(),
	createRoleOrTechnique: vi.fn(),
	fetchTriggerIngredient: vi.fn(),
	fetchRoleOrTechnique: vi.fn(),
	editTriggerIngredient: vi.fn(),
	editRoleOrTechnique: vi.fn(),
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const fetchRulesMock = vi.mocked(fetchRules);
const stageRationaleMock = vi.mocked(stageRationale);
const revertRationaleMock = vi.mocked(revertRationale);
const setActiveMock = vi.mocked(setActive);
const fetchNewRuleOptionsMock = vi.mocked(fetchNewRuleOptions);
const createRuleMock = vi.mocked(createRule);
const discardNewRuleMock = vi.mocked(discardNewRule);
const createTriggerIngredientMock = vi.mocked(createTriggerIngredient);
const createRoleOrTechniqueMock = vi.mocked(createRoleOrTechnique);
const fetchTriggerIngredientMock = vi.mocked(fetchTriggerIngredient);
const fetchRoleOrTechniqueMock = vi.mocked(fetchRoleOrTechnique);
const editTriggerIngredientMock = vi.mocked(editTriggerIngredient);
const editRoleOrTechniqueMock = vi.mocked(editRoleOrTechnique);

const OPTIONS = {
	recommendations: [{ id: 'r1', name: 'Decrease sodium' }],
	triggerIngredients: [{ id: 't1', name: 'Soy sauce' }],
	rolesOrTechniques: [{ id: 'k1', name: 'seasoning' }],
};

const NEW_RULE: Rule = {
	id: 'n1',
	recommendation: 'Decrease sodium',
	triggerIngredient: 'Soy sauce',
	triggerIngredientId: 't1',
	roleOrTechnique: 'seasoning',
	roleOrTechniqueId: 'k1',
	rationale: null,
	active: true,
	changeState: 'NEW',
	changedFields: [],
	version: 1,
};

const UNCHANGED_RULE: Rule = {
	id: '1',
	recommendation: 'Decrease red meat',
	triggerIngredient: 'Beef',
	triggerIngredientId: 'tb',
	roleOrTechnique: 'minced in sauce',
	roleOrTechniqueId: 'rm',
	rationale: 'Use plant proteins.',
	active: true,
	changeState: 'UNCHANGED',
	changedFields: [],
	version: 0,
};

const ROLELESS_RULE: Rule = {
	id: '2',
	recommendation: 'Decrease red meat',
	triggerIngredient: 'Beef',
	triggerIngredientId: 'tb',
	roleOrTechnique: null,
	roleOrTechniqueId: null,
	rationale: null,
	active: true,
	changeState: 'UNCHANGED',
	changedFields: [],
	version: 0,
};

const CHANGED_RULE: Rule = { ...UNCHANGED_RULE, changeState: 'CHANGED', changedFields: ['RATIONALE'], version: 3 };
const DEACTIVATED_RULE: Rule = {
	...UNCHANGED_RULE,
	active: false,
	changeState: 'CHANGED',
	changedFields: ['ACTIVE'],
	version: 3,
};

describe('RulesPage', () => {
	beforeEach(() => {
		fetchRulesMock.mockReset();
		stageRationaleMock.mockReset();
		revertRationaleMock.mockReset();
		setActiveMock.mockReset();
		fetchNewRuleOptionsMock.mockReset();
		createRuleMock.mockReset();
		discardNewRuleMock.mockReset();
		createTriggerIngredientMock.mockReset();
		createRoleOrTechniqueMock.mockReset();
		fetchTriggerIngredientMock.mockReset();
		fetchRoleOrTechniqueMock.mockReset();
		editTriggerIngredientMock.mockReset();
		editRoleOrTechniqueMock.mockReset();
		fetchNewRuleOptionsMock.mockResolvedValue({
			recommendations: [],
			triggerIngredients: [],
			rolesOrTechniques: [],
		});
	});

	it('renders one row per rule, blanks a missing role, and makes the rationale editable', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE, ROLELESS_RULE]);

		render(<RulesPage />);

		expect(await screen.findByText('minced in sauce')).not.toBeNull();
		expect(screen.getAllByText('Beef')).toHaveLength(2);
		// only the role-less cell shows a placeholder now; the rationale is an input
		expect(screen.getAllByText('—')).toHaveLength(1);
		const rationaleInputs = screen.getAllByLabelText('rules.rationaleEditLabel') as HTMLInputElement[];
		expect(rationaleInputs).toHaveLength(2);
		expect(rationaleInputs[0].value).toBe('Use plant proteins.');
		expect(rationaleInputs[1].value).toBe('');
	});

	it('shows an error message when the rules cannot be loaded', async () => {
		fetchRulesMock.mockRejectedValue(new Error('boom'));

		render(<RulesPage />);

		expect(await screen.findByText('rules.loadError')).not.toBeNull();
	});

	it('marks an already-changed rule with a pending badge', async () => {
		fetchRulesMock.mockResolvedValue([{ ...UNCHANGED_RULE, changeState: 'CHANGED' as const, version: 3 }]);

		render(<RulesPage />);

		expect(await screen.findByText('rules.pendingBadge')).not.toBeNull();
	});

	it('stages an edited rationale against its base version and shows it as pending', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		stageRationaleMock.mockResolvedValue(1);

		render(<RulesPage />);

		const input = (await screen.findByLabelText('rules.rationaleEditLabel')) as HTMLInputElement;
		fireEvent.change(input, { target: { value: 'Prefer legumes.' } });
		fireEvent.blur(input);

		expect(await screen.findByText('rules.pendingBadge')).not.toBeNull();
		expect(stageRationaleMock).toHaveBeenCalledWith('1', 'Prefer legumes.', 0);
	});

	it('does not stage when the rationale is left unchanged', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);

		render(<RulesPage />);

		const input = (await screen.findByLabelText('rules.rationaleEditLabel')) as HTMLInputElement;
		fireEvent.blur(input);

		expect(stageRationaleMock).not.toHaveBeenCalled();
	});

	it('warns and refreshes the grid when a save is rejected as stale', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		stageRationaleMock.mockRejectedValue(new ApiError(409, 'conflict'));

		render(<RulesPage />);

		const input = (await screen.findByLabelText('rules.rationaleEditLabel')) as HTMLInputElement;
		fireEvent.change(input, { target: { value: 'Prefer legumes.' } });
		fireEvent.blur(input);

		expect(await screen.findByText('rules.staleReload')).not.toBeNull();
		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
	});

	it('does not offer revert on an unchanged rule', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);

		render(<RulesPage />);

		await screen.findByLabelText('rules.rationaleEditLabel');
		expect(screen.queryByText('rules.revert')).toBeNull();
	});

	it('reverts a staged rationale against its base version and refreshes the grid', async () => {
		fetchRulesMock.mockResolvedValueOnce([CHANGED_RULE]).mockResolvedValueOnce([UNCHANGED_RULE]);
		revertRationaleMock.mockResolvedValue(undefined);

		render(<RulesPage />);

		fireEvent.click(await screen.findByText('rules.revert'));

		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
		expect(revertRationaleMock).toHaveBeenCalledWith('1', 3);
		await waitFor(() => expect(screen.queryByText('rules.pendingBadge')).toBeNull());
	});

	it('warns and refreshes the grid when a revert is rejected as stale', async () => {
		fetchRulesMock.mockResolvedValue([CHANGED_RULE]);
		revertRationaleMock.mockRejectedValue(new ApiError(409, 'conflict'));

		render(<RulesPage />);

		fireEvent.click(await screen.findByText('rules.revert'));

		expect(await screen.findByText('rules.staleReload')).not.toBeNull();
		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
	});

	it('deactivates an active rule against its base version and refreshes the grid', async () => {
		fetchRulesMock.mockResolvedValueOnce([UNCHANGED_RULE]).mockResolvedValueOnce([DEACTIVATED_RULE]);
		setActiveMock.mockResolvedValue(undefined);

		render(<RulesPage />);

		fireEvent.click(await screen.findByText('rules.deactivate'));

		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
		expect(setActiveMock).toHaveBeenCalledWith('1', false, 0);
		expect(await screen.findByText('rules.activate')).not.toBeNull();
	});

	it('activates a deactivated rule against its base version and refreshes the grid', async () => {
		fetchRulesMock.mockResolvedValueOnce([DEACTIVATED_RULE]).mockResolvedValueOnce([UNCHANGED_RULE]);
		setActiveMock.mockResolvedValue(undefined);

		render(<RulesPage />);

		fireEvent.click(await screen.findByText('rules.activate'));

		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
		expect(setActiveMock).toHaveBeenCalledWith('1', true, 3);
	});

	it('marks a deactivated rule with a red row', async () => {
		fetchRulesMock.mockResolvedValue([DEACTIVATED_RULE]);

		render(<RulesPage />);

		const row = (await screen.findByText('minced in sauce')).closest('tr');
		expect(row?.className).toContain('bg-error');
	});

	it('warns and refreshes the grid when a deactivation is rejected as stale', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		setActiveMock.mockRejectedValue(new ApiError(409, 'conflict'));

		render(<RulesPage />);

		fireEvent.click(await screen.findByText('rules.deactivate'));

		expect(await screen.findByText('rules.staleReload')).not.toBeNull();
		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
	});

	it('stages a new rule from the chosen business key and refreshes the grid', async () => {
		fetchNewRuleOptionsMock.mockResolvedValue(OPTIONS);
		fetchRulesMock.mockResolvedValueOnce([]).mockResolvedValueOnce([NEW_RULE]);
		createRuleMock.mockResolvedValue('n1');

		render(<RulesPage />);

		await screen.findByRole('option', { name: 'Decrease sodium' });
		fireEvent.change(screen.getByLabelText('rules.recommendation'), { target: { value: 'r1' } });
		fireEvent.focus(screen.getByLabelText('rules.triggerIngredient'));
		fireEvent.mouseDown(screen.getByRole('button', { name: 'Soy sauce' }));

		fireEvent.click(screen.getByText('rules.addRule'));

		await waitFor(() => expect(createRuleMock).toHaveBeenCalledWith('r1', 't1', null));
		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
	});

	it('renders a new rule as a green row with a pending badge, a discard action and no deactivate or revert', async () => {
		fetchRulesMock.mockResolvedValue([NEW_RULE]);

		render(<RulesPage />);

		const row = (await screen.findByText('seasoning')).closest('tr');
		expect(row?.className).toContain('bg-success');
		expect(screen.queryByText('rules.pendingBadge')).not.toBeNull();
		expect(screen.queryByText('rules.discard')).not.toBeNull();
		expect(screen.queryByText('rules.deactivate')).toBeNull();
		expect(screen.queryByText('rules.activate')).toBeNull();
		expect(screen.queryByText('rules.revert')).toBeNull();
	});

	it('discards an unpublished new rule against its base version and refreshes the grid', async () => {
		fetchRulesMock.mockResolvedValueOnce([NEW_RULE]).mockResolvedValueOnce([]);
		discardNewRuleMock.mockResolvedValue(undefined);

		render(<RulesPage />);

		fireEvent.click(await screen.findByText('rules.discard'));

		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
		expect(discardNewRuleMock).toHaveBeenCalledWith('n1', 1);
		await waitFor(() => expect(screen.queryByText('rules.pendingBadge')).toBeNull());
	});

	it('warns and refreshes the grid when a discard is rejected as stale', async () => {
		fetchRulesMock.mockResolvedValue([NEW_RULE]);
		discardNewRuleMock.mockRejectedValue(new ApiError(409, 'conflict'));

		render(<RulesPage />);

		fireEvent.click(await screen.findByText('rules.discard'));

		expect(await screen.findByText('rules.staleReload')).not.toBeNull();
		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
	});

	it('offers deactivate but not discard on a published rule', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);

		render(<RulesPage />);

		await screen.findByText('rules.deactivate');
		expect(screen.queryByText('rules.discard')).toBeNull();
	});

	it('adds a new trigger ingredient from the combobox, selects it and refreshes the options', async () => {
		fetchNewRuleOptionsMock.mockResolvedValueOnce(OPTIONS).mockResolvedValueOnce({
			...OPTIONS,
			triggerIngredients: [...OPTIONS.triggerIngredients, { id: 't2', name: 'Quinoa flour' }],
		});
		fetchRulesMock.mockResolvedValue([]);
		createTriggerIngredientMock.mockResolvedValue({ id: 't2', name: 'Quinoa flour' });

		render(<RulesPage />);

		await screen.findByRole('option', { name: 'Decrease sodium' });
		const triggerInput = screen.getByLabelText('rules.triggerIngredient');
		fireEvent.focus(triggerInput);
		fireEvent.change(triggerInput, { target: { value: 'Quinoa flour' } });
		fireEvent.mouseDown(screen.getByText('rules.addOption'));

		await waitFor(() => expect(createTriggerIngredientMock).toHaveBeenCalledWith('Quinoa flour'));
		await waitFor(() => expect(fetchNewRuleOptionsMock).toHaveBeenCalledTimes(2));
	});

	it('adds a new role or technique from the combobox', async () => {
		fetchNewRuleOptionsMock.mockResolvedValueOnce(OPTIONS).mockResolvedValueOnce({
			...OPTIONS,
			rolesOrTechniques: [...OPTIONS.rolesOrTechniques, { id: 'k2', name: 'Binding agent' }],
		});
		fetchRulesMock.mockResolvedValue([]);
		createRoleOrTechniqueMock.mockResolvedValue({ id: 'k2', name: 'Binding agent' });

		render(<RulesPage />);

		await screen.findByRole('option', { name: 'Decrease sodium' });
		const roleInput = screen.getByLabelText('rules.roleOrTechnique');
		fireEvent.focus(roleInput);
		fireEvent.change(roleInput, { target: { value: 'Binding agent' } });
		fireEvent.mouseDown(screen.getByText('rules.addOption'));

		await waitFor(() => expect(createRoleOrTechniqueMock).toHaveBeenCalledWith('Binding agent'));
	});

	it('blocks adding a rule whose business key already exists', async () => {
		fetchNewRuleOptionsMock.mockResolvedValue(OPTIONS);
		fetchRulesMock.mockResolvedValue([NEW_RULE]);

		render(<RulesPage />);

		await screen.findByRole('option', { name: 'Decrease sodium' });
		fireEvent.change(screen.getByLabelText('rules.recommendation'), { target: { value: 'r1' } });
		fireEvent.focus(screen.getByLabelText('rules.triggerIngredient'));
		fireEvent.mouseDown(screen.getByRole('button', { name: 'Soy sauce' }));
		fireEvent.focus(screen.getByLabelText('rules.roleOrTechnique'));
		fireEvent.mouseDown(screen.getByRole('button', { name: 'seasoning' }));

		expect(screen.getByText('rules.duplicateRule')).not.toBeNull();
		expect((screen.getByText('rules.addRule') as HTMLButtonElement).disabled).toBe(true);
		expect(createRuleMock).not.toHaveBeenCalled();
	});

	it('opens the trigger ingredient edit dialog from its grid cell and stages the edit', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchTriggerIngredientMock.mockResolvedValue({ name: 'Beef', explanationForLlm: 'Red meat.', version: 0 });
		editTriggerIngredientMock.mockResolvedValue(undefined);

		render(<RulesPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'rules.editTriggerIngredient' }));

		const nameInput = (await screen.findByLabelText('rules.editName')) as HTMLInputElement;
		expect(nameInput.value).toBe('Beef');
		expect(fetchTriggerIngredientMock).toHaveBeenCalledWith('tb');
		fireEvent.change(nameInput, { target: { value: 'Bovine' } });
		fireEvent.click(screen.getByText('rules.editSave'));

		await waitFor(() => expect(editTriggerIngredientMock).toHaveBeenCalledWith('tb', 'Bovine', 'Red meat.', 0));
		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
	});

	it('opens the role or technique edit dialog from its grid cell', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchRoleOrTechniqueMock.mockResolvedValue({ name: 'minced in sauce', explanationForLlm: null, version: 0 });
		editRoleOrTechniqueMock.mockResolvedValue(undefined);

		render(<RulesPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'rules.editRoleOrTechnique' }));

		const nameInput = (await screen.findByLabelText('rules.editName')) as HTMLInputElement;
		fireEvent.change(nameInput, { target: { value: 'folded through' } });
		fireEvent.click(screen.getByText('rules.editSave'));

		await waitFor(() => expect(editRoleOrTechniqueMock).toHaveBeenCalledWith('rm', 'folded through', null, 0));
	});

	it('highlights only the trigger cell when a shared trigger ingredient edit is pending', async () => {
		fetchRulesMock.mockResolvedValue([{ ...UNCHANGED_RULE, changedFields: ['TRIGGER_INGREDIENT'] }]);

		render(<RulesPage />);

		const triggerCell = (await screen.findByText('Beef')).closest('td');
		expect(triggerCell?.className).toContain('bg-warning');
		const roleCell = screen.getByText('minced in sauce').closest('td');
		expect(roleCell?.className).not.toContain('bg-warning');
		const row = screen.getByText('Beef').closest('tr');
		expect(row?.className).not.toContain('bg-success');
		expect(row?.className).not.toContain('bg-error');
	});

	it('offers rationale revert only when the rationale field itself is changed, not a staged deactivation', async () => {
		fetchRulesMock.mockResolvedValue([DEACTIVATED_RULE]);

		render(<RulesPage />);

		await screen.findByText('rules.activate');
		expect(screen.queryByText('rules.revert')).toBeNull();
		expect(screen.getByText('rules.pendingBadge')).not.toBeNull();
	});

	it('warns and refreshes the grid when a shared edit is rejected as stale', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchTriggerIngredientMock.mockResolvedValue({ name: 'Beef', explanationForLlm: null, version: 0 });
		editTriggerIngredientMock.mockRejectedValue(new ApiError(409, 'conflict'));

		render(<RulesPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'rules.editTriggerIngredient' }));
		fireEvent.change(await screen.findByLabelText('rules.editName'), { target: { value: 'Bovine' } });
		fireEvent.click(screen.getByText('rules.editSave'));

		expect(await screen.findByText('rules.staleReload')).not.toBeNull();
		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
	});
});
