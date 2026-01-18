---
id: task-20
title: >-
  HSM Integration - Implement interfaces for FactoryMachine
status: Pending
assignee:
  - >-
    Make FactoryMachine implement MachineDescriptor and MachineInstance
created_date: '2026-01-17 23:35'
updated_date: '2026-01-17 23:35'
labels: []
dependencies: [task-15, task-18, task-19]
ordinal: 3600
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement MachineDescriptor and MachineInstance interfaces for FactoryMachine to complete the abstraction layer.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 FactoryMachine implements MachineDescriptor interface
- [ ] #2 FactoryMachine implements MachineInstance interface
- [ ] #3 Add adapter methods for static structure access
- [ ] #4 Add adapter methods for runtime inspection
- [ ] #5 Ensure backward compatibility with existing FactoryMachine API
- [ ] #6 Update HSM module exports to include interface implementations
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**Phase 2: Separation of Concerns - HSM Integration**

**Current State:**
- FactoryMachine has rich functionality but no formal interface compliance
- Shape builders and inspect utilities need concrete FactoryMachine type
- No clear separation between interface and implementation

**Target State:**
- FactoryMachine implements both MachineDescriptor and MachineInstance
- Clear interface contracts for static and runtime access
- Existing API preserved for backward compatibility

**Implementation Steps:**

1. **Update FactoryMachine class declaration:**
   ```typescript
   export class FactoryMachine implements MachineDescriptor, MachineInstance {
     // Existing implementation
   }
   ```

2. **Implement MachineDescriptor interface:**
   ```typescript
   // Static structure access methods
   get states(): Map<string, StateDefinition> {
     // Extract from machine definition
   }
   
   get transitions(): Map<string, TransitionDefinition> {
     // Extract from machine definition
   }
   
   get hierarchy(): Map<string, string> {
     // Extract from machine definition
   }
   
   get initial(): string {
     // Return initial state
   }
   ```

3. **Implement MachineInstance interface:**
   ```typescript
   // Runtime access methods (may already exist)
   getState(): State {
     // Existing state access
   }
   
   send(event: string): void {
     // Existing event sending
   }
   
   subscribe(callback: (state: State) => void): () => void {
     // Existing subscription
   }
   
   // Additional methods for complete interface
   getActivePath(): string[] {
     // Return active state hierarchy
   }
   
   getStateStack(): State[] {
     // Return stack of active states
   }
   ```

4. **Add adapter methods for backward compatibility:**
   ```typescript
   // Helper methods that bridge old and new APIs
   toDescriptor(): MachineDescriptor {
     return this; // Since it implements the interface
   }
   
   toInstance(): MachineInstance {
     return this; // Since it implements the interface
   }
   ```

5. **Update HSM module exports:**
   ```typescript
   // src/hsm/index.ts
   export { FactoryMachine, MachineDescriptor, MachineInstance } from './factory-machine';
   export type { StateDefinition, TransitionDefinition } from './types';
   ```

6. **Ensure existing API compatibility:**
   - All existing FactoryMachine methods still work
   - Existing property access patterns unchanged
   - No breaking changes to current usage

**Key Considerations:**
- Interface implementation should be thin wrappers around existing functionality
- Don't refactor existing FactoryMachine internals
- Focus on interface compliance, not architectural changes
- May need to add some missing methods to complete interfaces

**Validation:**
- FactoryMachine compiles as implementing both interfaces
- Existing FactoryMachine usage still works
- New interface-based usage patterns work
- TypeScript type checking passes
- All tests continue to pass

**Benefits Achieved:**
- FactoryMachine can be used wherever interfaces are required
- Clear contracts for static and runtime access
- Foundation for other machine types to implement same interfaces
- Better type safety and API clarity
- Complete the abstraction layer
<!-- SECTION:NOTES:END -->

## Notes
- This is the glue that holds the new architecture together
- Focus on interface compliance, not reimplementation
- Preserve all existing FactoryMachine behavior
- This enables the clean separation planned in task 13
