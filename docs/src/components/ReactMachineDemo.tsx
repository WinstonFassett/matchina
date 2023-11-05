import { createPromiseMachine, withSubscribe, withEvents } from "matchina";
// import { useMachine } from "matchina/extras/react";
import { useMachine } from "matchina/extras/react";

const slowlyAddTwoNumbers = (
  x: number,
  y: number,
  duration = 1000,
  name = "unnamed",
) => new Promise<number>((resolve) => setTimeout(() => resolve(x + y), duration));

const machine = withSubscribe(withEvents(createPromiseMachine(slowlyAddTwoNumbers)));

export function ReactMachineDemo({}) {
  const [state] = useMachine(machine);

  return (
    <div>
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

      <pre>
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
    </div>
  );
}
