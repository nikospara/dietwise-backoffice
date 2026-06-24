# Recommendations Editing — Implementation Issues

Tracer-bullet vertical slices for the Backoffice **Recommendations** screen. Each issue cuts end-to-end (schema → DAO → service → ADMIN API → SPA → tests) and is independently verifiable. Vocabulary follows the Backoffice section of [`CONTEXT.md`](../../../dietwise/CONTEXT.md); slices respect [ADR 0001–0003](../ADR/). Numbering continues the [Suggestion-Templates issues](./suggestion-templates-ISSUES.md) (11–17); the [Rules-screen issues](./rules-screen-ISSUES.md) were 1–10.

A Recommendation (`DW_RECOMMENDATION`) is **never** created, deleted, deactivated, or renamed by an editor. The English `name` and `component_for_scoring` are immutable scoring keys; `weight` (`ENCOURAGED` / `LIMITED`) is informational only. What is editable: the English `explanation_for_llm`, and the EL/LT/NL translations of `name`, `component_for_scoring`, and `explanation_for_llm`.

All three issues are **AFK** (implementable and mergeable without a human gate) — the decisions were settled during design.

This iteration introduces **no new ADR**: it is a direct application of ADR 0001 (staged Working Copy) and ADR 0002 (sparse mirror), with the concurrency model of ADR 0003 (optimistic version check, stale → reload). The only narrowing is that, because the master is never created or renamed, the Recommendation's master mirror carries only the one editable field rather than a full twin.

**Deferred, out of this scope:** As with Rules and Suggestion Templates, this delivers a fully usable, demoable Working Copy with **no go-live path** — recipe assessment and the LLM read published master only, so staged edits do not change live behaviour. Making backoffice edits reach assessment is a separate cross-cutting concern across all backoffice entities (its own future ADR). Also out of scope: renaming `name` / `component_for_scoring`; editing `weight`; create / delete / deactivate of a Recommendation; the `RecommendationValue` (per age-group/gender values) and `AgeGroup`.

**Dependency order:** 18 → 19 → 20.

---

## Issue 18 — Read-only Recommendations grid with weight icon and translation chips

**Type:** AFK

### What to build
A new ADMIN-only backend endpoint returns all Recommendations, each with its English `name`, `component_for_scoring`, `weight`, and `explanation_for_llm`, plus the per-language present/missing state of its translatable fields, ordered by `name`. A new SPA **Recommendations** screen (nav entry and route, gated by the `backoffice` realm role) renders a grid whose leading, unlabelled column shows the `weight` as a **green thumbs-up for `ENCOURAGED`** and a **red thumbs-down for `LIMITED`** (with an accessible text label, not icon-only), followed by English name and component for scoring (read-only — they are immutable scoring keys), the English explanation (read-only at this stage), and per-language EL/LT/NL translation chips. Published master data only — no Working Copy and no editing yet.

### Acceptance criteria
- [ ] The grid lists every Recommendation ordered by name; each row leads with the weight icon (👍 green `ENCOURAGED` / 👎 red `LIMITED`, with an accessible label) in an unlabelled column, followed by English name, component for scoring, the English explanation, and EL/LT/NL chips reflecting present/missing.
- [ ] The screen exposes no affordance to create, delete, deactivate, or rename a Recommendation, nor to edit `weight`.
- [ ] The endpoint and screen are reachable only by a user with the `backoffice` realm role.
- [ ] The endpoint returns published master data only.
- [ ] Read path covered by DAO tests (Testcontainers + Liquibase) and service tests (mock persistence context), plus SPA tests, following existing prior art.

### Blocked by
- None — builds on the existing backoffice shell and grid infrastructure (Rules, Issue 1, done).

---

## Issue 19 — Stage & revert the English `explanation_for_llm`

**Type:** AFK

### What to build
Introduce the sparse mirror for the Recommendation's one editable master field: `DW_RECOMMENDATION_WC` holding `explanation_for_llm` + `version` (a partial twin — `name`, `component_for_scoring`, and `weight` are not editable and so are not mirrored). The grid reads live master overlaid by the Working Copy (mirror wins) for the explanation. An editor edits a Recommendation's English `explanation_for_llm` in place; each edit is a Staged Change in the Working Copy, never in master; the field highlights amber when changed and may be left empty. Per-row **Revert** restores the live (seeded) value and collapses the mirror row when no override remains. A save with a stale base version is rejected (reload).

### Acceptance criteria
- [ ] Editing the English explanation stores it in the Working Copy; live master and recipe assessment are unaffected.
- [ ] The grid overlays the staged explanation on master; a changed explanation is amber; it may be cleared to empty.
- [ ] Revert restores the master value and, when no override remains, removes the mirror row (verified at the data layer).
- [ ] A save carrying a stale base version is rejected (reload); nothing is silently overwritten.
- [ ] Merged read, seed/collapse, and stale-version rejection covered by DAO tests (Testcontainers + Liquibase) and service tests (mock persistence context); amber highlight and revert covered by SPA tests.

### Blocked by
- Issue 18.

---

## Issue 20 — Translations of name, component-for-scoring & explanation (per language)

**Type:** AFK

### What to build
Per-language editing of a Recommendation's EL/LT/NL translations of `name`, `component_for_scoring`, and `explanation_for_llm`, staged in `DW_RECOMMENDATION_TRANSLATION_WC` (twin of `DW_RECOMMENDATION_TRANSLATION` + `version`). The grid's chips become present/staged/missing (`present` = a master translation row exists for that language; `staged` = a Working-Copy translation row exists). A dialog edits the translations language-by-language: each language row carries the translated name, component for scoring, and explanation together, with **one Save and one Revert per language** (the three fields share a single `version` per (recommendation, language) row); the English values are shown read-only as the source. EN is rejected as a translation target; missing translations fall back to English at assessment time. Reuses the translations-dialog shape established in Issue 9.

### Acceptance criteria
- [ ] Each Recommendation shows EL/LT/NL chips reflecting present/staged/missing for its translations.
- [ ] Editing a language's name/component/explanation in the dialog stages them in one Working-Copy row; saving an empty value clears that field; English is shown read-only.
- [ ] Per-language Revert restores the master translation (or removes the staged row) and collapses the row when no override remains.
- [ ] EN is rejected as a translation target (English is the master value).
- [ ] Missing translations fall back to English at assessment time.
- [ ] Chip derivation, per-language stage/revert, EN-rejection, and collapse covered by DAO tests (Testcontainers + Liquibase) and service tests (mock persistence context); chips and dialog covered by SPA tests.

### Blocked by
- Issue 19.
