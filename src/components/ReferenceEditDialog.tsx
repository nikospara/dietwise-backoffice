import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReferenceDetails } from '@/api/rules';

interface ReferenceEditDialogProps {
	referenceId: string;
	title: string;
	/** How many Rules reference this shared entity, shown as the blast radius of the edit. */
	affectedCount: number;
	/** Lowercased names of the OTHER reference entities of the same kind, for the uniqueness check. */
	takenNames: string[];
	loadDetails: (id: string) => Promise<ReferenceDetails>;
	onSubmit: (name: string, explanationForLlm: string | null, baseVersion: number) => Promise<void>;
	onCancel: () => void;
}

/**
 * Edits the name and LLM explanation of a shared reference entity (a Trigger Ingredient or a Role or Technique). The
 * entity is shared master data, so the dialog warns how many Rules the edit affects and blocks a name that collides
 * with another entry. Pre-filled from the entity's effective details and saved against their Working Copy version.
 */
export function ReferenceEditDialog({
	referenceId,
	title,
	affectedCount,
	takenNames,
	loadDetails,
	onSubmit,
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
					setName(loaded.name);
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
					</div>
				)}
				<div className="modal-action">
					<button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
						{t('rules.editCancel')}
					</button>
					{loadFailed ? null : (
						<button type="button" className="btn btn-primary btn-sm" disabled={!canSave} onClick={submit}>
							{t('rules.editSave')}
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
