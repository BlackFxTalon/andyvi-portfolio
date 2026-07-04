export const TECHNOLOGY_KEYS = [
  "Vue",
  "Nuxt",
  "TypeScript",
  "Pinia",
  "Chart.js",
] as const;

export type TechnologyKey = (typeof TECHNOLOGY_KEYS)[number];

export type TechnologyCategory =
  | "framework"
  | "language"
  | "state"
  | "visualization";

export type TechnologyIcon =
  | {
      readonly type: "iconify";
      readonly name: `logos:${string}`;
    }
  | {
      readonly type: "sprite";
      readonly symbolId: `icon-${string}`;
    };

export type TechnologyDefinition = {
  readonly key: TechnologyKey;
  readonly label: string;
  readonly category: TechnologyCategory;
  readonly icon: TechnologyIcon;
};

export const CUSTOM_TECHNOLOGY_SPRITE_SYMBOLS = {
  Pinia: "icon-pinia",
  "Chart.js": "icon-chart-js",
} as const satisfies Record<
  Extract<TechnologyKey, "Pinia" | "Chart.js">,
  `icon-${string}`
>;

export const TECHNOLOGY_REGISTRY = {
  Vue: {
    key: "Vue",
    label: "Vue",
    category: "framework",
    icon: {
      type: "iconify",
      name: "logos:vue",
    },
  },
  Nuxt: {
    key: "Nuxt",
    label: "Nuxt",
    category: "framework",
    icon: {
      type: "iconify",
      name: "logos:nuxt-icon",
    },
  },
  TypeScript: {
    key: "TypeScript",
    label: "TypeScript",
    category: "language",
    icon: {
      type: "iconify",
      name: "logos:typescript-icon",
    },
  },
  Pinia: {
    key: "Pinia",
    label: "Pinia",
    category: "state",
    icon: {
      type: "sprite",
      symbolId: CUSTOM_TECHNOLOGY_SPRITE_SYMBOLS.Pinia,
    },
  },
  "Chart.js": {
    key: "Chart.js",
    label: "Chart.js",
    category: "visualization",
    icon: {
      type: "sprite",
      symbolId: CUSTOM_TECHNOLOGY_SPRITE_SYMBOLS["Chart.js"],
    },
  },
} as const satisfies Record<TechnologyKey, TechnologyDefinition>;

export function isTechnologyKey(value: string): value is TechnologyKey {
  return Object.hasOwn(TECHNOLOGY_REGISTRY, value);
}

export function assertTechnologyKey(
  value: string,
): asserts value is TechnologyKey {
  if (!isTechnologyKey(value)) {
    throw new Error(`Unknown technology key: ${value}`);
  }
}

export function assertTechnologyStack(
  stack: readonly string[],
): asserts stack is readonly TechnologyKey[] {
  const unknownTechnology = stack.find(
    (technology) => !isTechnologyKey(technology),
  );

  if (unknownTechnology !== undefined) {
    throw new Error(`Unknown technology key: ${unknownTechnology}`);
  }
}

export function getTechnology(value: string): TechnologyDefinition {
  assertTechnologyKey(value);
  return TECHNOLOGY_REGISTRY[value];
}
