import { createHSM } from "matchina/hsm";
import { setup, effect, addEventApi, addStoreApi, eventApi } from "matchina";
import { createComboboxStore } from "./store";

export function createFlatComboboxMachine() {
  const store = addStoreApi(createComboboxStore());

  const machine = createHSM({
    initial: "Inactive",
    states: {
      Inactive: {
        on: {
          focus: "Active",
        },
      },
      // Define the Child Machine
      Active: {
        initial: "Empty",
        states: {
          Empty: {},
          Suggesting: {
            on: {
              select: "Empty",
            },
          },
        },
        // Child machine transitions
        on: {
          type: "Suggesting",
          blur: "^Inactive",
        },
      },
    },
  });

  // Effects coordinate machine transitions with store updates
  setup(machine)(
    effect((ev: any) => {
      if (ev.type === "select") store.api.selectHighlighted();
      if (ev.type === "blur") store.api.clear();
    })
  );

  const machineApi = eventApi(machine);
  // Component-level API - all actions go through machine, effects coordinate
  const combobox = Object.assign(machine, {
    model: store,
    ...store.api,
    ...machineApi,    
    // Store operations that update state and trigger machine events
    // setInput: (input: string) => {
    //   store.api.setInput(input);
    //   machine.send("type");
    // },

    // Convenience methods that combine store + machine
    // selectSuggestion: () => {
    //   store.api.selectHighlighted();
    //   machine.send("select");
    // },
    dismiss: machineApi.dismiss,
  });

  return combobox;
}

export type FlatComboboxMachine = ReturnType<typeof createFlatComboboxMachine>;
