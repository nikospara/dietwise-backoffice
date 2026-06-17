# Suggestion Templates Editing — Implementation Issues

Tracer-bullet vertical slices derived from [`suggestion-templates.md`](./suggestion-templates.md). Each issue cuts end-to-end (schema → DAO → service → ADMIN API → SPA → tests) and is independently verifiable. Vocabulary follows the Backoffice section of [`CONTEXT.md`](../../../dietwise/CONTEXT.md); slices respect [ADR 0001–0003](../ADR/). This is the **second iteration** of the Rules screen, so numbering continues the [Rules-screen issues](./rules-screen-ISSUES.md) (1–10, done).

All seven issues are **AFK** (implementable and mergeable without a human gate) — the decisions were settled during design.

**Deferred, out of this scope:** Publish (mechanics + implementation/audit/confirmation, its own future ADR); reordering templates; re-pointing a published template at a different AlternativeIngredient; the AlternativeIngredient's `componentsForScoring` / `seasonality` / `cost`; the Rule `cuisine` field. As in the first iteration, this delivers a fully usable, demoable Working Copy with **no go-live path**; the only live-assessment change is the standalone `active` filter on templates (Issue 14).

**Dependency order:** 11 → 12 → {13, 14} → 15 → 16 → 17.

This iteration introduces **no new ADR**: modelling template removal as **Deactivate** rather than a hard delete is the documented consequence of ADR 0002.

---

## Issue 11 — Read a Rule's Suggestion Templates in an inline-expandable panel

**Type:** AFK · **Stories:** 1, 2, 3, 31

### What to build
A read-only inline panel under each Rule row that shows that Rule's Suggestion Templates. A new ADMIN-only backend endpoint returns, for one Rule, its templates (each with its AlternativeIngredient's English name and the English `restriction`, `equivalence`, `technique_notes`), ordered by `alternative_order`. The SPA Rules grid gains a per-row expander that lazily fetches and renders the templates as cards when opened; collapsing hides them. No Working Copy and no editing yet — published master data only. Maps the currently-unmapped `alternative_order` column so the read can order deterministically.

### Acceptance criteria
- [ ] Expanding a Rule shows all its templates (dynamic count, not assumed to be three), each with its alternative ingredient name and the three English text fields; a Rule with no templates shows an empty panel, not an error.
- [ ] Templates render in `alternative_order` order.
- [ ] The endpoint and panel are reachable only by a user with the `backoffice` realm role.
- [ ] The endpoint returns published master data only; nothing is fetched until a row is expanded.
- [ ] Read path covered by DAO/service tests (mock persistence context) and SPA tests for expand/collapse, following existing prior art.

### Blocked by
- None — builds on the existing Rules grid (Issue 1, done).

---

## Issue 12 — Stage & revert a template's English fields

**Type:** AFK · **Stories:** 4, 5, 6, 7, 8, 9, 21, 29, 30

### What to build
Introduce the sparse mirror representation for SuggestionTemplate (`DW_SUGGESTION_TEMPLATE_WC`, full twin + `version`) and make the panel read live master overlaid by the Working Copy (mirror wins). An editor edits a template's `restriction`, `equivalence`, or `technique_notes` in place; each edit is a Staged Change in the Working Copy, never in master. Changed fields highlight amber; per-field **Revert** restores the live value and collapses the mirror row when no override remains. The collapsed Rule row lights its "Suggestions" expander (a new `SUGGESTION_TEMPLATES` member of the Rule's `changedFields`) when any of its templates has a staged change — flag-only, it does **not** mark the Rule row pending/CHANGED. The grid read computes only this lightweight per-Rule flag (an extra input to the existing `listRules` merge); the full template payload still loads lazily on expand. A save with a stale base version is rejected (reload).

### Acceptance criteria
- [ ] Editing a template field stores it in the Working Copy; live master and recipe assessment are unaffected.
- [ ] The panel overlays staged values on master; a changed field is amber; any of the three fields may be left empty.
- [ ] Per-field Revert restores the master value and, when the template has no remaining override, removes its mirror row (verified at the data layer).
- [ ] A collapsed Rule with staged template changes lights its Suggestions expander but does **not** gain a pending badge; a Rule with none does not light it.
- [ ] A save carrying a stale base version is rejected (reload); nothing is silently overwritten.
- [ ] Merged read, seed/collapse, stale-version rejection, and the flag derivation covered by DAO + service tests; amber/revert/flag covered by SPA tests.

### Blocked by
- Issue 11.

---

## Issue 13 — Template translations (per field, per language)

**Type:** AFK · **Stories:** 10, 11, 12

### What to build
Per-field, per-language editing of a template's EL/LT/NL translations of `restriction`, `equivalence`, and `technique_notes`, staged in `DW_SUGGESTION_TEMPLATE_TRANSLATION_WC`. Each of the three fields shows its own EL/LT/NL present/staged/missing chip-set in the panel (`present` = a master translation row exists for that language; `staged` = a Working-Copy translation row exists). A dialog edits a chosen field's translations language-by-language with per-language Save and per-language Revert; English is shown read-only as the source. Reuses the Issue-9 translations-dialog shape. A staged template translation contributes to the Rule's Suggestions expander flag.

### Acceptance criteria
- [ ] Each template shows three independent EL/LT/NL chip-sets (one per field) reflecting present/staged/missing.
- [ ] Editing a field's translation for a language stages it; saving an empty value clears it; missing translations fall back to English at assessment time.
- [ ] Per-language Revert restores the master translation (or removes the staged row); reverting the last staged field/language collapses the Working-Copy translation row.
- [ ] EN is rejected as a translation target (English is the master value).
- [ ] A staged translation lights the Rule's Suggestions expander flag.
- [ ] Chip derivation, stage/revert, and EN-rejection covered by DAO + service tests; chips and dialog covered by SPA tests.

### Blocked by
- Issue 12.

---

## Issue 14 — Deactivate / Activate a template + assessment filter

**Type:** AFK · **Stories:** 17, 18, 19, 32, 33

### What to build
Add `active boolean NOT NULL DEFAULT true` to master `DW_SUGGESTION_TEMPLATE` and its mirror twin, and filter the live assessment read path: the query loading a Rule's templates for assessment ANDs `active = true`, exactly mirroring the Issue-4 Rule filter. In the backoffice an editor **deactivates** a published template (staged like any other change) so assessment stops suggesting that alternative, and **reactivates** it later; the panel keeps deactivated templates visible, clearly marked. Deactivation contributes to the Rule's Suggestions expander flag. A Rule whose every template is deactivated yields no suggestions without error.

### Acceptance criteria
- [ ] A deactivated template is invisible to recipe assessment (assessment query skips `active = false`); the backoffice panel still shows it, marked as deactivated.
- [ ] Deactivate/Activate is staged in the Working Copy; live master is unchanged until publish; the toggle is version-checked (stale → reload).
- [ ] Reactivating restores the template to assessment (post-publish) and clears its deactivated marking in the panel.
- [ ] A Rule with all templates deactivated produces zero suggestions and no error (assessment-path test).
- [ ] Assessment-path filter, staged toggle, and collapse-when-equal covered by DAO + service tests; panel marking and toggle covered by SPA tests.

### Blocked by
- Issue 12.

---

## Issue 15 — Add a template using an existing AlternativeIngredient + discard a new template

**Type:** AFK · **Stories:** 13, 15, 16, 20, 28

### What to build
Let an editor add a template to a Rule by choosing an existing AlternativeIngredient from a filtering combobox (a read-only `listOptions` over master AlternativeIngredients). A new template is a Working-Copy-only row (generated id, `active = true`, null English fields, `alternative_order = max(order over the Rule's master ∪ Working-Copy templates) + 1`). The business key **(rule, alternative_ingredient)** is unique **regardless of `active`**, enforced against master ∪ Working Copy: picking an alternative the Rule already has does not create a second template — the control surfaces the existing one, offering **Reactivate** when it is deactivated. A brand-new (unpublished) template can be **discarded** (its Working-Copy row removed); an existing published template's AlternativeIngredient is immutable. Add a mirror unique constraint, and a master unique constraint on `(rule_id, alternative_ingredient_id)` after verifying the existing rows hold no duplicate pairs.

### Acceptance criteria
- [ ] Adding a template with a chosen existing AlternativeIngredient creates a Working-Copy-only template that appears in the panel (and lights the Suggestions flag); live assessment is unaffected.
- [ ] Picking an AlternativeIngredient the Rule already has (active or deactivated) does not create a duplicate; the control offers the existing template, and Reactivate when it is deactivated.
- [ ] A new (unpublished) template can be discarded, removing it from the panel; an attempt to discard a published template is refused at the data layer.
- [ ] `alternative_order` of a new template is `max + 1` over the Rule's master ∪ Working-Copy templates.
- [ ] The (rule, alternative) uniqueness holds at the application layer (master ∪ Working Copy) and as DB constraints on both mirror and master; the master constraint is added only after verifying existing data is duplicate-free.
- [ ] Add/dedup/discard and order assignment covered by DAO + service tests; the add control, offer-existing/Reactivate, and discard covered by SPA tests.

### Blocked by
- Issue 12 (Working-Copy substrate) and Issue 14 (the offer/Reactivate-a-deactivated-template path).

---

## Issue 16 — Create a new AlternativeIngredient inline from the add control

**Type:** AFK · **Stories:** 14, 26, 27

### What to build
Extend the add-template combobox to create a brand-new AlternativeIngredient when no existing name matches, mirroring the Trigger/Role add-new (Issues 6, 8). Introduce `DW_ALTERNATIVE_INGREDIENT_WC` (mirror + `version`); `listOptions` becomes master ∪ Working Copy (mirror wins by id); a create operation inserts a Working-Copy-only AlternativeIngredient with just its unique English `name`, case-insensitively deduped against master ∪ Working Copy. The newly created AlternativeIngredient is immediately selectable for the template being added and is valid/publishable with name alone (explanation and translations come in Issue 17).

### Acceptance criteria
- [ ] When the typed name matches no existing AlternativeIngredient, the combobox offers "add new"; choosing it creates a Working-Copy AlternativeIngredient and selects it for the new template.
- [ ] Creating a name that already exists (case-insensitive, master ∪ Working Copy) is refused with the existing one offered instead (no duplicate).
- [ ] A newly created AlternativeIngredient is valid with only its name; no explanation or translations are required.
- [ ] `listOptions` overlays Working-Copy AlternativeIngredients on master (mirror wins by id), sorted by name.
- [ ] Create, dedup, and the master ∪ Working-Copy overlay covered by DAO + service tests; the combobox "add new" flow covered by SPA tests.

### Blocked by
- Issue 15.

---

## Issue 17 — Edit an AlternativeIngredient's details + EL/LT/NL translations

**Type:** AFK · **Stories:** 22, 23, 24, 25

### What to build
Promote AlternativeIngredient to a fully editable shared reference entity, on a par with Trigger Ingredient and Role or Technique. From an "edit alternative ingredient" affordance on a template card, an editor edits the English `name` + `explanation_for_llm` (staged in the `DW_ALTERNATIVE_INGREDIENT_WC` mirror) and the EL/LT/NL `name` + `explanation_for_llm` translations (staged in `DW_ALTERNATIVE_INGREDIENT_TRANSLATION_WC`), with per-field Revert. Because the AlternativeIngredient is shared, the UI warns about the blast radius (the number of templates, across all Rules, that reference it) and a change lights the Suggestions flag on every referencing Rule. Reuses the `ReferenceEditDialog` (English) and `ReferenceTranslationsDialog` (EL/LT/NL) and the revert/blast-radius mechanics built for Trigger/Role.

### Acceptance criteria
- [ ] Editing an AlternativeIngredient's name and LLM explanation stages the change; the new name shows on every template that references it; the change is version-checked (stale → reload).
- [ ] Editing its EL/LT/NL translations (name + LLM explanation) stages per language, with present/staged/missing chips and per-language Revert; EN is rejected as a translation target.
- [ ] The edit dialog warns about the blast radius, counting the templates (across all Rules) that reference this AlternativeIngredient.
- [ ] Name edits are deduped (case-insensitive) against master ∪ Working Copy excluding the entity's own id; a collision is refused (409).
- [ ] Revert of a staged detail or translation restores the master value and collapses the mirror row when no override remains.
- [ ] Edit/translate/revert/dedup and blast-radius count covered by DAO + service tests; dialogs and blast-radius warning covered by SPA tests.

### Blocked by
- Issue 16.
