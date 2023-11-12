type MiddlewareFunc<T> = (data: T, next: () => void) => void;

class Middleware<T> {
  private stack: MiddlewareFunc<T>[] = [];

  use(fn: MiddlewareFunc<T>): void {
    this.stack.push(fn);
  }

  detach(fn: MiddlewareFunc<T>): void {
    const index = this.stack.indexOf(fn);
    if (index !== -1) {
      this.stack.splice(index, 1);
    }
  }

  execute(data: T): void {
    let index = -1;
    const next = () => {
      index++;
      if (index < this.stack.length) {
        this.stack[index](data, next);
      }
    };
    next();
  }
}

// Usage:
const middleware = new Middleware<number>();

const fn1 = (data: number, next: () => void) => {
  console.log("Middleware 1", data);
  next();
};

const fn2 = (data: number, next: () => void) => {
  console.log("Middleware 2", data);
  next();
};

middleware.use(fn1);
middleware.use(fn2);

middleware.execute(10);

middleware.detach(fn1);

middleware.execute(20);
