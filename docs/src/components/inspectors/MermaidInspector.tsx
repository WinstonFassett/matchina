import mermaid from "mermaid";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Mermaid from "../Mermaid";

mermaid.initialize({
  // startOnLoad: true
  themeVariables: {},
  themeCSS: `
    /* Ensure text colors (SVG <text> and HTML <span>/<p> in foreignObject) */
    g.node text, g.state text, g.stateGroup text { fill: var(--sl-color-text); }
    .label text, span, p {
      color: var(--sl-color-text);
     }; 
    /* Invert for active state labels rendered as spans (statechart + flowchart) */
    g.node.active span, g.state.active span, g.stateGroup.active span { color: var(--sl-color-text-invert); }
    .node rect {
      fill: var(--sl-color-bg);
      stroke: var(--sl-color-text);
      rx: 10; ry: 10;
      
    }
    .node span {
      color: var(--sl-color-text);
    }
    .node circle.state-start {
      fill: var(--sl-color-text);
      stroke: var(--sl-color-text);
    }
    .transition {
      stroke: var(--sl-color-text);      
  }
    .labelBkg,
    .edgeLabel,  
    .edgeLabel p {
      background-color: transparent;
    }

    .cluster rect {
      fill: var(--sl-color-accent-high);
      opacity: 0.15;
      stroke: var(--sl-color-black);
      stroke-width: 5;
      border-radius: 10px;
      rx: 10; ry: 10;
    }
    .cluster span {
      color: var(--sl-color-text);
    }

    .cluster-label,
    .nodeLabel {
      color: var(--sl-color-text);
    }
    
    .statediagram-cluster rect,
    .statediagram-cluster.statediagram-cluster .inner {
      fill: var(--sl-color-bg);
      stroke: var(--sl-color-text);
    }
    /* used by flowchart but not stateDiagram */
    .node.active {
      animation: fadeInBg .8s ease forwards;
    }
    .flowchart-link {
      stroke: var(--sl-color-text);
    }
    .active rect {
      fill: var(--sl-color-accent-high);
    }
    .active span {
      color: var(--sl-color-text-invert);
      animation: fadeInText .8s ease forwards;
    }
    .marker {
      fill: var(--sl-color-text);
    }
    
    /* State diagram specific styles */
    .stateDiagram .state-box {
      fill: var(--sl-color-bg);
      stroke: var(--sl-color-text);
      stroke-width: 1;
    }
    
    /* DOM manipulation classes for state charts */
    .state-highlight rect {
      fill: var(--sl-color-text-accent) !important;
      stroke: var(--sl-color-accent-high) !important;
      stroke-width: 2px !important;
      animation: fadeInBg .8s ease forwards;
    }
    
    .state-highlight span {
      color: var(--sl-color-text-invert) !important;
      animation: fadeInText .8s ease forwards;
    }
    
    .state-container-highlight rect {
      stroke: var(--sl-color-accent-high) !important;
      stroke-width: 2px !important;
      fill: var(--sl-color-text-accent) !important;
      fill-opacity: 0.15 !important;
      animation: fadeInBg .8s ease forwards;
    }
    
    /* Edge label styling classes */
    .edge-active {
      background-color: var(--sl-color-gray-5) !important;
      color: var(--sl-color-accent-high) !important;
      text-decoration: underline !important;
      cursor: pointer !important;
    }
    
    .edge-inactive {
      background-color: var(--sl-color-bg) !important;
      color: var(--sl-color-gray-3) !important;
      cursor: default !important;
    }
    
    .edge-interactive {
      cursor: pointer !important;
    }
    
    @keyframes fadeInBg {
      from {
        fill-opacity: 0;
      }
      to {
        fill-opacity: 1;
      }
    }
    @keyframes fadeInText {
      from {
        opacity: 0;
      }
      to {
        opacity: 1;
      }
    }
    
  `,
});

function toStateDiagram(config: any, _callbackName: string) {
  // const currentStateKey = config.initial;
  const transitions = config;
  const rows = [] as any[];
  let indents = 0;

  // at each level,
  // render transitions, then composite states
  const renderedStates = new Set();
  addMachine(transitions);

  const diagram = `
graph LR
${rows.join("\n")}
`;
  // classDef active fill:aquamarine;
  return diagram;
  function indent() {
    return Array(indents * 4)
      .fill(" ")
      .join("");
  }

  function addMachine(config: any) {
    const allStates = new Set();

    indents += 1;

    // determine if transition is local
    // handle non-local transitions
    // add end-thingy, then named transition from main state to container with new state, etc
    const { states } = config;
    const stateKeys = Object.keys(states);

    stateKeys.forEach((stateKey, _index) => {
      allStates.add(stateKey);
      // rows.push(["    ", key, ifactive].join(""));
      let renderedState = false;
      const stateTransitions = states[stateKey]?.on;
      if (stateTransitions) {
        Object.entries(stateTransitions).forEach(([eventType, target]: [string, any]) => {
          if (!target) return;
          const targetId: string | undefined = typeof target === 'string' ? target : ((target as any)?.target as string | undefined);
          if (targetId) {
            rows.push(`    ${stateKey}-->|${eventType ? `${stateKey}<br>${eventType}` : `${stateKey}<br>AUTO`}|${targetId}[${targetId}]`);
            renderedStates.add(stateKey);
            renderedStates.add(targetId);
            renderedState = true;
          }
        });
      } else {
        rows.push(`${indent()}${stateKey} --> [*]`);
        // need something here so the state appears?
        // end node
      }
      if (!renderedState) {
      }
      // if composite
      // if (state.states) {
      //   compositeStates.push(state)
      // }
      // rows.push(["   ", "click", key, callbackName].join(" "));
    });
    // compositeStates.forEach(state => {
    //   rows.push(`${indent()}state ${state.name} {`)
    //   addMachine(state.states)

    //   rows.push(`${indent()}}`)
    // })
    // const unrenderedStates = Object.keys(config).filter(
    //   (state) => !renderedStates.has(state),
    // );
    // unrenderedStates.forEach((state) => {
    //   // rows.push(`${indent()}[*] --> ${state.name}`)
    // });
    // const state = definition.states[key];
    // console.log("state", key, state);
    // const ifactive = isActive ? ":::active" : "";
  }
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

      // Nested state (composite)
      if (state?.states) {
        rows.push(`${indent}state ${id} {`);
        walk(state, id, depth + 1);
        if (state.initial) {
          const nestedInitial = getStateId(state.initial, id);
          // In stateDiagram-v2 the initial state inside a composite is [*] --> child
          rows.push(`${indent}  [*] --> ${nestedInitial}`);
        }
        rows.push(`${indent}}`);
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
            rows.push(`${indent}${id} --> ${targetId}: ${stateKey}<br>${eventType}`);
          }
        });
      }
    });
  }

  walk(config);
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
  }: {
    config: any;
    stateKey: string;
    actions?: Record<string, any>;
    interactive?: boolean;
    diagramType?: 'flowchart' | 'statechart';
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
        // try {
        //   // Log the exact chart string diff context
        //   console.log('[MermaidInspector.chart change]', {
        //     diagramType,
        //     prevLen: chartRef.current?.length ?? 0,
        //     nextLen: next.length,
        //   });
        //   console.log('--- prev chart ---\n' + (chartRef.current ?? '') + '\n--- next chart ---\n' + next);
        // } catch {}
        chartRef.current = next;
        setChart(next);
      }
    }, [diagramType, config]);
    const debouncedStateKey = useDebouncedValue(stateKey, 60);

    // Cache the rendered container for DOM manipulation without re-rendering the SVG
    const containerRef = useRef<HTMLElement | null>(null);

    // One-time setup after render: normalize edge labels and cache metadata
    const onRender = useCallback((el: HTMLElement) => {
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
          (p as any)._edge = { fromState, type };
          p.innerHTML = type; // Only show the event type
        });
      }, 1);
    }, []);

    // Update active node highlighting and edge interactivity on state changes
    useEffect(() => {
      const root = containerRef.current;
      if (!root) return;

      // Clear previous highlights for both modes
      root
        .querySelectorAll(
          ".state-highlight, .state-container-highlight, g.node.active, g.state.active, g.stateGroup.active, .active-container"
        )
        .forEach((n) => n.classList.remove("state-highlight", "state-container-highlight", "active", "active-container"));

      if (diagramType === 'statechart') {
        // R1 approach: target Mermaid-generated IDs for state groups
        const activeSel = `[id*="state-${debouncedStateKey}-"]`;
        const activeEl = root.querySelector(activeSel) as Element | null;
        if (activeEl) activeEl.classList.add('state-highlight');

        // Parent container highlight for hierarchical context
        if (debouncedStateKey.includes('_')) {
          const parentKey = debouncedStateKey.split('_')[0];
          const parentSel = `[id*="state-${parentKey}-"]`;
          const parentEl = root.querySelector(parentSel) as Element | null;
          if (parentEl && parentEl !== activeEl) parentEl.classList.add('state-container-highlight');
        }
      } else {
        // Flowchart: id match or text fallback, add .active and optional .active-container
        let activated = false;
        try {
          const byId = root.querySelector(`g#${CSS.escape(debouncedStateKey)}`) as SVGGElement | null;
          if (byId) {
            byId.classList.add("active");
            activated = true;
          }
        } catch {}
        if (!activated) {
          const candidate = Array.from(root.querySelectorAll<SVGGElement>("g.node"))
            .find((g) => g.textContent?.trim() === debouncedStateKey);
          if (candidate) candidate.classList.add("active");
        }
        if (debouncedStateKey.includes('_')) {
          const parentKey = debouncedStateKey.split('_')[0];
          const parentNode = Array.from(root.querySelectorAll<SVGGElement>("g.node"))
            .find((g) => g.textContent?.trim() === parentKey);
          if (parentNode) parentNode.classList.add('active-container');
        }
      }

      // Edge labels: class-based styling and click binding when available
      root.querySelectorAll<HTMLParagraphElement>("span.edgeLabel > p").forEach((p) => {
        const meta = (p as any)._edge as { fromState?: string; type?: string } | undefined;
        const type = meta?.type;
        const from = meta?.fromState;
        const action = type ? actions?.[type] : undefined;
        const clickable = !!action && interactive && from === debouncedStateKey;

        // Reset classes
        p.classList.remove('edge-active', 'edge-inactive', 'edge-interactive');
        if (from === debouncedStateKey && action) {
          p.classList.add('edge-active');
          if (clickable) p.classList.add('edge-interactive');
        } else {
          p.classList.add('edge-inactive');
        }
        p.onclick = clickable ? () => action?.() : null;
      });
    }, [debouncedStateKey, actions, interactive, diagramType]);
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
