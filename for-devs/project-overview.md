# Project Overview

Matchina is a TypeScript-first library for building type-safe state machines with powerful pattern matching. It's a lightweight, modular toolkit (3.42 kB full library gzipped) published to npm, emphasizing nano-sized primitives that work standalone or composably.

## Core Philosophy
- **TypeScript-first** with powerful type inference
- **Nano-sized, opt-in primitives** - Use only what you need
- **Composable APIs** that work together or standalone
- **Type-safe** - Every state/transition is type-inferred with exhaustive pattern matching

## Development Flow
**Core → Tests → Examples → Docs**

```
/src (implement) → /test (verify) → examples (demonstrate) → docs (explain)
```

## Key Principles
- **Beyond unit tests**, we use realistic examples as living documentation and integration tests
- **Type safety first** - Strict TypeScript mode, no `as any` or `@ts-ignore`
- **Factory functions** - Always export factory functions, never global instances
- **Immutability** - State transitions create new states, don't mutate existing ones

## Package Structure
```
packages/
├── viz-reactflow/     # Default visualizer
├── viz-mermaid/        # Mermaid support
└── viz-forcegraph/    # Legacy (deprecated)
```

## Critical Examples
These examples must work and serve as integration tests:
- hsm-combobox ✓
- hsm-traffic-light ✓
- toggle ✓
- hsm-checkout ✓
- rock-paper-scissors ✓

## Size and Performance
- **Full library**: 3.42 kB gzipped
- **Individual primitives**: 381B - 1.18 kB gzipped
- **Zero dependencies** for core functionality
