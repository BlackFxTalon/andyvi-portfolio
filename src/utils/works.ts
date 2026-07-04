export const WORK_CATEGORIES = ['web', 'shop', 'crm', 'saas'] as const;
export const WORK_SORT_DIRECTIONS = ['asc', 'desc'] as const;

export type WorkCategory = (typeof WORK_CATEGORIES)[number];
export type WorkSortDirection = (typeof WORK_SORT_DIRECTIONS)[number];
export type WorkCategoryFilter = WorkCategory | 'all';
export type EmptyStateKind = 'no-data' | 'no-results' | 'has-results';

export interface WorkLink {
  readonly label: string;
  readonly href: string;
}

export interface WorkItem {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly type: string;
  readonly category: WorkCategory;
  readonly year: number;
  readonly status: 'production' | 'development' | 'archived';
  readonly stack: readonly string[];
  readonly details?: string;
  readonly links?: readonly WorkLink[];
  readonly order?: number;
  readonly featured?: boolean;
}

export interface WorkFilters {
  readonly query?: string;
  readonly category?: WorkCategoryFilter;
  readonly tech?: readonly string[];
}

export interface WorkListState<TWork extends WorkItem = WorkItem> {
  readonly items: readonly TWork[];
  readonly totalCount: number;
  readonly visibleCount: number;
  readonly filters: Required<WorkFilters>;
  readonly sortDirection: WorkSortDirection;
  readonly emptyState: WorkEmptyState;
}

export interface WorkEmptyState {
  readonly kind: EmptyStateKind;
  readonly isVisible: boolean;
  readonly hasActiveFilters: boolean;
  readonly message: string;
}

export interface WorkModalState<TWork extends WorkItem = WorkItem> {
  readonly isOpen: boolean;
  readonly selectedSlug: string | null;
  readonly selectedWork: TWork | null;
  readonly openerId: string | null;
  readonly meta: readonly string[];
}

const DEFAULT_FILTERS: Required<WorkFilters> = {
  query: '',
  category: 'all',
  tech: [],
};

export function normalizeSearchText(value: unknown): string {
  return String(value ?? '')
    .normalize('NFKC')
    .toLocaleLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

export function normalizeTechKey(value: unknown): string {
  return normalizeSearchText(value).replace(/\s+/g, '-');
}

export function normalizeWorkFilters(filters: WorkFilters = {}): Required<WorkFilters> {
  return {
    query: filters.query ?? DEFAULT_FILTERS.query,
    category: filters.category ?? DEFAULT_FILTERS.category,
    tech: [...(filters.tech ?? DEFAULT_FILTERS.tech)].filter((tech) => normalizeSearchText(tech)),
  };
}

export function buildWorkSearchIndex(work: WorkItem): string {
  return normalizeSearchText([
    work.title,
    work.summary,
    work.type,
    work.category,
    work.status,
    work.year,
    work.details,
    ...work.stack,
  ].join(' '));
}

export function workMatchesQuery(work: WorkItem, query = ''): boolean {
  const normalizedQuery = normalizeSearchText(query);
  return normalizedQuery === '' || buildWorkSearchIndex(work).includes(normalizedQuery);
}

export function workMatchesCategory(work: WorkItem, category: WorkCategoryFilter = 'all'): boolean {
  return category === 'all' || work.category === category;
}

export function workMatchesTech(work: WorkItem, selectedTech: readonly string[] = []): boolean {
  const selected = selectedTech.map(normalizeTechKey).filter(Boolean);
  if (selected.length === 0) return true;

  const stack = new Set(work.stack.map(normalizeTechKey));
  return selected.every((tech) => stack.has(tech));
}

export function workMatchesFilters(work: WorkItem, filters: WorkFilters = {}): boolean {
  const normalized = normalizeWorkFilters(filters);
  return (
    workMatchesQuery(work, normalized.query)
    && workMatchesCategory(work, normalized.category)
    && workMatchesTech(work, normalized.tech)
  );
}

export function filterWorks<TWork extends WorkItem>(
  works: readonly TWork[],
  filters: WorkFilters = {},
): TWork[] {
  return works.filter((work) => workMatchesFilters(work, filters));
}

export function sortWorks<TWork extends WorkItem>(
  works: readonly TWork[],
  direction: WorkSortDirection = 'desc',
): TWork[] {
  const multiplier = direction === 'asc' ? 1 : -1;

  return [...works].sort((left, right) => {
    const yearDelta = (left.year - right.year) * multiplier;
    if (yearDelta !== 0) return yearDelta;

    const orderDelta = ((left.order ?? 0) - (right.order ?? 0)) * multiplier;
    if (orderDelta !== 0) return orderDelta;

    return left.title.localeCompare(right.title);
  });
}

export function getFilteredWorks<TWork extends WorkItem>(
  works: readonly TWork[],
  filters: WorkFilters = {},
  sortDirection: WorkSortDirection = 'desc',
): TWork[] {
  return sortWorks(filterWorks(works, filters), sortDirection);
}

export function hasActiveWorkFilters(filters: WorkFilters = {}): boolean {
  const normalized = normalizeWorkFilters(filters);
  return (
    normalizeSearchText(normalized.query) !== ''
    || normalized.category !== 'all'
    || normalized.tech.length > 0
  );
}

export function getWorksEmptyState(
  totalCount: number,
  visibleCount: number,
  filters: WorkFilters = {},
): WorkEmptyState {
  if (totalCount === 0) {
    return {
      kind: 'no-data',
      isVisible: true,
      hasActiveFilters: false,
      message: 'Projects are not available yet.',
    };
  }

  const hasActiveFilters = hasActiveWorkFilters(filters);
  if (visibleCount === 0) {
    return {
      kind: 'no-results',
      isVisible: true,
      hasActiveFilters,
      message: hasActiveFilters
        ? 'No projects match the selected filters.'
        : 'No projects are visible.',
    };
  }

  return {
    kind: 'has-results',
    isVisible: false,
    hasActiveFilters,
    message: '',
  };
}

export function createWorksListState<TWork extends WorkItem>(
  works: readonly TWork[],
  filters: WorkFilters = {},
  sortDirection: WorkSortDirection = 'desc',
): WorkListState<TWork> {
  const normalizedFilters = normalizeWorkFilters(filters);
  const items = getFilteredWorks(works, normalizedFilters, sortDirection);

  return {
    items,
    totalCount: works.length,
    visibleCount: items.length,
    filters: normalizedFilters,
    sortDirection,
    emptyState: getWorksEmptyState(works.length, items.length, normalizedFilters),
  };
}

export function toggleTechFilter(selectedTech: readonly string[], tech: string): string[] {
  const normalizedTarget = normalizeTechKey(tech);
  if (!normalizedTarget) return [...selectedTech];

  const next = selectedTech.filter((item) => normalizeTechKey(item) !== normalizedTarget);
  return next.length === selectedTech.length ? [...selectedTech, tech] : next;
}

export function toggleSortDirection(direction: WorkSortDirection): WorkSortDirection {
  return direction === 'desc' ? 'asc' : 'desc';
}

export function createClosedWorkModalState<TWork extends WorkItem = WorkItem>(): WorkModalState<TWork> {
  return {
    isOpen: false,
    selectedSlug: null,
    selectedWork: null,
    openerId: null,
    meta: [],
  };
}

export function createWorkModalState<TWork extends WorkItem>(
  works: readonly TWork[],
  slug: string,
  openerId: string | null = null,
): WorkModalState<TWork> {
  const selectedWork = works.find((work) => work.slug === slug) ?? null;
  if (!selectedWork) return createClosedWorkModalState<TWork>();

  return {
    isOpen: true,
    selectedSlug: selectedWork.slug,
    selectedWork,
    openerId,
    meta: getWorkModalMeta(selectedWork),
  };
}

export function closeWorkModal<TWork extends WorkItem>(
  state: WorkModalState<TWork>,
): WorkModalState<TWork> {
  return {
    ...createClosedWorkModalState<TWork>(),
    openerId: state.openerId,
  };
}

export function getWorkModalMeta(work: WorkItem): string[] {
  return [
    String(work.year),
    getWorkCategoryLabel(work.category),
    ...work.stack,
  ].filter(Boolean).slice(0, 6);
}

export function getWorkCategoryLabel(category: WorkCategory): string {
  switch (category) {
    case 'shop':
      return 'E-commerce';
    case 'crm':
      return 'CRM / ERP';
    case 'saas':
      return 'SaaS';
    case 'web':
    default:
      return 'Web app';
  }
}
