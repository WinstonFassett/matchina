# Matchina: Project Finalization Plan

## Priority Tasks

### Documentation Improvements

- [ ] Implement new documentation structure according to DOCS-PLAN.md
- [ ] Move features to home page for better visibility
- [ ] Break up large code examples into smaller, focused pieces
- [ ] Distinguish between React and non-React examples
- [ ] Add visual state diagrams for complex machines

### Code Cleanup

- [ ] Clean up console logging in tests for readability
- [ ] Standardize logging format in examples and tests
- [ ] Review and improve test coverage for:
  - [ ] factory-machine-hooks.ts (21.47%)
  - [ ] matchina.ts (25.58%)
  - [ ] promise-handle.ts (12.9%)
  - [ ] state-machine-transition-helpers.ts (25.64%)

### Type System Enhancements

- [ ] Complete documentation of type guards:
  - [ ] is, as, match functions
  - [ ] matchChange
  - [ ] getFilter
  - [ ] isEntry
- [ ] Review and improve API for extensions

### Publishing Preparation

- [ ] Ensure examples aren't included in npm package
- [ ] Audit dependencies for both root and docs
- [ ] Prepare release notes for v0.1.0

## Documentation Review

- [ ] Identify all unused examples, determine how to handle React examples vs console examples
- [ ] move features to be on home page
- [ ] consider breaking up code in docs more
- [ ] Matchbox State Factories
- [ ] State Factory Machines
- [ ] Transitions
- [ ] Promises
- [ ] Lifecycle and Hooks
  - [ ] simplify lifecycle example
  - [ ] Move type safety everywhere to features
- [ ] examples need structure, intro
- [ ] enumerate the type guards: is, as, 

## Type guards and matching
- matchChange
- getFilter
- isEntry
- State = is, as, match
- transition hook extensions - share API?

## Extensibility approach in ext, which is kinda weird
- extensionware, funcware, abortable

## Examples

- promise simple example is not simple
- review context example. does it make sense?

# Older todos:

## 1. Examples Handling
- [ ] Ensure examples are not included in npm package

## 2. Types Review
- [ ] Audit `matchbox.ts`, `types.ts`, and other files for type quality and usage
- [ ] Document findings and recommendations in dev docs

## 3. Documentation Improvements
- [ ] Review and improve guides and structure

## 4. Dependency Management
- [ ] Audit dependencies for both root and docs
- [ ] Remove unused or experimental dependencies
- [ ] Ensure clean separation between lib, docs, and examples

## 5. NPM Publishing
- [ ] Clarify what is and isn’t published to npm

## 6. General Cleanup
- [ ] Prune unused code and experimental features
- [ ] Make experimental features clearly marked or move to a separate area

---

_This file is a working plan. Delete when project is finalized._
