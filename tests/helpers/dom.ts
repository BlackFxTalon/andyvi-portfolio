import { JSDOM, type ConstructorOptions } from "jsdom";

type GlobalKey =
  | "window"
  | "document"
  | "navigator"
  | "HTMLElement"
  | "HTMLAnchorElement"
  | "HTMLButtonElement"
  | "HTMLFormElement"
  | "HTMLInputElement"
  | "HTMLSelectElement"
  | "HTMLTextAreaElement"
  | "Node"
  | "Document"
  | "Event"
  | "CustomEvent"
  | "KeyboardEvent"
  | "MouseEvent"
  | "FocusEvent"
  | "FormData"
  | "AbortController"
  | "getComputedStyle";

export interface DomFixture {
  dom: JSDOM;
  window: Window & typeof globalThis;
  document: Document;
  cleanup: () => void;
}

export interface CreateDomOptions extends ConstructorOptions {
  viewport?: {
    width: number;
    height: number;
  };
}

const GLOBAL_KEYS: readonly GlobalKey[] = [
  "window",
  "document",
  "navigator",
  "HTMLElement",
  "HTMLAnchorElement",
  "HTMLButtonElement",
  "HTMLFormElement",
  "HTMLInputElement",
  "HTMLSelectElement",
  "HTMLTextAreaElement",
  "Node",
  "Document",
  "Event",
  "CustomEvent",
  "KeyboardEvent",
  "MouseEvent",
  "FocusEvent",
  "FormData",
  "AbortController",
  "getComputedStyle",
];

export function createDom(
  html: string,
  options: CreateDomOptions = {},
): DomFixture {
  const dom = new JSDOM(html, {
    url: "https://andyvi.dev/",
    pretendToBeVisual: true,
    ...options,
  });
  const { window } = dom;

  if (options.viewport) {
    Object.defineProperty(window, "innerWidth", {
      configurable: true,
      value: options.viewport.width,
    });
    Object.defineProperty(window, "innerHeight", {
      configurable: true,
      value: options.viewport.height,
    });
  }

  const previous = new Map<GlobalKey, unknown>();
  for (const key of GLOBAL_KEYS) {
    previous.set(key, globalThis[key as keyof typeof globalThis]);
  }

  const globals: Record<GlobalKey, unknown> = {
    window,
    document: window.document,
    navigator: window.navigator,
    HTMLElement: window.HTMLElement,
    HTMLAnchorElement: window.HTMLAnchorElement,
    HTMLButtonElement: window.HTMLButtonElement,
    HTMLFormElement: window.HTMLFormElement,
    HTMLInputElement: window.HTMLInputElement,
    HTMLSelectElement: window.HTMLSelectElement,
    HTMLTextAreaElement: window.HTMLTextAreaElement,
    Node: window.Node,
    Document: window.Document,
    Event: window.Event,
    CustomEvent: window.CustomEvent,
    KeyboardEvent: window.KeyboardEvent,
    MouseEvent: window.MouseEvent,
    FocusEvent: window.FocusEvent,
    FormData: window.FormData,
    AbortController: window.AbortController,
    getComputedStyle: window.getComputedStyle.bind(window),
  };

  for (const [key, value] of Object.entries(globals)) {
    Object.defineProperty(globalThis, key, {
      configurable: true,
      writable: true,
      value,
    });
  }

  return {
    dom,
    window: window as unknown as Window & typeof globalThis,
    document: window.document,
    cleanup: () => {
      dom.window.close();
      for (const key of GLOBAL_KEYS) {
        const value = previous.get(key);
        if (value === undefined) {
          delete globalThis[key as keyof typeof globalThis];
        } else {
          Object.defineProperty(globalThis, key, {
            configurable: true,
            writable: true,
            value,
          });
        }
      }
    },
  };
}

export async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}
