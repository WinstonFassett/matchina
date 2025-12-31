import { defineStates, matchina } from "matchina";
import { submachine, makeHierarchical } from "matchina/hsm";
import { createComboboxStoreHook } from "./hooks";
import { createComboboxStore } from "./store";

// Available options for autocomplete
const AVAILABLE_TAGS = [
  "typescript", "javascript", "react", "vue", "angular",
  "node", "deno", "bun", "python", "rust",
];

// Active child states for the tag editor
export const activeStates = defineStates({
  Empty: undefined, // No data needed - everything is in store
  Typing: undefined, // No data needed - everything is in store
  TextEntry: undefined, // No data needed - everything is in store
  Suggesting: undefined, // No data needed - everything is in store
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

// Shared typed handler - computes next state based on input
const handleTyped = (value: string) => (ev: any) => {
  // Everything is in store, no need to pass data to states
  if (!value.trim()) return activeStates.Empty();

  // Auto-transition logic will be handled by the store hook
  return activeStates.TextEntry();
};

// Shared addTag handler
const handleAddTag = (tag: string) => (ev: any) => {
  // Everything is in store, no need to pass data to states
  return activeStates.Empty();
};

function createActiveForApp() {
  return matchina(activeStates, {
    Empty: {
      typed: handleTyped,
      removeTag: (tag) => (ev) => 
        activeStates.Empty(),
      backspace: () => (ev) => {
        // selectedTags is in store, not machine state
        return ev.from;
      },
    },
    Typing: {
      // Auto-transitions are handled by the store hook
      removeTag: (tag) => (ev) => 
        activeStates.Typing(),
      backspace: () => (ev) => {
        // selectedTags is in store, not machine state
        return ev.from;
      },
    },
    TextEntry: {
      typed: handleTyped,
      clear: () => (ev) => activeStates.Empty(),
      addTag: handleAddTag,
      backspace: () => (ev) => {
        // selectedTags is in store, not machine state
        return ev.from;
      },
    },
    Suggesting: {
      typed: handleTyped,
      clear: () => (ev) => activeStates.Empty(),
      highlightNext: () => (ev) => {
        // Everything is in store, no need to pass data to states
        return activeStates.Suggesting();
      },
      highlightPrev: () => (ev) => {
        // Everything is in store, no need to pass data to states
        return activeStates.Suggesting();
      },
      selectHighlighted: () => (ev) => {
        // Everything is in store, no need to pass data to states
        return activeStates.Empty();
      },
      cancel: () => (ev) => {
        // Everything is in store, no need to pass data to states
        return activeStates.TextEntry();
      },
      addTag: handleAddTag,
      backspace: () => (ev) => {
        // selectedTags is in store, not machine state
        return ev.from;
      },
    },
  });
}

export type ActiveMachine = ReturnType<typeof createActiveForApp>;

// Use submachine exactly like checkout does
const activeMachineFactory = submachine(createActiveForApp, { id: "active" });

export const appStates = defineStates({
  Inactive: undefined, // No selectedTags in machine state - it's in store
  Active: activeMachineFactory,
});

export function createComboboxMachine() {
  // Use shared store instead of creating a new one
  const store = createComboboxStore();

  const combobox = matchina(appStates, {
    Inactive: {
      focus: "Active"
    },
    Active: {
      blur: () => (ev) => {
        const activeMachine = ev.from.data.machine;
        const activeState = activeMachine?.getState();
        const selectedTags = activeState?.data?.selectedTags ?? [];
        return appStates.Inactive();
      },
      close: () => (ev: any) => {
        const activeMachine = ev.from.data.machine;
        const activeState = activeMachine?.getState();
        const selectedTags = activeState?.data?.selectedTags ?? [];
        return appStates.Inactive();
      },
      removeTag: (tag: string) => (ev: any) => {
        // Delegate to child machine
        const activeMachine = ev.from.data.machine;
        activeMachine?.removeTag?.(tag);
        return ev.from;
      },
    },
  }, appStates.Inactive());

  const hierarchical = makeHierarchical(combobox);

  // Add store hook and auto-transition effect
  setup(hierarchical)(
    createComboboxStoreHook(store)
  );

  // Attach store to machine for external access
  return Object.assign(hierarchical, { store });
}
