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

    const { data, content } = matter(
      fs.readFileSync(path.join(dir, file), 'utf8'),
    );
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
