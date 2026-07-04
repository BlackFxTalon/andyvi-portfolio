export const visualBaselinePolicy = {
  schemaVersion: 1,
  owner: "A024",
  reviewOwner: "human-ui-reviewer + A024 visual-regression owner",
  browser: {
    engine: "chromium",
    channel: "playwright-bundled",
    policy:
      "Use the Chromium revision pinned by the installed Playwright package; do not use system Chrome, Firefox, or WebKit for baseline approval.",
  },
  stability: {
    locale: "ru-RU",
    timezoneId: "Asia/Yekaterinburg",
    colorScheme: "dark",
    reducedMotion: "reduce",
    deviceScaleFactor: 1,
    frozenTime: "2026-07-01T00:00:00.000+05:00",
    animationPolicy:
      "CSS animations, transitions, smooth scrolling, caret blink, and videos are disabled before screenshots.",
  },
  threshold: {
    maxDiffPixelRatio: 0.003,
    rationale:
      "Allows minor antialiasing noise while failing layout, typography, clipping, or asset drift.",
  },
  paths: {
    baselineRoot: ".supervibe/artifacts/visual-baselines",
    currentRoot: ".supervibe/artifacts/verification/visual/current",
    diffRoot: ".supervibe/artifacts/verification/visual/diff",
    reportRoot: ".supervibe/artifacts/verification/visual",
  },
  masking: {
    selectors: [],
    rationale:
      "No masks are active by default because the covered public routes should not contain real dates, random data, ads, PII, or external live widgets. Future masks must be selector-narrow, justified here, and approved by the review owner.",
  },
  viewports: [
    {
      id: "desktop-1920x1080",
      label: "Desktop 1920x1080",
      width: 1920,
      height: 1080,
    },
    {
      id: "tablet-834x1112",
      label: "Tablet representative",
      width: 834,
      height: 1112,
    },
    {
      id: "mobile-390x844",
      label: "Mobile representative",
      width: 390,
      height: 844,
    },
  ],
  surfaces: [
    { id: "home", path: "/", readySelector: "#main-content" },
    { id: "works", path: "/works", readySelector: "#projectsGrid" },
    { id: "about", path: "/about", readySelector: ".about-page" },
    { id: "process", path: "/process", readySelector: ".process-page" },
    { id: "contacts", path: "/contacts", readySelector: ".contacts-route" },
  ],
};
