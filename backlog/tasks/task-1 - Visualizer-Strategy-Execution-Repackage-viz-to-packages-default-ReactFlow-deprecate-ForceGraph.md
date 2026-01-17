---
id: task-1
title: >-
  Visualizer Strategy Execution - Repackage viz to packages, default ReactFlow,
  deprecate ForceGraph
status: Done
assignee:
  - '@claude'
created_date: '2026-01-17 18:39'
updated_date: '2026-01-17 19:48'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Move visualizers from `src/viz/*` into separate packages and establish ReactFlow as the default visualizer.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 All visualizers moved to individual packages under `packages/viz-*`
- [x] #2 ReactFlow V2 established as default visualizer in docs examples
- [x] #3 Docs example configuration updated to default to ReactFlow
- [x] #4 ForceGraph Inspector deprecated and marked for retirement
- [x] #5 Mermaid support maintained but not defaulted in examples
- [x] #6 Package dependencies work with dev server auto-updates
- [x] #7 Test suite passes: hsm-combobox, hsm-traffic-light, toggle, hsm-checkout, rps-game
- [x] #8 Browser testing: All critical examples load and render ReactFlow correctly
- [x] #9 No console errors in browser for any example
- [x] #10 Delete old SketchInspector files from src/viz/
- [x] #11 Rename sketch-inspector CSS class to block-inspector
- [x] #12 Update BlockInspector component to use block-inspector class
- [x] #13 Update theme.ts comment from SketchInspector to BlockInspector
- [x] #14 Fix BlockInspector smooth scrolling jitter with proper React timing
<!-- AC:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Verify ReactFlow already default (AC #2, #3 may be done)
2. Create package configs for viz-mermaid and viz-forcegraph
3. Move Mermaid files to packages/viz-mermaid
4. Move ForceGraph files to packages/viz-forcegraph
5. Update src/viz/index.ts exports
6. Update MachineVisualizer imports
7. Update example imports (2 files)
8. Test critical examples in browser
<!-- SECTION:PLAN:END -->

## Notes
- Maintain backward compatibility where possible
- Update imports in examples and documentation
- Ensure packages work without rebuilds in dev mode
- Follow existing package structure patterns
