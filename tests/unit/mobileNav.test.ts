import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { createDom, type DomFixture } from "../helpers/dom.ts";
import {
  destroyMobileNav,
  initMobileNav,
} from "../../src/scripts/mobileNav.ts";

let fixture: DomFixture | undefined;

function setupMobileNav(): DomFixture {
  fixture = createDom(`
    <button id="menuButton" data-mobile-nav-toggle aria-expanded="false" aria-controls="mobileNav">
      Menu
    </button>
    <nav id="mobileNav" data-mobile-nav data-state="closed">
      <a href="/works" data-mobile-nav-link>Works</a>
      <a href="/contacts" data-mobile-nav-link>Contacts</a>
    </nav>
    <main id="content"><button id="outside">Outside</button></main>
  `);
  return fixture;
}

afterEach(() => {
  destroyMobileNav();
  fixture?.cleanup();
  fixture = undefined;
});

describe("mobile nav", () => {
  it("opens, closes on outside click, and keeps button/nav ARIA in sync", () => {
    const { document } = setupMobileNav();
    const button = document.getElementById("menuButton") as HTMLButtonElement;
    const nav = document.getElementById("mobileNav") as HTMLElement;

    initMobileNav({ root: document });
    button.click();

    assert.equal(button.getAttribute("aria-expanded"), "true");
    assert.equal(button.dataset.state, "open");
    assert.equal(nav.dataset.state, "open");
    assert.equal(nav.classList.contains("is-open"), true);

    document.getElementById("outside")?.click();

    assert.equal(button.getAttribute("aria-expanded"), "false");
    assert.equal(nav.dataset.state, "closed");
    assert.equal(nav.classList.contains("is-open"), false);
  });

  it("closes on link activation and Escape, restoring focus from the overlay", () => {
    const { document, window } = setupMobileNav();
    const button = document.getElementById("menuButton") as HTMLButtonElement;
    const nav = document.getElementById("mobileNav") as HTMLElement;
    const firstLink = nav.querySelector("a") as HTMLAnchorElement;

    initMobileNav({ root: document });
    button.click();
    firstLink.click();
    assert.equal(nav.dataset.state, "closed");

    button.click();
    firstLink.focus();
    document.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );

    assert.equal(nav.dataset.state, "closed");
    assert.equal(document.activeElement, button);
  });

  it("re-initializes idempotently without duplicate toggle listeners", () => {
    const { document } = setupMobileNav();
    const button = document.getElementById("menuButton") as HTMLButtonElement;
    const nav = document.getElementById("mobileNav") as HTMLElement;

    initMobileNav({ root: document });
    initMobileNav({ root: document });

    button.click();
    assert.equal(nav.dataset.state, "open");

    button.click();
    assert.equal(nav.dataset.state, "closed");
  });
});
