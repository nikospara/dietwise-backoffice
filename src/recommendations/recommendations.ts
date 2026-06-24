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
