import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { eventApi } from "matchina";
import { useEffect, useMemo, useRef, useState } from "react";
import MermaidInspector from "../../../components/inspectors/MermaidInspector";
import { getXStateDefinition } from "../lib/matchina-machine-to-xstate-definition";
import { balancedParenthesesChecker } from "./machine";

export function BalancedParenthesesDemo() {
  const checker = useMemo(() => balancedParenthesesChecker(), []);
  return (
    <div>
      <MachineExampleWithChart
        machine={checker}
        showRawState={true}
        inspectorType="force-graph"
        AppView={BalancedParentheses}
      />
    </div>
  );
}

export function BalancedParentheses() {
  const [input, setInput] = useState("");
  const inputDebounced = useDebounce(input, 100);
  const prevInputDebounced = usePrevious(inputDebounced);
  const [checkerVersion, setCheckerVersion] = useState({});
  const checker = useMemo(() => balancedParenthesesChecker(), [checkerVersion]);
  useEffect(() => {
    checker.append(input);
    return () => {
      checker.controller.abort();
    };
  }, [checker]);
  useEffect(() => {
    const isAppend =
      !prevInputDebounced || input.startsWith(prevInputDebounced);
    if (isAppend) {
      console.log("isAppend", prevInputDebounced, input);
      checker.append(
        input.slice(prevInputDebounced ? prevInputDebounced.length : 0)
      );
    } else {
      console.log("restarting checker");
      setCheckerVersion({});
    }
  }, [inputDebounced]);

  // With assignEventApi, the machine methods are directly on the object
  const state = checker.getState();
  const actions = useMemo(() => eventApi(checker, state.key), [checker, state]);
  return (
    <div>
      <textarea value={input} onChange={(ev) => setInput(ev.target.value)} />
      <p>Current State: {state.key}</p>
      {checker.text && <pre>Pending validation:{checker.text}</pre>}
      {state.is("Open") && <pre>Expecting {state.data.pair[1]}</pre>}
      <MermaidInspector
        config={getXStateDefinition(checker)}
        stateKey={state.key}
        actions={actions}
      />
    </div>
  );
}

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>(undefined);

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

export function useDebounce<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
