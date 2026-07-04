# 56df44e2-8359-4351-8370-0b1ac6d5fe96 implementation handoff

This archive is the source of truth for turning the design into production code. Start from `index.html`, then preserve the visual system, responsive behavior, and interactions found in the exported files.

## Implementation target
- Build production UI from the exported design, not a loose reinterpretation.
- Preserve typography scale, spacing rhythm, color tokens, border radii, shadows, motion timing, and component states.
- Replace static placeholders only when the target app has real data or functional equivalents.
- Keep generated product UI free of Open Design chrome, preview labels, or design-process annotations.
- Treat this handoff as a visual contract: if implementation choices conflict, match the exported pixels and behavior first, then refactor internals.

## Source map
- Primary entry: `index.html`
- HTML screens detected: 9
- Stylesheets detected: 0
- Script/component files detected: 0
- Supporting assets detected: 106

## Responsive contract
Validate the implementation across this 2025–2026 viewport matrix:
- Mobile compact: 360×800
- Mobile standard: 390×844
- Mobile large: 430×932
- Foldable / small tablet: 600×960
- Tablet portrait: 820×1180
- Tablet landscape: 1024×768
- Laptop: 1366×768
- Desktop: 1440×900
- Wide desktop: 1920×1080

For responsive web exports, treat these as a modern breakpoint system for one adaptive web experience, not three fixed screenshots. Do not split responsive web into unrelated native app screens unless the project explicitly includes native targets. Use semantic layout thresholds, fluid `clamp()` type/spacing, and container queries where component width matters more than viewport width. Preserve any CSS media queries, container queries, fluid `clamp()` scales, and layout changes already present in the exported files.

## Design fidelity contract
- Extract reusable tokens before writing components: background, surface, foreground, muted text, border, accent, radius, shadow, spacing, type scale, and motion duration/easing.
- Map product screens, in-app modules/components, optional landing page, and optional OS widget surfaces before coding. Keep these surfaces separate in the target architecture.
- Match layout geometry: max-widths, gutters, grid columns, card proportions, sticky/fixed elements, and viewport-specific navigation.
- Preserve real copy, labels, and data shown in the export. Do not replace specific text with generic marketing filler.
- Preserve interactive affordances: hover, focus, pressed, disabled, loading, validation, copy/share, tab/accordion, modal/sheet, and keyboard states where present.
- Preserve accessibility semantics when converting: headings stay hierarchical, controls remain buttons/links/inputs, focus states stay visible.
- Do not keep prototype-only annotations, frame labels, or Open Design chrome in the production UI.

## CJX-ready UX contract
- Use `DESIGN-MANIFEST.json` as the machine-readable map for screens, app modules, OS widgets, landing pages, tokens, interactions, and viewport checks.
- Screen-file-first: when multiple user-facing surfaces exist, implement each HTML screen as its own route/file. Treat `index.html` as a launcher/overview when the manifest marks it that way, not as a combined final UI.
- If `landing.html`, app screens, platform screens, or OS widget files exist, preserve those boundaries in the target app instead of merging them into one page.
- A single self-contained `index.html` is acceptable only when the export truly contains one user-facing screen and its CSS/JS are structured enough to extract tokens, components, states, and behavior.
- If separate `css/` or `js/` files exist, treat them as source of truth for token/component/interactions before porting to React, Vue, SwiftUI, Compose, or another target stack.
- In-app modules/components are product UI blocks inside the app. OS widgets are home-screen/lock-screen/quick-access surfaces outside the app. Do not merge those concepts.

## Color and brand contract
- Use the exported design tokens and product/domain context as the color source of truth.
- Do not introduce warm beige / cream / peach / pink / orange-brown background washes unless they are already explicit brand/reference colors in the export.
- No obvious token stylesheet was detected; sample colors from the entry file and convert them into named tokens before coding.

## Implementation sequence for AI coding tools
1. Open `index.html` and `DESIGN-MANIFEST.json`; identify every screen file, launcher/overview file, app module, and interaction before coding.
2. If multiple HTML screens exist, map them to separate routes/surfaces first; do not merge `landing.html`, product app screens, platform screens, or OS widgets into one route.
3. Extract a token table from CSS/root styles and inline styles before building framework components.
4. Build product screens and domain-specific in-app modules from largest layout regions down to controls; avoid starting with isolated atoms that lose spatial intent.
5. Port responsive behavior across the modern viewport matrix and test each semantic breakpoint before cleanup.
6. Port interactions and states, then replace static placeholders only with real app data or functional equivalents.
7. Keep optional landing page and OS widget surfaces as separate surfaces if present.
8. Compare final screenshots against the export at 360×800, 390×844, 430×932, 820×1180, 1024×768, 1366×768, 1440×900, and 1920×1080 before declaring done.

## Entry points
- `about.html`
- `andyvi-hero-prototype.html`
- `andyvi-mobile.html`
- `andyvi-responsive-prototypes.html`
- `andyvi-tablet.html`
- `contacts.html`
- `index.html`
- `process.html`
- `works.html`

## Styles
- None detected

## Scripts/components
- None detected

## Assets and supporting files
- `about-mobile-menu-check.png`
- `about-mobile-menu-open-check.png`
- `about-tech-chips-check.png`
- `andyvi-about-desktop-check.png`
- `andyvi-about-glitch-check.png`
- `andyvi-bg-shadow-silhouette-smoke-sharp-v2.png`
- `andyvi-bg-shadow-soft-both-sides-check.png`
- `andyvi-bg-shadow-soft-both-sides.png`
- `andyvi-bg-shadow-soft-check.png`
- `andyvi-bg-shadow-soft.png`
- `andyvi-cta-border-check.png`
- `andyvi-hero-new-bg-check.png`
- `andyvi-hero-verification-v2.png`
- `andyvi-hero-verification-v3.png`
- `andyvi-hero-verification.png`
- `andyvi-metrics-check-final-v2.png`
- `andyvi-metrics-check-final-v3.png`
- `andyvi-metrics-check-final-v4.png`
- `andyvi-metrics-check-final.png`
- `andyvi-metrics-check-v2.png`
- `andyvi-metrics-check-v3.png`
- `andyvi-metrics-check.png`
- `andyvi-metrics-crop-final-v2.png`
- `andyvi-metrics-crop-final-v3.png`
- `andyvi-metrics-crop-final-v4.png`
- `andyvi-metrics-crop-final.png`
- `andyvi-mobile-ruler-check.png`
- `andyvi-portrait-tech-bg-tight-crop.png`
- `andyvi-static-check.png`
- `andyvi-tektur-check.png`
- `brand-spec.md`
- `critique.json`
- `icon-descending-sorting.png`
- `icon-sort-amount-up.png`
- `mq3v2o11-ChatGPT-Image-1-июн.-2026-г._-12_12_35.png`
- `mq3wrflo-ChatGPT-Image-29-мая-2026-г._-18_57_46.png`
- `mq72xjwx-ChatGPT-Image-1-июн.-2026-г._-12_14_32.png`
- `mq7341sw-ChatGPT-Image-1-июн.-2026-г._-12_14_32.png`
- `mq75drfx-ChatGPT-Image-1-июн.-2026-г._-12_14_23.png`
- `mqaoje4p-drawing-2026-06-12T08-43-48-162Z.png`
- `mqaokeip-drawing-2026-06-12T08-44-35-325Z.png`
- `mqaomwv0-drawing-2026-06-12T08-46-32-407Z.png`
- `mqap9fxx-drawing-2026-06-12T09-04-03-568Z.png`
- `mqapl4sp-drawing-2026-06-12T09-13-08-995Z.png`
- `mqapmkpb-drawing-2026-06-12T09-14-16-267Z.png`
- `mqapobt4-drawing-2026-06-12T09-15-38-054Z.png`
- `mqaryi7d-drawing-2026-06-12T10-19-32-131Z.png`
- `mqas191k-ChatGPT-Image-1-июн.-2026-г._-12_14_40.png`
- `mqas7qit-ChatGPT-Image-1-июн.-2026-г._-12_14_47.png`
- `mqb1fv1w-ChatGPT-Image-1-июн.-2026-г._-12_14_40.png`
- `mqcuq0jf-drawing-2026-06-13T21-12-27-187Z.png`
- `mqdn51oz-drawing-2026-06-14T10-27-57-771Z.png`
- `mqe3aeu5-drawing-2026-06-14T18-00-01-941Z.png`
- `mqe3irg9-drawing-2026-06-14T18-06-31-541Z.png`
- `mqe3n7jr-drawing-2026-06-14T18-09-59-026Z.png`
- `mqe4kpbk-drawing-2026-06-14T18-36-01-705Z.png`
- `mqe4x2x5-drawing-2026-06-14T18-45-39-203Z.png`
- `mqe4y6nv-drawing-2026-06-14T18-46-30-711Z.png`
- `mqe553wo-drawing-2026-06-14T18-51-53-730Z.png`
- `mqe56zp3-ChatGPT-Image-1-июн.-2026-г._-12_14_40.png`
- `mqe5ww54-drawing-2026-06-14T19-13-30-033Z.png`
- `mqe5xfy7-drawing-2026-06-14T19-13-55-706Z.png`
- `mqe5yifd-drawing-2026-06-14T19-14-45-572Z.png`
- `mqe61h8y-drawing-2026-06-14T19-17-04-013Z.png`
- `mqe62w4r-drawing-2026-06-14T19-18-09-957Z.png`
- `mqe6d3ry-drawing-2026-06-14T19-26-06-425Z.png`
- `mqe6z4vf-drawing-2026-06-14T19-43-14-274Z.png`
- `mqe79r30-drawing-2026-06-14T19-51-29-620Z.png`
- `mqe7b3xs-drawing-2026-06-14T19-52-32-937Z.png`
- `mqe7lwly-drawing-2026-06-14T20-00-56-657Z.png`
- `mqe7psme-drawing-2026-06-14T20-03-58-112Z.png`
- `process-check.png`
- `process-desktop-final.png`
- `process-diagram-redesign-check.png`
- `process-diagram-redesign-desktop.png`
- `process-diagram-redesign-v2.png`
- `process-mobile-check.png`
- `sort-amount-up.jpg`
- `sort-amount-up.svg`
- `verify-about-header.png`
- `verify-about-mobile-menu-open.png`
- `verify-contacts-header.png`
- `verify-contacts-mobile-menu-open.png`
- `verify-index-header.png`
- `verify-menu-about.png`
- `verify-menu-contacts.png`
- `verify-menu-process.png`
- `verify-menu-works.png`
- `verify-page-transition-index.png`
- `verify-process-glitch.png`
- `verify-process-header.png`
- `verify-process-mobile-menu-open.png`
- `verify-quality-list-restored.png`
- `verify-works-header.png`
- `verify-works-mobile-menu-open.png`
- `verify-works-mobile.png`
- `works-desktop-check-v2.png`
- `works-desktop-check.png`
- `works-mobile-check-v2.png`
- `works-mobile-check.png`
- `works-mobile-controls-check.png`
- `works-mobile-menu-check.png`
- `works-mobile-menu-open-check-v2.png`
- `works-mobile-menu-open-check.png`
- `works-tech-icons-check.png`
- `works-tech-icons-colored-check.png`

## Coding checklist for AI tools
1. Inspect `index.html` and `DESIGN-MANIFEST.json` first and identify reusable components before coding.
2. Implement each user-facing screen file as its own route/surface; keep launcher, landing, app, platform, and OS widget files separate.
3. Extract design tokens into the target stack: colors, type scale, spacing, radius, shadows, and motion.
4. Implement layout with real 2025–2026 responsive breakpoints, fluid type/spacing, and container-query-aware component behavior; test with no horizontal overflow.
5. Preserve interactive controls, hover/focus/pressed states, form behavior, validation, and copy actions where present.
6. Implement domain-specific in-app modules with real states; do not flatten them into generic cards.
7. Keep landing page, product screens, and OS widget/quick-access surfaces separate when present.
8. Confirm the production result visually matches the exported design before refactoring internals.
9. Reject implementation shortcuts that flatten the design into generic cards, generic gradients, placeholder stats, or framework-default typography.
10. If a detail is ambiguous, keep the exported HTML/CSS/JS behavior rather than inventing a new pattern.
