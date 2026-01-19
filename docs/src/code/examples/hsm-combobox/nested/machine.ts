import { defineStates, effect, eventApi, matchina, setup } from "matchina";
import { nestedHsmRoot, submachine } from "matchina/hsm";
import { createComboboxStore } from "../store";

export function createComboboxMachine() {
  const store = createComboboxStore()

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
        focus: store.api.clear,
        blur: store.api.clear,    
        "child.change": ({ target, type, ...rest }) => {
          const change = target.getChange();
          change.match({
            type: store.api.setInput,
            select: store.api.selectHighlighted,
          }, false);
        },
      }, false);
    })
  );

  const combobox = Object.assign(hsm, {
    model: store,
    ...store.api,
    ...eventApi(hsm),
    // Add methods that tests expect
    blur: () => hsm.send("blur"),
    selectSuggestion: () => {
      // For nested machine, call store method and trigger child event
      store.api.selectHighlighted();
      const childMachine = hsm.getState().data;
      if (childMachine && typeof childMachine.send === 'function') {
        childMachine.send("select");
      }
    },
    dismiss: () => store.api.clear()
  });

  return combobox;
}

export type NestedComboboxMachine = ReturnType<typeof createComboboxMachine>;