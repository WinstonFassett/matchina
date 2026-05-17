import { useMachine } from "matchina/react";
import { type TrafficLightMachine } from "./machine";

export const TrafficLightView = ({
  machine,
}: {
  machine: TrafficLightMachine;
}) => {
  useMachine(machine);
  const currentState = machine.getState();
  return (
    <div className="flex flex-col items-center gap-5">
      <div className="flex flex-col items-center gap-3 bg-[oklch(0.18_0.01_240)] rounded-2xl px-5 py-6 border border-[oklch(0.25_0.01_240)]">
        <div className={`w-14 h-14 rounded-full transition-all duration-200 shadow-lg ${currentState.is("Red") ? "bg-red-500 shadow-red-500/50" : "bg-[oklch(0.22_0.04_15)]"}`} />
        <div className={`w-14 h-14 rounded-full transition-all duration-200 shadow-lg ${currentState.is("Yellow") ? "bg-yellow-400 shadow-yellow-400/50" : "bg-[oklch(0.22_0.04_85)]"}`} />
        <div className={`w-14 h-14 rounded-full transition-all duration-200 shadow-lg ${currentState.is("Green") ? "bg-green-500 shadow-green-500/50" : "bg-[oklch(0.22_0.04_142)]"}`} />
      </div>

      <span className="badge badge-outline">{currentState.key}</span>

      <button className="btn btn-primary btn-sm" onClick={() => machine.next()}>
        Next Signal
      </button>
    </div>
  );
};
