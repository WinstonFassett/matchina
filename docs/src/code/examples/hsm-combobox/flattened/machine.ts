import { effect, eventApi, guard, setup } from "matchina";
import { createHSM } from "matchina/hsm";
import { createComboboxStore } from "../store";

export function createFlatComboboxMachine() {
  const store = createComboboxStore();

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
            data: (text: string) => text, // Typed state data
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
  } as const);

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
          select: store.api.selectHighlighted,
          blur: store.api.clear,
          type: store.api.setInput,
        },
        false
      )
    )
  );

  return Object.assign(machine, {
    model: store,
    ...store.api,
    ...eventApi(machine)
  });  
}

export type FlatComboboxMachine = ReturnType<typeof createFlatComboboxMachine>;
