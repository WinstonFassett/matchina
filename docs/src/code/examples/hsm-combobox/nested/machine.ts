import { storeApi as createStoreApi, defineStates, effect, eventApi, matchina, setup } from "matchina";
import { nestedHsmRoot, submachine } from "matchina/hsm";
import { createComboboxStore } from "../store";

export function createComboboxMachine() {
  const store = createComboboxStore();
  const storeApi = createStoreApi(store);

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
      // HSM emits 'child.change' pseudo-event for child state changes
      // Use type assertion since it's a runtime HSM feature not in static types
      (ev.match as any)({
        focus: storeApi.clear,
        blur: storeApi.clear,
        "child.change": (data: [any, string]) => {
          if (data && data.length >= 2) {
            const target = data[0];
            const _eventType = data[1];
            if (target && typeof target.getChange === 'function') {
              const change = target.getChange();
              change.match({
                type: storeApi.setInput,
                select: storeApi.selectHighlighted,
              }, false);
            }
          }
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