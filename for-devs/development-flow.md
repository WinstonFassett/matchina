# Development Flow

## Core → Tests → Examples → Docs

This is the standard development workflow for Matchina features.

## 1. Core Implementation (/src)

### What to Implement
- Start with the core logic in `/src`
- Follow nano-sized, composable pattern
- Focus on type safety and inference
- Use factory functions, not global instances

### Key Principles
```typescript
// ✅ Factory function pattern
export const createXyzMachine = () => createMachine(states, transitions, "Initial");

// ✅ Type-safe transitions
createMachine(states, { 
  Idle: { start: "Active" },
  Active: { stop: "Idle" }
}, "Initial");

// ❌ No global instances
export const xyzMachine = createMachine(states, transitions, "Initial");
```

## 2. Testing (/test)

### Unit Tests
- Test type inference and runtime behavior
- Focus on edge cases and error conditions
- Use `npx vitest run test/file.test.ts` for specific tests

### Integration Tests
- Test real-world usage patterns
- Verify TypeScript inference works correctly
- Test composition of multiple primitives

### Test Commands
```bash
npm test                    # All tests with coverage
npx vitest run test/file.test.ts    # Specific test
npx vitest run -t "pattern"       # Matching tests
```

## 3. Examples (/docs/src/code/examples)

### Purpose
Examples serve dual purposes:
- **Living documentation** with interactive visualizations
- **Integration tests** for real-world usage patterns

### Required Files
```
docs/src/code/examples/feature-name/
├── machine.ts        # Export createXyzMachine() factory
├── XyzView.tsx       # React component (takes machine prop)
├── example.tsx       # For docs (with MachineVisualizer)
└── index.tsx         # Clean component without wrapper
```

### Example Patterns
- **Factory functions** - Always export, never global instances
- **Type-safe props** - Machine prop is properly typed
- **Visual components** - Use MachineVisualizer for docs

## 4. Documentation (/docs/src/content/docs)

### MDX Documentation
- Create `docs/src/content/docs/feature-name.mdx`
- Use `?raw` imports for code tabs
- See existing examples for template

### Update Navigation
- Update `docs/astro.config.mjs` sidebar (~line 236)
- Add new feature to navigation

## Troubleshooting

### If Examples Break
1. **Check if core logic is wrong** - Pivot to `/test` and write failing tests
2. **Verify type inference** - Check TypeScript compilation
3. **Check factory pattern** - Ensure no global instances

### If Tests Fail
1. **Fix core implementation first** - Tests should pass after core is correct
2. **Check type errors** - Fix types, don't suppress with `@ts-ignore`
3. **Verify test setup** - Ensure test environment is correct

## Verification Checklist

Before finishing a feature:
- [ ] Core implementation in `/src` works
- [ ] All tests pass (`npm test`)
- [ ] Example demonstrates the feature
- [ ] Documentation explains usage
- [ ] Type inference works correctly
- [ ] No `as any` or `@ts-ignore` in code
