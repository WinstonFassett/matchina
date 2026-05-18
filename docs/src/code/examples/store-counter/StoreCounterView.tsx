import { useMachine } from "matchina/react";
import type { CounterStore } from "./store";

export function StoreCounterView({ store }: { store: CounterStore }) {
  const change = useMachine(store);
  const count = change.to;

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="flex flex-col items-center gap-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">count</span>
        <span className="text-6xl font-semibold text-foreground tabular-nums">{count}</span>
      </div>

      <div className="flex gap-2">
        <button onClick={() => store.dispatch("decrement")} className="btn btn-outline">-1</button>
        <button onClick={() => store.dispatch("increment")} className="btn btn-primary">+1</button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => store.dispatch("decrement", 5)} className="btn btn-outline btn-sm">-5</button>
        <button onClick={() => store.dispatch("increment", 5)} className="btn btn-primary btn-sm">+5</button>
      </div>

      <div className="flex gap-2">
        <button onClick={() => store.dispatch("set", 100)} className="btn btn-ghost btn-sm">Set 100</button>
        <button onClick={() => store.dispatch("reset")} className="btn btn-ghost btn-sm">Reset</button>
      </div>
    </div>
  );
}
