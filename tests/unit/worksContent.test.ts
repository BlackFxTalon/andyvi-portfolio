import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildWorkSearchIndex,
  createWorkModalState,
  createWorksListState,
  getWorkModalMeta,
  filterWorks,
  normalizeSearchText,
  sortWorks,
  toggleTechFilter,
  type WorkItem,
} from "../../src/utils/works.ts";

const worksFixture = [
  {
    slug: "autoapp",
    title: "AUTOAPP",
    summary: "Migration of an e-commerce platform to Vue 3 and TypeScript.",
    type: "E-commerce platform",
    category: "web",
    year: 2026,
    status: "production",
    stack: ["Vue", "TypeScript", "Pinia"],
    details: "Catalog migration and performance improvements.",
    order: 2,
  },
  {
    slug: "erp4seller",
    title: "ERP4Seller",
    summary: "ERP and CRM dashboards for marketplace sellers.",
    type: "ERP/CRM for sellers",
    category: "crm",
    year: 2025,
    status: "production",
    stack: ["Vue", "Pinia", "Chart.js"],
    details: "Dashboards, inventory, expenses and analytics.",
    order: 1,
  },
  {
    slug: "interno",
    title: "Interno",
    summary: "Furniture store catalog with advanced filtering.",
    type: "Furniture store",
    category: "shop",
    year: 2024,
    status: "production",
    stack: ["Nuxt", "TypeScript", "Pinia"],
    details: "Catalog, product cards, favorites and quick navigation.",
    order: 3,
  },
] as const satisfies readonly WorkItem[];

describe("works content helpers", () => {
  it("does not invent a date or technology for a project with unconfirmed details", () => {
    const work: WorkItem = {
      slug: "unknown-details",
      title: "Project",
      summary: "Project details have not been confirmed yet.",
      type: "Project",
      category: "web",
      stack: [],
    };
    assert.deepEqual(getWorkModalMeta(work), ["Web app"]);
    assert.equal(sortWorks([work])[0], work);
  });

  it("normalizes search text and includes semantic content in the index", () => {
    assert.equal(normalizeSearchText("  CRM\tDASHBOARDS  "), "crm dashboards");
    assert.match(buildWorkSearchIndex(worksFixture[1]), /marketplace sellers/);
    assert.match(buildWorkSearchIndex(worksFixture[1]), /chart\.js/);
  });

  it("combines case-insensitive query, category, and exact tech filters", () => {
    assert.deepEqual(
      filterWorks(worksFixture, {
        query: "typescript",
        category: "shop",
        tech: ["Nuxt"],
      }).map((work) => work.slug),
      ["interno"],
    );
    assert.deepEqual(
      filterWorks(worksFixture, { category: "shop", tech: ["Vue"] }),
      [],
    );
  });

  it("sorts copies and builds modal/list state for route rendering", () => {
    const sorted = sortWorks(worksFixture, "asc");
    const state = createWorksListState(worksFixture, { query: "missing" });
    const modal = createWorkModalState(worksFixture, "autoapp", "open-autoapp");

    assert.deepEqual(sorted.map((work) => work.slug), [
      "interno",
      "erp4seller",
      "autoapp",
    ]);
    assert.deepEqual(worksFixture.map((work) => work.slug), [
      "autoapp",
      "erp4seller",
      "interno",
    ]);
    assert.equal(state.emptyState.kind, "no-results");
    assert.deepEqual(modal.meta, [
      "2026",
      "Web app",
      "Vue",
      "TypeScript",
      "Pinia",
    ]);
  });

  it("toggles tech filters by normalized keys without corrupting labels", () => {
    assert.deepEqual(toggleTechFilter(["Vue"], "vue"), []);
    assert.deepEqual(toggleTechFilter(["Vue"], "Chart.js"), ["Vue", "Chart.js"]);
    assert.deepEqual(toggleTechFilter(["Vue"], "   "), ["Vue"]);
  });
});
