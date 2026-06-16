import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import { fetchRules, revertRationale, setActive, stageRationale, type Rule } from '@/api/rules';

const EMPTY = '—';

export function RulesPage() {
	const { t } = useTranslation();
	const [rules, setRules] = useState<Rule[] | null>(null);
	const [failed, setFailed] = useState(false);
	const [drafts, setDrafts] = useState<Record<string, string>>({});
	const [conflict, setConflict] = useState(false);

	const reload = useCallback(() => {
		fetchRules()
			.then((loaded) => {
				setRules(loaded);
				setDrafts({});
				setFailed(false);
			})
			.catch(() => setFailed(true));
	}, []);

	useEffect(() => {
		let cancelled = false;
		fetchRules()
			.then((loaded) => {
				if (!cancelled) {
					setRules(loaded);
				}
			})
			.catch(() => {
				if (!cancelled) {
					setFailed(true);
				}
			});
		return () => {
			cancelled = true;
		};
	}, []);

	const onDraftChange = (id: string, value: string) => {
		setDrafts((current) => ({ ...current, [id]: value }));
	};

	const commitRationale = async (rule: Rule) => {
		const draft = drafts[rule.id];
		if (draft === undefined || draft === (rule.rationale ?? '')) {
			return;
		}
		try {
			const version = await stageRationale(rule.id, draft, rule.version);
			setConflict(false);
			setRules(
				(current) =>
					current?.map((r) =>
						r.id === rule.id ? { ...r, rationale: draft, version, changeState: 'CHANGED' } : r,
					) ?? null,
			);
		} catch (error) {
			if (error instanceof ApiError && error.status === 409) {
				setConflict(true);
				reload();
			} else {
				setFailed(true);
			}
		}
	};

	const runAndReload = async (action: () => Promise<unknown>) => {
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

	const commitRevert = (rule: Rule) => runAndReload(() => revertRationale(rule.id, rule.version));

	const commitSetActive = (rule: Rule) => runAndReload(() => setActive(rule.id, !rule.active, rule.version));

	if (failed) {
		return (
			<div className="alert alert-error">
				<span>{t('rules.loadError')}</span>
			</div>
		);
	}

	if (rules === null) {
		return <span className="loading loading-spinner loading-lg" aria-label={t('rules.loading')} />;
	}

	return (
		<div>
			<h1 className="mb-4 text-xl font-semibold">{t('rules.title')}</h1>
			{conflict ? (
				<div className="alert alert-warning mb-4">
					<span>{t('rules.staleReload')}</span>
				</div>
			) : null}
			<table className="table">
				<thead>
					<tr>
						<th>{t('rules.columnRecommendation')}</th>
						<th>{t('rules.columnTriggerIngredient')}</th>
						<th>{t('rules.columnRoleOrTechnique')}</th>
						<th>{t('rules.columnRationale')}</th>
						<th>{t('rules.columnActions')}</th>
					</tr>
				</thead>
				<tbody>
					{rules.map((rule) => {
						const changed = rule.changeState === 'CHANGED';
						return (
							<tr key={rule.id} className={rule.active ? '' : 'bg-error/10'}>
								<td>{rule.recommendation}</td>
								<td>{rule.triggerIngredient}</td>
								<td>{rule.roleOrTechnique ?? EMPTY}</td>
								<td>
									<input
										type="text"
										className={`input input-sm input-bordered w-full ${changed ? 'border-warning bg-warning/10' : ''}`}
										value={drafts[rule.id] ?? rule.rationale ?? ''}
										aria-label={t('rules.rationaleEditLabel')}
										onChange={(event) => onDraftChange(rule.id, event.target.value)}
										onBlur={() => commitRationale(rule)}
									/>
								</td>
								<td>
									<div className="flex items-center gap-2">
										{changed ? (
											<span className="badge badge-warning">{t('rules.pendingBadge')}</span>
										) : null}
										{changed ? (
											<button
												type="button"
												className="btn btn-ghost btn-xs"
												onClick={() => commitRevert(rule)}
											>
												{t('rules.revert')}
											</button>
										) : null}
										<button
											type="button"
											className="btn btn-ghost btn-xs"
											onClick={() => commitSetActive(rule)}
										>
											{rule.active ? t('rules.deactivate') : t('rules.activate')}
										</button>
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
		</div>
	);
}
