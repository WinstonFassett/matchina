import { createPromiseMachine, createReset, onLifecycle, zen } from "matchina";
import { useMachine } from "matchina/react";
import { useEffect, useMemo, useState } from "react";

const slowlyAddTwoNumbers = (x: number, y: number, duration = 1000) =>
  new Promise<number>((resolve) => setTimeout(() => resolve(x + y), duration));

function useAdder() {
  const machine = useMemo(() => createPromiseMachine(slowlyAddTwoNumbers), []);
  const wrapper = useMemo(
    () =>
      Object.assign(zen(machine), {
        reset: createReset(machine, machine.states.Idle()),
      }),
    [machine],
  );
  useMachine(wrapper);
  return wrapper;
}

export function LifecycleDemo({}) {
  const machine = useAdder();
  const change = machine.getChange();
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

    return onLifecycle(machine, {
      Idle: {
        on: {
          executing: {
            after: ({ type, from, to, params }) => {
              console.log(
                "after Idle.executing:",
                type,
                from.key,
                to.key,
                Object.keys(params),
              );
            },
          },
        },
      },
      "*": {
        on: {
          "*": {
            after: (ev) => {
              console.log(`[${ev.type}]:`, ev.to.key, ev.to.data);
            },
          },
          reject: {
            after: ({ type, from, to }) => {
              const { name, stack, message } = to.data; // can only be Error type
              console.log(
                "after",
                type, // MUST be 'reject'
                "from",
                from.key, // previous state key
                name,
                message, // Error properties,
                stack, // Error stack trace
              );
            },
          },
          resolve: {
            before: ({ type, from: _from, to: { data } }) => {
              console.log(
                "before",
                type, // MUST be 'resolve'
                data, // resolved value
              );
            },
          },
        },
      },
    });
  }, []);

  return (
    <div className="not-content">
      <div>
        Action:{" "}
        {machine.getState().match({
          // render based on state
          Idle: () => (
            <span>
              <button onClick={() => machine.execute(1, 1)}>Add 1+1</button> or{" "}
              <button onClick={() => machine.execute(2, 2, 2000)}>
                Add 2+2
              </button>
            </span>
          ),
          Pending: ({ params: [x, y, duration] }) => (
            <span>
              Waiting {duration?.toString() ?? "default=1000"}ms to add {x} +{" "}
              {y}
              <button
                onClick={() => machine.reject(new Error("User rejected!"))}
              >
                REJECT!
              </button>
            </span>
          ),
          _: () => (
            <span>
              Done! <button onClick={() => machine.reset()}>Reset</button>
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
