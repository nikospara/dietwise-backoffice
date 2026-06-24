import { apiFetch } from '@/api/client';

export type Language = 'EL' | 'LT' | 'NL';

export const LANGUAGES: Language[] = ['EL', 'LT', 'NL'];

export type TranslationState = 'MISSING' | 'PRESENT' | 'STAGED';

export type RecommendationWeight = 'ENCOURAGED' | 'LIMITED';

export interface Recommendation {
	id: string;
	name: string;
	componentForScoring: string;
	weight: RecommendationWeight;
	/** Effective English explanation for the LLM (published master overlaid by any Staged Change); may be empty. */
	explanationForLlm: string | null;
	/** Whether the explanation differs from published master because of a Staged Change. */
	explanationChanged: boolean;
	/** Working Copy version to base the next explanation edit on (0 when there is no Staged Change yet). */
	version: number;
	translations: Record<Language, TranslationState>;
}

export function fetchRecommendations(): Promise<Recommendation[]> {
	return apiFetch<Recommendation[]>('/recommendations');
}

interface StagedVersionResponse {
	version: number;
}

/**
 * Stages a Recommendation's English explanation for the LLM in the Working Copy, leaving published master untouched.
 * Resolves with the Recommendation's new Working Copy version (0 when the edit collapsed back to master). Rejects with
 * {@link ApiError} status 409 when the base version is stale (someone changed it since it was loaded).
 */
export function stageExplanation(id: string, explanationForLlm: string | null, baseVersion: number): Promise<number> {
	return apiFetch<StagedVersionResponse>(`/recommendations/${id}/explanation`, {
		method: 'PUT',
		body: JSON.stringify({ explanationForLlm, baseVersion }),
	}).then((response) => response.version);
}

/**
 * Reverts a Recommendation's staged explanation, restoring the published master value and removing the Staged Change.
 * Rejects with {@link ApiError} status 409 when the base version is stale.
 */
export function revertExplanation(id: string, baseVersion: number): Promise<void> {
	return apiFetch<void>(`/recommendations/${id}/explanation?baseVersion=${baseVersion}`, { method: 'DELETE' });
}

/** The effective translation of a Recommendation in one language (published master overlaid by any Staged Change). The
 * three fields share a single version, so they are staged and reverted together; a field is null when absent. */
export interface RecommendationTranslationDetails {
	name: string | null;
	componentForScoring: string | null;
	explanationForLlm: string | null;
	/** Working Copy version to base the next edit on (0 when there is no Staged Change yet). */
	version: number;
}

/**
 * Fetches the effective translation of a Recommendation for each non-English language (master overlaid by any Staged
 * Change) and the Working Copy version to base an edit on, to pre-fill the translations dialog.
 */
export function fetchRecommendationTranslations(
	id: string,
): Promise<Record<Language, RecommendationTranslationDetails>> {
	return apiFetch<Record<Language, RecommendationTranslationDetails>>(`/recommendations/${id}/translations`);
}

/**
 * Stages a Recommendation's name, component for scoring and explanation translation for one language in the Working
 * Copy, leaving published master untouched. A null field clears that part of the translation. Rejects with
 * {@link ApiError} status 409 when the base version is stale.
 */
export function stageRecommendationTranslation(
	id: string,
	lang: Language,
	name: string | null,
	componentForScoring: string | null,
	explanationForLlm: string | null,
	baseVersion: number,
): Promise<void> {
	return apiFetch<void>(`/recommendations/${id}/translations/${lang}`, {
		method: 'PUT',
		body: JSON.stringify({ name, componentForScoring, explanationForLlm, baseVersion }),
	});
}

/**
 * Reverts a Recommendation's staged translation for one language, restoring the published master translation. Rejects
 * with {@link ApiError} status 409 when the base version is stale.
 */
export function revertRecommendationTranslation(id: string, lang: Language, baseVersion: number): Promise<void> {
	return apiFetch<void>(`/recommendations/${id}/translations/${lang}?baseVersion=${baseVersion}`, {
		method: 'DELETE',
	});
}
