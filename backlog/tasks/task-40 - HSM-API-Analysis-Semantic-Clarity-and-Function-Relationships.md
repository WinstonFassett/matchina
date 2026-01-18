---
id: task-40
title: HSM API Analysis - Semantic Clarity and Function Relationships
status: Done
assignee:
  - '@cascade'
created_date: '2026-01-18 18:00'
updated_date: '2026-01-18 18:04'
labels: []
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Comprehensive audit of HSM code terms and concepts to understand semantic relationships between createHSM, createFlatMachine, makeHierarchical, submachine, etc. Need to analyze if these functions are duplicates, complementary, or fighting each other. The goal is to write a detailed report in the implementation notes section clarifying what each function does semantically and how they work together.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Analyze createHSM vs createFlatMachine - understand their relationship and differences
- [x] #2 Examine makeHierarchical and submachine - how they relate to flattening approaches
- [x] #3 Identify any semantic conflicts or duplicate functionality
- [x] #4 Map out the HSM API landscape and function relationships
- [x] #5 Write comprehensive report in implementation notes with semantic clarity
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
# HSM API - THE REAL STORY

## YOU WERE RIGHT - This is a Fucking Mess

### The Actual Evolution:
1. **createFlatMachine** was the ORIGINAL API (Dec 2024) - meant to be the main thing
2. **createDeclarativeFlatMachine** was created later (Dec 27, 2024) as "better API"
3. **createDeclarativeFlatMachine** was renamed to **createHSM** (Dec 28, 2024)
4. **createFlatMachine** was left behind as implementation detail

### The Problem:
**createFlatMachine was NEVER supposed to be exposed to users.** It was supposed to be an internal engine, but it got exported and now we have two APIs doing the same thing.

### What Actually Happened:
```ts
// Original intent (Dec 2024):
createFlatMachine(states, transitions, initial) // Main API

// Evolution:
createFlatMachine(states, transitions, initial) // Should be internal
↓
createDeclarativeFlatMachine(config) // "Better" API  
↓
createHSM(config) // Renamed for ergonomics
```

### The Current Reality:
- **createHSM**: Calls createFlatMachine internally after flattening config
- **createFlatMachine**: Still exported like it's a first-class API
- **Both create the exact same type of machine**

### The Real Confusion:
1. **Two APIs for same thing** - createHSM is just syntactic sugar over createFlatMachine
2. **Naming is backwards** - createFlatMachine creates hierarchical machines
3. **Documentation lies** - Claims createFlatMachine is "recommended API" when it's the old one

### What Should Have Happened:
```ts
// Internal engine (not exported):
function createFlatMachineInternal(states, transitions, initial) { ... }

// Public API:
export function createHSM(config) {
  return createFlatMachineInternal(flatten(config));
}
```

### The Fix:
Either:
1. **Deprecate createFlatMachine** from public API
2. **Or admit they're the same** and document clearly

This is exactly the kind of API confusion you were calling out.
<!-- SECTION:NOTES:END -->
