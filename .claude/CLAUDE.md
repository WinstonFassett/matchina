# CLAUDE.md - Cascade (Windsurf) Instructions

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
2. **Understand the goal** - Read task details completely
