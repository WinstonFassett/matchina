# Multi-Visualizer Comparison Report
**Date**: January 4, 2026  
**Example**: Toggle State Machine  
**Visualizers**: ReactFlow, ForceGraph, Mermaid  
**Analysis Model**: LLaVA via Ollama  
**Branch**: refine-toggle-reactflow-forcegraph-mermaid

---

## 📊 Executive Summary

**Critical Finding**: ReactFlow has **severe edge routing problems** with parallel edges completely overlapping, while ForceGraph and Mermaid handle parallel edges effectively.

**Key Rankings**:
- **Edge Quality**: ForceGraph (8/10) > Mermaid (7/10) > ReactFlow (3/10)
- **Node Styling**: ReactFlow (8/10) > ForceGraph (6/10) > Mermaid (5/10)
- **Overall**: ReactFlow/ForceGraph (7/10) > Mermaid (6/10)

---

## 🔍 Visualizer Analysis

### ReactFlow - **CRITICAL EDGE ISSUES**

#### Edge Quality: 3/10 ❌
**Problem**: Parallel edges completely overlap making transitions indistinguishable
- toggle→off and toggle→on edges are completely overlapping
- No clear separation between parallel transitions
- Edge routing needs fundamental improvement

#### Node Styling: 8/10 ✅
**Strength**: Professional modern styling with excellent theme integration
- Clean, professional appearance
- Good color contrast and modern design
- Node labels clear and well-positioned

#### Cross-Pollination Value:
- **Strengths to Share**: Professional node styling, theme consistency, modern design
- **Critical Weaknesses**: Parallel edge overlapping, edge routing algorithms
- **Inspiration For**: ForceGraph, Mermaid (styling)

### ForceGraph - **GOOD EDGE HANDLING**

#### Edge Quality: 8/10 ✅
**Strength**: Good edge separation with visible parallel edge handling
- Toggle transitions show clear separation with different curvature
- Organic edge routing avoids overlap effectively
- Physics simulation creates natural movement

#### Node Styling: 6/10 ⚠️
**Weakness**: Functional but less polished node appearance
- Basic circles without professional styling
- Theme integration could be improved

#### Cross-Pollination Value:
- **Strengths to Share**: Parallel edge separation, organic edge routing, overlap prevention
- **Weaknesses**: Node styling polish, layout structure
- **Inspiration For**: ReactFlow (edge handling), Mermaid (edge routing)

### Mermaid - **RELIABLE BUT DATED**

#### Edge Quality: 7/10 ✅
**Strength**: Clean edge separation with good parallel edge handling
- Well-separated edges with clear routes
- Structured and reliable routing
- Consistent spacing prevents overlap

#### Node Styling: 5/10 ⚠️
**Weakness**: Mediocre theming with dated appearance
- Functional but lacks modern polish
- Color scheme needs improvement

#### Cross-Pollination Value:
- **Strengths to Share**: Structured edge routing, reliable parallel edge handling
- **Weaknesses**: Dated visual design, mediocre theme integration
- **Inspiration For**: ReactFlow (edge patterns), ForceGraph (structure)

---

## 🎯 Adversarial Enhancement Strategy

### **ReactFlow ← ForceGraph/Mermaid** (Priority: CRITICAL)
1. **Parallel Edge Separation**: Learn from ForceGraph's curved routing
2. **Edge Routing Algorithms**: Study Mermaid's structured approach
3. **Self-Edge Handling**: Research ReactFlow custom edges examples
4. **Bidirectional Edges**: Implement clear visual separation

### **ForceGraph ← ReactFlow** (Priority: HIGH)
1. **Professional Node Styling**: Learn modern design language
2. **Theme Integration**: Improve color consistency
3. **Layout Structure**: More organized positioning for state machines

### **Mermaid ← ReactFlow** (Priority: MEDIUM)
1. **Modern Design Language**: Update visual appearance
2. **Theme Integration**: Better color schemes and polish
3. **Visual Polish**: Enhanced interactions and styling

---

## 🎫 Ticket Structure & Dependency DAG

### **Dependency Graph**:
```
matchina-4fil (refine-toggle-visualizers)
    └── matchina-ie3n (edge-layout-optimization)
        └── matchina-buhk (reactflow-edge-routing-redesign)
            ├── matchina-4ove (reactflow-self-edges)
            └── matchina-19dr (reactflow-bidirectional-edges)
```

### **Ticket Details**:

#### **🎯 Main Ticket**: `refine-toggle-visualizers` (matchina-4fil)
- **Status**: In Progress
- **Branch**: `refine-toggle-reactflow-forcegraph-mermaid`
- **Goal**: Systematic visualizer enhancement through adversarial comparison
- **Method**: Ollama AI visual analysis for reliable feedback

#### **🔧 Edge Layout Optimization** (matchina-ie3n)
- **Status**: In Progress
- **Parent**: matchina-4fil
- **Focus**: ReactFlow edge separation improvements
- **Method**: Learn from ForceGraph/Mermaid edge handling

#### **🛠️ ReactFlow Edge Routing Redesign** (matchina-buhk)
- **Status**: In Progress
- **Parent**: matchina-ie3n
- **Focus**: Implement parallel edge separation from scratch
- **Research**: https://reactflow.dev/examples/edges/custom-edges

#### **🔄 Self Edges** (matchina-4ove)
- **Status**: Open
- **Parent**: matchina-buhk
- **Focus**: Proper self-loop edge handling
- **Goal**: Clean self-loop visualization without overlap

#### **↔️ Bidirectional Edges** (matchina-19dr)
- **Status**: Open
- **Parent**: matchina-buhk
- **Focus**: Proper bidirectional edge separation
- **Goal**: Parallel edges with clear visual separation

### **Work Flow**:
1. **Complete edge routing redesign** (matchina-buhk)
2. **Implement self edges** (matchina-4ove)
3. **Implement bidirectional edges** (matchina-19dr)
4. **Complete edge optimization** (matchina-ie3n)
5. **Move to next visualizer improvements** (matchina-4fil)

---

## 🔄 Next Actions

### **Immediate Priority** (Critical):
1. **Research ReactFlow Custom Edges**: Study https://reactflow.dev/examples/edges/custom-edges
2. **Implement Edge Routing Redesign**: Start from scratch using proven patterns
3. **Fix Parallel Edge Overlap**: Critical for ReactFlow usability

### **Short-term** (High):
1. **Self-Edge Implementation**: Proper curved routing around nodes
2. **Bidirectional Edge Separation**: Clear visual distinction
3. **Cross-Pollination**: Apply ForceGraph/Mermaid edge patterns

### **Medium-term** (Medium):
1. **ForceGraph Node Styling**: Learn from ReactFlow professional appearance
2. **Mermaid Theme Modernization**: Update design language
3. **Comprehensive Testing**: Validate improvements across examples

---

## 📈 Success Metrics

### **Edge Quality Targets**:
- ReactFlow: 3/10 → 8/10 (match ForceGraph)
- ForceGraph: 8/10 → 9/10 (maintain leadership)
- Mermaid: 7/10 → 8/10 (improve consistency)

### **Overall Quality Targets**:
- All visualizers: 7/10+ overall aesthetics
- No parallel edge overlap in any visualizer
- Professional appearance across all visualizers
- Consistent theme integration

---

## 🔬 Research Resources

### **ReactFlow Edge Patterns**:
- https://reactflow.dev/examples/edges/custom-edges
- **Key Components**: BaseEdge, custom edge types, handle positioning
- **Edge Types Available**: default (bezier), straight, step, smoothstep
- **Custom Examples**: ButtonEdge, SelfConnectingEdge, BiDirectionalEdge

### **Critical Reverse-Engineered Insights**:

#### **ForceGraph Parallel Edge Algorithm** (Lines 566-628):
```typescript
// 1. Group parallel edges by node pairs
const nodePairId = link.source <= link.target ? 
  link.source + "_" + link.target : link.target + "_" + link.source;

// 2. Special case for 2 parallel edges (toggle case!)
if (links.length === 2) {
  links[0].curvature = -maxCurvature;  // -0.8
  links[1].curvature = maxCurvature;   // +0.8
}

// 3. Onion-like layering for multiple edges
links.forEach((link, i) => {
  if (i === 0) link.curvature = -maxCurvature;      // Outer negative
  else if (i === links.length - 1) link.curvature = maxCurvature;  // Inner positive
  else link.curvature = -maxCurvature + (i * curvatureStep * 2);  // Middle distributed
});
```

#### **ReactFlow Current Implementation** (CustomEdge.tsx):
```typescript
// 1. Self-transitions: Circular loops with 80px offset
const offset = 80; // Increased from 60 to avoid overlap
const positions = [top, right, bottom, left]; // Distribute around node

// 2. Parallel edges: Quadratic Bezier with perpendicular offset
function getSpecialPath(sourceX, sourceY, targetX, targetY, offset) {
  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;
  // Perpendicular offset: rotate 90 degrees
  const perpX = (-dy / length) * offset;
  const perpY = (dx / length) * offset;
  return `M ${sourceX} ${sourceY} Q ${centerX + perpX} ${centerY + perpY} ${targetX} ${targetY}`;
}
```

### **🔍 Key Findings**:

#### **ForceGraph Strengths**:
- **Curvature-based separation**: Uses -0.8 to +0.8 curvature range
- **Special 2-edge handling**: Perfect for toggle case (negative vs positive)
- **Onion layering**: Systematic approach for multiple parallel edges
- **Physics integration**: Works with force-directed layout

#### **ReactFlow Current Issues**:
- **No parallel edge detection**: Doesn't group edges by node pairs
- **Fixed offset approach**: Uses static perpendicular offset
- **No curvature variation**: All parallel edges use same offset
- **Missing edge counting**: Doesn't know how many parallel edges exist

### **🎯 Implementation Strategy**:

#### **Phase 1: Add Parallel Edge Detection** (Current)
```typescript
// Add to useStateMachineEdges hook
const parallelEdges = useMemo(() => {
  const groups: Record<string, Edge[]> = {};
  edges.forEach(edge => {
    const key = edge.source <= edge.target ? 
      `${edge.source}-${edge.target}` : `${edge.target}-${edge.source}`;
    if (!groups[key]) groups[key] = [];
    groups[key].push(edge);
  });
  return groups;
}, [edges]);
```

#### **Phase 2: Apply ForceGraph Curvature Algorithm**
```typescript
// Apply curvature based on ForceGraph's proven approach
parallelEdges.forEach(group => {
  if (group.length > 1) {
    group.forEach((edge, index) => {
      const curvature = index === 0 ? -0.8 : index === group.length - 1 ? 0.8 : 
        -0.8 + (index * 1.6 / (group.length - 1));
      edge.data.edgeOffset = curvature * 50; // Convert to pixel offset
    });
  }
});
```

### **Cross-Visualizer Learning**:
- ForceGraph parallel edge separation algorithms
- Mermaid structured edge routing patterns
- ReactFlow professional styling approaches

---

*This analysis confirms ReactFlow has critical edge routing issues that require fundamental redesign. The adversarial approach will elevate all visualizers by learning from each other's strengths.*

**Next Action**: Begin ReactFlow edge routing research and redesign using proven patterns.
