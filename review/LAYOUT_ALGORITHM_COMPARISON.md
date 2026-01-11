# Layout Algorithm Comparison

## Radial vs Circular vs Twopi

### Current Issue
We're using ELK `radial` for "circular" layouts, but:
- **ELK Radial**: Tree-based radial layout ("takes a tree")
- **Graphviz Circo**: True circular layout ("finds biconnected components")
- **Graphviz Twopi**: Radial tree layout ("root at center")

### Algorithm Characteristics

| Algorithm | Type | Graph Requirements | Best For | Current Status |
|-----------|------|-------------------|----------|----------------|
| **ELK Radial** | Radial Tree | Tree (acyclic) | Hierarchical trees | ❌ Broken on cycles |
| **Graphviz Circo** | Circular | Any graph | Cyclic structures | 🔧 Not implemented |
| **Graphviz Twopi** | Radial Tree | Tree (single root) | Rooted trees | 🔧 Not implemented |

### Detailed Analysis

#### ELK Radial (`org.eclipse.elk.radial`)
- **Purpose**: "Takes a tree and places the nodes in radial order around the root"
- **Requirements**: Must be a tree structure
- **Behavior**: Same tree level on same radius
- **Failure**: "The given graph is not a tree!" on cycles
- **Use Case**: True hierarchical trees with single root

#### Graphviz Circo (`org.eclipse.elk.graphviz.circo`)
- **Purpose**: "Finds biconnected components and arranges each component in a circle"
- **Requirements**: Any graph (handles cycles)
- **Behavior**: Emphasizes cycles and biconnected components
- **Advantage**: "Suitable for diagrams of multiple cyclic structures"
- **Use Case**: State machines, networks with cycles

#### Graphviz Twopi (`org.eclipse.elk.graphviz.twopi`)
- **Purpose**: Radial layout with root at center
- **Requirements**: Tree with single root node
- **Behavior**: Root at center, children in concentric circles
- **Advantage**: True radial tree layout
- **Use Case**: Hierarchical data with clear root

## Recommendations

### For "Circular" Layout (Current Broken)
**Replace `radial` with `graphviz.circo`**
- ✅ Handles cycles (traffic light will work)
- ✅ True circular arrangement
- ✅ Perfect for state machines
- ❌ Not a tree layout (different semantic)

### For "Radial" Layout (New Option)
**Add `graphviz.twopi` as separate layout**
- ✅ True radial tree layout
- ✅ Root at center (intuitive)
- ✅ Handles hierarchical trees
- ❌ Requires single root, tree structure

### Layout Naming Strategy
```
Current: "Circular" (broken, uses radial)
Proposal: 
- "Circular" → uses graphviz.circo (for cycles)
- "Radial Tree" → uses graphviz.twopi (for trees)
- OR keep "Radial" but clarify it's tree-only
```

## Implementation Options

### Option 1: Two Separate Layouts
```typescript
const layoutTypes = {
  CIRCULAR: 'graphviz.circo',      // For state machines, cycles
  RADIAL_TREE: 'graphviz.twopi',   // For hierarchical trees
  // ... other layouts
};
```

### Option 2: Smart Circular Layout
```typescript
// Detect graph type and choose algorithm
if (isTree(graph) && hasSingleRoot(graph)) {
  return 'graphviz.twopi';  // Radial tree
} else {
  return 'graphviz.circo';   // Circular for cycles
}
```

### Option 3: Keep Radial, Fix Naming
```typescript
const layoutTypes = {
  RADIAL_TREE: 'radial',     // ELK radial, tree-only
  CIRCULAR: 'graphviz.circo', // True circular
  // ... other layouts
};
```

## Testing Strategy

### Test Cases for Each Algorithm
1. **Traffic Light** (Red → Green → Yellow → Red)
   - ELK Radial: ❌ "Not a tree!" error
   - Graphviz Circo: ✅ Should work (handles cycles)
   - Graphviz Twopi: ❌ "Not a tree!" error

2. **Simple Tree** (Root → Child1, Child2)
   - ELK Radial: ✅ Should work (tree structure)
   - Graphviz Circo: ✅ Should work (any graph)
   - Graphviz Twopi: ✅ Should work (tree with root)

3. **Complex Hierarchy** (HSM combobox)
   - ELK Radial: ❌ May fail (not a simple tree)
   - Graphviz Circo: ✅ Should work (handles complexity)
   - Graphviz Twopi: ❌ May fail (not single root tree)

## Hierarchy Handling Analysis

### ELK Hierarchy Support
**Key Finding**: All Graphviz algorithms (circo, twopi, dot) appear in the ELK hierarchy handling documentation, which means they support ELK's `hierarchyHandling` option.

### Hierarchy Handling Options
- **`INCLUDE_CHILDREN`**: Layout node and descendants in single run (what we use)
- **`SEPARATE_CHILDREN`**: New layout run for each node
- **`INHERIT`**: Use parent's setting

### Algorithm Hierarchy Capabilities

| Algorithm | Hierarchy Support | Expected Behavior | Notes |
|-----------|------------------|-------------------|-------|
| **ELK Radial** | ✅ Supported | Tree hierarchy only | Fails on cycles, but handles tree hierarchy |
| **Graphviz Circo** | ✅ Supported | Flat hierarchy | Designed for biconnected components, not trees |
| **Graphviz Twopi** | ✅ Supported | Root-based hierarchy | "Distance from given root node" |
| **Graphviz Dot** | ✅ Supported | Hierarchical | Alternative to layered algorithm |

### Expected Hierarchy Behavior

#### Graphviz Circo with Hierarchy
- **Likely behavior**: Treat each hierarchy level as separate biconnected components
- **Container handling**: May not resize parents to contain children well
- **Edge routing**: Should handle cross-hierarchical edges
- **Best for**: Flat graphs with cycles, not deep hierarchies

#### Graphviz Twopi with Hierarchy  
- **Likely behavior**: Place root at center, children in concentric circles
- **Container handling**: Should work well with tree-like hierarchies
- **Edge routing**: Good for hierarchical trees
- **Best for**: Tree structures with clear root

#### ELK Radial with Hierarchy
- **Current behavior**: Tree-only, fails on cycles
- **With proper trees**: Should handle hierarchy well
- **Container handling**: ELK's `INCLUDE_CHILDREN` should work
- **Best for**: Pure tree structures

## Updated Recommendations

### For Hierarchical Data (HSM Combobox)
1. **Keep current working layouts**: Sugiyama, Tree, Force, Organic, Grid
2. **Add Graphviz Dot**: Alternative hierarchical algorithm
3. **Avoid Circo/Twopi for hierarchy**: Not designed for complex hierarchies

### For Flat/Cyclic Data (Traffic Light)
1. **Replace Circular with Circo**: Perfect for cycles
2. **Add Twopi as option**: For tree-like flat graphs  
3. **Keep current working**: Force, Organic, Grid

### Implementation Strategy
```typescript
// Algorithm selection by graph type
function selectAlgorithm(graph, layoutType) {
  if (layoutType === 'circular') {
    return 'graphviz.circo'; // Handles cycles
  }
  if (layoutType === 'radial-tree' && isTreeWithRoot(graph)) {
    return 'graphviz.twopi'; // Root-based radial
  }
  if (isHierarchical(graph)) {
    // Use existing ELK algorithms for hierarchy
    return elkAlgorithmMap[layoutType];
  }
  // Default fallbacks
  return elkAlgorithmMap[layoutType];
}
```

## Recommendation

### Immediate Action
**Fix "Circular" layout with `graphviz.circo`**
- Solves the traffic light problem
- Provides true circular layouts
- Perfect for state machines

### Future Enhancement  
**Add "Radial Tree" layout with `graphviz.twopi`**
- Better than ELK radial for trees
- More intuitive root-at-center behavior
- Clear semantic distinction from circular

### Naming Strategy
```
- "Circular" = graphviz.circo (for cycles/state machines)
- "Radial Tree" = graphviz.twopi (for hierarchical trees)
- Keep existing ELK radial as fallback or remove
```

This approach gives users:
- **Circular layouts** for state machines (what they expect)
- **Radial tree layouts** for hierarchical data (clear purpose)
- **No more "not a tree" errors** for common use cases
