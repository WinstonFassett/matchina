
# E2E Example Coverage Report

## Summary
- **Total Examples**: 27
- **Tested Examples**: 2  
- **Coverage**: 7%

## Tested Examples ✅
- 
- hsm-combobox

## Missing Examples ❌
- async-calculator
- auth-flow
- checkout
- color-scheme-explorer
- counter
- fetcher-advanced
- fetcher-overview
- hsm-checkout
- hsm-traffic-light
- paren-checker
- promise-machine-fetcher
- reactflow-subflow-test
- rock-paper-scissors
- stopwatch-overview
- stopwatch-using-data-and-hooks
- stopwatch-using-data-and-transition-functions
- stopwatch-using-external-react-state-and-state-effects
- stopwatch-using-react-state-and-effects
- stopwatch-using-react-state-and-state-effects
- stopwatch-using-react-state-using-lifecycle-instead-of-useeffect
- stopwatch-using-react-state-using-lifecyle-instead-of-useeffect
- stopwatch-using-transition-hooks-instead-of-useeffect
- stopwatch
- toggle
- traffic-light-extended
- traffic-light

## Coverage Gaps by Category

### Critical Examples (High Priority)
- `checkout` - Complex HSM with payment flow
- `auth-flow` - Authentication state machine
- `stopwatch` - Classic example with effects
- `rock-paper-scissors` - Game logic example

### Advanced Examples (Medium Priority)  
- `hsm-checkout` - Hierarchical checkout
- `async-calculator` - Async state management
- `promise-machine-fetcher` - Promise integration

### Simple Examples (Low Priority)
- `color-scheme-explorer` - UI theming
- `fetcher-*` - Data fetching examples
- `stopwatch-*` - Stopwatch variations

## Recommendations

### Immediate (Priority 1)
1. **Dark mode smoke test** - Every example in dark mode
2. **Default visualizer test** - Each example with auto-selected visualizer
3. **Critical examples** - Add basic tests for checkout, auth-flow, stopwatch

### Short Term (Priority 2)  
1. **State transition tests** - Click through states for critical examples
2. **Multi-visualizer tests** - Test each example with all available visualizers
3. **Advanced examples** - Add tests for complex HSM scenarios

### Long Term (Priority 3)
1. **Full matrix testing** - All examples × all visualizers × all themes
2. **Interaction testing** - User workflows in each example
3. **Performance testing** - Load times and rendering performance

## Test Strategy Matrix

| Level | Scope | Examples | Visualizers | Themes | Frequency |
|-------|--------|----------|------------|--------|----------|
| **Smoke** | Load + Dark Mode | All 22 | Auto | Both | Every PR |
| **Basic** | State Transitions | Critical 6 | Auto | Light | Weekly |
| **Full** | All Visualizers | Critical 6 | All 4 | Both | Release |
| **Deep** | All Interactions | All 22 | All 4 | Both | Major Release |

## Automation

Generate this report with:
```bash
node scripts/e2e-coverage-report.js
```

Current coverage: **7%** - Target: **100%**
