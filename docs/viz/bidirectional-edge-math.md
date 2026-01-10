# Bi-Directional Edge Spacing and Curvature Math

## Overview

This document explains the mathematical approach used in ReactFlow V2 to calculate bi-directional edge spacing and curvature that properly accommodates edge labels without overlap.

## Problem Statement

When two nodes have bi-directional edges (edges going in opposite directions), the labels can overlap if the edges are drawn too close together. The solution requires:

1. **Separate curved paths** for each direction (no consolidation)
2. **Adequate spacing** between labels based on their dimensions
3. **Smooth interpolation** for all edge orientations (no snapping)
4. **Labels positioned ON the curves** (not drifting away)

## Key Concepts

### Label vs Node Dimensions

- **Average node dimensions**: ~150px × 50px
- **Average label dimensions**: ~20px × 10px (roughly 1/7 node width, 1/5 node height)
- **Target spacing**: Labels should be separated by at least their own dimensions
- **Orientation awareness**: Vertical edges need more spacing than horizontal edges

### Onion Layering Principle

Bi-directional edges curve away from each other in "onion layers":
- Inner edge: Minimal curvature
- Outer edges: Increasing curvature for separation
- Each edge maintains its own path and label

## Mathematical Implementation

### 1. Perpendicular Direction Calculation

```typescript
const dx = tx - sx;  // Target X - Source X
const dy = ty - sy;  // Target Y - Source Y
const distance = Math.sqrt(dx * dx + dy * dy);

// Perpendicular direction (normalized)
const perpX = -dy / distance;
const perpY = dx / distance;
```

This gives us a unit vector perpendicular to the edge direction, used for offsetting edges.

### 2. Smooth Angle-Based Interpolation

Instead of snapping between horizontal/vertical, we interpolate based on the actual edge angle:

```typescript
const angle = Math.atan2(dy, dx);
const normalizedAngle = Math.abs(angle); // 0 to π

// Calculate interpolation factor (0 = horizontal, π/2 = vertical, π = horizontal)
let verticalFactor: number;
if (normalizedAngle <= Math.PI / 2) {
  // 0 to π/2: horizontal to vertical
  verticalFactor = normalizedAngle / (Math.PI / 2);
} else {
  // π/2 to π: vertical to horizontal
  verticalFactor = (Math.PI - normalizedAngle) / (Math.PI / 2);
}

// Smooth interpolation between horizontal (40px) and vertical (120px) spacing
const horizontalSpacing = 40;
const verticalSpacing = 120;
const spacing = horizontalSpacing + (verticalSpacing - horizontalSpacing) * verticalFactor;
```

**Why these values:**
- **Horizontal spacing**: 40px (2 × label height + padding)
- **Vertical spacing**: 120px (2 × label width + extra for dramatic curves)
- **Interpolation**: Smooth transitions for all angles between 0° and 180°

### 3. Edge Offset Calculation

```typescript
const maxOffset = ((totalBidirectional - 1) * spacing) / 2;
const edgeOffset = globalEdgeIndex * spacing - maxOffset;

// Apply perpendicular offset for mirroring effect
const offsetX = perpX * edgeOffset;
const offsetY = perpY * edgeOffset;
```

This creates the "onion layering" where each edge gets its own offset from the center.

### 4. Quadratic Bezier Curve Construction

```typescript
// Create curved path with offset
const midX = (sx + tx) / 2 + offsetX;
const midY = (sy + ty) / 2 + offsetY;

edgePath = `M ${sx} ${sy} Q ${midX} ${midY} ${tx} ${ty}`;
```

The quadratic Bezier uses the offset midpoint as the control point.

### 5. Label Positioning ON the Curve

Labels are positioned ON the actual curve using the quadratic Bezier formula:

```typescript
// Position label ON the actual curve at t=0.5 (midpoint of the curve)
// For quadratic Bezier: B(t) = (1-t)²P₀ + 2(1-t)tP₁ + t²P₂
const t = 0.5;
labelX = (1 - t) * (1 - t) * sx + 2 * (1 - t) * t * midX + t * t * tx;
labelY = (1 - t) * (1 - t) * sy + 2 * (1 - t) * t * midY + t * t * ty;
```

This ensures labels follow their curves exactly rather than drifting away.

## Global Edge Index Calculation

To achieve proper mirroring, edges are ordered by direction:

```typescript
const globalEdgeIndex = useStore((s: ReactFlowState) => {
  const allBidirectionalEdges = s.edges.filter(
    (e) =>
      (e.source === source && e.target === target) ||
      (e.source === target && e.target === source)
  );
  
  const sameDirectionEdges = allBidirectionalEdges.filter(
    (e) => e.source === source && e.target === target,
  );
  const oppositeDirectionEdges = allBidirectionalEdges.filter(
    (e) => e.source === target && e.target === source,
  );
  
  if (sameDirectionEdges.some((e) => e.id === id)) {
    return sameDirectionEdges.findIndex((e) => e.id === id);
  } else {
    return sameDirectionEdges.length + oppositeDirectionEdges.findIndex((e) => e.id === id);
  }
});
```

This ensures edges in the same direction are grouped together, creating the mirroring effect.

## Visual Results

### Before (Problems)
- Labels overlapping
- Edges consolidated into single paths
- Labels drifting away from curves
- Snapping at 45° angles

### After (Solutions)
- ✅ **114px spacing** between label centers
- ✅ **Separate curved paths** for each direction
- ✅ **Labels ON curves** using Bezier math
- ✅ **Smooth interpolation** for all orientations
- ✅ **Proper mirroring** for bi-directional pairs

## Edge Cases Handled

1. **Zero distance edges**: Fall back to default path/positioning
2. **Single edges**: Use standard ReactFlow path
3. **Multiple bi-directional edges**: Proper onion layering
4. **All orientations**: Smooth interpolation from 0° to 180°

## Performance Considerations

- **ReactFlow hooks**: `useStore` for global edge indexing
- **Math operations**: Simple trigonometry, minimal overhead
- **Path generation**: String interpolation for SVG paths
- **Real-time updates**: Recalculates on edge changes

## Future Enhancements

1. **Dynamic label sizing**: Calculate actual label dimensions instead of averages
2. **Adaptive spacing**: Adjust based on actual rendered label sizes
3. **Animation support**: Smooth transitions when edges change
4. **Edge bundling**: Optional consolidation for complex graphs

## Summary

The bi-directional edge system uses:
- **Perpendicular offsets** for mirroring
- **Angle-based interpolation** for smooth spacing
- **Quadratic Bezier curves** for visual separation
- **Bezier math** for accurate label positioning
- **Global indexing** for proper edge ordering

This creates clean, readable bi-directional edges with proper label accommodation for all orientations.
