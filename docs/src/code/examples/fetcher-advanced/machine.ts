import {
  createMachine,
  defineStates,
  delay,
  effect,
  enter,
  guard,
  whenEventType,
  whenState,
  assignEventApi,
  setup,
} from "matchina";
import { autotransition } from "../lib/autotransition";

type Options = RequestInit & {
  timeout?: number;
  maxTries?: number;
  autoretry?: boolean;
  getData?: (response: Response) => any;
};

export function createFetcher(
  defaultUrl: string,
  defaultOptions: Options = {}
) {
  const states = defineStates({
    Idle: undefined,
    Fetching: (url = defaultUrl, options = defaultOptions) => ({
      url,
      options,
      abort: new AbortController(),
    }),
    ProcessingResponse: (response: Response) => response,
    Resolved: (data: any) => data,
    Error: (error: Error) => error,
    NetworkError: (error: Error) => error,
    Aborted: undefined,
    TimedOut: undefined,
    Refetching: undefined,
  });
  const canRefetch = { refetch: "Refetching" } as const;

  const machine = createMachine(
    states,
    {
      Idle: {
        fetch: "Fetching",
      },
      Fetching: {
        fetched: "ProcessingResponse",
        reject: "Error",
        abort: "Aborted",
        timeout: "TimedOut",
        networkError: "NetworkError",
      },
      ProcessingResponse: {
        ...canRefetch,
        resolve: "Resolved",
        error: "Error",
      },
      Resolved: canRefetch,
      Error: canRefetch,
      NetworkError: canRefetch,
      Aborted: canRefetch,
      TimedOut: canRefetch,
      Refetching: { "": "Fetching" },
    },
    "Idle"
  );
  const fetcher = Object.assign(assignEventApi(machine), {
    fetch: (url?: string, options?: RequestInit) => {
      fetcher.fetch(url, options);
      return fetcher.promise!;
    },
    promise: undefined as undefined | Promise<Response>,
    done: undefined as undefined | Promise<void>,
    tries: 0,
  });
  const maxTries = defaultOptions.maxTries ?? Number.POSITIVE_INFINITY;
  const runFetch = async (url: string, options: RequestInit) => {
    fetcher.tries = fetcher.tries + 1;
    const promise = (fetcher.promise = fetch(url, options));
    try {
      const res = await promise;
      if (fetcher.promise === promise) {
        fetcher.fetched(res.clone());
      }
    } catch (error) {
      const { name } = error as Error;
      if (name === "AbortError") {
        fetcher.tries--;
      } else if (name === "TypeError") {
        fetcher.networkError(error as Error);
      } else {
        fetcher.reject(error as Error);
      }
    } finally {
      delete fetcher.promise;
    }
  };
  const resolveResponseData = (response: Response) => response.json();
  setup(fetcher)(
    enter(
      whenState("Fetching", (ev) => {
        (ev as any).promise = runFetch(ev.to.data.url, {
          ...ev.to.data.options,
          signal: ev.to.data.abort.signal,
        });
        const { timeout } = ev.to.as("Fetching").data.options;
        if (timeout) {
          const timer = setTimeout(fetcher.timeout, timeout);
          return () => clearTimeout(timer);
        }
      })
    ),
    effect(
      whenState("ProcessingResponse", (ev) => {
        fetcher.tries = 0;
        delay(1000).then(() => {
          resolveResponseData(ev.to.data).then(fetcher.resolve);
        });
      })
    ),
    autotransition(),
    effect(
      whenEventType("abort", (ev) => {
        ev.from.data.abort.abort();
      })
    ),
    guard((ev) => (ev.type === "refetch" ? fetcher.tries < maxTries : true))
  );
  if (defaultOptions.autoretry) {
    const autoRetryStates = ["NetworkError", "TimedOut", "Error"] as const;

    setup(fetcher)(
      ...autoRetryStates.map((stateName) =>
        effect(
          whenState(stateName, () => {
            if (fetcher.tries < maxTries) {
              const backoff = 1000 * fetcher.tries;
              const timer = setTimeout(() => {
                fetcher.refetch();
              }, backoff);
              return () => {
                clearTimeout(timer);
              };
            }
          })
        )
      )
    );
  }
  return fetcher;
}

// Removed unused type

export type FetcherMachine = ReturnType<typeof createFetcher>;
