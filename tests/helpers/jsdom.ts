import { JSDOM } from "jsdom";

type InstalledGlobal =
  | "document"
  | "window"
  | "navigator"
  | "Node"
  | "HTMLElement"
  | "HTMLAnchorElement"
  | "HTMLButtonElement"
  | "HTMLFormElement"
  | "HTMLInputElement"
  | "HTMLSelectElement"
  | "HTMLTextAreaElement"
  | "Event"
  | "KeyboardEvent"
  | "MouseEvent"
  | "SubmitEvent"
  | "FormData"
  | "AbortController"
  | "AbortSignal";

const INSTALLED_GLOBALS: readonly InstalledGlobal[] = [
  "document",
  "window",
  "navigator",
  "Node",
  "HTMLElement",
  "HTMLAnchorElement",
  "HTMLButtonElement",
  "HTMLFormElement",
  "HTMLInputElement",
  "HTMLSelectElement",
  "HTMLTextAreaElement",
  "Event",
  "KeyboardEvent",
  "MouseEvent",
  "SubmitEvent",
  "FormData",
  "AbortController",
  "AbortSignal",
];

export interface TestDom {
  dom: JSDOM;
  window: Window & typeof globalThis;
  document: Document;
  cleanup: () => void;
}

export function createTestDom(html: string, url = "https://andyvi.test/"): TestDom {
  const dom = new JSDOM(html, {
    pretendToBeVisual: true,
    url,
  });
  const { window } = dom;

  Object.defineProperties(globalThis, {
    window: { configurable: true, value: window },
    document: { configurable: true, value: window.document },
    navigator: { configurable: true, value: window.navigator },
  });

  for (const key of INSTALLED_GLOBALS) {
    if (key === "document" || key === "window" || key === "navigator") continue;
    Object.defineProperty(globalThis, key, {
      configurable: true,
      value: window[key],
    });
  }

  return {
    dom,
    window: window as unknown as Window & typeof globalThis,
    document: window.document,
    cleanup: () => {
      dom.window.close();
      for (const key of INSTALLED_GLOBALS) {
        delete (globalThis as Record<string, unknown>)[key];
      }
    },
  };
}

export function click(target: EventTarget): boolean {
  return target.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
}

export function input(target: EventTarget): boolean {
  return target.dispatchEvent(new Event("input", { bubbles: true, cancelable: true }));
}

export function change(target: EventTarget): boolean {
  return target.dispatchEvent(new Event("change", { bubbles: true, cancelable: true }));
}

export function keydown(key: string, options: KeyboardEventInit = {}): boolean {
  return document.dispatchEvent(new KeyboardEvent("keydown", {
    bubbles: true,
    cancelable: true,
    key,
    ...options,
  }));
}

export function submit(form: HTMLFormElement): boolean {
  return form.dispatchEvent(new SubmitEvent("submit", { bubbles: true, cancelable: true }));
}

export async function settle(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
