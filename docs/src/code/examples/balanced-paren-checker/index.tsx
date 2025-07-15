import {
  createApi,
} from "matchina";
import { useEffect, useMemo, useRef, useState } from "react";
import StateMachineMermaidDiagram from "../../../components/MachineViz";
import { getXStateDefinition } from "../lib/matchina-machine-to-xstate-definition";
import { balancedParenthesesChecker } from "./machine";
import { useMachine } from "@lib/src/integrations/react";

export function BalancedParenthesesDemo() {
  const [input, setInput] = useState("");
  const inputDebounced = useDebounce(input, 100);
  const prevInputDebounced = usePrevious(inputDebounced);
  const [checkerVersion, setCheckerVersion] = useState({});
  const checker = useMemo(() => balancedParenthesesChecker(), [checkerVersion]);
  useMachine(checker.machine);
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
        input.slice(prevInputDebounced ? prevInputDebounced.length : 0),
      );
    } else {
      console.log("restarting checker");
      setCheckerVersion({});
    }
  }, [inputDebounced]);
  const actions = useMemo(
    () => createApi(checker.machine, checker.state.key),
    [checker.state],
  );
  return (
    <div>
      <textarea value={input} onChange={(ev) => setInput(ev.target.value)} />
      <p>Current State: {checker.state.key}</p>
      {checker.text && <pre>Pending validation:{checker.text}</pre>}
      {checker.state.is("Group") && (
        <pre>Expecting {checker.state.data.pair[1]}</pre>
      )}
      <StateMachineMermaidDiagram
        config={getXStateDefinition(checker.machine)}
        stateKey={checker.state.key}
        actions={actions}
      />
    </div>
  );
}

function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

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
