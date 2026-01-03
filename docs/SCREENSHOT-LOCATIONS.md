# Screenshot Storage Locations

This document captures all screenshot storage locations and their purposes.

## 📸 Current Screenshot Locations

### 1. **Test Baseline Screenshots** (Expected Results)
```
test/e2e/visual/*.spec.ts-snapshots/
├── all-visualizers-complete.spec.ts-snapshots/
│   ├── sketch-light-flat-1-inactive-chromium-darwin.png
│   ├── mermaid-light-flat-2-typing-chromium-darwin.png
│   └── reactflow-light-nested-3-selected-chromium-darwin.png
└── functional/*.spec.ts-snapshots/ (when created)
```
**Purpose:** Visual regression test baselines  
**Created by:** Playwright `toHaveScreenshot()` assertions  
**Updated by:** `npm run test:e2e:smoke --update-snapshots`

### 2. **Test Failure Screenshots** (Actual Results)
```
test-results/
├── functional-checkout-smoke--e0e00-xample-loads-in-both-themes-chromium/
│   ├── checkout-light-initial-actual.png      # What we got
│   ├── checkout-light-initial-diff.png        # Diff comparison
│   └── test-failed-1.png                      # Full page failure
└── [other test run directories]
```
**Purpose:** Test failure debugging and diff comparisons  
**Created by:** Playwright when tests fail  
**Lifecycle:** Temporary, cleaned on next test run

### 3. **Manual Review Screenshots** (Development)
```
review/screenshots/
├── mermaid-styling-active-nested.png          # Jan 1, 2026 (old)
├── active-nested-dark.png                     # Jan 2, 2026
├── hierarchical-force-graphs-full-page.png   # 525KB (largest)
└── [130+ other manual screenshots]
```
**Purpose:** Manual development screenshots, debugging, design reviews  
**Created by:** Manual `page.screenshot()` calls during development  
**Status:** Mixed - some old, some recent

### 4. **MCP Playwright Screenshots** (External Tool)
```
.playwright-mcp/
├── hsm-force-graph-after-fix.png              # Dec 30, 2025
├── mermaid-hsm-flattened.png                  # Dec 30, 2025
├── reactflow-hsm-final.png                    # Dec 30, 2025
└── [28 other MCP-generated screenshots]
```
**Purpose:** External MCP (Model Context Protocol) Playwright tool screenshots  
**Created by:** External MCP Playwright integration  
**Status:** Development artifacts from Dec 2025

### 5. **Playwright HTML Reports** (Test Reports)
```
playwright-report/
├── index.html                                 # Main report
└── data/                                     # Test data and assets
```
**Purpose:** HTML test reports with embedded screenshots  
**Created by:** Playwright HTML reporter  
**Access:** `open playwright-report/index.html`

## 🎯 Recommended Screenshot Strategy

### **For E2E Testing:**
- **Use:** `test/e2e/*-snapshots/` for baselines
- **Use:** `test-results/` for failures (automatic)
- **Avoid:** Manual screenshots in test code

### **For Development/Debugging:**
- **Use:** `review/screenshots/` for manual debugging
- **Clean:** Regular cleanup of old screenshots
- **Organize:** By feature/date for better management

### **For MCP Integration:**
- **Use:** `.playwright-mcp/` (automatic)
- **Monitor:** Size and relevance
- **Archive:** Old screenshots when no longer needed

## 📊 Current Status (Jan 3, 2026)

| Location | Count | Size | Status |
|-----------|-------|------|--------|
| Test baselines | 36 | ~2MB | ✅ Active |
| Test failures | 0 | 0B | ✅ Clean |
| Review screenshots | 130 | ~40MB | ⚠️ Mixed ages |
| MCP screenshots | 28 | ~20MB | ⚠️ Old (Dec 2025) |
| HTML reports | 1 | ~600KB | ✅ Available |

## 🧹 Cleanup Recommendations

1. **Archive old MCP screenshots** (Dec 2025)
2. **Clean review/screenshots/** - remove screenshots older than 1 week
3. **Consolidate** - consider moving all manual screenshots to review/
4. **Document** - add date/context to screenshot filenames

## 🔍 Viewing Screenshots

### **Quick Commands:**
```bash
# See all screenshots report
npm run screenshots

# Open specific screenshot
npm run screenshots open <name>

# Open HTML report
open playwright-report/index.html

# Open directories directly
open test/e2e/visual/all-visualizers-complete.spec.ts-snapshots/
open review/screenshots/
open .playwright-mcp/
```

### **Focused Screenshots:**
- **E2E tests** now use focused screenshots (interactive area only)
- **Size reduction:** 652x508px → 652x401px (21% smaller)
- **No documentation chrome** included
