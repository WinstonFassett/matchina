import mermaid from "mermaid";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Mermaid from "./Mermaid";

mermaid.initialize({
  themeVariables: {
    // Dark mode state diagram nodes use transparent fill with light purple border
    primaryColor: 'transparent',
    primaryBorderColor: '#a78bfa',
    // Active state highlighting - try different mermaid variables
    stateBkgColor: 'rgb(147, 112, 219)',
    stateLabelBkgColor: 'rgb(147, 112, 219)',
    stateBorder_color: '#a78bfa',
    altStateBkgColor: 'rgb(147, 112, 219)',
    activeColor: 'rgb(147, 112, 219)',
    hoverColor: 'rgb(147, 112, 219)',
  },
  themeCSS: `
    /* Visualizer-specific styling - generic styling in mermaid.css */
    
    /* Container styling to prevent overflow */
    .mermaid-container {
      width: 100%;
      overflow-x: auto;
      overflow-y: visible;
    }
    
    .mermaid-container svg {
      max-width: 100%;
      height: auto;
    }
    
    /* Base node styling - ESSENTIAL for visual parity */
    .node text {
      fill: var(--sl-color-text) !important;
    }
    
    .node p {
      fill: var(--sl-color-text) !important;
      color: var(--sl-color-text) !important;
    }
    
    /* State text styling - target all state diagram text elements */
    .state text,
    .state-diagram-v2 text,
    g[class*="state"] text,
    .state span,
    .state-diagram-v2 span,
    g[class*="state"] span,
    .state p,
    .state-diagram-v2 p,
    g[class*="state"] p {
      fill: var(--sl-color-text) !important;
      color: var(--sl-color-text) !important;
    }
    
    .node circle.state-start {
      fill: var(--sl-color-text);
      stroke: var(--sl-color-text);
    }
    
    /* State diagram nodes - transparent background */
    .state-diagram-v2 g.state-node path,
    g[class*="state"] path:not([class*="active"]) {
      fill: transparent !important;
      stroke: var(--sl-color-text-accent) !important;
      stroke-width: 2px !important;
    }
    
    /* Flowchart nodes - match state chart style */
    .node rect {
      fill: transparent !important;
      stroke: var(--sl-color-text-accent) !important;
      stroke-width: 2px !important;
      rx: 5;
      ry: 5;
    }
    
    /* State chart compound state styling */
    .statediagram-cluster rect,
    .statediagram-cluster .inner rect {
      fill: transparent !important;
      background: transparent !important;
      stroke: var(--sl-color-text-accent) !important;
      stroke-width: 2px !important;
    }
    
    /* Flowchart subgraph styling */
    .cluster rect,
    .cluster path {
      fill: var(--sl-color-surface) !important;
      stroke: var(--sl-color-text-accent) !important;
      stroke-width: 1px !important;
    }
    
    /* Cluster label styling */
    .cluster-label {
      fill: var(--sl-color-text) !important;
    }
    
    .cluster-label .nodeLabel {
      color: var(--sl-color-text) !important;
    }
    
    /* Active state styling */
    .active {
      fill: var(--sl-color-accent-high) !important;
      stroke: var(--sl-color-accent-high) !important;
    }
    
    .node.active rect,
    .node.active path,
    .node.active circle,
    .node.active ellipse,
    .node.active polygon {
      fill: var(--sl-color-accent-high) !important;
      stroke: var(--sl-color-accent-high) !important;
    }
    
    /* State diagram active node - target the path inside statediagram-state */
    .node.statediagram-state.active path,
    .statediagram-state.active path,
    g[class*="state"].active path,
    g.node.active path {
      fill: var(--sl-color-accent-high) !important;
      stroke: var(--sl-color-accent-high) !important;
    }
    
    /* Override the transparent fill rule for active nodes */
    g[class*="state"].active path:not([class*="active"]) {
      fill: var(--sl-color-accent-high) !important;
      stroke: var(--sl-color-accent-high) !important;
    }
    
    .node.active text,
    .node.active p {
      fill: var(--sl-color-bg) !important;
      color: var(--sl-color-bg) !important;
    }
    
    /* Edge interactivity styling */
    .edge-active {
      stroke: var(--sl-color-accent-high) !important;
      stroke-width: 3px !important;
    }
    
    .edge-clickable {
      cursor: pointer !important;
      stroke: var(--sl-color-text-accent) !important;
    }
    
    .edge-clickable:hover {
      stroke-width: 4px !important;
    }
    
    /* Edge label styling for interactivity - classes are on the p element */
    p.edge-active {
      color: var(--sl-color-accent-high) !important;
      font-weight: 600 !important;
      text-decoration: underline !important;
    }
    
    p.edge-ancestor {
      color: var(--sl-color-accent-high) !important;
      font-weight: 600 !important;
      text-decoration: underline !important;
    }
    
    p.edge-inactive {
      color: var(--sl-color-text) !important;
    }
    
    p.edge-interactive {
      cursor: pointer !important;
    }
    
    p.edge-interactive:hover {
      background-color: var(--sl-color-accent-high) !important;
      color: var(--sl-color-bg) !important;
    }
    
    /* Interactive edges */
    .edge-interactive {
      cursor: pointer !important;
      position: relative;
      z-index: 10 !important;
    }
  `,
});

function toStateDiagram(config: any, _callbackName: string) {
  const rows = [] as any[];

  function getStateId(stateName: string, parentPrefix: string = ""): string {
    return parentPrefix ? `${parentPrefix}_${stateName}` : stateName;
  }

  function walk(cfg: any, parentPrefix: string = "", depth = 0) {
    if (!cfg?.states) return;
    const indent = "    ";
    const stateKeys = Object.keys(cfg.states);

    stateKeys.forEach((stateKey) => {
      const state = cfg.states[stateKey];
      const id = getStateId(stateKey, parentPrefix);

      // Handle nested states (composite states with substates)
      if (state?.states) {
        // Render as a subgraph for nested states
        rows.push(`${indent}subgraph ${id}["${stateKey}"]`);
        walk(state, id, depth + 1);
        rows.push(`${indent}end`);
      }

      // Transitions
      if (state?.on) {
        Object.entries(state?.on).forEach(([eventType, target]: [string, any]) => {
          if (!target) return;
          let targetId: string | undefined;
          let nestedTarget: string | undefined;
          
          if (typeof target === "string") {
            // Handle nested state targets properly
            if (target.includes('.')) {
              // Nested state like "Working.Red" - use the full path with underscores
              targetId = target.replace(/\./g, '_');
            } else {
              // Check if this target exists as a nested state somewhere in the hierarchy
              const findNestedState = (cfg: any, targetName: string, currentPrefix: string = ""): string | undefined => {
                if (!cfg?.states) return undefined;
                
                // Check if target exists at current level
                if (cfg.states[targetName]) {
                  return getStateId(targetName, currentPrefix);
                }
                
                // Recursively check nested states
                for (const [nestedKey, nestedState] of Object.entries(cfg.states)) {
                  if (nestedState && (nestedState as any).states) {
                    const nestedPrefix = getStateId(nestedKey, currentPrefix);
                    const result = findNestedState(nestedState, targetName, nestedPrefix);
                    if (result) return result;
                  }
                }
                
                return undefined;
              };
              
              // Try to find the target as a nested state first
              nestedTarget = findNestedState(config, target);
              if (nestedTarget) {
                targetId = nestedTarget;
              } else {
                // Fall back to top-level state
                targetId = getStateId(target, parentPrefix);
              }
            }
          } else if ((target as any)?.target) {
            targetId = getStateId((target as any).target, parentPrefix);
          }
          
          if (targetId) {
            // Normalize parent state transitions to be from the initial nested state
            let fromId = id;
            if (state?.states && parentPrefix === "" && nestedTarget && !stateKey.includes('_')) {
              // This is a top-level composite state with nested states (not a nested state itself)
              // The transition should be from the initial nested state
              // Use the original machine configuration to get the initial state
              const originalState = config.states[stateKey];
              const initialState = originalState?.initial;
              if (initialState) {
                fromId = getStateId(initialState, id);
              }
            }
            
            rows.push(`${indent}${fromId}-->|${fromId}<br>${eventType}|${targetId}[${targetId}]`);
          }
        });
      }
    });
  }

  walk(config);

  const diagram = `
graph LR
${rows.join("\n")}
`;
  return diagram;
}

// Generate a Mermaid stateDiagram-v2 string from a nested machine config
// Labels include "fromState<br>eventType" to align with DOM normalization
function toStateChart(config: any) {
  const rows: string[] = [];

  function getStateId(stateName: string, parentPrefix: string = ""): string {
    return parentPrefix ? `${parentPrefix}_${stateName}` : stateName;
  }

  function walk(cfg: any, parentPrefix: string = "", depth = 0) {
    if (!cfg?.states) return;
    const indent = "    ".repeat(depth);
    const stateKeys = Object.keys(cfg.states);

    stateKeys.forEach((stateKey) => {
      const state = cfg.states[stateKey];
      const id = getStateId(stateKey, parentPrefix);

      // Create state definition for ALL states (both composite and leaf)
      if (state?.states) {
        // Composite state - contains nested states
        rows.push(`${indent}state ${id} {`);
        walk(state, id, depth + 1);
        if (state.initial) {
          const nestedInitial = getStateId(state.initial, id);
          // In stateDiagram-v2 the initial state inside a composite is [*] --> child
          rows.push(`${indent}  [*] --> ${nestedInitial}`);
        }
        rows.push(`${indent}}`);
      } else {
        // Leaf state - just declare the state (no braces needed in stateDiagram-v2)
        rows.push(`${indent}state ${id}`);
      }

      // Transitions
      if (state?.on) {
        Object.entries(state?.on).forEach(([eventType, target]: [string, any]) => {
          if (!target) return;
          let targetId: string | undefined;
          let nestedTarget: string | undefined;
          
          if (typeof target === "string") {
            // Handle nested state targets properly
            if (target.includes('.')) {
              // Nested state like "Working.Red" - use the full path with underscores
              targetId = target.replace(/\./g, '_');
            } else {
              // Check if this target exists as a nested state somewhere in the hierarchy
              const findNestedState = (cfg: any, targetName: string, currentPrefix: string = ""): string | undefined => {
                if (!cfg?.states) return undefined;
                
                // Check if target exists at current level
                if (cfg.states[targetName]) {
                  return getStateId(targetName, currentPrefix);
                }
                
                // Recursively check nested states
                for (const [nestedKey, nestedState] of Object.entries(cfg.states)) {
                  if (nestedState && (nestedState as any).states) {
                    const nestedPrefix = getStateId(nestedKey, currentPrefix);
                    const result = findNestedState(nestedState, targetName, nestedPrefix);
                    if (result) return result;
                  }
                }
                
                return undefined;
              };
              
              // Try to find the target as a nested state first
              nestedTarget = findNestedState(config, target);
              if (nestedTarget) {
                targetId = nestedTarget;
              } else {
                // Fall back to top-level state
                targetId = getStateId(target, parentPrefix);
              }
            }
          } else if ((target as any)?.target) {
            targetId = getStateId((target as any).target, parentPrefix);
          }
          
          if (targetId) {
            // Normalize parent state transitions to be from the initial nested state
            let fromId = id;
            if (state?.states && parentPrefix === "" && nestedTarget && !stateKey.includes('_')) {
              // This is a top-level composite state with nested states (not a nested state itself)
              // The transition should be from the initial nested state
              // Use the original machine configuration to get the initial state
              const originalState = config.states[stateKey];
              const initialState = originalState?.initial;
              if (initialState) {
                fromId = getStateId(initialState, id);
              }
            }
            
            rows.push(`${indent}${fromId} --> ${targetId}: ${id}<br>${eventType}`);
          }
        });
      }
    });
  }

  walk(config);
  
  // Add root initial state if it exists
  if (config.initial) {
    const rootInitial = getStateId(config.initial);
    rows.unshift(`[*] --> ${rootInitial}`);
  }
  
  return `stateDiagram-v2\n${rows.join("\n")}`;
}

let lastId = 0;

const MermaidInspector = memo(
  ({
    config,
    stateKey,
    actions,
    interactive = true,
    diagramType: diagramTypeProp,
    machine, // Add machine prop for direct action lookup
  }: {
    config: any;
    stateKey: string;
    actions?: Record<string, any>;
    interactive?: boolean;
    diagramType?: 'flowchart' | 'statechart';
    machine?: any; // Machine instance for nested action lookup
  }) => {
    const [id] = useState((lastId++).toString());
    const diagramType = diagramTypeProp ?? 'statechart';
    // Generate chart string and only update when it actually changes
    const initialChart = useMemo(() => (
      diagramType === 'statechart' ? toStateChart(config) : toStateDiagram(config, id)
    ), []);
    const chartRef = useRef<string>(initialChart);
    const [chart, setChart] = useState<string>(initialChart);
    useEffect(() => {
      const next = diagramType === 'statechart' ? toStateChart(config) : toStateDiagram(config, id);
      if (next !== chartRef.current) {
        chartRef.current = next;
        setChart(next);
      }
    }, [diagramType, config]);
    const debouncedStateKey = useDebouncedValue(stateKey, 60);

    // Cache the rendered container for DOM manipulation without re-rendering the SVG
    const containerRef = useRef<HTMLElement | null>(null);

    // Refs to hold latest values for use from onRender (which can be called before
    // React effects that update state run). This ensures the highlight function
    // always uses the most recent values when invoked directly from onRender.
    const debouncedStateKeyRef = useRef(debouncedStateKey);
    const actionsRef = useRef(actions);
    const interactiveRef = useRef(interactive);
    const diagramTypeRef = useRef(diagramType);
    const machineRef = useRef(machine);
    const configRef = useRef(config);

    // Apply highlights immediately when state changes (not just debounced)
    useEffect(() => {
      const container = containerRef.current;
      if (container) {
        applyHighlights(container);
      }
    }, [stateKey]);

    useEffect(() => {
      debouncedStateKeyRef.current = debouncedStateKey;
    }, [debouncedStateKey]);
    useEffect(() => {
      actionsRef.current = actions;
    }, [actions]);
    useEffect(() => {
      interactiveRef.current = interactive;
    }, [interactive]);
    useEffect(() => {
      diagramTypeRef.current = diagramType;
    }, [diagramType]);
    useEffect(() => {
      machineRef.current = machine;
    }, [machine]);
    useEffect(() => {
      configRef.current = config;
    }, [config]);

    // Apply dark theme edge label styling when theme changes
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      
      const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
      
      // Apply or remove dark theme styling
      container.querySelectorAll('.edgeLabel p').forEach(p => {
        const element = p as HTMLElement;
        if (isDarkTheme) {
          element.style.backgroundColor = '#333';  // Consistent with flowchart
          element.style.color = '#e5e7eb';     // Lighter gray for better contrast
        } else {
          // Reset to default for light theme
          element.style.backgroundColor = '';
          element.style.color = '';
        }
      });
      
      container.querySelectorAll('.edgeLabel text').forEach(text => {
        const element = text as SVGTextElement;
        if (isDarkTheme) {
          element.style.fill = '#e5e7eb';
        } else {
          // Reset to default for light theme
          element.style.fill = '';
        }
      });
    }, [stateKey]); // Trigger when state changes (theme changes might trigger re-render)

    // Helper function to find action in nested states using the config shape
    const findActionInNestedStates = (eventType: string, fromState: string): (() => void) | undefined => {
      const machine = machineRef.current;
      const config = configRef.current;
      if (!machine || !config) return undefined;
      
      // First try the regular actions (top-level)
      const topLevelAction = actionsRef.current?.[eventType];
      if (topLevelAction) {
        return topLevelAction;
      }
      
      // Then look in nested states using the config shape
      const findInState = (state: any, path: string[]): any => {
        if (!state) return undefined;
        
        // Check if this state has the transition
        if (state.on && state.on[eventType]) {
          return (...args: any[]) => (machine as any).send(eventType, ...args);
        }
        
        // Recursively check nested states
        if (state.states) {
          for (const [nestedKey, nestedState] of Object.entries(state.states)) {
            const result = findInState(nestedState, [...path, nestedKey]);
            if (result) {
              return result;
            }
          }
        }
        
        return undefined;
      };
      
      // Check if fromState is a nested path (e.g., "Working.Red")
      if (fromState.includes('.')) {
        const [parentState, nestedState] = fromState.split('.');
        const parentConfig = config.states[parentState];
        if (parentConfig && parentConfig.states) {
          const result = findInState(parentConfig.states[nestedState], [parentState, nestedState]);
          if (result) return result;
        }
      }
      
      const result = findInState(config.states, []);
      return result;
    };

    // One-time setup after render: normalize edge labels and cache metadata
    const onRender = useCallback((el: HTMLElement) => {
      if (!el) return; // Add null check
      containerRef.current = el;
      setTimeout(() => {
        el.querySelectorAll("span.edgeLabel").forEach((span) => {
          const p = span.querySelector("p");
          if (!p) return;
          const lines = Array.from(p.childNodes)
            .map((node) =>
              node.nodeType === Node.ELEMENT_NODE &&
              (node as HTMLElement).tagName === "BR"
                ? "\n"
                : node.textContent
            )
            .join("")
            .split("\n");
          const [fromState, type] = lines;
          
          // Convert underscores to dots to match currentKey format
          const normalizedFromState = fromState.replace(/_/g, '.');
          
          (p as any)._edge = { fromState: normalizedFromState, type };
          p.innerHTML = type; // Only show the event type
        });
        
        // Fix dark theme edge label styling (JavaScript approach like edge-active)
        const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDarkTheme) {
          // Apply dark theme styling to edge labels
          el.querySelectorAll('.edgeLabel p').forEach(p => {
            (p as HTMLElement).style.backgroundColor = '#333';  // Consistent with flowchart
            (p as HTMLElement).style.color = '#e5e7eb';     // Lighter gray for better contrast
          });
          el.querySelectorAll('.edgeLabel text').forEach(text => {
            (text as SVGTextElement).style.fill = '#e5e7eb';
          });
        }
        
        // Ensure the active state is highlighted immediately after Mermaid
        // finishes rendering and we normalized the DOM. This fixes the case
        // (observed in Astro on first render) where the highlight effect
        // ran before the container existed.
        applyHighlights(el);
      }, 1);
    }, []);

    // Update active node highlighting and edge interactivity on state changes
    // Extracted highlighting function so it can be invoked both from the
    // render-time callback (when the SVG first appears) and from a React
    // effect that runs on updates.
    function applyHighlights(rootEl?: HTMLElement | null) {
      const root = rootEl ?? containerRef.current;
      if (!root) return;
      
      console.log('applyHighlights called with currentKey:', debouncedStateKeyRef.current);

      const currentKey = debouncedStateKeyRef.current;
      const currentActions = actionsRef.current;
      const currentInteractive = interactiveRef.current;
      const currentDiagramType = diagramTypeRef.current;

      // Clear previous highlights for both modes
      root
        .querySelectorAll(
          ".state-highlight, .state-container-highlight, g.node.active, g.state.active, g.stateGroup.active, .active-container"
        )
        .forEach((n) => n.classList.remove("state-highlight", "state-container-highlight", "active", "active-container"));
      
      // Clear inline styles from all nodes first (before removing classes)
      root.querySelectorAll('g.node').forEach(node => {
        const g = node as SVGGElement;
        g.querySelectorAll('path, rect, circle, ellipse, polygon').forEach(shape => {
          (shape as SVGElement).style.removeProperty('fill');
          (shape as SVGElement).style.removeProperty('stroke');
          (shape as SVGElement).style.removeProperty('stroke-width');
        });
        g.querySelectorAll('text, p').forEach(text => {
          (text as SVGElement).style.removeProperty('fill');
          (text as SVGElement).style.removeProperty('color');
        });
      });
      
      // Then remove the active class from any nodes that have it
      root.querySelectorAll('.node.active').forEach(node => {
        node.classList.remove("active");
      });
      
      if (currentDiagramType === 'statechart') {
        // Convert currentKey to match Mermaid ID format (dots to underscores)
        const mermaidKey = currentKey.replace(/\./g, '_');
        const activeSel = `[id*="state-${mermaidKey}-"]`;
        const activeEl = root.querySelector(activeSel) as Element | null;
        if (activeEl) {
          activeEl.classList.add('state-highlight', 'active');
          
          // Force text color to be dark on dark theme
          if (document.documentElement.getAttribute('data-theme') === 'dark') {
            activeEl.querySelectorAll('text, p').forEach(text => {
              (text as SVGElement).style.setProperty('color', 'var(--sl-color-bg)', 'important');
              (text as SVGElement).style.setProperty('fill', 'var(--sl-color-bg)', 'important');
            });
          }
        }

        if (currentKey.includes('.')) {
          const parentKey = currentKey.split('.')[0];
          const mermaidParentKey = parentKey.replace(/\./g, '_');
          const parentSel = `[id*="state-${mermaidParentKey}-"]`;
          const parentEl = root.querySelector(parentSel) as Element | null;
          if (parentEl && parentEl !== activeEl) parentEl.classList.add('state-container-highlight');
        }
      } else {
        let activated = false;
        
        // Convert currentKey to match Mermaid ID format (dots to underscores)
        const mermaidKey = currentKey.replace(/\./g, '_');
        
        try {
          const byId = root.querySelector(`g#${CSS.escape(mermaidKey)}`) as SVGGElement | null;
          if (byId) {
            byId.classList.add("active");
            // Apply purple background directly to match state chart styling
            const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
            byId.querySelectorAll('path, rect, circle, ellipse, polygon').forEach(shape => {
              (shape as SVGElement).style.setProperty('fill', 'var(--sl-color-accent-high)', 'important');
              (shape as SVGElement).style.setProperty('stroke', 'var(--sl-color-accent-high)', 'important');
              (shape as SVGElement).style.setProperty('stroke-width', '2px', 'important');
            });
            // Also update text color for contrast (match state chart dark text on highlight)
            byId.querySelectorAll('text, p').forEach(text => {
              (text as SVGElement).style.setProperty('fill', 'var(--sl-color-bg)', 'important');
              (text as SVGElement).style.setProperty('color', 'var(--sl-color-bg)', 'important');
            });
            activated = true;
          }
        } catch {}
        
        if (!activated) {
          // Try to find by text content - this is the most reliable for flowcharts
          const candidate = Array.from(root.querySelectorAll<SVGGElement>("g.node"))
            .find((g) => {
              const text = g.textContent?.trim();
              return text === mermaidKey || text === currentKey;
            });
          if (candidate) {
            candidate.classList.add("active");
            // Apply purple background directly to match state chart styling
            const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
            candidate.querySelectorAll('path, rect, circle, ellipse, polygon').forEach(shape => {
              (shape as SVGElement).style.setProperty('fill', 'var(--sl-color-accent-high)', 'important');
              (shape as SVGElement).style.setProperty('stroke', 'var(--sl-color-accent-high)', 'important');
              (shape as SVGElement).style.setProperty('stroke-width', '2px', 'important');
            });
            // Also update text color for contrast (match state chart dark text on highlight)
            candidate.querySelectorAll('text, p').forEach(text => {
              (text as SVGElement).style.setProperty('fill', 'var(--sl-color-bg)', 'important');
              (text as SVGElement).style.setProperty('color', 'var(--sl-color-bg)', 'important');
            });
            activated = true;
          }
        }
        
        if (!activated) {
          // Try finding by title element or other attributes
          const candidate = Array.from(root.querySelectorAll<SVGGElement>("g.node"))
            .find((g) => {
              const title = g.querySelector('title')?.textContent;
              const id = g.getAttribute('id');
              return title === mermaidKey || title === currentKey || id === mermaidKey || id === currentKey;
            });
          if (candidate) {
            candidate.classList.add("active");
            // Apply purple background directly to match state chart styling
            const isDarkTheme = document.documentElement.getAttribute('data-theme') === 'dark';
            candidate.querySelectorAll('path, rect, circle, ellipse, polygon').forEach(shape => {
              (shape as SVGElement).style.setProperty('fill', 'var(--sl-color-accent-high)', 'important');
              (shape as SVGElement).style.setProperty('stroke', 'var(--sl-color-accent-high)', 'important');
              (shape as SVGElement).style.setProperty('stroke-width', '2px', 'important');
            });
            // Also update text color for contrast (match state chart dark text on highlight)
            candidate.querySelectorAll('text, p').forEach(text => {
              (text as SVGElement).style.setProperty('fill', 'var(--sl-color-bg)', 'important');
              (text as SVGElement).style.setProperty('color', 'var(--sl-color-bg)', 'important');
            });
            activated = true;
          }
        }
        
        if (currentKey.includes('.')) {
          const parentKey = currentKey.split('.')[0];
          const mermaidParentKey = parentKey.replace(/\./g, '_');
          const parentNode = Array.from(root.querySelectorAll<SVGGElement>("g.node"))
            .find((g) => g.textContent?.trim() === mermaidParentKey);
          if (parentNode) parentNode.classList.add('active-container');
        }
      }

      // Edge labels: class-based styling and click binding when available
      root.querySelectorAll<HTMLParagraphElement>("span.edgeLabel > p").forEach((p) => {
        const meta = (p as any)._edge as { fromState?: string; type?: string } | undefined;
        const type = meta?.type;
        const from = meta?.fromState;
        
        // Use enhanced action lookup that includes nested states
        const action = type ? findActionInNestedStates(type, from || '') : undefined;
        
        let isCurrentStateAction = false;
        let isAncestorAction = false;
        
        if (from && currentKey) {
          if (currentDiagramType === 'statechart') {
            // STATE CHART: Edge labels use different format, handle statechart-specific logic
            // State charts use IDs like "state-Working.Red-123" and edge labels may be different
            if (from === currentKey) {
              isCurrentStateAction = true;
            }
            // Handle nested states in statecharts
            else if (currentKey.includes('.') && from.includes('.')) {
              if (currentKey.startsWith(from + '.')) {
                isAncestorAction = true;
              }
              // Check if from is a parent of current (hierarchical transitions)
              else if (from === currentKey.split('.')[0]) {
                isAncestorAction = true;
              }
            }
            // Handle parent state transitions (from is parent, currentKey is child)
            else if (currentKey.includes('.') && !from.includes('.')) {
              const currentParent = currentKey.split('.')[0];
              if (from === currentParent) {
                isAncestorAction = true;
              }
              // Handle leaf name matching for statecharts
              const currentLeaf = currentKey.split('.').slice(-1)[0];
              if (from === currentLeaf) {
                isCurrentStateAction = true;
              }
            }
          } else {
            // FLOWCHART: Edge labels use full paths with underscores (Working_Red)
            // Flowcharts have different DOM structure and edge labeling
            if (from === currentKey) {
              isCurrentStateAction = true;
            }
            // Handle underscore to dot conversion for flowcharts
            else if (from.includes('_') && currentKey.includes('.')) {
              const fromDots = from.replace(/_/g, '.');
              if (fromDots === currentKey) {
                isCurrentStateAction = true;
              }
              // Check if from is ancestor of current
              else if (currentKey.startsWith(fromDots + '.')) {
                isAncestorAction = true;
              }
            }
            // Handle leaf name matching for flowcharts
            else if (currentKey.includes('.') && !from.includes('.')) {
              const currentParent = currentKey.split('.')[0];
              if (from === currentParent) {
                isAncestorAction = true;
              }
              const currentLeaf = currentKey.split('.').slice(-1)[0];
              if (from === currentLeaf) {
                isCurrentStateAction = true;
              }
            }
            // Handle underscore currentKey in flowcharts
            else if (currentKey.includes('_') && from.includes('.')) {
              const currentDots = currentKey.replace(/_/g, '.');
              if (from === currentDots) {
                isCurrentStateAction = true;
              }
              // Check if from is ancestor of current
              else if (currentDots.startsWith(from + '.')) {
                isAncestorAction = true;
              }
              // Check if from is parent of current (hierarchical transitions)
              else if (from === currentDots.split('.')[0]) {
                isAncestorAction = true;
              }
            }
          }
        }
        
        const canInvoke = !!action && currentInteractive && (isCurrentStateAction || isAncestorAction);

        p.classList.remove('edge-active', 'edge-inactive', 'edge-interactive', 'edge-ancestor');
        if (isCurrentStateAction && action) {
          p.classList.add('edge-active');
          if (canInvoke) p.classList.add('edge-interactive');
        } else if (isAncestorAction && action) {
          p.classList.add('edge-ancestor');
          if (canInvoke) p.classList.add('edge-interactive');
        } else {
          p.classList.add('edge-inactive');
        }
        // All transitions are clickable; state machine guards against invalid transitions
        p.onclick = action ? () => action?.() : null;
      });
      
      // Style edge paths to match their labels
      // Edge labels and edge paths are in the same order in the DOM
      const edgeLabels = Array.from(root.querySelectorAll<HTMLElement>('g.edgeLabels > g.edgeLabel'));
      const edgePathElements = Array.from(root.querySelectorAll<SVGPathElement>('g.edgePaths > path'));
      
      edgeLabels.forEach((label, index) => {
        const p = label.querySelector('p');
        const path = edgePathElements[index];
        if (!p || !path) return;
        
        const isActive = p.classList.contains('edge-active');
        const isAncestor = p.classList.contains('edge-ancestor');
        const isInteractive = p.classList.contains('edge-interactive');
        
        // Reset path styling
        path.style.removeProperty('stroke');
        path.style.removeProperty('stroke-width');
        
        if (isActive || isAncestor) {
          // Highlight active/ancestor edges with accent color and thicker stroke
          path.style.setProperty('stroke', 'var(--sl-color-accent-high)', 'important');
          path.style.setProperty('stroke-width', '3px', 'important');
        }
        
        if (isInteractive) {
          path.style.setProperty('cursor', 'pointer');
        }
      });
    }

    useEffect(() => {
      // Re-apply highlights on updates (state changes, actions, etc.)
      applyHighlights();
    }, [debouncedStateKey, actions, interactive, diagramType]);

    // Also apply highlights on mount to ensure initial state is highlighted
    useEffect(() => {
      const timer = setTimeout(() => {
        applyHighlights();
      }, 100); // Small delay to ensure Mermaid has rendered
      return () => clearTimeout(timer);
    }, []);
    if (!chart) return <div>NO CHART!!!</div>;

    return (
      <div className="container">
        <Mermaid content={chart} onRender={onRender} />
        {/* <pre>{chart}</pre> */}
        {/* <pre>{JSON.stringify(machine, null, 2)}</pre> */}
        {/*<pre>{JSON.stringify(definition, null, 2)}</pre>*/}
      </div>
    );
  }
);
export { MermaidInspector };


export function useDebouncedValue<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default MermaidInspector;
