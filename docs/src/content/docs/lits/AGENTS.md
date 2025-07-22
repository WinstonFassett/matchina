---
title: "AGENTS"
description: "Add description here"
---

# Agent Guidelines for Matchina

## Commands

- **Build**: `npm run build` (lib + docs), `npm run build:lib` (lib only)
- **Test**: `npm test` (types + vitest with coverage), `vitest run` (single run), `vitest dev` (watch mode)
- **Single test**: `vitest run test/machine.test.ts` or `vitest run --grep "test name"`
- **Lint**: `npm run lint` (check), `npm run lint:fix` (fix)
- **Types**: `npm run test:types` (TypeScript check)

## Code Style

- **ESLint**: Uses `eslint-config-unjs`, unused vars prefixed with `_` are allowed
- **Prettier**: Default config (empty .prettierrc)
- **TypeScript**: Strict mode, ESNext target, Node module resolution
- **Imports**: Use relative imports (`./`, `../`), barrel exports in index.ts
- **Naming**: camelCase for functions/variables, PascalCase for types/interfaces
- **Types**: Explicit interface definitions, generic constraints with `extends`
- **Files**: kebab-case for filenames, group related functionality
- **Tests**: Use vitest, describe/it structure, mock with `vi.fn()`
- **Exports**: Prefer named exports, use barrel exports for public API

## Project Structure

- `src/` - Main library code with state machines and utilities
- `test/` - Vitest test files
- `docs/` - Astro documentation site (separate workspace)