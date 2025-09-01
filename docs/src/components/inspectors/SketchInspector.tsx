import { memo } from 'react';
import './SketchInspector.css';
import { useMachine } from "matchina/react";

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
  // Trust our hierarchical context system - only listen to the main machine
  const currentState = useMachine(machine);
  
  // Trust our hierarchical context system completely
  const fullkey = currentState?.fullkey || currentState?.key;
  const depth = currentState?.depth ?? 0;
  const isInnermostActive = depth === (currentState?.stack?.length - 1);
  
  return (
    <div className={`sketch-inspector ${className}`}>
      <div className="statechart">
        <div className="state-tree">
          <div 
            className={`state-item ${isInnermostActive ? 'active' : ''}`}
            data-fullkey={fullkey}
            data-depth={depth}
          >
            <div className="state-content">
              <span className="state-name">{currentState?.key || 'Unknown'}</span>
              
              {fullkey && fullkey !== currentState?.key && (
                <div className="state-fullkey">
                  <span className="fullkey-label">path:</span> {fullkey}
                </div>
              )}
              
              {currentState?.data && typeof currentState.data === 'object' && (
                <div className="state-metadata">
                  {currentState.data.query && (
                    <span className="query">"{currentState.data.query}"</span>
                  )}
                  {currentState.data.items && (
                    <span className="items">{currentState.data.items.length} items</span>
                  )}
                  {currentState.data.highlightedIndex !== undefined && currentState.data.highlightedIndex >= 0 && (
                    <span className="highlight">highlighted: {currentState.data.highlightedIndex}</span>
                  )}
                </div>
              )}
              
              {/* Show available transitions for the current state */}
              {actions && Object.keys(actions).length > 0 && (
                <div className="transitions-inline">
                  {Object.entries(actions).map(([event, action]) => (
                    <div key={event} className="transition-row">
                      <button 
                        className={`transition-button ${isInnermostActive ? 'enabled' : 'disabled'}`}
                        onClick={() => {
                          if (interactive && isInnermostActive && action) {
                            action();
                          }
                        }}
                        disabled={!isInnermostActive || !interactive}
                        type="button"
                      >
                        {event}
                      </button>
                      <span className="transition-arrow"> → </span>
                      <span className="transition-target">?</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SketchInspector;