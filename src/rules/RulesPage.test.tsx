import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError } from '@/api/client';
import {
	addSuggestionTemplate,
	createAlternativeIngredient,
	createRoleOrTechnique,
	createRule,
	createTriggerIngredient,
	discardNewRule,
	discardSuggestionTemplate,
	editAlternativeIngredient,
	editRoleOrTechnique,
	editTriggerIngredient,
	fetchAlternativeIngredient,
	fetchAlternativeIngredientOptions,
	fetchAlternativeIngredientTranslations,
	fetchNewRuleOptions,
	fetchRationaleTranslations,
	fetchRoleOrTechnique,
	fetchRoleOrTechniqueTranslations,
	fetchRules,
	fetchSuggestionTemplates,
	fetchTemplateFieldTranslations,
	fetchTriggerIngredient,
	fetchTriggerIngredientTranslations,
	type AlternativeIngredientDetails,
	type Language,
	type ReferenceDetails,
	revertAlternativeIngredient,
	revertAlternativeIngredientTranslation,
	revertRationale,
	revertRationaleTranslation,
	revertRoleOrTechnique,
	revertRoleOrTechniqueTranslation,
	revertSuggestionTemplateField,
	revertTemplateFieldTranslation,
	revertTriggerIngredient,
	revertTriggerIngredientTranslation,
	setActive,
	setActiveSuggestionTemplate,
	stageAlternativeIngredientTranslation,
	stageRationale,
	stageRationaleTranslation,
	stageRoleOrTechniqueTranslation,
	stageSuggestionTemplateField,
	stageTemplateFieldTranslation,
	stageTriggerIngredientTranslation,
	type Rule,
	type SuggestionTemplate,
	type TemplateField,
	type TranslationState,
} from '@/rules/rules';
import { RulesPage } from './RulesPage';

vi.mock('@/rules/rules', () => ({
	fetchRules: vi.fn(),
	fetchSuggestionTemplates: vi.fn(),
	addSuggestionTemplate: vi.fn(),
	discardSuggestionTemplate: vi.fn(),
	fetchAlternativeIngredientOptions: vi.fn(),
	createAlternativeIngredient: vi.fn(),
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
	revertTriggerIngredient: vi.fn(),
	revertRoleOrTechnique: vi.fn(),
	fetchAlternativeIngredient: vi.fn(),
	editAlternativeIngredient: vi.fn(),
	revertAlternativeIngredient: vi.fn(),
	fetchAlternativeIngredientTranslations: vi.fn(),
	stageAlternativeIngredientTranslation: vi.fn(),
	revertAlternativeIngredientTranslation: vi.fn(),
	stageSuggestionTemplateField: vi.fn(),
	revertSuggestionTemplateField: vi.fn(),
	setActiveSuggestionTemplate: vi.fn(),
	fetchTemplateFieldTranslations: vi.fn(),
	stageTemplateFieldTranslation: vi.fn(),
	revertTemplateFieldTranslation: vi.fn(),
	fetchRationaleTranslations: vi.fn(),
	stageRationaleTranslation: vi.fn(),
	revertRationaleTranslation: vi.fn(),
	fetchTriggerIngredientTranslations: vi.fn(),
	fetchRoleOrTechniqueTranslations: vi.fn(),
	stageTriggerIngredientTranslation: vi.fn(),
	revertTriggerIngredientTranslation: vi.fn(),
	stageRoleOrTechniqueTranslation: vi.fn(),
	revertRoleOrTechniqueTranslation: vi.fn(),
	LANGUAGES: ['EL', 'LT', 'NL'],
}));
vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const fetchRulesMock = vi.mocked(fetchRules);
const fetchSuggestionTemplatesMock = vi.mocked(fetchSuggestionTemplates);
const addSuggestionTemplateMock = vi.mocked(addSuggestionTemplate);
const discardSuggestionTemplateMock = vi.mocked(discardSuggestionTemplate);
const fetchAlternativeIngredientOptionsMock = vi.mocked(fetchAlternativeIngredientOptions);
const createAlternativeIngredientMock = vi.mocked(createAlternativeIngredient);
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
const revertTriggerIngredientMock = vi.mocked(revertTriggerIngredient);
const revertRoleOrTechniqueMock = vi.mocked(revertRoleOrTechnique);
const fetchAlternativeIngredientMock = vi.mocked(fetchAlternativeIngredient);
const editAlternativeIngredientMock = vi.mocked(editAlternativeIngredient);
const revertAlternativeIngredientMock = vi.mocked(revertAlternativeIngredient);
const fetchAlternativeIngredientTranslationsMock = vi.mocked(fetchAlternativeIngredientTranslations);
const stageAlternativeIngredientTranslationMock = vi.mocked(stageAlternativeIngredientTranslation);
const revertAlternativeIngredientTranslationMock = vi.mocked(revertAlternativeIngredientTranslation);
const fetchRationaleTranslationsMock = vi.mocked(fetchRationaleTranslations);
const stageRationaleTranslationMock = vi.mocked(stageRationaleTranslation);
const revertRationaleTranslationMock = vi.mocked(revertRationaleTranslation);
const fetchTriggerIngredientTranslationsMock = vi.mocked(fetchTriggerIngredientTranslations);
const fetchRoleOrTechniqueTranslationsMock = vi.mocked(fetchRoleOrTechniqueTranslations);
const stageTriggerIngredientTranslationMock = vi.mocked(stageTriggerIngredientTranslation);
const revertTriggerIngredientTranslationMock = vi.mocked(revertTriggerIngredientTranslation);
const stageRoleOrTechniqueTranslationMock = vi.mocked(stageRoleOrTechniqueTranslation);
const revertRoleOrTechniqueTranslationMock = vi.mocked(revertRoleOrTechniqueTranslation);
const stageSuggestionTemplateFieldMock = vi.mocked(stageSuggestionTemplateField);
const revertSuggestionTemplateFieldMock = vi.mocked(revertSuggestionTemplateField);
const setActiveSuggestionTemplateMock = vi.mocked(setActiveSuggestionTemplate);
const fetchTemplateFieldTranslationsMock = vi.mocked(fetchTemplateFieldTranslations);
const stageTemplateFieldTranslationMock = vi.mocked(stageTemplateFieldTranslation);
const revertTemplateFieldTranslationMock = vi.mocked(revertTemplateFieldTranslation);

const NO_TRANSLATIONS: Record<Language, TranslationState> = { EL: 'MISSING', LT: 'MISSING', NL: 'MISSING' };
const NO_TEMPLATE_TRANSLATIONS: Record<TemplateField, Record<Language, TranslationState>> = {
	RESTRICTION: NO_TRANSLATIONS,
	EQUIVALENCE: NO_TRANSLATIONS,
	TECHNIQUE_NOTES: NO_TRANSLATIONS,
};

function template(
	id: string,
	alternativeIngredientName: string,
	fields: Partial<Omit<SuggestionTemplate, 'id' | 'alternativeIngredientName'>> = {},
): SuggestionTemplate {
	return {
		id,
		alternativeIngredientId: `${id}-alt`,
		alternativeIngredientName,
		restriction: null,
		equivalence: null,
		techniqueNotes: null,
		changedFields: [],
		translations: NO_TEMPLATE_TRANSLATIONS,
		alternativeIngredientTranslations: NO_TRANSLATIONS,
		active: true,
		activeChanged: false,
		published: true,
		version: 0,
		...fields,
	};
}

const ALTERNATIVE_OPTIONS = [
	{ id: 'a1', name: 'Smoked tofu cubes' },
	{ id: 'a2', name: 'Seitan steak' },
];
const NO_STAGED_TRANSLATIONS = {
	EL: { text: null, version: 0 },
	LT: { text: null, version: 0 },
	NL: { text: null, version: 0 },
};
const NO_REFERENCE_TRANSLATIONS: Record<Language, ReferenceDetails> = {
	EL: { name: null, explanationForLlm: null, version: 0, published: false },
	LT: { name: null, explanationForLlm: null, version: 0, published: false },
	NL: { name: null, explanationForLlm: null, version: 0, published: false },
};
const ALTERNATIVE_DETAILS: AlternativeIngredientDetails = {
	name: 'Smoked tofu cubes',
	explanationForLlm: 'Pressed and smoked.',
	version: 2,
	published: true,
	referenceCount: 3,
};

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
	rationaleTranslations: NO_TRANSLATIONS,
	triggerIngredientTranslations: NO_TRANSLATIONS,
	roleOrTechniqueTranslations: NO_TRANSLATIONS,
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
	rationaleTranslations: NO_TRANSLATIONS,
	triggerIngredientTranslations: NO_TRANSLATIONS,
	roleOrTechniqueTranslations: NO_TRANSLATIONS,
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
	rationaleTranslations: NO_TRANSLATIONS,
	triggerIngredientTranslations: NO_TRANSLATIONS,
	roleOrTechniqueTranslations: NO_TRANSLATIONS,
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
		fetchSuggestionTemplatesMock.mockReset();
		addSuggestionTemplateMock.mockReset();
		discardSuggestionTemplateMock.mockReset();
		fetchAlternativeIngredientOptionsMock.mockReset();
		createAlternativeIngredientMock.mockReset();
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
		revertTriggerIngredientMock.mockReset();
		revertRoleOrTechniqueMock.mockReset();
		fetchAlternativeIngredientMock.mockReset();
		editAlternativeIngredientMock.mockReset();
		revertAlternativeIngredientMock.mockReset();
		fetchAlternativeIngredientTranslationsMock.mockReset();
		stageAlternativeIngredientTranslationMock.mockReset();
		revertAlternativeIngredientTranslationMock.mockReset();
		fetchRationaleTranslationsMock.mockReset();
		stageRationaleTranslationMock.mockReset();
		revertRationaleTranslationMock.mockReset();
		fetchTriggerIngredientTranslationsMock.mockReset();
		fetchRoleOrTechniqueTranslationsMock.mockReset();
		stageTriggerIngredientTranslationMock.mockReset();
		revertTriggerIngredientTranslationMock.mockReset();
		stageRoleOrTechniqueTranslationMock.mockReset();
		revertRoleOrTechniqueTranslationMock.mockReset();
		stageSuggestionTemplateFieldMock.mockReset();
		revertSuggestionTemplateFieldMock.mockReset();
		setActiveSuggestionTemplateMock.mockReset();
		fetchTemplateFieldTranslationsMock.mockReset();
		stageTemplateFieldTranslationMock.mockReset();
		revertTemplateFieldTranslationMock.mockReset();
		fetchNewRuleOptionsMock.mockResolvedValue({
			recommendations: [],
			triggerIngredients: [],
			rolesOrTechniques: [],
		});
		fetchTriggerIngredientTranslationsMock.mockResolvedValue(NO_REFERENCE_TRANSLATIONS);
		fetchRoleOrTechniqueTranslationsMock.mockResolvedValue(NO_REFERENCE_TRANSLATIONS);
		fetchTemplateFieldTranslationsMock.mockResolvedValue(NO_STAGED_TRANSLATIONS);
		fetchAlternativeIngredientOptionsMock.mockResolvedValue(ALTERNATIVE_OPTIONS);
		fetchAlternativeIngredientMock.mockResolvedValue(ALTERNATIVE_DETAILS);
		fetchAlternativeIngredientTranslationsMock.mockResolvedValue(NO_REFERENCE_TRANSLATIONS);
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

	it('offers revert for a rationale just edited inline and reverts it against the staged version', async () => {
		fetchRulesMock.mockResolvedValueOnce([UNCHANGED_RULE]).mockResolvedValueOnce([UNCHANGED_RULE]);
		stageRationaleMock.mockResolvedValue(5);
		revertRationaleMock.mockResolvedValue(undefined);

		render(<RulesPage />);

		const input = (await screen.findByLabelText('rules.rationaleEditLabel')) as HTMLInputElement;
		fireEvent.change(input, { target: { value: 'Prefer legumes.' } });
		fireEvent.blur(input);

		fireEvent.click(await screen.findByText('rules.revert'));

		await waitFor(() => expect(revertRationaleMock).toHaveBeenCalledWith('1', 5));
	});

	it('does not offer revert for a new rule whose rationale is edited inline, only discard', async () => {
		fetchRulesMock.mockResolvedValue([NEW_RULE]);
		stageRationaleMock.mockResolvedValue(2);

		render(<RulesPage />);

		const input = (await screen.findByLabelText('rules.rationaleEditLabel')) as HTMLInputElement;
		fireEvent.change(input, { target: { value: 'Some rationale.' } });
		fireEvent.blur(input);

		await waitFor(() => expect(stageRationaleMock).toHaveBeenCalled());
		expect(screen.queryByText('rules.revert')).toBeNull();
		expect(screen.queryByText('rules.discard')).not.toBeNull();
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
		fetchTriggerIngredientMock.mockResolvedValue({
			name: 'Beef',
			explanationForLlm: 'Red meat.',
			version: 0,
			published: true,
		});
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
		fetchRoleOrTechniqueMock.mockResolvedValue({
			name: 'minced in sauce',
			explanationForLlm: null,
			version: 0,
			published: true,
		});
		editRoleOrTechniqueMock.mockResolvedValue(undefined);

		render(<RulesPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'rules.editRoleOrTechnique' }));

		const nameInput = (await screen.findByLabelText('rules.editName')) as HTMLInputElement;
		fireEvent.change(nameInput, { target: { value: 'folded through' } });
		fireEvent.click(screen.getByText('rules.editSave'));

		await waitFor(() => expect(editRoleOrTechniqueMock).toHaveBeenCalledWith('rm', 'folded through', null, 0));
	});

	it('reverts a staged trigger ingredient edit from the edit dialog against its version', async () => {
		fetchRulesMock.mockResolvedValueOnce([UNCHANGED_RULE]).mockResolvedValueOnce([UNCHANGED_RULE]);
		fetchTriggerIngredientMock.mockResolvedValue({
			name: 'Bovine',
			explanationForLlm: 'Edited.',
			version: 2,
			published: true,
		});
		revertTriggerIngredientMock.mockResolvedValue(undefined);

		render(<RulesPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'rules.editTriggerIngredient' }));
		await screen.findByLabelText('rules.editName');
		fireEvent.click(screen.getByText('rules.editRevert'));

		await waitFor(() => expect(revertTriggerIngredientMock).toHaveBeenCalledWith('tb', 2));
		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
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
		fetchTriggerIngredientMock.mockResolvedValue({
			name: 'Beef',
			explanationForLlm: null,
			version: 0,
			published: true,
		});
		editTriggerIngredientMock.mockRejectedValue(new ApiError(409, 'conflict'));

		render(<RulesPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'rules.editTriggerIngredient' }));
		fireEvent.change(await screen.findByLabelText('rules.editName'), { target: { value: 'Bovine' } });
		fireEvent.click(screen.getByText('rules.editSave'));

		expect(await screen.findByText('rules.staleReload')).not.toBeNull();
		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
	});

	it('shows a per-language rationale-translation completeness chip styled by state', async () => {
		fetchRulesMock.mockResolvedValue([
			{ ...UNCHANGED_RULE, rationaleTranslations: { EL: 'STAGED', LT: 'MISSING', NL: 'PRESENT' } },
		]);

		render(<RulesPage />);

		const rationaleCell = (await screen.findByLabelText('rules.rationaleEditLabel')).closest('td') as HTMLElement;
		expect(within(rationaleCell).getByText('EL').closest('.badge')?.className).toContain('badge-warning');
		expect(within(rationaleCell).getByText('LT').closest('.badge')?.className).toContain('badge-ghost');
		expect(within(rationaleCell).getByText('NL').closest('.badge')?.className).toContain('badge-success');
	});

	it('shows per-language trigger and role translation completeness chips styled by state', async () => {
		fetchRulesMock.mockResolvedValue([
			{
				...UNCHANGED_RULE,
				triggerIngredientTranslations: { EL: 'PRESENT', LT: 'STAGED', NL: 'MISSING' },
				roleOrTechniqueTranslations: { EL: 'MISSING', LT: 'MISSING', NL: 'PRESENT' },
			},
		]);

		render(<RulesPage />);

		const triggerCell = (await screen.findByText('Beef')).closest('td') as HTMLElement;
		expect(within(triggerCell).getByText('EL').closest('.badge')?.className).toContain('badge-success');
		expect(within(triggerCell).getByText('LT').closest('.badge')?.className).toContain('badge-warning');
		expect(within(triggerCell).getByText('NL').closest('.badge')?.className).toContain('badge-ghost');
		const roleCell = screen.getByText('minced in sauce').closest('td') as HTMLElement;
		expect(within(roleCell).getByText('NL').closest('.badge')?.className).toContain('badge-success');
	});

	it('stages a trigger ingredient translation from the translations dialog against its version', async () => {
		fetchRulesMock.mockResolvedValueOnce([UNCHANGED_RULE]).mockResolvedValueOnce([UNCHANGED_RULE]);
		fetchTriggerIngredientTranslationsMock.mockResolvedValue(NO_REFERENCE_TRANSLATIONS);
		stageTriggerIngredientTranslationMock.mockResolvedValue(undefined);

		render(<RulesPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'rules.editTriggerTranslations' }));
		const greekName = (await screen.findByLabelText('EL rules.editName')) as HTMLInputElement;
		fireEvent.change(greekName, { target: { value: 'Βόειο' } });
		fireEvent.click(screen.getAllByText('rules.translationSave')[0]);

		await waitFor(() =>
			expect(stageTriggerIngredientTranslationMock).toHaveBeenCalledWith('tb', 'EL', 'Βόειο', null, 0),
		);
		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
	});

	it('keeps the translations dialog open and preserves other languages’ edits after saving one', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchTriggerIngredientTranslationsMock.mockResolvedValueOnce(NO_REFERENCE_TRANSLATIONS).mockResolvedValue({
			EL: { name: 'Βόειο', explanationForLlm: null, version: 1, published: false },
			LT: { name: null, explanationForLlm: null, version: 0, published: false },
			NL: { name: null, explanationForLlm: null, version: 0, published: false },
		});
		stageTriggerIngredientTranslationMock.mockResolvedValue(undefined);

		render(<RulesPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'rules.editTriggerTranslations' }));
		const greekName = (await screen.findByLabelText('EL rules.editName')) as HTMLInputElement;
		fireEvent.change(greekName, { target: { value: 'Βόειο' } });
		fireEvent.change(screen.getByLabelText('LT rules.editName'), { target: { value: 'Jautiena' } });
		fireEvent.click(screen.getAllByText('rules.translationSave')[0]);

		await waitFor(() =>
			expect(stageTriggerIngredientTranslationMock).toHaveBeenCalledWith('tb', 'EL', 'Βόειο', null, 0),
		);
		await waitFor(() =>
			expect((screen.getByLabelText('LT rules.editName') as HTMLInputElement).value).toBe('Jautiena'),
		);
		expect(fetchTriggerIngredientTranslationsMock).toHaveBeenCalledTimes(2);
	});

	it('reverts a staged role or technique translation from the translations dialog', async () => {
		fetchRulesMock.mockResolvedValueOnce([UNCHANGED_RULE]).mockResolvedValueOnce([UNCHANGED_RULE]);
		fetchRoleOrTechniqueTranslationsMock.mockResolvedValue({
			EL: { name: 'ανάμεικτο', explanationForLlm: null, version: 4, published: true },
			LT: { name: null, explanationForLlm: null, version: 0, published: false },
			NL: { name: null, explanationForLlm: null, version: 0, published: false },
		});
		revertRoleOrTechniqueTranslationMock.mockResolvedValue(undefined);

		render(<RulesPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'rules.editRoleTranslations' }));
		fireEvent.click(await screen.findByText('rules.translationRevert'));

		await waitFor(() => expect(revertRoleOrTechniqueTranslationMock).toHaveBeenCalledWith('rm', 'EL', 4));
		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
	});

	it('opens the rationale translations dialog and stages a translation against its base version', async () => {
		fetchRulesMock.mockResolvedValueOnce([UNCHANGED_RULE]).mockResolvedValueOnce([UNCHANGED_RULE]);
		fetchRationaleTranslationsMock.mockResolvedValue(NO_STAGED_TRANSLATIONS);
		stageRationaleTranslationMock.mockResolvedValue(undefined);

		render(<RulesPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'rules.editTranslations' }));

		const greek = (await screen.findByLabelText('EL')) as HTMLTextAreaElement;
		fireEvent.change(greek, { target: { value: 'Ελληνική αιτιολόγηση.' } });
		fireEvent.click(screen.getAllByText('rules.translationSave')[0]);

		await waitFor(() =>
			expect(stageRationaleTranslationMock).toHaveBeenCalledWith('1', 'EL', 'Ελληνική αιτιολόγηση.', 0),
		);
		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
	});

	it('keeps the rationale dialog open and preserves other languages’ edits after saving one', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchRationaleTranslationsMock.mockResolvedValueOnce(NO_STAGED_TRANSLATIONS).mockResolvedValue({
			EL: { text: 'Ελληνική.', version: 1 },
			LT: { text: null, version: 0 },
			NL: { text: null, version: 0 },
		});
		stageRationaleTranslationMock.mockResolvedValue(undefined);

		render(<RulesPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'rules.editTranslations' }));
		fireEvent.change((await screen.findByLabelText('EL')) as HTMLTextAreaElement, {
			target: { value: 'Ελληνική.' },
		});
		fireEvent.change(screen.getByLabelText('NL') as HTMLTextAreaElement, { target: { value: 'Nederlands.' } });
		fireEvent.click(screen.getAllByText('rules.translationSave')[0]);

		await waitFor(() => expect(stageRationaleTranslationMock).toHaveBeenCalledWith('1', 'EL', 'Ελληνική.', 0));
		await waitFor(() => expect((screen.getByLabelText('NL') as HTMLTextAreaElement).value).toBe('Nederlands.'));
		expect(fetchRationaleTranslationsMock).toHaveBeenCalledTimes(2);
	});

	it('reverts a staged rationale translation against its base version', async () => {
		fetchRulesMock
			.mockResolvedValueOnce([
				{ ...UNCHANGED_RULE, rationaleTranslations: { EL: 'STAGED', LT: 'MISSING', NL: 'MISSING' } },
			])
			.mockResolvedValueOnce([UNCHANGED_RULE]);
		fetchRationaleTranslationsMock.mockResolvedValue({
			EL: { text: 'Παλιά μετάφραση.', version: 2 },
			LT: { text: null, version: 0 },
			NL: { text: null, version: 0 },
		});
		revertRationaleTranslationMock.mockResolvedValue(undefined);

		render(<RulesPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'rules.editTranslations' }));
		fireEvent.click(await screen.findByText('rules.translationRevert'));

		await waitFor(() => expect(revertRationaleTranslationMock).toHaveBeenCalledWith('1', 'EL', 2));
		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
	});

	it('warns and refreshes the grid when staging a translation is rejected as stale', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchRationaleTranslationsMock.mockResolvedValue(NO_STAGED_TRANSLATIONS);
		stageRationaleTranslationMock.mockRejectedValue(new ApiError(409, 'conflict'));

		render(<RulesPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'rules.editTranslations' }));
		fireEvent.change((await screen.findByLabelText('NL')) as HTMLTextAreaElement, {
			target: { value: 'Nederlands.' },
		});
		fireEvent.click(screen.getAllByText('rules.translationSave')[2]);

		expect(await screen.findByText('rules.staleReload')).not.toBeNull();
		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
	});

	it('lazily loads and shows the suggestion templates when a row is expanded', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockResolvedValue([
			template('s1', 'Brown lentils (cooked)', {
				restriction: 'Not for burgers without binder',
				equivalence: '1:1',
				techniqueNotes: 'Dry sauté',
			}),
			template('s2', 'Soy mince'),
		]);

		render(<RulesPage />);

		await screen.findByLabelText('rules.rationaleEditLabel');
		expect(fetchSuggestionTemplatesMock).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole('button', { name: 'rules.toggleSuggestions' }));

		expect(await screen.findByText('Brown lentils (cooked)')).not.toBeNull();
		expect(screen.getByText('Soy mince')).not.toBeNull();
		expect(
			(screen.getByLabelText('rules.templateRestriction Brown lentils (cooked)') as HTMLInputElement).value,
		).toBe('Not for burgers without binder');
		expect(fetchSuggestionTemplatesMock).toHaveBeenCalledWith('1');
	});

	it('shows an empty-panel message for a rule with no suggestion templates', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockResolvedValue([]);

		render(<RulesPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));

		expect(await screen.findByText('rules.noTemplates')).not.toBeNull();
	});

	it('collapses the suggestion-templates panel when the expander is toggled again', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockResolvedValue([template('s1', 'Brown lentils (cooked)')]);

		render(<RulesPage />);

		const toggle = await screen.findByRole('button', { name: 'rules.toggleSuggestions' });
		fireEvent.click(toggle);
		expect(await screen.findByText('Brown lentils (cooked)')).not.toBeNull();

		fireEvent.click(toggle);
		await waitFor(() => expect(screen.queryByText('Brown lentils (cooked)')).toBeNull());
		expect(fetchSuggestionTemplatesMock).toHaveBeenCalledTimes(1);
	});

	it('shows an error in the panel when the suggestion templates fail to load', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockRejectedValue(new Error('boom'));

		render(<RulesPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));

		expect(await screen.findByText('rules.templatesLoadError')).not.toBeNull();
	});

	it('lights the Suggestions expander cell when a rule has a staged template change without marking it pending', async () => {
		fetchRulesMock.mockResolvedValue([{ ...UNCHANGED_RULE, changedFields: ['SUGGESTION_TEMPLATES'] }]);

		render(<RulesPage />);

		const expander = await screen.findByRole('button', { name: 'rules.toggleSuggestions' });
		expect(expander.closest('td')?.className).toContain('bg-warning');
		expect(screen.queryByText('rules.pendingBadge')).toBeNull();
	});

	it('highlights only the suggestion-template field that has a staged change', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockResolvedValue([
			template('s1', 'Brown lentils (cooked)', {
				restriction: 'Edited',
				changedFields: ['RESTRICTION'],
				version: 1,
			}),
		]);

		render(<RulesPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));
		const restriction = (await screen.findByLabelText(
			'rules.templateRestriction Brown lentils (cooked)',
		)) as HTMLInputElement;
		expect(restriction.value).toBe('Edited');
		expect(restriction.className).toContain('bg-warning');
		const equivalence = screen.getByLabelText(
			'rules.templateEquivalence Brown lentils (cooked)',
		) as HTMLInputElement;
		expect(equivalence.className).not.toContain('bg-warning');
	});

	it('stages a suggestion-template field edit against its version and lights the rule Suggestions flag', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockResolvedValue([
			template('s1', 'Brown lentils (cooked)', { restriction: 'Old restriction' }),
		]);
		stageSuggestionTemplateFieldMock.mockResolvedValue(1);

		render(<RulesPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));
		const input = (await screen.findByLabelText(
			'rules.templateRestriction Brown lentils (cooked)',
		)) as HTMLInputElement;
		fireEvent.change(input, { target: { value: 'New restriction' } });
		fireEvent.blur(input);

		await waitFor(() =>
			expect(screen.getByRole('button', { name: 'rules.toggleSuggestions' }).closest('td')?.className).toContain(
				'bg-warning',
			),
		);
		expect(stageSuggestionTemplateFieldMock).toHaveBeenCalledWith('s1', 'RESTRICTION', 'New restriction', 0);
	});

	it('does not stage a suggestion-template field left unchanged', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockResolvedValue([
			template('s1', 'Brown lentils (cooked)', { restriction: 'Old restriction' }),
		]);

		render(<RulesPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));
		const input = (await screen.findByLabelText(
			'rules.templateRestriction Brown lentils (cooked)',
		)) as HTMLInputElement;
		fireEvent.blur(input);

		expect(stageSuggestionTemplateFieldMock).not.toHaveBeenCalled();
	});

	it('reverts a staged suggestion-template field against its version and refreshes', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock
			.mockResolvedValueOnce([
				template('s1', 'Brown lentils (cooked)', {
					restriction: 'Staged restriction',
					changedFields: ['RESTRICTION'],
					version: 2,
				}),
			])
			.mockResolvedValueOnce([template('s1', 'Brown lentils (cooked)', { restriction: 'Master restriction' })]);
		revertSuggestionTemplateFieldMock.mockResolvedValue(undefined);

		render(<RulesPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));
		await screen.findByLabelText('rules.templateRestriction Brown lentils (cooked)');
		fireEvent.click(screen.getByText('rules.revert'));

		await waitFor(() => expect(revertSuggestionTemplateFieldMock).toHaveBeenCalledWith('s1', 'RESTRICTION', 2));
		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
	});

	it('deactivates a template against its version and refreshes the panel to offer reactivation', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock
			.mockResolvedValueOnce([template('s1', 'Brown lentils (cooked)', { version: 2 })])
			.mockResolvedValueOnce([
				template('s1', 'Brown lentils (cooked)', { active: false, activeChanged: true, version: 3 }),
			]);
		setActiveSuggestionTemplateMock.mockResolvedValue(undefined);

		render(<RulesPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));
		fireEvent.click(await screen.findByRole('button', { name: 'rules.deactivate Brown lentils (cooked)' }));

		await waitFor(() => expect(setActiveSuggestionTemplateMock).toHaveBeenCalledWith('s1', false, 2));
		expect(await screen.findByRole('button', { name: 'rules.activate Brown lentils (cooked)' })).not.toBeNull();
		expect(screen.getByText('rules.templateDeactivated')).not.toBeNull();
		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
	});

	it('marks a deactivated template and offers reactivation', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockResolvedValue([
			template('s1', 'Brown lentils (cooked)', { active: false, activeChanged: true, version: 4 }),
		]);

		render(<RulesPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));

		expect(await screen.findByText('rules.templateDeactivated')).not.toBeNull();
		expect(screen.getByRole('button', { name: 'rules.activate Brown lentils (cooked)' })).not.toBeNull();
		expect(screen.queryByRole('button', { name: 'rules.deactivate Brown lentils (cooked)' })).toBeNull();
	});

	it('warns and refreshes the grid when staging a suggestion-template field is rejected as stale', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockResolvedValue([
			template('s1', 'Brown lentils (cooked)', { restriction: 'Old restriction' }),
		]);
		stageSuggestionTemplateFieldMock.mockRejectedValue(new ApiError(409, 'conflict'));

		render(<RulesPage />);

		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));
		const input = (await screen.findByLabelText(
			'rules.templateRestriction Brown lentils (cooked)',
		)) as HTMLInputElement;
		fireEvent.change(input, { target: { value: 'New restriction' } });
		fireEvent.blur(input);

		expect(await screen.findByText('rules.staleReload')).not.toBeNull();
		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
	});

	it('shows an independent translation chip-set per suggestion-template field', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockResolvedValue([
			template('s1', 'Brown lentils (cooked)', {
				translations: {
					RESTRICTION: { EL: 'STAGED', LT: 'PRESENT', NL: 'MISSING' },
					EQUIVALENCE: NO_TRANSLATIONS,
					TECHNIQUE_NOTES: NO_TRANSLATIONS,
				},
			}),
		]);

		render(<RulesPage />);
		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));

		const restrictionChips = await screen.findByLabelText(
			'rules.editTemplateTranslations rules.templateRestriction Brown lentils (cooked)',
		);
		const badges = restrictionChips.querySelectorAll('.badge');
		expect(badges[0].className).toContain('badge-warning');
		expect(badges[1].className).toContain('badge-success');
		expect(badges[2].className).toContain('badge-ghost');

		const equivalenceChips = screen.getByLabelText(
			'rules.editTemplateTranslations rules.templateEquivalence Brown lentils (cooked)',
		);
		expect(equivalenceChips.querySelectorAll('.badge-warning')).toHaveLength(0);
	});

	it('opens the per-field translations dialog and stages a template translation', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockResolvedValue([
			template('s1', 'Brown lentils (cooked)', { restriction: 'No binder' }),
		]);
		stageTemplateFieldTranslationMock.mockResolvedValue(undefined);

		render(<RulesPage />);
		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));
		fireEvent.click(
			await screen.findByLabelText(
				'rules.editTemplateTranslations rules.templateRestriction Brown lentils (cooked)',
			),
		);

		const dialog = await screen.findByRole('dialog', {
			name: 'rules.templateRestriction — Brown lentils (cooked)',
		});
		const greek = within(dialog).getByLabelText('EL');
		fireEvent.change(greek, { target: { value: 'Greek restriction' } });
		fireEvent.click(within(dialog).getAllByText('rules.translationSave')[0]);

		await waitFor(() =>
			expect(stageTemplateFieldTranslationMock).toHaveBeenCalledWith(
				's1',
				'RESTRICTION',
				'EL',
				'Greek restriction',
				0,
			),
		);
		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
		await waitFor(() => expect(fetchSuggestionTemplatesMock).toHaveBeenCalledTimes(2));
	});

	it('keeps the template-field dialog open and preserves other languages’ edits after saving one', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockResolvedValue([
			template('s1', 'Brown lentils (cooked)', { restriction: 'No binder' }),
		]);
		fetchTemplateFieldTranslationsMock.mockResolvedValueOnce(NO_STAGED_TRANSLATIONS).mockResolvedValue({
			EL: { text: 'Greek restriction', version: 1 },
			LT: { text: null, version: 0 },
			NL: { text: null, version: 0 },
		});
		stageTemplateFieldTranslationMock.mockResolvedValue(undefined);

		render(<RulesPage />);
		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));
		fireEvent.click(
			await screen.findByLabelText(
				'rules.editTemplateTranslations rules.templateRestriction Brown lentils (cooked)',
			),
		);

		const dialog = await screen.findByRole('dialog', {
			name: 'rules.templateRestriction — Brown lentils (cooked)',
		});
		fireEvent.change(within(dialog).getByLabelText('EL'), { target: { value: 'Greek restriction' } });
		fireEvent.change(within(dialog).getByLabelText('LT'), { target: { value: 'Lietuviškai' } });
		fireEvent.click(within(dialog).getAllByText('rules.translationSave')[0]);

		await waitFor(() =>
			expect(stageTemplateFieldTranslationMock).toHaveBeenCalledWith(
				's1',
				'RESTRICTION',
				'EL',
				'Greek restriction',
				0,
			),
		);
		await waitFor(() =>
			expect((within(dialog).getByLabelText('LT') as HTMLTextAreaElement).value).toBe('Lietuviškai'),
		);
		expect(fetchTemplateFieldTranslationsMock).toHaveBeenCalledTimes(2);
	});

	it('reverts a staged template translation from the dialog and refreshes', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockResolvedValue([
			template('s1', 'Brown lentils (cooked)', { restriction: 'No binder' }),
		]);
		fetchTemplateFieldTranslationsMock.mockResolvedValue({
			EL: { text: 'Greek restriction', version: 4 },
			LT: { text: null, version: 0 },
			NL: { text: null, version: 0 },
		});
		revertTemplateFieldTranslationMock.mockResolvedValue(undefined);

		render(<RulesPage />);
		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));
		fireEvent.click(
			await screen.findByLabelText(
				'rules.editTemplateTranslations rules.templateRestriction Brown lentils (cooked)',
			),
		);

		const dialog = await screen.findByRole('dialog', {
			name: 'rules.templateRestriction — Brown lentils (cooked)',
		});
		fireEvent.click(within(dialog).getByText('rules.translationRevert'));

		await waitFor(() =>
			expect(revertTemplateFieldTranslationMock).toHaveBeenCalledWith('s1', 'RESTRICTION', 'EL', 4),
		);
		await waitFor(() => expect(fetchRulesMock).toHaveBeenCalledTimes(2));
	});

	it('adds a template by choosing an existing alternative ingredient from the combobox', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockResolvedValue([]);
		addSuggestionTemplateMock.mockResolvedValue({ templateId: 's-new', created: true });

		render(<RulesPage />);
		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));

		const addInput = await screen.findByLabelText('rules.addTemplateLabel');
		fireEvent.focus(addInput);
		fireEvent.mouseDown(await screen.findByRole('button', { name: 'Smoked tofu cubes' }));

		await waitFor(() => expect(addSuggestionTemplateMock).toHaveBeenCalledWith('1', 'a1'));
		await waitFor(() => expect(fetchSuggestionTemplatesMock).toHaveBeenCalledTimes(2));
	});

	it('offers the existing template instead of a duplicate when the alternative is already on the rule', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockResolvedValue([
			template('s1', 'Smoked tofu cubes', { active: false, version: 2 }),
		]);
		addSuggestionTemplateMock.mockResolvedValue({ templateId: 's1', created: false });

		render(<RulesPage />);
		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));

		// the deactivated template is shown with a reactivate (Activate) affordance
		expect(await screen.findByLabelText('rules.activate Smoked tofu cubes')).not.toBeNull();

		const addInput = screen.getByLabelText('rules.addTemplateLabel');
		fireEvent.focus(addInput);
		fireEvent.mouseDown(await screen.findByRole('button', { name: 'Smoked tofu cubes' }));

		await waitFor(() => expect(addSuggestionTemplateMock).toHaveBeenCalledWith('1', 'a1'));
		expect(await screen.findByText('rules.templateAlreadyExists')).not.toBeNull();
		// still a single card, offering reactivation
		expect(screen.getAllByLabelText('rules.activate Smoked tofu cubes')).toHaveLength(1);
	});

	it('discards a new unpublished template from the panel instead of deactivating it', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockResolvedValue([
			template('s-new', 'Smoked tofu cubes', { published: false, version: 1 }),
		]);
		discardSuggestionTemplateMock.mockResolvedValue(undefined);

		render(<RulesPage />);
		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));

		const discard = await screen.findByLabelText('rules.discardTemplate Smoked tofu cubes');
		expect(screen.queryByLabelText('rules.deactivate Smoked tofu cubes')).toBeNull();

		fireEvent.click(discard);

		await waitFor(() => expect(discardSuggestionTemplateMock).toHaveBeenCalledWith('s-new', 1));
		await waitFor(() => expect(fetchSuggestionTemplatesMock).toHaveBeenCalledTimes(2));
	});

	it('stages a new template field edit without offering a per-field revert', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockResolvedValue([
			template('s-new', 'Smoked tofu cubes', { published: false, version: 1 }),
		]);
		stageSuggestionTemplateFieldMock.mockResolvedValue(2);

		render(<RulesPage />);
		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));

		const input = (await screen.findByLabelText('rules.templateRestriction Smoked tofu cubes')) as HTMLInputElement;
		fireEvent.change(input, { target: { value: 'Pat dry first' } });
		fireEvent.blur(input);

		await waitFor(() =>
			expect(stageSuggestionTemplateFieldMock).toHaveBeenCalledWith('s-new', 'RESTRICTION', 'Pat dry first', 1),
		);
		expect(screen.queryByText('rules.revert')).toBeNull();
		expect(input.className).not.toContain('bg-warning');
	});

	it('creates a new alternative ingredient from the add combobox and adds a template for it', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockResolvedValue([]);
		fetchAlternativeIngredientOptionsMock
			.mockResolvedValueOnce(ALTERNATIVE_OPTIONS)
			.mockResolvedValueOnce([...ALTERNATIVE_OPTIONS, { id: 'a3', name: 'Aquafaba' }]);
		createAlternativeIngredientMock.mockResolvedValue({ id: 'a3', name: 'Aquafaba' });
		addSuggestionTemplateMock.mockResolvedValue({ templateId: 's-new', created: true });

		render(<RulesPage />);
		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));

		const addInput = await screen.findByLabelText('rules.addTemplateLabel');
		fireEvent.focus(addInput);
		fireEvent.change(addInput, { target: { value: 'Aquafaba' } });
		fireEvent.mouseDown(await screen.findByRole('button', { name: 'rules.addOption' }));

		await waitFor(() => expect(createAlternativeIngredientMock).toHaveBeenCalledWith('Aquafaba'));
		await waitFor(() => expect(addSuggestionTemplateMock).toHaveBeenCalledWith('1', 'a3'));
	});

	it('falls back to the existing alternative ingredient when the create races a duplicate name', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockResolvedValue([]);
		fetchAlternativeIngredientOptionsMock
			.mockResolvedValueOnce(ALTERNATIVE_OPTIONS)
			.mockResolvedValueOnce([...ALTERNATIVE_OPTIONS, { id: 'a3', name: 'Aquafaba' }]);
		createAlternativeIngredientMock.mockRejectedValue(new ApiError(409, 'duplicate'));
		addSuggestionTemplateMock.mockResolvedValue({ templateId: 's-new', created: true });

		render(<RulesPage />);
		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));

		const addInput = await screen.findByLabelText('rules.addTemplateLabel');
		fireEvent.focus(addInput);
		fireEvent.change(addInput, { target: { value: 'Aquafaba' } });
		fireEvent.mouseDown(await screen.findByRole('button', { name: 'rules.addOption' }));

		await waitFor(() => expect(createAlternativeIngredientMock).toHaveBeenCalledWith('Aquafaba'));
		await waitFor(() => expect(addSuggestionTemplateMock).toHaveBeenCalledWith('1', 'a3'));
	});

	it('renders the alternative ingredient translation chips on a template card', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockResolvedValue([
			template('s1', 'Brown lentils (cooked)', {
				alternativeIngredientTranslations: { EL: 'PRESENT', LT: 'MISSING', NL: 'STAGED' },
			}),
		]);

		render(<RulesPage />);
		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));

		const chips = await screen.findByRole('button', {
			name: 'rules.editAlternativeTranslations Brown lentils (cooked)',
		});
		expect(within(chips).getAllByText('EL')[0].parentElement?.className).toContain('badge-success');
		expect(within(chips).getAllByText('NL')[0].parentElement?.className).toContain('badge-warning');
		expect(within(chips).getAllByText('LT')[0].parentElement?.className).toContain('badge-ghost');
	});

	it('edits a shared alternative ingredient from a template card and warns about the blast radius', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockResolvedValue([template('s1', 'Brown lentils (cooked)')]);
		editAlternativeIngredientMock.mockResolvedValue(undefined);

		render(<RulesPage />);
		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));
		fireEvent.click(
			await screen.findByRole('button', { name: 'rules.editAlternativeIngredient Brown lentils (cooked)' }),
		);

		const nameInput = (await screen.findByLabelText('rules.editName')) as HTMLInputElement;
		expect(fetchAlternativeIngredientMock).toHaveBeenCalledWith('s1-alt');
		expect(nameInput.value).toBe('Smoked tofu cubes');
		expect(screen.getByText('rules.editBlastRadius')).toBeTruthy();
		fireEvent.change(nameInput, { target: { value: 'Smoked tofu' } });
		fireEvent.click(screen.getByText('rules.editSave'));

		await waitFor(() =>
			expect(editAlternativeIngredientMock).toHaveBeenCalledWith(
				's1-alt',
				'Smoked tofu',
				'Pressed and smoked.',
				2,
			),
		);
	});

	it('reverts a shared alternative ingredient edit from the edit dialog against its version', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockResolvedValue([template('s1', 'Brown lentils (cooked)')]);
		revertAlternativeIngredientMock.mockResolvedValue(undefined);

		render(<RulesPage />);
		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));
		fireEvent.click(
			await screen.findByRole('button', { name: 'rules.editAlternativeIngredient Brown lentils (cooked)' }),
		);
		await screen.findByLabelText('rules.editName');
		fireEvent.click(screen.getByText('rules.editRevert'));

		await waitFor(() => expect(revertAlternativeIngredientMock).toHaveBeenCalledWith('s1-alt', 2));
	});

	it('stages an alternative ingredient translation from the template card', async () => {
		fetchRulesMock.mockResolvedValue([UNCHANGED_RULE]);
		fetchSuggestionTemplatesMock.mockResolvedValue([template('s1', 'Brown lentils (cooked)')]);
		stageAlternativeIngredientTranslationMock.mockResolvedValue(undefined);

		render(<RulesPage />);
		fireEvent.click(await screen.findByRole('button', { name: 'rules.toggleSuggestions' }));
		fireEvent.click(
			await screen.findByRole('button', { name: 'rules.editAlternativeTranslations Brown lentils (cooked)' }),
		);

		const elName = (await screen.findByLabelText('EL rules.editName')) as HTMLInputElement;
		expect(fetchAlternativeIngredientTranslationsMock).toHaveBeenCalledWith('s1-alt');
		fireEvent.change(elName, { target: { value: 'Καπνιστό τόφου' } });
		fireEvent.click(screen.getAllByText('rules.translationSave')[0]);

		await waitFor(() =>
			expect(stageAlternativeIngredientTranslationMock).toHaveBeenCalledWith(
				's1-alt',
				'EL',
				'Καπνιστό τόφου',
				null,
				0,
			),
		);
	});
});
