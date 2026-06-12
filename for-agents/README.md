# Agent Instructions

For development patterns, see `for-devs/README.md`.
For command guidelines, see `for-agents/commands.md`.

## Agent Documentation Map

**Core agent guidance (short, focused):**
- **`for-agents/README.md`** (this file) - Session workflow, task memory, critical type rules
- **`for-agents/commands.md`** - Command reference (38 lines)

**Project documentation (referenced as needed):**
- **`for-devs/README.md`** - Project overview, architecture, development patterns
- **`for-devs/feature-checklist.md`** - Feature development workflow

**Testing documentation (when needed):**
- **README.md** - E2E testing guide for humans (in root)
- **`for-agents/README.md`** - E2E testing guidance for agents (included)
- **`for-agents/commands.md`** - Referenced for detailed command guidance

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
- **Multi-agent context**: Check `local/` for active work, ignore `local/archive/`
# E2E Testing for Agents

## Agent-Specific E2E Guidance

### **When NOT to Run E2E**
- If you don't understand the current task context
- If you haven't checked `local/` for relevant context
- If running tests would be pointless (just to "see what happens")
- If the task is about documentation or code organization

### **When TO Run E2E**
- After making UI changes that could affect examples
- When verifying fixes to visual regressions
- When task explicitly requires testing validation
- After changes to machine logic that affects examples

### **Context First**
Before running any E2E:
1. **Check `local/`** - Active task documents and context
2. **Ignore `local/archive/`** - Old completed tasks
3. **Understand the goal** - What are you actually testing for?
4. **Is it necessary?** - Will the results inform your work?

### **Smart E2E Patterns**
Instead of running everything:
- Use grep patterns for specific examples: `--grep "checkout|hsm-"`
- Use smoke tests for quick validation: `npm run test:e2e:smoke`
- Use headed mode for debugging: `--headed --timeout=5000`
- Focus on examples relevant to current task

### **Interpreting Results**
- **Screenshots**: Compare with task goals in `local/`
- **Test failures**: Check if they relate to current work
- **Visual regressions**: Is this expected for the task?
- **Passing tests**: Good, but did they test the right thing?

### **What Humans Do vs Agents**
**Humans**: `npm run test:e2e` - run the suite
**Agents**: Context-driven testing - understand first, then test if needed

This prevents agents from running pointless E2E tests just because they can.
