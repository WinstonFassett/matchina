import { useMemo } from "react";
import { useMachine } from "matchina/react";
import { MachineExampleWithChart } from "@components/MachineExampleWithChart";
import { createToggleMachine } from "./machine";

// A simple toggle example with a custom view
const ToggleView = ({ machine }: { machine: ReturnType<typeof createToggleMachine> }) => {
  return (
    <div className="flex flex-col items-center">
      <div 
        className={`w-16 h-8 rounded-full p-1 flex ${
          machine.state.is("On") ? "bg-blue-500 justify-end" : "bg-gray-300 justify-start"
        } transition-colors duration-200`}
        onClick={() => machine.toggle()}
      >
        <div className="bg-white rounded-full w-6 h-6 shadow-md"></div>
      </div>
      <p className="mt-2 text-center">
        Current state: <strong>{machine.state.key}</strong>
      </p>
      <div className="mt-4">
        <button 
          className="mr-2 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
          onClick={() => machine.turnOn()}>
          Turn On
        </button>
        <button 
          className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
          onClick={() => machine.turnOff()}>
          Turn Off
        </button>
      </div>
    </div>
  );
};

// Main export for importing in MDX documentation
export default function ToggleExample() {
  const toggle = useMemo(createToggleMachine, []);
  useMachine(toggle.machine);
  return <MachineExampleWithChart machine={toggle} AppView={ToggleView} />;
}

// For backward compatibility
export function Toggle() {
  const toggle = useMemo(createToggleMachine, []);
  useMachine(toggle.machine);
  return <ToggleView machine={toggle} />;
}
