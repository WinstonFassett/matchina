---
id: task-26
title: >-
  Function Renaming - Implement semantic naming conventions
status: Done
assignee: []
created_date: '2026-01-18 01:25'
labels: []
dependencies: [task-25]
---

## Description

Rename functions across the codebase to implement the semantic naming conventions planned in task 13.

## Acceptance Criteria
- [x] #1 Rename static analysis functions (buildMachineStructure, createStateDefinition, etc.)
- [x] #2 Rename runtime inspection functions (getActiveStatePath, getMachineInstance, etc.)
- [x] #3 Update all function calls across the codebase
- [x] #4 Update visualizer integration functions
- [x] #5 Ensure backward compatibility or clear migration path

## Implementation Notes

**Function Renaming Map:**

**Static Analysis (shape/):**
- `buildHierarchicalShape()` → `buildMachineStructure()`
- `describeHSM()` → `createStateDefinition()` (if exists)
- hierarchy walking functions → `getMachineHierarchy()`
- transition analysis → `analyzeStateTransitions()`

**Runtime Inspection (inspect/):**
- `getActiveChain()` → `getActiveStatePath()`
- `getStack()` → `getStateStack()` (keep name, already clear)
- ambiguous getters → `getCurrentState()`
- runtime machine access → `getMachineInstance()`

**Files to Update:**
- All visualizer packages
- Test files
- Documentation
- Examples

## Notes
- This is a breaking change - plan for coordinated updates
- Focus on one visualizer package at a time to manage complexity
- Keep function implementations identical - only names change
