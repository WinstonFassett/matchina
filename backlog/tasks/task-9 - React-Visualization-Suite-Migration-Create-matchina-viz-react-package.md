---
id: task-9
title: React Visualization Suite Migration - Create @matchina/viz-react package
status: Done
assignee: []
created_date: '2026-01-17 20:46'
labels: []
dependencies: []
---

## Description

Create a cohesive React visualization suite package that consolidates React-based visualizers and adds history/time travel capabilities.

**Current State:**
- `src/viz/` has mixed SketchInspector + theme utilities
- Visualizers scattered across multiple packages
- No unified React visualization ecosystem

**Target State:**
```
packages/viz-react/          # NEW - React viz suite
├── inspectors/             
│   ├── html/              # SketchInspector renamed/moved
│   ├── reactflow/         # ReactFlow wrapper
│   └── index.ts
├── history/                 # Time travel, logging
├── theme/                   # React-specific theme utils
└── index.ts

src/viz/                     # Pure utilities only
├── theme.ts                 # Pure CSS theme (no React)
└── index.ts                 # Export theme only
```

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Create packages/viz-react/ package structure
- [x] #2 Move SketchInspector to viz-react/inspectors/html/ (rename to BlockInspector)
- [x] #3 Keep src/viz/theme.ts pure (no React dependencies)
- [x] #4 Create viz-react/theme/ with React-specific theme utilities
- [x] #5 Update docs imports to use new viz-react package
- [x] #6 Add history/time travel foundation in viz-react/history/
- [x] #7 Test viz-react package works in dev server
- [x] #8 Update src/viz/index.ts to export only pure theme utilities
<!-- AC:END -->
