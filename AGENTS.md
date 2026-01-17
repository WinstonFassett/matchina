# Agent Instructions for Matchina

For development patterns, see `DEVELOPMENT.md`.
For command guidelines, see `AGENT_COMMANDS.md`.

## Agent Documentation Map

**Core agent guidance (short, focused):**
- **`AGENTS.md`** (this file) - Session workflow, task memory, critical type rules
- **`AGENT_COMMANDS.md`** - Complete command reference (38 lines)

**Project documentation (referenced as needed):**
- **`CLAUDE.md`** - Project overview, architecture, essential commands
- **`DEVELOPMENT.md`** - Development patterns, example structure, testing
- **`FEATURE-CHECKLIST.md`** - Feature development workflow

**Testing documentation (when needed):**
- **`docs/E2E.md`** - E2E testing guide, strategies, Playwright usage
- **`AGENT_COMMANDS.md`** - Referenced for detailed command guidance

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

## Notes
- All agents automatically work in backlog task context
- TodoWrite items become acceptance criteria
- Completed todos mark ACs as done
- File changes tracked against active task
