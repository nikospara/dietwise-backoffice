# Backoffice edits master data through a staged Working Copy

The backoffice never writes the live master data (Rules, Trigger Ingredients, Roles or Techniques, and their translations) directly. Edits accumulate in a single, system-wide shared **Working Copy** and only reach the live tables — and therefore recipe assessment — when an editor **publishes**, which applies the entire Working Copy as one batch.

## Context

The editors are non-technical and work like they would in a spreadsheet: they make many small edits over a session and want them to go live deliberately, in batches, when the dataset feels ready — not on every keystroke. Master data is read live by recipe assessment, so unreviewed, half-finished edits must never be visible to the apps.

## Considered Options

- **Edit master directly, with versioning/audit for rollback** — rejected: every in-progress edit would immediately affect live assessments, which is the exact thing we must prevent.
- **Per-editor sandboxes** — rejected: independent drafts let two editors create colliding rules (the business key must stay unique) that only conflict at merge time, and "what changed" becomes ambiguous (vs. my draft or vs. live?). A non-technical team would find this hostile.
- **Single shared Working Copy + global publish** — chosen.

## Consequences

- Highlighting is unambiguous: a value is "changed" when it differs from live master, the same view for everyone.
- No isolation between editors. Because the set is shared and publish is all-or-nothing, clicking publish ships *everyone's* current pending work, including anything half-finished. This is mitigated by social process and a confirmation step that lists what will be published — not by infrastructure. A per-row "ready" flag is a clean later addition if this foot-gun fires.
- Concurrent edits are guarded by an optimistic version check at save time rather than by locking (see ADR 0003): the later save is rejected and reloaded instead of silently overwriting.
- Each publish should be recorded (timestamp, who, what shipped) as an audit trail; this is independent of publish being all-or-nothing.

The physical representation of the Working Copy is covered in ADR 0002; concurrency and edit awareness in ADR 0003.
