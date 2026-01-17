# Agent Instructions for Matchina

For development patterns, see `DEVELOPMENT.md`.

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

### Finding Work
**CRITICAL: ALWAYS CHECK GIT STATUS BEFORE/AFTER WORK**

```bash
git status           # MUST check before starting work
git status           # MUST check after completing work
git add .            # Stage changes
git commit -m "..."  # Commit work before moving to next ticket
```

## 🚨 CRITICAL: Agent Commands

### ✅ Agent-Preferred Commands
```bash
npm test                 # Primary verification (runs tests with coverage)
npm run test:types       # Fast type checking only  
npm run test-build       # Comprehensive validation (types + docs)
```

**Note**: Coverage is automatically included in `npm test`. If tests fail, fix them first - coverage won't report properly until tests pass.

### 🎭 Playwright (UI Testing)
```bash
# Fast failure debugging
npx playwright test --timeout=5000           # 5s timeout, fail fast
npx playwright test --headed                 # Console logs + visible
npx playwright test --debug                  # Step through debugging

# Production
npx playwright test --reporter=line          # Clean CI output
```

**🚨 CRITICAL**: Console logs ONLY available in `--headed` mode. Use short timeouts to fail fast.

### ⚠️ Build Scripts (Use Sparingly)
```bash
npm run build            # Build core library only (rarely needed)
npm run build:all        # Build library + docs (SLOW, avoid unless needed)
```

### 🚨 FORBIDDEN - NEVER RUN AS AGENT:
```bash
npm run dev              # Vitest watch (runs forever, blocks agent)
npm run dev:docs         # Live dev server (runs forever, blocks agent)
npm run dev:all          # Both servers (runs forever, blocks agent)
```

## Key Principles
- **Prefer tests over builds** - `npm test` for verification, NOT builds
- **`npm run build` only builds core library** - doesn't validate examples/docs
- **Never run dev scripts** - they run forever and block momentum
- **Use `npm run test:types` for fast type checking**
- **Use `npm run test-build` for comprehensive validation**
- **Playwright: Use test IDs, short timeouts, headed mode for console logs**
- **Separate real tests from diagnostic tools** - don't commit diagnostics as tests

## User-Only Commands
(Agents assume these are already running)
```bash
npm --workspace docs run dev    # Astro dev server
npm run dev:docs              # Live dev server (human only)
npm run build:docs            # Build docs (user runs when needed)
npm run release/publish       # Release process (user only)
```

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
- `local/` - Local living docs, review and planning workspace

**Focus:** Make things work. Tests and UI matter more than builds or typechecking unless explicitly asked.
**Focus:** Make things work. Tests pass, UI works (manually tested or playwright), AND git status is clean.

## Commands

**See [AGENT_COMMANDS.md](./AGENT_COMMANDS.md) for complete command reference.**

## Session Completion

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
5. **Task Memory Checked and Updated** - If using some form of task memory, todos, plan or other tracking, update with evidence and completion status

**NEVER mark work as complete without testing evidence.**

## 📸 Screenshot Automation

### Direct Method (Preferred)
Use Playwright CLI for direct screenshots to target location:

```bash
npx playwright screenshot --color-scheme=dark --viewport-size=1920,1080 --wait-for-selector="selector" <url> <output-path>
```

**Key Options:**
- `--color-scheme=dark` - Automatic dark mode
- `--viewport-size=1920,1080` - Proper dimensions
- `--wait-for-selector="selector"` - Wait for element before capture
- `--full-page` - Full page screenshots (optional)

**Examples:**
```bash
# Layout screenshot
npx playwright screenshot --color-scheme=dark --viewport-size=1920,1080 --wait-for-selector="button[data-testid='hsm-layout-trigger']" http://localhost:4321/matchina/examples/traffic-light /Users/winston/dev/personal/matchina/review/screenshots/sugiyama-traffic-light.png

# Batch capture script
./scripts/capture-layout-screenshots.sh
```

### MCP Method (Limited)
- MCP Playwright tool restricted to temp directory
- Requires manual copying: `cp temp/file.png target/location.png`
- Use only when interactive browser control needed
- Less efficient for batch operations

### Automation Script
**Location**: `/scripts/capture-layout-screenshots.sh`
**Usage**: `./scripts/capture-layout-screenshots.sh [--verbose]`
**Features**: 
- Batch capture all layouts and examples
- Automatic dark mode and proper sizing
- Progress tracking and error handling
- Direct output to target directory

### URL-Based Visualizer Control (NEW!)
**Direct URL control** - No manual clicking required:
```bash
# Format
http://localhost:4321/matchina/examples/{example}?viz={visualizer}&layout={layout}&settings={encoded-settings}

# Examples
http://localhost:4321/matchina/examples/traffic-light?viz=reactflow&layout=sugiyama
http://localhost:4321/matchina/examples/hsm-combobox?viz=reactflow&layout=grid&settings=%7B%22cols%22%3A4%7D
```

**Enhanced automation script**: `/scripts/capture-enhanced-screenshots.sh`
```bash
# Multiple capture modes
./scripts/capture-enhanced-screenshots.sh basic      # Basic layouts with app defaults
./scripts/capture-enhanced-screenshots.sh all         # All layouts with app defaults

# Target specific configurations
./scripts/capture-enhanced-screenshots.sh -e traffic-light -l grid
```

**Features:**
- Captures all visualizers × layouts × examples
- Tests app's default settings (no hardcoded presets)
- Automatic dark mode and proper sizing
- Progress tracking and error handling
- Direct output to target directory

**URL builder utility**: `/scripts/build-visualizer-urls.sh`
```bash
./scripts/build-visualizer-urls.sh  # Generate example URLs
```

**Requirements:**
- Playwright installed: `npx playwright install`
- Dev server running: `npm run dev:docs`
- jq installed for JSON encoding (URL-based control)
- Output directory writable

### 🖼️ Fast Example Gallery Capture (NEW!)
**Quick visual overview of all examples**:
```bash
# Capture all examples with defaults (FAST!)
./scripts/capture-example-gallery.sh

# Auto-generates: review/EXAMPLE_GALLERY.md
```

**Features:**
- **Lightning fast** - Captures 13 examples with defaults
- **No layout switching** - Uses each example's default visualizer
- **Auto documentation** - Generates markdown gallery with all images
- **Visual overview** - See every example at a glance
- **Quick updates** - Re-run to refresh entire gallery
- **Proper auto-zoom** - Waits for ReactFlow V2 auto-zoom to complete
- **MachineVisualizer only** - Only captures actual visualizer components

**Perfect for:**
- Quick visual verification of all examples
- Documentation updates
- Review meetings
- Portfolio/showcase
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
