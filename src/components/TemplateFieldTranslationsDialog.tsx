import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Language, LANGUAGES, type TemplateField, type VersionedText } from '@/api/rules';

interface TemplateFieldTranslationsDialogProps {
	templateId: string;
	field: TemplateField;
	/** Header and dialog label, identifying the field and its AlternativeIngredient. */
	title: string;
	/** The effective English value of this field, shown read-only as the source the translations render. */
	englishValue: string | null;
	loadTranslations: (templateId: string, field: TemplateField) => Promise<Record<Language, VersionedText>>;
	onStage: (lang: Language, value: string | null, baseVersion: number) => Promise<void>;
	onRevert: (lang: Language, baseVersion: number) => Promise<void>;
	onCancel: () => void;
}

/**
 * Edits one field of a Suggestion Template's translation in each non-English language. Each language is staged or
 * reverted independently against its own Working Copy version; a missing translation falls back to English at assessment
 * time. Pre-filled from the effective per-language translations.
 */
export function TemplateFieldTranslationsDialog({
	templateId,
	field,
	title,
	englishValue,
	loadTranslations,
	onStage,
	onRevert,
	onCancel,
}: TemplateFieldTranslationsDialogProps) {
	const { t } = useTranslation();
	const [translations, setTranslations] = useState<Record<Language, VersionedText> | null>(null);
	const [drafts, setDrafts] = useState<Record<Language, string>>({ EL: '', LT: '', NL: '' });
	const [loadFailed, setLoadFailed] = useState(false);

	useEffect(() => {
		let cancelled = false;
		loadTranslations(templateId, field)
			.then((loaded) => {
				if (!cancelled) {
					setTranslations(loaded);
					setDrafts({
						EL: loaded.EL.text ?? '',
						LT: loaded.LT.text ?? '',
						NL: loaded.NL.text ?? '',
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
	}, [templateId, field, loadTranslations]);

	// Staging or reverting one language mutates only its Working Copy version, so reload the effective translations
	// and reset just that language's draft. The dialog stays open and other languages' in-progress edits survive.
	const reconcile = async (lang: Language, action: () => Promise<void>) => {
		await action();
		try {
			const refreshed = await loadTranslations(templateId, field);
			setTranslations(refreshed);
			setDrafts((prev) => ({ ...prev, [lang]: refreshed[lang].text ?? '' }));
		} catch {
			setLoadFailed(true);
		}
	};

	return (
		<div className="modal modal-open" role="dialog" aria-label={title}>
			<div className="modal-box">
				<h3 className="text-lg font-semibold">{title}</h3>
				<p className="text-base-content/70 mt-2 text-sm">
					<span className="font-semibold">{t('rules.translationsEnglish')}:</span> {englishValue ?? '—'}
				</p>
				{loadFailed ? (
					<p className="text-error mt-2">{t('rules.translationsLoadError')}</p>
				) : (
					LANGUAGES.map((lang) => {
						const current = translations?.[lang];
						const staged = current !== undefined && current.version > 0;
						const value = drafts[lang];
						const changed = current !== undefined && value !== (current.text ?? '');
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
											{t('rules.translationRevert')}
										</button>
									) : null}
								</div>
								<textarea
									className="textarea textarea-bordered w-full"
									aria-label={lang}
									value={value}
									disabled={current === undefined}
									onChange={(event) => setDrafts((prev) => ({ ...prev, [lang]: event.target.value }))}
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
													value.trim() === '' ? null : value,
													current?.version ?? 0,
												),
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
