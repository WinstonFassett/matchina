# Documentation and Examples Action Plan

This document outlines the issues identified in the Matchina documentation and examples, and the steps to address them. The plan is structured into focused Copilot sessions.

## Copilot Session 1: Stopwatch Examples Fix

Focus: Fix all stopwatch examples that have the `machine.getChange` error or other issues.

- [✓] The `machine.getChange` errors are fixed (by updating `MachineExampleWithChart.tsx`)
- [ ] **All stopwatch examples**: Implement code tabs like other examples
  - [ ] stopwatch-using-data-and-transition-functions
  - [ ] stopwatch-using-data-and-hooks
  - [ ] stopwatch-using-react-state-and-effects
  - [ ] stopwatch-using-external-react-state-and-state-effects
  - [ ] stopwatch-using-react-state-using-lifecycle-instead-of-useEffect
- [ ] **basic stopwatch**: Add live demo
- [ ] Test all examples after the code tab implementation

## Copilot Session 2: Other Interactive Examples Fix

Focus: Fix other broken examples throughout the documentation.

- [ ] **fetcher basic and advanced**: Fix functionality issues
  - [ ] Investigate specific errors in fetcher examples
  - [ ] Update code to match current API patterns
  - [ ] Ensure visualizations work properly
- [ ] **authentication flow**: Implement live demo
- [ ] **todo list**: Fix 404 error
- [ ] **checkout flow**: Implement live demo
- [ ] Test all examples after fixes

## Copilot Session 3: Documentation Enhancement

Focus: Improve the documentation content and code blocks.

- [ ] Implement Starlight's built-in code blocks with copy buttons
  - [ ] Research Starlight's code block features
  - [ ] Create sample implementation
  - [ ] Roll out to all examples
- [ ] Make documentation more concise and elegant
- [ ] Review for technical accuracy, especially around transitions
- [ ] Ensure consistent terminology and structure
- [ ] Fix any incorrect transition examples or usage patterns

## Copilot Session 4: Example Framework Enhancement

Focus: Improve the overall example framework.

- [ ] Ensure all examples follow the traffic light pattern's elegance and simplicity
- [ ] Standardize the example format
- [ ] Add visualizations where missing
- [ ] Explore solutions for Twoslash import issues
- [ ] Consider breaking examples into smaller files for better readability

## Investigation Findings

1. **Stopwatch Examples**: The stopwatch examples are now functional (after fixing the `machine.getChange` error), but they need to be structured with code tabs like other examples.

2. **Fetcher Examples**: The fetcher examples are likely experiencing similar issues:

   - Possibly using `getChange` instead of `change` in their implementation
   - May need updating to use the current API patterns
   - Should verify the promise state machine implementation matches current best practices

3. **Code Tabs Implementation**:

   - Many examples already use the pattern with separate code files and a tabbed interface:
     ```tsx
     import machineCode from "@code/examples/fetcher-basic/machine.ts?raw";
     import hooksCode from "@code/examples/fetcher-basic/hooks.ts?raw";
     import viewCode from "@code/examples/fetcher-basic/FetcherAppView.tsx?raw";
     import indexCode from "@code/examples/fetcher-basic/index.tsx?raw";
     ```
   - Need to ensure all examples follow this pattern for consistency

4. **First Tasks to Focus On**:
   - Update stopwatch examples to use code tabs
   - Investigate fetcher examples to fix their specific issues
   - Research Starlight's built-in code blocks with copy buttons

## Fix Details

1. **`machine.getChange` error**: The issue has been resolved by updating the `MachineExampleWithChart.tsx` component to properly access the state via `machine.state` instead of `machine.getState()`.

2. **Code Tabs Implementation**: All stopwatch examples need to be updated to use code tabs like other examples, showing the different files (machine.ts, index.tsx, etc.) in separate tabs.

3. **Fetcher Examples**: Need thorough investigation to identify specific errors and fix them according to current API patterns.

4. **Example improvement principles**:
   - Make examples dead simple, minimal, and elegant
   - Use string-to-string transitions where possible
   - Utilize hooks and states for passing arguments in events
   - Include visualizations
   - Break examples into appropriate file structure for readability
