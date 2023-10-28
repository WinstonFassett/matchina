import React from "react";
import { defineMachine, createPromiseMachine, withSubscribe } from "../../../src";
import { useMachine } from "../../../src/extras/react";

const delayedAdd = createPromiseMachine(
  (x: number, y: number) =>
    new Promise((resolve) => setTimeout(() => resolve(x + y), 1000)),
);

export function ReactMachineDemo({}) {
  const [state, machine] = useMachine(withSubscribe(delayedAdd))
  return <div className="">
    <p>The state key is <strong>{state.key}</strong></p>
    <p>The state data is <code>{JSON.stringify(machine.getChange().to.data)}</code></p>
    {state.match({
      Idle: () => <button onClick={() => machine.send("execute", 1,1)}>Add 1+1</button>,
      Pending: () => <div>Waiting...</div>,
      _: () => <button onClick={machine.reset}>Reset</button>
    })}

    <p>State:</p>
    <pre>
      {JSON.stringify(state, null, 2)}
    </pre>

    <p>Last change:</p>
    <pre>
      {JSON.stringify(machine.getChange(), null, 2)}
    </pre>

  </div>;
}
