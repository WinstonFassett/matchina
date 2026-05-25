// Twoslash-style cut directives for code blocks.
// `// ---cut---` / `// ---cut-before---` hide everything above; `// ---cut-after---` hides everything below.

export function applyCut(s) {
  let out = s;
  const before = out.split(/\/\/ ---cut(?:-before)?---\s*/);
  if (before.length > 1) out = before.pop() ?? "";
  const after = out.split(/\/\/ ---cut-after---\s*/);
  if (after.length > 1) out = after.shift() ?? "";
  return out;
}

const CUT_BEFORE = /^\s*\/\/\s*---cut(?:-before)?---\s*$/;
const CUT_AFTER = /^\s*\/\/\s*---cut-after---\s*$/;

// Expressive Code plugin. Skips blocks with `meta="twoslash"` because twoslash
// handles cut natively (needs above-cut code for type context).
export function pluginCodeCut() {
  return {
    name: "matchina:code-cut",
    hooks: {
      preprocessCode: ({ codeBlock }) => {
        if (codeBlock.meta && /\btwoslash\b/.test(codeBlock.meta)) return;
        const lines = codeBlock.getLines();
        let cutBeforeIdx = -1;
        let cutAfterIdx = -1;
        for (let i = 0; i < lines.length; i++) {
          const t = lines[i].text;
          if (cutBeforeIdx === -1 && CUT_BEFORE.test(t)) cutBeforeIdx = i;
          if (CUT_AFTER.test(t)) cutAfterIdx = i;
        }
        const toDelete = [];
        if (cutBeforeIdx !== -1) {
          for (let i = 0; i <= cutBeforeIdx; i++) toDelete.push(i);
        }
        if (cutAfterIdx !== -1 && cutAfterIdx > cutBeforeIdx) {
          for (let i = cutAfterIdx; i < lines.length; i++) toDelete.push(i);
        }
        if (toDelete.length) codeBlock.deleteLines(toDelete);
      },
    },
  };
}
