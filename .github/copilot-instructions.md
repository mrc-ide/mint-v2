# Copilot Instructions for Mint v2

## Project Overview

Mint v2 is a modern SvelteKit application using Svelte 5 with TypeScript, TailwindCSS 4, and shadcn-svelte components. It follows a dual-testing strategy with unit tests (Vitest) and E2E tests (Playwright).

## Architecture & Key Patterns

### Component System

- **shadcn-svelte integration**: Components are in `src/lib/components/ui/` using tailwind-variants for styling
- **Utility-first CSS**: Uses `cn()` utility (`src/lib/utils.ts`) combining `clsx` and `tailwind-merge`
- **Svelte 5 runes**: Use `$props()`, `$state()`, `$derived()` - avoid legacy reactive syntax
- **Type safety**: Components export prop types and variant types (see `Button` component)

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

### TailwindCSS 4 Integration

- **Vite plugin**: Uses `@tailwindcss/vite` (not PostCSS)
- **Component variants**: Leverage `tailwind-variants` for component API design
- **Design system**: Base color is "slate", forms and typography plugins included

When creating new components, follow the shadcn-svelte pattern: export variant functions, use TypeScript for props, and maintain the established utility class patterns.
