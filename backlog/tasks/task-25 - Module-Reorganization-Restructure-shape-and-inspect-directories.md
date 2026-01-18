---
id: task-25
title: >-
  Module Reorganization - Restructure shape and inspect directories
status: Done
assignee: []
created_date: '2026-01-18 01:20'
labels: []
dependencies: [task-24]
---

## Description

Reorganize module structure to separate static analysis from runtime inspection with clear boundaries.

## Acceptance Criteria
- [x] #1 Create new shape/ directory structure (builders.ts, hierarchy.ts, definition.ts)
- [x] #2 Create new inspect/ directory structure (state.ts, stack.ts, instance.ts)
- [x] #3 Move existing functions to appropriate new modules
- [x] #4 Update all imports across the codebase
- [x] #5 Remove old mixed-responsibility files
- [x] #6 Update module index.ts exports

## Implementation Notes

**Target Module Structure:**
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

**Current Files to Reorganize:**
- `src/hsm/shape-builders.ts` → split into shape/builders.ts, shape/hierarchy.ts
- `src/hsm/inspect.ts` → split into inspect/state.ts, inspect/stack.ts, inspect/instance.ts
- `src/hsm/shape-types.ts` → move to shape/definition.ts

## Notes
- This is a significant refactoring - update imports carefully
- Keep function implementations the same initially (renaming comes later)
- Focus on structural reorganization, not functional changes yet
