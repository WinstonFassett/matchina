import { useMachine } from "matchina/react";

interface TrafficLightViewFlatProps {
  machine: any;
}

export function TrafficLightViewFlat({ machine }: TrafficLightViewFlatProps) {
  const change = useMachine(machine) as { to: { key: string; data?: any } };
  const state = change.to;
  const send = (event: string) => machine.send(event);

  const stateInfo = state.key.split(".").reduce(
    (acc, part, index, parts) => {
      if (index === 0) {
        acc.parent = part;
        acc.child = parts.length > 1 ? parts[1] : undefined;
      }
      return acc;
    },
    { parent: "", child: undefined as string | undefined }
  );

  const parent = stateInfo.parent;
  const child = stateInfo.child;
  const isWorking = parent === "Working";
  const lightColor = child || "off";

  return (
    <div className="card card-md space-y-4">
      <div className="text-center space-y-2">
        <div className="badge badge-default">Controller: {parent}</div>

        <div className="card card-md inline-block rounded-lg shadow-lg">
          <div className="space-y-2">
            <Light color="red" active={isWorking && lightColor === "Red"} />
            <Light color="yellow" active={isWorking && lightColor === "Yellow"} />
            <Light color="green" active={isWorking && lightColor === "Green"} />
          </div>
        </div>

        {child && <div className="badge badge-active">Light: {child}</div>}
      </div>

      <div className="flex flex-wrap gap-2 justify-center">
        {isWorking && <button onClick={() => send("tick")} className="btn btn-primary btn-sm">Tick</button>}
        {parent === "Broken" && <button onClick={() => send("repair")} className="btn btn-outline btn-sm">Repair</button>}
        {parent === "Maintenance" && <button onClick={() => send("complete")} className="btn btn-outline btn-sm">Complete</button>}
        {(isWorking || parent === "Broken") && <button onClick={() => send("maintenance")} className="btn btn-outline btn-sm">Maintenance</button>}
        {isWorking && <button onClick={() => send("break")} className="btn btn-destructive btn-sm">Break</button>}
      </div>

      <div className="text-xs text-muted-foreground text-center font-mono bg-muted p-2 rounded">
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
      style={{ boxShadow: active ? `0 0 20px ${color}` : "none" }}
    />
  );
}
