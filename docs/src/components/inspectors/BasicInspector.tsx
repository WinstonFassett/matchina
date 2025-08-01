import React, { memo, useMemo } from "react";

export const BasicInspector = memo(
  ({
    config,
    stateKey,
    actions,
  }: {
    config: any;
    stateKey: string;
    actions?: Record<string, () => void>;
  }) => {
    const { states } = config;
    // Prepare state boxes
    const stateBoxes = useMemo(() => {
      return Object.entries(states).map(([key, stateRaw]) => {
        const state = stateRaw as { on?: Record<string, string> };
        const isActive = key === stateKey;
        const transitions = state.on ? Object.entries(state.on) : [];
        return (
          <div
            key={key}
            className={`border rounded px-2 py-1 flex flex-col items-stretch box-border text-xs gap-0.5
              ${isActive ? "bg-blue-50 dark:bg-blue-900 border-blue-300 dark:border-blue-700" : "bg-white dark:bg-neutral-900 border-neutral-300 dark:border-neutral-700"}`}
          >
            <div className="font-semibold mb-0.5 text-center text-xs tracking-wide text-blue-700 dark:text-blue-300">
              {key}
            </div>
            <div className="flex flex-row flex-wrap gap-2">
              {transitions.length === 0 ? (
                <span className="italic text-neutral-400 text-xs">
                  {/* No transitions */}
                </span>
              ) : (
                transitions.map(([event, _targetRaw]) => {
                  // const target = String(targetRaw);
                  const disabled = !isActive || !actions?.[event];
                  return (
                    <button
                      className={`bg-none border-none p-0 m-0 text-xs focus:outline-none italic font-normal
                          ${!disabled ? "text-blue-700 dark:text-blue-300 underline cursor-pointer" : "text-neutral-400 cursor-default"}`}
                      onClick={() => actions?.[event]()}
                      disabled={false}
                      tabIndex={disabled ? -1 : 0}
                      type="button"
                      style={{ background: "none" }}
                    >
                      {event}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        );
      });
    }, [states, stateKey, actions]);

    return (
      <div className="flex flex-wrap gap-1 w-full items-stretch">
        {stateBoxes}
      </div>
    );
  }
);

export default BasicInspector;

export function useDebouncedValue<T>(value: T, delay?: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || 500);
    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);
  return debouncedValue;
}
