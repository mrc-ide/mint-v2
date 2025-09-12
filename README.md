# Mint v2 - Malaria Intervention Tool

A modern SvelteKit application built with Svelte 5, TypeScript, TailwindCSS 4, and shadcn-svelte components.

## Features

- **SvelteKit**: Full-stack framework with file-based routing
- **Svelte 5**: Latest Svelte with modern runes API (`$props()`, `$state()`, `$derived()`)
- **TypeScript**: Full type safety throughout
- **TailwindCSS 4**: Utility-first CSS with Vite plugin integration
- **shadcn-svelte**: Beautiful, accessible component system
- **Redis Integration**: Server-side data persistence
- **Dual Testing Strategy**: Unit tests (Vitest) + E2E tests (Playwright)

## Prerequisites

- Node.js >=22.0.0
- Redis server (for backend functionality)

## Getting Started

1. **Run project dependencies**

   ```sh
   ./scripts/run_dependencies.sh
   ```

2. **Install npm dependencies**:

   ```sh
   npm install
   ```

3. **Set up environment variables**:

   Create a `.env` file, use the `.env.example` as a template:

4. **Start development server**:

   ```sh
   npm run dev
   ```

## Development Commands

```sh
npm run dev          # Development server with HMR
npm run dev --open   # Open in browser automatically
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # Type checking + Svelte validation
npm run lint         # Prettier + ESLint
npm run test         # Run all tests
npm run test:unit    # Unit tests (browser + node environments. check `vitest.config.ts` for details)
npm run test:e2e     # End-to-end tests with Playwright
```

## Testing Strategy

**Component Tests**: Browser-based testing for Svelte components using `vitest-browser-svelte`

- Files: `**/*.svelte.{test,spec}.{js,ts}`

**Server Tests**: Node.js environment for business logic

- Files: `**/*.{test,spec}.{js,ts}` (excluding `.svelte` tests)

**E2E Tests**: Full application testing with Playwright

## Component Management

**Adding shadcn-svelte Components**: Use the CLI to install components from the [shadcn-svelte documentation](https://www.shadcn-svelte.com/docs/components):

```sh
npx shadcn-svelte@latest add [component-name]
```

These components will be added to `src/lib/components/ui/` and automatically registered in the SvelteKit app.
