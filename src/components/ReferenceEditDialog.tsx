import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type Language, LANGUAGES, type ReferenceDetails, type TranslationState } from '@/api/rules';

interface ReferenceEditDialogProps {
	referenceId: string;
	title: string;
	/** How many Rules reference this shared entity, shown as the blast radius of the edit. */
	affectedCount: number;
	/** Lowercased names of the OTHER reference entities of the same kind, for the uniqueness check. */
	takenNames: string[];
	loadDetails: (id: string) => Promise<ReferenceDetails>;
	loadTranslations: (id: string) => Promise<Record<Language, ReferenceDetails>>;
	onSubmit: (name: string, explanationForLlm: string | null, baseVersion: number) => Promise<void>;
	onStageTranslation: (
		lang: Language,
		name: string | null,
		explanationForLlm: string | null,
		baseVersion: number,
	) => void;
	onRevertTranslation: (lang: Language, baseVersion: number) => void;
	onCancel: () => void;
}

type TranslationDraft = { name: string; explanation: string };

const EMPTY_DRAFTS: Record<Language, TranslationDraft> = {
	EL: { name: '', explanation: '' },
	LT: { name: '', explanation: '' },
	NL: { name: '', explanation: '' },
};

const stateChipClass = (state: TranslationState) =>
	state === 'STAGED'
		? 'badge badge-sm badge-warning'
		: state === 'PRESENT'
			? 'badge badge-sm badge-success'
			: 'badge badge-sm badge-ghost';

/**
 * Edits a shared reference entity (a Trigger Ingredient or a Role or Technique): its English name and LLM explanation,
 * plus its EL/LT/NL translations. The entity is shared master data, so the dialog warns how many Rules the edit affects
 * and blocks an English name that collides with another entry. Each translation is staged or reverted independently
 * against its own Working Copy version; a missing translation falls back to English at assessment time.
 */
export function ReferenceEditDialog({
	referenceId,
	title,
	affectedCount,
	takenNames,
	loadDetails,
	loadTranslations,
	onSubmit,
	onStageTranslation,
	onRevertTranslation,
	onCancel,
}: ReferenceEditDialogProps) {
	const { t } = useTranslation();
	const [details, setDetails] = useState<ReferenceDetails | null>(null);
	const [name, setName] = useState('');
	const [explanation, setExplanation] = useState('');
	const [loadFailed, setLoadFailed] = useState(false);
	const [saving, setSaving] = useState(false);
	const [translations, setTranslations] = useState<Record<Language, ReferenceDetails> | null>(null);
	const [translationDrafts, setTranslationDrafts] = useState<Record<Language, TranslationDraft>>(EMPTY_DRAFTS);
	const [translationsFailed, setTranslationsFailed] = useState(false);

	useEffect(() => {
		let cancelled = false;
		loadDetails(referenceId)
			.then((loaded) => {
				if (!cancelled) {
					setDetails(loaded);
					setName(loaded.name ?? '');
					setExplanation(loaded.explanationForLlm ?? '');
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
	}, [referenceId, loadDetails]);

	useEffect(() => {
		let cancelled = false;
		loadTranslations(referenceId)
			.then((loaded) => {
				if (!cancelled) {
					setTranslations(loaded);
					setTranslationDrafts({
						EL: { name: loaded.EL.name ?? '', explanation: loaded.EL.explanationForLlm ?? '' },
						LT: { name: loaded.LT.name ?? '', explanation: loaded.LT.explanationForLlm ?? '' },
						NL: { name: loaded.NL.name ?? '', explanation: loaded.NL.explanationForLlm ?? '' },
					});
				}
			})
			.catch(() => {
				if (!cancelled) {
					setTranslationsFailed(true);
				}
			});
		return () => {
			cancelled = true;
		};
	}, [referenceId, loadTranslations]);

	const trimmedName = name.trim();
	const isDuplicate = takenNames.includes(trimmedName.toLowerCase());
	const canSave = details !== null && trimmedName !== '' && !isDuplicate && !saving;

	const submit = () => {
		if (details === null || !canSave) {
			return;
		}
		setSaving(true);
		void onSubmit(trimmedName, explanation.trim() === '' ? null : explanation, details.version);
	};

	return (
		<div className="modal modal-open" role="dialog" aria-label={title}>
			<div className="modal-box">
				<h3 className="text-lg font-semibold">{title}</h3>
				{loadFailed ? (
					<p className="text-error mt-2">{t('rules.editLoadError')}</p>
				) : (
					<div>
						<p className="text-warning mt-2 text-sm">
							{t('rules.editBlastRadius', { count: affectedCount })}
						</p>
						<label className="form-control mt-3 block">
							<span className="label-text">{t('rules.editName')}</span>
							<input
								type="text"
								className="input input-sm input-bordered w-full"
								aria-label={t('rules.editName')}
								value={name}
								onChange={(event) => setName(event.target.value)}
							/>
						</label>
						<label className="form-control mt-3 block">
							<span className="label-text">{t('rules.editExplanation')}</span>
							<textarea
								className="textarea textarea-bordered w-full"
								aria-label={t('rules.editExplanation')}
								value={explanation}
								onChange={(event) => setExplanation(event.target.value)}
							/>
						</label>
						{isDuplicate ? <p className="text-error mt-2 text-sm">{t('rules.editDuplicateName')}</p> : null}
						<div className="mt-3 text-right">
							<button
								type="button"
								className="btn btn-primary btn-sm"
								disabled={!canSave}
								onClick={submit}
							>
								{t('rules.editSave')}
							</button>
						</div>
						<h4 className="mt-4 font-semibold">{t('rules.translationsTitle')}</h4>
						{translationsFailed ? (
							<p className="text-error mt-2">{t('rules.translationsLoadError')}</p>
						) : null}
						{translations === null
							? null
							: LANGUAGES.map((lang) => {
									const current = translations[lang];
									const staged = current.version > 0;
									const draft = translationDrafts[lang];
									const changed =
										draft.name !== (current.name ?? '') ||
										draft.explanation !== (current.explanationForLlm ?? '');
									const state: TranslationState = staged
										? 'STAGED'
										: current.name
											? 'PRESENT'
											: 'MISSING';
									return (
										<div key={lang} className="border-base-300 mt-3 border-t pt-2">
											<div className="flex items-center justify-between">
												<span className={stateChipClass(state)}>{lang}</span>
												{staged ? (
													<button
														type="button"
														className="btn btn-ghost btn-xs"
														onClick={() => onRevertTranslation(lang, current.version)}
													>
														{t('rules.translationRevert')}
													</button>
												) : null}
											</div>
											<input
												type="text"
												className="input input-sm input-bordered mt-1 w-full"
												aria-label={`${lang} ${t('rules.editName')}`}
												value={draft.name}
												onChange={(event) =>
													setTranslationDrafts((prev) => ({
														...prev,
														[lang]: { ...prev[lang], name: event.target.value },
													}))
												}
											/>
											<textarea
												className="textarea textarea-bordered mt-1 w-full"
												aria-label={`${lang} ${t('rules.editExplanation')}`}
												value={draft.explanation}
												onChange={(event) =>
													setTranslationDrafts((prev) => ({
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
														onStageTranslation(
															lang,
															draft.name.trim() === '' ? null : draft.name.trim(),
															draft.explanation.trim() === '' ? null : draft.explanation,
															current.version,
														)
													}
												>
													{t('rules.translationSave')}
												</button>
											</div>
										</div>
									);
								})}
					</div>
				)}
				<div className="modal-action">
					<button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
						{t('rules.editCancel')}
					</button>
				</div>
			</div>
		</div>
	);
}
