# Portfolio Site — Design Spec

**Date:** 2026-11-08
**Owner:** Marc Alain Bustamante
**Location:** `~/www/portfolio`

## 1. Goal

A personal site that serves two purposes:

1. **Job hunting** — recruiters and hiring managers land on it, understand Marc's seniority quickly, and act: view/download the CV or send an email.
2. **Professional presence** — a stable home linked from LinkedIn/GitHub that showcases experience and selected work.

**Success criteria**

- A recruiter skimming the home page for ~30 seconds sees: name, title, years of experience, key domains (fintech/payments, e-commerce, distributed systems), and a clear "View CV" / "Email me" action.
- The CV is generated from the same data as the site — editing a role once updates both.
- The site looks polished on desktop and mobile, in dark and light mode.
- Fully static, free to host on Vercel, fast (Lighthouse ≥ 95 on performance, accessibility, SEO).

## 2. Decisions (agreed during brainstorming)

| Topic | Decision |
|---|---|
| Audience | Recruiters/hiring managers + general professional presence |
| Work to show | Mix: private/NDA case studies + public projects (added later) |
| CV | Generated from site data at `/cv`; "Download PDF" via browser print |
| Content storage | Typed TS data files + MDX for case studies |
| Visual style | Developer/terminal-flavoured, tasteful — not a gimmick terminal |
| Accent colour | Terminal green |
| Contact | `mailto:` + copy-email button + LinkedIn + GitHub. No form. |
| Structure | Single-scroll home + `/projects/[slug]` + `/cv` |
| Hosting | Vercel (free tier) |
| Phone number | Not published anywhere on the site (optional, hidden field only) |

## 3. Stack

- Next.js (latest stable, App Router), all routes statically generated
- TypeScript (strict)
- Tailwind CSS
- MDX for case studies (frontmatter parsed with `gray-matter`, rendered with `next-mdx-remote` (RSC API))
- Zod for content validation
- `next-themes` for dark/light toggle
- Fonts via `next/font`: Geist Mono for headings/accents, Geist Sans for body
- Vitest (unit), Playwright (smoke/e2e)
- ESLint + Prettier with `singleQuote: true`
- Node 20+ (pinned in `.nvmrc`); local machine currently on 18.16 and must be upgraded

## 4. Content model

All content lives in `content/`, separate from UI code.

```
content/
  profile.ts       name, title, tagline, location, summary, yearsOfExperience,
                   email, links { github, linkedin }, phone? (never rendered)
  experience.ts    Company[]
  skills.ts        SkillGroup[]
  education.ts     Education[]
  projects/
    <slug>.mdx     frontmatter + case-study body
```

**Types (validated with Zod at build time)**

```ts
type Role = {
  title: string
  start: string        // 'YYYY-MM'
  end: string | null   // null = present
  highlights: string[] // full list; first 2–3 shown on home
}

type Company = {
  name: string
  location: string     // e.g. 'Remote', 'On-site'
  roles: Role[]        // multiple roles = promotion, rendered stacked
  tech: string[]
}

type SkillGroup = { label: string; items: string[] }

type Education = { degree: string; school: string; start: string; end: string }
```

**Project frontmatter**

```yaml
title: string
summary: string          # one-liner for cards
role: string
year: string             # e.g. '2023–2026'
tech: string[]
type: public | private
repoUrl?: string         # public only
demoUrl?: string         # public only
featured: boolean        # shown on home
order: number            # sort order on home
```

Private projects render an `[NDA]` badge and no links. Case-study body follows: **Context → Problem → What I did → Impact**.

**Loaders (`lib/`)**

- `lib/content.ts` — exports validated `profile`, `experience`, `skills`, `education`
- `lib/projects.ts` — `getAllProjects()`, `getFeaturedProjects()`, `getProject(slug)`; validates frontmatter, throws a descriptive error on invalid data (fails the build)

**Initial content**, sourced from the existing CV PDF:

- Experience: Montani International, PayMongo (SE II → Senior SE / Interim Tech Lead, grouped), Rakuten Travel Xchange, tawk.to, SplitDragon, Akubo Software
- Skills: the 7 groups from the CV
- Education: BS Computer Engineering, University of St. La Salle (2010–2016)
- Draft case studies (private), written from CV bullets for Marc to edit:
  1. White-label multi-storefront e-commerce platform + payment gateway migration (Montani)
  2. Direct Online Banking & QR Ph payments (PayMongo)
  3. Real-time event pipeline: Kafka + MongoDB Change Streams (tawk.to)
  4. Knowledgebase service & Contacts CRM (tawk.to)

Public GitHub projects are added later by dropping in new MDX files.

## 5. Pages

### Home `/` (single scroll)

1. **Hero** — prompt line `~/marc $ whoami` with blinking cursor; name; "Senior Software Engineer · Backend & Full Stack"; one-line summary; badges "Remote · Bacolod City, PH" and "9+ yrs"; buttons **View CV** (→ `/cv`) and **Email me** (`mailto:`).
2. **Experience** — `git log`-style vertical timeline. Per company: name, location, role title(s) with dates, top 2–3 highlights, tech tags in monospace; expander reveals full highlights.
3. **Selected work** — cards for featured projects: title, summary, `[NDA]`/`[public]` badge, tech tags; link to `/projects/[slug]`.
4. **Skills** — groups rendered config-style (`languages: [ruby, node.js, …]`).
5. **Contact** — email with copy-to-clipboard button, LinkedIn, GitHub.

Sticky top nav with section anchors, theme toggle, and a "CV" link.

### Case study `/projects/[slug]`

Readable article layout (max ~70ch). Metadata sidebar (stacks above content on mobile): role, year, stack, links (public only). Back link to home. Statically generated via `generateStaticParams`. Unknown slug → `notFound()`.

### CV `/cv`

Conventional, ATS-friendly layout — **no terminal styling** — rendered from the same content data: header (name, title, location, email, LinkedIn, GitHub; no phone), summary, skills, experience (all highlights), education. "Download PDF" button calls `window.print()`. Print stylesheet hides nav/buttons, uses A4/Letter-safe margins, avoids breaking a role across pages where possible.

### 404

Terminal-themed: `command not found: <path>` with link home.

## 6. Visual design

- Dark mode default, light mode via toggle (persisted, respects system preference on first visit)
- Near-black background, off-white text, single **terminal-green** accent; light mode uses a darker green that passes WCAG AA contrast
- Monospace for headings, labels, tags, prompts; sans for body copy
- Motion: blinking hero cursor, subtle fade/slide-in on scroll; all disabled under `prefers-reduced-motion`
- Responsive from 360px up; no horizontal scroll

## 7. SEO & sharing

- Per-page `metadata` (title, description, canonical)
- Open Graph image generated with `next/og` (name, title, green accent) for home and each case study
- `sitemap.ts` and `robots.ts`
- Vercel Analytics (enabled, no cookies)

## 8. Error handling

- Invalid content data or frontmatter → Zod error naming the file and field → build fails (never ships broken content)
- Unknown project slug → 404 page
- Clipboard API unavailable → copy button falls back to selecting the email text

## 9. Testing

- **Vitest**: content schema validation (valid passes, missing/invalid fields rejected), project loader (sorting by `order`, featured filtering, slug lookup, unknown slug), date formatting helper (`YYYY-MM` → `Jul 2023`, `null` → `Present`)
- **Playwright** (against production build): home renders all 5 sections; each project page loads with its title; `/cv` renders all companies and contains no phone number; unknown slug returns 404; all internal links resolve
- **CI (GitHub Actions)**: lint → typecheck → unit tests → build → Playwright, on every push/PR

## 10. Deployment

- GitHub repo connected to Vercel; `main` deploys to production, branches get preview deploys
- Custom domain optional, configured later in Vercel

## 11. Out of scope

Blog, contact form, CMS, i18n, testimonials, talks. All can be added later without restructuring.
