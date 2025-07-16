import { useSumFetcher } from "./hooks";

export function FetcherAppView({ machine }: { machine: ReturnType<typeof useSumFetcher> }) {
  const { a, b, setA, setB, calculate } = machine;
  const adder = machine.machine;

  return (
    <div className="p-4 rounded border">
      <h3 className="text-lg font-medium mb-2">Promise Machine Demo</h3>
      
      <div className="mb-4">
        <p className={`inline-block px-2 py-1 rounded mb-2 ${
          adder.state.match({
            Idle: () => "bg-gray-200",
            Pending: () => "bg-blue-200",
            Resolved: () => "bg-green-200",
            Rejected: () => "bg-red-200"
          })
        }`}>
          State: {adder.state.key}
        </p>
        
        <div className="mt-2">
          {adder.state.is("Resolved") && (
            <p className="text-green-600">
              Result: {JSON.stringify(adder.state.data)}
            </p>
          )}
          
          {adder.state.is("Rejected") && (
            <p className="text-red-600">
              Error: {typeof adder.state.data === 'object' && adder.state.data && 'message' in adder.state.data 
                ? (adder.state.data as any).message 
                : JSON.stringify(adder.state.data)}
            </p>
          )}
        </div>
      </div>
      
      <div className="flex flex-col gap-2 mb-4">
        <div className="flex items-center gap-2">
          <label className="w-20">A:</label>
          <input
            type="number"
            value={a}
            onChange={(e) => setA(Number(e.target.value))}
            className="border rounded px-2 py-1"
            disabled={adder.state.is("Pending")}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <label className="w-20">B:</label>
          <input
            type="number" 
            value={b}
            onChange={(e) => setB(Number(e.target.value))}
            className="border rounded px-2 py-1"
            disabled={adder.state.is("Pending")}
          />
        </div>
      </div>
      
      <button
        onClick={calculate}
        disabled={adder.state.is("Pending")}
        className={`px-4 py-2 rounded ${
          adder.state.is("Pending") 
            ? "bg-gray-300 cursor-not-allowed" 
            : "bg-blue-500 text-white hover:bg-blue-600"
        }`}
      >
        {adder.state.is("Pending") ? "Calculating..." : "Calculate Sum"}
      </button>
    </div>
  );
}
