import { type ToggleMachine } from "./machine";

// A toggle view component that uses the enhanced ToggleMachine
export const ToggleView = ({ machine }: { machine: ToggleMachine }) => {
  // Get current state
  const currentState = machine.getState();
  const isOn = currentState.key === "On";

  return (
    <div className="flex flex-col items-center">
      <div className="text-6xl font-bold mb-4">{isOn ? "ON" : "OFF"}</div>
      <div
        className={`w-16 h-8 rounded-full p-1 flex ${
          isOn ? "bg-blue-500 justify-end" : "bg-gray-300 justify-start"
        } transition-colors duration-200 cursor-pointer mb-4`}
        onClick={() => machine.api.toggle()}
      >
        <div className="bg-white rounded-full w-6 h-6 shadow-md"></div>
      </div>
      <div className="flex space-x-2">
        <button
          className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
          onClick={() => machine.api.turnOn()}
          disabled={isOn}
        >
          Turn On
        </button>
        <button
          className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
          onClick={() => machine.api.turnOff()}
          disabled={!isOn}
        >
          Turn Off
        </button>
      </div>
    </div>
  );
};
