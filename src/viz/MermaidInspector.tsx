import mermaid from "mermaid";
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Mermaid from "./Mermaid";
import mermaidInspectorCss from "./MermaidInspector.css?raw";

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
  themeCSS: mermaidInspectorCss,
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
        Object.entries(state.on).forEach(([eventType, target]: [string, any]) => {
          if (!target) return;
          const targetId: string | undefined =
            typeof target === "string"
              ? getStateId(target, parentPrefix)
              : (target as any)?.target
              ? getStateId((target as any).target, parentPrefix)
              : undefined;
          if (targetId) {
            rows.push(`${indent}${id}-->|${id}<br>${eventType}|${targetId}[${targetId}]`);
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
        Object.entries(state.on).forEach(([eventType, target]: [string, any]) => {
          if (!target) return;
          const targetId: string | undefined =
            typeof target === "string"
              ? target.includes('.') ? target.replace(/\./g, '_') : getStateId(target, parentPrefix)  // Fix flattened state targets
              : (target as any)?.target
              ? getStateId((target as any).target, parentPrefix)
              : undefined;
          if (targetId) {
            rows.push(`${indent}${id} --> ${targetId}: ${id}<br>${eventType}`);
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
      
      // Also clear inline styles from JavaScript-applied node styling
      root.querySelectorAll('.node.active').forEach(node => {
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

      if (currentDiagramType === 'statechart') {
        // Convert currentKey to match Mermaid ID format (dots to underscores)
        const mermaidKey = currentKey.replace(/\./g, '_');
        const activeSel = `[id*="state-${mermaidKey}-"]`;
        const activeEl = root.querySelector(activeSel) as Element | null;
        if (activeEl) activeEl.classList.add('state-highlight');

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
            // Also update text color for contrast
            byId.querySelectorAll('text, p').forEach(text => {
              (text as SVGElement).style.fill = isDarkTheme ? '#1f2937' : '#ffffff';
              (text as SVGElement).style.color = isDarkTheme ? '#1f2937' : '#ffffff';
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
            // Also update text color for contrast
            candidate.querySelectorAll('text, p').forEach(text => {
              (text as SVGElement).style.fill = isDarkTheme ? '#1f2937' : '#ffffff';
              (text as SVGElement).style.color = isDarkTheme ? '#1f2937' : '#ffffff';
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
            // Also update text color for contrast
            candidate.querySelectorAll('text, p').forEach(text => {
              (text as SVGElement).style.fill = isDarkTheme ? '#1f2937' : '#ffffff';
              (text as SVGElement).style.color = isDarkTheme ? '#1f2937' : '#ffffff';
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
            }
            // Handle leaf name matching for statecharts
            else if (currentKey.includes('.') && !from.includes('.')) {
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

// Optional helper with UI to switch diagram types (default to statechart)
export const MermaidInspectorWithSettings = memo(
  ({
    config,
    stateKey,
    actions,
    interactive = true,
  }: {
    config: any;
    stateKey: string;
    actions?: Record<string, any>;
    interactive?: boolean;
  }) => {
    const [diagramType, setDiagramType] = useState<'flowchart' | 'statechart'>('statechart');
    return (
      <div>
        <div style={{
          marginBottom: '12px',
          padding: '8px',
          backgroundColor: 'var(--sl-color-gray-6)',
          borderRadius: '6px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center'
        }}>
          <label style={{ fontSize: '14px', fontWeight: 500 }}>Diagram Type:</label>
          <select
            value={diagramType}
            onChange={(e) => setDiagramType(e.target.value as 'flowchart' | 'statechart')}
            style={{
              padding: '4px 8px',
              borderRadius: '4px',
              border: '1px solid var(--sl-color-gray-4)',
              backgroundColor: 'var(--sl-color-bg)',
              color: 'var(--sl-color-text)'
            }}
          >
            <option value="statechart">State Chart</option>
            <option value="flowchart">Flowchart</option>
          </select>
        </div>
        <MermaidInspector
          config={config}
          stateKey={stateKey}
          actions={actions}
          interactive={interactive}
          diagramType={diagramType}
        />
      </div>
    );
  }
);

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

export default MermaidInspectorWithSettings;
