# Portfolio Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Marc Alain Bustamante's static portfolio site — terminal-flavoured home page, MDX case studies, and a print-ready `/cv` generated from the same typed content — deployable to Vercel.

**Architecture:** Next.js App Router, every route statically generated. Content lives in `content/` (typed TS data + MDX case studies) and is validated with Zod at build time through `lib/` loaders; pages and components only consume validated data. Styling is Tailwind v4 with CSS-variable colour tokens switched by a `.dark` class (next-themes).

**Tech Stack:** Next.js 16.4.x, React 19, TypeScript (strict), Tailwind CSS 4 + `@tailwindcss/typography`, Zod 4, gray-matter, next-mdx-remote 6 (RSC API), next-themes, @vercel/analytics, Vitest 5, Playwright, Prettier, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-08-portfolio-site-design.md`

## Global Constraints

- Node **24** (`.nvmrc` = `24`, `package.json` `engines.node` = `"24.x"`). The machine's default Node is 18.16 and `fnm` is installed at `/opt/homebrew/bin/fnm`. Every shell command in this plan that runs `node`/`npm`/`npx` must be run as `eval "$(fnm env)" && fnm use 24 && <command>` (each Bash call is a fresh shell). Commands below omit this prefix for readability — **always add it**.
- JS/TS strings use single quotes (double only to avoid escaping); template literals for interpolation. Prettier `singleQuote: true`. JSX attributes keep double quotes (Prettier default).
- **The phone number is never rendered anywhere** (home, case studies, `/cv`, metadata, OG images). `profile.phone` is not set in content.
- Accent colour: terminal green — `#4ade80` in dark mode, `#15803d` in light mode (WCAG AA on the light background).
- Fonts: Geist Sans (body) and Geist Mono (headings, labels, tags, prompts) via `next/font/google`.
- All routes are static. No server-only runtime features, no API routes, no contact form, no CMS.
- First visit follows the OS colour scheme (`defaultTheme="system"`); toggle persists the choice.
- All motion is disabled under `prefers-reduced-motion: reduce` and content must be visible without JavaScript.
- `/cv` uses no terminal styling (sans font, no green accent) and prints black-on-white regardless of theme.
- Git commits: plain messages, **no `Co-Authored-By` or "Generated with" attribution lines.**
- Working directory: `/Users/mrcbstmnte/www/portfolio` (git repo already initialised with the spec committed).

## Review Focus

1. **Printing `/cv` while the site is in dark mode** — the PDF must be black text on white with nav and buttons hidden. Pinned by the print-emulation test in Task 8.
2. **Phone-width viewing (360px)** — no page may scroll horizontally (long tech tags, emails, URLs, the timeline). Pinned by the overflow tests in Tasks 6, 7 and 8.
3. **Copy-email where the Clipboard API is unavailable or denied** (http, older browsers) — the email must end up selected with a "press ⌘/Ctrl+C" hint, never a silent no-op. Pinned by the fallback test in Task 6.
4. **First visit with a light OS preference / theme hydration** — page renders light, no hydration-mismatch console errors (including the 404 page's path display). Pinned by the theme and console-error tests in Task 5.
5. **Editing content later** — a private (NDA) case study accidentally given a `repoUrl`, an unquoted numeric `year`, a slug with spaces, or a stray non-MDX file in `content/projects/` must fail the build with a message naming the file (or be ignored, for non-MDX files). Pinned by the schema and loader tests in Tasks 2 and 4.

---

## File Structure

```
.nvmrc                         Node version pin
.prettierrc.json / .prettierignore
package.json                   scripts: dev, build, start, lint, typecheck, test, test:e2e, format
vitest.config.ts               unit test config (node env, @ alias)
playwright.config.ts           e2e config (runs against production build)
.github/workflows/ci.yml       lint → typecheck → unit → build → e2e

content/
  profile.ts                   name, title, tagline, summary, location, years, email, links
  experience.ts                Company[] newest first, roles newest first
  skills.ts                    SkillGroup[]
  education.ts                 Education[]
  projects/*.mdx               case studies (frontmatter + body)

lib/
  schemas.ts                   Zod schemas, inferred types, parseOrThrow
  format.ts                    formatYearMonth, formatRange, displayUrl, toConfigKey
  content.ts                   validated profile/experience/skills/education
  projects.ts                  loadProjects, getAllProjects, getFeaturedProjects, getProject
  experience.ts                splitHighlights
  site.ts                      siteUrl

app/
  layout.tsx                   fonts, ThemeProvider, Nav, metadata, Analytics
  globals.css                  Tailwind, tokens, dark variant, motion, print
  page.tsx                     home (hero + 4 sections)
  not-found.tsx                terminal 404
  opengraph-image.tsx          site OG image
  sitemap.ts / robots.ts
  projects/[slug]/page.tsx     case study
  projects/[slug]/opengraph-image.tsx
  cv/page.tsx                  CV
  cv/print-button.tsx          client: window.print()

components/
  theme-provider.tsx           client wrapper for next-themes
  theme-toggle.tsx             client
  nav.tsx
  missing-path.tsx             client: current pathname for 404
  section.tsx                  section wrapper with "$ command" heading
  tag.tsx
  hero.tsx
  experience-timeline.tsx
  project-card.tsx
  skills-config.tsx
  copy-email.tsx               client
  contact.tsx

tests/unit/*.test.ts           Vitest
tests/e2e/*.spec.ts            Playwright
```

---

### Task 1: Toolchain and Next.js scaffold

**Files:**
- Create: `.nvmrc`, `.prettierrc.json`, `.prettierignore`, `vitest.config.ts`
- Create (via scaffold): `package.json`, `tsconfig.json`, `next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `app/*`, `public/*`, `.gitignore`
- Modify: `package.json` (scripts, engines)

**Interfaces:**
- Produces: npm scripts `dev`, `build`, `start`, `lint`, `typecheck`, `test`, `test:e2e`, `format`; path alias `@/*` → project root.

- [ ] **Step 1: Install and select Node 24**

```bash
cd /Users/mrcbstmnte/www/portfolio
eval "$(fnm env)" && fnm install 24 && fnm use 24 && node -v
```
Expected: prints `v24.x.x`.

- [ ] **Step 2: Scaffold Next.js into a sibling folder and move it in**

The target directory already contains `.git` and `docs/`, so scaffold next door and copy over:

```bash
cd /Users/mrcbstmnte/www
eval "$(fnm env)" && fnm use 24 && npx --yes create-next-app@16.4.5 portfolio-scaffold \
  --ts --tailwind --eslint --app --no-src-dir --import-alias '@/*' --use-npm --yes
rsync -a --exclude .git --exclude node_modules portfolio-scaffold/ portfolio/
rm -rf portfolio-scaffold
cd portfolio && eval "$(fnm env)" && fnm use 24 && npm install
```
Expected: `portfolio/` now has `app/`, `package.json`, `next.config.ts`, `eslint.config.mjs`; `npm install` completes with no errors.

- [ ] **Step 3: Add runtime and dev dependencies**

```bash
npm install zod@4 gray-matter next-mdx-remote@6 next-themes @vercel/analytics
npm install -D vitest@5 @playwright/test prettier prettier-plugin-tailwindcss @tailwindcss/typography
```

- [ ] **Step 4: Pin Node and configure Prettier**

`.nvmrc`:
```
24
```

`.prettierrc.json`:
```json
{
  "singleQuote": true,
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

`.prettierignore`:
```
.next
node_modules
docs
playwright-report
test-results
package-lock.json
```

- [ ] **Step 5: Set scripts and engines in `package.json`**

Replace the `"scripts"` block and add `"engines"`:
```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint . && prettier --check .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "format": "prettier --write ."
},
"engines": {
  "node": "24.x"
}
```

In `eslint.config.mjs`, add `'playwright-report/**'` and `'test-results/**'` to the existing `globalIgnores([...])` array.

- [ ] **Step 6: Configure Vitest**

`vitest.config.ts`:
```ts
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 7: Format and verify the toolchain**

```bash
npm run format && npm run lint && npm run typecheck && npx vitest run --passWithNoTests && npm run build
```
Expected: all pass; build prints the route table with `○ /` (static).

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m 'Scaffold Next.js 16 app with Node 24, Prettier and Vitest'
```

---

### Task 2: Content schemas and formatting helpers

**Files:**
- Create: `lib/schemas.ts`, `lib/format.ts`
- Test: `tests/unit/schemas.test.ts`, `tests/unit/format.test.ts`

**Interfaces:**
- Produces (`lib/schemas.ts`): `profileSchema`, `roleSchema`, `companySchema`, `experienceSchema`, `skillGroupSchema`, `skillsSchema`, `educationSchema`, `educationListSchema`, `projectFrontmatterSchema`; types `Profile`, `Role`, `Company`, `SkillGroup`, `Education`, `ProjectFrontmatter`, `Project` (= `ProjectFrontmatter & { slug: string; body: string }`); `parseOrThrow<T>(schema: z.ZodType<T>, data: unknown, source: string): T`.
- Produces (`lib/format.ts`): `formatYearMonth(value: string | null): string`, `formatRange(start: string, end: string | null): string`, `displayUrl(url: string): string`, `toConfigKey(label: string): string`.

- [ ] **Step 1: Write the failing schema tests**

`tests/unit/schemas.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  companySchema,
  parseOrThrow,
  profileSchema,
  projectFrontmatterSchema,
} from '@/lib/schemas';

const validProject = {
  title: 'Alpha',
  summary: 'A small tool',
  role: 'Author',
  year: '2024',
  tech: ['Ruby'],
  type: 'public',
  repoUrl: 'https://github.com/example/alpha',
  featured: true,
  order: 1,
};

const validCompany = {
  name: 'Acme',
  location: 'Remote',
  tech: ['Node.js'],
  roles: [
    {
      title: 'Engineer',
      start: '2020-01',
      end: '2021-06',
      highlights: ['Built things'],
    },
  ],
};

describe('projectFrontmatterSchema', () => {
  it('accepts a valid public project', () => {
    expect(projectFrontmatterSchema.safeParse(validProject).success).toBe(true);
  });

  it('accepts a private project without links', () => {
    const result = projectFrontmatterSchema.safeParse({
      ...validProject,
      type: 'private',
      repoUrl: undefined,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a private project that has a repo or demo link', () => {
    expect(
      projectFrontmatterSchema.safeParse({ ...validProject, type: 'private' })
        .success,
    ).toBe(false);
    expect(
      projectFrontmatterSchema.safeParse({
        ...validProject,
        type: 'private',
        repoUrl: undefined,
        demoUrl: 'https://example.com',
      }).success,
    ).toBe(false);
  });

  it('rejects non-http links', () => {
    const result = projectFrontmatterSchema.safeParse({
      ...validProject,
      repoUrl: 'javascript:alert(1)',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unquoted numeric year', () => {
    expect(
      projectFrontmatterSchema.safeParse({ ...validProject, year: 2024 })
        .success,
    ).toBe(false);
  });

  it('rejects a missing title', () => {
    const { title: _title, ...rest } = validProject;
    expect(projectFrontmatterSchema.safeParse(rest).success).toBe(false);
  });
});

describe('companySchema', () => {
  it('accepts a valid company', () => {
    expect(companySchema.safeParse(validCompany).success).toBe(true);
  });

  it('accepts a current role with a null end', () => {
    const company = {
      ...validCompany,
      roles: [{ ...validCompany.roles[0], end: null }],
    };
    expect(companySchema.safeParse(company).success).toBe(true);
  });

  it('rejects an invalid month', () => {
    const company = {
      ...validCompany,
      roles: [{ ...validCompany.roles[0], start: '2020-13' }],
    };
    expect(companySchema.safeParse(company).success).toBe(false);
  });

  it('rejects a role that ends before it starts', () => {
    const company = {
      ...validCompany,
      roles: [{ ...validCompany.roles[0], start: '2022-01', end: '2021-06' }],
    };
    expect(companySchema.safeParse(company).success).toBe(false);
  });

  it('rejects a company with no roles', () => {
    expect(companySchema.safeParse({ ...validCompany, roles: [] }).success).toBe(
      false,
    );
  });
});

describe('profileSchema', () => {
  it('rejects an invalid email', () => {
    const result = profileSchema.safeParse({
      name: 'A',
      title: 'B',
      tagline: 'C',
      summary: 'D',
      location: 'E',
      yearsOfExperience: 9,
      email: 'not-an-email',
      links: {
        github: 'https://github.com/a',
        linkedin: 'https://www.linkedin.com/in/a',
      },
    });
    expect(result.success).toBe(false);
  });
});

describe('parseOrThrow', () => {
  it('returns parsed data when valid', () => {
    expect(parseOrThrow(companySchema, validCompany, 'x.ts').name).toBe('Acme');
  });

  it('throws an error naming the source file and the bad field', () => {
    expect(() =>
      parseOrThrow(companySchema, { ...validCompany, name: '' }, 'content/x.ts'),
    ).toThrow(/content\/x\.ts[\s\S]*name/);
  });
});
```

- [ ] **Step 2: Write the failing format tests**

`tests/unit/format.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import {
  displayUrl,
  formatRange,
  formatYearMonth,
  toConfigKey,
} from '@/lib/format';

describe('formatYearMonth', () => {
  it('formats YYYY-MM as short month and year', () => {
    expect(formatYearMonth('2023-07')).toBe('Jul 2023');
    expect(formatYearMonth('2017-01')).toBe('Jan 2017');
    expect(formatYearMonth('2026-12')).toBe('Dec 2026');
  });

  it('formats null as Present', () => {
    expect(formatYearMonth(null)).toBe('Present');
  });
});

describe('formatRange', () => {
  it('joins start and end with an en dash', () => {
    expect(formatRange('2023-01', '2023-07')).toBe('Jan 2023 – Jul 2023');
    expect(formatRange('2023-01', null)).toBe('Jan 2023 – Present');
  });
});

describe('displayUrl', () => {
  it('strips protocol, www and trailing slash', () => {
    expect(displayUrl('https://www.linkedin.com/in/mrcbstmnte/')).toBe(
      'linkedin.com/in/mrcbstmnte',
    );
    expect(displayUrl('https://github.com/mrcbstmnte')).toBe(
      'github.com/mrcbstmnte',
    );
  });
});

describe('toConfigKey', () => {
  it('turns a label into a snake_case key', () => {
    expect(toConfigKey('Languages & Runtimes')).toBe('languages_runtimes');
    expect(toConfigKey('AI-Assisted Development')).toBe(
      'ai_assisted_development',
    );
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/schemas'` and `'@/lib/format'`.

- [ ] **Step 4: Implement `lib/schemas.ts`**

```ts
import { z } from 'zod';

const yearMonth = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'must be in YYYY-MM format');
const year = z.string().regex(/^\d{4}$/, 'must be a four-digit year');
const httpUrl = z.url({ protocol: /^https?$/ });
const nonEmpty = z.string().trim().min(1);

export const profileSchema = z.object({
  name: nonEmpty,
  title: nonEmpty,
  tagline: nonEmpty,
  summary: nonEmpty,
  location: nonEmpty,
  yearsOfExperience: z.number().int().positive(),
  email: z.email(),
  links: z.object({ github: httpUrl, linkedin: httpUrl }),
  phone: z.string().optional(),
});

export const roleSchema = z
  .object({
    title: nonEmpty,
    start: yearMonth,
    end: yearMonth.nullable(),
    highlights: z.array(nonEmpty).min(1),
  })
  .refine((role) => role.end === null || role.end >= role.start, {
    message: 'end must not be before start',
    path: ['end'],
  });

export const companySchema = z.object({
  name: nonEmpty,
  location: nonEmpty,
  roles: z.array(roleSchema).min(1),
  tech: z.array(nonEmpty),
});

export const experienceSchema = z.array(companySchema).min(1);

export const skillGroupSchema = z.object({
  label: nonEmpty,
  items: z.array(nonEmpty).min(1),
});

export const skillsSchema = z.array(skillGroupSchema).min(1);

export const educationSchema = z.object({
  degree: nonEmpty,
  school: nonEmpty,
  start: year,
  end: year,
});

export const educationListSchema = z.array(educationSchema);

export const projectFrontmatterSchema = z
  .object({
    title: nonEmpty,
    summary: nonEmpty,
    role: nonEmpty,
    year: nonEmpty,
    tech: z.array(nonEmpty).min(1),
    type: z.enum(['public', 'private']),
    repoUrl: httpUrl.optional(),
    demoUrl: httpUrl.optional(),
    featured: z.boolean(),
    order: z.number().int(),
  })
  .refine(
    (project) =>
      project.type === 'public' || (!project.repoUrl && !project.demoUrl),
    {
      message: 'private (NDA) projects must not have repoUrl or demoUrl',
      path: ['type'],
    },
  );

export type Profile = z.infer<typeof profileSchema>;
export type Role = z.infer<typeof roleSchema>;
export type Company = z.infer<typeof companySchema>;
export type SkillGroup = z.infer<typeof skillGroupSchema>;
export type Education = z.infer<typeof educationSchema>;
export type ProjectFrontmatter = z.infer<typeof projectFrontmatterSchema>;
export type Project = ProjectFrontmatter & { slug: string; body: string };

export function parseOrThrow<T>(
  schema: z.ZodType<T>,
  data: unknown,
  source: string,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Invalid content in ${source}:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
```

- [ ] **Step 5: Implement `lib/format.ts`**

```ts
const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// Parsed by hand rather than with Date so the output never shifts with the
// build machine's timezone.
export function formatYearMonth(value: string | null): string {
  if (value === null) return 'Present';
  const [year, month] = value.split('-');
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

export function formatRange(start: string, end: string | null): string {
  return `${formatYearMonth(start)} – ${formatYearMonth(end)}`;
}

export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

export function toConfigKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all tests in `schemas.test.ts` and `format.test.ts`.

If the `rejects non-http links` test fails, Zod's `z.url({ protocol })` option did not behave as expected; replace `httpUrl` with `z.url().refine((u) => /^https?:\/\//.test(u), 'must be an http(s) URL')` and re-run.

- [ ] **Step 7: Lint, typecheck, commit**

```bash
npm run format && npm run lint && npm run typecheck
git add -A
git commit -m 'Add content schemas and formatting helpers'
```

---

### Task 3: Profile, experience, skills and education content

**Files:**
- Create: `content/profile.ts`, `content/experience.ts`, `content/skills.ts`, `content/education.ts`, `lib/content.ts`, `lib/experience.ts`
- Test: `tests/unit/content.test.ts`, `tests/unit/experience.test.ts`

**Interfaces:**
- Consumes: `parseOrThrow`, schemas and types from `lib/schemas.ts`.
- Produces (`lib/content.ts`): `profile: Profile`, `experience: Company[]`, `skills: SkillGroup[]`, `education: Education[]` — all validated at import time.
- Produces (`lib/experience.ts`): `type HighlightGroup = { title: string; highlights: string[] }`; `splitHighlights(company: Company, topCount?: number): { top: string[]; rest: HighlightGroup[] }`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/content.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { education, experience, profile, skills } from '@/lib/content';

describe('site content', () => {
  it('has a profile with no phone number', () => {
    expect(profile.name).toBe('Marc Alain Bustamante');
    expect(profile.phone).toBeUndefined();
  });

  it('lists all six companies, newest first', () => {
    expect(experience.map((c) => c.name)).toEqual([
      'Montani International Inc.',
      'PayMongo Philippines Inc.',
      'Rakuten Travel Xchange',
      'tawk.to',
      'SplitDragon',
      'Akubo Software Philippines Inc.',
    ]);
    const latestStarts = experience.map((c) => c.roles[0].start);
    expect([...latestStarts].sort().reverse()).toEqual(latestStarts);
  });

  it('orders roles within a company newest first', () => {
    for (const company of experience) {
      const starts = company.roles.map((r) => r.start);
      expect([...starts].sort().reverse()).toEqual(starts);
    }
  });

  it('groups both PayMongo roles under one company', () => {
    const paymongo = experience.find((c) => c.name.startsWith('PayMongo'));
    expect(paymongo?.roles.map((r) => r.title)).toEqual([
      'Senior Software Engineer (Interim Technical Lead)',
      'Software Engineer II',
    ]);
  });

  it('has the seven CV skill groups and education', () => {
    expect(skills).toHaveLength(7);
    expect(education[0].degree).toBe('BS Computer Engineering');
  });
});
```

`tests/unit/experience.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { splitHighlights } from '@/lib/experience';
import type { Company } from '@/lib/schemas';

const company: Company = {
  name: 'Acme',
  location: 'Remote',
  tech: [],
  roles: [
    {
      title: 'Senior',
      start: '2022-01',
      end: null,
      highlights: ['a', 'b', 'c', 'd'],
    },
    { title: 'Junior', start: '2020-01', end: '2022-01', highlights: ['e'] },
  ],
};

describe('splitHighlights', () => {
  it('takes the top highlights from the latest role', () => {
    expect(splitHighlights(company).top).toEqual(['a', 'b', 'c']);
  });

  it('groups the remaining highlights by role', () => {
    expect(splitHighlights(company).rest).toEqual([
      { title: 'Senior', highlights: ['d'] },
      { title: 'Junior', highlights: ['e'] },
    ]);
  });

  it('omits empty groups', () => {
    const single: Company = { ...company, roles: [company.roles[0]] };
    expect(splitHighlights(single, 4).rest).toEqual([]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/content'` and `'@/lib/experience'`.

- [ ] **Step 3: Write `content/profile.ts`**

```ts
import type { Profile } from '@/lib/schemas';

export const profile = {
  name: 'Marc Alain Bustamante',
  title: 'Senior Software Engineer · Backend & Full Stack',
  tagline:
    '9+ years building reliable production systems across fintech, e-commerce and high-traffic chat infrastructure — mostly in Ruby on Rails and Node.js.',
  summary:
    "Senior Software Engineer with 9+ years building and hardening full-stack production systems across fintech, travel technology, and high-traffic chat infrastructure — industries where reliability, security, and correctness aren't optional. Comfortable end-to-end, from customer-facing front-end flows to backend architecture, with Ruby on Rails and Node.js as primary tools. Deep experience in payment infrastructure, e-commerce platforms, distributed systems, technical architecture, and legacy system modernization. Applies TDD/CI-CD rigor throughout the development lifecycle and uses AI-assisted development tools daily to accelerate delivery.",
  location: 'Bacolod City, Philippines',
  yearsOfExperience: 9,
  email: 'mrcbstmnte@gmail.com',
  links: {
    github: 'https://github.com/mrcbstmnte',
    linkedin: 'https://www.linkedin.com/in/mrcbstmnte',
  },
} satisfies Profile;
```

- [ ] **Step 4: Write `content/experience.ts`**

```ts
import type { Company } from '@/lib/schemas';

// Newest first. Within a company, roles are newest first; several roles at one
// company render as a promotion.
export const experience = [
  {
    name: 'Montani International Inc.',
    location: 'Remote',
    tech: ['Ruby', 'Ruby on Rails', 'GitHub Actions'],
    roles: [
      {
        title: 'Full-Stack Ruby on Rails Developer',
        start: '2023-07',
        end: '2026-10',
        highlights: [
          'Built and maintained a multi-storefront, white-label e-commerce platform supporting an unlimited number of branded storefronts from a single shared codebase, cutting the time to launch a new storefront to days rather than weeks.',
          'Worked as one of 3 engineers who built the platform from the ground up, taking it from concept to production and supporting live e-commerce operations for new and used books.',
          "Led migration of the platform's payment gateway from a legacy third-party implementation to an internally integrated solution, improving maintainability and reducing production incidents.",
          'Developed core customer-facing flows — customizable storefront pages, transactional email templates, sign-up, checkout, and order confirmation — directly improving conversion and reducing support tickets tied to a confusing legacy flow.',
          'Applied TDD, CI/CD (GitHub Actions), and Git-based workflows throughout the development lifecycle to keep releases fast and reliable.',
          'Used Claude and other AI-assisted development tools daily for coding, debugging, technical research, and documentation, measurably speeding up delivery.',
        ],
      },
    ],
  },
  {
    name: 'PayMongo Philippines Inc.',
    location: 'Remote',
    tech: [],
    roles: [
      {
        title: 'Senior Software Engineer (Interim Technical Lead)',
        start: '2023-01',
        end: '2023-07',
        highlights: [
          'Acted as Interim Technical Lead, leading technical design and architecture decisions for Direct Online Banking (DOB) payment infrastructure supporting ~₱10 million in monthly payment volume.',
          "Spearheaded the initial implementation of QR Ph payment processing, expanding the company's supported payment rails.",
          'Built and maintained payment services processing online banking transactions through major Philippine banks, including BPI and UnionBank.',
          'Partnered with engineers, product managers, and stakeholders to design and ship payment features from architecture through launch.',
          'Ran code reviews and set testing standards that raised code quality and maintainability across the team.',
        ],
      },
      {
        title: 'Software Engineer II',
        start: '2022-02',
        end: '2023-01',
        highlights: [
          'Developed and maintained Direct Online Banking (DOB) payment services powering transactions through Philippine banks.',
          "Built integrations with BPI and UnionBank as part of the company's core online banking payment infrastructure.",
          'Mentored junior software engineers on best practices, clean code, and rigorous code review standards.',
          'Improved reliability of backend services supporting a high-volume, business-critical payment path.',
          'Translated product requirements into technical implementations in close collaboration with cross-functional teams.',
        ],
      },
    ],
  },
  {
    name: 'Rakuten Travel Xchange',
    location: 'Remote',
    tech: ['Node.js'],
    roles: [
      {
        title: 'Full-Stack Node.js Developer',
        start: '2021-04',
        end: '2022-02',
        highlights: [
          'Developed and maintained backend services for a travel booking platform supporting property search and reservations in Japan, including accommodation bookings, experiences, and tours.',
          'Reduced technical debt by raising test coverage from near-zero to 95% on every file touched during development, cutting regressions in a legacy codebase.',
          'Enforced rigorous code review standards — going beyond rubber-stamping to actively raise coding standards across the team.',
          'Partnered with project leads and stakeholders to plan and implement product enhancements.',
        ],
      },
    ],
  },
  {
    name: 'tawk.to',
    location: 'Remote',
    tech: ['Node.js', 'Apache Kafka', 'MongoDB', 'Elasticsearch'],
    roles: [
      {
        title: 'Back-end Node.js Developer',
        start: '2019-05',
        end: '2021-03',
        highlights: [
          'Built a Knowledgebase service and Contacts CRM from scratch — both still active in production today, serving the #1 most-used live chat application in the world.',
          'Designed and built an event-driven service on Apache Kafka, decoupling core workflows and enabling reliable communication between distributed services.',
          'Built a real-time data pipeline combining MongoDB Change Streams with Kafka, streaming data changes to downstream services with minimal latency.',
          'Maintained 100% test coverage across owned services, keeping regressions out of a platform relied on by millions of websites.',
          'Implemented Elasticsearch-powered search and filtering, and contributed to architecture discussions within a 4–5 person engineering team.',
        ],
      },
    ],
  },
  {
    name: 'SplitDragon',
    location: 'Remote',
    tech: ['Ruby on Rails'],
    roles: [
      {
        title: 'Full-Stack Ruby on Rails Developer',
        start: '2018-12',
        end: '2019-07',
        highlights: [
          "Maintained and developed the company's online marketplace platform for sellers.",
          'Led front-end development, building customer-facing landing pages that showcased products and services to drive sales.',
          'Contributed to technical decisions and development planning for the platform.',
        ],
      },
    ],
  },
  {
    name: 'Akubo Software Philippines Inc.',
    location: 'On-site',
    tech: ['Ruby on Rails'],
    roles: [
      {
        title: 'Software Engineer',
        start: '2017-03',
        end: '2019-05',
        highlights: [
          'Built a payroll system implementing Philippine-specific payroll requirements, deductions, and employee benefits across three client companies with differing business rules.',
          'Developed and maintained a Ruby on Rails HR management application for small and medium-sized businesses.',
          'Took on technical leadership responsibilities, guiding decisions and development efforts for the team.',
          'Partnered with clients and internal stakeholders on requirements analysis and development planning.',
        ],
      },
    ],
  },
] satisfies Company[];
```

- [ ] **Step 5: Write `content/skills.ts` and `content/education.ts`**

`content/skills.ts`:
```ts
import type { SkillGroup } from '@/lib/schemas';

export const skills = [
  {
    label: 'Languages & Runtimes',
    items: ['Ruby', 'Node.js', 'JavaScript', 'PHP'],
  },
  {
    label: 'Frameworks & Libraries',
    items: ['Ruby on Rails', 'Vue.js', 'React.js', 'Next.js'],
  },
  {
    label: 'Data & Storage',
    items: ['PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch'],
  },
  {
    label: 'Infrastructure & Messaging',
    items: ['AWS', 'Google Cloud Services', 'Kafka'],
  },
  {
    label: 'DevOps & Tooling',
    items: ['Git', 'GitHub Actions (CI/CD)', 'Docker'],
  },
  {
    label: 'Engineering Practices',
    items: [
      'RESTful API Design',
      'Microservices Architecture',
      'TDD/BDD',
      'Performance Optimization',
      'Code Reviews',
    ],
  },
  {
    label: 'AI-Assisted Development',
    items: ['Claude', 'Generative AI tooling'],
  },
] satisfies SkillGroup[];
```

`content/education.ts`:
```ts
import type { Education } from '@/lib/schemas';

export const education = [
  {
    degree: 'BS Computer Engineering',
    school: 'University of St. La Salle',
    start: '2010',
    end: '2016',
  },
] satisfies Education[];
```

- [ ] **Step 6: Write `lib/content.ts` and `lib/experience.ts`**

`lib/content.ts`:
```ts
import { education as rawEducation } from '@/content/education';
import { experience as rawExperience } from '@/content/experience';
import { profile as rawProfile } from '@/content/profile';
import { skills as rawSkills } from '@/content/skills';
import {
  educationListSchema,
  experienceSchema,
  parseOrThrow,
  profileSchema,
  skillsSchema,
} from '@/lib/schemas';

export const profile = parseOrThrow(
  profileSchema,
  rawProfile,
  'content/profile.ts',
);
export const experience = parseOrThrow(
  experienceSchema,
  rawExperience,
  'content/experience.ts',
);
export const skills = parseOrThrow(skillsSchema, rawSkills, 'content/skills.ts');
export const education = parseOrThrow(
  educationListSchema,
  rawEducation,
  'content/education.ts',
);
```

`lib/experience.ts`:
```ts
import type { Company } from '@/lib/schemas';

export type HighlightGroup = { title: string; highlights: string[] };

export function splitHighlights(
  company: Company,
  topCount = 3,
): { top: string[]; rest: HighlightGroup[] } {
  const [latest, ...earlier] = company.roles;
  const rest = [
    { title: latest.title, highlights: latest.highlights.slice(topCount) },
    ...earlier.map((role) => ({
      title: role.title,
      highlights: role.highlights,
    })),
  ].filter((group) => group.highlights.length > 0);

  return { top: latest.highlights.slice(0, topCount), rest };
}
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (all unit tests).

- [ ] **Step 8: Lint, typecheck, commit**

```bash
npm run format && npm run lint && npm run typecheck
git add -A
git commit -m 'Add CV content and validated content loaders'
```

---

### Task 4: Case-study loader and MDX content

**Files:**
- Create: `lib/projects.ts`
- Create: `content/projects/white-label-ecommerce-platform.mdx`, `content/projects/direct-online-banking-payments.mdx`, `content/projects/realtime-event-pipeline.mdx`, `content/projects/knowledgebase-and-crm.mdx`
- Test: `tests/unit/projects.test.ts`

**Interfaces:**
- Consumes: `projectFrontmatterSchema`, `parseOrThrow`, `Project` from `lib/schemas.ts`.
- Produces: `loadProjects(dir?: string): Project[]` (sorted by `order`, then `title`), `getAllProjects(): Project[]`, `getFeaturedProjects(): Project[]`, `getProject(slug: string): Project | null`. Default dir is `<cwd>/content/projects`.

- [ ] **Step 1: Write the failing tests**

`tests/unit/projects.test.ts`:
```ts
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  getAllProjects,
  getFeaturedProjects,
  getProject,
  loadProjects,
} from '@/lib/projects';

const dirs: string[] = [];

function makeDir(files: Record<string, string>): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'projects-'));
  dirs.push(dir);
  for (const [name, contents] of Object.entries(files)) {
    fs.writeFileSync(path.join(dir, name), contents);
  }
  return dir;
}

function mdx(fields: Record<string, string>, body = 'Body text.'): string {
  const frontmatter = Object.entries(fields)
    .map(([key, value]) => `${key}: ${value}`)
    .join('\n');
  return `---\n${frontmatter}\n---\n\n${body}\n`;
}

const base = {
  summary: 'Summary',
  role: 'Engineer',
  year: "'2024'",
  tech: '[Ruby]',
  type: 'private',
  featured: 'true',
};

afterEach(() => {
  for (const dir of dirs.splice(0)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

describe('loadProjects', () => {
  it('loads MDX files sorted by order then title, ignoring other files', () => {
    const dir = makeDir({
      'beta.mdx': mdx({ ...base, title: 'Beta', order: '2' }),
      'alpha.mdx': mdx({ ...base, title: 'Alpha', order: '2' }),
      'first.mdx': mdx({ ...base, title: 'Zed', order: '1' }),
      'notes.txt': 'not a project',
      '.DS_Store': '',
    });
    expect(loadProjects(dir).map((p) => p.slug)).toEqual([
      'first',
      'alpha',
      'beta',
    ]);
  });

  it('exposes slug and body alongside frontmatter', () => {
    const dir = makeDir({
      'alpha.mdx': mdx({ ...base, title: 'Alpha', order: '1' }, '## Context'),
    });
    const [project] = loadProjects(dir);
    expect(project.slug).toBe('alpha');
    expect(project.title).toBe('Alpha');
    expect(project.body.trim()).toBe('## Context');
  });

  it('throws naming the file when frontmatter is invalid', () => {
    const dir = makeDir({
      'leaky.mdx': mdx({
        ...base,
        title: 'Leaky',
        order: '1',
        repoUrl: 'https://github.com/x/y',
      }),
    });
    expect(() => loadProjects(dir)).toThrow(/leaky\.mdx[\s\S]*repoUrl/);
  });

  it('throws when the year is not quoted', () => {
    const dir = makeDir({
      'numeric.mdx': mdx({ ...base, title: 'N', order: '1', year: '2024' }),
    });
    expect(() => loadProjects(dir)).toThrow(/numeric\.mdx[\s\S]*year/);
  });

  it('throws when a filename is not a valid slug', () => {
    const dir = makeDir({
      'My Project.mdx': mdx({ ...base, title: 'Mine', order: '1' }),
    });
    expect(() => loadProjects(dir)).toThrow(/My Project\.mdx/);
  });
});

describe('real case studies', () => {
  it('loads the four drafted case studies, all featured', () => {
    expect(getAllProjects().map((p) => p.slug)).toEqual([
      'white-label-ecommerce-platform',
      'direct-online-banking-payments',
      'realtime-event-pipeline',
      'knowledgebase-and-crm',
    ]);
    expect(getFeaturedProjects()).toHaveLength(4);
  });

  it('finds a project by slug and returns null for unknown slugs', () => {
    expect(getProject('realtime-event-pipeline')?.type).toBe('private');
    expect(getProject('does-not-exist')).toBeNull();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test`
Expected: FAIL — `Cannot find module '@/lib/projects'`.

- [ ] **Step 3: Implement `lib/projects.ts`**

```ts
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import {
  parseOrThrow,
  projectFrontmatterSchema,
  type Project,
} from '@/lib/schemas';

const PROJECTS_DIR = path.join(process.cwd(), 'content', 'projects');
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function loadProjects(dir = PROJECTS_DIR): Project[] {
  const files = fs.readdirSync(dir).filter((file) => file.endsWith('.mdx'));

  const projects = files.map((file) => {
    const source = path.join(path.relative(process.cwd(), dir), file);
    const slug = file.replace(/\.mdx$/, '');
    if (!SLUG.test(slug)) {
      throw new Error(
        `Invalid content in ${source}:\nfilename must be lowercase-kebab-case, e.g. my-project.mdx`,
      );
    }

    const { data, content } = matter(fs.readFileSync(path.join(dir, file), 'utf8'));
    const frontmatter = parseOrThrow(projectFrontmatterSchema, data, source);
    return { ...frontmatter, slug, body: content };
  });

  return projects.sort(
    (a, b) => a.order - b.order || a.title.localeCompare(b.title),
  );
}

export function getAllProjects(): Project[] {
  return loadProjects();
}

export function getFeaturedProjects(): Project[] {
  return getAllProjects().filter((project) => project.featured);
}

export function getProject(slug: string): Project | null {
  return getAllProjects().find((project) => project.slug === slug) ?? null;
}
```

- [ ] **Step 4: Write the four case studies**

These are drafts from CV bullets for Marc to edit; they make no claims beyond the CV.

`content/projects/white-label-ecommerce-platform.mdx`:
```mdx
---
title: White-label multi-storefront e-commerce platform
summary: One codebase powering an unlimited number of branded bookstores — new storefronts launch in days, not weeks.
role: Full-Stack Engineer (one of 3)
year: '2023–2026'
tech: [Ruby on Rails, Ruby, GitHub Actions]
type: private
featured: true
order: 1
---

## Context

Montani International sells new and used books online. The business wanted to run many branded storefronts without maintaining a separate application for each one.

## Problem

Each new storefront meant weeks of setup, and the legacy checkout flow was confusing enough to generate a steady stream of support tickets. The payment gateway was a third-party implementation that was hard to maintain and caused production incidents.

## What I did

- Built the platform from the ground up as one of three engineers, from concept to production.
- Designed the multi-storefront model so a single shared codebase serves any number of white-label storefronts.
- Developed the core customer flows: customisable storefront pages, transactional email templates, sign-up, checkout and order confirmation.
- Led the migration of the payment gateway from the legacy third-party implementation to an internally integrated solution.
- Kept releases fast and safe with TDD and CI/CD on GitHub Actions.

## Impact

- New storefronts launch in **days rather than weeks**.
- Clearer checkout and confirmation flows improved conversion and reduced support tickets.
- The in-house payment integration is easier to maintain and reduced production incidents.
```

`content/projects/direct-online-banking-payments.mdx`:
```mdx
---
title: Direct Online Banking & QR Ph payments
summary: Payment infrastructure moving ~₱10M a month through major Philippine banks, plus the first QR Ph implementation.
role: Senior Software Engineer · Interim Technical Lead
year: '2022–2023'
tech: [Payment infrastructure, Bank integrations, QR Ph]
type: private
featured: true
order: 2
---

## Context

PayMongo is a Philippine payments company. Its Direct Online Banking (DOB) product lets customers pay merchants straight from their bank accounts.

## Problem

DOB sits on a business-critical, high-volume payment path, so every bank integration has to be correct and reliable. The company also needed to support QR Ph, the national QR payment standard, to expand its payment rails.

## What I did

- Built and maintained the DOB payment services, including integrations with BPI and UnionBank.
- As Interim Technical Lead, owned technical design and architecture decisions for the DOB infrastructure.
- Spearheaded the initial implementation of QR Ph payment processing.
- Worked with engineers, product managers and stakeholders to take payment features from architecture through launch.
- Mentored junior engineers and set code review and testing standards for the team.

## Impact

- DOB infrastructure supporting **~₱10 million in monthly payment volume**.
- QR Ph added as a new supported payment rail.
- Improved reliability of the backend services on the payment path.
```

`content/projects/realtime-event-pipeline.mdx`:
```mdx
---
title: Real-time event pipeline with Kafka & MongoDB Change Streams
summary: Event-driven backbone for the world's most-used live chat platform, streaming data changes to downstream services with minimal latency.
role: Back-end Engineer
year: '2019–2021'
tech: [Node.js, Apache Kafka, MongoDB]
type: private
featured: true
order: 3
---

## Context

tawk.to is the most-used live chat application in the world, embedded on millions of websites. Its backend is made of distributed services that need to react to each other's data.

## Problem

Core workflows were tightly coupled, and downstream services needed to learn about data changes quickly and reliably without polling the primary database.

## What I did

- Designed and built an event-driven service on Apache Kafka to decouple core workflows and give services a reliable way to communicate.
- Built a real-time data pipeline that captures changes with MongoDB Change Streams and publishes them to Kafka for downstream consumers.
- Maintained 100% test coverage on the services I owned.
- Contributed to architecture discussions within a 4–5 person engineering team.

## Impact

- Data changes reach downstream services with minimal latency.
- Core workflows are decoupled, so services can evolve independently.
```

`content/projects/knowledgebase-and-crm.mdx`:
```mdx
---
title: Knowledgebase service & Contacts CRM
summary: Two products built from scratch that are still in production for millions of websites.
role: Back-end Engineer
year: '2019–2021'
tech: [Node.js, MongoDB, Elasticsearch]
type: private
featured: true
order: 4
---

## Context

tawk.to customers use the platform to support their own visitors. They needed a self-service knowledgebase and a way to manage the contacts they talk to.

## Problem

Both features had to be built from nothing and hold up under the traffic of a platform used on millions of websites.

## What I did

- Built the Knowledgebase service from scratch.
- Built the Contacts CRM from scratch.
- Implemented Elasticsearch-powered search and filtering.
- Kept 100% test coverage on both services to keep regressions out of production.

## Impact

- Both services are **still active in production today**.
- Customers can search and filter their knowledgebase and contacts quickly.
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (all unit tests).

- [ ] **Step 6: Lint, typecheck, commit**

```bash
npm run format && npm run lint && npm run typecheck
git add -A
git commit -m 'Add case-study loader and draft case studies'
```

---

### Task 5: Theme, layout, navigation and 404

**Files:**
- Create: `components/theme-provider.tsx`, `components/theme-toggle.tsx`, `components/nav.tsx`, `components/missing-path.tsx`, `app/not-found.tsx`, `lib/site.ts`, `playwright.config.ts`
- Modify (replace contents): `app/layout.tsx`, `app/globals.css`, `app/page.tsx`
- Delete: scaffold leftovers in `public/` (`file.svg`, `globe.svg`, `next.svg`, `vercel.svg`, `window.svg`)
- Test: `tests/e2e/layout.spec.ts`

**Interfaces:**
- Consumes: `profile` from `lib/content.ts`.
- Produces: Tailwind colour utilities `bg-bg`, `text-fg`, `text-muted`, `border-border`, `bg-surface`, `text-accent`/`bg-accent`/`border-accent`; `font-sans`, `font-mono`; CSS classes `reveal` (scroll fade-in) and `cursor-blink`; `dark:` variant keyed on `.dark`; `siteUrl: string` from `lib/site.ts`. The `<Nav />` is rendered by the layout on every page; pages render their own `<main>`.

- [ ] **Step 1: Install Playwright's browser and add the config**

```bash
npx playwright install chromium
```

`playwright.config.ts`:
```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    // CI builds in an earlier step; locally build first so tests hit production output.
    command: process.env.CI ? 'npm run start' : 'npm run build && npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
```

- [ ] **Step 2: Write the failing e2e tests**

`tests/e2e/layout.spec.ts`:
```ts
import { expect, test, type Page } from '@playwright/test';

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test.describe('with a light OS preference', () => {
  test.use({ colorScheme: 'light' });

  test('renders light without console errors', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    expect(errors).toEqual([]);
  });
});

test.describe('with a dark OS preference', () => {
  test.use({ colorScheme: 'dark' });

  test('renders dark and the toggle switches and persists the theme', async ({
    page,
  }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    await page.getByRole('button', { name: 'Toggle colour theme' }).click();
    await expect(html).not.toHaveClass(/dark/);

    await page.reload();
    await expect(html).not.toHaveClass(/dark/);
  });
});

test('nav links to the CV and home sections', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation');
  await expect(nav.getByRole('link', { name: 'cv' })).toHaveAttribute(
    'href',
    '/cv',
  );
  await expect(nav.getByRole('link', { name: 'experience' })).toHaveAttribute(
    'href',
    '/#experience',
  );
});

test('unknown routes show the terminal 404 without console errors', async ({
  page,
}) => {
  const errors = collectErrors(page);
  const response = await page.goto('/nope/missing');
  expect(response?.status()).toBe(404);
  await expect(page.getByText('command not found: /nope/missing')).toBeVisible();
  await expect(page.getByRole('link', { name: 'cd ~' })).toHaveAttribute(
    'href',
    '/',
  );
  // The 404 response itself is logged by the browser; ignore only that.
  expect(errors.filter((e) => !e.includes('404'))).toEqual([]);
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/layout.spec.ts`
Expected: FAIL — no `Toggle colour theme` button, no navigation, scaffold 404 text.

- [ ] **Step 4: Write `app/globals.css`**

```css
@import 'tailwindcss';
@plugin '@tailwindcss/typography';

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --bg: #fafaf9;
  --fg: #1c1917;
  --muted: #57534e;
  --border: #e7e5e4;
  --surface: #f5f5f4;
  --accent: #15803d;
  color-scheme: light;
}

.dark {
  --bg: #0a0a0a;
  --fg: #e7e5e4;
  --muted: #a8a29e;
  --border: #262626;
  --surface: #141414;
  --accent: #4ade80;
  color-scheme: dark;
}

@theme inline {
  --color-bg: var(--bg);
  --color-fg: var(--fg);
  --color-muted: var(--muted);
  --color-border: var(--border);
  --color-surface: var(--surface);
  --color-accent: var(--accent);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

body {
  background: var(--bg);
  color: var(--fg);
}

::selection {
  background: var(--accent);
  color: var(--bg);
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

.cursor-blink {
  animation: blink 1s step-end infinite;
}

@keyframes reveal {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* Scroll reveal is CSS-only progressive enhancement: where scroll-driven
   animations are unsupported, or motion is reduced, content is simply visible. */
@media (prefers-reduced-motion: no-preference) {
  @supports (animation-timeline: view()) {
    .reveal {
      animation: reveal linear both;
      animation-timeline: view();
      animation-range: entry 0% entry 40%;
    }
  }
}

@media (prefers-reduced-motion: reduce) {
  .cursor-blink {
    animation: none;
  }
}

@media print {
  :root,
  .dark {
    --bg: #ffffff;
    --fg: #000000;
    --muted: #333333;
    --border: #999999;
    --surface: #ffffff;
    --accent: #000000;
    color-scheme: light;
  }

  @page {
    margin: 14mm;
  }

  .reveal {
    animation: none !important;
  }
}
```

- [ ] **Step 5: Write `lib/site.ts` and the theme components**

`lib/site.ts`:
```ts
const vercelUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

export const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (vercelUrl ? `https://${vercelUrl}` : 'http://localhost:3000');
```

`components/theme-provider.tsx`:
```tsx
'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ComponentProps } from 'react';

export function ThemeProvider(props: ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props} />;
}
```

`components/theme-toggle.tsx`:
```tsx
'use client';

import { useTheme } from 'next-themes';
import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  // false during SSR and hydration, true afterwards — avoids a theme-label mismatch.
  const mounted = useSyncExternalStore(subscribe, () => true, () => false);
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      aria-label="Toggle colour theme"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="rounded border border-border px-2 py-1 font-mono text-xs text-muted transition-colors hover:border-accent hover:text-accent"
    >
      {mounted ? (isDark ? 'theme: dark' : 'theme: light') : 'theme: …'}
    </button>
  );
}
```

`components/nav.tsx`:
```tsx
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

const sections = ['experience', 'work', 'skills', 'contact'];

export function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-bg/80 backdrop-blur print:hidden">
      <nav className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 font-mono text-sm sm:px-6">
        <Link href="/" className="font-semibold text-accent">
          ~/marc
        </Link>
        <div className="flex items-center gap-4">
          <ul className="hidden items-center gap-4 sm:flex">
            {sections.map((section) => (
              <li key={section}>
                <Link
                  href={`/#${section}`}
                  className="text-muted transition-colors hover:text-accent"
                >
                  {section}
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/cv" className="text-muted transition-colors hover:text-accent">
            cv
          </Link>
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 6: Write the 404 page**

`components/missing-path.tsx`:
```tsx
'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

// The 404 page is prerendered once, so the real path is only known in the
// browser. The empty server snapshot keeps hydration consistent.
export function MissingPath() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.pathname,
    () => '',
  );
}
```

`app/not-found.tsx`:
```tsx
import Link from 'next/link';
import { MissingPath } from '@/components/missing-path';

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-4xl flex-col justify-center px-4 font-mono sm:px-6">
      <p className="text-sm text-muted">
        <span className="text-accent">~/marc</span> $ <MissingPath />
      </p>
      <h1 className="mt-4 text-2xl font-semibold">
        command not found: <MissingPath />
      </h1>
      <p className="mt-6 text-sm text-muted">
        Try{' '}
        <Link href="/" className="text-accent hover:underline">
          cd ~
        </Link>
      </p>
    </main>
  );
}
```

- [ ] **Step 7: Write `app/layout.tsx` and a temporary `app/page.tsx`**

`app/layout.tsx`:
```tsx
import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { Nav } from '@/components/nav';
import { ThemeProvider } from '@/components/theme-provider';
import { profile } from '@/lib/content';
import { siteUrl } from '@/lib/site';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${profile.name} — ${profile.title}`,
    template: `%s · ${profile.name}`,
  },
  description: profile.tagline,
  alternates: { canonical: '/' },
  openGraph: { type: 'website', siteName: profile.name, url: '/' },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Nav />
          {children}
        </ThemeProvider>
        {/* Only on Vercel: elsewhere the insights script 404s and logs a console error. */}
        {process.env.VERCEL && <Analytics />}
      </body>
    </html>
  );
}
```

`app/page.tsx` (temporary; replaced in Task 6):
```tsx
import { profile } from '@/lib/content';

export default function HomePage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-24 sm:px-6">
      <h1 className="font-mono text-4xl font-bold">{profile.name}</h1>
    </main>
  );
}
```

Delete scaffold assets:
```bash
rm -f public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/layout.spec.ts`
Expected: PASS (4 tests).

- [ ] **Step 9: Lint, typecheck, unit tests, commit**

```bash
npm run format && npm run lint && npm run typecheck && npm test
git add -A
git commit -m 'Add theme, layout, navigation and terminal 404 page'
```

---

### Task 6: Home page sections

**Files:**
- Create: `components/section.tsx`, `components/tag.tsx`, `components/hero.tsx`, `components/experience-timeline.tsx`, `components/project-card.tsx`, `components/skills-config.tsx`, `components/copy-email.tsx`, `components/contact.tsx`
- Modify (replace contents): `app/page.tsx`
- Test: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: `profile`, `experience`, `skills` (`lib/content.ts`); `getFeaturedProjects()` (`lib/projects.ts`); `splitHighlights` (`lib/experience.ts`); `formatRange`, `toConfigKey` (`lib/format.ts`); types `Company`, `Project`, `SkillGroup`.
- Produces: `Section({ id, command, title, children })`, `Tag({ children })` — reused by Tasks 7. Section ids on the home page: `experience`, `work`, `skills`, `contact`.

- [ ] **Step 1: Write the failing e2e tests**

`tests/e2e/home.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

const EMAIL = 'mrcbstmnte@gmail.com';

test('hero shows identity and the two calls to action', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Marc Alain Bustamante' }),
  ).toBeVisible();
  await expect(page.getByText('9+ yrs')).toBeVisible();
  await expect(page.getByRole('link', { name: 'View CV' })).toHaveAttribute(
    'href',
    '/cv',
  );
  await expect(page.getByRole('link', { name: 'Email me' })).toHaveAttribute(
    'href',
    `mailto:${EMAIL}`,
  );
});

test('renders all four sections', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Experience', 'Selected work', 'Skills', 'Contact']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  }
});

test('experience timeline lists every company and expands details', async ({
  page,
}) => {
  await page.goto('/');
  const section = page.locator('#experience');
  for (const company of [
    'Montani International Inc.',
    'PayMongo Philippines Inc.',
    'Rakuten Travel Xchange',
    'tawk.to',
    'SplitDragon',
    'Akubo Software Philippines Inc.',
  ]) {
    await expect(section.getByRole('heading', { name: company })).toBeVisible();
  }
  await expect(section.getByText('Software Engineer II').first()).toBeVisible();

  const mentoring = section.getByText(/Mentored junior software engineers/);
  await expect(mentoring).toBeHidden();
  await section
    .locator('li', { has: page.getByRole('heading', { name: /PayMongo/ }) })
    .getByText('show more')
    .click();
  await expect(mentoring).toBeVisible();
});

test('selected work links to each case study with an NDA badge', async ({
  page,
}) => {
  await page.goto('/');
  const cards = page.locator('#work').getByRole('link');
  await expect(cards).toHaveCount(4);
  await expect(cards.first()).toHaveAttribute(
    'href',
    '/projects/white-label-ecommerce-platform',
  );
  await expect(cards.first()).toContainText('[NDA]');
});

test('skills render as config keys', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#skills')).toContainText('languages_runtimes:');
});

test('copy email uses the clipboard when available', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('button', { name: 'copy email' }).click();
  await expect(page.getByText('copied to clipboard')).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(EMAIL);
});

test('copy email falls back to selecting the address', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'copy email' }).click();
  await expect(page.getByText('press ⌘/Ctrl+C to copy')).toBeVisible();
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(
    EMAIL,
  );
});

test('contact links point to LinkedIn and GitHub', async ({ page }) => {
  await page.goto('/');
  const contact = page.locator('#contact');
  await expect(contact.getByRole('link', { name: /linkedin/ })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/mrcbstmnte',
  );
  await expect(contact.getByRole('link', { name: /github/ })).toHaveAttribute(
    'href',
    'https://github.com/mrcbstmnte',
  );
});

test('never shows the phone number', async ({ page }) => {
  await page.goto('/');
  // Any run of 10+ digits with phone separators, in any format.
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/\+?\d[\d\s().-]{8,}\d/);
});

test('every internal link resolves', async ({ page, request }) => {
  await page.goto('/');
  const hrefs = await page
    .locator('a[href^="/"]')
    .evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''));
  const paths = [...new Set(hrefs.map((href) => href.split('#')[0] || '/'))];
  for (const path of paths) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
});

test.describe('on a 360px phone', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('home does not scroll horizontally', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/home.spec.ts`
Expected: FAIL — no "View CV" link, no sections. (The "every internal link resolves" test will also fail on `/projects/*` and `/cv` until Tasks 7–8; that is expected — see Step 6.)

- [ ] **Step 3: Write the shared components**

`components/section.tsx`:
```tsx
import type { ReactNode } from 'react';

type Props = {
  id: string;
  command: string;
  title: string;
  children: ReactNode;
};

export function Section({ id, command, title, children }: Props) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="reveal scroll-mt-20 border-t border-border py-16"
    >
      <p className="font-mono text-sm text-muted">
        <span className="text-accent">$</span> {command}
      </p>
      <h2 id={`${id}-heading`} className="mt-2 font-mono text-2xl font-semibold">
        {title}
      </h2>
      <div className="mt-8">{children}</div>
    </section>
  );
}
```

`components/tag.tsx`:
```tsx
import type { ReactNode } from 'react';

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="rounded border border-border px-2 py-0.5 font-mono text-xs break-words text-muted">
      {children}
    </span>
  );
}
```

- [ ] **Step 4: Write the section components**

`components/hero.tsx`:
```tsx
import Link from 'next/link';
import { profile } from '@/lib/content';

export function Hero() {
  return (
    <section className="pt-20 pb-16 sm:pt-28">
      <p className="font-mono text-sm text-muted">
        <span className="text-accent">~/marc</span> $ whoami
        <span aria-hidden="true" className="cursor-blink ml-1 text-accent">
          ▍
        </span>
      </p>
      <h1 className="mt-4 font-mono text-4xl font-bold tracking-tight sm:text-5xl">
        {profile.name}
      </h1>
      <p className="mt-3 font-mono text-lg text-accent">{profile.title}</p>
      <p className="mt-6 max-w-2xl text-lg text-muted">{profile.tagline}</p>
      <ul className="mt-6 flex flex-wrap gap-2 font-mono text-xs text-muted">
        <li className="rounded border border-border px-2 py-1">
          Remote · {profile.location}
        </li>
        <li className="rounded border border-border px-2 py-1">
          {profile.yearsOfExperience}+ yrs
        </li>
      </ul>
      <div className="mt-8 flex flex-wrap gap-3 font-mono text-sm">
        <Link
          href="/cv"
          className="rounded bg-accent px-4 py-2 font-semibold text-bg transition-opacity hover:opacity-90"
        >
          View CV
        </Link>
        <a
          href={`mailto:${profile.email}`}
          className="rounded border border-border px-4 py-2 transition-colors hover:border-accent hover:text-accent"
        >
          Email me
        </a>
      </div>
    </section>
  );
}
```

`components/experience-timeline.tsx`:
```tsx
import { Tag } from '@/components/tag';
import { splitHighlights } from '@/lib/experience';
import { formatRange } from '@/lib/format';
import type { Company } from '@/lib/schemas';

function Highlights({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-2 text-muted">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden="true" className="font-mono text-accent">
            ›
          </span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ExperienceTimeline({ companies }: { companies: Company[] }) {
  return (
    <ol className="space-y-12 border-l border-border pl-6">
      {companies.map((company) => {
        const { top, rest } = splitHighlights(company);
        const showRoleTitles = company.roles.length > 1;

        return (
          <li key={company.name} className="relative">
            <span
              aria-hidden="true"
              className="absolute top-2 -left-[29px] h-2.5 w-2.5 rounded-full bg-accent"
            />
            <h3 className="font-mono text-lg font-semibold">{company.name}</h3>
            <p className="font-mono text-xs text-muted">{company.location}</p>

            <div className="mt-3 space-y-1">
              {company.roles.map((role) => (
                <p key={`${role.title}-${role.start}`}>
                  <span className="font-medium">{role.title}</span>{' '}
                  <span className="font-mono text-xs whitespace-nowrap text-muted">
                    {formatRange(role.start, role.end)}
                  </span>
                </p>
              ))}
            </div>

            <Highlights items={top} />

            {rest.length > 0 && (
              <details className="group mt-3">
                <summary className="cursor-pointer font-mono text-xs text-accent">
                  <span className="group-open:hidden">show more</span>
                  <span className="hidden group-open:inline">show less</span>
                </summary>
                {rest.map((group) => (
                  <div key={group.title} className="mt-3">
                    {showRoleTitles && (
                      <p className="font-mono text-xs text-fg">{group.title}</p>
                    )}
                    <Highlights items={group.highlights} />
                  </div>
                ))}
              </details>
            )}

            {company.tech.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {company.tech.map((tech) => (
                  <Tag key={tech}>{tech}</Tag>
                ))}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
```

`components/project-card.tsx`:
```tsx
import Link from 'next/link';
import { Tag } from '@/components/tag';
import type { Project } from '@/lib/schemas';

export function ProjectCard({ project }: { project: Project }) {
  const isPrivate = project.type === 'private';

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group flex flex-col rounded-lg border border-border bg-surface p-5 transition-colors hover:border-accent"
    >
      <div className="flex items-center justify-between gap-2 font-mono text-xs">
        <span className={isPrivate ? 'text-muted' : 'text-accent'}>
          [{isPrivate ? 'NDA' : 'public'}]
        </span>
        <span className="text-muted">{project.year}</span>
      </div>
      <h3 className="mt-3 font-mono font-semibold transition-colors group-hover:text-accent">
        {project.title}
      </h3>
      <p className="mt-2 flex-1 text-sm text-muted">{project.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {project.tech.map((tech) => (
          <Tag key={tech}>{tech}</Tag>
        ))}
      </div>
    </Link>
  );
}
```

`components/skills-config.tsx`:
```tsx
import { toConfigKey } from '@/lib/format';
import type { SkillGroup } from '@/lib/schemas';

export function SkillsConfig({ groups }: { groups: SkillGroup[] }) {
  return (
    <dl className="space-y-3 rounded-lg border border-border bg-surface p-5 font-mono text-sm">
      {groups.map((group) => (
        <div key={group.label} className="sm:flex sm:gap-2">
          <dt className="shrink-0 text-accent">{toConfigKey(group.label)}:</dt>
          <dd className="text-fg">[{group.items.join(', ')}]</dd>
        </div>
      ))}
    </dl>
  );
}
```

`components/copy-email.tsx`:
```tsx
'use client';

import { useRef, useState } from 'react';

type Status = 'idle' | 'copied' | 'selected';

const messages: Record<Status, string> = {
  idle: '',
  copied: 'copied to clipboard',
  selected: 'press ⌘/Ctrl+C to copy',
};

export function CopyEmail({ email }: { email: string }) {
  const emailRef = useRef<HTMLSpanElement>(null);
  const [status, setStatus] = useState<Status>('idle');

  async function copy() {
    try {
      if (!navigator.clipboard) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(email);
      setStatus('copied');
    } catch {
      // No clipboard access (insecure context, old browser, denied
      // permission): select the address so the visitor can copy it themselves.
      const node = emailRef.current;
      const selection = window.getSelection();
      if (node && selection) {
        const range = document.createRange();
        range.selectNodeContents(node);
        selection.removeAllRanges();
        selection.addRange(range);
      }
      setStatus('selected');
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3 font-mono">
      <a
        href={`mailto:${email}`}
        className="break-all text-accent underline-offset-4 hover:underline"
      >
        <span ref={emailRef}>{email}</span>
      </a>
      <button
        type="button"
        onClick={copy}
        className="rounded border border-border px-2 py-1 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
      >
        copy email
      </button>
      <span role="status" aria-live="polite" className="text-xs text-muted">
        {messages[status]}
      </span>
    </div>
  );
}
```

`components/contact.tsx`:
```tsx
import { CopyEmail } from '@/components/copy-email';
import { profile } from '@/lib/content';
import { displayUrl } from '@/lib/format';

export function Contact() {
  const links = [
    { label: 'linkedin', href: profile.links.linkedin },
    { label: 'github', href: profile.links.github },
  ];

  return (
    <div className="space-y-6">
      <p className="max-w-2xl text-muted">
        Open to senior backend and full-stack roles, remote. The fastest way to
        reach me is email.
      </p>
      <CopyEmail email={profile.email} />
      <ul className="space-y-2 font-mono text-sm">
        {links.map((link) => (
          <li key={link.label}>
            <span className="text-muted">{link.label}: </span>
            <a
              href={link.href}
              target="_blank"
              rel="noreferrer"
              className="break-all text-accent underline-offset-4 hover:underline"
            >
              {link.label} · {displayUrl(link.href)}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

- [ ] **Step 5: Replace `app/page.tsx`**

```tsx
import { Contact } from '@/components/contact';
import { ExperienceTimeline } from '@/components/experience-timeline';
import { Hero } from '@/components/hero';
import { ProjectCard } from '@/components/project-card';
import { Section } from '@/components/section';
import { SkillsConfig } from '@/components/skills-config';
import { experience, skills } from '@/lib/content';
import { getFeaturedProjects } from '@/lib/projects';

export default function HomePage() {
  const projects = getFeaturedProjects();

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-6">
      <Hero />
      <Section id="experience" command="git log --author=marc" title="Experience">
        <ExperienceTimeline companies={experience} />
      </Section>
      <Section id="work" command="ls ~/projects" title="Selected work">
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.slug} project={project} />
          ))}
        </div>
      </Section>
      <Section id="skills" command="cat skills.yml" title="Skills">
        <SkillsConfig groups={skills} />
      </Section>
      <Section id="contact" command="ping marc" title="Contact">
        <Contact />
      </Section>
    </main>
  );
}
```

- [ ] **Step 6: Run tests**

Run: `npm run test:e2e -- tests/e2e/home.spec.ts tests/e2e/layout.spec.ts`
Expected: all PASS **except** `every internal link resolves`, which fails on `/projects/...` and `/cv` (built in Tasks 7–8). Confirm that is the only failure and that its message names one of those paths. It must pass by the end of Task 8.

- [ ] **Step 7: Lint, typecheck, unit tests, commit**

```bash
npm run format && npm run lint && npm run typecheck && npm test
git add -A
git commit -m 'Build home page: hero, experience timeline, work, skills, contact'
```

---

### Task 7: Case-study pages

**Files:**
- Create: `app/projects/[slug]/page.tsx`
- Test: `tests/e2e/projects.spec.ts`

**Interfaces:**
- Consumes: `getAllProjects()`, `getProject(slug)` (`lib/projects.ts`); `Tag` (`components/tag.tsx`); `MDXRemote` from `next-mdx-remote/rsc`.
- Produces: static routes `/projects/<slug>` for every MDX file; unknown slugs 404 (`dynamicParams = false`).

- [ ] **Step 1: Write the failing e2e tests**

`tests/e2e/projects.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

const slugs = [
  'white-label-ecommerce-platform',
  'direct-online-banking-payments',
  'realtime-event-pipeline',
  'knowledgebase-and-crm',
];

for (const slug of slugs) {
  test(`case study ${slug} renders its sections`, async ({ page }) => {
    const response = await page.goto(`/projects/${slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    for (const heading of ['Context', 'Problem', 'What I did', 'Impact']) {
      await expect(
        page.getByRole('heading', { level: 2, name: heading }),
      ).toBeVisible();
    }
  });
}

test('private case study shows NDA and no external links', async ({ page }) => {
  await page.goto('/projects/realtime-event-pipeline');
  await expect(page.getByText('[NDA]')).toBeVisible();
  await expect(page.locator('aside a[href^="http"]')).toHaveCount(0);
  await expect(page.locator('aside')).toContainText('Back-end Engineer');
});

test('back link returns to the work section', async ({ page }) => {
  await page.goto('/projects/realtime-event-pipeline');
  await expect(page.getByRole('link', { name: '← cd ..' })).toHaveAttribute(
    'href',
    '/#work',
  );
});

test('page title uses the project title', async ({ page }) => {
  await page.goto('/projects/knowledgebase-and-crm');
  await expect(page).toHaveTitle(/Knowledgebase service & Contacts CRM/);
});

test('unknown slug returns 404', async ({ page }) => {
  const response = await page.goto('/projects/does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(
    page.getByText('command not found: /projects/does-not-exist'),
  ).toBeVisible();
});

test.describe('on a 360px phone', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('case studies do not scroll horizontally', async ({ page }) => {
    for (const slug of slugs) {
      await page.goto(`/projects/${slug}`);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, slug).toBeLessThanOrEqual(0);
    }
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/projects.spec.ts`
Expected: FAIL — case-study routes return 404.

- [ ] **Step 3: Implement `app/projects/[slug]/page.tsx`**

```tsx
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { Tag } from '@/components/tag';
import { getAllProjects, getProject } from '@/lib/projects';

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;

export function generateStaticParams() {
  return getAllProjects().map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/projects/${slug}` },
    openGraph: { type: 'article', url: `/projects/${slug}` },
  };
}

export default async function ProjectPage({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const links = [
    { label: 'repo', href: project.repoUrl },
    { label: 'demo', href: project.demoUrl },
  ].filter((link): link is { label: string; href: string } => !!link.href);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link
        href="/#work"
        className="font-mono text-sm text-muted transition-colors hover:text-accent"
      >
        ← cd ..
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_200px]">
        <article className="prose max-w-[70ch] min-w-0 prose-neutral dark:prose-invert prose-headings:font-mono prose-a:text-accent">
          <p className="not-prose font-mono text-xs text-muted">
            [{project.type === 'private' ? 'NDA' : 'public'}]
          </p>
          <h1>{project.title}</h1>
          <p className="lead">{project.summary}</p>
          <MDXRemote source={project.body} />
        </article>

        <aside className="order-first font-mono text-sm lg:order-last">
          <dl className="space-y-4 lg:sticky lg:top-20">
            <div>
              <dt className="text-xs text-muted">role</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">year</dt>
              <dd>{project.year}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">stack</dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                {project.tech.map((tech) => (
                  <Tag key={tech}>{tech}</Tag>
                ))}
              </dd>
            </div>
            {links.length > 0 && (
              <div>
                <dt className="text-xs text-muted">links</dt>
                <dd className="mt-1 space-y-1">
                  {links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="block text-accent hover:underline"
                    >
                      {link.label} ↗
                    </a>
                  ))}
                </dd>
              </div>
            )}
          </dl>
        </aside>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm run test:e2e -- tests/e2e/projects.spec.ts tests/e2e/layout.spec.ts`
Expected: PASS.

- [ ] **Step 5: Lint, typecheck, unit tests, commit**

```bash
npm run format && npm run lint && npm run typecheck && npm test
git add -A
git commit -m 'Add MDX case-study pages'
```

---

### Task 8: CV page with print styles

**Files:**
- Create: `app/cv/page.tsx`, `app/cv/print-button.tsx`
- Test: `tests/e2e/cv.spec.ts`

**Interfaces:**
- Consumes: `profile`, `experience`, `skills`, `education` (`lib/content.ts`); `formatRange`, `displayUrl` (`lib/format.ts`).
- Produces: static route `/cv`.

- [ ] **Step 1: Write the failing e2e tests**

`tests/e2e/cv.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test('CV renders every section and company from site data', async ({
  page,
}) => {
  await page.goto('/cv');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Marc Alain Bustamante' }),
  ).toBeVisible();
  for (const name of ['Summary', 'Skills', 'Experience', 'Education']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  }
  for (const company of [
    'Montani International Inc.',
    'PayMongo Philippines Inc.',
    'Rakuten Travel Xchange',
    'tawk.to',
    'SplitDragon',
    'Akubo Software Philippines Inc.',
  ]) {
    await expect(page.getByText(company).first()).toBeVisible();
  }
  // Full highlights, not just the top three shown on the home page.
  await expect(
    page.getByText(/Mentored junior software engineers/),
  ).toBeVisible();
  await expect(page.getByText('Jul 2023 – Oct 2026')).toBeVisible();
});

test('CV shows contact links but never the phone number', async ({ page }) => {
  await page.goto('/cv');
  await expect(
    page.getByRole('link', { name: 'mrcbstmnte@gmail.com' }),
  ).toHaveAttribute('href', 'mailto:mrcbstmnte@gmail.com');
  await expect(
    page.getByRole('link', { name: 'linkedin.com/in/mrcbstmnte' }),
  ).toBeVisible();
  // Any run of 10+ digits with phone separators, in any format.
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/\+?\d[\d\s().-]{8,}\d/);
});

test('Download PDF opens the print dialog', async ({ page }) => {
  await page.goto('/cv');
  await page.evaluate(() => {
    window.print = () => {
      document.body.dataset.printed = 'true';
    };
  });
  await page.getByRole('button', { name: 'Download PDF' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-printed', 'true');
});

test.describe('printing from dark mode', () => {
  test.use({ colorScheme: 'dark' });

  test('prints black on white with nav and buttons hidden', async ({ page }) => {
    await page.goto('/cv');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.emulateMedia({ media: 'print' });

    const colours = await page.evaluate(() => {
      const body = getComputedStyle(document.body);
      return { background: body.backgroundColor, text: body.color };
    });
    expect(colours).toEqual({
      background: 'rgb(255, 255, 255)',
      text: 'rgb(0, 0, 0)',
    });
    await expect(page.getByRole('navigation')).toBeHidden();
    await expect(page.getByRole('button', { name: 'Download PDF' })).toBeHidden();
  });
});

test.describe('on a 360px phone', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('CV does not scroll horizontally', async ({ page }) => {
    await page.goto('/cv');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/cv.spec.ts`
Expected: FAIL — `/cv` returns 404.

- [ ] **Step 3: Implement the print button**

`app/cv/print-button.tsx`:
```tsx
'use client';

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded border border-border px-3 py-1.5 text-sm transition-colors hover:border-fg"
    >
      Download PDF
    </button>
  );
}
```

- [ ] **Step 4: Implement `app/cv/page.tsx`**

```tsx
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { education, experience, profile, skills } from '@/lib/content';
import { displayUrl, formatRange } from '@/lib/format';
import { PrintButton } from './print-button';

export const metadata: Metadata = {
  title: 'CV',
  description: `CV of ${profile.name}, ${profile.title}.`,
  alternates: { canonical: '/cv' },
};

function CvSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8">
      <h2 className="border-b border-fg pb-1 text-sm font-bold tracking-wider uppercase">
        {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

export default function CvPage() {
  const contacts = [
    { label: profile.email, href: `mailto:${profile.email}` },
    { label: displayUrl(profile.links.linkedin), href: profile.links.linkedin },
    { label: displayUrl(profile.links.github), href: profile.links.github },
  ];

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 print:max-w-none print:p-0">
      <div className="mb-8 flex justify-end print:hidden">
        <PrintButton />
      </div>

      <article className="font-sans text-[15px] leading-relaxed print:text-[11pt]">
        <header className="text-center">
          <h1 className="text-3xl font-bold">{profile.name}</h1>
          <p className="mt-1 text-muted">{profile.title}</p>
          <p className="mt-2 text-sm text-muted">{profile.location} · Remote</p>
          <p className="mt-1 flex flex-wrap justify-center gap-x-3 text-sm">
            {contacts.map((contact) => (
              <a key={contact.href} href={contact.href} className="break-all underline-offset-2 hover:underline">
                {contact.label}
              </a>
            ))}
          </p>
        </header>

        <CvSection title="Summary">
          <p>{profile.summary}</p>
        </CvSection>

        <CvSection title="Skills">
          <ul className="space-y-1">
            {skills.map((group) => (
              <li key={group.label}>
                <strong>{group.label}:</strong> {group.items.join(', ')}
              </li>
            ))}
          </ul>
        </CvSection>

        <CvSection title="Experience">
          <div className="space-y-5">
            {experience.flatMap((company) =>
              company.roles.map((role) => (
                <div
                  key={`${company.name}-${role.start}`}
                  className="break-inside-avoid"
                >
                  <h3>
                    <strong>{role.title}</strong>{' '}
                    <span className="text-sm whitespace-nowrap text-muted">
                      | {formatRange(role.start, role.end)}
                    </span>
                  </h3>
                  <p className="text-sm text-muted italic">
                    {company.name} | {company.location}
                  </p>
                  <ul className="mt-1 list-disc space-y-1 pl-5">
                    {role.highlights.map((highlight) => (
                      <li key={highlight}>{highlight}</li>
                    ))}
                  </ul>
                </div>
              )),
            )}
          </div>
        </CvSection>

        <CvSection title="Education">
          {education.map((entry) => (
            <div key={entry.degree}>
              <p>
                <strong>{entry.degree}</strong>{' '}
                <span className="text-sm text-muted">
                  | {entry.start} – {entry.end}
                </span>
              </p>
              <p className="text-sm text-muted italic">{entry.school}</p>
            </div>
          ))}
        </CvSection>
      </article>
    </main>
  );
}
```

- [ ] **Step 5: Run the full e2e suite**

Run: `npm run test:e2e`
Expected: ALL PASS, including `every internal link resolves` from Task 6.

- [ ] **Step 6: Manually check the printed PDF**

```bash
npm run build && npm run start
```
Open `http://localhost:3000/cv` in Chrome in dark mode, click **Download PDF**, choose "Save as PDF", A4. Check: white background, black text, no nav, no button, no role split awkwardly across pages. Stop the server afterwards.

- [ ] **Step 7: Lint, typecheck, unit tests, commit**

```bash
npm run format && npm run lint && npm run typecheck && npm test
git add -A
git commit -m 'Add printable CV page generated from site content'
```

---

### Task 9: SEO — Open Graph images, sitemap, robots

**Files:**
- Create: `app/opengraph-image.tsx`, `app/projects/[slug]/opengraph-image.tsx`, `app/sitemap.ts`, `app/robots.ts`
- Test: `tests/e2e/seo.spec.ts`

**Interfaces:**
- Consumes: `profile` (`lib/content.ts`), `getAllProjects`, `getProject` (`lib/projects.ts`), `siteUrl` (`lib/site.ts`).
- Produces: `/opengraph-image`, `/projects/<slug>/opengraph-image`, `/sitemap.xml`, `/robots.txt`.

- [ ] **Step 1: Write the failing e2e tests**

`tests/e2e/seo.spec.ts`:
```ts
import { expect, test } from '@playwright/test';

test('home has description and an Open Graph image', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /9\+ years/,
  );
  const ogImage = await page
    .locator('meta[property="og:image"]')
    .getAttribute('content');
  expect(ogImage).toBeTruthy();
});

test('Open Graph images render as PNG', async ({ request }) => {
  for (const path of [
    '/opengraph-image',
    '/projects/realtime-event-pipeline/opengraph-image',
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()['content-type'], path).toContain('image/png');
  }
});

test('case study pages have their own Open Graph image', async ({ page }) => {
  await page.goto('/projects/realtime-event-pipeline');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /\/projects\/realtime-event-pipeline\/opengraph-image/,
  );
});

test('sitemap lists home, CV and every case study', async ({ request }) => {
  const body = await (await request.get('/sitemap.xml')).text();
  for (const path of [
    '/cv',
    '/projects/white-label-ecommerce-platform',
    '/projects/direct-online-banking-payments',
    '/projects/realtime-event-pipeline',
    '/projects/knowledgebase-and-crm',
  ]) {
    expect(body).toContain(path);
  }
});

test('robots allows crawling and points to the sitemap', async ({ request }) => {
  const body = await (await request.get('/robots.txt')).text();
  expect(body).toContain('Allow: /');
  expect(body).toContain('/sitemap.xml');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm run test:e2e -- tests/e2e/seo.spec.ts`
Expected: FAIL — no og:image meta, 404s for `/sitemap.xml` and `/robots.txt`.

- [ ] **Step 3: Implement the OG images**

`app/opengraph-image.tsx`:
```tsx
import { ImageResponse } from 'next/og';
import { profile } from '@/lib/content';

export const alt = `${profile.name} — ${profile.title}`;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          width: '100%',
          height: '100%',
          padding: 80,
          background: '#0a0a0a',
          color: '#e7e5e4',
        }}
      >
        <div style={{ fontSize: 32, color: '#4ade80' }}>~/marc $ whoami</div>
        <div style={{ fontSize: 76, fontWeight: 700, marginTop: 24 }}>
          {profile.name}
        </div>
        <div style={{ fontSize: 36, color: '#a8a29e', marginTop: 16 }}>
          {profile.title}
        </div>
      </div>
    ),
    size,
  );
}
```

`app/projects/[slug]/opengraph-image.tsx`:
```tsx
import { ImageResponse } from 'next/og';
import { profile } from '@/lib/content';
import { getAllProjects, getProject } from '@/lib/projects';

export const alt = 'Case study';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export function generateStaticParams() {
  return getAllProjects().map((project) => ({ slug: project.slug }));
}

export default async function ProjectOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  const title = project?.title ?? 'Case study';
  const badge = project?.type === 'public' ? '[public]' : '[NDA]';

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: 80,
          background: '#0a0a0a',
          color: '#e7e5e4',
        }}
      >
        <div style={{ fontSize: 28, color: '#4ade80' }}>
          ~/marc/projects $ cat {slug}.mdx
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 28, color: '#a8a29e' }}>{badge}</div>
          <div style={{ fontSize: 64, fontWeight: 700, marginTop: 16 }}>
            {title}
          </div>
        </div>
        <div style={{ fontSize: 28, color: '#a8a29e' }}>{profile.name}</div>
      </div>
    ),
    size,
  );
}
```

- [ ] **Step 4: Implement sitemap and robots**

`app/sitemap.ts`:
```ts
import type { MetadataRoute } from 'next';
import { getAllProjects } from '@/lib/projects';
import { siteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: `${siteUrl}/` },
    { url: `${siteUrl}/cv` },
    ...getAllProjects().map((project) => ({
      url: `${siteUrl}/projects/${project.slug}`,
    })),
  ];
}
```

`app/robots.ts`:
```ts
import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
```

- [ ] **Step 5: Run the full e2e suite**

Run: `npm run test:e2e`
Expected: ALL PASS.

If the case-study `og:image` test fails because the page's `openGraph` override in `generateMetadata` drops the file-based image, remove the `openGraph` key from `generateMetadata` in `app/projects/[slug]/page.tsx` (the file convention adds `og:image` automatically) and re-run.

- [ ] **Step 6: Lint, typecheck, unit tests, commit**

```bash
npm run format && npm run lint && npm run typecheck && npm test
git add -A
git commit -m 'Add Open Graph images, sitemap and robots'
```

---

### Task 10: CI workflow, README and deployment

**Files:**
- Create: `.github/workflows/ci.yml`
- Modify (replace contents): `README.md`

**Interfaces:**
- Consumes: npm scripts from Task 1, Playwright config from Task 5.

- [ ] **Step 1: Write the CI workflow**

`.github/workflows/ci.yml`:
```yaml
name: CI

on:
  push:
  pull_request:

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report
```

- [ ] **Step 2: Replace `README.md`**

````markdown
# Portfolio — Marc Alain Bustamante

Personal site and CV. Next.js (static), TypeScript, Tailwind, MDX.

## Setup

```bash
fnm use        # Node 24, from .nvmrc
npm install
npm run dev    # http://localhost:3000
```

## Editing content

Everything lives in `content/`:

| File | What it holds |
|---|---|
| `profile.ts` | name, title, tagline, summary, email, links |
| `experience.ts` | companies and roles, **newest first** |
| `skills.ts` | skill groups |
| `education.ts` | degrees |
| `projects/*.mdx` | case studies |

The home page and `/cv` both read from these files, so edit once.

### Adding a case study

Create `content/projects/my-project.mdx` (lowercase-kebab-case filename = URL slug):

```mdx
---
title: My project
summary: One line for the card.
role: Author
year: '2026'          # quote it
tech: [TypeScript, Next.js]
type: public          # or private (NDA) — private must not have links
repoUrl: https://github.com/mrcbstmnte/my-project
demoUrl: https://example.com
featured: true
order: 5
---

## Context
## Problem
## What I did
## Impact
```

Invalid content fails the build with a message naming the file and field.

## Checks

```bash
npm run lint && npm run typecheck && npm test && npm run test:e2e
```

## Deploying

Push to GitHub and import the repo in Vercel. `main` deploys to production;
other branches get preview URLs. Set `NEXT_PUBLIC_SITE_URL` in Vercel once
you have a custom domain.
````

- [ ] **Step 3: Run every check locally, then Lighthouse**

```bash
npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e
```
Expected: all pass.

Then `npm run start`, open `http://localhost:3000/` in Chrome, DevTools → Lighthouse → Mobile → Performance, Accessibility, Best Practices, SEO. Expected: Performance, Accessibility and SEO each ≥ 95 (spec §1). Fix any accessibility finding (usually contrast or a missing label) before committing. Repeat for `/cv` and one case study. Stop the server afterwards.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m 'Add CI workflow and README'
```

- [ ] **Step 5: Hand off deployment to Marc (manual, needs his accounts)**

These steps publish the site, so they are done by Marc, not the executor:

1. Create an empty GitHub repo (e.g. `mrcbstmnte/portfolio`), then:
   `git remote add origin git@github.com:mrcbstmnte/portfolio.git && git push -u origin main`
2. In Vercel: **Add New → Project → Import** the repo. Defaults are correct (Next.js preset; Node version comes from `engines`).
3. Optional: add a custom domain in Vercel and set `NEXT_PUBLIC_SITE_URL` to it, then redeploy.
4. Check the CI run on GitHub is green.
