import React, { useEffect, useRef, useState, useMemo } from 'react';
import mermaid from 'mermaid';
import './MermaidInspector.css';
import type { MachineShape, StateNode } from '../hsm/shape-types';

// XState-style tree interface (what buildVisualizerTree returns)
interface XStateTree {
  initial: string;
  states: Record<string, XStateNode>;
}

interface XStateNode {
  key: string;
  fullKey: string;
  on: Record<string, string>;
  states?: Record<string, XStateNode>;
  initial?: string;
}

// Pure diagram generators that use shapes instead of walking
export function generateStateChart(shape: MachineShape): string {
  if (!shape) {
    console.error('generateStateChart: shape is undefined or null');
    return 'stateDiagram-v2\n[*] --> Error';
  }
  
  if (!shape.states) {
    console.error('generateStateChart: shape.states is undefined');
    console.error('Shape structure:', JSON.stringify(shape, null, 2));
    return 'stateDiagram-v2\n[*] --> Error';
  }

  const rows: string[] = [];

  // Helper to convert state keys to Mermaid IDs
  const getStateId = (stateKey: string): string => {
    return stateKey.replace(/\./g, '_');
  };

  // Build a set of states that have children (actual compound states)
  const statesWithChildren = new Set<string>();
  for (const [childKey] of shape.states.entries()) {
    const parentKey = shape.hierarchy.get(childKey);
    if (parentKey) {
      statesWithChildren.add(parentKey);
    }
  }

  // Add all states - only render compound syntax for states that actually have children
  for (const [stateKey, stateNode] of shape.states.entries()) {
    const id = getStateId(stateKey);
    const hasChildren = statesWithChildren.has(stateKey);
    const parentKey = shape.hierarchy.get(stateKey);
    const isChild = parentKey !== undefined;
    
    if (hasChildren) {
      // This state actually has children - render as compound
      rows.push(`    state ${id} {`);
      
      // Add nested states - use the display key (without parent prefix) for Mermaid
      for (const [childKey] of shape.states.entries()) {
        const parentId = shape.hierarchy.get(childKey);
        if (parentId === stateKey) {
          const childState = shape.states.get(childKey);
          const childDisplayKey = childState?.key || childKey.split('.').pop();
          rows.push(`        ${childDisplayKey}`);
        }
      }
      
      rows.push(`    }`);
    } else if (!isChild) {
      // Root-level leaf state (not a child of any compound state)
      rows.push(`    ${id}`);
    }
    // Skip child states here - they're added inside their parent's compound block
  }

  // Add transitions - include both root-level and child state transitions
  for (const [stateKey, transitions] of shape.transitions.entries()) {
    const fromId = getStateId(stateKey);
    const parentKey = shape.hierarchy.get(stateKey);
    const isChild = parentKey !== undefined;
    
    for (const [event, target] of transitions.entries()) {
      const targetId = getStateId(target);
      
      // For child states, use display names in transitions to match compound state syntax
      if (isChild) {
        const fromState = shape.states.get(stateKey);
        const fromDisplayKey = fromState?.key || stateKey.split('.').pop();
        const targetState = shape.states.get(target);
        const targetDisplayKey = targetState?.key || target.split('.').pop();
        
        rows.push(`    ${fromDisplayKey} --> ${targetDisplayKey}: ${event}`);
      } else {
        // Root-level transitions use full IDs
        rows.push(`    ${fromId} --> ${targetId}: ${event}`);
      }
    }
  }

  // Add root initial state
  if (shape.initialKey) {
    const rootInitial = getStateId(shape.initialKey);
    rows.unshift(`[*] --> ${rootInitial}`);
  }

  return `stateDiagram-v2\n${rows.join('\n')}`;
}

export function generateFlowchart(shape: MachineShape): string {
  const rows: string[] = [];

  // Helper to convert state keys to Mermaid IDs
  const getStateId = (stateKey: string): string => {
    return stateKey.replace(/\./g, '_');
  };

  // Add all states and subgraphs
  for (const [stateKey, stateNode] of shape.states.entries()) {
    const id = getStateId(stateKey);
    
    if (stateNode.isCompound) {
      // Composite state as subgraph
      rows.push(`    subgraph ${id}["${stateNode.key}"]`);
      
      // Add nested states
      for (const [childKey, childNode] of shape.states.entries()) {
        const parentId = shape.hierarchy.get(childKey);
        if (parentId === stateKey) {
          const childId = getStateId(childKey);
          rows.push(`        ${childId}["${childNode.key}"]`);
        }
      }
      
      rows.push(`    end`);
    } else {
      // Leaf state
      const parentId = shape.hierarchy.get(stateKey);
      if (!parentId) {
        // Root-level state
        rows.push(`    ${id}["${stateNode.key}"]`);
      }
    }
  }

  // Add transitions
  for (const [stateKey, transitions] of shape.transitions.entries()) {
    const fromId = getStateId(stateKey);
    
    for (const [event, target] of transitions.entries()) {
      const targetId = getStateId(target);
      rows.push(`    ${fromId}-->|${fromId}<br>${event}|${targetId}["${target}"]`);
    }
  }

  return `graph LR\n${rows.join('\n')}`;
}

// Hook for generating Mermaid diagram from shape
function useMermaidDiagram(shape: MachineShape, diagramType: 'statechart' | 'flowchart') {
  return useMemo(() => {
    if (diagramType === 'statechart') {
      return generateStateChart(shape);
    } else {
      return generateFlowchart(shape);
    }
  }, [shape, diagramType]);
}

// Initialize Mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  themeVariables: {
    primaryColor: 'rgb(147, 112, 219)',
    primaryTextColor: '#fff',
    primaryBorderColor: '#a78bfa',
    lineColor: '#333',
    secondaryColor: '#e5e7eb',
    tertiaryColor: '#f3f4f6',
    background: '#fff',
    mainBkg: '#fff',
    secondBkg: '#f3f4f6',
    tertiaryBkg: '#e5e7eb',
    stateLabelBkgColor: 'rgb(147, 112, 219)',
    stateBorder_color: '#a78bfa',
    altStateBkgColor: 'rgb(147, 112, 219)',
    activeColor: 'rgb(147, 112, 219)',
    hoverColor: 'rgb(147, 112, 219)',
  },
  themeCSS: `
    .active {
      fill: var(--sl-color-accent-high) !important;
      stroke: var(--sl-color-accent-high) !important;
    }
    .edge-active {
      stroke: var(--sl-color-accent-high) !important;
      stroke-width: 3px !important;
    }
    .edge-clickable {
      cursor: pointer !important;
    }
    .edge-clickable:hover {
      stroke-width: 4px !important;
    }
  `,
});

// Main React component
export const MermaidInspector = React.memo(function MermaidInspector({
  shape,
  currentStateKey,
  actions,
  interactive = true,
  diagramType = 'statechart',
}: {
  shape: MachineShape;
  currentStateKey: string;
  actions?: Record<string, any>;
  interactive?: boolean;
  diagramType?: 'statechart' | 'flowchart';
}) {
  console.log('MermaidInspector called with:', { shape, currentStateKey, diagramType });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [id] = useState(() => Math.random().toString(36).substr(2, 9));

  // Generate diagram from shape
  const diagram = useMermaidDiagram(shape, diagramType);
  console.log('Generated diagram:', diagram);

  // Apply highlighting function
  const applyHighlights = () => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous highlights
    container.querySelectorAll('.mermaid-active-state, .state-highlight').forEach(el => {
      el.classList.remove('mermaid-active-state', 'state-highlight');
    });
    container.querySelectorAll('.mermaid-active-edge, .edge-active').forEach(el => {
      el.classList.remove('mermaid-active-edge', 'edge-active');
    });

    // Convert state key to Mermaid ID format
    const currentStateId = currentStateKey.replace(/\./g, '_');
    console.log('[MermaidHighlight] Looking for state:', currentStateId);
    
    // Debug: log all IDs in the SVG
    const allIds = Array.from(container.querySelectorAll('[id]')).map(el => el.id);
    console.log('[MermaidHighlight] All IDs in SVG:', allIds.slice(0, 20));
    
    // Mermaid generates state nodes with various ID patterns
    // Try multiple selectors to find the state node
    const stateSelectors = [
      `[id*="state-${currentStateId}"]`,
      `[id*="${currentStateId}"]`,
      `g[id*="${currentStateId}"] rect`,
      `g[id*="${currentStateId}"] .basic`,
    ];
    
    let stateNode: Element | null = null;
    for (const selector of stateSelectors) {
      stateNode = container.querySelector(selector);
      if (stateNode) {
        console.log('[MermaidHighlight] Found state with selector:', selector, stateNode);
        break;
      }
    }
    
    if (stateNode) {
      // Mermaid state nodes are <g> elements containing path or rect
      // Find the shape element (path or rect) to highlight
      let shapeEl = stateNode.tagName === 'rect' || stateNode.tagName === 'path' 
        ? stateNode 
        : stateNode.querySelector('path, rect, .basic');
      
      if (shapeEl) {
        shapeEl.classList.add('mermaid-active-state', 'state-highlight');
        // Apply inline style for immediate visual feedback
        (shapeEl as SVGElement).style.fill = '#ef4444';
        (shapeEl as SVGElement).style.stroke = '#ef4444';
      }
    }

    // Highlight active edges - find edges that originate from current state
    const stateTransitions = shape.transitions.get(currentStateKey);
    if (stateTransitions) {
      // Find all edge paths and labels
      const edgePaths = container.querySelectorAll('.edgePath path, path.transition');
      const edgeLabels = container.querySelectorAll('.edgeLabel, .edgeTerminals');
      
      for (const [event] of stateTransitions.entries()) {
        // Find edge labels containing this event
        edgeLabels.forEach(label => {
          if (label.textContent?.includes(event)) {
            label.classList.add('mermaid-active-edge', 'edge-active');
            // Find associated path
            const parentG = label.closest('g');
            if (parentG) {
              const path = parentG.querySelector('path');
              if (path) {
                path.classList.add('mermaid-active-edge', 'edge-active');
                (path as SVGPathElement).style.stroke = 'var(--sl-color-accent-high, #ef4444)';
                (path as SVGPathElement).style.strokeWidth = '3';
              }
            }
            
            // Make clickable if interactive
            if (interactive && actions?.[event]) {
              label.classList.add('edge-clickable');
              (label as HTMLElement).style.cursor = 'pointer';
              label.addEventListener('click', () => actions[event]());
            }
          }
        });
      }
    }

    // Apply dark theme styling
    const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
    if (isDarkTheme) {
      container.querySelectorAll('.edgeLabel p').forEach(p => {
        (p as HTMLElement).style.backgroundColor = '#333';
        (p as HTMLElement).style.color = '#e5e7eb';
      });
      container.querySelectorAll('.edgeLabel text').forEach(text => {
        (text as SVGTextElement).style.fill = '#e5e7eb';
      });
    }
  };

  // Apply highlighting
  useEffect(() => {
    applyHighlights();
  }, [currentStateKey, shape, actions, interactive]);

  // Mermaid render
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !diagram) return;

    // Clear previous content
    container.innerHTML = '';
    
    // Render Mermaid diagram - API is render(id, text) returning {svg}
    const renderDiagram = async () => {
      try {
        const { svg } = await mermaid.render(`mermaid-${id}`, diagram);
        container.innerHTML = svg;
        // Apply highlights after Mermaid renders
        setTimeout(() => {
          applyHighlights();
        }, 100);
      } catch (error) {
        console.error('Mermaid render error:', error);
        container.innerHTML = `<pre style="color: red;">Mermaid Error: ${error}</pre><pre>${diagram}</pre>`;
      }
    };
    renderDiagram();
  }, [diagram, id]);

  if (!diagram) {
    return <div>No diagram available</div>;
  }

  return (
    <div className="mermaid-inspector">
      <div ref={containerRef} />
    </div>
  );
});

// Compatibility layer for old API
export const MermaidInspectorWithSettings = React.memo(function MermaidInspectorWithSettings({
  config,
  stateKey,
  actions,
  interactive = true,
  machine,
  diagramType = 'statechart',
}: {
  config: any;
  stateKey: string;
  actions?: Record<string, any>;
  interactive?: boolean;
  machine?: any;
  diagramType?: 'statechart' | 'flowchart';
}) {
  console.log('MermaidInspectorWithSettings called with:', { config, stateKey, machine });
  
  // Get shape from machine or create from config (compatibility support)
  const shape = useMemo(() => {
    console.log('Creating shape from config or machine...');
    
    // Try to get shape from machine first
    if (machine?.shape?.getState) {
      console.log('Getting shape from machine');
      return machine.shape.getState();
    }
    
    // Compatibility fallback: create shape from config
    if (config) {
      console.log('Creating shape from config:', config);
      try {
        // Import the shape builder
        const { buildFlattenedShape } = require('../hsm/shape-builders');
        
        // Extract transitions from config
        const transitions: Record<string, Record<string, any>> = {};
        const extractTransitions = (cfg: any, prefix = '') => {
          if (!cfg?.states) return;
          
          for (const [stateKey, state] of Object.entries(cfg.states)) {
            const fullKey = prefix ? `${prefix}.${stateKey}` : stateKey;
            const stateObj = state as any;
            
            if (stateObj.on) {
              transitions[fullKey] = {};
              for (const [event, target] of Object.entries(stateObj.on)) {
                transitions[fullKey][event] = target;
              }
            }
            
            // Recursively extract nested states
            if (stateObj.states) {
              extractTransitions(stateObj, fullKey);
            }
          }
        };
        
        extractTransitions(config);
        console.log('Extracted transitions:', transitions);
        
        // Create shape from transitions
        const initialKey = config.initial || Object.keys(transitions)[0];
        if (!initialKey) {
          console.error('MermaidInspector: No initial state found in config');
          return null;
        }
        
        console.log('Creating shape with initialKey:', initialKey);
        const shape = buildFlattenedShape(transitions, initialKey);
        console.log('Created shape:', shape);
        return shape;
      } catch (error) {
        console.error('MermaidInspector: Failed to create shape from config:', error);
        console.error('Config structure:', JSON.stringify(config, null, 2));
        return null;
      }
    }
    
    console.warn('MermaidInspector: No config or machine available');
    return null;
  }, [machine, config]);

  if (!shape) {
    console.log('No shape available, returning fallback');
    return <div>No shape available</div>;
  }

  console.log('Passing shape to main component:', shape);
  return (
    <MermaidInspector
      shape={shape}
      currentStateKey={stateKey}
      actions={actions}
      interactive={interactive}
      diagramType={diagramType}
    />
  );
});

export default MermaidInspector;
