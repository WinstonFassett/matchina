# Matchina: Strategic Questions & Tradeoffs

This document identifies the key decisions that need to be made before proceeding with implementation work. These are not bugs or maintenance tasks—they are architectural and strategic choices that will shape the library's future.

---

## Question 1: What is the HSM Story?

### The Situation

Two distinct approaches to hierarchical state machines exist:

| Approach | File | Mechanism | Status |
|----------|------|-----------|--------|
| **Propagation** | `propagateSubmachines.ts` | Runtime event routing, child-first descent | Used in demos |
| **Flattening** | `definitions.ts` | Compile-time transformation to dot-keys | Marked "EXPERIMENTAL" |

Both are partially implemented, partially documented, and neither is fully type-safe.

### The Tradeoffs

**Keep Both**
- Pro: Users can choose based on their needs
- Con: Maintenance burden, confusing docs, neither gets full attention
- Con: Type inference differs between approaches

**Pick Propagation (Runtime)**
- Pro: More flexible, supports dynamic child creation
- Pro: Already used in demos, more battle-tested
- Con: Complex implementation (375 lines of recursive logic)
- Con: Type safety is weak (requires `any` casts)

**Pick Flattening (Compile-time)**
- Pro: Simpler mental model (all states at one level)
- Pro: Better potential for type inference
- Con: Less flexible (static structure)
- Con: Less tested, more experimental

**Deprecate HSM Entirely**
- Pro: Dramatically simplifies library
- Pro: Matches "nano-sized" philosophy
- Con: Loses a differentiating feature
- Con: Existing users would need migration path

### Key Sub-Questions

1. Is HSM a core feature or an advanced escape hatch?
2. Should HSM have first-class type safety or is "good enough" acceptable?
3. What's the minimum viable HSM that serves real use cases?

---

## Question 2: What is the API Surface Strategy?

### The Situation

Multiple ways to do the same thing:

**Machine Creation**
- `createMachine()` — Core, returns FactoryMachine
- `matchina()` — Wrapper that adds event methods
- `createMachineFrom()` — From definition object
- `createMachineFromFlat()` — From flattened definition
- `defineMachine()` — Returns definition + factory

**Hook Registration**
- `setup(m)(guard(...), enter(...))` — Functional composition
- `transitionHook({ from, to, guard, enter })` — Declarative config
- `onLifecycle(m, { State: { enter, on: { event } } })` — State-keyed config

### The Tradeoffs

**Consolidate to Fewer APIs**
- Pro: Easier to learn, document, maintain
- Pro: Clearer "one way to do it"
- Con: Breaking changes for existing users
- Con: May lose flexibility for advanced cases

**Keep All, Document Clearly**
- Pro: No breaking changes
- Pro: Power users have options
- Con: Confusing for newcomers
- Con: Docs must explain when to use which

**Layered Approach (Core + Convenience)**
- Pro: Clear separation of concerns
- Pro: Advanced users can use core, beginners use convenience
- Con: Still need to document both layers
- Con: Risk of convenience layer diverging from core

### Key Sub-Questions

1. Is `matchina()` the recommended entry point or is `createMachine()`?
2. Should hook registration have one blessed pattern?
3. Are definition-based APIs (`defineMachine`, etc.) worth keeping?

---

## Question 3: What is the Type Safety Posture?

### The Situation

The library has explicit `any` types in several places:

- `StateMatchbox.data: any` — "to support cross-state access patterns"
- `TransitionEvent.params: any[]` — No parameter typing
- `HierarchicalMachine.send(...params: any[])` — Loses type safety
- Multiple `as any` casts in implementation

### The Tradeoffs

**Maximize Type Safety**
- Pro: Better DX, catch errors at compile time
- Pro: Differentiator vs simpler libraries
- Con: Complex types slow IDE, produce cryptic errors
- Con: May require breaking API changes

**Accept Pragmatic Gaps**
- Pro: Simpler types, faster IDE
- Pro: Easier to maintain
- Con: Runtime errors possible
- Con: Undermines "TypeScript-first" positioning

**Typed Core, Untyped Escape Hatches**
- Pro: Best of both worlds
- Pro: Users can opt into complexity
- Con: Two mental models
- Con: Escape hatches may become the norm

### Key Sub-Questions

1. Is `data: any` acceptable or should it be typed?
2. Should HSM sacrifice type safety for flexibility?
3. How much IDE slowdown is acceptable for better types?

---

## Question 4: What is the Scope of "Nano-Sized"?

### The Situation

The library claims to be "nano-sized" (~3.4 kB full). But it includes:

- Core: matchbox, factory-machine, store-machine, promise-machine
- Extras: effects, delay, when, emitter, subscribe, reset
- Integrations: React, Zod, Valibot
- Experimental: HSM propagation, HSM flattening, definitions

### The Tradeoffs

**Strict Core, Everything Else Optional**
- Pro: Tiny core, users import what they need
- Pro: Clear boundary for maintenance
- Con: May fragment the ecosystem
- Con: Harder to ensure compatibility

**Batteries Included**
- Pro: Works out of the box
- Pro: Consistent experience
- Con: Larger bundle for simple use cases
- Con: More surface area to maintain

**Modular Subpaths**
- Pro: `matchina/core`, `matchina/hsm`, `matchina/react`
- Pro: Tree-shaking friendly
- Con: More complex package.json exports
- Con: Version coordination across subpaths

### Key Sub-Questions

1. Should HSM be in core or a separate subpath?
2. Should extras (effects, delay, etc.) be in core?
3. What's the target bundle size for "core"?

---

## Question 5: What is the Documentation Strategy?

### The Situation

Documentation has:
- Drift from implementation (lifecycle diagram wrong, broken links)
- Multiple entry points (README, docs site, CLAUDE.md)
- Missing guides (StoreMachine, HSM decision guide)
- Experimental features documented alongside stable ones

### The Tradeoffs

**Docs Follow Code**
- Pro: Always accurate
- Pro: Single source of truth
- Con: Experimental features get documented
- Con: May document internal details

**Docs Lead Code**
- Pro: Forces API design discipline
- Pro: User-facing perspective
- Con: Can drift from reality
- Con: Slower iteration

**Tiered Documentation**
- Pro: Stable vs Experimental clearly marked
- Pro: Users know what to rely on
- Con: More structure to maintain
- Con: Risk of "experimental" becoming permanent

### Key Sub-Questions

1. Should experimental features be documented at all?
2. Is README the primary entry point or docs site?
3. How to handle API changes in docs?

---

## Summary: Decision Dependencies

```
Q1 (HSM Story) 
    ↓
Q2 (API Surface) ← depends on HSM decision
    ↓
Q4 (Scope) ← depends on what APIs exist
    ↓
Q3 (Type Safety) ← can be decided in parallel
    ↓
Q5 (Docs) ← follows all other decisions
```

**Recommended Decision Order:**
1. **Q1: HSM Story** — This is the biggest architectural question
2. **Q4: Scope** — What's in core vs optional
3. **Q2: API Surface** — Consolidate based on scope
4. **Q3: Type Safety** — Decide posture for remaining APIs
5. **Q5: Documentation** — Align docs with decisions
