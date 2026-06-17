import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Language, LANGUAGES, type ReferenceDetails } from '@/api/rules';

interface ReferenceTranslationsDialogProps {
	referenceId: string;
	title: string;
	/** The effective English name, shown read-only as the source the translations render. */
	englishName: string;
	loadTranslations: (id: string) => Promise<Record<Language, ReferenceDetails>>;
	onStage: (lang: Language, name: string | null, explanationForLlm: string | null, baseVersion: number) => void;
	onRevert: (lang: Language, baseVersion: number) => void;
	onCancel: () => void;
}

type TranslationDraft = { name: string; explanation: string };

const EMPTY_DRAFTS: Record<Language, TranslationDraft> = {
	EL: { name: '', explanation: '' },
	LT: { name: '', explanation: '' },
	NL: { name: '', explanation: '' },
};

/**
 * Edits a shared reference entity's (a Trigger Ingredient or Role or Technique) name and LLM explanation in each
 * non-English language. Each language is staged or reverted independently against its own Working Copy version; a
 * missing translation falls back to English at assessment time. Pre-filled from the effective per-language translations.
 */
export function ReferenceTranslationsDialog({
	referenceId,
	title,
	englishName,
	loadTranslations,
	onStage,
	onRevert,
	onCancel,
}: ReferenceTranslationsDialogProps) {
	const { t } = useTranslation();
	const [translations, setTranslations] = useState<Record<Language, ReferenceDetails> | null>(null);
	const [drafts, setDrafts] = useState<Record<Language, TranslationDraft>>(EMPTY_DRAFTS);
	const [loadFailed, setLoadFailed] = useState(false);

	useEffect(() => {
		let cancelled = false;
		loadTranslations(referenceId)
			.then((loaded) => {
				if (!cancelled) {
					setTranslations(loaded);
					setDrafts({
						EL: { name: loaded.EL.name ?? '', explanation: loaded.EL.explanationForLlm ?? '' },
						LT: { name: loaded.LT.name ?? '', explanation: loaded.LT.explanationForLlm ?? '' },
						NL: { name: loaded.NL.name ?? '', explanation: loaded.NL.explanationForLlm ?? '' },
					});
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
	}, [referenceId, loadTranslations]);

	return (
		<div className="modal modal-open" role="dialog" aria-label={title}>
			<div className="modal-box">
				<h3 className="text-lg font-semibold">{title}</h3>
				<p className="text-base-content/70 mt-2 text-sm">
					<span className="font-semibold">{t('rules.translationsEnglish')}:</span> {englishName}
				</p>
				{loadFailed ? (
					<p className="text-error mt-2">{t('rules.translationsLoadError')}</p>
				) : (
					LANGUAGES.map((lang) => {
						const current = translations?.[lang];
						const staged = current !== undefined && current.version > 0;
						const draft = drafts[lang];
						const changed =
							current !== undefined &&
							(draft.name !== (current.name ?? '') ||
								draft.explanation !== (current.explanationForLlm ?? ''));
						return (
							<div key={lang} className="mt-3">
								<div className="flex items-center justify-between">
									<span className="label-text font-semibold">{lang}</span>
									{staged ? (
										<button
											type="button"
											className="btn btn-ghost btn-xs"
											onClick={() => onRevert(lang, current.version)}
										>
											{t('rules.translationRevert')}
										</button>
									) : null}
								</div>
								<input
									type="text"
									className="input input-sm input-bordered w-full"
									aria-label={`${lang} ${t('rules.editName')}`}
									value={draft.name}
									disabled={current === undefined}
									onChange={(event) =>
										setDrafts((prev) => ({
											...prev,
											[lang]: { ...prev[lang], name: event.target.value },
										}))
									}
								/>
								<textarea
									className="textarea textarea-bordered mt-1 w-full"
									aria-label={`${lang} ${t('rules.editExplanation')}`}
									value={draft.explanation}
									disabled={current === undefined}
									onChange={(event) =>
										setDrafts((prev) => ({
											...prev,
											[lang]: { ...prev[lang], explanation: event.target.value },
										}))
									}
								/>
								<div className="mt-1 text-right">
									<button
										type="button"
										className="btn btn-primary btn-xs"
										disabled={!changed}
										onClick={() =>
											onStage(
												lang,
												draft.name.trim() === '' ? null : draft.name.trim(),
												draft.explanation.trim() === '' ? null : draft.explanation,
												current?.version ?? 0,
											)
										}
									>
										{t('rules.translationSave')}
									</button>
								</div>
							</div>
						);
					})
				)}
				<div className="modal-action">
					<button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
						{t('rules.translationsClose')}
					</button>
				</div>
			</div>
		</div>
	);
}
