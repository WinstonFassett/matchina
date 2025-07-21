import { useMachine } from "@lib/src/integrations/react";
import { type TrafficLightMachine } from "./machine";

export const TrafficLightView = ({
  machine,
}: {
  machine: TrafficLightMachine;
}) => {
  useMachine(machine);
  const currentState = machine.getState();
  const stateMessage = currentState.data.message;
  return (
    <div className="flex flex-col items-center">
      <div className="bg-gray-800 p-4 rounded-lg mb-4">
        <div className="flex flex-col space-y-4 items-center">
          {/* Red light */}
          <div
            className={`w-16 h-16 rounded-full ${
              currentState.is("Red") ? "bg-red-600" : "bg-red-900"
            }`}
          />
          {/* Yellow light */}
          <div
            className={`w-16 h-16 rounded-full ${
              currentState.is("Yellow") ? "bg-yellow-400" : "bg-yellow-900"
            }`}
          />
          {/* Green light */}
          <div
            className={`w-16 h-16 rounded-full ${
              currentState.is("Green") ? "bg-green-500" : "bg-green-900"
            }`}
          />
        </div>
      </div>

      <div className="text-xl font-bold mb-4">{stateMessage}</div>

      <div className="text-sm mb-4">
        Current state: <span className="font-mono">{currentState.key}</span>
      </div>

      <button
        className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
        onClick={() => machine.next()}
      >
        Next Signal
      </button>
    </div>
  );
};
