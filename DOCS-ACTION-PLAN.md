# Documentation and Examples Action Plan

This document outlines the issues identified in the Matchina documentation and examples, and the steps to address them. The plan is structured into focused Copilot sessions.

## Copilot Session 1: Stopwatch Examples Fix

Focus: Fix all stopwatch examples that have the `machine.getChange` error or other issues.

- [ ] **stopwatch-using-data-and-transition-functions**: Fix `machine.getChange` error
- [ ] **stopwatch-using-data-and-hooks**: Fix `machine.getChange` error
- [ ] **stopwatch-using-react-state-and-effects**: Fix functionality
- [ ] **stopwatch-using-external-react-state-and-state-effects**: Fix functionality
- [ ] **stopwatch-using-react-state-using-lifecycle-instead-of-useEffect**: Fix functionality
- [ ] **basic stopwatch**: Add live demo
- [ ] Test all examples after fixes

## Copilot Session 2: Other Interactive Examples Fix

Focus: Fix other broken examples throughout the documentation.

- [ ] **fetcher basic and advanced**: Fix functionality
- [ ] **authentication flow**: Implement live demo
- [ ] **todo list**: Fix 404 error
- [ ] **checkout flow**: Implement live demo
- [ ] Test all examples after fixes

## Copilot Session 3: Documentation Enhancement

Focus: Improve the documentation content and code blocks.

- [ ] Implement Starlight's built-in code blocks with copy buttons
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

## Fix Details

1. **`machine.getChange` error**: The issue appears to be resolved by updating the `MachineExampleWithChart.tsx` component to properly access the state.

2. **Example improvement principles**:
   - Make examples dead simple, minimal, and elegant
   - Use string-to-string transitions where possible
   - Utilize hooks and states for passing arguments in events
   - Include visualizations
   - Break examples into appropriate file structure for readability
