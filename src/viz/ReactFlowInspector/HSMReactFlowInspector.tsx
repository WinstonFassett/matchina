import React, { useMemo, useCallback } from "react";
import { useMachine } from "../../integrations/react";
import type { TransitionEvent } from "../../state-machine";
import type { StateNode } from "../../hsm/shape-types";
import type { LayoutOptions } from "./utils/elkLayout";
import { buildReactFlowGraph } from "./utils/shapeToReactFlow";
import { buildVisualizerTree } from "../../../docs/src/code/examples/lib/matchina-machine-to-xstate-definition";
import ReactFlowInspector from "./ReactFlowInspector";

interface HSMReactFlowInspectorProps {
  machine: {
    shape?: { getState(): any };
    send(event: string): void;
    notify: (ev: TransitionEvent) => void;
    getChange: () => TransitionEvent;
  };
  layoutOptions?: LayoutOptions;
  interactive?: boolean;
}

/**
 * Adapter wrapper that converts HSM machine shape to ReactFlow format
 *
 * Three-layer pattern:
 * 1. HSMReactFlowInspector: Shape extraction + conversion
 * 2. ReactFlowInspector: Rendering and layout
 * 3. useStateMachineNodes/Edges: Layout + highlighting
 *
 * This wrapper handles shape understanding.
 * ReactFlowInspector handles rendering.
 * Hooks handle layout and interaction.
 */
export const HSMReactFlowInspector: React.FC<HSMReactFlowInspectorProps> = ({
  machine,
  layoutOptions,
  interactive = true,
}) => {
  // Step 1: Extract shape from machine
  const shape = useMemo(() => machine.shape?.getState(), [machine]);

  // Step 2: Convert to ReactFlow format
  const graphData = useMemo(() => {
    if (shape) {
      // Use shape-based conversion for HSM machines (preferred path)
      return buildReactFlowGraph(shape);
    } else {
      // Fallback to hierarchy-based conversion for machines without shapes (e.g., promise machines)
      // Use the same method that Mermaid uses for consistency
      const tree = buildVisualizerTree(machine as any);
      if (!tree?.states) return null;
      
      // Convert tree format to ReactFlow format
      const nodes = Object.entries(tree.states).map(([key, state]: [string, any]) => ({
        id: key,
        position: { x: 0, y: 0 },
        data: {
          label: state.key || key,
          fullKey: state.fullKey || key,
          isActive: false,
          isPrevious: false,
          isCompound: false,
        },
        type: "custom",
      }));
      
      const edges = Object.entries(tree.states)
        .flatMap(([fromKey, state]: [string, any]) => {
          if (!state.on) return [];
          return Object.entries(state.on).map(([event, toKey]: [string, any]) => ({
            id: `${fromKey}-${toKey}-${event}`,
            source: fromKey,
            target: toKey,
            label: event,
            type: "custom",
            data: { event, isClickable: false },
          }));
        });
      
      return { nodes, edges, nodeIds: new Set(nodes.map(n => n.id)), groupIds: new Set() };
    }
  }, [shape, machine]);

  // Step 3: Subscribe to state changes for highlighting
  const currentChange = useMachine(machine) as TransitionEvent<StateNode, StateNode>;

  // Extract state key/fullKey for matching against node IDs
  // currentChange.to is a StateNode object with .key or .fullKey property
  const currentState = currentChange?.to?.fullKey || currentChange?.to?.key || String(currentChange?.to || "");
  
  // Step 4: Get previous state for edge highlighting
  const previousState = currentChange?.from?.fullKey || currentChange?.from?.key || String(currentChange?.from || "");

  // Step 5: Create dispatch function for edge clicks
  const dispatch = useCallback(
    (event: { type: string }) => {
      machine.send(event.type);
    },
    [machine]
  );

  // Step 6: Pass converted data to base ReactFlowInspector
  return (
    <ReactFlowInspector
      value={currentState}
      nodes={graphData?.nodes || []}
      edges={graphData?.edges || []}
      previousState={previousState}
      dispatch={dispatch}
      layoutOptions={layoutOptions}
      interactive={interactive}
    />
  );
};
