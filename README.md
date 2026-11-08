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

| File             | What it holds                               |
| ---------------- | ------------------------------------------- |
| `profile.ts`     | name, title, tagline, summary, email, links |
| `experience.ts`  | companies and roles, **newest first**       |
| `skills.ts`      | skill groups                                |
| `education.ts`   | degrees                                     |
| `projects/*.mdx` | case studies                                |

The home page and `/cv` both read from these files, so edit once.

### Adding a case study

Create `content/projects/my-project.mdx` (lowercase-kebab-case filename = URL slug):

```mdx
---
title: My project
summary: One line for the card.
role: Author
year: '2026' # quote it
tech: [TypeScript, Next.js]
type: public # public | team | client — team and client may link a live site, never a repo
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

### Screenshots (optional)

Put images in `public/projects/<slug>/` (WebP, about 1600px wide) and list them in the frontmatter. The first one is also the card thumbnail on the home page:

```yaml
screenshots:
  - src: /projects/my-project/01-home.webp
    alt: 'What the image shows, for screen readers'
    caption: 'One line on why it matters.'
    width: 1600
    height: 1000
```

Quote `alt` and `caption` (they often contain colons). Only show what you're allowed to share, and no real customer data.

Invalid content fails the build with a message naming the file and field, including a screenshot file that doesn't exist.

## Checks

```bash
npm run lint && npm run typecheck && npm test && npm run test:e2e
```

## Deploying

Push to GitHub and import the repo in Vercel. `main` deploys to production;
other branches get preview URLs. Set `NEXT_PUBLIC_SITE_URL` in Vercel once
you have a custom domain.
