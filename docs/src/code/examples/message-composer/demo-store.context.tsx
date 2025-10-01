import { createMachineContext } from "matchina/react";
import { globalStore } from "./demo-store.machine";

// Context for the GlobalStore (now a proper machine)
export const {
  Context: GlobalStoreContext,
  Provider: GlobalStoreProvider,
  useMachineContext: useGlobalStoreContext,
} = createMachineContext(() => globalStore);
