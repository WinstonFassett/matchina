import { createMachineContext } from "matchina/react";
import { createComposerMachine } from "./composer.machine";

// Context for the ComposerMachine
export const {
  Context: ComposerContext,
  Provider: ComposerProvider,
  useMachineContext: useComposerContext,
} = createMachineContext(createComposerMachine);
