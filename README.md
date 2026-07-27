# DietWise Backoffice

A CRUD backoffice for DietWise reference/master data. It talks to the DietWise
backend (`dietwise`, Quarkus, `/api/v1` on port 8180) and authenticates against
the shared Keycloak realm `dietwise` using a dedicated `backoffice` client.

## Stack

Matches the existing DietWise front-ends:

- **React 19** + **TypeScript** (Vite)
- **Jotai** for state
- **react-router v8** (library mode, `createBrowserRouter`)
- **Tailwind CSS v4** (`@tailwindcss/vite`, CSS-first config) + **DaisyUI v5**
- **react-i18next** (English only for now)
- **OAuth2/OIDC** via `oidc-client-ts` + `react-oidc-context` (Authorization Code + PKCE)
- ESLint 10 (flat config, no compat layer) + Prettier, Vitest

## Getting started

```bash
npm install
npm run dev      # http://localhost:5174
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint`, `npm test`.

## Configuration

Settings resolve in this order (later wins): built-in fallback →
`.env.*` (`VITE_*`) → runtime `public/config.json` (fetched at startup, so it can
be edited per-deployment without a rebuild).

| Key                 | Env var                 | Default                                       |
| ------------------- | ----------------------- | --------------------------------------------- |
| Auth server / realm | `VITE_AUTH_SERVER_HOST` | `http://localhost:8280/realms/dietwise`       |
| API base URL        | `VITE_API_SERVER_HOST`  | `http://localhost:8180/api/v1`                |
| OIDC client id      | `VITE_OIDC_CLIENT_ID`   | `backoffice`                                  |

## Required backend / Keycloak setup

The frontend cannot log in until these one-time changes are made.

### 1. Keycloak `backoffice` client (realm `dietwise`)

Create a client (Clients → Create client) with:

- **Client ID**: `backoffice`
- **Client type**: OpenID Connect, **Public** (no secret)
- **Standard flow**: enabled; Direct access grants: disabled
- **PKCE**: `S256` (Advanced → Proof Key for Code Exchange Code Challenge Method)
- **Valid redirect URIs**: `http://localhost:5174/*` (add your prod origin too)
- **Valid post logout redirect URIs**: `http://localhost:5174/*`
- **Web origins**: `http://localhost:5174` (or `+`)

### 2. Realm role for authorization

- Create a **realm role** named `backoffice` and assign it to the users who
  should have admin access. (Any realm user can authenticate to the client, so the
  backend gates actual access on this role — do not rely on client membership.)
- The access token already carries `realm_access.roles`; no extra mapper needed.
- Backend (later phase): map this realm role to a new `Role.ADMIN` in
  `DietwiseAuthenticationFilter` and authorize backoffice endpoints on it.

### 3. Backend CORS

Add the dev origin to the backend's `application.properties`:

```
%dev.quarkus.http.cors.origins=http://localhost:5174,...existing...
```

(in `dietwise-container/dietwise/src/main/resources/application.properties`).

## Project layout

```
src/
  api/        fetch wrapper that attaches the bearer token (apiFetch)
  auth/       UserManager (oidc-client-ts), RequireAuth guard, role helpers
  config/     runtime/env app config loading + jotai atoms
  i18n/       react-i18next setup + translations
  layout/     AppLayout (DaisyUI drawer) + nav item registry
  pages/      route screens
  routes/     react-router route tree
  main.tsx    bootstrap: load config → configure auth/api/i18n → render
```

Adding an entity CRUD screen later is: a page under `pages/`, a route in
`routes/router.tsx`, and an entry in `layout/navItems.ts`.

## Docker deploy

This repository includes a static web container:
- Build stage: Node + Vite
- Runtime stage: Nginx serving `dist/`

### Build image

```bash
docker build -t dietwise-backoffice:local .
```

The env variable `VITE_BASE_PATH` controls the context path, so building like:

```bash
docker build --build-arg VITE_BASE_PATH=/dietwise-backoffice/ -t dietwise-backoffice:test .
```

Makes the app available at `http://localhost:5173/recipewatch`.

To set backend hosts at build time:

```bash
VITE_AUTH_SERVER_HOST=https://auth.example.com/realms/dietwise \
VITE_API_SERVER_HOST=https://api.example.com/api/v1 \
docker build -t dietwise-backoffice:local .
```
