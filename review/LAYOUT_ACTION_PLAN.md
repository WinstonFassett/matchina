# Layout Engine Action Plan

## 🚨 Critical Issues Found

### 1. Semantic Mismatch: "Circular" vs "Radial"
**Problem**: We're using ELK `radial` algorithm for "circular" layouts
- **ELK Radial**: Tree-based radial layout ("takes a tree")
- **Graphviz Circo**: True circular layout ("finds biconnected components")
- **Impact**: Fails on cyclic graphs (traffic light) with "not a tree" error

**Solution**: Replace `radial` with `graphviz.circo`

### 2. Missing ELK Algorithms
**Problem**: ELK has 21 algorithms, we only use 5
**Missing Graphviz algorithms**:
- `graphviz.circo` - True circular layouts (fixes our issue)
- `graphviz.dot` - Alternative hierarchical
- `graphviz.twopi` - Radial tree layouts
- `graphviz.neato` - Additional force-directed
- `graphviz.fdp` - Another force-directed

### 3. Untested Layouts
**Problem**: 2/6 layouts never actually tested
- **Tree layout** - Assumed working, not verified
- **Force layout** - Assumed working, not verified

## 🎯 Immediate Actions

### Action 1: Fix Circular Layout (Critical)
```typescript
// Current (broken)
[LayoutType.CIRCULAR]: 'radial'  // Tree-only, fails on cycles

// Fixed
[LayoutType.CIRCULAR]: 'graphviz.circo'  // True circular, handles cycles
```

**Files to update**:
- `/src/viz/ReactFlowV2/layout/LayoutManager.ts` - Algorithm mapping
- `/src/viz/ReactFlowV2/layout/engines/ELKLayoutEngine.ts` - Schema + options

### Action 2: Add Missing Algorithms (Important)
```typescript
// Add to ELKLayoutSettings schema
algorithm: z.enum([
  'layered', 'force', 'stress', 'mrtree', 'box', 'radial',
  'graphviz.circo', 'graphviz.dot', 'graphviz.twopi', 
  'graphviz.neato', 'graphviz.fdp'
]).default('layered')
```

### Action 3: Complete Testing (Critical)
- Test Tree layout with hierarchical data
- Test Force layout with both flat and hierarchical data
- Verify graphviz.circo fixes traffic light circular layout

## 💡 Improvement Opportunities

### Post-processing with SPOrE
**Idea**: Use SPOrE overlap removal for label positioning
```typescript
// Two-pass layout
const layout = await elk.layout(graph, { algorithm: 'layered' });
const fixedLayout = await elk.layout(layout, { algorithm: 'sporeOverlap' });
```

**Benefits**:
- Fix edge label overlaps automatically
- Resolve node positioning conflicts
- Improve readability of dense graphs

### Edge Type Configuration
**Idea**: Add edge type as common setting
```typescript
interface CommonLayoutSettings {
  edgeType: 'straight' | 'bezier' | 'step' | 'orthogonal';
  // Apply to all layouts
}
```

### Layout Animations
**Idea**: Animate between layout transitions
- Reference: https://reactflow.dev/examples/nodes/node-position-animation
- Track previous positions, interpolate changes
- Smooth user experience when switching layouts

## 📋 Implementation Steps

### Step 1: Schema Updates
1. Add Graphviz algorithms to ELKLayoutSettings schema
2. Add graphviz.circo options to ELKLayoutEngine
3. Update LayoutManager algorithm mapping

### Step 2: Testing & Verification
1. Test graphviz.circo with traffic light (should work)
2. Test Tree layout with HSM data
3. Test Force layout with both flat and hierarchical data
4. Update LAYOUT_ENGINE_ANALYSIS.md with results

### Step 3: Documentation
1. Update algorithm descriptions
2. Document Graphviz algorithm differences
3. Create testing checklist for future layouts

### Step 4: Future Enhancements
1. Implement SPOrE overlap removal
2. Add edge type configuration
3. Explore layout animations

## 🔍 Expected Outcomes

### After Fixing Circular Layout
- ✅ Traffic light circular layout works
- ✅ State machines with cycles supported
- ✅ No more "not a tree" errors

### After Adding Graphviz Algorithms
- ✅ 9 algorithms available instead of 5
- ✅ More layout options for different use cases
- ✅ Better algorithm-fit for specific needs

### After Complete Testing
- ✅ 6/6 layouts verified working
- ✅ Clear understanding of each layout's capabilities
- ✅ Reliable layout system

## 🚀 Long-term Vision

### Phase 1: Stability (Current sprint)
- Fix critical circular layout issue
- Complete testing coverage
- Stabilize existing functionality

### Phase 2: Quality (Next sprint)
- Add SPOrE overlap resolution
- Implement edge type configuration
- Improve layout quality

### Phase 3: Advanced (Future)
- Layout transition animations
- Collision detection integration
- Component-based layouts

## 📊 Success Metrics

### Technical Metrics
- **Layout success rate**: Target 100% (6/6 working)
- **Test coverage**: 100% of layouts verified
- **Error rate**: 0% layout failures

### User Experience Metrics
- **Layout switching**: Smooth transitions
- **Visual quality**: No overlapping labels/nodes
- **Performance**: Fast layout calculations

### Development Metrics
- **Code complexity**: Maintainable ELK integration
- **Documentation**: Complete algorithm reference
- **Testing**: Automated layout tests

## 🎯 Next Immediate Task

**Fix circular layout by replacing `radial` with `graphviz.circo`**

This single change should:
- Fix the traffic light circular layout error
- Enable proper circular layouts for state machines
- Resolve the "not a tree" limitation
- Provide true circular arrangement (not radial tree)

**Priority**: Critical - this is a broken feature that should work.
