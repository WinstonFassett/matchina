import { execSync } from 'child_process';
import path from 'path';

/**
 * Generates auto-named screenshot directories with branch, date, and commit hash
 */
export function generateScreenshotPath(baseDir: string, ...parts: string[]): string {
  const branch = getCurrentBranch();
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const commitHash = getCurrentCommitHash();
  
  const runId = `${branch}-${date}-${commitHash}`;
  const fullPath = path.join(baseDir, runId, ...parts);
  
  return fullPath;
}

function getCurrentBranch(): string {
  try {
    return execSync('git branch --show-current', { encoding: 'utf8' }).trim();
  } catch {
    return 'no-git';
  }
}

function getCurrentCommitHash(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return 'no-commit';
  }
}

/**
 * Ensures directory exists for the given path
 */
export function ensureScreenshotDir(filePath: string): void {
  const dir = path.dirname(filePath);
  execSync(`mkdir -p "${dir}"`);
}
