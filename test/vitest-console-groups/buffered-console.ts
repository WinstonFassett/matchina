export type Options = {
  debounce?: number;
  console?: typeof console;
};

export class BufferedConsole {
  messages: string[][] = [];
  timeout?: NodeJS.Timeout;
  flushed = false;
  options: Options;
  _console: typeof console;

  constructor({ debounce = 500, ...rest }: Options = {}) {
    this.options = { debounce, ...rest };
    this._console = this.options.console ?? console;
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
      this.messages.map((m) => this._console.log(...m));
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
