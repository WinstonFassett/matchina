---
id: doc-1
title: Build Size Comparison Report
type: report
created_date: '2026-01-18 16:08'
---

# Build Size Comparison: Current Branch vs Main

**Branch:** `backlog/20260118-hsm-features-code-review`  
**Comparison:** vs `main`  
**Date:** 2026-01-18  

## Summary

The branch externalizes **4 new core modules** (HSM, Shape, Inspect, Viz) with dedicated entry points. After removing re-exports from main barrel:
- **Main index reduced:** 7.13 kB → 3.47 kB (-3.66 kB)
- **Modules available separately** via `matchina/hsm`, `matchina/shape`, etc.
- **Tree-shaking enabled:** Consumers only bundle what they import

## Complete Size Comparison (Gzipped)

| Entry Point | Current | Main | Delta | % Change |
|---|---|---|---|---|
| **index** | 3.47 kB | 3.85 kB | -0.38 kB | -9.9% |
| matchbox | 362 B | 340 B | +22 B | +6.5% |
| states | 375 B | 357 B | +18 B | +5.0% |
| store-machine | 413 B | 350 B | +63 B | +18.0% |
| pure | 70 B | 70 B | — | — |
| factory-machine | 643 B | 557 B | +86 B | +15.4% |
| matchChange | 154 B | 154 B | — | — |
| promise-machine | 1.16 kB | 1.03 kB | +0.13 kB | +12.6% |
| ext | 586 B | 586 B | — | — |
| setup | 166 B | 166 B | — | — |
| method-enhancer | 316 B | 316 B | — | — |
| machine-hooks | 546 B | 534 B | +12 B | +2.2% |
| factory-machine-hooks | 72 B | 72 B | — | — |
| factory-machine-lifecycle | 896 B | 882 B | +14 B | +1.6% |
| react-dist | 415 B | 354 B | +61 B | +17.2% |
| zod-dist | 413 B | 390 B | +23 B | +5.9% |
| valibot-dist | 597 B | 579 B | +18 B | +3.1% |
| emitter | 61 B | 61 B | — | — |
| with-subscribe | 118 B | 118 B | — | — |
| **hsm** | **4.45 kB** | ❌ Not exported | **+4.45 kB** | **NEW** |
| **shape** | **1.35 kB** | ❌ Not exported | **+1.35 kB** | **NEW** |
| **inspect** | **943 B** | ❌ Not exported | **+943 B** | **NEW** |
| **viz** | **562 B** | ❌ Not exported | **+562 B** | **NEW** |

## Core Module Dependencies

```
main (3.47 kB)
  └─ no HSM/Shape/Inspect

hsm (4.45 kB)
  └─ imports from: main

shape (1.35 kB)  
  └─ imports from: main

inspect (943 B)
  └─ imports from: shape, main
  └─ **requires shape as dependency**

viz (562 B)
  └─ imports from: main
```

### Module Details

**HSM** - 4.45 kB  
Hierarchical state machines with nested logic. Optional, separate entry point.

**Shape** - 1.35 kB  
State machine shape utilities and builders. Required by Inspect.

**Inspect** - 943 B  
Depends on Shape (imports `MachineShape` type and `hasShape` function).  
943 B is the complete size including its dependencies (tree-shaken from shape).

**Viz** - 562 B  
Visualization theme and utilities. Optional, independent.

## Architecture: Externalized Entry Points

HSM, Shape, and Inspect are **not** re-exported from the main barrel. They're accessed via separate entry points:

```ts
// Main bundle (3.47 kB) - core state machine APIs
import { createMachine, matchboxFactory } from 'matchina'

// Optional modules - only loaded on demand
import { createFlatMachine, describeHSM } from 'matchina/hsm'
import { buildMachineStructure } from 'matchina/shape'
import { buildShapeTree, inspect } from 'matchina/inspect'
import { ... } from 'matchina/viz'
```

## Key Results

1. **Main bundle is now SMALLER** than main branch (-0.38 kB)
   - Cleaner API surface
   - Consumers opt-in to HSM/Shape/Inspect features

2. **Separate entry points sized appropriately**
   - HSM: 4.45 kB (hierarchical machine support)
   - Shape: 1.35 kB (structure analysis)
   - Inspect: 943 B (runtime inspection)
   - Viz: 562 B (visualization utilities)

3. **Tree-shaking works as intended**
   - Dead code elimination when importing individual modules
   - No forced bundling of unused features

