# ReactFlow Toggle Edge Routing Comparison
**Parallel Edge Separation Quality Assessment**

---

## 📸 **Side-by-Side Comparison - Toggle Example**

| ReactFlow                                                                                    | ForceGraph                                                                                | Mermaid                                                                                    |
| -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| ![ReactFlow Toggle](screenshots/toggle-reactflow-dark-focused-2026-01-04T17-44-29-961Z.png) | ![ForceGraph Toggle](screenshots/forcegraph-parallel-2026-01-04T16-00-02-898Z.png) | ![Mermaid Toggle](screenshots/toggle-mermaid-statechart-svg-2026-01-04T17-36-58-261Z.png) |

---

## 🎯 **Quality Assessment**

### **ReactFlow**: 6/10 (v1.1 - ±1.2 curvature)
- **Improvement**: Increased curvature from ±0.8 to ±1.2
- **Issue**: Still mechanical, no "mirrored onion layer" shape
- **Gap**: Algorithmic vs natural separation
- **Target**: Match ForceGraph's organic flow

### **ForceGraph**: 10/10  
- **Strength**: Natural physics-based separation
- **Quality**: Perfect organic flow and spacing
- **Benchmark**: Target quality for ReactFlow

### **Ollama Vision Analysis** (Based on 2 actual visualizers):
- **ForceGraph**: 9/10 - Best edge separation, sleek and clean aesthetic
- **ReactFlow**: 7/10 - Mix of separated and overlapping edges, utilitarian design
- **Mermaid**: N/A - Toggle rendering broken, showing app UI instead of diagram

**AI Recommendations for ReactFlow**:
- Improved algorithms for edge separation and overlapping detection
- More visual cues to indicate edge connections
- Enhanced appearance and usability

---

## 🔍 **Detailed Analysis**

### **ReactFlow Toggle - Current Issues**
![ReactFlow Toggle Detailed](screenshots/toggle-reactflow-dark-focused-2026-01-04T17-44-29-961Z.png)

**Problems**:
- Curvature too mechanical (-0.8/+0.8)
- No natural flow between edges
- Separation exists but looks artificial
- Edge labels positioned awkwardly

**What to Fix**:
- Increase curvature magnitude for more dramatic separation
- Add organic flow characteristics
- Improve label positioning on curved paths
- Match ForceGraph's natural physics behavior

### **ForceGraph Toggle - Target Quality**
![ForceGraph Toggle Detailed](screenshots/forcegraph-parallel-2026-01-04T16-00-02-898Z.png)

**Excellence**:
- Natural physics-based edge separation
- Organic flow between parallel edges
- Perfect spacing and visual hierarchy
- Professional appearance

**What to Replicate**:
- Physics-inspired curvature calculation
- Natural edge flow patterns
- Optimal separation distance
- Visual hierarchy through spacing

### **Mermaid Toggle Statechart - Fixed**
![Mermaid Toggle Detailed](screenshots/toggle-mermaid-statechart-svg-2026-01-04T17-36-58-261Z.png)

**Excellence**:
- Clean parallel edge separation
- Professional appearance  
- Proper SVG rendering
- Clear node and edge visualization

**What to Replicate**:
- Clean edge separation
- Professional styling
- Clear visual hierarchy

---

## 🎯 **ReactFlow Improvement Targets**

### **Immediate Goals**:
1. **Increase Curvature**: From ±0.8 to ±1.2 for more dramatic separation
2. **Add Organic Flow**: Smooth transitions between parallel edges
3. **Fix Label Positioning**: Better placement on curved paths
4. **Match Visual Quality**: Achieve 8/10+ rating

### **Technical Approach**:
- ✅ **Increased curvature**: From ±0.8 to ±1.2 for more dramatic separation
- ✅ **Improved spacing**: From 0.2 to 0.3 minimum curvature
- 🔄 **Next**: Add organic flow characteristics
- 🔄 **Next**: Improve bezier path generation
- 🔄 **Next**: Optimize label positioning math

---

## 📊 **Progress Tracking**

| Version | Curvature | Quality Score | Notes |
|---------|-----------|---------------|-------|
| v1.0 | ±0.8 | 5/10 | Basic separation achieved |
| v1.1 | ±1.2 | 6/10 | Increased curvature, still mechanical |
| Target | ±1.5+ | 8/10+ | Match ForceGraph's "mirrored onion layer" shape |

---

*Focused engineering assessment of ReactFlow edge routing quality vs ForceGraph and Mermaid benchmarks for toggle example.*
