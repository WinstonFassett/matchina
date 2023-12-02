function timingMiddleware<A extends any[], R>(
  fn: (...args: A) => R,
): (...args: A) => R {
  return (...args: A) => {
    const startTime = Date.now();
    const result = fn(...args);
    const endTime = Date.now();
    console.log(`Execution time: ${endTime - startTime}ms`);
    return result;
  };
}

function errorHandlingMiddleware<A extends any[], R>(
  fn: (...args: A) => R,
): (...args: A) => R {
  return (...args: A) => {
    try {
      return fn(...args);
    } catch (error) {
      console.error(`Error: ${error}`);
      // You can handle the error here or re-throw it if needed
      throw error;
    }
  };
}

function throttleMiddleware<A extends any[], R>(
  fn: (...args: A) => R,
  delay: number,
): (...args: A) => R {
  let isThrottled = false;
  let result: R;

  return (...args: A) => {
    if (!isThrottled) {
      isThrottled = true;
      setTimeout(() => {
        isThrottled = false;
        fn(...args);
      }, delay);
      result = fn(...args);
    }
    return result;
  };
}

function debounceMiddleware<A extends any[], R>(
  fn: (...args: A) => R,
  delay: number,
): (...args: A) => R {
  let timeout: NodeJS.Timeout | undefined;
  return (...args: A) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      timeout = undefined;
      fn(...args);
    }, delay);
    return undefined as R;
  };
}
