import { useMemo, useState } from "react";
import { MachineVisualizer } from "@components/MachineVisualizer";
import { createFlatCheckoutMachine } from "./machine-flat";
import { createCheckoutMachine } from "./machine";
import { CheckoutViewNested } from "./CheckoutViewNested";
import { CheckoutViewFlat } from "./CheckoutViewFlat";

type Mode = "flat" | "nested";

export default function CheckoutExample() {
  const [mode, setMode] = useState<Mode>("nested");
  
  // Create separate machines for each mode
  const flatMachine = useMemo(() => createFlatCheckoutMachine(), []);
  const nestedMachine = useMemo(() => createCheckoutMachine(), []);
  const machine = mode === "flat" ? flatMachine : nestedMachine;

  return (
    <div className="space-y-6">
      {/* Mode Toggle - Sticky below header */}
      <div className="flex justify-center mb-6 sticky top-16 z-10 py-2 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm -mx-4 px-4">
        <div className="inline-flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setMode("nested")}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              mode === "nested"
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Nested
          </button>
          <button
            onClick={() => setMode("flat")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "flat"
                ? "bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm"
                : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            Flattened
          </button>
        </div>
      </div>
      
      <MachineVisualizer
        key={mode} // Force re-mount of visualizer when mode changes
        machine={machine}
        title={`State Machine Visualizer (${mode === "flat" ? "Flattened" : "Nested"})`}
        defaultViz="reactflow"
        interactive={true}
        layout="stacked"
        AppView={mode === "flat" ? CheckoutViewFlat : CheckoutViewNested}
      />
    </div>
  );
}
