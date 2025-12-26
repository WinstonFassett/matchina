import React, { useContext, useEffect, useRef, useState } from "react";
import { useMachine } from "matchina/react";
import { eventApi } from "matchina";
import { parseFlatStateKey } from "./machine-flat";

// Context to share the machine and active machine
const ComboboxContext = React.createContext<{
  machine: any;
  activeMachine?: any;
  actions: any;
}>({ machine: null, actions: null });

function useComboboxContext() {
  return useContext(ComboboxContext);
}

interface ComboboxViewProps {
  machine: any;
  mode: "flat" | "nested";
}

export function ComboboxView({ machine, mode }: ComboboxViewProps) {
  const change = useMachine(machine) as { to: { key: string; data?: any } };
  const state = change.to;
  const send = (event: string) => machine.send(event);

  // Normalize state based on mode
  let parent: string;
  let child: string | null = null;
  let activeMachine: any = null;

  if (mode === "flat") {
    const parsed = parseFlatStateKey(state.key);
    parent = parsed.parent;
    child = parsed.child;
  } else {
    // Nested/Propagating mode
    parent = state.key;
    // Check for nested machine in data
    if (state.data && state.data.machine) {
      activeMachine = state.data.machine;
      const childState = activeMachine.getState();
      if (childState) {
        child = childState.key;
      }
    }
  }

  // Create event APIs
  const actions = eventApi(machine);

  const contextValue = { machine, activeMachine, actions };

  return (
    <ComboboxContext.Provider value={contextValue}>
      <div className="max-w-md mx-auto bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tag List Editor</h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Add Tags (Type to search, use arrow keys to navigate)
            </label>
            <InputSection />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Selected Tags
            </label>
            <SelectedTagsDisplay />
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            State: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-1 rounded">
              {child ? `${parent}.${child}` : parent}
            </span>
          </div>
        </div>
      </div>
    </ComboboxContext.Provider>
  );
}

function InputSection() {
  const { machine } = useComboboxContext();
  const state = machine.getState();

  // Handle both flat and nested modes
  const stateKey = state.key;
  if (stateKey.startsWith('Active') || stateKey === 'Active') {
    return <ActiveInput />;
  } else if (stateKey.startsWith('Inactive') || stateKey === 'Inactive') {
    return (
      <button
        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline"
        onClick={() => (machine as any).focus?.() || (machine as any).send?.('focus')}
      >
        Click to add tags
      </button>
    );
  }

  return null;
}

function ActiveInput() {
  const { activeMachine, actions, machine } = useComboboxContext();
  
  // In flattened mode, get state from main machine, in nested mode from activeMachine
  const state = activeMachine?.getState() || machine.getState();
  const inputRef = useRef<HTMLInputElement>(null);

  // Create event API for activeMachine when available (nested mode)
  // In flattened mode, use the main machine's actions
  const activeActions = activeMachine ? eventApi(activeMachine) : actions;

  // Autofocus when component mounts
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  if (!state) return null;

  const { input = "" } = state.data || {};

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        className="border border-gray-300 dark:border-gray-600 rounded px-3 py-2 flex-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
        placeholder="Type to search tags... (Press ESC to close)"
        value={input}
        onChange={(e) => activeActions?.typed?.(e.target.value)}
        onKeyDown={(e) => {
          switch (e.key) {
            case 'Escape':
              activeActions?.escape?.();
              break;
            case 'ArrowDown':
              e.preventDefault();
              activeActions?.arrowDown?.();
              break;
            case 'ArrowUp':
              e.preventDefault();
              activeActions?.arrowUp?.();
              break;
            case 'Enter':
              e.preventDefault();
              activeActions?.enter?.();
              break;
          }
        }}
        onBlur={() => {
          // Small delay to allow click events on suggestions
          setTimeout(() => activeActions?.blur?.(), 150);
        }}
      />
      <SuggestionsList />
    </div>
  );
}

function SuggestionsList() {
  const { activeMachine, machine } = useComboboxContext();
  
  // In flattened mode, get state from main machine, in nested mode from activeMachine
  const state = activeMachine?.getState() || machine.getState();

  if (!state) return null;

  return state.match({
    Empty: () => null,
    TextEntry: () => null,
    Suggesting: ({ suggestions }: { suggestions: string[] }) => (
      <SuggestionsDisplay suggestions={suggestions} highlightedIndex={-1} />
    ),
    Selecting: ({ suggestions, highlightedIndex }: { suggestions: string[]; highlightedIndex: number }) => (
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
  const { activeMachine, actions } = useComboboxContext();
  // In flattened mode, use main machine actions, in nested mode use activeMachine actions
  const activeActions = activeMachine ? eventApi(activeMachine) : actions;

  if (suggestions.length === 0) return null;

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded mt-1 bg-white dark:bg-gray-800 shadow-lg">
      {suggestions.map((suggestion, index) => (
        <div
          key={suggestion}
          className={`px-3 py-2 cursor-pointer text-sm ${
            index === highlightedIndex
              ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
          }`}
          onClick={() => {
            activeActions?.enter?.();
          }}
          onMouseEnter={() => {
            // Update highlighted index on hover
            if (index !== highlightedIndex) {
              // This would need to be handled differently in a real implementation
            }
          }}
        >
          {suggestion}
        </div>
      ))}
    </div>
  );
}

function SelectedTagsDisplay() {
  const { activeMachine, machine } = useComboboxContext();
  
  // In flattened mode, get state from main machine, in nested mode from activeMachine
  const state = activeMachine?.getState() || machine.getState();

  if (!state) return null;

  const { selectedTags = [] } = state.data || {};
  
  // Ensure selectedTags is an array
  const tagsArray = Array.isArray(selectedTags) ? selectedTags : [];

  if (tagsArray.length === 0) {
    return (
      <div className="text-sm text-gray-500 dark:text-gray-400 italic">
        No tags selected
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tagsArray.map((tag: string) => (
        <span
          key={tag}
          className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200"
        >
          {tag}
          <button
            className="ml-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            onClick={() => {
              // This would need to be implemented to remove tags
            }}
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
