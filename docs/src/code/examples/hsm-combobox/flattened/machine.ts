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
    effect((ev) => { // Note: ev now has proper typing instead of any
      ev.match({
        select: store.api.selectHighlighted,
        blur: store.api.clear,
        type: (it) => { // this MUST be inferred to be a FUCKING string! or
          // Debug: what does the event object contain?
          console.log('Event structure:', it);
          if (it !== undefined && it !== null) {
            store.api.setInput(it);
          }
        }
      }, false)
    })
  );

  return Object.assign(machine, {
    model: store,
    ...store.api,
    ...eventApi(machine),
    // Add aliases for test compatibility
    blur: () => machine.send("blur"),
    selectSuggestion: () => machine.send("select"),
    dismiss: () => {
      store.api.clear();
      // If we're in Suggesting, transition back to Empty
      if (machine.getState().is("Active.Suggesting")) {
        machine.send("select"); // This transitions to Empty
      }
    }
  });  
}

export type FlatComboboxMachine = ReturnType<typeof createFlatComboboxMachine>;
