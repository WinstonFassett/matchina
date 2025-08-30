We are working on type issues. Not impl issues. 
Fundamentally our new flattening types are not flattening correctly
specifically they are not flattening events and states correctly.
on any given machine definition {states,transitions, initialState}
transitions essesntially map entrystate - event - exit state
where event may have params otherwise it uses params of exit state
so on any machine context there is logically a flat list of event "functions" that take typed parameters and result in (but do not return) a typed exit state. 
so they are logically like LogicalEvent = { Type, Params: P, ExitState} 
the states and transitions form a FactoryMachineContext
We basically need a flattening utility type that creates a new FactoryMachineContext where
states are namespaced
the transitions are merged together but also remapped to the namespaced state keys
if we correctly derive a new flat FactoryMachineContext, then the states and transitions should be wired up such that eventApi(machine) should just work.

but right now


npm run test:types fails. 

matchina on  hierarchical-machine-dx [$!?] is 📦 v0.1.1 via  v20.19.0 took 4s 
❯ npm run test:types

> matchina@0.1.1 test:types
> tsc --noEmit --skipLibCheck

test/flatten.api.types.ts:117:19 - error TS2344: Type 'false' does not satisfy the constraint 'true'.

117   hasTick: Expect<Equal<typeof api.tick, () => void>>,
                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

test/flatten.api.types.ts:118:19 - error TS2344: Type 'false' does not satisfy the constraint 'true'.

118   hasBump: Expect<Equal<typeof api.bump, (delta: number) => void>>,
                      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

test/flatten.api.types.ts:119:21 - error TS2344: Type 'false' does not satisfy the constraint 'true'.

119   hasRepair: Expect<Equal<typeof api.repair, (reason: string) => void>>,
                        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

test/flatten.api.types.ts:122:22 - error TS2344: Type 'false' does not satisfy the constraint 'true'.

122   tickParams: Expect<Equal<Parameters<typeof api.tick>, []>>,
                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

test/flatten.api.types.ts:123:22 - error TS2344: Type 'false' does not satisfy the constraint 'true'.

123   bumpParams: Expect<Equal<Parameters<typeof api.bump>, [number]>>,
                         ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

test/flatten.api.types.ts:124:24 - error TS2344: Type 'false' does not satisfy the constraint 'true'.

124   repairParams: Expect<Equal<Parameters<typeof api.repair>, [string]>>,
                           ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

test/flatten.api.types.ts:133:1 - error TS2578: Unused '@ts-expect-error' directive.

133 // @ts-expect-error - missing required parameter
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

test/flatten.api.types.ts:135:1 - error TS2578: Unused '@ts-expect-error' directive.

135 // @ts-expect-error - wrong parameter type
    ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

