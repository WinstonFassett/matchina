# Agent Instructions

## Before Any Work

```bash
backlog task list --plain          # Find work
backlog task <id> --plain          # Read task details
backlog task edit <id> -s "In Progress" -a @agent  # Claim it
```

## Backlog is Filesystem-Based

Tasks are markdown files in `backlog/tasks/` with frontmatter. You can:
- Read files directly with Read tool
- Search with Grep across `backlog/`
- Use CLI for edits (keeps metadata in sync)

## CRITICAL: Type Inference

Never break type inference. Pass transitions inline to `createMachine`, never as variables.

```typescript
// WRONG - breaks inference
const transitions = { ... };
createMachine(states, transitions, "Initial");

// CORRECT
createMachine(states, { Idle: { start: "Active" } }, "Initial");
```

No `as any`. No `@ts-ignore`. No casts. Fix types, don't suppress them.

## During Work

```bash
backlog task edit <id> --check-ac 1   # Mark acceptance criteria done
backlog task edit <id> --append-notes "progress update"
```

## After Work

```bash
backlog task edit <id> --notes "what you did"
backlog task edit <id> -s Done
git add . && git commit -m "feat: description"
```

## Commands

- `backlog --help` - Full CLI reference
- `npm test` - Run tests
- Never run `npm run dev` - blocks forever

## Testing

- Unit tests: `npm test`
- Browser: Use running dev server at localhost:4321
- Playwright: `npx playwright test --headed --timeout=5000`
