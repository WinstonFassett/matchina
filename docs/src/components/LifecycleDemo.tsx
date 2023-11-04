import React, { useEffect, useState } from "react";
import { createPromiseMachine, withSubscribe, withEvents, onLifecycle } from "../../../src";
import { useMachine } from "../../../src/extras/react";

const slowlyAddTwoNumbers = (
  x: number,
  y: number,
  duration = 1000,
  name = "unnamed",
) => new Promise<number>((resolve) => setTimeout(() => resolve(x + y), duration));

const machine = withEvents(withSubscribe(createPromiseMachine(slowlyAddTwoNumbers)));

export function LifecycleDemo({}) {
  const [state] = useMachine(machine);
  useEffect(() => {
    console.log('add lifecycle')
    // onlifecycle happens too late, not on underlying thing with update
    onLifecycle(machine, {
      Idle: {
        on: {
          execute:{
            after: (event) => {
              console.log('after', event)
              log(`After ${event.type}`)
            },
          },
        },      
      },
      "*": {
        on: {
          "*": {
            after: (event) => {
              console.log('after', event)
              log(`After ${event.type}`)
            },
          }
        }
      }
    })
  }, [])
    
  const [logs, setLogs] = useState<string[]>(['Log:'])
  const log = (msg: string) => setLogs((logs) => [...logs, msg])
  return (
    <div className="not-content">!!!
      <div>
        Action:{" "}
        {machine.getState().match({
          // render based on state
          Idle: () => (
            <span>
              <button onClick={() => machine.send("execute", 1, 1)}>
                Add 1+1
              </button>{" "}
              or{" "}
              <button
                onClick={() =>
                  machine.event.execute(2, 2, 2000, "Test two plus two")
                }
              >
                Add 2+2
              </button>
            </span>
          ),
          Pending: ([x, y, duration, name]) => (
            <span>
              Waiting {duration?.toString() ?? "default=1000"}ms to add {x} +{" "}
              {y}
              {!!name && `(aka ${name})`}
            </span>
          ),
          _: () => (
            <span>
              Done! <button onClick={machine.reset}>Reset</button>
            </span>
          ),
        })}
      </div>
      <div className="flex stretch">
        <pre className="flex-1">
          {JSON.stringify(
            {
              "Current State Key": state.key,
              "Current State Data": state.data,
              "Last Change": machine.getChange(),
            },
            null,
            2,
          )}
        </pre>
        <pre className="flex-1">{logs.join('\n')}</pre>
      </div>
    </div>
  );
}
