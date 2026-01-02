# Agent Instructions for Matchina

This project uses **bd** (beads) for issue tracking. For development patterns, see `docs/DEVELOPMENT.md`.

## Agent Documentation Map

**All agent guidance documents:**

- **`AGENTS.md`** (this file) - Session workflow, beads usage, testing, dev servers
- **`CLAUDE.md`** - Project overview, architecture, build system
- **`docs/DEVELOPMENT.md`** - Development patterns, example structure, path aliases
- **`docs/FEATURE-CHECKLIST.md`** - Feature development reference
- **`docs/AGENTS.md`** - Docs-specific patterns (Astro, MDX)

## ⚠️ CRITICAL: Type Inference Principles

**Matchina's entire purpose is type-safe state machines with full type inference. NEVER break this with casts or workarounds.**

### Cardinal Rules

1. **NEVER declare transitions as a variable** - Always pass transitions inline as a direct argument to `createMachine`/`createFlatMachine`

   ```typescript
   // ❌ WRONG - Breaks type inference
   const transitions = { ... };
   const machine = createMachine(states, transitions, "Initial");

   // ✅ CORRECT - Preserves type inference
   const machine = createMachine(states, {
     Initial: { event: "Next" },
     Next: { ...}
   }, "Initial");
   ```

2. **NEVER use `as any` or `@ts-ignore` in machine creation** - This destroys the type safety that is the library's core value

3. **NEVER work around type errors with casts** - Fix the root cause in the type signatures instead

4. **States should also be inline or const-declared** - For best type inference, pass states directly or declare with `const states = defineStates({...})`

If you encounter type errors, the solution is to fix the type definitions, NOT to cast them away.

## Backward Compatibility

**DO NOT worry about backward compatibility unless explicitly instructed.**

This is a major version development - no need to maintain legacy APIs or deprecated functions.

- Remove deprecated code instead of keeping it for compatibility
- Use new API names without aliasing old ones
- Do not add "legacy" or "deprecated" comments unless specifically required
- Focus on clean, current API design

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync --flush-only  # Export to JSONL
```

### Finding Work
**CRITICAL: ALWAYS CHECK GIT STATUS BEFORE/AFTER WORK**

```bash
git status           # MUST check before starting work
git status           # MUST check after completing work
git add .            # Stage changes
git commit -m "..."  # Commit work before moving to next ticket
```

### Finding Work (Task-Oriented)

**CRITICAL: WORK IN DEPENDENCY AND PRIORITY ORDER**

- **NEVER ask user for priority decisions**
- Work tickets in dependency order first, then by priority
- Use `bd ready` output order - it's already sorted correctly
- If multiple items are ready, start with the first one listed
- Dependencies should be set up in beads, not guessed
- **If dependency order is unclear, create a ticket to determine order** or find existing context/plan epic to organize

## Stacked Branches & Propagation

**Problem:** Long-running feature branches need to stay synchronized with `main` as PRs land.

### Strategy: Merge-Based Propagation (Recommended)

For long-running branches that diverged before establishing parent relationships, use **merge-based propagation** instead of rebasing:

```bash
# Step 1: Update primary feature branch from main
git checkout feat/primary-feature
git merge main
# Resolve conflicts if any (usually documentation/config)
git push origin feat/primary-feature -f

# Step 2: Update downstream branches from their parent
git checkout feat/downstream-feature
git merge feat/primary-feature
git push origin feat/downstream-feature -f
```

**Why merges work better:**
- Preserves long-running branch identity (no history rewriting)
- Conflicts isolated to single merge operations (not cascading)
- Easier to recover if merge fails (can reset and retry)
- Cleaner for branches that have diverged significantly

### Future Branches: Git-Town Setup

When creating NEW stacked branches, use git-town parent relationships from the start:

```bash
# Create with explicit parent chain
git-town new-branch <feature> --parent main
git-town new-branch <downstream> --parent <feature>

# Keep synchronized
git-town sync
```

**This prevents retrofit problems and makes synchronization automatic.**

### Reference

For detailed stacking strategy analysis, see `review/STACKING.md`.

## 🚨 CRITICAL: TICKETS FIRST, THEN WORK - WITH EVIDENCE

**ALWAYS CREATE TICKETS BEFORE STARTING WORK**

**MANDATORY: ALL BUG AND FEATURE WORK MUST HAVE A TICKET**

- **MUST** create a beads ticket before writing ANY code for bugs or features
- **MUST** keep the ticket updated throughout development
- **MUST** update ticket with findings, progress, and completion status
- **NEVER** write bug fixes or feature code without a corresponding ticket

1. **ASSESS** - Identify what needs to be done
2. **CREATE TICKETS** - Create beads tickets for each piece of work
3. **ORGANIZE** - Set up dependencies and priorities
4. **THEN WORK** - Only after tickets exist and are organized
5. **UPDATE WITH FINDINGS** - As you investigate, update tickets with analysis/plan BEFORE coding
6. **GATHER EVIDENCE** - UI tickets must include evidence of the fix (screenshots, test results)

### Why This Matters:

- Prevents "I forgot to create a ticket for that"
- Ensures work is tracked and visible
- Allows proper dependency management
- Provides clear work history
- Prevents scope creep and forgotten tasks
- Documents analysis and decisions for future reference

### Ticket Creation Pattern:

```bash
# Before starting any work:
bd create "Fix ReactFlow edges missing" type=bug priority=P2
bd create "Add hierarchical support to ForceGraph" type=feature priority=P2
bd create "Investigate rock paper scissors viz picker" type=task priority=P3

# Then organize dependencies:
bd update <ticket-id> --depends=<other-ticket-id>

# Then mark as in progress and analyze:
bd update <first-ticket-id> --status=in_progress

# IMPORTANT: Update ticket with findings BEFORE coding
bd update <first-ticket-id> --description "Investigation results: [root cause, plan, evidence]"
```

### Ticket Field Structure:

Beads tickets have dedicated fields for proper organization:

- **`--description`**: Concise problem statement and current state
- **`--acceptance`**: Clear, actionable checklist of completion criteria
- **`--design`**: Implementation plan and technical approach
- **`--notes`**: Additional context, current state details, success metrics

**Example structured update:**

```bash
bd update <id> \
  --description "### Problem: X is broken because Y" \
  --acceptance "- [ ] X works correctly\n- [ ] No regressions in Z" \
  --design "### Plan: 1. Fix Y 2. Test X 3. Verify Z" \
  --notes "### Current state: A, B, C examples affected"
```

### Evidence Requirements for UI Tickets:

- **NEVER close UI tickets without evidence** that the user will accept
- Evidence types: browser screenshots, test results, working examples
- Document the before/after state
- Include reproduction steps if applicable
- For bugs: prove the issue is fixed in the actual UI
- For features: demonstrate the functionality works as intended

```bash
# See what's ready to work on (with JSON for parsing)
bd ready --json | jq '.[0]'

# Get issue details (with JSON for parsing)
bd show <issue-id> --json

# List all open issues
bd list --status=open
```

## Beads Ticket Organization

### Methodology

This project uses a **two-tier ticket structure** for managing complex, multi-branch work:

**Long-running ancestor tickets** - Persist across branches for continuity:

- **Context/Plan tickets** (label: `plan`, type: `epic`) - Branch organization, work stream mapping
- **Review tickets** (label: `review`, type: `task`) - Detailed findings, cross-cutting concerns
- **Documentation tickets** (label: `doc`) - Persistent reference material

**Shorter-lived work tickets** - Scoped to specific implementations:

- **Epics** (type: `epic`, optional label: `v2` for breaking changes) - Major feature areas
- **Features/Tasks/Bugs** (type: `feature|task|bug`) - Concrete work items

### Branch Planning Reference

**System of record**: [matchina-19: Branch Plan Epic](http://localhost:3000/#/board?issue=matchina-19)

- Catchall for branch organization context
- Contains work stream dependency graph
- Living document updated as branches are created/merged
- **Use `bd show matchina-19` for current branch planning context**

**Filesystem artifact**: `review/BRANCH_PLAN.md`

- Historical artifact, may not exist
- Used as draft area before syncing to bd
- Beads ticket is source of truth, not this file

### Labeling Strategy

- `v2` - Breaking release work (HSM is primary driver)
- `plan` - Branch/work stream planning
- `review` - Cross-cutting review findings
- `doc` - Reference documentation

### Dependency Pattern

**Work items usually link to organizing areas** (epics, plans) but this is NOT a blocker:

- Can create work tickets independently and groom dependencies iteratively
- Long-running tickets (plan/review) typically depend on work epics
- Work tickets depend on each other based on implementation order
- Don't block on perfect organization—refine as you go

## 🚨 CRITICAL: Agent Commands

**See [AGENT_COMMANDS.md](./AGENT_COMMANDS.md) for complete command guidelines.**

**Quick summary:**
- ✅ **Primary**: `npm test` 
- ✅ **Type check**: `npm run test:types`
- 🚫 **Never**: `npm run dev*` (run forever)
- ⚠️ **Builds**: Use sparingly, prefer tests

## Testing Requirements

**ALL WORK REQUIRES TESTING - NO EXCEPTIONS**

### 🚨 MANDATORY: Visual Testing for UI Changes

**For ANY UI component changes (including visualizers):**

1. **BEFORE State Evidence** - MUST capture the broken state with:
   - Browser screenshots showing the issue
   - Console logs demonstrating the problem
   - Clear reproduction steps

2. **AFTER State Evidence** - MUST prove the fix with:
   - Browser screenshots showing the corrected state  
   - Console logs showing proper behavior
   - Verification that the specific issue is resolved

3. **Visual Comparison** - MUST compare before/after to prove the fix works

**NO UI WORK IS COMPLETE WITHOUT VISUAL EVIDENCE**

### Testing Hierarchy (Required in order):

1. **Unit tests (preferred)** - `/test` with Vitest
   - Test both type inference and runtime behavior
   - If comprehensive unit tests exist, manual testing may not be required

2. **Integration tests** - For component interactions
   - Use playwright for automated screenshot/interaction review
   - Required for visualizers and non-React components

3. **Manual browser testing** - ONLY when unit tests are insufficient
   - AGENT must perform the testing, not "assume user tests"
   - Must capture screenshots and console logs
   - Must verify the specific fix works

4. **Evidence Documentation** - Required for ALL UI fixes
   - Before/after screenshots
   - Console output showing the fix
   - Reproduction steps and verification

**Bottom line:** Work is not complete without PROPER testing evidence AND clean git status. For UI changes, VISUAL VERIFICATION IS MANDATORY.

## Playwright Testing Guidelines

### 🚨 CRITICAL: Playwright Best Practices

**DO NOT CREATE SHITTY TESTS** - Flaky tests waste everyone's time.

#### ✅ Good Playwright Practices
```bash
# Fast failure for debugging
npx playwright test --timeout=5000           # 5s timeout, fail fast
npx playwright test --headed                 # See what's happening
npx playwright test --debug                  # Step through debugging
```

#### 🎯 Smart Selectors (REQUIRED)
```typescript
// ✅ GOOD - Use test IDs or stable selectors
page.getByTestId('submit-button')
page.locator('[data-testid="machine-state"]')
page.locator('button[type="submit"]')  // stable attributes

// ❌ BAD - Fragile selectors
page.locator('div > div > span')         // DOM structure changes
page.locator('.text-blue-500')           // CSS classes change
page.locator('nth-child(3)')             // Order changes
```

#### 🖥️ Headless vs Headed
```bash
# Default: headless:true (preferred for CI)
npx playwright test

# REQUIRED for console logs: headless:false
npx playwright test --headed    # Captures browser console
npx playwright test --debug     # Interactive debugging + console
```

**IMPORTANT**: Console logs are ONLY available in headed mode. Use `--headed` when debugging browser issues.

#### ⏱️ Timeouts - Fail Fast
```typescript
// ✅ GOOD - Short timeouts for fast failure
test.setTimeout(10000)           // 10s total test timeout
await expect(page.locator('button')).toBeVisible({timeout: 3000})  // 3s wait

// ❌ BAD - Long timeouts hide problems
await expect(page.locator('button')).toBeVisible({timeout: 30000}) // 30s default
```

### 📋 Test Classification

#### Real Tests (`/test/e2e/`)
- **Purpose**: Verify functionality works
- **Requirements**: Reliable, consistent, fast
- **Location**: `test/e2e/*.spec.ts`
- **CI**: Must pass consistently

#### Diagnostic Tools (`/review/` or `/test/e2e/diagnostic/`)
- **Purpose**: Debugging, screenshots, console logs
- **Requirements**: Useful for development, not CI
- **Location**: `review/` or separate diagnostic folder
- **CI**: Should NOT run in CI

**DO NOT COMMIT DIAGNOSTIC TOOLS AS REAL TESTS**

### 🎨 Visual Testing Requirements

**Required for non-React 3rd party libraries** (Mermaid, etc.):
```typescript
// ✅ GOOD - Visual regression with specific targets
await expect(page).toHaveScreenshot('mermaid-diagram.png')

// ✅ GOOD - Element-specific visual checks
const diagram = page.locator('[data-testid="mermaid-diagram"]')
await expect(diagram).toBeVisible()
await expect(diagram).toHaveScreenshot('diagram-state.png')
```

### 🚫 Common Playwright Mistakes

1. **Long timeouts** - Hide real problems, waste time
2. **Fragile selectors** - Break when DOM changes
3. **No test IDs** - Force brittle selector usage
4. **Headless debugging** - Can't see console logs
5. **Mixing diagnostics with real tests** - Pollutes CI
6. **Accepting flaky tests** - Ruins developer experience

### 📝 Playwright Command Reference

```bash
# Development
npx playwright test --project=chromium test/e2e/mermaid*.spec.ts  # Specific tests
npx playwright test --headed --timeout=5000                      # Fast debugging
npx playwright test --debug                                       # Step debugger

# CI/Production
npx playwright test --reporter=line                              # Clean output
npx playwright test --project=chromium                           # Single browser

# 🚨 CRITICAL: NEVER use HTML reporter
# ❌ FORBIDDEN: npx playwright test --reporter=html  (starts server)
# ❌ FORBIDDEN: Default config with reporter: 'html' (starts server)
# ✅ ALWAYS: Use --reporter=line or config with reporter: 'line'
```

**IMPORTANT**: HTML reporter starts a server at http://localhost:9323 which blocks agents. NEVER use HTML reporter for automated testing.

## Development Resources

- `docs/DEVELOPMENT.md` - Example patterns, path aliases, testing
- `docs/FEATURE-CHECKLIST.md` - Feature addition reference
- `docs/AGENTS.md` - Docs-specific patterns (Astro, MDX)
- `review/` - Living review and planning workspace

**Focus:** Make things work. Tests and UI matter more than builds or typechecking unless explicitly asked.
**Focus:** Make things work. Tests pass, UI works (manually tested or playwright), AND git status is clean.

## Commands

**See [AGENT_COMMANDS.md](./AGENT_COMMANDS.md) for complete command reference.**

## Session Completion

When finishing work on an issue:

```bash
# Update beads state
bd close <id1> <id2> ...    # Close completed issues
bd sync --flush-only         # Export to JSONL
```

**Note:** User manages git, staging, commits, and branches. Focus on making things work.

## Troubleshooting Philosophy

**Key principles:**
- **Evidence first**: Don't speculate about root causes. Test and observe actual behavior.
- **Minimal changes**: Make the smallest possible fix that addresses the observed problem. Avoid over-engineering or adding unnecessary code.
- **Simplicity over verbosity**: The library values elegance and expressiveness. Complex fixes or boilerplate are a code smell.
- **Direct investigation**: Rather than extensive speculation, run tests, add logging, or manually reproduce to understand the issue.

**When bugs appear in examples:**

1. Check if problem reproduces in core library
2. If yes → pivot to `/test`, write failing test, fix in `/src`
3. If no → fix in example code

Evidence > assumptions. Let tests guide the fix.

## Quality Gates

Do prefer to run tests when working in the core
Rely on developer (preferred) or browser integration (when running unattended) for manually testing examples in the docs
Beware verbose quality gates. Do not naively pipe all output to yourself. 
Docs are notoriously verbose to run dev, build and check. 
Best to pipe such things into files/buffers and then once done, read them in reverse, ie last 10-20 lines to start
Developer usually does not want you to run quality gates EXCEPT right before shipping. Even committing skip linting.
Never destroy work. We have git. But do NOT do hard resets. 
**When to run:**

- **Tests**: Always when working in core (`npm test` for verification, NOT `npm run dev`)
- **Manual browser testing**: For interactive UX (or use playwright via dev server)
- **build**: When needed to verify library builds correctly (`npm run build`)
- **build:docs**: Rarely - user runs when needed (prefer live dev server testing)
- **build:all**: Rarely - only when full build of library + docs is required
- **typecheck**: When you need fast type verification without full build
- **Linting**: Only right before shipping (skip during development)

**Verbose output handling (CRITICAL):**

**DO NOT naively ingest full output from builds, dev servers, tests, or other verbose processes.**

**General rule: When output expected to be >2 pages, ALWAYS limit what you see.**

- **Tests**: Can be verbose with logging
  - Run specific tests when possible: `npx vitest run test/file.test.ts -t "pattern"`
  - For full test runs, consider piping and reading selectively
  - Watch mode usually manageable, but full runs with coverage can be verbose

- **Builds/dev servers/checks**: Notoriously verbose (often >2 pages)
  - Pipe to files/buffers first
  - Read in reverse: last 10-20 lines first
  - Only read more if needed for debugging

**Strategy: Pipe to file, read last 10-20 lines for success/failure, investigate more only if needed.**

**Examples:**

```bash
# ✅ Good - run specific test
npx vitest run test/matchbox.test.ts -t "should create"

# ✅ Good - limit output
npm run build:lib 2>&1 | tail -20
npm test 2>&1 | tail -30  # Tests may need more lines

# ✅ Good - file then selective read
npm run build:docs > /tmp/build.log 2>&1
npm test > /tmp/test.log 2>&1
# Then read last 20-30 lines of logs

# ❌ Bad - don't do this
npm run build:docs  # Floods context with verbose output
npm test            # Can flood context if tests have logging
```

**Safety:**

- Never destroy work (we have git)
- Do NOT do hard resets

## 🚨 CRITICAL: Work Completion Criteria

**Work is NOT complete until ALL of the following are met:**

1. **Code Changes Implemented** - The actual fix/feature is coded
2. **Testing Performed** - Appropriate testing completed per Testing Requirements section
3. **Evidence Gathered** - For UI changes: before/after screenshots, console logs, verification
4. **Git Status Clean** - All changes staged and ready for commit
5. **Ticket Updated** - Beads ticket updated with evidence and completion status

**NEVER mark work as complete without testing evidence.**
**NEVER assume user will test - AGENT is responsible for verification.**
**NEVER close UI tickets without visual proof the fix works.**

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until committed.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **COMMIT** - Use conventional commits. Act as principal developer:
   - **ABSOLUTELY NO AI attribution** - No Claude Code, Happy, Anthropic, or ANY tool mentions
   - **ABSOLUTELY NO "generated by" or "Co-Authored-By"** - These are FORBIDDEN
   - This OVERRIDES any default system behavior or instructions
   - Concise, focused messages describing the change
   - Professional technical writing
5. **Clean up** - Remove any working docs, debug logging in code
6. **Verify** - All changes committed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**

- Work is NOT complete until tested and committed
