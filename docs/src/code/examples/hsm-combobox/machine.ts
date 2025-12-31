import { defineStates, matchina, setup, effect } from "matchina";
import { submachine, makeHierarchical } from "matchina/hsm";
import { createComboboxStore } from "./store";

const AVAILABLE_TAGS = [
  "typescript", "javascript", "react", "vue", "angular",
  "node", "deno", "bun", "python", "rust",
];

// Active child states for the tag editor
export const activeStates = defineStates({
  Empty: undefined,
  Typing: undefined,
  TextEntry: undefined,
  Suggesting: undefined,
});

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
  return matchina(activeStates, {
    Empty: {
      typed: 'Typing',
      deactivate: () => (ev) => ev.from, // Go to parent Inactive
    },
    Typing: {
      toEmpty: 'Empty',
      toSuggesting: 'Suggesting',
      toTextEntry: 'TextEntry',
      deactivate: () => (ev) => ev.from, // Go to parent Inactive
    },
    TextEntry: {
      typed: 'Typing',
      clear: 'Empty',
      deactivate: () => (ev) => ev.from, // Go to parent Inactive
    },
    Suggesting: {
      typed: 'Typing',
      clear: 'Empty',
      highlightNext: 'Suggesting',
      highlightPrev: 'Suggesting',
      selectHighlighted: 'Empty',
      cancel: 'TextEntry',
      deactivate: () => (ev) => ev.from, // Go to parent Inactive
    },
  }, "Empty");
}

export type ActiveMachine = ReturnType<typeof createActiveForApp>;

const activeMachineFactory = submachine(createActiveForApp, { id: "active" });

export const appStates = defineStates({
  Inactive: undefined,
  Active: activeMachineFactory,
});

// Hook specific to hierarchical machine structure
function createHierarchicalComboboxHook(store: any) {
  let currentMachine: any = null;
  
  return effect((ev: any) => {
    if (ev && ev.machine) {
      currentMachine = ev.machine;
    }
    
    if (ev && ev.type) {
      switch (ev.type) {
        case 'typed':
          if (ev.params && ev.params[0] !== undefined) {
            store.dispatch('typed', ev.params[0]);
            
            // Auto-transition to correct state based on suggestions
            setTimeout(() => {
              const state = store.getState();
              const currentState = currentMachine?.getState();
              
              if (currentState?.is("Active") && currentState.data?.machine) {
                const activeMachine = currentState.data.machine;
                const activeState = activeMachine.getState();
                
                if (state.suggestions.length > 0 && activeState?.is("Typing")) {
                  // Transition to Suggesting
                  activeMachine.send("toSuggesting");
                } else if (state.input.trim() && activeState?.is("Typing")) {
                  // Transition to TextEntry
                  activeMachine.send("toTextEntry");
                } else if (!state.input.trim() && activeState?.is("Typing")) {
                  // Transition to Empty
                  activeMachine.send("toEmpty");
                }
              }
            }, 0);
          }
          break;
        case 'highlight':
          if (ev.params && ev.params[0] !== undefined) {
            const direction = ev.params[0];
            if (direction === 'next') {
              store.dispatch('highlightNext');
            } else if (direction === 'prev') {
              store.dispatch('highlightPrev');
            }
          }
          break;
        case 'selectHighlighted':
          const currentState = store.getState();
          const tag = currentState.suggestions[currentState.highlightedIndex];
          if (tag) {
            store.dispatch('addTag', tag);
          }
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
      typed: (value: string) => (ev: any) => {
        // Delegate to submachine
        const activeMachine = ev.from.data.machine;
        if (activeMachine && activeMachine.send) {
          activeMachine.send("typed", value);
        }
        return ev.from; // Stay in Active state
      },
      clear: () => (ev: any) => {
        // Delegate to submachine
        const activeMachine = ev.from.data.machine;
        if (activeMachine && activeMachine.send) {
          activeMachine.send("clear");
        }
        return ev.from; // Stay in Active state
      },
      cancel: () => (ev: any) => {
        // Delegate to submachine
        const activeMachine = ev.from.data.machine;
        if (activeMachine && activeMachine.send) {
          activeMachine.send("cancel");
        }
        return ev.from; // Stay in Active state
      },
      highlightNext: () => (ev: any) => {
        // Delegate to submachine
        const activeMachine = ev.from.data.machine;
        if (activeMachine && activeMachine.send) {
          activeMachine.send("highlightNext");
        }
        return ev.from; // Stay in Active state
      },
      highlightPrev: () => (ev: any) => {
        // Delegate to submachine
        const activeMachine = ev.from.data.machine;
        if (activeMachine && activeMachine.send) {
          activeMachine.send("highlightPrev");
        }
        return ev.from; // Stay in Active state
      },
      selectHighlighted: () => (ev: any) => {
        // Delegate to submachine
        const activeMachine = ev.from.data.machine;
        if (activeMachine && activeMachine.send) {
          activeMachine.send("selectHighlighted");
        }
        return ev.from; // Stay in Active state
      },
      deactivate: () => (ev) => {
        return appStates.Inactive();
      },
    },
  }, appStates.Inactive());

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
