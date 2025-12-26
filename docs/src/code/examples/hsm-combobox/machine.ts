import { defineStates, matchina, submachine, createHierarchicalMachine, createMachine } from "matchina";

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
const activeStates = defineStates({
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

// Create the active machine factory directly (traffic light pattern)
const createActiveMachine = () => createMachine(
  activeStates,
  {
    Empty: {
      typed: (input: string) => activeStates.TextEntry({ input, selectedTags: [] }),
      focus: () => activeStates.TextEntry({ input: "", selectedTags: [] })
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
      blur: () => activeStates.Empty([]),
      escape: () => activeStates.Empty([])
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
      blur: () => activeStates.Empty([]),
      escape: () => activeStates.Empty([]),
      arrowDown: (state: any) => activeStates.Selecting({ 
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
      blur: () => activeStates.Empty([]),
      escape: () => activeStates.Empty([]),
      arrowUp: (state: any) => activeStates.Selecting({ 
        input: state.input, 
        selectedTags: state.selectedTags, 
        suggestions: state.suggestions || [], 
        highlightedIndex: Math.max(0, state.highlightedIndex - 1) 
      }),
      arrowDown: (state: any) => activeStates.Selecting({ 
        input: state.input, 
        selectedTags: state.selectedTags, 
        suggestions: state.suggestions || [], 
        highlightedIndex: Math.min(state.suggestions!.length - 1, state.highlightedIndex + 1) 
      }),
      enter: (state: any) => {
        const selectedTag = state.suggestions![state.highlightedIndex];
        return activeStates.TextEntry({ 
          input: "", 
          selectedTags: [...state.selectedTags, selectedTag] 
        });
      }
    }
  },
  activeStates.Empty([])
);

// Wrap with hierarchical machine (traffic light pattern)
const createHierarchicalActiveMachine = () => {
  const machine = createActiveMachine();
  return createHierarchicalMachine(machine);
};

// Create submachine factory
const activeFactory = submachine(createHierarchicalActiveMachine, { id: "active" });

// Main combobox states (traffic light pattern - inline submachine)
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
      blur: "Inactive",
      close: "Inactive"
    },
  }, comboboxStates.Active());

  return createHierarchicalMachine(combobox);
}

export type Machine = ReturnType<typeof createComboboxMachine>;
