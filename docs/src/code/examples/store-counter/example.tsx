import { useMemo } from "react";
import { createCounterStore } from "./store";
import { StoreCounterView } from "./StoreCounterView";

export default function StoreCounterExample() {
  const store = useMemo(() => createCounterStore(), []);

  return (
    <div className="border rounded-lg bg-slate-800 p-4">
      <h3 className="text-center text-lg font-semibold mb-4 text-white">Store Counter</h3>
      <StoreCounterView store={store} />
    </div>
  );
}
