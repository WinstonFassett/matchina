# ReactFlow Layout Engine Research & Analysis

## Overview
Comprehensive research on ReactFlow layout engines, ELK algorithms, and potential improvements for our ReactFlow V2 implementation.

## ReactFlow Layout Engine Landscape

### Popular Layout Libraries for ReactFlow

| Library | Type | Complexity | Use Case | ReactFlow Integration |
|---------|------|------------|----------|----------------------|
| **Dagre** | Directed graph | Low | Tree layouts | Simple, synchronous |
| **D3-Hierarchy** | Tree layouts | Medium | Single-root trees | Fixed node sizes issue |
| **D3-Force** | Force-directed | High | Organic layouts | Iterative, performance concerns |
| **ELKjs** | Multi-algorithm | Very High | Enterprise layouts | Asynchronous, complex |
| **Custom** | Implementation | Variable | Specific needs | Full control |

### ReactFlow's Guidance
- **Dagre**: "Highly recommend" for tree organization
- **D3-Hierarchy**: Single root trees, but "same width/height to all nodes"
- **D3-Force**: Physics-based, "more complicated to configure"
- **ELKjs**: "Most configurable" but "most complicated", "difficult to support"

## ELK Algorithm Deep Dive

### Available ELK Algorithms (21 total)

#### Core Algorithms We Use
| Algorithm | ID | Category | Our Use | Status |
|-----------|-----|----------|----------|--------|
| **Layered** | `org.eclipse.elk.layered` | Hierarchical | Sugiyama | ✅ Working |
| **Mr. Tree** | `org.eclipse.elk.mrtree` | Tree | Tree | ⚠️ Not tested |
| **Force** | `org.eclipse.elk.force` | Force-directed | Force | ⚠️ Not tested |
| **Stress** | `org.eclipse.elk.stress` | Force-directed | Organic | ✅ Working |
| **Radial** | `org.eclipse.elk.radial` | Radial | Circular | ❌ Tree-only |

#### Algorithms We Could Use
| Algorithm | ID | Category | Potential Use |
|-----------|-----|----------|--------------|
| **Graphviz Circo** | `org.eclipse.elk.graphviz.circo` | Circle | True circular layouts |
| **Graphviz Dot** | `org.eclipse.elk.graphviz.dot` | Hierarchical | Alternative to layered |
| **Graphviz Twopi** | `org.eclipse.elk.graphviz.twopi` | Radial | Radial tree layouts |
| **DisCo** | `org.eclipse.elk.disco` | Component | Disjoint components |
| **SPOrE Overlap** | `org.eclipse.elk.sporeOverlap` | Post-processing | Label overlap fixing |

### Key Insights

#### Radial vs Circular (Semantic Difference)
- **ELK Radial**: Tree-based radial layout ("takes a tree and places the nodes in radial order")
- **Graphviz Circo**: True circular layout ("finds biconnected components and arranges each component in a circle")
- **Our Issue**: Using `radial` for "circular" - semantic mismatch!

#### Graphviz Circo for State Machines
- **Purpose**: "Suitable for certain diagrams of multiple cyclic structures"
- **Perfect for**: State machines with cycles (like traffic light)
- **Advantage**: Handles cycles naturally vs radial's tree-only limitation

#### SPOrE Overlap for Label Fixing
- **Purpose**: "Node overlap removal algorithm"
- **Potential Use**: Post-processing step to fix edge label positioning
- **Idea**: Run layout algorithm, then SPOrE to resolve label overlaps

## Our Current Implementation Analysis

### What We Have vs What's Available

| Our Layout | Current Algorithm | Better Alternative? | Reason |
|------------|-------------------|-------------------|--------|
| **Sugiyama** | `layered` | ✅ Keep | Perfect for hierarchical |
| **Tree** | `mrtree` | ✅ Keep | Designed for trees |
| **Force** | `force` | ✅ Keep | Good force-directed |
| **Organic** | `stress` | ✅ Keep | Good organic layout |
| **Circular** | `radial` ❌ | `graphviz.circo` | Handles cycles vs tree-only |
| **Grid** | Custom | ✅ Keep | No ELK grid algorithm |

### Missing Opportunities

#### 1. Graphviz Algorithms (4 available)
- **Circo**: True circular layouts for state machines
- **Dot**: Alternative hierarchical algorithm
- **Twopi**: Radial tree layouts
- **FDP/Neato**: Additional force-directed options

#### 2. Post-processing Algorithms
- **SPOrE Overlap**: Fix label/node overlaps after layout
- **SPOrE Compaction**: Reduce whitespace after layout

#### 3. Component Algorithms
- **DisCo**: Handle disjoint components separately
- **Rectangle Packing**: Optimize space usage

## Potential Improvements

### 1. Fix Circular Layout (High Priority)
```typescript
// Current (broken)
algorithm: 'radial' // Tree-only, fails on cycles

// Better
algorithm: 'graphviz.circo' // True circular, handles cycles
```

### 2. Add Label Overlap Resolution (Medium Priority)
```typescript
// Two-pass approach
const layout = await elk.layout(graph, { algorithm: 'layered' });
const fixedLayout = await elk.layout(layout, { algorithm: 'sporeOverlap' });
```

### 3. Edge Type Configuration (Nice to Have)
```typescript
interface LayoutSettings {
  edgeType: 'straight' | 'bezier' | 'step' | 'orthogonal';
  // Apply to all layouts
}
```

### 4. Layout Animations (Nice to Have)
- Reference: https://reactflow.dev/examples/nodes/node-position-animation
- Idea: Animate between layout transitions
- Implementation: Track previous positions, interpolate

## ReactFlow Node Collision Detection

### Resources
- https://reactflow.dev/examples/layout/node-collisions
- https://xyflow.com/blog/node-collision-detection-algorithms

### Integration Ideas
- Use collision detection for force layouts
- Prevent node overlap in custom layouts
- Interactive collision-aware dragging

## Architecture Recommendations

### 1. Immediate Fixes (Critical)
- **Replace `radial` with `graphviz.circo`** for circular layouts
- **Add Graphviz algorithms to ELK schema** (circo, dot, twopi)
- **Test Tree and Force layouts** (currently untested)

### 2. Short-term Improvements (Important)
- **Implement SPOrE overlap removal** for label fixing
- **Add edge type configuration** as common setting
- **Complete testing coverage** for all layouts

### 3. Long-term Enhancements (Nice to have)
- **Layout transition animations**
- **Collision detection integration**
- **Component-based layout** (DisCo algorithm)
- **Performance optimization** for large graphs

## ELK Schema Updates Needed

### Add Graphviz Algorithms
```typescript
const ELK_ALGORITHMS = [
  'layered', 'mrtree', 'force', 'stress', 'radial', 'box',
  'graphviz.circo', 'graphviz.dot', 'graphviz.twopi', 
  'graphviz.neato', 'graphviz.fdp'
];
```

### Add Post-processing Algorithms
```typescript
const POST_PROCESSING = [
  'sporeOverlap', 'sporeCompaction', 'disco'
];
```

## Testing Strategy

### Critical Tests Needed
1. **Graphviz Circo** with traffic light (should handle cycles)
2. **Tree layout** with hierarchical data
3. **Force layout** with both flat and hierarchical data
4. **SPOrE overlap** with dense edge labels

### Test Cases
- **Cyclic graphs** (traffic light, state machines)
- **Deep hierarchies** (nested states)
- **Wide graphs** (many sibling states)
- **Edge label density** (many transitions)

## Implementation Priority

### Phase 1: Critical Fixes
1. ✅ Research complete
2. 🔄 Add Graphviz algorithms to schema
3. 🔄 Replace radial with graphviz.circo
4. 🔄 Test all currently untested layouts

### Phase 2: Quality Improvements
1. 🔄 Implement SPOrE overlap resolution
2. 🔄 Add edge type configuration
3. 🔄 Complete test coverage

### Phase 3: Advanced Features
1. 📋 Layout transition animations
2. 📋 Collision detection integration
3. 📋 Component-based layouts

## Conclusion

Our current ELK-based architecture is solid, but we're missing key opportunities:

1. **Wrong algorithm for circular** - using tree-only radial instead of cycle-aware circo
2. **Missing Graphviz algorithms** - 4 additional algorithms available
3. **No post-processing** - could fix label overlaps with SPOrE
4. **Incomplete testing** - 2/6 layouts never verified

**Next Steps**: Fix circular layout with graphviz.circo, add missing algorithms to schema, complete testing coverage.
