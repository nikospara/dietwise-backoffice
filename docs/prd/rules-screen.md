# PRD — Backoffice Rules Screen

> Scope: the first iteration of the DietWise backoffice's master-data editor, centred on the **Rule** aggregate.
> Vocabulary follows the Backoffice section of [`CONTEXT.md`](../../../dietwise/CONTEXT.md).
> Architecture decisions live in the backoffice repo: `dietwise-backoffice/docs/ADR/` — [0001](../ADR/0001-staged-working-copy-for-master-data-edits.md) (staged Working Copy), [0002](../ADR/0002-working-copy-as-sparse-mirror-tables.md) (sparse mirror tables), [0003](../ADR/0003-concurrency-advisory-presence-not-locks.md) (concurrency).

## Problem Statement

The substitution Rules and their related master data (Trigger Ingredients, Roles or Techniques, and the translations of all of these) drive recipe assessment, but today they can only be changed by a developer editing the database or writing migrations. The people who actually own this content are non-technical domain experts who are used to curating a spreadsheet. They have no safe, self-service way to:

- see all Rules at a glance and understand which Trigger Ingredient / Role / Recommendation each ties together;
- correct a rationale, rename a Trigger Ingredient, or add a new one;
- maintain the EL / LT / NL translations;
- retire a Rule without deleting history;
- do all of the above **without** their half-finished work immediately affecting the live apps, and without silently clobbering a colleague's concurrent edits.

## Solution

A web Rules screen in the backoffice that presents all Rules as a spreadsheet-like grid and lets non-technical editors curate the Rule aggregate and its referenced master data. Every edit lands in a single shared **Working Copy** rather than in live master data; nothing reaches recipe assessment until an editor **publishes** the whole batch. The screen highlights what has changed, shows who is editing what, and never lets one editor's save silently overwrite another's.

The grid shows one Rule per row with columns **Recommendation · Trigger Ingredient · Role or Technique · Rationale · Actions**. Recommendation is a read-only dropdown (15 values, no management UI). Trigger Ingredient and Role or Technique are comboboxes that pick an existing entry or add a new one, each with a button to edit that shared entity's details and translations. Rationale is edited in place with a button for its translations. The Actions column carries Deactivate/Activate and a (stubbed) "edit suggestion templates" button.

## User Stories

1. As a content editor, I want to see every Rule in one grid, so that I can understand the whole ruleset at a glance.
2. As a content editor, I want each row to show its Recommendation, Trigger Ingredient, Role or Technique and Rationale, so that I can read a Rule without opening a detail view.
3. As a content editor, I want the grid to load quickly with all Rules visible (there are ~31), so that I never have to page through results.
4. As a content editor, I want to pick a Recommendation for a new Rule from a dropdown, so that I don't have to remember the 15 valid values.
5. As a content editor, I want to choose a Trigger Ingredient from a combobox that filters as I type, so that I can find an existing one quickly.
6. As a content editor, I want to add a brand-new Trigger Ingredient from the combobox when none matches, so that I can author a Rule for an ingredient we haven't covered yet.
7. As a content editor, I want the combobox to offer an existing entry instead of letting me create a duplicate name, so that we don't end up with two "Butter" entries.
8. As a content editor, I want the same combobox behaviour for Role or Technique, so that the two reference columns behave consistently.
9. As a content editor, I want to edit a Trigger Ingredient's details (name, LLM explanation) from its cell, so that I can correct master data in context.
10. As a content editor, I want to be warned that editing a Trigger Ingredient affects every Rule that uses it, so that I'm not surprised when other rows change.
11. As a content editor, I want every Rule row that references an edited Trigger Ingredient or Role to highlight as changed, so that I can see the full blast radius of my edit.
12. As a content editor, I want to edit a Role or Technique's details the same way, so that I can maintain that master data too.
13. As a content editor, I want to edit a Rule's Rationale directly in its cell, so that small corrections are fast.
14. As a content editor, I want to leave a Rationale empty, so that I'm not forced to invent text where none belongs.
15. As a content editor, I want to create a new Rule, choosing its Recommendation, Trigger Ingredient and Role or Technique, so that I can extend the ruleset.
16. As a content editor, I want to omit the Role or Technique on a Rule, so that I can author Rules that don't depend on a culinary role.
17. As a content editor, I want to be stopped from creating a second Rule with the same Recommendation + Trigger Ingredient + Role or Technique combination, so that the ruleset stays unambiguous.
18. As a content editor, I want the same duplicate check to treat "no Role" as a value, so that I can't create two role-less Rules for the same Recommendation and Trigger Ingredient.
19. As a content editor, I want the Recommendation / Trigger / Role of an existing Rule to be locked, so that I can't accidentally change a Rule's identity.
20. As a content editor, I want to edit the translations (EL, LT, NL) of a Rationale from a dialog, so that localized assessments read correctly.
21. As a content editor, I want to edit the translations of a Trigger Ingredient and a Role or Technique, so that their localized names and LLM explanations are correct.
22. As a content editor, I want to see at a glance which languages a thing has been translated into (e.g. "EL ✓ · LT ✓ · NL —"), so that I know what still needs work.
23. As a content editor, I want missing translations to fall back to English at assessment time rather than block me, so that I can publish useful content before every language is complete.
24. As a content editor, I want to deactivate a Rule, so that assessment stops using it without me losing it or its history.
25. As a content editor, I want a deactivated Rule to remain visible in the grid with a red background, so that I can find and reactivate it.
26. As a content editor, I want to reactivate a previously deactivated Rule, so that I can bring it back into use.
27. As a content editor, I want to discard a Rule I just created but never published, so that I can abandon a mistake cleanly.
28. As a content editor, I want to revert a single changed field back to its published value, so that I can undo one mistake without losing my other edits.
29. As a content editor, I want changed cells highlighted in amber, so that I can see exactly what I've altered versus live data.
30. As a content editor, I want brand-new Rules shown with a green row, so that I can distinguish additions from edits.
31. As a content editor, I want a per-row "pending" badge whenever a row differs from what's live, so that I know what will change when someone publishes.
32. As a content editor, I want my edits to be saved into a shared working area as I go, so that I don't lose work and my colleagues can see it.
33. As a content editor, I want to publish all pending changes in one action, so that a curated batch goes live together.
34. As a content editor, I want a confirmation that lists what is about to be published, so that I don't ship someone else's half-finished work by accident.
35. As a content editor, I want the screen to refresh with my colleagues' changes on its own within a few seconds, so that I'm not working against stale data.
36. As a content editor, I want a refresh to never wipe out the cell I'm currently typing in, so that incoming updates don't interrupt me.
37. As a content editor, I want to see when a colleague is currently editing a Rule or a shared entity, so that we naturally avoid stepping on each other.
38. As a content editor, I want to be told "someone changed this since you loaded it — reload" instead of silently overwriting them, so that no one's work is lost.
39. As an administrator, I want only users with the backoffice realm role to reach this screen and its endpoints, so that master data can't be edited by ordinary app users.
40. As a maintainer, I want each publish recorded (who, when, what shipped), so that we have an audit trail of master-data changes.
41. As a recipe-assessment consumer, I want deactivated Rules and unpublished edits to be invisible to assessment, so that only curated, published content affects results.
42. As a recipe-assessment consumer, I want Rules with no Role or Technique to be assessed without error, so that the new optional-role capability doesn't break assessment.

## Implementation Decisions

### Scope of this iteration
- Editable: the **Rule** (Rationale, activation, and — for new Rules — its business key), **Trigger Ingredient** and **Role or Technique** (details + translations), and the translations of all three.
- Read-only: **Recommendation** (dropdown of 15; no management UI).
- Deferred (not built now): editing **Suggestion Templates** (the row action is a stub) and **Alternative Ingredients**; the `cuisine` field is ignored.

### Staging model (ADR 0001, 0002, 0003)
- Edits never write live master data. They accumulate in a single, system-wide shared **Working Copy** and reach master only on **Publish**, which applies the entire Working Copy as one batch.
- The Working Copy is stored as **sparse mirror tables** — one per editable master table (including translation tables) — holding whole proposed rows only for entities that have been touched or newly created. The grid is `master LEFT JOIN mirror`, mirror wins.
- **Publish mechanics (direct apply vs. generated Liquibase change sets) are explicitly deferred** and will get their own ADR. The mirror representation is chosen so it can feed whichever apply mechanism is picked.

### Rule identity and the business key
- The business key is the triplet (Recommendation, Trigger Ingredient, Role or Technique). It is **immutable for existing Rules** and editable only while creating a new Rule.
- **Role or Technique becomes optional.** This aligns the schema and model to the glossary, which already describes a Rule as having an *optional* role/technique. Requires: drop `NOT NULL` on `DW_RULE.role_or_technique_id`; make the model's `getRoleOrTechnique()` nullable (using `@Nullable` to match `rationale`/`cuisineContext` in the same interface, not `Optional`); update the entity mapping (currently `optional = false`) and the rule-loading/assessment code that dereferences the role unconditionally.
- Business-key uniqueness is enforced at three layers, all treating "no Role" as a real value via `UNIQUE … NULLS NOT DISTINCT` (PostgreSQL 18):
  1. application validation at create time, against the merged master ∪ staged set, surfaced as the editor picks the third value;
  2. a unique constraint on the mirror Rule table (catches two editors staging the same new triplet);
  3. a unique constraint added to master `DW_RULE` (none exists today; current data has zero duplicates, so it is safe to add) as the publish-time backstop.

### Shared master data semantics
- Trigger Ingredient and Role or Technique are shared master data (their `name` is a unique natural key). Editing one changes it for **every** Rule that references it; the UI warns about this blast radius and highlights all affected rows. There is no per-Rule override (and the unique-name constraint makes one impossible).
- The combobox dedups on name: matching existing entries are offered; "add new" is available only for a genuinely new name. A new entity is created with just its (unique) English name and is immediately valid/publishable; its LLM explanation and translations are filled in later via the edit dialog.

### Activation
- Add `active boolean NOT NULL DEFAULT true` to `DW_RULE` (and its mirror twin). **Deactivate/Activate** is a staged change like any other; assessment must filter to `active = true`. Deactivation applies to **Rules only**, never to Trigger Ingredients or Roles.

### Validity model
- The Working Copy must always be in a publishable state: hard constraints are validated **on save** (in context), soft fields may be empty.
  - Hard (block save): Trigger/Role English name present and unique; Rule business-key triplet unique; referenced entities exist.
  - Soft (may be empty): `explanation_for_llm`, Rule `rationale`, any translation. Missing translations fall back to English at assessment time.

### Undo gestures
- **Discard**: drop a new Rule that exists only in the Working Copy (nothing to revert to).
- **Revert**: per-field restore of an already-published entity's staged change back to its live master value. Reverting a shared Trigger/Role field reverts it for all referencing Rules (same blast-radius warning).
- No global "discard the whole Working Copy" in v1.

### Visual language
- Row background = activation state (red = inactive). Cell background = changed (amber). New Rule = green row. A per-row pending badge marks any row that differs from live master (covers new Rules and staged (de)activations, which have no single changed cell).

### Concurrency (ADR 0003)
- No hard locks in v1. Freshness via **polling** of a lightweight endpoint returning a Working-Copy version cursor plus the current **advisory presence** set ("who is editing what"); the grid re-fetches only when the cursor moves and never overwrites the focused cell.
- An **optimistic version check on save** rejects a stale write ("reload") so nothing is silently clobbered. Requires a version/`updated_at` per editable entity (mirror, and master for the publish-time check).
- Upgrading advisory presence to enforced locks later is incremental, not a rewrite.

### Modules and seams
- **Backend (`dietwise`) owns all staging/publish logic and data**; the backoffice SPA has no database access and talks only to new ADMIN-only REST endpoints. Work slots into the existing hexagonal layering:
  - `dietwise-architecture` (model + service-interfaces): nullable role on the Rule model; a new service interface for the backoffice working-copy/publish operations.
  - `dietwise-dao-hibernate-reactive`: mirror entities + DAOs for the merged read and for publish reconciliation; the `active` and version columns; Liquibase change sets for all schema changes (merged into existing changelog files per the project's Liquibase convention).
  - `dietwise-jaxrs` / app module: thin ADMIN-only resources for merged-read, stage edit, deactivate/activate, discard, revert, presence/heartbeat, version-poll, and publish.
- Authorization reuses the already-implemented mapping: the Keycloak realm role `backoffice` → `Role.ADMIN`.

### API contract (shape, not paths)
- A merged-read endpoint returns the grid as `master LEFT JOIN mirror`, each field tagged with its change state (unchanged / changed / new) and the Rule's effective `active`, plus a Working-Copy version cursor.
- Mutating endpoints stage a single change, toggle activation, discard a new Rule, or revert one field; each carries the base version for the optimistic check.
- A poll endpoint returns `{ versionCursor, presence[] }`.
- A publish endpoint applies the whole Working Copy and records an audit row.

## Testing Decisions

- **What a good test asserts here:** externally observable behaviour — the merged grid a caller gets back, whether a save is accepted or rejected, what assessment sees before vs. after publish — not the internal shape of the mirror rows.
- **Highest existing seam is the service + DAO layer.** The codebase has no HTTP/RestAssured resource tests (resources are thin by design); it tests DAOs with `MockReactivePersistenceContextFactory` and logic with plain JUnit 5. New tests should follow that, not introduce endpoint-level HTTP tests.
- **Pure-logic seams (plain unit tests, like `DietwiseAuthenticationFilterTest`):**
  - business-key uniqueness including the null-Role case (two role-less Rules for the same Recommendation+Trigger must collide);
  - the hard/soft validity split (which fields block a save, which may be empty);
  - change-state derivation for a field (unchanged / changed / new) from a master value + a mirror value.
- **DAO seams (prior art: `RuleDaoImplTest`, `TriggerIngredientDaoImplTest`, `RoleOrTechniqueDaoImplTest`, `RecommendationDaoImplTest`, all using `MockReactivePersistenceContextFactory`):**
  - the merged `master LEFT JOIN mirror` read returns master values overlaid by staged values, with new (mirror-only) entities included;
  - publish reconciliation moves mirror rows into master and clears the Working Copy;
  - the optimistic version check rejects a save whose base version is stale;
  - `Revert` of a field removes the override and (when the last override is gone) collapses the mirror row;
  - assessment-path reads skip `active = false` Rules and tolerate a null Role or Technique (guards the Q6 regression where the role was dereferenced unconditionally).
- **Service seams (prior art: tests under `dietwise-container/dietwise-services/src/test`):** staging/publish orchestration and validation with the DAOs mocked.
- Follow the project testing conventions in `AGENTS.md`: name the system under test `sut`; use `withTransaction`/`withoutTransaction` appropriately; turn reused literals into constants; never assert against mocked behaviour.

## Out of Scope

- Editing Suggestion Templates and Alternative Ingredients (next iteration; the row action is a stub for now).
- Managing Recommendations (read-only dropdown) and the `cuisine` field.
- **Publish mechanics** — how the batch is physically applied to master (direct transactional apply vs. generated Liquibase change sets). Deferred, with its own future ADR.
- Per-row "ready" flags / selective publish (publish is global in v1).
- A global "discard the whole Working Copy" action.
- Enforced edit locks, Server-Sent Events, and WebSockets (advisory presence + polling only in v1; documented upgrade path exists).
- Creating the Keycloak `backoffice` client and assigning the `backoffice` realm role (operational setup owned by the admin, tracked separately).

## Further Notes

- Grounding from the dev database at the time of writing: 31 Rules, 26 Trigger Ingredients, 26 Roles or Techniques, 15 Recommendations, 93 Suggestion Templates; zero duplicate business-key triplets; full EL/LT/NL translation coverage; PostgreSQL 18 (so `NULLS NOT DISTINCT` is available).
- Several decisions deliberately pull backend changes into this work that reach **past** the backoffice into the live assessment read path: making Role or Technique nullable, and filtering on `active`. These were accepted consciously (see the relevant ADRs and `CONTEXT.md`).
- The backoffice authorization backend changes (realm role `backoffice` → `Role.ADMIN`, CORS, role-claim-path) are already implemented and verified; only the Keycloak client/role provisioning remains, which is operational.
