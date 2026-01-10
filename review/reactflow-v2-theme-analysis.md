# ReactFlow V2 Theme Analysis & Fix

## Problem Identified

ReactFlow V2 has incomplete theme support:

1. **Only dark theme overrides exist** - no light theme styles
2. **ReactFlow defaults to dark styling** - so light theme shows dark colors
3. **Missing component-specific styling** - nodes, edges, labels all need theme support

## Current CSS Issues

### What we have:
```css
/* Only DARK theme overrides */
html[data-theme="dark"] .react-flow__node {
  background: #1f2937 !important;
  color: #f9fafb !important;
}
```

### What's missing:
- Light theme node styling
- Light theme edge styling  
- Light theme label styling
- Proper theme switching

## ReactFlow Default Behavior

- ReactFlow uses `colorMode` prop to control theme
- Default styling assumes dark theme
- When `colorMode="light"` - uses light defaults
- When `colorMode="dark"` - uses dark defaults
- When `colorMode="system"` - follows OS preference

## Current Implementation Issues

1. **CSS overrides only target dark theme**
2. **No light theme CSS** - ReactFlow defaults take over
3. **Component styling incomplete** - custom nodes/edges not themed
4. **HARDCODED THEME DETECTION EVERYWHERE** - Anti-pattern found in multiple components

## Theme Detection Anti-Pattern

**Found hardcoded theme detection in:**
- `SimpleNode.tsx`: `document.documentElement.getAttribute('data-theme') === 'dark'`
- `FloatingEdge.tsx`: `document.documentElement.getAttribute('data-theme') === 'dark'`  
- `MermaidInspector.tsx`: `document.documentElement.getAttribute('data-theme') === 'dark'`
- `ReactFlowInspectorV2.tsx`: `document.documentElement.getAttribute('data-theme') === 'dark'`

**This is wrong because:**
1. Duplicates theme logic in every component
2. Breaks when theme system changes
3. Not using the existing `viz/theme.ts` system
4. Hard to maintain and test

## Existing Theme System (Ignored)

The project has a proper theme system at `src/viz/theme.ts`:
- Uses CSS variables with `--matchina-inspector-*` prefix
- Integrates with Starlight theme variables (`--sl-color-*`)
- Provides `InspectorTheme` interface and `defaultTheme`
- Has `generateCSSVariables()` and `applyTheme()` utilities
- Supports both CSS variables and CSS classes

**But NO components actually use it!**

## Proper Solution Strategy

### PROPER APPROACH: Use Existing Theme System

1. **Create a theme hook** that uses the existing `viz/theme.ts` system
2. **Remove all hardcoded theme detection** from components
3. **Use CSS variables** that automatically follow Starlight theme
4. **Apply theme via CSS classes** instead of inline styles

### Implementation Plan

1. **Create `useTheme()` hook** that returns theme-aware values
2. **Update SimpleNode** to use theme hook instead of hardcoded detection
3. **Update FloatingEdge** to use theme hook instead of hardcoded detection  
4. **Update ReactFlowInspectorV2** to use theme hook instead of MutationObserver
5. **Remove all `document.documentElement.getAttribute('data-theme')` calls**

### Theme Hook Design

```typescript
// New hook at viz/useTheme.ts
export function useTheme() {
  return {
    isDark: document.documentElement.classList.contains('dark'),
    colors: {
      nodeBg: 'var(--sl-color-bg)',
      nodeText: 'var(--sl-color-text)',
      nodeBorder: 'var(--sl-color-gray-5)',
      edgeStroke: 'var(--sl-color-gray-6)',
      // etc...
    }
  };
}
```

### CSS Variables Approach

Instead of inline styles, use CSS that automatically follows theme:

```css
.simple-node {
  background: var(--sl-color-bg);
  color: var(--sl-color-text);
  border: 1px solid var(--sl-color-gray-5);
}

.simple-node.active {
  background: var(--sl-color-accent);
  color: var(--sl-color-accent-contrast);
}
```

## Custom Components Needing Refactor

- **SimpleNode.tsx** - Remove hardcoded theme detection, use CSS classes
- **FloatingEdge.tsx** - Remove hardcoded theme detection, use CSS classes  
- **ReactFlowInspectorV2.tsx** - Remove MutationObserver, let ReactFlow handle theme
- **MermaidInspector.tsx** - Remove hardcoded theme detection

## Benefits of Proper Approach

1. **Single source of truth** - Theme logic in one place
2. **Automatic theme following** - CSS variables update with Starlight
3. **Maintainable** - Easy to change theme system
4. **Testable** - Can mock theme hook
5. **Consistent** - All components use same theme system
