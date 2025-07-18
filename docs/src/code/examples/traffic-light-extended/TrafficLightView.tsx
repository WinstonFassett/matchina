import { useMachine } from "@lib/src/integrations/react";
import { walkDuration, type ExtendedTrafficLightMachine } from "./machine";
import { useEffect, useState } from "react";

export const ExtendedTrafficLightView = ({
  machine
}: {
  machine: ExtendedTrafficLightMachine
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

  const progressPercent = Math.max(0, Math.min(100, (timeRemaining / currentState.data.duration) * 100));
  
  // Handle the pedestrian walk warning
  useEffect(() => {
    if (walkWarningDuration) {
      setWalkTimeRemaining(walkWarningDuration);
      const timer = setInterval(() => {
        setWalkTimeRemaining(prev => Math.max(0, prev - 100));
      }, 100);
      return () => clearInterval(timer);
    } else {
      setWalkTimeRemaining(0);
    }
  }, [walkWarningDuration]);
  
  // Handle normal light countdown
  useEffect(() => {
    setTimeRemaining(currentState.data.duration);
    if (currentState.data.duration > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => Math.max(0, prev - 100));
      }, 100);
      return () => clearInterval(timer);
    }
  }, [currentState]);

  // Handle flashing states in the UI
  useEffect(() => {
    if (currentState.is("FlashingYellow") || currentState.is("FlashingRed")) {
      // Set up blinking for flashing states
      const blinkTimer = setInterval(() => {
        setIsBlinking(prev => !prev);
      }, 500); // Blink every 500ms
      
      return () => clearInterval(blinkTimer);
    } else {
      setIsBlinking(false);
    }
  }, [currentState.key]);

  return (
    <div className="flex flex-col items-center">
      <div className="flex space-x-8 mb-4">
        {/* Traffic light */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex flex-col space-y-4 items-center">
            {/* Red light */}
            <div 
              className={`w-16 h-16 rounded-full ${currentState.match({
                Red: () => "bg-red-600",              
                RedWithPedestrianRequest: () => "bg-red-600",
                FlashingRed: () => isBlinking ? "bg-red-600" : "bg-red-900",
                _: ()=> "bg-red-900"
              }, false)}`}
            />
            {/* Yellow light */}
            <div 
              className={`w-16 h-16 rounded-full ${currentState.match({
                Yellow: () => "bg-yellow-400",
                FlashingYellow: () => isBlinking ? "bg-yellow-400" : "bg-yellow-900",
                _: () => "bg-yellow-900"
              }, false)}`}
            />
            {/* Green light */}
            <div 
              className={`w-16 h-16 rounded-full ${currentState.match({
                Green: () => "bg-green-500",
                _: () => "bg-green-900"
              }, false)}`}
            />
          </div>
        </div>
        
        {/* Pedestrian signal */}
        <div className="bg-gray-800 p-4 rounded-lg flex flex-col items-center">
          <div className="w-16 h-16 rounded flex items-center justify-center mb-2">
            {pedestrianSignal.match({
              Walk: () => <span className="text-green-500 text-2xl">🚶</span>,
              DontWalk: () => <span className="text-red-500 text-2xl">✋</span>,
              Error: () => <span className="text-yellow-500 text-2xl">⚠️</span>,
            })}
          </div>
          <div className="text-sm text-center">
            {pedestrianSignal.match({
              Walk: () => "WALK",
              DontWalk: () => "DON'T WALK",
              Error: () => "ERROR",
            })}
          </div>
          {walkTimeRemaining > 0 && (
            <div className="ml-2 text-yellow-600 font-mono">
              {`${(walkTimeRemaining / 1000).toFixed(1)}s`}
            </div>
          )}
        </div>
      </div>

      {/* Light Countdown - only show for non-flashing states */}
      {!currentState.is("FlashingYellow") && !currentState.is("FlashingRed") && (
        <>
          <div className="w-64 h-2 bg-gray-200 rounded-full mb-2">
            <div 
              className={`h-full rounded-full ${currentState.match({
                Green: () => "bg-green-500",
                Yellow: () => "bg-yellow-400",
                Red: () => "bg-red-600",
                RedWithPedestrianRequest: () => "bg-red-600",
              }, false)}`}
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-600 mb-2">Light Countdown</div>
        </>
      )}

      {/* Walk Countdown */}
      {walkWarningDuration && walkTimeRemaining > 0 && (
        <>
          <div className="w-64 h-2 bg-gray-200 rounded-full mb-2">
            <div 
              className={`h-full rounded-full bg-yellow-500`}
              style={{ width: `${(walkTimeRemaining / walkDuration) * 100}%` }}
            ></div>
          </div>
          <div className="text-xs text-gray-600 mb-2">Walk Countdown</div>
        </>
      )}
      
      <div className="text-xl font-bold mb-2">
        {currentState.data.message}
      </div>
      
      <div className="text-sm mb-4">
        Current state: <span className="font-mono">{currentState.key}</span>
      </div>
      
      <div className="flex space-x-4 mb-4">
        {!currentState.is("FlashingYellow") && !currentState.is("FlashingRed") && (
          <>
            <button
              className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
              onClick={() => machine.api.next()}>
              Next Signal
            </button>
            {
              !data.data.crossingRequested ? 
                <button
                  className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
                  onClick={() => machine.requestCrossing()}
                >
                  Request Crossing
                </button>
                :
                <button
                  className="px-4 py-2 rounded bg-gray-500 text-white hover:bg-gray-600"
                  disabled>
                  Crossing Requested
                </button>
            }
          </>
        )}
      </div>
      
      {/* Special mode controls */}
      <div className="flex space-x-4">
        {!currentState.is("FlashingYellow") && !currentState.is("FlashingRed") ? (
          <>
            <button
              className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600"
              onClick={() => machine.api.emergency()}>
              Emergency Mode
            </button>
            <button
              className="px-4 py-2 rounded bg-red-500 text-white hover:bg-red-600"
              onClick={() => machine.api.malfunction()}>
              Malfunction
            </button>
          </>
        ) : (
          <button
            className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
            onClick={() => machine.api.reset()}>
            Reset to Normal
          </button>
        )}
      </div>
    </div>
  );
};
