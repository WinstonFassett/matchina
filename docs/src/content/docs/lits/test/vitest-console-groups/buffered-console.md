---
title: "buffered-console"
description: "Add description here"
---


```ts
export type Options = {
  debounce?: number;
  console?: typeof console;
};

const GroupSymbol = Symbol("GroupSymbol");
const GroupEndSymbol = Symbol("GroupEndSymbol");

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

  group() {
    this.messages.push([GroupSymbol.toString()]);
    if (this.flushed) {
      this.flushAfterDebounce();
    }
  }

  groupEnd() {
    this.messages.push([GroupEndSymbol.toString()]);
    if (this.flushed) {
      this.flushAfterDebounce();
    }
  }

  flush() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.flushed ||= true;
    const { messages, _console } = this;
    this.messages = [];
    for (const message of messages) {
      if (message[0] === GroupSymbol.toString()) {
        _console.group();
      } else if (message[0] === GroupEndSymbol.toString()) {
        _console.groupEnd();
      } else {
        _console.log(...message);
      }
    }
  }

  flushAfterDebounce() {
    if (this.timeout) {
      clearTimeout(this.timeout);
    }
    this.timeout = setTimeout(() => this.flush(), this.options.debounce);
  }
}
```
