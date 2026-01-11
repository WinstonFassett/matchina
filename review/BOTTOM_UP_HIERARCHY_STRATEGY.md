# Bottom-up Hierarchy Strategy for Graphviz Algorithms

## The Problem
Graphviz algorithms (circo, twopi) support ELK's `hierarchyHandling` option but may not handle complex hierarchies well:
- **Circo**: Designed for flat graphs with biconnected components
- **Twopi**: Designed for simple tree structures with single root
- **Both**: May not resize parent containers to contain children properly

## Solution: Custom Bottom-up Hierarchy Wrapper

### Approach
Create a wrapper that:
1. **Separates hierarchy** like Grid layout does
2. **Layouts each level independently** using Graphviz algorithms
3. **Resizes parents to contain children** (bottom-up sizing)
4. **Positions children relative to parents**

### Implementation Strategy

#### Option 1: Pre-processing Wrapper
```typescript
class GraphvizLayoutEngine implements LayoutEngine {
  async calculateLayout(nodes, edges, settings) {
    // 1. Separate hierarchy
    const { rootNodes, childNodesMap } = this.separateHierarchy(nodes);
    
    // 2. Layout each hierarchy level independently
    const layoutResults = new Map();
    
    // Layout root nodes first
    const rootLayout = await this.layoutLevel(rootNodes, edges, settings);
    layoutResults.set('root', rootLayout);
    
    // Layout each parent's children
    for (const [parentId, children] of childNodesMap.entries()) {
      const childLayout = await this.layoutLevel(children, edges, settings);
      layoutResults.set(parentId, childLayout);
    }
    
    // 3. Apply bottom-up sizing and positioning
    return this.applyBottomUpHierarchy(rootLayout, layoutResults, childNodesMap);
  }
  
  private async layoutLevel(nodes, edges, settings) {
    // Use Graphviz algorithm for this specific level
    const elkEngine = new ELKLayoutEngine();
    return elkEngine.calculateLayout(nodes, edges, settings);
  }
  
  private applyBottomUpHierarchy(rootLayout, layoutResults, childNodesMap) {
    // Similar to Grid layout's approach
    // 1. Position children relative to parents
    // 2. Resize parents to contain children
    // 3. Return final positioned nodes
  }
}
```

#### Option 2: Post-processing Wrapper
```typescript
class GraphvizLayoutEngine implements LayoutEngine {
  async calculateLayout(nodes, edges, settings) {
    // 1. Run Graphviz algorithm on entire graph
    const flatLayout = await this.runGraphvizLayout(nodes, edges, settings);
    
    // 2. Apply bottom-up hierarchy corrections
    return this.applyBottomUpCorrections(flatLayout, nodes, edges);
  }
  
  private applyBottomUpCorrections(layout, originalNodes, edges) {
    // 1. Identify parent-child relationships
    // 2. Move children inside parents
    // 3. Resize parents to contain children
    // 4. Adjust edge routing
  }
}
```

### Detailed Implementation Plan

#### Step 1: Hierarchy Separation
```typescript
// Reuse Grid layout's approach
separateHierarchy(nodes: Node[]) {
  const rootNodes = nodes.filter(n => !n.parentNode);
  const childNodesMap = new Map<string, Node[]>();
  
  nodes.filter(n => n.parentNode).forEach(child => {
    const parentId = child.parentNode;
    if (!childNodesMap.has(parentId)) {
      childNodesMap.set(parentId, []);
    }
    childNodesMap.get(parentId)!.push(child);
  });
  
  return { rootNodes, childNodesMap };
}
```

#### Step 2: Level-by-Level Layout
```typescript
private async layoutHierarchyLevel(
  levelNodes: Node[], 
  allEdges: Edge[], 
  settings: LayoutSettings,
  algorithm: string
) {
  // Filter edges for this level only
  const levelEdges = allEdges.filter(edge => 
    levelNodes.some(n => n.id === edge.source) ||
    levelNodes.some(n => n.id === edge.target)
  );
  
  // Use ELK engine with specified Graphviz algorithm
  const elkEngine = new ELKLayoutEngine();
  const elkSettings = { ...settings, algorithm };
  
  return elkEngine.calculateLayout(levelNodes, levelEdges, elkSettings);
}
```

#### Step 3: Bottom-up Positioning
```typescript
private applyBottomUpPositioning(
  rootLayout: LayoutResult,
  childLayouts: Map<string, LayoutResult>,
  childNodesMap: Map<string, Node[]>
) {
  const positionedNodes = [...rootLayout.nodes];
  
  // Position each child group relative to its parent
  for (const [parentId, children] of childNodesMap.entries()) {
    const parentNode = positionedNodes.find(n => n.id === parentId);
    const childLayout = childLayouts.get(parentId);
    
    if (parentNode && childLayout) {
      // Position children relative to parent
      const positionedChildren = childLayout.nodes.map(child => ({
        ...child,
        position: {
          x: parentNode.position.x + child.position.x,
          y: parentNode.position.y + child.position.y
        }
      }));
      
      // Calculate bounds and resize parent
      const childBounds = this.calculateBounds(positionedChildren, 20);
      const updatedParent = {
        ...parentNode,
        style: {
          ...parentNode.style,
          width: Math.max(150, childBounds.width + 40),
          height: Math.max(50, childBounds.height + 40),
        },
      };
      
      // Update parent in results
      const parentIndex = positionedNodes.findIndex(n => n.id === parentId);
      positionedNodes[parentIndex] = updatedParent;
      
      // Add positioned children
      positionedNodes.push(...positionedChildren);
    }
  }
  
  return { nodes: positionedNodes, edges: rootLayout.edges };
}
```

### Algorithm-Specific Considerations

#### For Circo (Circular Layouts)
```typescript
// Circo works best with biconnected components
private async layoutCircoLevel(nodes, edges, settings) {
  // May need to break hierarchy into components
  // Each component gets its own circle
  return this.layoutHierarchyLevel(nodes, edges, settings, 'graphviz.circo');
}
```

#### For Twopi (Radial Tree Layouts)
```typescript
// Twopi needs a clear root node
private async layoutTwopiLevel(nodes, edges, settings) {
  // Identify root for this level
  const root = this.findRootNode(nodes, edges);
  const twopiSettings = { ...settings, 'graphviz.root': root };
  
  return this.layoutHierarchyLevel(nodes, edges, twopiSettings, 'graphviz.twopi');
}
```

### Integration Strategy

#### New Layout Engine Classes
```typescript
class CircularLayoutEngine implements LayoutEngine {
  async calculateLayout(nodes, edges, settings) {
    // Use bottom-up wrapper with circo algorithm
    const wrapper = new BottomUpGraphvizWrapper('graphviz.circo');
    return wrapper.calculateLayout(nodes, edges, settings);
  }
}

class RadialTreeLayoutEngine implements LayoutEngine {
  async calculateLayout(nodes, edges, settings) {
    // Use bottom-up wrapper with twopi algorithm
    const wrapper = new BottomUpGraphvizWrapper('graphviz.twopi');
    return wrapper.calculateLayout(nodes, edges, settings);
  }
}
```

#### Registration in LayoutManager
```typescript
constructor() {
  // Register ELK engines for hierarchical layouts
  this.registerEngine(new ELKLayoutEngine());
  
  // Register custom engines for Graphviz algorithms with hierarchy
  this.registerEngine(new CircularLayoutEngine());  // Uses circo + bottom-up
  this.registerEngine(new RadialTreeLayoutEngine()); // Uses twopi + bottom-up
  
  // Keep existing Grid engine
  this.registerEngine(new GridLayoutEngine());
}
```

### Benefits of This Approach

#### ✅ Advantages
1. **True Graphviz algorithms** - Get circo/twopi behavior
2. **Proper hierarchy support** - Bottom-up container sizing
3. **Consistent with Grid** - Reuse proven pattern
4. **Algorithm flexibility** - Easy to add more Graphviz algorithms
5. **Edge routing preservation** - Graphviz edge routing maintained

#### ⚠️ Considerations
1. **Performance** - Multiple layout runs (one per level)
2. **Complexity** - More code than pure ELK approach
3. **Edge routing** - May need adjustment for hierarchy boundaries
4. **Testing** - Need to verify with various hierarchy types

### Implementation Priority

#### Phase 1: Test Pure ELK First
1. Add Graphviz algorithms to ELK schema
2. Test circo/twopi with `hierarchyHandling: INCLUDE_CHILDREN`
3. Evaluate if hierarchy works adequately

#### Phase 2: Bottom-up Wrapper (If Needed)
1. Implement `BottomUpGraphvizWrapper` class
2. Create `CircularLayoutEngine` and `RadialTreeLayoutEngine`
3. Test with complex hierarchies (HSM combobox)

#### Phase 3: Optimization
1. Performance tuning for multiple layout runs
2. Edge routing improvements for hierarchy boundaries
3. Algorithm-specific optimizations

### Decision Criteria

#### Use Pure ELK If:
- Graphviz algorithms handle hierarchy adequately
- Performance is acceptable
- Container resizing works correctly

#### Use Bottom-up Wrapper If:
- Graphviz algorithms don't resize parents properly
- Hierarchy layout quality is poor
- Need fine-grained control over positioning

This approach gives us the best of both worlds: Graphviz's layout algorithms with our proven hierarchy handling pattern.
