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

  it('links the Valore case study to the live site', () => {
    const valore = getProject('white-label-ecommerce-platform');
    expect(valore?.title).toMatch(/Valore/);
    expect(valore?.demoUrl).toBe('https://valore.com');
    expect(valore?.repoUrl).toBeUndefined();
    expect(valore?.tech).toEqual(['Ruby on Rails', 'PostgreSQL']);
  });

  it('lists the PayMongo stack on its case study', () => {
    expect(getProject('direct-online-banking-payments')?.tech).toEqual([
      'Ruby on Rails',
      'React.js',
      'QR Ph',
    ]);
  });

  it('finds a project by slug and returns null for unknown slugs', () => {
    expect(getProject('realtime-event-pipeline')?.type).toBe('private');
    expect(getProject('does-not-exist')).toBeNull();
  });
});
