# E2E Testing Guide

## Quick Start

```bash
# Run all E2E tests
npm run test:e2e

# Smoke tests (visual verification)
npm run test:e2e:smoke

# With browser visible
npm run test:e2e:smoke:headed

# Debug mode
npm run test:e2e:ui
npm run test:e2e:debug
```

## Test Structure

```
test/e2e/
├── debug/          # Agent observation tools (excluded from CI)
├── functional/     # Real e2e functionality tests
└── visual/         # Screenshot & visual regression tests
```

## Running Specific Tests

```bash
# By example name
npx playwright test --grep "checkout"

# HSM examples
npx playwright test --grep "hsm-"

# Simple examples
npx playwright test --grep "toggle|counter|traffic-light"
```

## Configuration

- **Local**: 4 workers
- **CI**: 2 workers
- **Browser**: Chromium only
- **Viewport**: 1280x900

## Troubleshooting

- Check dev server is running
- Verify example path in URL
- Check testMatch patterns
