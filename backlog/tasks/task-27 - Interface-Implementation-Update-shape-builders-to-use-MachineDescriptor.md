---
id: task-27
title: >-
  Interface Implementation - Update shape builders to use MachineDescriptor
status: Done
assignee: []
created_date: '2026-01-18 01:30'
labels: []
dependencies: [task-24, task-26]
---

## Description

Update shape builders to work with MachineDescriptor interface instead of direct FactoryMachine coupling.

## Acceptance Criteria
- [x] #1 Update buildMachineStructure() to accept MachineDescriptor
- [x] #2 Remove direct FactoryMachine dependencies from shape builders
- [x] #3 Update createStateDefinition() to work with interface
- [x] #4 Update getMachineHierarchy() to use interface
- [x] #5 Ensure all shape functions work with abstract interface
- [x] #6 Update visualizers to pass MachineDescriptor to shape functions

## Implementation Notes

**Phase 2: Separation of Concerns - Static Analysis**

**Current Problem:**
- Shape builders directly import and depend on FactoryMachine
- `buildMachineStructure()` requires runtime machine instantiation
- Static analysis is coupled to specific machine implementation

**Target Solution:**
- Shape builders work with `MachineDescriptor` interface
- Static analysis works with machine definitions, not instances
- Clean separation between structure analysis and runtime

**Files to Update:**
- `src/shape/builders.ts` - update function signatures
- `src/shape/hierarchy.ts` - update to use interface
- Visualizers to convert machines to descriptors

## Notes
- This is a critical step in the decoupling strategy
- Focus on interface compliance, not functional changes
- May need to enhance MachineDescriptor based on implementation needs
