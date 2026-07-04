import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { createDom, type DomFixture } from "../helpers/dom.ts";
import {
  applyVisitedState,
  destroyPageTransition,
  initCtaVisited,
  VISITED_STORAGE_KEY,
} from "../../src/scripts/pageTransition.ts";

let fixture: DomFixture | undefined;

function setupCta(): DomFixture {
  fixture = createDom(`
    <a id="projectsCta" href="/works" data-track-visited>Projects</a>
  `);
  return fixture;
}

afterEach(() => {
  destroyPageTransition();
  fixture?.cleanup();
  fixture = undefined;
});

describe("page transition visited-state storage", () => {
  it("applies visited state from session storage and writes clicked CTAs", () => {
    const { document, window } = setupCta();
    const cta = document.getElementById("projectsCta") as HTMLAnchorElement;

    window.sessionStorage.setItem(VISITED_STORAGE_KEY, JSON.stringify(["/works"]));
    applyVisitedState({ doc: document, win: window });

    assert.equal(cta.dataset.visited, "true");
    assert.equal(cta.classList.contains("is-visited"), true);

    window.sessionStorage.setItem(VISITED_STORAGE_KEY, "[]");
    initCtaVisited({ doc: document, win: window });
    cta.click();

    assert.equal(
      window.sessionStorage.getItem(VISITED_STORAGE_KEY),
      JSON.stringify(["/works"]),
    );
    assert.equal(cta.dataset.visited, "true");
  });

  it("degrades without throwing when browser storage is unavailable", () => {
    const { document, window } = setupCta();
    const cta = document.getElementById("projectsCta") as HTMLAnchorElement;

    Object.defineProperty(window, "sessionStorage", {
      configurable: true,
      get() {
        throw new Error("storage unavailable");
      },
    });
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      get() {
        throw new Error("storage unavailable");
      },
    });

    assert.doesNotThrow(() => {
      initCtaVisited({ doc: document, win: window });
      cta.click();
    });
    assert.equal(cta.dataset.visited, "false");
  });
});
