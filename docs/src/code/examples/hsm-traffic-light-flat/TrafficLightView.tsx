import { useMachine } from "matchina/react";
import { createTrafficLightMachine, parseStateKey } from "./machine";

interface TrafficLightViewProps {
  machine: ReturnType<typeof createTrafficLightMachine>;
}

export function TrafficLightView({ machine }: TrafficLightViewProps) {
  const change = useMachine(machine);
  const state = change.to;
  const send = (event: string) => machine.send(event);
  const { parent, child } = parseStateKey(state.key);

  const isWorking = parent === "Working";
  const lightColor = child || "off";

  return (
    <div className="p-4 space-y-4">
      <div className="text-center">
        <div className="text-sm text-gray-500 mb-2">Controller: {parent}</div>
        
        {/* Traffic Light Display */}
        <div className="inline-block bg-gray-800 p-4 rounded-lg">
          <div className="space-y-2">
            <Light color="red" active={isWorking && lightColor === "Red"} />
            <Light color="yellow" active={isWorking && lightColor === "Yellow"} />
            <Light color="green" active={isWorking && lightColor === "Green"} />
          </div>
        </div>

        {child && (
          <div className="text-sm text-gray-500 mt-2">Light: {child}</div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 justify-center">
        {isWorking && (
          <button
            onClick={() => send("tick")}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Tick
          </button>
        )}
        
        {parent === "Broken" && (
          <button
            onClick={() => send("repair")}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Repair
          </button>
        )}

        {parent === "Maintenance" && (
          <button
            onClick={() => send("complete")}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Complete
          </button>
        )}

        {(isWorking || parent === "Broken") && (
          <button
            onClick={() => send("maintenance")}
            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
          >
            Maintenance
          </button>
        )}

        {isWorking && (
          <button
            onClick={() => send("break")}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Break
          </button>
        )}
      </div>

      {/* State Info */}
      <div className="text-xs text-gray-400 text-center">
        Full state key: <code>{state.key}</code>
      </div>
    </div>
  );
}

function Light({ color, active }: { color: string; active: boolean }) {
  const colorClasses: Record<string, string> = {
    red: active ? "bg-red-500" : "bg-red-900",
    yellow: active ? "bg-yellow-400" : "bg-yellow-900",
    green: active ? "bg-green-500" : "bg-green-900",
  };

  return (
    <div
      className={`w-12 h-12 rounded-full ${colorClasses[color]} transition-colors duration-300`}
      style={{
        boxShadow: active ? `0 0 20px ${color}` : "none",
      }}
    />
  );
}

export default TrafficLightView;
