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
            
            setTimeout(() => {
              const state = store.getState();
              if (state.suggestions.length > 0) {
                if (currentMachine && typeof currentMachine.send === 'function') {
                  currentMachine.send("toSuggesting");
                }
              } else {
                if (currentMachine && typeof currentMachine.send === 'function') {
                  currentMachine.send("toTextEntry");
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

function createActiveForApp() {
  return matchina(activeStates, {
    Empty: {
      typed: 'Typing',
    },
    Typing: {
      // No transitions - auto-transitions handled by hook
    },
    TextEntry: {
      typed: 'Typing',
      clear: 'Empty',
    },
    Suggesting: {
      typed: 'Typing',
      clear: 'Empty',
      cancel: 'TextEntry',
    },
  }, "Empty");
}

export type ActiveMachine = ReturnType<typeof createActiveForApp>;

const activeMachineFactory = submachine(createActiveForApp, { id: "active" });

export const appStates = defineStates({
  Inactive: undefined,
  Active: activeMachineFactory,
});

export function createComboboxMachine() {
  const store = createComboboxStore();

  const combobox = matchina(appStates, {
    Inactive: {
      focus: "Active"
    },
    Active: {
      // No transitions - store handles all data operations
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
