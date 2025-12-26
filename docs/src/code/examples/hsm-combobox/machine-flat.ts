import {
  defineStates,
  createMachineFromFlat
} from "matchina";

// Available options for autocomplete
const AVAILABLE_TAGS = [
  "typescript", "javascript", "react", "vue", "angular",
  "node", "deno", "bun", "python", "rust",
  "go", "java", "kotlin", "swift", "dart"
];

// Define the flattened states directly
const flatStates = defineStates({
  Inactive: undefined,
  "Active.Empty": () => ({ input: "", selectedTags: [] }),
  "Active.TextEntry": ({ input, selectedTags }: { input: string; selectedTags: string[] }) => ({ input, selectedTags }),
  "Active.Suggesting": ({ input, selectedTags, suggestions }: { input: string; selectedTags: string[]; suggestions: string[] }) => ({ input, selectedTags, suggestions }),
  "Active.Selecting": ({ input, selectedTags, suggestions, highlightedIndex }: { 
    input: string; 
    selectedTags: string[]; 
    suggestions: string[]; 
    highlightedIndex: number 
  }) => ({ input, selectedTags, suggestions, highlightedIndex }),
});

// Define the flattened transitions directly
const flatTransitions = {
  Inactive: {
    focus: () => flatStates["Active.Empty"]()
  },
  "Active.Empty": {
    typed: (input: string) => (ev: any) => {
      const selectedTags = ev.from.data.selectedTags || [];
      const suggestions = input.length > 0 
        ? AVAILABLE_TAGS.filter(tag => tag.toLowerCase().includes(input.toLowerCase()))
        : [];
      
      return suggestions.length > 0 
        ? flatStates["Active.Suggesting"]({ input, selectedTags, suggestions })
        : flatStates["Active.TextEntry"]({ input, selectedTags });
    },
    blur: () => flatStates["Inactive"](),
    close: () => flatStates["Inactive"]()
  },
  "Active.TextEntry": {
    typed: (input: string) => (ev: any) => {
      const selectedTags = ev.from.data.selectedTags || [];
      const suggestions = input.length > 0 
        ? AVAILABLE_TAGS.filter(tag => tag.toLowerCase().includes(input.toLowerCase()))
        : [];
      
      return suggestions.length > 0 
        ? flatStates["Active.Suggesting"]({ input, selectedTags, suggestions })
        : flatStates["Active.TextEntry"]({ input, selectedTags });
    },
    blur: () => flatStates["Inactive"](),
    escape: () => flatStates["Inactive"](),
    close: () => flatStates["Inactive"]()
  },
  "Active.Suggesting": {
    typed: (input: string) => (ev: any) => {
      const selectedTags = ev.from.data.selectedTags || [];
      const suggestions = input.length > 0 
        ? AVAILABLE_TAGS.filter(tag => tag.toLowerCase().includes(input.toLowerCase()))
        : [];
      
      return suggestions.length > 0 
        ? flatStates["Active.Suggesting"]({ input, selectedTags, suggestions })
        : flatStates["Active.TextEntry"]({ input, selectedTags });
    },
    blur: () => flatStates["Inactive"](),
    escape: () => flatStates["Inactive"](),
    close: () => flatStates["Inactive"](),
    arrowDown: () => (ev: any) => flatStates["Active.Selecting"]({ 
      input: ev.from.data.input, 
      selectedTags: ev.from.data.selectedTags, 
      suggestions: ev.from.data.suggestions, 
      highlightedIndex: 0 
    })
  },
  "Active.Selecting": {
    typed: (input: string) => (ev: any) => {
      const selectedTags = ev.from.data.selectedTags || [];
      const suggestions = input.length > 0 
        ? AVAILABLE_TAGS.filter(tag => tag.toLowerCase().includes(input.toLowerCase()))
        : [];
      
      return suggestions.length > 0 
        ? flatStates["Active.Suggesting"]({ input, selectedTags, suggestions })
        : flatStates["Active.TextEntry"]({ input, selectedTags });
    },
    blur: () => flatStates["Inactive"](),
    escape: () => flatStates["Inactive"](),
    close: () => flatStates["Inactive"](),
    arrowUp: () => (ev: any) => flatStates["Active.Selecting"]({ 
      input: ev.from.data.input, 
      selectedTags: ev.from.data.selectedTags, 
      suggestions: ev.from.data.suggestions, 
      highlightedIndex: Math.max(0, (ev.from.data.highlightedIndex || 0) - 1) 
    }),
    arrowDown: () => (ev: any) => flatStates["Active.Selecting"]({ 
      input: ev.from.data.input, 
      selectedTags: ev.from.data.selectedTags, 
      suggestions: ev.from.data.suggestions, 
      highlightedIndex: Math.min((ev.from.data.suggestions || []).length - 1, (ev.from.data.highlightedIndex || 0) + 1) 
    }),
    enter: () => (ev: any) => {
      const suggestions = ev.from.data.suggestions || [];
      const selectedTag = suggestions[ev.from.data.highlightedIndex || 0];
      if (selectedTag) {
        return flatStates["Active.TextEntry"]({ 
          input: "", 
          selectedTags: [...(ev.from.data.selectedTags || []), selectedTag] 
        });
      }
      return flatStates["Active.TextEntry"]({ 
        input: ev.from.data.input, 
        selectedTags: ev.from.data.selectedTags 
      });
    }
  }
};

export function createFlatComboboxMachine() {
  const machine = createMachineFromFlat({
    states: flatStates as any,
    transitions: flatTransitions as any,
    initial: "Inactive"
  });
  
  // Store original hierarchical definition for visualization - match the actual hierarchical structure
  (machine as any)._originalDef = {
    states: {
      Inactive: (selectedTags: string[] = []) => ({ selectedTags }),
      Active: {
        Empty: (selectedTags: string[] = []) => ({ input: "", selectedTags }),
        TextEntry: ({ input = "", selectedTags = [] }: { input: string; selectedTags: string[] }) => ({ input, selectedTags }),
        Suggesting: ({ input = "", selectedTags = [], suggestions = [] }: { input: string; selectedTags: string[]; suggestions: string[] }) => ({ input, selectedTags, suggestions }),
        Selecting: ({ input = "", selectedTags = [], suggestions = [], highlightedIndex = 0 }: { 
          input: string; 
          selectedTags: string[]; 
          suggestions: string[]; 
          highlightedIndex: number 
        }) => ({ input, selectedTags, suggestions, highlightedIndex })
      }
    },
    transitions: {
      Inactive: { focus: "Active" },
      Active: { 
        blur: "Inactive",
        close: "Inactive",
        removeTag: (tag: string) => (ev: any) => ev.from,
        Empty: { 
          typed: "TextEntry", 
          removeTag: (tag: string) => (ev: any) => ev.from
        },
        TextEntry: { 
          typed: "TextEntry", 
          blur: "Inactive", 
          escape: "Inactive", 
          close: "Inactive",
          clear: "Empty",
          addTag: "Empty"
        },
        Suggesting: { 
          typed: "Suggesting", 
          blur: "Inactive", 
          escape: "Inactive", 
          close: "Inactive", 
          arrowDown: "Selecting",
          highlight: "Selecting",
          addTag: "Empty",
          cancel: "TextEntry"
        },
        Selecting: { 
          typed: "Suggesting", 
          blur: "Inactive", 
          escape: "Inactive", 
          close: "Inactive", 
          arrowUp: "Selecting", 
          arrowDown: "Selecting", 
          enter: "TextEntry",
          highlight: "Selecting",
          addTag: "Empty",
          cancel: "TextEntry"
        }
      }
    },
    initial: "Inactive"
  };
  
  return machine;
}

export function parseFlatStateKey(key: string) {
  const parts = key.split('.');
  return {
    full: key,
    parent: parts[0],
    child: parts[1]
  };
}
