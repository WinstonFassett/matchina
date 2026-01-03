---
editUrl: false
next: false
prev: false
title: "describeHSM"
---

> **describeHSM**(`config`: [`DeclarativeFlatMachineConfig`](/matchina/reference/interfaces/declarativeflatmachineconfig/)): `any`

Defined in: [hsm/declarative-flat.ts:341](https://github.com/WinstonFassett/matchina/blob/d1cbab41b10c354f5140c1ca7bf6f5ecef6c2171/src/hsm/declarative-flat.ts#L341)

Create a flattened machine from declarative hierarchical config

⚠️ **TYPE SAFETY LIMITATION**: This API trades type inference for ergonomics.
State keys and transitions are determined at runtime, so TypeScript cannot
provide exhaustive type checking or autocomplete for state/event names.

**For type-safe code**, use `createFlatMachine()` with `defineStates()` instead:
```typescript
const states = defineStates({
  'Payment.MethodEntry': () => ({}),
  'Payment.Authorized': () => ({})
});
const machine = createFlatMachine(states, transitions, initial);
// ✅ Full type inference for states and events
```

**Use this API when**:
- Prototyping or less type-critical code
- DRY hierarchy definition is more important than type safety
- State structure is simple and unlikely to change

Benefits:
- Define hierarchy ONCE (no repetitive dot-notation)
- Auto-flattens to dot-notation internally
- Generates synthetic parent states automatically
- DRY and elegant

## Parameters

| Parameter | Type |
| ------ | ------ |
| `config` | [`DeclarativeFlatMachineConfig`](/matchina/reference/interfaces/declarativeflatmachineconfig/) |

## Returns

`any`
