# Hierarchical Layout Direction Alternating - Analysis

## Problem Statement
We want to alternate directions in hierarchical layouts to make them more compact:
- Root level: DOWN (vertical)
- Children: RIGHT (horizontal) 
- Grandchildren: DOWN (vertical)
- etc.

## Current Implementation Attempt

### What I Tried
1. **Recursive Approach**: Added `applyAlternatingDirections(rootChildren, depth)` that recursively traversed the built hierarchy
2. **Iterative Approach**: Added `applyAlternatingDirectionsIterative(nodeMap)` that calculates depths using parent relationships

### Why It's Not Working
**Root Cause**: ELK likely does not support different directions per subgraph in the same layout.

**Key Findings from V1 Analysis**:
- V1 **does not implement direction alternating** - it uses the same `elkOptions` for all groups
- All V1 presets use `direction: 'DOWN'` everywhere
- V1 passes `...elkOptions` to every group node (same direction for all levels)
- No evidence of per-subgraph direction handling in V1 codebase

**Technical Issues**:
1. **ELK Limitations**: ELK may not support per-subgraph direction changes
2. **Layout Options Scope**: The `elk.direction` setting might only work at the root graph level
3. **Algorithm Compatibility**: Some algorithms (like `layered`) may ignore direction changes in sub-groups
4. **V1 Evidence**: V1 never implemented this feature, suggesting it's not feasible with ELK

## V1 Implementation Analysis

### What V1 Does
```typescript
// V1 passes SAME options to all groups
elkNode.layoutOptions = {
  ...elkOptions, // Same direction for all levels
  "elk.padding": "[top=...]",
};
```

### V1 Presets
- All presets use `direction: 'DOWN'`
- No alternating directions anywhere
- Complex hierarchies (like HSM Traffic Light) work fine with single direction

## Alternative Approaches to Consider

### 1. Separate Layout Passes (Most Promising)
- Layout each hierarchy level separately with different directions
- Manually position the results relative to each other
- More complex but gives full control
- Similar to how complex visualization tools work

### 2. Different Algorithms per Level
- Use `layered` for vertical levels, `mrtree` for horizontal levels
- Algorithm-specific direction handling might work better
- Still subject to ELK limitations

### 3. Post-Layout Transformation
- Let ELK layout everything in one direction
- Apply geometric transformations to rotate subgraphs 90 degrees
- Requires careful coordinate transformation and edge routing

### 4. Custom Layout Engine
- Build our own hierarchical layout with alternating directions
- Most work but complete control
- Could use existing positioning algorithms as base

## Recommendation

### Immediate: Stop ELK Direction Attempts
- Evidence suggests ELK doesn't support per-subgraph directions
- V1 never implemented this feature
- Current approach is fundamentally flawed

### Next Step: Implement Separate Layout Passes
1. **Identify hierarchy levels** using parent relationships
2. **Layout each level separately** with desired direction
3. **Position levels relative** to each other
4. **Route edges between levels** properly

### Implementation Strategy
```typescript
// Pseudocode for separate layout approach
const levels = groupNodesByDepth(nodes);
const layoutedLevels = [];

for (let i = 0; i < levels.length; i++) {
  const direction = i % 2 === 0 ? 'DOWN' : 'RIGHT';
  const layouted = await layoutLevel(levels[i], direction);
  layoutedLevels.push(layouted);
}

const finalLayout = positionLevelsRelativeToEachOther(layoutedLevels);
```

## Questions to Answer
1. Are we willing to implement a custom layout solution?
2. Should we try separate layout passes first?
3. Is the visual benefit worth the complexity?
4. Can we achieve similar compactness with other ELK settings?

## Conclusion
The ELK-based direction alternating approach is fundamentally flawed. We need either:
1. **Separate layout passes** (medium complexity, good control)
2. **Custom hierarchical layout** (high complexity, full control)
3. **Accept single-direction layouts** (low complexity, limited control)

Recommendation: Start with separate layout passes approach.
