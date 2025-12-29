import React, { memo, useEffect, useMemo } from "react";
import { useMachine, useMachineMaybe } from "../integrations/react";
import { eventApi } from "../factory-machine-event-api";
import { buildShapeTree } from "../inspect/build-visualizer-tree";
import type { InspectorTheme } from './theme';
import { defaultTheme } from './theme';

// We'll need to create a MermaidInspector component or move it too
const MermaidInspector = memo(({
  config,
  stateKey,
  actions,
  interactive = true,
  theme = defaultTheme
}: {
  config: any;
  stateKey: string;
  actions?: Record<string, () => void>;
  interactive?: boolean;
  theme?: InspectorTheme;
}) => {
  // Placeholder for now - we'll need to move the actual MermaidInspector
  return (
    <div style={{ padding: '1rem', border: '1px solid #ccc', borderRadius: '4px' }}>
      <h4>Mermaid Inspector (placeholder)</h4>
      <p>Current state: {stateKey}</p>
      <p>States: {Object.keys(config.states || {}).join(', ')}</p>
      {interactive && actions && (
        <div>
          <p>Available actions:</p>
          {Object.keys(actions).map(action => (
            <button key={action} onClick={() => (actions as any)[action]?.()} style={{ margin: '0.25rem', padding: '0.25rem 0.5rem' }}>
              {action}
            </button>
          ))}
        </div>
      )}
    </div>
  );
});

const HSMMermaidInspector = memo(({
  machine,
  actions,
  interactive = true,
  theme = defaultTheme
}: {
  machine: any;
  actions?: Record<string, any>;
  interactive?: boolean;
  theme?: InspectorTheme;
}) => {
  const currentChange = useMachine(machine) as any;
  const actualState = (currentChange?.to || machine.getState()) as any;
  const stateKey = actualState?.key || 'unknown';
  
  // Listen to nested machine if it exists
  const nestedMachine = actualState?.data?.machine;
  const nestedState = useMachineMaybe(nestedMachine);
  
  // Build hierarchical state key using new fullKey property or fallback
  const hierarchicalStateKey = useMemo(() => {
    // For flattened machines, state key already contains dots (e.g., "Working.Red")
    // Convert to underscore format for Mermaid node IDs
    if (stateKey.includes('.')) {
      return stateKey.replace(/\./g, '_');
    }
    
    if (actualState?.fullKey) {
      // Use the new fullKey property from hierarchical context
      return actualState.fullKey.replace(/\./g, '_');
    }
    
    // Fallback to manual building for nested machines  
    if (nestedMachine) {
      const nestedState = nestedMachine.getState();
      return nestedState?.key ? `${stateKey}_${nestedState.key}` : stateKey;
    }
    return stateKey;
  }, [stateKey, nestedState, nestedMachine, actualState]);
  
  // Convert matchina machine to tree configuration (now stable per render)
  const currentNestedState = nestedMachine?.getState?.();
  const treeConfig = useMemo(() => {
    try {
      return buildShapeTree(machine);
    } catch (error) {
      console.error('Failed to convert machine to tree format:', error);
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
  
  // Collect actions from all levels of the hierarchy
  const allActions = useMemo(() => {
    const collected: Record<string, () => void> = {};
    
    // Add actions from the main machine
    if (actions) {
      Object.assign(collected, actions);
    }
    
    // Only collect from nested machine if it actually exists
    if (nestedMachine) {
      try {
        const nestedActions = eventApi(nestedMachine);
        Object.assign(collected, nestedActions);
      } catch (error) {
        console.warn('Failed to get actions from nested machine:', error);
      }
    }
    
    return collected;
  }, [actions, nestedMachine]);
  
  // Debug: log a short hash of the config string whenever it changes
  useEffect(() => {
    // try {
    //   const s = JSON.stringify(treeConfig);
    //   let x = 0; for (let i = 0; i < s.length; i++) x = ((x << 5) - x) + s.charCodeAt(i) | 0;
    //   const hash = (x >>> 0).toString(16);
    //   // keep minimal to avoid noise
    //   // console.log('[HSMMermaidInspector.config]', hash, 'state=', hierarchicalStateKey);
    // } catch {}
  }, [treeConfig, hierarchicalStateKey]);
  
  return (
    <MermaidInspector
      config={treeConfig}
      stateKey={hierarchicalStateKey}
      actions={allActions}
      interactive={interactive}
      theme={theme}
    />
  );
});

export default HSMMermaidInspector;
