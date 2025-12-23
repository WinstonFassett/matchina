import React, { createContext, useContext, useEffect, useRef } from "react";
import { useMachine } from "matchina/react";
import { createMachine, type FactoryMachine } from "matchina";
import type { ActiveMachine, createComboboxMachine } from "./machine";

type Machine = ReturnType<typeof createComboboxMachine>;

// Helper for optional machines
const noopMachine = createMachine({}, {}, undefined as never);
function useMachineMaybe(machine: FactoryMachine<any> | undefined) {
  return useMachine(machine ?? noopMachine);
}

// Context for the combobox machine to avoid prop drilling
interface ComboboxContextValue {
  machine: Machine;
  activeMachine?: ActiveMachine;
}

const ComboboxContext = createContext<ComboboxContextValue | null>(null);

export function useComboboxContext() {
  const context = useContext(ComboboxContext);
  if (!context) {
    throw new Error("useComboboxContext must be used within ComboboxProvider");
  }
  return context;
}

function ComboboxProvider({ machine, children }: { machine: Machine; children: React.ReactNode }) {
  useMachine(machine);
  const state = machine.getState();
  const activeMachine = state.is("Active") ? state.data.machine : undefined;

  // Subscribe to active machine when it exists
  useMachineMaybe(activeMachine);

  return (
    <ComboboxContext.Provider value={{ machine, activeMachine }}>
      {children}
    </ComboboxContext.Provider>
  );
}

export function ComboboxView({ machine }: { machine: Machine }) {
  return (
    <ComboboxProvider machine={machine}>
      <div className="p-4 space-y-3 border rounded">
        <h3 className="font-semibold">Tag List Editor</h3>
        <StateDisplay />
        <TagList />
        <InputSection />
      </div>
    </ComboboxProvider>
  );
}

function StateDisplay() {
  const { machine } = useComboboxContext();

  const getStates = (m: FactoryMachine<any>): string[] => {
    const s = m.getState();
    const states = [s.key];
    const submachine = s.data?.machine;
    if (submachine) {
      states.push(...getStates(submachine));
    }
    return states;
  };

  const stateChain = getStates(machine).join(" / ");

  return (
    <div className="text-sm text-gray-600 font-medium">
      State: <span className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-blue-800 dark:text-blue-200">{stateChain}</span>
    </div>
  );
}

function TagList() {
  const { machine, activeMachine } = useComboboxContext();

  const state = machine.getState();
  const activeState = activeMachine?.getState();

  // Get tags from either active or inactive state
  const selectedTags: string[] = state.match({
    Active: () => activeState?.data?.selectedTags ?? [],
    Inactive: ({ selectedTags }: { selectedTags: string[] }) => selectedTags ?? [],
  }, []);

  if (selectedTags.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
        No tags selected. Click below to add tags.
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {selectedTags.map((tag) => (
        <Tag key={tag} tag={tag} />
      ))}
    </div>
  );
}

function Tag({ tag }: { tag: string }) {
  const { machine } = useComboboxContext();

  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-blue-500 text-white text-sm">
      {tag}
      <button
        onClick={() => machine.removeTag(tag)}
        className="hover:bg-blue-600 rounded-full p-0.5 transition-colors"
        aria-label={`Remove ${tag}`}
      >
        ×
      </button>
    </span>
  );
}

function InputSection() {
  const { machine } = useComboboxContext();
  const state = machine.getState();

  return state.match({
    Active: () => <ActiveInput />,
    Inactive: () => (
      <button
        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
        onClick={() => machine.focus()}
      >
        Click to add tags
      </button>
    ),
  }, null);
}

function ActiveInput() {
  const { activeMachine } = useComboboxContext();

  const state = activeMachine?.getState();
  const inputRef = useRef<HTMLInputElement>(null);

  // Autofocus when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  if (!state) return null;

  const input = state.data.input ?? "";

  return (
    <div className="space-y-2">
      <InputField inputRef={inputRef} value={input} />
      <SuggestionsList />
    </div>
  );
}

function InputField({ inputRef, value }: { inputRef: React.RefObject<HTMLInputElement | null>; value: string }) {
  const { machine, activeMachine } = useComboboxContext();

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const state = activeMachine?.getState();

    if (e.key === "Enter") {
      e.preventDefault();
      if (state?.is("Selecting")) {
        activeMachine?.addTag();
      } else if (state?.is("Suggesting")) {
        activeMachine?.navigate();
      } else if (value.trim()) {
        activeMachine?.addTag(value.trim());
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      machine.close();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (state?.is("Suggesting")) {
        activeMachine?.navigate();
      } else if (state?.is("Selecting")) {
        activeMachine?.highlight("down");
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (state?.is("Selecting")) {
        activeMachine?.highlight("up");
      }
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={inputRef}
        className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
        placeholder="Type to search tags... (Press ESC to close)"
        value={value}
        onChange={(e) => activeMachine?.typed(e.target.value)}
        onKeyDown={onKeyDown}
      />
      <button
        className="px-3 py-1 rounded bg-gray-500 text-white text-sm hover:bg-gray-600 transition-colors"
        onClick={() => activeMachine?.clear()}
      >
        Clear
      </button>
    </div>
  );
}

function SuggestionsList() {
  const { activeMachine } = useComboboxContext();
  const state = activeMachine?.getState();

  if (!state) return null;

  return state.match({
    Empty: () => null,
    TextEntry: () => null,
    Suggesting: ({ suggestions }) => (
      <SuggestionsDisplay suggestions={suggestions} highlightedIndex={-1} />
    ),
    Selecting: ({ suggestions, highlightedIndex }) => (
      <SuggestionsDisplay suggestions={suggestions} highlightedIndex={highlightedIndex} />
    ),
  }, false);
}

function SuggestionsDisplay({
  suggestions,
  highlightedIndex,
}: {
  suggestions: string[];
  highlightedIndex: number;
}) {
  const { activeMachine } = useComboboxContext();

  if (suggestions.length === 0) return null;

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800">
      <div className="text-xs text-gray-500 dark:text-gray-400 px-3 py-1 border-b border-gray-200 dark:border-gray-700">
        Use ↑↓ arrows to navigate, Enter to select
      </div>
      {suggestions.map((suggestion, index) => (
        <button
          key={suggestion}
          onClick={() => activeMachine?.addTag(suggestion)}
          className={`w-full text-left px-3 py-2 transition-colors ${
            index === highlightedIndex
              ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
              : "hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
}
