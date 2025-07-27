# Agent Guidelines for Matchina Docs

## Commands

- **Dev**: `npm run dev` (Astro dev server)
- **Build**: `npm run build` (check + build), `npm run check` (Astro check only)
- **Preview**: `npm run preview` (preview built site)
- **Deploy**: `npm run deploy` (GitHub Pages deployment)

## Code Style

- **ESLint**: Extends Astro plugin + root config, unused vars allowed in `.astro` files
- **TypeScript**: Astro strict config, React JSX, path aliases for imports
- **Astro**: Use frontmatter for imports, `client:only="react"` for interactive React components
- **MDX**: Frontmatter with `title` and `description`, import components with `@components/`
- **React**: Standard React patterns, use Matchina library via path aliases
- **Imports**: Use path aliases (`@components/*`, `@code/*`, `matchina/*`)
- **Content**: Store in `src/content/docs/`, follow Starlight conventions

## Project Structure

- `src/content/docs/` - MDX documentation pages with frontmatter
- `src/components/` - Astro and React components for docs
- `src/code/examples/` - Code examples imported into docs
- `astro.config.mjs` - Starlight configuration with sidebar structure

## Example Patterns (CRITICAL - Always Follow)

### File Structure

- `machine.ts` - Exports `createXyzMachine()` function (NOT global instance)
- `XyzView.tsx` - React component that takes machine as prop
- `hooks.ts` - Optional, usually not needed
- `example.tsx` - Uses MachineExampleWithChart, creates machine instance
- `index.tsx` - Clean component without demo wrapper

### Machine Creation Pattern

- **ALWAYS** export `createXyzMachine()` function from machine.ts
- **NEVER** export global machine instances
- React components create machine with `useMemo(() => createXyzMachine(), [])`
- Use `useMachine(machineInstance)` to track the instance

### Astro Config Organization

- **CRITICAL**: New examples MUST be added to `astro.config.mjs` sidebar
- Examples are organized in sections (Basic, Async, Fetch, etc.)
- Each example needs proper title and link in sidebar structure
- **ALWAYS** update astro config when adding new examples
