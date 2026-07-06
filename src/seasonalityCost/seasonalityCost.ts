import { apiFetch } from '@/api/client';

/** The indicative, coarse-grained per-country cost of an Alternative Ingredient. */
export type CostLevel = 'LO' | 'MED' | 'HI';

/** One seasonality cell: the effective in-season month range (both null means no seasonality), whether the value carries
 * a pending change in the Working Copy, and the Working Copy version a subsequent edit must be based on. */
export interface SeasonalityCell {
	monthFrom: number | null;
	monthTo: number | null;
	staged: boolean;
	version: number;
}

/** One cost cell: the effective cost (null means no cost), whether it carries a pending change in the Working Copy, and
 * the Working Copy version a subsequent edit must be based on. */
export interface CostCell {
	cost: CostLevel | null;
	staged: boolean;
	version: number;
}

/** One Alternative Ingredient row of the Seasonality & Cost grid: its effective name, whether a published master row
 * exists (false = Working-Copy-only), and its per-country seasonality and cost cells keyed by ISO alpha-2 country code. */
export interface SeasonalityCostRow {
	id: string;
	name: string;
	published: boolean;
	seasonality: Record<string, SeasonalityCell>;
	cost: Record<string, CostCell>;
}

/** The whole Seasonality & Cost grid: the countries (ISO alpha-2 codes, in display order) and one row per Alternative
 * Ingredient (sorted by name). */
export interface SeasonalityCostGrid {
	countries: string[];
	rows: SeasonalityCostRow[];
}

/** Fetches the Seasonality & Cost grid (master overlaid by the Working Copy). */
export function fetchSeasonalityCostGrid(): Promise<SeasonalityCostGrid> {
	return apiFetch<SeasonalityCostGrid>('/seasonality-cost');
}

/**
 * Stages a per-country seasonality for an Alternative Ingredient in the Working Copy. Both months null clears it. Rejects
 * with {@link ApiError} status 409 when the base version is stale.
 */
export function stageSeasonality(
	id: string,
	country: string,
	monthFrom: number | null,
	monthTo: number | null,
	baseVersion: number,
): Promise<void> {
	return apiFetch<void>(`/seasonality-cost/${id}/seasonality/${country}`, {
		method: 'PUT',
		body: JSON.stringify({ monthFrom, monthTo, baseVersion }),
	});
}

/**
 * Stages a per-country cost for an Alternative Ingredient in the Working Copy. A null cost clears it. Rejects with
 * {@link ApiError} status 409 when the base version is stale.
 */
export function stageCost(id: string, country: string, cost: CostLevel | null, baseVersion: number): Promise<void> {
	return apiFetch<void>(`/seasonality-cost/${id}/cost/${country}`, {
		method: 'PUT',
		body: JSON.stringify({ cost, baseVersion }),
	});
}
