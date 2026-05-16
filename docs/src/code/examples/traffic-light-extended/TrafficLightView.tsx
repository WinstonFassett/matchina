import { useMachine } from "matchina/react";
import { walkDuration, type ExtendedTrafficLightMachine } from "./machine";
import { useEffect, useState } from "react";
import { useIntervalEffect } from "./hooks";

export const ExtendedTrafficLightView = ({
  machine,
}: {
  machine: ExtendedTrafficLightMachine;
}) => {
  useMachine(machine);
  const currentState = machine.getState();
  const pedestrianSignal = currentState.data.pedestrian;

  useMachine(machine.data);
  const data = machine.data.getState();
  const walkWarningDuration = data.data.walkWarningDuration;

  const [timeRemaining, setTimeRemaining] = useState(currentState.data.duration);
  const [walkTimeRemaining, setWalkTimeRemaining] = useState(0);
  const [isBlinking, setIsBlinking] = useState(false);
  const [walkBlinking, setWalkBlinking] = useState(false);

  const progressPercent = Math.max(0, Math.min(100, (timeRemaining / currentState.data.duration) * 100));

  useEffect(() => {
    if (walkWarningDuration) setWalkTimeRemaining(walkWarningDuration);
    else setWalkTimeRemaining(0);
  }, [walkWarningDuration]);

  useEffect(() => {
    setTimeRemaining(currentState.data.duration);
  }, [currentState]);

  useIntervalEffect(() => setTimeRemaining((prev) => Math.max(0, prev - 100)), currentState.data.duration > 0 ? 100 : null);
  useIntervalEffect(() => setWalkTimeRemaining((prev) => Math.max(0, prev - 100)), walkTimeRemaining > 0 ? 100 : null);
  useIntervalEffect(() => setIsBlinking((prev) => !prev), currentState.is("FlashingYellow") || currentState.is("FlashingRed") ? 500 : null);
  useIntervalEffect(() => setWalkBlinking((prev) => !prev), walkTimeRemaining > 0 ? 500 : null);

  const notFlashing = !currentState.is("FlashingYellow") && !currentState.is("FlashingRed");

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex space-x-8 items-end">
        {/* Traffic light */}
        <div className="card card-md rounded-lg">
          <div className="flex flex-col space-y-4 items-center">
            <div className={`w-16 h-16 rounded-full ${currentState.match({ Red: () => "bg-red-600", RedWithPedestrianRequest: () => "bg-red-600", FlashingRed: () => (isBlinking ? "bg-red-600" : "bg-red-900"), _: () => "bg-red-900" }, false)}`} />
            <div className={`w-16 h-16 rounded-full ${currentState.match({ Yellow: () => "bg-yellow-400", FlashingYellow: () => (isBlinking ? "bg-yellow-400" : "bg-yellow-900"), _: () => "bg-yellow-900" }, false)}`} />
            <div className={`w-16 h-16 rounded-full ${currentState.match({ Green: () => "bg-green-500", _: () => "bg-green-900" }, false)}`} />
          </div>
        </div>

        {/* Pedestrian signal */}
        <div className="card card-md rounded-lg">
          <div className="flex flex-col items-center">
            <div className="h-8 flex items-center justify-center">
              {pedestrianSignal.match({
                Walk: () => <span className="text-green-500 text-2xl" style={walkTimeRemaining > 0 ? { opacity: walkBlinking ? 1 : 0.3 } : undefined}>🚶</span>,
                DontWalk: () => <span className="text-red-500 text-2xl">✋</span>,
                Error: () => <span className="text-warn text-2xl">⚠️</span>,
              })}
            </div>
            <div className="text-sm text-center w-16 h-8 flex items-center justify-center text-foreground">
              {pedestrianSignal.match({ Walk: () => "WALK", DontWalk: () => "DON'T WALK", Error: () => "ERROR" })}
            </div>
            <div className="h-4 flex items-center justify-center">
              {walkTimeRemaining > 0
                ? <div className="text-warn font-mono text-center">{`${(walkTimeRemaining / 1000).toFixed(1)}s`}</div>
                : <div className="invisible">0.0s</div>}
            </div>
          </div>
        </div>
      </div>

      {notFlashing && (
        <div className="flex flex-col items-center gap-1 w-64">
          <div className="w-full h-2 bg-muted rounded-full">
            <div
              className={`h-full rounded-full transition-all ${currentState.match({ Green: () => "bg-green-500", Yellow: () => "bg-yellow-400", Red: () => "bg-red-600", RedWithPedestrianRequest: () => "bg-red-600" }, false)}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground">Light Countdown</span>
        </div>
      )}

      {walkWarningDuration && walkTimeRemaining > 0 && (
        <div className="flex flex-col items-center gap-1 w-64">
          <div className="w-full h-2 bg-muted rounded-full">
            <div className="h-full rounded-full bg-yellow-500" style={{ width: `${(walkTimeRemaining / walkDuration) * 100}%` }} />
          </div>
          <span className="text-xs text-muted-foreground">Walk Countdown</span>
        </div>
      )}

      <div className="text-xl font-bold text-foreground">{currentState.data.message}</div>

      <div className="badge badge-active">{currentState.key}</div>

      {notFlashing && (
        <div className="flex gap-3">
          <button className="btn btn-primary" onClick={() => machine.api.next()}>Next Signal</button>
          {!data.data.crossingRequested
            ? <button className="btn btn-outline" onClick={() => machine.requestCrossing()}>Request Crossing</button>
            : <button className="btn btn-outline" disabled>Crossing Requested</button>}
        </div>
      )}

      <div className="flex gap-3">
        {notFlashing ? (
          <>
            <button className="btn btn-outline" onClick={() => machine.api.emergency()}>Emergency Mode</button>
            <button className="btn btn-destructive" onClick={() => machine.api.malfunction()}>Malfunction</button>
          </>
        ) : (
          <button className="btn btn-primary" onClick={() => machine.api.reset()}>Reset to Normal</button>
        )}
      </div>
    </div>
  );
};
