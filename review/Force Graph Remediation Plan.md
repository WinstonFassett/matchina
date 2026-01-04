# 🌲 Force Graph Remediation Plan
**Date**: January 3, 2026
**Priority**: High
**Target**: Bring Force Graph to parity with Mermaid & React Flow inspectors

---

## Current Status Assessment

### ✅ What's Already Working
- **Shape Integration**: `HSMForceGraphInspector.tsx` wrapper exists and functional
- **Converter Function**: `buildForceGraphData()` in `shapeToForceGraph.ts` works
- **Hierarchy Support**: Shows parent-child relationships with visual distinction
- **Interactive Features**: Node/edge clicking works for state transitions
- **Canvas Rendering**: Basic force-directed layout functioning

### ❌ What's Behind (Compared to ReactFlow/Mermaid)
1. **Mixed Architecture**: Base `ForceGraphInspector.tsx` contains legacy + shape code
2. **No Clean Separation**: Doesn't follow the established 3-layer adapter pattern
3. **Limited Visual Polish**: Less refined than other inspectors
4. **Debugging Gaps**: Missing comprehensive debug logging
5. **Layout Issues**: Force simulation may not handle hierarchical structure optimally

---

## Remediation Plan

### Phase 1: Architecture Cleanup (High Priority)

#### 1.1 Separate Legacy from Shape Support
**Target**: Clean up `ForceGraphInspector.tsx` to be shape-only like `SketchInspector`

**Files to modify**:
- `src/viz/ForceGraphInspector.tsx` (644 lines → ~400 lines)

**Actions**:
```typescript
// Remove legacy factory machine support (lines 160-214)
// Keep only shape-based processing (lines 124-159)
// Move all legacy logic to a separate LegacyForceGraphInspector if needed
```

#### 1.2 Standardize Adapter Pattern
**Target**: Make `HSMForceGraphInspector` the primary entry point

**Files to modify**:
- `src/viz/ForceGraphInspector/HSMForceGraphInspector.tsx` (59 lines)

**Actions**:
```typescript
// Follow exact pattern from HSMReactFlowInspector:
// 1. Extract shape with useMemo
// 2. Convert via buildForceGraphData()
// 3. Subscribe to machine for reactivity
// 4. Create dispatch function
// 5. Pass to base component
```

### Phase 2: Visual Polish (Medium Priority)

#### 2.1 Enhanced Hierarchy Visualization
**Target**: Improve visual distinction between compound states and leaf states

**Files to modify**:
- `src/viz/ForceGraphInspector/utils/shapeToForceGraph.ts`

**Actions**:
```typescript
// Enhanced node styling for compound states
const node: ForceGraphNode = {
  id: fullKey,
  name: stateNode.key,
  isGroup: hasChildren,
  level,
  group: parentKey,
  // Enhanced visual properties
  val: hasChildren ? 20 : 10,  // Larger for groups
  color: hasChildren ? '#f59e0b' : '#8b5cf6',  // Orange for groups
  isInitial: fullKey === shape.initialKey,
};
```

#### 2.2 Improved Layout Algorithm
**Target**: Better force simulation parameters for hierarchical graphs

**Files to modify**:
- `src/viz/ForceGraphInspector.tsx` (lines 533-551)

**Actions**:
```typescript
// Optimize force simulation for hierarchical structure
if (Graph.d3Force) {
  // Weaker link strength for better spacing
  const linkForce = Graph.d3Force("link");
  if (linkForce) linkForce.strength(0.01);
  
  // Add hierarchy-specific forces
  if (!Graph.d3Force("hierarchy")) {
    Graph.d3Force("hierarchy", d3.forceManyBody().strength(-50));
  }
  
  // Better collision detection
  if (!Graph.d3Force("collide")) {
    Graph.d3Force("collide", d3.forceCollide().radius(25));
  }
}
```

### Phase 3: Debugging & Development Tools (Medium Priority)

#### 3.1 Add Comprehensive Debug Logging
**Target**: Match the debugging capabilities of ReactFlow inspector

**Files to modify**:
- `src/viz/ForceGraphInspector/HSMForceGraphInspector.tsx`
- `src/viz/ForceGraphInspector.tsx`

**Actions**:
```typescript
// Add debug logging at key points
console.log('🌲 ForceGraph: Machine type:', definition.shape ? 'HSM' : 'Legacy');
console.log('🌲 ForceGraph: Nodes created:', nodes.length);
console.log('🌲 ForceGraph: Links created:', links.length);
console.log('🌲 ForceGraph: Hierarchy entries:', shape.hierarchy.size);
```

#### 3.2 Add Visual Debug Mode
**Target**: Optional debug overlay showing node IDs and hierarchy

**Files to modify**:
- `src/viz/ForceGraphInspector.tsx` (nodeCanvasObject function)

**Actions**:
```typescript
// Add debug mode prop
interface ForceGraphInspectorProps {
  debug?: boolean; // Show node IDs and hierarchy info
  // ... other props
}

// In nodeCanvasObject:
if (debug) {
  ctx.fillStyle = '#666';
  ctx.font = '8px monospace';
  ctx.fillText(`ID: ${node.id}`, node.x, node.y + 15);
  ctx.fillText(`L: ${node.level}`, node.x, node.y + 25);
}
```

### Phase 4: Feature Parity (Low Priority)

#### 4.1 Layout Options Panel
**Target**: Add layout controls similar to ReactFlow's layout panel

**Files to modify**:
- Create: `src/viz/ForceGraphInspector/LayoutPanel.tsx`
- Modify: `src/viz/ForceGraphInspector/HSMForceGraphInspector.tsx`

**Actions**:
```typescript
// Add layout options
interface ForceGraphOptions {
  linkStrength: number;
  nodeCharge: number;
  collisionRadius: number;
  showHierarchy: boolean;
  animationDuration: number;
}
```

#### 4.2 Theme Support
**Target**: Ensure proper dark/light theme support

**Files to modify**:
- `src/viz/ForceGraphInspector.tsx` (color variables)

**Actions**:
```typescript
// Use CSS variables for theming
const getThemeColor = (ref, ...vars) => {
  return getCssVar(ref, "--forcegraph-node-bg", "--card", "#8b5cf6");
};
```

---

## Implementation Order

### Week 1: Core Architecture
1. ✅ **Day 1**: Clean up ForceGraphInspector.tsx (remove legacy)
2. ✅ **Day 2**: Standardize HSMForceGraphInspector pattern
3. ✅ **Day 3**: Add comprehensive debug logging

### Week 2: Visual Enhancement
4. ✅ **Day 4**: Enhanced hierarchy visualization
5. ✅ **Day 5**: Improved force simulation parameters
6. ✅ **Day 6**: Visual debug mode implementation

### Week 3: Polish & Features
7. ✅ **Day 7**: Layout options panel
8. ✅ **Day 8**: Theme support refinement
9. ✅ **Day 9**: Documentation and examples

---

## Success Criteria

### Functional Parity
- ✅ Clean adapter pattern like ReactFlow/Mermaid
- ✅ Shape-only base component (no legacy mixing)
- ✅ Comprehensive debug logging
- ✅ Hierarchical visualization clarity

### Visual Quality
- ✅ Clear distinction between compound/leaf states
- ✅ Optimal layout for hierarchical graphs
- ✅ Smooth animations and interactions
- ✅ Proper theme support

### Developer Experience
- ✅ Consistent API with other inspectors
- ✅ Debug mode for troubleshooting
- ✅ Layout customization options
- ✅ Clear documentation

---

## Testing Strategy

### Unit Tests
```typescript
// Test shape conversion
test('buildForceGraphData creates correct hierarchy', () => {
  const shape = createTestShape();
  const data = buildForceGraphData(shape, { showHierarchy: true });
  expect(data.nodes).toHaveLength(expectedCount);
  expect(data.links.some(l => l.type === 'hierarchy')).toBe(true);
});

// Test adapter pattern
test('HSMForceGraphInspector follows three-layer pattern', () => {
  const machine = createTestMachine();
  const { getByTestId } = render(<HSMForceGraphInspector machine={machine} />);
  expect(getByTestId('force-graph-canvas')).toBeInTheDocument();
});
```

### Integration Tests
```typescript
// Test with real HSM machines
test('ForceGraph renders hierarchical machine correctly', async () => {
  const machine = createHierarchicalMachine();
  render(<HSMForceGraphInspector machine={machine} />);
  
  // Wait for force simulation to stabilize
  await waitFor(() => {
    expect(screen.getByTestId('force-graph-canvas')).toBeInTheDocument();
  });
  
  // Verify hierarchical structure
  const canvas = screen.getByTestId('force-graph-canvas');
  expect(canvas).toHaveAttribute('data-nodes', '6');
  expect(canvas).toHaveAttribute('data-groups', '2');
});
```

### Visual Regression Tests
```typescript
// Test visual consistency
test('ForceGraph visual output matches snapshot', async () => {
  const machine = createTestMachine();
  const { container } = render(<HSMForceGraphInspector machine={machine} />);
  
  // Wait for layout to settle
  await waitForLayoutStabilization();
  
  expect(container).toMatchScreenshot('force-graph-hierarchical.png');
});
```

---

## Risk Assessment

### High Risk
- **Force Simulation Complexity**: D3 force simulation can be unpredictable
- **Performance**: Large graphs may impact rendering performance

### Medium Risk
- **Layout Consistency**: Force layout may produce different results each time
- **Browser Compatibility**: Canvas rendering across browsers

### Low Risk
- **API Changes**: Following established patterns reduces this risk
- **Theme Integration**: Well-understood CSS variable system

---

## Dependencies

### External Dependencies
- `d3-force` - Already in use, stable dependency
- `force-graph` - Already in use, stable dependency

### Internal Dependencies
- Shape system (stable)
- Machine integration (stable)
- Theme system (stable)

---

## Timeline Estimate

**Total Effort**: 2-3 weeks
**Critical Path**: Architecture cleanup → Visual enhancement → Testing
**Parallel Work**: Documentation can be written during implementation

---

## Next Steps

1. **Immediate**: Start with Phase 1 architecture cleanup
2. **Validation**: Test with existing HSM examples
3. **Iteration**: Refine based on visual quality assessment
4. **Integration**: Update unified visualizer system
5. **Documentation**: Add to visualizer comparison guides

---

## Success Metrics

- **Code Quality**: < 400 lines in base component (down from 644)
- **Test Coverage**: > 90% for new functionality
- **Performance**: < 100ms render time for typical graphs
- **Visual Quality**: Consistent with other inspectors
- **Developer Experience**: Debug mode and layout options working

---

*This plan brings Force Graph to full parity with ReactFlow and Mermaid inspectors while maintaining the unique strengths of force-directed layout visualization.*
