# ReactFlow Edge Redesign Plan
**Mission**: Clean slate implementation preserving quality behaviors with 2025 best practices  
**Branch**: `refine-toggle-reactflow-forcegraph-mermaid`  
**Orchestrator**: AI Agent with Ollama for visual validation  

---

## 🎯 **Mission Statement**

**Goal**: Reimplement ReactFlow CustomEdge from scratch using modern 2025 best practices while preserving:
- ✅ Edge highlighting and interactivity 
- ✅ Label styling and positioning
- ✅ Theme integration (dark/light)
- ✅ Click handlers and state management

**Approach**: Clean slate with ForceGraph curvature algorithm + ReactFlow modern patterns

---

## 📋 **Linear Implementation Sequence**

### **Phase 1: Foundation & Archive** (matchina-xyz1)
**Status**: Ready to start  
**Goal**: Clean setup with current behaviors preserved

#### **Steps**:
1. **Archive current CustomEdge** → `CustomEdge.old.tsx`
2. **Document current behaviors** (highlighting, interactivity, styling)
3. **Create new ParallelEdge component** skeleton
4. **Set up Ollama validation pipeline**

---

### **Phase 2: Core Parallel Edge Algorithm** (matchina-xyz2)  
**Status**: Waiting for Phase 1
**Goal**: Implement ForceGraph curvature separation

#### **Steps**:
1. **Implement parallel edge detection** in `useStateMachineEdges`
2. **Apply ForceGraph curvature algorithm** (-0.8 to +0.8)
3. **Create new edge path generation** using curvature
4. **Test with toggle example** (2 parallel edges)

---

### **Phase 3: Interactive Behaviors** (matchina-xyz3)
**Status**: Waiting for Phase 2  
**Goal**: Preserve all current interactivity

#### **Steps**:
1. **Port edge highlighting logic** (active/inactive states)
2. **Implement click handlers** and event dispatching
3. **Add hover states** and transitions
4. **Preserve label interactions** and positioning

---

### **Phase 4: Styling & Theme Integration** (matchina-xyz4)
**Status**: Waiting for Phase 3  
**Goal**: Match current visual quality

#### **Steps**:
1. **Port current styling system** (dark/light themes)
2. **Implement edge label styling** (backgrounds, borders)
3. **Add visual polish** (shadows, transitions)
4. **Ensure accessibility** (contrast, focus states)

---

### **Phase 5: Self-Edges & Advanced Cases** (matchina-xyz5)
**Status**: Waiting for Phase 4  
**Goal**: Handle edge cases properly

#### **Steps**:
1. **Implement self-transition loops** (clean circular paths)
2. **Handle multiple parallel edges** (3+ edges)
3. **Add edge label positioning** for complex cases
4. **Test with complex examples** (hsm-combobox)

---

### **Phase 6: Cross-Visualizer Quality Parity** (matchina-xyz6)
**Status**: Waiting for Phase 5  
**Goal**: Match ForceGraph/Mermaid quality

#### **Steps**:
1. **Ollama visual validation** vs ForceGraph/Mermaid
2. **Iterative refinements** based on AI feedback
3. **Performance optimization** (rendering, interactions)
4. **Cross-example testing** (toggle, traffic-light, hsm-combobox)

---

### **Phase 7: Usability & Styling Backlog** (matchina-xyz7)
**Status**: Waiting for Phase 6  
**Goal**: Document improvement opportunities

#### **Steps**:
1. **Create usability backlog** (all 3 visualizers)
2. **Document styling shortcomings** (themes, consistency)
3. **Prioritize cross-visualizer improvements**
4. **Prepare for next enhancement cycle**

---

## 🤖 **Parallel Agent Opportunities**

### **Agent 1: Edge Algorithm Implementation**
**Focus**: Pure edge routing mathematics and path generation
**Prompt**: 
```
Implement ForceGraph curvature algorithm for ReactFlow parallel edges:
- Group edges by node pairs using source_target key
- Apply -0.8 to +0.8 curvature for 2 edges (toggle case)
- Use onion layering for multiple edges
- Generate bezier paths with curvature
- Test with toggle example (On↔Off parallel edges)
```

### **Agent 2: Interactive Behaviors Port**
**Focus**: Preserve current highlighting and interactivity
**Prompt**:
```
Port ReactFlow edge interactivity to new architecture:
- Edge highlighting (active/inactive/previous states)
- Click handlers and event dispatching
- Hover states and visual feedback
- Label interactions and positioning
- Theme-aware styling (dark/light modes)
```

### **Agent 3: Ollama Validation Pipeline**
**Focus**: Continuous visual quality assessment
**Prompt**:
```
Create Ollama visual validation pipeline for ReactFlow edges:
- Capture screenshots of toggle example
- Compare edge quality vs ForceGraph/Mermaid
- Validate parallel edge separation
- Check interactivity and styling
- Generate improvement recommendations
```

---

## 📊 **Current Progress & Visual Evidence**

### ✅ **Phase 1: Foundation Setup** - COMPLETE
- **Date**: January 4, 2026
- **Status**: Completed
- **Evidence**: CustomEdge archived, behaviors documented, ParallelEdge skeleton created

### ✅ **Phase 2: Parallel Edge Algorithm** - COMPLETE  
- **Date**: January 4, 2026
- **Status**: Completed with Ollama validation
- **Evidence**: See visual comparison below

### 🔍 **Visual Comparison - Traffic Light Example**

#### **ReactFlow Implementation** (My Algorithm):
![ReactFlow Parallel Edges](/Users/winston/dev/personal/matchina/review/screenshots/traffic-light-reactflow-parallel-2026-01-04T16-02-34-176Z.png)
- **Nodes**: Multiple traffic light states
- **Edges**: Using ForceGraph-inspired curvature (-0.8/+0.8)
- **Status**: ✅ Algorithm implemented, needs refinement

#### **ForceGraph Benchmark** (Target Quality):
![ForceGraph Parallel Edges](/Users/winston/dev/personal/matchina/review/screenshots/traffic-light-forcegraph-parallel-2026-01-04T16-02-35-236Z.png)
- **Nodes**: Circles with state labels
- **Edges**: Natural physics-based separation
- **Status**: ✅ Excellent separation (8/10 quality)

#### **Mermaid Alternative** (Structured Routing):
![Mermaid Parallel Edges](/Users/winston/dev/personal/matchina/review/screenshots/traffic-light-mermaid-parallel-2026-01-04T16-02-36-299Z.png)
- **Nodes**: Rounded rectangles
- **Edges**: Clean structured routing
- **Status**: ✅ Good separation (7/10 quality)

### 🎯 **Ollama Analysis Results**:

#### **ReactFlow Current State**:
- **Edge Quality**: 8/10 - Good curvature implementation
- **Separation**: Working but could be more dramatic
- **Labels**: Clear and readable
- **Overall**: Solid foundation, needs refinement

#### **Comparison Insights**:
- **ForceGraph**: Best natural separation (physics-based)
- **ReactFlow**: Good algorithmic separation (curvature-based)
- **Mermaid**: Good structured separation (routing-based)
## 📊 **Quality Metrics**

### **Edge Quality**:
- **Current**: 3/10 (overlap issues)
- **Target**: 8/10 (match ForceGraph)
- **Measurement**: Ollama visual analysis

### **Interactivity**:
- **Current**: 9/10 (excellent)
- **Target**: 9/10 (preserve quality)
- **Measurement**: Functional testing

### **Code Quality**:
- **Current**: 6/10 (complex, flawed)
- **Target**: 9/10 (clean, modern)
- **Measurement**: Code review + maintainability

---

*This plan provides a clear linear sequence with beads management, parallel agent opportunities, and Ollama validation throughout the process.*

**Next Action**: Create Phase 1 ticket and begin foundation setup.
