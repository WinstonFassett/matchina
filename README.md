# Matchina

TypeScript-first state machines with type-safe pattern matching.

```sh
npm install matchina
```

## What it is

Matchina lets you model states as tagged unions and drive transitions with full type inference. Pattern matching is exhaustive — TypeScript won't let you forget a state.

```ts
import { matchina, defineStates } from "matchina";

const states = defineStates({
  Idle: undefined,
  Playing: (trackId: string) => ({ trackId }),
  Paused: (trackId: string) => ({ trackId }),
  Stopped: undefined,
});

const player = matchina(
  states,
  {
    Idle:    { start: "Playing" },
    Playing: { pause: "Paused", stop: "Stopped" },
    Paused:  { resume: "Playing", stop: "Stopped" },
    Stopped: { start: "Playing" },
  },
  "Idle"
);

player.start("song-123");

const message = player.getState().match({
  Playing: ({ trackId }) => `Now playing: ${trackId}`,
  Paused:  ({ trackId }) => `Paused: ${trackId}`,
  Idle:    () => "Ready",
  Stopped: () => "Stopped",
});
```

## Docs

- [Quickstart](https://winstonfassett.github.io/matchina/guides/quickstart)
- [State Machines](https://winstonfassett.github.io/matchina/guides/machines)
- [Tagged Unions (Matchbox)](https://winstonfassett.github.io/matchina/guides/matchbox-factories)
- [Promise Machines](https://winstonfassett.github.io/matchina/guides/promises)
- [Lifecycle Hooks](https://winstonfassett.github.io/matchina/guides/lifecycle)
- [Hierarchical Machines](https://winstonfassett.github.io/matchina/guides/hierarchical-machines)
- [React Integration](https://winstonfassett.github.io/matchina/guides/react)
- [Examples](https://winstonfassett.github.io/matchina/examples)

## License

MIT
