# Per-Example Layout Optimization

## Goal
Determine optimal layout configurations for each specific example, considering graph structure, complexity, and user experience.

## Example Analysis Framework

### Graph Characteristics
For each example, we analyze:
- **Node count**: Total number of states
- **Edge count**: Total number of transitions  
- **Graph type**: Tree, hierarchical, cyclic, or network
- **Hierarchy depth**: Maximum nesting level for HSMs
- **Connectivity**: How well-connected the graph is
- **Symmetry**: Natural symmetrical properties

### Optimization Criteria
1. **Readability**: Clear state relationships and flow
2. **Compactness**: Efficient use of screen space
3. **Performance**: Fast layout computation
4. **Stability**: Consistent results across runs
5. **Aesthetics**: Visually pleasing arrangement

## Example-Specific Recommendations

### 1. Traffic Light (Simple Hierarchical)

#### Graph Analysis
- **Nodes**: 3 (Red, Yellow, Green)
- **Edges**: 3 (cyclic transitions)
- **Type**: Simple cycle with hierarchy
- **Depth**: 1 level
- **Connectivity**: Fully connected cycle
- **Symmetry**: High (triangular symmetry)

#### Optimal Configuration
```typescript
const trafficLightOptimal = {
  algorithm: "layered",
  direction: "DOWN",        // Natural flow direction
  nodeSpacing: 80,          // Compact for small graph
  layerSpacing: 100,        // Tight vertical spacing
  edgeSpacing: 10,          // Minimal edge spacing
  thoroughness: 5,          // Low - simple graph
  compactComponents: false, // Don't over-compact
  separateComponents: false // Single component
};
```

#### Algorithm Performance
| Algorithm | Quality | Speed | Stability | Recommendation |
|-----------|---------|-------|-----------|----------------|
| layered   | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | **BEST** |
| force     | ⭐⭐⭐⭐   | ⭐⭐⭐⭐  | ⭐⭐⭐     | Good alternative |
| stress    | ⭐⭐⭐    | ⭐⭐⭐   | ⭐⭐⭐     | Overkill |
| mrtree    | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Good for tree view |
| sporeOverlap | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Not needed |

#### Alternative Configurations

**Compact Version** (for mobile/small screens):
```typescript
const trafficLightCompact = {
  ...trafficLightOptimal,
  direction: "RIGHT",      // Horizontal for narrow screens
  nodeSpacing: 60,
  layerSpacing: 80
};
```

**Tree View** (emphasize hierarchy):
```typescript
const trafficLightTree = {
  algorithm: "mrtree",
  direction: "DOWN",
  nodeSpacing: 70,
  layerSpacing: 90,
  compactComponents: true
};
```

#### Known Issues
- **Layered + thoroughness > 15**: Can cause infinite loops
- **Force + low thoroughness**: May not converge
- **Solution**: Fixed with parameter limits in ELK options

---

### 2. HSM Combobox (Complex Hierarchical)

#### Graph Analysis
- **Nodes**: 6-9 (depending on flat/nested mode)
- **Edges**: 8-12 transitions
- **Type**: Hierarchical state machine
- **Depth**: 2-3 levels (Working > Idle/Searching/Selected)
- **Connectivity**: Moderate intra-component connections
- **Symmetry**: Low (asymmetric hierarchy)

#### Optimal Configuration
```typescript
const hsmComboboxOptimal = {
  algorithm: "layered",
  direction: "DOWN",        // Natural hierarchy flow
  nodeSpacing: 100,         // Adequate spacing for groups
  layerSpacing: 140,        // Clear layer separation
  edgeSpacing: 20,          // Prevent edge overlap
  thoroughness: 7,          // Medium - complex hierarchy
  compactComponents: false, // Preserve hierarchy clarity
  separateComponents: false, // Keep related together
  edgeNodeSpacing: 30       // Clear edge routing
};
```

#### Algorithm Performance
| Algorithm | Quality | Speed | Stability | Recommendation |
|-----------|---------|-------|-----------|----------------|
| layered   | ⭐⭐⭐⭐⭐  | ⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐ | **BEST** |
| force     | ⭐⭐⭐    | ⭐⭐⭐   | ⭐⭐      | Poor hierarchy |
| stress    | ⭐⭐⭐    | ⭐⭐    | ⭐⭐⭐     | Loses hierarchy |
| mrtree    | ⭐⭐⭐⭐   | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Good for flat mode |
| sporeOverlap | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Post-processing only |

#### Mode-Specific Configurations

**Flat Mode** (when flattened):
```typescript
const hsmComboboxFlat = {
  algorithm: "mrtree",     // Better for tree structure
  direction: "DOWN",
  nodeSpacing: 80,          // More compact
  layerSpacing: 100,
  compactComponents: true   // Tighter tree layout
};
```

**Nested Mode** (hierarchical):
```typescript
const hsmComboboxNested = {
  algorithm: "layered",
  direction: "DOWN",
  nodeSpacing: 120,         // Extra space for groups
  layerSpacing: 160,
  thoroughness: 8,          // Higher quality for hierarchy
  edgeNodeSpacing: 40       // Better edge routing in groups
};
```

#### Known Issues
- **SporeOverlap**: Infinite loops with hierarchy handling
- **Force**: Poor hierarchy visualization
- **Solution**: Use layered for nested, mrtree for flat

---

### 3. Rock Paper Scissors (Symmetric Network)

#### Graph Analysis
- **Nodes**: 5 (Rock, Paper, Scissors, Start, End)
- **Edges**: 9 (complete game graph)
- **Type**: Symmetric network with cycles
- **Depth**: 1 level (flat)
- **Connectivity**: High (well-connected)
- **Symmetry**: Very high (triangular symmetry)

#### Optimal Configuration
```typescript
const rockPaperScissorsOptimal = {
  algorithm: "force",       // Natural for symmetric graphs
  nodeSpacing: 120,         // Good separation
  layerSpacing: 150,        // Balanced edge lengths
  thoroughness: 10,         // Higher for stable layout
  compactComponents: true,  // Better force distribution
  separateComponents: false // Single connected component
};
```

#### Algorithm Performance
| Algorithm | Quality | Speed | Stability | Recommendation |
|-----------|---------|-------|-----------|----------------|
| layered   | ⭐⭐⭐    | ⭐⭐⭐⭐  | ⭐⭐⭐⭐   | Poor symmetry |
| force     | ⭐⭐⭐⭐⭐  | ⭐⭐⭐   | ⭐⭐⭐⭐   | **BEST** |
| stress    | ⭐⭐⭐⭐   | ⭐⭐    | ⭐⭐⭐⭐   | Good alternative |
| mrtree    | ⭐⭐      | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Not a tree |
| sporeOverlap | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Post-processing |

#### Alternative Configurations

**Stress Layout** (more mathematical):
```typescript
const rockPaperScissorsStress = {
  algorithm: "stress",
  nodeSpacing: 100,
  layerSpacing: 120,
  thoroughness: 8,          // Quality setting
  separateComponents: false
};
```

**Layered Alternative** (hierarchical view):
```typescript
const rockPaperScissorsLayered = {
  algorithm: "layered",
  direction: "DOWN",
  nodeSpacing: 100,
  layerSpacing: 120,
  thoroughness: 5           // Lower to avoid loops
};
```

#### Known Issues
- **Layered**: Can create excessive edge crossings
- **Force**: May produce different layouts each run
- **Solution**: Use force for quality, stress for consistency

---

### 4. Async Calculator (Complex Network)

#### Graph Analysis
- **Nodes**: 8-12 (varies with implementation)
- **Edges**: 10-15 transitions
- **Type**: Complex network with async operations
- **Depth**: 2-3 levels
- **Connectivity**: High (many interconnections)
- **Symmetry**: Low (asymmetric complexity)

#### Optimal Configuration
```typescript
const asyncCalculatorOptimal = {
  algorithm: "stress",       // Good for complex networks
  nodeSpacing: 110,         // Balanced spacing
  layerSpacing: 130,        // Uniform edge lengths
  thoroughness: 8,          // Medium-high quality
  separateComponents: true, // Handle disconnected parts
  edgeNodeSpacing: 25        // Clear edge routing
};
```

#### Algorithm Performance
| Algorithm | Quality | Speed | Stability | Recommendation |
|-----------|---------|-------|-----------|----------------|
| layered   | ⭐⭐⭐    | ⭐⭐⭐   | ⭐⭐⭐     | Too rigid |
| force     | ⭐⭐⭐⭐   | ⭐⭐    | ⭐⭐⭐     | Good but slow |
| stress    | ⭐⭐⭐⭐⭐  | ⭐⭐⭐   | ⭐⭐⭐⭐   | **BEST** |
| mrtree    | ⭐⭐      | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Not suitable |
| sporeOverlap | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Cleanup only |

#### Complexity-Specific Configurations

**Simple Version** (fewer states):
```typescript
const asyncCalculatorSimple = {
  algorithm: "layered",
  direction: "DOWN",
  nodeSpacing: 90,
  layerSpacing: 110,
  thoroughness: 6
};
```

**Complex Version** (many states):
```typescript
const asyncCalculatorComplex = {
  algorithm: "stress",
  nodeSpacing: 120,
  layerSpacing: 140,
  thoroughness: 10,         // Higher quality
  separateComponents: true  // Handle complexity
};
```

#### Known Issues
- **Force**: Can be slow with many edges
- **Layered**: Poor handling of complex interconnections
- **Solution**: Use stress for balance of quality and performance

---

### 5. Checkout Payment (Business Process)

#### Graph Analysis
- **Nodes**: 10-15 (payment states)
- **Edges**: 12-20 transitions
- **Type**: Business process workflow
- **Depth**: 3-4 levels (deep hierarchy)
- **Connectivity**: Moderate (sequential with branches)
- **Symmetry**: Low (linear flow with branches)

#### Optimal Configuration
```typescript
const checkoutOptimal = {
  algorithm: "layered",
  direction: "RIGHT",       // Horizontal workflow
  nodeSpacing: 100,         // Standard spacing
  layerSpacing: 150,        // Clear process steps
  edgeSpacing: 25,          // Prevent overlap
  thoroughness: 9,          // High quality for complex
  compactComponents: false, // Preserve process clarity
  separateComponents: false, // Single workflow
  edgeNodeSpacing: 35       // Clean routing
};
```

#### Algorithm Performance
| Algorithm | Quality | Speed | Stability | Recommendation |
|-----------|---------|-------|-----------|----------------|
| layered   | ⭐⭐⭐⭐⭐  | ⭐⭐⭐   | ⭐⭐⭐⭐⭐ | **BEST** |
| force     | ⭐⭐⭐    | ⭐⭐    | ⭐⭐      | Loses process flow |
| stress    | ⭐⭐⭐    | ⭐⭐    | ⭐⭐⭐     | Poor for workflow |
| mrtree    | ⭐⭐⭐⭐   | ⭐⭐⭐⭐  | ⭐⭐⭐⭐⭐ | Good for simple cases |
| sporeOverlap | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Post-processing |

#### Workflow-Specific Configurations

**Vertical Workflow** (traditional flowchart):
```typescript
const checkoutVertical = {
  algorithm: "layered",
  direction: "DOWN",        // Traditional top-to-bottom
  nodeSpacing: 90,
  layerSpacing: 120,
  thoroughness: 8
};
```

**Compact Workflow** (for documentation):
```typescript
const checkoutCompact = {
  algorithm: "layered",
  direction: "RIGHT",
  nodeSpacing: 80,
  layerSpacing: 100,
  compactComponents: true   // Tighter layout
};
```

#### Known Issues
- **Force**: Doesn't respect process flow direction
- **Stress**: Can create circular layouts
- **Solution**: Layered is best for business processes

---

## General Optimization Patterns

### Algorithm Selection Guide

| Graph Type | Best Algorithm | Why |
|------------|----------------|-----|
| Simple hierarchy | **layered** | Clear levels, predictable |
| Complex hierarchy | **layered** | Handles deep nesting |
| Symmetric network | **force** | Natural symmetry |
| Complex network | **stress** | Balanced optimization |
| Pure tree | **mrtree** | Optimized for trees |
| Overlap fixing | **sporeOverlap** | Specialized purpose |

### Parameter Tuning Guidelines

#### Node Spacing
- **Small graphs (< 5 nodes)**: 60-80px
- **Medium graphs (5-15 nodes)**: 80-120px  
- **Large graphs (> 15 nodes)**: 100-150px
- **Force layouts**: Add 20% for separation
- **Hierarchical**: Add 20% for group clarity

#### Layer Spacing
- **Simple hierarchies**: 80-120px
- **Complex hierarchies**: 120-180px
- **Force layouts**: Use for edge length control
- **Stress layouts**: Use for desired edge length

#### Thoroughness
- **Simple graphs**: 3-7 (fast)
- **Complex graphs**: 7-12 (balanced)
- **Critical quality**: 12-20 (slow)
- **Force/Stress**: Use different meaning (temperature/quality)

### Theme-Specific Adjustments

#### Dark Theme
```typescript
const darkThemeAdjustments = {
  nodeSpacing: base => base + 10,    // More contrast
  edgeSpacing: base => base + 5,     // Better visibility
  thoroughness: base => base + 1    // Slightly higher quality
};
```

#### Light Theme
```typescript
const lightThemeAdjustments = {
  nodeSpacing: base => base - 5,     // More compact
  edgeSpacing: base => base,         // Standard
  thoroughness: base => base         // Standard
};
```

### Device-Specific Optimizations

#### Mobile (< 768px)
```typescript
const mobileOptimizations = {
  direction: "DOWN",        // Better for narrow screens
  nodeSpacing: 60,           // Compact
  layerSpacing: 80,         // Tight
  thoroughness: 5           // Faster performance
};
```

#### Desktop (> 1200px)
```typescript
const desktopOptimizations = {
  direction: "RIGHT",       // Better for wide screens
  nodeSpacing: 120,         // More space
  layerSpacing: 150,        // Clear separation
  thoroughness: 10          // Higher quality
};
```

## Performance Optimization

### Layout Computation Limits
```typescript
const PERFORMANCE_LIMITS = {
  maxNodes: 50,             // Switch to simplified layout
  maxEdges: 100,            // Switch to simplified layout  
  timeoutMs: 2000,          // Maximum computation time
  fallbackAlgorithm: "force" // Fast fallback
};
```

### Progressive Enhancement
```typescript
const progressiveLayout = async (nodes, edges, options) => {
  // Level 1: Fast approximation (100ms)
  const quickLayout = await computeLayout(nodes, edges, {
    ...options,
    thoroughness: 3
  });
  
  // Level 2: Medium quality (500ms)
  const mediumLayout = await computeLayout(nodes, edges, {
    ...options,
    thoroughness: 7
  });
  
  // Level 3: High quality (2000ms)
  const finalLayout = await computeLayout(nodes, edges, {
    ...options,
    thoroughness: 12
  });
  
  return { quickLayout, mediumLayout, finalLayout };
};
```

## Quality Metrics

### Automated Quality Assessment
```typescript
interface LayoutQuality {
  nodeOverlap: number;      // 0 = no overlap, 1 = extensive overlap
  edgeCrossings: number;    // Count of edge crossings
  totalArea: number;        // Area of bounding box
  aspectRatio: number;      // Width/height ratio
  edgeLengthVariance: number; // Consistency of edge lengths
  hierarchicalClarity: number; // Hierarchy visibility (0-1)
}

const assessLayoutQuality = (nodes, edges): LayoutQuality => {
  // Automated quality metrics
  return {
    nodeOverlap: calculateNodeOverlap(nodes),
    edgeCrossings: countEdgeCrossings(edges),
    totalArea: calculateTotalArea(nodes),
    aspectRatio: calculateAspectRatio(nodes),
    edgeLengthVariance: calculateEdgeLengthVariance(edges),
    hierarchicalClarity: assessHierarchy(nodes, edges)
  };
};
```

### Quality Thresholds
```typescript
const QUALITY_THRESHOLDS = {
  excellent: { nodeOverlap: 0, edgeCrossings: 0, aspectRatio: 0.5-2.0 },
  good: { nodeOverlap: 0.1, edgeCrossings: 2, aspectRatio: 0.3-3.0 },
  acceptable: { nodeOverlap: 0.2, edgeCrossings: 5, aspectRatio: 0.2-4.0 },
  poor: { nodeOverlap: 0.5, edgeCrossings: 10, aspectRatio: any }
};
```

## Implementation Recommendations

### Preset System
```typescript
const LAYOUT_PRESETS = {
  'hierarchical': {
    name: "Hierarchical",
    description: "Best for state machines with clear parent-child relationships",
    config: {
      algorithm: "layered",
      direction: "DOWN",
      nodeSpacing: 100,
      layerSpacing: 140,
      thoroughness: 7,
      compactComponents: false,
      separateComponents: false
    }
  },
  'compact': {
    name: "Compact",
    description: "Dense layout for small screens or documentation",
    config: {
      algorithm: "layered",
      direction: "RIGHT",
      nodeSpacing: 60,
      layerSpacing: 80,
      thoroughness: 5,
      compactComponents: true,
      separateComponents: false
    }
  },
  'organic': {
    name: "Organic",
    description: "Natural layout for complex interconnected graphs",
    config: {
      algorithm: "force",
      nodeSpacing: 120,
      layerSpacing: 150,
      thoroughness: 10,
      compactComponents: true,
      separateComponents: true
    }
  },
  'balanced': {
    name: "Balanced",
    description: "Mathematical optimization for edge uniformity",
    config: {
      algorithm: "stress",
      nodeSpacing: 100,
      layerSpacing: 120,
      thoroughness: 8,
      separateComponents: true
    }
  }
};
```

### Auto-Configuration
```typescript
const autoConfigureLayout = (nodes, edges) => {
  const analysis = analyzeGraph(nodes, edges);
  
  // Simple hierarchical
  if (analysis.isHierarchical && analysis.nodeCount < 10) {
    return LAYOUT_PRESETS.hierarchical.config;
  }
  
  // Complex hierarchical
  if (analysis.isHierarchical && analysis.nodeCount >= 10) {
    return {
      ...LAYOUT_PRESETS.hierarchical.config,
      thoroughness: 10,
      nodeSpacing: 120,
      layerSpacing: 160
    };
  }
  
  // Symmetric network
  if (analysis.isSymmetric && analysis.connectivity > 0.7) {
    return LAYOUT_PRESETS.organic.config;
  }
  
  // Complex network
  if (analysis.complexity > 0.6) {
    return LAYOUT_PRESETS.balanced.config;
  }
  
  // Default to hierarchical
  return LAYOUT_PRESETS.hierarchical.config;
};
```

---

**Next Steps:**
1. Implement preset system in LayoutPanel
2. Add auto-configuration based on graph analysis
3. Create quality assessment metrics
4. Add performance optimization for large graphs
5. Document user-facing layout recommendations
