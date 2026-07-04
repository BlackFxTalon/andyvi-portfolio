import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { createDom, type DomFixture } from "../helpers/dom.ts";
import {
  calculateFrameTransform,
  fitFrame,
  getFrameLayout,
} from "../../src/scripts/fitFrame.ts";

let fixture: DomFixture | undefined;

afterEach(() => {
  fixture?.cleanup();
  fixture = undefined;
});

describe("fitFrame helpers", () => {
  it("calculates centered desktop transforms without mutating inputs", () => {
    const transform = calculateFrameTransform({
      viewportWidth: 1440,
      viewportHeight: 900,
      frameWidth: 1920,
      frameHeight: 1080,
    });

    assert.equal(transform.scale, 0.75);
    assert.equal(transform.x, 0);
    assert.equal(transform.y, 45);
    assert.equal(transform.css, "translate(0px, 45px) scale(0.75)");
  });

  it("uses natural flow below the cinematic breakpoint", () => {
    assert.deepEqual(
      getFrameLayout({
        viewportWidth: 819,
        viewportHeight: 1180,
      }),
      {
        mode: "flow",
        transform: null,
      },
    );
  });

  it("falls back from invalid dimensions to safe frame values", () => {
    const transform = calculateFrameTransform({
      viewportWidth: 0,
      viewportHeight: Number.NaN,
      frameWidth: -1,
      frameHeight: 0,
    });

    assert.deepEqual(transform, {
      scale: 1,
      x: 0,
      y: 0,
      css: "translate(0px, 0px) scale(1)",
    });
  });

  it("applies and clears frame/header transforms from the DOM adapter", () => {
    fixture = createDom(
      `
        <html>
          <body>
            <header class="topbar"></header>
            <main id="frame" data-frame-width="1920" data-frame-height="1080"></main>
          </body>
        </html>
      `,
      { viewport: { width: 1440, height: 900 } },
    );

    const frame = fixture.document.getElementById("frame") as HTMLElement;
    const header = fixture.document.querySelector(".topbar") as HTMLElement;

    const cinematic = fitFrame({ win: fixture.window });
    assert.equal(cinematic?.mode, "cinematic");
    assert.equal(fixture.document.documentElement.dataset.layout, "cinematic");
    assert.equal(frame.style.transform, "translate(0px, 45px) scale(0.75)");
    assert.equal(header.style.transform, "translate(0px, 45px) scale(0.75)");

    Object.defineProperty(fixture.window, "innerWidth", {
      configurable: true,
      value: 640,
    });

    const flow = fitFrame({ win: fixture.window });
    assert.equal(flow?.mode, "flow");
    assert.equal(fixture.document.documentElement.dataset.layout, "flow");
    assert.equal(frame.style.transform, "");
    assert.equal(header.style.transform, "");
  });
});
