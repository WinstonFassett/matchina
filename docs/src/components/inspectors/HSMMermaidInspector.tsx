import { memo, useEffect, useMemo } from "react";
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
  
  // Build hierarchical state key using new fullKey property or fallback
  const hierarchicalStateKey = useMemo(() => {
    if (actualState?.fullKey) {
      // Use the new fullKey property from hierarchical context
      return actualState.fullKey.replace(/\./g, '_');
    }
    
    // Fallback to manual building for backward compatibility  
    if (nestedMachine) {
      const nestedState = nestedMachine.getState();
      return nestedState?.key ? `${stateKey}_${nestedState.key}` : stateKey;
    }
    return stateKey;
  }, [stateKey, nestedState, nestedMachine, actualState]);
  
  // Convert matchina machine to xstate-like configuration (now stable per render)
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
  
  // Debug: log a short hash of the config string whenever it changes
  useEffect(() => {
    try {
      const s = JSON.stringify(xstateConfig);
      let x = 0; for (let i = 0; i < s.length; i++) x = ((x << 5) - x) + s.charCodeAt(i) | 0;
      const hash = (x >>> 0).toString(16);
      // keep minimal to avoid noise
      // console.log('[HSMMermaidInspector.config]', hash, 'state=', hierarchicalStateKey);
    } catch {}
  }, [xstateConfig, hierarchicalStateKey]);
  
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