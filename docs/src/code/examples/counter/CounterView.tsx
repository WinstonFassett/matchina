import { useMachine } from "matchina/react";
import { type CounterMachine } from "./machine";

export const CounterView = ({ machine }: { machine: CounterMachine }) => {
  useMachine(machine);
  useMachine(machine.store);

  const count = machine.getCount();
  const isActive = machine.getState().is("Active");

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">count</span>
        <span className="text-6xl font-semibold text-foreground tabular-nums">{count}</span>
      </div>

      <div className="flex gap-2">
        <button className="btn btn-outline" onClick={() => machine.decrement()} disabled={!isActive}>−</button>
        <button className="btn btn-primary" onClick={() => machine.increment()} disabled={!isActive}>+</button>
      </div>

      <div className="flex gap-2">
        <button className="btn btn-ghost btn-sm" onClick={() => machine.reset()} disabled={!isActive}>Reset</button>
        <button
          className={`btn btn-sm ${isActive ? "btn-outline" : "btn-primary"}`}
          onClick={() => isActive ? machine.send("deactivate") : machine.send("activate")}
        >
          {isActive ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
};
