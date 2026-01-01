import React, { useMemo, useCallback } from "react";
import { useMachine } from "../../integrations/react";
import type { TransitionEvent } from "../../state-machine";
import type { InspectorTheme } from '../theme';
import { defaultTheme } from '../theme';
import { buildForceGraphData, type ForceGraphData } from './utils/shapeToForceGraph';
import ForceGraphInspector from '../ForceGraphInspector';

interface HSMForceGraphInspectorProps {
  machine: {
    shape?: { getState(): any };
    send(event: string): void;
    notify: (ev: TransitionEvent) => void;
    getChange: () => TransitionEvent;
  };
  theme?: InspectorTheme;
  interactive?: boolean;
}

export const HSMForceGraphInspector: React.FC<HSMForceGraphInspectorProps> = ({
  machine,
  theme = defaultTheme,
  interactive = true
}) => {
  // Step 1: Extract shape from machine
  const shape = useMemo(
    () => machine.shape?.getState(),
    [machine]
  );

  // Step 2: Convert to ForceGraph format
  const graphData = useMemo(
    () => shape ? buildForceGraphData(shape) : null,
    [shape]
  );

  // Step 3: Subscribe to state changes
  const currentState: TransitionEvent = useMachine(machine);

  // Step 4: Create dispatch function for event triggering
  const dispatch = useCallback(
    (event: { type: string }) => {
      machine.send(event.type);
    },
    [machine]
  );

  // Step 5: Pass all data to base ForceGraphInspector using existing interface
  return (
    <ForceGraphInspector
      value={String(currentState?.to || '')}
      definition={machine}
      dispatch={dispatch}
      interactive={interactive}
      theme={theme}
    />
  );
};
