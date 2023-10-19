import { beforeEach, afterEach, it } from 'vitest';
import { BufferedLog } from './BufferedLog';

const origConsole = console;

beforeEach(async (context) => {
  const { task } = context;
  const interval = (context.task as any)?.options?.debounceInterval || 500;
  const logger = new BufferedLog({
    debounce: interval,
  });
  (context as any).console = logger;
  console = logger as any;
});

afterEach((context) => {
  ((context as any).console as BufferedLog).flush();
  console = origConsole;
});
