import { exBtn, exStateDisplay, exToggleTrack, exToggleThumb } from "@/lib/example-ui";
import { type ToggleMachine } from "./machine";

const { root, label, value } = exStateDisplay();

export const ToggleView = ({ machine }: { machine: ToggleMachine }) => {
  const isOn = machine.getState().key === "On";

  return (
    <div className="flex flex-col items-center gap-6">
      <div className={root()}>
        <span className={label()}>state</span>
        <span className={value()}>{isOn ? "On" : "Off"}</span>
      </div>

      <button
        className={exToggleTrack({ checked: isOn })}
        onClick={() => machine.api.toggle()}
        aria-label="Toggle"
        aria-pressed={isOn}
      >
        <span className={exToggleThumb({ checked: isOn })} />
      </button>

      <div className="flex gap-2">
        <button className={exBtn({ variant: isOn ? "outline" : "default", size: "sm" })} onClick={() => machine.api.turnOn()} disabled={isOn}>
          Turn on
        </button>
        <button className={exBtn({ variant: isOn ? "default" : "outline", size: "sm" })} onClick={() => machine.api.turnOff()} disabled={!isOn}>
          Turn off
        </button>
      </div>
    </div>
  );
};
