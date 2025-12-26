import { defineStates, matchina, defineMachine, submachine, createHierarchicalMachine } from "matchina";

// Available options for autocomplete
const AVAILABLE_TAGS = [
  "typescript", "javascript", "react", "vue", "angular",
  "node", "deno", "bun", "python", "rust",
  "go", "java", "kotlin", "swift", "dart"
];

interface SelectingState {
  input: string;
  suggestions: string[];
  highlightedIndex: number;
  selectedTags: string[];
}

interface TagEditorState {
  input: string;
  selectedTags: string[];
  suggestions?: string[];
  highlightedIndex?: number;
}

// Active child states for the tag editor
export const activeStates = defineStates({
  Empty: (selectedTags: string[] = []) => ({
    input: "",
    selectedTags
  }),
  TextEntry: ({ input = "", selectedTags = [] }: Partial<TagEditorState>) => ({
    input,
    selectedTags
  }),
  Suggesting: ({ input = "", selectedTags = [], suggestions = [] }: Partial<TagEditorState>) => ({
    input,
    selectedTags,
    suggestions
  }),
  Selecting: ({
    input = "",
    selectedTags = [],
    suggestions = [],
    highlightedIndex = 0
  }: Partial<SelectingState>) => ({
    input,
    selectedTags,
    suggestions,
    highlightedIndex
  }),
});

// Define the active combobox machine
const activeDef = defineMachine(activeStates, {
  Empty: {
    typed: (input: string) => activeStates.TextEntry({ input, selectedTags: [] }),
    focus: activeStates.TextEntry({ input: "", selectedTags: [] })
  },
  TextEntry: {
    typed: (input: string) => {
      const suggestions = input.length > 0 
        ? AVAILABLE_TAGS.filter(tag => tag.toLowerCase().includes(input.toLowerCase()))
        : [];
      
      return suggestions.length > 0 
        ? activeStates.Suggesting({ input, selectedTags: [], suggestions })
        : activeStates.TextEntry({ input, selectedTags: [] });
    },
    blur: activeStates.Empty({ selectedTags: [] }),
    escape: activeStates.Empty({ selectedTags: [] })
  },
  Suggesting: {
    typed: (input: string) => {
      const suggestions = input.length > 0 
        ? AVAILABLE_TAGS.filter(tag => tag.toLowerCase().includes(input.toLowerCase()))
        : [];
      
      return suggestions.length > 0 
        ? activeStates.Suggesting({ input, selectedTags: [], suggestions })
        : activeStates.TextEntry({ input, selectedTags: [] });
    },
    blur: activeStates.Empty({ selectedTags: [] }),
    escape: activeStates.Empty({ selectedTags: [] }),
    arrowDown: (state) => activeStates.Selecting({ 
      input: state.input, 
      selectedTags: state.selectedTags, 
      suggestions: state.suggestions || [], 
      highlightedIndex: 0 
    })
  },
  Selecting: {
    typed: (input: string) => {
      const suggestions = input.length > 0 
        ? AVAILABLE_TAGS.filter(tag => tag.toLowerCase().includes(input.toLowerCase()))
        : [];
      
      return suggestions.length > 0 
        ? activeStates.Suggesting({ input, selectedTags: [], suggestions })
        : activeStates.TextEntry({ input, selectedTags: [] });
    },
    blur: activeStates.Empty({ selectedTags: [] }),
    escape: activeStates.Empty({ selectedTags: [] }),
    arrowUp: (state) => activeStates.Selecting({ 
      input: state.input, 
      selectedTags: state.selectedTags, 
      suggestions: state.suggestions || [], 
      highlightedIndex: Math.max(0, state.highlightedIndex - 1) 
    }),
    arrowDown: (state) => activeStates.Selecting({ 
      input: state.input, 
      selectedTags: state.selectedTags, 
      suggestions: state.suggestions || [], 
      highlightedIndex: Math.min(state.suggestions!.length - 1, state.highlightedIndex + 1) 
    }),
    enter: (state) => {
      const selectedTag = state.suggestions![state.highlightedIndex];
      return activeStates.TextEntry({ 
        input: "", 
        selectedTags: [...state.selectedTags, selectedTag] 
      });
    }
  }
}, activeStates.Empty({ selectedTags: [] }));

// Create the active machine factory
const createActiveMachine = activeDef.factory;

// Wrap with hierarchical machine
const createHierarchicalActiveMachine = () => {
  const machine = createActiveMachine();
  return createHierarchicalMachine(machine);
};

// Create submachine factory
const activeFactory = submachine(createHierarchicalActiveMachine, { id: "active" });

// Main combobox states
const comboboxStates = defineStates({
  Inactive: undefined,
  Active: activeFactory
});

export function createComboboxMachine() {
  const combobox = matchina(comboboxStates, {
    Inactive: {
      focus: "Active"
    },
    Active: {
      blur: () => (ev) => {
        // Check if the active machine is in a final state
        const childState = ev.data?.machine?.getState();
        if (childState?.key === 'Empty') {
          return "Inactive";
        }
        return "Active";
      },
      close: "Inactive"
    },
  }, comboboxStates.Inactive());

  return createHierarchicalMachine(combobox);
}

export type Machine = ReturnType<typeof createComboboxMachine>;
