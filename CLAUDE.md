# DietWise Backoffice

Admin SPA for editing DietWise master data — **Rules** (+ Suggestion Templates) and **Recommendations**, with per-language translations. It is a thin editing UI over the Quarkus backend; it holds no business logic of its own.

The backend is the sibling repo `../dietwise`. Backoffice features are cut end-to-end there (Liquibase → DAO → service → JAX-RS); see that repo's `AGENTS.md` for its layering rules. This file covers the SPA only.

## Commands

- Dev server: `npm run dev` (Vite, port 5174, strict)
- One-shot tests: `npx vitest run` (`npm test` starts watch mode)
- Single test file: `npx vitest run src/rules/RulesPage.test.tsx`
- Typecheck: `npx tsc --noEmit` — TypeScript is deliberately held at 6.x; see [package.json-comments.md](package.json-comments.md) before upgrading to 7
- Lint: `npx eslint src/` — formatting is Prettier-via-ESLint, so `npx eslint --fix` is how you format
- Production build: `npm run build` (runs `tsc` then `vite build`)
- Dependency check: `npm outdated` — versions are pinned exactly on purpose, so nothing refreshes on its own

A change is not done until `npx vitest run`, `npx tsc --noEmit`, and `npx eslint src/` are all clean.

## Stack

React 19 · TypeScript (strict, `noUnusedLocals`/`noUnusedParameters`) · Vite · Tailwind 4 + daisyUI · react-i18next · jotai · react-router 8 · OIDC via `oidc-client-ts` + `react-oidc-context`. Tests: Vitest + `@testing-library/react` on jsdom.

`@/` is the alias for `src/` (tsconfig + Vite). Source is indented with **tabs**.

ESLint 10 runs a **plain flat config** (`eslint.config.js`, ESM) — no `FlatCompat`, no `@eslint/compat`, no `@eslint/eslintrc`. React lint rules come from `@eslint-react/eslint-plugin` and `@stylistic/eslint-plugin`; `eslint-plugin-react` is deliberately absent (it has not supported ESLint 10 since v7.37.5, April 2025 — don't reintroduce it). `no-leaked-conditional-rendering` is type-aware, hence `projectService: true` in the config.

Version pins and `overrides` entries in `package.json` are not self-explanatory and JSON takes no comments, so every deliberate pin or hold-back is justified in **[package.json-comments.md](package.json-comments.md)** — read it before changing a version or dropping an override, and record the reasoning (with a date) when you add one.

Tailwind 4 is configured **CSS-first**: `src/index.css` holds `@import 'tailwindcss'`, `@plugin 'daisyui'` and any `@theme`/`@layer` customisation. There is no `tailwind.config.js` and no PostCSS pipeline — the `@tailwindcss/vite` plugin does the work, and `prettier-plugin-tailwindcss` reads the stylesheet (`tailwindStylesheet` in `.prettierrc.json5`) to sort class names.

## Structure

```
src/
  components/        ONLY truly generic, reusable components (Combobox, TranslationChips)
  <feature>/         rules/ and recommendations/
    <Feature>Page.tsx
    <feature>.ts     data layer: the feature's types + fetch/stage/revert functions
    components/       components specific to this feature (e.g. its dialogs)
  api/client.ts      apiFetch + ApiError
  api/fieldLimits.ts MAX_LENGTHS — the backend's per-field VARCHAR sizes
  auth/              OIDC user manager, role guards
  config/            runtime AppConfig (loaded at startup) + fallback
  i18n/              en.json (only locale) + setup
  layout/ pages/ routes/
```

**The `src/components/` rule is objective:** a component belongs there **iff it imports nothing from a feature folder**. The moment it imports `@/rules` or `@/recommendations`, it belongs under that feature's `components/`. This is convention, not lint-enforced — the test in review is just "does this file import from a feature folder?".

Tests are co-located next to what they test and use relative imports (`./X`) so they move with the file.

## Data layer & the staging model

Each feature's `<feature>.ts` wraps `apiFetch` from `@/api/client`. `apiFetch` attaches the bearer token, returns `undefined` for 204, and throws `ApiError` (carrying `.status`) on any non-2xx.

Edits do not mutate published master data — they **stage** into a Working Copy under **optimistic versioning**: every mutation sends a `baseVersion`, and a stale base returns **HTTP 409**. The standard UI response to a 409 is "show a stale-reload warning and reload", never a silent retry (see `commit`/`reload` in the pages). An edit that collapses back to the master value returns version 0 (no staged change).

Text longer than its column fails in the database as an opaque HTTP error, so every editor caps its input with `maxLength` from `MAX_LENGTHS` in `api/fieldLimits.ts`. Those numbers mirror the Liquibase changelogs in `../dietwise` — a new editable field needs an entry there, and a widened column needs the entry updated.

**Known gap:** staged Working-Copy edits are currently inert at runtime — the assessment engine reads master only and there is no publish step yet. Treat the backoffice as staging-only until that lands. (Memory: `dietwise-backoffice-edits-inert-at-runtime`.)

## Translations

`Language` is the non-English set `EL | LT | NL`; English is the master/source. `TranslationChips` renders the per-language completeness badges (missing/present/staged) shared across the grids. In the translation dialogs, an empty input's **placeholder is the English master value, falling back to the field's name** when there is no English source — so a blank field always tells the translator what it is and what it falls back to.

All UI strings go through `t('feature.key')`, defined in `src/i18n/en.json`, grouped by feature. There is one locale today; add keys, don't hardcode strings.

## Testing conventions

- **No `jest-dom`.** Assert with `expect(el).not.toBeNull()`, `(el as HTMLInputElement).value`, `el.className).toContain(...)` — not `toBeInTheDocument`/`toHaveClass`.
- Mock `react-i18next` with a manual factory so keys pass through: `vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))`.
- Mock the **data-layer module** (`vi.mock('@/recommendations/recommendations')`), not global `fetch`.
- **Async-dialog race:** the edit/translation dialogs render their inputs immediately, then fill them from an async `loadDetails`/`loadTranslations` in `useEffect`. `await findByLabelText(...)` resolves on the *first* render, before the data lands — so a synchronous assertion right after (`expect(input.value).toBe(...)`, or `getByText` for a button that only appears once loaded) races the React commit and flakes under full-suite load. Wait for the loaded content instead: `await waitFor(() => expect(input.value)…)`, `findByDisplayValue`, or `findByText`. (Memory: `dietwise-backoffice-async-dialog-test-race`.)

## Auth & config

Login is OIDC against the Keycloak realm `dietwise`; the app requires the realm role `backoffice` (guarded in `auth/`). Runtime config (`authServerHost`, `apiServerHost`, `oidcClientId`) is loaded at startup; the local-dev fallback in `config/model.ts` points at Keycloak on `:8280` and the API on `:8180`.
