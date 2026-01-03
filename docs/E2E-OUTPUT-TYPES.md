# E2E & Playwright Output Types Reference

## 📊 **All Output Types You Can Review**

| **Output Type**              | **Location**                        | **What It Contains**                       | **When Generated**                       | **How to View**                       |
| ---------------------------- | ----------------------------------- | ------------------------------------------ | ---------------------------------------- | ------------------------------------- |
| **🖼️ Screenshot Baselines** | `test/e2e/*/*-snapshots/`           | Expected screenshots for visual regression | When tests run with `--update-snapshots` | `npm run screenshots open <name>`     |
| **❌ Failed Screenshots**     | `test-results/`                     | Actual screenshots that failed comparison  | When visual tests fail                   | Open from test failure output         |
| **📋 Test Results**          | `test-results/`                     | Test execution results, errors, artifacts  | When any tests run                       | `npx playwright test --reporter=html` |
| **🌐 HTML Reports**          | `playwright-report/`                | Interactive test report with steps         | When using HTML reporter                 | `npm run screenshots:html:open`       |
| **📊 Coverage Reports**      | `coverage/`, `docs/coverage-*.json` | Code coverage from test runs               | When running with coverage               | `open coverage/index.html`            |
| **📝 Console Logs**          | Test output                         | Browser console during test execution      | When tests run with `--headed`           | View in terminal during test run      |
| **🎯 Trace Files**           | `test-results/`                     | Detailed execution traces for debugging    | When trace enabled in config             | `npx playwright show-trace trace.zip` |
| **📈 Coverage Balance**      | `docs/coverage-balance-report.html` | Test coverage balance analysis             | When running `npm run coverage:balance`  | `npm run coverage:balance`            |
| **🧪 Test Dashboard**        | `docs/test-dashboard.html`          | Overview of all available tests            | When running `npm run test:dashboard`    | `npm run test:dashboard`              |
| **📋 E2E Coverage**          | `review/E2E_COVERAGE_REPORT.md`     | Analysis of example test coverage          | When running coverage script             | View in editor                        |
| **🔍 Debug Screenshots**     | `.playwright-mcp/`                  | Manual debugging screenshots               | When using MCP tools                     | `npm run screenshots`                 |
| **📝 Manual Screenshots**    | `review/screenshots/`               | Development screenshots                    | When taking manual screenshots           | `open review/screenshots/`            |

## 🎯 **Primary Outputs You Care About**

### **For Visual Review:**
- **Screenshot Baselines** - `test/e2e/visual/comprehensive-smoke.spec.ts-snapshots/` (26 files)
- **Manual Screenshots** - `review/screenshots/` (130+ files)
- **Debug Screenshots** - `.playwright-mcp/` (29 files)

### **For Test Results:**
- **HTML Reports** - `playwright-report/index.html` (interactive)
- **Test Results** - `test-results/` (failures and artifacts)
- **Console Output** - Terminal during test runs

### **For Coverage Analysis:**
- **Coverage Balance** - `docs/coverage-balance-report.html`
- **Coverage Reports** - `coverage/index.html`
- **E2E Coverage** - `review/E2E_COVERAGE_REPORT.md`

## 🚀 **Quick Access Commands**

| **What You Want** | **Command** | **Result Location** |
|-------------------|-------------|---------------------|
| **See ALL screenshots** | `npm run screenshots` | Lists all 195+ screenshots |
| **Open specific screenshot** | `npm run screenshots open <keyword>` | Opens matching image |
| **Generate HTML report** | `npm run screenshots:html` | `playwright-report/index.html` |
| **Open HTML report** | `npm run screenshots:html:open` | Opens in browser |
| **See test dashboard** | `npm run test:dashboard` | `docs/test-dashboard.html` |
| **Check coverage balance** | `npm run coverage:balance` | `docs/coverage-balance-report.html` |
| **Run tests with traces** | `npx playwright test --trace on` | `test-results/trace.zip` |
| **Debug mode** | `npx playwright test --headed --debug` | Browser + console logs |

## 📁 **File Structure Overview**

```
test/e2e/
├── visual/
│   ├── comprehensive-smoke.spec.ts-snapshots/     # 26 baseline screenshots
│   ├── all-visualizers-complete.spec.ts-snapshots/ # Detailed test screenshots
│   └── *.spec.ts                                   # Test files
├── functional/
│   ├── checkout-smoke.spec.ts-snapshots/           # Functional test screenshots
│   └── *.spec.ts                                   # Functional tests
└── utils/                                          # Test utilities

test-results/                                      # Generated on failures
├── */test-failed-*.png                            # Failed screenshots
├── */trace.zip                                    # Debug traces
└── */error-context.md                             # Error details

playwright-report/                                 # HTML reports
├── index.html                                     # Main report
├── data/                                          # Report data
└── assets/                                        # Report assets

review/screenshots/                                # Manual development shots (130+)
.playwright-mcp/                                   # MCP debugging shots (29)
coverage/                                         # Code coverage reports
docs/coverage-*.html                             # Coverage analysis
```

## 🎯 **What to Check When**

| **Situation** | **Primary Output** | **Secondary Outputs** |
|---------------|-------------------|----------------------|
| **After visual changes** | Screenshot baselines | HTML report |
| **Tests failing** | Test results | Failed screenshots |
| **Coverage concerns** | Coverage balance report | Coverage HTML |
| **Debugging issues** | Trace files | Console logs |
| **Manual review** | Manual screenshots | Debug screenshots |
| **CI/CD review** | HTML report | Test results |
