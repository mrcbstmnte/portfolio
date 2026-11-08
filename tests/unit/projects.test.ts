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
  type: 'team',
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

  it('throws naming the file when the frontmatter is not valid YAML', () => {
    const dir = makeDir({
      'broken.mdx': '---\ntitle: Broken\nsummary: a: b: c\n---\n\nBody.\n',
    });
    expect(() => loadProjects(dir)).toThrow(/broken\.mdx/);
  });

  it('throws when a filename is not a valid slug', () => {
    const dir = makeDir({
      'My Project.mdx': mdx({ ...base, title: 'Mine', order: '1' }),
    });
    expect(() => loadProjects(dir)).toThrow(/My Project\.mdx/);
  });
});

describe('screenshots', () => {
  const withShot = `---
title: Alpha
summary: Summary
role: Engineer
year: '2024'
tech: [Ruby]
type: team
featured: true
order: 1
screenshots:
  - src: /projects/alpha/01-home.webp
    alt: Home page
    caption: The home page
    width: 1600
    height: 1000
---

Body.
`;

  it('loads screenshots whose files exist under public/', () => {
    const dir = makeDir({ 'alpha.mdx': withShot });
    const publicDir = makeDir({});
    fs.mkdirSync(path.join(publicDir, 'projects', 'alpha'), {
      recursive: true,
    });
    fs.writeFileSync(path.join(publicDir, 'projects/alpha/01-home.webp'), '');
    const [project] = loadProjects(dir, publicDir);
    expect(project.screenshots.map((s) => s.src)).toEqual([
      '/projects/alpha/01-home.webp',
    ]);
  });

  it('throws naming the case study and image when a file is missing', () => {
    const dir = makeDir({ 'alpha.mdx': withShot });
    expect(() => loadProjects(dir, makeDir({}))).toThrow(
      /alpha\.mdx[\s\S]*\/projects\/alpha\/01-home\.webp/,
    );
  });
});

describe('real case studies', () => {
  it('loads the four case studies, all featured', () => {
    expect(getAllProjects().map((p) => p.slug)).toEqual([
      'resist-store',
      'white-label-ecommerce-platform',
      'direct-online-banking-payments',
      'knowledgebase-and-crm',
    ]);
    expect(getFeaturedProjects()).toHaveLength(4);
  });

  it('links the Valore case study to the live site', () => {
    const valore = getProject('white-label-ecommerce-platform');
    expect(valore?.title).toMatch(/Valore/);
    expect(valore?.demoUrl).toBe('https://valore.com');
    expect(valore?.repoUrl).toBeUndefined();
    expect(valore?.tech).toEqual(['Ruby on Rails', 'PostgreSQL']);
  });

  it('marks RESIST as a client build linking to the live store', () => {
    const resist = getProject('resist-store');
    expect(resist?.type).toBe('client');
    expect(resist?.demoUrl).toBe('https://resist-store.vercel.app');
    expect(resist?.repoUrl).toBeUndefined();
  });

  it('has screenshots only where the work is public', () => {
    const counts = Object.fromEntries(
      getAllProjects().map((p) => [p.slug, p.screenshots.length]),
    );
    expect(counts).toEqual({
      'resist-store': 5,
      'white-label-ecommerce-platform': 2,
      'direct-online-banking-payments': 0,
      'knowledgebase-and-crm': 4,
    });
  });

  it('credits the team, not just Marc, for the tawk.to services', () => {
    const project = getProject('knowledgebase-and-crm');
    const text = [
      project?.body,
      ...(project?.screenshots ?? []).map((s) => s.caption),
    ].join('\n');
    expect(text).not.toMatch(/\bI built\b|^- Built the/m);
    expect(project?.body).toMatch(/team/);
  });

  it.each(['knowledgebase-and-crm', 'white-label-ecommerce-platform'])(
    'credits the team in the %s case study',
    (slug) => {
      const body = getProject(slug)?.body ?? '';
      expect(body).toMatch(/team/);
      expect(body).not.toMatch(/^- (Built|Designed and built) /m);
    },
  );

  it('covers the event pipeline in the Knowledgebase and CRM case study', () => {
    const project = getProject('knowledgebase-and-crm');
    expect(project?.tech).toContain('Apache Kafka');
    expect(project?.body).toMatch(/Change Streams/);
    expect(getProject('realtime-event-pipeline')).toBeNull();
  });

  it('lists the PayMongo stack on its case study', () => {
    expect(getProject('direct-online-banking-payments')?.tech).toEqual([
      'Ruby on Rails',
      'React.js',
      'QR Ph',
    ]);
  });

  it('finds a project by slug and returns null for unknown slugs', () => {
    expect(getProject('knowledgebase-and-crm')?.type).toBe('team');
    expect(getProject('does-not-exist')).toBeNull();
  });
});
