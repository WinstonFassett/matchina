import { useMachine } from "matchina/react";
import { type CounterMachine } from "./machine";

export const CounterView = ({ machine }: { machine: CounterMachine }) => {
  useMachine(machine);
  useMachine(machine.store);

  const count = machine.getCount();
  const isActive = machine.getState().is("Active");

  return (
    <div className="flex flex-col items-center">
      <div className="text-6xl font-bold mb-4">{count}</div>
      <div className="text-sm mb-2 text-gray-500">
        {isActive ? "Active" : "Inactive"}
      </div>
      <div className="flex space-x-2">
        <button
          className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
          onClick={() => machine.increment()}
          disabled={!isActive}
        >
          +
        </button>
        <button
          className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
          onClick={() => machine.decrement()}
          disabled={!isActive}
        >
          -
        </button>
        <button
          className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
          onClick={() => machine.reset()}
          disabled={!isActive}
        >
          Reset
        </button>
        <button
          className="px-4 py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600"
          onClick={() =>
            isActive ? machine.send("deactivate") : machine.send("activate")
          }
        >
          {isActive ? "Deactivate" : "Activate"}
        </button>
      </div>
    </div>
  );
};
