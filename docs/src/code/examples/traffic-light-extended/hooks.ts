import { useCallback, useEffect } from "react";

export function useIntervalEffect(effect: () => void, ms: number | null) {
  const cb = useCallback(effect, []);
  useEffect(() => {
    if (ms === null) return;
    const interval = setInterval(cb, ms);
    return () => clearInterval(interval);
  }, [cb, ms]);
}
