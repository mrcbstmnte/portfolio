import { describe, expect, it } from 'vitest';
import { splitHighlights } from '@/lib/experience';
import type { Company } from '@/lib/schemas';

const company: Company = {
  name: 'Acme',
  location: 'Remote',
  tech: [],
  roles: [
    {
      title: 'Senior',
      start: '2022-01',
      end: null,
      highlights: ['a', 'b', 'c', 'd'],
    },
    { title: 'Junior', start: '2020-01', end: '2022-01', highlights: ['e'] },
  ],
};

describe('splitHighlights', () => {
  it('takes the top highlights from the latest role', () => {
    expect(splitHighlights(company).top).toEqual(['a', 'b', 'c']);
  });

  it('groups the remaining highlights by role', () => {
    expect(splitHighlights(company).rest).toEqual([
      { title: 'Senior', highlights: ['d'] },
      { title: 'Junior', highlights: ['e'] },
    ]);
  });

  it('omits empty groups', () => {
    const single: Company = { ...company, roles: [company.roles[0]] };
    expect(splitHighlights(single, 4).rest).toEqual([]);
  });
});
