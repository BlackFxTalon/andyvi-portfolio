import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  calculateFrameTransform,
  fitFrame,
  getFrameLayout,
} from "./fitFrame.ts";
import { applyGlitch, cleanupGlitchOnLoad } from "./glitchOnLoad.ts";
import {
  applyVisitedState,
  destroyPageTransition,
  bindShellLifecycle,
  destroyShellLifecycle,
  destroyShellLifecycleBinding,
  initCtaVisited,
  initPageTransition,
} from "./pageTransition.ts";
import { destroyMobileNav, initMobileNav } from "./mobileNav.ts";

type ListenerEvent = Event & { key?: string };

class TestClassList {
  private readonly values = new Set<string>();

  add(...tokens: string[]): void {
    tokens.forEach((token) => this.values.add(token));
  }

  remove(...tokens: string[]): void {
    tokens.forEach((token) => this.values.delete(token));
  }

  contains(token: string): boolean {
    return this.values.has(token);
  }

  toggle(token: string, force?: boolean): boolean {
    const shouldAdd = force ?? !this.values.has(token);
    if (shouldAdd) this.values.add(token);
    else this.values.delete(token);
    return shouldAdd;
  }
}

class TestStyle {
  private transformValue = "";
  transformWriteCount = 0;

  get transform(): string {
    return this.transformValue;
  }

  set transform(value: string) {
    this.transformWriteCount += 1;
    this.transformValue = value;
  }

  removeProperty(property: string): void {
    if (property === "transform") {
      this.transformWriteCount += 1;
      this.transformValue = "";
    }
  }

  resetWriteCount(): void {
    this.transformWriteCount = 0;
  }
}

class TestNode extends EventTarget {
  ownerDocument: TestDocument | null = null;
  parentElement: TestElement | null = null;
  children: TestElement[] = [];
  textContent = "";

  contains(node: unknown): boolean {
    if (node === this) return true;
    return this.children.some((child) => child.contains(node));
  }
}

class TestElement extends TestNode {
  readonly attributes = new Map<string, string>();
  readonly classList = new TestClassList();
  readonly dataset: Record<string, string> = {};
  readonly style = new TestStyle();
  id = "";

  constructor(id = "") {
    super();
    this.id = id;
  }

  setAttribute(name: string, value: string): void {
    this.attributes.set(name, value);
  }

  getAttribute(name: string): string | null {
    return this.attributes.get(name) ?? null;
  }

  removeAttribute(name: string): void {
    this.attributes.delete(name);
  }

  focus(): void {
    if (this.ownerDocument) this.ownerDocument.activeElement = this;
  }

  closest(selector: string): TestElement | null {
    if (
      selector === "[data-mobile-nav-link]" &&
      "mobileNavLink" in this.dataset
    )
      return this;
    return null;
  }
}

class TestAnchor extends TestElement {
  private readonly href: string;

  constructor(href: string) {
    super();
    this.href = href;
  }

  override getAttribute(name: string): string | null {
    if (name === "href") return this.href;
    return super.getAttribute(name);
  }
}

class TestDocument extends TestNode {
  readonly documentElement = new TestElement("html");
  readonly elements = new Map<string, TestElement>();
  readonly allElements: TestElement[] = [];
  defaultView: TestWindow | null = null;
  activeElement: TestElement | null = null;
  readyState: DocumentReadyState = "complete";

  constructor() {
    super();
    this.ownerDocument = this;
    this.documentElement.ownerDocument = this;
  }

  register<T extends TestElement>(element: T): T {
    element.ownerDocument = this;
    this.allElements.push(element);
    if (element.id) this.elements.set(element.id, element);
    return element;
  }

  getElementById(id: string): TestElement | null {
    return this.elements.get(id) ?? null;
  }

  querySelector<T extends Element = Element>(selector: string): T | null {
    if (selector.includes("#menuButton"))
      return (
        (this.elements.get("menuButton") as unknown as T | undefined) ?? null
      );
    if (selector.includes("#mobileNav"))
      return (
        (this.elements.get("mobileNav") as unknown as T | undefined) ?? null
      );
    if (selector.includes(".topbar"))
      return (
        (this.elements.get("siteHeader") as unknown as T | undefined) ?? null
      );
    return null;
  }

  querySelectorAll<T extends Element = Element>(selector: string): T[] {
    if (selector.includes("data-track-visited") || selector.includes(".cta")) {
      return this.allElements.filter(
        (element) => element instanceof TestAnchor,
      ) as unknown as T[];
    }
    return [];
  }
}

class TestStorage {
  private readonly values = new Map<string, string>();
  writeCount = 0;

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.writeCount += 1;
    this.values.set(key, value);
  }
}

class TestWindow extends EventTarget {
  innerWidth = 1440;
  innerHeight = 900;
  readonly sessionStorage = new TestStorage();
  readonly document: TestDocument;
  private readonly timers = new Map<number, () => void>();
  private readonly reduceMotion: boolean;
  private nextTimer = 1;

  constructor(document: TestDocument, reduceMotion = false) {
    super();
    this.document = document;
    this.reduceMotion = reduceMotion;
    document.defaultView = this;
  }

  matchMedia(): Pick<MediaQueryList, "matches"> {
    return { matches: this.reduceMotion };
  }

  setTimeout(callback: () => void): number {
    const timer = this.nextTimer;
    this.nextTimer += 1;
    this.timers.set(timer, callback);
    return timer;
  }

  clearTimeout(timer: number): void {
    this.timers.delete(timer);
  }

  requestAnimationFrame(callback: FrameRequestCallback): number {
    callback(0);
    return 0;
  }

  cancelAnimationFrame(): void {
    // The shim executes RAF immediately.
  }
}

function installDomGlobals(): void {
  Object.assign(globalThis, {
    Node: TestNode,
    HTMLElement: TestElement,
    HTMLAnchorElement: TestAnchor,
  });
}

function createDom(reduceMotion = false): {
  doc: TestDocument;
  win: TestWindow;
} {
  installDomGlobals();
  const doc = new TestDocument();
  const win = new TestWindow(doc, reduceMotion);
  Object.assign(globalThis, {
    document: doc,
    window: win,
  });
  return { doc, win };
}

function event(type: string, key?: string): ListenerEvent {
  const nextEvent = new Event(type) as ListenerEvent;
  if (key) Object.defineProperty(nextEvent, "key", { value: key });
  return nextEvent;
}

afterEach(() => {
  destroyShellLifecycleBinding();
  destroyShellLifecycle();
  destroyMobileNav();
  destroyPageTransition();
  delete (globalThis as { document?: unknown }).document;
  delete (globalThis as { window?: unknown }).window;
});

describe("fitFrame lifecycle", () => {
  it("calculates safe desktop transforms and flow breakpoint state", () => {
    assert.deepEqual(
      calculateFrameTransform({ viewportWidth: 1920, viewportHeight: 1080 }),
      {
        scale: 1,
        x: 0,
        y: 0,
        css: "translate(0px, 0px) scale(1)",
      },
    );
    assert.equal(
      getFrameLayout({ viewportWidth: 1279, viewportHeight: 900 }).mode,
      "flow",
    );
    assert.equal(
      getFrameLayout({ viewportWidth: Number.NaN, viewportHeight: 0 }).mode,
      "flow",
    );
    assert.equal(
      calculateFrameTransform({ viewportWidth: 0, viewportHeight: 0 }).scale,
      1,
    );
  });

  it("applies transforms only in cinematic viewports and clears them below 1280px", () => {
    const { doc, win } = createDom();
    const frame = doc.register(new TestElement("frame"));
    const header = doc.register(new TestElement("siteHeader"));
    frame.dataset.frameWidth = "1920";
    frame.dataset.frameHeight = "1080";

    const cinematic = fitFrame({
      frame: frame as unknown as HTMLElement,
      header: header as unknown as HTMLElement,
      root: doc.documentElement as unknown as HTMLElement,
      win: win as unknown as Window,
    });
    assert.equal(cinematic?.mode, "cinematic");
    assert.match(frame.style.transform, /scale\(0\.75\)/);
    assert.equal(header.style.transform, frame.style.transform);
    assert.equal(doc.documentElement.dataset.layout, "cinematic");

    win.innerWidth = 390;
    const flow = fitFrame({
      frame: frame as unknown as HTMLElement,
      header: header as unknown as HTMLElement,
      root: doc.documentElement as unknown as HTMLElement,
      win: win as unknown as Window,
    });
    assert.equal(flow?.mode, "flow");
    assert.equal(frame.style.transform, "");
    assert.equal(header.style.transform, "");
    assert.equal(doc.documentElement.dataset.layout, "flow");
  });
});

describe("mobile nav lifecycle", () => {
  it("opens, closes, and stays idempotent across repeated init calls", () => {
    const { doc } = createDom();
    const button = doc.register(new TestElement("menuButton"));
    const nav = doc.register(new TestElement("mobileNav"));
    button.setAttribute("aria-expanded", "false");

    initMobileNav({
      root: doc as unknown as ParentNode,
      button: button as unknown as HTMLElement,
      nav: nav as unknown as HTMLElement,
    });
    initMobileNav({
      root: doc as unknown as ParentNode,
      button: button as unknown as HTMLElement,
      nav: nav as unknown as HTMLElement,
    });

    button.dispatchEvent(event("click"));
    assert.equal(button.getAttribute("aria-expanded"), "true");
    assert.equal(nav.dataset.state, "open");
    assert.equal(nav.classList.contains("is-open"), true);

    doc.dispatchEvent(event("keydown", "Escape"));
    assert.equal(button.getAttribute("aria-expanded"), "false");
    assert.equal(nav.dataset.state, "closed");

    button.dispatchEvent(event("click"));
    doc.dispatchEvent(event("click"));
    assert.equal(nav.classList.contains("is-open"), false);
  });
});

describe("glitch on load", () => {
  it("applies and cleans transient glitch state and respects reduced motion", () => {
    const { win } = createDom();
    const title = new TestElement();
    title.textContent = "AndyVi";

    applyGlitch(title as unknown as HTMLElement, "load-glitch-title", 1200, {
      win: win as unknown as Window,
    });
    assert.equal(title.dataset.glitch, "AndyVi");
    assert.equal(title.classList.contains("load-glitch-title"), true);

    cleanupGlitchOnLoad({
      root: {
        querySelectorAll: () => [title],
      } as unknown as ParentNode,
      win: win as unknown as Window,
      targets: [
        { selector: ".title", cssClass: "load-glitch-title", durationMs: 1200 },
      ],
    });
    assert.equal(title.dataset.glitch, undefined);
    assert.equal(title.classList.contains("load-glitch-title"), false);

    const reduced = createDom(true).win;
    applyGlitch(title as unknown as HTMLElement, "load-glitch-title", 1200, {
      win: reduced as unknown as Window,
    });
    assert.equal(title.dataset.glitch, undefined);
    assert.equal(title.classList.contains("load-glitch-title"), false);
  });
});

describe("page transition lifecycle", () => {
  it("binds shell lifecycle idempotently across repeated binds and ClientRouter swaps", () => {
    const { doc, win } = createDom();
    const frame = doc.register(new TestElement("frame"));
    const header = doc.register(new TestElement("siteHeader"));
    const button = doc.register(new TestElement("menuButton"));
    const nav = doc.register(new TestElement("mobileNav"));
    const cta = doc.register(new TestAnchor("/works"));
    frame.dataset.frameWidth = "1920";
    frame.dataset.frameHeight = "1080";
    button.setAttribute("aria-expanded", "false");
    cta.classList.add("cta");

    bindShellLifecycle({
      doc: doc as unknown as Document,
      win: win as unknown as Window,
      root: doc.documentElement as unknown as HTMLElement,
    });
    bindShellLifecycle({
      doc: doc as unknown as Document,
      win: win as unknown as Window,
      root: doc.documentElement as unknown as HTMLElement,
    });
    bindShellLifecycle({
      doc: doc as unknown as Document,
      win: win as unknown as Window,
      root: doc.documentElement as unknown as HTMLElement,
    });

    frame.style.resetWriteCount();
    doc.dispatchEvent(event("astro:page-load"));
    assert.equal(frame.style.transformWriteCount, 1);
    assert.match(frame.style.transform, /scale\(0\.75\)/);
    assert.equal(header.style.transform, frame.style.transform);

    cta.dispatchEvent(event("click"));
    assert.equal(win.sessionStorage.writeCount, 1);
    assert.equal(cta.dataset.visited, "true");

    doc.dispatchEvent(event("astro:before-swap"));
    cta.dispatchEvent(event("click"));
    assert.equal(win.sessionStorage.writeCount, 1);

    doc.dispatchEvent(event("astro:page-load"));
    cta.dispatchEvent(event("click"));
    assert.equal(win.sessionStorage.writeCount, 2);
    assert.equal(nav.dataset.state, "closed");
  });

  it("keeps standalone CTA visited initialization idempotent", () => {
    const { doc, win } = createDom();
    const cta = doc.register(new TestAnchor("/works"));
    cta.classList.add("cta");

    initCtaVisited({
      doc: doc as unknown as Document,
      win: win as unknown as Window,
    });
    initCtaVisited({
      doc: doc as unknown as Document,
      win: win as unknown as Window,
    });
    initCtaVisited({
      doc: doc as unknown as Document,
      win: win as unknown as Window,
    });

    cta.dispatchEvent(event("click"));
    assert.equal(win.sessionStorage.writeCount, 1);
    assert.equal(cta.dataset.visited, "true");

    initCtaVisited({
      doc: doc as unknown as Document,
      win: win as unknown as Window,
    });
    cta.dispatchEvent(event("click"));
    assert.equal(win.sessionStorage.writeCount, 2);
  });

  it("keeps transition classes reduced-motion-safe and applies visited state without storage failures", () => {
    const { doc, win } = createDom(true);
    const cta = doc.register(new TestAnchor("/works"));
    cta.classList.add("cta");

    initPageTransition({
      doc: doc as unknown as Document,
      win: win as unknown as Window,
      root: doc.documentElement as unknown as HTMLElement,
    });
    doc.dispatchEvent(event("astro:before-preparation"));
    assert.equal(
      doc.documentElement.classList.contains("is-page-exiting"),
      false,
    );
    assert.equal(doc.documentElement.dataset.motion, "reduced");

    cta.dispatchEvent(event("click"));
    applyVisitedState({
      doc: doc as unknown as Document,
      win: win as unknown as Window,
    });
    assert.equal(cta.dataset.visited, "true");

    initPageTransition({
      doc: doc as unknown as Document,
      win: win as unknown as Window,
      root: doc.documentElement as unknown as HTMLElement,
    });
    doc.dispatchEvent(event("astro:page-load"));
    assert.equal(
      doc.documentElement.classList.contains("is-page-entering"),
      false,
    );
  });
});
