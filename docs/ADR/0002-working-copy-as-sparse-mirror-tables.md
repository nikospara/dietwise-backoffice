# The Working Copy is stored as sparse mirror tables

The Working Copy (see ADR 0001) is stored as parallel "mirror" tables — one per editable master table, including the translation tables — that hold whole proposed rows. The mirror is **sparse**: it contains a row only for an entity that has been touched or newly created, never a copy of unchanged master data. The grid reads master `LEFT JOIN` mirror with the mirror winning; publish reconciles mirror rows into master.

## Context

The product is a grid that merges live master data with pending edits and highlights what changed, the business key (Recommendation, Trigger Ingredient, Role or Technique) must stay unique as editors type, and the edited entities have translations and parent/child relationships.

## Considered Options

- **Generic change-log** — one narrow table of field-level deltas `(entity_type, entity_id, field, new_value, op)`. Rejected: every read has to reconstruct "master + deltas" in application code for joined, translated, multi-entity data; business-key uniqueness can't be a DB constraint and would have to be re-implemented in app logic; translations and relationships become an EAV typing/foreign-key headache. Its wins (trivial highlighting, easy change-set generation) are real but smaller.
- **Mirror tables, full snapshot** — working copy seeded as a complete copy of master. Rejected: duplicates thousands of untouched rows to stage a handful of edits.
- **Mirror tables, sparse overlay** — chosen.

## Consequences

- The grid is a plain query over `master LEFT JOIN mirror`; an entity with a mirror row is "changed or new" (row-level highlight), and field-level highlight comes from comparing the mirror's columns against master's.
- Business-key uniqueness is enforced by a `UNIQUE` constraint on the mirror rule table, so collisions surface as editors type rather than at publish.
- Schema-duplication tax: each editable master table needs a mirror twin, and a migration that changes a master table must change its twin. Cheap for the entities in scope; the tax grows if "editable master data" later sprawls to many tables.
- Newly created entities live only in the mirror (with generated ids) until publish; references between two not-yet-published entities are resolved within the mirror.
- Deletions/deactivations need explicit representation in the sparse model (a touched mirror row carrying the new state), since "absence of a mirror row" already means "unchanged."
