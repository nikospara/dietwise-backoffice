import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiThumbsDown, FiThumbsUp } from 'react-icons/fi';
import { ApiError } from '@/api/client';
import {
	type Language,
	LANGUAGES,
	type Recommendation,
	type RecommendationWeight,
	fetchRecommendations,
	fetchRecommendationTranslations,
	revertExplanation,
	revertRecommendationTranslation,
	stageExplanation,
	stageRecommendationTranslation,
} from '@/recommendations/recommendations';
import { TranslationChips } from '@/components/TranslationChips';
import { RecommendationTranslationsDialog } from '@/recommendations/components/RecommendationTranslationsDialog';

type TranslationTarget = {
	recommendationId: string;
	englishName: string;
	englishComponent: string;
	englishExplanation: string | null;
};

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
	const [drafts, setDrafts] = useState<Record<string, string>>({});
	const [failed, setFailed] = useState(false);
	const [conflict, setConflict] = useState(false);
	const [translating, setTranslating] = useState<TranslationTarget | null>(null);

	const reload = useCallback(() => {
		fetchRecommendations()
			.then((loaded) => {
				setRecommendations(loaded);
				setDrafts({});
				setFailed(false);
			})
			.catch(() => setFailed(true));
	}, []);

	useEffect(() => {
		reload();
	}, [reload]);

	const onDraftChange = (id: string, value: string) => {
		setDrafts((current) => ({ ...current, [id]: value }));
	};

	const commitExplanation = async (recommendation: Recommendation) => {
		const draft = drafts[recommendation.id];
		if (draft === undefined || draft === (recommendation.explanationForLlm ?? '')) {
			return;
		}
		try {
			const version = await stageExplanation(recommendation.id, draft, recommendation.version);
			setConflict(false);
			setRecommendations(
				(current) =>
					current?.map((r) =>
						r.id === recommendation.id
							? { ...r, explanationForLlm: draft, version, explanationChanged: version > 0 }
							: r,
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

	const commitRevert = async (recommendation: Recommendation) => {
		try {
			await revertExplanation(recommendation.id, recommendation.version);
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

	// Staging or reverting a translation refreshes the grid so its chips reflect the new state; a stale base version
	// warns and refreshes too. The dialog stays open and reconciles its own per-language state.
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

	const commitStageTranslation = (
		recommendationId: string,
		lang: Language,
		name: string | null,
		componentForScoring: string | null,
		explanationForLlm: string | null,
		baseVersion: number,
	) =>
		commit(() =>
			stageRecommendationTranslation(
				recommendationId,
				lang,
				name,
				componentForScoring,
				explanationForLlm,
				baseVersion,
			),
		);

	const commitRevertTranslation = (recommendationId: string, lang: Language, baseVersion: number) =>
		commit(() => revertRecommendationTranslation(recommendationId, lang, baseVersion));

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
			{conflict ? (
				<div className="alert alert-warning mb-4">
					<span>{t('recommendations.staleReload')}</span>
				</div>
			) : null}
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
								<td className="px-1 py-1">
									<div className="flex items-center gap-2">
										<input
											type="text"
											className={`input input-sm input-bordered min-w-0 flex-1 ${recommendation.explanationChanged ? 'border-warning bg-warning/10' : ''}`}
											value={drafts[recommendation.id] ?? recommendation.explanationForLlm ?? ''}
											aria-label={t('recommendations.explanationEditLabel')}
											onChange={(event) => onDraftChange(recommendation.id, event.target.value)}
											onBlur={() => commitExplanation(recommendation)}
										/>
										{recommendation.explanationChanged ? (
											<button
												type="button"
												className="btn btn-ghost btn-xs"
												onClick={() => commitRevert(recommendation)}
											>
												{t('recommendations.revert')}
											</button>
										) : null}
									</div>
								</td>
								<td className="px-1 py-1">
									<button
										type="button"
										className="flex cursor-pointer gap-1"
										aria-label={t('recommendations.editTranslations')}
										onClick={() =>
											setTranslating({
												recommendationId: recommendation.id,
												englishName: recommendation.name,
												englishComponent: recommendation.componentForScoring,
												englishExplanation: recommendation.explanationForLlm,
											})
										}
									>
										<TranslationChips languages={LANGUAGES} states={recommendation.translations} />
									</button>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			{translating !== null ? (
				<RecommendationTranslationsDialog
					recommendationId={translating.recommendationId}
					englishName={translating.englishName}
					englishComponent={translating.englishComponent}
					englishExplanation={translating.englishExplanation}
					loadTranslations={fetchRecommendationTranslations}
					onStage={(lang, name, componentForScoring, explanationForLlm, baseVersion) =>
						commitStageTranslation(
							translating.recommendationId,
							lang,
							name,
							componentForScoring,
							explanationForLlm,
							baseVersion,
						)
					}
					onRevert={(lang, baseVersion) =>
						commitRevertTranslation(translating.recommendationId, lang, baseVersion)
					}
					onCancel={() => setTranslating(null)}
				/>
			) : null}
		</div>
	);
}
