# Comments about the package.json

Since JSON does not allow comments and since `package.json` is central for any JS project and the
heart of its configuration, let's keep here any comments, decisions, design notes etc.


## Versioning policy - 25/07/2026

Every version is pinned exactly; no `^` or `~` ranges. `.npmrc` sets `save-exact=true`, so `npm install <pkg>`
keeps new entries that way without anyone having to remember.

The lockfile is committed and the Docker image builds with `npm ci`, so ranges would buy no reproducibility —
they would only let versions move without leaving a trace in the `package.json` diff. Pinning makes every
upgrade a deliberate, reviewable edit. When the policy was adopted, 4 of the 15 caret-ranged entries were
already resolving above their declared floor (`oidc-client-ts` was declared `^3.3.0` and running 3.5.0), which
is exactly the drift the pins make visible.

The cost is that nothing refreshes on its own, so re-check regularly:

```bash
npm outdated              # what has moved
npx npm-check-updates -i  # pick and apply, then run the full gate
```


## Held back

Document any packages that are deliberately held back.

Format is the following - update the date every time you re-assess:

> ### package-name - dd/mm/yyyy - pinned version - newest version
>
> Reasoning...

### typescript - 25/07/2026 - 6.0.3 - 7.0.2

TypeScript 7.0 is the native (Go) compiler and **ships no programmatic API at all** — that returns in 7.1.
typescript-eslint refuses to load against it outright (`typescript-eslint does not support TS 7.0`), which takes
the whole lint step down, type-aware rules and all. It is not a version-range quibble that an override could
paper over: no released or prerelease typescript-eslint supports TS 7, and the maintainers put it 1-2 major
releases away ([typescript-eslint#10940](https://github.com/typescript-eslint/typescript-eslint/issues/10940)).

TS 7 *can* be run today alongside a TS 6 API package, per Microsoft's documented side-by-side layout
(`"@typescript/native": "npm:typescript@7.0.2"` for the `tsc` binary plus
`"typescript": "npm:@typescript/typescript6@6.0.2"` for what tools import). That layout was built and measured
on the sibling `howibuy-front`, which runs the same toolchain: it works — lint stays green, both compilers flag
the same errors, and `tsc` gets ~3.4x faster.

It was rejected anyway. Half a second on a project this size does not pay for two compilers in the tree, two
sets of type semantics (lint checking with TS 6 while the build checks with TS 7), a `tsc`/`tsc6` split that
every contributor has to learn, and an IDE caveat — the TS 6 API package has no `lib/tsserver.js`, so editors
told to use the workspace TypeScript find no language service.

**Revisit when TypeScript 7.1 ships the new API and typescript-eslint supports it.** At that point this becomes
an ordinary version bump of a single `"typescript"` entry, with no aliases and no split.


## Pinned

Document any packages that are pinned by overrides. Format and instructions are the same as for "Held back".

### unrs-resolver - 25/07/2026 - 1.11.1 - 1.12.2

Every 1.12.x release breaks `@/*` tsconfig-path resolution inside `eslint-import-resolver-typescript`, which
turns every aliased import into a phantom `import-x/no-unresolved` error — 62 of them across `src/` when the
override is lifted and the resolver floats to 1.12.2. It is a transitive dependency (declared `^1.7.11` by
`eslint-import-resolver-typescript`), so an `overrides` entry is the only way to hold it. Keep the pin until a
1.12.x resolves aliases again.
