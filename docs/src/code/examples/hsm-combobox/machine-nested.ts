import { addEventApi, defineStates, effect, matchina, setup } from "matchina";
import { nestedHsmRoot, submachine } from "matchina/hsm";
import { createComboboxStore } from "./store";


// 3. Create the Nested HSM Machine
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
        type: "Active",
        select: "Active",
      },
    },
    "Inactive"
  );  

  const hsm = nestedHsmRoot(rootMachine);

  // Get input mode machine from state to wire up effects
  const getInputMode = () => {
    const state = hsm.getState();
    return state.is("Active") ? state.data.machine : null;
  };

  // Effects coordinate machine transitions with store updates
  setup(hsm)(
    effect((ev) => {
      const inputMode = getInputMode();
      
      ev.match({
        focus: store.api.clear,
        blur: store.api.clear,
        select: store.api.selectHighlighted,
        type: () => {
          // TODO: Handle child machine transition without send()
        },
      });
    })
  );

  // Add event API to nested machine
  addEventApi(hsm);

  // Clean API composition - Object.assign to preserve shape data
  const combobox = Object.assign(hsm, {
    // Expose model
    model: store,
    // Mix in entire store API
    ...store.api,
  });

  return combobox;
}

export type NestedComboboxMachine = ReturnType<typeof createComboboxMachine>;