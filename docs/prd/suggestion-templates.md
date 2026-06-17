# PRD — Backoffice Suggestion Templates Editing

> Scope: the **second iteration** of the DietWise backoffice's master-data editor — the "next iteration" the [Rules-screen PRD](./rules-screen.md) explicitly deferred ("editing Suggestion Templates and Alternative Ingredients … the row action is a stub").
> Vocabulary follows the Backoffice section of [`CONTEXT.md`](../../../dietwise/CONTEXT.md).
> Architecture decisions live in `dietwise-backoffice/docs/ADR/` — [0001](../ADR/0001-staged-working-copy-for-master-data-edits.md) (staged Working Copy), [0002](../ADR/0002-working-copy-as-sparse-mirror-tables.md) (sparse mirror tables), [0003](../ADR/0003-concurrency-advisory-presence-not-locks.md) (concurrency). This iteration introduces **no new ADR**: every decision below fits inside those three. In particular, modelling removal as **Deactivate** rather than a hard delete is the documented consequence of ADR 0002 ("Deletions/deactivations need explicit representation in the sparse model, since 'absence of a mirror row' already means 'unchanged'").

## Problem Statement

The first iteration of the Rules screen let non-technical editors curate a Rule's identity and prose — its Recommendation/Trigger/Role business key, its Rationale, the shared Trigger Ingredient and Role or Technique, and the translations of all of these. But it deliberately stopped short of the thing a Rule actually *produces*: its **Suggestion Templates** — the "replace X with Y" definitions, each pairing the Rule with one **AlternativeIngredient** and carrying the `restriction`, `equivalence`, and `technique_notes` that tell a cook how to make the swap, plus the EL/LT/NL localizations of those notes.

Today an editor still cannot:

- read which alternatives a Rule suggests, or the swap notes attached to each;
- correct a restriction, equivalence, or technique note, or its translations;
- add a new alternative to a Rule (or create a brand-new AlternativeIngredient when none fits);
- retire an alternative from a Rule without a developer deleting rows;
- correct an AlternativeIngredient's name, LLM explanation, or translations.

All of this still requires a developer editing the database or writing a migration — the exact gap the backoffice exists to close, now reaching the substitution payload itself.

## Solution

Each Rule row in the grid gains an **inline-expandable Suggestion Templates panel**. Expanding a Rule reveals its templates — a dynamic list (typically ~3, never assumed) — one card per alternative. In each card the editor edits the English `restriction`/`equivalence`/`technique_notes` in place, sees per-field EL/LT/NL translation status, and opens a dialog to edit those translations field-by-field, language-by-language. An "add template" control picks an existing AlternativeIngredient or creates a new one; a per-template control **deactivates** a published template (removing it from assessment while keeping it visible) or **discards** a brand-new one.

The **AlternativeIngredient** is promoted to a fully editable shared reference entity, on a par with Trigger Ingredient and Role or Technique: an editor can create one, edit its name and LLM explanation, and maintain its EL/LT/NL translations, with the usual blast-radius warning that it is shared across every template that references it.

Every edit lands in the single shared **Working Copy**, never in live master data; nothing reaches recipe assessment until **Publish** (still out of scope). Changed values highlight, staged changes are revertable, and a stale save is rejected rather than silently overwriting a colleague — exactly as in the first iteration.

## User Stories

1. As a content editor, I want to expand a Rule row to see its Suggestion Templates inline, so that I can review what a Rule suggests without leaving the grid.
2. As a content editor, I want each template to show its AlternativeIngredient and its restriction, equivalence, and technique notes, so that I can read the whole swap at a glance.
3. As a content editor, I want the template list to handle any number of templates per Rule (not assume three), so that Rules with one or many alternatives both display correctly.
4. As a content editor, I want to edit a template's restriction in place, so that I can correct swap constraints quickly.
5. As a content editor, I want to edit a template's equivalence in place, so that I can fix quantity/ratio guidance.
6. As a content editor, I want to edit a template's technique notes in place, so that I can refine how-to guidance.
7. As a content editor, I want to leave any of restriction, equivalence, or technique notes empty, so that I'm not forced to invent text where none belongs.
8. As a content editor, I want a changed template field highlighted in amber, so that I can see exactly what I've altered versus live data.
9. As a content editor, I want to revert a single staged template field to its published value, so that I can undo one change without losing my others.
10. As a content editor, I want to see, per field, which languages are translated (e.g. restriction: "EL ✓ · LT ✓ · NL —"), so that I know precisely what localization work remains.
11. As a content editor, I want to edit the EL/LT/NL translation of a specific template field from a dialog, so that localized assessments read correctly.
12. As a content editor, I want to revert a single staged template translation, so that I can undo a localization mistake in isolation.
13. As a content editor, I want to add a template to a Rule by choosing an existing AlternativeIngredient from a combobox that filters as I type, so that I can extend a Rule's suggestions quickly.
14. As a content editor, I want to add a template by creating a brand-new AlternativeIngredient when none matches, so that I can suggest something we haven't covered yet.
15. As a content editor, I want to be offered the existing template instead of being allowed to add the same AlternativeIngredient twice to one Rule, so that a Rule never suggests the same alternative redundantly.
16. As a content editor, when the matching template exists but is deactivated, I want the control to offer to **reactivate** it rather than create a duplicate, so that re-adding an alternative is unambiguous.
17. As a content editor, I want to deactivate a template, so that assessment stops suggesting that alternative without me losing the template or its notes.
18. As a content editor, I want a deactivated template to remain visible in the panel (clearly marked), so that I can find and reactivate it.
19. As a content editor, I want to reactivate a previously deactivated template, so that I can bring an alternative back into use.
20. As a content editor, I want to discard a template I just added but never published, so that I can abandon a mistake cleanly.
21. As a content editor, I want a collapsed Rule row to flag that its suggestions have staged changes, so that I know which Rules to expand before a publish.
22. As a content editor, I want to edit an AlternativeIngredient's name and LLM explanation, so that I can correct shared master data.
23. As a content editor, I want to edit an AlternativeIngredient's EL/LT/NL translations, so that its localized name and explanation are correct.
24. As a content editor, I want to be warned that editing an AlternativeIngredient affects every template that references it, so that I'm not surprised when other Rules' suggestions change.
25. As a content editor, I want to revert a staged AlternativeIngredient field or translation, so that I can undo a shared-data change.
26. As a content editor, I want to be offered an existing AlternativeIngredient instead of creating a duplicate name, so that we don't end up with two "Olive oil" entries.
27. As a content editor, I want a newly created AlternativeIngredient to be immediately valid and publishable with just its (unique) English name, so that I can author a suggestion before its explanation and translations are filled in.
28. As a content editor, I want the Recommendation/Trigger/Role of an existing Rule and the AlternativeIngredient of an existing template to stay locked, so that I can't accidentally change a suggestion's identity (changing the alternative = deactivate the old template + add a new one).
29. As a content editor, I want all my template and AlternativeIngredient edits saved into the shared Working Copy as I go, so that I don't lose work and colleagues can see it.
30. As a content editor, I want to be told "someone changed this since you loaded it — reload" instead of silently overwriting them, so that no one's work is lost.
31. As an administrator, I want only users with the `backoffice` realm role to reach these panels and endpoints, so that the substitution payload can't be edited by ordinary app users.
32. As a recipe-assessment consumer, I want deactivated templates and unpublished template/AlternativeIngredient edits to be invisible to assessment, so that only curated, published content affects results.
33. As a recipe-assessment consumer, I want a Rule whose every template is deactivated to simply produce no suggestions (rather than error), so that retiring all of a Rule's alternatives is safe.

## Implementation Decisions

### Scope of this iteration
- **Editable:** a Rule's **SuggestionTemplates** (English `restriction`/`equivalence`/`technique_notes`, their translations, activation, and — for new templates — the chosen AlternativeIngredient); and the **AlternativeIngredient** as a full shared reference entity (English `name` + `explanation_for_llm`, translations, create).
- **Removal = Deactivate**, not hard delete. A published template is deactivated/reactivated (staged); a brand-new (Working-Copy-only) template is discarded.
- **Deferred / not built now:** reordering templates (`alternative_order` is auto-assigned, not editable); re-pointing an existing template at a different AlternativeIngredient; the AlternativeIngredient's `componentsForScoring`, `seasonality`, and `cost`; Publish.

### Assessment read-path change (accepted, reaches past the backoffice)
- Add `active boolean NOT NULL DEFAULT true` to master `DW_SUGGESTION_TEMPLATE` **and** its mirror twin. The assessment query that loads a Rule's templates (`SuggestionDao.findSuggestionTemplatesByRule`) is changed to `AND active = true`, exactly mirroring the Issue-4 `active` filter on Rules. Deactivated templates become invisible to assessment; the backoffice panel stays unfiltered and shows them marked. Existing data is fully active, so adding the master column and filter is safe today.

### Template identity and the add flow
- A template's business key within a Rule is **(rule, alternative_ingredient)**, unique **regardless of `active`** — a Rule can never hold two templates (one active, one inactive) for the same alternative. Enforced at three layers like the Rule triplet (Issue 6): application validation at add time against master ∪ Working Copy; a unique constraint on the mirror; a unique constraint on master `DW_SUGGESTION_TEMPLATE` added as the publish-time backstop **after** verifying the existing rows hold no duplicate (rule, alternative) pairs.
- Picking an AlternativeIngredient that already has a template on the Rule never creates a second; the control surfaces the existing one, offering **Reactivate** if it is deactivated.
- An existing template's AlternativeIngredient is **immutable**; changing the suggested alternative is "deactivate old + add new".
- A new template gets a generated id, `active = true`, null English fields, and `alternative_order = max(order over the Rule's master ∪ Working-Copy templates) + 1`. The currently-unmapped `alternative_order` column is mapped now and used to order the panel deterministically. Assessment ordering is left untouched (out of scope).

### AlternativeIngredient as a shared reference entity
- Mirrors the Trigger Ingredient / Role or Technique treatment (Issues 6, 8, 9): `name` is a unique English natural key; create offers "add new" only for a genuinely new name and dedups case-insensitively against master ∪ Working Copy; edit covers `name` + `explanation_for_llm`; translations cover EL/LT/NL `name` + `explanation_for_llm`. Editing one changes it for **every** template that references it (blast-radius warning, counting referencing templates across all Rules). A new AlternativeIngredient is valid/publishable with just its name; explanation and translations are soft.

### Staging model (ADR 0001, 0002, 0003)
- New sparse mirror tables, all merged into the epic changelog `20260616_backoffice.xml` and registered in the test `persistence.xml`: `DW_SUGGESTION_TEMPLATE_WC` (full twin + `active` + `version`), `DW_SUGGESTION_TEMPLATE_TRANSLATION_WC`, `DW_ALTERNATIVE_INGREDIENT_WC` (+ `version`), `DW_ALTERNATIVE_INGREDIENT_TRANSLATION_WC`. Same invariant as prior issues: a mirror row exists ⟺ it differs from master (seed-on-first-touch, collapse-when-equal); manual `version` column for the optimistic check; no `@Version`.
- A template field edit, translation edit, activation, add, and discard are all staged changes obeying the version-checked save/revert mechanics already built for Rules.

### Change-state surfacing (flag-only, like shared entities)
- Template and AlternativeIngredient changes are **flag-only**: they light the collapsed Rule's "Suggestions" expander (amber) but do **not** mark the Rule row pending or CHANGED — consistent with how shared Trigger/Role edits behave (Issue 8). This is carried as a new `SUGGESTION_TEMPLATES` member of the Rule's `changedFields` set, set true when the Rule has any staged template change (a Working-Copy template row, a Working-Copy template translation row, or a template-active divergence) or references a changed AlternativeIngredient.
- The grid read computes only this lightweight per-Rule flag (an additional `forcm` input to the existing `listRules` merge). The full template list — with per-template per-field translation states and effective values — is loaded **lazily on expand** via a per-Rule endpoint, not eagerly for every grid row.

### Translation completeness model
- Per **field**, per **language**: each of `restriction`/`equivalence`/`technique_notes` carries its own EL/LT/NL present/staged/missing chip-set. `present(lang)` = a master `DW_SUGGESTION_TEMPLATE_TRANSLATION` row exists for that language; `staged(lang)` = a Working-Copy translation row exists. Missing translations fall back to English at assessment time. The AlternativeIngredient reuses the Issue-9 name+explanation chip model.

### API contract (shape, not paths)
- **Grid read** gains a per-Rule `suggestionTemplates` change flag in the existing merged-read response (no template payload).
- **Expand read**: a per-Rule endpoint returns that Rule's effective templates (master overlaid by Working Copy, including new and deactivated), each with effective English fields, effective per-field translations, per-field/per-language translation state, `active`, change flags, and base versions.
- **Mutating endpoints** (each carrying a base version for the optimistic check): add a template (by AlternativeIngredient id), edit a template's English fields, set a template's `active`, discard a new template, stage/revert a template translation (per field/language).
- **AlternativeIngredient endpoints** mirror Trigger/Role: list options, create, get-for-edit, edit details, edit/revert translations, revert details.
- Stale base version → 409 (existing `StaleVersionExceptionMapper`); duplicate (rule, alternative) or duplicate AlternativeIngredient name → 409 (existing `DuplicateBusinessKeyExceptionMapper`).

### Modules and seams
- **Backend (`dietwise`) owns all staging logic and data**; the SPA talks only to new ADMIN-only REST endpoints. Work slots into the existing layering: `dietwise-architecture` (model/service-interface additions for templates + AlternativeIngredient editing; carriers per the project's three-homes rule); `dietwise-dao-hibernate-reactive` (mirror entities + DAOs, the `active`/`version` columns, the assessment filter, Liquibase change sets merged into the epic changelog); thin ADMIN-only JAX-RS resources. Authorization reuses the realm role `backoffice` → `Role.ADMIN`, gated programmatically (no `@RolesAllowed`).
- **SPA** reuses the existing building blocks: `Combobox` (with `onCreate`) for the AlternativeIngredient picker; `ReferenceEditDialog` + `ReferenceTranslationsDialog` for AlternativeIngredient details/translations; the per-language Save/Revert dialog shape from Issue 9 for template translations. The Rule grid gains the inline-expandable panel and the per-Rule expander flag.

## Testing Decisions

- **What a good test asserts:** externally observable behaviour — the templates a caller gets back for a Rule (merged master + Working Copy, including new/deactivated), whether a save/add is accepted or rejected (stale version, duplicate alternative, duplicate name), the per-field/per-language translation state derived from master + mirror, and what assessment sees before vs. after a template is deactivated — **not** the internal shape of mirror rows.
- **Seams (unchanged from the first iteration):** test at the **DAO** and **service** layers and in the **SPA**; **no** HTTP/RestAssured resource tests (resources are thin by design).
  - **DAO** — prior art: `TriggerIngredientDaoImplTest`, `RoleOrTechniqueDaoImplTest`, `RuleDaoImplTest`, all using `MockReactivePersistenceContextFactory`. Cover: the merged template read (master overlaid by Working Copy, new + deactivated included, ordered by `alternative_order`); seed-on-first-touch / collapse-when-equal for template fields and translations; the optimistic version check rejecting a stale save; per-field revert removing an override and collapsing the row when empty; the assessment query skipping `active = false` templates; AlternativeIngredient create/edit/translation/revert mirroring the Trigger/Role tests.
  - **Service** — prior art: `BackofficeRulesServiceImplTest` (Mockito + the mock persistence context). Cover: the `SUGGESTION_TEMPLATES` change-flag derivation; (rule, alternative) uniqueness including the reactivate-existing path; AlternativeIngredient name dedup excluding the entity's own id; admin gating and the EN-is-master rejection on translation edits; staging/revert orchestration with DAOs mocked.
  - **SPA** — prior art: `RulesPage.test`, `ReferenceEditDialog.test`, `ReferenceTranslationsDialog.test` (Vitest + React Testing Library). Cover: expand/collapse and the collapsed expander flag; inline English edit + amber + revert; per-field/per-language translation chips and the translations dialog; add-template (pick existing, create new, offer-existing/reactivate); deactivate/reactivate/discard; AlternativeIngredient edit/translation/blast-radius; 409 → stale-reload.
- Follow `AGENTS.md` conventions: name the system under test `sut`; `withTransaction`/`withoutTransaction` appropriately; turn reused literals into constants; never assert against mocked behaviour; test mock of `@/api/rules` must export every value the page imports.

## Out of Scope

- **Publish** — both the publish-mechanics decision (direct apply vs. generated Liquibase change sets; its own future ADR) and the implementation/audit/confirmation. As in the first iteration, this delivers a fully usable, demoable Working Copy with no go-live path; the only live-assessment change is the standalone `active`-filter on templates.
- **Reordering** templates; re-pointing an existing template at a different AlternativeIngredient.
- The AlternativeIngredient's **`componentsForScoring`, `seasonality`, and `cost`** (the latter two are per-country); the Rule `cuisine` field; managing Recommendations.
- Enforced edit locks, Server-Sent Events, WebSockets; selective/per-row publish; a global "discard the whole Working Copy".

## Further Notes

- Grounding from the seed data: ~87 AlternativeIngredients and 93 SuggestionTemplates across 31 Rules (≈3 templates/Rule, but the count is dynamic and must not be assumed). The `alternative_order` column exists in master but is currently unmapped in the entity and unused by the assessment query.
- The `DW_SUGGESTION_TEMPLATE` and `DW_ALTERNATIVE_INGREDIENT` translation tables already exist (composite `(parent_id, lang)` PK, EL/LT/NL only, English on the parent), so this iteration adds only their Working-Copy mirrors, not the master translation schema.
- Glossary already updated for this iteration in `CONTEXT.md`: `Deactivate/Activate` and `Discard` now cover `SuggestionTemplate` (Deactivate is the "remove a template" gesture); `Revert` and `SuggestionTemplate` already read correctly.
- This iteration introduces no new ADR; `Deactivate`-not-delete is the documented consequence of ADR 0002.
