# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Navigation

- **`AGENTS.md`** - Session workflow, beads usage, commit patterns
- **`docs/DEVELOPMENT.md`** - Comprehensive development patterns, example structure, testing
- **`docs/FEATURE-CHECKLIST.md`** - Step-by-step checklist for adding features
- **`docs/AGENTS.md`** - Docs-specific patterns (Astro, MDX, examples)

## Project Overview

Matchina is a TypeScript-first library for building type-safe state machines with powerful pattern matching. It's a lightweight, modular toolkit (3.42 kB full library gzipped) published to npm, emphasizing nano-sized primitives that work standalone or composably.

**Core Philosophy:**
- TypeScript-first with powerful type inference
- Nano-sized, opt-in primitives
- Composable APIs that work together or standalone
- Every state/transition is type-inferred with exhaustive pattern matching

**Development Flow:** Core → Tests → Examples → Docs (see `docs/DEVELOPMENT.md`)

## Essential Commands

### Development
```bash
npm run dev              # Run Vitest in watch mode
npm test                 # Run type checks + Vitest with coverage
npm run test:types       # Run TypeScript type checking only
npm run coverage         # Run Vitest with coverage report
```

### Building
```bash
npm run build            # Build library + docs (runs build:lib && build:docs)
npm run build:lib        # Build library with unbuild + size-limit checks
npm run build:docs       # Build documentation site (Astro-based)
npm run test-build       # Validate types + docs integrity
```

### Linting & Formatting
```bash
npm run lint             # Check ESLint + Prettier
npm run lint:fix         # Auto-fix ESLint + Prettier issues
```

### Testing Single Files
```bash
npx vitest run test/matchbox.test.ts           # Run specific test file
npx vitest run test/matchbox.test.ts -t "pattern"  # Run tests matching pattern
```

### Release
```bash
npm run dry-run          # Full release validation without publishing
npm run release          # Test → changelog → publish → push tags
```

## Architecture Overview

### Core Module System

The library is built on **layered primitives** that compose together:

1. **Matchbox** (`matchbox-factory.ts`) - Foundation layer
   - Creates type-safe tagged unions (discriminated unions)
   - Provides `.match()`, `.is()`, `.as()` methods for pattern matching
   - All higher-level state machines are built on this

2. **State Machines** - Three flavors with different use cases:
   - **Factory Machine** (`factory-machine.ts`) - Full-featured state machines with type-safe transitions via `createMachine()`
   - **Store Machine** (`store-machine.ts`) - Simple state containers with transitions via `createStoreMachine()`
   - **Promise Machine** (`promise-machine.ts`) - Async operation state management via `createPromiseMachine()`

3. **Lifecycle System** - Hook into state transitions:
   - `setup()` - Functional API for adding hooks to machines
   - Guards (`guard()`) - Prevent invalid transitions
   - Enter/Leave hooks (`enter()`, `leave()`) - React to state changes
   - Effects (`effect()`, `bindEffects()`) - Handle side effects
   - `onLifecycle()` - Declarative state-specific lifecycle config

4. **Extensions** (`/src/ext`) - Enhancement layers:
   - `funcware/` - Functional middleware (tap, iff, abortable)
   - `methodware/` - Method enhancement utilities
   - `setup.ts` - Main configuration API

5. **Extras** (`/src/extras`) - Optional utilities:
   - `emitter.ts` - Event emitter integration
   - `with-subscribe.ts` - Subscription support
   - `with-reset.ts` - Reset capability
   - `effects.ts`, `bind-effects.ts` - Effect patterns
   - `delay.ts`, `when.ts`, `zen.ts` - Utility functions

6. **Integrations** (`/src/integrations`) - Library bridges:
   - `react.ts` - React hooks (`useMachine`)
   - `zod.ts` - Zod validation
   - `valibot.ts` - Valibot validation

### Key Architectural Patterns

**Type Inference Flow:**
- State definitions → Matchbox factory → Machine → Typed transitions
- Transition parameter types are inferred from destination state constructors
- Pattern matching enforces exhaustiveness at compile time

**Immutability:**
- All state transitions create new state objects
- Compatible with Immer for complex state updates (optional peer dependency)

**Composable Hooks:**
- Multiple hooks can be added via `setup(machine)(guard(...), enter(...), effect(...))`
- Hooks are type-checked against machine's state/event types
- `onLifecycle()` provides declarative per-state hook configuration

## Build System Details

**unbuild Configuration:**
- Builds ESM (`.mjs`) and CJS (`.js`) formats
- Generates TypeScript declarations (`.d.ts`)
- Entry point: `src/index.ts`
- mkdist builder for clean output

**Package Exports:**
- Main: `matchina` (all core features)
- Subpath: `matchina/react` (React integration only)
- Subpath: `matchina/zod` (Zod integration only)
- Subpath: `matchina/valibot` (Valibot integration only)

**Size Monitoring:**
- `.size-limit.json` tracks 18+ entry points
- Bundle size must stay under defined limits
- Run automatically on build via `size-limit` command

## Testing Architecture

**Vitest Configuration:**
- Setup file: `test/vitest-console-groups` for organized console output
- Excludes `**/dev/**` from test runs
- 22 test files covering:
  - Core features (matchbox, machines, promises)
  - Lifecycle hooks
  - Effects and guards
  - Integrations (React, Zod, Valibot)
  - Store machines and methods

**Testing Patterns:**
- Tests validate TypeScript type inference (compile-time safety)
- Tests validate runtime behavior
- Coverage reporting via `@vitest/coverage-v8`

## Documentation Site

**Location:** `/docs` workspace (separate npm workspace)
**Framework:** Astro static site generator
**Build:** `npm run build:docs` or `npm --workspace docs run build`
**Deployment:** GitHub Pages at https://winstonfassett.github.io/matchina/

## Development Workflow

### Adding Features (Quick Reference)

See `docs/FEATURE-CHECKLIST.md` for comprehensive checklist. TL;DR:

1. **Core** - Implement in `/src`, write tests in `/test`
2. **Example** - Create realistic example in `docs/src/code/examples/`
3. **Docs** - Create MDX page, update `astro.config.mjs` sidebar
4. **Verify** - `npm test && npm run build`

### Example Structure (Critical)

See `docs/DEVELOPMENT.md` for details. Every example needs:

```
docs/src/code/examples/example-name/
├── machine.ts         # Export createXyzMachine() function
├── XyzView.tsx        # React component (takes machine prop)
├── example.tsx        # For docs (with MachineExampleWithChart)
└── index.tsx          # Clean export (no wrapper)
```

**CRITICAL:** Always export factory functions, never global instances.

```typescript
// ✅ Correct
export const createToggleMachine = () => { ... };

// ❌ Wrong
export const machine = createMachine(...);
```

### Path Aliases

- `matchina` → `/src/index.ts`
- `matchina/react` → `/src/integrations/react`
- `@code/*` → `docs/src/code/*` (in docs only)
- `@components/*` → `docs/src/components/*` (in docs only)

### Type Safety

- Strict TypeScript mode enabled
- Use type inference over explicit types where possible
- Exhaustive pattern matching is enforced by design
- Keep modules small and focused (nano-sized philosophy)
