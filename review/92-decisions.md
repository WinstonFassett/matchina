# Matchina: Decision Document (DRAFT)

**Status**: Draft for review  
**Author**: AI Assistant  
**Reviewer**: Winston  

This document proposes decisions for each strategic question identified in `91-questions-tradeoffs.md`. Each decision includes rationale and implications.

---

## Decision 1: HSM Story

### Proposed Decision

**Pick Propagation as the primary HSM approach. Deprecate Flattening.**

### Rationale

1. **Propagation is already in use**: Both HSM demos (`hsm-checkout`, `hsm-combobox`) use propagation
2. **More flexible**: Supports dynamic child creation, which flattening cannot
3. **Flattening has known type issues**: The `FlattenFactoryStateKeys` type uses unbounded template literals
4. **Simpler mental model for users**: "Child machines are real machines" vs "everything is flat keys"

### Implications

- Remove `flattenMachineDefinition`, `createMachineFromFlat` from public API
- Keep `defineMachine`, `defineSubmachine` only if needed for visualization
- Focus type safety efforts on propagation approach
- Update `hsm-nested-vs-flattened` example to show only nested approach

### Open Questions for Review

- [ ] Should `defineMachine` be kept for visualization/tooling purposes?
- [ ] Is there a use case for flattening that propagation can't serve?

---

## Decision 2: API Surface Strategy

### Proposed Decision

**Layered approach: `matchina()` is the recommended entry point. Core APIs remain available for advanced use.**

### Rationale

1. **`matchina()` provides the best DX**: Event methods directly on machine (`machine.next()` vs `machine.send("next")`)
2. **Core APIs needed for library authors**: `createMachine()` is lower-level but necessary
3. **Hook registration**: Keep `setup()` as primary, document `onLifecycle()` as alternative for state-keyed config

### Concrete Changes

| API | Status | Notes |
|-----|--------|-------|
| `matchina()` | **Primary** | Recommended for most users |
| `createMachine()` | Keep | For advanced use, library authors |
| `createMachineFrom()` | Deprecate | Rarely needed |
| `createMachineFromFlat()` | Remove | Per Decision 1 |
| `defineMachine()` | Keep (internal) | For visualization only |
| `setup()` + hooks | **Primary** | `guard()`, `enter()`, etc. |
| `transitionHook()` | Keep | Declarative alternative |
| `onLifecycle()` | Keep | State-keyed alternative |

### Implications

- README quick start uses `matchina()`
- Docs clearly state "start with `matchina()`, use `createMachine()` for advanced cases"
- Remove `createMachineFrom` from exports

### Open Questions for Review

- [ ] Is `transitionHook()` worth keeping or does `onLifecycle()` cover its use cases?
- [ ] Should `createMachine()` be documented at all for beginners?

---

## Decision 3: Type Safety Posture

### Proposed Decision

**Typed core with documented escape hatches. Accept HSM type gaps for now.**

### Rationale

1. **Core FSM should be fully typed**: This is the library's main value proposition
2. **HSM type safety is hard**: Recursive types for arbitrary nesting are complex
3. **Pragmatic approach**: Document where types are weak rather than over-engineer

### Concrete Changes

| Area | Decision |
|------|----------|
| `StateMatchbox.data` | Keep `any` for now, document why |
| `TransitionEvent.params` | Investigate typed params (may be possible) |
| HSM child access | Accept `any` casts, provide typed helper if feasible |
| Complex nested types | Simplify where possible, document limitations |

### Implications

- Add "Type Safety" section to docs explaining known gaps
- Don't block releases on perfect HSM types
- Consider branded types for child machines in future

### Open Questions for Review

- [ ] Is `data: any` acceptable long-term or should it be a priority to fix?
- [ ] Should we invest in typed `params` for transitions?

---

## Decision 4: Scope of "Nano-Sized"

### Proposed Decision

**Modular subpaths: `matchina` (core), `matchina/react`, `matchina/hsm`**

### Rationale

1. **HSM is experimental**: Shouldn't be in core bundle
2. **React is optional**: Not everyone uses React
3. **Tree-shaking friendly**: Users import what they need
4. **Clear stability tiers**: Core is stable, HSM is experimental

### Concrete Structure

```
matchina           → Core FSM, matchbox, lifecycle, extras
matchina/react     → useMachine, useMachineMaybe
matchina/hsm       → propagateSubmachines, createHierarchicalMachine, submachine
matchina/zod       → Zod integration (existing)
matchina/valibot   → Valibot integration (existing)
```

### Implications

- Update `package.json` exports
- HSM demos import from `matchina/hsm`
- Core bundle target: < 2 kB
- HSM can evolve independently

### Open Questions for Review

- [ ] Should `extras` (delay, when, emitter) be in core or separate?
- [ ] What's the acceptable core bundle size?

---

## Decision 5: Documentation Strategy

### Proposed Decision

**Tiered documentation with stability markers. Docs site is primary, README is overview.**

### Rationale

1. **Docs site has interactive examples**: Better learning experience
2. **README should be concise**: Link to docs for details
3. **Experimental features need clear marking**: Users should know what's stable

### Concrete Changes

| Content | Location | Notes |
|---------|----------|-------|
| Overview, install, quick example | README | < 200 lines |
| Guides, API reference | Docs site | Primary learning path |
| Experimental features | Docs site with :::caution | Clear warnings |
| AI assistant guidance | CLAUDE.md, AGENTS.md | Keep separate |

### Stability Tiers

- **Stable**: Core FSM, matchbox, lifecycle, React integration
- **Experimental**: HSM (both approaches until Decision 1 implemented)
- **Internal**: Definition APIs for visualization

### Implications

- Trim README to essentials
- Add stability badges to docs pages
- Fix broken links before adding new content

### Open Questions for Review

- [ ] Should experimental features be in main sidebar or separate section?
- [ ] How to handle deprecation notices in docs?

---

## Summary of Proposed Decisions

| Question | Decision | Confidence |
|----------|----------|------------|
| Q1: HSM Story | Propagation primary, deprecate flattening | High |
| Q2: API Surface | `matchina()` primary, layered approach | High |
| Q3: Type Safety | Typed core, accept HSM gaps | Medium |
| Q4: Scope | Modular subpaths | High |
| Q5: Documentation | Tiered with stability markers | High |

---

## Next Steps (After Review)

1. Finalize decisions based on your feedback
2. Create `93-plan.md` with implementation phases
3. Create beads tickets from plan
4. Execute in priority order
