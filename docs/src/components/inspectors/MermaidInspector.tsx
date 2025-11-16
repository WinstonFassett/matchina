import mermaid from "mermaid";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Mermaid from "../Mermaid";
import mermaidInspectorCss from "./MermaidInspector.css?raw";

mermaid.initialize({
  themeVariables: {},
  themeCSS: mermaidInspectorCss,
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
      }
      if (!renderedState) {
      }
      
    });
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

      if (currentDiagramType === 'statechart') {
        const activeSel = `[id*="state-${currentKey}-"]`;
        const activeEl = root.querySelector(activeSel) as Element | null;
        if (activeEl) activeEl.classList.add('state-highlight');

        if (currentKey.includes('_')) {
          const parentKey = currentKey.split('_')[0];
          const parentSel = `[id*="state-${parentKey}-"]`;
          const parentEl = root.querySelector(parentSel) as Element | null;
          if (parentEl && parentEl !== activeEl) parentEl.classList.add('state-container-highlight');
        }
      } else {
        let activated = false;
        try {
          const byId = root.querySelector(`g#${CSS.escape(currentKey)}`) as SVGGElement | null;
          if (byId) {
            byId.classList.add("active");
            activated = true;
          }
        } catch {}
        if (!activated) {
          const candidate = Array.from(root.querySelectorAll<SVGGElement>("g.node"))
            .find((g) => g.textContent?.trim() === currentKey);
          if (candidate) candidate.classList.add("active");
        }
        if (currentKey.includes('_')) {
          const parentKey = currentKey.split('_')[0];
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
        const action = type ? currentActions?.[type] : undefined;
        const clickable = !!action && currentInteractive && from === currentKey;

        p.classList.remove('edge-active', 'edge-inactive', 'edge-interactive');
        if (from === currentKey && action) {
          p.classList.add('edge-active');
          if (clickable) p.classList.add('edge-interactive');
        } else {
          p.classList.add('edge-inactive');
        }
        p.onclick = clickable ? () => action?.() : null;
      });
    }

    useEffect(() => {
      // Re-apply highlights on updates (state changes, actions, etc.)
      applyHighlights();
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
