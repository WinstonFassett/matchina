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
        type: "Active",
        select: "Active",
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
        "child.change": ({ target }) => {
          target.getChange().match({
            select: store.api.selectHighlighted,
            type: (input: any) => {
              console.log('typed', input)
              combobox.model.api.setInput(input);
            },            
          }, false)
        }
      }, false);
    })
  );

  // Add event API to nested machine
  const api = eventApi(hsm);

  // Clean API composition - Object.assign to preserve shape data
  const combobox = Object.assign(hsm, {
    model: store,
    ...store.api,
    ...api,
    type: (input: string) => {
      combobox.send("type", input);
    },    
  });

  return combobox;
}

export type NestedComboboxMachine = ReturnType<typeof createComboboxMachine>;