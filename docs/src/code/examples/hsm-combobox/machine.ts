import { defineStates, matchina, setup, effect } from "matchina";
import { submachine, makeHierarchical } from "matchina/hsm";
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

export function createComboboxMachine() {
  const store = createComboboxStore();

  const combobox = matchina(appStates, {
    Inactive: { focus: "Active" },
    Active: { deactivate: "Inactive" },
  }, appStates.Inactive());

  const hierarchical = makeHierarchical(combobox);
  
  // Minimal hook - only handle typed events for auto-transitions
  setup(hierarchical)(effect((ev: any) => {
    if (ev?.type === 'typed' && ev?.params?.[0] !== undefined) {
      setTimeout(() => {
        const state = store.getState();
        ev.machine?.send?.(state.suggestions.length > 0 ? "toSuggesting" : "toTextEntry");
      }, 0);
    }
  }));

  return Object.assign(hierarchical, { 
    store,
    addTag: store.dispatch.bind(null, 'addTag'),
    removeTag: store.dispatch.bind(null, 'removeTag'),
    setInput: store.dispatch.bind(null, 'setInput'),
    highlight: (d: 'next' | 'prev') => store.dispatch('highlight', d),
    clear: () => store.dispatch('clear'),
    deactivate: () => store.dispatch('clear')
  });
}
