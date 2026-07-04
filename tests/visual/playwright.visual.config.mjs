import { defineConfig } from "@playwright/test";
import { visualArtifactPaths, visualStability } from "./visual-baseline.contract.mjs";

export default defineConfig({
  testDir: ".",
  testMatch: /visual-baseline\.spec\.mjs/,
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  outputDir: "../../.supervibe/artifacts/visual-baselines/current",
  snapshotPathTemplate: "../../.supervibe/artifacts/visual-baselines/baseline/{arg}{ext}",
  reporter: [
    ["list"],
    ["json", { outputFile: `../../${visualArtifactPaths.playwrightJson}` }],
    ["./visual-baseline.reporter.mjs"],
  ],
  expect: {
    timeout: 10_000,
    toHaveScreenshot: {
      animations: visualStability.animations,
      caret: "hide",
      scale: "css",
    },
  },
  use: {
    baseURL: process.env.VISUAL_BASE_URL || "http://127.0.0.1:4174",
    colorScheme: visualStability.colorScheme,
    deviceScaleFactor: visualStability.deviceScaleFactor,
    locale: visualStability.locale,
    reducedMotion: visualStability.reducedMotion,
    timezoneId: visualStability.timezoneId,
    trace: "retain-on-failure",
    video: "off",
    screenshot: "only-on-failure",
  },
  webServer: process.env.VISUAL_BASE_URL
    ? undefined
    : {
        command: "node serve-dist.mjs",
        url: "http://127.0.0.1:4174",
        reuseExistingServer: true,
        timeout: 15_000,
      },
});
