import { useMachine } from "matchina/react";
import { parseFlatStateKey } from "./machine-flat";

interface TrafficLightViewFlatProps {
  machine: any;
}

export function TrafficLightViewFlat({ machine }: TrafficLightViewFlatProps) {
  const change = useMachine(machine) as { to: { key: string; data?: any } };
  const state = change.to;
  const send = (event: string) => machine.send(event);

  const parsed = parseFlatStateKey(state.key);
  const parent = parsed.parent;
  const child = parsed.child;

  const isWorking = parent === "Working";
  const lightColor = child || "off";

  return (
    <div className="p-4 space-y-4 border rounded-lg bg-gray-50/50 dark:bg-gray-900/50">
      <div className="text-center">
        <div className="text-sm text-gray-500 mb-2">Controller: {parent}</div>

        {/* Traffic Light Display */}
        <div className="inline-block bg-gray-800 p-4 rounded-lg shadow-lg">
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
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 active:scale-95 transition-transform"
          >
            Tick
          </button>
        )}

        {parent === "Broken" && (
          <button
            onClick={() => send("repair")}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 active:scale-95 transition-transform"
          >
            Repair
          </button>
        )}

        {parent === "Maintenance" && (
          <button
            onClick={() => send("complete")}
            className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 active:scale-95 transition-transform"
          >
            Complete
          </button>
        )}

        {(isWorking || parent === "Broken") && (
          <button
            onClick={() => send("maintenance")}
            className="px-3 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 active:scale-95 transition-transform"
          >
            Maintenance
          </button>
        )}

        {isWorking && (
          <button
            onClick={() => send("break")}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 active:scale-95 transition-transform"
          >
            Break
          </button>
        )}
      </div>

      {/* State Info */}
      <div className="text-xs text-gray-400 text-center font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded">
        State Key: {state.key}
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
