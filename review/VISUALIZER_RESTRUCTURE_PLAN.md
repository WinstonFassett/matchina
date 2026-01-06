# Visualizer Restructure Plan

## Current Situation (feature branch)
- Visualizers are in `src/viz/` (in the main library)
- This adds heavy dependencies to the core package
- Want to move them back to docs where they belong

## Target Structure (main branch)
- Visualizers live in `docs/src/components/inspectors/`
- Generic shape transforms go to core library
- UI components stay in docs

## Files to Move Back to Docs

### From `src/viz/` → `docs/src/components/inspectors/`
- `ForceGraphInspector.tsx` → `docs/src/components/inspectors/ForceGraphInspector.tsx`
- `ForceGraphInspector/` → `docs/src/components/inspectors/ForceGraphInspector/`
- `MermaidInspector.tsx` → `docs/src/components/inspectors/MermaidInspector.tsx`
- `MermaidInspector.css` → `docs/src/components/inspectors/MermaidInspector.css`
- `SketchInspector.tsx` → `docs/src/components/inspectors/SketchInspector.tsx`
- `SketchInspector.css` → `docs/src/components/inspectors/SketchInspector.css`
- `ReactFlowInspector/` → `docs/src/components/inspectors/ReactFlowInspector/`

### Generic Parts to Extract to Core Library

#### From `src/viz/ReactFlowInspector/utils/shapeToReactFlow.ts` → `src/hsm/shape-transforms.ts`
- `ReactFlowGraphData` interface
- `buildReactFlowGraph()` function
- Related types

#### From `src/viz/ForceGraphInspector/utils/shapeToForceGraph.ts` → `src/hsm/shape-transforms.ts`
- `ForceGraphNode` interface
- `ForceGraphLink` interface  
- `ForceGraphData` interface
- `buildForceGraphData()` function
- Related types

#### From `src/viz/theme.ts` → `src/inspect/themes.ts`
- `InspectorTheme` interface
- `defaultTheme` export
- `generateCSSVariables()` function
- `applyTheme()` function

## Files to Remove from Core
- `src/viz/` entire directory (after extracting generic parts)
- Remove viz exports from `package.json` exports

## Import Updates Needed

### In docs components that use viz:
- Update `from "matchina/viz"` → `from "../../../inspectors"`
- Update `from "matchina/viz/ReactFlowInspector"` → `from "./ReactFlowInspector"`
- Update generic transform imports → `from "matchina/hsm/shape-transforms"`

### In core library:
- Add new exports to `package.json` for shape transforms
- Update `src/index.ts` to re-export generic functions

## Benefits
1. **Core library stays nano** - No heavy viz dependencies
2. **Generic transforms available** - Others can build visualizers
3. **Hot reload preserved** - All UI stays in docs
4. **Minimal diff** - Components return to original locations
5. **Clean separation** - Data transformation vs presentation

## Execution Order
1. Extract generic parts to core
2. Move visualizer components back to docs
3. Update imports in docs
4. Remove viz exports from package.json
5. Clean up any remaining references
6. Test that everything works
