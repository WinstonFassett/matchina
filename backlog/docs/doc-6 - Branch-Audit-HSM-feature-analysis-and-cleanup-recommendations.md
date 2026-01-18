---
id: doc-6
title: Branch Audit - HSM feature analysis and cleanup recommendations
type: other
created_date: '2026-01-17 23:21'
---

# Branch Audit: feat/hsm-dual-mode-with-viz-and-examples

## Documentation Review

### Issues Found

#### Color Scheme Explorer (Junk)
- **File**: `docs/src/content/docs/examples/color-scheme-explorer.mdx`
- **Problem**: Conceptual exploration, not needed in docs
- **Component**: `MatchinaColorPalette.tsx` - themeable inspector experiment
- **Recommendation**: Hide/remove from docs, not core value

#### HSM Documentation (Good)
- **File**: `docs/src/content/docs/guides/hierarchical-machines.mdx`
- **Status**: Comprehensive, well-structured
- **Content**: Good guidance on when to use HSMs, flattening vs propagation
- **Recommendation**: Keep, maybe minor updates for API changes

### Documentation Changes vs Main
- Multiple new MDX files for HSM examples
- Lifecycle docs possibly updated
- README changes in this branch

## Test Analysis

### E2E Tests (Questionable Quality)
- **Location**: `test/e2e/functional/`
- **Issues**: Unknown selector quality, may not use test IDs
- **Coverage**: Functional tests, smoke tests
- **Recommendation**: Audit for selector quality, test only critical paths

### Example Tests vs E2E Tests
- **Example tests**: Unit/integration level
- **E2E tests**: Full browser automation
- **Functional vs Smoke**: Different purposes, unclear separation

### Core Tests to Review
- `declarative-flat.test.ts` - Semantic naming issues
- Shape/inspector overlap - needs investigation
- HSM integration tests

## Code Hygiene Issues

### Naming & Refactoring Needed
1. **describeHSM** function naming inconsistency
2. **Shape vs Inspector overlap** - unclear boundaries
3. **HSM detachment from shape/inspector** - needed separation
4. **Semantic naming** - multiple areas need review

### Architecture Issues
1. **Shape-inspector-HSM coupling** - needs decoupling
2. **Color theming approach** - CSS variables vs class names
3. **Package structure** - viz packages extraction in progress

## Files to Remove/Hide

### Color Scheme Explorer
- `docs/src/content/docs/examples/color-scheme-explorer.mdx`
- `docs/src/components/MatchinaColorPalette.tsx`
- Related theme exploration code

### Backlog Visibility
- `backlog/` directory showing in diff (should be gitignored)
- Task files visible in branch comparison

## E2E Documentation Review
- **File**: `docs/E2E.md` - Outdated and problematic
- **Issues**: 
  - 7% coverage panic (2/27 examples) - alarmist approach
  - Complex priority matrix with arbitrary levels
  - "Massive coverage gap" language - unprofessional
  - Over-engineered testing strategy
  - Questionable selector advice (`.machine-visualizer` generic)
- **Recommendation**: Simplify to critical examples only, remove fluff

## Recommendations

### Immediate Actions
1. **Hide color scheme explorer** from navigation
2. **Audit E2E tests** for selector quality and necessity
3. **Review documentation changes** vs main for accuracy
4. **Plan naming refactoring** in separate ticket

### Medium Priority
1. **Decouple shape/inspector/HSM** code
2. **Consolidate example sprawl** (multiple stopwatches)
3. **Review package dependencies** and auto-update behavior

### Documentation Strategy
1. **Keep HSM guide** - high quality content
2. **Review example MDX** for compellingness
3. **Assess lifecycle docs** for updates needed
4. **Evaluate README changes** in this branch

## Test Strategy
- Focus on critical examples: hsm-combobox, hsm-traffic-light, toggle, hsm-checkout, rps-game
- Use dev server for validation, not test suites
- Browser-based testing over command line
- Specific example testing, not blanket coverage

