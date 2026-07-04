import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { spawn, spawnSync } from "node:child_process";
import test from "node:test";
import { chromium } from "playwright";
import { comparePngBuffers } from "./png-diff.mjs";
import { visualBaselinePolicy } from "./visual-baseline.config.mjs";

const cwd = process.cwd();
const updateBaselines = process.env.UPDATE_VISUAL_BASELINES === "1";
const runId =
  process.env.VISUAL_RUN_ID ||
  new Date().toISOString().replace(/[:.]/g, "-").replace("Z", "Z");
const latestReportPath = join(
  cwd,
  visualBaselinePolicy.paths.reportRoot,
  "a024-visual-baseline-report.json",
);
const runReportPath = join(
  cwd,
  visualBaselinePolicy.paths.reportRoot,
  "runs",
  runId,
  "report.json",
);

function artifactPath(root, runSegment, surface, viewport, extension = "png") {
  const fileName = `${surface}-${viewport}.${extension}`;
  return join(cwd, root, runSegment, fileName);
}

function baselinePath(surface, viewport) {
  return join(
    cwd,
    visualBaselinePolicy.paths.baselineRoot,
    surface,
    `${viewport}.png`,
  );
}

function relativePath(path) {
  return path.replace(cwd + "\\", "").replaceAll("\\", "/");
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`);
}

async function pathExists(path) {
  try {
    await readFile(path);
    return true;
  } catch (error) {
    if (error && error.code === "ENOENT") return false;
    throw error;
  }
}

async function waitForUrl(url, timeoutMs, logs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) return true;
    } catch (error) {
      logs.push(String(error.message || error));
    }
    await delay(500);
  }
  return false;
}

async function startPreviewServer(report) {
  if (process.env.VISUAL_BASE_URL) {
    return {
      baseUrl: process.env.VISUAL_BASE_URL.replace(/\/$/, ""),
      close: async () => {},
      mode: "external-base-url",
    };
  }

  if (!existsSync(join(cwd, "dist"))) {
    throw new Error(
      "dist_missing: run npm run build before node --test tests/visual/visual-baseline.mjs, or set VISUAL_BASE_URL to an already running local preview.",
    );
  }

  const port = Number(process.env.VISUAL_PORT || 4327);
  const baseUrl = `http://127.0.0.1:${port}`;
  const logs = [];
  if (await waitForUrl(baseUrl, 1000, logs)) {
    return { baseUrl, close: async () => {}, mode: "existing-local-preview" };
  }

  const isWindows = process.platform === "win32";
  const npmCommand = isWindows ? "npm.cmd" : "npm";
  const child = spawn(
    isWindows
      ? `${npmCommand} run preview -- --host 127.0.0.1 --port ${port}`
      : npmCommand,
    isWindows
      ? []
      : ["run", "preview", "--", "--host", "127.0.0.1", "--port", String(port)],
    {
      cwd,
      detached: true,
      env: { ...process.env, BROWSER: "none" },
      shell: isWindows,
      stdio: "ignore",
      windowsHide: true,
    },
  );
  child.unref();

  const ready = await waitForUrl(baseUrl, 20000, logs);
  if (!ready) {
    child.kill();
    report.previewLogs = logs.slice(-20);
    throw new Error(
      `preview_unavailable: astro preview did not respond at ${baseUrl}`,
    );
  }

  return {
    baseUrl,
    mode: "spawned-astro-preview",
    close: async () => {
      if (isWindows) {
        spawnSync("taskkill", ["/PID", String(child.pid), "/T", "/F"], {
          stdio: "ignore",
        });
      } else {
        try {
          process.kill(-child.pid, "SIGTERM");
        } catch {
          child.kill();
        }
      }
      await delay(300);
    },
  };
}

async function readBrowserPolicy() {
  const packageJson = JSON.parse(await readFile(join(cwd, "package.json")));
  const browsersJson = JSON.parse(
    await readFile(join(cwd, "node_modules/playwright-core/browsers.json")),
  );
  const chromiumInfo = browsersJson.browsers.find(
    (browser) => browser.name === "chromium",
  );
  return {
    ...visualBaselinePolicy.browser,
    packageVersion: packageJson.devDependencies["@playwright/test"],
    pinnedChromiumRevision: chromiumInfo?.revision || "unknown",
    pinnedChromiumVersion: chromiumInfo?.browserVersion || "unknown",
  };
}

async function stabilizePage(page) {
  await page.addInitScript((frozenTime) => {
    const fixed = new Date(frozenTime).valueOf();
    const OriginalDate = Date;
    class FixedDate extends OriginalDate {
      constructor(...args) {
        super(...(args.length === 0 ? [fixed] : args));
      }
      static now() {
        return fixed;
      }
    }
    globalThis.Date = FixedDate;
    Math.random = () => 0.424242;
  }, visualBaselinePolicy.stability.frozenTime);

  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
        scroll-behavior: auto !important;
        caret-color: transparent !important;
      }
      video { visibility: hidden !important; }
    `,
  });
}

async function captureSurface(page, baseUrl, surface, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  const response = await page.goto(new URL(surface.path, baseUrl).toString(), {
    waitUntil: "networkidle",
  });
  if (!response || response.status() >= 400) {
    throw new Error(
      `route_http_status_${response?.status() || "unknown"}: ${surface.id} ${surface.path}`,
    );
  }
  await page.waitForSelector(surface.readySelector, { state: "attached" });
  await page.evaluate(async () => {
    if (document.fonts) await document.fonts.ready;
    window.scrollTo(0, 0);
  });
  await stabilizePage(page);
  await page.waitForTimeout(100);
  return page.screenshot({
    fullPage: true,
    animations: "disabled",
    caret: "hide",
  });
}

function makeReport() {
  return {
    schemaVersion: 1,
    worker: "A024",
    status: "PARTIAL",
    mode: updateBaselines ? "update-baselines" : "compare",
    runId,
    generatedAt: new Date().toISOString(),
    command: {
      compare: "node --test tests/visual/visual-baseline.mjs",
      update:
        "UPDATE_VISUAL_BASELINES=1 node --test tests/visual/visual-baseline.mjs",
      precondition:
        "Run npm run build first unless VISUAL_BASE_URL points at a local preview.",
    },
    scope: {
      surfaces: visualBaselinePolicy.surfaces.map(({ id, path }) => ({
        id,
        path,
      })),
      viewports: visualBaselinePolicy.viewports,
    },
    baseline: {
      root: visualBaselinePolicy.paths.baselineRoot,
      approvalStatus: updateBaselines
        ? "candidate-created-requires-review"
        : "required-before-pass",
      reviewOwner: visualBaselinePolicy.reviewOwner,
      updatePolicy:
        "Baseline updates require UPDATE_VISUAL_BASELINES=1 plus review of current and diff artifacts before promotion.",
    },
    artifacts: {
      baselineRoot: visualBaselinePolicy.paths.baselineRoot,
      currentRoot: `${visualBaselinePolicy.paths.currentRoot}/${runId}`,
      diffRoot: `${visualBaselinePolicy.paths.diffRoot}/${runId}`,
      report: relativePath(latestReportPath),
      runReport: relativePath(runReportPath),
    },
    stability: visualBaselinePolicy.stability,
    masking: visualBaselinePolicy.masking,
    threshold: visualBaselinePolicy.threshold,
    browserPolicy: null,
    rows: [],
    blockers: [],
    diffs: [],
    nextAction: "review-baselines",
  };
}

test("A024 deterministic visual baseline workflow", { timeout: 180000 }, async () => {
  const report = makeReport();
  let server = null;
  let browser = null;

  try {
    report.browserPolicy = await readBrowserPolicy();
    server = await startPreviewServer(report);
    report.server = { baseUrl: server.baseUrl, mode: server.mode };

    browser = await chromium.launch({ headless: true });
    report.browserPolicy.runtimeVersion = browser.version();

    for (const viewport of visualBaselinePolicy.viewports) {
      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: visualBaselinePolicy.stability.deviceScaleFactor,
        locale: visualBaselinePolicy.stability.locale,
        timezoneId: visualBaselinePolicy.stability.timezoneId,
        colorScheme: visualBaselinePolicy.stability.colorScheme,
        reducedMotion: visualBaselinePolicy.stability.reducedMotion,
        serviceWorkers: "block",
      });

      for (const surface of visualBaselinePolicy.surfaces) {
        const page = await context.newPage();
        const currentBuffer = await captureSurface(
          page,
          server.baseUrl,
          surface,
          viewport,
        );
        await page.close();

        const currentPath = artifactPath(
          visualBaselinePolicy.paths.currentRoot,
          runId,
          surface.id,
          viewport.id,
        );
        const targetBaselinePath = baselinePath(surface.id, viewport.id);
        const diffPath = artifactPath(
          visualBaselinePolicy.paths.diffRoot,
          runId,
          surface.id,
          viewport.id,
        );
        await mkdir(dirname(currentPath), { recursive: true });
        await writeFile(currentPath, currentBuffer);

        const row = {
          surface: surface.id,
          route: surface.path,
          viewport: viewport.id,
          baseline: relativePath(targetBaselinePath),
          current: relativePath(currentPath),
          diff: relativePath(diffPath),
          currentSha256: createHash("sha256")
            .update(currentBuffer)
            .digest("hex"),
          status: "PENDING",
        };

        if (!(await pathExists(targetBaselinePath))) {
          if (updateBaselines) {
            await mkdir(dirname(targetBaselinePath), { recursive: true });
            await writeFile(targetBaselinePath, currentBuffer);
            row.status = "BASELINE_CREATED";
            row.action = "Review candidate baseline before treating as approved.";
          } else {
            row.status = "MISSING_BASELINE";
            report.blockers.push({
              code: "missing-baseline",
              surface: surface.id,
              viewport: viewport.id,
              nextAction:
                "Run UPDATE_VISUAL_BASELINES=1 node --test tests/visual/visual-baseline.mjs, then review generated baselines.",
            });
          }
          report.rows.push(row);
          continue;
        }

        const baselineBuffer = await readFile(targetBaselinePath);
        const comparison = comparePngBuffers(baselineBuffer, currentBuffer);
        await mkdir(dirname(diffPath), { recursive: true });
        await writeFile(diffPath, comparison.diffPng);

        row.diffPixels = comparison.diffPixels;
        row.totalPixels = comparison.totalPixels;
        row.diffPixelRatio = comparison.diffPixelRatio;
        row.dimensionMismatch = comparison.dimensionMismatch;
        row.status =
          comparison.diffPixelRatio <=
            visualBaselinePolicy.threshold.maxDiffPixelRatio &&
          !comparison.dimensionMismatch
            ? "PASS"
            : "FAIL";

        if (row.status === "FAIL") {
          report.diffs.push({
            surface: surface.id,
            viewport: viewport.id,
            severity: "major",
            classification: comparison.dimensionMismatch
              ? "dimension-mismatch"
              : "visual-diff-over-threshold",
            action: "Inspect baseline/current/diff artifacts and repair or approve an intentional baseline update.",
          });
        }

        report.rows.push(row);
      }

      await context.close();
    }

    const failingRows = report.rows.filter((row) =>
      ["FAIL", "MISSING_BASELINE"].includes(row.status),
    );
    report.status =
      failingRows.length > 0 ? "FAIL" : updateBaselines ? "PARTIAL" : "PASS";
    report.nextAction =
      report.status === "PASS"
        ? "handoff-for-review"
        : updateBaselines
          ? "review-candidate-baselines"
          : "create-or-repair-baselines";

    await writeJson(latestReportPath, report);
    await writeJson(runReportPath, report);

    if (!updateBaselines) {
      assert.equal(
        failingRows.length,
        0,
        `Visual baseline comparison failed; see ${relativePath(latestReportPath)}`,
      );
    } else {
      assert.equal(
        report.blockers.length,
        0,
        `Visual baseline update had blockers; see ${relativePath(latestReportPath)}`,
      );
    }
  } catch (error) {
    report.status = "BLOCKED";
    report.blockers.push({
      code: "visual-runner-blocked",
      message: String(error && error.message ? error.message : error),
    });
    report.nextAction = "install-browser-or-start-preview-and-rerun";
    await writeJson(latestReportPath, report);
    await writeJson(runReportPath, report);
    throw error;
  } finally {
    if (browser) await browser.close();
    if (server) await server.close();
  }
});
