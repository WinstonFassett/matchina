import React, { useContext, useEffect, useRef, useState } from "react";
import { eventApi } from "matchina";
import { useMachine } from "matchina/react";
import { parseFlatStateKey } from "./machine-flat";

const ComboboxContext = React.createContext<{
  machine: any;
  actions: any;
}>({ machine: null, actions: null });

function useComboboxContext() {
  return useContext(ComboboxContext);
}

interface ComboboxViewFlatProps {
  machine: any;
}

export function ComboboxViewFlat({ machine }: ComboboxViewFlatProps) {
  const change = useMachine(machine) as { to: { key: string; data?: any } };
  const state = change.to;
  const parsed = parseFlatStateKey(state.key);

  const actions = eventApi(machine);

  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync input value with machine state
  useEffect(() => {
    if (state.data?.input !== undefined) {
      setInputValue(state.data.input);
    }
  }, [state]);

  // Get current data
  const currentData = state.data || { input: "", selectedTags: [], suggestions: [], highlightedIndex: 0 };

  // Event handlers
  const handleInputChange = (value: string) => {
    setInputValue(value);
    const tags = currentData.selectedTags || [];
    actions.typed?.(value, tags);
  };

  const handleFocus = () => {
    actions.activate?.();
  };

  const handleBlur = () => {
    const tags = currentData.selectedTags || [];
    actions.deactivate?.(tags);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (parsed.parent !== 'Active') return;

    const { input = '', selectedTags = [], suggestions = [], highlightedIndex = 0 } = currentData;

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        actions.deactivate?.(selectedTags);
        break;
      case "ArrowDown":
        e.preventDefault();
        if (parsed.child === 'Suggesting') {
          actions.navigate?.(input, selectedTags, suggestions);
        } else if (parsed.child === 'Selecting') {
          actions.highlightNext?.(input, selectedTags, suggestions, highlightedIndex);
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (parsed.child === 'Selecting') {
          actions.highlightPrev?.(input, selectedTags, suggestions, highlightedIndex);
        }
        break;
      case "Enter":
        e.preventDefault();
        if (parsed.child === 'Selecting') {
          actions.selectHighlighted?.(suggestions, highlightedIndex, selectedTags);
        } else if (parsed.child === 'Suggesting' || parsed.child === 'TextEntry') {
          if (input.trim()) {
            actions.addTag?.(input.trim(), selectedTags);
          }
        }
        break;
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    const tags = currentData.selectedTags || [];
    actions.addTag?.(suggestion, tags);
  };

  const handleTagRemove = (tag: string) => {
    const tags = currentData.selectedTags || [];
    actions.removeTag?.(tag, tags);
  };

  return (
    <ComboboxContext.Provider value={{ machine, actions }}>
      <div className="combobox-demo">
        <div className="state-info">
          <div className="state-path">
            {parsed.full}
          </div>
          <div className="state-data">
            Selected: {currentData.selectedTags?.join(", ") || "None"}
          </div>
        </div>

        <div className="combobox-container">
          {/* Selected tags */}
          <div className="selected-tags">
            {(currentData.selectedTags || []).map((tag: string) => (
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
            placeholder={parsed.parent === "Inactive" ? "Click to focus..." : "Type to search..."}
            className="combobox-input"
            disabled={parsed.parent === "Inactive"}
          />

          {/* Suggestions dropdown */}
          {(parsed.child === "Suggesting" || parsed.child === "Selecting") &&
           currentData.suggestions?.length > 0 && (
            <div className="suggestions">
              {currentData.suggestions.map((suggestion: string, index: number) => (
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
          {parsed.parent === "Inactive" ? (
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
