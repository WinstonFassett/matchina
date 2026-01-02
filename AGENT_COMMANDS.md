# Agent Commands Reference

## 🚨 CRITICAL: Agent Command Guidelines

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
