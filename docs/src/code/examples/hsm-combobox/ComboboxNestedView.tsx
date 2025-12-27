import React, { useEffect, useRef, useState } from "react";
import { eventApi } from "matchina";
import { useMachine } from "matchina/react";
import type { createComboboxMachine } from "./machine";

// Context to share the machine and active machine
const ComboboxContext = React.createContext<{
  machine: any;
  activeMachine?: any;
  actions: any;
}>({ machine: null, actions: null });


interface ComboboxNestedViewProps {
  machine: any;
}

export function ComboboxNestedView({ machine }: ComboboxNestedViewProps) {
  const change = useMachine(machine) as { to: { key: string; data?: any } };
  const state = change.to;

  // For nested mode, we expect to find the active machine in state.data
  let parent: string;
  let child: string | null = null;
  let activeMachine: any = null;

  parent = state.key;
  // Check for nested machine in data
  if (state.data && state.data.machine) {
    activeMachine = state.data.machine;
    const childState = activeMachine.getState();
    if (childState) {
      child = childState.key;
    }
  }

  // Create event APIs
  const actions = eventApi(machine);
  const activeActions = activeMachine ? eventApi(activeMachine) : null;

  // Input handling
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value with machine state
  useEffect(() => {
    if (activeMachine && child) {
      const childState = activeMachine.getState();
      if (childState?.data?.input !== undefined) {
        setInputValue(childState.data.input);
      }
    }
  }, [state, activeMachine, child]);

  // Get suggestions based on current input
  const getSuggestions = (input: string, selectedTags: string[] = []) => {
    if (!input.trim()) return [];
    return AVAILABLE_TAGS.filter(
      tag => tag.toLowerCase().includes(input.toLowerCase()) && 
      !selectedTags.includes(tag)
    );
  };

  // Get current data
  const getCurrentData = () => {
    if (!activeMachine || !child) return { input: "", selectedTags: [], suggestions: [], highlightedIndex: 0 };
    return activeMachine.getState()?.data || { input: "", selectedTags: [], suggestions: [], highlightedIndex: 0 };
  };

  const currentData = getCurrentData();
  const suggestions = getSuggestions(currentData.input, currentData.selectedTags);

  // Event handlers
  const handleInputChange = (value: string) => {
    setInputValue(value);
    activeActions?.typed?.(value);
  };

  const handleFocus = () => {
    actions.focus();
  };

  const handleBlur = () => {
    actions.blur();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!activeMachine) return;

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        activeActions?.escape();
        break;
      case "ArrowDown":
        e.preventDefault();
        if (suggestions.length > 0) {
          activeActions?.arrowDown();
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (currentData.highlightedIndex > 0) {
          activeActions?.arrowUp();
        }
        break;
      case "Enter":
        e.preventDefault();
        if (suggestions.length > 0 && currentData.highlightedIndex < suggestions.length) {
          activeActions?.enter();
        }
        break;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    activeActions?.addTag?.(suggestion);
  };

  const handleTagRemove = (tag: string) => {
    activeActions?.removeTag?.(tag);
  };

  return (
    <ComboboxContext.Provider value={{ machine, activeMachine, actions }}>
      <div className="combobox-demo">
        <div className="state-info">
          <div className="state-path">
            {parent} {child && `→ ${child}`}
          </div>
          <div className="state-data">
            Selected: {currentData.selectedTags.join(", ") || "None"}
          </div>
        </div>

        <div className="combobox-container">
          {/* Selected tags */}
          <div className="selected-tags">
            {currentData.selectedTags.map((tag: string) => (
              <span key={tag} className="tag">
                {tag}
                <button onClick={() => handleTagRemove(tag)} className="remove-tag">
                  ×
                </button>
              </span>
            ))}
          </div>

          {/* Input field */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={parent === "Inactive" ? "Click to focus..." : "Type to search..."}
            className="combobox-input"
            disabled={parent === "Inactive"}
          />

          {/* Suggestions dropdown */}
          {parent === "Active" && child === "Suggesting" && suggestions.length > 0 && (
            <div className="suggestions">
              {suggestions.map((suggestion: string, index: number) => (
                <div
                  key={suggestion}
                  className={`suggestion ${index === currentData.highlightedIndex ? "highlighted" : ""}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}

          {/* Selection mode */}
          {parent === "Active" && child === "Selecting" && suggestions.length > 0 && (
            <div className="suggestions">
              {suggestions.map((suggestion: string, index: number) => (
                <div
                  key={suggestion}
                  className={`suggestion ${index === currentData.highlightedIndex ? "highlighted" : ""}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="controls">
          {parent === "Inactive" ? (
            <button onClick={handleFocus}>Focus Combobox</button>
          ) : (
            <button onClick={handleBlur}>Blur (Go Inactive)</button>
          )}
        </div>
      </div>

      <style>{`
        .combobox-demo {
          padding: 20px;
          font-family: system-ui;
        }

        .state-info {
          margin-bottom: 20px;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 4px;
        }

        .state-path {
          font-weight: bold;
          margin-bottom: 5px;
        }

        .state-data {
          font-size: 0.9em;
          color: #666;
        }

        .combobox-container {
          position: relative;
          margin-bottom: 20px;
        }

        .selected-tags {
          display: flex;
          flex-wrap: wrap;
          gap: 5px;
          margin-bottom: 10px;
        }

        .tag {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 4px 8px;
          background: #e1e5e9;
          border-radius: 4px;
          font-size: 0.9em;
        }

        .remove-tag {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 1.2em;
          line-height: 1;
          padding: 0;
          color: #666;
        }

        .remove-tag:hover {
          color: #333;
        }

        .combobox-input {
          width: 100%;
          padding: 8px;
          border: 1px solid #ccc;
          border-radius: 4px;
          font-size: 1em;
        }

        .combobox-input:focus {
          outline: none;
          border-color: #007bff;
          box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
        }

        .combobox-input:disabled {
          background: #f8f9fa;
          cursor: not-allowed;
        }

        .suggestions {
          position: absolute;
          top: 100%;
          left: 0;
          right: 0;
          border: 1px solid #ccc;
          border-top: none;
          background: white;
          max-height: 200px;
          overflow-y: auto;
          z-index: 1000;
        }

        .suggestion {
          padding: 8px 12px;
          cursor: pointer;
          border-bottom: 1px solid #eee;
        }

        .suggestion:last-child {
          border-bottom: none;
        }

        .suggestion:hover,
        .suggestion.highlighted {
          background: #f0f0f0;
        }

        .controls {
          display: flex;
          gap: 10px;
        }

        .controls button {
          padding: 8px 16px;
          border: 1px solid #ccc;
          background: white;
          border-radius: 4px;
          cursor: pointer;
        }

        .controls button:hover {
          background: #f0f0f0;
        }
      `}</style>
    </ComboboxContext.Provider>
  );
}

// Available options (same as in machine.ts)
const AVAILABLE_TAGS = [
  "typescript", "javascript", "react", "vue", "angular",
  "node", "deno", "bun", "python", "rust",
  "go", "java", "kotlin", "swift", "dart"
];
