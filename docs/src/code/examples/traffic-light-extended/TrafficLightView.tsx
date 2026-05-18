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

  const bulbRed = currentState.match(
    {
      Red: () => "bg-red-500 shadow-lg shadow-red-500/50",
      RedWithPedestrianRequest: () => "bg-red-500 shadow-lg shadow-red-500/50",
      FlashingRed: () => (isBlinking ? "bg-red-500 shadow-lg shadow-red-500/50" : "bg-[oklch(0.22_0.04_15)]"),
      _: () => "bg-[oklch(0.22_0.04_15)]",
    },
    false,
  );

  const bulbYellow = currentState.match(
    {
      Yellow: () => "bg-yellow-400 shadow-lg shadow-yellow-400/50",
      FlashingYellow: () => (isBlinking ? "bg-yellow-400 shadow-lg shadow-yellow-400/50" : "bg-[oklch(0.22_0.04_85)]"),
      _: () => "bg-[oklch(0.22_0.04_85)]",
    },
    false,
  );

  const bulbGreen = currentState.match(
    {
      Green: () => "bg-green-500 shadow-lg shadow-green-500/50",
      _: () => "bg-[oklch(0.22_0.04_142)]",
    },
    false,
  );

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Housings row */}
      <div className="flex flex-row items-end gap-6">
        {/* Traffic light housing */}
        <div className="flex flex-col items-center gap-3 bg-[oklch(0.18_0.01_240)] rounded-2xl px-5 py-6 border border-[oklch(0.25_0.01_240)]">
          <div className={`w-14 h-14 rounded-full transition-all duration-200 ${bulbRed}`} />
          <div className={`w-14 h-14 rounded-full transition-all duration-200 ${bulbYellow}`} />
          <div className={`w-14 h-14 rounded-full transition-all duration-200 ${bulbGreen}`} />
        </div>

        {/* Pedestrian signal housing */}
        <div className="flex flex-col items-center gap-2 bg-[oklch(0.18_0.01_240)] rounded-2xl px-4 py-5 border border-[oklch(0.25_0.01_240)]">
          <div className="h-10 flex items-center justify-center">
            {pedestrianSignal.match({
              Walk: () => (
                <span
                  className="text-green-400 text-3xl"
                  style={walkTimeRemaining > 0 ? { opacity: walkBlinking ? 1 : 0.25 } : undefined}
                >
                  🚶
                </span>
              ),
              DontWalk: () => <span className="text-red-400 text-3xl">✋</span>,
              Error: () => <span className="text-yellow-400 text-3xl">⚠️</span>,
            })}
          </div>
          <div className="text-[9px] font-mono uppercase tracking-widest text-center text-[oklch(0.55_0.02_240)] w-16">
            {pedestrianSignal.match({
              Walk: () => "Walk",
              DontWalk: () => "Don't Walk",
              Error: () => "Error",
            })}
          </div>
          <div className="h-5 flex items-center justify-center">
            {walkTimeRemaining > 0 ? (
              <span className="text-yellow-400 font-mono text-xs tabular-nums">
                {(walkTimeRemaining / 1000).toFixed(1)}s
              </span>
            ) : (
              <span className="invisible text-xs">0.0s</span>
            )}
          </div>
        </div>
      </div>

      {/* Progress bars */}
      {notFlashing && (
        <div className="flex flex-col items-center gap-1 w-64">
          <div className="w-full h-1.5 bg-[oklch(0.20_0.01_240)] rounded-full">
            <div
              className={`h-full rounded-full transition-all ${currentState.match(
                {
                  Green: () => "bg-green-500",
                  Yellow: () => "bg-yellow-400",
                  Red: () => "bg-red-500",
                  RedWithPedestrianRequest: () => "bg-red-500",
                },
                false,
              )}`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="text-[9px] font-mono uppercase tracking-widest text-[oklch(0.40_0.01_240)]">
            Light countdown
          </span>
        </div>
      )}

      {walkWarningDuration && walkTimeRemaining > 0 && (
        <div className="flex flex-col items-center gap-1 w-64">
          <div className="w-full h-1.5 bg-[oklch(0.20_0.01_240)] rounded-full">
            <div
              className="h-full rounded-full bg-yellow-400"
              style={{ width: `${(walkTimeRemaining / walkDuration) * 100}%` }}
            />
          </div>
          <span className="text-[9px] font-mono uppercase tracking-widest text-[oklch(0.40_0.01_240)]">
            Walk countdown
          </span>
        </div>
      )}

      {/* State message */}
      <div className="text-sm font-medium text-foreground">{currentState.data.message}</div>

      {/* State badge */}
      <span className="badge badge-outline text-[10px]">{currentState.key}</span>

      {/* Controls */}
      {notFlashing && (
        <div className="flex gap-3">
          <button className="btn btn-primary btn-sm" onClick={() => machine.api.next()}>
            Next Signal
          </button>
          {!data.data.crossingRequested ? (
            <button className="btn btn-outline btn-sm" onClick={() => machine.requestCrossing()}>
              Request Crossing
            </button>
          ) : (
            <button className="btn btn-outline btn-sm" disabled>
              Crossing Requested
            </button>
          )}
        </div>
      )}

      <div className="flex gap-3">
        {notFlashing ? (
          <>
            <button className="btn btn-outline btn-sm" onClick={() => machine.api.emergency()}>
              Emergency
            </button>
            <button className="btn btn-destructive btn-sm" onClick={() => machine.api.malfunction()}>
              Malfunction
            </button>
          </>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={() => machine.api.reset()}>
            Reset to Normal
          </button>
        )}
      </div>
    </div>
  );
};
