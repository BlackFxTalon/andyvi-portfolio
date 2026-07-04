import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { createDom, type DomFixture } from "../helpers/dom.ts";
import {
  destroyWorksFilter,
  initWorksFilter,
} from "../../src/scripts/worksFilter.ts";

let fixture: DomFixture | undefined;

function setupWorksRoute(): DomFixture {
  fixture = createDom(`
    <section class="work-controls">
      <input id="projectSearch" data-works-search type="search" />
      <button type="button" data-category="all" class="is-active">All</button>
      <button type="button" data-category="web">Web</button>
      <button type="button" data-category="crm">CRM</button>
      <button type="button" id="filterToggle" aria-expanded="false" aria-controls="advancedFilters">Filters</button>
      <button type="button" id="sortBox" data-works-sort aria-label="Sort projects: newest first">Sort</button>
    </section>
    <div id="advancedFilters" data-works-advanced>
      <label><input type="checkbox" name="tech" value="Vue" data-tech-filter />Vue</label>
      <label><input type="checkbox" name="tech" value="Chart.js" data-tech-filter />Chart.js</label>
    </div>
    <div id="resultsStatus" data-works-status></div>
    <section id="projectsGrid" data-works-grid>
      <article class="project-card" data-title="AUTOAPP" data-type="E-commerce platform" data-category="web" data-status="production" data-year="2026" data-stack="Vue TypeScript Pinia" data-detail="Migration details">
        <h2 class="project-title">AUTOAPP</h2>
        <p class="project-desc">Vue storefront migration</p>
        <button class="card-open" type="button" aria-haspopup="dialog" data-action="open-case">Open AUTOAPP</button>
      </article>
      <article class="project-card" data-title="ERP4Seller" data-type="ERP CRM" data-category="crm" data-status="production" data-year="2025" data-stack="Vue Pinia Chart.js" data-detail="Dashboards and analytics">
        <h2 class="project-title">ERP4Seller</h2>
        <p class="project-desc">Marketplace seller dashboard</p>
        <button class="card-open" type="button" aria-haspopup="dialog" data-action="open-case">Open ERP</button>
      </article>
      <article class="project-card" data-title="Interno" data-type="Furniture store" data-category="web" data-status="production" data-year="2024" data-stack="Nuxt TypeScript Pinia" data-detail="Catalog details">
        <h2 class="project-title">Interno</h2>
        <p class="project-desc">Furniture catalog</p>
        <button class="card-open" type="button" aria-haspopup="dialog" data-action="open-case">Open Interno</button>
      </article>
      <div id="emptyState" data-works-empty hidden>No projects</div>
    </section>
    <div id="caseModal" data-case-modal role="dialog" aria-modal="true" aria-labelledby="caseTitle" hidden aria-hidden="true">
      <button id="caseClose" data-case-close type="button">Close</button>
      <h2 id="caseTitle" data-case-title></h2>
      <p id="caseType" data-case-type></p>
      <div id="caseMeta" data-case-meta></div>
      <p id="caseDetail" data-case-detail></p>
    </div>
  `);
  return fixture;
}

function visibleTitles(document: Document): string[] {
  return Array.from(document.querySelectorAll<HTMLElement>(".project-card"))
    .filter((card) => !card.hidden)
    .map((card) => card.dataset.title ?? "");
}

afterEach(() => {
  destroyWorksFilter();
  fixture?.cleanup();
  fixture = undefined;
});

describe("works filter route DOM", () => {
  it("filters by search, category, and tech while updating route status", () => {
    const { document, window } = setupWorksRoute();
    const search = document.getElementById("projectSearch") as HTMLInputElement;
    const crmButton = document.querySelector(
      "button[data-category='crm']",
    ) as HTMLButtonElement;
    const vueInput = document.querySelector(
      "input[value='Vue']",
    ) as HTMLInputElement;
    const emptyState = document.getElementById("emptyState") as HTMLElement;
    const status = document.getElementById("resultsStatus") as HTMLElement;

    initWorksFilter({ root: document });
    assert.deepEqual(visibleTitles(document), [
      "AUTOAPP",
      "ERP4Seller",
      "Interno",
    ]);

    search.value = "marketplace";
    search.dispatchEvent(new window.Event("input", { bubbles: true }));
    assert.deepEqual(visibleTitles(document), ["ERP4Seller"]);
    assert.equal(status.textContent, "Shown 1 project");

    crmButton.click();
    vueInput.checked = true;
    vueInput.dispatchEvent(new window.Event("change", { bubbles: true }));
    assert.deepEqual(visibleTitles(document), ["ERP4Seller"]);

    search.value = "no matching work";
    search.dispatchEvent(new window.Event("input", { bubbles: true }));
    assert.deepEqual(visibleTitles(document), []);
    assert.equal(emptyState.hidden, false);
    assert.equal(emptyState.classList.contains("is-visible"), true);
  });

  it("sorts cards in-place and keeps sort control state accessible", () => {
    const { document } = setupWorksRoute();
    const grid = document.getElementById("projectsGrid") as HTMLElement;
    const sortButton = document.getElementById("sortBox") as HTMLButtonElement;

    initWorksFilter({ root: document });
    sortButton.click();

    assert.deepEqual(
      Array.from(grid.querySelectorAll<HTMLElement>(".project-card")).map(
        (card) => card.dataset.title,
      ),
      ["Interno", "ERP4Seller", "AUTOAPP"],
    );
    assert.equal(sortButton.getAttribute("aria-pressed"), "true");
    assert.equal(sortButton.classList.contains("is-reversed"), true);
    assert.equal(sortButton.getAttribute("aria-label"), "Sort projects: oldest first");
  });

  it("opens the case modal, traps Escape, and restores focus to the opener", () => {
    const { document, window } = setupWorksRoute();
    const opener = document.querySelector(
      ".project-card[data-title='AUTOAPP'] .card-open",
    ) as HTMLButtonElement;
    const modal = document.getElementById("caseModal") as HTMLElement;
    const closeButton = document.getElementById("caseClose") as HTMLButtonElement;

    initWorksFilter({ root: document });
    opener.focus();
    opener.click();

    assert.equal(modal.hidden, false);
    assert.equal(modal.classList.contains("is-open"), true);
    assert.equal(document.getElementById("caseTitle")?.textContent, "AUTOAPP");
    assert.deepEqual(
      Array.from(document.querySelectorAll("#caseMeta span")).map(
        (node) => node.textContent,
      ),
      ["2026", "Web app", "Vue", "TypeScript", "Pinia"],
    );
    assert.equal(document.activeElement, closeButton);

    document.dispatchEvent(
      new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );

    assert.equal(modal.hidden, true);
    assert.equal(modal.getAttribute("aria-hidden"), "true");
    assert.equal(document.activeElement, opener);
  });

  it("re-initializes without stacking duplicate route listeners", () => {
    const { document } = setupWorksRoute();
    const sortButton = document.getElementById("sortBox") as HTMLButtonElement;

    initWorksFilter({ root: document });
    initWorksFilter({ root: document });
    sortButton.click();

    assert.equal(sortButton.getAttribute("aria-pressed"), "true");
    sortButton.click();
    assert.equal(sortButton.getAttribute("aria-pressed"), "false");
  });
});
