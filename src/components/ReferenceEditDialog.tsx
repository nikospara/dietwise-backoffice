import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type ReferenceDetails } from '@/components/referenceData';

interface ReferenceEditDialogProps {
	referenceId: string;
	title: string;
	/** A pre-formatted warning describing the blast radius of the edit (how many things the shared entity affects), or
	 * null to omit it. The caller phrases it for its domain (Rules, Suggestion Templates, …). */
	blastRadius: string | null;
	/** Lowercased names of the OTHER reference entities of the same kind, for the uniqueness check. */
	takenNames: string[];
	loadDetails: (id: string) => Promise<ReferenceDetails>;
	onSubmit: (name: string, explanationForLlm: string | null, baseVersion: number) => Promise<void>;
	onRevert: (baseVersion: number) => void;
	onCancel: () => void;
}

/**
 * Edits a shared reference entity (a Trigger Ingredient, Role or Technique, or Alternative Ingredient): its English
 * name and LLM explanation. The entity is shared master data, so the dialog warns about the blast radius of the edit
 * and blocks an English name that collides with another entry. A staged edit on a published entity can be reverted to
 * its published value; translations are edited separately from the grid's per-language chips.
 */
export function ReferenceEditDialog({
	referenceId,
	title,
	blastRadius,
	takenNames,
	loadDetails,
	onSubmit,
	onRevert,
	onCancel,
}: ReferenceEditDialogProps) {
	const { t } = useTranslation();
	const [details, setDetails] = useState<ReferenceDetails | null>(null);
	const [name, setName] = useState('');
	const [explanation, setExplanation] = useState('');
	const [loadFailed, setLoadFailed] = useState(false);
	const [saving, setSaving] = useState(false);

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
					<p className="text-error mt-2">{t('reference.editLoadError')}</p>
				) : (
					<div>
						{blastRadius !== null ? <p className="text-warning mt-2 text-sm">{blastRadius}</p> : null}
						<label className="form-control mt-3 block">
							<span className="label-text">{t('reference.editName')}</span>
							<input
								type="text"
								className="input input-sm input-bordered w-full"
								aria-label={t('reference.editName')}
								value={name}
								onChange={(event) => setName(event.target.value)}
							/>
						</label>
						<label className="form-control mt-3 block">
							<span className="label-text">{t('reference.editExplanation')}</span>
							<textarea
								className="textarea textarea-bordered w-full"
								aria-label={t('reference.editExplanation')}
								value={explanation}
								onChange={(event) => setExplanation(event.target.value)}
							/>
						</label>
						{isDuplicate ? (
							<p className="text-error mt-2 text-sm">{t('reference.editDuplicateName')}</p>
						) : null}
					</div>
				)}
				<div className="modal-action">
					{details !== null && details.version > 0 && details.published ? (
						<button
							type="button"
							className="btn btn-ghost btn-sm"
							onClick={() => onRevert(details.version)}
						>
							{t('reference.editRevert')}
						</button>
					) : null}
					<button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
						{t('reference.editCancel')}
					</button>
					{loadFailed ? null : (
						<button type="button" className="btn btn-primary btn-sm" disabled={!canSave} onClick={submit}>
							{t('reference.editSave')}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
