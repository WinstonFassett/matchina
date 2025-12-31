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
  const graphData = useMemo(() => {
    if (shape) {
      // Use shape-based conversion for HSM machines (preferred path)
      return buildReactFlowGraph(shape);
    } else {
      // No fallback for machines without shapes - they need to have shapes
      return null;
    }
  }, [shape, machine]);

  // Step 3: Subscribe to state changes for highlighting
  // For nested machines, find the deepest active machine and subscribe to it
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

  // Compute full state path by walking nested machines (like SketchInspector does)
  // For flattened machines, the key already contains dots (e.g. "Working.Red")
  // For nested machines, we need to walk the hierarchy
  const fullPath = (() => {
    const currentMachineState = machine.getState?.();
    const stateKey = currentMachineState?.key || '';

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

  // Node IDs use underscores instead of dots (e.g. "Working_Red" not "Working.Red")
  const currentState = fullPath.replace(/\./g, '_');

  // Step 4: Get previous state for edge highlighting
  // For previous state, we use the change event (simpler than walking previous hierarchy)
  const rawPreviousState = currentChange?.from?.fullKey || currentChange?.from?.key || String(currentChange?.from || "");
  const previousState = rawPreviousState.replace(/\./g, '_');

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
