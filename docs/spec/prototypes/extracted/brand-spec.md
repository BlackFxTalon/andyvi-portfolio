# AndyVi hero reference brand spec

Source: `mq3v2o11-ChatGPT-Image-1-июн.-2026-г._-12_12_35.png`

## Tokens

```css
:root {
  --bg: oklch(7% 0.018 250);
  --surface: oklch(10% 0.022 250);
  --fg: oklch(96% 0.015 240);
  --muted: oklch(75% 0.018 240);
  --border: oklch(66% 0.065 235);
  --accent: oklch(74% 0.12 225);

  --font-display: "Unbounded", "Arial Black", system-ui, sans-serif;
  --font-body: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "IBM Plex Mono", ui-monospace, Menlo, monospace;
}
```

## Layout posture

- 1920x1080 fixed cinematic frame with raster reference/image base filling the canvas.
- Left half is image-led: portrait, smoke, cold blue texture, grain, and vignette stay raster-first.
- Right half is vector/HUD-led: thin 1px lines, small ticks, corner cuts, and restrained cyan-white glow.
- Typography is deliberately split: Unbounded for logo, nav, eyebrow, H1, CTA, metrics, and right index; Inter for lead copy and captions.
- Radius stays near zero; interaction surfaces use clipped corners rather than rounded cards.

