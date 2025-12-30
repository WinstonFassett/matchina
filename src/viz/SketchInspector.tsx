import React, { useMemo } from 'react';
import { useMachine } from "../integrations/react";
import type { MachineShape, StateNode } from "../hsm/shape-types";
import type { InspectorTheme } from './theme';
import { defaultTheme, generateCSSVariables } from './theme';
import './SketchInspector.css';

interface SketchInspectorProps {
  machine: any;
  actions?: Record<string, () => void>;
  interactive?: boolean;
  className?: string;
  theme?: InspectorTheme;
}

function SketchInspector({ 
  machine, 
  interactive = true,
  className = '',
  theme = defaultTheme
}: SketchInspectorProps) {
  // Step 1: Listen to machine changes for reactivity (parent + deepest active child)
  useMachine(machine);
  // Find deepest active machine to subscribe to leaf-only transitions
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
  useMachine(deepestMachine || machine);
  const currentState = machine.getState();
  
  // Step 2: Get the shape directly from machine
  const shape = useMemo(() => {
    const shapeController = machine.shape;
    return shapeController?.getState();
  }, [machine, currentState.key]);

  // Step 3: Prepare highlighting info - compute deepest active path
  const fullPath = (() => {
    const stateKey = currentState?.key || '';
    // If state key contains dots, it's already a flattened full path
    if (stateKey.includes('.')) {
      return stateKey;
    }
    // Otherwise, walk nested machines
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
  
  // Step 4: Render using recursive components for proper nesting
  const StateItem = ({ stateNode, isActive, isBranchActive = false, depth = 0 }: { 
    stateNode: StateNode; 
    isActive: boolean; 
    isBranchActive?: boolean;
    depth?: number;
  }) => {
    // Find children of this state
    const children = useMemo(() => {
      if (!shape) return [];
      const result: StateNode[] = [];
      for (const [childFullKey, parentFullKey] of shape.hierarchy.entries()) {
        if (parentFullKey === stateNode.fullKey) {
          const childState = shape.states.get(childFullKey);
          if (childState) result.push(childState);
        }
      }
      return result;
    }, [shape, stateNode.fullKey]);
    
    // Get transitions from this state
    const transitions = useMemo(() => {
      if (!shape) return new Map();
      return shape.transitions.get(stateNode.fullKey) || new Map();
    }, [shape, stateNode.fullKey]);
    
    const hasChildren = children.length > 0;
    
    return (
      <div 
        className={`state-item ${isActive ? 'active' : isBranchActive ? 'active-ancestor' : ''} depth-${depth}`}
        data-state-key={stateNode.key}
        style={{
          // Apply theme variables
          ...getThemeStyles(theme, 'stateItem'),
          ...(isActive ? getThemeStyles(theme, 'activeState') : {}),
          ...(isBranchActive && !isActive ? getThemeStyles(theme, 'activeAncestor') : {}),
        }}
      >
        <div className="state-content" style={getThemeStyles(theme, 'stateContent')}>
          <span className="state-name" style={getThemeStyles(theme, 'stateName')}>{stateNode.key}</span>
          
          {/* Show transitions from this state */}
          {transitions.size > 0 && (
            <div className="transitions-inline" style={getThemeStyles(theme, 'transitions')}>
              {[...transitions].map(([event, target]: [string, string]) => {
                const canInvoke = isActive || isBranchActive;
                
                return (
                  <div key={event} className="transition-row" style={getThemeStyles(theme, 'transitionRow')}>
                    <button 
                      className={`transition-button ${canInvoke && interactive ? 'enabled' : 'disabled'} ${isActive ? 'current-state' : isBranchActive ? 'ancestor-state' : ''}`}
                      onClick={() => {
                        if (interactive && canInvoke) {
                          machine.send(event);
                        }
                      }}
                      disabled={!canInvoke || !interactive}
                      type="button"
                      style={{
                        ...getThemeStyles(theme, 'transitionButton'),
                        ...(canInvoke && interactive ? getThemeStyles(theme, 'enabledTransition') : getThemeStyles(theme, 'disabledTransition')),
                        ...(isActive ? getThemeStyles(theme, 'currentStateTransition') : {}),
                        ...(isBranchActive && !isActive ? getThemeStyles(theme, 'ancestorStateTransition') : {}),
                      }}
                    >
                      {event}
                      {!isActive && isBranchActive && <span className="ancestor-indicator"> ↑</span>}
                    </button>
                    <span className="transition-arrow" style={getThemeStyles(theme, 'transitionArrow')}> → </span>
                    <span className="transition-target" style={getThemeStyles(theme, 'transitionTarget')}>{target}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Render child states recursively */}
        {hasChildren && (
          <div className="nested-states" style={getThemeStyles(theme, 'nestedStates')}>
            {children.map(childNode => {
              const isMatch = childNode.fullKey === fullPath;
              const childBranchActive = !!fullPath && (fullPath === childNode.fullKey || fullPath.startsWith(childNode.fullKey + '.'));
              
              return (
                <StateItem 
                  key={childNode.fullKey}
                  stateNode={childNode}
                  isActive={isMatch}
                  isBranchActive={childBranchActive}
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
    if (!shape) return null;
    
    // Get root-level states (those with no parent)
    const rootStates: StateNode[] = [];
    for (const [fullKey, parentFullKey] of shape.hierarchy.entries()) {
      if (parentFullKey === undefined) {
        const stateNode = shape.states.get(fullKey);
        if (stateNode) rootStates.push(stateNode);
      }
    }
    
    return rootStates.map(stateNode => {
      const isActive = stateNode.fullKey === fullPath;
      const branchActive = !!fullPath && (fullPath === stateNode.fullKey || fullPath.startsWith(stateNode.fullKey + '.'));
      
      return (
        <StateItem 
          key={stateNode.fullKey}
          stateNode={stateNode}
          isActive={isActive}
          isBranchActive={branchActive}
          depth={0}
        />
      );
    });
  };

  return (
    <div 
      className={`sketch-inspector ${className}`}
      style={{
        ...getThemeStyles(theme, 'container'),
        // Apply CSS variables
        ...generateCSSVariableStyles(theme),
      }}
    >
      <div className="statechart" style={getThemeStyles(theme, 'statechart')}>
        <div className="state-tree" style={getThemeStyles(theme, 'stateTree')}>
          {renderStates()}
        </div>
      </div>
    </div>
  );
}

/**
 * Get theme styles for a specific element
 */
function getThemeStyles(theme: InspectorTheme, element: string): React.CSSProperties {
  const styles: React.CSSProperties = {};
  
  if (theme.values?.colors) {
    // Map colors to CSS properties based on element
    switch (element) {
      case 'container':
        styles.backgroundColor = theme.values.colors.background;
        styles.color = theme.values.colors.text;
        break;
      case 'activeState':
        styles.backgroundColor = theme.values.colors.activeBackground;
        styles.color = theme.values.colors.active;
        break;
      case 'stateName':
        styles.fontWeight = '600';
        break;
      case 'transitionButton':
        styles.backgroundColor = theme.values.colors.surface;
        styles.color = theme.values.colors.text;
        styles.border = `1px solid ${theme.values.colors.border}`;
        break;
      case 'enabledTransition':
        styles.cursor = 'pointer';
        styles.backgroundColor = theme.values.colors.primary;
        styles.color = 'white';
        break;
      case 'disabledTransition':
        styles.cursor = 'not-allowed';
        styles.opacity = '0.5';
        break;
    }
  }
  
  if (theme.values?.spacing) {
    switch (element) {
      case 'stateItem':
        styles.padding = theme.values.spacing.sm;
        styles.marginBottom = theme.values.spacing.xs;
        break;
      case 'transitionButton':
        styles.padding = `${theme.values.spacing.xs} ${theme.values.spacing.sm}`;
        styles.marginRight = theme.values.spacing.xs;
        break;
    }
  }
  
  if (theme.values?.typography) {
    styles.fontFamily = theme.values.typography.fontFamily;
    styles.fontSize = theme.values.typography.fontSize;
    if (element === 'stateName') {
      styles.fontWeight = '600';
    }
  }
  
  if (theme.values?.borders) {
    switch (element) {
      case 'transitionButton':
        styles.borderRadius = theme.values.borders.radius;
        break;
    }
  }
  
  return styles;
}

/**
 * Generate CSS variable styles for the container
 */
function generateCSSVariableStyles(theme: InspectorTheme): React.CSSProperties {
  const styles: React.CSSProperties = {};
  
  if (theme.values) {
    Object.entries(theme.values.colors || {}).forEach(([key, value]) => {
      (styles as any)[`--matchina-inspector-color-${key}`] = value;
    });
    
    Object.entries(theme.values.spacing || {}).forEach(([key, value]) => {
      (styles as any)[`--matchina-inspector-spacing-${key}`] = value;
    });
    
    Object.entries(theme.values.typography || {}).forEach(([key, value]) => {
      (styles as any)[`--matchina-inspector-typography-${key}`] = value;
    });
    
    Object.entries(theme.values.borders || {}).forEach(([key, value]) => {
      (styles as any)[`--matchina-inspector-border-${key}`] = value;
    });
  }
  
  return styles;
}

export default SketchInspector;
