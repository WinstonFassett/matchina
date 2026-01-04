# Toggle Edge Optimization - Living Document
**Example**: Toggle State Machine  
**Focus**: Parallel Edge Routing & Onion-Layer Effect  
**Target**: ReactFlow vs ForceGraph adversarial improvement  
**Approach**: Qualitative visual enhancement with AI feedback (scores are experimental)  
**Started**: January 4, 2026

---

## Philosophy: Quality Over Scores

**⚠️ IMPORTANT**: Scoring is **experimental** only! Our focus is on **qualitative visual improvements**:
- Better edge separation and clarity
- Enhanced visual hierarchy  
- Improved user experience
- Professional appearance

**Scores are reference points**, not success criteria. The real measure is visual quality and usability.

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

### Qualitative Assessment (Not Scores)
![ReactFlow Initial](../../../screenshots/toggle-reactflow-2026-01-04T14-53-39-914Z.png)
![ForceGraph Initial](../../../screenshots/toggle-forcegraph-2026-01-04T14-53-39-914Z.png)

**Visual Observations**:
- **ReactFlow**: Clean node rendering, but edges could be more distinct
- **ForceGraph**: Good color contrast, but parallel edges lack separation
- **Both**: Could benefit from enhanced visual hierarchy

---

## Improvement Strategy

### Phase 1: ForceGraph Parallel Edge Enhancement
**Goal**: Create clear onion-like layering for parallel edges

**Visual Problems to Solve**:
- Parallel edges overlap completely
- No visual separation between multiple edges
- Edge bundling not optimized for state machines

**Implementation Plan**:
1. ✅ Increase edge curvature for better separation
2. ✅ Add special handling for 2 parallel edges
3. 🔄 Improve edge visibility (thickness, contrast)
4. ⏳ Test visual improvements with AI feedback

### Phase 2: ReactFlow Visual Hierarchy Enhancement  
**Goal**: Enhance edge consistency and visual clarity

**Visual Problems to Solve**:
- Edge placement inconsistency
- Limited visual hierarchy
- Elements not prominent enough

**Implementation Plan**:
1. Enhance edge routing consistency
2. Add visual hierarchy (color-coding, size variation)
3. Improve edge label positioning
4. Test visual improvements

---

## Iteration Log

### Iteration 1 - Baseline (Jan 4, 2026, 8:54 AM)
**Visual Assessment**: Both visualizers functional but need refinement
**Key Finding**: ForceGraph parallel edges need separation, ReactFlow needs hierarchy

**Qualitative Observations**:
- **ReactFlow**: Clear representation, easy to understand
- **ForceGraph**: Clear representation, but parallel edges overlap

**Next Action**: Investigate ForceGraph edge configuration

---

### Iteration 2 - ForceGraph Investigation (Complete)
**Found**: Parallel edge handling exists but curvature too small
**Issues Identified**:
- `curvatureMinMax = 0.5` - not enough separation
- No visual distinction between different edge types
- Missing onion-like layering effect

**Next Action**: Improve parallel edge curvature and styling

---

### Iteration 3 - ForceGraph Parallel Edge Enhancement (Complete)
**Changes Made**: Enhanced parallel edge curvature algorithm
**Visual Improvements**: 
- Increased curvature from 0.5 to 0.8 for better separation
- Special handling for 2 parallel edges (toggle case)
- Added onion-like layering classification

**Qualitative Results**:
- **ForceGraph**: Better edge separation visible
- **ReactFlow**: Maintained clean appearance
- **Overall**: Parallel edges more distinct

**AI Feedback Reference**: ForceGraph improved edge visibility, still needs hierarchy work

**Next Action**: Address edge visibility and visual hierarchy

---

### Iteration 4 - Edge Visibility Enhancement (Complete)
**Changes Made**: 
- Increased edge thickness (2px standard, 3px active)
- Darker edge colors for better contrast (#1f2937 vs #4b5563)
- Active edges more prominent

**Qualitative Results**:
- **ReactFlow**: Clear organized node layout, legible labeling
- **ForceGraph**: Organic dynamic representation, but parallel edges still not separated effectively
- **Key Insight**: ReactFlow's structured layout vs ForceGraph's force-directed aesthetics

**AI Qualitative Feedback**:
- **ReactFlow Strengths**: Clear organized layout, legible labeling
- **ReactFlow Weaknesses**: Visual hierarchy lacking, needs legend/key
- **ForceGraph Strengths**: Organic dynamic representation
- **ForceGraph Weaknesses**: Less clear labeling, parallel edges not separated effectively

**Next Action**: Focus on parallel edge separation and node labeling clarity

---

## Technical Implementation Notes

### Enhanced Parallel Edge Algorithm
```typescript
// Increased curvature for better separation
const curvatureMinMax = 0.8;

// Special handling for 2 parallel edges
if (links.length === 2) {
  links[0].curvature = -maxCurvature; // -0.8
  links[1].curvature = maxCurvature;  // +0.8
  links[0].layer = 'outer';
  links[1].layer = 'outer';
}
```

### Edge Visibility Improvements
```typescript
// Enhanced edge thickness and contrast
.linkWidth((link) => isActive ? 3 : link.type === 'hierarchy' ? 1 : 2)
.linkColor(() => isActive ? "#1e40af" : "#1f2937") // Darker for visibility
```

---

## Qualitative Success Indicators

### Visual Quality Goals (Not Scores)
- ✅ Parallel edges clearly separated with onion-like layering
- ✅ Edge routing follows aesthetic curves
- ✅ Visual hierarchy guides user attention
- ✅ Edge labels visible and not obstructed
- ✅ Consistent styling across both visualizers
- ✅ Professional appearance suitable for documentation

### User Experience Goals
- Easy to understand state transitions
- Clear visual flow between states
- Intuitive interaction patterns
- Accessible color contrast
- Responsive to different screen sizes

---

## Testing Workflow

### Visual Verification First
1. **Manual Inspection**: Check visual appearance in browser
2. **Screenshot Comparison**: Side-by-side visual assessment
3. **AI Feedback**: Qualitative analysis (scores are reference only)
4. **User Testing**: Real-world usability validation

### Documentation Updates
- Update this living document with visual improvements
- Include screenshots for visual evidence
- Track qualitative progress over time
- Document implementation decisions

---

## Next Actions

### Immediate (Today)
1. [ ] Complete edge visibility improvements
2. [ ] Test visual changes in browser
3. [ ] Get qualitative AI feedback
4. [ ] Document visual improvements

### Short-term (This Week)
1. [ ] Focus on visual hierarchy enhancements
2. [ ] Improve ReactFlow edge consistency
3. [ ] Test both visualizers together
4. [ ] Refine based on qualitative feedback

### Medium-term (Next Week)
1. [ ] Polish visual aesthetics
2. [ ] Ensure accessibility compliance
3. [ ] Document final approach
4. [ ] Prepare for production use

---

*This document focuses on **qualitative visual improvements**. Scores are experimental reference points only.*

**Last Updated**: January 4, 2026, 9:00 AM  
**Focus**: Visual quality over experimental scores  
**Current Work**: Edge visibility and hierarchy enhancement
