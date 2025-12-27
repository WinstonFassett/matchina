import { useMemo, useState } from "react";
import { eventApi } from "matchina";
import { createFlatComboboxMachine } from "./machine-flat";
import { createComboboxMachine } from "./machine";
import { ComboboxView } from "./ComboboxView";
import { ComboboxViewFlat } from "./ComboboxViewFlat";
import { VisualizerDemo } from "@components/HSMVisualizerDemo";

type Mode = "flat" | "nested";

export default function ComboboxExample() {
  const [mode, setMode] = useState<Mode>("flat");
  
  // Re-create machine when mode changes
  const machine = useMemo(() => {
    return mode === "flat" 
      ? createFlatComboboxMachine() 
      : createComboboxMachine();
  }, [mode]);

  const actions = useMemo(() => eventApi(machine), [machine]);

  return (
    <div className="space-y-6">
      {/* Mode Toggle - Sticky below header */}
      <div className="flex justify-center mb-6 sticky top-16 z-10 py-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm -mx-4 px-4">
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setMode("flat")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "flat"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Flattened
          </button>
          <button
            onClick={() => setMode("nested")}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              mode === "nested"
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Nested (Hierarchical)
          </button>
        </div>
      </div>

      {mode === "flat" ? (
        <ComboboxViewFlat machine={machine} />
      ) : (
        <ComboboxView machine={machine} />
      )}
      
      <VisualizerDemo
        key={mode} // Force re-mount of visualizer when mode changes
        machine={machine}
        actions={actions}
        title={`State Machine Visualizer (${mode === "flat" ? "Flattened" : "Nested"})`}
        defaultVisualizer="sketch"
        interactive={true}
      />
    </div>
  );
}
