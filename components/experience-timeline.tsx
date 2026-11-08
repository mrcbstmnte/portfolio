import { Tag } from '@/components/tag';
import { splitHighlights } from '@/lib/experience';
import { formatRange } from '@/lib/format';
import type { Company } from '@/lib/schemas';

function Highlights({ items }: { items: string[] }) {
  return (
    <ul className="text-muted mt-2 space-y-2">
      {items.map((item) => (
        <li key={item} className="flex gap-2">
          <span aria-hidden="true" className="text-accent font-mono">
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
    <ol className="border-border space-y-12 border-l pl-6">
      {companies.map((company) => {
        const { top, rest } = splitHighlights(company);
        const showRoleTitles = company.roles.length > 1;

        return (
          <li key={company.name} className="relative">
            <span
              aria-hidden="true"
              className="bg-accent absolute top-2 -left-[29px] h-2.5 w-2.5 rounded-full"
            />
            <h3 className="font-mono text-lg font-semibold">{company.name}</h3>
            <p className="text-muted font-mono text-xs">{company.location}</p>

            <div className="mt-3 space-y-1">
              {company.roles.map((role) => (
                <p key={`${role.title}-${role.start}`}>
                  <span className="font-medium">{role.title}</span>{' '}
                  <span className="text-muted font-mono text-xs whitespace-nowrap">
                    {formatRange(role.start, role.end)}
                  </span>
                </p>
              ))}
            </div>

            <Highlights items={top} />

            {rest.length > 0 && (
              <details className="group mt-3">
                <summary className="text-accent cursor-pointer font-mono text-xs">
                  <span className="group-open:hidden">show more</span>
                  <span className="hidden group-open:inline">show less</span>
                </summary>
                {rest.map((group) => (
                  <div key={group.title} className="mt-3">
                    {showRoleTitles && (
                      <p className="text-fg font-mono text-xs">{group.title}</p>
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
