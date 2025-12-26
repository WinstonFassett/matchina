# Matchina: Packaging Strategy

This document explores subpath exports and externalization to inform Decision 4.

---

## Current Package Structure

```
matchina/
├── src/
│   ├── index.ts              # Main exports
│   ├── extras/               # Additional utilities
│   ├── integrations/
│   │   ├── react.ts
│   │   ├── zod.ts
│   │   └── valibot.ts
│   └── nesting/              # HSM code
```

### Current Exports (from index.ts)

Core: `createMachine`, `matchina`, `defineStates`, `matchboxFactory`, etc.
Extras: Mixed into main exports
Integrations: Separate files, imported directly

---

## Goals (From User Feedback)

1. **Avoid pulling in more dependencies than needed**
2. **À la carte imports** — use what you need
3. **Don't care about overall size** (except past 10k)
4. **Care about size check for various combos**
5. **`/react` makes sense as separate**
6. **`/hsm` maybe, not sure**
7. **Zod/Valibot could be `/schema` with peer deps or separate**

---

## Subpath Export Patterns

### Pattern 1: Monolithic with Tree-Shaking

```json
{
  "exports": {
    ".": "./dist/index.js"
  }
}
```

**How it works**: Everything in one entry, bundler tree-shakes unused code.

**Pros**: Simple, one import path
**Cons**: Relies on bundler, may not tree-shake perfectly

### Pattern 2: Explicit Subpaths

```json
{
  "exports": {
    ".": "./dist/index.js",
    "./react": "./dist/integrations/react.js",
    "./hsm": "./dist/nesting/index.js",
    "./zod": "./dist/integrations/zod.js",
    "./valibot": "./dist/integrations/valibot.js"
  }
}
```

**How it works**: Each subpath is a separate entry point.

**Pros**: Explicit control, guaranteed isolation
**Cons**: More config, users must know subpaths

### Pattern 3: Peer Dependencies for Integrations

```json
{
  "peerDependencies": {
    "react": ">=17",
    "zod": ">=3",
    "valibot": ">=0.30"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true },
    "zod": { "optional": true },
    "valibot": { "optional": true }
  }
}
```

**How it works**: Integrations require peer deps, but they're optional.

**Pros**: Clear dependency relationship
**Cons**: Peer dep warnings if not installed

---

## Proposed Structure

### Core (`matchina`)

```typescript
// import { createMachine, defineStates, matchina, ... } from "matchina"

// Includes:
// - matchbox-factory (core tagged unions)
// - factory-machine (state machines)
// - store-machine (simple stores)
// - promise-machine (async handling)
// - event-lifecycle (hooks system)
// - state-machine-hooks (guard, enter, leave, etc.)
// - factory-machine-hooks (transitionHook, etc.)
// - extras (delay, when, emitter, etc.)
```

**Size target**: < 5 kB (current full lib is ~3.4 kB)

### React (`matchina/react`)

```typescript
// import { useMachine, useMachineMaybe } from "matchina/react"

// Peer dep: react >= 17
```

**Size target**: < 500 bytes

### HSM (`matchina/hsm`)

```typescript
// import { createHierarchicalMachine, submachine, ... } from "matchina/hsm"

// Includes:
// - propagateSubmachines (if kept)
// - definitions (defineMachine, flattenMachineDefinition)
// - submachine helper
// - inspect utilities
```

**Size target**: < 2 kB

**Note**: HSM subpath decision depends on Decision 1 (which approach to keep).

### Schema Integrations

**Option A: Separate subpaths**

```typescript
// import { withZod } from "matchina/zod"
// import { withValibot } from "matchina/valibot"
```

**Option B: Combined with peer deps**

```typescript
// import { withZod, withValibot } from "matchina/schema"
// Peer deps: zod (optional), valibot (optional)
```

**Recommendation**: Option A (separate) is simpler and avoids peer dep complexity.

---

## Extras Review

### Current Extras

| Export | Purpose | Keep in Core? |
|--------|---------|---------------|
| `delay` | Promise-based delay | Yes (tiny, useful) |
| `when` | Conditional helper | Yes (tiny, useful) |
| `emitter` | Event emitter | Yes (used internally) |
| `withSubscribe` | Add subscribe to machine | Yes (common pattern) |
| `withReset` | Add reset to machine | Yes (common pattern) |
| `defineEffects` | Effect definition | Maybe separate |
| `handleEffects` | Effect execution | Maybe separate |
| `bindEffects` | Bind effects to machine | Maybe separate |

### Recommendation

Keep all extras in core. They're small and commonly used. Effects system could be separated later if it grows.

---

## Package.json Exports

```json
{
  "name": "matchina",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.mjs",
      "require": "./dist/index.cjs"
    },
    "./react": {
      "types": "./dist/integrations/react.d.ts",
      "import": "./dist/integrations/react.mjs",
      "require": "./dist/integrations/react.cjs"
    },
    "./hsm": {
      "types": "./dist/hsm/index.d.ts",
      "import": "./dist/hsm/index.mjs",
      "require": "./dist/hsm/index.cjs"
    },
    "./zod": {
      "types": "./dist/integrations/zod.d.ts",
      "import": "./dist/integrations/zod.mjs",
      "require": "./dist/integrations/zod.cjs"
    },
    "./valibot": {
      "types": "./dist/integrations/valibot.d.ts",
      "import": "./dist/integrations/valibot.mjs",
      "require": "./dist/integrations/valibot.cjs"
    }
  },
  "peerDependencies": {
    "react": ">=17"
  },
  "peerDependenciesMeta": {
    "react": { "optional": true }
  }
}
```

---

## Size Budget

| Subpath | Target | Notes |
|---------|--------|-------|
| `matchina` | < 5 kB | Core FSM, extras |
| `matchina/react` | < 500 B | Just hooks |
| `matchina/hsm` | < 2 kB | Hierarchy support |
| `matchina/zod` | < 500 B | Thin wrapper |
| `matchina/valibot` | < 500 B | Thin wrapper |
| **Total** | < 10 kB | Well under limit |

---

## Import Patterns for Users

### Basic Usage

```typescript
import { defineStates, matchina } from "matchina";
```

### With React

```typescript
import { defineStates, matchina } from "matchina";
import { useMachine } from "matchina/react";
```

### With HSM

```typescript
import { defineStates, createMachine } from "matchina";
import { createHierarchicalMachine, submachine } from "matchina/hsm";
```

### With Validation

```typescript
import { defineStates, matchina } from "matchina";
import { withZod } from "matchina/zod";
```

---

## Open Questions

1. **Should HSM be in core or separate?** 
   - If flattening is chosen and it's simple, maybe core
   - If propagation is kept, definitely separate (complex)

2. **Should effects be separate?**
   - Currently small, keep in core
   - Revisit if effects system grows

3. **Peer deps for React?**
   - Yes, makes sense
   - Optional peer dep avoids warnings

4. **Zod/Valibot peer deps?**
   - Not needed if separate subpaths
   - Each subpath only used if that lib is installed

---

## Recommendation

| Subpath | Contents | Peer Deps |
|---------|----------|-----------|
| `matchina` | Core FSM, matchbox, lifecycle, extras | None |
| `matchina/react` | useMachine, useMachineMaybe | react (optional) |
| `matchina/hsm` | HSM APIs (TBD) | None |
| `matchina/zod` | withZod | None (import fails if zod not installed) |
| `matchina/valibot` | withValibot | None (import fails if valibot not installed) |

This gives users explicit control over what they import while keeping the core simple.

---

## Next Steps

1. Decide HSM subpath contents (depends on Decision 1)
2. Update package.json exports
3. Update build config for subpaths
4. Update docs with import examples
5. Add size checks for each subpath
