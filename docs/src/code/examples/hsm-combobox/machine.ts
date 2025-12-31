import { defineStates, matchina, setup, effect } from "matchina";
import { submachine, makeHierarchical } from "matchina/hsm";
import { createComboboxStoreHook } from "./hooks";
import { createComboboxStore } from "./store";

const AVAILABLE_TAGS = [
  "typescript", "javascript", "react", "vue", "angular",
  "node", "deno", "bun", "python", "rust",
];

function getSuggestions(input: string, selectedTags: string[]): string[] {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return [];

  return AVAILABLE_TAGS
    .filter(tag =>
      tag.toLowerCase().includes(trimmed) &&
      !selectedTags.includes(tag)
    )
    .slice(0, 5);
}

function createActiveForApp() {
  return matchina(
    defineStates({
      Empty: undefined,
      Typing: undefined,
      TextEntry: undefined,
      Suggesting: undefined,
    }),
    {
      Empty: {
        typed: "Typing",
      },
      Typing: {
        toEmpty: "Empty",
        toSuggesting: "Suggesting",
        toTextEntry: "TextEntry",
      },
      TextEntry: {
        typed: "Typing",
        clear: "Empty",
      },
      Suggesting: {
        typed: "Typing",
        clear: "Empty",
        highlightNext: "Suggesting",
        highlightPrev: "Suggesting",
        selectHighlighted: "Empty",
        cancel: "TextEntry",
      },
    },
    "Empty"
  );
}

export type ActiveMachine = ReturnType<typeof createActiveForApp>;

const activeMachineFactory = submachine(createActiveForApp, { id: "active" });

export const appStates = defineStates({
  Inactive: undefined,
  Active: activeMachineFactory,
});

// Hook specific to hierarchical machine structure
function createHierarchicalComboboxHook(store: any) {
  console.log('Nested machine hook created!');
  let currentMachine: any = null;
  
  return effect((ev: any) => {
    if (ev && ev.machine) {
      currentMachine = ev.machine;
    }
    
    console.log('Nested machine hook received event:', ev.type, ev.params);
    if (ev && ev.type) {
      switch (ev.type) {
        case 'typed':
          if (ev.params && ev.params[0] !== undefined) {
            store.dispatch('typed', ev.params[0]);
            
            // Auto-transition to correct state based on suggestions
            setTimeout(() => {
              const state = store.getState();
              console.log('Auto-transition check - suggestions:', state.suggestions.length, 'input:', state.input.trim());
              
              if (state.suggestions.length > 0) {
                if (currentMachine && typeof currentMachine.send === 'function') {
                  console.log('Sending toSuggesting to main machine');
                  currentMachine.send("toSuggesting");
                }
              } else if (state.input.trim()) {
                if (currentMachine && typeof currentMachine.send === 'function') {
                  console.log('Sending toTextEntry to main machine');
                  currentMachine.send("toTextEntry");
                }
              } else {
                if (currentMachine && typeof currentMachine.send === 'function') {
                  console.log('Sending toEmpty to main machine');
                  currentMachine.send("toEmpty");
                }
              }
            }, 0);
          }
          break;
        case 'child.change':
          // Handle submachine state changes - trigger auto-transitions
          setTimeout(() => {
            const state = store.getState();
            console.log('Child change - suggestions:', state.suggestions.length, 'input:', state.input.trim());
            
            if (state.suggestions.length > 0) {
              if (currentMachine && typeof currentMachine.send === 'function') {
                console.log('Sending toSuggesting due to suggestions');
                currentMachine.send("toSuggesting");
              }
            } else if (state.input.trim()) {
              if (currentMachine && typeof currentMachine.send === 'function') {
                console.log('Sending toTextEntry due to input');
                currentMachine.send("toTextEntry");
              }
            } else {
              if (currentMachine && typeof currentMachine.send === 'function') {
                console.log('Sending toEmpty due to empty input');
                currentMachine.send("toEmpty");
              }
            }
          }, 0);
          break;
        case 'clear':
          store.dispatch('clear');
          break;
        case 'cancel':
          // Send cancel to main machine
          if (currentMachine && typeof currentMachine.send === 'function') {
            currentMachine.send("cancel");
          }
          break;
        case 'highlight':
          if (ev.params && ev.params[0] !== undefined) {
            const direction = ev.params[0];
            if (direction === 'next') {
              store.dispatch('highlightNext');
              if (currentMachine && typeof currentMachine.send === 'function') {
                currentMachine.send("highlightNext");
              }
            } else if (direction === 'prev') {
              store.dispatch('highlightPrev');
              if (currentMachine && typeof currentMachine.send === 'function') {
                currentMachine.send("highlightPrev");
              }
            }
          }
          break;
        case 'selectHighlighted':
          store.dispatch('selectHighlighted');
          if (currentMachine && typeof currentMachine.send === 'function') {
            currentMachine.send("selectHighlighted");
          }
          break;
        case 'deactivate':
          // Clear input and reset when deactivating
          store.dispatch('clear');
          break;
      }
    }
  });
}

export function createComboboxMachine() {
  const store = createComboboxStore();

  const combobox = matchina(appStates, {
    Inactive: {
      focus: "Active"
    },
    Active: {
      deactivate: "Inactive",
    },
  }, "Inactive");

  // Use makeHierarchical for true nested machines with propagation
  const hierarchical = makeHierarchical(combobox);

  setup(hierarchical)(
    createHierarchicalComboboxHook(store)
  );

  // Expose store APIs on machine for direct access
  const machineWithStore = Object.assign(hierarchical, { 
    store,
    // Store APIs
    addTag: store.dispatch.bind(null, 'addTag'),
    removeTag: store.dispatch.bind(null, 'removeTag'),
    highlight: (direction: 'next' | 'prev') => store.dispatch('highlight', direction),
    selectHighlighted: () => store.dispatch('selectHighlighted'),
    clear: () => store.dispatch('clear'),
    deactivate: () => store.dispatch('deactivate')
  });

  return machineWithStore;
}
