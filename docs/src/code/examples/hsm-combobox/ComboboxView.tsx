import React, { useEffect, useRef } from "react";
import { createMachine, eventApi, type FactoryMachine } from "matchina";
import { useMachine } from "matchina/react";
import type { createComboboxMachine } from "./machine";

type Machine = ReturnType<typeof createComboboxMachine>;

// Create a dummy state factory for the noop machine
const dummyStates = { Noop: () => ({ key: 'Noop' }) };
const noopMachine = createMachine(dummyStates, {}, "Noop");
function useMachineMaybe(machine: FactoryMachine<any> | undefined) {
  return useMachine(machine ?? noopMachine);
}

export function ComboboxView({ machine }: { machine: Machine }) {
  useMachine(machine);
  const state = machine.getState();
  const actions = eventApi(machine);

  const activeMachine = state.is("Active") ? state.data.machine : undefined;
  useMachineMaybe(activeMachine);
  const activeState = activeMachine?.getState();
  const activeActions = activeMachine ? eventApi(activeMachine) : null;

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (activeMachine && inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeMachine]);

  const getStateChain = (): string => {
    const parts = [state.key];
    if (activeState) parts.push(activeState.key);
    return parts.join(" / ");
  };

  const selectedTags: string[] = state.match({
    Active: () => activeState?.data?.selectedTags ?? [],
    Inactive: ({ selectedTags }: { selectedTags: string[] }) => selectedTags ?? [],
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!activeState) return;

    const { suggestions = [] } = activeState.data;

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        actions.close?.();
        break;
      case "ArrowDown":
        e.preventDefault();
        if (activeState.is("Suggesting")) {
          activeActions?.highlightNext?.();
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (activeState.is("Suggesting")) {
          activeActions?.highlightPrev?.();
        }
        break;
      case "Enter":
        e.preventDefault();
        if (activeState.is("Suggesting") && suggestions.length > 0) {
          activeActions?.selectHighlighted?.();
        } else if (activeState.data.input?.trim()) {
          activeActions?.addTag?.(activeState.data.input.trim());
        }
        break;
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-sm text-gray-600 dark:text-gray-400">
        State: <span className="font-mono bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">{getStateChain()}</span>
      </div>

      <div className="flex flex-wrap items-center gap-2 border border-gray-300 dark:border-gray-600 rounded-lg p-2 bg-white dark:bg-gray-900 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all">
        {selectedTags.map((tag) => (
          <span key={tag} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-500 dark:bg-blue-600 text-white text-sm font-medium">
            {tag}
            <button
              onClick={() => actions.removeTag?.(tag)}
              className="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors"
              aria-label={`Remove ${tag}`}
            >
              ×
            </button>
          </span>
        ))}

        <div className="relative flex-1 min-w-[120px]">
          <input
            ref={inputRef}
            type="text"
            value={activeState?.data?.input ?? ""}
            onChange={(e) => activeActions?.typed?.(e.target.value)}
            onFocus={() => actions.focus?.()}
            onBlur={() => actions.close?.()}
            onKeyDown={handleKeyDown}
            placeholder="Type to add tags..."
            className="w-full px-1 py-1 bg-transparent border-none outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />

          {activeState?.is("Suggesting") && activeState.data.suggestions?.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 shadow-lg max-h-48 overflow-y-auto z-20">
              {activeState.data.suggestions.map((suggestion: string, index: number) => (
                <button
                  key={suggestion}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    activeActions?.addTag?.(suggestion);
                  }}
                  className={`w-full text-left px-3 py-2 transition-colors ${
                    index === activeState.data.highlightedIndex
                      ? "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-gray-100"
                  }`}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
