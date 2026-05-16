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
    <div className="flex flex-col items-center gap-4">
      <div className="card card-md rounded-lg">
        <div className="flex flex-row space-x-4 items-center">
          <div className={`w-16 h-16 rounded-full ${currentState.is("Red") ? "bg-red-600" : "bg-red-900"}`} />
          <div className={`w-16 h-16 rounded-full ${currentState.is("Yellow") ? "bg-yellow-400" : "bg-yellow-900"}`} />
          <div className={`w-16 h-16 rounded-full ${currentState.is("Green") ? "bg-green-500" : "bg-green-900"}`} />
        </div>
      </div>

      <div className="badge badge-active">{currentState.key}</div>

      <button className="btn btn-primary" onClick={() => machine.next()}>
        Next Signal
      </button>
    </div>
  );
};
