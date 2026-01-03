# Commit Analysis Report - Mermaid Styling Regression

## Executive Summary

**ROOT CAUSE**: Commit `e6ecf538` deleted 367 lines of working CSS from `MermaidInspector.css` and 60 lines from `mermaid.css`, replacing them with incomplete `themeCSS` that:
1. Uses `themeVariables` with hardcoded colors that Mermaid applies BEFORE CSS
2. Missing critical edge label styling
3. Missing node text color styling for dark mode
4. Gold/yellow background coming from Mermaid's default theme variables

## Commit Timeline (Most Recent First)

### d2c789de - Complete Mermaid flowchart/statechart fixes
- Added post-render CSS injection for cluster labels
- Added nested statechart test
- **Did NOT fix**: node backgrounds, text colors, edge labels

### f87fc441 - Fix stateDiagram compound state syntax
- Removed invalid 'as' keyword
- Syntax fix only, no styling changes

### cfac0a21 - Fix stateDiagram syntax - [*] must come AFTER header
- Fixed initial state placement
- Syntax fix only, no styling changes

### 3bc28379 - Fix flowchart generation - check actual children
- Fixed duplicate nodes issue
- Structure fix only, no styling changes

### 09d81379 - Fix stateDiagram syntax for proper compound state rendering
- More syntax fixes
- No styling changes

### 8d978adf - Major progress - NEW style enhancements mostly working
- Added test files
- **Claimed** styling was working but clearly wasn't

### 573b882b - Fix active grouping styling
- Modified themeCSS for active states
- Incomplete fix

### 82274481 - Implement NEW style enhancements per spec
- Added styling spec document
- Modified themeCSS
- **Still missing**: base node styling, edge labels

### 3099b716 - Fix critical layout issue
- Fixed flat mode showing statechart instead of flowchart
- One line change to example.tsx

### 4089f581 - Fix comprehensive styling issues
- Added 41 lines to themeCSS
- **Still incomplete**

### 9e73260e - Fix consistent grouping node styling
- Minor themeCSS changes
- 8 lines changed

### 8b54fb3f - Restore essential Mermaid node styling to themeCSS
- Added 53 lines of styling
- **Partial restoration** but still missing critical pieces

### f5933616 - Fix CSS import error
- Removed import of deleted MermaidInspector.css
- Added 60 lines to docs/src/components/mermaid.css

### 89d2d335 - Restore generic Mermaid styling
- **REMOVED 86 lines** from themeCSS
- Left only 4 lines
- **MAJOR REGRESSION**

### e6ecf538 - MAJOR: Consolidate all Mermaid styling into single source of truth
- **DELETED** src/viz/MermaidInspector.css (367 lines)
- **DELETED** docs/src/components/mermaid.css (60 lines)
- Added 140 lines to themeCSS
- **THIS IS THE ROOT CAUSE COMMIT**

## Current Issues

### 1. Gold/Yellow Background on Nodes
**Cause**: `themeVariables` in mermaid.initialize() has:
```javascript
primaryColor: '#000',
secondaryColor: '#fff',
background: '#fff',
mainBkg: '#fff',
```
Mermaid's default theme applies these BEFORE CSS, and the CSS isn't overriding them properly.

### 2. Illegible Labels in Dark Mode
**Cause**: Missing text color styling for dark mode. The deleted CSS had:
```css
html[data-theme="dark"] .edgeLabel text {
  fill: #d1d5db !important;
}
html[data-theme="dark"] .edgeLabel p {
  color: #f3f4f6;
  background-color: #374151 !important;
}
```
This is NOT in current themeCSS.

### 3. No Active State Selection
**Cause**: The `.active` class styling exists but:
- `applyHighlights()` may not be applying classes correctly
- CSS specificity may be too low to override Mermaid defaults

### 4. Edge Labels Not Styled
**Cause**: Missing edge label base styling. Deleted CSS had:
```css
.edgeLabel rect {
  fill: var(--sl-color-gray-2) !important;
  stroke: var(--sl-color-gray-4) !important;
}
.edgeLabel p {
  color: var(--sl-color-text-secondary) !important;
}
```

## What Was Lost

From `MermaidInspector.css` (367 lines deleted):
- Dark mode specific edge label styling
- State diagram cluster styling
- Flowchart cluster styling
- Edge visibility fixes
- Interactive edge styling classes

From `mermaid.css` (60 lines deleted):
- Additional cluster styling
- Theme-specific overrides

## Recommended Fix

1. **Change Mermaid theme to 'base' or 'neutral'** instead of 'default' - this gives more control
2. **Restore missing CSS** for:
   - Edge labels (background, text color)
   - Dark mode text colors
   - Node backgrounds (force transparent)
3. **Use higher specificity selectors** to override Mermaid defaults
4. **Consider restoring MermaidInspector.css** as external stylesheet that gets loaded

## Files to Fix

- `/src/viz/MermaidInspector.tsx` - themeCSS and themeVariables

## FIX STATUS: RESOLVED

### Changes Made (commit ab9ed3ac)
1. Changed `theme: 'default'` to `theme: 'base'` for more control
2. Changed themeVariables to use hex colors instead of CSS variables
3. Added missing edge label styling for dark mode
4. Added missing node text styling

### Verified Working
- Node text: `oklch(0.871 0.006 286.286)` - light gray, legible ✅
- Edge labels: light text on dark background ✅
- Transparent node backgrounds ✅
- Accent color borders ✅
- Working compound state structure ✅
