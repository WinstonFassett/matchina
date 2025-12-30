# Screenshot Diff Viewer

The screenshot diff viewer has been moved to its own dedicated branch to keep the main working directory clean.

## How to Access the Viewer

### Option 1: Switch to the viewer branch (temporary)
```bash
# Switch to the viewer branch
git checkout feat/screenshot-diff-viewer

# Start the viewer
cd review/screenshot-diff-viewer
npm install
npm run dev

# Viewer will be available at http://localhost:5173

# When done, switch back to your branch
git checkout feat/externalize-inspect-viz
```

### Option 2: Create a worktree (recommended for frequent use)
```bash
# Create a persistent worktree for the viewer
git worktree add ../screenshot-viewer feat/screenshot-diff-viewer

# Access the viewer anytime
cd ../screenshot-viewer/review/screenshot-diff-viewer
npm run dev

# Remove worktree when no longer needed
git worktree remove ../screenshot-viewer
```

## What the Viewer Does

- Compares screenshots between different sets (baseline, current, final, etc.)
- Shows differences between image sets
- Helps with visual regression testing
- Serves images from `review/screenshots/` directory

## Screenshot Directory Structure

All screenshots are now organized in `review/screenshots/`:
```
review/screenshots/
├── baseline/working/
├── current/
├── current-fixed/
├── final/
├── after-css-fix/
├── after-theme-fix/
└── baseline/upstream/
```

## Auto-Naming

New screenshots use auto-naming with branch, date, and commit hash:
```
review/screenshots/feat-branch-2025-12-30-a1b2c3d/test-name.png
```

This prevents conflicts between different test runs and makes it easy to identify when screenshots were taken.
