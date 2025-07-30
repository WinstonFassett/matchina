import {
  createPromiseMachine,
  createReset,
  onLifecycle,
  assignEventApi,
} from "matchina";
import { useMachine } from "matchina/react";
import { useEffect, useMemo, useState } from "react";

const slowlyAddTwoNumbers = (x: number, y: number, duration = 1000) =>
  new Promise<number>((resolve) => setTimeout(() => resolve(x + y), duration));

function useAdder() {
  const machine = useMemo(() => createPromiseMachine(slowlyAddTwoNumbers), []);
  const wrapper = useMemo(
    () =>
      Object.assign(assignEventApi(machine), {
        reset: createReset(machine, machine.states.Idle()),
      }),
    [machine]
  );
  useMachine(wrapper);
  return wrapper;
}

export function LifecycleDemo({}) {
  const machine = useAdder();
  const change = machine.getChange();
  const [logs, setLogs] = useState<string[]>(["Log:"]);
  const log = (msg: string) => setLogs((logs) => [...logs, msg]);
  useEffect(() => {
    const origConsole = console;
    const dualConsole = {
      ...console,
      log: (...args: any[]) => {
        origConsole.log(...args);
        log(args.join(" "));
      },
    };
    console = dualConsole;

    return onLifecycle(machine, {
      Idle: {
        on: {
          executing: (ev) => {
            console.log(
              "Idle.executing effect:",
              ev.type,
              ev.from.key,
              ev.to.key
            );
          },
        },
      },
      "*": {
        on: {
          "*": {
            after: (ev) => {
              console.log(`[${ev.type}]:`, ev.to.key, ev.to.data);
            },
          },
          reject: {
            after: ({ type, from, to }) => {
              const { name, stack, message } = to.data;
              console.log(
                "after",
                type,
                "from",
                from.key,
                name,
                message,
                stack
              );
            },
          },
          resolve: {
            before: ({ type, from: _from, to: { data } }) => {
              console.log("before", type, data);
            },
          },
        },
      },
    });
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-200 dark:border-gray-800">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">
        Lifecycle Demo
      </h2>
      <div className="mb-6">
        <span className="font-semibold text-gray-700 dark:text-gray-300">
          Action:
        </span>{" "}
        {machine.getState().match({
          Idle: () => (
            <span>
              <button
                className="px-4 py-2 mr-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition dark:bg-blue-500 dark:hover:bg-blue-400"
                onClick={() => machine.execute(1, 1)}
              >
                Add 1+1
              </button>
              <span className="text-gray-500 dark:text-gray-400 mx-2">or</span>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition dark:bg-green-500 dark:hover:bg-green-400"
                onClick={() => machine.execute(2, 2, 2000)}
              >
                Add 2+2
              </button>
            </span>
          ),
          Pending: ({ params: [x, y, duration] }) => (
            <span>
              <span className="text-yellow-700 dark:text-yellow-400 font-medium">
                Waiting {duration?.toString() ?? "default=1000"}ms to add {x} +{" "}
                {y}
              </span>
              <button
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition dark:bg-red-500 dark:hover:bg-red-400"
                onClick={() => machine.reject(new Error("User rejected!"))}
              >
                REJECT!
              </button>
            </span>
          ),
          _: () => (
            <span>
              <span className="text-green-700 dark:text-green-400 font-medium">
                Done!
              </span>
              <button
                className="ml-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition dark:bg-gray-700 dark:hover:bg-gray-600"
                onClick={() => machine.reset()}
              >
                Reset
              </button>
            </span>
          ),
        })}
      </div>
      <div className="flex flex-col md:flex-row gap-6 h-80">
        <div className="flex-1 min-h-0 bg-gray-50 dark:bg-gray-800 rounded p-4 border border-gray-200 dark:border-gray-700 flex flex-col">
          <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">
            State Info
          </h3>
          <pre className="text-xs text-gray-800 dark:text-gray-100 whitespace-pre-wrap flex-1 min-h-0 overflow-y-auto rounded bg-gray-100 dark:bg-gray-900 p-2">
            {JSON.stringify(
              {
                "Current State Key": change.to.key,
                "Current State Data": change.from?.data,
                "Last Change": change,
              },
              null,
              2
            )}
          </pre>
        </div>
        <div className="overflow-hidden flex-1 min-h-0 bg-gray-50 dark:bg-gray-800 rounded p-4 border border-gray-200 dark:border-gray-700 flex flex-col">
          <h3 className="text-lg font-semibold mb-2 text-gray-700 dark:text-gray-200">
            Logs
          </h3>
          <pre className="text-xs text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words max-w-full flex-1 min-h-0 overflow-y-auto rounded bg-gray-100 dark:bg-gray-900 p-2">
            {logs.join("\n")}
          </pre>
        </div>
      </div>
    </div>
  );
}
