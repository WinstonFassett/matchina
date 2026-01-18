---
id: doc-2
title: HSM + Viz Bundle Example
type: example
created_date: '2026-01-18'
---

# Real-World Bundle: Basic HSM Example

## Example Code

```ts
import { createFlatMachine, describeHSM } from 'matchina/hsm'

const traffic = describeHSM({
  initial: 'red',
  states: {
    red: { on: { NEXT: 'green' } },
    green: { on: { NEXT: 'yellow' } },
    yellow: { on: { NEXT: 'red' } },
  },
})

const machine = createFlatMachine(traffic)
```

## Bundle Sizes (Gzipped)

| Scenario | Size | Notes |
|---|---|---|
| **hsm-basic** | 2.78 kB | Just `createFlatMachine` + `describeHSM` |
| **main 'matchina'** | 3.47 kB | Core factory machine APIs |
| **hsm module** | 4.45 kB | Full HSM exports (includes inspect re-exports) |
| **main + hsm combined** | ~6.0 kB | Both modules used in app |

## Bundle Composition (HSM Basic - 2.78 kB)

```
hsm-basic (2.78 kB)
│
├─ Factory machine core (~1.5 kB)
├─ HSM features:
│  ├─ describeHSM (~0.8 kB)
│  ├─ createFlatMachine (~0.3 kB)
│  └─ utilities (~0.2 kB)
└─ No Shape, Inspect, or Viz included
```

## Key Insight

**Importing just `createFlatMachine` costs 2.78 kB** because it depends on the factory machine core. The HSM module itself is only usable when combined with core machine APIs.
