import React, { useEffect, useState } from "react";
import {
  createPromiseMachine,
  withApi,
  onLifecycle,
  setup,
  resolve,
  handle,
  guard,
  extendMethod
} from "matchina";
import { useMachine } from "matchina/integrations/react";

const slowlyAddTwoNumbers = (
  x: number,
  y: number,
  duration = 1000,
  name = "unnamed",
) =>
  new Promise<number>((resolve) => setTimeout(() => resolve(x + y), duration));

const machine = withApi(
  createPromiseMachine(slowlyAddTwoNumbers)
);
type X = typeof machine.resolve
type Y = typeof resolve

const reset = () => {
  console.log('RESET!')
  machine.send('reset' as any)
}

setup(machine)(
  resolve(ev => 
    ev.type as any === 'reset' ? {...ev, to: machine.states.Idle()} : undefined
  ),
  machine => {
    const store = machine as any
    if (store.reset) return () => {};
    store.reset = reset
    return () => {
      delete store.reset      
    }
  }
)
console.log('machine', machine)
export function LifecycleDemo({}) {
  const [change] = useMachine(machine);
  const [logs, setLogs] = useState<string[]>(["Log:"]);
  const log = (msg: string) => setLogs((logs) => [...logs, msg]);
  useEffect(() => {
    const origConsole = console;
    const dualConsole = {
      ...console,
      log: (...args: any[]) => {
        origConsole.log(...args);
        log(args.join(" "));
      },
    };
    console = dualConsole;
    onLifecycle(machine, {
      Idle: {
        on: {
          execute: {
            after: ({ type, from, to }) => {
              console.log(
                "Specific state and event:\n",
                type, // MUST equal and autocomplete to 'execute'
                "from", from.key, // MUST equal and autocomplete to 'Idle'
                "to", to.key, // MUST equal and autocomplete to 'Pending'
              )
            },
          },
        },
      },
      "*": {
        on: {
          "*": {
            after: ({ type, from, to }) => {
              console.log(
                "any state with any event:\n",
                type, // any valid event b/c wildcard event
                "from", from.key, // any valid state b/c wildcard state
                "to", to.key, // any valid exit state (which excludes Idle)
                "with data", to.data, // any valid state data b/c wildcard state
              )
            },
          },
          reject: {
            after: ({ type, from, to }) => {
              const { name, stack, message } = to.data // can only be Error type
              console.log(        
                "Any reject event:\n",    
                type, // MUST be 'reject'
                "from", from.key, // any valid state b/c wildcard state
                "with data", from.data, // any valid state data b/c wildcard state
                "to", to.key, // MUST equal and autocomplete to 'Rejected'            
                "Error", name, message, stack, // Error properties
              )
            },
          },
        },
      },
    })
  }, []);

  return (
    <div className="not-content">
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
                  machine.api.execute(2, 2, 2000, "Test two plus two")
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
              <button
                onClick={() =>
                  machine.api.reject(new Error("User rejected!"))
                }
              >
                REJECT!
              </button>
            </span>
          ),
          _: () => (
            <span>
              Done! <button onClick={() => reset()}>Reset</button>
            </span>
          ),
        })}
      </div>
      <div className="flex stretch">
        <pre className="flex-1">
          {JSON.stringify(
            {
              "Current State Key": change.to.key,
              "Current State Data": change.from?.data,
              "Last Change": change,
            },
            null,
            2,
          )}
        </pre>
        <pre className="flex-1">{logs.join("\n")}</pre>
      </div>
    </div>
  );
}
