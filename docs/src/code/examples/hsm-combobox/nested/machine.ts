import { defineStates, effect, matchina, setup, addStoreApi } from "matchina";
import { eventApi } from "matchina";
import { nestedHsmRoot, submachine, hsmEventApi } from "matchina/hsm";
import { createComboboxStore } from "../store";

export function createComboboxMachine() {
  const store = addStoreApi(createComboboxStore());
  const storeApi = store.api; // Explicitly extract api for better typing

  const rootMachine = matchina(
    defineStates({
      Inactive: undefined,
      // Define the Child Machine
      Active: submachine(
        () =>
          matchina(
            defineStates({
              Empty: undefined,
              Suggesting: undefined,
            }),
            // Child machine transitions
            {
              Empty: {
                type: "Suggesting",
              },
              Suggesting: {
                select: "Empty",
                type: "Suggesting",
              },
            },
            "Empty"
          )    
      ),
    }),
    // Parent machine transitions
    {
      Inactive: { focus: "Active" },
      Active: { 
        blur: "Inactive",
      },
    },
    "Inactive"
  );  

  const hsm = nestedHsmRoot(rootMachine);

  // Effects coordinate machine transitions with store updates
  setup(hsm)(
    effect((ev) => {
      ev.match({
        focus: storeApi.clear,
        blur: storeApi.clear,    
        "child.change": ({ target, eventType, ...rest }) => {
          const change = target.getChange();
          change.match({
            type: storeApi.setInput,
            select: storeApi.selectHighlighted,
          }, false);
        },
      }, false);
    })
  );

  const combobox = Object.assign(hsm, {
    model: store,
    ...storeApi,
    ...eventApi(hsm),
  });

  return combobox;
}

export type NestedComboboxMachine = ReturnType<typeof createComboboxMachine>;