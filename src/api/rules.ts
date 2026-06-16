import { apiFetch } from '@/api/client';

export type RuleChangeState = 'UNCHANGED' | 'CHANGED' | 'NEW';

/** A cell of a Rule that can carry a pending change, highlighted independently in the grid. */
export type RuleField = 'RATIONALE' | 'ACTIVE' | 'TRIGGER_INGREDIENT' | 'ROLE_OR_TECHNIQUE';

/** A selectable reference-data entry (Recommendation, Trigger Ingredient or Role or Technique) for the new-Rule form. */
export interface ReferenceOption {
	id: string;
	name: string;
}

/** The editable details of a shared reference entity (a Trigger Ingredient or Role or Technique). */
export interface ReferenceDetails {
	name: string;
	explanationForLlm: string | null;
	/** Working Copy version to base the next edit on (0 when no Staged Change exists yet). */
	version: number;
}

/** The reference data an editor chooses from when creating a new Rule. */
export interface NewRuleOptions {
	recommendations: ReferenceOption[];
	triggerIngredients: ReferenceOption[];
	rolesOrTechniques: ReferenceOption[];
}

/** A Rule as shown in the backoffice grid. `roleOrTechnique` and `rationale` may be absent. */
export interface Rule {
	id: string;
	recommendation: string;
	triggerIngredient: string;
	triggerIngredientId: string;
	roleOrTechnique: string | null;
	roleOrTechniqueId: string | null;
	rationale: string | null;
	/** Effective active state (published master overlaid by any Staged Change); deactivated Rules are skipped by recipe assessment. */
	active: boolean;
	/** How this Rule's own fields differ from published master because of a Staged Change. */
	changeState: RuleChangeState;
	/** Which cells carry a pending change, including a shared Trigger Ingredient or Role or Technique edited elsewhere. */
	changedFields: RuleField[];
	/** Working Copy version to base the next edit on. */
	version: number;
}

export function fetchRules(): Promise<Rule[]> {
	return apiFetch<Rule[]>('/rules');
}

interface StagedVersionResponse {
	version: number;
}

/**
 * Stages a new rationale for a Rule in the Working Copy, leaving published master untouched.
 * Resolves with the Rule's new Working Copy version. Rejects with {@link ApiError} status 409 when the
 * base version is stale (someone changed it since it was loaded).
 */
export function stageRationale(id: string, rationale: string | null, baseVersion: number): Promise<number> {
	return apiFetch<StagedVersionResponse>(`/rules/${id}/rationale`, {
		method: 'PUT',
		body: JSON.stringify({ rationale, baseVersion }),
	}).then((response) => response.version);
}

/**
 * Reverts a Rule's staged rationale, restoring the published master value and removing the Staged Change.
 * Rejects with {@link ApiError} status 409 when the base version is stale.
 */
export function revertRationale(id: string, baseVersion: number): Promise<void> {
	return apiFetch<void>(`/rules/${id}/rationale?baseVersion=${baseVersion}`, { method: 'DELETE' });
}

/**
 * Stages a Rule's active state in the Working Copy, leaving published master untouched. Deactivating an applied Rule,
 * or activating a deactivated one, is a Staged Change. Rejects with {@link ApiError} status 409 when the base version
 * is stale.
 */
export function setActive(id: string, active: boolean, baseVersion: number): Promise<void> {
	return apiFetch<void>(`/rules/${id}/active`, {
		method: 'PUT',
		body: JSON.stringify({ active, baseVersion }),
	});
}

/**
 * Discards an unpublished new Rule, removing its Working Copy row so it disappears from the grid. Rejects with
 * {@link ApiError} status 409 when the base version is stale.
 */
export function discardNewRule(id: string, baseVersion: number): Promise<void> {
	return apiFetch<void>(`/rules/${id}?baseVersion=${baseVersion}`, { method: 'DELETE' });
}

/** Fetches the reference data (Recommendations, Trigger Ingredients, Roles or Techniques) for the new-Rule form. */
export function fetchNewRuleOptions(): Promise<NewRuleOptions> {
	return apiFetch<NewRuleOptions>('/rules/new-rule-options');
}

/**
 * Stages a brand-new Trigger Ingredient in the Working Copy, resolving with its id and name. Rejects with
 * {@link ApiError} status 409 when a Trigger Ingredient with the same name already exists.
 */
export function createTriggerIngredient(name: string): Promise<ReferenceOption> {
	return apiFetch<ReferenceOption>('/rules/trigger-ingredients', {
		method: 'POST',
		body: JSON.stringify({ name }),
	});
}

/**
 * Stages a brand-new Role or Technique in the Working Copy, resolving with its id and name. Rejects with
 * {@link ApiError} status 409 when a Role or Technique with the same name already exists.
 */
export function createRoleOrTechnique(name: string): Promise<ReferenceOption> {
	return apiFetch<ReferenceOption>('/rules/roles-or-techniques', {
		method: 'POST',
		body: JSON.stringify({ name }),
	});
}

/** Fetches the effective details of a Trigger Ingredient (master overlaid by any Staged Change) to pre-fill its edit dialog. */
export function fetchTriggerIngredient(id: string): Promise<ReferenceDetails> {
	return apiFetch<ReferenceDetails>(`/rules/trigger-ingredients/${id}`);
}

/** Fetches the effective details of a Role or Technique (master overlaid by any Staged Change) to pre-fill its edit dialog. */
export function fetchRoleOrTechnique(id: string): Promise<ReferenceDetails> {
	return apiFetch<ReferenceDetails>(`/rules/roles-or-techniques/${id}`);
}

/**
 * Stages an edit to a shared Trigger Ingredient's name and explanation in the Working Copy; the change is seen by every
 * referencing Rule. Rejects with {@link ApiError} status 409 when the base version is stale or the name is taken.
 */
export function editTriggerIngredient(
	id: string,
	name: string,
	explanationForLlm: string | null,
	baseVersion: number,
): Promise<void> {
	return apiFetch<void>(`/rules/trigger-ingredients/${id}`, {
		method: 'PUT',
		body: JSON.stringify({ name, explanationForLlm, baseVersion }),
	});
}

/**
 * Stages an edit to a shared Role or Technique's name and explanation in the Working Copy; the change is seen by every
 * referencing Rule. Rejects with {@link ApiError} status 409 when the base version is stale or the name is taken.
 */
export function editRoleOrTechnique(
	id: string,
	name: string,
	explanationForLlm: string | null,
	baseVersion: number,
): Promise<void> {
	return apiFetch<void>(`/rules/roles-or-techniques/${id}`, {
		method: 'PUT',
		body: JSON.stringify({ name, explanationForLlm, baseVersion }),
	});
}

interface CreatedRuleResponse {
	id: string;
}

/**
 * Stages a brand-new Rule in the Working Copy from the chosen business key, resolving with its new id. Rejects with
 * {@link ApiError} status 409 when a Rule with the same business key already exists.
 */
export function createRule(
	recommendationId: string,
	triggerIngredientId: string,
	roleOrTechniqueId: string | null,
): Promise<string> {
	return apiFetch<CreatedRuleResponse>('/rules', {
		method: 'POST',
		body: JSON.stringify({ recommendationId, triggerIngredientId, roleOrTechniqueId }),
	}).then((response) => response.id);
}
