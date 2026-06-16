import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import { createRule, fetchNewRuleOptions, fetchRules, revertRationale, setActive, stageRationale } from '@/api/rules';
import { RulesPage } from './RulesPage';

vi.mock('@/api/rules', () => ({
	fetchRules: vi.fn(),
	stageRationale: vi.fn(),
	revertRationale: vi.fn(),
	setActive: vi.fn(),
	fetchNewRuleOptions: vi.fn(),
	createRule: vi.fn(),
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const fetchRulesMock = vi.mocked(fetchRules);
const stageRationaleMock = vi.mocked(stageRationale);
const revertRationaleMock = vi.mocked(revertRationale);
const setActiveMock = vi.mocked(setActive);
const fetchNewRuleOptionsMock = vi.mocked(fetchNewRuleOptions);
const createRuleMock = vi.mocked(createRule);

const OPTIONS = {
	recommendations: [{ id: 'r1', name: 'Decrease sodium' }],
	triggerIngredients: [{ id: 't1', name: 'Soy sauce' }],
	rolesOrTechniques: [{ id: 'k1', name: 'seasoning' }],
};

const NEW_RULE = {
	id: 'n1',
	recommendation: 'Decrease sodium',
	triggerIngredient: 'Soy sauce',
	roleOrTechnique: 'seasoning',
	rationale: null,
	active: true,
	changeState: 'NEW' as const,
	version: 1,
};

const UNCHANGED_RULE = {
	id: '1',
	recommendation: 'Decrease red meat',
	triggerIngredient: 'Beef',
	roleOrTechnique: 'minced in sauce',
	rationale: 'Use plant proteins.',
	active: true,
	changeState: 'UNCHANGED' as const,
	version: 0,
};

const ROLELESS_RULE = {
	id: '2',
	recommendation: 'Decrease red meat',
	triggerIngredient: 'Beef',
	roleOrTechnique: null,
	rationale: null,
	active: true,
	changeState: 'UNCHANGED' as const,
	version: 0,
};

const CHANGED_RULE = { ...UNCHANGED_RULE, changeState: 'CHANGED' as const, version: 3 };
const DEACTIVATED_RULE = { ...UNCHANGED_RULE, active: false, changeState: 'CHANGED' as const, version: 3 };

describe('RulesPage', () => {
	beforeEach(() => {
		fetchRulesMock.mockReset();
		stageRationaleMock.mockReset();
		revertRationaleMock.mockReset();
		setActiveMock.mockReset();
		fetchNewRuleOptionsMock.mockReset();
		createRuleMock.mockReset();
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

	it('renders a new rule as a green row with a pending badge and no deactivate or revert', async () => {
		fetchRulesMock.mockResolvedValue([NEW_RULE]);

		render(<RulesPage />);

		const row = (await screen.findByText('seasoning')).closest('tr');
		expect(row?.className).toContain('bg-success');
		expect(screen.queryByText('rules.pendingBadge')).not.toBeNull();
		expect(screen.queryByText('rules.deactivate')).toBeNull();
		expect(screen.queryByText('rules.activate')).toBeNull();
		expect(screen.queryByText('rules.revert')).toBeNull();
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
});
