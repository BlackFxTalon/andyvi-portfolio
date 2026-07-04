# AndyVi Portfolio — Спека интеграции в Astro.js

> Версия 1.11 · Дата: 20 июня 2026  
> Источник: pixel-perfect HTML-прототип (5 страниц, ~1 900 строк / страница)  
> Целевой стек: **Astro 6.4.8 · Node.js 24.17.0 LTS · TypeScript 5.x · Astro Actions · @astrojs/node · CSS Variables · ClientRouter / View Transitions**

---

## 1. Контекст и цели

### Что переносим

| Текущее состояние | После интеграции |
|---|---|
| 5 монолитных HTML-файлов со стилями и JS прямо в `<style>` / `<script>` | Astro-страницы с компонентами, scoped styles, client islands |
| Всё поведение — ванильный JS inline | Логика разнесена: Astro (build-time) + клиентские острова (run-time) |
| Навигация — `window.location.assign()` с кастомным CSS-переходом | Astro View Transitions API + кастомные `@keyframes` glitch-эффекты |
| Контент Works зашит в HTML (`data-*`-атрибуты) | Astro Content Collections (Markdown/JSON) |
| Форма на Contacts — mock (setTimeout + success-класс) | Astro Action + серверная валидация + SMTP-отправка на Timeweb Cloud |
| Без TypeScript | TypeScript строгий (`strict: true`) |
| Нет build-пайплайна | `astro build` → преимущественно статический сайт + один Node.js runtime для server actions |

### Приоритет фidelity

Дизайн — пиксельный контракт. Всё, что ниже, должно воспроизвести внешний вид и поведение HTML-прототипа **без регрессий**:

- Cinematic 1920 × 1080 frame, масштабирующийся через `fitFrame()` только на desktop
- Glitch-анимации при загрузке (логотип + hero-заголовок)
- Page-scan переход между страницами
- HUD-декор, right-ruler, cta-border-orbit
- Mobile nav (overlay) с `Escape`/click-outside
- `prefers-reduced-motion` — все анимации выключаются

---

## 2. Стек

```
astro@^6.4.8            — фреймворк (production stable)
node@24.17.0            — runtime проекта (LTS, точная версия)
typescript@^5           — типизация
@astrojs/sitemap        — SEO (опционально, рекомендуется)
astro:assets            — встроенные Image/Picture и оптимизация изображений

# Иконки:
astro-icon              — интеграция Iconify + локальных SVG для Astro
@iconify-json/lucide    — UI-иконки (search, copy, arrow, filter, sort, ...)
@iconify-json/logos     — цветные brand-логотипы (Vue, TypeScript, Nuxt, Docker, ...)

# UI-слой:
Astro-компоненты        — основной компонентный слой без клиентского runtime
Scoped CSS + tokens     — pixel-perfect стили, responsive и visual states
Native HTML + TypeScript — интерактивные примитивы без обязательного UI-фреймворка
Сторонний UI-kit        — не подключается по умолчанию

# Тестирование:
vitest                  — unit, DOM integration и структурные snapshot-тесты
@vitest/coverage-v8     — отчёт покрытия TypeScript-логики
jsdom                   — DOM-окружение для интеграционных тестов клиентских скриптов
@testing-library/dom    — пользовательские DOM-запросы и проверки
@testing-library/jest-dom — DOM-матчеры для Vitest
@testing-library/user-event — реалистичные клики и keyboard-взаимодействия
@playwright/test        — E2E, responsive и визуальные screenshot-тесты
@axe-core/playwright    — автоматические accessibility-проверки в E2E (рекомендуется)

# Code quality:
@astrojs/check          — type checking для .astro и TypeScript
eslint@^10              — semantic lint для JS/TS/Astro на Flat Config
@eslint/js              — базовые рекомендуемые правила ESLint
typescript-eslint       — type-aware правила TypeScript
eslint-plugin-astro     — правила для .astro-файлов и Astro templates
eslint-plugin-jsx-a11y  — accessibility-правила, расширенные для Astro
eslint-config-prettier  — отключает конфликтующие formatting-правила ESLint
prettier                — единое форматирование JS/TS/Astro/CSS/JSON/Markdown
prettier-plugin-astro   — parser/formatter для .astro
stylelint               — lint CSS и <style> внутри Astro-компонентов
stylelint-config-standard — базовый набор CSS-правил
postcss-html            — custom syntax для извлечения <style> из .astro

# Backend формы:
@astrojs/node           — Node adapter для on-demand route и Astro Actions
Astro Actions           — типизированный server action без отдельного REST API
astro/zod               — серверная схема и валидация формы
nodemailer              — отправка письма через SMTP
@types/nodemailer       — типы Nodemailer для TypeScript
Honeypot                — первый бесплатный фильтр простых ботов
In-memory rate limit    — базовое ограничение частоты в одном Node.js-процессе
Cloudflare Turnstile    — не устанавливается по умолчанию; только при подтверждённом спаме

# Deployment:
Timeweb Cloud VPS       — основной production-сценарий
Nginx                   — TLS/static cache/reverse proxy к Astro Node
systemd                 — основной process manager для Node.js-приложения
Timeweb App Platform    — допустимая managed-альтернатива без ручного Nginx/systemd
Docker                  — не требуется на текущем масштабе
```

> **По умолчанию в спеке**: один Astro-проект с `@astrojs/node` в режиме `standalone`. Все страницы, кроме Contacts, пререндерятся; `contacts.astro` и Astro Action работают on-demand. Отдельный Express/NestJS-сервис и Docker не создаются.

---

## 3. Файловая структура

```
andyvi/
├── astro.config.mjs
├── vitest.config.ts
├── playwright.config.ts
├── tsconfig.json
├── package.json
├── package-lock.json                 # единственный lockfile
├── eslint.config.mjs
├── prettier.config.mjs
├── stylelint.config.mjs
├── .prettierignore
├── .stylelintignore
├── .editorconfig
├── .vscode/
│   ├── settings.json
│   └── extensions.json
├── .nvmrc                            # Node.js 24.17.0 LTS (точная версия проекта)
├── .env.example                       # только имена переменных, без секретов
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml
├── deploy/
│   ├── nginx/andyvi.conf              # reverse proxy + security/cache headers
│   └── systemd/andyvi.service         # Node process и автозапуск
│
├── public/
│   ├── fonts/                         # self-hosted WOFF2
│   ├── og/                            # Open Graph images
│   └── favicon.svg
│
├── src/
│   ├── assets/
│   │   ├── icons/                         # Локальные SVG (custom brand-иконки)
│   │   │   ├── pinia.svg                  # Кастомная цветная — нет в logos
│   │   │   ├── chartjs.svg                # Кастомная цветная — нет в logos
│   │   │   └── rest-api.svg               # Кастомная — нет в logos
│   │   └── images/
│   │       ├── andyvi-bg-shadow-silhouette-smoke-sharp-v2.png   # hero BG
│   │       ├── andyvi-portrait-tech-bg-tight-crop.png           # hero portrait
│   │       └── andyvi-bg-shadow-soft-both-sides.png             # smoke overlay
│   │
│   ├── styles/
│   │   ├── tokens.css        # :root { --bg: ...; --accent: ...; } → ОДИН источник правды
│   │   ├── global.css        # reset, html/body, .stage-shell, .frame, @font-face
│   │   ├── animations.css    # все @keyframes (glitch-*, page-scan-*, cta-border-orbit)
│   │   └── transitions.css   # Astro View Transitions overrides (::view-transition-*)
│   │
│   ├── layouts/
│   │   └── BaseLayout.astro  # <html>, <head>, <ClientRouter />, BaseNav, slots
│   │
│   ├── components/
│   │   ├── nav/
│   │   │   ├── TopBar.astro         # .topbar + .logo + desktop nav links
│   │   │   └── MobileNav.astro      # .mobile-nav overlay
│   │   │
│   │   ├── hud/
│   │   │   ├── RightRuler.astro     # .right-ruler (SVG tick-marks)
│   │   │   ├── HudDecor.astro       # .hud-decor (угловые линии, crosshair)
│   │   │   ├── GlitchCuts.astro     # .glitch-cuts (i × 4)
│   │   │   └── CtaBorderOrbit.astro # анимированная рамка CTA-кнопки
│   │   │
│   │   ├── home/
│   │   │   ├── HeroSection.astro    # .hero (title, lead, eyebrow, avatar-hint)
│   │   │   ├── MetricsStrip.astro   # .metrics (3 цифры + подписи)
│   │   │   └── CtaButton.astro      # .cta-zone / #projectsCta
│   │   │
│   │   ├── works/
│   │   │   ├── WorkControls.astro   # .work-controls (search, sort, category-buttons)
│   │   │   ├── ProjectCard.astro    # .project-card (article)
│   │   │   ├── ProjectsGrid.astro   # .projects-grid (хост карточек)
│   │   │   └── CaseModal.astro      # .case-modal (detail overlay)
│   │   │
│   │   ├── about/
│   │   │   ├── LeftStack.astro      # подход + принципы
│   │   │   ├── TechChips.astro      # технологический стек
│   │   │   └── RightPanel.astro     # bio + фото
│   │   │
│   │   ├── process/
│   │   │   ├── ProcessHero.astro
│   │   │   ├── ProcessSteps.astro
│   │   │   ├── ProcessDiagram.astro  # diagram-lines из process.html
│   │   │   └── PhoneChart.astro      # кастомный SVG-спарклайн
│   │   │
│   │   ├── contacts/
│   │   │   ├── ContactInfo.astro    # email / Telegram / GitHub блоки
│   │   │   └── ContactForm.astro    # progressive-enhanced Astro Action form
│   │   │
│   │   └── shared/
│   │       ├── PageFrame.astro         # .stage-shell + .frame обёртка
│   │       ├── BackgroundLayers.astro  # .bg-photo, .blue-smoke, .right-clean-plate
│   │       └── IconSprite.astro        # symbol-иконки: Pinia, Chart.js, REST API
│   │
│   ├── actions/
│   │   ├── index.ts                  # export const server = { contact }
│   │   └── contact.ts                # Astro Action: validate → anti-spam → SMTP
│   ├── server/
│   │   ├── email.ts                  # Nodemailer transport и sendContactEmail()
│   │   └── rateLimit.ts              # bounded in-memory limiter для одного процесса
│   ├── content.config.ts           # defineCollection + glob loader (Works schema)
│   ├── content/
│   │   └── works/
│   │       ├── autoapp.md
│   │       ├── erp4seller.md
│   │       ├── interno.md
│   │       └── industrial-configurator.md
│   │
│   ├── data/
│   │   └── technologies.ts          # единый реестр названий/иконок/категорий
│   ├── utils/
│   │   ├── works.ts                 # чистые filter/sort/map функции
│   │   ├── validation.ts            # client-side UX helpers; server schema — в Action
│   │   └── storage.ts               # безопасные local/sessionStorage helpers
│   ├── scripts/
│   │   ├── fitFrame.ts            # масштабирование 1920px фрейма
│   │   ├── mobileNav.ts           # toggle + Escape + click-outside
│   │   ├── glitchOnLoad.ts        # logo + hero title glitch
│   │   ├── pageTransition.ts      # is-page-entering / is-page-exiting классы
│   │   └── worksFilter.ts         # фильтрация + сортировка + modal
│   │
│   └── pages/
│       ├── index.astro            # Hero / Главная
│       ├── works.astro            # Работы
│       ├── about.astro            # Обо мне
│       ├── process.astro          # Процесс
│       ├── contacts.astro         # Контакты
│       ├── 404.astro              # брендированная страница 404
│       └── robots.txt.ts          # robots для production/staging
│
├── tests/
│   ├── setup/
│   │   └── vitest.setup.ts        # jest-dom, cleanup и общие mocks
│   ├── fixtures/
│   │   └── works.ts               # стабильные тестовые данные проектов
│   ├── unit/
│   │   ├── fitFrame.test.ts
│   │   └── worksFilter.test.ts
│   ├── integration/
│   │   ├── mobileNav.test.ts
│   │   ├── worksFilterDom.test.ts
│   │   ├── contactForm.test.ts
│   │   └── contactAction.test.ts    # SMTP/rate-limit mocks, без реальных писем
│   ├── snapshot/
│   │   ├── worksIndex.snapshot.test.ts
│   │   └── projectMetadata.snapshot.test.ts
│   └── e2e/
│       ├── navigation.spec.ts
│       ├── works.spec.ts
│       ├── contacts.spec.ts
│       ├── accessibility.spec.ts
│       └── pages.visual.spec.ts   # Playwright screenshot baselines
│
├── coverage/                       # generated, gitignored
├── playwright-report/              # generated, gitignored
└── test-results/                   # generated, gitignored
```

---

## 4. Конфигурация

### `astro.config.mjs`

```js
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://andyvi.ru', // заменить на реальный домен

  // По умолчанию маршруты пререндерятся. Только contacts.astro отключает prerender.
  output: 'static',
  adapter: node({
    mode: 'standalone',
  }),

  integrations: [
    sitemap(),
    icon({
      iconDir: 'src/assets/icons',
    }),
  ],

  // ClientRouter включает prefetch, но для контроля трафика используем opt-in.
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },
});
```

`@astrojs/node` в режиме `standalone` создаёт самостоятельный Node.js entrypoint `dist/server/entry.mjs`. Наличие adapter не превращает весь сайт в SSR: при `output: 'static'` страницы остаются пререндеренными, пока конкретный route не объявит `export const prerender = false`.

### `tsconfig.json`

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "baseUrl": ".",
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

### Runtime и package manager

Проект разрабатывается, тестируется и собирается только на **Node.js 24.17.0 LTS**. Версия фиксируется одновременно в `.nvmrc`, `package.json` и CI, чтобы локальное окружение, preview build и production build использовали одинаковый runtime. Альтернативные и минимально совместимые версии Node в спеке не поддерживаются.

`.nvmrc`:

```text
24.17.0
```

`package.json`:

```json
{
  "engines": {
    "node": "24.17.0"
  },
  "packageManager": "npm@<зафиксированная-версия>"
}
```

GitHub Actions:

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version-file: '.nvmrc'
    cache: npm
```

Правила:

- локальная разработка, CI, preview и production используют Node.js `24.17.0`;
- перед `npm ci` CI читает версию из `.nvmrc`;
- коммитится только `package-lock.json`;
- npm, pnpm и Yarn в одном проекте не смешиваются;
- значение `packageManager` фиксируется точной версией npm, с которой создан lockfile;
- обновление Node.js выполняется отдельным pull request с полным `npm run validate`;
- обновление Astro major выполняется отдельным pull request;
- prerelease-версии Node.js и Astro в production не используются.

### Переменные окружения

В репозитории хранится только `.env.example`:

```dotenv
SMTP_HOST=smtp.timeweb.ru
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=contact@andyvi.ru
SMTP_PASSWORD=
CONTACT_RECIPIENT=

# Включаются только при реальном спаме
PUBLIC_TURNSTILE_SITE_KEY=
TURNSTILE_SECRET_KEY=
```

Правила:

- `.env`, `.env.local` и production-секреты добавлены в `.gitignore`;
- `SMTP_PASSWORD`, адрес получателя и будущий Turnstile secret никогда не имеют префикса `PUBLIC_`;
- `from` в SMTP-письме совпадает с авторизованным `SMTP_USER`, email посетителя передаётся через `replyTo`;
- production-переменные задаются на сервере или в панели Timeweb App Platform, а не коммитятся в Git.

---

## 5. Design Tokens

Вынести из `index.html` в `src/styles/tokens.css`. Это **единственное место**, где живут токены.

```css
/* src/styles/tokens.css */
:root {
  /* Цвет */
  --bg:      oklch(7% 0.018 250);
  --surface: oklch(10% 0.022 250);
  --fg:      oklch(96% 0.015 240);
  --muted:   oklch(75% 0.018 240);
  --border:  oklch(66% 0.065 235);
  --accent:  oklch(74% 0.12 225);

  /* Вспомогательные алиасы (из inline-кода) */
  --cold-white: #f4f8ff;
  --cyan:       #b7e8ff;
  --deep:       #00040a;

  /* Типографика */
  --font-heading: "Tektur", "Arial Narrow", system-ui, sans-serif;
  --font-body:    "Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-mono:    "JetBrains Mono", "IBM Plex Mono", ui-monospace, monospace;

  /* Радиус */
  --radius-none: 0;           /* основная посуда */
  --radius-chip: 2px;         /* tech-chips */

  /* Motion */
  --dur-fast:   160ms;
  --dur-base:   220ms;
  --dur-slow:   440ms;
  --ease-out:   cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in:    cubic-bezier(0.65, 0, 0.35, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --dur-fast: 0ms;
    --dur-base: 0ms;
    --dur-slow: 0ms;
  }
}
```

> **Правило**: ни один компонент не использует цвет или шрифт напрямую — только через переменную из `tokens.css`.

---

## 6. `BaseLayout.astro`

```astro
---
// src/layouts/BaseLayout.astro
import { ClientRouter } from 'astro:transitions';
import TopBar from '@/components/nav/TopBar.astro';
import MobileNav from '@/components/nav/MobileNav.astro';
import '@/styles/tokens.css';
import '@/styles/global.css';
import '@/styles/animations.css';
import '@/styles/transitions.css';

interface Props {
  title: string;
  description?: string;
  currentPage?: 'home' | 'works' | 'about' | 'process' | 'contacts';
}

const { title, description = 'Портфолио фронтенд-разработчика AndyVi', currentPage } = Astro.props;
---

<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Tektur:wght@400;500;600;700;800;900&display=swap"
      rel="stylesheet"
    />
    <ClientRouter />
  </head>
  <body>
    <div class="stage-shell">
      <TopBar currentPage={currentPage} />
      <MobileNav currentPage={currentPage} />
      <slot />
    </div>

    <script>
      import { fitFrame } from '@/scripts/fitFrame';
      import { initMobileNav } from '@/scripts/mobileNav';

      // Выполняется после каждой навигации через ClientRouter
      document.addEventListener('astro:page-load', () => {
        fitFrame();
        initMobileNav();
      });

      window.addEventListener('resize', fitFrame);
    </script>
  </body>
</html>
```

### Почему `astro:page-load` вместо `DOMContentLoaded`

`<ClientRouter />` заменяет DOM при клиентской навигации. Скрипты, привязанные к `DOMContentLoaded`, срабатывают только при первой загрузке. `astro:page-load` гарантирует повторную инициализацию после каждого перехода.

---

## 7. Страницы → Маршруты

### 7.1 `index.astro` (Hero / Главная)

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import PageFrame from '@/components/shared/PageFrame.astro';
import BackgroundLayers from '@/components/shared/BackgroundLayers.astro';
import HeroSection from '@/components/home/HeroSection.astro';
import MetricsStrip from '@/components/home/MetricsStrip.astro';
import CtaButton from '@/components/home/CtaButton.astro';
import RightRuler from '@/components/hud/RightRuler.astro';
import HudDecor from '@/components/hud/HudDecor.astro';
import GlitchCuts from '@/components/hud/GlitchCuts.astro';
---

<BaseLayout title="AndyVi — Главная" currentPage="home">
  <PageFrame>
    <BackgroundLayers />
    <HeroSection />
    <MetricsStrip />
    <CtaButton href="/works" id="projectsCta" />
    <RightRuler />
    <HudDecor />
    <GlitchCuts />
  </PageFrame>

  <script>
    import { initGlitchOnLoad } from '@/scripts/glitchOnLoad';
    import { initCtaVisited } from '@/scripts/pageTransition';

    document.addEventListener('astro:page-load', () => {
      initGlitchOnLoad();
      initCtaVisited();
    });
  </script>
</BaseLayout>
```

> `<PageFrame>` рендерит `.stage-shell > .frame` — тот самый cinematic контейнер 1920 × 1080.

### 7.2 `works.astro`

```astro
---
import BaseLayout from '@/layouts/BaseLayout.astro';
import PageFrame from '@/components/shared/PageFrame.astro';
import WorkControls from '@/components/works/WorkControls.astro';
import ProjectsGrid from '@/components/works/ProjectsGrid.astro';
import CaseModal from '@/components/works/CaseModal.astro';
import { getCollection } from 'astro:content';

const works = await getCollection('works');
---

<BaseLayout title="AndyVi — Работы" currentPage="works">
  <PageFrame>
    <WorkControls />
    <ProjectsGrid works={works} />
    <CaseModal />
  </PageFrame>

  <script>
    import { initWorksFilter } from '@/scripts/worksFilter';
    document.addEventListener('astro:page-load', initWorksFilter);
  </script>
</BaseLayout>
```

### 7.3 Остальные страницы

Аналогичная структура: `about.astro`, `process.astro`, `contacts.astro` — каждая импортирует свои компоненты, оборачивает в `BaseLayout` + `PageFrame`.

---

## 8. Content Collections (Works)

### `src/content.config.ts`

В Astro 6 коллекции задаются в корневом `src/content.config.ts`. Для локальных Markdown-файлов используется `glob()` loader. Schema является контрактом данных проекта и не допускает произвольные строки для технологий или статусов.

```typescript
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const works = defineCollection({
  loader: glob({
    base: './src/content/works',
    pattern: '**/*.{md,mdx}',
  }),
  schema: ({ image }) =>
    z.object({
      title: z.string().min(1),
      slug: z.string().regex(/^[a-z0-9-]+$/),
      summary: z.string().min(40).max(220),
      type: z.string(),
      category: z.enum(['web', 'shop', 'crm', 'saas']),
      year: z.number().int().min(2015),
      order: z.number().int().default(0),
      featured: z.boolean().default(false),
      status: z.enum(['production', 'development', 'archived']),
      role: z.string(),
      responsibilities: z.array(z.string()).min(1),
      stack: z.array(z.string()).min(1),
      results: z.array(z.string()).default([]),
      websiteUrl: z.string().url().optional(),
      repositoryUrl: z.string().url().optional(),
      cover: image(),
      coverAlt: z.string().min(1),
      screenshots: z
        .array(
          z.object({
            src: image(),
            alt: z.string().min(1),
          }),
        )
        .default([]),
      seo: z
        .object({
          title: z.string().optional(),
          description: z.string().max(160).optional(),
        })
        .optional(),
    }),
});

export const collections = { works };
```

Технологии дополнительно описываются в `src/data/technologies.ts` и используются как единый реестр подписей, категорий и источников иконок. Если `stack` содержит неизвестный ключ, build/check должен завершаться ошибкой или отдельный validation-test должен её обнаружить.

### Пример `src/content/works/autoapp.md`

```markdown
---
title: AUTOAPP
slug: autoapp
summary: Миграция e-commerce платформы на Vue 3 и TypeScript с оптимизацией каталога и сетевых запросов.
type: E-commerce платформа
category: shop
year: 2026
order: 10
featured: true
status: production
role: Frontend-разработчик
responsibilities:
  - Миграция Vue 2 → Vue 3
  - Внедрение TanStack Query и TanStack Virtual
stack: [vue, typescript, pinia, tanstack-query]
results:
  - Виртуализация каталога более 10 000 товаров
cover: ../../assets/images/works/autoapp-cover.png
coverAlt: Интерфейс каталога AUTOAPP
---
```

### `ProjectCard.astro`

```astro
---
interface Props {
  title: string;
  slug: string;
  summary: string;
  type: string;
  category: 'web' | 'shop' | 'crm' | 'saas';
  year: number;
  status: 'production' | 'development' | 'archived';
  stack: string[];
}

const { title, slug, summary, type, category, year, status, stack } = Astro.props;
---

<article
  class="project-card"
  data-title={title}
  data-type={type}
  data-category={category}
  data-year={String(year)}
  data-status={status}
  data-stack={stack.join(' ')}
>
  <h2 class="project-title">{title}</h2>
  <p>{summary}</p>
  <a
    href={`/works/${slug}/`}
    class="project-card__link"
    data-action="open-project"
    aria-label={`Открыть кейс ${title}`}
  >
    Подробнее
  </a>
</article>
```

> Фильтрация и сортировка остаются на клиенте (`worksFilter.ts`) — индексируемые данные уже находятся в DOM через `data-*`. Для действия используется семантическая ссылка или кнопка, а не `tabindex` на `<article>`.

---

## 9. Page Transitions

### Стратегия: Astro ClientRouter + View Transitions + кастомный glitch-оверлей

`<ClientRouter />` перехватывает внутреннюю навигацию и добавляет SPA-подобные переходы без полной перезагрузки страницы. Это заменяет ванильный `navigateWithPageTransition()` из прототипа.

Кастомный `page-scan-enter` / `page-scan-exit` из прототипа переносится в `transitions.css` как переопределение `::view-transition-*` pseudo-elements.

```css
/* src/styles/transitions.css */

/* Выключить дефолтный cross-fade Astro */
::view-transition-old(root),
::view-transition-new(root) {
  animation: none;
  mix-blend-mode: normal;
}

/* Выход: page-scan-exit (620ms → 440ms easeIn) */
::view-transition-old(root) {
  animation: page-scan-exit 440ms cubic-bezier(0.65, 0, 0.35, 1) both;
}

/* Вход: page-scan-enter + vignette */
::view-transition-new(root) {
  animation:
    page-scan-enter   620ms cubic-bezier(0.16, 1, 0.3, 1) both,
    page-vignette-enter 620ms ease-out both;
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-old(root),
  ::view-transition-new(root) {
    animation: none;
  }
}
```

`@keyframes page-scan-enter`, `page-scan-exit`, `page-vignette-enter` переносятся дословно из `index.html` в `animations.css`.

### `ClientRouter` в `<head>`

```astro
<!-- BaseLayout.astro -->
<ClientRouter fallback="animate" />
```

`fallback="animate"` сохраняет анимированный fallback в браузерах без нативной поддержки View Transitions API. Поведение остаётся максимально близким к прототипу.

---

## 10. Клиентские скрипты (Islands Architecture)

Каждый скрипт — отдельный `.ts`-модуль. Они загружаются через `<script>` в Astro-компонентах (Astro автоматически бандлит и дедуплицирует их).

### `src/scripts/fitFrame.ts`

`fitFrame()` применяется только к cinematic desktop-режиму. На tablet/mobile `transform` полностью снимается, а страница работает в естественном вертикальном flow.

```typescript
export const CINEMATIC_MIN_WIDTH = 1280;
const FRAME_WIDTH = 1920;
const FRAME_HEIGHT = 1080;

export interface FrameTransform {
  scale: number;
  x: number;
  y: number;
  css: string;
}

export function isCinematicViewport(viewportWidth: number): boolean {
  return viewportWidth >= CINEMATIC_MIN_WIDTH;
}

export function calculateFrameTransform(
  viewportWidth: number,
  viewportHeight: number,
): FrameTransform {
  const scale = Math.min(viewportWidth / FRAME_WIDTH, viewportHeight / FRAME_HEIGHT);
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const x = (viewportWidth - FRAME_WIDTH * safeScale) / 2;
  const y = (viewportHeight - FRAME_HEIGHT * safeScale) / 2;

  return {
    scale: safeScale,
    x,
    y,
    css: `translate(${x}px, ${y}px) scale(${safeScale})`,
  };
}

export function fitFrame(): void {
  const frame = document.getElementById('frame');
  const topbar = document.querySelector<HTMLElement>('.topbar');
  if (!frame) return;

  if (!isCinematicViewport(window.innerWidth)) {
    frame.style.removeProperty('transform');
    topbar?.style.removeProperty('transform');
    document.documentElement.dataset.layout = 'flow';
    return;
  }

  const { css } = calculateFrameTransform(window.innerWidth, window.innerHeight);
  frame.style.transform = css;
  if (topbar) topbar.style.transform = css;
  document.documentElement.dataset.layout = 'cinematic';
}
```

### `src/scripts/glitchOnLoad.ts`

```typescript
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function applyGlitch(el: Element | null, cssClass: string, duration: number): void {
  if (!el || reduceMotion) return;
  const text = el.textContent?.trim() ?? '';
  (el as HTMLElement).dataset.glitch = text;
  requestAnimationFrame(() => {
    el.classList.add(cssClass);
    setTimeout(() => {
      el.classList.remove(cssClass);
      delete (el as HTMLElement).dataset.glitch;
    }, duration);
  });
}

export function initGlitchOnLoad(): void {
  applyGlitch(document.querySelector('.logo-word'), 'load-glitch-logo', 1120);
  applyGlitch(document.querySelector('.hero-title span:first-child'), 'load-glitch', 1200);
  applyGlitch(document.querySelector('.hero-title span:nth-child(2)'), 'load-glitch-deep', 1400);
}
```

### `src/scripts/mobileNav.ts`

Все `init*()`-функции должны быть идемпотентными. Повторный `astro:page-load` не должен создавать дублирующие listeners.

```typescript
let controller: AbortController | undefined;

export function initMobileNav(): void {
  controller?.abort();
  controller = new AbortController();

  const btn = document.getElementById('menuButton');
  const nav = document.getElementById('mobileNav');
  if (!btn || !nav) return;

  const { signal } = controller;
  const close = () => {
    btn.setAttribute('aria-expanded', 'false');
    nav.classList.remove('is-open');
  };

  btn.addEventListener(
    'click',
    (event) => {
      event.stopPropagation();
      const willOpen = !nav.classList.contains('is-open');
      nav.classList.toggle('is-open', willOpen);
      btn.setAttribute('aria-expanded', String(willOpen));
    },
    { signal },
  );

  document.addEventListener(
    'click',
    (event) => {
      const target = event.target as Node;
      if (!nav.contains(target) && !btn.contains(target)) close();
    },
    { signal },
  );

  document.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') close();
    },
    { signal },
  );
}
```

### `src/scripts/worksFilter.ts`

```typescript
export function initWorksFilter(): void {
  const cards   = Array.from(document.querySelectorAll<HTMLElement>('.project-card'));
  const catBtns = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-category]'));
  const sortBox = document.querySelector<HTMLSelectElement>('.sort-box');
  const modal   = document.getElementById('caseModal');
  // ... логика фильтрации / сортировки / modal дословно из works.html
}
```

---

## 11. Контактная форма и минимальный backend

### 11.1 Архитектурное решение

Контактная форма обрабатывается внутри того же Astro-приложения:

```text
ContactForm.astro
    ↓ POST
Astro Action contact.send
    ↓
Zod validation → honeypot → in-memory rate limit
    ↓
Nodemailer → SMTP Timeweb → почта владельца
```

Отдельный Express/NestJS/Fastify-сервис не создаётся: для одной формы он добавил бы второй процесс, отдельные типы, логи, деплой и API-контракт без реальной пользы. Выделение backend-сервиса пересматривается только при появлении БД, админки, авторизации, CRM/webhook-интеграций или нескольких клиентов API.

### 11.2 Astro Action

```typescript
// src/actions/contact.ts
import { ActionError, defineAction } from 'astro:actions';
import { z } from 'astro/zod';
import { sendContactEmail } from '@/server/email';
import { assertContactRateLimit } from '@/server/rateLimit';

export const contact = {
  send: defineAction({
    accept: 'form',

    input: z.object({
      name: z.string().trim().min(2).max(80),
      email: z.string().trim().email().max(254),
      message: z.string().trim().min(10).max(5000),
      // Пустое form-поле Astro может преобразовать в null.
      website: z.string().max(200).nullable().optional(),
    }),

    handler: async ({ website, ...input }, context) => {
      // Honeypot: бот получает нейтральный success и не узнаёт о блокировке.
      if (website?.trim()) return { ok: true };

      assertContactRateLimit(context);

      try {
        await sendContactEmail(input);
        return { ok: true };
      } catch (error) {
        console.error('contact_send_failed', {
          error: error instanceof Error ? error.name : 'unknown',
        });

        throw new ActionError({
          code: 'SERVICE_UNAVAILABLE',
          message: 'Не удалось отправить сообщение. Попробуйте позже.',
        });
      }
    },
  }),
};
```

```typescript
// src/actions/index.ts
import { contact } from './contact';

export const server = { contact };
```

### 11.3 SMTP через Nodemailer

```typescript
// src/server/email.ts
import nodemailer from 'nodemailer';

interface ContactInput {
  name: string;
  email: string;
  message: string;
}

const port = Number(import.meta.env.SMTP_PORT ?? 587);

const transporter = nodemailer.createTransport({
  host: import.meta.env.SMTP_HOST,
  port,
  secure: import.meta.env.SMTP_SECURE === 'true' || port === 465,
  auth: {
    user: import.meta.env.SMTP_USER,
    pass: import.meta.env.SMTP_PASSWORD,
  },
});

export async function sendContactEmail(input: ContactInput): Promise<void> {
  await transporter.sendMail({
    from: `"AndyVi Portfolio" <${import.meta.env.SMTP_USER}>`,
    to: import.meta.env.CONTACT_RECIPIENT,
    replyTo: input.email,
    subject: `Новое сообщение от ${input.name}`,
    text: [
      `Имя: ${input.name}`,
      `Email: ${input.email}`,
      '',
      input.message,
    ].join('\n'),
  });
}
```

Для SMTP Timeweb используется `smtp.timeweb.ru`: порт `587` с STARTTLS либо `465` с SSL. Пользовательский email нельзя помещать в `from`, иначе возрастает риск отказа SMTP/DKIM/DMARC; он задаётся только в `replyTo`.

### 11.4 Страница и progressive enhancement

`contacts.astro` — единственный on-demand route:

```astro
---
export const prerender = false;

import { actions, isInputError } from 'astro:actions';
import BaseLayout from '@/layouts/BaseLayout.astro';

const result = Astro.getActionResult(actions.contact.send);
const fields = isInputError(result?.error) ? result.error.fields : {};
---

<BaseLayout title="AndyVi — Контакты" currentPage="contacts">
  <form method="POST" action={actions.contact.send} class="contact-form">
    <label>
      Имя
      <input name="name" required maxlength="80" autocomplete="name" />
    </label>

    <label>
      Email
      <input name="email" type="email" required maxlength="254" autocomplete="email" />
    </label>

    <label>
      Сообщение
      <textarea name="message" required minlength="10" maxlength="5000"></textarea>
    </label>

    <div class="contact-form__honeypot" aria-hidden="true">
      <label>
        Website
        <input name="website" tabindex="-1" autocomplete="off" />
      </label>
    </div>

    <button type="submit">Отправить</button>

    <div aria-live="polite">
      {result?.data?.ok && <p>Сообщение отправлено.</p>}
      {result?.error && <p>Не удалось отправить сообщение.</p>}
      {fields.email && <p>{fields.email.join(', ')}</p>}
    </div>
  </form>
</BaseLayout>
```

Клиентский TypeScript может улучшать UX: блокировать повторный submit, показывать loading и обновлять `aria-live`. Базовая отправка при этом остаётся работоспособной без JavaScript.

### 11.5 Honeypot

Honeypot обязателен в первой версии как дешёвый фильтр простых ботов:

- поле визуально вынесено за экран, а не имеет `type="hidden"`;
- исключено из Tab-порядка и accessibility tree;
- обычный пользователь его не заполняет;
- заполненное поле не вызывает SMTP-отправку;
- ответ остаётся нейтрально успешным, чтобы бот не адаптировался.

Honeypot не считается полной защитой и не заменяет серверную валидацию или rate limiting.

### 11.6 Rate limiting

Для одного Node.js-процесса используется ограниченный `Map`-based limiter, например не более пяти попыток за десять минут. Ключ строится из доверенного client IP после настройки Nginx proxy headers; raw IP не пишется в application logs.

Требования к реализации:

- TTL-записи регулярно удаляются, чтобы `Map` не рос бесконечно;
- превышение лимита приводит к `ActionError({ code: 'TOO_MANY_REQUESTS' })`;
- состояние может сбрасываться при рестарте — для формы портфолио это допустимо;
- при нескольких Node-инстансах limiter заменяется на Redis/другое общее хранилище.

### 11.7 Cloudflare Turnstile

Turnstile **не входит в начальный стек**. Он добавляется только если метрики или SMTP-логи подтверждают, что honeypot и rate limit недостаточны.

Причины не подключать заранее:

- внешний клиентский script и дополнительный network request;
- зависимость формы от стороннего сервиса;
- дополнительные секреты, ошибки и E2E-сценарии;
- лишняя сложность без подтверждённого спама.

При подключении token обязательно проверяется на сервере перед SMTP; клиентская проверка без server-side verification не считается защитой.

### 11.8 Что не добавляется

На текущем масштабе не нужны:

- отдельный backend repository или второй Node.js-сервис;
- Express, Fastify или NestJS;
- база данных и ORM;
- Redis до появления нескольких процессов или реального abuse;
- очередь сообщений;
- Docker;
- Turnstile/CAPTCHA до подтверждённой необходимости.

---

## 12. Иконки

В прототипе используются три категории векторной графики. Их нельзя сводить к одной библиотеке: UI-иконки, технологические логотипы и HUD-декор решаются по-разному.

### Обзор категорий

| Категория | Где используется | Характеристика | Решение |
|---|---|---|---|
| UI-иконки | works, contacts, process | контурные, `currentColor`, обычно 14–24 px | `astro-icon` + `@iconify-json/lucide` |
| Tech brand-иконки | works, about | оригинальные цветные логотипы | `@iconify-json/logos` + локальный SVG-sprite для 3 исключений |
| HUD/декор | все страницы | кастомная геометрия и диаграммы из прототипа | Astro-компоненты с inline SVG |

---

### 12.1 UI-иконки → `astro-icon` + Lucide

Пути UI-иконок в прототипе практически совпадают с Lucide. Основной набор:

| Иконка в прототипе | Lucide-имя |
|---|---|
| Поиск | `lucide:search` |
| Фильтры | `lucide:sliders-horizontal` |
| Сортировка по убыванию | `lucide:arrow-down-narrow-wide` |
| Сортировка по возрастанию | `lucide:arrow-up-narrow-wide` |
| Копирование | `lucide:copy` |
| Стрелка вправо | `lucide:arrow-right` |
| Архитектура / шестигранник | `lucide:hexagon` |
| Разработка / код | `lucide:code-2` |
| Запуск | `lucide:rocket` |

**Установка выполняется один раз вместе с brand-набором:**

```bash
npm install astro-icon @iconify-json/lucide @iconify-json/logos
```

**Использование:**

```astro
---
import { Icon } from 'astro-icon/components';
---

<Icon name="lucide:search" width="20" height="20" aria-hidden="true" />
<Icon name="lucide:copy" width="14" height="14" aria-hidden="true" />
<Icon name="lucide:arrow-right" width="20" height="20" aria-hidden="true" />
```

Для декоративной иконки без текстового смысла обязательно использовать `aria-hidden="true"`. Если иконка является единственным содержимым интерактивной кнопки, доступное имя задаётся самой кнопке через `aria-label`.

> `astro-icon` инлайнит SVG во время сборки. Отдельных fetch-запросов за иконками в браузере нет.

---

### 12.2 Tech brand-иконки → `@iconify-json/logos`

Для технологического стека нужен именно цветной набор `logos`. Simple Icons здесь не подходит: он монохромный, тогда как в прототипе Vue зелёный, TypeScript синий, Nuxt зелёный и т. д.

```astro
---
import { Icon } from 'astro-icon/components';
---

<Icon name="logos:vue" class="skill-icon" aria-hidden="true" />
<Icon name="logos:typescript-icon" class="skill-icon" aria-hidden="true" />
<Icon name="logos:nuxt-icon" class="skill-icon" aria-hidden="true" />
<Icon name="logos:docker-icon" class="skill-icon" aria-hidden="true" />
<Icon name="logos:gitlab" class="skill-icon" aria-hidden="true" />
<Icon name="logos:cypress" class="skill-icon" aria-hidden="true" />
<Icon name="logos:vitest" class="skill-icon" aria-hidden="true" />
```

#### Исключения: Pinia, Chart.js и REST API

Трёх иконок из прототипа нет в подходящем виде в наборе `logos`: они нишевые либо кастомные. Их не заменять визуально похожими символами и не перекрашивать монохромный набор.

Существующие `<symbol>` переносятся без изменения путей в:

```text
src/components/shared/IconSprite.astro
```

```astro
<!-- src/components/shared/IconSprite.astro -->
<svg
  aria-hidden="true"
  width="0"
  height="0"
  class="icon-sprite"
  style="position:absolute;overflow:hidden"
>
  <symbol id="icon-pinia" viewBox="0 0 24 24">
    <!-- paths из прототипа -->
  </symbol>

  <symbol id="icon-chart-js" viewBox="0 0 24 24">
    <!-- paths из прототипа -->
  </symbol>

  <symbol id="icon-rest-api" viewBox="0 0 24 24">
    <!-- paths из прототипа -->
  </symbol>
</svg>
```

`IconSprite.astro` подключается один раз внутри `BaseLayout.astro`, чтобы символы были доступны на всех маршрутах:

```astro
---
import IconSprite from '@/components/shared/IconSprite.astro';
---

<body>
  <IconSprite />
  <!-- остальная разметка -->
</body>
```

Использование в `TechChips.astro` или `ProjectCard.astro`:

```astro
<svg class="skill-icon" width="24" height="24" aria-hidden="true">
  <use href="#icon-pinia" />
</svg>

<svg class="skill-icon" width="24" height="24" aria-hidden="true">
  <use href="#icon-chart-js" />
</svg>

<svg class="skill-icon" width="24" height="24" aria-hidden="true">
  <use href="#icon-rest-api" />
</svg>
```

> Не дублировать одну и ту же custom-иконку одновременно в `IconSprite.astro` и `src/assets/icons`. Sprite остаётся источником правды для Pinia, Chart.js и REST API. `iconDir` используется для других standalone SVG-файлов, если они появятся позднее.

---

### 12.3 HUD и декоративная графика → Astro-компоненты с inline SVG

`right-ruler`, `hud-decor`, `glitch-cuts`, `diagram-lines` и диаграммы из `process.html` — не библиотечные иконки, а часть визуальной системы сайта. Их необходимо переносить как отдельные Astro-компоненты с hardcoded SVG-разметкой и путями из прототипа.

| Компонент | Что рендерит | Реализация |
|---|---|---|
| `RightRuler.astro` | тики, вертикальная линия, номер страницы | inline SVG |
| `HudDecor.astro` | угловые линии, crosshair, corner-cuts | inline SVG |
| `GlitchCuts.astro` | четыре анимируемые полосы | HTML-элементы + CSS, без библиотеки иконок |
| `CtaBorderOrbit.astro` | орбита вокруг CTA | CSS `::before` / conic-gradient |
| `ProcessDiagram.astro` | большая схема `diagram-lines` | inline SVG из `process.html` |
| `PhoneChart.astro` | спарклайн мобильного блока | inline SVG из `process.html` |

Правила для этой категории:

- пути и `viewBox` переносятся из прототипа без визуального упрощения;
- цвета берутся из CSS-переменных через `currentColor` или custom properties, когда это не ломает исходный вид;
- декоративная графика получает `aria-hidden="true"` и `focusable="false"`;
- HUD-компоненты не подключаются через Iconify и не выносятся в общий icon sprite.

---

### 12.4 Конфигурация `astro-icon`

```js
import { defineConfig } from 'astro/config';
import icon from 'astro-icon';

export default defineConfig({
  integrations: [
    icon({
      iconDir: 'src/assets/icons', // дополнительные standalone custom SVG-файлы
    }),
  ],
});
```

`@iconify-json/lucide` и `@iconify-json/logos` обнаруживаются `astro-icon` из установленных зависимостей. Ручной импорт всего набора не нужен: в production попадают только реально использованные иконки.

---

## 13. Assets и изображения

### Использовать `astro:assets` и responsive sources

```astro
---
import { Picture } from 'astro:assets';
import portrait from '@/assets/images/andyvi-portrait-tech-bg-tight-crop.png';
---

<Picture
  src={portrait}
  formats={['avif', 'webp']}
  widths={[480, 720, 960]}
  sizes="(max-width: 819px) 92vw, (max-width: 1279px) 55vw, 960px"
  alt="Портрет frontend-разработчика AndyVi"
  class="hero-portrait"
  loading="eager"
  fetchpriority="high"
/>
```

- eager + high priority разрешены только для подтверждённого LCP-изображения;
- изображения ниже первого экрана используют `loading="lazy"`;
- все медиа имеют известные width/height или aspect-ratio для предотвращения CLS;
- декоративные smoke/grain/vignette не получают пустые интерактивные контейнеры и скрываются от accessibility tree;
- для контентных изображений `alt` обязателен и описывает назначение, а не внешний вид файла.

### Очистка ассетов

Из архива нужны только production-ассеты:

| Файл | Назначение | Включить? |
|---|---|---|
| `andyvi-bg-shadow-silhouette-smoke-sharp-v2.png` | Hero BG | ✅ |
| `andyvi-portrait-tech-bg-tight-crop.png` | Portrait | ✅ |
| `andyvi-bg-shadow-soft-both-sides.png` | Smoke overlay | ✅ |
| `sort-amount-up.svg` | Иконка сортировки | ✅ |
| `*.png` (verify-*, check-*, crop-*) | Verification screenshots | ❌ — только для разработки |
| `ChatGPT-Image-*.png` | Reference концепты | ❌ |
| `andyvi-*.html` (prototype, mobile, tablet) | Прото-файлы | ❌ |

---

## 14. SEO и мета

```astro
<!-- BaseLayout.astro — расширенный <head> -->
<meta property="og:title"       content={title} />
<meta property="og:description" content={description} />
<meta property="og:type"        content="website" />
<meta name="twitter:card"       content="summary_large_image" />
<link rel="canonical"           href={Astro.url.href} />
```

Astro Sitemap генерирует `sitemap.xml` автоматически при наличии интеграции.

---

## 15. Деплой на Timeweb Cloud

### 15.1 Основной профиль: Cloud VPS

Production-развёртывание выполняется на одном Timeweb Cloud VPS:

```text
Internet
  ↓ HTTPS
Nginx :443
  ↓ proxy_pass http://127.0.0.1:4321
Astro Node standalone
  ├── prerendered pages/assets
  ├── /contacts on-demand
  └── /_actions/contact.send
        ↓
      SMTP Timeweb
```

Состав:

- Nginx завершает TLS, проксирует динамические запросы и задаёт cache/security headers;
- `@astrojs/node` в `standalone` обслуживает статические файлы, on-demand route и Actions;
- systemd запускает Node-процесс, перезапускает его при сбое и поднимает после reboot;
- приложение слушает только `127.0.0.1:4321`, наружу открыт Nginx;
- production-секреты находятся в systemd `EnvironmentFile` с ограниченными правами.

Команда запуска build:

```bash
HOST=127.0.0.1 PORT=4321 node ./dist/server/entry.mjs
```

### 15.2 systemd unit

```ini
# /etc/systemd/system/andyvi.service
[Unit]
Description=AndyVi Astro portfolio
After=network.target

[Service]
Type=simple
User=andyvi
Group=andyvi
WorkingDirectory=/var/www/andyvi/current
Environment=NODE_ENV=production
Environment=HOST=127.0.0.1
Environment=PORT=4321
EnvironmentFile=/etc/andyvi/andyvi.env
ExecStart=/usr/bin/node ./dist/server/entry.mjs
Restart=on-failure
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

PM2 допустим вместо systemd, но одновременно оба process manager не используются. Для одного приложения systemd является основным вариантом: он уже входит в Linux, не создаёт дополнительную Node.js-зависимость и хорошо интегрируется с journald.

### 15.3 Nginx

```nginx
server {
    listen 443 ssl http2;
    server_name andyvi.ru www.andyvi.ru;

    client_max_body_size 32k;

    location /_astro/ {
        proxy_pass http://127.0.0.1:4321;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    location / {
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_pass http://127.0.0.1:4321;
    }
}
```

Перед использованием forwarded IP для rate limiting приложение должно доверять только заголовкам, которые перезаписал собственный Nginx. При прямом доступе к Node-порту клиент мог бы подделать `X-Forwarded-For`, поэтому порт `4321` не публикуется наружу.

### 15.4 Timeweb App Platform как альтернатива

App Platform можно использовать вместо VPS: она подключает Git-репозиторий, устанавливает зависимости, собирает, запускает и перезапускает Node.js-приложение. В этом режиме Nginx/systemd управляются платформой, а environment variables задаются в панели.

Перед выбором App Platform выполняется staging proof-of-concept:

- `npm ci` и `npm run build` проходят на Node.js 24;
- команда `node ./dist/server/entry.mjs` запускается с предоставленными `HOST`/`PORT`;
- Actions и SMTP работают после redeploy;
- persistent in-memory rate limit не предполагается между рестартами;
- ограничения платформы и rollback-процедура документируются.

### 15.5 Почему Docker не нужен

Docker не является частью базовой реализации, потому что сейчас есть один Node.js-процесс без БД, Redis и очередей. Версии Node/npm уже фиксируются через `.nvmrc`, `package.json`, lockfile и CI.

Docker пересматривается, если появляются:

- несколько взаимозависимых сервисов;
- PostgreSQL/Redis/worker и локальный compose-стек;
- конфликтующие runtime на одном VPS;
- требование переносимого immutable image;
- Kubernetes или container-only deployment target.

### 15.6 Deployment workflow

```text
feature branch
→ Pull Request
→ CI: validate + build + Playwright
→ merge в main
→ deploy на staging
→ smoke-test routes + contact action с тестовым SMTP
→ атомарное переключение current symlink
→ systemctl restart andyvi
→ production smoke-test
```

Rollback выполняется переключением symlink на предыдущий release и перезапуском unit. Секреты и пользовательские данные не входят в release directory.

---

## 16. TypeScript

Все компоненты используют `Astro.props` с интерфейсами. Пример:

```typescript
// src/components/home/CtaButton.astro
---
interface Props {
  href: string;
  id?: string;
  label?: string;
}
const { href, id = 'projectsCta', label = 'Смотреть проекты' } = Astro.props;
---
```

`tsconfig.json` расширяет `astro/tsconfigs/strict`; дополнительные `noUncheckedIndexedAccess` и `exactOptionalPropertyTypes` включаются явно в конфигурации проекта.

---

## 17. Стратегия тестирования

Тестовая пирамида состоит из четырёх обязательных уровней:

| Уровень | Инструмент | Что проверяет | Где запускается |
|---|---|---|---|
| Unit | Vitest | чистые функции, сортировка, фильтрация, вычисление масштаба, валидация | Node |
| Integration | Vitest + JSDOM + Testing Library; Playwright | клиентские DOM-модули и интеграцию собранных Astro-страниц | JSDOM + реальные браузеры |
| Snapshot | Vitest snapshots + Playwright screenshots | детерминированные данные/metadata и pixel-perfect внешний вид | Node + Chromium |
| E2E | Playwright | пользовательские сценарии, маршруты, View Transitions, формы, keyboard nav, responsive | реальные браузеры |

### 17.1 Принципы

- тестировать публичное поведение, а не внутреннюю реализацию;
- сначала использовать доступные роли, label и текст, затем `data-testid` только при отсутствии семантического селектора;
- не дублировать один и тот же сценарий на каждом уровне;
- CSS-анимации, таймеры и случайные данные должны быть детерминированы;
- unit-тесты не запускают браузер и не рендерят целую страницу;
- E2E проверяют критические пользовательские пути, а не каждую ветку утилит;
- DOM snapshots не заменяют точечные assertions;
- визуальные snapshots не заменяют функциональные E2E-тесты;
- изменение snapshot допускается только после осознанного review diff.

### 17.2 Установка

```bash
npm install -D \
  vitest \
  @vitest/coverage-v8 \
  jsdom \
  @testing-library/dom \
  @testing-library/jest-dom \
  @testing-library/user-event \
  @playwright/test \
  @axe-core/playwright

npx playwright install --with-deps
```

Версии фиксируются через lockfile. Major-обновления Vitest, Playwright и Astro не объединять в один pull request с обновлением snapshots.

### 17.3 `vitest.config.ts`

Astro предоставляет `getViteConfig()`, поэтому Vitest должен наследовать aliases, plugins и остальные Vite-настройки проекта.

```typescript
/// <reference types="vitest/config" />

import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    globals: false,
    environment: 'node',
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    include: [
      'tests/unit/**/*.test.ts',
      'tests/integration/**/*.test.ts',
      'tests/snapshot/**/*.test.ts',
    ],
    exclude: [
      'tests/e2e/**',
      'node_modules/**',
      'dist/**',
    ],
    restoreMocks: true,
    clearMocks: true,
    unstubGlobals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/scripts/**/*.ts', 'src/utils/**/*.ts'],
      exclude: [
        '**/*.d.ts',
        '**/*.config.*',
        'src/env.d.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 75,
      },
    },
  },
});
```

`.astro`-компоненты проверяются семантическими и визуальными тестами через Playwright на production build, но не включаются искусственно в процент покрытия. Coverage gate применяется прежде всего к исполняемой TypeScript-логике.

### 17.4 Общая настройка Vitest

```typescript
// tests/setup/vitest.setup.ts
import '@testing-library/jest-dom/vitest';

// Здесь размещать только глобально безопасные mocks.
// Не добавлять глобальный mock fetch/localStorage, если он нужен одному тесту.
```

### 17.5 Unit-тесты

Чтобы unit-тесты не зависели от DOM, вычисления отделяются от браузерного адаптера. Например, `fitFrame.ts` разделяется на чистую функцию и функцию применения результата:

```typescript
// src/scripts/fitFrame.ts
export interface FrameTransform {
  scale: number;
  x: number;
  y: number;
  css: string;
}

export function calculateFrameTransform(
  viewportWidth: number,
  viewportHeight: number,
  frameWidth = 1920,
  frameHeight = 1080,
): FrameTransform {
  const scale = Math.min(viewportWidth / frameWidth, viewportHeight / frameHeight);
  const safeScale = Number.isFinite(scale) && scale > 0 ? scale : 1;
  const x = (viewportWidth - frameWidth * safeScale) / 2;
  const y = (viewportHeight - frameHeight * safeScale) / 2;

  return {
    scale: safeScale,
    x,
    y,
    css: `translate(${x}px, ${y}px) scale(${safeScale})`,
  };
}
```

```typescript
// tests/unit/fitFrame.test.ts
import { describe, expect, it } from 'vitest';
import { calculateFrameTransform } from '@/scripts/fitFrame';

describe('calculateFrameTransform', () => {
  it('вписывает 1920×1080 без масштабирования', () => {
    expect(calculateFrameTransform(1920, 1080)).toEqual({
      scale: 1,
      x: 0,
      y: 0,
      css: 'translate(0px, 0px) scale(1)',
    });
  });

  it('вычисляет transform для cinematic desktop viewport', () => {
    const result = calculateFrameTransform(1440, 900);

    expect(result.scale).toBeCloseTo(0.75);
    expect(result.x).toBeCloseTo(0);
    expect(result.y).toBeGreaterThan(0);
  });
});
```

Минимальный unit-набор:

| Модуль | Обязательные проверки |
|---|---|
| `fitFrame.ts` | desktop transform, breakpoint flow/cinematic, нулевые/невалидные размеры, очистка transform |
| `worksFilter.ts` | поиск без учёта регистра, категории, сортировка ASC/DESC, пустой результат |
| валидация формы | обязательные поля, email, trimming, максимальная длина |
| `pageTransition.ts` | visited-state, отсутствие `localStorage`, reduced motion |
| mapper tech-иконок | известная технология, custom sprite, fallback |

### 17.6 Integration-тесты

Astro-компоненты проверяются в составе собранных production-страниц через Playwright, а клиентские TypeScript-модули — в JSDOM.

Integration-тесты делятся на два типа.

#### A. DOM integration через Vitest + JSDOM

Клиентский модуль инициализируется на минимальной семантической разметке. Для такого файла явно задаётся окружение JSDOM.

```typescript
/** @vitest-environment jsdom */

// tests/integration/mobileNav.test.ts
import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/dom';
import { beforeEach, describe, expect, it } from 'vitest';
import { initMobileNav } from '@/scripts/mobileNav';

describe('mobile navigation', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="menuButton" aria-expanded="false" aria-controls="mobileNav">
        Меню
      </button>
      <nav id="mobileNav" aria-label="Мобильная навигация">
        <a href="/works">Работы</a>
      </nav>
    `;
  });

  it('открывается кнопкой и закрывается по Escape', async () => {
    const user = userEvent.setup();
    initMobileNav();

    await user.click(screen.getByRole('button', { name: 'Меню' }));
    expect(screen.getByRole('button', { name: 'Меню' })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('navigation')).toHaveClass('is-open');

    await user.keyboard('{Escape}');
    expect(screen.getByRole('navigation')).not.toHaveClass('is-open');
  });
});
```

#### B. Page integration через Playwright

Серверная Astro-разметка, Content Collections, компоненты, иконки и клиентские скрипты проверяются вместе на запущенном production build.

```typescript
// tests/e2e/works.integration.spec.ts
import { expect, test } from '@playwright/test';

test('карточка проекта содержит контрактные атрибуты', async ({ page }) => {
  await page.goto('/works');

  const card = page.locator('.project-card').filter({ hasText: 'AUTOAPP' });
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute('data-category', 'web');
  await expect(card).toHaveAttribute('data-year', '2026');
});

test('custom SVG symbols подключены по одному разу', async ({ page }) => {
  await page.goto('/about');

  await expect(page.locator('#icon-pinia')).toHaveCount(1);
  await expect(page.locator('#icon-chart-js')).toHaveCount(1);
  await expect(page.locator('#icon-rest-api')).toHaveCount(1);
});
```

Обязательные integration-сценарии:

- `TopBar` выставляет правильный `aria-current="page"`;
- `ProjectCard` корректно сериализует `data-*` для фильтра;
- `IconSprite` содержит уникальные `icon-pinia`, `icon-chart-js`, `icon-rest-api`;
- mobile nav: toggle, Escape, click-outside, повторная инициализация после `astro:page-load`;
- Works: поиск + категория + сортировка работают одновременно;
- Case modal: open/close, focus return, Escape, недоступность фонового контента;
- Contact form: ошибки, успешное состояние, повторная отправка, network failure;
- reduced-motion отключает JS-запуск glitch-анимаций.

### 17.7 Snapshot-тесты

Используются два разных типа snapshots.

#### A. Структурные snapshots через Vitest

Подходят только для небольших детерминированных результатов чистой TypeScript-логики: нормализованного поискового индекса, view-model карточки, конфигурационного manifest или сериализованных метаданных. Полный HTML Astro-компонентов и страниц в Vitest snapshots не сохраняется.

```typescript
// tests/snapshot/worksIndex.snapshot.test.ts
import { expect, it } from 'vitest';
import { buildProjectSearchIndex } from '@/scripts/worksFilter';
import { worksFixture } from '../fixtures/works';

it('не меняет структуру поискового индекса без review', () => {
  const index = buildProjectSearchIndex(worksFixture);
  expect(index).toMatchSnapshot();
});
```

Для Astro-разметки вместо HTML snapshot используются:

- точечные семантические assertions в Playwright;
- проверка атрибутов, ролей и текста;
- visual screenshots для pixel-perfect регрессий.

Обновление только структурных snapshots:

```bash
npm run test:snapshot -- --update
```

#### B. Visual snapshots через Playwright

Для pixel-perfect проекта это основной регрессионный слой. Playwright делает эталонный screenshot при первом запуске и сравнивает следующие результаты с baseline.

```typescript
// tests/e2e/pages.visual.spec.ts
import { expect, test } from '@playwright/test';

const pages = [
  ['home', '/'],
  ['works', '/works'],
  ['about', '/about'],
  ['process', '/process'],
  ['contacts', '/contacts'],
] as const;

for (const [name, path] of pages) {
  test(`${name} desktop`, async ({ page }) => {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);

    await expect(page).toHaveScreenshot(`${name}-1920x1080.png`, {
      animations: 'disabled',
      caret: 'hide',
      fullPage: true,
      maxDiffPixelRatio: 0.003,
    });
  });
}
```

Правила visual snapshots:

- baseline генерируется и проверяется в одном pinned CI-окружении;
- visual suite запускается только в pinned Chromium;
- viewport, device scale factor, locale, timezone и шрифты фиксируются;
- анимации и caret отключаются;
- реальные даты, случайные данные и внешние ответы не попадают в screenshot;
- PNG-baselines хранятся в Git рядом с visual spec;
- diff-артефакты загружаются из CI при падении;
- обновление `--update-snapshots` выполняется отдельным commit и проходит ручной review.

### 17.8 `playwright.config.ts`

Функциональные E2E выполняются в Chromium, Firefox, WebKit и mobile Chromium. Визуальные snapshots — только в отдельном Chromium-проекте.

```typescript
import { defineConfig, devices } from '@playwright/test';

const isCI = Boolean(process.env.CI);
const visualPattern = /.*\.visual\.spec\.ts/;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI
    ? [['line'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],

  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.003,
    },
  },

  use: {
    baseURL: 'http://127.0.0.1:4321',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'ru-RU',
    timezoneId: 'Europe/Berlin',
  },

  projects: [
    {
      name: 'chromium',
      testIgnore: visualPattern,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      testIgnore: visualPattern,
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      testIgnore: visualPattern,
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'mobile-chromium',
      testIgnore: visualPattern,
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'visual-chromium',
      testMatch: visualPattern,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        reducedMotion: 'reduce',
      },
    },
  ],

  webServer: {
    command: 'npm run preview:test',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: !isCI,
    timeout: 120_000,
  },
});
```

### 17.9 E2E-сценарии

| Область | Обязательные сценарии |
|---|---|
| Smoke | все 5 маршрутов отвечают без 4xx/5xx, нет uncaught exceptions и console errors |
| Навигация | desktop/mobile nav, активный пункт, browser back/forward, прямой переход по URL |
| View Transitions | переход завершает навигацию, контент новой страницы доступен, reduced motion не блокирует переход |
| Works | поиск, категории, сортировка, пустое состояние, modal, keyboard control |
| Contacts | client/server validation, honeypot, rate limit, SMTP success/error, защита от двойного submit и no-JS submit |
| Accessibility | Tab order, Escape, focus-visible, accessible names, Axe scan без critical/serious violations |
| Responsive | 360, 390, 430, 820, 1024, 1366, 1440, 1920 px |
| Storage | CTA visited-state, недоступный `localStorage`, состояние после SPA-навигации |
| Motion | normal motion и `prefers-reduced-motion: reduce` |

Пример проверки фильтра Works:

```typescript
// tests/e2e/works.spec.ts
import { expect, test } from '@playwright/test';

test('фильтрует проекты по поиску и категории', async ({ page }) => {
  await page.goto('/works');

  await page.getByRole('searchbox', { name: /поиск/i }).fill('AUTOAPP');
  await page.getByRole('button', { name: /web/i }).click();

  await expect(page.getByRole('heading', { name: 'AUTOAPP' })).toBeVisible();
  await expect(page.locator('.project-card:visible')).toHaveCount(1);
});
```

В обычных E2E реальный SMTP не вызывается: email transport и Astro Action boundary подменяются тестовым transport/mocks. Отдельный staging smoke-test выполняет одну контролируемую отправку на тестовый адрес и проверяет доставку без логирования содержимого письма.

### 17.10 Accessibility в E2E

```typescript
// tests/e2e/accessibility.spec.ts
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('works не содержит critical/serious a11y-нарушений', async ({ page }) => {
  await page.goto('/works');

  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();

  const blocking = results.violations.filter(
    ({ impact }) => impact === 'critical' || impact === 'serious',
  );

  expect(blocking).toEqual([]);
});
```

Axe не заменяет ручную keyboard-проверку и проверку screen reader semantics.

### 17.11 Скрипты `package.json`

```json
{
  "scripts": {
    "dev": "astro dev",
    "check": "astro check",

    "lint": "npm run lint:eslint && npm run lint:css && npm run format:check",
    "lint:eslint": "eslint . --max-warnings=0",
    "lint:eslint:fix": "eslint . --fix --max-warnings=0",
    "lint:css": "stylelint \"src/**/*.{css,astro}\" --max-warnings=0",
    "lint:css:fix": "stylelint \"src/**/*.{css,astro}\" --fix --max-warnings=0",
    "format": "prettier . --write",
    "format:check": "prettier . --check",
    "fix": "npm run lint:eslint:fix && npm run lint:css:fix && npm run format",

    "build": "astro check && astro build",
    "preview": "astro preview",
    "preview:test": "astro build && astro preview --host 127.0.0.1 --port 4321",

    "test": "vitest run",
    "test:watch": "vitest",
    "test:unit": "vitest run tests/unit",
    "test:integration": "vitest run tests/integration",
    "test:snapshot": "vitest run tests/snapshot",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:update": "playwright test --project=visual-chromium --update-snapshots",

    "validate": "npm run format:check && npm run lint:eslint && npm run lint:css && npm run check && npm run test:coverage && npm run test:e2e"
  }
}
```

`astro build` не считается заменой `astro check`. Production deploy разрешён только после успешного `npm run validate`.

### 17.12 CI quality gates

Каждый pull request должен пройти:

1. `npm ci`;
2. `npm run format:check`;
3. `npm run lint:eslint`;
4. `npm run lint:css`;
5. `astro check`;
6. unit + JSDOM integration + structural snapshots;
7. coverage thresholds;
8. production build;
9. Playwright E2E;
10. visual regression в pinned Chromium;
11. загрузку `playwright-report`, `test-results` и screenshot diff при падении.

Рекомендуемая политика:

- PR блокируется при любом упавшем функциональном тесте;
- visual diff не обновляется автоматически;
- flaky-тест нельзя просто увеличить таймаутом — сначала устранить источник недетерминизма;
- `test.only`, `describe.only` и пропущенные critical-сценарии запрещены в CI;
- для release/deploy запускать полный `npm run validate`;
- staging smoke-test контактной Action выполняется после деплоя с отдельным тестовым SMTP-получателем; массовые и production-адреса в CI не используются.

### 17.13 Что не тестировать snapshots

Не создавать snapshots для:

- HTML Astro-компонента или всей страницы целиком;
- времени, дат, случайных ID и build hash;
- анимационного кадра в произвольный момент;
- стороннего SVG-кода из Lucide/Iconify, если библиотечная иконка не изменялась локально;
- каждого viewport на каждом браузере;
- CSS-классов как единственного доказательства пользовательского поведения.

---

## 18. Frontend production-контракты

### 18.1 Responsive и layout

Cinematic frame `1920 × 1080` является desktop-композицией, а не универсальным способом адаптации.

| Диапазон | Режим | Поведение |
|---|---|---|
| `≥ 1280px` | cinematic | `fitFrame()` масштабирует и центрирует frame 1920×1080 |
| `820–1279px` | tablet flow | transform отсутствует; сетки и блоки перестраиваются CSS |
| `≤ 819px` | mobile flow | одна колонка, естественный scroll, отдельная mobile-композиция |

Обязательные правила:

- отсутствие горизонтального overflow на 320–430px;
- `min-height: 100dvh` с разумным fallback, где нужен экранный блок;
- учёт `env(safe-area-inset-*)` для fixed/overlay элементов;
- минимальный читаемый body-text — 16 CSS px без искусственного `transform: scale()`;
- интерактивные цели — не меньше 24×24 CSS px, проектный ориентир 44×44;
- layout должен выдерживать увеличение текста до 200%;
- portrait и landscape проверяются отдельно;
- container queries допустимы для независимых карточек и controls;
- mobile — полноценный layout, а не уменьшенная desktop-картинка.

Viewport acceptance matrix: `360`, `390`, `430`, `820`, `1024`, `1280`, `1366`, `1440`, `1920`.

### 18.2 Component conventions

- один компонент решает одну задачу;
- props всегда типизированы;
- стандартные HTML-атрибуты пробрасываются через `...rest`;
- reusable-компонент не должен знать текущий route или содержимое конкретной страницы;
- CSS-классы не используются как стабильный JS/API-контракт;
- для поведения применяются `data-js`, `data-action`, `data-state`; `data-testid` — только для тестов без семантического селектора;
- `id` используется только для уникальных связей: label/control, aria-controls, fragment, SVG symbol;
- `<button>` используется для действий, `<a>` — для навигации;
- глобальные стили ограничены reset, tokens, typography и shell; стили компонентов scoped;
- `z-index` берётся из токенов (`--z-base`, `--z-nav`, `--z-modal`, `--z-toast`), а не задаётся случайными числами.

```astro
---
import type { HTMLAttributes } from 'astro/types';

interface Props extends HTMLAttributes<'button'> {
  variant?: 'primary' | 'ghost';
  loading?: boolean;
}

const {
  variant = 'primary',
  loading = false,
  disabled: disabledProp = false,
  class: className,
  ...rest
} = Astro.props;
---

<button
  {...rest}
  class:list={['button', `button--${variant}`, className]}
  aria-busy={loading}
  disabled={loading || disabledProp}
>
  <slot />
</button>
```

### 18.3 Политика клиентского JavaScript

Принцип: **HTML/CSS сначала, JavaScript только для необходимой интерактивности**.

- React/Vue/Svelte island не подключается ради modal, фильтра или одной кнопки;
- UI-фреймворк добавляется только при подтверждённой сложности состояния;
- чистые вычисления выносятся в `src/utils`, DOM-адаптеры остаются в `src/scripts`;
- тяжёлые модули загружаются динамически только на нужном route;
- сторонние analytics/chat-скрипты не блокируют LCP;
- каждое увеличение client bundle требует review причины;
- сайт должен сохранять основное чтение и навигацию без JavaScript; фильтры и enhanced submit могут прогрессивно улучшаться.

Проектные бюджеты client JS:

| Страница | Максимальный initial JS, gzip |
|---|---:|
| Главная | 40 KB |
| Works | 70 KB |
| About / Process / Contacts | 40 KB |

### 18.4 Lifecycle при `ClientRouter`

- инициализация выполняется на `astro:page-load`;
- `init*()` должна быть идемпотентной или возвращать cleanup;
- глобальные listeners используют `AbortController` либо явно удаляются;
- таймеры/RAF очищаются перед повторной инициализацией;
- нельзя создавать собственный дублирующий route announcer;
- состояние, которое должно переживать навигацию, хранится в URL/sessionStorage, а не в случайной переменной модуля;
- после navigation проверяется восстановление focus и отсутствие duplicate listeners.

### 18.5 Accessibility contract — WCAG 2.2 AA

Обязательные требования:

- skip-link «Перейти к содержимому» первым focusable-элементом;
- один `<main id="main-content">` на страницу;
- последовательная иерархия `h1`–`h3`;
- видимый `:focus-visible`, который не удаляется глобальным reset;
- все функции доступны с клавиатуры;
- `CaseModal`: `role="dialog"`, `aria-modal="true"`, accessible name, focus trap, Escape, возврат фокуса opener-элементу;
- фон modal становится недоступным для фокуса/assistive technology;
- copy/submit status сообщается через `aria-live="polite"`;
- ошибки формы связаны с полями через `aria-describedby` и `aria-invalid`;
- placeholder не заменяет `<label>`;
- цвет не является единственным носителем статуса;
- контраст текста/controls соответствует AA;
- reduced motion отключает glitch, orbit, scan и smooth movement;
- поддерживается `forced-colors: active` без потери controls/focus;
- touch targets не меньше 24×24 CSS px;
- автоматический Axe дополняется ручной keyboard-проверкой и smoke-проверкой NVDA+Chrome / VoiceOver+Safari.

### 18.6 Performance budgets

Performance gate проверяется не только Lighthouse score, но и измеримыми ограничениями.

| Метрика / ресурс | Бюджет |
|---|---:|
| LCP | ≤ 2.5 s |
| INP | ≤ 200 ms |
| CLS | ≤ 0.1 |
| Initial JS | по лимитам раздела 18.3 |
| Initial CSS gzip | ≤ 50 KB |
| Hero/LCP image | ≤ 300 KB в современном формате |
| Общий initial page weight | ≤ 1.5 MB без video |

Правила:

- Core Web Vitals оцениваются отдельно для mobile и desktop;
- все изображения имеют dimensions/aspect-ratio;
- LCP asset preload/high priority используется только после измерения;
- шрифты self-hosted в WOFF2, `font-display: swap`;
- preload разрешён только для реально критического начертания;
- не загружать несколько дублирующих весов шрифта;
- layout и animation не должны провоцировать forced synchronous layout в цикле;
- в CI рекомендуется bundle-size check и Lighthouse CI либо эквивалентный performance smoke-test.

### 18.7 Prefetch policy

Поскольку `ClientRouter` может prefetch links, проект явно использует opt-in policy:

- основной CTA и top navigation: `data-astro-prefetch="hover"`;
- mobile links: `tap` допустим для экономии трафика;
- внешние URL, GitHub, Telegram, email: без prefetch;
- карточки проектов не prefetch-ятся автоматически;
- `prefetchAll: false` фиксируется в Astro config;
- поведение проверяется при `Save-Data`/slow connection без требования заранее скачать все routes.

### 18.8 UI states и error handling

Каждый интерактивный модуль реализует состояния, а не только happy path.

**Works:** initial, active filter, active search, combined filter+sort, no results, missing cover, archived project, broken external link.

**Contact form:** idle, invalid, submitting, success, server error, timeout, offline, rate limited, repeated submit, no-JS fallback.

**Общие:** 404, unavailable external resource, images disabled, JS disabled, reduced motion, high contrast, storage unavailable.

Правила:

- submit блокируется на время запроса;
- network error не очищает введённые данные;
- success/error не показываются только цветом;
- empty state содержит понятное действие «Сбросить фильтры»;
- внешние ссылки валидируются при build/CI отдельным link checker или scheduled check.

### 18.9 CSS architecture

```css
@layer reset, tokens, base, layout, components, utilities, overrides;
```

- tokens — единственный источник цветов, typography, spacing, radii, motion, shadows и z-index;
- spacing задаётся шкалой `--space-*`;
- logical properties (`margin-inline`, `padding-block`) предпочтительнее физических;
- media/container queries находятся рядом с компонентом;
- JS-состояния называются `.is-*` или `[data-state="..."]`;
- animation/keyframes получают namespace `andyvi-*`;
- `!important` запрещён, кроме документированного third-party/UA override;
- magic numbers из pixel-perfect прототипа сопровождаются комментарием о назначении;
- визуальный слой не должен менять DOM order в ущерб keyboard/screen-reader order;
- Prettier отвечает за whitespace/переносы/единый формат CSS; Stylelint — за ошибки, дубли, неизвестные свойства и архитектурные CSS-правила; их зоны ответственности не дублируются.

#### Политика современного CSS

- отдельный CSS transformer не подключается: в `astro.config.mjs` нет `vite.css.transformer`;
- `oklch()`, CSS custom properties, logical properties, cascade layers, container queries и современный media-query syntax используются нативно в пределах заявленной browser support policy;
- production-сборка и CSS-минификация остаются ответственностью стандартного пайплайна Astro/Vite;
- `oklch()` не является самостоятельной причиной добавлять transpilation-зависимость;
- fallback-декларации добавляются вручную только для действительно критичного свойства и только при появлении подтверждённого требования поддерживать браузер вне текущей support matrix;
- browser compatibility проверяется функциональными Playwright-тестами в Chromium, Firefox и WebKit, а не предположением, что любой современный CSS нужно заранее транспилировать;
- новый CSS-transformer или PostCSS-плагин допускается только после фиксации конкретной несовместимости, целевых браузеров и ожидаемого результата в отдельном ADR/изменении спеки.

Пример допустимого точечного fallback, если он когда-либо понадобится:

```css
:root {
  --accent: #7ccff5;
  --accent: oklch(74% 0.12 225);
}
```

В текущей матрице поддержки такой fallback по умолчанию не требуется.

### 18.10 Browser support и progressive enhancement

Поддерживаются актуальные стабильные Chrome, Edge, Firefox, Safari и актуальный iOS Safari.

- функциональная корректность обязательна во всех целевых браузерах;
- pixel-perfect visual baseline фиксируется в Chromium;
- Safari/WebKit и Firefox проходят функциональные E2E;
- браузер без native View Transitions получает функциональную навигацию и fallback без обязательной визуальной идентичности анимации;
- старый браузер может потерять glitch/blur/decor effects, но не контент и controls;
- browser support не формулируется через устаревающий номер вида «Firefox < N».

### 18.11 Security и privacy

- клиентская валидация формы не считается защитой; Astro Action повторно валидирует все данные через `astro/zod`;
- honeypot и bounded in-memory rate limit обязательны в первом production-релизе;
- Turnstile/CAPTCHA подключается только после подтверждённого abuse и обязательно проверяется server-side;
- SMTP credentials и адрес получателя не помещаются в `PUBLIC_*`; в клиент доступны только намеренно публичные значения;
- пользовательский ввод не вставляется через `set:html`/`innerHTML` и отправляется в plain-text письме;
- внешние ссылки с новым окном получают безопасный `rel`;
- security headers задаются на hosting layer: `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, frame policy;
- CSP сначала включается в Report-Only и проверяется вместе с `ClientRouter`, inline styles/scripts, analytics и Iconify output;
- analytics/cookies подключаются только после принятия privacy policy и, когда требуется, consent flow;
- staging и preview не индексируются.

### 18.12 SEO contract

Для каждого route:

- уникальные `title` и `description`;
- canonical URL без filter/search query;
- Open Graph title/description/image и `twitter:card`;
- `lang="ru"`, корректный viewport и theme-color;
- production `robots.txt`, staging `noindex, nofollow`;
- `sitemap.xml` содержит только canonical production routes;
- брендированная `404.astro` возвращает понятную навигацию;
- JSON-LD: `Person` + `WebSite`; для case pages — `CreativeWork` или подходящий тип;
- route проекта формируется как `/works/<slug>/`, если появляются отдельные кейсы;
- изображения OG проверяются в размере 1200×630 и не зависят от client JS.

### 18.13 Code quality и editor contract

Используются три независимых инструмента с разными зонами ответственности:

- **ESLint** — ошибки и semantic rules в JavaScript, TypeScript и Astro scripts/templates;
- **Prettier** — единое форматирование JS, TS, Astro, CSS, JSON, Markdown и YAML;
- **Stylelint** — корректность CSS-файлов и `<style>`-блоков внутри `.astro`;
- `astro check` — диагностика Astro templates и TypeScript;
- `.editorconfig` — базовые настройки редактора: UTF-8, LF, final newline, 2 spaces;
- warnings в CI считаются ошибками;
- неиспользуемые `eslint-disable`/`stylelint-disable` запрещены; любое подавление сопровождается комментарием причины.

`@stylistic/eslint-plugin` не используется: formatting-правила ESLint пересекаются с Prettier и создают два источника правды. `eslint-config-prettier` подключается последним и отключает конфликтующие stylistic-правила ESLint.

Установка:

```bash
npm install -D \
  eslint@^10 \
  @eslint/js \
  typescript-eslint \
  eslint-plugin-astro \
  eslint-plugin-jsx-a11y \
  eslint-config-prettier \
  prettier \
  prettier-plugin-astro \
  stylelint \
  stylelint-config-standard \
  postcss-html
```

#### ESLint Flat Config

```js
// eslint.config.mjs
import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier/flat';
import astro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default defineConfig(
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'public/**',
    ],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,mts,cts}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports' },
      ],
    },
  },
  ...astro.configs['jsx-a11y-recommended'],
  {
    files: ['**/*.astro'],
    rules: {
      'astro/no-set-html-directive': 'error',
      'astro/no-unused-css-selector': 'warn',
      'astro/prefer-class-list-directive': 'warn',
    },
  },
  // Последним: отключает ESLint-правила, конфликтующие с Prettier.
  eslintConfigPrettier,
);
```

#### Prettier

```js
// prettier.config.mjs
/** @type {import('prettier').Config} */
export default {
  plugins: ['prettier-plugin-astro'],
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  bracketSameLine: false,
  overrides: [
    {
      files: '*.astro',
      options: {
        parser: 'astro',
      },
    },
  ],
};
```

`.prettierignore`:

```gitignore
dist
coverage
playwright-report
test-results
public
package-lock.json
**/__snapshots__/**
**/*-snapshots/**
```

#### Stylelint

```js
// stylelint.config.mjs
export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: [
    'dist/**',
    'coverage/**',
    'playwright-report/**',
    'test-results/**',
    'public/**',
  ],
  overrides: [
    {
      files: ['**/*.astro'],
      customSyntax: 'postcss-html',
    },
  ],
  rules: {
    // Pixel-perfect классы и design-token names не ограничиваются kebab-pattern.
    'selector-class-pattern': null,
    'custom-property-pattern': null,
    // Разрешены современные Astro/View Transitions pseudo-elements.
    'selector-pseudo-element-no-unknown': [
      true,
      {
        ignorePseudoElements: ['view-transition', 'view-transition-group', 'view-transition-image-pair', 'view-transition-old', 'view-transition-new'],
      },
    ],
  },
};
```

Stylelint не используется для форматирования пробелов и переносов — это зона Prettier. Его задача: неизвестные свойства/значения, дубли деклараций и селекторов, ошибки синтаксиса и согласованные CSS-ограничения.

Команды:

```bash
npm run lint             # ESLint + Stylelint + Prettier check
npm run lint:eslint      # semantic lint JS/TS/Astro
npm run lint:css         # CSS и <style> в Astro
npm run format:check     # формат без изменения файлов
npm run fix              # безопасные autofix + финальный Prettier format
```

Для VS Code добавить `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "eslint.validate": [
    "javascript",
    "typescript",
    "astro"
  ],
  "stylelint.validate": [
    "css",
    "astro"
  ],
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit",
    "source.fixAll.stylelint": "explicit"
  },
  "[astro]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

Рекомендуемые расширения в `.vscode/extensions.json`:

```json
{
  "recommendations": [
    "astro-build.astro-vscode",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "stylelint.vscode-stylelint"
  ]
}
```

Definition of Done для frontend-изменения:

1. `npm run fix` выполнен локально;
2. `format:check`, ESLint, Stylelint и typecheck проходят без warnings;
3. добавлены/обновлены тесты;
4. responsive и keyboard behavior проверены;
5. visual diff просмотрен;
6. performance/security budgets не ухудшены без зафиксированного решения.

### 18.14 Git, CI/CD и dependency policy

Workflow:

```text
feature branch → Pull Request → CI → preview deploy → visual/a11y review → merge → production
```

- каждый PR получает preview deployment;
- preview/staging имеет `noindex`;
- CI использует Node.js `24.17.0` из `.nvmrc` и `npm ci`;
- production deploy блокируется при падении `validate`;
- coverage, Playwright report, traces и visual diffs сохраняются как artifacts;
- Dependabot/Renovate создаёт отдельные dependency PR;
- major Astro/Playwright/Vitest updates не смешиваются с feature work;
- visual snapshots обновляются отдельным осознанным коммитом;
- security audit выполняется регулярно, но автоматический `npm audit fix --force` запрещён;
- rollback должен быть возможен возвратом на предыдущий успешный deployment.

### 18.15 UI-архитектура и политика подключения фреймворков

Базовый UI-слой проекта:

```text
Astro-компоненты
+ CSS Variables и Cascade Layers
+ scoped CSS в .astro
+ семантический HTML
+ TypeScript для необходимой интерактивности
+ astro-icon / Lucide / Iconify logos
```

Полноценный UI-kit или клиентский UI-фреймворк **не является зависимостью проекта по умолчанию**. Причина — готовый pixel-perfect прототип с собственной визуальной системой: HUD-графикой, glitch-анимациями, нестандартными рамками, cinematic layout и design tokens. Подключение Bootstrap, Material UI, PrimeVue, Vuetify, DaisyUI или аналогичного набора создаст больше override-кода, чем переиспользуемой ценности.

#### Базовые правила

- визуальные компоненты реализуются как `.astro`-компоненты со scoped CSS;
- сначала применяются нативные элементы: `<button>`, `<a>`, `<dialog>`, `<details>`, формы и стандартные DOM API;
- modal, фильтр, сортировка, mobile menu и copy-action не являются достаточной причиной подключать React/Vue/Svelte;
- новый UI-пакет должен решать конкретную задачу, которую нерационально поддерживать нативно;
- нельзя одновременно смешивать несколько UI-систем или utility-first и component-kit без отдельного архитектурного решения;
- внешний компонент обязан поддерживать SSR/static rendering, keyboard navigation и WCAG 2.2 AA;
- после подключения проверяются client bundle, hydration cost, visual regression и поведение без JavaScript.

#### Tailwind CSS 4

Tailwind не входит в baseline и не устанавливается при переносе существующего HTML-прототипа. Большая часть CSS уже определена, поэтому массовое переписывание в utility-классы не даёт пропорциональной выгоды.

Tailwind допустим только если:

- layout и компоненты проектируются заново, а не переносятся pixel-perfect;
- команда сознательно выбирает utility-first как единый CSS-подход;
- принято решение мигрировать целый слой, а не добавить Tailwind ради нескольких `flex`, `grid` и `gap`;
- не возникает двух конкурирующих источников spacing, colors и breakpoints;
- решение оформлено отдельным изменением спеки/ADR.

Даже при Tailwind сложные glitch/HUD/diagram стили остаются в обычном CSS.

#### Vue island

`@astrojs/vue` допускается точечно для изолированного интерактивного модуля, если одновременно появляются несколько признаков сложности:

- несколько взаимозависимых фильтров и сортировок;
- синхронизация состояния с URL;
- асинхронная загрузка, pagination или optimistic updates;
- сложная modal/state machine;
- значительный объём реактивного состояния, который становится трудно сопровождать на DOM API.

В этом случае island должен иметь чёткую границу и загружаться подходящей директивой, например `client:visible` или `client:idle`. Перевод всего сайта на Vue из-за одного модуля запрещён.

#### React и shadcn/ui

`shadcn/ui` не используется как основа проекта: его Astro-сценарий требует React и Tailwind, добавляет клиентский runtime и визуальную систему, не совпадающую с прототипом. Точечное подключение допускается только для действительно сложного accessibility-примитива, если нативная реализация и более лёгкая headless-библиотека объективно хуже.

#### Критерии принятия новой UI-зависимости

Перед добавлением библиотеки в Pull Request фиксируются:

1. задача, которую она решает;
2. почему нативный Astro/HTML/CSS/TypeScript-вариант недостаточен;
3. размер production-зависимости и client bundle delta;
4. необходимость hydration и выбранная `client:*`-директива;
5. SSR/static compatibility;
6. accessibility и keyboard contract;
7. impact на design tokens и pixel-perfect fidelity;
8. план тестирования и удаления зависимости при отказе.

Если выгода не превышает стоимость runtime, overrides и сопровождения, компонент реализуется нативно.

### 18.16 Что намеренно не добавляется

На текущем масштабе не требуются:

- сторонний UI-kit по умолчанию;
- Tailwind CSS только ради базовых layout utilities;
- full-site React/Vue/Svelte integration;
- глобальный state manager;
- Storybook до появления реальной библиотеки переиспользуемых компонентов;
- PWA/service worker;
- отдельный backend-сервис, БД, ORM и очередь только ради контактной формы;
- сложная CMS;
- микрофронтенды;
- Docker и CAPTCHA/Turnstile без подтверждённой необходимости.


---

## 19. Чеклист реализации

### Фаза 0 — Подготовка

- [ ] `npm create astro@latest` → выбрать Empty + TypeScript (Strict)
- [ ] Установить зависимости: `@astrojs/node`, `nodemailer`, `@types/nodemailer`, sitemap, иконки, `@astrojs/check`, ESLint + TypeScript/Astro/A11Y plugins, Prettier + Astro plugin, Stylelint + PostCSS syntax, Vitest, Testing Library, Playwright и Axe
- [ ] Не устанавливать UI-kit, Tailwind или клиентский framework без прохождения критериев раздела 18.15
- [ ] Перенести `brand-spec.md` токены → `tokens.css`
- [ ] Перенести все `@keyframes` → `animations.css`
- [ ] Настроить `astro.config.mjs`
- [ ] Не подключать отдельный CSS transformer без подтверждённого browser compatibility требования
- [ ] Зафиксировать Node.js 24.17.0 в `.nvmrc`, `package.json` и CI; package manager — точной версией в `packageManager`
- [ ] Настроить `eslint.config.mjs`, `prettier.config.mjs`, `stylelint.config.mjs`, ignore-файлы, `.editorconfig` и autofix/format-on-save в редакторе
- [ ] Добавить `.github/workflows/ci.yml`, `.env.example`, `deploy/nginx/andyvi.conf` и `deploy/systemd/andyvi.service`

### Фаза 1 — Шелл и навигация

- [ ] `BaseLayout.astro` с `<ClientRouter />` и единичным подключением `<IconSprite />`
- [ ] `PageFrame.astro` (stage-shell + frame + fitFrame)
- [ ] `TopBar.astro` + `MobileNav.astro`
- [ ] `fitFrame.ts` + `mobileNav.ts` — инит через `astro:page-load`
- [ ] `transitions.css` — переопределить `::view-transition-*`
- [ ] Сделать все `init*()` идемпотентными через cleanup/AbortController
- [ ] Проверить: навигация между страницами работает с анимацией и без duplicate listeners
- [ ] Добавить skip-link и единый `<main id="main-content">`

### Фаза 2 — Страницы

- [ ] `index.astro` — Hero, Metrics, CTA, HUD-декор, glitch-анимации
- [ ] `works.astro` — Content Collection, карточки, фильтр, сортировка, modal
- [ ] `about.astro` — LeftStack, TechChips, RightPanel
- [ ] `process.astro` — ProcessHero, ProcessSteps, ProcessDiagram, PhoneChart
- [ ] `contacts.astro` — `prerender = false`, ContactInfo, progressive-enhanced ContactForm и все network states
- [ ] Добавить `actions/contact.ts`, Nodemailer transport, honeypot и bounded in-memory rate limiter
- [ ] Не подключать Turnstile до подтверждённого спама; предусмотреть документированную точку расширения
- [ ] `404.astro`, `robots.txt.ts`, уникальные SEO/OG metadata
- [ ] Добавить единый registry `technologies.ts` и расширенную Works schema
- [ ] Реализовать UI нативными Astro-компонентами; зафиксировать причины любой новой UI-зависимости в PR/ADR

### Фаза 3 — Полировка

- [ ] Перевести PNG → WebP через `<Image>` (LCP + все hero-ассеты)
- [ ] Проверить `prefers-reduced-motion` на всех страницах
- [ ] Проверить иконки: UI через Lucide, tech-логотипы через `logos`, Pinia/Chart.js/REST API через `<use>`
- [ ] Проверить keyboard nav (Tab, Escape, Enter) везде
- [ ] Проверить `aria-current="page"` в nav — динамически из `currentPage` prop
- [ ] Проверить `localStorage` для CTA visited-state (работает после View Transitions)
- [ ] Проверить desktop cinematic и отдельные tablet/mobile flow layouts
- [ ] Проверить WCAG 2.2 AA: skip-link, focus trap, aria-live, errors, 200% zoom, forced colors
- [ ] Проверить performance budgets: LCP/INP/CLS, JS/CSS/image/page weight
- [ ] Проверить responsive `<Picture>`, self-hosted WOFF2 и отсутствие CLS
- [ ] Проверить prefetch policy и external links
- [ ] Lighthouse audit: Performance ≥ 90, Accessibility ≥ 95

### Фаза 4 — Тестирование

- [ ] Настроить `vitest.config.ts`, setup-файл и coverage thresholds
- [ ] Покрыть unit-тестами `fitFrame`, фильтрацию/sort, validation schema, honeypot и rate-limit policy
- [ ] Добавить JSDOM integration-тесты клиентских модулей и Playwright-проверки собранных Astro-страниц
- [ ] Зафиксировать только небольшие структурные Vitest snapshots
- [ ] Добавить Playwright E2E для navigation, Works, Contacts, no-JS submit и keyboard control; SMTP в обычных E2E замокать
- [ ] Создать visual baselines 1920×1080 и ключевых mobile viewport
- [ ] Добавить Axe scan и ручные keyboard-сценарии
- [ ] Настроить CI artifacts для coverage, trace, video и screenshot diff
- [ ] Проверить `npm run validate`

### Фаза 5 — Деплой на Timeweb Cloud

- [ ] Установить Node.js 24.17.0, Nginx и создать отдельного system user на VPS либо выполнить App Platform proof-of-concept
- [ ] Выполнить `npm ci && npm run validate && npm run build`
- [ ] Настроить `@astrojs/node` standalone и запуск `dist/server/entry.mjs`
- [ ] Передать SMTP и остальные secrets через `/etc/andyvi/andyvi.env` или variables App Platform
- [ ] Настроить Nginx reverse proxy, TLS, trusted proxy headers, cache и security headers
- [ ] Установить/включить systemd unit; не запускать одновременно PM2 и systemd
- [ ] Проверить viewport matrix: 360, 390, 430, 820, 1024, 1366, 1440, 1920
- [ ] Подключить домен и настроить `site:` в `astro.config.mjs`
- [ ] После staging deploy выполнить контролируемый SMTP smoke-test контактной Action
- [ ] Проверить `noindex` на preview/staging и canonical/sitemap/robots на production
- [ ] Проверить CSP Report-Only совместно с ClientRouter
- [ ] Зафиксировать release directory, atomic symlink и rollback-процедуру

---

## 20. Потенциальные риски и решения

| Риск | Решение |
|---|---|
| Современная CSS-функция недоступна в браузере вне support matrix | Не расширять build pipeline заранее; при реальном требовании добавить точечный fallback и отдельный cross-browser test |
| `fitFrame()` вызывается до появления DOM после View Transition | Слушать `astro:page-load`, а не `DOMContentLoaded` |
| Glitch-анимации запускаются при каждом SPA-переходе | Запускать только при `astro:page-load`, а не `astro:after-swap` |
| Works-фильтр теряет состояние при навигации | Хранить активную категорию в `sessionStorage` или URL-параметре |
| `localStorage` для CTA-visited не работает в iframe preview | Обернуть в `try/catch` — уже сделано в прототипе |
| Браузер не поддерживает native View Transitions | `ClientRouter`/fallback сохраняет функциональную навигацию; эффект может деградировать без потери контента |
| Visual snapshots отличаются на разных ОС | Генерировать baseline и сравнивать его в одном pinned Chromium/CI-образе |
| Шрифты не успевают загрузиться до screenshot | Дождаться `document.fonts.ready`, self-host шрифтов и фиксировать окружение |
| Snapshot содержит нестабильные даты, ID или порядок данных | Snapshot только детерминированного результата чистой функции; входные fixtures фиксировать |
| E2E формы отправляет реальные письма | Подменять Nodemailer transport/Action boundary; один контролируемый SMTP smoke-test выполнять только на staging |
| Покрытие растёт за счёт тривиальных строк | Coverage gate применять к бизнес-логике и проверять качество сценариев на review |
| Flaky visual test из-за анимации | `reducedMotion`, `animations: 'disabled'`, фиксированные viewport/locale/timezone и данные |
| `fitFrame()` уменьшает интерфейс на mobile | Вызывать только при `≥1280px`; tablet/mobile используют естественный CSS flow |
| Повторный `astro:page-load` дублирует listeners | `AbortController`, cleanup и integration-тест повторной навигации |
| ClientRouter prefetch скачивает слишком много routes | `prefetchAll: false`, opt-in `hover`/`tap`, external links без prefetch |
| Third-party script ухудшает LCP/INP | async/defer/dynamic load, consent gate и performance review |
| CSP ломает ClientRouter или inline assets | Сначала Report-Only, затем анализ violations и только потом enforcement |
| Preview попадает в поисковый индекс | `noindex`, отдельный robots/header и проверка в deployment smoke-test |
| Content collection содержит неизвестную технологию | Центральный registry + schema/validation test на build |
| UI-framework добавляет лишний runtime и ломает pixel-perfect стили | По умолчанию Astro + scoped CSS; новую UI-зависимость принимать только по критериям раздела 18.15 с bundle/visual/a11y проверкой |
| SMTP временно недоступен или отклоняет письмо | Короткий timeout, нейтральная `SERVICE_UNAVAILABLE` ошибка, structured log без PII и staging health/smoke check |
| Honeypot пропускает продвинутого бота | Дополнять rate limit; Turnstile подключать только после подтверждённого abuse |
| In-memory limiter сбрасывается при restart | Для одного процесса это допустимо; при multi-instance перейти на Redis/shared store |
| Подделка `X-Forwarded-For` обходится rate limit | Node-порт закрыт извне, Nginx перезаписывает proxy headers, доверяется только собственный reverse proxy |
| Node-процесс не поднимается после reboot | systemd unit с `Restart=on-failure`, `systemctl enable`, health/smoke check после deploy |
| Docker усложняет простой deployment | Не использовать до появления нескольких сервисов или container-only требования |

---

### Изменения версии 1.11

- deployment зафиксирован под Timeweb Cloud: основной профиль — VPS с Nginx + systemd, App Platform — managed-альтернатива;
- добавлен `@astrojs/node` в режиме `standalone`, при этом все маршруты, кроме Contacts, остаются пререндеренными;
- контактная форма переведена на Astro Actions + `astro/zod` + Nodemailer + SMTP Timeweb;
- отдельный Express/NestJS-сервис и Docker исключены из базовой архитектуры;
- honeypot и bounded in-memory rate limit закреплены как начальная anti-spam защита;
- Cloudflare Turnstile оставлен только как опция при подтверждённом спаме;
- добавлены `.env.example`, server modules, deployment-конфиги Nginx/systemd и правила secrets;
- обновлены тесты, security contract, deployment checklist и таблица рисков;
- сохранены UI-решения версии 1.10 и frontend production-контракты предыдущих версий.

*Спека составлена по HTML-прототипу от 14 июня 2026 и актуализирована под Astro 6.4.8, Node.js 24.17.0 LTS, Timeweb Cloud, минимальный Astro backend и frontend production-контракты на 20 июня 2026. При изменении дизайна — обновить токены в `tokens.css`, переанализировать затронутые компоненты и осознанно обновить связанные visual snapshots.*
