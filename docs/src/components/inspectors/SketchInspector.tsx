import { memo, useMemo } from 'react';
import './SketchInspector.css';
import { useMachine } from "matchina/react";
import { getXStateDefinition } from "../../code/examples/lib/matchina-machine-to-xstate-definition";

interface SketchInspectorProps {
  machine: any;
  actions?: Record<string, () => void>;
  interactive?: boolean;
  className?: string;
}

// why is this memoized???
const SketchInspector = memo(({ 
  machine, 
  actions, 
  interactive = true,
  className = '' 
}: SketchInspectorProps) => {
  // Step 1: Listen to machine changes for reactivity
  useMachine(machine);
  const currentState = machine.getState();
  console.log("currentState", currentState)
  // Step 2: Get the definition (recalculate when own state or nested machine state changes)
  const nestedMachine = currentState?.data?.machine;
  const nestedState = nestedMachine?.getState?.();
  const config = useMemo(() => getXStateDefinition(machine), [machine, currentState.key, nestedMachine, nestedState?.key]);
  
  // Step 3: Prepare highlighting info - find the deepest active state
  const currentStateKey = currentState?.key;
  const fullKey = currentState?.fullKey || currentStateKey;
  console.log('currentState', fullKey, currentState.fullKey, currentState)
  const depth = currentState?.depth ?? 0;
  
  // const deepestActiveState = getDeepestActiveState(machine);
  
  // Step 4: Render using recursive components for proper nesting
  const StateItem = ({ stateKey, stateConfig, isActive, isBranchActive = false, depth = 0 }: { 
    stateKey: string; 
    fullKey?: string;
    stateConfig: any; 
    isActive: boolean; 
    isBranchActive?: boolean;
    depth?: number;
  }) => {
    console.log('render', stateKey, isActive, stateConfig.fullKey, fullKey, stateConfig);
    const hasNested = stateConfig.states && Object.keys(stateConfig.states).length > 0;
    
    return (
      <div 
        className={`state-item ${isActive ? 'active' : isBranchActive ? 'active-ancestor' : ''} depth-${depth}`}
        data-state-key={stateKey}
      >
        <div className="state-content">
          <span className="state-name">{stateKey}</span>
          {/* [{fullKey}] */}
          <pre>{JSON.stringify({ isActive, isBranchActive }, null, 2)}</pre>
          {isActive && fullKey && fullKey !== stateKey && (
            <div className="state-fullKey">
              <span className="fullKey-label">path:</span> {fullKey}
            </div>
          )}
          
          {/* Show transitions from this state */}
          {stateConfig.on && Object.keys(stateConfig.on).length > 0 && (
            <div className="transitions-inline">
              {Object.entries(stateConfig.on).map(([event, target]) => {
                // Handle different target formats - could be string or object with target property
                const targetKey = typeof target === 'string' ? target : target?.target || String(target);
                
                return (
                  <div key={event} className="transition-row">
                    <button 
                      className={`transition-button ${isActive && interactive ? 'enabled' : 'disabled'}`}
                      onClick={() => {
                        if (interactive && isActive) {
                          machine.send(event);
                        }
                      }}
                      disabled={!isActive || !interactive}
                      type="button"
                    >
                      {event}
                    </button>
                    <span className="transition-arrow"> → </span>
                    <span className="transition-target">{targetKey}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Render nested states recursively */}
        {hasNested && (
          <div className="nested-states">
            {Object.entries(stateConfig.states).map(([nestedKey, nestedConfig]: [string,any]) => {
              // Only highlight if this is the deepest active state
              // const nestedIsActive = nestedKey === currentStateKey;
              const isMatch = nestedConfig.fullKey === fullKey;
              const nestedBranchActive = !!fullKey && (fullKey === nestedConfig.fullKey || fullKey.startsWith(nestedConfig.fullKey + '.'));
              console.log('isMatch', isMatch, nestedConfig.fullKey, fullKey)
              return (
                <StateItem 
                  key={nestedKey}
                  stateKey={nestedKey}
                  fullKey={nestedConfig.fullKey}
                  stateConfig={nestedConfig}
                  isActive={isMatch}
                  isBranchActive={nestedBranchActive}
                  depth={depth + 1}
                />
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderStates = () => {
    const { states } = config;
    return Object.keys(states).map(stateKey => {
      // Only highlight if this is the deepest active state
      // const isActive = stateKey === deepestActiveState;
      // const isAtDepth = depth === currentState?.depth;
      const stateConfig = states[stateKey];
      const isActive = stateConfig.fullKey === fullKey;
      const branchActive = !!fullKey && (fullKey === stateConfig.fullKey || fullKey.startsWith(stateConfig.fullKey + '.'));
      // console.log('render', stateKey, isActive, stateConfig.fullKey, fullKey, stateConfig);
      
      return (
        <StateItem 
          key={stateKey}
          stateKey={stateKey}
          fullKey={stateKey}
          stateConfig={stateConfig}
          isActive={isActive}
          isBranchActive={branchActive}
          depth={0}
        />
      );
    });
  };

  return (
    <div className={`sketch-inspector ${className}`}>
      <div className="statechart">
        <div className="state-tree">
          {renderStates()}
        </div>
      </div>
    </div>
  );
});

export default SketchInspector;

// // Find the deepest active state by following nested machines
// const getDeepestActiveState = (machine: any): string => {
//   const state = machine.getState();
//   const nestedMachine = state?.data?.machine;
//   if (nestedMachine && typeof nestedMachine.getState === 'function') {
//     return getDeepestActiveState(nestedMachine);
//   }
//   return state.key;
// };