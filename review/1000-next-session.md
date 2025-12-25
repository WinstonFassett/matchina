# Matchina Review: Next Session Handoff

## Context

You are continuing a systematic review of the Matchina TypeScript state machine library. The goal is to complete design work before creating implementation tickets.

**Branch**: `hierarchical-machines-with-viz-r5` (HSM code review)

**Session status**: ~50% through design phase. Discovery complete, some decisions made, but key design questions remain unresolved.

---

## What's Been Done

### Review Documents (in `review/`)

| Doc | Content |
|-----|---------|
| `00-context.md` | Conceptual model from README, CLAUDE.md, docs |
| `01-architecture.md` | Core abstractions, responsibility boundaries |
| `02-api-surface.md` | All exports, redundancies, naming issues |
| `03-hsm-semantics.md` | HSM behavior, edge cases, ambiguities |
| `04-types.md` | Type architecture, complexity, `any` usage |
| `05-docs.md` | Doc structure, drift, broken links (9 found) |
| `06-demo.md` | Demo as validation artifact |
| `90-synthesis.md` | Summary of findings, risk areas |
| `91-questions-tradeoffs.md` | 5 strategic questions identified |
| `92-decisions.md` | Decisions made (see below) |
| `93-hsm-deep-dive.md` | Flattening vs propagation analysis |
| `94-api-brainstorm.md` | API alternatives explored |
| `95-packaging.md` | Subpath strategy |
| `96-visualizers.md` | Current viz infrastructure review |
| `97-conversation-notes.md` | Ongoing discussion, XState research |
| `98-work-organization.md` | Pre-merge vs post-merge breakdown (PREMATURE) |

### Decisions Made

| Decision | Resolution |
|----------|------------|
| HSM approach | Both; flattening primary, propagation experimental |
| API: replace `matchina()` | Use `.extend()` pattern (tree-shakeable) |
| Type safety | No `any` in type definitions |
| HSM packaging | Single `matchina/hsm`, tree-shaking handles rest |
| Visualizers | Incubate in docs, externalize later |
| Docs strategy | Docs follow code, README = condensed docs |

---

## Unresolved Design Concerns

These need design work before we can create implementation tickets:

### 1. Manifest/Instrumentation for Viz

**Question**: What does a machine expose for visualization?

**Current state**: 
- `getXStateDefinition()` exists in docs (not core)
- Converts machine to XState-like format
- Works for flat machines, fragile for HSM

**Needs design**:
- What's the minimal "manifest" interface?
- How do flattened machines expose hierarchy?
- How do propagated machines expose hierarchy?
- Should this be in core or `matchina/inspect`?

### 2. `.extend()` Type Signature

**Question**: How does `.extend()` work and compose?

**Decision made**: Use `.extend()` pattern to replace `matchina()`

**Needs design**:
- Type signature: `extend<T>(fn: (m: Machine) => T): T` or something else?
- How do multiple extensions compose?
- Does it return a new machine or mutate?
- What extensions exist? (`withEventApi`, `withSubscribe`, `withReset`)

### 3. HSM: Flattening vs Propagation Reconciliation

**Question**: How do these coexist?

**Decision made**: Both kept; flattening primary, propagation experimental

**Needs design**:
- Do they share code or are they independent?
- How does each expose manifest for viz?
- What's the API difference from user perspective?
- Should propagation be marked deprecated or just experimental?

### 4. Type Efficiency

**Question**: How to improve type performance?

**Identified issues** (from `04-types.md`):
- Complex template literal types in flattening
- Recursive types for HSM
- `any` in type definitions

**Needs**:
- Run TypeSlayer analysis
- Identify specific bottlenecks
- Design simpler alternatives

---

## What NOT to Do

- **Don't jump to implementation** — design first
- **Don't create tickets yet** — need design resolution
- **Don't treat `98-work-organization.md` as final** — it was premature

---

## Suggested Approach

1. **Pick one unresolved concern** and design it thoroughly
2. **Work through the implications** — how does it affect other concerns?
3. **Document the design** in a new review doc (e.g., `101-manifest-design.md`)
4. **Iterate** until all 4 concerns are resolved
5. **Then** create implementation plan and tickets

---

## Key Files to Reference

**Core library**:
- `src/factory-machine.ts` — main machine creation
- `src/matchina.ts` — current `matchina()` wrapper
- `src/nesting/propagateSubmachines.ts` — propagation (375 lines, complex)
- `src/definitions.ts` — flattening (~150 lines)
- `src/nesting/inspect.ts` — inspection utilities

**Visualization** (in docs):
- `docs/src/components/inspectors/` — all visualizers
- `docs/src/code/examples/lib/matchina-machine-to-xstate-definition.ts` — XState adapter

**Types**:
- `src/factory-machine-types.ts`
- `src/definition-types.ts`
- `src/matchbox-factory-types.ts`

---

## User Preferences (from this session)

- Verbs are good for function names
- Don't like `matchina()` as function name
- Prefer tree-shakeable, à la carte imports
- Good TS support is most important
- Flattening feels more algebraic/straightforward than propagation
- Viz should not mandate React
- Actions with params: allow in viz, clicks no-op if params missing (future feature)
- "Make it work. Do not get fancy."

---

## Starting Point

Ask the user which unresolved concern to tackle first:
1. Manifest/instrumentation for viz
2. `.extend()` type signature
3. HSM reconciliation
4. Type efficiency

Or propose an order based on dependencies (manifest design probably informs HSM reconciliation).
