import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const WORK_CATEGORIES = ['web', 'shop', 'crm', 'saas'] as const;
const WORK_STATUSES = ['production', 'development', 'archived'] as const;
const WORK_TECHNOLOGIES = ['Vue', 'Nuxt', 'TypeScript', 'Pinia', 'Chart.js'] as const;

const works = defineCollection({
  loader: glob({
    base: './src/content/works',
    pattern: '**/*.{md,mdx}',
  }),
  schema: z.object({
    title: z.string().min(1),
    slug: z.string().regex(/^[a-z0-9-]+$/),
    summary: z.string().min(40).max(220),
    type: z.string().min(1),
    year: z.number().int().min(2015),
    category: z.enum(WORK_CATEGORIES),
    status: z.enum(WORK_STATUSES).default('production'),
    stack: z.array(z.enum(WORK_TECHNOLOGIES)).min(1),
    details: z.string().min(1),
    links: z
      .array(
        z.object({
          label: z.string().min(1),
          href: z.string().min(1),
        }),
      )
      .default([]),
    order: z.number().int().default(0),
    featured: z.boolean().default(false),
  }),
});

export const collections = { works };
