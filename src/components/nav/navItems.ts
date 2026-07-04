export type PageId = "home" | "works" | "about" | "process" | "contacts";

export interface NavItem {
  id: PageId;
  href: string;
  label: string;
  shortLabel: string;
  layer: string;
}

export const navItems = [
  {
    id: "home",
    href: "/",
    label: "Главная",
    shortLabel: "Главная",
    layer: "Nav / Главная",
  },
  {
    id: "works",
    href: "/works",
    label: "Работы",
    shortLabel: "Работы",
    layer: "Nav / Работы",
  },
  {
    id: "about",
    href: "/about",
    label: "Обо мне",
    shortLabel: "Обо мне",
    layer: "Nav / Обо мне",
  },
  {
    id: "process",
    href: "/process",
    label: "Процесс",
    shortLabel: "Процесс",
    layer: "Nav / Процесс",
  },
  {
    id: "contacts",
    href: "/contacts",
    label: "Контакты",
    shortLabel: "Контакты",
    layer: "Nav / Контакты",
  },
] as const satisfies readonly NavItem[];

export function normalizePath(pathname: string): string {
  const withoutTrailingSlash = pathname.replace(/\/+$/, "");
  return withoutTrailingSlash === "" ? "/" : withoutTrailingSlash;
}

export function pageFromPath(pathname: string): PageId {
  const normalizedPath = normalizePath(pathname);
  const match = navItems.find((item) => item.href === normalizedPath);
  return match?.id ?? "home";
}
