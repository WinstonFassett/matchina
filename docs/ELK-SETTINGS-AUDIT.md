# ELK Settings Audit Plan

## Purpose
Audit current ELK layout settings against comprehensive research to ensure:
- ✅ ALL settings that DO have an effect are included in UI
- ✅ NO settings that DO NOT have an effect are included in UI  
- ✅ Best defaults are configured for ReactFlow nodes and expected sizes
- ✅ Layout-specific settings are properly scoped to relevant algorithms

## Current State Analysis

### Current ELK Settings in UI
Based on `src/viz/ReactFlowV2/ui/HSMLayoutControls.tsx`:

**Available for ALL ELK-based layouts (HIERARCHICAL, TREE, FORCE, ORGANIC):**
- Edge Routing: ORTHOGONAL, POLYLINE, SPLINES, STRAIGHT
- Node Placement: NETWORK_SIMPLEX, SIMPLE, BRANDES_KOEPF  
- Compaction: NONE, EDGE_LENGTH, NODE_DIMENSIONS
- Thoroughness: 1-20 slider

**Available for HIERARCHICAL/TREE only:**
- Direction: DOWN, UP, RIGHT, LEFT
- Layer Spacing: 40-400 slider
- Alternating Direction: ON/OFF toggle

**Available for FORCE/ORGANIC only:**
- Edge Length: 40-300 slider

### Research-Based Expected Settings

From `docs/ELK-LAYOUT-REFERENCE.md` and `src/viz/ReactFlowV2/layout/elk-options-reference.json`:

#### Layered Algorithm (Sugiyama/Hierarchical)
**HIGH IMPACT:**
- ✅ `elk.direction` - Already implemented
- ✅ `elk.layered.spacing.nodeNodeBetweenLayers` - Implemented as "Layer Spacing"
- ✅ `elk.spacing.nodeNode` - Implemented as "Node Spacing" (common)
- ❌ `elk.hierarchyHandling` - MISSING (should be INCLUDE_CHILDREN for HSM)
- ❌ `elk.layered.thoroughness` - Already implemented

**MEDIUM IMPACT:**
- ✅ `elk.layered.nodePlacement.strategy` - Already implemented
- ✅ `elk.layered.edgeRouting.strategy` - Already implemented  
- ❌ `elk.layered.cycleBreaking.strategy` - MISSING (DEPTH_FIRST vs GREEDY)
- ❌ `elk.layered.compaction.postCompaction.strategy` - Partially implemented

**LOW IMPACT:**
- ❌ `elk.layered.crossingMinimization.strategy` - MISSING
- ❌ `elk.padding` - MISSING (important for ReactFlow containers)

#### MRTree Algorithm (Tree)
**HIGH IMPACT:**
- ✅ `elk.direction` - Already implemented
- ✅ `elk.spacing.nodeNode` - Implemented as "Node Spacing"
- ❌ `elk.hierarchyHandling` - MISSING
- ❌ `elk.mrtree.weighting` - MISSING (DESCENDANTS vs LEAVES)
- ❌ `elk.mrtree.searchOrder` - MISSING (DFS vs BFS)

#### Stress Algorithm (Force)
**HIGH IMPACT:**
- ✅ `elk.stress.desiredEdgeLength` - Implemented as "Edge Length"
- ✅ `elk.spacing.nodeNode` - Implemented as "Node Spacing"
- ❌ `elk.hierarchyHandling` - MISSING
- ❌ `elk.stress.iterationLimit` - MISSING (performance control)
- ❌ `elk.stress.epsilon` - MISSING (convergence control)

#### Force Algorithm (Force)
**HIGH IMPACT:**
- ✅ `elk.force.iterations` - MISSING (should be exposed)
- ✅ `elk.spacing.nodeNode` - Implemented as "Node Spacing"
- ❌ `elk.hierarchyHandling` - MISSING
- ❌ `elk.force.repulsion` - MISSING (node spacing control)
- ❌ `elk.force.attraction` - MISSING (edge length control)

## Issues Identified

### 1. Missing Critical Settings
- **`elk.hierarchyHandling`** - Essential for HSM, should default to INCLUDE_CHILDREN
- **`elk.padding`** - Important for ReactFlow container sizing
- **Algorithm-specific iteration/quality controls** - Performance vs quality tradeoffs

### 2. Settings Applied to Wrong Algorithms
- **Node Placement (NETWORK_SIMPLEX)** - Only applies to layered algorithm
- **Compaction strategies** - Only apply to layered algorithm  
- **Edge routing** - Different algorithms support different routing

### 3. Missing Algorithm-Specific Options
- **Tree**: Weighting, search order
- **Force**: Repulsion, attraction forces
- **Stress**: Iteration limit, convergence

## Proposed Changes

### Phase 1: Fix Critical Missing Settings
1. Add `hierarchyHandling` with proper defaults
2. Add `padding` control for container sizing
3. Add algorithm-specific iteration controls

### Phase 2: Fix Settings Scope
1. Scope Node Placement to layered only
2. Scope Compaction to layered only
3. Add algorithm-specific routing options

### Phase 3: Add Missing Options
1. Tree algorithm: weighting, search order
2. Force algorithm: repulsion, attraction
3. Stress algorithm: iteration limit, epsilon

### Phase 4: Improve Defaults
1. Optimize defaults for ReactFlow node sizes (150x50)
2. Optimize defaults for label sizes (half node dimensions)
3. Set better performance defaults

## Risk Assessment
**LOW RISK:** Adding missing settings that have clear benefit
**MEDIUM RISK:** Changing defaults may affect existing layouts
**HIGH RISK:** Restructuring UI settings panels

## Implementation Strategy
1. ✅ Create this audit document
2. ⏳ Get user approval for approach
3. ⏳ Implement Phase 1 (critical fixes)
4. ⏳ Test each algorithm independently
5. ⏳ Implement Phase 2 (scope fixes)
6. ⏳ Implement Phase 3 (missing options)
7. ⏳ Implement Phase 4 (defaults optimization)
8. ⏳ Comprehensive testing across all layouts

## Success Criteria
- [ ] All ELK algorithms have their relevant settings available
- [ ] No settings are available for algorithms that don't support them
- [ ] Defaults work well with ReactFlow node sizes
- [ ] Performance vs quality tradeoffs are user-controllable
- [ ] Hierarchy handling works correctly for all HSM cases
