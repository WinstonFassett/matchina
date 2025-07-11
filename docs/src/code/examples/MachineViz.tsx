import mermaid from "mermaid";
import { memo, useCallback, useEffect, useMemo, useState } from "react";
import Mermaid from "./Mermaid";

mermaid.initialize({
  // startOnLoad: true
  themeVariables: {},
  themeCSS: `
    .label text, span, p {
      color: var(--sl-color-text);
     }; 
    .node rect {
      fill: var(--sl-color-bg);
      stroke: var(--sl-color-text);
      rx: 10; ry: 10;
      
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
    .active span {
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

interface State {
  key: string;
}

function toStateDiagram(config: any, callbackName: string) {
  const currentStateKey = config.initial;
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
    const compositeStates: State[] = [];

    // determine if transition is local
    // handle non-local transitions
    // add end-thingy, then named transition from main state to container with new state, etc
    const { states } = config;
    const stateKeys = Object.keys(states);

    stateKeys.forEach((stateKey, index) => {
      allStates.add(stateKey);
      // rows.push(["    ", key, ifactive].join(""));
      let renderedState = false;
      const stateTransitions = states[stateKey]?.on;
      if (stateTransitions) {
        Object.keys(stateTransitions).forEach((eventType) => {
          const targetStateEntry = stateTransitions[eventType];
          if (targetStateEntry) {
            const targetStateKey = targetStateEntry;
            rows.push(
              `    ${stateKey}-->|${eventType ? `${stateKey}<br>${eventType}` : `${stateKey}<br>AUTO`}|${targetStateKey}[${targetStateKey}]`,
            );
            // rows.push(`${indent()}${stateKey} --> ${state.key}: ${eventType}`);
            renderedStates.add(stateKey);
            renderedStates.add(targetStateKey);
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
    const unrenderedStates = Object.keys(config).filter(
      (state) => !renderedStates.has(state),
    );
    unrenderedStates.forEach((state) => {
      // rows.push(`${indent()}[*] --> ${state.name}`)
    });
    // const state = definition.states[key];
    // console.log("state", key, state);
    // const ifactive = isActive ? ":::active" : "";
  }
}

let lastId = 0;

export const StateMachineMermaidDiagram = memo(
  ({
    config,
    stateKey,
    actions,
  }: {
    config: any;
    stateKey: string;
    actions?: Record<string, () => void>;
  }) => {
    const [id] = useState((lastId++).toString());
    const { states } = config;
    const chart = useMemo(() => toStateDiagram(config, id), [states]);
    const debouncedStateKey = useDebouncedValue(stateKey, 60);
    const onRender = useCallback(
      (el: HTMLElement) => {
        el.querySelectorAll("span.edgeLabel").forEach((el) => {
          const fqn = el.innerHTML;
          const parts = fqn.split("<br>");
          const type = parts[1];
          const state = parts[0];
          const action = actions?.[type];
          el.innerHTML = type;
          el.addEventListener("click", () => {
            action?.();
          });
          if (action && state === debouncedStateKey) {
            (el as HTMLElement).style.cssText = `background-color: var(--sl-color-gray-5); color: var(--sl-color-accent-high); cursor: pointer; text-decoration: underline;`;
          } else {
            (el as HTMLElement).style.cssText = `background-color: transparent;  color: var(--sl-color-gray-3)`;
          }
        });
      },
      [actions, debouncedStateKey],
    );

    if (!chart) return <div>NO CHART!!!</div>;

    return (
      <div className="container">
        <Mermaid
          content={`${chart}
    ${debouncedStateKey}:::active
`}
          onRender={onRender}
        />
        {/* <pre>{chart}</pre> */}
        {/* <pre>{JSON.stringify(machine, null, 2)}</pre> */}
        {/*<pre>{JSON.stringify(definition, null, 2)}</pre>*/}
      </div>
    );
  },
);

export default StateMachineMermaidDiagram;

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
