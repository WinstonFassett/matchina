# Visualization UX Design & Unification

## Executive Summary

This document analyzes the current visualization landscape and proposes a unified, consistent approach for presenting state machine visualizations across all examples.

## Current State Analysis

### Visualization Components (4 types)

1. **ReactFlow** - Interactive node-based with ELK layout, draggable, configurable algorithms
2. **ForceGraph** - Canvas-based force-directed graph, particle animations, hierarchy support
3. **Mermaid** - SVG diagrams (statechart/flowchart), static but familiar
4. **Sketch** - CSS-based nested boxes, hierarchical, Sketch Systems style

### Critical Inconsistencies

| Aspect | MachineExampleWithChart | VisualizerDemo |
|--------|------------------------|----------------|
| **Default viz** | `force-graph` | `sketch` |
| **Prop name** | `inspectorType` | `defaultVisualizer` |
| **Picker UI** | Dropdown `<select>` | Button group |
| **Layout** | Split view (left/right) | Full-width stacked |
| **Height** | 384px (`h-96`) | 400px |
| **Examples using** | 14 examples | 5 HSM examples |
| **Responsive** | `flex-col md:flex-row` | Always full-width |

### Pain Points

1. **Two different picker UIs** - Users experience different controls across examples
2. **Force Graph listed but unavailable** - Shows "not available" placeholder in MachineExampleWithChart
3. **No picker option filtering** - Can't restrict which viz are available per example
4. **Hardcoded defaults** - No smart selection based on machine characteristics
5. **Inconsistent heights** - Arbitrary 384px vs 400px
6. **Layout inflexibility** - Split vs stacked, no middle ground
7. **Mobile experience** - Viz stacks above UI, loses live interaction visibility
8. **Mermaid diagram type** - Only configurable in one wrapper
9. **Layout panel** - ReactFlow layout config appears as modal, inconsistent with other controls

---

## Design Principles

### 1. Progressive Enhancement
Start with the best default, allow exploration of alternatives when beneficial.

### 2. Contextual Intelligence
The best visualizer depends on machine characteristics:
- **Hierarchical machines** → Sketch or ForceGraph (hierarchy mode)
- **Simple machines (≤5 states)** → Mermaid (clean, familiar)
- **Complex flat machines** → ReactFlow (interactive, customizable layout)
- **Dense transition graphs** → ForceGraph (force-directed untangling)

### 3. Consistency Over Features
One unified picker, one layout system, one configuration API.

### 4. Mobile-First Responsiveness
Viz must remain useful on all screen sizes while maintaining live interaction visibility.

---

## Proposed Unified Design

### A. Single Wrapper Component: `MachineVisualizer`

Replace both `MachineExampleWithChart` and `VisualizerDemo` with one component.

```tsx
<MachineVisualizer
  machine={machine}
  AppView={CustomView}

  // Smart defaults
  defaultViz="auto"  // or explicit: "reactflow" | "forcegraph" | "mermaid" | "sketch"

  // Picker configuration
  availableViz={["reactflow", "forcegraph", "mermaid", "sketch"]}  // default: all
  showPicker={true}  // default: true if availableViz.length > 1
  pickerStyle="buttons"  // or "dropdown"

  // Layout configuration
  layout="split"  // "split" | "stacked" | "auto"
  vizPosition="left"  // "left" | "right" | "top" | "bottom"
  minVizHeight={400}  // responsive: uses vh on mobile, px on desktop

  // Interactivity
  interactive={true}  // allow clicking transitions in viz
  showRawState={false}  // debug panel

  // Mermaid-specific
  mermaidDiagramType="statechart"  // "statechart" | "flowchart"
  allowDiagramTypeToggle={false}
/>
```

### B. Auto-Selection Algorithm

When `defaultViz="auto"`:

```typescript
function selectBestVisualizer(machine: Machine): VisualizerType {
  const shape = extractShape(machine);
  const stateCount = countStates(shape);
  const hasHierarchy = hasNestedStates(shape);
  const transitionDensity = calculateTransitionDensity(shape);

  if (hasHierarchy) {
    return "sketch";  // Best for hierarchical visualization
  }

  if (stateCount <= 5 && transitionDensity < 0.5) {
    return "mermaid";  // Clean, familiar for simple machines
  }

  if (transitionDensity > 0.7) {
    return "forcegraph";  // Force-directed layout handles dense graphs
  }

  return "reactflow";  // Default for complex flat machines
}
```

### C. Unified Picker Component

One picker UI with two style variants:

#### **Button Group Style** (Recommended)
```
┌─────────────────────────────────────────────────┐
│ ○ Sketch  ● ReactFlow  ○ ForceGraph  ○ Mermaid │
└─────────────────────────────────────────────────┘
```
- Clear visual active state
- Touch-friendly
- Accessible (keyboard navigation)
- Icons + labels for clarity

#### **Dropdown Style** (Compact)
```
┌──────────────────┐
│ ReactFlow ▼      │
├──────────────────┤
│ • ReactFlow      │
│   Sketch         │
│   ForceGraph     │
│   Mermaid        │
└──────────────────┘
```
- Space-saving
- Good for 5+ options
- Use when vertical space is limited

**Implementation**: Single `<VizPicker>` component with `style` prop.

### D. Responsive Layout System

#### Desktop/Tablet (≥768px)
```
┌─────────────────────────────────────────────┐
│  Picker: ○ Sketch  ● ReactFlow  ○ Force... │
├──────────────────┬──────────────────────────┤
│                  │                          │
│   Visualizer     │      App View            │
│   (min 400px)    │      (flexible)          │
│                  │                          │
└──────────────────┴──────────────────────────┘
```
- Split view (50/50 or configurable)
- Picker above both panels
- Viz and UI visible simultaneously for live interaction

#### Mobile (<768px)
```
┌─────────────────────────────────────────────┐
│  Picker: ○ Sketch  ● ReactFlow  ...        │
├─────────────────────────────────────────────┤
│                                             │
│           App View                          │
│           (flexible height)                 │
│                                             │
├─────────────────────────────────────────────┤
│                                             │
│           Visualizer                        │
│           (40vh - 50vh)                     │
│                                             │
└─────────────────────────────────────────────┘
```
- Stacked layout (App above, Viz below)
- Viz uses viewport height units for responsiveness
- Scroll to see viz after interaction
- Alternative: Collapsible viz section

#### Sticky Viz Option (Desktop)
```
┌──────────────────┬──────────────────────────┐
│                  │  Picker + Controls       │
│   Visualizer     │  ────────────────────    │
│   (sticky)       │                          │
│                  │      App View            │
│                  │      (scrollable)        │
│                  │                          │
│                  │                          │
└──────────────────┴──────────────────────────┘
```
- Viz stays in view during scroll
- Good for long app UIs
- Optional via `stickyViz={true}`

### E. Dimension Strategy

Replace arbitrary fixed heights with responsive system:

```typescript
const vizDimensions = {
  // Desktop/Tablet
  desktop: {
    split: {
      minHeight: 400,
      maxHeight: 800,
      defaultHeight: 500,  // vh-based or px
    },
    stacked: {
      height: '50vh',
      minHeight: 400,
      maxHeight: 600,
    }
  },

  // Mobile
  mobile: {
    height: '45vh',
    minHeight: 300,
    maxHeight: 500,
  }
};
```

### F. Configuration Presets

Common use cases as presets:

```typescript
// Simple machines
<MachineVisualizer preset="simple" machine={machine} />
// → defaultViz="mermaid", availableViz=["mermaid", "sketch"], layout="stacked"

// Hierarchical machines
<MachineVisualizer preset="hierarchical" machine={machine} />
// → defaultViz="sketch", availableViz=["sketch", "forcegraph"], layout="split"

// Complex machines
<MachineVisualizer preset="complex" machine={machine} />
// → defaultViz="reactflow", availableViz="all", layout="split", stickyViz=true

// Minimal (docs/tutorials)
<MachineVisualizer preset="minimal" machine={machine} />
// → defaultViz="auto", showPicker=false, layout="stacked"
```

---

## Migration Strategy

### Phase 1: Build Unified Component
1. Create `MachineVisualizer.tsx` in `/docs/src/components/`
2. Implement unified picker (`VizPicker.tsx`)
3. Implement auto-selection algorithm
4. Implement responsive layout system
5. Add configuration presets

### Phase 2: Migrate Examples
1. Start with 3 representative examples (simple, hierarchical, complex)
2. Test across devices/screen sizes
3. Migrate remaining examples in batches
4. Update documentation

### Phase 3: Deprecate Old Wrappers
1. Mark `MachineExampleWithChart` and `VisualizerDemo` as deprecated
2. Add console warnings
3. Remove after all examples migrated

---

## Open Questions for Discussion

1. **Default picker style**: Buttons vs dropdown? (Recommend: buttons)
2. **Auto-selection**: Enable by default or opt-in? (Recommend: opt-in with clear docs)
3. **Mobile layout**: Stacked with scroll, or collapsible viz? (Recommend: stacked, optional collapse)
4. **Viz-specific controls**: How to handle ReactFlow layout panel, Mermaid diagram type toggle?
   - Option A: Unified "Viz Settings" panel (gear icon)
   - Option B: Inline controls below picker (context-aware)
5. **Transition animations**: Should viz change have a transition when switching?
6. **Persistence**: Remember user's viz preference per example (localStorage)?
7. **URL state**: Sync viz selection to URL query param for shareable links?

---

## Recommended Defaults

Based on analysis and UX principles:

| Aspect | Recommendation | Rationale |
|--------|---------------|-----------|
| **Default viz** | `auto` with smart selection | Best experience per machine type |
| **Picker style** | `buttons` | More discoverable, touch-friendly |
| **Layout** | `split` on desktop, `stacked` on mobile | Live interaction visibility |
| **Height** | Responsive (40-50vh mobile, 500px desktop) | Adapts to screen size |
| **Show picker** | `true` if 2+ viz available | Encourage exploration |
| **Available viz** | All 4 types by default | Maximum flexibility |
| **Interactive** | `true` | Align with library philosophy |

---

## Next Steps

1. **Review & feedback** on this design doc
2. **Decide on open questions** (especially picker style, mobile layout)
3. **Create implementation tickets** for Phase 1
4. **Build & test** unified component
5. **Iterate** based on real usage

---

## Appendix: Current File Structure

### Viz Components (`/src/viz/`)
- `ReactFlowInspector/` - Interactive node graph
- `ForceGraphInspector/` - Force-directed canvas
- `MermaidInspector.tsx` - SVG diagrams
- `SketchInspector.tsx` - CSS nested boxes
- `HSM*Inspector.tsx` - HSM adapters

### Wrapper Components (`/docs/src/components/`)
- `MachineExampleWithChart.tsx` - Primary wrapper (14 examples)
- `HSMVisualizerDemo.tsx` - HSM wrapper (5 examples)

### Example Usage (`/docs/src/code/examples/*/example.tsx`)
- 20 examples with varying configurations
- Most use explicit `inspectorType` or `defaultVisualizer`
- Inconsistent defaults and layouts
