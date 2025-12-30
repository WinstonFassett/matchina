# Feature Development Reference

Quick reference for adding features to Matchina. Focus on making things work—skip steps that aren't relevant to your task.

## Before Starting

- [ ] **Review existing patterns** - Check similar features in `/src` and examples
- [ ] **Check CLAUDE.md** - Understand project architecture

## Core Implementation

- [ ] **Implement in `/src`** - Follow nano-sized, composable pattern
- [ ] **Write tests in `/test`** - Test type inference and runtime behavior
  - `npm run dev` for watch mode
- [ ] **Update `.size-limit.json`** if adding public API
- [ ] **Update `package.json` exports** if adding integration (like `/react`)

## Example (If Needed)

**Directory:** `docs/src/code/examples/feature-name/`

**Required files:**
- [ ] `machine.ts` - Export `createXyzMachine()` factory (NO global instances!)
- [ ] `XyzView.tsx` - Component accepting `machine` prop, uses `useMachine()`
- [ ] `example.tsx` - Uses `MachineVisualizer`, default export
- [ ] `index.tsx` - Clean component without wrapper

**Optional:** `types.ts`, `states.ts`, `hooks.ts`, `utils.ts`

## Documentation (If Example Created)

- [ ] **Create MDX**: `docs/src/content/docs/examples/feature-name.mdx`
  - See `docs/AGENTS.md` for template
  - Use `?raw` imports for code tabs
- [ ] **Update sidebar** in `docs/astro.config.mjs` (~line 236)
- [ ] **Verify in browser** if dev server running

## Verification

**What matters:**
- [ ] Tests pass (`npm test` or `npm run dev` for watch)
- [ ] Example works in browser (if created)
- [ ] Visualizer shows states correctly (if applicable)

**Less critical unless requested:**
- Builds (user will run when needed)
- Typechecking (unless explicitly requested)
- Linting (usually auto-fixed)

## Troubleshooting

**If example has bugs:**
1. Can you reproduce in core (`/test`)?
2. If yes → write failing test, fix in `/src`
3. If no → fix in example

Evidence beats assumptions.

---

---

## Quick Summary

```
Core:     /src → /test → (size-limit, exports if needed)
Example:  machine.ts, View.tsx, example.tsx, index.tsx
Docs:     .mdx, astro.config.mjs sidebar entry
Verify:   Tests pass, UI works
```

**Remember:** User manages git, branches, commits. You focus on making code work.
