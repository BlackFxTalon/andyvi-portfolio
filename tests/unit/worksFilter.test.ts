import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import {
  bindWorksFilterLifecycle,
  destroyWorksFilter,
  initWorksFilter,
} from "../../src/scripts/worksFilter.ts";
import { change, click, createTestDom, input, keydown, type TestDom } from "../helpers/jsdom.ts";

let currentDom: TestDom | undefined;

function setupWorksDom(): Document {
  currentDom = createTestDom(`
    <section id="worksShell">
      <button type="button" data-category="all" class="is-active">All</button>
      <button type="button" data-category="crm">CRM</button>
      <button type="button" data-category="shop">Shop</button>
      <input id="projectSearch" type="search" />
      <label><input data-tech-filter type="checkbox" value="Vue" />Vue</label>
      <button id="sortBox" type="button">Sort</button>
      <button type="button" data-action="reset-works-filters">Reset</button>
      <button id="filterToggle" type="button" aria-expanded="false">Filters</button>
      <div id="advancedFilters">Advanced filters</div>
      <p id="resultsStatus"></p>
      <div id="projectsGrid" data-works-grid>
        <article class="project-card" id="erp"
          data-title="ERP4Seller"
          data-type="ERP"
          data-category="crm"
          data-status="production"
          data-year="2025"
          data-stack="Vue Pinia"
          data-detail="Marketplace seller dashboards">
          <h2 class="project-title">ERP4Seller</h2>
          <p class="project-desc">Dashboards for marketplace sellers.</p>
          <button class="card-open" type="button" data-action="open-case" aria-haspopup="dialog">Open ERP</button>
        </article>
        <article class="project-card" id="interno"
          data-title="Interno"
          data-type="Shop"
          data-category="shop"
          data-status="production"
          data-year="2024"
          data-stack="Nuxt Pinia"
          data-detail="Furniture catalog">
          <h2 class="project-title">Interno</h2>
          <p class="project-desc">Furniture catalog.</p>
          <button class="card-open" type="button" data-action="open-case" aria-haspopup="dialog">Open Interno</button>
        </article>
        <div id="emptyState" data-works-empty hidden>No results</div>
      </div>
      <div id="caseModal" data-case-modal role="dialog" aria-modal="true" aria-labelledby="caseTitle" hidden>
        <button id="caseClose" type="button" data-case-close>Close</button>
        <h2 id="caseTitle" data-case-title></h2>
        <p id="caseType" data-case-type></p>
        <div id="caseMeta" data-case-meta></div>
        <p id="caseDetail" data-case-detail></p>
      </div>
    </section>
  `);
  return currentDom.document;
}

function visibleCards(doc: Document): string[] {
  return Array.from(doc.querySelectorAll<HTMLElement>(".project-card"))
    .filter((card) => !card.hidden)
    .map((card) => card.id);
}

function gridCardOrder(doc: Document): string[] {
  return Array.from(doc.querySelectorAll<HTMLElement>("#projectsGrid .project-card"))
    .map((card) => card.id);
}

afterEach(() => {
  destroyWorksFilter();
  currentDom?.cleanup();
  currentDom = undefined;
});

describe("works filter JSDOM behavior", () => {
  it("filters, sorts, reports empty state, and resets controls", () => {
    const doc = setupWorksDom();
    const crmButton = doc.querySelector<HTMLButtonElement>('[data-category="crm"]');
    const search = doc.querySelector<HTMLInputElement>("#projectSearch");
    const techVue = doc.querySelector<HTMLInputElement>("[data-tech-filter]");
    const sort = doc.querySelector<HTMLButtonElement>("#sortBox");
    const reset = doc.querySelector<HTMLButtonElement>("[data-action='reset-works-filters']");
    const emptyState = doc.querySelector<HTMLElement>("#emptyState");
    const status = doc.querySelector<HTMLElement>("#resultsStatus");
    assert.ok(crmButton);
    assert.ok(search);
    assert.ok(techVue);
    assert.ok(sort);
    assert.ok(reset);
    assert.ok(emptyState);
    assert.ok(status);

    initWorksFilter();
    assert.deepEqual(gridCardOrder(doc), ["erp", "interno"]);
    assert.equal(status.textContent, "Shown 2 projects");

    click(sort);
    assert.deepEqual(gridCardOrder(doc), ["interno", "erp"]);
    assert.equal(sort.getAttribute("aria-pressed"), "true");

    click(crmButton);
    assert.deepEqual(visibleCards(doc), ["erp"]);
    assert.equal(crmButton.getAttribute("aria-pressed"), "true");

    techVue.checked = true;
    change(techVue);
    assert.deepEqual(visibleCards(doc), ["erp"]);

    search.value = "missing";
    input(search);
    assert.deepEqual(visibleCards(doc), []);
    assert.equal(emptyState.hidden, false);
    assert.equal(emptyState.classList.contains("is-visible"), true);
    assert.equal(status.textContent, "Shown 0 projects");

    click(reset);
    assert.deepEqual(visibleCards(doc), ["interno", "erp"]);
    assert.equal(search.value, "");
    assert.equal(techVue.checked, false);
    assert.equal(doc.activeElement, search);
  });

  it("opens a case modal, traps focus, restores focus, and hides siblings", () => {
    const doc = setupWorksDom();
    const opener = doc.querySelector<HTMLButtonElement>("#erp .card-open");
    const modal = doc.querySelector<HTMLElement>("#caseModal");
    const close = doc.querySelector<HTMLButtonElement>("#caseClose");
    const title = doc.querySelector<HTMLElement>("#caseTitle");
    const type = doc.querySelector<HTMLElement>("#caseType");
    const detail = doc.querySelector<HTMLElement>("#caseDetail");
    const shell = doc.querySelector<HTMLElement>("#worksShell");
    assert.ok(opener);
    assert.ok(modal);
    assert.ok(close);
    assert.ok(title);
    assert.ok(type);
    assert.ok(detail);
    assert.ok(shell);

    initWorksFilter();
    click(opener);

    assert.equal(modal.hidden, false);
    assert.equal(modal.classList.contains("is-open"), true);
    assert.equal(modal.getAttribute("aria-hidden"), null);
    assert.equal(title.textContent, "ERP4Seller");
    assert.equal(type.textContent, "ERP");
    assert.equal(detail.textContent, "Marketplace seller dashboards");
    assert.equal(doc.activeElement, close);
    assert.equal(shell.children[0]?.getAttribute("aria-hidden"), "true");
    assert.equal((shell.children[0] as HTMLElement & { inert?: boolean }).inert, true);

    keydown("Tab", { shiftKey: true });
    assert.equal(doc.activeElement, close);

    keydown("Escape");
    assert.equal(modal.hidden, true);
    assert.equal(modal.classList.contains("is-open"), false);
    assert.equal(doc.activeElement, opener);
    assert.equal(shell.children[0]?.getAttribute("aria-hidden"), null);
    assert.equal((shell.children[0] as HTMLElement & { inert?: boolean }).inert, false);
  });

  it("keeps route lifecycle init idempotent across astro:page-load", () => {
    const doc = setupWorksDom();
    const sort = doc.querySelector<HTMLButtonElement>("#sortBox");
    assert.ok(sort);

    bindWorksFilterLifecycle();
    doc.dispatchEvent(new Event("astro:page-load"));
    click(sort);

    assert.deepEqual(gridCardOrder(doc), ["interno", "erp"]);
    assert.equal(sort.getAttribute("aria-pressed"), "true");

    doc.dispatchEvent(new Event("astro:before-swap"));
    click(sort);
    assert.deepEqual(gridCardOrder(doc), ["interno", "erp"]);
  });
});
