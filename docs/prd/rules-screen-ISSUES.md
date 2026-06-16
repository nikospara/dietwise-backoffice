# Rules Screen — Implementation Issues

Tracer-bullet vertical slices derived from [`rules-screen.md`](./rules-screen.md). Each issue cuts end-to-end (schema → DAO → service → ADMIN API → SPA → tests) and is independently verifiable. Vocabulary follows the Backoffice section of [`CONTEXT.md`](../../../dietwise/CONTEXT.md); slices respect [ADR 0001–0003](../ADR/).

All ten issues are **AFK** (implementable and mergeable without a human gate) — the decisions were settled during design.

**Deferred, out of this scope:** the publish step — both the *publish-mechanics* decision (direct apply vs. generated Liquibase change sets; its own future ADR) and the publish implementation/audit/confirmation. Consequently this scope delivers a fully usable, demoable **Working Copy** (staging, highlighting, revert, presence) but **no go-live path**; nothing here changes live master data or recipe assessment except the standalone backend changes in Issues 4 and 5. User stories 33, 34 and 40 are intentionally not covered here.

**Dependency order:** 1 → 2 → {3, 4, 10}; 5 (standalone); 6 (needs 2 + 5) → {7, 8 → 9}.

---

## Issue 1 — Read-only Rules grid

**Type:** AFK · **Stories:** 1, 2, 3, 39

### What to build
An ADMIN-only Rules screen that lists every Rule in a grid. A backend endpoint returns all Rules with their Recommendation, Trigger Ingredient and Role or Technique (English names), Rationale, and effective active state. The SPA renders the grid behind the `backoffice` realm-role guard, with columns Recommendation · Trigger Ingredient · Role or Technique · Rationale · Actions (the Actions column is present but inert at this stage). Read-only — no editing, no Working Copy yet.

### Acceptance criteria
- [ ] A user with the `backoffice` realm role sees all Rules (~31) in one grid; a user without it is refused at both the endpoint and the SPA route.
- [ ] Each row shows Recommendation, Trigger Ingredient, Role or Technique and Rationale in English.
- [ ] The full list renders without pagination.
- [ ] The endpoint returns published master data only.
- [ ] Read path covered by DAO/service tests following existing DAO test prior art.

### Blocked by
- None — can start immediately.

---

## Issue 2 — Working Copy substrate + staged Rationale edit

**Type:** AFK · **Stories:** 13, 14, 29, 31, 32, 38

### What to build
Introduce the sparse mirror representation (ADR 0002) for the Rule, beginning with the Rationale field. The grid read becomes live master overlaid by the Working Copy (mirror wins). An editor edits a Rule's Rationale in place; the edit is stored as a **Staged Change** in the Working Copy, never in master. Changed cells highlight amber and the row shows a pending badge. Each editable entity carries a version; a save whose base version is stale is rejected with a reload prompt, so no edit is silently clobbered (ADR 0003).

### Acceptance criteria
- [ ] Editing a Rationale stores it in the Working Copy; live master is unchanged and recipe assessment is unaffected.
- [ ] The grid overlays the staged value on master; the changed cell is amber and the row carries a pending badge.
- [ ] A Rationale may be left empty.
- [ ] A save carrying a stale base version is rejected (reload); nothing is silently overwritten.
- [ ] Merged read and staging covered by DAO tests using the mock persistence context; change-state derivation (unchanged / changed / new) covered by unit tests.

### Blocked by
- Issue 1.

---

## Issue 3 — Revert a staged field

**Type:** AFK · **Stories:** 28

### What to build
Per-field **Revert** that restores an already-published entity's staged field back to its live master value. When the last override on a mirror row is reverted, that mirror row is removed; the cell's amber highlight and the row's pending badge clear. Distinct from Discard (which drops an unpublished new Rule wholesale).

### Acceptance criteria
- [ ] Reverting a changed Rationale restores the live master value and clears its amber highlight and the pending badge.
- [ ] When an entity has no remaining staged changes, its mirror row no longer exists (verified at the data layer).
- [ ] Revert affects a single field and leaves other staged changes on the same row intact.
- [ ] DAO tests cover mirror-row collapse.

### Blocked by
- Issue 2.

---

## Issue 4 — Deactivate / Activate a Rule

**Type:** AFK · **Stories:** 24, 25, 26, 41

### What to build
Add an `active` flag to the Rule (master + mirror). **Deactivate/Activate** is a Staged Change like any other. Recipe assessment must use only active Rules. A deactivated Rule stays in the grid with a red row background and offers Activate; a pending badge marks a staged (de)activation. Applies to Rules only.

### Acceptance criteria
- [ ] Deactivating a Rule stages `active=false`; the row turns red and shows a pending badge; Activate reverses it.
- [ ] Deactivated Rules remain visible in the grid.
- [ ] Recipe assessment ignores Rules whose effective state is inactive (covered by an assessment-path/DAO test).
- [ ] Activation/deactivation is offered for Rules only, not Trigger Ingredients or Roles.

### Blocked by
- Issue 2.

---

## Issue 5 — Make Role or Technique optional

**Type:** AFK (backend only) · **Stories:** 42

### What to build
Align schema and model to the glossary, which already describes a Rule's role/technique as optional. Drop the `NOT NULL` on the Rule's Role-or-Technique reference, make the model accessor nullable (matching the interface's existing nullable fields rather than `Optional`), and update the entity mapping and the rule-loading/assessment code that currently dereferences the role unconditionally, so a role-less Rule is assessed without error.

### Acceptance criteria
- [ ] A Rule with no Role or Technique can be loaded and assessed without error.
- [ ] Existing Rules (all currently have a role) behave unchanged.
- [ ] A Liquibase change set drops the NOT NULL, merged into an existing changelog file per the project's Liquibase convention.
- [ ] Assessment/DAO tests cover the null-role path (guards the unconditional-dereference regression).

### Blocked by
- None — can start immediately (independent of the SPA).

---

## Issue 6 — Create a new Rule with business-key uniqueness

**Type:** AFK · **Stories:** 4, 5, 8, 15, 16, 17, 18, 19, 30

### What to build
Let an editor add a new Rule, choosing its Recommendation (dropdown of 15) and its Trigger Ingredient and Role or Technique (comboboxes that pick **existing** entries only at this stage). The triplet (Recommendation, Trigger Ingredient, Role or Technique) is the business key: unique, and — treating "no Role" as a value — enforced via `UNIQUE NULLS NOT DISTINCT` on master and mirror plus application validation against the merged master ∪ staged set. The triplet is editable only while creating; on existing Rules it is locked. A new Rule renders as a green row.

### Acceptance criteria
- [ ] An editor can stage a new Rule by choosing Recommendation + Trigger Ingredient + optional Role or Technique; it shows as a green row with a pending badge.
- [ ] A second Rule with the same triplet is blocked as the third value is chosen — including when both have no Role.
- [ ] On existing Rules, the three business-key fields are read-only.
- [ ] `UNIQUE NULLS NOT DISTINCT` exists on both master and mirror; equivalent validation runs in the service against the merged set.
- [ ] Unit tests cover business-key uniqueness including the null-Role case.

### Blocked by
- Issue 2, Issue 5.

---

## Issue 7 — Discard an unpublished new Rule

**Type:** AFK · **Stories:** 27

### What to build
**Discard** a Rule that exists only in the Working Copy and was never published — drop its mirror row so it disappears from the grid. Distinct from Deactivate, which applies to already-published Rules.

### Acceptance criteria
- [ ] Discarding a staged new Rule removes it from the grid and the Working Copy.
- [ ] Discard is offered only for unpublished new Rules; published Rules offer Deactivate instead.

### Blocked by
- Issue 6.

---

## Issue 8 — Add-new and edit shared Trigger Ingredient / Role details

**Type:** AFK · **Stories:** 6, 7, 9, 10, 11, 12

### What to build
From the Trigger Ingredient and Role or Technique comboboxes, an editor can add a new entry — deduped on the unique name, so an existing match is offered rather than duplicated — and can edit an existing entry's details (name, LLM explanation) via a dialog. These are shared master data: an edit affects every Rule that references the entity. The dialog warns about that blast radius, and every Rule row referencing the edited entity highlights.

### Acceptance criteria
- [ ] Typing a name offers "add new" only when no existing entry matches; an existing match is offered for selection.
- [ ] Editing a Trigger Ingredient or Role or Technique stages a change to the shared entity; every Rule referencing it highlights as changed.
- [ ] The edit dialog states that the change applies to all N referencing Rules.
- [ ] A rename respects the unique-name constraint.
- [ ] DAO/unit tests cover name dedup and shared-edit propagation to referencing Rules.

### Blocked by
- Issue 6.

---

## Issue 9 — Edit translations with completeness indicator

**Type:** AFK · **Stories:** 20, 21, 22, 23

### What to build
Mirror the translation tables and let an editor maintain EL / LT / NL translations for a Rule's Rationale and for a Trigger Ingredient / Role or Technique (localized name + LLM explanation) via a dialog. No translation is required; a completeness indicator shows which languages are present; missing translations already fall back to English at assessment time.

### Acceptance criteria
- [ ] An editor can stage translations in the three languages for Rationale, Trigger Ingredient and Role or Technique.
- [ ] A completeness indicator shows present vs. missing languages per translatable thing.
- [ ] Translations are optional — a thing can be left with gaps; assessment falls back to English.
- [ ] Staged translations highlight and badge like other Staged Changes and can be reverted.

### Blocked by
- Issue 8.

---

## Issue 10 — Freshness polling and advisory presence

**Type:** AFK · **Stories:** 35, 36, 37

### What to build
Keep editors' grids reasonably fresh and aware of one another without hard locks (ADR 0003). A lightweight poll returns a Working-Copy version cursor and the advisory presence set ("who is editing what"); the grid re-fetches only when the cursor moves and never overwrites the cell the editor is currently focused on. Opening an editor announces presence with a heartbeat that expires on abandonment.

### Acceptance criteria
- [ ] A change by one editor appears in another editor's grid within the poll interval, without manual refresh.
- [ ] A refresh never discards the value in the cell the user is currently editing.
- [ ] The grid shows when a colleague is editing a given Rule or shared entity; presence expires if they leave.
- [ ] No hard locking is introduced — presence is advisory only.

### Blocked by
- Issue 2.
