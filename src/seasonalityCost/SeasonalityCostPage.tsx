import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import {
	type CostCell,
	type CostLevel,
	type SeasonalityCell,
	type SeasonalityCostGrid,
	fetchSeasonalityCostGrid,
	stageCost,
	stageSeasonality,
} from '@/seasonalityCost/seasonalityCost';

const COST_LEVELS: CostLevel[] = ['LO', 'MED', 'HI'];

type ParsedSeasonality = { monthFrom: number | null; monthTo: number | null };

function isMonth(month: number): boolean {
	return Number.isInteger(month) && month >= 1 && month <= 12;
}

// Accepts a single month "8" (from == to), a range "1-5" or a wrap-around range "11-2", or an empty string (clears the
// seasonality). Returns null for anything else, including months outside 1..12 — the caller reverts on null.
export function parseSeasonality(text: string): ParsedSeasonality | null {
	const trimmed = text.trim();
	if (trimmed === '') {
		return { monthFrom: null, monthTo: null };
	}
	const single = /^(\d{1,2})$/.exec(trimmed);
	if (single) {
		const month = Number(single[1]);
		return isMonth(month) ? { monthFrom: month, monthTo: month } : null;
	}
	const range = /^(\d{1,2})-(\d{1,2})$/.exec(trimmed);
	if (range) {
		const monthFrom = Number(range[1]);
		const monthTo = Number(range[2]);
		return isMonth(monthFrom) && isMonth(monthTo) ? { monthFrom, monthTo } : null;
	}
	return null;
}

export function formatSeasonality(cell: SeasonalityCell): string {
	// The backend omits null fields, so an empty cell arrives with monthFrom/monthTo undefined rather than null.
	if (cell.monthFrom == null || cell.monthTo == null) {
		return '';
	}
	return `${cell.monthFrom}-${cell.monthTo}`;
}

export function SeasonalityCostPage() {
	const { t } = useTranslation();
	const [grid, setGrid] = useState<SeasonalityCostGrid | null>(null);
	const [failed, setFailed] = useState(false);
	const [conflict, setConflict] = useState(false);
	const [drafts, setDrafts] = useState<Record<string, string>>({});

	const reload = useCallback(() => {
		fetchSeasonalityCostGrid()
			.then((loaded) => {
				setGrid(loaded);
				setFailed(false);
			})
			.catch(() => setFailed(true));
	}, []);

	useEffect(() => {
		reload();
	}, [reload]);

	// Every staged write refreshes the grid so the cells reflect the new state; a stale base version warns and refreshes.
	const commit = async (action: () => Promise<unknown>) => {
		try {
			await action();
			setConflict(false);
			reload();
		} catch (error) {
			if (error instanceof ApiError && error.status === 409) {
				setConflict(true);
				reload();
			} else {
				setFailed(true);
			}
		}
	};

	const clearDraft = (key: string) =>
		setDrafts((current) => {
			const next = { ...current };
			delete next[key];
			return next;
		});

	// On blur: an invalid entry reverts to the cell's current value (drop the draft); a valid entry that differs from the
	// cell stages the change; a valid entry equal to the cell is a no-op.
	const onSeasonalityBlur = (rowId: string, country: string, cell: SeasonalityCell) => {
		const key = `${rowId}:${country}`;
		if (!(key in drafts)) {
			return;
		}
		const parsed = parseSeasonality(drafts[key]);
		clearDraft(key);
		const currentFrom = cell.monthFrom ?? null;
		const currentTo = cell.monthTo ?? null;
		if (parsed === null || (parsed.monthFrom === currentFrom && parsed.monthTo === currentTo)) {
			return;
		}
		void commit(() => stageSeasonality(rowId, country, parsed.monthFrom, parsed.monthTo, cell.version));
	};

	const onCostChange = (rowId: string, country: string, cell: CostCell, value: string) => {
		const cost = value === '' ? null : (value as CostLevel);
		if (cost === cell.cost) {
			return;
		}
		void commit(() => stageCost(rowId, country, cost, cell.version));
	};

	if (failed) {
		return (
			<div className="alert alert-error">
				<span>{t('seasonalityCost.loadError')}</span>
			</div>
		);
	}

	if (grid === null) {
		return <span className="loading loading-lg loading-spinner" aria-label={t('seasonalityCost.loading')} />;
	}

	return (
		<div className="flex h-full min-h-0 flex-col">
			<h1 className="mb-4 text-2xl font-semibold">{t('seasonalityCost.title')}</h1>
			{conflict ? (
				<div className="mb-4 alert alert-warning">
					<span>{t('seasonalityCost.staleReload')}</span>
				</div>
			) : null}
			<div className="min-h-0 flex-1 overflow-auto">
				<table className="table-pin-rows table">
					<thead>
						<tr>
							<th className="sticky left-0 z-20 bg-base-100 px-1 py-4">
								{t('seasonalityCost.columnName')}
							</th>
							{grid.countries.map((country) => (
								<th key={`seasonality-${country}`} className="px-1 py-4 text-center align-bottom">
									{t('seasonalityCost.seasonality')} {country}
								</th>
							))}
							{grid.countries.map((country) => (
								<th key={`cost-${country}`} className="px-1 py-4 text-center align-bottom">
									{t('seasonalityCost.cost')} {country}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{grid.rows.map((row) => (
							<tr key={row.id}>
								<th scope="row" className="sticky left-0 z-10 bg-base-100 px-1 py-1 font-normal">
									{row.name}
									{!row.published ? (
										<span className="ml-2 badge badge-sm badge-info">
											{t('seasonalityCost.newBadge')}
										</span>
									) : null}
								</th>
								{grid.countries.map((country) => {
									const cell = row.seasonality[country];
									const key = `${row.id}:${country}`;
									const value = key in drafts ? drafts[key] : formatSeasonality(cell);
									return (
										<td key={`seasonality-${country}`} className="px-1 py-1 text-center">
											<input
												type="text"
												className={`input-bordered input w-16 text-center input-sm ${cell.staged ? 'bg-warning/20' : ''}`}
												aria-label={`${t('seasonalityCost.seasonalityCell')} ${row.name} ${country}`}
												placeholder={t('seasonalityCost.seasonalityPlaceholder')}
												value={value}
												onChange={(event) =>
													setDrafts((current) => ({ ...current, [key]: event.target.value }))
												}
												onBlur={() => onSeasonalityBlur(row.id, country, cell)}
											/>
										</td>
									);
								})}
								{grid.countries.map((country) => {
									const cell = row.cost[country];
									return (
										<td key={`cost-${country}`} className="px-1 py-1 text-center">
											<select
												className={`select-bordered select select-sm ${cell.staged ? 'bg-warning/20' : ''}`}
												aria-label={`${t('seasonalityCost.costCell')} ${row.name} ${country}`}
												value={cell.cost ?? ''}
												onChange={(event) =>
													onCostChange(row.id, country, cell, event.target.value)
												}
											>
												<option value="">{t('seasonalityCost.costEmpty')}</option>
												{COST_LEVELS.map((level) => (
													<option key={level} value={level}>
														{level}
													</option>
												))}
											</select>
										</td>
									);
								})}
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
