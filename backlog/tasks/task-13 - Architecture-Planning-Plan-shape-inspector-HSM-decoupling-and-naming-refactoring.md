---
id: task-13
title: >-
  Architecture Planning - Plan shape/inspector/HSM decoupling and naming
  refactoring
status: Done
assignee:
  - >-
    Complete AC #4 and #5 - Create refactoring plan for semantic naming and plan
    decoupling strategy
created_date: '2026-01-17 23:23'
updated_date: '2026-01-18 00:20'
labels: []
dependencies: []
ordinal: 3000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Plan architectural improvements and naming consistency.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Analyze shape vs inspector overlap and coupling issues
- [x] #2 Plan HSM detachment from shape/inspector code
- [x] #3 Identify naming inconsistencies (describeHSM, etc.)
- [x] #4 Create refactoring plan for semantic naming
- [x] #5 Plan decoupling strategy (no execution)
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
AC #1 Analysis complete:

**Shape vs Inspector Overlap Issues:**
1. **Duplicate hierarchy walking**: Both shape-builders (buildHierarchicalShape) and inspect.ts (getActiveChain) walk machine hierarchy but for different purposes
2. **Mixed responsibilities**: inspect.ts has runtime inspection (getFullKey, getStack) while shape-builders has static structure analysis  
3. **Re-exports causing confusion**: src/inspect/index.ts re-exports from both hsm/inspect.ts and hsm/shape-types.ts, blurring boundaries
4. **Naming inconsistency**: 'describeHSM' vs other naming patterns

**Key Coupling Problems:**
- Shape builders directly depend on FactoryMachine runtime instances
- Inspection utilities assume specific machine structure (state.data.machine)  
- Visualizers import from both shape and inspect modules, creating tight coupling

**AC #2 HSM Detachment Plan:**

**Current Coupling Issues:**
- shape-builders.ts imports FactoryMachine directly 
- buildHierarchicalShape() requires runtime machine instantiation
- inspect.ts assumes specific machine data structure (state.data.machine)

**Detachment Strategy:**
1. **Create abstraction layer**: Introduce MachineDescriptor interface that both FactoryMachine and flat machines can implement
2. **Separate static vs runtime**: 
   - Static shape analysis should work with machine definitions, not instances
   - Runtime inspection should work with machine instances, not definitions
3. **Remove direct dependencies**: shape-builders should work with abstract interfaces, not concrete FactoryMachine
4. **Clean module boundaries**: 
   - /shape/ - static structure analysis only
   - /inspect/ - runtime introspection only  
   - /hsm/ - machine creation and management

**AC #4 Refactoring Plan for Semantic Naming:**

**Current Naming Issues:**
1. **Inconsistent prefixes**: `describeHSM` vs `buildHierarchicalShape` vs `getActiveChain`
2. **Mixed domains**: Some functions mix HSM-specific terms with generic ones
3. **Ambiguous scope**: `shape` could mean static structure or runtime state
4. **Module confusion**: `/inspect/` contains both shape types and runtime utilities

**Proposed Naming Convention:**
```
Static Analysis (shape/):
- buildMachineStructure()     // Replace buildHierarchicalShape
- createStateDefinition()     // Replace describeHSM  
- getMachineHierarchy()      // Replace hierarchy walking
- analyzeStateTransitions()  // Replace transition analysis

Runtime Inspection (inspect/):
- getActiveStatePath()       // Replace getActiveChain
- getStateStack()           // Keep (clear purpose)
- getCurrentState()         // Replace ambiguous getters
- getMachineInstance()      // Replace runtime machine access

Visualizer Integration:
- useMachineStructure()     // For static structure
- useActiveState()          // For runtime state
- MachineStructureInspector // Replace ambiguous names
```

**Module Reorganization:**
```
src/
├── shape/           # Static analysis only
│   ├── builders.ts  # buildMachineStructure()
│   ├── hierarchy.ts # getMachineHierarchy()
│   └── definition.ts # createStateDefinition()
├── inspect/         # Runtime only  
│   ├── state.ts     # getActiveStatePath()
│   ├── stack.ts     # getStateStack()
│   └── instance.ts  # getMachineInstance()
└── hsm/             # Machine creation/management
```

**AC #5 Decoupling Strategy:**

**Phase 1: Interface Abstraction**
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

**Phase 2: Separation of Concerns**
1. **Shape builders** work with `MachineDescriptor` interface
2. **Inspect utilities** work with `MachineInstance` interface
3. **Visualizers** use appropriate interface for each need
4. **HSM module** implements both interfaces for FactoryMachine

**Phase 3: Migration Path**
1. Add new interfaces alongside existing code
2. Update shape-builders to use MachineDescriptor
3. Update inspect utilities to use MachineInstance  
4. Migrate visualizers one by one
5. Remove old coupling code
6. Update all imports and exports

**Key Benefits:**
- Clear separation of static vs runtime concerns
- Visualizers can work with any machine type
- Easier testing with mock implementations
- Better naming consistency across codebase
- Reduced module coupling and confusion
<!-- SECTION:NOTES:END -->

## Notes
- Planning only, no execution
- Focus on clean boundaries and separation of concerns
- Consider impact on visualizers and HSM integration
- User will handle execution, this is planning phase
