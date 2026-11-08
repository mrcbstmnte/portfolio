import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { Tag } from '@/components/tag';
import { projectBadge } from '@/lib/format';
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
    { label: 'live site', href: project.demoUrl },
  ].filter((link): link is { label: string; href: string } => !!link.href);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      <Link
        href="/#work"
        className="text-muted hover:text-accent font-mono text-sm transition-colors"
      >
        ← cd ..
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_200px]">
        <article className="prose prose-neutral dark:not-print:prose-invert prose-headings:font-mono prose-a:text-accent max-w-[70ch] min-w-0">
          <p className="not-prose text-muted font-mono text-xs">
            {projectBadge(project.type)}
          </p>
          <h1>{project.title}</h1>
          <p className="lead">{project.summary}</p>
          <MDXRemote source={project.body} />
        </article>

        <aside className="order-first font-mono text-sm lg:order-last">
          <dl className="space-y-4 lg:sticky lg:top-20">
            <div>
              <dt className="text-muted text-xs">role</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt className="text-muted text-xs">year</dt>
              <dd>{project.year}</dd>
            </div>
            <div>
              <dt className="text-muted text-xs">stack</dt>
              <dd className="mt-1 flex flex-wrap gap-2">
                {project.tech.map((tech) => (
                  <Tag key={tech}>{tech}</Tag>
                ))}
              </dd>
            </div>
            {links.length > 0 && (
              <div>
                <dt className="text-muted text-xs">links</dt>
                <dd className="mt-1 space-y-1">
                  {links.map((link) => (
                    <a
                      key={link.label}
                      href={link.href}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent block hover:underline"
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
