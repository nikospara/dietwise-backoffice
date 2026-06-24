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
	explanationForLlm: string | null;
	translations: Record<Language, TranslationState>;
}

export function fetchRecommendations(): Promise<Recommendation[]> {
	return apiFetch<Recommendation[]>('/recommendations');
}
