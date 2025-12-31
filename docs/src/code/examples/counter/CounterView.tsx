import { type CounterMachine } from "./machine";

export const CounterView = ({ machine }: { machine: CounterMachine }) => {
  const count = machine.store.getState().count;
  return (
    <div className="flex flex-col items-center">
      <div className="text-6xl font-bold mb-4">{count}</div>
      <div className="flex space-x-2">
        <button
          className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
          onClick={() => machine.send("increment")}
        >
          +
        </button>
        <button
          className="px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-600"
          onClick={() => machine.send("decrement")}
        >
          -
        </button>
        <button
          className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
          onClick={() => machine.send("reset")}
        >
          Reset
        </button>
      </div>
    </div>
  );
};
