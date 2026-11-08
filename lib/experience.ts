import type { Company } from '@/lib/schemas';

export type HighlightGroup = { title: string; highlights: string[] };

export function splitHighlights(
  company: Company,
  topCount = 3,
): { top: string[]; rest: HighlightGroup[] } {
  const [latest, ...earlier] = company.roles;
  const rest = [
    { title: latest.title, highlights: latest.highlights.slice(topCount) },
    ...earlier.map((role) => ({
      title: role.title,
      highlights: role.highlights,
    })),
  ].filter((group) => group.highlights.length > 0);

  return { top: latest.highlights.slice(0, topCount), rest };
}
