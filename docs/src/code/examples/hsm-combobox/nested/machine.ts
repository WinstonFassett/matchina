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
    // Override setInput to trigger type event for test compatibility
    setInput: (text: string) => {
      // For nested machine, we need to trigger the child type event
      // First update the store directly
      store.api.setInput(text);
      // Then try to trigger the child event if we're in Active state
      if (hsm.getState().is("Active")) {
        const childMachine = hsm.getState().data;
        if (childMachine && typeof childMachine.send === 'function') {
          childMachine.send("type", text);
        }
      }
    },
    // Add type method for compatibility
    type: (text: string) => {
      // For nested machine, we need to trigger the child type event
      if (hsm.getState().is("Active")) {
        const childMachine = hsm.getState().data;
        if (childMachine && typeof childMachine.send === 'function') {
          childMachine.send("type", text);
        }
      }
    },
    // Add aliases for test compatibility
    blur: () => hsm.send("blur"),
    selectSuggestion: () => {
      // For nested machine, directly call the store method and trigger child event
      store.api.selectHighlighted();
      // Also trigger the child select event for state transition
      if (hsm.getState().is("Active")) {
        const childMachine = hsm.getState().data;
        if (childMachine && typeof childMachine.send === 'function') {
          childMachine.send("select");
        }
      }
    },
    dismiss: () => {
      store.api.clear();
      // If we're in Suggesting, transition back to Empty
      if (hsm.getState().is("Active.Suggesting")) {
        const childMachine = hsm.getState().data;
        if (childMachine && typeof childMachine.send === 'function') {
          childMachine.send("select");
        }
      }
    }
  });

  return combobox;
}

export type NestedComboboxMachine = ReturnType<typeof createComboboxMachine>;