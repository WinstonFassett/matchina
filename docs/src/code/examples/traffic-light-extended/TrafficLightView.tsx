import { type ExtendedTrafficLightMachine } from "./machine";

export const ExtendedTrafficLightView = ({
  machine
}: {
  machine: ExtendedTrafficLightMachine
}) => {
  const currentState = machine.getState();
  const stateMessage = currentState.data.message;
  const pedestrianMessage = currentState.data.pedestrianMessage;
  
  // Is this a pedestrian crossing state?
  const isPedestrianCrossing = currentState.is("RedWithPedestrian");
  
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
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="flex flex-col space-y-4 items-center">
            {/* Don't walk */}
            <div 
              className={`w-16 h-16 rounded flex items-center justify-center ${
                isPedestrianCrossing ? "bg-red-900" : "bg-red-600"
              }`}
            >
              <span className="text-white text-xl">✋</span>
            </div>
            {/* Walk */}
            <div 
              className={`w-16 h-16 rounded flex items-center justify-center ${
                isPedestrianCrossing ? "bg-green-500" : "bg-green-900"
              }`}
            >
              <span className="text-white text-xl">🚶</span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="text-xl font-bold mb-2">
        {stateMessage}
      </div>
      
      <div className="text-lg mb-4">
        Pedestrian: {pedestrianMessage}
      </div>
      
      <div className="text-sm mb-4">
        Current state: <span className="font-mono">{currentState.key}</span>
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
          disabled={isPedestrianCrossing}>
          Pedestrian Button
        </button>
      </div>
    </div>
  );
};
