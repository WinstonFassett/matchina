#!/usr/bin/env node
// Dogfood the docs site: SSR check, console sweep, selective interact, screenshots.
// Usage:
//   tsx scripts/dogfood-docs.ts                      # desktop, all checks
//   tsx scripts/dogfood-docs.ts --form-factor mobile # iPhone 14 emulation
//   tsx scripts/dogfood-docs.ts --device "Pixel 7"   # specific Playwright device
//   tsx scripts/dogfood-docs.ts --skip-screenshots --skip-interact
//   tsx scripts/dogfood-docs.ts --base http://matchina-docs.localhost:1355
//   tsx scripts/dogfood-docs.ts --only toggle,hsm-checkout
//
// Exits non-zero if any page has console errors or fails SSR/interact assertions.

import { chromium, devices, type ConsoleMessage } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

type InteractFn = (page: import("playwright").Page) => Promise<{ ok: boolean; detail?: string }>;

type Page = {
  id: string;
  url: string;        // path relative to base
  /** Minimum count of <svg> we expect in raw HTML (SSR check). 0 = skip. */
  ssrSvgMin: number;
  /** Optional interaction; returns ok=true if state changed as expected. */
  interact?: InteractFn;
};

const DEFAULT_BASE = "http://matchina-docs.localhost:1355";

const PAGES: Page[] = [
  // Smoke pages — the embeds that the React-dedupe fix targeted.
  {
    id: "toggle",
    url: "/matchina/learn/examples/toggle/",
    ssrSvgMin: 5,
    interact: async (p) => {
      const before = await p.evaluate(() => {
        const on = [...document.querySelectorAll("button")].find((b) => /^Turn on$/.test(b.textContent?.trim() ?? ""));
        const off = [...document.querySelectorAll("button")].find((b) => /^Turn off$/.test(b.textContent?.trim() ?? ""));
        return { onDisabled: on?.disabled, offDisabled: off?.disabled };
      });
      // Click whichever is enabled
      const enabledLabel = before.onDisabled ? "Turn off" : "Turn on";
      await p.getByRole("button", { name: enabledLabel, exact: true }).first().click();
      await p.waitForTimeout(150);
      const after = await p.evaluate(() => {
        const on = [...document.querySelectorAll("button")].find((b) => /^Turn on$/.test(b.textContent?.trim() ?? ""));
        const off = [...document.querySelectorAll("button")].find((b) => /^Turn off$/.test(b.textContent?.trim() ?? ""));
        return { onDisabled: on?.disabled, offDisabled: off?.disabled };
      });
      const flipped = before.onDisabled !== after.onDisabled && before.offDisabled !== after.offDisabled;
      return { ok: flipped, detail: `before=${JSON.stringify(before)} after=${JSON.stringify(after)}` };
    },
  },
  {
    id: "fetcher-advanced",
    url: "/matchina/learn/examples/fetcher-advanced/",
    ssrSvgMin: 5,
    interact: async (p) => {
      await p.getByRole("button", { name: /^fetch$/i }).first().click();
      // Wait for transition to a non-idle button
      const ok = await p
        .getByRole("button", { name: /refetch|cancel|retry/i })
        .first()
        .waitFor({ timeout: 5000 })
        .then(() => true, () => false);
      return { ok };
    },
  },
  {
    id: "stopwatch-overview",
    url: "/matchina/learn/examples/stopwatch-overview/",
    ssrSvgMin: 5,
  },
  {
    id: "hsm-checkout",
    url: "/matchina/learn/examples/hsm-checkout/",
    ssrSvgMin: 5,
    interact: async (p) => {
      const btn = p.getByRole("button", { name: /Continue to Shipping/ }).first();
      await btn.click();
      const ok = await p
        .getByRole("button", { name: /Continue to Payment/ })
        .first()
        .waitFor({ timeout: 3000 })
        .then(() => true, () => false);
      return { ok };
    },
  },
  {
    id: "rock-paper-scissors",
    url: "/matchina/learn/examples/rock-paper-scissors/",
    ssrSvgMin: 5,
    interact: async (p) => {
      await p.getByRole("button", { name: /Rock/ }).first().click();
      const ok = await p
        .locator("text=/computer/i")
        .first()
        .waitFor({ timeout: 3000 })
        .then(() => true, () => false);
      return { ok };
    },
  },
  { id: "hsm-traffic-light", url: "/matchina/learn/examples/hsm-traffic-light/", ssrSvgMin: 5 },
  { id: "hsm-combobox", url: "/matchina/learn/examples/hsm-combobox/", ssrSvgMin: 5 },
  { id: "counter", url: "/matchina/learn/examples/counter/", ssrSvgMin: 5 },
  { id: "checkout", url: "/matchina/learn/examples/checkout/", ssrSvgMin: 5 },
  { id: "auth-flow", url: "/matchina/learn/examples/auth-flow/", ssrSvgMin: 5 },
  { id: "fetcher-overview", url: "/matchina/learn/examples/fetcher-overview/", ssrSvgMin: 0 },
  { id: "promise-machine-fetcher", url: "/matchina/learn/examples/promise-machine-fetcher/", ssrSvgMin: 5 },
  {
    id: "guides-store-machine",
    url: "/matchina/guides/store-machine/",
    ssrSvgMin: 5,
    interact: async (p) => {
      await p.getByRole("button", { name: "+1", exact: true }).first().click();
      const ok = await p
        .locator("text=/increment.*0.*→.*1/i")
        .first()
        .waitFor({ timeout: 2000 })
        .then(() => true, () => false);
      return { ok };
    },
  },
  { id: "guides-promises", url: "/matchina/guides/promises/", ssrSvgMin: 5 },
  { id: "standalone-toggle", url: "/matchina/examples/toggle/", ssrSvgMin: 5 },
  { id: "home", url: "/matchina/", ssrSvgMin: 0 },
];

type Args = {
  base: string;
  formFactor: "desktop" | "mobile";
  device?: string;
  skipScreenshots: boolean;
  skipInteract: boolean;
  only?: string[];
  outDir: string;
};

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const get = (k: string) => {
    const i = argv.indexOf(k);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const has = (k: string) => argv.includes(k);
  const formFactor = (get("--form-factor") as Args["formFactor"]) ?? "desktop";
  const only = get("--only")?.split(",").map((s) => s.trim()).filter(Boolean);
  return {
    base: get("--base") ?? DEFAULT_BASE,
    formFactor,
    device: get("--device"),
    skipScreenshots: has("--skip-screenshots"),
    skipInteract: has("--skip-interact"),
    only,
    outDir: get("--out") ?? `dogfood-output/${formFactor}`,
  };
}

async function ssrSvgCount(url: string): Promise<number> {
  const res = await fetch(url);
  if (!res.ok) return -1;
  const html = await res.text();
  return (html.match(/<svg[\s>]/g) ?? []).length;
}

type PageResult = {
  id: string;
  url: string;
  status: number;
  consoleErrors: string[];
  consoleWarnings: string[];
  ssrSvgs: number;
  ssrOk: boolean;
  interactOk?: boolean;
  interactDetail?: string;
  pass: boolean;
};

async function main() {
  const args = parseArgs();
  await mkdir(join(args.outDir, "screenshots"), { recursive: true });

  const browser = await chromium.launch();
  const contextOpts: Parameters<typeof browser.newContext>[0] = args.device
    ? devices[args.device]
    : args.formFactor === "mobile"
    ? devices["iPhone 14"]
    : { viewport: { width: 2500, height: 1417 } };
  const context = await browser.newContext(contextOpts);

  const results: PageResult[] = [];
  const pages = args.only ? PAGES.filter((p) => args.only!.includes(p.id)) : PAGES;

  for (const def of pages) {
    const fullUrl = `${args.base}${def.url}`;
    const page = await context.newPage();
    const errors: string[] = [];
    const warnings: string[] = [];
    page.on("console", (msg: ConsoleMessage) => {
      if (msg.type() === "error") errors.push(msg.text());
      else if (msg.type() === "warning") warnings.push(msg.text());
    });
    page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));

    const ssrSvgs = await ssrSvgCount(fullUrl);
    const resp = await page.goto(fullUrl, { waitUntil: "domcontentloaded" }).catch(() => null);
    await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
    // Give ReactFlow / viz-svg fitView animations + force-layout settle time before screenshot
    await page.waitForTimeout(500);

    let interactOk: boolean | undefined;
    let interactDetail: string | undefined;
    if (def.interact && !args.skipInteract) {
      try {
        const r = await def.interact(page);
        interactOk = r.ok;
        interactDetail = r.detail;
      } catch (e) {
        interactOk = false;
        interactDetail = `threw: ${(e as Error).message}`;
      }
    }

    if (!args.skipScreenshots) {
      await page.screenshot({
        path: join(args.outDir, "screenshots", `${def.id}.png`),
        fullPage: true,
      });
    }

    const ssrOk = ssrSvgs >= def.ssrSvgMin;
    const httpOk = (resp?.status() ?? 0) >= 200 && (resp?.status() ?? 0) < 400;
    const pass = httpOk && ssrOk && errors.length === 0 && (interactOk ?? true);

    results.push({
      id: def.id,
      url: fullUrl,
      status: resp?.status() ?? 0,
      consoleErrors: errors,
      consoleWarnings: warnings,
      ssrSvgs,
      ssrOk,
      interactOk,
      interactDetail,
      pass,
    });

    await page.close();
    const icon = pass ? "✅" : "❌";
    const bits = [
      `${icon} ${def.id.padEnd(28)}`,
      `${resp?.status() ?? "—"}`,
      `svg=${ssrSvgs}/${def.ssrSvgMin}`,
      `err=${errors.length}`,
      interactOk === undefined ? "" : `interact=${interactOk ? "ok" : "FAIL"}`,
    ].filter(Boolean);
    console.log(bits.join("  "));
    if (errors.length) for (const e of errors) console.log(`   ERR: ${e}`);
    if (interactOk === false && interactDetail) console.log(`   INTERACT: ${interactDetail}`);
  }

  await browser.close();

  const reportPath = join(args.outDir, "report.json");
  await writeFile(reportPath, JSON.stringify({ args, results }, null, 2));
  console.log(`\nReport: ${reportPath}`);

  const failed = results.filter((r) => !r.pass);
  if (failed.length) {
    console.log(`\n${failed.length} of ${results.length} pages failed.`);
    process.exit(1);
  }
  console.log(`\nAll ${results.length} pages passed.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(2);
});
