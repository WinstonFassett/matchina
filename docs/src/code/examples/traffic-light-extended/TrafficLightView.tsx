import { useMachine } from "@lib/src/integrations/react";
import { type ExtendedTrafficLightMachine } from "./machine";
import { useEffect, useState } from "react";

export const ExtendedTrafficLightView = ({
  machine
}: {
  machine: ExtendedTrafficLightMachine
}) => {
  const currentState = machine.getState();
  // const stateKey = currentState.key;
  
  // For flashing pedestrian signal
  // const [flashVisible, setFlashVisible] = useState(true);
  const [isFlashing, setIsFlashing] = useState(false);
  
  // For countdown timer
  const [timeRemaining, setTimeRemaining] = useState(currentState.data.duration);
  // const [currentStateKey, setCurrentStateKey] = useState(currentState.key);
  
  useMachine(machine.data)
  const data = machine.data.getState()
  useEffect(() => {
    console.log("Traffic light data updated:", data);
  }, [data])
  // // Handle state changes and timer
  // useEffect(() => {
  //   // Reset timer when state changes
  //   if (currentStateKey !== currentState.key) {
  //     setCurrentStateKey(currentState.key);
  //     setTimeRemaining(currentState.data.duration);
  //   }
    
  //   // Set up auto-transition timer
  //   const timer = setTimeout(() => {
  //     // When time is up, transition to next state
  //     machine.api.next();
  //   }, timeRemaining);
    
  //   // Clean up timer on state change
  //   return () => clearTimeout(timer);
  // }, [currentState.key, timeRemaining, machine]);
  
  // // Update countdown timer
  useEffect(() => {
    setTimeRemaining(currentState.data.duration);
    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 100));
    }, 100);    
    return () => clearInterval(timer);
  }, [currentState]);
  
  
  // // For pedestrian signal logic
  // useEffect(() => {
  //   // If we're in Red state and time remaining is less than 3 seconds, start flashing
  //   if (currentState.is("Red") && machine.crossingRequested && 
  //       timeRemaining < 3000) {
  //     setIsFlashing(true);
  //   } else {
  //     setIsFlashing(false);
  //     setFlashVisible(true);
  //   }
  // }, [currentState, timeRemaining, machine.crossingRequested]);
  
  // Flash the pedestrian signal 
  // useEffect(() => {
  //   if (isFlashing) {
  //     const interval = setInterval(() => {
  //       setFlashVisible(prev => !prev);
  //     }, 500); // Flash every 500ms
      
  //     return () => clearInterval(interval);
  //   }
  // }, [isFlashing]);
  
  // Determine if pedestrian can cross
  const machineState = machine.data.getState();

  // const showWalkSignal = currentState.is("Red") && machineState.crossingRequested;
  const pedestrianSignal = currentState.data.pedestrian;
  
  // Calculate progress percentage
  const progressPercent = Math.max(0, Math.min(100, (timeRemaining / currentState.data.duration) * 100));
  
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
                _: ()=> "bg-red-900"
              }, false)}`}
            />
            {/* Yellow light */}
            <div 
              className={`w-16 h-16 rounded-full ${currentState.match({
                Yellow: () => "bg-yellow-400",
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
        </div>
      </div>
      
      {/* Progress bar */}
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
      
      <div className="text-xl font-bold mb-2">
        {currentState.data.message}
      </div>
      
      <div className="text-sm mb-4">
        Current state: <span className="font-mono">{currentState.key}</span>
        {isFlashing && 
          <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
            Flashing
          </span>
        }
      </div>
      
      <div className="flex space-x-4">
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
      </div>
    </div>
  );
};
