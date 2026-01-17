# Agent Instructions for Matchina

## 🚨 CRITICAL: Active Backlog Task Required
**MANDATORY:** You MUST always work in the context of an active backlog task. Before starting any work:

1. **Check active task:** Run `backlog agent-tap status` to verify active task
2. **If no active task:** The system will automatically create/claim one
3. **NEVER work without active task context**

**Current Active Task:** Check with `backlog agent-tap status` or `backlog task list --plain`

## Project Overview
Matchina is a TypeScript-first library for building type-safe state machines with powerful pattern matching. It's a lightweight, modular toolkit (3.42 kB full library gzipped) published to npm.

## Current Task Context
**Active Backlog Task:** task-1 - Visualizer Strategy Execution - Repackage viz to packages, default ReactFlow, deprecate ForceGraph

**Acceptance Criteria Remaining:**
- [ ] #1 All visualizers moved to individual packages under packages/viz-*
- [ ] #2 ReactFlow V2 established as default visualizer in docs examples
- [ ] #3 Docs example configuration updated to default to ReactFlow
- [ ] #4 ForceGraph Inspector deprecated and marked for retirement
- [ ] #5 Mermaid support maintained but not defaulted in examples
- [ ] #6 Package dependencies work with dev server auto-updates
- [ ] #7 Test suite passes: hsm-combobox, hsm-traffic-light, tap, hsm-checkout, rps-game

## Agent-Tap Integration
This project uses the agent-tap system for automatic task tracking:
- **TodoWrite calls** automatically sync to backlog tasks
- **Task completion** updates acceptance criteria
- **File changes** are tracked against active task
- **Mirror logs** capture all agent activity

**Current Status:** Check `backlog/agent-tap/agent-tap status` for active task context

## Essential Commands
```bash
npm test                    # Run tests with coverage
npm run dev                 # Vitest watch mode
backlog task list --plain   # Show current tasks
backlog task task-1         # Show active task details
```

## Architecture
- **Core:** Matchbox factory → State machines → Lifecycle hooks
- **Visualizers:** Moving from src/viz/* to packages/viz-*
- **Default:** ReactFlow V2 (established as default)
- **Examples:** Update imports after package restructuring

## Critical Type Rules
NEVER break type inference:
```typescript
// WRONG - breaks inference
const transitions = { ... };
createMachine(states, transitions, "Initial");

// CORRECT
createMachine(states, { Idle: { start: "Active" } }, "Initial");
```

No `as any`, no `@ts-ignore`, no casts. Fix types, don't suppress them.

## Development Workflow
1. **Core** → **Tests** → **Examples** → **Docs**
2. **Focus on making things work** - user manages git/commits
3. **Test before finishing** - `npm test` must pass
4. **Type safety first** - strict TypeScript mode

## Package Structure (Target State)
```
packages/
├── viz-reactflow/     # Default visualizer
├── viz-mermaid/        # Mermaid support
└── viz-forcegraph/    # Legacy (deprecated)
```

## Testing Priority
Critical examples must work:
- hsm-combobox ✓
- hsm-traffic-light ✓
- toggle ✓
- hsm-checkout ✓
- rock-paper-scissors ✓

## Agent-Tap Commands
```bash
./agent-tap context          # Get current task context
./agent-tap claim <task-id>   # Claim active task
./agent-tap status            # Show active hooks/tasks
./agent-tap log               # Show task mirror log
```

## Notes
- All agents automatically work in backlog task context
- TodoWrite items become acceptance criteria
- Completed todos mark ACs as done
- File changes tracked against active task
