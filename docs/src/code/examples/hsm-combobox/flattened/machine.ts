import { addStoreApi, effect, eventApi, setup } from "matchina";
import { createHSM } from "matchina/hsm";
import { createComboboxStore } from "../store";

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
          Empty: {
            on: {
              type: "Suggesting",
            }
          },
          Suggesting: {
            on: {
              select: "Empty",
            },
          },
        },
        // Child machine transitions
        on: {
          
          blur: "^Inactive",
        },
      },
    },
  });

  // Effects coordinate machine transitions with store updates
  setup(machine)(
    effect((ev: any) => {
      ev.match({
        select: () => store.api.selectHighlighted(),
        blur: store.api.clear
      }, false)
    })
  );

  const machineApi = eventApi(machine);

  // Component-level API - all actions go through machine, effects coordinate
  const combobox = Object.assign(machine, {
    model: store,
    ...store.api,
    ...machineApi,    
    blur: () => {
      machine.send("blur");
    },
    type: (input: string) => {
      machine.model.api.setInput(input);
      machine.send("type", input);
    },
    select: (index: number) => {
      machine.send("select", index);
    },
  });
  return combobox;
}

export type FlatComboboxMachine = ReturnType<typeof createFlatComboboxMachine>;
