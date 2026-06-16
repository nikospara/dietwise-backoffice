import { apiFetch } from '@/api/client';

/** A Rule as shown in the backoffice grid. `roleOrTechnique` and `rationale` may be absent. */
export interface Rule {
	id: string;
	recommendation: string;
	triggerIngredient: string;
	roleOrTechnique: string | null;
	rationale: string | null;
}

export function fetchRules(): Promise<Rule[]> {
	return apiFetch<Rule[]>('/rules');
}
