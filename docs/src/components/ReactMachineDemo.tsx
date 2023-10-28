import { useMemo } from "react";
import { createPromiseMachine, withSubscribe } from "../../../src";
import { useMachine } from "../../../src/extras/react";

const slowlyAddTwoNumbers = (x: number, y: number) =>
  new Promise((resolve) => setTimeout(() => resolve(x + y), 1000));


export function ReactMachineDemo({}) {

  const machine = useMemo(() => withSubscribe(
    createPromiseMachine(
      slowlyAddTwoNumbers
    )
  ), [])

  const [state] = useMachine(machine)

  return <div>

    <p>
      Action: 

      {state.match({ // render based on state
        Idle: () => <button onClick={() => machine.send("execute", 1,1)}>Add 1+1</button>,
        Pending: () => <span>Waiting 1000ms</span>,
        _: () => <button onClick={machine.reset}>Reset</button>
      })}

    </p>

    <pre>
      {JSON.stringify({
        "Current State Key": state.key,
        "Current State Data": state.data,
        "Last Change": machine.getChange()
      }, null, 2)}
    </pre>

  </div>;
}
