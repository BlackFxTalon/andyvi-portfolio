import {
  cleanupGlitchOnLoad,
  initGlitchOnLoad,
  prefersReducedMotion,
} from "./glitchOnLoad.ts";
import { destroyMobileNav, initMobileNav } from "./mobileNav.ts";

export interface PageTransitionOptions {
  root?: HTMLElement;
  doc?: Document;
  win?: Window;
  storageKey?: string;
  visitedSelector?: string;
  transitionMs?: number;
  bindPageLoad?: boolean;
  bindSwapCleanup?: boolean;
}

export const VISITED_STORAGE_KEY = "andyvi:visited-hrefs";
export const DEFAULT_VISITED_SELECTOR =
  "a[href][data-track-visited], #projectsCta, .cta[href]";

let controller: AbortController | undefined;
let ctaVisitedController: AbortController | undefined;
let shellLifecycleController: AbortController | undefined;
let classTimer: number | undefined;

function getDocument(options: PageTransitionOptions): Document | undefined {
  return (
    options.doc ??
    options.win?.document ??
    (typeof document === "undefined" ? undefined : document)
  );
}

function getWindow(
  options: PageTransitionOptions,
  doc?: Document,
): Window | undefined {
  return (
    options.win ??
    doc?.defaultView ??
    (typeof window === "undefined" ? undefined : window)
  );
}

function safeStorage(win?: Window): Storage | null {
  try {
    return win?.sessionStorage ?? win?.localStorage ?? null;
  } catch {
    return null;
  }
}

function glitchOptions(
  root: ParentNode,
  win?: Window,
): { root: ParentNode; win?: Window } {
  return win ? { root, win } : { root };
}

function readVisited(storage: Storage | null, key: string): Set<string> {
  if (!storage) return new Set();
  try {
    const parsed: unknown = JSON.parse(storage.getItem(key) ?? "[]");
    return new Set(
      Array.isArray(parsed)
        ? parsed.filter((value): value is string => typeof value === "string")
        : [],
    );
  } catch {
    return new Set();
  }
}

function writeVisited(
  storage: Storage | null,
  key: string,
  visited: Set<string>,
): void {
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify([...visited].slice(-80)));
  } catch {
    // Storage may be unavailable in private/iframe contexts; visual state simply degrades.
  }
}

function clearTransitionClasses(root: HTMLElement, win?: Window): void {
  if (classTimer !== undefined) {
    win?.clearTimeout(classTimer);
    classTimer = undefined;
  }
  root.classList.remove("is-page-entering", "is-page-exiting");
  root.dataset.motion = prefersReducedMotion(win) ? "reduced" : "full";
}

function markTransition(
  root: HTMLElement,
  className: "is-page-entering" | "is-page-exiting",
  win?: Window,
  durationMs = 700,
): void {
  clearTransitionClasses(root, win);
  if (prefersReducedMotion(win)) return;
  root.classList.add(className);
  classTimer = win?.setTimeout(
    () => clearTransitionClasses(root, win),
    durationMs,
  );
}

export function applyVisitedState(options: PageTransitionOptions = {}): void {
  const doc = getDocument(options);
  const win = getWindow(options, doc);
  if (!doc) return;

  const storageKey = options.storageKey ?? VISITED_STORAGE_KEY;
  const visitedSelector = options.visitedSelector ?? DEFAULT_VISITED_SELECTOR;
  const visited = readVisited(safeStorage(win), storageKey);

  doc.querySelectorAll<HTMLAnchorElement>(visitedSelector).forEach((link) => {
    const href = link.getAttribute("href");
    const isVisited = Boolean(href && visited.has(href));
    link.classList.toggle("is-visited", isVisited);
    link.dataset.visited = isVisited ? "true" : "false";
  });
}

export function initCtaVisited(options: PageTransitionOptions = {}): void {
  ctaVisitedController?.abort();
  ctaVisitedController = undefined;

  const doc = getDocument(options);
  const win = getWindow(options, doc);
  if (!doc) return;

  const storageKey = options.storageKey ?? VISITED_STORAGE_KEY;
  const visitedSelector = options.visitedSelector ?? DEFAULT_VISITED_SELECTOR;
  const storage = safeStorage(win);
  const visited = readVisited(storage, storageKey);
  ctaVisitedController = new AbortController();
  const { signal } = ctaVisitedController;

  applyVisitedState(options);

  doc.querySelectorAll<HTMLAnchorElement>(visitedSelector).forEach((link) => {
    link.addEventListener(
      "click",
      () => {
        const href = link.getAttribute("href");
        if (!href) return;
        visited.add(href);
        writeVisited(storage, storageKey, visited);
        applyVisitedState(options);
      },
      { signal },
    );
  });
}

export function destroyPageTransition(): void {
  const doc = typeof document === "undefined" ? undefined : document;
  const win =
    doc?.defaultView ?? (typeof window === "undefined" ? undefined : window);
  const root = doc?.documentElement;
  if (root) clearTransitionClasses(root, win);
  controller?.abort();
  controller = undefined;
  ctaVisitedController?.abort();
  ctaVisitedController = undefined;
  if (doc) cleanupGlitchOnLoad({ root: doc });
}

export function initPageTransition(options: PageTransitionOptions = {}): void {
  destroyPageTransition();

  const doc = getDocument(options);
  const win = getWindow(options, doc);
  const root = options.root ?? doc?.documentElement;
  if (!doc || !win || !root) return;

  controller = new AbortController();
  const { signal } = controller;
  const durationMs = options.transitionMs ?? 700;
  const bindPageLoad = options.bindPageLoad ?? true;
  const bindSwapCleanup = options.bindSwapCleanup ?? true;
  const handlePageLoad = () => {
    markTransition(root, "is-page-entering", win, durationMs);
    applyVisitedState(options);
  };

  clearTransitionClasses(root, win);
  applyVisitedState(options);

  doc.addEventListener(
    "astro:before-preparation",
    () => markTransition(root, "is-page-exiting", win, durationMs),
    { signal },
  );
  if (bindSwapCleanup) {
    doc.addEventListener(
      "astro:before-swap",
      () => {
        cleanupGlitchOnLoad(glitchOptions(doc, win));
        destroyMobileNav();
      },
      { signal },
    );
  }
  doc.addEventListener(
    "astro:after-swap",
    () => clearTransitionClasses(root, win),
    { signal },
  );
  if (bindPageLoad)
    doc.addEventListener("astro:page-load", handlePageLoad, { signal });

  initCtaVisited(options);
}

export function initShellLifecycle(options: PageTransitionOptions = {}): void {
  const doc = getDocument(options);
  if (!doc) return;

  initPageTransition(options);
  initMobileNav({ root: doc });
  initGlitchOnLoad(glitchOptions(doc, options.win));
}

export function destroyShellLifecycleBinding(): void {
  shellLifecycleController?.abort();
  shellLifecycleController = undefined;
}

export function bindShellLifecycle(options: PageTransitionOptions = {}): void {
  destroyShellLifecycleBinding();
  destroyShellLifecycle();

  const doc = getDocument(options);
  const win = getWindow(options, doc);
  if (!doc) return;

  shellLifecycleController = new AbortController();
  const { signal } = shellLifecycleController;
  const boundOptions: PageTransitionOptions = {
    ...options,
    doc,
    bindPageLoad: false,
    bindSwapCleanup: false
  };
  if (win) boundOptions.win = win;

  const run = () => initShellLifecycle(boundOptions);
  const cleanup = () => destroyShellLifecycle();

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", run, { once: true, signal });
  } else {
    run();
  }

  doc.addEventListener("astro:page-load", run, { signal });
  doc.addEventListener("astro:before-swap", cleanup, { signal });
}

export function destroyShellLifecycle(): void {
  destroyPageTransition();
  destroyMobileNav();
  cleanupGlitchOnLoad();
}
