# Agent Guidelines for Matchina Docs (Claude Code)

**Philosophy:** Make things work. User manages dev server, git, commits. Focus on tests and UI.

**References:** `DEVELOPMENT.md` (patterns), `FEATURE-CHECKLIST.md` (workflows)

## Commands (User Runs, Not Agent)

**CRITICAL: Do NOT run dev server from agents. ASSUME it's already running.**

```bash
npm run dev             # Astro dev server at localhost:4321 (USER RUNS)
npm run build           # Build static site
npm run deploy          # Deploy to GitHub Pages
```

If puppeteer/browser tests fail because server isn't running, inform user - don't try to start it.

## Critical Patterns (Must Follow)

### Example File Structure

Every example in `src/code/examples/example-name/`:

1. **`machine.ts`** - Export `createXyzMachine()` function (NOT global instance)
2. **`XyzView.tsx`** - React component accepting `machine` prop
3. **`example.tsx`** - Uses `MachineExampleWithChart`, default export for docs
4. **`index.tsx`** - Clean component without demo wrapper
5. **Optional**: `types.ts`, `states.ts`, `hooks.ts`, `utils.ts`

### Path Aliases (from `tsconfig.json`)

```typescript
import Example from "@code/examples/toggle/example";
import machineCode from "@code/examples/toggle/machine.ts?raw";  // Note: ?raw
import { CodeTabs } from "@components/CodeTabs.astro";
import { useMachine } from "matchina/react";
```

### Adding New Example (4 Required Steps)

1. **Create files** in `src/code/examples/example-name/`
2. **Create MDX** in `src/content/docs/examples/example-name.mdx`
3. **Update sidebar** in `astro.config.mjs` (line ~236)
4. **Verify** at `localhost:4321/matchina/examples/example-name`

### MDX Template

```mdx
---
title: Example Name
description: Brief description
---

import Example from "@code/examples/example-name/example";
import machineCode from "@code/examples/example-name/machine.ts?raw";
import viewCode from "@code/examples/example-name/ExampleView.tsx?raw";
import CodeTabs from "@components/CodeTabs.astro";

Description text.

<div className="not-content">
  <Example client:only="react" />
</div>

<CodeTabs
  files={[
    { name: "machine.ts", code: machineCode },
    { name: "ExampleView.tsx", code: viewCode },
  ]}
/>
```

## Don'ts

❌ Don't export global machine instances (use factory functions)
❌ Don't forget `?raw` suffix for code imports
❌ Don't skip updating `astro.config.mjs` sidebar
❌ Don't use `client:load` (use `client:only="react"`)
❌ Don't forget base path `/matchina/` in links
