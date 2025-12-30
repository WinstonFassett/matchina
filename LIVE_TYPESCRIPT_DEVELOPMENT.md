# Live TypeScript Development Solution

## Problem

We needed live TypeScript development for the docs site without the `require is not defined` errors that occur with unbuild's default Jiti-based stub files in browser environments.

## Solution

The solution combines three key components:

### 1. Unbuild Stub Mode with Mkdist Builder

**build.config.ts:**
```typescript
export default defineBuildConfig({
  entries: [
    {
      input: "./src/",
      outDir: "./dist",
      builder: 'mkdist',  // ← Key: Use mkdist instead of Rollup
      pattern: ["**", "!dev"],
      format: "esm",
    },
    {
      input: "./src/",
      outDir: "./dist",
      builder: 'mkdist',  // ← Key: Use mkdist instead of Rollup
      pattern: ["**", "!dev"],
      format: "cjs",
    }
  ],
  // ... rest of config
})
```

### 2. Package.json Exports Pointing to TypeScript Files

**package.json:**
```json
"exports": {
  ".": {
    "types": "./dist/index.d.ts",
    "import": "./dist/index.ts",      // ← Point to .ts files
    "require": "./dist/index.ts"      // ← Point to .ts files
  },
  "./react": {
    "types": "./dist/integrations/react.d.ts",
    "import": "./dist/integrations/react.ts",
    "require": "./dist/integrations/react.ts"
  },
  // ... other exports
}
```

### 3. Development Script

**package.json:**
```json
"scripts": {
  "dev:docs": "npm run dev:stub && npm --workspace docs run dev",
  "dev:stub": "unbuild --stub"
}
```

## How It Works

1. **`unbuild --stub`** starts in watch mode, monitoring source files for changes
2. **Mkdist builder** copies TypeScript files directly (no Jiti transformation)
3. **Clean TypeScript files** are created in `dist/` with proper exports
4. **Package exports** point to the actual `.ts` files that exist
5. **Vite/Astro** can resolve and consume the TypeScript files directly
6. **Live updates** happen automatically when source files change

## Benefits

- ✅ **Live TypeScript development** - Changes appear instantly in browser
- ✅ **No Jiti** - No `require is not defined` browser errors
- ✅ **Browser compatible** - Clean TypeScript files work with Vite
- ✅ **Fast updates** - Direct file copying, no runtime transformation
- ✅ **Type safety** - Full TypeScript support in development

## Development Workflow

1. Run `npm run dev:docs` to start live development
2. Make changes to any TypeScript file in `src/`
3. Changes are automatically copied to `dist/` by unbuild stub mode
4. Browser refreshes with updated code
5. No manual rebuild required

## Comparison

| Approach | Live Updates | Browser Compatible | Type Safety |
|-----------|--------------|-------------------|-------------|
| Default unbuild --stub | ✅ | ❌ (Jiti) | ✅ |
| Mkdist standalone | ❌ | ✅ | ✅ |
| **Our Solution** | ✅ | ✅ | ✅ |

This gives us the best of both worlds: live development with full browser compatibility.
