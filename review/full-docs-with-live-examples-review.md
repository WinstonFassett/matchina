# Machina Library Review & Action Items

## Overview

Review of the Machina state machine library covering HSM (Hierarchical State Machine) examples, visualizers, code quality, and documentation. Key themes: simplifying machine definitions, improving visualizer UX, establishing guidelines, and cleaning up type safety issues.

---

## Bugs / Problems

### Visualizer Issues
- **Flattened HSM traffic light diagram** has extra state `working.red` when nested version has `working_red`
- **Bold edge labels in Mermaid** cause label clipping
- **React Flow visualizer** has good UI but poor layout
- **Zoomable visualizers** don't auto-fit content on load
- **Forcecraft visualization** spreads nodes too far; light mode colors need contrast work
- **Interactive button in tutorial picker** appears non-functional
- **Visualizer picker UI** is overdone

### Code Issues
- `shape-store.ts` should use `storeMachine` instead of custom subscribe callback
- Payment actions cast to `any` — typing should work without casting
- `ev` cast to `any` in checkout machine
- Declarative flat module has concerning casts that may lose strong typing
- `parseFlatStateKey` dependency in traffic light view is undesirable
- Empty closures should use `undefined` instead of `() => {}`
- Dynamic event APIs created inline in views (should be on machines)
- Optional chaining on API methods (`actions?.focus`) suggests typing issues

### UI/UX Issues
- Checkout wizard steps overflow in docs (too narrow)
- Rock-scissors-paper requires too much vertical mouse movement
- Advanced fetcher demo diagram too small due to panel count
- No way to simulate payment auth success/failure in checkout UI (stuck in "authorizing")
- Combo box missing tag deletion (X button and backspace)

---

## Features

### High Priority
- Add tag deletion to combo box (click X, backspace key)
- Add payment simulation controls (approve/deny/challenge) to checkout UI
- Show available actions as reusable component
- Support `setup()` pattern for machine configuration and effects

### Visualizer Enhancements
- Partially transparent backgrounds for group nodes
- Transitions on entering/exiting states
- Clickable transitions in Mermaid (even when not visually buttons)
- Better visual distinction between UI area and visualizer area
- Flatten Mermaid options to top-level in picker

### API/DX Improvements
- Rename `createDeclarativeFlatMachine` → `describeHSM` or similar
- Rename `createHierarchicalMachine` → `makeHierarchical` 
- Don't require `data: undefined` in hierarchical structure declarations
- Allow string transition names / exit state names directly
- Support stores for shared context (simplifies parameter threading)
- Consider `machine.create().setup()` chaining pattern

---

## Ideas / Research

### Architecture Questions
- Intermediate representation for HSM → flat conversion?
- Store vs. state for context: tradeoffs around history tracking
- Can parent transition fallback cascade instead of explicit ancestor traversal?
- Type preservation during flattening — verify we're not losing types
- What does the `^` symbol mean in `has:break` and `has:maintenance`?

### Potential Simplifications
- Inline submachines when only used once (lightCycleStage, controllerStates, lifeCycleMachine)
- Use `match` in light UI instead of conditionals (need to think through HSM case)
- Move selected tags, suggestions, highlighted index to store in combo box
- Custom `resolve` hook for `handleTyped` transition selection
- Effect-based highlighting instead of state

### Code Organization
- Review file structure and naming conventions
- `test/flat-machine.mjs` seems misplaced
- Rename `nesting/` → `hsm/`
- Evaluate whether `shape` belongs in HSM module
- `FooBarDemo` in inspectors — what is this?
- Consolidate multiple traffic light implementations or unify styles

### Scale/Tooling
- Parallel AI review ("swarm") might speed up audit
- Puppeteer visual tests to verify states/transitions match across examples

---

## Documentation

### New Docs Needed
- **Guidelines for designing states** — capture learnings and common pitfalls
- **Guidelines for designing transitions** — help AI engineers avoid mistakes
- Elaborate on "type safety" claims in stopwatch overview table
- Clarify "code complexity" metrics and their source

### Existing Docs
- Content in `content/docs/` that doesn't connect to anything
- Clean up and audit existing docs
- E2E content is more review-oriented than actual E2E tests

---

## Examples Audit

### Traffic Light (HSM)
- ✅ Relatively clean, DRY definition
- `parseFlatStateKey` is nice utility
- Views missing from initial review
- Buttons should be side-positioned (use horizontal space)
- Button layout should be stable across state changes
- Buttons should be driven by available actions

### Combo Box (HSM)
- Nested version: verbose, lots of parameter threading
- Flat version: ~20 lines longer than nested
- Both could benefit from store pattern
- Consider shared UI components (`ui.tsx`)
- `dummyStateFactory` / `useMachine` — thought we had this already
- `onMouseDown` instead of `onClick` — why?

### Checkout (HSM)
- Nested: lovely hierarchical machine, clean markup
- Flat: similar structure, some cumbersome state extraction
- `getPaymentFromState` only used once but semantically clear
- Steps defined by index — potential sync issues with states
- Shows state redundantly (nice but redundant)
- Back/exit transitions seem redundant with shipping transition

---

## Code Quality Notes

### Patterns to Enforce
- Inline things unless you need references
- Prefer arrow functions for simple machine creators
- Use `match` for conditional rendering
- Pass action references directly (not wrapped in arrow functions)
- Machines should expose their own event APIs

### Files Needing Review
- `propagate-submachines.ts` — 400 lines, heavily commented, needs tightening
- `shape-builders.ts` — lots going on
- `shape-types.ts` — uncertain about `hierarchy` property
- `shape-controller.ts` — describes a store
- `declarative-flat.ts` — type casting concerns
- All visualizers and inspectors need review

---

## Next Steps

1. **Immediate bugs**: Fix Mermaid clipping, checkout wizard overflow, payment auth UI
2. **Quick wins**: Add combo box tag deletion, auto-zoom visualizers
3. **Guidelines**: Draft state/transition design guidelines
4. **Code audit**: Review type safety in flattening, file organization
5. **Ticket creation**: Break into Beads tickets by category