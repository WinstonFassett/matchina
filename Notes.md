# Notes

Want

- [ ] context, perhaps with update api
- [ ] wildcard lifecycle hooks
- [ ] silent self-transitions, i.e. commands
- [ ] store integration examples (nanostores, zustand)
- [ ] view integration examples (react, vue, svelte)
- [ ] middleware

## Lifecycle

### Wildcard lifecycle hooks

Wildcard handling is ideal but the typing is tricky.

Want to be able to do 

```ts
onLifecycle(machine, {
  '*': {
    enter: () => {},
    on: {
      '*': {
        guard: () => true,
        before: () => {},
        after: console.log.bind('after')
      }
    }
  }
})
```

Need clear rules for each hook. May vary from hook-to-hook.

Container delegation suggests container gets control first, and delegates control top-down and from general to specific.

- `guard` - all states (all events, this event) then state, then event
- `before`, `after` - all states=(all events, this event) this state, this event
- `enter`, `leave` - all states, this state
- `handle` - container does not want to prevent child from running. wants to run around it. 

### Handle

```ts
handle?: (change: T) => T | undefined;
```

Probably too simple. Should be `SwapFunc<T>`?

Well, change is the incoming change. It is handled, sort of.

What CAN be passed to handle?

```ts
current
updated
lifecycle config
active hooks
could give it a commit and updater like onUpdate
could give it change, lastChange
```

ok so make it more like a reducer?

instead of `handle`, could have `reduce` and `update`

