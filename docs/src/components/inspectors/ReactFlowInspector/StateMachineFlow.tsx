import { useCallback, useMemo, useEffect, useRef } from "react";
import React from "react";
import { useStateMachineNodes } from "./hooks/useStateMachineNodes";
import { useStateMachineEdges } from "./hooks/useStateMachineEdges";
import type { LayoutOptions } from "./utils/elkLayout";
import { useMachine } from "@lib/src/integrations/react";

export const useStateMachineFlow = (
  machine: any,
  machineKey?: number,
  layoutOptions?: LayoutOptions
) => {
  // const [current, send] = useMachine(machine, {
  //   snapshot: undefined // Force fresh start
  // });
  useMachine(machine);
  const current = machine.getState();
  const send = machine.send;

  const [previousState, setPreviousState] = React.useState<string | null>(null);
  const lastKnownState = useRef<string | null>(null);

  // Reset state tracking when machine changes
  useEffect(() => {
    setPreviousState(null);
    lastKnownState.current = null;
  }, [machineKey, machine]);

  // Track state changes for previous state highlighting
  useEffect(() => {
    const currentStateValue = String(current.value);

    if (
      lastKnownState.current &&
      lastKnownState.current !== currentStateValue
    ) {
      setPreviousState(lastKnownState.current);
      lastKnownState.current = currentStateValue;
    }

    lastKnownState.current = currentStateValue;
  }, [current.value]);

  const { nodes, onNodesChange, isInitialized } = useStateMachineNodes(
    machine,
    String(current.value),
    previousState,
    machineKey,
    layoutOptions
  );

  const { edges, onEdgesChange, updateEdges } = useStateMachineEdges(
    machine,
    nodes,
    String(current.value),
    previousState
  );

  // Update edges when nodes change (positions or states)
  useEffect(() => {
    if (isInitialized && nodes.length > 0) {
      updateEdges();
    }
  }, [nodes, updateEdges, isInitialized]);

  // Get available events for current state - works with any machine structure
  const availableEvents = useMemo(() => {
    const currentStateConfig =
      machine?.config?.states?.[current.value as string];
    return currentStateConfig?.on ? Object.keys(currentStateConfig.on) : [];
  }, [current.value, machine]);

  const handleEventTrigger = useCallback(
    (event: string) => {
      send({ type: event } as any);
    },
    [send]
  );

  const handleEdgeClick = useCallback(
    (event: React.MouseEvent, edge: any) => {
      event.stopPropagation();
      const eventType = edge.data?.event;
      const isClickable = edge.data?.isClickable;
      if (eventType && isClickable) {
        send({ type: eventType } as any);
      }
    },
    [send]
  );

  return {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onEdgeClick: handleEdgeClick,
    currentState: String(current.value),
    availableEvents,
    onEventTrigger: handleEventTrigger,
    hasManualChanges: false, // This will be overridden by the actual hook
  };
};
