import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import {
  parseOrThrow,
  projectFrontmatterSchema,
  type Project,
} from '@/lib/schemas';

const PROJECTS_DIR = path.join(process.cwd(), 'content', 'projects');
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function loadProjects(
  dir = PROJECTS_DIR,
  publicDir = PUBLIC_DIR,
): Project[] {
  const files = fs.readdirSync(dir).filter((file) => file.endsWith('.mdx'));

  const projects = files.map((file) => {
    const source = path.join(path.relative(process.cwd(), dir), file);
    const slug = file.replace(/\.mdx$/, '');
    if (!SLUG.test(slug)) {
      throw new Error(
        `Invalid content in ${source}:\nfilename must be lowercase-kebab-case, e.g. my-project.mdx`,
      );
    }

    let parsed;
    try {
      parsed = matter(fs.readFileSync(path.join(dir, file), 'utf8'));
    } catch (error) {
      throw new Error(
        `Invalid content in ${source}:\nfrontmatter is not valid YAML (${(error as Error).message.split('\n')[0]})`,
      );
    }
    const { data, content } = parsed;
    const frontmatter = parseOrThrow(projectFrontmatterSchema, data, source);
    for (const shot of frontmatter.screenshots) {
      if (!fs.existsSync(path.join(publicDir, shot.src))) {
        throw new Error(
          `Invalid content in ${source}:\nscreenshot not found: public${shot.src}`,
        );
      }
    }
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
