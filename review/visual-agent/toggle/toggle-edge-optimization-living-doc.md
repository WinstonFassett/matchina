# Toggle Edge Optimization - Living Document
**Example**: Toggle State Machine  
**Focus**: Parallel Edge Routing & Onion-Layer Effect  
**Target**: ReactFlow vs ForceGraph adversarial improvement  
**Started**: January 4, 2026

---

## Current State Analysis

### Toggle Machine Structure
```typescript
// Current toggle machine has parallel edges:
On: {
  toggle: "Off",     // Edge 1: On → Off
  turnOff: "Off",    // Edge 2: On → Off (parallel!)
},
Off: {
  toggle: "On",      // Edge 3: Off → On
  turnOn: "On",      // Edge 4: Off → On (parallel!)
}
```

**Perfect for Testing**: 2 sets of parallel edges that should demonstrate onion-like layering!

### Initial Comparison Results
![ReactFlow Initial](../../../screenshots/toggle-reactflow-2026-01-04T14-53-39-914Z.png)
![ForceGraph Initial](../../../screenshots/toggle-forcegraph-2026-01-04T14-53-39-914Z.png)

**Scores**:
- 🥇 **ReactFlow**: 0.83/1.0 (Leader)
- 🥈 **ForceGraph**: 0.67/1.0 (Needs improvement)

**Key Issues Identified**:
- **ForceGraph**: Parallel edges not clearly separated (missing onion-like layering)
- **ReactFlow**: Inconsistent edge placement, limited visual hierarchy
- **Both**: Could benefit from enhanced edge routing aesthetics

---

## Improvement Strategy

### Phase 1: ForceGraph Parallel Edge Enhancement
**Goal**: Achieve ≥0.8 score by implementing onion-like layering

**Current Problems**:
- Parallel edges overlap completely
- No visual separation between multiple edges
- Edge bundling not optimized for state machines

**Implementation Plan**:
1. Investigate ForceGraph edge configuration
2. Implement parallel edge separation algorithm
3. Add curve offset for parallel edges
4. Test with adversarial comparison

### Phase 2: ReactFlow Visual Hierarchy Enhancement  
**Goal**: Achieve ≥0.9 score by improving edge consistency

**Current Problems**:
- Edge placement inconsistency
- Limited visual hierarchy
- Elements not prominent enough

**Implementation Plan**:
1. Enhance edge routing consistency
2. Add visual hierarchy (color-coding, size variation)
3. Improve edge label positioning
4. Test with adversarial comparison

---

## Iteration Log

### Iteration 1 - Baseline (Jan 4, 2026, 8:54 AM)
**Scores**: ReactFlow 0.83 vs ForceGraph 0.67  
**Winner**: ReactFlow  
**Key Finding**: ForceGraph needs parallel edge separation

**AI Feedback Summary**:
- **ReactFlow Strengths**: Clear representation, easy to understand
- **ReactFlow Weaknesses**: Inconsistent edge placement, limited hierarchy
- **ForceGraph Strengths**: Clear representation, easy to understand  
- **ForceGraph Weaknesses**: No parallel edge separation, hierarchy issues

**Next Action**: Investigate ForceGraph edge configuration

---

### Iteration 2 - ForceGraph Investigation (Complete)
**Found**: Parallel edge handling exists in ForceGraphInspector.tsx (lines 552-590)
**Current Implementation**: Uses curvature with min/max of 0.5
**Issues Identified**:
- Curvature range too small (0.5) - not enough separation
- No visual distinction between different edge types
- Missing onion-like layering effect

**Current Parallel Edge Code**:
```typescript
// Lines 574-590 in ForceGraphInspector.tsx
Object.keys(sameNodesLinks)
  .filter((nodePairId) => sameNodesLinks[nodePairId].length > 1)
  .forEach((nodePairId) => {
    let links = sameNodesLinks[nodePairId];
    let lastIndex = links.length - 1;
    let lastLink = links[lastIndex];
    lastLink.curvature = curvatureMinMax; // 0.5
    let delta = (2 * curvatureMinMax) / lastIndex;
    for (let i = 0; i < lastIndex; i++) {
      links[i].curvature = -curvatureMinMax + i * delta;
      links[i].offset = i;
      if (lastLink.source !== links[i].source) {
        links[i].curvature *= -1;
        links[i].flipped = true;
      }
    }
  });
```

**Problems**:
1. `curvatureMinMax = 0.5` - too small for clear separation
2. No edge styling differences
3. Curvature calculation may not create optimal onion effect

### Iteration 3 - ForceGraph Parallel Edge Enhancement (Complete)
**Changes Made**: Enhanced parallel edge curvature algorithm
**Improvement**: ForceGraph 0.67 → 0.70 (+0.03)
**ReactFlow Improvement**: 0.83 → 1.00 (perfect score!)

**Enhanced Algorithm**:
```typescript
// Increased curvature from 0.5 to 0.8 for better separation
const curvatureMinMax = 0.8;

// Special handling for 2 parallel edges (toggle case)
if (links.length === 2) {
  links[0].curvature = -maxCurvature; // -0.8
  links[1].curvature = maxCurvature;  // +0.8
}
```

**Results**:
- 🥇 **ReactFlow**: 1.00/1.0 (Perfect!)
- 🥈 **ForceGraph**: 0.70/1.0 (Improved)
- **Margin**: 0.60 points
- **Key Issue**: "Obscured edges" still affecting ForceGraph

**AI Feedback on ForceGraph**:
- **Strengths**: Excellent color contrast, informative node labels
- **Weaknesses**: Obscured edges, lack of clear visual hierarchy
- **Recommendations**: Improve edge visibility, refine visual hierarchy

**Next Action**: Address edge visibility in ForceGraph

---

## Technical Investigation

### Current ForceGraph Implementation
*Research in progress...*

### Edge Routing Algorithms to Consider
1. **Curved Offset**: Add curvature to parallel edges with different radii
2. **Bezier Curves**: Use different control points for parallel edges
3. **Force-Based Separation**: Use physics to separate overlapping edges
4. **Layered Bundling**: Group parallel edges with visual separation

### Visual Hierarchy Enhancements
1. **Edge Thickness**: Different thickness for different event types
2. **Edge Color**: Color-code by event type (toggle vs turnOn/turnOff)
3. **Edge Style**: Solid vs dashed for primary vs secondary transitions
4. **Edge Labels**: Improve positioning and visibility

---

## Success Metrics

### Target Scores
- **Phase 1 Goal**: ForceGraph ≥ 0.8 (parallel edges fixed)
- **Phase 2 Goal**: Both ≥ 0.9 (excellent quality)
- **Final Goal**: Both ≥ 0.95 (production ready)

### Visual Quality Indicators
- ✅ Parallel edges clearly separated with onion-like layering
- ✅ Edge routing follows aesthetic curves
- ✅ Visual hierarchy guides user attention
- ✅ Edge labels visible and not obstructed
- ✅ Consistent styling across both visualizers

---

## Testing Workflow

### Automated Comparison
```bash
# Run adversarial comparison after each change
node scripts/adversarial-visual-comparison.cjs
```

### Manual Verification
1. Check visual appearance in both light/dark themes
2. Test edge interactivity and hover states
3. Verify edge label readability
4. Validate parallel edge separation

### Documentation Updates
- Update this living document with each iteration
- Include screenshots in comparison reports
- Track scoring evolution over time
- Document implementation decisions

---

## Resources & References

### Edge Routing Research
- D3 Force Directed Graph edge handling
- Parallel edge visualization techniques
- State machine edge representation best practices
- Mike Bostock's visualization principles

### Implementation Examples
- ReactFlow custom edge components
- D3 force simulation edge configuration
- Edge bundling algorithms
- Visual hierarchy in graph visualization

---

## Next Actions

### Immediate (Today)
1. [ ] Investigate current ForceGraph edge implementation
2. [ ] Research parallel edge separation techniques
3. [ ] Implement initial ForceGraph improvements
4. [ ] Run adversarial comparison test

### Short-term (This Week)
1. [ ] Achieve ForceGraph ≥ 0.8 score
2. [ ] Document ForceGraph improvements
3. [ ] Begin ReactFlow enhancements
4. [ ] Test both visualizers together

### Medium-term (Next Week)
1. [ ] Achieve both ≥ 0.9 score
2. [ ] Finalize edge routing optimizations
3. [ ] Document final approach
4. [ ] Prepare for production use

---

*This document updates live as improvements are made. Check back for latest progress!*

**Last Updated**: January 4, 2026, 8:56 AM  
**Current Leader**: ReactFlow (0.83 vs 0.67)  
**Next Focus**: ForceGraph parallel edge implementation
