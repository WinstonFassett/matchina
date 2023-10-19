type Options = {
  debounce?: number;
};

const globalConsole = console;

export class BufferedLog {
  messages: string[][] = [];
  timeout?: NodeJS.Timeout;
  flushed = false;
  options: Options;

  constructor({ debounce = 500, ...rest }: Options = {}) {
    this.options = { debounce, ...rest };
  }

  log(...args: any[]) {
    this.messages.push(args);
    if (this.flushed) {
      this.flushAfterDebounce();
    }
  }

  flush() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.flushed ||= true;
    if (this.messages.length > 0) {
      this.messages.map((m) => globalConsole.log(...m));
      this.messages = [];
    }
  }

  flushAfterDebounce() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => this.flush(), this.options.debounce);
  }
}
