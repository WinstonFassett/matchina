import { type ExtendedTrafficLightMachine } from "./machine";
import { useEffect, useState } from "react";

export const ExtendedTrafficLightView = ({
  machine
}: {
  machine: ExtendedTrafficLightMachine
}) => {
  const currentState = machine.getState();
  const stateMessage = currentState.data.message;
  const pedestrianSignal = currentState.data.pedestrianSignal;
  
  // For flashing pedestrian signal
  const [flashVisible, setFlashVisible] = useState(true);
  
  // Flash the pedestrian signal when in flashing state
  useEffect(() => {
    if (pedestrianSignal === 'flashing') {
      const interval = setInterval(() => {
        setFlashVisible(prev => !prev);
      }, 500); // Flash every 500ms
      
      return () => clearInterval(interval);
    } else {
      setFlashVisible(true);
    }
  }, [pedestrianSignal]);
  
  // Determine if pedestrian can cross
  const showWalkSignal = pedestrianSignal === 'walk' || 
    (pedestrianSignal === 'flashing' && flashVisible);
  
  // Determine if pedestrian button is requesting
  const pedestrianRequested = currentState.data.pedestrianRequested;
  
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
                RedWithPedestrian: () => "bg-red-600",
                PedestrianFlashing: () => "bg-red-600",
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
            {showWalkSignal ? (
              <span className="text-green-500 text-2xl">🚶</span>
            ) : (
              <span className="text-red-500 text-2xl">✋</span>
            )}
          </div>
          <div className="text-sm text-center">
            {currentState.match({
              RedWithPedestrian: () => "WALK",
              PedestrianFlashing: () => "DON'T WALK",
              _: () => "DON'T WALK"
            }, false)}
          </div>
        </div>
      </div>
      
      <div className="text-xl font-bold mb-2">
        {stateMessage}
      </div>
      
      <div className="text-sm mb-4">
        Current state: <span className="font-mono">{currentState.key}</span>
        {pedestrianRequested && 
          <span className="ml-2 bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
            Pedestrian waiting
          </span>
        }
      </div>
      
      <div className="flex space-x-4">
        <button
          className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
          onClick={() => machine.api.next()}>
          Next Signal
        </button>
        
        <button
          className="px-4 py-2 rounded bg-green-500 text-white hover:bg-green-600"
          onClick={() => machine.api.pedestrianButton()}
          disabled={pedestrianRequested}>
          Request Crossing
        </button>
      </div>
    </div>
  );
};
