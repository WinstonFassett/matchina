import React from "react";
import { defineMachine, createPromiseMachine, withSubscribe } from "../../../src";
import { useMachine } from "../../../src/extras/react";

const delayedAdd = createPromiseMachine(
  (x: number, y: number) =>
    new Promise((resolve) => setTimeout(() => resolve(x + y), 1000)),
);

export function ReactMachineDemo({}) {
  const [state, machine] = useMachine(withSubscribe(delayedAdd))
  return <div className="m-3">
    <div>The state is {state.key}</div>
    {state.match({
      Idle: () => <button onClick={() => machine.send("execute", 1,1)}>Add 1+1</button>,
      Pending: () => <div>Waiting...</div>,
      _: () => <button onClick={machine.reset}>Reset</button>
    })}
    
    <pre>
      {JSON.stringify(state, null, 2)}
    </pre>

  </div>;
}
