import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useMachine } from '../../integrations/react';
import type { TransitionEvent } from '../../state-machine';
import type { StateNode, MachineShape } from '../../hsm/shape-types';
import type { Node, Edge } from '@xyflow/react';
import { MarkerType } from '@xyflow/react';
import ReactFlowInspectorV2 from './ReactFlowInspectorV2';
import { 
  layoutManager, 
  LayoutType, 
  LayoutSettings,
  MachineAnalysis 
} from './layout';
import { SimpleLayoutControls } from './ui';

interface HSMReactFlowInspectorV2Props {
  machine: {
    shape?: { getState(): MachineShape };
    send(event: string): void;
    notify: (ev: TransitionEvent) => void;
    getChange: () => TransitionEvent;
  };
  interactive?: boolean;
}

interface NodeData extends Record<string, unknown> {
  label: string;
  isActive?: boolean;
  isPrevious?: boolean;
  isCompound?: boolean;
  stateKey?: string;
}

interface EdgeData extends Record<string, unknown> {
  event?: string;
  isClickable?: boolean;
  isActive?: boolean;
}

/**
 * Convert machine shape to ReactFlow nodes and edges using layout system
 */
function shapeToReactFlow(shape: MachineShape, layoutType: LayoutType, settings: LayoutSettings): { nodes: Node<NodeData>[]; edges: Edge<EdgeData>[] } {
  const nodes: Node<NodeData>[] = [];
  const edges: Edge<EdgeData>[] = [];

  // Extract state names for layout
  const stateNames: string[] = [];
  shape.states.forEach((_stateNode, fullKey) => {
    stateNames.push(fullKey);
  });

  // Create basic nodes (layout will be applied by layout engine)
  stateNames.forEach((stateName) => {
    // Convert dots to underscores for node IDs (ReactFlow compatibility)
    const nodeId = stateName.replace(/\./g, '_');

    nodes.push({
      id: nodeId,
      type: 'simple',
      data: { label: stateName },
      position: { x: 0, y: 0 }, // Layout engine will position
    });
  });

  // Create edges from transitions
  shape.transitions.forEach((transitions, fromState) => {
    transitions.forEach((toState, event) => {
      // Handle special syntax like '^Inactive' (exit to parent)
      let targetState = toState;
      if (toState.startsWith('^')) {
        targetState = toState.substring(1);
      }

      // Convert dots to underscores for edge source/target
      const sourceId = fromState.replace(/\./g, '_');
      const targetId = targetState.replace(/\./g, '_');

      edges.push({
        id: `${fromState}-${toState}-${event}`,
        source: sourceId,
        target: targetId,
        label: event,
        type: 'floating',
        markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
        data: {
          event,
        },
      });
    });
  });

  // Apply layout
  const layoutResult = layoutManager.calculateLayout(layoutType, nodes, edges, settings as any);
  
  return {
    nodes: layoutResult.nodes as Node<NodeData>[],
    edges: layoutResult.edges as Edge<EdgeData>[],
  };
}

/**
 * HSMReactFlowInspectorV2 - Adapter that converts HSM machine shape to ReactFlow V2 format
 *
 * This wrapper handles:
 * 1. Shape extraction from machine
 * 2. Conversion to ReactFlow nodes/edges
 * 3. State change subscription for highlighting
 * 4. Event dispatch for interactive transitions
 */
export const HSMReactFlowInspectorV2: React.FC<HSMReactFlowInspectorV2Props> = ({
  machine,
  interactive = true,
}) => {
  // Layout state
  const [layoutType, setLayoutType] = useState<LayoutType>(LayoutType.GRID);
  const [layoutSettings, setLayoutSettings] = useState<LayoutSettings>(() => {
    const engine = layoutManager.getEngine(LayoutType.GRID);
    return engine ? engine.getDefaultSettings() : {
      nodeSpacing: 120,
      edgeSpacing: 20,
      fitPadding: 20,
      animationDuration: 300,
      compactness: 0.7,
      alignment: 'center' as const,
      direction: 'row' as const,
    };
  });

  // Step 1: Extract shape from machine
  const shape = useMemo(() => machine.shape?.getState(), [machine]);

  // Step 2: Convert to ReactFlow format with layout
  const graphData = useMemo(() => {
    if (!shape) return null;
    return shapeToReactFlow(shape, layoutType, layoutSettings);
  }, [shape, layoutType, layoutSettings]);

  // Step 3: Subscribe to state changes for highlighting
  const deepestMachine = (() => {
    let cursor: any = machine;
    let last: any = machine;
    let guard = 0;
    while (cursor && guard++ < 25) {
      last = cursor;
      const s = cursor.getState?.();
      const next = s?.data?.machine;
      if (!next) break;
      cursor = next;
    }
    return last;
  })();

  // Subscribe to deepest machine for reactivity
  const currentChange = useMachine(deepestMachine || machine) as TransitionEvent<StateNode, StateNode>;

  // Compute full state path
  const fullPath = (() => {
    const currentMachineState = machine.shape?.getState();
    const stateKey = currentMachineState?.initialKey || '';

    // If state key already contains dots, it's a flattened full path
    if (stateKey.includes('.')) {
      return stateKey;
    }

    // Otherwise, walk nested machines to build full path
    const parts: string[] = [];
    let cursor: any = machine;
    let guard = 0;
    while (cursor && guard++ < 25) {
      const s = cursor.getState?.();
      if (!s) break;
      parts.push(s.key);
      cursor = s?.data?.machine;
    }
    return parts.join('.');
  })();

  // Node IDs use underscores instead of dots
  const currentState = fullPath.replace(/\./g, '_');

  // Step 4: Get previous state for edge highlighting
  const rawPreviousState = currentChange?.from?.fullKey || currentChange?.from?.key || String(currentChange?.from || '');
  const previousState = rawPreviousState.replace(/\./g, '_');

  // Step 5: Create dispatch function for edge clicks
  const dispatch = useCallback(
    (event: { type: string }) => {
      machine.send(event.type);
    },
    [machine]
  );

  // Step 6: Initialize with simple grid layout (no auto-selection)
  useEffect(() => {
    // Just use grid-simple preset - no analysis
    const simplePreset = layoutManager.getPreset('grid-simple');
    if (simplePreset) {
      setLayoutType(simplePreset.layoutType);
      setLayoutSettings(simplePreset.settings);
    }
  }, []);

  // Handle layout changes
  const handleLayoutChange = useCallback((type: LayoutType, settings: LayoutSettings) => {
    setLayoutType(type);
    setLayoutSettings(settings);
  }, []);

  if (!graphData) {
    return <div>No shape data available</div>;
  }

  return (
    <div className="relative w-full h-full">
      {/* Layout Controls - positioned consistently */}
      <div className="absolute top-4 right-4 z-10" data-testid="layout-controls-wrapper" style={{ top: '16px', right: '16px' }}>
        <SimpleLayoutControls
          layoutManager={layoutManager}
          onLayoutChange={handleLayoutChange}
          currentLayoutType={layoutType}
          currentSettings={layoutSettings}
        />
      </div>

      {/* ReactFlow Component */}
      <ReactFlowInspectorV2
        value={currentState}
        nodes={graphData.nodes}
        edges={graphData.edges}
        previousState={previousState}
        dispatch={dispatch}
        interactive={interactive}
      />
    </div>
  );
};
