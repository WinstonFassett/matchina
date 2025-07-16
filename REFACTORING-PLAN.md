# Matchina Documentation Refactoring Plan

## 1. Component Structure

### New Components Created
- `MachineExampleWithChart.tsx`: Core component for displaying a machine with its Mermaid diagram
- `DemoWithMermaid.tsx`: Wrapper for MDX files that manages machine state internally
- `StopwatchApp.tsx`: Simplified stopwatch view that replaces StopwatchDevView

### Additional Components Needed
- [ ] Code tabs component for displaying multiple code files
- [ ] Stackblitz integration component (for "Open in Stackblitz" functionality)
- [ ] Better styling for the machine diagrams (consider mobile responsiveness)

## 2. Example Structure

### Standardized Format
Each example should follow this structure:
- `/example-name/`
  - `machine.ts` - Machine logic (exported as a creator function)
  - `index.tsx` - Main component with default export for MDX and named export for compatibility
  - `AppView.tsx` (optional) - Custom UI for the example if needed

### Folder Naming Convention
Use descriptive, kebab-case names that indicate the pattern being demonstrated:
- `stopwatch-using-data-and-hooks/`
- `fetcher-with-retry/`
- `multi-step-form-with-validation/`

## 3. Content Structure for MDX Files

### Standardized Format
Each example MDX file should follow this format:
1. Title and metadata
2. Interactive example at the top (diagram + UI)
3. Brief description of what the example demonstrates
4. Key features and concepts explained
5. Machine implementation code
6. Component integration code

## 4. Examples to Update

### Stopwatch Examples
- [x] `stopwatch-using-data-and-transition-functions`
- [x] `stopwatch-using-data-and-hooks` 
- [x] `stopwatch-using-react-state-and-effects`
- [ ] `stopwatch-using-react-state-and-state-effects`
- [ ] `stopwatch-using-external-react-state-and-state-effects`
- [ ] `stopwatch-using-react-state-using-lifecycle-instead-of-useEffect`

### Other Examples
- [ ] Form examples
- [ ] Fetcher examples
- [ ] Rock-paper-scissors example
- [ ] Checkout example
- [ ] Any other examples in the codebase

## 5. Documentation Updates

- [ ] Update guide pages to reference the new examples
- [ ] Ensure consistent terminology throughout docs
- [ ] Add "Further Reading" sections at the end of each example
- [ ] Consider adding a "Patterns" section that cross-references examples

## 6. Implementation Steps

1. **Phase 1: Component Creation** (Completed)
   - Create MachineExampleWithChart component
   - Create DemoWithMermaid component
   - Create StopwatchApp component

2. **Phase 2: Example Refactoring** (In Progress)
   - Refactor all stopwatch examples to use the new components
   - Update corresponding MDX files
   - Ensure consistent naming and exports

3. **Phase 3: Other Examples**
   - Apply the same pattern to other examples
   - Ensure all examples export machine creators

4. **Phase 4: Documentation Updates**
   - Update guide pages to reference the new examples
   - Ensure consistent terminology

5. **Phase 5: Final Review**
   - Test all examples
   - Check for consistency across the documentation
   - Verify mobile responsiveness

## 7. Technical Considerations

- Ensure all TypeScript types are properly exported and used
- Consider lazy-loading for the Mermaid diagrams
- Optimize for bundle size where possible
- Ensure all examples are accessible
