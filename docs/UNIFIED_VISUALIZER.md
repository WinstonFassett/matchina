# Unified Visualizer System

This document describes the new unified visualizer system that replaces `MachineExampleWithChart` and `HSMVisualizerDemo` with a single, consistent `MachineVisualizer` component.

## Overview

**Location**: `/docs/src/components/MachineVisualizer.tsx`

**Key Features**:
- Single unified API for all examples
- Flat list of 5 visualizer options in dropdown
- Smart auto-selection based on machine characteristics
- Responsive layouts (split/stacked)
- Configuration presets for common use cases
- No changes to viz components themselves

## Components

### MachineVisualizer

Main wrapper component for displaying state machines with visualization.

```tsx
import { MachineVisualizer } from '@components/MachineVisualizer';

<MachineVisualizer
  machine={machine}
  AppView={CustomView}
  defaultViz="auto"
  layout="split"
  interactive={true}
/>
```

### VizPicker

Dropdown component showing flat list of all visualizer permutations:
1. ReactFlow
2. Sketch
3. ForceGraph
4. Mermaid - Statechart
5. Mermaid - Flowchart

Auto-hides when only one option available.

## API Reference

### MachineVisualizerProps

```typescript
interface MachineVisualizerProps {
  // Required
  machine: FactoryMachine<any>;

  // Optional
  AppView?: ComponentType;          // Custom UI component
  defaultViz?: VisualizerType | 'auto';  // Initial visualizer
  availableViz?: VisualizerType[];  // Restrict available options
  showPicker?: boolean;             // Show/hide picker (auto if >1 option)
  layout?: 'split' | 'stacked' | 'auto';  // Layout mode
  vizPosition?: 'left' | 'right' | 'top' | 'bottom';
  minVizHeight?: number;            // Min height in pixels (default: 400)
  interactive?: boolean;            // Enable clickable transitions (default: true)
  showRawState?: boolean;           // Debug state panel
  title?: string;                   // Title above component
  preset?: 'simple' | 'hierarchical' | 'complex' | 'minimal';
  className?: string;
}
```

### VisualizerType

```typescript
type VisualizerType =
  | 'reactflow'
  | 'sketch'
  | 'forcegraph'
  | 'mermaid-statechart'
  | 'mermaid-flowchart';
```

## Auto-Selection Algorithm

When `defaultViz="auto"`, the system analyzes the machine and selects the best visualizer:

```typescript
function selectBestVisualizer(machine) {
  const analysis = analyzeMachine(machine);

  // Hierarchical machines → Sketch
  if (analysis.hasHierarchy) return 'sketch';

  // Simple machines (≤5 states, low density) → Mermaid
  if (analysis.stateCount <= 5 && analysis.transitionDensity < 0.5) {
    return 'mermaid-statechart';
  }

  // Dense graphs → ForceGraph
  if (analysis.transitionDensity > 0.7) {
    return 'forcegraph';
  }

  // Default → ReactFlow
  return 'reactflow';
}
```

**Performance**: Lightweight analysis with no CPU impact.

## Configuration Presets

### Simple Machines

```tsx
<MachineVisualizer preset="simple" machine={machine} />
```

- Default: `mermaid-statechart`
- Available: Mermaid Statechart, Mermaid Flowchart, Sketch
- Layout: Stacked

### Hierarchical Machines

```tsx
<MachineVisualizer preset="hierarchical" machine={machine} />
```

- Default: `sketch`
- Available: Sketch, ForceGraph
- Layout: Split

### Complex Machines

```tsx
<MachineVisualizer preset="complex" machine={machine} />
```

- Default: `reactflow`
- Available: All 5 visualizers
- Layout: Split

### Minimal (Docs/Tutorials)

```tsx
<MachineVisualizer preset="minimal" machine={machine} />
```

- Default: Auto-selected
- Available: All 5 visualizers
- Layout: Stacked
- Picker: Hidden (single viz only)

## Migration Guide

### From MachineExampleWithChart

**Before**:
```tsx
<MachineExampleWithChart
  machine={machine}
  AppView={CustomView}
  showRawState={true}
  inspectorType="react-flow"
  interactive={false}
/>
```

**After**:
```tsx
<MachineVisualizer
  machine={machine}
  AppView={CustomView}
  showRawState={true}
  defaultViz="reactflow"
  interactive={false}
/>
```

**Key Changes**:
- `inspectorType` → `defaultViz`
- Values updated: `"react-flow"` → `"reactflow"`, `"mermaid"` → `"mermaid-statechart"` or `"mermaid-flowchart"`
- Removed separate diagram type toggle (now flat list)

### From HSMVisualizerDemo

**Before**:
```tsx
<VisualizerDemo
  machine={machine}
  actions={actions}
  title="Visualizer"
  defaultVisualizer="sketch"
  interactive={true}
/>
```

**After**:
```tsx
<MachineVisualizer
  machine={machine}
  title="Visualizer"
  defaultViz="sketch"
  interactive={true}
/>
```

**Key Changes**:
- `VisualizerDemo` → `MachineVisualizer`
- `defaultVisualizer` → `defaultViz`
- No need to pass `actions` (auto-generated)
- Better default layout (split instead of full-width)

## Responsive Behavior

### Desktop/Tablet (≥768px)

**Split Layout**:
```
┌─────────────────────────────────────┐
│ Picker: [ReactFlow ▼]              │
├──────────────────┬──────────────────┤
│                  │                  │
│   Visualizer     │    App View      │
│                  │                  │
└──────────────────┴──────────────────┘
```

**Stacked Layout**:
```
┌─────────────────────────────────────┐
│ Picker: [ReactFlow ▼]              │
├─────────────────────────────────────┤
│                                     │
│           Visualizer                │
│                                     │
├─────────────────────────────────────┤
│                                     │
│           App View                  │
│                                     │
└─────────────────────────────────────┘
```

### Mobile (<768px)

Always stacks vertically:
```
┌─────────────────────────────────────┐
│ Picker: [ReactFlow ▼]              │
├─────────────────────────────────────┤
│                                     │
│           App View                  │
│                                     │
├─────────────────────────────────────┤
│                                     │
│         Visualizer (40vh)           │
│                                     │
└─────────────────────────────────────┘
```

## Usage Examples

### Basic Usage

```tsx
import { MachineVisualizer } from '@components/MachineVisualizer';

export default function Example() {
  const machine = useMemo(createMachine, []);

  return (
    <MachineVisualizer
      machine={machine}
      AppView={CustomView}
    />
  );
}
```

### With Auto-Selection

```tsx
<MachineVisualizer
  machine={machine}
  AppView={CustomView}
  defaultViz="auto"  // Smart selection
  availableViz={['reactflow', 'forcegraph', 'mermaid-statechart']}
/>
```

### Simple Preset

```tsx
<MachineVisualizer
  machine={machine}
  AppView={ToggleView}
  preset="simple"
/>
```

### Complex Preset with Override

```tsx
<MachineVisualizer
  machine={machine}
  AppView={CheckoutView}
  preset="complex"
  defaultViz="forcegraph"  // Override preset default
  layout="stacked"         // Override preset layout
/>
```

### Minimal (Single Visualizer)

```tsx
<MachineVisualizer
  machine={machine}
  AppView={CustomView}
  defaultViz="mermaid-statechart"
  availableViz={['mermaid-statechart']}  // Only one option
  // Picker auto-hides
/>
```

## Testing

Test file created: `/docs/src/code/examples/toggle/example-new.tsx`

Compare old vs new implementation:
- Old: `example.tsx` (uses MachineExampleWithChart)
- New: `example-new.tsx` (uses MachineVisualizer)

## Files Created

```
docs/src/components/
├── MachineVisualizer.tsx    # Main wrapper component
├── VizPicker.tsx            # Dropdown picker (flat list)
├── vizAutoSelect.ts         # Auto-selection algorithm
└── index.ts                 # Exports
```

## Design Decisions

1. **Flat list of visualizers** - Both Mermaid types as separate options, not grouped
2. **Dropdown style** - Professional, space-efficient
3. **Interactive prop** - Configuration only, not UI toggle
4. **Wrapper layer only** - No changes to viz components (ReactFlowInspector, etc.)
5. **Auto-selection opt-in** - Use `defaultViz="auto"` explicitly

## Next Steps

1. ✅ Create unified components
2. ⏳ Test with representative examples
3. Migrate all 20 examples
4. Deprecate old wrappers
5. Update documentation

## Notes

- **Worktree**: Implementation done in `../matchina-viz-ux` branch `feat/viz-ux-unification`
- **Isolation**: No conflicts with parallel agents working on ReactFlow/ForceGraph
- **Compatibility**: Can run alongside old wrappers during migration
