---
id: task-24
title: >-
  Interface Abstraction - Create MachineDescriptor and MachineInstance
  interfaces
status: Done
assignee: []
created_date: '2026-01-18 01:17'
labels: []
dependencies: []
---

## Description

Create core abstraction interfaces to separate static analysis from runtime inspection as planned in task 13.

## Acceptance Criteria
- [x] #1 Create MachineDescriptor interface for static analysis
- [x] #2 Create MachineInstance interface for runtime inspection
- [x] #3 Add interfaces to appropriate module (src/interfaces/)
- [x] #4 Export interfaces from index.ts for visualizer access
- [x] #5 Add TypeScript documentation for all interface properties

## Implementation Notes

**Phase 1: Interface Abstraction**

Based on task 13 planning, create these core interfaces:

```typescript
// New interface for static analysis
interface MachineDescriptor {
  states: Map<string, StateDefinition>;
  transitions: Map<string, TransitionDefinition>;
  hierarchy: Map<string, string>;
  initial: string;
}

// Interface for runtime inspection  
interface MachineInstance {
  getState(): State;
  send(event: string): void;
  subscribe(callback: (state: State) => void): () => void;
}
```

**Files to Create/Modify:**
- `src/interfaces/machine.ts` (new)
- Update module index.ts exports

**Validation:**
- TypeScript compilation passes
- Interfaces can be imported by visualizers
- Documentation is comprehensive and clear

## Notes
- This is Phase 1 of the 3-phase decoupling strategy
- Interfaces must be backward compatible with existing code
- Focus on clean, well-documented abstractions


