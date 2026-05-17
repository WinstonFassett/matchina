import { useMachine } from "matchina/react";

interface TrafficLightViewFlatProps {
  machine: any;
}

const glowColor: Record<string, string> = {
  red: "shadow-red-500/60",
  yellow: "shadow-yellow-400/60",
  green: "shadow-green-500/60",
};

function Light({ color, active }: { color: "red" | "yellow" | "green"; active: boolean }) {
  const offColor = { red: "bg-[oklch(0.22_0.04_15)]", yellow: "bg-[oklch(0.22_0.04_85)]", green: "bg-[oklch(0.22_0.04_142)]" }[color];
  const onColor = { red: "bg-red-500", yellow: "bg-yellow-400", green: "bg-green-500" }[color];
  return (
    <div
      className={`w-12 h-12 rounded-full transition-all duration-200 ${active ? `${onColor} shadow-lg ${glowColor[color]}` : offColor}`}
    />
  );
}

export function TrafficLightViewFlat({ machine }: TrafficLightViewFlatProps) {
  const change = useMachine(machine) as { to: { key: string; data?: any } };
  const state = change.to;
  const send = (event: string) => machine.send(event);

  const parts = state.key.split(".");
  const parent = parts[0];
  const child = parts[1] as string | undefined;
  const isWorking = parent === "Working";
  const lightColor = child ?? "off";

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Housing */}
      <div className="flex flex-col items-center gap-3 bg-[oklch(0.18_0.01_240)] rounded-2xl px-5 py-6 border border-[oklch(0.25_0.01_240)]">
        <Light color="red" active={isWorking && lightColor === "Red"} />
        <Light color="yellow" active={isWorking && lightColor === "Yellow"} />
        <Light color="green" active={isWorking && lightColor === "Green"} />
      </div>

      {/* State badges */}
      <div className="flex gap-2 flex-wrap justify-center">
        <span className="badge badge-outline text-[10px] font-mono">{parent}</span>
        {child && <span className="badge badge-outline text-[10px] font-mono">{child}</span>}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 justify-center">
        {isWorking && (
          <button onClick={() => send("tick")} className="btn btn-primary btn-sm">Tick</button>
        )}
        {parent === "Broken" && (
          <button onClick={() => send("repair")} className="btn btn-outline btn-sm">Repair</button>
        )}
        {parent === "Maintenance" && (
          <button onClick={() => send("complete")} className="btn btn-outline btn-sm">Complete</button>
        )}
        {(isWorking || parent === "Broken") && (
          <button onClick={() => send("maintenance")} className="btn btn-outline btn-sm">Maintenance</button>
        )}
        {isWorking && (
          <button onClick={() => send("break")} className="btn btn-destructive btn-sm">Break</button>
        )}
      </div>
    </div>
  );
}
