export interface FetcherOptions {
  url: string;
  timeout: number;
  maxTries: number;
  autoretry: boolean;
}

interface OptionsFormProps {
  options: FetcherOptions;
  onChange: (options: FetcherOptions) => void;
}

export function OptionsForm({ options, onChange }: OptionsFormProps) {
  const handleChange = (updates: Partial<FetcherOptions>) => {
    onChange({ ...options, ...updates });
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-900 mb-4">
      <h4 className="text-sm font-medium mb-3">Configuration:</h4>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-3">
          <div>
            <label className="block font-medium mb-1">URL:</label>
            <input
              type="text"
              value={options.url}
              onChange={(e) => handleChange({ url: e.target.value })}
              className="w-full px-2 py-1 border rounded text-xs"
            />
          </div>
          <div>
            <label className="block font-medium mb-1">Timeout (ms):</label>
            <input
              type="number"
              value={options.timeout}
              onChange={(e) =>
                handleChange({ timeout: Number(e.target.value) })
              }
              className="w-full px-2 py-1 border rounded text-xs"
            />
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block font-medium mb-1">Max Tries:</label>
            <input
              type="number"
              value={options.maxTries}
              onChange={(e) =>
                handleChange({ maxTries: Number(e.target.value) })
              }
              className="w-full px-2 py-1 border rounded text-xs"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 font-medium">
              <input
                type="checkbox"
                checked={options.autoretry}
                onChange={(e) => handleChange({ autoretry: e.target.checked })}
              />
              Auto-retry
            </label>
          </div>
        </div>
      </div>{" "}
    </div>
  );
}

export const defaultOptions: FetcherOptions = {
  url: "https://httpbin.org/delay/1",
  timeout: 2000,
  maxTries: 5,
  autoretry: true,
};
