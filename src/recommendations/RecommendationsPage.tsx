import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiThumbsDown, FiThumbsUp } from 'react-icons/fi';
import {
	type Language,
	LANGUAGES,
	type Recommendation,
	type RecommendationWeight,
	type TranslationState,
	fetchRecommendations,
} from '@/recommendations/recommendations';

const translationChipClass = (state: TranslationState) =>
	state === 'STAGED'
		? 'badge badge-sm badge-warning'
		: state === 'PRESENT'
			? 'badge badge-sm badge-success'
			: 'badge badge-sm badge-ghost';

function translationChips(states: Record<Language, TranslationState>) {
	return (
		<div className="flex gap-1">
			{LANGUAGES.map((lang) => (
				<span key={lang} className={translationChipClass(states[lang])}>
					{lang}
				</span>
			))}
		</div>
	);
}

function WeightIcon({ weight, label }: { weight: RecommendationWeight; label: string }) {
	const encouraged = weight === 'ENCOURAGED';
	return (
		<span role="img" aria-label={label} title={label} className="inline-flex text-lg">
			{encouraged ? (
				<FiThumbsUp className="text-success" aria-hidden />
			) : (
				<FiThumbsDown className="text-error" aria-hidden />
			)}
		</span>
	);
}

export function RecommendationsPage() {
	const { t } = useTranslation();
	const [recommendations, setRecommendations] = useState<Recommendation[] | null>(null);
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		let cancelled = false;
		fetchRecommendations()
			.then((loaded) => {
				if (!cancelled) {
					setRecommendations(loaded);
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
				<span>{t('recommendations.loadError')}</span>
			</div>
		);
	}

	if (recommendations === null) {
		return <span className="loading loading-spinner loading-lg" aria-label={t('recommendations.loading')} />;
	}

	return (
		<div className="flex h-full min-h-0 flex-col">
			<h1 className="mb-4 text-2xl font-semibold">{t('recommendations.title')}</h1>
			<div className="min-h-0 flex-1 overflow-auto">
				<table className="table-pin-rows table min-w-[720px]">
					<thead>
						<tr>
							<th className="w-8 px-1 py-4 text-center">
								<span className="sr-only">{t('recommendations.columnWeight')}</span>
							</th>
							<th className="px-1 py-4">{t('recommendations.columnName')}</th>
							<th className="px-1 py-4">{t('recommendations.columnComponent')}</th>
							<th className="px-1 py-4">{t('recommendations.columnExplanation')}</th>
							<th className="px-1 py-4">{t('recommendations.columnTranslations')}</th>
						</tr>
					</thead>
					<tbody>
						{recommendations.map((recommendation) => (
							<tr key={recommendation.id}>
								<td className="px-1 py-1 text-center">
									<WeightIcon
										weight={recommendation.weight}
										label={
											recommendation.weight === 'ENCOURAGED'
												? t('recommendations.weightEncouraged')
												: t('recommendations.weightLimited')
										}
									/>
								</td>
								<td className="px-1 py-1">{recommendation.name}</td>
								<td className="px-1 py-1">{recommendation.componentForScoring}</td>
								<td className="px-1 py-1">{recommendation.explanationForLlm ?? '—'}</td>
								<td className="px-1 py-1">{translationChips(recommendation.translations)}</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
		</div>
	);
}
