import { memo, useMemo } from "react";
import { useMachine, useMachineMaybe } from "matchina/react";
import { getXStateDefinition } from "../../code/examples/lib/matchina-machine-to-xstate-definition";
import MermaidInspector from "./MermaidInspector";

const HSMMermaidInspector = memo(({
  machine,
  actions,
  interactive = true,
}: {
  machine: any;
  actions?: Record<string, any>;
  interactive?: boolean;
}) => {
  const currentChange = useMachine(machine) as any;
  const actualState = (currentChange?.to || machine.getState()) as any;
  const stateKey = actualState?.key || 'unknown';
  
  // Listen to nested machine if it exists
  const nestedMachine = actualState?.data?.machine;
  const nestedState = useMachineMaybe(nestedMachine);
  
  // Build hierarchical state key using new fullkey property or fallback
  const hierarchicalStateKey = useMemo(() => {
    if (actualState?.fullkey) {
      // Use the new fullkey property from hierarchical context
      return actualState.fullkey.replace(/\./g, '_');
    }
    
    // Fallback to manual building for backward compatibility  
    if (nestedMachine) {
      const nestedState = nestedMachine.getState();
      return nestedState?.key ? `${stateKey}_${nestedState.key}` : stateKey;
    }
    return stateKey;
  }, [stateKey, nestedState, nestedMachine, actualState]);
  
  // Convert matchina machine to xstate-like configuration  
  const currentNestedState = nestedMachine?.getState?.();
  const xstateConfig = useMemo(() => {
    try {
      return getXStateDefinition(machine);
    } catch (error) {
      console.error('Failed to convert machine to XState format:', error);
      // Fallback to simple structure if conversion fails
      return {
        initial: stateKey,
        states: {
          [stateKey]: {
            on: {}
          }
        }
      };
    }
  }, [machine, currentChange, actualState?.key, nestedMachine, currentNestedState?.key]);
  
  return (
    <MermaidInspector
      config={xstateConfig}
      stateKey={hierarchicalStateKey}
      actions={actions}
      interactive={interactive}
    />
  );
});

export default HSMMermaidInspector;