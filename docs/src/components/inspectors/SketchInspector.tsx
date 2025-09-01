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

const SketchInspector = memo(({ 
  machine, 
  actions, 
  interactive = true,
  className = '' 
}: SketchInspectorProps) => {
  // Step 1: Listen to machine changes for reactivity
  useMachine(machine);
  const currentState = machine.getState();
  
  // Step 2: Get the definition (recalculate when own state or nested machine state changes)
  const nestedMachine = currentState?.data?.machine;
  const nestedState = nestedMachine?.getState?.();
  const config = useMemo(() => getXStateDefinition(machine), [machine, currentState.key, nestedMachine, nestedState?.key]);
  
  // Step 3: Prepare highlighting info
  const currentStateKey = currentState?.key;
  const fullkey = currentState?.fullkey || currentStateKey;
  const depth = currentState?.depth ?? 0;
  
  // Step 4: Render the full structure from definition, then highlight reactively
  const renderStates = () => {
    const { states } = config;
    return Object.keys(states).map(stateKey => {
      const isActive = stateKey === currentStateKey;
      const stateConfig = states[stateKey];
      
      return (
        <div 
          key={stateKey}
          className={`state-item ${isActive ? 'active' : ''}`}
          data-state-key={stateKey}
        >
          <div className="state-content">
            <span className="state-name">{stateKey}</span>
            
            {isActive && fullkey && fullkey !== stateKey && (
              <div className="state-fullkey">
                <span className="fullkey-label">path:</span> {fullkey}
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
                          if (interactive && isActive && actions?.[event]) {
                            actions[event]();
                          }
                        }}
                        disabled={!isActive || !interactive || !actions?.[event]}
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
        </div>
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