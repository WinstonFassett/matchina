import { createMachineContext } from "matchina/react";
import { globalStore } from "../machines/global-store";

// Context for the GlobalStore (mock synced state)
export const {
  Context: GlobalStoreContext,
  Provider: GlobalStoreProvider,
  useMachineContext: useGlobalStoreContext,
} = createMachineContext(() => globalStore);
