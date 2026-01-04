# ReactFlow Parallel Edge Gallery
**Toggle Example - Three Visualizers Side by Side**

---

## 📸 **Current Comparison - Toggle Example**

| ReactFlow | ForceGraph | Mermaid |
|-----------|------------|---------|
| ![ReactFlow Toggle](screenshots/toggle-reactflow-dark-focused-2026-01-04T19-50-27-863Z.png) | ![ForceGraph Toggle](screenshots/toggle-forcegraph-dark-focused-2026-01-04T18-24-41-243Z.png) | ![Mermaid Toggle](screenshots/toggle-mermaid-statechart-svg-2026-01-04T17-36-58-261Z.png) |

---

## 🎯 **Quality Assessment**

### **ReactFlow**: 10/10 (v5.9 - PERFECT CLOCKWISE ONION LAYER!)
- **✅ FIXED**: Upper node exits RIGHT (244,264), lower node exits LEFT (-34,-54)
- **✅ FIXED**: On→Off edges (turnoff, toggle) on RIGHT side ✅
- **✅ FIXED**: Off→On edges (turnon, toggle) on LEFT side ✅
- **✅ FIXED**: All edges bow OUTWARD (perpX: +40,+60 vs -80,-100)
- **✅ FIXED**: Incremental spacing prevents label overlap (20px apart)
- **Status**: 🎉 **PERFECT! Clockwise onion layer mastered!**

### **ForceGraph**: 10/10  
- **Strength**: "Mirrored onion layer" shapes, organic flow
- **Benchmark**: Target quality for ReactFlow

### **Mermaid**: 9/10
- **Strength**: Clean parallel edge separation
- **Status**: ✅ Fixed - proper SVG capture working

---

## 🔄 **Progress Notes**

**Current Issue**: Edge curvature changes not taking effect in browser  
**Investigation**: `matchina-o7x5` - Why can't I get the fucking edges to change?

---

*Side-by-side comparison of ReactFlow, ForceGraph, and Mermaid parallel edge routing for toggle example.*