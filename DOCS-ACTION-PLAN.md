# Documentation and Examples Action Plan

This document focuses on fixing documentation examples and improving the Matchina docs.

## Focus Areas

1. **Fix Broken Examples**
   - [x] `MachineExampleWithChart.tsx`: Fixed to use `machine.state` instead of `machine.getState()`
   - [ ] Stopwatch examples with errors:
     - [ ] `stopwatch-using-data-and-transition-functions`: `machine.getChange is not a function`
     - [ ] `basic stopwatch`: No live demo
     - [ ] `with hooks`: `machine.getChange is not a function`
     - [ ] `effect hooks`: `machine.getChange is not a function`
   - [ ] Other broken examples:
     - [ ] Fetcher advanced and basic
     - [ ] Authentication flow (not live)
     - [ ] Todo list (404)
     - [ ] Checkout flow (not live)

2. **Improve Documentation**
   - [ ] Use Starlight's built-in code blocks with copy buttons
   - [ ] Make examples concise and elegant
   - [ ] Focus on TypeScript benefits
   - [ ] Fix incorrect transition examples
   - [ ] Review all examples for verbosity

3. **Example Improvement**
   - [ ] Traffic light example is good - use as model for other examples
   - [ ] Use simple string-to-string transitions where possible
   - [ ] Utilize hooks and states for passing arguments in events

## Twoslash Integration
   - [ ] Investigate solutions for import issues with Twoslash
   - [ ] Find ways to break examples into smaller files

## Immediate Next Steps
1. Start the docs dev server and test if our fix for `MachineExampleWithChart.tsx` resolved the issues
2. Implement Starlight's code blocks with copy functionality
3. Fix remaining broken examples

This error appears in several stopwatch examples. The issue is likely related to the API evolution where `getChange` was replaced or renamed.

### Fix Plan:
- [ ] Identify where `getChange` is being referenced incorrectly in examples
- [ ] Update to use the current API (likely `machine.change` instead of `machine.getChange()`)
- [ ] Test all examples after the fix

## 2. Broken Examples

Multiple examples are not functioning correctly or have no live demo:

### Stopwatch Examples:
- [ ] **stopwatch-using-data-and-transition-functions**: Fix `machine.getChange` error
- [ ] **basic stopwatch**: Add live demo
- [ ] **with hooks**: Fix `machine.getChange` error
- [ ] **effect hooks**: Fix `machine.getChange` error
- [ ] **all other stopwatches**: Validate functionality

### Other Examples:
- [ ] **fetcher advanced and fetcher basic**: Fix functionality
- [ ] **authentication flow**: Implement live demo
- [ ] **todo list**: Fix 404 error
- [ ] **checkout flow**: Implement live demo

## 3. Documentation Improvement

The documentation should be concise, elegant, and focused on demonstrating the value of the library.

### Content Enhancement:
- [ ] Review all docs for verbosity and reduce where appropriate
- [ ] Ensure examples are minimal but complete
- [ ] Focus on the TypeScript benefits
- [ ] Validate documentation against actual code to ensure accuracy
- [ ] Fix any incorrect transition examples or usage patterns

### Style Improvements:
- [ ] Implement Starlight's built-in code blocks with copy buttons
- [ ] Ensure consistent formatting throughout

## 4. Example Framework

The traffic light example is considered exemplary. Other examples should follow similar patterns:

### Example Structure:
- [ ] Dead simple, minimal, elegant examples
- [ ] Use string-to-string transitions where possible
- [ ] Utilize hooks and states for passing arguments in events
- [ ] Include visualizations where appropriate
- [ ] Break examples into appropriate file structure for readability

## 5. Twoslash Integration

There are challenges with imports in Twoslash:

### Investigation:
- [ ] Research solutions for Twoslash import issues
- [ ] Explore ways to break examples into smaller files
- [ ] Test alternative approaches to improve the developer experience

## Prioritized Next Steps

1. Fix the `machine.getChange` error in stopwatch examples
2. Fix critical broken examples (stopwatch series first)
3. Implement Starlight's built-in code blocks with copy buttons
4. Review and improve documentation content for elegance and clarity
5. Expand live examples where missing
