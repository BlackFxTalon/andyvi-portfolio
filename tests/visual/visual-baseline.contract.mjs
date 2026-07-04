import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const visualProjectRoot = resolve(fileURLToPath(new URL("../..", import.meta.url)));

export const VISUAL_BASE_URL = process.env.VISUAL_BASE_URL || "http://127.0.0.1:4174";

export const visualArtifactPaths = {
  baselineRoot: ".supervibe/artifacts/visual-baselines/baseline",
  currentRoot: ".supervibe/artifacts/visual-baselines/current",
  diffRoot: ".supervibe/artifacts/visual-baselines/current",
  verificationRoot: ".supervibe/artifacts/verification/visual",
  reportJson: ".supervibe/artifacts/verification/visual/visual-regression-report.json",
  playwrightJson: ".supervibe/artifacts/verification/visual/playwright-results.json",
};

export const visualRoutes = [
  { id: "home", path: "/", state: "loaded reduced-motion viewport" },
  { id: "works", path: "/works/", state: "loaded reduced-motion viewport" },
  { id: "about", path: "/about/", state: "loaded reduced-motion viewport" },
  { id: "process", path: "/process/", state: "loaded reduced-motion viewport" },
  { id: "contacts", path: "/contacts/", state: "loaded reduced-motion viewport" },
];

export const visualViewports = [
  { id: "mobile-360", width: 360, height: 800, category: "mobile" },
  { id: "mobile-390", width: 390, height: 844, category: "mobile" },
  { id: "mobile-430", width: 430, height: 932, category: "mobile" },
  { id: "tablet-820", width: 820, height: 1180, category: "tablet" },
  { id: "tablet-1024", width: 1024, height: 1366, category: "tablet" },
  { id: "desktop-1280", width: 1280, height: 800, category: "desktop-cinematic-threshold" },
  { id: "desktop-1366", width: 1366, height: 768, category: "desktop-cinematic" },
  { id: "desktop-1440", width: 1440, height: 900, category: "desktop-cinematic" },
  { id: "desktop-1920x1080", width: 1920, height: 1080, category: "desktop-cinematic-canonical" },
];

export const visualStability = {
  browser: "pinned Chromium via @playwright/test",
  locale: "ru-RU",
  timezoneId: "Asia/Yekaterinburg",
  colorScheme: "dark",
  reducedMotion: "reduce",
  animations: "disabled",
  deviceScaleFactor: 1,
  fixedTimeIso: "2026-06-20T00:00:00+05:00",
  fontPolicy: "wait for document.fonts.ready before screenshot",
  dataPolicy: "use built Astro content and static dist/client output; no production accounts, secrets, or network fixtures",
};

export const visualDiffPolicy = {
  threshold: 0.1,
  maxDiffPixelRatio: 0.002,
  fullPage: false,
  reviewerOwner: "visual-regression-testing reviewer for G02/G06",
  baselineApproval: "candidate baselines require human review before promotion",
};

export const visualMasks = {
  defaultSelectors: [],
  rationale:
    "No dynamic regions are masked by default. Masks may be added only for volatile timestamps, third-party embeds, or externally generated pixels, and must not cover layout, readable text, controls, HUD, nav, CTA, frame boundaries, or focus states.",
  owner: "visual-regression-testing reviewer for G02/G06",
};

export const testerContract = {
  schemaVersion: 1,
  kind: "supervibe-tester-handoff-contract",
  coverageLanes: {
    happy: {
      status: "covered",
      evidence: "visual-baseline.spec.mjs captures all five routes across visualViewports",
    },
    failure: {
      status: "covered",
      evidence: "missing baseline, route load failure, blank main, or diff threshold breach fails the Playwright command",
    },
    boundary_null: {
      status: "covered",
      evidence: "mobile/tablet/desktop boundary widths 360, 390, 430, 820, 1024, 1280, 1366, 1440, 1920",
    },
    regression: {
      status: "covered",
      evidence: "toHaveScreenshot compares current render against stored baseline artifacts",
    },
    codex_host_variant: {
      status: "covered",
      evidence: "direct Codex worker command without package.json or shared Playwright config edits",
    },
  },
  smoke: {
    command: ".\\node_modules\\.bin\\playwright.cmd test --config=tests/visual/playwright.visual.config.mjs --grep \"home desktop-1920x1080\"",
    successSignal: "home desktop-1920x1080 screenshot comparison reaches PASS or reports missing baseline artifact",
  },
  regression: {
    command: ".\\node_modules\\.bin\\playwright.cmd test --config=tests/visual/playwright.visual.config.mjs",
    failureAnchor: "G02/G06 visual baseline invariant: route/viewports must not drift beyond threshold without reviewed baseline update",
  },
  smokeCannotSatisfyRegression: true,
};
