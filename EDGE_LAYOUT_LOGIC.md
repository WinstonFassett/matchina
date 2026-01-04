# Edge Layout Algorithm - Living Document

## Core Requirements & Priorities

### 1. **Layout Detection** (HIGH PRIORITY)
- **Pair layouts**: Detect horizontal vs vertical arrangement (2 nodes)
- **Force-directed layouts**: Detect cluster arrangements (3+ nodes)
- **Fallback**: Use nearest terminals for irregular arrangements

### 2. **Terminal Selection** (HIGH PRIORITY)
- **Clockwise flow convention** - maintain consistent rotation
- **Layout-specific rules** - different for pairs vs clusters
- **Avoid node crossings** - edges shouldn't intersect nodes

### 3. **Arrowhead Orientation** (MEDIUM PRIORITY)
- **Angle-based positioning** - calculate proper arrowhead angles
- **Custom path compatibility** - ensure arrows work with `getSpecialPath`
- **ReactFlow integration** - leverage built-in arrow positioning where possible

### 4. **Edge Bundling Logic** (LOW PRIORITY)
- **Single edges**: Standard ReactFlow bezier + layout-based terminals
- **Bundled edges**: `getSpecialPath` with offset-based curvature
- **Label positioning**: Perpendicular to edge direction for bundled edges

## Layout-Specific Rules

### Pair Layouts (2 nodes)
```
Horizontal: Left→Right uses top terminals, Right→Left uses bottom terminals
Vertical: Upper→Lower uses right terminals, Lower→Upper uses left terminals
```

### Force-directed Layouts (3+ nodes)
```
Follow clockwise rotation around node cluster:
- Determine cluster orientation and perimeter
- Select terminals that follow clockwise rotation
- Works for triangles, pentagons, etc.
```

## Implementation Strategy

### Step 1: Layout Detection
```typescript
function detectLayout(nodePositions) {
  // Simple: check if primarily horizontal/vertical (pair)
  // Complex: detect cluster patterns (force-directed)
  // Return: layout type + orientation
}
```

### Step 2: Terminal Selection
```typescript
function selectTerminals(source, target, layoutType) {
  // Apply layout-specific clockwise rules
  // Return: sourceHandle, targetHandle
}
```

### Step 3: Arrowhead Orientation
```typescript
function orientArrowhead(source, target, sourceHandle, targetHandle) {
  // Calculate angle based on terminal positions
  // Ensure arrowhead points in correct direction
  // Handle custom paths vs standard ReactFlow paths
}
```

## Current Implementation Issues

### FIXED: `optimizeEdgeConnections` result was being ignored
The critical bug was that `optimizeEdgeConnections()` was called and calculated correct terminals,
but the result was never used - the code always fell back to `side` for handles.

**Fix applied in `useStateMachineEdges.ts`:**
```typescript
// Use optimized connection points for single edges, side-based for bundled
if (isBidirectional || groupTransitions.length > 1) {
  // Bundled edges: use side-based handles for onion layering
  sourceHandle = side;
  targetHandle = side;
} else {
  // Single edges: use optimized connection points for clockwise flow
  sourceHandle = connectionPoints.source;
  targetHandle = connectionPoints.target;
}
```

### Original Problem: "angle-based" logic was wrong approach
- Was trying to use angles for everything
- Should be detecting **arrangement type first**, then applying appropriate logic

### Correct Approach:
1. **Detect arrangement** (horizontal vs vertical)
2. **Apply layout-specific terminal rules**
3. **Maintain clockwise convention**
4. **Handle bundled vs single edges differently**

## Layout-Specific Rules

### Horizontal Layout
```
Left → Right:  source="top", target="top"
Right → Left:  source="bottom", target="bottom"
```

### Vertical Layout  
```
Upper → Lower: source="right", target="right"
Lower → Upper: source="left", target="left"
```

### Force-directed Layout (Clockwise)
```
Follow perimeter clockwise around node cluster:
- Determine cluster orientation
- Select terminals that follow clockwise rotation
- Avoid crossing through center of cluster
- Works for triangles, pentagons, etc.
```

## Implementation Strategy

### Step 1: Arrangement Detection
```typescript
function detectLayout(nodePositions) {
  // Check if primarily horizontal, vertical, or force-directed
  // Return layout type and orientation
}
```

### Step 2: Terminal Selection
```typescript
function selectTerminals(source, target, layoutType) {
  // Apply layout-specific rules
  // Maintain clockwise convention
  // Return sourceHandle, targetHandle
}
```

### Step 3: Edge Path Generation
```typescript
function generateEdgePath(source, target, terminals, isBundled) {
  // Single edges: standard bezier
  // Bundled edges: getSpecialPath with offsets
}
```

## Questions to Resolve

1. **How to detect force-directed vs pair layouts?**
   - Check if nodes form roughly linear pattern (pair) vs cluster (force-directed)
   - Use angle variance or clustering analysis

2. **How to handle clockwise flow in force-directed layouts?**
   - Determine cluster orientation and perimeter
   - Select terminals that follow clockwise rotation around cluster

3. **How to handle self-transitions?**
   - Need proper loop positioning around the node
   - Avoid overlapping with other edges

4. **How to prioritize bundled vs single edge logic?**
   - Single edges: layout-based terminals + standard bezier
   - Bundled edges: layout-based terminals + special path

## Next Steps

1. **Fix force-directed detection** - distinguish from pair layouts
2. **Implement cluster-based terminal rules** 
3. **Add self-transition handling**
4. **Test with rock-paper-scissors (5 nodes)**
5. **Ensure bundled vs single edge logic works correctly**
