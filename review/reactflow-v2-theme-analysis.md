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

## Solution Strategy

### Option 1: Complete CSS Overrides
Add light theme CSS rules for all components:

```css
/* Light theme nodes */
html[data-theme="light"] .react-flow__node {
  background: #ffffff !important;
  color: #111827 !important;
  border: 1px solid #e5e7eb !important;
}

/* Light theme edges */
html[data-theme="light"] .react-flow__edge-path {
  stroke: #6b7280 !important;
}

/* Light theme edge labels */
html[data-theme="light"] .react-flow__edge-text {
  fill: #374151 !important;
}
```

### Option 2: Remove CSS Overrides
Let ReactFlow handle theming completely with `colorMode` prop.

### Option 3: Hybrid Approach
Use ReactFlow's `colorMode` for base styling + CSS for custom components.

## Recommended Fix

Use **Option 3** - ReactFlow handles base theming, CSS only for custom components:

1. Keep `colorMode={colorMode}` in ReactFlow component
2. Remove most CSS overrides 
3. Only override custom components (SimpleNode, FloatingEdge)
4. Add theme-aware styling to custom components

## Custom Components Needing Theme Support

- SimpleNode.tsx - node background, text, border
- FloatingEdge.tsx - edge stroke, label colors
- GroupNode.tsx - group styling

## Implementation Plan

1. Update SimpleNode to detect theme
2. Update FloatingEdge to detect theme  
3. Remove unnecessary CSS overrides
4. Test both themes thoroughly
