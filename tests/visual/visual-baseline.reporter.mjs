import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  visualProjectRoot,
  testerContract,
  visualArtifactPaths,
  visualDiffPolicy,
  visualMasks,
  visualRoutes,
  visualStability,
  visualViewports,
} from "./visual-baseline.contract.mjs";

class VisualBaselineReporter {
  constructor() {
    this.rows = [];
    this.startedAt = new Date().toISOString();
  }

  onTestEnd(test, result) {
    this.rows.push({
      title: test.title,
      status: result.status,
      expectedStatus: test.expectedStatus,
      durationMs: result.duration,
      errors: result.errors.map((error) => ({
        message: error.message,
        location: error.location,
      })),
      outputDir: result.outputDir,
      attachments: result.attachments.map((attachment) => ({
        name: attachment.name,
        path: attachment.path,
        contentType: attachment.contentType,
      })),
    });
  }

  onEnd(result) {
    const failedRows = this.rows.filter((row) => row.status !== "passed");
    const hasMissingBaseline = failedRows.some((row) =>
      row.errors.some((error) => /snapshot|baseline|doesn't exist|Expected an image/i.test(error.message || "")),
    );
    const status = result.status === "passed" ? "PASS" : hasMissingBaseline ? "PARTIAL" : "FAIL";
    const report = {
      schemaVersion: 1,
      kind: "visual-regression-report",
      status,
      generatedAt: new Date().toISOString(),
      startedAt: this.startedAt,
      scope: {
        routes: visualRoutes,
        viewports: visualViewports,
        state: "loaded page, reduced motion, animations disabled, fixed locale/timezone/time",
      },
      baseline: {
        root: visualArtifactPaths.baselineRoot,
        provenance: "candidate or reviewed Playwright snapshots in pinned Chromium",
        approvalStatus: "requires reviewer approval before promotion",
      },
      command: {
        compare: ".\\node_modules\\.bin\\playwright.cmd test --config=tests/visual/playwright.visual.config.mjs",
        updateCandidate:
          ".\\node_modules\\.bin\\playwright.cmd test --config=tests/visual/playwright.visual.config.mjs --update-snapshots",
        exitCode: result.status === "passed" ? 0 : 1,
        outputSummary: result.status,
      },
      artifacts: {
        baselineRoot: visualArtifactPaths.baselineRoot,
        currentRoot: visualArtifactPaths.currentRoot,
        diffRoot: visualArtifactPaths.diffRoot,
        reportJson: visualArtifactPaths.reportJson,
        playwrightJson: visualArtifactPaths.playwrightJson,
      },
      diffs: this.rows.map((row) => ({
        surface: row.title,
        status: row.status,
        classification: row.status === "passed" ? "within-threshold" : "missing-baseline-or-visual-diff",
        severity: row.status === "passed" ? "none" : "review-required",
        action: row.status === "passed" ? "none" : "inspect current/diff artifact and approve or repair",
        outputDir: row.outputDir,
      })),
      stability: visualStability,
      masking: visualMasks,
      browserRuntime:
        "Playwright route load, main landmark visibility, font readiness, screenshot capture, viewport, and cleanup are covered; console/network/a11y remain browser-runtime-verification lanes.",
      screenshotCritiqueLoop: {
        passCount: 0,
        desktopMobileCoverage: "configured by route/viewport matrix",
        receiptIds: [],
        finalPolishOwner: visualDiffPolicy.reviewerOwner,
        unresolvedBlockerStatus: status === "PASS" ? "none" : "review-required",
      },
      antiSlopReport: {
        status: "not_applicable",
        rationale: "This worker adds the visual baseline workflow and does not approve a design handoff or 10/10 visual score.",
      },
      baselineUpdate: {
        status: "not-requested",
        owner: visualDiffPolicy.reviewerOwner,
        reason: "Baseline updates require explicit review of before/current/diff evidence.",
      },
      healthProjection: {
        testerContract,
      },
      goalVerdict: [
        {
          goalIds: ["G02"],
          status: status === "PASS" ? "PASS" : "PARTIAL",
          evidence: [visualArtifactPaths.reportJson, visualArtifactPaths.playwrightJson],
        },
        {
          goalIds: ["G06"],
          status: status === "PASS" ? "PASS" : "PARTIAL",
          evidence: [visualArtifactPaths.reportJson, visualArtifactPaths.playwrightJson],
        },
      ],
      epicGoalVerdict: {
        scopeId: "epic-andyvi-portfolio-astro-integration-loop-ready-plan-candidate-25bc85",
        status: status === "PASS" ? "PASS" : "PARTIAL",
        evidence: [visualArtifactPaths.reportJson],
        rationale: "Worker A024 does not close graph; visual baseline proof is one lane in the epic.",
      },
      blockers:
        status === "PASS"
          ? []
          : [
              {
                type: hasMissingBaseline ? "baseline-review-required" : "visual-command-failed",
                owner: visualDiffPolicy.reviewerOwner,
                nextAction:
                  "Run candidate update command, inspect baseline/current/diff artifacts, then rerun compare command.",
              },
            ],
      confidence: {
        score: status === "PASS" ? 8 : 6,
        capReasons:
          status === "PASS"
            ? ["No independent browser-runtime/a11y lane in this worker."]
            : ["Visual compare did not fully pass; reviewer approval or repair remains."],
      },
      rows: this.rows,
    };

    const reportPath = `${visualProjectRoot}/${visualArtifactPaths.reportJson}`;
    mkdirSync(dirname(reportPath), { recursive: true });
    writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  }
}

export default VisualBaselineReporter;
