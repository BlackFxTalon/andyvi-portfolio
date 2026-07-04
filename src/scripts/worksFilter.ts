type SortDirection = 'asc' | 'desc';

type WorksFilterOptions = {
  root?: ParentNode;
};

const DEFAULT_CATEGORY = 'all';
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

let activeController: AbortController | undefined;
let lifecycleController: AbortController | undefined;

function getRoot(options?: WorksFilterOptions): ParentNode {
  return options?.root ?? document;
}

function normalize(value: unknown): string {
  return String(value ?? '').toLowerCase().trim();
}

function getCardYear(card: HTMLElement): number {
  const rawYear = card.dataset.year ?? card.dataset.date ?? '';
  const year = Number(rawYear);
  return Number.isFinite(year) ? year : 0;
}

function getCardStack(card: HTMLElement): string {
  return normalize(card.dataset.stack ?? card.textContent ?? '');
}

function getSearchHaystack(card: HTMLElement): string {
  return normalize([
    card.dataset.title,
    card.dataset.type,
    card.dataset.detail,
    card.dataset.category,
    card.dataset.status,
    card.dataset.stack,
    card.textContent,
  ].join(' '));
}

function getCategoryLabel(category: string | undefined): string {
  if (category === 'shop') return 'E-commerce';
  if (category === 'crm') return 'CRM / ERP';
  if (category === 'saas') return 'SaaS';
  return 'Web app';
}

function getSelectedTechs(techInputs: HTMLInputElement[]): string[] {
  return techInputs
    .filter((input) => input.checked)
    .map((input) => input.value)
    .filter(Boolean);
}

function matchesTechs(card: HTMLElement, selectedTechs: string[]): boolean {
  if (!selectedTechs.length) return true;
  const stack = getCardStack(card);
  return selectedTechs.every((tech) => stack.includes(normalize(tech)));
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    .filter((element) => !element.hidden && element.getAttribute('aria-hidden') !== 'true');
}

function getCardOpenControls(card: HTMLElement): HTMLElement[] {
  return Array.from(card.querySelectorAll<HTMLElement>([
    '.card-open',
    '[data-action="open-case"]',
    '[data-action="open-project-modal"]',
    '[data-modal-open]',
    '[aria-haspopup="dialog"]',
  ].join(',')));
}

function shouldOpenModal(control: HTMLElement): boolean {
  if (control instanceof HTMLButtonElement) return true;
  if (!(control instanceof HTMLAnchorElement)) return true;
  const href = control.getAttribute('href');
  return !href || href === '#' || control.getAttribute('aria-haspopup') === 'dialog' || control.hasAttribute('data-modal-open');
}

function setSiblingsInert(modal: HTMLElement, inert: boolean): void {
  const parent = modal.parentElement;
  if (!parent) return;

  Array.from(parent.children).forEach((child) => {
    if (child === modal || !(child instanceof HTMLElement)) return;
    if (inert) {
      child.setAttribute('aria-hidden', 'true');
      (child as HTMLElement & { inert?: boolean }).inert = true;
      return;
    }
    child.removeAttribute('aria-hidden');
    (child as HTMLElement & { inert?: boolean }).inert = false;
  });
}

export function destroyWorksFilter(): void {
  activeController?.abort();
  activeController = undefined;
}

export function initWorksFilter(options?: WorksFilterOptions): void {
  destroyWorksFilter();

  const root = getRoot(options);
  const controller = new AbortController();
  const { signal } = controller;
  activeController = controller;

  const cards = Array.from(root.querySelectorAll<HTMLElement>('.project-card'));
  const grid = root.querySelector<HTMLElement>('#projectsGrid, [data-works-grid]');
  const search = root.querySelector<HTMLInputElement>('#projectSearch, [data-works-search], input[type="search"]');
  const categoryButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('button[data-category], [data-filter-category]'));
  const techInputs = Array.from(root.querySelectorAll<HTMLInputElement>('[data-tech-filter], .tag-check input[type="checkbox"], input[name="tech"]'));
  const sortControl = root.querySelector<HTMLButtonElement | HTMLSelectElement>('#sortBox, [data-works-sort], .sort-box');
  const emptyState = root.querySelector<HTMLElement>('#emptyState, [data-works-empty]');
  const status = root.querySelector<HTMLElement>('#resultsStatus, [data-works-status]');
  const resetButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-action="reset-works-filters"], [data-works-reset]'));
  const filterToggle = root.querySelector<HTMLButtonElement>('#filterToggle, [data-works-filter-toggle]');
  const advancedFilters = root.querySelector<HTMLElement>('#advancedFilters, [data-works-advanced]');
  const modal = root.querySelector<HTMLElement>('#caseModal, [data-case-modal], [role="dialog"][aria-modal="true"]');
  const caseTitle = root.querySelector<HTMLElement>('#caseTitle, [data-case-title]');
  const caseType = root.querySelector<HTMLElement>('#caseType, [data-case-type]');
  const caseMeta = root.querySelector<HTMLElement>('#caseMeta, [data-case-meta]');
  const caseDetail = root.querySelector<HTMLElement>('#caseDetail, [data-case-detail]');
  const caseClose = root.querySelector<HTMLButtonElement>('#caseClose, [data-case-close]');

  let activeCategory = categoryButtons.find((button) => button.classList.contains('is-active'))?.dataset.category ?? DEFAULT_CATEGORY;
  let sortDirection: SortDirection = sortControl instanceof HTMLSelectElement
    ? (sortControl.value === 'asc' || sortControl.value === 'old' ? 'asc' : 'desc')
    : 'desc';
  let previouslyFocused: HTMLElement | null = null;

  function updateStatus(visibleCount: number): void {
    if (status) {
      const suffix = visibleCount === 1 ? 'project' : 'projects';
      status.textContent = `Shown ${visibleCount} ${suffix}`;
    }
    if (emptyState) {
      const isEmpty = visibleCount === 0;
      emptyState.hidden = !isEmpty;
      emptyState.classList.toggle('is-visible', isEmpty);
    }
  }

  function applyFilters(): void {
    const query = normalize(search?.value);
    const selectedTechs = getSelectedTechs(techInputs);
    let visibleCount = 0;

    cards.forEach((card) => {
      const category = card.dataset.category;
      const categoryMatches = activeCategory === DEFAULT_CATEGORY || category === activeCategory;
      const queryMatches = !query || getSearchHaystack(card).includes(query);
      const techMatches = matchesTechs(card, selectedTechs);
      const isVisible = categoryMatches && queryMatches && techMatches;

      card.hidden = !isVisible;
      card.classList.toggle('is-hidden', !isVisible);
      if (isVisible) visibleCount += 1;
    });

    updateStatus(visibleCount);
  }

  function sortCards(): void {
    if (!grid) {
      applyFilters();
      return;
    }

    cards
      .slice()
      .sort((a, b) => {
        const delta = getCardYear(a) - getCardYear(b);
        return sortDirection === 'asc' ? delta : -delta;
      })
      .forEach((card) => grid.insertBefore(card, emptyState ?? null));

    applyFilters();
  }

  function updateSortState(): void {
    const isAsc = sortDirection === 'asc';
    sortControl?.classList.toggle('is-reversed', isAsc);
    sortControl?.setAttribute('aria-label', isAsc ? 'Sort projects: oldest first' : 'Sort projects: newest first');
    if (sortControl instanceof HTMLButtonElement) {
      sortControl.setAttribute('aria-pressed', String(isAsc));
    }
  }

  function resetFilters(): void {
    activeCategory = DEFAULT_CATEGORY;
    categoryButtons.forEach((button) => {
      const isActive = (button.dataset.category ?? DEFAULT_CATEGORY) === DEFAULT_CATEGORY;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-pressed', String(isActive));
    });
    techInputs.forEach((input) => {
      input.checked = false;
    });
    if (search) search.value = '';
    applyFilters();
    search?.focus();
  }

  function closeModal(): void {
    if (!modal?.classList.contains('is-open')) return;
    modal.classList.remove('is-open');
    modal.hidden = true;
    modal.setAttribute('aria-hidden', 'true');
    setSiblingsInert(modal, false);

    if (previouslyFocused?.isConnected) {
      previouslyFocused.focus();
    }
    previouslyFocused = null;
  }

  function openModal(card: HTMLElement, opener: HTMLElement): void {
    if (!modal) return;

    previouslyFocused = opener;
    const tags = (card.dataset.stack ?? '').split(/\s+/).filter(Boolean);
    const title = card.dataset.title ?? card.querySelector<HTMLElement>('.project-title')?.textContent?.trim() ?? '';

    if (caseTitle) caseTitle.textContent = title;
    if (caseType) caseType.textContent = card.dataset.type ?? '';
    if (caseDetail) caseDetail.textContent = card.dataset.detail ?? card.querySelector<HTMLElement>('.project-desc')?.textContent?.trim() ?? '';
    if (caseMeta) {
      caseMeta.replaceChildren();
      const metaItems = [
        card.dataset.year ?? card.dataset.date,
        getCategoryLabel(card.dataset.category),
        ...tags,
      ].filter((item): item is string => Boolean(item)).slice(0, 6);

      metaItems.forEach((item) => {
        const node = document.createElement('span');
        node.textContent = item;
        caseMeta.appendChild(node);
      });
    }

    if (!modal.getAttribute('role')) modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    if (caseTitle?.id) modal.setAttribute('aria-labelledby', caseTitle.id);
    else if (!modal.getAttribute('aria-label')) modal.setAttribute('aria-label', title || 'Project details');

    modal.hidden = false;
    modal.removeAttribute('aria-hidden');
    modal.classList.add('is-open');
    setSiblingsInert(modal, true);

    const firstFocusable = getFocusableElements(modal)[0] ?? modal;
    if (!modal.hasAttribute('tabindex')) modal.setAttribute('tabindex', '-1');
    firstFocusable.focus();
  }

  function trapModalFocus(event: KeyboardEvent): void {
    if (!modal?.classList.contains('is-open')) return;

    if (event.key === 'Escape') {
      event.preventDefault();
      closeModal();
      return;
    }

    if (event.key !== 'Tab') return;

    const focusable = getFocusableElements(modal);
    if (!focusable.length) {
      event.preventDefault();
      modal.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable.at(-1);
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
      return;
    }
    if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!cards.length) return;

  categoryButtons.forEach((button) => {
    const isActive = (button.dataset.category ?? DEFAULT_CATEGORY) === activeCategory;
    button.setAttribute('aria-pressed', String(isActive));
    button.addEventListener('click', () => {
      activeCategory = button.dataset.category ?? DEFAULT_CATEGORY;
      categoryButtons.forEach((item) => {
        const itemActive = item === button;
        item.classList.toggle('is-active', itemActive);
        item.setAttribute('aria-pressed', String(itemActive));
      });
      applyFilters();
    }, { signal });
  });

  search?.addEventListener('input', applyFilters, { signal });
  techInputs.forEach((input) => input.addEventListener('change', applyFilters, { signal }));
  resetButtons.forEach((button) => button.addEventListener('click', resetFilters, { signal }));

  sortControl?.addEventListener('click', () => {
    if (sortControl instanceof HTMLSelectElement) return;
    sortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
    updateSortState();
    sortCards();
  }, { signal });

  if (sortControl instanceof HTMLSelectElement) {
    sortControl.addEventListener('change', () => {
      sortDirection = sortControl.value === 'asc' || sortControl.value === 'old' ? 'asc' : 'desc';
      updateSortState();
      sortCards();
    }, { signal });
  }

  filterToggle?.addEventListener('click', () => {
    if (!advancedFilters) return;
    const isOpen = advancedFilters.classList.toggle('is-open');
    filterToggle.setAttribute('aria-expanded', String(isOpen));
  }, { signal });

  document.addEventListener('click', (event) => {
    if (!advancedFilters?.classList.contains('is-open')) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (filterToggle?.contains(target) || advancedFilters.contains(target)) return;
    advancedFilters.classList.remove('is-open');
    filterToggle?.setAttribute('aria-expanded', 'false');
  }, { signal });

  cards.forEach((card) => {
    getCardOpenControls(card).forEach((control) => {
      control.addEventListener('click', (event) => {
        if (!shouldOpenModal(control)) return;
        event.preventDefault();
        openModal(card, control);
      }, { signal });
    });
  });

  caseClose?.addEventListener('click', closeModal, { signal });
  modal?.addEventListener('click', (event) => {
    if (event.target === modal) closeModal();
  }, { signal });
  document.addEventListener('keydown', trapModalFocus, { signal });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    advancedFilters?.classList.remove('is-open');
    filterToggle?.setAttribute('aria-expanded', 'false');
  }, { signal });

  updateSortState();
  sortCards();
}

export function bindWorksFilterLifecycle(): void {
  lifecycleController?.abort();
  lifecycleController = new AbortController();
  const { signal } = lifecycleController;
  const init = () => initWorksFilter();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true, signal });
  } else {
    init();
  }

  document.addEventListener('astro:page-load', init, { signal });
  document.addEventListener('astro:before-swap', destroyWorksFilter, { signal });
}
