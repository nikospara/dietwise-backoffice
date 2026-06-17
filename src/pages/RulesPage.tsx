import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import {
	createRoleOrTechnique,
	createRule,
	createTriggerIngredient,
	discardNewRule,
	editRoleOrTechnique,
	editTriggerIngredient,
	fetchNewRuleOptions,
	fetchRationaleTranslations,
	fetchRoleOrTechnique,
	fetchRoleOrTechniqueTranslations,
	fetchRules,
	fetchTriggerIngredient,
	fetchTriggerIngredientTranslations,
	type Language,
	LANGUAGES,
	revertRationale,
	revertRationaleTranslation,
	revertRoleOrTechnique,
	revertRoleOrTechniqueTranslation,
	revertTriggerIngredient,
	revertTriggerIngredientTranslation,
	setActive,
	stageRationale,
	stageRationaleTranslation,
	stageRoleOrTechniqueTranslation,
	stageTriggerIngredientTranslation,
	type NewRuleOptions,
	type ReferenceOption,
	type Rule,
	type TranslationState,
} from '@/api/rules';
import { Combobox } from '@/components/Combobox';
import { RationaleTranslationsDialog } from '@/components/RationaleTranslationsDialog';
import { ReferenceEditDialog } from '@/components/ReferenceEditDialog';
import { ReferenceTranslationsDialog } from '@/components/ReferenceTranslationsDialog';

type EditTarget = { kind: 'trigger' | 'role'; id: string };
type ReferenceTranslationTarget = { kind: 'trigger' | 'role'; id: string; englishName: string };
type TranslationTarget = { ruleId: string; englishRationale: string | null };

const translationChipClass = (state: TranslationState) =>
	state === 'STAGED'
		? 'badge badge-sm badge-warning'
		: state === 'PRESENT'
			? 'badge badge-sm badge-success'
			: 'badge badge-sm badge-ghost';

const translationChips = (states: Record<Language, TranslationState>) =>
	LANGUAGES.map((lang) => (
		<span key={lang} className={translationChipClass(states[lang])}>
			{lang}
		</span>
	));

const EMPTY = '—';

export function RulesPage() {
	const { t } = useTranslation();
	const [rules, setRules] = useState<Rule[] | null>(null);
	const [failed, setFailed] = useState(false);
	const [drafts, setDrafts] = useState<Record<string, string>>({});
	const [conflict, setConflict] = useState(false);
	const [options, setOptions] = useState<NewRuleOptions | null>(null);
	const [newRecommendationId, setNewRecommendationId] = useState('');
	const [newTriggerIngredientId, setNewTriggerIngredientId] = useState<string | null>(null);
	const [newRoleOrTechniqueId, setNewRoleOrTechniqueId] = useState<string | null>(null);
	const [editing, setEditing] = useState<EditTarget | null>(null);
	const [translatingReference, setTranslatingReference] = useState<ReferenceTranslationTarget | null>(null);
	const [translating, setTranslating] = useState<TranslationTarget | null>(null);

	const reload = useCallback(() => {
		fetchRules()
			.then((loaded) => {
				setRules(loaded);
				setDrafts({});
				setFailed(false);
			})
			.catch(() => setFailed(true));
	}, []);

	const refreshOptions = useCallback(() => {
		fetchNewRuleOptions()
			.then(setOptions)
			.catch(() => undefined);
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

	useEffect(() => {
		let cancelled = false;
		fetchNewRuleOptions()
			.then((loaded) => {
				if (!cancelled) {
					setOptions(loaded);
				}
			})
			.catch(() => undefined);
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
						r.id === rule.id
							? {
									...r,
									rationale: draft,
									version,
									changeState: r.changeState === 'NEW' ? 'NEW' : 'CHANGED',
									changedFields:
										r.changeState === 'NEW' || r.changedFields.includes('RATIONALE')
											? r.changedFields
											: [...r.changedFields, 'RATIONALE'],
								}
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

	const commitDiscard = (rule: Rule) => runAndReload(() => discardNewRule(rule.id, rule.version));

	const optionName = (entries: ReferenceOption[], id: string) =>
		entries.find((entry) => entry.id === id)?.name ?? null;
	const candidateRecommendation = options ? optionName(options.recommendations, newRecommendationId) : null;
	const candidateTrigger =
		options && newTriggerIngredientId ? optionName(options.triggerIngredients, newTriggerIngredientId) : null;
	const candidateRole =
		options && newRoleOrTechniqueId ? optionName(options.rolesOrTechniques, newRoleOrTechniqueId) : null;
	const isDuplicate =
		candidateRecommendation !== null &&
		candidateTrigger !== null &&
		(rules ?? []).some(
			(rule) =>
				rule.recommendation === candidateRecommendation &&
				rule.triggerIngredient === candidateTrigger &&
				(rule.roleOrTechnique ?? null) === candidateRole,
		);
	const canCreate = newRecommendationId !== '' && newTriggerIngredientId !== null && !isDuplicate;

	const createReference = async (
		create: (name: string) => Promise<ReferenceOption>,
		pick: (loaded: NewRuleOptions) => ReferenceOption[],
		select: (id: string) => void,
		name: string,
	) => {
		try {
			const created = await create(name);
			const refreshed = await fetchNewRuleOptions();
			setOptions(refreshed);
			select(created.id);
		} catch (error) {
			if (error instanceof ApiError && error.status === 409) {
				const refreshed = await fetchNewRuleOptions();
				setOptions(refreshed);
				const match = pick(refreshed).find((option) => option.name.toLowerCase() === name.toLowerCase());
				if (match) {
					select(match.id);
				}
			} else {
				setFailed(true);
			}
		}
	};

	const onCreateTrigger = (name: string) =>
		createReference(
			createTriggerIngredient,
			(loaded) => loaded.triggerIngredients,
			setNewTriggerIngredientId,
			name,
		);
	const onCreateRole = (name: string) =>
		createReference(createRoleOrTechnique, (loaded) => loaded.rolesOrTechniques, setNewRoleOrTechniqueId, name);

	const commitEdit = async (
		target: EditTarget,
		name: string,
		explanationForLlm: string | null,
		baseVersion: number,
	) => {
		const edit = target.kind === 'trigger' ? editTriggerIngredient : editRoleOrTechnique;
		setEditing(null);
		try {
			await edit(target.id, name, explanationForLlm, baseVersion);
			setConflict(false);
			reload();
			refreshOptions();
		} catch (error) {
			if (error instanceof ApiError && error.status === 409) {
				setConflict(true);
				reload();
				refreshOptions();
			} else {
				setFailed(true);
			}
		}
	};

	const commitRevertReference = async (target: EditTarget, baseVersion: number) => {
		const revert = target.kind === 'trigger' ? revertTriggerIngredient : revertRoleOrTechnique;
		setEditing(null);
		try {
			await revert(target.id, baseVersion);
			setConflict(false);
			reload();
			refreshOptions();
		} catch (error) {
			if (error instanceof ApiError && error.status === 409) {
				setConflict(true);
				reload();
				refreshOptions();
			} else {
				setFailed(true);
			}
		}
	};

	const commitStageReferenceTranslation = async (
		target: EditTarget,
		lang: Language,
		name: string | null,
		explanationForLlm: string | null,
		baseVersion: number,
	) => {
		const stage = target.kind === 'trigger' ? stageTriggerIngredientTranslation : stageRoleOrTechniqueTranslation;
		setTranslatingReference(null);
		await runAndReload(() => stage(target.id, lang, name, explanationForLlm, baseVersion));
	};

	const commitRevertReferenceTranslation = async (target: EditTarget, lang: Language, baseVersion: number) => {
		const revert =
			target.kind === 'trigger' ? revertTriggerIngredientTranslation : revertRoleOrTechniqueTranslation;
		setTranslatingReference(null);
		await runAndReload(() => revert(target.id, lang, baseVersion));
	};

	const commitStageTranslation = async (
		ruleId: string,
		lang: Language,
		rationale: string | null,
		baseVersion: number,
	) => {
		setTranslating(null);
		try {
			await stageRationaleTranslation(ruleId, lang, rationale, baseVersion);
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

	const commitRevertTranslation = async (ruleId: string, lang: Language, baseVersion: number) => {
		setTranslating(null);
		try {
			await revertRationaleTranslation(ruleId, lang, baseVersion);
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

	const submitNewRule = async () => {
		if (!canCreate || newTriggerIngredientId === null) {
			return;
		}
		try {
			await createRule(newRecommendationId, newTriggerIngredientId, newRoleOrTechniqueId);
			setConflict(false);
			setNewRecommendationId('');
			setNewTriggerIngredientId(null);
			setNewRoleOrTechniqueId(null);
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

	let editDialog = null;
	if (editing !== null) {
		const target = editing;
		const candidates =
			target.kind === 'trigger' ? (options?.triggerIngredients ?? []) : (options?.rolesOrTechniques ?? []);
		const affectedCount = rules.filter(
			(rule) => (target.kind === 'trigger' ? rule.triggerIngredientId : rule.roleOrTechniqueId) === target.id,
		).length;
		editDialog = (
			<ReferenceEditDialog
				referenceId={target.id}
				title={t(target.kind === 'trigger' ? 'rules.editTriggerIngredient' : 'rules.editRoleOrTechnique')}
				affectedCount={affectedCount}
				takenNames={candidates
					.filter((option) => option.id !== target.id)
					.map((option) => option.name.toLowerCase())}
				loadDetails={target.kind === 'trigger' ? fetchTriggerIngredient : fetchRoleOrTechnique}
				onSubmit={(name, explanationForLlm, baseVersion) =>
					commitEdit(target, name, explanationForLlm, baseVersion)
				}
				onRevert={(baseVersion) => commitRevertReference(target, baseVersion)}
				onCancel={() => setEditing(null)}
			/>
		);
	}

	let referenceTranslationsDialog = null;
	if (translatingReference !== null) {
		const target = translatingReference;
		referenceTranslationsDialog = (
			<ReferenceTranslationsDialog
				referenceId={target.id}
				title={t(target.kind === 'trigger' ? 'rules.editTriggerTranslations' : 'rules.editRoleTranslations')}
				englishName={target.englishName}
				loadTranslations={
					target.kind === 'trigger' ? fetchTriggerIngredientTranslations : fetchRoleOrTechniqueTranslations
				}
				onStage={(lang, name, explanationForLlm, baseVersion) =>
					commitStageReferenceTranslation(target, lang, name, explanationForLlm, baseVersion)
				}
				onRevert={(lang, baseVersion) => commitRevertReferenceTranslation(target, lang, baseVersion)}
				onCancel={() => setTranslatingReference(null)}
			/>
		);
	}

	let translationsDialog = null;
	if (translating !== null) {
		const target = translating;
		translationsDialog = (
			<RationaleTranslationsDialog
				ruleId={target.ruleId}
				englishRationale={target.englishRationale}
				loadTranslations={fetchRationaleTranslations}
				onStage={(lang, rationale, baseVersion) =>
					commitStageTranslation(target.ruleId, lang, rationale, baseVersion)
				}
				onRevert={(lang, baseVersion) => commitRevertTranslation(target.ruleId, lang, baseVersion)}
				onCancel={() => setTranslating(null)}
			/>
		);
	}

	return (
		<div>
			<h1 className="mb-4 text-xl font-semibold">{t('rules.title')}</h1>
			{conflict ? (
				<div className="alert alert-warning mb-4">
					<span>{t('rules.staleReload')}</span>
				</div>
			) : null}
			<div className="mb-4 flex flex-wrap items-end gap-2">
				<select
					className="select select-sm select-bordered"
					aria-label={t('rules.recommendation')}
					value={newRecommendationId}
					onChange={(event) => setNewRecommendationId(event.target.value)}
				>
					<option value="">{t('rules.selectRecommendation')}</option>
					{options?.recommendations.map((option) => (
						<option key={option.id} value={option.id}>
							{option.name}
						</option>
					))}
				</select>
				<div className="w-48">
					<Combobox
						options={options?.triggerIngredients ?? []}
						value={newTriggerIngredientId}
						onChange={setNewTriggerIngredientId}
						label={t('rules.triggerIngredient')}
						placeholder={t('rules.selectTriggerIngredient')}
						onCreate={onCreateTrigger}
						createLabel={(name) => t('rules.addOption', { name })}
					/>
				</div>
				<div className="w-48">
					<Combobox
						options={options?.rolesOrTechniques ?? []}
						value={newRoleOrTechniqueId}
						onChange={setNewRoleOrTechniqueId}
						label={t('rules.roleOrTechnique')}
						placeholder={t('rules.selectRoleOrTechnique')}
						clearLabel={t('rules.noRole')}
						onCreate={onCreateRole}
						createLabel={(name) => t('rules.addOption', { name })}
					/>
				</div>
				<button type="button" className="btn btn-primary btn-sm" disabled={!canCreate} onClick={submitNewRule}>
					{t('rules.addRule')}
				</button>
				{isDuplicate ? <span className="text-error text-sm">{t('rules.duplicateRule')}</span> : null}
			</div>
			<table className="table">
				<thead>
					<tr>
						<th className="px-0 py-4">{t('rules.columnRecommendation')}</th>
						<th className="px-0 py-4">{t('rules.columnTriggerIngredient')}</th>
						<th className="px-0 py-4">{t('rules.columnRoleOrTechnique')}</th>
						<th className="px-0 py-4">{t('rules.columnRationale')}</th>
						<th className="px-0 py-4">{t('rules.columnActions')}</th>
					</tr>
				</thead>
				<tbody>
					{rules.map((rule) => {
						const isNew = rule.changeState === 'NEW';
						const pending = rule.changeState !== 'UNCHANGED';
						const rationaleChanged = rule.changedFields.includes('RATIONALE');
						const triggerChanged = rule.changedFields.includes('TRIGGER_INGREDIENT');
						const roleChanged = rule.changedFields.includes('ROLE_OR_TECHNIQUE');
						const roleId = rule.roleOrTechniqueId;
						const rowClass = isNew ? 'bg-success/10' : rule.active ? '' : 'bg-error/10';
						return (
							<tr key={rule.id} className={rowClass}>
								<td className="px-0 py-1">{rule.recommendation}</td>
								<td className={triggerChanged ? 'bg-warning/10 px-0 py-1' : 'px-0 py-1'}>
									<button
										type="button"
										className="link link-hover"
										aria-label={t('rules.editTriggerIngredient')}
										onClick={() => setEditing({ kind: 'trigger', id: rule.triggerIngredientId })}
									>
										{rule.triggerIngredient}
									</button>
									<button
										type="button"
										className="mt-1 flex cursor-pointer gap-1"
										aria-label={t('rules.editTriggerTranslations')}
										onClick={() =>
											setTranslatingReference({
												kind: 'trigger',
												id: rule.triggerIngredientId,
												englishName: rule.triggerIngredient,
											})
										}
									>
										{translationChips(rule.triggerIngredientTranslations)}
									</button>
								</td>
								<td className={roleChanged ? 'bg-warning/10 px-0 py-1' : 'px-0 py-1'}>
									{roleId === null ? (
										EMPTY
									) : (
										<div>
											<button
												type="button"
												className="link link-hover"
												aria-label={t('rules.editRoleOrTechnique')}
												onClick={() => setEditing({ kind: 'role', id: roleId })}
											>
												{rule.roleOrTechnique}
											</button>
											<button
												type="button"
												className="mt-1 flex cursor-pointer gap-1"
												aria-label={t('rules.editRoleTranslations')}
												onClick={() =>
													setTranslatingReference({
														kind: 'role',
														id: roleId,
														englishName: rule.roleOrTechnique ?? '',
													})
												}
											>
												{translationChips(rule.roleOrTechniqueTranslations)}
											</button>
										</div>
									)}
								</td>
								<td className="px-0 py-1">
									<input
										type="text"
										className={`input input-sm input-bordered w-full ${rationaleChanged ? 'border-warning bg-warning/10' : ''}`}
										value={drafts[rule.id] ?? rule.rationale ?? ''}
										aria-label={t('rules.rationaleEditLabel')}
										onChange={(event) => onDraftChange(rule.id, event.target.value)}
										onBlur={() => commitRationale(rule)}
									/>
									<button
										type="button"
										className="mt-1 flex cursor-pointer gap-1"
										aria-label={t('rules.editTranslations')}
										onClick={() =>
											setTranslating({ ruleId: rule.id, englishRationale: rule.rationale })
										}
									>
										{translationChips(rule.rationaleTranslations)}
									</button>
								</td>
								<td className="px-0 py-1">
									<div className="flex items-center gap-2">
										{pending ? (
											<span className="badge badge-warning">{t('rules.pendingBadge')}</span>
										) : null}
										{rationaleChanged ? (
											<button
												type="button"
												className="btn btn-ghost btn-xs"
												onClick={() => commitRevert(rule)}
											>
												{t('rules.revert')}
											</button>
										) : null}
										{isNew ? (
											<button
												type="button"
												className="btn btn-ghost btn-xs"
												onClick={() => commitDiscard(rule)}
											>
												{t('rules.discard')}
											</button>
										) : (
											<button
												type="button"
												className="btn btn-ghost btn-xs"
												onClick={() => commitSetActive(rule)}
											>
												{rule.active ? t('rules.deactivate') : t('rules.activate')}
											</button>
										)}
									</div>
								</td>
							</tr>
						);
					})}
				</tbody>
			</table>
			{editDialog}
			{referenceTranslationsDialog}
			{translationsDialog}
		</div>
	);
}
