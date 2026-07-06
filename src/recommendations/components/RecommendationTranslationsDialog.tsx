import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Language, LANGUAGES, type RecommendationTranslationDetails } from '@/recommendations/recommendations';

interface RecommendationTranslationsDialogProps {
	recommendationId: string;
	/** The effective English name, component, explanation and human friendly display, shown read-only as the source the
	 * translations render. */
	englishName: string;
	englishComponent: string;
	englishExplanation: string | null;
	englishHumanFriendlyDisplay: string | null;
	loadTranslations: (id: string) => Promise<Record<Language, RecommendationTranslationDetails>>;
	onStage: (
		lang: Language,
		name: string | null,
		componentForScoring: string | null,
		explanationForLlm: string | null,
		humanFriendlyDisplay: string | null,
		baseVersion: number,
	) => Promise<void>;
	onRevert: (lang: Language, baseVersion: number) => Promise<void>;
	onCancel: () => void;
}

type TranslationDraft = { name: string; component: string; explanation: string; humanFriendlyDisplay: string };

const EMPTY_DRAFTS: Record<Language, TranslationDraft> = {
	EL: { name: '', component: '', explanation: '', humanFriendlyDisplay: '' },
	LT: { name: '', component: '', explanation: '', humanFriendlyDisplay: '' },
	NL: { name: '', component: '', explanation: '', humanFriendlyDisplay: '' },
};

function draftOf(details: RecommendationTranslationDetails): TranslationDraft {
	return {
		name: details.name ?? '',
		component: details.componentForScoring ?? '',
		explanation: details.explanationForLlm ?? '',
		humanFriendlyDisplay: details.humanFriendlyDisplay ?? '',
	};
}

/**
 * Edits a Recommendation's name, component for scoring, LLM explanation and human friendly display translation in each
 * non-English language. Each language is staged or reverted independently against its own Working Copy version; the four
 * fields share that version and are staged together. A missing translation falls back to English at assessment time.
 * Pre-filled from the effective per-language translations.
 */
export function RecommendationTranslationsDialog({
	recommendationId,
	englishName,
	englishComponent,
	englishExplanation,
	englishHumanFriendlyDisplay,
	loadTranslations,
	onStage,
	onRevert,
	onCancel,
}: RecommendationTranslationsDialogProps) {
	const { t } = useTranslation();
	const [translations, setTranslations] = useState<Record<Language, RecommendationTranslationDetails> | null>(null);
	const [drafts, setDrafts] = useState<Record<Language, TranslationDraft>>(EMPTY_DRAFTS);
	const [loadFailed, setLoadFailed] = useState(false);

	useEffect(() => {
		let cancelled = false;
		loadTranslations(recommendationId)
			.then((loaded) => {
				if (!cancelled) {
					setTranslations(loaded);
					setDrafts({ EL: draftOf(loaded.EL), LT: draftOf(loaded.LT), NL: draftOf(loaded.NL) });
				}
			})
			.catch(() => {
				if (!cancelled) {
					setLoadFailed(true);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [recommendationId, loadTranslations]);

	// Staging or reverting one language mutates only its Working Copy version, so reload the effective translations
	// and reset just that language's draft. The dialog stays open and other languages' in-progress edits survive.
	const reconcile = async (lang: Language, action: () => Promise<void>) => {
		await action();
		try {
			const refreshed = await loadTranslations(recommendationId);
			setTranslations(refreshed);
			setDrafts((prev) => ({ ...prev, [lang]: draftOf(refreshed[lang]) }));
		} catch {
			setLoadFailed(true);
		}
	};

	return (
		<div className="modal modal-open" role="dialog" aria-label={t('recommendations.translationsTitle')}>
			<div className="modal-box">
				<h3 className="text-lg font-semibold">{t('recommendations.translationsTitle')}</h3>
				<div className="text-base-content/70 mt-2 space-y-1 text-sm">
					<p>
						<span className="font-semibold">{t('recommendations.columnName')}:</span> {englishName}
					</p>
					<p>
						<span className="font-semibold">{t('recommendations.columnComponent')}:</span>{' '}
						{englishComponent}
					</p>
					<p>
						<span className="font-semibold">{t('recommendations.columnExplanation')}:</span>{' '}
						{englishExplanation ?? '—'}
					</p>
					<p>
						<span className="font-semibold">{t('recommendations.columnHumanFriendlyDisplay')}:</span>{' '}
						{englishHumanFriendlyDisplay ?? '—'}
					</p>
				</div>
				{loadFailed ? (
					<p className="text-error mt-2">{t('recommendations.translationsLoadError')}</p>
				) : (
					LANGUAGES.map((lang) => {
						const current = translations?.[lang];
						const staged = current !== undefined && current.version > 0;
						const draft = drafts[lang];
						const changed =
							current !== undefined &&
							(draft.name !== (current.name ?? '') ||
								draft.component !== (current.componentForScoring ?? '') ||
								draft.explanation !== (current.explanationForLlm ?? '') ||
								draft.humanFriendlyDisplay !== (current.humanFriendlyDisplay ?? ''));
						return (
							<div key={lang} className="mt-3">
								<div className="flex items-center justify-between">
									<span className="label-text font-semibold">{lang}</span>
									{staged ? (
										<button
											type="button"
											className="btn btn-ghost btn-xs"
											onClick={() => reconcile(lang, () => onRevert(lang, current.version))}
										>
											{t('recommendations.translationRevert')}
										</button>
									) : null}
								</div>
								<input
									type="text"
									className="input input-sm input-bordered w-full"
									aria-label={`${lang} ${t('recommendations.columnName')}`}
									placeholder={englishName}
									value={draft.name}
									disabled={current === undefined}
									onChange={(event) =>
										setDrafts((prev) => ({
											...prev,
											[lang]: { ...prev[lang], name: event.target.value },
										}))
									}
								/>
								<input
									type="text"
									className="input input-sm input-bordered mt-1 w-full"
									aria-label={`${lang} ${t('recommendations.columnComponent')}`}
									placeholder={englishComponent}
									value={draft.component}
									disabled={current === undefined}
									onChange={(event) =>
										setDrafts((prev) => ({
											...prev,
											[lang]: { ...prev[lang], component: event.target.value },
										}))
									}
								/>
								<textarea
									className="textarea textarea-bordered mt-1 w-full"
									aria-label={`${lang} ${t('recommendations.columnExplanation')}`}
									placeholder={englishExplanation ?? t('recommendations.columnExplanation')}
									value={draft.explanation}
									disabled={current === undefined}
									onChange={(event) =>
										setDrafts((prev) => ({
											...prev,
											[lang]: { ...prev[lang], explanation: event.target.value },
										}))
									}
								/>
								<textarea
									className="textarea textarea-bordered mt-1 w-full"
									aria-label={`${lang} ${t('recommendations.columnHumanFriendlyDisplay')}`}
									placeholder={
										englishHumanFriendlyDisplay ?? t('recommendations.columnHumanFriendlyDisplay')
									}
									value={draft.humanFriendlyDisplay}
									disabled={current === undefined}
									onChange={(event) =>
										setDrafts((prev) => ({
											...prev,
											[lang]: { ...prev[lang], humanFriendlyDisplay: event.target.value },
										}))
									}
								/>
								<div className="mt-1 text-right">
									<button
										type="button"
										className="btn btn-primary btn-xs"
										disabled={!changed}
										onClick={() =>
											reconcile(lang, () =>
												onStage(
													lang,
													draft.name.trim() === '' ? null : draft.name.trim(),
													draft.component.trim() === '' ? null : draft.component.trim(),
													draft.explanation.trim() === '' ? null : draft.explanation,
													draft.humanFriendlyDisplay.trim() === ''
														? null
														: draft.humanFriendlyDisplay,
													current?.version ?? 0,
												),
											)
										}
									>
										{t('recommendations.translationSave')}
									</button>
								</div>
							</div>
						);
					})
				)}
				<div className="modal-action">
					<button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
						{t('recommendations.translationsClose')}
					</button>
				</div>
			</div>
		</div>
	);
}
