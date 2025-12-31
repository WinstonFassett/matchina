import { createFlatMachine, createStoreMachine, defineStates, setup } from "matchina";
import { createComboboxStoreHook } from "./hooks";

const AVAILABLE_TAGS = [
  "typescript", "javascript", "react", "vue", "angular",
  "node", "deno", "bun", "python", "rust",
];

// Store state for combo box - eliminates parameter threading
export interface ComboboxState {
  input: string;
  selectedTags: string[];
  suggestions: string[];
  highlightedIndex: number;
}

type StoreChange<T> = {
  from: T;
  to: T;
};

// Helper function for suggestions - now uses store state
function getSuggestions(state: ComboboxState): string[] {
  if (!state || state.input === undefined || !state.selectedTags) return [];
  const trimmed = state.input.trim().toLowerCase();
  if (!trimmed) return [];
  
  return AVAILABLE_TAGS
    .filter(tag => {
      return tag.toLowerCase().includes(trimmed) && !state.selectedTags.includes(tag);
    })
    .slice(0, 5);
}

// Flat state keys - createFlatMachine handles flattened hierarchy
const states = defineStates({
  Inactive: undefined,
  "Active.Empty": undefined,
  "Active.Typing": undefined,
  "Active.TextEntry": undefined,
  "Active.Suggesting": undefined,
});

export function createFlatComboboxMachine() {
  // Create store to manage all combo box state
  const store = createStoreMachine<ComboboxState>({
    input: "",
    selectedTags: [],
    suggestions: [],
    highlightedIndex: 0,
  }, {
    setInput: (input: string) => (change: StoreChange<ComboboxState>) => {
      const newState = {
        ...change.from,
        input,
        suggestions: getSuggestions({ ...change.from, input }),
        highlightedIndex: 0,
      };
      return newState;
    },
    addTag: (tag: string) => (change: StoreChange<ComboboxState>) => {
      const newState = {
        ...change.from,
        selectedTags: [...change.from.selectedTags, tag],
        input: "",
        suggestions: [],
        highlightedIndex: 0,
      };
      return newState;
    },
    removeTag: (tag: string) => (change: StoreChange<ComboboxState>) => {
      const newState = {
        ...change.from,
        selectedTags: change.from.selectedTags.filter(t => t !== tag),
        suggestions: getSuggestions(change.from),
        highlightedIndex: 0,
      };
      return newState;
    },
    resetForInactive: () => () => ({
      input: "",
      selectedTags: [],
      suggestions: [],
      highlightedIndex: 0,
    }),
    highlightNext: (change: StoreChange<ComboboxState>) => ({
      ...change.from,
      highlightedIndex: Math.min(change.from.suggestions.length - 1, change.from.highlightedIndex + 1),
    }),
    highlightPrev: (change: StoreChange<ComboboxState>) => ({
      ...change.from,
      highlightedIndex: Math.max(0, change.from.highlightedIndex - 1),
    }),
  });

  // Use createFlatMachine with nested structure - it handles flattening automatically
  const baseMachine = createFlatMachine(states, {
    Inactive: {
      focus: states["Active.Empty"],
    },

    "Active.Empty": {
      typed: () => states["Active.Typing"](),
      removeTag: states["Active.Empty"],
      addTag: states["Active.Empty"],
      deactivate: states.Inactive,
    },

    "Active.Typing": {
      toEmpty: states["Active.Empty"],
      toSuggesting: states["Active.Suggesting"], 
      toTextEntry: states["Active.TextEntry"],
      removeTag: states["Active.Typing"],
      deactivate: states.Inactive,
    },

    "Active.TextEntry": {
      typed: () => states["Active.Typing"](),
      clear: states["Active.Empty"],
      removeTag: states["Active.TextEntry"],
      addTag: states["Active.Empty"],
      deactivate: states.Inactive,
    },

    "Active.Suggesting": {
      typed: () => states["Active.Typing"](),
      clear: states["Active.Empty"],
      highlightNext: states["Active.Suggesting"],
      highlightPrev: states["Active.Suggesting"],
      selectHighlighted: states["Active.Empty"],
      removeTag: states["Active.Suggesting"],
      cancel: states["Active.TextEntry"],
      addTag: states["Active.Empty"],
      deactivate: states.Inactive,
    },
  }, states.Inactive());

  // Add store hook and auto-transition effect
  setup(baseMachine)(
    createComboboxStoreHook(store)
  );

  // Attach store to machine for external access
  return Object.assign(baseMachine, { store });
}
