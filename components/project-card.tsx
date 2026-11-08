import Image from 'next/image';
import Link from 'next/link';
import { Tag } from '@/components/tag';
import { projectBadge } from '@/lib/format';
import type { Project } from '@/lib/schemas';

export function ProjectCard({ project }: { project: Project }) {
  const [cover] = project.screenshots;
  return (
    <Link
      href={`/projects/${project.slug}`}
      className="group border-border bg-surface hover:border-accent flex flex-col rounded-lg border p-5 transition-colors"
    >
      {cover && (
        <div className="border-border -mx-5 -mt-5 mb-4 overflow-hidden rounded-t-lg border-b">
          <Image
            src={cover.src}
            alt={cover.alt}
            width={cover.width}
            height={cover.height}
            sizes="(min-width: 640px) 420px, 100vw"
            className="aspect-[16/10] w-full object-cover object-top transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
          />
        </div>
      )}
      <div className="flex items-center justify-between gap-2 font-mono text-xs">
        <span className="text-accent">{projectBadge(project.type)}</span>
        <span className="text-muted">{project.year}</span>
      </div>
      <h3 className="text-accent mt-3 font-mono font-semibold underline-offset-4 group-hover:underline">
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
