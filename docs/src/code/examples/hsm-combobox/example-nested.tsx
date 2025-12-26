import { useMemo, useState } from "react";
import { eventApi } from "matchina";
import { createComboboxMachine } from "./machine";
import { ComboboxNestedView } from "./ComboboxNestedView";
import { VisualizerDemo } from "@components/HSMVisualizerDemo";

export default function NestedComboboxExample() {
  const [started, setStarted] = useState(false);
  
  // Create machine and auto-start in Active state for visualization
  const machine = useMemo(() => {
    const m = createComboboxMachine();
    // Auto-focus to show hierarchy
    setTimeout(() => {
      m.send("focus");
      setStarted(true);
    }, 100);
    return m;
  }, []);

  const actions = useMemo(() => eventApi(machine), [machine]);

  return (
    <div className="combobox-example">
      <VisualizerDemo 
        machine={machine}
        actions={actions}
        title="Hierarchical Combobox (Nested)"
        description="A combobox with nested states using submachine and createHierarchicalMachine"
      />
      
      <div className="combobox-ui">
        <ComboboxNestedView machine={machine} />
      </div>
      
      <div className="controls">
        <button onClick={() => actions.focus()}>
          Focus (Show Nested States)
        </button>
        <button onClick={() => actions.blur()}>
          Blur (Go Inactive)
        </button>
      </div>
      
      {!started && (
        <div className="note">
          Auto-focusing to show nested hierarchy in visualization...
        </div>
      )}
    </div>
  );
}
