import mermaid from "mermaid";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Mermaid from "../Mermaid";

mermaid.initialize({
  // startOnLoad: true
  themeVariables: {},
  themeCSS: `
    .label text, span, p {
      color: var(--sl-color-text);
 
     }
    .node rect {
      fill: var(--sl-color-bg);
      stroke: var(--sl-color-text);
      rx: 10; ry: 10;
      
    }
    /* Statechart nodes */
    .state rect, .stateGroup rect {
      fill: var(--sl-color-bg);
      stroke: var(--sl-color-text);
      rx: 8; ry: 8;
    }
    .state .label, .stateGroup .label, g.node .label {
      color: var(--sl-color-text);
    }
    /* Edge labels */
    span.edgeLabel > p {
      background: var(--sl-color-bg);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--sl-color-gray-5);
      transition: color .12s ease, background-color .12s ease, text-decoration .12s ease;
    }

    .active rect {
      animation: fadeInBg .8s ease forwards;
    }
    .flowchart-link {
      stroke: var(--sl-color-text);
    }
    .active rect {
      fill: var(--sl-color-text-accent);

    }
    .active span, .active .label {
      color: var(--sl-color-text-invert);
      animation: fadeInText .8s ease forwards;
    }
    .marker {
      fill: var(--sl-color-text);
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
          rows.push(`${indent}  ${id} --> ${nestedInitial}`);
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
    const { states } = config;
    const chart = useMemo(() => (
      diagramType === 'statechart' ? toStateChart(config) : toStateDiagram(config, id)
    ), [states, diagramType]);
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

      // Highlight active node (flowchart/statechart friendly)
      // Clear previous
      root.querySelectorAll("g.node.active, g.state.active, g.stateGroup.active, .active-container").forEach((n) => n.classList.remove("active", "active-container"));
      // Try id match first
      let activated = false;
      try {
        const byId = root.querySelector(`g#${CSS.escape(debouncedStateKey)}`) as SVGGElement | null;
        if (byId) {
          byId.classList.add("active");
          activated = true;
        }
      } catch {}
      // Fallback by text content
      if (!activated) {
        const nodeSelector = diagramType === 'flowchart' ? "g.node" : "g.state, g.stateGroup";
        const candidate = Array.from(root.querySelectorAll<SVGGElement>(nodeSelector))
          .find((g) => g.textContent?.trim() === debouncedStateKey);
        if (candidate) candidate.classList.add("active");
      }

      // Edge labels: style and click when available from current state
      root.querySelectorAll<HTMLParagraphElement>("span.edgeLabel > p").forEach((p) => {
        const meta = (p as any)._edge as { fromState?: string; type?: string } | undefined;
        const type = meta?.type;
        const from = meta?.fromState;
        const action = type ? actions?.[type] : undefined;
        const clickable = !!action && interactive && from === debouncedStateKey;

        if (from === debouncedStateKey && action) {
          p.style.backgroundColor = "var(--sl-color-gray-5)";
          p.style.color = "var(--sl-color-accent-high)";
          p.style.textDecoration = clickable ? "underline" : "none";
          p.style.cursor = clickable ? "pointer" : "default";
        } else {
          p.style.backgroundColor = "var(--sl-color-bg)";
          p.style.color = "var(--sl-color-gray-3)";
          p.style.textDecoration = "none";
          p.style.cursor = "default";
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
