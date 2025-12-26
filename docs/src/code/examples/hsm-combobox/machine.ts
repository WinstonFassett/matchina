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
      arrowDown: () => (ev: any) => activeStates.Selecting({ 
        input: ev.from.data.input, 
        selectedTags: ev.from.data.selectedTags, 
        suggestions: ev.from.data.suggestions || [], 
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
      arrowUp: () => (ev: any) => activeStates.Selecting({ 
        input: ev.from.data.input, 
        selectedTags: ev.from.data.selectedTags, 
        suggestions: ev.from.data.suggestions || [], 
        highlightedIndex: Math.max(0, ev.from.data.highlightedIndex - 1) 
      }),
      arrowDown: () => (ev: any) => activeStates.Selecting({ 
        input: ev.from.data.input, 
        selectedTags: ev.from.data.selectedTags, 
        suggestions: ev.from.data.suggestions || [], 
        highlightedIndex: Math.min(ev.from.data.suggestions!.length - 1, ev.from.data.highlightedIndex + 1) 
      }),
      enter: () => (ev: any) => {
        const selectedTag = ev.from.data.suggestions![ev.from.data.highlightedIndex];
        return activeStates.TextEntry({ 
          input: "", 
          selectedTags: [...ev.from.data.selectedTags, selectedTag] 
        });
      }
    }
  },
  activeStates.Empty([])
);

// Wrap with hierarchical machine (traffic light pattern with .def for visualization)
const createHierarchicalActiveMachine = () => {
  const machine = createActiveMachine();
  return createHierarchicalMachine(machine);
};

// Attach .def to the factory function for visualization discovery
(createHierarchicalActiveMachine as any).def = {
  states: activeStates,
  transitions: {
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
      arrowDown: () => (ev: any) => activeStates.Selecting({ 
        input: ev.from.data.input, 
        selectedTags: ev.from.data.selectedTags, 
        suggestions: ev.from.data.suggestions || [], 
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
      arrowUp: () => (ev: any) => activeStates.Selecting({ 
        input: ev.from.data.input, 
        selectedTags: ev.from.data.selectedTags, 
        suggestions: ev.from.data.suggestions || [], 
        highlightedIndex: Math.max(0, ev.from.data.highlightedIndex - 1) 
      }),
      arrowDown: () => (ev: any) => activeStates.Selecting({ 
        input: ev.from.data.input, 
        selectedTags: ev.from.data.selectedTags, 
        suggestions: ev.from.data.suggestions || [], 
        highlightedIndex: Math.min(ev.from.data.suggestions!.length - 1, ev.from.data.highlightedIndex + 1) 
      }),
      enter: () => (ev: any) => {
        const selectedTag = ev.from.data.suggestions![ev.from.data.highlightedIndex];
        return activeStates.TextEntry({ 
          input: "", 
          selectedTags: [...ev.from.data.selectedTags, selectedTag] 
        });
      }
    }
  },
  initial: "Empty"
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
  }, comboboxStates.Inactive());

  return createHierarchicalMachine(combobox);
}

export type Machine = ReturnType<typeof createComboboxMachine>;
