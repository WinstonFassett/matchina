# Feature Development Checklist

Use this checklist when adding new features to Matchina, especially state machine features that need examples and documentation.

## Pre-Development

- [ ] **Review existing patterns** - Check similar features in `/src` and examples
- [ ] **Check CLAUDE.md** - Understand project architecture and conventions
- [ ] **Create feature branch** - Use descriptive name (e.g., `add-hierarchical-states`)

## Core Implementation

- [ ] **Implement feature** in `/src`
  - Follow nano-sized, composable pattern
  - Export factory functions and types
  - Add JSDoc comments for API documentation
  - Ensure TypeScript types are properly inferred

- [ ] **Write unit tests** in `/test`
  - Test type inference (compile-time safety)
  - Test runtime behavior
  - Cover edge cases and error conditions
  - Run: `npm run dev` (watch mode) or `npm test`

- [ ] **Update size limits** in `.size-limit.json` (if adding public API)
  - Add new entry point
  - Verify: `npm run build:lib`

- [ ] **Update package exports** in `package.json` (if adding integration)
  - Add to `exports` field
  - Follow existing pattern (`matchina/react`, etc.)

## Example Creation

- [ ] **Create example directory**: `docs/src/code/examples/feature-name/`

- [ ] **Create `machine.ts`**
  - Export `createXyzMachine()` factory function
  - Export type: `export type XyzMachine = ReturnType<typeof createXyzMachine>`
  - NO global instances!

- [ ] **Create `XyzView.tsx`**
  - Accept `machine` as prop
  - Use `useMachine(machine)` for state tracking
  - Implement realistic, understandable UI

- [ ] **Create `example.tsx`** (for docs)
  - Import `MachineExampleWithChart` from `@components/MachineExampleWithChart`
  - Create machine with `useMemo(createXyzMachine, [])`
  - Choose appropriate `inspectorType`: `"force-graph"`, `"mermaid"`, `"react-flow"`, or `"basic"`
  - Set `showRawState` if useful
  - Default export

- [ ] **Create `index.tsx`** (clean export)
  - Simple component without demo wrapper
  - Use machine created with `useMemo`

- [ ] **Optional files** (as needed)
  - `types.ts` - Shared types
  - `states.ts` - Complex state definitions
  - `hooks.ts` - Custom hooks
  - `utils.ts` - Helper functions

## Documentation

- [ ] **Create MDX page**: `docs/src/content/docs/examples/feature-name.mdx`
  ```mdx
  ---
  title: Feature Name
  description: Brief description
  ---

  import Example from "@code/examples/feature-name/example";
  import machineCode from "@code/examples/feature-name/machine.ts?raw";
  import viewCode from "@code/examples/feature-name/XyzView.tsx?raw";
  import indexCode from "@code/examples/feature-name/index.tsx?raw";
  import CodeBlock from "@components/CodeBlock.astro";
  import CodeTabs from "@components/CodeTabs.astro";
  ```

- [ ] **Add to sidebar** in `docs/astro.config.mjs`
  - Choose section: Basic, Async, Fetchers, Advanced
  - Add entry with label and link

- [ ] **Test in dev server**
  ```bash
  cd docs
  npm run dev
  # Visit localhost:4321/matchina/examples/feature-name
  ```

- [ ] **Verify documentation**
  - Example renders correctly
  - Visualizer works
  - Code tabs display properly
  - Links work

## Quality Gates

- [ ] **Run all tests**: `npm test`
  - Type checking passes
  - Unit tests pass
  - Coverage acceptable

- [ ] **Build verification**: `npm run build`
  - Library builds successfully
  - Docs build successfully
  - Size limits not exceeded

- [ ] **Lint check**: `npm run lint`
  - Or auto-fix: `npm run lint:fix`

- [ ] **Visual verification**
  - Example works in docs
  - Visualizer correctly shows states/transitions
  - UI is responsive and clear

## Optional Enhancements

- [ ] **Add guide page** if feature needs conceptual explanation
  - Create in `docs/src/content/docs/guides/`
  - Add to sidebar under appropriate section

- [ ] **Add to quickstart** if fundamental feature
  - Update `docs/src/content/docs/guides/quickstart.mdx`

- [ ] **Add integration examples** if relevant
  - React integration
  - Zod/Valibot validation
  - Immer usage

## Pre-Merge

- [ ] **Update CLAUDE.md** if architecture changed
  - Document new patterns
  - Update architecture overview

- [ ] **Review DEVELOPMENT.md** - Does it need updates?

- [ ] **Test build one more time**: `npm run test-build`

- [ ] **Commit with clear message**
  ```bash
  git add .
  git commit -m "feat: add hierarchical state machines

  - Implement nested state support in core
  - Add comprehensive unit tests
  - Create traffic-light-hierarchical example
  - Document in examples and guides

  🤖 Generated with [Claude Code](https://claude.ai/code)
  via [Happy](https://happy.engineering)

  Co-Authored-By: Claude <noreply@anthropic.com>
  Co-Authored-By: Happy <yesreply@happy.engineering>"
  ```

## Post-Merge

- [ ] **Verify deployment**
  - Check GitHub Pages after merge
  - Ensure example appears in sidebar
  - Test live example

- [ ] **Update project README** if major feature

- [ ] **Consider release** if ready
  - Run: `npm run dry-run` to test
  - Run: `npm run release` when ready

---

## Quick Example: Adding "Undo/Redo" Feature

```bash
# 1. Core implementation
touch src/undo-redo.ts
touch test/undo-redo.test.ts
npm run dev  # Watch mode for tests

# 2. Example
mkdir -p docs/src/code/examples/undo-redo
touch docs/src/code/examples/undo-redo/{machine.ts,UndoRedoView.tsx,example.tsx,index.tsx}

# 3. Documentation
touch docs/src/content/docs/examples/undo-redo.mdx
# Edit docs/astro.config.mjs to add sidebar entry

# 4. Verify
npm test
npm run build
cd docs && npm run dev

# 5. Commit
git add .
git commit -m "feat: add undo/redo capability..."
```

---

## Checklist Summary

```
Core:     [ ] /src [ ] /test [ ] size-limit [ ] exports
Example:  [ ] machine.ts [ ] View.tsx [ ] example.tsx [ ] index.tsx
Docs:     [ ] .mdx [ ] astro.config.mjs [ ] verify in browser
Quality:  [ ] tests pass [ ] build passes [ ] lint passes
```
