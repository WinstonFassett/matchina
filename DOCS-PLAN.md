# Documentation Reorganization Plan

This document outlines a plan for reorganizing Matchina's documentation to make it more accessible, focused on TypeScript benefits, and easier to navigate.

## Documentation Structure

### 1. Home Page (`/docs/src/content/docs/index.mdx`)

**Goal:** Provide a clear, concise introduction to Matchina with compelling examples that showcase TypeScript integration.

**Content:**
- Brief introduction emphasizing TypeScript-first approach
- Key features with short code snippets
- "Why Matchina?" section highlighting differentiators
- Quick installation and usage examples
- Navigation to primary guides

### 2. Guides

#### 2.1 Quickstart (`/docs/src/content/docs/guides/quickstart.mdx`)

**Goal:** Get users up and running quickly with a simple example.

**Content:**
- Installation
- Basic usage pattern
- Simple state machine example
- Next steps for learning more

#### 2.2 Matchbox: Type-Safe Unions (`/docs/src/content/docs/guides/union-machines.mdx`)

**Goal:** Introduce the foundational concept of Matchbox for tagged unions.

**Content:**
- What are tagged unions and why they matter
- Creating state factories with `matchbox`
- Pattern matching with `match`
- Type guards with `is` and `as`
- Advanced usage patterns

#### 2.3 Factory Machines (`/docs/src/content/docs/guides/machines.mdx`)

**Goal:** Show how to create full state machines with TypeScript inference.

**Content:**
- Creating state factories with `defineStates`
- Building machines with `createMachine`
- Defining transitions with parameter inference
- Using the state machine API
- Pattern matching for state rendering

#### 2.4 Type Guards (`/docs/src/content/docs/guides/typeguards.mdx`)

**Goal:** Explain the type guard utilities for working with states.

**Content:**
- Using `.is()` for type narrowing
- Using `.as()` for type casting
- Using `.match()` for exhaustive pattern matching
- Type-safe filter functions

#### 2.5 Lifecycle & Hooks (`/docs/src/content/docs/guides/lifecycle.mdx`)

**Goal:** Show how to intercept and react to state changes.

**Content:**
- Lifecycle overview with transition diagram
- Using `guard` to prevent transitions
- Using `enter` and `leave` for transition hooks
- Using `effect` for side effects
- Combining hooks with `setup`

#### 2.6 Promises (`/docs/src/content/docs/guides/promises.mdx`)

**Goal:** Explain how to manage async operations with state machines.

**Content:**
- Creating promise machines with `createPromiseMachine`
- Handling promise states (Idle, Pending, Resolved, Rejected)
- Adding lifecycle hooks to promises
- Error handling with type safety
- Advanced promise patterns

#### 2.7 Effects (`/docs/src/content/docs/guides/effects.mdx`)

**Goal:** Show how to manage side effects with the effects system.

**Content:**
- Creating effect states
- Handling effects with `bindEffects`
- Exhaustive vs. non-exhaustive effect handling
- Combining effects with transitions

#### 2.8 React Integration (`/docs/src/content/docs/guides/integrations.mdx`)

**Goal:** Show how to use Matchina with React.

**Content:**
- Using the `useLifecycle` hook
- Rendering based on state with pattern matching
- Handling events and transitions
- Managing side effects
- Performance considerations

### 3. Examples

#### 3.1 Simple Toggle (`/docs/src/content/docs/examples/toggle.mdx`)

A basic on/off toggle state machine.

#### 3.2 Counter (`/docs/src/content/docs/examples/counter.mdx`)

A counter with increment, decrement, and reset.

#### 3.3 Traffic Light (`/docs/src/content/docs/examples/traffic-light.mdx`)

A traffic light with automatic transitions.

#### 3.4 Fetch Data (`/docs/src/content/docs/examples/fetch-simple.mdx`)

Data fetching with promise machine.

#### 3.5 Advanced Fetch (`/docs/src/content/docs/examples/fetch-plus.mdx`)

Advanced data fetching with caching, retries, and cancellation.

#### 3.6 Form Validation (`/docs/src/content/docs/examples/form.mdx`)

Form with validation state machine.

#### 3.7 Authentication Flow (`/docs/src/content/docs/examples/auth-flow.mdx`)

Complete authentication flow with login, registration, and password reset.

#### 3.8 Stopwatch (`/docs/src/content/docs/examples/stopwatch.mdx`)

Stopwatch with start, stop, reset functionality.

## Example Organization Pattern

Each example should follow this pattern:

1. **Introduction** - What the example demonstrates
2. **State Definition** - How states are defined
3. **Transitions** - How transitions are configured
4. **Lifecycle** - Any lifecycle hooks or effects
5. **Usage** - How to use the state machine
6. **Complete Example** - The full code
7. **Next Steps** - What to explore next

## Implementation Tips

1. **Keep examples focused** - Each example should demonstrate one main concept
2. **Show TypeScript benefits** - Highlight type inference and safety
3. **Provide visual aids** - Use diagrams for state transitions
4. **Link between related content** - Connect guides and examples
5. **Use progressive disclosure** - Start simple, then show advanced features

## Improving Examples

### Do's:
- Start with imports and clear explanations
- Highlight TypeScript inference with comments
- Use realistic, but simple, examples
- Include React examples for UI integration
- Show type errors when misused (as comments)

### Don'ts:
- Mix too many concepts in one example
- Use overly complex domain models
- Skip explaining transitions or pattern matching
- Assume familiarity with advanced concepts

## Next Steps

1. Audit existing examples against this structure
2. Create missing examples and guides
3. Update navigation and cross-linking
4. Add diagrams for state transitions
5. Improve TypeScript documentation comments
