# Build System

## Build Configuration

Matchina uses **unbuild** with **mkdist** for TypeScript development and production builds.

### Development Mode
```bash
npm run dev:docs    # Live development with automatic updates
```

**How it works:**
- Uses `unbuild --stub` with `mkdist` builder
- Copies TypeScript files directly (no Jiti transformation)
- Live file watching = instant updates
- Full TypeScript support during development

### Production Build
```bash
npm run build:lib   # Build library for npm publishing
npm run build:all   # Build library + docs (SLOW)
```

**What gets built:**
- **Library**: `.mjs/.js` files for npm consumers
- **Types**: `.d.ts` files for TypeScript users
- **Docs**: Static site generation

## Package Configuration

### build.config.ts
```typescript
import { defineConfig } from 'unbuild';

export default defineConfig({
  entries: [
    { input: 'src/index.ts', outDir: 'dist' },
    { input: 'src/react/index.ts', outDir: 'dist/react' },
    // ... other entries
  ],
  clean: true,
  declaration: true,
  rollup: {
    emitCJS: true,
  },
});
```

### Package.json Scripts
```json
{
  "scripts": {
    "build:lib": "unbuild",
    "build:all": "unbuild && cd docs && npm run build",
    "dev": "vitest",
    "dev:docs": "cd docs && npm run dev",
    "test": "vitest run --coverage",
    "test:types": "tsc --noEmit",
    "test-build": "npm run test:types && npm run build:lib"
  }
}
```

## Module System

### ESM First
- **Primary**: ES modules (`.mjs`)
- **Secondary**: CommonJS (`.js`) for compatibility
- **Types**: TypeScript declaration files (`.d.ts`)

### Exports Structure
```typescript
// Main entry point
export * from './matchbox-factory';
export * from './factory-machine';
export * from './store-machine';
export * from './promise-machine';

// React integration
export * from './react';
```

### Conditional Exports
```json
{
  "exports": {
    ".": {
      "import": "./dist/index.mjs",
      "require": "./dist/index.js",
      "types": "./dist/index.d.ts"
    },
    "./react": {
      "import": "./dist/react/index.mjs",
      "require": "./dist/react/index.js",
      "types": "./dist/react/index.d.ts"
    }
  }
}
```

## Development Workflow

### Live Development
1. **Start dev server**: `npm run dev:docs`
2. **Edit source files**: Changes appear instantly
3. **Type checking**: Immediate feedback
4. **No rebuilds needed**: TypeScript files used directly

### Production Build
1. **Run build**: `npm run build:lib`
2. **Verify types**: `npm run test:types`
3. **Test build**: `npm run test-build`
4. **Publish**: `npm run publish`

## Size Optimization

### Bundle Analysis
```bash
npm run size-limit    # Check bundle sizes
```

### Size Limits
```json
{
  "size-limit": [
    {
      "path": "dist/index.mjs",
      "limit": "3.5 kB"
    },
    {
      "path": "dist/react/index.mjs", 
      "limit": "1 kB"
    }
  ]
}
```

### Optimization Strategies
- **Tree-shaking**: Dead code elimination
- **Minification**: Terser optimization
- **Compression**: gzip/brotli for web

## Troubleshooting

### Build Issues
- **Type errors**: Fix in source, don't suppress
- **Import errors**: Check module resolution
- **Size issues**: Analyze with bundle analyzer

### Development Issues
- **Hot reload not working**: Check file watcher
- **Type errors not showing**: Restart dev server
- **Build stuck**: Check for circular dependencies
