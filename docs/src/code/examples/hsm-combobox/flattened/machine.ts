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

  return Object.assign(machine, {
    model: store,
    ...store.api,
    ...eventApi(machine)
  });  
}

export type FlatComboboxMachine = ReturnType<typeof createFlatComboboxMachine>;
