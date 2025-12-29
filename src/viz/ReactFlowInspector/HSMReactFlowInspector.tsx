import React, { useMemo, useCallback } from "react";
import { useMachine } from "../../integrations/react";
import type { TransitionEvent } from "../../state-machine";
import type { StateNode } from "../../hsm/shape-types";
import type { LayoutOptions } from "./utils/elkLayout";
import { buildReactFlowGraph } from "./utils/shapeToReactFlow";
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
  const graphData = useMemo(
    () => (shape ? buildReactFlowGraph(shape) : null),
    [shape]
  );

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
