import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ApiError } from '@/api/client';
import {
	addSuggestionTemplate,
	createAlternativeIngredient,
	createRoleOrTechnique,
	createRule,
	createTriggerIngredient,
	discardNewRule,
	discardSuggestionTemplate,
	editAlternativeIngredient,
	editRoleOrTechnique,
	editTriggerIngredient,
	fetchAlternativeIngredient,
	fetchAlternativeIngredientOptions,
	fetchAlternativeIngredientTranslations,
	fetchNewRuleOptions,
	fetchRationaleTranslations,
	fetchRoleOrTechnique,
	fetchRoleOrTechniqueTranslations,
	fetchRules,
	fetchSuggestionTemplates,
	fetchTemplateFieldTranslations,
	fetchTriggerIngredient,
	fetchTriggerIngredientTranslations,
	type Language,
	LANGUAGES,
	revertAlternativeIngredient,
	revertAlternativeIngredientTranslation,
	revertRationale,
	revertRationaleTranslation,
	revertRoleOrTechnique,
	revertRoleOrTechniqueTranslation,
	revertSuggestionTemplateField,
	revertTemplateFieldTranslation,
	revertTriggerIngredient,
	revertTriggerIngredientTranslation,
	setActive,
	setActiveSuggestionTemplate,
	stageAlternativeIngredientTranslation,
	stageRationale,
	stageRationaleTranslation,
	stageRoleOrTechniqueTranslation,
	stageSuggestionTemplateField,
	stageTemplateFieldTranslation,
	stageTriggerIngredientTranslation,
	type AlternativeIngredientDetails,
	type NewRuleOptions,
	type ReferenceOption,
	type Rule,
	type SuggestionTemplate,
	type TemplateField,
	type TranslationState,
} from '@/rules/rules';
import { Combobox } from '@/components/Combobox';
import { RationaleTranslationsDialog } from '@/components/RationaleTranslationsDialog';
import { ReferenceEditDialog } from '@/components/ReferenceEditDialog';
import { ReferenceTranslationsDialog } from '@/components/ReferenceTranslationsDialog';
import { TemplateFieldTranslationsDialog } from '@/components/TemplateFieldTranslationsDialog';

type EditTarget = { kind: 'trigger' | 'role'; id: string };
type ReferenceTranslationTarget = { kind: 'trigger' | 'role'; id: string; englishName: string };
type TranslationTarget = { ruleId: string; englishRationale: string | null };
type TemplateTranslationTarget = {
	ruleId: string;
	templateId: string;
	field: TemplateField;
	title: string;
	englishValue: string | null;
};

const translationChipClass = (state: TranslationState) =>
	state === 'STAGED'
		? 'badge badge-sm badge-warning'
		: state === 'PRESENT'
			? 'badge badge-sm badge-success'
			: 'badge badge-sm badge-ghost';

const translationChips = (states: Record<Language, TranslationState>) =>
	LANGUAGES.map((lang) => (
		<span key={lang} className={translationChipClass(states[lang])}>
			<span className="sm:hidden lg:inline">{lang}</span>
			<span className="text-[10px] sm:inline lg:hidden">{lang.substring(0, 1)}</span>
		</span>
	));

const EMPTY = '—';

const templateFieldValue = (template: SuggestionTemplate, field: TemplateField): string | null =>
	field === 'RESTRICTION'
		? template.restriction
		: field === 'EQUIVALENCE'
			? template.equivalence
			: template.techniqueNotes;

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
	const [editingAlternative, setEditingAlternative] = useState<{
		id: string;
		details: AlternativeIngredientDetails;
	} | null>(null);
	const [translatingReference, setTranslatingReference] = useState<ReferenceTranslationTarget | null>(null);
	const [translatingAlternative, setTranslatingAlternative] = useState<{ id: string; englishName: string } | null>(
		null,
	);
	const [translating, setTranslating] = useState<TranslationTarget | null>(null);
	const [translatingTemplateField, setTranslatingTemplateField] = useState<TemplateTranslationTarget | null>(null);
	const [expandedRuleIds, setExpandedRuleIds] = useState<Set<string>>(new Set());
	const [templatesByRule, setTemplatesByRule] = useState<Record<string, SuggestionTemplate[] | 'loading' | 'error'>>(
		{},
	);
	const [templateDrafts, setTemplateDrafts] = useState<Record<string, string>>({});
	const [alternativeOptions, setAlternativeOptions] = useState<ReferenceOption[] | null>(null);
	const [addNoticeRuleId, setAddNoticeRuleId] = useState<string | null>(null);

	const reload = useCallback(() => {
		fetchRules()
			.then((loaded) => {
				setRules(loaded);
				setDrafts({});
				setTemplateDrafts({});
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

	const toggleSuggestions = (ruleId: string) => {
		const willExpand = !expandedRuleIds.has(ruleId);
		setAddNoticeRuleId(null);
		setExpandedRuleIds((current) => {
			const next = new Set(current);
			if (willExpand) {
				next.add(ruleId);
			} else {
				next.delete(ruleId);
			}
			return next;
		});
		if (willExpand && templatesByRule[ruleId] === undefined) {
			setTemplatesByRule((current) => ({ ...current, [ruleId]: 'loading' }));
			fetchSuggestionTemplates(ruleId)
				.then((loaded) => setTemplatesByRule((current) => ({ ...current, [ruleId]: loaded })))
				.catch(() => setTemplatesByRule((current) => ({ ...current, [ruleId]: 'error' })));
		}
		if (willExpand && alternativeOptions === null) {
			fetchAlternativeIngredientOptions()
				.then(setAlternativeOptions)
				.catch(() => undefined);
		}
	};

	const commitAddTemplate = async (ruleId: string, alternativeIngredientId: string) => {
		setAddNoticeRuleId(null);
		try {
			const added = await addSuggestionTemplate(ruleId, alternativeIngredientId);
			setConflict(false);
			if (!added.created) {
				setAddNoticeRuleId(ruleId);
			}
			reload();
			reloadTemplates(ruleId);
		} catch (error) {
			if (error instanceof ApiError && error.status === 409) {
				setConflict(true);
				reload();
				reloadTemplates(ruleId);
			} else {
				setFailed(true);
			}
		}
	};

	const commitCreateAlternative = async (ruleId: string, name: string) => {
		setAddNoticeRuleId(null);
		try {
			const created = await createAlternativeIngredient(name);
			setAlternativeOptions(await fetchAlternativeIngredientOptions());
			await commitAddTemplate(ruleId, created.id);
		} catch (error) {
			if (error instanceof ApiError && error.status === 409) {
				const refreshed = await fetchAlternativeIngredientOptions();
				setAlternativeOptions(refreshed);
				const match = refreshed.find((option) => option.name.toLowerCase() === name.toLowerCase());
				if (match) {
					await commitAddTemplate(ruleId, match.id);
				}
			} else {
				setFailed(true);
			}
		}
	};

	const commitDiscardTemplate = async (ruleId: string, template: SuggestionTemplate) => {
		try {
			await discardSuggestionTemplate(template.id, template.version);
			setConflict(false);
			reload();
			reloadTemplates(ruleId);
		} catch (error) {
			if (error instanceof ApiError && error.status === 409) {
				setConflict(true);
				reload();
				reloadTemplates(ruleId);
			} else {
				setFailed(true);
			}
		}
	};

	const reloadTemplates = (ruleId: string) => {
		fetchSuggestionTemplates(ruleId)
			.then((loaded) => setTemplatesByRule((current) => ({ ...current, [ruleId]: loaded })))
			.catch(() => setTemplatesByRule((current) => ({ ...current, [ruleId]: 'error' })));
	};

	const onTemplateDraftChange = (templateId: string, field: TemplateField, value: string) => {
		setTemplateDrafts((current) => ({ ...current, [`${templateId}:${field}`]: value }));
	};

	const commitTemplateField = async (ruleId: string, template: SuggestionTemplate, field: TemplateField) => {
		const draft = templateDrafts[`${template.id}:${field}`];
		if (draft === undefined || draft === (templateFieldValue(template, field) ?? '')) {
			return;
		}
		const value = draft === '' ? null : draft;
		try {
			const version = await stageSuggestionTemplateField(template.id, field, value, template.version);
			setConflict(false);
			setTemplatesByRule((current) => {
				const templates = current[ruleId];
				if (!Array.isArray(templates)) {
					return current;
				}
				return {
					...current,
					[ruleId]: templates.map((candidate) =>
						candidate.id === template.id
							? {
									...candidate,
									restriction: field === 'RESTRICTION' ? value : candidate.restriction,
									equivalence: field === 'EQUIVALENCE' ? value : candidate.equivalence,
									techniqueNotes: field === 'TECHNIQUE_NOTES' ? value : candidate.techniqueNotes,
									version,
									changedFields:
										!candidate.published || candidate.changedFields.includes(field)
											? candidate.changedFields
											: [...candidate.changedFields, field],
								}
							: candidate,
					),
				};
			});
			setRules(
				(current) =>
					current?.map((r) =>
						r.id === ruleId && !r.changedFields.includes('SUGGESTION_TEMPLATES')
							? { ...r, changedFields: [...r.changedFields, 'SUGGESTION_TEMPLATES'] }
							: r,
					) ?? null,
			);
		} catch (error) {
			if (error instanceof ApiError && error.status === 409) {
				setConflict(true);
				reload();
				reloadTemplates(ruleId);
			} else {
				setFailed(true);
			}
		}
	};

	const commitRevertTemplateField = async (ruleId: string, template: SuggestionTemplate, field: TemplateField) => {
		try {
			await revertSuggestionTemplateField(template.id, field, template.version);
			setConflict(false);
			reload();
			reloadTemplates(ruleId);
		} catch (error) {
			if (error instanceof ApiError && error.status === 409) {
				setConflict(true);
				reload();
				reloadTemplates(ruleId);
			} else {
				setFailed(true);
			}
		}
	};

	const commitSetActiveTemplate = async (ruleId: string, template: SuggestionTemplate) => {
		try {
			await setActiveSuggestionTemplate(template.id, !template.active, template.version);
			setConflict(false);
			reload();
			reloadTemplates(ruleId);
		} catch (error) {
			if (error instanceof ApiError && error.status === 409) {
				setConflict(true);
				reload();
				reloadTemplates(ruleId);
			} else {
				setFailed(true);
			}
		}
	};

	const commitStageTemplateTranslation = async (
		target: TemplateTranslationTarget,
		lang: Language,
		value: string | null,
		baseVersion: number,
	) => {
		try {
			await stageTemplateFieldTranslation(target.templateId, target.field, lang, value, baseVersion);
			setConflict(false);
			reload();
			reloadTemplates(target.ruleId);
		} catch (error) {
			if (error instanceof ApiError && error.status === 409) {
				setConflict(true);
				reload();
				reloadTemplates(target.ruleId);
			} else {
				setFailed(true);
			}
		}
	};

	const commitRevertTemplateTranslation = async (
		target: TemplateTranslationTarget,
		lang: Language,
		baseVersion: number,
	) => {
		try {
			await revertTemplateFieldTranslation(target.templateId, target.field, lang, baseVersion);
			setConflict(false);
			reload();
			reloadTemplates(target.ruleId);
		} catch (error) {
			if (error instanceof ApiError && error.status === 409) {
				setConflict(true);
				reload();
				reloadTemplates(target.ruleId);
			} else {
				setFailed(true);
			}
		}
	};

	const renderTemplateField = (ruleId: string, template: SuggestionTemplate, field: TemplateField, label: string) => {
		const changed = template.changedFields.includes(field);
		return (
			<div className="flex flex-col gap-1">
				<div className="flex items-center gap-2">
					<span className="w-28 shrink-0 opacity-70">{label}</span>
					<input
						type="text"
						className={`input input-xs input-bordered min-w-0 flex-1 ${changed ? 'border-warning bg-warning/10' : ''}`}
						value={templateDrafts[`${template.id}:${field}`] ?? templateFieldValue(template, field) ?? ''}
						aria-label={`${label} ${template.alternativeIngredientName}`}
						onChange={(event) => onTemplateDraftChange(template.id, field, event.target.value)}
						onBlur={() => commitTemplateField(ruleId, template, field)}
					/>
					{changed ? (
						<button
							type="button"
							className="btn btn-ghost btn-xs"
							onClick={() => commitRevertTemplateField(ruleId, template, field)}
						>
							{t('rules.revert')}
						</button>
					) : null}
				</div>
				<button
					type="button"
					className="flex cursor-pointer items-center gap-1 self-start pl-28"
					aria-label={`${t('rules.editTemplateTranslations')} ${label} ${template.alternativeIngredientName}`}
					onClick={() =>
						setTranslatingTemplateField({
							ruleId,
							templateId: template.id,
							field,
							title: `${label} — ${template.alternativeIngredientName}`,
							englishValue: templateFieldValue(template, field),
						})
					}
				>
					{translationChips(template.translations[field])}
				</button>
			</div>
		);
	};

	const renderTemplatesPanel = (ruleId: string) => {
		const state = templatesByRule[ruleId];
		if (state === undefined || state === 'loading') {
			return <span className="loading loading-spinner loading-sm" aria-label={t('rules.templatesLoading')} />;
		}
		if (state === 'error') {
			return (
				<div className="alert alert-error">
					<span>{t('rules.templatesLoadError')}</span>
				</div>
			);
		}
		return (
			<div className="flex flex-col gap-2">
				<h2 className="text-sm font-semibold">{t('rules.templatesHeader')}</h2>
				{state.length === 0 ? <p className="text-sm opacity-70">{t('rules.noTemplates')}</p> : null}
				<div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
					{state.map((template) => (
						<div
							key={template.id}
							className={`rounded border p-2 ${template.active ? 'border-base-300 bg-base-100' : 'border-error bg-error/10'}`}
						>
							<div className="flex items-center justify-between gap-2">
								<div className="flex min-w-0 flex-col gap-1">
									<button
										type="button"
										className="link link-hover text-left font-medium"
										aria-label={`${t('rules.editAlternativeIngredient')} ${template.alternativeIngredientName}`}
										onClick={() => openEditAlternative(template.alternativeIngredientId)}
									>
										{template.alternativeIngredientName}
									</button>
									<button
										type="button"
										className="flex cursor-pointer items-center gap-1 self-start"
										aria-label={`${t('rules.editAlternativeTranslations')} ${template.alternativeIngredientName}`}
										onClick={() =>
											setTranslatingAlternative({
												id: template.alternativeIngredientId,
												englishName: template.alternativeIngredientName,
											})
										}
									>
										{translationChips(template.alternativeIngredientTranslations)}
									</button>
								</div>
								<div className="flex items-center gap-2">
									{!template.active ? (
										<span className="badge badge-error badge-sm">
											{t('rules.templateDeactivated')}
										</span>
									) : null}
									{template.published ? (
										<button
											type="button"
											className={`btn btn-ghost btn-xs ${template.activeChanged ? 'text-warning' : ''}`}
											aria-label={`${template.active ? t('rules.deactivate') : t('rules.activate')} ${template.alternativeIngredientName}`}
											onClick={() => commitSetActiveTemplate(ruleId, template)}
										>
											{template.active ? t('rules.deactivate') : t('rules.activate')}
										</button>
									) : (
										<button
											type="button"
											className="btn btn-ghost btn-xs"
											aria-label={`${t('rules.discardTemplate')} ${template.alternativeIngredientName}`}
											onClick={() => commitDiscardTemplate(ruleId, template)}
										>
											{t('rules.discard')}
										</button>
									)}
								</div>
							</div>
							<div className="mt-1 flex flex-col gap-1 text-sm">
								{renderTemplateField(ruleId, template, 'RESTRICTION', t('rules.templateRestriction'))}
								{renderTemplateField(ruleId, template, 'EQUIVALENCE', t('rules.templateEquivalence'))}
								{renderTemplateField(
									ruleId,
									template,
									'TECHNIQUE_NOTES',
									t('rules.templateTechniqueNotes'),
								)}
							</div>
						</div>
					))}
				</div>
				<div className="flex flex-wrap items-center gap-2">
					<span className="text-sm opacity-70">{t('rules.addTemplate')}</span>
					<div className="w-64">
						<Combobox
							options={alternativeOptions ?? []}
							value={null}
							onChange={(altId) => {
								if (altId !== null) {
									commitAddTemplate(ruleId, altId);
								}
							}}
							label={t('rules.addTemplateLabel')}
							placeholder={t('rules.selectAlternative')}
							onCreate={(name) => commitCreateAlternative(ruleId, name)}
							createLabel={(name) => t('rules.addOption', { name })}
						/>
					</div>
				</div>
				{addNoticeRuleId === ruleId ? (
					<p className="text-info text-sm">{t('rules.templateAlreadyExists')}</p>
				) : null}
			</div>
		);
	};

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
		await runAndReload(() => stage(target.id, lang, name, explanationForLlm, baseVersion));
	};

	const commitRevertReferenceTranslation = async (target: EditTarget, lang: Language, baseVersion: number) => {
		const revert =
			target.kind === 'trigger' ? revertTriggerIngredientTranslation : revertRoleOrTechniqueTranslation;
		await runAndReload(() => revert(target.id, lang, baseVersion));
	};

	const openEditAlternative = async (id: string) => {
		try {
			const details = await fetchAlternativeIngredient(id);
			setEditingAlternative({ id, details });
		} catch {
			setFailed(true);
		}
	};

	// A shared AlternativeIngredient appears on template cards across Rules and lights every referencing Rule's
	// Suggestions flag, so refresh the grid, the add-combobox options, and every open panel.
	const reloadAfterAlternativeChange = () => {
		reload();
		fetchAlternativeIngredientOptions()
			.then(setAlternativeOptions)
			.catch(() => undefined);
		expandedRuleIds.forEach((id) => reloadTemplates(id));
	};

	const commitAlternativeChange = async (action: () => Promise<unknown>) => {
		try {
			await action();
			setConflict(false);
			reloadAfterAlternativeChange();
		} catch (error) {
			if (error instanceof ApiError && error.status === 409) {
				setConflict(true);
				reloadAfterAlternativeChange();
			} else {
				setFailed(true);
			}
		}
	};

	const commitEditAlternative = async (
		id: string,
		name: string,
		explanationForLlm: string | null,
		baseVersion: number,
	) => {
		setEditingAlternative(null);
		await commitAlternativeChange(() => editAlternativeIngredient(id, name, explanationForLlm, baseVersion));
	};

	const commitRevertAlternative = async (id: string, baseVersion: number) => {
		setEditingAlternative(null);
		await commitAlternativeChange(() => revertAlternativeIngredient(id, baseVersion));
	};

	const commitStageAlternativeTranslation = async (
		id: string,
		lang: Language,
		name: string | null,
		explanationForLlm: string | null,
		baseVersion: number,
	) => {
		await commitAlternativeChange(() =>
			stageAlternativeIngredientTranslation(id, lang, name, explanationForLlm, baseVersion),
		);
	};

	const commitRevertAlternativeTranslation = async (id: string, lang: Language, baseVersion: number) => {
		await commitAlternativeChange(() => revertAlternativeIngredientTranslation(id, lang, baseVersion));
	};

	const commitStageTranslation = async (
		ruleId: string,
		lang: Language,
		rationale: string | null,
		baseVersion: number,
	) => {
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

	let alternativeEditDialog = null;
	if (editingAlternative !== null) {
		const target = editingAlternative;
		alternativeEditDialog = (
			<ReferenceEditDialog
				referenceId={target.id}
				title={t('rules.editAlternativeIngredient')}
				affectedCount={target.details.referenceCount}
				takenNames={(alternativeOptions ?? [])
					.filter((option) => option.id !== target.id)
					.map((option) => option.name.toLowerCase())}
				loadDetails={() => Promise.resolve(target.details)}
				onSubmit={(name, explanationForLlm, baseVersion) =>
					commitEditAlternative(target.id, name, explanationForLlm, baseVersion)
				}
				onRevert={(baseVersion) => commitRevertAlternative(target.id, baseVersion)}
				onCancel={() => setEditingAlternative(null)}
			/>
		);
	}

	let alternativeTranslationsDialog = null;
	if (translatingAlternative !== null) {
		const target = translatingAlternative;
		alternativeTranslationsDialog = (
			<ReferenceTranslationsDialog
				referenceId={target.id}
				title={t('rules.editAlternativeTranslations')}
				englishName={target.englishName}
				loadTranslations={fetchAlternativeIngredientTranslations}
				onStage={(lang, name, explanationForLlm, baseVersion) =>
					commitStageAlternativeTranslation(target.id, lang, name, explanationForLlm, baseVersion)
				}
				onRevert={(lang, baseVersion) => commitRevertAlternativeTranslation(target.id, lang, baseVersion)}
				onCancel={() => setTranslatingAlternative(null)}
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

	let templateTranslationsDialog = null;
	if (translatingTemplateField !== null) {
		const target = translatingTemplateField;
		templateTranslationsDialog = (
			<TemplateFieldTranslationsDialog
				templateId={target.templateId}
				field={target.field}
				title={target.title}
				englishValue={target.englishValue}
				loadTranslations={fetchTemplateFieldTranslations}
				onStage={(lang, value, baseVersion) => commitStageTemplateTranslation(target, lang, value, baseVersion)}
				onRevert={(lang, baseVersion) => commitRevertTemplateTranslation(target, lang, baseVersion)}
				onCancel={() => setTranslatingTemplateField(null)}
			/>
		);
	}

	return (
		<div className="flex h-full flex-col">
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
			<div className="min-h-0 flex-1 overflow-auto">
				<table className="table-pin-rows table min-w-[915px]">
					<thead>
						<tr>
							<th className="w-8 px-0 py-4">
								<span className="sr-only">{t('rules.columnSuggestions')}</span>
							</th>
							<th className="px-1 py-4">{t('rules.columnRecommendation')}</th>
							<th className="px-1 py-4">{t('rules.columnTriggerIngredient')}</th>
							<th className="px-1 py-4">{t('rules.columnRoleOrTechnique')}</th>
							<th className="px-1 py-4">{t('rules.columnRationale')}</th>
							<th className="px-1 py-4">{t('rules.columnActions')}</th>
						</tr>
					</thead>
					<tbody>
						{rules.map((rule) => {
							const isNew = rule.changeState === 'NEW';
							const pending = rule.changeState !== 'UNCHANGED';
							const rationaleChanged = rule.changedFields.includes('RATIONALE');
							const triggerChanged = rule.changedFields.includes('TRIGGER_INGREDIENT');
							const roleChanged = rule.changedFields.includes('ROLE_OR_TECHNIQUE');
							const suggestionsChanged = rule.changedFields.includes('SUGGESTION_TEMPLATES');
							const roleId = rule.roleOrTechniqueId;
							const rowClass = isNew ? 'bg-success/10' : rule.active ? '' : 'bg-error/10';
							const isExpanded = expandedRuleIds.has(rule.id);
							return [
								<tr key={rule.id} className={rowClass}>
									<td className={suggestionsChanged ? 'bg-warning/10 px-1 py-1' : 'px-1 py-1'}>
										<button
											type="button"
											className="btn btn-ghost btn-xs"
											aria-label={t('rules.toggleSuggestions')}
											aria-expanded={isExpanded}
											onClick={() => toggleSuggestions(rule.id)}
										>
											<span aria-hidden="true">{isExpanded ? '▾' : '▸'}</span>
										</button>
									</td>
									<td className="px-1 py-1">{rule.recommendation}</td>
									<td className={triggerChanged ? 'bg-warning/10 px-1 py-1' : 'px-1 py-1'}>
										<div className="flex items-center gap-2">
											<button
												type="button"
												className="link link-hover"
												aria-label={t('rules.editTriggerIngredient')}
												onClick={() =>
													setEditing({ kind: 'trigger', id: rule.triggerIngredientId })
												}
											>
												{rule.triggerIngredient}
											</button>
											<button
												type="button"
												className="flex cursor-pointer gap-1"
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
										</div>
									</td>
									<td className={roleChanged ? 'bg-warning/10 px-1 py-1' : 'px-1 py-1'}>
										{roleId === null ? (
											EMPTY
										) : (
											<div className="flex items-center gap-2">
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
													className="flex cursor-pointer gap-1"
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
									<td className="px-1 py-1">
										<div className="flex items-center gap-2">
											<input
												type="text"
												className={`input input-sm input-bordered min-w-0 flex-1 ${rationaleChanged ? 'border-warning bg-warning/10' : ''}`}
												value={drafts[rule.id] ?? rule.rationale ?? ''}
												aria-label={t('rules.rationaleEditLabel')}
												onChange={(event) => onDraftChange(rule.id, event.target.value)}
												onBlur={() => commitRationale(rule)}
											/>
											<button
												type="button"
												className="flex cursor-pointer gap-1"
												aria-label={t('rules.editTranslations')}
												onClick={() =>
													setTranslating({
														ruleId: rule.id,
														englishRationale: rule.rationale,
													})
												}
											>
												{translationChips(rule.rationaleTranslations)}
											</button>
										</div>
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
								</tr>,
								isExpanded ? (
									<tr key={`${rule.id}-templates`}>
										<td colSpan={6} className="px-0">
											<div className="bg-base-200/60 p-3">{renderTemplatesPanel(rule.id)}</div>
										</td>
									</tr>
								) : null,
							];
						})}
					</tbody>
				</table>
			</div>
			{editDialog}
			{referenceTranslationsDialog}
			{alternativeEditDialog}
			{alternativeTranslationsDialog}
			{translationsDialog}
			{templateTranslationsDialog}
		</div>
	);
}
