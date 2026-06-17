import { apiFetch } from '@/api/client';

export type RuleChangeState = 'UNCHANGED' | 'CHANGED' | 'NEW';

/** A cell of a Rule that can carry a pending change, highlighted independently in the grid. `SUGGESTION_TEMPLATES`
 * lights the Suggestions affordance when any of the Rule's templates has a Staged Change. */
export type RuleField = 'RATIONALE' | 'ACTIVE' | 'TRIGGER_INGREDIENT' | 'ROLE_OR_TECHNIQUE' | 'SUGGESTION_TEMPLATES';

/** One of a Suggestion Template's editable English text fields. */
export type TemplateField = 'RESTRICTION' | 'EQUIVALENCE' | 'TECHNIQUE_NOTES';

/** A non-English language a Rule's rationale and shared entities can be translated into. English is the master/fallback. */
export type Language = 'EL' | 'LT' | 'NL';

/** The non-English languages, in display order. */
export const LANGUAGES: Language[] = ['EL', 'LT', 'NL'];

/** Whether a translatable thing is translated in a given language, missing (falls back to English), or has a pending change. */
export type TranslationState = 'MISSING' | 'PRESENT' | 'STAGED';

/** An effective translated text and the Working Copy version a subsequent edit must be based on (0 when not staged). */
export interface VersionedText {
	text: string | null;
	version: number;
}

/** A selectable reference-data entry (Recommendation, Trigger Ingredient or Role or Technique) for the new-Rule form. */
export interface ReferenceOption {
	id: string;
	name: string;
}

/** The editable details of a shared reference entity (a Trigger Ingredient or Role or Technique). `name` is null only
 * for a not-yet-translated language in the per-language translation payload; the English details always carry a name. */
export interface ReferenceDetails {
	name: string | null;
	explanationForLlm: string | null;
	/** Working Copy version to base the next edit on (0 when no Staged Change exists yet). */
	version: number;
	/** Whether a published master baseline exists behind these details, so a Staged Change can be reverted to it. */
	published: boolean;
}

/** The editable details of a shared AlternativeIngredient plus its blast radius — the number of Suggestion Templates,
 * across all Rules, that reference it and would see the edit. Structurally a {@link ReferenceDetails} so it can pre-fill
 * the shared {@link ReferenceDetails} edit dialog directly. */
export interface AlternativeIngredientDetails extends ReferenceDetails {
	referenceCount: number;
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
	/** Completeness of the rationale translation in each non-English language. */
	rationaleTranslations: Record<Language, TranslationState>;
	/** Completeness of the Trigger Ingredient's translation in each non-English language. */
	triggerIngredientTranslations: Record<Language, TranslationState>;
	/** Completeness of the Role or Technique's translation in each non-English language; empty when there is no Role. */
	roleOrTechniqueTranslations: Record<Language, TranslationState>;
	/** Working Copy version to base the next edit on. */
	version: number;
}

/** One of a Rule's Suggestion Templates as shown in the backoffice panel: effective values (published master overlaid by
 * any Staged Change). Any of the three swap-note texts may be absent. */
export interface SuggestionTemplate {
	id: string;
	/** The shared AlternativeIngredient this template suggests; edited from the template card, seen by every referencing template. */
	alternativeIngredientId: string;
	alternativeIngredientName: string;
	restriction: string | null;
	equivalence: string | null;
	techniqueNotes: string | null;
	/** Which of the three English text fields carry a pending change. */
	changedFields: TemplateField[];
	/** Completeness of each English field's translation in each non-English language. */
	translations: Record<TemplateField, Record<Language, TranslationState>>;
	/** Completeness of the shared AlternativeIngredient's translation (name + explanation) in each non-English language. */
	alternativeIngredientTranslations: Record<Language, TranslationState>;
	/** Effective active state (published master overlaid by any Staged Change); a deactivated template is skipped by recipe assessment. */
	active: boolean;
	/** Whether the effective active state differs from published master because of a staged Deactivate or Activate. */
	activeChanged: boolean;
	/** Whether a published master baseline exists; false for a Working-Copy-only template that can be discarded. */
	published: boolean;
	/** Working Copy version to base the next edit on (0 when the template has no Staged Change). */
	version: number;
}

/** The outcome of adding a template for a chosen AlternativeIngredient: the id of the template covering it, and whether
 * it was newly created. `created` is false when the Rule already had a template for the alternative (the existing one is
 * surfaced instead of a duplicate, so it can be reactivated when deactivated). */
export interface AddedTemplate {
	templateId: string;
	created: boolean;
}

export function fetchRules(): Promise<Rule[]> {
	return apiFetch<Rule[]>('/rules');
}

/** Fetches a Rule's Suggestion Templates (master overlaid by the Working Copy), ordered as shown in the panel. */
export function fetchSuggestionTemplates(ruleId: string): Promise<SuggestionTemplate[]> {
	return apiFetch<SuggestionTemplate[]>(`/rules/${ruleId}/suggestion-templates`);
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
 * Stages one English field of a Suggestion Template in the Working Copy, leaving published master untouched. Resolves
 * with the template's new Working Copy version. Rejects with {@link ApiError} status 409 when the base version is stale.
 */
export function stageSuggestionTemplateField(
	templateId: string,
	field: TemplateField,
	value: string | null,
	baseVersion: number,
): Promise<number> {
	return apiFetch<StagedVersionResponse>(`/rules/suggestion-templates/${templateId}/${field}`, {
		method: 'PUT',
		body: JSON.stringify({ value, baseVersion }),
	}).then((response) => response.version);
}

/**
 * Reverts one staged English field of a Suggestion Template, restoring the published master value and collapsing the
 * Working Copy row when no override remains. Rejects with {@link ApiError} status 409 when the base version is stale.
 */
export function revertSuggestionTemplateField(
	templateId: string,
	field: TemplateField,
	baseVersion: number,
): Promise<void> {
	return apiFetch<void>(`/rules/suggestion-templates/${templateId}/${field}?baseVersion=${baseVersion}`, {
		method: 'DELETE',
	});
}

/**
 * Stages a Suggestion Template's active state in the Working Copy, leaving published master untouched. Deactivating a
 * published template, so recipe assessment stops offering that alternative, or reactivating a deactivated one, is a
 * Staged Change. Rejects with {@link ApiError} status 409 when the base version is stale.
 */
export function setActiveSuggestionTemplate(templateId: string, active: boolean, baseVersion: number): Promise<void> {
	return apiFetch<void>(`/rules/suggestion-templates/${templateId}/active`, {
		method: 'PUT',
		body: JSON.stringify({ active, baseVersion }),
	});
}

/**
 * Fetches the effective translation of one field of a Suggestion Template for each non-English language (master
 * overlaid by any Staged Change) and the Working Copy version to base an edit on, to pre-fill the translations dialog.
 */
export function fetchTemplateFieldTranslations(
	templateId: string,
	field: TemplateField,
): Promise<Record<Language, VersionedText>> {
	return apiFetch<Record<Language, VersionedText>>(`/rules/suggestion-templates/${templateId}/${field}/translations`);
}

/**
 * Stages one field of a Suggestion Template's translation for one language in the Working Copy. A {@code null} value
 * clears that field (falls back to English). Rejects with {@link ApiError} status 409 when the base version is stale.
 */
export function stageTemplateFieldTranslation(
	templateId: string,
	field: TemplateField,
	lang: Language,
	value: string | null,
	baseVersion: number,
): Promise<void> {
	return apiFetch<void>(`/rules/suggestion-templates/${templateId}/${field}/translations/${lang}`, {
		method: 'PUT',
		body: JSON.stringify({ value, baseVersion }),
	});
}

/**
 * Reverts one staged field of a Suggestion Template's translation for one language, restoring the published master
 * translation. Rejects with {@link ApiError} status 409 when the base version is stale.
 */
export function revertTemplateFieldTranslation(
	templateId: string,
	field: TemplateField,
	lang: Language,
	baseVersion: number,
): Promise<void> {
	return apiFetch<void>(
		`/rules/suggestion-templates/${templateId}/${field}/translations/${lang}?baseVersion=${baseVersion}`,
		{ method: 'DELETE' },
	);
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

/** Fetches the AlternativeIngredients an editor can add to a Rule (master overlaid by the Working Copy), as id and name, sorted by name. */
export function fetchAlternativeIngredientOptions(): Promise<ReferenceOption[]> {
	return apiFetch<ReferenceOption[]>('/rules/alternative-ingredients');
}

/**
 * Stages a brand-new AlternativeIngredient in the Working Copy with name alone, resolving with its id and name, so it
 * can be chosen for the template being added. Rejects with {@link ApiError} status 409 when one with the same name
 * already exists.
 */
export function createAlternativeIngredient(name: string): Promise<ReferenceOption> {
	return apiFetch<ReferenceOption>('/rules/alternative-ingredients', {
		method: 'POST',
		body: JSON.stringify({ name }),
	});
}

/**
 * Adds a Suggestion Template to a Rule for an existing AlternativeIngredient, staged in the Working Copy. When the Rule
 * already has a template for the alternative no duplicate is created; the existing one is returned ({@code created}
 * false) so it can be reactivated when deactivated.
 */
export function addSuggestionTemplate(ruleId: string, alternativeIngredientId: string): Promise<AddedTemplate> {
	return apiFetch<AddedTemplate>(`/rules/${ruleId}/suggestion-templates`, {
		method: 'POST',
		body: JSON.stringify({ alternativeIngredientId }),
	});
}

/**
 * Discards an unpublished new Suggestion Template, removing its Working Copy row so it disappears from the panel.
 * Rejects with {@link ApiError} status 409 when the base version is stale.
 */
export function discardSuggestionTemplate(templateId: string, baseVersion: number): Promise<void> {
	return apiFetch<void>(`/rules/suggestion-templates/${templateId}?baseVersion=${baseVersion}`, { method: 'DELETE' });
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

/**
 * Reverts a shared Trigger Ingredient's staged edit, restoring its published master name and explanation; the change is
 * seen by every referencing Rule. Rejects with {@link ApiError} status 409 when the base version is stale.
 */
export function revertTriggerIngredient(id: string, baseVersion: number): Promise<void> {
	return apiFetch<void>(`/rules/trigger-ingredients/${id}?baseVersion=${baseVersion}`, { method: 'DELETE' });
}

/**
 * Reverts a shared Role or Technique's staged edit, restoring its published master name and explanation; the change is
 * seen by every referencing Rule. Rejects with {@link ApiError} status 409 when the base version is stale.
 */
export function revertRoleOrTechnique(id: string, baseVersion: number): Promise<void> {
	return apiFetch<void>(`/rules/roles-or-techniques/${id}?baseVersion=${baseVersion}`, { method: 'DELETE' });
}

/**
 * Fetches the effective translation of a shared Trigger Ingredient for each non-English language (master overlaid by any
 * Staged Change) and the Working Copy version to base an edit on, to pre-fill the translations dialog.
 */
export function fetchTriggerIngredientTranslations(id: string): Promise<Record<Language, ReferenceDetails>> {
	return apiFetch<Record<Language, ReferenceDetails>>(`/rules/trigger-ingredients/${id}/translations`);
}

/**
 * Stages a Trigger Ingredient's name and explanation translation for one language in the Working Copy. A {@code null}
 * value clears that field (falls back to English). Rejects with {@link ApiError} status 409 when the base version is stale.
 */
export function stageTriggerIngredientTranslation(
	id: string,
	lang: Language,
	name: string | null,
	explanationForLlm: string | null,
	baseVersion: number,
): Promise<void> {
	return apiFetch<void>(`/rules/trigger-ingredients/${id}/translations/${lang}`, {
		method: 'PUT',
		body: JSON.stringify({ name, explanationForLlm, baseVersion }),
	});
}

/**
 * Reverts a Trigger Ingredient's staged translation for one language, restoring the published master translation.
 * Rejects with {@link ApiError} status 409 when the base version is stale.
 */
export function revertTriggerIngredientTranslation(id: string, lang: Language, baseVersion: number): Promise<void> {
	return apiFetch<void>(`/rules/trigger-ingredients/${id}/translations/${lang}?baseVersion=${baseVersion}`, {
		method: 'DELETE',
	});
}

/**
 * Fetches the effective translation of a shared Role or Technique for each non-English language (master overlaid by any
 * Staged Change) and the Working Copy version to base an edit on, to pre-fill the translations dialog.
 */
export function fetchRoleOrTechniqueTranslations(id: string): Promise<Record<Language, ReferenceDetails>> {
	return apiFetch<Record<Language, ReferenceDetails>>(`/rules/roles-or-techniques/${id}/translations`);
}

/**
 * Stages a Role or Technique's name and explanation translation for one language in the Working Copy. A {@code null}
 * value clears that field (falls back to English). Rejects with {@link ApiError} status 409 when the base version is stale.
 */
export function stageRoleOrTechniqueTranslation(
	id: string,
	lang: Language,
	name: string | null,
	explanationForLlm: string | null,
	baseVersion: number,
): Promise<void> {
	return apiFetch<void>(`/rules/roles-or-techniques/${id}/translations/${lang}`, {
		method: 'PUT',
		body: JSON.stringify({ name, explanationForLlm, baseVersion }),
	});
}

/**
 * Reverts a Role or Technique's staged translation for one language, restoring the published master translation.
 * Rejects with {@link ApiError} status 409 when the base version is stale.
 */
export function revertRoleOrTechniqueTranslation(id: string, lang: Language, baseVersion: number): Promise<void> {
	return apiFetch<void>(`/rules/roles-or-techniques/${id}/translations/${lang}?baseVersion=${baseVersion}`, {
		method: 'DELETE',
	});
}

/** Fetches the effective details of an AlternativeIngredient (master overlaid by any Staged Change) plus its blast
 * radius, to pre-fill and warn within its edit dialog. */
export function fetchAlternativeIngredient(id: string): Promise<AlternativeIngredientDetails> {
	return apiFetch<AlternativeIngredientDetails>(`/rules/alternative-ingredients/${id}`);
}

/**
 * Stages an edit to a shared AlternativeIngredient's name and explanation in the Working Copy; the change is seen by
 * every referencing Suggestion Template. Rejects with {@link ApiError} status 409 when the base version is stale or the
 * name is taken.
 */
export function editAlternativeIngredient(
	id: string,
	name: string,
	explanationForLlm: string | null,
	baseVersion: number,
): Promise<void> {
	return apiFetch<void>(`/rules/alternative-ingredients/${id}`, {
		method: 'PUT',
		body: JSON.stringify({ name, explanationForLlm, baseVersion }),
	});
}

/**
 * Reverts a shared AlternativeIngredient's staged edit, restoring its published master name and explanation; the change
 * is seen by every referencing Suggestion Template. Rejects with {@link ApiError} status 409 when the base version is stale.
 */
export function revertAlternativeIngredient(id: string, baseVersion: number): Promise<void> {
	return apiFetch<void>(`/rules/alternative-ingredients/${id}?baseVersion=${baseVersion}`, { method: 'DELETE' });
}

/**
 * Fetches the effective translation of a shared AlternativeIngredient for each non-English language (master overlaid by
 * any Staged Change) and the Working Copy version to base an edit on, to pre-fill the translations dialog.
 */
export function fetchAlternativeIngredientTranslations(id: string): Promise<Record<Language, ReferenceDetails>> {
	return apiFetch<Record<Language, ReferenceDetails>>(`/rules/alternative-ingredients/${id}/translations`);
}

/**
 * Stages an AlternativeIngredient's name and explanation translation for one language in the Working Copy. A {@code null}
 * value clears that field (falls back to English). Rejects with {@link ApiError} status 409 when the base version is stale.
 */
export function stageAlternativeIngredientTranslation(
	id: string,
	lang: Language,
	name: string | null,
	explanationForLlm: string | null,
	baseVersion: number,
): Promise<void> {
	return apiFetch<void>(`/rules/alternative-ingredients/${id}/translations/${lang}`, {
		method: 'PUT',
		body: JSON.stringify({ name, explanationForLlm, baseVersion }),
	});
}

/**
 * Reverts an AlternativeIngredient's staged translation for one language, restoring the published master translation.
 * Rejects with {@link ApiError} status 409 when the base version is stale.
 */
export function revertAlternativeIngredientTranslation(id: string, lang: Language, baseVersion: number): Promise<void> {
	return apiFetch<void>(`/rules/alternative-ingredients/${id}/translations/${lang}?baseVersion=${baseVersion}`, {
		method: 'DELETE',
	});
}

/**
 * Fetches the effective rationale translation of a Rule for each non-English language (master overlaid by any Staged
 * Change) and the Working Copy version to base an edit on, to pre-fill the translations dialog.
 */
export function fetchRationaleTranslations(id: string): Promise<Record<Language, VersionedText>> {
	return apiFetch<Record<Language, VersionedText>>(`/rules/${id}/rationale-translations`);
}

/**
 * Stages a Rule's rationale translation for one language in the Working Copy. A {@code null} rationale clears the
 * translation. Rejects with {@link ApiError} status 409 when the base version is stale.
 */
export function stageRationaleTranslation(
	id: string,
	lang: Language,
	rationale: string | null,
	baseVersion: number,
): Promise<void> {
	return apiFetch<void>(`/rules/${id}/rationale-translations/${lang}`, {
		method: 'PUT',
		body: JSON.stringify({ rationale, baseVersion }),
	});
}

/**
 * Reverts a Rule's staged rationale translation for one language, restoring the published master translation. Rejects
 * with {@link ApiError} status 409 when the base version is stale.
 */
export function revertRationaleTranslation(id: string, lang: Language, baseVersion: number): Promise<void> {
	return apiFetch<void>(`/rules/${id}/rationale-translations/${lang}?baseVersion=${baseVersion}`, {
		method: 'DELETE',
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
