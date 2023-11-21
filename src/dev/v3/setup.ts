

export function setup(...fns: ((...args: any[]) => any)[]) {
  return () => {
    for (const fn of fns) {
      fn();
    }
  };
}
