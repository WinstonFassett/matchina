# Matchina Library Gotchas

This document captures key lessons learned while working with the Matchina library, particularly with hierarchical state machines, to help avoid common pitfalls in future development.

## Hierarchical State Machine Gotchas

### Event Propagation

1. **Child-First Traversal**: Events are processed in a child-first traversal. The `handleAtRoot()` function descends to the deepest active child and attempts handling there before walking back up.
   - **Gotcha**: Don't assume events are handled at the parent level first. Child machines get first priority.

2. **Event Structure in Handlers**: The event object structure differs between the r2 branch and newer versions.
   - **Gotcha**: In newer versions, event data may be nested differently. Always check the structure with console logs when debugging.
   - **Solution**: Use defensive coding with optional chaining and fallbacks: `const data = ev?.params?.[0]?.data || {}`.

3. **Child Exit Events**: The `child.exit` event is crucial for state transitions after child machines complete.
   - **Gotcha**: The `child.exit` handler receives different event structures in different versions.
   - **Solution**: Extract data carefully with fallbacks and don't rely on a specific structure.

### Promise Machines

1. **Immediate Execution**: Promise machines must be executed immediately upon creation to work properly.
   - **Gotcha**: If you don't call `execute()` on the promise machine, it won't start its work.
   - **Solution**: Always call `fetcher.execute(query)` right after creating the promise machine.

2. **Query Preservation**: When transitioning between states, query data must be explicitly preserved.
   - **Gotcha**: The query can be lost during transitions if not explicitly passed.
   - **Solution**: Always pass the current query in transitions: `activeStates.Query(ev.from.data.query)`.

3. **Error Handling**: Promise rejections need explicit handling.
   - **Gotcha**: Unhandled promise rejections can cause the state machine to get stuck.
   - **Solution**: Always include error handling in promise machines and transitions.

### State Management

1. **State Access**: Accessing state data requires understanding the current context.
   - **Gotcha**: `ev.from` might be undefined in some contexts.
   - **Solution**: Use fallbacks and capture state data at the right moment.

2. **State Transitions**: State transitions should be explicit about what data they carry forward.
   - **Gotcha**: Implicit transitions can lose data.
   - **Solution**: Always be explicit about what data is passed in state transitions.

## UI Component Gotchas

1. **State Matching**: When using `state.match()`, the exhaustive flag matters.
   - **Gotcha**: Setting the exhaustive flag to `true` requires handling all possible states.
   - **Solution**: Use `false` for the exhaustive flag when you only want to handle specific states.

2. **Submachine Access**: Accessing submachines requires careful null checking.
   - **Gotcha**: Submachines might be undefined in certain states.
   - **Solution**: Always check if the submachine exists before accessing it.

3. **Event Handlers**: Event handlers need to pass the right parameters.
   - **Gotcha**: Not passing the query to the submit handler can cause the search to fail.
   - **Solution**: Always pass the current query: `machine.submit(query)`.

## Debugging Tips

1. **Logging State Transitions**: Add strategic logging to track state transitions.
   ```typescript
   console.log('Creating Query state with query:', query);
   console.log('Submit with query:', currentQuery);
   ```

2. **Inspecting Event Objects**: Log the full event object structure to understand what's available.
   ```typescript
   console.log('child.exit event received', JSON.stringify(ev, null, 2));
   ```

3. **Tracking Machine State**: Log the machine state to understand the current context.
   ```typescript
   console.log('Query machine state:', queryMachine?.getState());
   ```

## Testing Recommendations

1. **Test State Transitions**: Explicitly test all state transitions, especially those involving child machines.

2. **Test Error Paths**: Ensure error handling works correctly by testing error conditions.

3. **Test Data Preservation**: Verify that data is preserved correctly during state transitions.
