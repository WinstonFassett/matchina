import { afterEach, beforeEach } from "vitest";
import { BufferedConsole } from "./buffered-console";

const origConsole = console;

function setGlobalConsole(aConsole: typeof console) {
  // eslint-disable-next-line no-global-assign
  console = aConsole;
}

beforeEach((context) => {
  const { task } = context;
  const interval = (task as any)?.options?.debounceInterval || 500;
  const bufferedConsole = new BufferedConsole({
    debounce: interval,
  }) as unknown as typeof console;
  (context as any).console = bufferedConsole;
  setGlobalConsole(bufferedConsole);
});

afterEach((context) => {
  ((context as any).console as BufferedConsole).flush();
  setGlobalConsole(origConsole);
});
