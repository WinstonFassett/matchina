import { useMachine } from "matchina/react";
import { exBtn, exStateDisplay } from "@/lib/example-ui";
import { type CounterMachine } from "./machine";

const { root, label, value } = exStateDisplay({ size: "lg" });

export const CounterView = ({ machine }: { machine: CounterMachine }) => {
  useMachine(machine);
  useMachine(machine.store);

  const count = machine.getCount();
  const isActive = machine.getState().is("Active");

  return (
    <div className="flex flex-col items-center gap-6">
      <div className={root()}>
        <span className={label()}>count</span>
        <span className={value()}>{count}</span>
      </div>

      <div className="flex gap-2">
        <button
          className={exBtn({ variant: "outline", size: "md" })}
          onClick={() => machine.decrement()}
          disabled={!isActive}
        >
          −
        </button>
        <button
          className={exBtn({ variant: "default", size: "md" })}
          onClick={() => machine.increment()}
          disabled={!isActive}
        >
          +
        </button>
      </div>

      <div className="flex gap-2">
        <button
          className={exBtn({ variant: "ghost", size: "sm" })}
          onClick={() => machine.reset()}
          disabled={!isActive}
        >
          Reset
        </button>
        <button
          className={exBtn({ variant: isActive ? "outline" : "default", size: "sm" })}
          onClick={() => isActive ? machine.send("deactivate") : machine.send("activate")}
        >
          {isActive ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
};
