import { defineStates, matchina, setup, effect } from "matchina";
import { createComboboxStore } from "./store";

const AVAILABLE_TAGS = [
  "typescript", "javascript", "react", "vue", "angular",
  "node", "deno", "bun", "python", "rust",
];

// Simple flat states for hierarchical example
export const appStates = defineStates({
  Inactive: undefined,
  Active_Empty: undefined,
  Active_Typing: undefined,
  Active_TextEntry: undefined,
  Active_Suggesting: undefined,
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
  return effect((ev: any) => {
    if (ev && ev.type) {
      switch (ev.type) {
        case 'typed':
          if (ev.params && ev.params[0] !== undefined) {
            store.dispatch('typed', ev.params[0]);
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
      focus: "Active_Empty"
    },
    Active_Empty: {
      typed: "Active_Typing",
    },
    Active_Typing: {
      // No transitions - handled by UI
    },
    Active_TextEntry: {
      typed: "Active_Typing",
      clear: "Active_Empty",
    },
    Active_Suggesting: {
      typed: "Active_Typing",
      clear: "Active_Empty",
      cancel: "Active_TextEntry",
    },
  }, appStates.Inactive());

  setup(combobox)(
    createHierarchicalComboboxHook(store)
  );

  // Expose store APIs on machine for direct access
  const machineWithStore = Object.assign(combobox, { 
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
