# Agent Command Guidelines

## 🚨 CRITICAL: NEVER RUN DEV COMMANDS - EVER

**DEVELOPMENT SERVER IS ALWAYS RUNNING ON PORT 4321**
**DO NOT RUN ANY COMMAND WITH "dev" IN THE NAME**

**These commands are kryptonite for agents - NEVER run them:**
- `npm run dev` - Blocks agents forever (dev server already running on 4321)
- `npm run dev:docs` - Blocks agents forever (dev server already running on 4321)
- `npm run dev:all` - Blocks agents forever (dev server already running on 4321)

**User-Only Commands (NEVER run):**
- `npm run release` - User only (never publishing)
- `npm run publish` - User only (never publishing)
- `npm run dry-run` - User only (never publishing)

**Pre-Push/PR Commands (User Only - NEVER run):**
- `npm run test` - User only (pre-push validation)
- `npm run test:types` - User only (pre-push validation)
- `npm run test-build` - User only (pre-push validation)

## ✅ AGENT-SAFE COMMANDS (Troubleshooting Only)

**Only run these when troubleshooting specific issues:**
- `npm run build:lib` - Core library build issues only
- `npx vitest run test/file.test.ts` - Specific test failures
- `npx playwright test --headed --timeout=5000` - E2E debugging

## Main Rule
**DON'T RUN COMMANDS UNLESS TOLD TO DO SO** - The dev server is already running on 4321, step off and focus on code.
