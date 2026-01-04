# ReactFlow Current Behaviors Documentation
**Purpose**: Preserve existing quality behaviors during redesign  
**Source**: `CustomEdge.old.tsx` analysis  
**Date**: January 4, 2026

---

## 🎯 **Interactive Behaviors to Preserve**

### **Edge Highlighting System**:
```typescript
// Active/Inactive/Previous state handling
const getEdgeLabelStyle = (data: CustomEdgeData, labelStyle?: any, labelBgStyle?: any) => {
  // Dark mode detection
  const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  
  // Base styling with theme awareness
  const baseStyle = {
    backgroundColor: isDarkMode ? "#374151" : "#ffffff",
    color: isDarkMode ? "#d1d5db" : "#374151",
    // ... shadows, borders, padding
  };
  
  // Clickable edges get special styling
  if (data?.isClickable) {
    baseStyle.backgroundColor = isDarkMode ? "#4b5563" : "#f3f4f6";
    baseStyle.fontWeight = "500";
  }
  
  // Disabled/inactive edges
  if (!data?.isEnabled) {
    baseStyle.backgroundColor = isDarkMode ? "#1f2937" : "#f9fafb";
    baseStyle.opacity = "0.7";
  }
};
```

### **Self-Transition Handling**:
```typescript
// Complex self-transition logic with distributed positioning
const positions = [
  { x: sourceX, y: sourceY - halfHeight - 5, offsetY: -offset },     // Top
  { x: sourceX + halfWidth + 5, y: sourceY, offsetX: offset },      // Right  
  { x: sourceX, y: sourceY + halfHeight + 5, offsetY: offset },     // Bottom
  { x: sourceX - halfWidth - 5, y: sourceY, offsetX: -offset },     // Left
];

// Circular loop path with control points
const selfLoopPath = `
  M ${startX} ${startY}
  C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${startX} ${startY}
`;
```

### **Parallel Edge Offset System**:
```typescript
// Current approach - static perpendicular offset
function getSpecialPath(sourceX, sourceY, targetX, targetY, offset) {
  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;
  
  // Perpendicular offset calculation
  const perpX = (-dy / length) * offset;
  const perpY = (dx / length) * offset;
  
  return `M ${sourceX} ${sourceY} Q ${centerX + perpX} ${centerY + perpY} ${targetX} ${targetY}`;
}
```

---

## 🎨 **Styling System to Preserve**

### **Theme Integration**:
- **Dark mode detection**: `data-theme="dark"` attribute
- **Color schemes**: Consistent dark/light palettes
- **Accessibility**: Proper contrast ratios maintained

### **Edge Label Styling**:
- **Backgrounds**: Theme-aware fill colors
- **Borders**: Subtle borders with proper opacity
- **Typography**: Font weights, sizes, colors
- **Shadows**: Subtle box shadows for depth

### **Visual Polish**:
- **Transitions**: Smooth hover states
- **Padding**: Consistent spacing (2px 4px)
- **Border radius**: 4px for rounded corners
- **Pointer events**: `nodrag nopan` for interaction

---

## 🔄 **Event System to Preserve**

### **Click Handlers**:
- **Edge clicking**: `pointerEvents: "all"`
- **Event dispatching**: Custom event handling
- **State management**: Integration with state machine

### **Label Interactions**:
- **Label positioning**: Dynamic calculation based on edge path
- **Label styling**: Context-aware appearance
- **Label events**: Separate click handling from edge

---

## 📊 **Quality Metrics to Match**

### **Current Excellence**:
- **Interactivity**: 9/10 - Excellent click handling and highlighting
- **Styling**: 9/10 - Professional theme integration
- **Accessibility**: 8/10 - Good contrast and focus states
- **Performance**: 8/10 - Smooth rendering and interactions

### **Areas for Improvement**:
- **Edge routing**: 3/10 - Parallel edge overlap issues
- **Self-transitions**: 7/10 - Complex but could be simplified
- **Code quality**: 6/10 - Overly complex, hard to maintain

---

## 🎯 **Implementation Requirements**

### **Must Preserve**:
1. ✅ **Edge highlighting system** (active/inactive/previous)
2. ✅ **Theme integration** (dark/light modes)
3. ✅ **Click handlers** and event dispatching
4. ✅ **Label styling** and positioning
5. ✅ **Visual polish** (shadows, transitions, borders)

### **Must Improve**:
1. 🔄 **Parallel edge routing** (core issue)
2. 🔄 **Code architecture** (simplify, modernize)
3. 🔄 **Self-transition logic** (clean up complexity)
4. 🔄 **Performance** (optimize rendering)

---

## 🔍 **Key Insights for Redesign**

### **What Works Well**:
- **Theme system**: Robust dark/light handling
- **Label styling**: Professional appearance
- **Event handling**: Solid click interactions
- **Visual polish**: Attention to detail

### **What Needs Redesign**:
- **Edge routing algorithm**: Replace with ForceGraph approach
- **Parallel edge detection**: Add fundamental grouping logic
- **Self-transition complexity**: Simplify with cleaner math
- **Code organization**: Separate concerns better

---

*This documentation serves as the requirements specification for the new implementation, ensuring no quality is lost during the redesign process.*

**Next**: Create new ParallelEdge component skeleton with these behaviors as requirements.
