# Stopwatch Examples Consolidation Plan

## Current State
- 9 stopwatch examples + 1 overview index
- Three core state management approaches
- Multiple effect handling patterns demonstrated

## Inventory

### Core Examples (Essential)
1. **stopwatch.mdx** - Basic foundational (simple states, lifecycle hooks)
2. **stopwatch-using-data-and-hooks.mdx** - Clean machine state approach with `when` helper
3. **stopwatch-using-data-and-transition-functions.mdx** - Type-safe transition functions
4. **stopwatch-using-react-state-and-effects.mdx** - React useState integration
5. **stopwatch-using-react-state-and-state-effects.mdx** - Specialized effect hooks
6. **stopwatch-using-external-react-state-and-state-effects.mdx** - External state pattern
7. **stopwatch-using-react-state-using-lifecycle-instead-of-useeffect.mdx** - Declarative lifecycle API
8. **stopwatch-using-transition-hooks-instead-of-useeffect.mdx** - Transition hook alternative

### Index/Overview
- **stopwatch-overview.mdx** - Index with comparison table and recommendations

## Analysis

### Unique Value Propositions
| Example | Teaches | Unique Pattern |
|---------|---------|---|
| Basic | Foundational structure | Simple states + lifecycle |
| Data+Hooks | Machine state management | `when` helper for effects |
| Transition Functions | Type safety | Function-based transitions |
| React State+Effects | React integration | useEffect hook pattern |
| State Effects | Specialized hooks | `useStateEffects` + `useEventTypeEffect` |
| External State | State management outside machine | Separation of concerns |
| Lifecycle | Declarative API | `onLifecycle` hook instead of useEffect |
| Transition Hooks | Hook alternatives | Transition-based effect management |

### Overlaps Identified
- **Data+Hooks vs Basic**: Similar but Data+Hooks has better API
- **React State+Effects vs State Effects**: Both use React state, latter has cleaner hooks
- **External State vs Lifecycle**: Both external patterns, latter demonstrates declarative API
- **Transition Hooks vs Lifecycle**: Alternative effect patterns, not overlapping conceptually

### Recommendation
**Do not consolidate yet.** Current structure serves pedagogical goals:
- Each example demonstrates a specific pattern
- Overview.mdx already identifies 4 "core" examples for beginners
- The learning progression is valuable
- Redundancy is intentional and labeled in overview

**If consolidation is needed later:**
1. Keep: Data+Hooks, State Effects, Lifecycle, Transition Functions (4 core patterns)
2. Deprecate: Basic (superceded by Data+Hooks), React State+Effects (superceded by State Effects)
3. Consider: Consolidating External State into Lifecycle example with callouts
4. Maintain: Overview index with clear "start here" guidance

## Decision
- Current setup is optimal for learning
- Overview.mdx provides good guidance on which to prioritize
- No immediate action required
