import { useMemo } from "react";
import { createCounterStore } from "./store";
import { StoreCounterView } from "./StoreCounterView";

export default function StoreCounter() {
  const store = useMemo(() => createCounterStore(), []);
  return <StoreCounterView store={store} />;
}
