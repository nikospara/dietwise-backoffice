import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { fetchRules, type Rule } from '@/api/rules';

const EMPTY = '—';

export function RulesPage() {
	const { t } = useTranslation();
	const [rules, setRules] = useState<Rule[] | null>(null);
	const [failed, setFailed] = useState(false);

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
					{rules.map((rule) => (
						<tr key={rule.id}>
							<td>{rule.recommendation}</td>
							<td>{rule.triggerIngredient}</td>
							<td>{rule.roleOrTechnique ?? EMPTY}</td>
							<td>{rule.rationale ?? EMPTY}</td>
							<td></td>
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
