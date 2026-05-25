import { MachineVisualizer } from "@components/MachineVisualizer";
import { useEffect, useMemo, useRef, useState } from "react";
import { balancedParenthesesChecker } from "./machine";

export function BalancedParenthesesDemo() {
  const checker = useMemo(() => balancedParenthesesChecker(), []);
  return (
    <div>
      <MachineVisualizer
        machine={checker}
        showRawState={true}
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

  const state = checker.getState();
  return (
    <div>
      <textarea value={input} onChange={(ev) => setInput(ev.target.value)} />
      <p>Current State: {state.key}</p>
      {checker.text && <pre>Pending validation:{checker.text}</pre>}
      {state.is("Open") && <pre>Expecting {state.data.pair[1]}</pre>}
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
