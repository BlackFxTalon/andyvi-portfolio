import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  testerContract,
  visualArtifactPaths,
  visualDiffPolicy,
  visualMasks,
  visualRoutes,
  visualStability,
  visualViewports,
} from "./visual-baseline.contract.mjs";

describe("visual baseline workflow contract", () => {
  it("covers the five production routes", () => {
    assert.deepEqual(
      visualRoutes.map((route) => route.path),
      ["/", "/works/", "/about/", "/process/", "/contacts/"],
    );
  });

  it("uses the required responsive viewport matrix including 1920x1080", () => {
    assert.deepEqual(
      visualViewports.map((viewport) => viewport.width),
      [360, 390, 430, 820, 1024, 1280, 1366, 1440, 1920],
    );
    assert.equal(visualViewports.at(-1).height, 1080);
  });

  it("pins deterministic visual stability settings", () => {
    assert.equal(visualStability.reducedMotion, "reduce");
    assert.equal(visualStability.animations, "disabled");
    assert.equal(visualStability.locale, "ru-RU");
    assert.equal(visualStability.timezoneId, "Asia/Yekaterinburg");
    assert.equal(visualStability.deviceScaleFactor, 1);
  });

  it("documents artifact path conventions and masking rationale", () => {
    assert.match(visualArtifactPaths.baselineRoot, /^\.supervibe\/artifacts\/visual-baselines\/baseline/);
    assert.match(visualArtifactPaths.currentRoot, /^\.supervibe\/artifacts\/visual-baselines\/current/);
    assert.match(visualArtifactPaths.diffRoot, /^\.supervibe\/artifacts\/visual-baselines\/current/);
    assert.match(visualArtifactPaths.reportJson, /^\.supervibe\/artifacts\/verification\/visual/);
    assert.equal(Array.isArray(visualMasks.defaultSelectors), true);
    assert.match(visualMasks.rationale, /No dynamic regions are masked by default/);
  });

  it("keeps visual diffs bounded and owned by a reviewer", () => {
    assert.equal(visualDiffPolicy.maxDiffPixelRatio, 0.002);
    assert.equal(visualDiffPolicy.fullPage, false);
    assert.match(visualDiffPolicy.reviewerOwner, /visual-regression-testing/);
  });

  it("publishes executable tester contract lanes for graph verification", () => {
    assert.equal(testerContract.kind, "supervibe-tester-handoff-contract");
    assert.equal(testerContract.smokeCannotSatisfyRegression, true);
    for (const lane of ["happy", "failure", "boundary_null", "regression", "codex_host_variant"]) {
      assert.equal(testerContract.coverageLanes[lane].status, "covered");
    }
    assert.match(testerContract.smoke.command, /playwright\.cmd test/);
    assert.match(testerContract.regression.command, /playwright\.cmd test/);
  });
});

