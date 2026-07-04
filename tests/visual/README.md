# A024 Visual Baseline Workflow

This workflow is intentionally self-contained under `tests/visual/**` so it can
run without editing `package.json`, `playwright.config.ts`, or the existing
unit/e2e suites.

## Focused Commands

Prerequisite unless a local preview is already running:

```powershell
npm run build
```

Compare against reviewed baselines:

```powershell
node --test tests/visual/visual-baseline.mjs
```

Create or refresh candidate baselines:

```powershell
$env:UPDATE_VISUAL_BASELINES = "1"
node --test tests/visual/visual-baseline.mjs
Remove-Item Env:\UPDATE_VISUAL_BASELINES
```

To use an existing preview instead of auto-starting `astro preview`:

```powershell
$env:VISUAL_BASE_URL = "http://127.0.0.1:4321"
node --test tests/visual/visual-baseline.mjs
Remove-Item Env:\VISUAL_BASE_URL
```

## Browser Policy

- Browser engine: Chromium only.
- Channel: Playwright-bundled Chromium pinned by `@playwright/test` and
  `playwright-core/browsers.json`.
- System Chrome, Firefox, and WebKit are not valid for baseline approval.
- The runner records the Playwright package range, pinned Chromium revision,
  pinned Chromium version, and runtime browser version in the report.

## Viewports

- `desktop-1920x1080`: required desktop baseline.
- `tablet-834x1112`: representative tablet baseline.
- `mobile-390x844`: representative mobile baseline.

## Covered Public Routes

- `home`: `/`
- `works`: `/works`
- `about`: `/about`
- `process`: `/process`
- `contacts`: `/contacts`

## Determinism Policy

- Locale: `ru-RU`.
- Time zone: `Asia/Yekaterinburg`.
- Clock: fixed to `2026-07-01T00:00:00.000+05:00`.
- `Math.random`: fixed deterministic value.
- `prefers-reduced-motion`: `reduce`.
- CSS animations, transitions, smooth scrolling, caret blink, and videos are
  disabled before screenshot capture.
- Fonts must finish loading before screenshot capture.

## Artifact Path Conventions

- Baselines:
  `.supervibe/artifacts/visual-baselines/<surface>/<viewport>.png`
- Current screenshots:
  `.supervibe/artifacts/verification/visual/current/<runId>/<surface>-<viewport>.png`
- Diff screenshots:
  `.supervibe/artifacts/verification/visual/diff/<runId>/<surface>-<viewport>.png`
- Latest report:
  `.supervibe/artifacts/verification/visual/a024-visual-baseline-report.json`
- Run report:
  `.supervibe/artifacts/verification/visual/runs/<runId>/report.json`

## Masking Rationale

No masks are active by default. The portfolio routes are public and should not
contain dates, random IDs, ads, production secrets, PII, or external live
widgets. A future mask must be selector-narrow, must not hide layout/text/control
boundaries, and must be approved by `human-ui-reviewer + A024 visual-regression
owner`.

## Review Owner

Baseline promotion owner: `human-ui-reviewer + A024 visual-regression owner`.
Candidate baselines created with `UPDATE_VISUAL_BASELINES=1` are not approved
until the reviewer inspects baseline/current/diff artifacts and records the
intentional visual state.
