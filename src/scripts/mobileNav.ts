export interface MobileNavOptions {
  root?: ParentNode;
  button?: HTMLElement | null;
  nav?: HTMLElement | null;
}

let controller: AbortController | undefined;

function getDocument(root?: ParentNode): Document | null {
  if (root && "ownerDocument" in root && root.ownerDocument)
    return root.ownerDocument;
  return typeof document === "undefined" ? null : document;
}

function setOpen(button: HTMLElement, nav: HTMLElement, isOpen: boolean): void {
  button.setAttribute("aria-expanded", String(isOpen));
  button.dataset.state = isOpen ? "open" : "closed";
  nav.classList.toggle("is-open", isOpen);
  nav.dataset.state = isOpen ? "open" : "closed";
}

export function destroyMobileNav(): void {
  controller?.abort();
  controller = undefined;
}

export function initMobileNav(options: MobileNavOptions = {}): void {
  destroyMobileNav();

  const root =
    options.root ?? (typeof document === "undefined" ? undefined : document);
  const doc = getDocument(root);
  if (!root || !doc) return;

  const button =
    options.button ??
    root.querySelector<HTMLElement>("#menuButton, [data-mobile-nav-toggle]");
  const nav =
    options.nav ??
    root.querySelector<HTMLElement>("#mobileNav, [data-mobile-nav]");
  if (!button || !nav) return;

  controller = new AbortController();
  const { signal } = controller;
  const close = () => setOpen(button, nav, false);
  const toggle = () =>
    setOpen(
      button,
      nav,
      nav.dataset.state !== "open" && !nav.classList.contains("is-open"),
    );

  setOpen(
    button,
    nav,
    button.getAttribute("aria-expanded") === "true" ||
      nav.classList.contains("is-open"),
  );

  button.addEventListener(
    "click",
    (event) => {
      event.stopPropagation();
      toggle();
    },
    { signal },
  );

  nav.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (
        target instanceof HTMLAnchorElement ||
        (target instanceof HTMLElement &&
          target.closest("[data-mobile-nav-link]"))
      ) {
        close();
      }
    },
    { signal },
  );

  doc.addEventListener(
    "click",
    (event) => {
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (button.contains(target) || nav.contains(target)) return;
      close();
    },
    { signal },
  );

  doc.addEventListener(
    "keydown",
    (event) => {
      if (event.key !== "Escape") return;
      close();
      if (doc.activeElement && nav.contains(doc.activeElement)) button.focus();
    },
    { signal },
  );

  doc.addEventListener("astro:before-swap", close, { signal });
}
