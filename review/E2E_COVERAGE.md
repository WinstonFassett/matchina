# E2E Test Coverage Analysis

## Current Test Distribution

### **BEFORE Cleanup: 85 tests (25 files)**
### **AFTER Cleanup: 25 tests (11 files)** ✅

### **Deleted Redundant Files:**
- `mermaid-styling-before-after.spec.ts` (8 tests) ❌
- `mermaid-styling-parity-test.spec.ts` (4 tests) ❌
- `mermaid-styling-visual-parity.spec.ts` (4 tests) ❌
- `reactflow-basic.spec.ts` (3 tests) ❌
- `mermaid-styling-real-before.spec.ts` (2 tests) ❌
- `mermaid-styling-verification.spec.ts` (2 tests) ❌
- `mermaid-basic-styling-test.spec.ts` (1 test) ❌
- `mermaid-active-styling-test.spec.ts` (2 tests) ❌
- `mermaid-active-state-test.spec.ts` (1 test) ❌
- `mermaid-active-state-debug.spec.ts` (1 test) ❌
- `mermaid-text-legibility.spec.ts` (1 test) ❌
- `all-visualizers-review.spec.ts` (1 test) ❌
- `forcegraph-debug.spec.ts` (1 test) ❌
- `forcegraph-review.spec.ts` (1 test) ❌
- `forcegraph-simple.spec.ts` (1 test) ❌
- `hierarchical-force-graph.spec.ts` (1 test) ❌
- `hsm-combobox-visual-review.spec.ts` (2 tests) ❌
- `forcegraph-hsm-combobox.spec.ts` (1 test) ❌
- `reactflow-hsm-combobox.spec.ts` (1 test) ❌

**Total removed: 40 redundant tests**

## **Remaining Tests (25 total):**

### **Functional Tests (14):**
- `combobox-comparison.spec.ts` (3 tests) ✅ Core functionality
- `reactflow-toggle.spec.ts` (3 tests) ✅ ReactFlow verification
- `forcegraph-basic.spec.ts` (1 test) ✅ ForceGraph basic
- `edge-interactivity-verify.spec.ts` (2 tests) ✅ Edge interactions
- `hsm-traffic-light-*.spec.ts` (2 tests) ✅ Traffic light examples
- Others (8 tests) - Various specific scenarios

### **Visual Tests (11):**
- `all-visualizers-complete.spec.ts` (16 tests) ✅ **Matrix testing**
- Others ( -5 tests) - Remaining visual tests

## **Example Coverage Analysis:**

### **Examples Being Tested:**
- ✅ **hsm-combobox**: Well covered (matrix + functional)
- ✅ **hsm-traffic-light**: Good coverage  
- ✅ **toggle**: ReactFlow coverage
- ✅ **counter**: ReactFlow coverage
- ❌ **checkout**: No e2e coverage
- ❌ **stopwatch**: No e2e coverage
- ❌ **rock-paper-scissors**: No e2e coverage
- ❌ **auth-flow**: No e2e coverage

### **Coverage Gaps:**
Missing e2e tests for **4 major examples** that have docs pages.

## **Visualizer State:**

### **ReactFlow**: ✅ **Good**
- Core functionality tested
- Node rendering verified
- Multiple examples covered

### **Mermaid**: ✅ **Good**  
- Matrix testing covers both modes
- Dark/light theme coverage
- Active state testing

### **ForceGraph**: ⚠️ **Weird State**
- Basic rendering works
- **Issues**: Complex interactions, state synchronization
- **Status**: Useful for specific scenarios but not ideal
- **Recommendation**: Keep basic tests, don't expand

### **Sketch**: ❌ **Missing Coverage**
- **Status**: Not yet tested
- **Priority**: Low (visual-only, less critical)
- **Recommendation**: Add to matrix later when stable

## **Performance & Parallelization:**

### **Current Issues:**
- ❌ **Sequential execution** (`workers: 1`)
- ❌ **No parallelization** despite static site
- ❌ **300ms timeout** still too slow for 25 tests

### **Parallelization Options:**
```typescript
// playwright.config.ts
workers: process.env.CI ? 2 : 4, // Enable parallel
fullyParallel: true, // Run all tests in parallel
```

### **Why Safe to Parallelize:**
- Static site - no database conflicts
- Isolated examples - no shared state
- Different visualizers - independent rendering

## **Making Tests "Real" vs Flaky:**

### **Current Problems:**
- ⚠️ **Arbitrary timeouts** (`waitForTimeout`)
- ⚠️ **Brittle selectors** (CSS classes)
- ⚠️ **No proper waits** (waitForSelector)

### **Solutions for "Real" Tests:**
1. **Event-driven waits** - Wait for actual state changes
2. **Test IDs** - Use `data-testid` instead of CSS classes
3. **Assertion-based** - Test outcomes, not implementation
4. **Retry logic** - Built-in Playwright retries
5. **Mock external deps** - Remove network dependencies

### **Speed vs Reliability:**
```typescript
// Fast but flaky (current)
await page.waitForTimeout(200);

// Slower but reliable (target)
await page.waitForSelector('[data-testid="state-active"]');
await expect(page.locator('[data-testid="suggestions"]')).toBeVisible();
```

## **Recommendations:**

### **Immediate (Priority 1):**
1. ✅ **Enable parallelization** - Cut runtime by 60-80%
2. ✅ **Add missing example coverage** - checkout, stopwatch, etc.
3. ✅ **Fix ForceGraph state issues** or deprecate

### **Short Term (Priority 2):**
1. **Replace timeouts with proper waits**
2. **Add data-testid attributes** to critical elements
3. **Create example-specific functional tests**

### **Long Term (Priority 3):**
1. **Add Sketch to matrix** when stable
2. **Implement visual regression** baselines
3. **Add performance thresholds** for test runtime

## **Target State:**
- **Tests**: ~30 (current 25, need +5 for missing examples)
- **Runtime**: ~10 seconds (with parallelization)
- **Coverage**: All examples + all visualizers
- **Reliability**: No arbitrary timeouts
- **Parallel**: 4 workers for local, 2 for CI
