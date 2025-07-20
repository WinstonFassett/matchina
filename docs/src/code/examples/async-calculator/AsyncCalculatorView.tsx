import { useState } from "react";

interface AsyncCalculatorViewProps {
  machine: any;
}

export function AsyncCalculatorView({ machine }: AsyncCalculatorViewProps) {
  const [a, setA] = useState(5);
  const [b, setB] = useState(3);
  const state = machine.getState();

  const handleCalculate = () => {
    machine.execute(a, b);
  };

  return (
    <div className="space-y-4 p-4 border rounded-lg">
      <div className="space-y-2">
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={a}
            onChange={(e) => setA(Number(e.target.value))}
            className="w-20 px-2 py-1 border rounded"
            disabled={state.is("Pending")}
          />
          <span>+</span>
          <input
            type="number"
            value={b}
            onChange={(e) => setB(Number(e.target.value))}
            className="w-20 px-2 py-1 border rounded"
            disabled={state.is("Pending")}
          />
          <button
            onClick={handleCalculate}
            disabled={state.is("Pending")}
            className="px-4 py-1 bg-blue-500 text-white rounded disabled:opacity-50"
          >
            Calculate
          </button>
        </div>
      </div>

      <div className="p-3 bg-gray-50 rounded">
        {state.match({
          Idle: () => <span>Ready to calculate</span>,
          Pending: ({ params }: any) => (
            <span>
              Calculating {params[0]} + {params[1]}...
            </span>
          ),
          Resolved: (result: any) => (
            <span className="text-green-600">Result: {result}</span>
          ),
          Rejected: (error: any) => (
            <span className="text-red-600">Error: {error.message}</span>
          ),
        })}
      </div>
    </div>
  );
}
