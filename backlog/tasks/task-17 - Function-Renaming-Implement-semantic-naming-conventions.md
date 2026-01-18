---
id: task-17
title: >-
  Function Renaming - Implement semantic naming conventions
status: Pending
assignee:
  - >-
    Rename all functions to match new semantic naming conventions
created_date: '2026-01-17 23:32'
updated_date: '2026-01-17 23:32'
labels: []
dependencies: [task-16]
ordinal: 3300
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Rename functions across the codebase to implement the semantic naming conventions planned in task 13.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Rename static analysis functions (buildMachineStructure, createStateDefinition, etc.)
- [ ] #2 Rename runtime inspection functions (getActiveStatePath, getMachineInstance, etc.)
- [ ] #3 Update all function calls across the codebase
- [ ] #4 Update visualizer integration functions
- [ ] #5 Ensure backward compatibility or clear migration path
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
**Function Renaming Map (from task 13):**

**Static Analysis (shape/):**
- `buildHierarchicalShape()` → `buildMachineStructure()`
- `describeHSM()` → `createStateDefinition()`
- hierarchy walking functions → `getMachineHierarchy()`
- transition analysis → `analyzeStateTransitions()`

**Runtime Inspection (inspect/):**
- `getActiveChain()` → `getActiveStatePath()`
- `getStack()` → `getStateStack()` (keep name, already clear)
- ambiguous getters → `getCurrentState()`
- runtime machine access → `getMachineInstance()`

**Visualizer Integration:**
- Update to use `useMachineStructure()` for static structure
- Update to use `useActiveState()` for runtime state
- Component names → `MachineStructureInspector`

**Implementation Steps:**
1. **Rename functions in their new modules:**
   - Update function definitions in shape/ and inspect/ files
   - Keep implementations identical initially
   - Add JSDoc comments explaining new naming

2. **Update all function calls:**
   - **Visualizers**: 
     - `packages/viz-reactflow/src/ReactFlowInspector.ts`
     - `packages/viz-mermaid/src/MermaidInspector.ts` 
     - `packages/viz-react/src/ReactInspector.ts`
   - **Test files**: All test files using old function names
   - **Examples**: Any example code using old names
   - **Documentation**: Update code examples in docs

3. **Update exports and imports:**
   - Ensure new function names are exported correctly
   - Update any import statements using named imports
   - Verify default exports still work

4. **Handle backward compatibility:**
   - Option A: Add old function names as deprecated aliases
   - Option B: Breaking change with clear migration guide
   - Recommend Option B for clean architecture

**Specific Files to Update:**
- `src/shape/builders.ts` - rename `buildHierarchicalShape`
- `src/shape/definition.ts` - rename `describeHSM`
- `src/shape/hierarchy.ts` - rename hierarchy functions
- `src/inspect/state.ts` - rename `getActiveChain`
- `src/inspect/instance.ts` - rename runtime access functions
- All visualizer packages
- All test files
- Documentation files

**Validation:**
- TypeScript compilation passes with new names
- All visualizers still work correctly
- All tests pass with updated function calls
- No remaining references to old function names
- Clear, semantic naming throughout codebase

**Impact Assessment:**
- High impact - affects all visualizers and tests
- Breaking change - all dependent code needs updates
- Essential for long-term maintainability
<!-- SECTION:NOTES:END -->

## Notes
- This is a breaking change - plan for coordinated updates
- Focus on one visualizer package at a time to manage complexity
- Keep function implementations identical - only names change
- Update tests immediately to prevent regressions
