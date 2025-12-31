import { describeHSM } from "matchina/hsm";
import { createStoreMachine, setup } from "matchina";
import { createComboboxStoreHook } from "./hooks";

// Available options for autocomplete
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

// Create the automatically flattened version using describeHSM
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

  // Use describeHSM to auto-flatten a nested description
  const flatMachine = describeHSM({
    initial: 'Inactive',
    states: {
      Inactive: {
        data: () => ({}), // No selectedTags in machine state - it's in store
        on: {
          focus: 'Active'
        }
      },
      Active: {
        initial: 'Empty',
        states: {
          Empty: {
            data: () => ({ input: "" }), // No selectedTags in machine state - it's in store
            on: {
              typed: 'Typing',
              removeTag: 'Empty', // Stay in Empty
              addTag: 'Empty', // Stay in Empty
              deactivate: '^Inactive'
            }
          },
          Typing: {
            data: (input: string) => ({ input }), // No selectedTags in machine state - it's in store
            on: {
              // Auto-transition based on suggestions
              toEmpty: 'Empty',
              toSuggesting: 'Suggesting',
              toTextEntry: 'TextEntry',
              removeTag: 'Typing',
              deactivate: '^Inactive'
            }
          },
          TextEntry: {
            data: (input: string) => ({ input }), // No selectedTags in machine state - it's in store
            on: {
              typed: 'Typing',
              clear: 'Empty',
              removeTag: 'TextEntry',
              addTag: 'Empty',
              deactivate: '^Inactive'
            }
          },
          Suggesting: {
            data: (input: string, suggestions: string[], highlightedIndex: number = 0) => ({
              input, suggestions, highlightedIndex // No selectedTags in machine state - it's in store
            }),
            on: {
              typed: 'Typing',
              clear: 'Empty',
              highlightNext: 'Suggesting',
              highlightPrev: 'Suggesting',
              selectHighlighted: 'Empty',
              removeTag: 'Suggesting',
              cancel: 'TextEntry',
              addTag: 'Empty',
              deactivate: '^Inactive'
            }
          }
        },
        on: {
          blur: '^Inactive',
          close: '^Inactive',
          removeTag: () => (ev) => {
            // Delegate to child machine - let it handle the event
            return ev.from;
          }
        }
      }
    }
  });

  // Add store hook and auto-transition effect
  setup(flatMachine)(
    createComboboxStoreHook(store)
  );

  // Attach store to machine for external access
  return Object.assign(flatMachine, { store });
}
