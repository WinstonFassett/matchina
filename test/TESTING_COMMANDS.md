# Focused Testing Commands

This document provides quick reference for running focused tests instead of entire test suites.

## E2E Testing (Playwright)

### General Commands
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI for debugging
npm run test:e2e:ui

# Run in debug mode
npm run test:e2e:debug
```

### Visualizer-Specific Tests
```bash
# Run only Mermaid visualizer tests
npm run test:e2e:mermaid

# Run only ReactFlow visualizer tests  
npm run test:e2e:reactflow

# Run only ForceGraph visualizer tests
npm run test:e2e:forcegraph

# Run only visual regression tests
npm run test:e2e:visual
```

### Single File Testing
```bash
# Run a specific test file
npm run test:e2e:file test/e2e/mermaid-diagram-type-comparison.spec.ts

# Run with grep pattern
npm run test:e2e:file -- --grep "specific test name"
```

## Unit Testing (Vitest)

```bash
# Run all unit tests with coverage
npm run test

# Run in watch mode for development
npm run dev

# Run specific test file
npx vitest run test/path/to/test.spec.ts
```

## Usage Examples

### Debugging a Mermaid Issue
```bash
# Run only Mermaid tests in debug mode
npm run test:e2e:debug -- test/e2e/mermaid-diagram-type-comparison.spec.ts
```

### Testing ReactFlow Changes
```bash
# Run only ReactFlow tests
npm run test:e2e:reactflow

# Or run a specific ReactFlow test
npm run test:e2e:file test/e2e/reactflow-layout.spec.ts
```

### Quick Visual Regression Check
```bash
# Run only visual tests
npm run test:e2e:visual
```

## Tips

1. **Use specific commands** - Avoid running `npm run test:e2e` when debugging specific issues
2. **Add new test scripts** - Follow the pattern `test:e2e:visualizername` for new visualizers  
3. **Use debug mode** - `test:e2e:debug` provides browser dev tools for debugging
4. **Check screenshots** - Visual tests save screenshots to `review/screenshots/` for comparison
