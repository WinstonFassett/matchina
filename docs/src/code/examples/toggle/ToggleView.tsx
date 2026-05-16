import { type ToggleMachine } from "./machine";

export const ToggleView = ({ machine }: { machine: ToggleMachine }) => {
  const isOn = machine.getState().key === "On";

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex flex-col items-center gap-1">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">state</span>
        <span className="text-4xl font-semibold text-foreground tabular-nums">{isOn ? "On" : "Off"}</span>
      </div>

      <button
        className={`toggle-track ${isOn ? "toggle-track-on" : "toggle-track-off"}`}
        onClick={() => machine.api.toggle()}
        aria-label="Toggle"
        aria-pressed={isOn}
      >
        <span className={`toggle-thumb ${isOn ? "toggle-thumb-on" : "toggle-thumb-off"}`} />
      </button>

      <div className="flex gap-2">
        <button className={`btn btn-sm ${isOn ? "btn-outline" : "btn-primary"}`} onClick={() => machine.api.turnOn()} disabled={isOn}>
          Turn on
        </button>
        <button className={`btn btn-sm ${isOn ? "btn-primary" : "btn-outline"}`} onClick={() => machine.api.turnOff()} disabled={!isOn}>
          Turn off
        </button>
      </div>
    </div>
  );
};
