---
description: 'Svelte 5 and SvelteKit development standards and best practices for component-based user interfaces and full-stack applications'
applyTo: '**/*.svelte, **/*.ts, **/*.js, **/*.css, **/*.scss, **/*.json'
---

# Copilot Instructions for Mint v2 Client

## Project Overview

Mint v2 is a modern SvelteKit application using Svelte 5 with TypeScript, TailwindCSS 4, and shadcn-svelte components. It follows a dual-testing strategy with unit tests (Vitest) and E2E tests (Playwright).

## Architecture & Key Patterns

### Component System

- **shadcn-svelte integration**: Components are in `src/lib/components/ui/` using tailwind-variants for styling
- **Utility-first CSS**: Uses `cn()` utility (`src/lib/utils.ts`) combining `clsx` and `tailwind-merge`
- **Svelte 5 runes**: Use `$props()`, `$state()`, `$derived()` - avoid legacy reactive syntax
- **Type safety**: Components export prop types and variant types (see `Button` component)
- **Forms**: Uses (superforms)[https://superforms.rocks/] and (formsnap)[https://formsnap.dev/]

### File Structure Conventions

- **Route-based**: SvelteKit file-based routing in `src/routes/`
- **Component organization**: UI components in `src/lib/components/ui/[component]/`
- **Path aliases**: Use `$lib`, `$routes`, and shadcn aliases (`$lib/components/ui`)
- **Type generation**: SvelteKit generates `$types` for page/layout data

### Testing Strategy

Two distinct testing environments configured in `vite.config.ts`:

**Client Tests** (Svelte components):

```bash
npm run test:unit  # Runs browser-based tests with Playwright
```

- Use `vitest-browser-svelte` for component testing
- Test files: `**/*.svelte.{test,spec}.{js,ts}`
- Import from `@vitest/browser/context` for browser APIs

**Server Tests** (Business logic):

- Test files: `**/*.{test,spec}.{js,ts}` (excluding `.svelte` tests)
- Standard Node.js Vitest environment

**E2E Tests**:

```bash
npm run test:e2e  # Full application tests
```

- Uses Playwright with auto-build/preview server setup

### Development Workflow

**Essential Commands**:

```bash
npm run dev          # Development server with HMR
npm run check        # Type checking + Svelte validation
npm run lint         # Prettier + ESLint
npm run test         # Runs both unit and E2E tests
```

**Dependencies**: Requires Node.js >=22.0.0

### Code Quality Standards

- **ESLint config**: Modern flat config with TypeScript + Svelte plugins
- **Prettier integration**: Auto-formats with Svelte and TailwindCSS plugins
- **Strict TypeScript**: All type checking enabled, moduleResolution: "bundler"
- **Import organization**: Prefer absolute imports using path aliases

### SvelteKit Specifics

- **Adapter**: Uses `adapter-auto` for deployment flexibility
- **Data loading**: Server-side data via `+page.server.ts` with typed `PageServerLoad`
- **Preprocessing**: Uses `vitePreprocess()` for TypeScript/CSS handling

### User State & Redis Persistence

- **Cookie identity**: `lib/server/session.ts` ensures a `userId` cookie (httpOnly, secure, 1y). Set in `hooks.server.ts`.
- **Lifecycle hook**: `hooks.server.ts` loads (or initializes) `locals.userState` with `loadOrSetupUserState(userId)` (JSON blob in Redis keyed by userId) and after every response calls `saveUserState`.
- **Data shape**: See `lib/types.ts` (`UserState` -> projects[] -> regions[]). Extend this interface plus the default object in `loadOrSetupUserState` when adding fields.
- **Mutations**: Perform synchronous in‑memory mutation of `locals.userState` inside page `load` (rare) or `actions` (preferred). Do NOT call Redis directly in route handlers; the hook centralizes persistence.
- **Validation + errors**: Enforce uniqueness (project / region names) manually before pushing; pair with `superValidate` + `setError` so client form shows validation issues.
- **Adding new persisted fields**: (1) Update `UserState`; (2) Initialize defaults in `loadOrSetupUserState`; (3) Mutate via actions; existing users missing the field will receive defaults on first load because the hook rebuilds state if parse fails.
- **Failure handling**: If JSON parse fails, code logs error and resets a clean state (see try/catch in `lib/server/redis.ts`). Avoid partial writes—always store full serialized state.

### TailwindCSS 4 Integration

- **Vite plugin**: Uses `@tailwindcss/vite` (not PostCSS)
- **Component variants**: Leverage `tailwind-variants` for component API design
- **Design system**: Base color is "slate", forms and typography plugins included

When creating new components, follow the shadcn-svelte pattern: export variant functions, use TypeScript for props, and maintain the established utility class patterns.
