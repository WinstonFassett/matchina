# E2E Testing - Current Status & Action Plan

## 📍 **Where We Are Now**

### **Test Count: 47 files**
- **Functional:** 14 files
- **Visual:** 11 files  
- **Debug:** 22 files (excluded from CI)

### **Coverage: 7% (2/27 examples)**
- ✅ Tested: hsm-combobox, hsm-traffic-light
- ❌ Missing: 25 examples (including critical ones)

## 🎯 **Current Action Plan**

### **Phase 1: Immediate (This Sprint)**
1. **Add smoke tests for all 27 examples**
2. **Generate visual regression baselines**
3. **Test current setup with headed mode**

### **Phase 2: Next Sprint**  
1. **Add functional tests for critical examples**
2. **Implement snapshot testing**
3. **Add accessibility testing**

### **Phase 3: Future**
1. **Full visual regression matrix**
2. **Performance testing**
3. **Cross-browser testing**

## 🧪 **Tests You Can Run Right Now**

### **Quick Status Check**
```bash
# See what tests exist
find test/e2e -name "*.spec.ts" | wc -l  # Should show 47

# Run current tests (parallel, 300ms timeout)
npm run test:e2e
```

### **Debug with Headed Mode**
```bash
# Watch tests run in browser (for console logs)
npx playwright test --headed

# Debug specific test with step-through
npx playwright test --headed test/e2e/functional/combobox-comparison.spec.ts

# UI mode for interactive testing
npm run test:e2e:ui
```

### **Run Specific Categories**
```bash
# Only functional tests
npx playwright test test/e2e/functional/

# Only visual tests  
npx playwright test test/e2e/visual/

# Specific test file
npx playwright test test/e2e/functional/combobox-comparison.spec.ts
```

### **Coverage Analysis**
```bash
# Generate current coverage report
node scripts/e2e-coverage-report.js

# View detailed report
cat review/E2E_COVERAGE_REPORT.md
```

## 🔧 **Headed Mode Configuration**

### **For Agent Debugging (Console Logs)**
```bash
# Method 1: Single test with console
npx playwright test --headed test/e2e/functional/combobox-comparison.spec.ts

# Method 2: All tests with console (slow but comprehensive)
npx playwright test --headed --reporter=list

# Method 3: Specific grep with console
npx playwright test --headed --grep "combobox"
```

### **For Visual Verification**
```bash
# Watch visual tests render
npx playwright test --headed test/e2e/visual/all-visualizers-complete.spec.ts

# See screenshots being taken
npx playwright test --headed --reporter=list test/e2e/visual/
```

### **Playwright Config for Headed**
Current config has `headless: true` by default. To override:

```bash
# Temporary headed mode
npx playwright test --headed

# Or update playwright.config.ts temporarily
headless: false, // For debugging session
```

## 📊 **Test Status Matrix**

| Test Type | Files | Status | Issues |
|-----------|-------|--------|---------|
| **Smoke Tests** | 0 | ❌ **MISSING** | Need to create for all 27 examples |
| **Functional** | 14 | ✅ **WORKING** | Only 2 examples covered |
| **Visual** | 11 | ✅ **WORKING** | Matrix testing but limited examples |
| **Debug** | 22 | ✅ **WORKING** | Agent tools, excluded from CI |

## 🚀 **Recommended Test Run Order**

### **1. Quick Health Check**
```bash
npm run test:e2e  # Should run fast with current 25 tests
```

### **2. Debug with Headed Mode**
```bash
npx playwright test --headed test/e2e/functional/combobox-comparison.spec.ts
```

### **3. Coverage Analysis**
```bash
node scripts/e2e-coverage-report.js
```

### **4. Visual Verification**
```bash
npx playwright test --headed test/e2e/visual/all-visualizers-complete.spec.ts
```

## ⚡ **What to Expect**

### **Current Tests Should:**
- ✅ Run in ~10-15 seconds (parallel execution)
- ✅ Show 300ms timeout failures (fast fail)
- ✅ Test hsm-combobox and hsm-traffic-light functionality
- ✅ Test visual matrix (16 tests)

### **Known Issues:**
- ⚠️ Many tests still use arbitrary timeouts
- ⚠️ Some selectors may be brittle
- ⚠️ Visual tests need baseline screenshots
- ⚠️ Coverage gap (only 2/27 examples)

### **Headed Mode Benefits:**
- ✅ See browser actions in real-time
- ✅ Access DevTools for debugging
- ✅ Capture console logs from components
- ✅ Visual verification of rendering

## 🎯 **Next Actions**

### **Immediate (Today)**
1. **Run current tests** to verify setup
2. **Use headed mode** to debug any failures
3. **Generate coverage report** to see gaps

### **This Week**
1. **Create smoke tests** for all 27 examples
2. **Generate visual baselines** for regression testing
3. **Fix any selector/timeout issues**

### **Next Sprint**
1. **Add functional tests** for critical examples
2. **Implement snapshot testing** strategy
3. **Add accessibility testing**

## 🔧 **Development Workflow**

### **Daily Development**
```bash
# 1. Make changes
# 2. Quick test
npm run test:e2e
# 3. Debug if needed
npx playwright test --headed --grep "example-name"
# 4. Generate coverage
node scripts/e2e-coverage-report.js
```

### **Before PR**
```bash
# Full test suite
npm run test:e2e

# Coverage verification
node scripts/e2e-coverage-report.js

# Visual regression check
npx playwright test test/e2e/visual/
```

This plan gives you **immediate actions** to take and **clear visibility** into current status and next steps.
