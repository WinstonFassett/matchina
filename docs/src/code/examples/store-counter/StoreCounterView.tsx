import { useSyncExternalStore } from "react";
import type { CounterStore } from "./store";

export function StoreCounterView({ store }: { store: CounterStore }) {
  const count = useSyncExternalStore(
    (callback) => {
      const orig = store.notify;
      store.notify = (ev) => {
        orig.call(store, ev);
        callback();
      };
      return () => {
        store.notify = orig;
      };
    },
    () => store.getState()
  );

  return (
    <div className="flex flex-col items-center gap-4 p-6">
      <div className="text-6xl font-bold tabular-nums">{count}</div>
      
      <div className="flex gap-2">
        <button
          onClick={() => store.dispatch("decrement")}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          -1
        </button>
        <button
          onClick={() => store.dispatch("increment")}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        >
          +1
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => store.dispatch("decrement", 5)}
          className="px-3 py-1 bg-red-400 text-white rounded text-sm hover:bg-red-500 transition-colors"
        >
          -5
        </button>
        <button
          onClick={() => store.dispatch("increment", 5)}
          className="px-3 py-1 bg-green-400 text-white rounded text-sm hover:bg-green-500 transition-colors"
        >
          +5
        </button>
      </div>

      <div className="flex gap-2 mt-2">
        <button
          onClick={() => store.dispatch("set", 100)}
          className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors"
        >
          Set 100
        </button>
        <button
          onClick={() => store.dispatch("reset")}
          className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
