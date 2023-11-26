/**
 * Run cleanup functions in reverse order
 * @param fns 
 * @returns 
 */
export function setup(...fns: ((...args: any[]) => any)[]) {
  return () => {
    for (let i = fns.length - 1; i >= 0; i--) {
      fns[i]();
    }
  };
}
