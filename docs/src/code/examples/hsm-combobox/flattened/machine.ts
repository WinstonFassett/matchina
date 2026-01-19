import { effect, eventApi, guard, setup, storeApi as createStoreApi } from "matchina";
import { createHSM } from "matchina/hsm";
import { createComboboxStore } from "../store";

export function createFlatComboboxMachine() {
  const store = createComboboxStore();
  const storeApi = createStoreApi(store);
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
            data: (text: string) => text,
            on: {
              select: "Empty",
            },
          },
        },
        // Child machine transitions
        on: {
          blur: "^Inactive",
          type: "Suggesting",
        },
      },
    },
  });

  setup(machine)(
    guard((ev) =>
      ev.match({
        type: (it) => it !== undefined && it !== null,
        _: () => true,
      })
    ),
    effect((ev) =>
      ev.match(
        {
          select: storeApi.selectHighlighted,
          blur: storeApi.clear,
          type: storeApi.setInput,
        },
        false
      )
    )
  );

  return Object.assign(machine, {
    model: store,
    ...storeApi,
    ...eventApi(machine)
  });  
}

export type FlatComboboxMachine = ReturnType<typeof createFlatComboboxMachine>;
