import Link from 'next/link';
import { Tag } from '@/components/tag';
import type { Project } from '@/lib/schemas';

export function ProjectCard({ project }: { project: Project }) {
  const isPrivate = project.type === 'private';

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group border-border bg-surface hover:border-accent flex flex-col rounded-lg border p-5 transition-colors"
    >
      <div className="flex items-center justify-between gap-2 font-mono text-xs">
        <span className={isPrivate ? 'text-muted' : 'text-accent'}>
          [{isPrivate ? 'NDA' : 'public'}]
        </span>
        <span className="text-muted">{project.year}</span>
      </div>
      <h3 className="group-hover:text-accent mt-3 font-mono font-semibold transition-colors">
        {project.title}
      </h3>
      <p className="text-muted mt-2 flex-1 text-sm">{project.summary}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {project.tech.map((tech) => (
          <Tag key={tech}>{tech}</Tag>
        ))}
      </div>
    </Link>
  );
}
