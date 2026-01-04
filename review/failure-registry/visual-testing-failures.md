# Visual Testing Failure Registry
**Purpose**: Document critical failures to prevent repetition  
**Maintainer**: AI Agents working on visual systems  
**Updated**: January 4, 2026

---

## 🚨 Failure Registry Index

| ID | Date | Severity | System | Status | Root Cause |
|-----|------|----------|---------|---------|------------|
| VTF-001 | 2026-01-04 | CRITICAL | Adversarial Visual Comparison | FIXED | Not using shared test infrastructure |

---

## VTF-001: Adversarial Visual Comparison System Failure

### 📋 **Failure Summary**
**Date**: January 4, 2026  
**Severity**: CRITICAL  
**System**: Adversarial Visual Comparison Agent  
**Impact**: AI analyzing wrong content, meaningless scores, wasted effort

### 🎯 **What Went Wrong**

#### Primary Failures:
1. **Wrong Target Capture**: Capturing entire document frame instead of focused visualizer area
2. **No Visualizer Verification**: Not checking which visualizer was actually selected
3. **AI Analyzing Chrome**: AI scoring documentation chrome instead of actual visualizer content
4. **No Validation**: No confirmation that ReactFlow/ForceGraph actually loaded
5. **Meaningless Metrics**: Scoring system completely broken due to wrong content analysis

#### Technical Details:
- ❌ Used full page screenshot instead of `.machine-visualizer > div:last-child`
- ❌ No validation of visualizer picker selection
- ❌ No wait for visualizer-specific elements (`.react-flow__node`, `canvas`)
- ❌ AI prompts didn't include visualizer context
- ❌ No verification that target visualizers were available

### 🔍 **Root Cause Analysis**

#### Immediate Cause:
```javascript
// WRONG - Capturing full document
npx playwright screenshot http://localhost:4321/matchina/examples/toggle full-page.png

// SHOULD HAVE BEEN - Using focused selector
page.locator('.machine-visualizer > div:last-child').screenshot()
```

#### Systemic Cause:
- **Ignored existing shared infrastructure** in `test-helpers.ts`
- **Reinvented wheel** instead of using proven patterns
- **No validation** of visualizer availability/selection
- **Poor understanding** of visualizer preset system

### ✅ **Solution Implemented**

#### Infrastructure Used:
```typescript
// From test-helpers.ts - EXISTING SOLUTIONS
SELECTORS.mainContent = '.machine-visualizer > div:last-child'
selectVisualizer(page, visualizer, preset)
waitForVisualizer(page, visualizer)
takeFocusedScreenshot(page, name)
```

#### Verification Results:
```
📋 Current visualizer: null
🔄 Attempting to switch to ReactFlow...
✅ ReactFlow loaded successfully
📸 ReactFlow screenshot saved: verification-reactflow.png  
🔄 Attempting to switch to ForceGraph...
✅ ForceGraph loaded successfully
📸 ForceGraph screenshot saved: verification-forcegraph.png
```

### 📚 **Lessons Learned**

#### Critical Principles:
1. **ALWAYS use existing shared infrastructure** - don't reinvent
2. **VERIFY what you're actually capturing** - confirm visualizer selection
3. **VALIDATE target elements exist** - wait for visualizer-specific selectors
4. **PROVIDE context to AI** - tell it what visualizer it's seeing
5. **FOCUS on the right area** - capture visualizer, not documentation chrome

#### Red Flags to Watch For:
- 🚩 Screenshots include documentation chrome
- 🚩 No visualizer validation before capture
- 🚩 AI scores seem inconsistent or wrong
- 🚩 Not using `test-helpers.ts` functions
- 🚩 Full page screenshots for visualizer comparison

### 🔒 **Prevention Measures**

#### Mandatory Checklist for Visual Comparisons:
- [ ] Use `selectVisualizer()` from test-helpers.ts
- [ ] Use `waitForVisualizer()` to confirm loading
- [ ] Use `SELECTORS.mainContent` for focused capture
- [ ] Verify visualizer availability in preset
- [ ] Include visualizer context in AI prompts
- [ ] Validate screenshot content before AI analysis

#### Code Review Requirements:
- Must import from `test-helpers.ts`
- Must use focused selectors, not full page
- Must include visualizer validation steps
- Must handle visualizer unavailability gracefully

### 📖 **Related Documentation**

- `test/e2e/utils/test-helpers.ts` - Shared infrastructure
- `review/visual-agent/toggle/toggle-edge-optimization-2026-01-04.md` - Full failure analysis
- `scripts/visual-verification-test.cjs` - Verification implementation

### 🔄 **Future Improvements**

#### Automated Prevention:
- Add visual capture validation to CI
- Create visual testing checklist template
- Add visualizer availability checks

#### Knowledge Sharing:
- Include failure patterns in agent training
- Add visual testing best practices to documentation
- Create visual testing onboarding for new agents

---

## 🎯 **Failure Prevention Protocol**

### Before Starting Visual Work:
1. **Check existing infrastructure** - `test-helpers.ts` has solutions
2. **Verify target availability** - check preset visualizer lists
3. **Plan focused capture** - use proper selectors
4. **Include validation steps** - wait for specific elements

### During Implementation:
1. **Use shared functions** - don't reinvent
2. **Add visualizer context** - tell AI what it's seeing
3. **Validate captures** - check screenshot content
4. **Test edge cases** - unavailable visualizers, loading failures

### After Completion:
1. **Document what worked** - update this registry
2. **Share learnings** - add to team knowledge base
3. **Update checklists** - add new prevention measures
4. **Review for patterns** - look for systemic issues

---

*This registry is maintained to prevent repetition of critical failures. Update it whenever you encounter or fix a significant issue.*

**Last Updated**: January 4, 2026  
**Next Review**: When new visual testing work begins
