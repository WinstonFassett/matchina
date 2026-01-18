---
id: task-19
title: >-
  Interface Implementation - Update inspect utilities to use MachineInstance
status: Pending
assignee:
  - >-
    Implement Phase 2 - update runtime inspection to use new interfaces
created_date: '2026-01-17 23:34'
updated_date: '2026-01-17 23:34'
labels: []
dependencies: [task-15, task-17]
ordinal: 3500
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Update inspect utilities to work with MachineInstance interface instead of assuming specific machine structure.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Update getActiveStatePath() to accept MachineInstance
- [ ] #2 Update getStateStack() to work with interface
- [ ] #3 Update getMachineInstance() to return interface type
- [ ] #4 Remove assumptions about machine.data.structure
- [ ] #5 Update visualizers to use MachineInstance interface
- [ ] #6 Ensure runtime inspection works with any machine type
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**Phase 2: Separation of Concerns - Runtime Inspection**

**Current Problem:**
- Inspect utilities assume specific machine data structure (state.data.machine)
- Functions are tightly coupled to FactoryMachine implementation
- Runtime inspection can't work with other machine types

**Target Solution:**
- Inspect utilities work with `MachineInstance` interface
- Runtime inspection works with machine instances, not definitions
- Clean abstraction for runtime state access

**Implementation Steps:**

1. **Update MachineInstance interface (if needed):**
   - Ensure it has all methods needed for runtime inspection
   - Add any missing methods discovered during implementation

2. **Update inspect/state.ts:**
   ```typescript
   // Before:
   export function getActiveStatePath(state: State): string[] {
     // Assumes state.data.machine structure
   
   // After:
   export function getActiveStatePath(instance: MachineInstance): string[] {
     // Uses interface methods only
   ```

3. **Update inspect/stack.ts:**
   ```typescript
   // Before:
   export function getStateStack(state: State): State[] {
     // Assumes specific state structure
   
   // After:
   export function getStateStack(instance: MachineInstance): State[] {
     // Uses interface methods only
   ```

4. **Update inspect/instance.ts:**
   ```typescript
   // Before:
   export function getMachineInstance(state: State): FactoryMachine {
     // Returns concrete type
   
   // After:
   export function getMachineInstance(instance: MachineInstance): MachineInstance {
     // Returns interface type (may be identity function)
   ```

5. **Create adapter/conversion functions:**
   ```typescript
   // Helper to convert State to MachineInstance
   export function createInstanceFromState(state: State): MachineInstance {
     // Wrap existing state in interface adapter
   }
   ```

6. **Update visualizers:**
   - Visualizers need to work with MachineInstance interface
   - Update ReactFlowInspector, MermaidInspector, ReactInspector
   - Use adapter functions where needed for backward compatibility

**Key Changes Required:**
- Remove assumptions about `state.data.machine` structure
- Update function signatures to use MachineInstance
- Update internal logic to use interface methods only
- Add conversion utilities for existing State objects

**Interface Methods Needed:**
```typescript
interface MachineInstance {
  getState(): State;                    // Current state access
  send(event: string): void;            // Event sending
  subscribe(callback: (state: State) => void): () => void; // State changes
  getActivePath(): string[];            // Active state hierarchy
  getStateStack(): State[];             // Stack of active states
}
```

**Validation:**
- Inspect utilities work with MachineInstance interface
- No assumptions about specific machine data structure
- Visualizers can inspect any machine type implementing interface
- TypeScript compilation passes
- Tests pass with new interface usage

**Benefits Achieved:**
- Runtime inspection is decoupled from specific implementations
- Can work with any machine type implementing MachineInstance
- Easier testing with mock instances
- Clear separation of interface vs implementation
- Better type safety for runtime operations
<!-- SECTION:NOTES:END -->

## Notes
- This complements task 18 (static analysis interface implementation)
- Focus on runtime behavior, not static structure
- May need to enhance MachineInstance based on implementation needs
- Keep adapter functions for backward compatibility during transition
