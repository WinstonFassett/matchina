# Matchina: Decision Document (DRAFT)

**Status**: Draft for review — Updated with user feedback  
**Author**: AI Assistant  
**Reviewer**: Winston  

This document proposes decisions for each strategic question identified in `91-questions-tradeoffs.md`. Each decision includes rationale and implications.

---

## Decision 1: HSM Story

### Status: NEEDS DEEPER ANALYSIS

**See `93-hsm-deep-dive.md` for detailed exploration.**

### User Feedback

- Devs want a way to compose machines — how is flexible
- Lean towards **flattening** if we can visualize as hierarchy based on nested naming
- Static is generally better for state machines
- Propagation implementation complexity argues against it
- Propagation's main benefit: stitching together looser confederation of things
- Flattening worked almost immediately; propagation has been a PITA
- Need to explore: are there scenarios requiring loose composition?

### Revised Direction

**Lean towards Flattening, but need deeper analysis first.**

| Approach | Pros | Cons |
|----------|------|------|
| Flattening | Static (good for FSM), worked quickly, simpler impl | Type inference challenges, visualization needs work |
| Propagation | Loose composition, dynamic children | Complex impl (375 lines), has been problematic |

### Key Questions to Resolve

1. Can flattened keys be visualized as hierarchy? (e.g., `Working.Red` renders as nested)
2. What are the real-world use cases for loose composition?
3. Can we improve flattening's type inference?
4. Should both exist for different use cases, or pick one?

### Action

- [ ] Create `93-hsm-deep-dive.md` with detailed pros/cons analysis
- [ ] Brainstorm alternative hierarchy approaches
- [ ] Research how other libs handle definitions + visualization

---

## Decision 2: API Surface Strategy

### Status: NEEDS DEEPER ANALYSIS

**See `94-api-brainstorm.md` for detailed exploration.**

### User Feedback

- Open to suggestions on API surface
- Layering is the right idea: small core(s) with composable layers
- Flexibility in hook registration is good — varies by dev preference
  - `setup()` + functions is user's preference
  - `transitionHook()` is new, liked
  - `onLifecycle()` was "abomination" but XState users might like it
- `matchina()` vs `createMachine()` confusion exists because didn't want to force API layer
- Goal: à la carte and minimal footprint based on what's used
- Not "one way" but "common way(s)"
- Definitions exist mainly for runtime inspection and viz — simpler without them
- Care about exposing definitions at runtime for visualizers
- Need to research: how do libs with definitions + instances do it well?

### Revised Direction

**Layered, à la carte approach. Need to brainstorm API from scratch.**

| Concern | Current State | Direction |
|---------|---------------|-----------|
| Machine creation | `matchina()` vs `createMachine()` confusing | Clarify roles, maybe rename |
| Hook registration | 3 patterns exist | Keep flexibility, document preferences |
| Definitions | Exist for viz, add complexity | Research other libs' approaches |
| Bundle size | Want minimal footprint | À la carte imports |

### Key Questions to Resolve

1. What would the API look like if designed from scratch?
2. How do other libs handle definitions vs instances elegantly?
3. Should `matchina()` and `createMachine()` be renamed for clarity?
4. Which hook patterns to keep/consolidate?

### Action

- [ ] Create `94-api-brainstorm.md` with fresh API exploration
- [ ] Research other libs (XState, Zustand, Redux Toolkit) for patterns
- [ ] Explore definitions vs instances separation

---

## Decision 3: Type Safety Posture

### Status: DECIDED (with caveats)

### User Feedback

- Type safety is **ESSENTIAL**
- Should generally not use `any` in type definitions
- Flexible on `any` in implementations — those are nits
- Prefer maximize type safety with pragmatic gaps

### Decision

**Maximize type safety. No `any` in type definitions. Pragmatic gaps in implementations only.**

| Area | Decision |
|------|----------|
| Type definitions | **No `any`** — find proper types or use `unknown` |
| Implementations | `any` acceptable as pragmatic escape hatch |
| `StateMatchbox.data` | Should be typed, not `any` — needs fix |
| `TransitionEvent.params` | Should be typed — investigate |
| HSM types | Maximize safety; document remaining gaps |

### Implications

- Audit type definitions for `any` usage
- Replace `any` with proper types or `unknown`
- Implementation `any` casts are acceptable
- Document any remaining type gaps clearly

### Action

- [ ] Audit all type definition files for `any` usage
- [ ] Create tickets to fix `any` in type definitions
- [ ] Investigate typed `params` for transitions

---

## Decision 4: Scope & Packaging

### Status: NEEDS DEEPER ANALYSIS

**See `95-packaging.md` for detailed exploration.**

### User Feedback

- `/react` makes sense as separate
- `/hsm` maybe, not sure
- Don't care about overall bundle size (except past 10k)
- Care about size check for various combos being good
- Extras deserves review but probably ok
- Goal: avoid pulling in more dependencies than needed
- Zod/Valibot: could be `matchina/schema` with peer deps, or separate packages

### Revised Direction

**Modular subpaths, but need to analyze what goes where.**

| Subpath | Contents | Status |
|---------|----------|--------|
| `matchina` | Core FSM, matchbox, lifecycle, extras | Review extras |
| `matchina/react` | useMachine, useMachineMaybe | Confirmed |
| `matchina/hsm` | HSM APIs (TBD based on Decision 1) | Maybe |
| `matchina/zod` | Zod integration | Keep or merge to /schema |
| `matchina/valibot` | Valibot integration | Keep or merge to /schema |

### Key Questions to Resolve

1. Should Zod + Valibot be merged into `matchina/schema` with peer deps?
2. What belongs in extras vs separate subpath?
3. Should HSM be a subpath or just part of core?

### Action

- [ ] Create `95-packaging.md` with subpath analysis
- [ ] Review extras contents
- [ ] Research peer deps pattern for schema integrations

---

## Decision 5: Documentation Strategy

### Status: DECIDED

### User Feedback

- Doc strategy: **docs follow code**
- README is essentially a single-page reduction of docs site — they should be aligned

### Decision

**Docs follow code. README is single-page reduction of docs site.**

| Principle | Implementation |
|-----------|----------------|
| Docs follow code | Update docs when code changes, not before |
| README = condensed docs | README mirrors docs site structure, just shorter |
| Alignment | README and docs site should not contradict |

### Concrete Changes

| Content | Location | Notes |
|---------|----------|-------|
| Overview, install, quick example | README | Condensed version of docs |
| Full guides, API reference | Docs site | Primary learning path |
| Experimental features | Both, with warnings | Clear :::caution markers |

### Implications

- README structure should mirror docs site sections
- When docs change, README should be updated to match
- Fix broken links (already identified)
- Remove README duplicates (already identified)

### Action

- [ ] Align README structure with docs site
- [ ] Fix broken links (9 identified)
- [ ] Remove duplicate sections in README

---

## Summary of Decisions

| Question | Status | Direction |
|----------|--------|-----------|
| Q1: HSM Story | **DECIDED** | Both approaches; flattening primary, propagation experimental |
| Q2: API Surface | **DECIDED** | `.extend()` pattern replaces `matchina()` |
| Q3: Type Safety | **DECIDED** | Maximize safety, no `any` in type defs |
| Q4: Scope & Packaging | **DECIDED** | `matchina/hsm` (tree-shake), viz incubate in docs |
| Q5: Documentation | **DECIDED** | Docs follow code, README = condensed docs |

---

## Documents Created

| Document | Purpose | Status |
|----------|---------|--------|
| `93-hsm-deep-dive.md` | Detailed HSM analysis, alternative approaches | ✓ Complete |
| `94-api-brainstorm.md` | API from scratch, definitions vs instances | ✓ Complete |
| `95-packaging.md` | Subpath analysis, what goes where | ✓ Complete |
| `96-visualizers.md` | Inspection and interactive viz review | ✓ Complete |
| `97-conversation-notes.md` | Ongoing discussion and decisions | ✓ Complete |
| `98-work-organization.md` | Pre-merge vs post-merge task breakdown | ✓ Complete |

---

## Open Actions Summary

See `98-work-organization.md` for full breakdown.

### Pre-Merge (This Branch)
- [ ] Implement `.extend()` on FactoryMachine
- [ ] Refactor `matchina()` to use `.extend()` or deprecate
- [ ] HSM packaging (`matchina/hsm`)
- [ ] Mark propagation as experimental
- [ ] Fix 9 broken doc links
- [ ] Remove README duplicates

### Post-Merge
- [ ] TypeSlayer analysis (beads ticket with context)
- [ ] Fix `any` in type definitions
- [ ] Design viz manifest format
- [ ] Externalize visualizers from docs
