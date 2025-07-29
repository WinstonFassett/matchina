import { createPromiseMachine, withApi, withReset } from "matchina";
import { useMachine } from "matchina/react";

const slowlyAddTwoNumbers = (x: number, y: number, duration = 1000) =>
  new Promise<number>((resolve) => setTimeout(() => resolve(x + y), duration));

const kernel = createPromiseMachine(slowlyAddTwoNumbers);
const machine = withReset(withApi(kernel), kernel.states.Idle());

export function ReactMachineDemo({}) {
  useMachine(machine);
  const change = machine.getChange();
  return (
    <div>
      <div>
        Action:{" "}
        {machine.getState().match({
          // render based on state
          Idle: () => (
            <span>
              <button
                onClick={() =>
                  machine.send("executing", Promise.resolve(0), [1, 1])
                }
              >
                Add 1+1 in 1 sec
              </button>{" "}
              or{" "}
              <button onClick={() => machine.execute(2, 2, 2000)}>
                Add 2+2 in 2 secs
              </button>
            </span>
          ),
          Pending: (args) => {
            if (Array.isArray(args)) {
              const [x, y, duration, name] = args;
              return (
                <span>
                  Waiting {duration?.toString() ?? "default=1000"}ms to add {x}{" "}
                  + {y}
                  {!!name && `(aka ${name})`}
                </span>
              );
            }
            return null;
          },
          _: () => (
            <span>
              Done! <button onClick={() => machine.reset?.()}>Reset</button>
            </span>
          ),
        })}
      </div>

      <pre>
        {JSON.stringify(
          {
            "Current State Key": change.to.key,
            "Current State Data": change.to.data,
            "Last Change": machine.getChange(),
          },
          null,
          2
        )}
      </pre>
    </div>
  );
}
