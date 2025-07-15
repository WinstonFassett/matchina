
export function tickEffect(tick: () => void, interval = 50) {
  const timer = setInterval(tick, interval);
  return () => clearInterval(timer);
}
