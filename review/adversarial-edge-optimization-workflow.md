# Adversarial Edge Optimization Workflow
**Focus**: ReactFlow vs ForceGraph Edge Routing Comparison  
**Target Example**: Toggle State Machine  
**Approach**: AI-driven iterative improvement with scoring system

---

## Current Status

### 🏆 First Comparison Results (Jan 4, 2026)
- **ReactFlow Score**: 0.83 / 1.0 ⭐ **Leader**
- **ForceGraph Score**: 0.67 / 1.0
- **Margin**: 0.16 points
- **Key Difference**: ReactFlow has more consistent edge routing
- **Focus Area**: ForceGraph needs edge separation and visual hierarchy improvements

### ⏱️ Performance Metrics
- **Screenshot Capture**: ReactFlow 6.3s, ForceGraph 2.8s
- **AI Analysis**: 33.4 seconds
- **Total Comparison**: ~43 seconds

---

## Scoring System Evolution

### Current Scoring Categories (0-1 scale)
1. **Edge Routing Quality**: How well are edges routed between nodes?
2. **Parallel Edge Handling**: Are parallel edges properly separated with onion-like layering?
3. **Edge Clarity**: Are edges clearly visible and not obstructed?
4. **Visual Hierarchy**: Do edges help show the flow and relationships?
5. **Overall Aesthetic**: Professional appearance and visual appeal?

### Target Scores for Success
- **Initial Parity**: Both visualizers ≥ 0.8
- **Excellence Threshold**: Both visualizers ≥ 0.9
- **Production Ready**: Both visualizers ≥ 0.95

---

## Identified Issues & Focus Areas

### ReactFlow (Current Leader)
**Strengths**:
- Clear and legible state machine representation
- Easy to read and understand
- More consistent edge routing

**Weaknesses**:
- Inconsistent edge placement causing confusion
- Limited visual hierarchy
- Elements not prominent enough

**Improvement Opportunities**:
- Enhance edge routing consistency and clarity
- Add defined visual hierarchy (color-coding, size variation)
- Improve element prominence

### ForceGraph (Challenger)
**Strengths**:
- Clear and legible state machine representation
- Easy to read and understand

**Weaknesses**:
- **Critical**: Parallel edges not clearly separated (missing onion-like layering)
- Visual hierarchy elements not prominent
- Edge separation needs improvement

**Improvement Opportunities**:
- **Priority**: Implement parallel edge separation with onion-like layering
- Enhance edge routing for better connection clarity
- Increase visual hierarchy effectiveness

---

## Iterative Improvement Strategy

### Phase 1: ForceGraph Edge Enhancement (Current)
**Focus**: Implement onion-like parallel edge layering
**Target Score**: ≥ 0.8
**Approach**:
1. Research ForceGraph edge bundling capabilities
2. Implement parallel edge separation algorithm
3. Test with adversarial comparison
4. Iterate until parity achieved

### Phase 2: ReactFlow Refinement
**Focus**: Enhance visual hierarchy and edge consistency
**Target Score**: ≥ 0.9
**Approach**:
1. Improve edge routing consistency
2. Add visual hierarchy enhancements
3. Test with adversarial comparison
4. Iterate until excellence threshold

### Phase 3: Both Visualizers Optimization
**Focus**: Push both to production-ready quality
**Target Score**: ≥ 0.95
**Approach**:
1. Address remaining issues from AI feedback
2. Fine-tune edge aesthetics and routing
3. Comprehensive testing across examples
4. Final validation and documentation

---

## Technical Implementation Notes

### Adversarial Comparison System
- **Script**: `scripts/adversarial-visual-comparison.cjs`
- **Model**: Local LLaVA via Ollama
- **Scoring**: 0-1 scale with detailed feedback
- **Persistence**: `review/visual-agent/toggle/feedback-tracker.json`
- **Reports**: Markdown with embedded images for Obsidian

### Key Features
- **Timing Awareness**: Tracks capture and analysis duration
- **Persistent Scoring**: Evolution tracking over time
- **Focused Feedback**: Edge routing specific recommendations
- **Visual Evidence**: Screenshots embedded in reports
- **Automated Workflow**: One-command comparison execution

### Prompt Engineering Evolution
**Current Prompt Focus**:
- Mike Bostock-level visualization expertise
- Edge routing quality assessment
- Parallel edge handling evaluation
- Visual hierarchy analysis
- Specific improvement recommendations

**Future Prompt Enhancements**:
- More granular edge scoring (curvature, spacing, intersection avoidance)
- Aesthetic scoring specific to state machines
- Performance considerations (rendering speed, interaction)
- Accessibility compliance scoring

---

## Next Immediate Actions

### 1. ForceGraph Parallel Edge Implementation
```bash
# Research current ForceGraph edge handling
find src -name "*force*" -type f
find src -name "*edge*" -type f

# Test current edge behavior
node scripts/adversarial-visual-comparison.cjs
```

### 2. Edge Routing Algorithm Research
- Investigate D3 force simulation edge handling
- Research edge bundling techniques
- Study parallel edge separation algorithms
- Analyze ReactFlow edge routing approach

### 3. Implementation Planning
- Identify ForceGraph edge modification points
- Plan parallel edge separation algorithm
- Design visual hierarchy enhancements
- Schedule iterative testing cycles

---

## Success Metrics

### Short-term (Week 1)
- [ ] ForceGraph achieves ≥ 0.8 score
- [ ] Parallel edges properly separated
- [ ] Onion-like layering implemented

### Medium-term (Week 2)
- [ ] Both visualizers ≥ 0.9 score
- [ ] ReactFlow visual hierarchy enhanced
- [ ] Edge routing consistency improved

### Long-term (Month 1)
- [ ] Both visualizers ≥ 0.95 score
- [ ] Production-ready quality achieved
- [ ] Workflow documented and automated

---

## Automation Potential

### Current Manual Steps
1. Run adversarial comparison
2. Review AI feedback
3. Implement improvements
4. Test changes
5. Repeat comparison

### Future Automation Opportunities
- **Automated Scoring Thresholds**: Auto-run until target scores achieved
- **Issue Detection**: Automatically parse AI recommendations into tickets
- **Regression Testing**: Continuous comparison on code changes
- **Performance Monitoring**: Track scoring trends over time

---

## Risk Mitigation

### Scoring Reliability
- **Risk**: AI scoring inconsistency
- **Mitigation**: Multiple comparison runs, score averaging
- **Validation**: Human verification of critical improvements

### Over-optimization
- **Risk**: Optimizing for AI score rather than user experience
- **Mitigation**: Regular user testing, real-world validation
- **Balance**: Combine AI feedback with human UX evaluation

### Visualizer Drift
- **Risk**: Visualizers becoming too similar
- **Mitigation**: Maintain distinct strengths and use cases
- **Diversity**: Preserve unique characteristics of each approach

---

## Documentation & Knowledge Sharing

### Working Documents
- **This Document**: Workflow and strategy tracking
- **Comparison Reports**: Per-run detailed analysis with images
- **Feedback Tracker**: Persistent scoring and issue tracking
- **Technical Notes**: Implementation details and learnings

### Communication
- **Regular Updates**: Commit messages with scoring progress
- **Visual Evidence**: Screenshots in all reports
- **Decision Rationale**: Document why changes were made
- **Knowledge Transfer**: Share learnings across team

---

*Last Updated: January 4, 2026*  
*Current Leader: ReactFlow (0.83 vs 0.67)*  
*Next Focus: ForceGraph parallel edge implementation*
