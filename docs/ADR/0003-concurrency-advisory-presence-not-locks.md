# Working Copy concurrency: advisory presence, not hard locks

Concurrent editing of the shared Working Copy (ADR 0001) is handled with three lightweight mechanisms and **no hard locking**: polling keeps each editor's grid reasonably fresh; **advisory presence** shows "who is editing what" as a non-binding hint; and an **optimistic version check at save** rejects a stale write so no edit is ever silently clobbered (the loser reloads and redoes). The editor sees a rare conflict as "X changed this since you loaded it — reload," not as lost work.

## Context

The editing team is small (≤5 people, rarely editing at once) and cooperative, and the editors are non-technical. A hard guarantee of "you cannot edit what someone else is editing right now" was considered a requirement, but at this scale the collision it prevents is extremely rare.

## Considered Options

- **Detect-only** — optimistic version check, no awareness of others. Rejected: gives editors no sense of who else is working, which was the original concern.
- **Advisory presence + version check** — chosen.
- **Atomic hard locks (acquire/release, TTL + heartbeat)** — rejected *for now*: at ≤5 cooperative users the prevented collision is near-zero, while hard locks add a *ghost-lock* failure mode (an abandoned tab blocks a colleague until TTL expiry) plus the lifecycle code (heartbeat, TTL, `sendBeacon` release, expiry-mid-edit) whose bugs would hit the non-technical users it is meant to protect.
- **SSE / WebSockets** for push freshness — deferred: polling is enough at this scale; SSE is a clean drop-in if poll latency ever annoys.

## Consequences

- A same-entity collision (rare) costs the loser a reload + redo of one field. Nothing is silently overwritten — this is what demotes ADR 0001's last-write-wins note to a guarded, non-destructive reject.
- Requires a version/`updated_at` per editable entity (mirror, and master for the publish-time check); the poll endpoint returns a working-copy version cursor plus the current presence set, and the grid refreshes only when the cursor changes and **never overwrites the cell the editor is currently focused on**.
- Advisory presence is a strict subset of a hard-lock implementation, so upgrading to enforced locks later is incremental, not a rewrite, should real contention appear.
