---
id: task-21
title: >-
  Migration - Migrate visualizers to new interfaces and naming
status: Pending
assignee:
  - >-
    Update all visualizer packages to use new interfaces and function names
created_date: '2026-01-17 23:36'
updated_date: '2026-01-17 23:36'
labels: []
dependencies: [task-17, task-18, task-19, task-20]
ordinal: 3700
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Migrate all visualizer packages to use the new interfaces, function names, and module structure.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Update viz-reactflow to use new interfaces and naming
- [ ] #2 Update viz-mermaid to use new interfaces and naming
- [ ] #3 Update viz-react to use new interfaces and naming
- [ ] #4 Update all visualizer imports to new module structure
- [ ] #5 Ensure visualizers work with MachineDescriptor/MachineInstance
- [ ] #6 Update visualizer exports and public APIs
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**Phase 3: Migration Path - Visualizer Updates**

**Current Visualizer Structure:**
- All visualizers import from old module locations
- Use old function names (buildHierarchicalShape, getActiveChain, etc.)
- Directly depend on FactoryMachine concrete type

**Target Visualizer Structure:**
- Import from new shape/ and inspect/ modules
- Use new semantic function names
- Work with MachineDescriptor/MachineInstance interfaces

**Migration Steps per Visualizer:**

1. **viz-reactflow (packages/viz-reactflow/src/ReactFlowInspector.ts):**
   ```typescript
   // Before:
   import { buildHierarchicalShape, getActiveChain } from '@matchina/inspect';
   
   // After:
   import { buildMachineStructure } from '@matchina/shape';
   import { getActiveStatePath } from '@matchina/inspect';
   
   // Update usage:
   const structure = buildMachineStructure(machine.toDescriptor());
   const activePath = getActiveStatePath(machine.toInstance());
   ```

2. **viz-mermaid (packages/viz-mermaid/src/MermaidInspector.ts):**
   ```typescript
   // Before:
   import { buildHierarchicalShape } from '@matchina/inspect';
   
   // After:
   import { buildMachineStructure } from '@matchina/shape';
   
   // Update usage:
   const structure = buildMachineStructure(machine.toDescriptor());
   ```

3. **viz-react (packages/viz-react/src/ReactInspector.ts):**
   ```typescript
   // Before:
   import { buildHierarchicalShape, getActiveChain } from '@matchina/inspect';
   
   // After:
   import { buildMachineStructure } from '@matchina/shape';
   import { getActiveStatePath } from '@matchina/inspect';
   
   // Update usage:
   const structure = buildMachineStructure(machine.toDescriptor());
   const activePath = getActiveStatePath(machine.toInstance());
   ```

**Specific Changes per Visualizer:**

**Function Name Updates:**
- `buildHierarchicalShape()` → `buildMachineStructure()`
- `getActiveChain()` → `getActiveStatePath()`
- `describeHSM()` → `createStateDefinition()` (if used)
- `getStack()` → `getStateStack()` (if used)

**Interface Usage:**
- Pass `machine.toDescriptor()` to shape functions
- Pass `machine.toInstance()` to inspect functions
- Update type annotations to use interfaces

**Import Updates:**
- `@matchina/inspect` → split into `@matchina/shape` and `@matchina/inspect`
- Update all import statements
- Update any re-exports

**Component Updates:**
- Rename components if needed (MachineStructureInspector)
- Update props to accept interfaces
- Update internal state management

**Validation per Visualizer:**
- TypeScript compilation passes
- Visualizer builds successfully
- Runtime functionality preserved
- Tests pass with new interfaces
- No regressions in visualization output

**Package Updates:**
- Update package.json dependencies if needed
- Update package exports
- Update any package-level documentation

**Breaking Changes:**
- This is a breaking change for visualizer users
- Update documentation and examples
- Provide migration guide for visualizer users

**Benefits Achieved:**
- Visualizers work with any machine type implementing interfaces
- Clear separation of static vs runtime concerns
- Better type safety and API consistency
- Foundation for future visualizer improvements
<!-- SECTION:NOTES:END -->

## Notes
- Migrate one visualizer at a time to manage complexity
- Test each visualizer thoroughly before moving to next
- Update visualizer documentation and examples
- Consider backward compatibility options if needed
