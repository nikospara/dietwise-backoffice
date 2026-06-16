import { apiFetch } from '@/api/client';

export type RuleChangeState = 'UNCHANGED' | 'CHANGED';

/** A Rule as shown in the backoffice grid. `roleOrTechnique` and `rationale` may be absent. */
export interface Rule {
	id: string;
	recommendation: string;
	triggerIngredient: string;
	roleOrTechnique: string | null;
	rationale: string | null;
	/** Effective active state (published master overlaid by any Staged Change); deactivated Rules are skipped by recipe assessment. */
	active: boolean;
	/** How this Rule differs from published master because of a Staged Change. */
	changeState: RuleChangeState;
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
