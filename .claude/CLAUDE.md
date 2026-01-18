# CLAUDE.md - Cascade (Windsurf) Instructions

## 🚨 CRITICAL: BACKLOG.MD CLI WORKFLOW IS NOT OPTIONAL

You MUST use the **backlog.md** CLI tool for ALL task management. This is not optional.

**Install**: `npm i -g backlog.md` (if not already installed)

### Before ANY Work
```bash
backlog task list --plain          # Find available tasks
backlog task view <id> --plain     # Read task details FIRST
backlog task edit <id> -s "In Progress" -a @agent  # Claim task
```

### During Work
```bash
backlog task edit <id> --check-ac 1   # Mark acceptance criteria done
backlog task edit <id> --append-notes "progress update"
```

### After Work
```bash
backlog task edit <id> --notes "what you did"
backlog task edit <id> -s Done
git add . && git commit -m "feat: description"
```

## About backlog.md

**backlog.md** is a specific CLI tool (npm i -g backlog.md), NOT a generic concept.

Tasks are markdown files in `backlog/tasks/` with frontmatter. You can:
- Read files directly with Read tool
- Search with Grep across `backlog/`
- Use CLI for edits (keeps metadata in sync)
- Use `backlog --help` for full command reference

## NEVER Run These Commands
- `npm run dev` - Blocks agents forever
- `npm run dev:docs` - Blocks agents forever  
- `npm run dev:all` - Blocks agents forever
- `npm run test` - User only (pre-push validation)
- `npm run test:types` - User only (pre-push validation)
- `npm run test-build` - User only (pre-push validation)

## Agent-Safe Commands
- `npm run build:lib` - Core library build issues only
- `npx vitest run test/file.test.ts` - Specific test failures
- `npx playwright test --headed --timeout=5000` - E2E debugging

## CRITICAL: Type Inference
NEVER break type inference. Pass transitions inline to `createMachine`:

```typescript
// WRONG - breaks inference
const transitions = { ... };
createMachine(states, transitions, "Initial");

// CORRECT
createMachine(states, { Idle: { start: "Active" } }, "Initial");
```

No `as any`. No `@ts-ignore`. No casts. Fix types, don't suppress them.

## Additional Context
- All agents work with **backlog.md** CLI tool
- TodoWrite items become acceptance criteria
- Completed todos mark ACs as done
- File changes tracked against active task
- Check `local/` for active work, ignore `local/archive/`

## Testing Priority
Critical examples must work:
- hsm-combobox ✓
- hsm-traffic-light ✓
- toggle ✓
- hsm-checkout ✓
- rock-paper-scissors ✓

## Foundation First
1. **Start with `for-devs/README.md`** - Project context
2. **Check backlog.md tasks** - Use workflow above
3. **Understand the goal** - Read task details completely
4. **Follow backlog.md workflow** - NOT optional
