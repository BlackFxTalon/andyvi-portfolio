export interface GlitchTarget {
  selector: string;
  cssClass: string;
  durationMs: number;
}

export interface GlitchOptions {
  root?: ParentNode;
  win?: Window;
  targets?: GlitchTarget[];
}

export const DEFAULT_GLITCH_TARGETS: GlitchTarget[] = [
  { selector: ".logo-word", cssClass: "load-glitch-logo", durationMs: 1120 },
  {
    selector: ".hero-title span:first-child",
    cssClass: "load-glitch",
    durationMs: 1200,
  },
  {
    selector: ".hero-title span:nth-child(2)",
    cssClass: "load-glitch-deep",
    durationMs: 1400,
  },
  {
    selector:
      ".hero-title-word, .about-title-word, .process-title-word, .works-title-word",
    cssClass: "load-glitch-title",
    durationMs: 1200,
  },
];

const activeTimers = new WeakMap<HTMLElement, number>();
const activeFrames = new WeakMap<HTMLElement, number>();

function getWindow(root?: ParentNode, win?: Window): Window | undefined {
  if (win) return win;
  if (root && "ownerDocument" in root) {
    const ownerDocument = root.ownerDocument;
    if (ownerDocument?.defaultView) return ownerDocument.defaultView;
  }
  return typeof window === "undefined" ? undefined : window;
}

export function prefersReducedMotion(win = getWindow()): boolean {
  return Boolean(win?.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

export function clearGlitch(
  element: Element | null,
  cssClass?: string,
  win = getWindow(),
): void {
  if (!(element instanceof HTMLElement)) return;

  const timer = activeTimers.get(element);
  if (timer !== undefined) {
    win?.clearTimeout(timer);
    activeTimers.delete(element);
  }

  const frame = activeFrames.get(element);
  if (frame !== undefined) {
    win?.cancelAnimationFrame?.(frame);
    activeFrames.delete(element);
  }

  if (cssClass) element.classList.remove(cssClass);
  else
    DEFAULT_GLITCH_TARGETS.forEach((target) =>
      element.classList.remove(target.cssClass),
    );
  delete element.dataset.glitch;
}

export function applyGlitch(
  element: Element | null,
  cssClass: string,
  durationMs: number,
  options: GlitchOptions = {},
): void {
  const win = getWindow(options.root, options.win);
  if (!(element instanceof HTMLElement) || !win) return;

  clearGlitch(element, cssClass, win);

  if (prefersReducedMotion(win)) return;

  const text = element.textContent?.trim();
  if (!text) return;

  element.dataset.glitch = text;
  const apply = () => {
    activeFrames.delete(element);
    element.classList.add(cssClass);
    const timer = win.setTimeout(
      () => clearGlitch(element, cssClass, win),
      Math.max(0, durationMs),
    );
    activeTimers.set(element, timer);
  };

  const frame = win.requestAnimationFrame
    ? win.requestAnimationFrame(apply)
    : win.setTimeout(apply, 0);
  activeFrames.set(element, frame);
}

export function initGlitchOnLoad(options: GlitchOptions = {}): void {
  const root =
    options.root ?? (typeof document === "undefined" ? undefined : document);
  const targets = options.targets ?? DEFAULT_GLITCH_TARGETS;
  if (!root) return;

  targets.forEach((target) => {
    root.querySelectorAll(target.selector).forEach((element) => {
      applyGlitch(element, target.cssClass, target.durationMs, options);
    });
  });
}

export function cleanupGlitchOnLoad(options: GlitchOptions = {}): void {
  const root =
    options.root ?? (typeof document === "undefined" ? undefined : document);
  const targets = options.targets ?? DEFAULT_GLITCH_TARGETS;
  if (!root) return;

  targets.forEach((target) => {
    root
      .querySelectorAll(target.selector)
      .forEach((element) => clearGlitch(element, target.cssClass, options.win));
  });
}
