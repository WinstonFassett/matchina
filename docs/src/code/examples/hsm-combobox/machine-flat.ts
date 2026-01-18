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
  console.log({ machineApi })
  // Component-level API - all actions go through machine, effects coordinate
  const combobox = Object.assign(machine, {
    model: store,
    ...store.api,
    ...machineApi,    
    blur: () => {
      console.log("blur");
      machine.send("blur");
    },
    type: (input: string) => {
      console.log("type", input);
      // machineApi.type(input);
      machine.model.api.setInput(input);
      machine.send("type", input);
    },
    select: (index: number) => {
      console.log("select", index);
      machine.send("select", index);
    },
  });
  return combobox;
}

export type FlatComboboxMachine = ReturnType<typeof createFlatComboboxMachine>;
