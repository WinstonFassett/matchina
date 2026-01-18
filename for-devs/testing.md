# Testing Strategy

## Testing Philosophy

Matchina uses a multi-layered testing approach:
- **Unit tests** for core logic and edge cases
- **Integration tests** via realistic examples
- **E2E tests** for visual validation

## Unit Tests (/test)

### What to Test
- **Type inference** - Verify TypeScript compilation
- **Runtime behavior** - State transitions, event handling
- **Edge cases** - Error conditions, invalid inputs
- **Composition** - Multiple primitives working together

### Test Structure
```typescript
import { describe, it, expect } from 'vitest';
import { createMachine } from '../src/factory-machine';

describe('FeatureName', () => {
  it('should handle basic transitions', () => {
    const machine = createMachine(states, transitions, "Initial");
    // Test implementation
  });
  
  it('should maintain type safety', () => {
    const machine = createMachine(states, transitions, "Initial");
    // Type assertions
  });
});
```

### Running Tests
```bash
npm test                    # All tests with coverage
npx vitest run test/file.test.ts    # Specific test
npx vitest run -t "pattern"       # Matching tests
npm run test:types           # Type checking only
```

## Integration Tests (Examples)

### Examples as Tests
Examples in `docs/src/code/examples/` serve as integration tests:
- **Real-world usage patterns**
- **Type inference validation**
- **Visual verification** through documentation

### Critical Examples
These must always work:
- **hsm-combobox** - Hierarchical state machines
- **hsm-traffic-light** - Complex state patterns
- **toggle** - Basic state machine
- **hsm-checkout** - Real-world application
- **rock-paper-scissors** - Game logic

### Example Test Pattern
```typescript
// In example.tsx
export default function Example() {
  const machine = createToggleMachine();
  return (
    <MachineVisualizer 
      machine={machine}
      title="Toggle Example"
    />
  );
}
```

## E2E Testing (/test/e2e)

### Purpose
- **Visual validation** - Screenshots and regression testing
- **User interaction** - Click, type, form submission
- **Cross-browser** - Multiple browser compatibility

### Test Categories
```
test/e2e/
├── functional/     # Real e2e functionality tests
├── visual/         # Screenshot & visual regression tests
└── debug/          # Agent observation tools
```

### Running E2E Tests
```bash
npm run test:e2e              # All E2E tests
npm run test:e2e:smoke         # Quick visual verification
npm run test:e2e:smoke:headed  # With browser visible
npm run test:e2e:ui            # Debug mode
```

### E2E Agent Guidance
**When to run E2E:**
- After UI changes that could affect examples
- When verifying fixes to visual regressions
- When task explicitly requires testing validation

**When NOT to run E2E:**
- Documentation or code organization tasks
- When you don't understand the task context
- When running tests would be pointless

## Coverage and Quality

### Coverage Requirements
- **Core library**: 95%+ coverage
- **Integrations**: 90%+ coverage
- **Examples**: Manual verification

### Quality Gates
- **No `as any` or `@ts-ignore`** in production code
- **All type errors fixed** before merging
- **Examples compile and run** without errors
- **Documentation matches implementation**

## Testing Tools

### Vitest Configuration
- **Watch mode**: `npm run dev` for development
- **Coverage**: Automatically included in `npm test`
- **Type checking**: `npm run test:types`

### Playwright Configuration
- **Browsers**: Chromium only (CI), all browsers (local)
- **Viewport**: 1280x900
- **Workers**: 4 (local), 2 (CI)

### Continuous Integration
- **Tests run** on every pull request
- **Coverage reported** and must meet thresholds
- **E2E tests** validate visual regressions
