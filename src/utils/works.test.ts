import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  closeWorkModal,
  createWorkModalState,
  createWorksListState,
  filterWorks,
  getWorksEmptyState,
  sortWorks,
  toggleSortDirection,
  toggleTechFilter,
  type WorkItem,
} from './works.ts';

const worksFixture = [
  {
    slug: 'autoapp',
    title: 'AUTOAPP',
    summary: 'Migration of an e-commerce platform to Vue 3 and TypeScript.',
    type: 'E-commerce platform',
    category: 'web',
    year: 2026,
    status: 'production',
    stack: ['Vue', 'TypeScript', 'Pinia'],
    details: 'Catalog migration and performance improvements.',
  },
  {
    slug: 'erp4seller',
    title: 'ERP4Seller',
    summary: 'ERP and CRM dashboards for marketplace sellers.',
    type: 'ERP/CRM for sellers',
    category: 'crm',
    year: 2025,
    status: 'production',
    stack: ['Vue', 'Pinia', 'Chart.js'],
    details: 'Dashboards, inventory, expenses and analytics.',
  },
  {
    slug: 'interno',
    title: 'Interno',
    summary: 'Furniture store catalog with advanced filtering.',
    type: 'Furniture store',
    category: 'shop',
    year: 2024,
    status: 'production',
    stack: ['Nuxt', 'TypeScript', 'Pinia'],
    details: 'Catalog, product cards, favorites and quick navigation.',
  },
] as const satisfies readonly WorkItem[];

describe('works utilities', () => {
  it('searches semantic work data case-insensitively', () => {
    assert.deepEqual(filterWorks(worksFixture, { query: 'marketplace' }).map((work) => work.slug), ['erp4seller']);
    assert.deepEqual(filterWorks(worksFixture, { query: 'typescript' }).map((work) => work.slug), ['autoapp', 'interno']);
  });

  it('applies category and tech filters together', () => {
    assert.deepEqual(filterWorks(worksFixture, { category: 'crm', tech: ['Chart.js'] }).map((work) => work.slug), ['erp4seller']);
    assert.deepEqual(filterWorks(worksFixture, { category: 'shop', tech: ['Vue'] }), []);
  });

  it('sorts by year in both directions without mutating input', () => {
    assert.deepEqual(sortWorks(worksFixture, 'asc').map((work) => work.year), [2024, 2025, 2026]);
    assert.deepEqual(sortWorks(worksFixture, 'desc').map((work) => work.year), [2026, 2025, 2024]);
    assert.deepEqual(worksFixture.map((work) => work.year), [2026, 2025, 2024]);
  });

  it('builds list state with empty state data', () => {
    const state = createWorksListState(worksFixture, { query: 'missing', tech: ['Nuxt'] }, 'desc');

    assert.deepEqual(state.items, []);
    assert.equal(state.emptyState.kind, 'no-results');
    assert.equal(state.emptyState.hasActiveFilters, true);
  });

  it('separates no-data empty state from no-results', () => {
    assert.equal(getWorksEmptyState(0, 0).kind, 'no-data');
    assert.equal(getWorksEmptyState(3, 0, { category: 'crm' }).kind, 'no-results');
  });

  it('keeps control helpers pure', () => {
    assert.equal(toggleSortDirection('desc'), 'asc');
    assert.deepEqual(toggleTechFilter(['Vue'], 'Vue'), []);
    assert.deepEqual(toggleTechFilter(['Vue'], 'TypeScript'), ['Vue', 'TypeScript']);
  });

  it('creates modal-facing state from semantic data', () => {
    const state = createWorkModalState(worksFixture, 'autoapp', 'open-autoapp');

    assert.equal(state.isOpen, true);
    assert.equal(state.selectedWork?.title, 'AUTOAPP');
    assert.deepEqual(state.meta, ['2026', 'Web app', 'Vue', 'TypeScript', 'Pinia']);
    assert.deepEqual(closeWorkModal(state), {
      isOpen: false,
      selectedSlug: null,
      selectedWork: null,
      openerId: 'open-autoapp',
      meta: [],
    });
  });
});
