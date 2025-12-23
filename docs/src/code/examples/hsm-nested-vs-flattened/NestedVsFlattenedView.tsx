import React from "react";
import { useMachine } from "matchina/react";
import { 
  createNestedController, 
  createFlattenedController, 
  getStateDisplay, 
  getAvailableTransitions 
} from "./machine";

function ControllerDemo({ 
  title, 
  machine, 
  isFlattened = false 
}: {
  title: string;
  machine: any;
  isFlattened?: boolean;
}) {
  useMachine(machine);

  const stateDisplay = getStateDisplay(machine);
  const availableTransitions = getAvailableTransitions(machine);

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
      
      <div className="text-sm">
        <div className="mb-2">
          <span className="text-gray-600 dark:text-gray-400">Current State: </span>
          <code className="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-blue-800 dark:text-blue-200">
            {stateDisplay}
          </code>
        </div>
        
        <div className="mb-3">
          <span className="text-gray-600 dark:text-gray-400">Structure: </span>
          <span className="text-gray-800 dark:text-gray-200">
            {isFlattened 
              ? "Single flat state machine with dot-notation keys" 
              : "Parent machine containing child machine instances"
            }
          </span>
        </div>
      </div>

      <div className="space-x-2 flex flex-wrap gap-2">
        {availableTransitions.map((transition) => (
          <button
            key={transition}
            onClick={() => machine.send(transition)}
            className="px-3 py-1 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
          >
            {transition}
          </button>
        ))}
      </div>

      <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {isFlattened 
          ? "Events are handled by the single flattened machine"
          : "Events may be routed to child machines automatically"
        }
      </div>
    </div>
  );
}

export function NestedVsFlattenedView() {
  const [nested] = React.useState(() => createNestedController());
  const [flattened] = React.useState(() => createFlattenedController());

  return (
    <div className="space-y-6 p-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-2">
          Hierarchical State Machines: Nested vs Flattened
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
          Both controllers manage a traffic light that can be Working (Red/Green/Yellow), Broken, or under Maintenance.
          Compare how the two approaches handle the same state hierarchy differently.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <ControllerDemo 
          title="🏗️ Nested Approach" 
          machine={nested} 
          isFlattened={false}
        />
        <ControllerDemo 
          title="🏠 Flattened Approach" 
          machine={flattened} 
          isFlattened={true}
        />
      </div>

      <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h3 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">Key Differences:</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h4 className="font-medium text-blue-600 dark:text-blue-400 mb-1">Nested Approach</h4>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li>Child machines exist as separate instances</li>
              <li>Events can be routed between parent and child</li>
              <li>Child state is accessed via parent state data</li>
              <li>More memory overhead (multiple machine instances)</li>
              <li>Natural composition and encapsulation</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-green-600 dark:text-green-400 mb-1">Flattened Approach</h4>
            <ul className="space-y-1 text-gray-600 dark:text-gray-400">
              <li>All states exist in a single machine</li>
              <li>Dot-notation keys represent hierarchy</li>
              <li>Direct state access with compound keys</li>
              <li>More memory efficient (single machine)</li>
              <li>Simpler runtime, but less encapsulation</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}