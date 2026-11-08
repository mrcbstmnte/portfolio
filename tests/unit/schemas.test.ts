import { describe, expect, it } from 'vitest';
import {
  companySchema,
  parseOrThrow,
  profileSchema,
  projectFrontmatterSchema,
} from '@/lib/schemas';

const validProject = {
  title: 'Alpha',
  summary: 'A small tool',
  role: 'Author',
  year: '2024',
  tech: ['Ruby'],
  type: 'public',
  repoUrl: 'https://github.com/example/alpha',
  featured: true,
  order: 1,
};

const validCompany = {
  name: 'Acme',
  location: 'Remote',
  tech: ['Node.js'],
  roles: [
    {
      title: 'Engineer',
      start: '2020-01',
      end: '2021-06',
      highlights: ['Built things'],
    },
  ],
};

describe('projectFrontmatterSchema', () => {
  it('accepts a valid public project', () => {
    expect(projectFrontmatterSchema.safeParse(validProject).success).toBe(true);
  });

  it('accepts a private project without links', () => {
    const result = projectFrontmatterSchema.safeParse({
      ...validProject,
      type: 'private',
      repoUrl: undefined,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a private project that links to its source code', () => {
    expect(
      projectFrontmatterSchema.safeParse({ ...validProject, type: 'private' })
        .success,
    ).toBe(false);
  });

  it('accepts a private project that links to its live product', () => {
    expect(
      projectFrontmatterSchema.safeParse({
        ...validProject,
        type: 'private',
        repoUrl: undefined,
        demoUrl: 'https://example.com',
      }).success,
    ).toBe(true);
  });

  it('rejects non-http links', () => {
    const result = projectFrontmatterSchema.safeParse({
      ...validProject,
      repoUrl: 'javascript:alert(1)',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an unquoted numeric year', () => {
    expect(
      projectFrontmatterSchema.safeParse({ ...validProject, year: 2024 })
        .success,
    ).toBe(false);
  });

  it('rejects a missing title', () => {
    const withoutTitle: Record<string, unknown> = { ...validProject };
    delete withoutTitle.title;
    expect(projectFrontmatterSchema.safeParse(withoutTitle).success).toBe(
      false,
    );
  });
});

describe('companySchema', () => {
  it('accepts a valid company', () => {
    expect(companySchema.safeParse(validCompany).success).toBe(true);
  });

  it('accepts a current role with a null end', () => {
    const company = {
      ...validCompany,
      roles: [{ ...validCompany.roles[0], end: null }],
    };
    expect(companySchema.safeParse(company).success).toBe(true);
  });

  it('rejects an invalid month', () => {
    const company = {
      ...validCompany,
      roles: [{ ...validCompany.roles[0], start: '2020-13' }],
    };
    expect(companySchema.safeParse(company).success).toBe(false);
  });

  it('rejects a role that ends before it starts', () => {
    const company = {
      ...validCompany,
      roles: [{ ...validCompany.roles[0], start: '2022-01', end: '2021-06' }],
    };
    expect(companySchema.safeParse(company).success).toBe(false);
  });

  it('rejects a company with no roles', () => {
    expect(
      companySchema.safeParse({ ...validCompany, roles: [] }).success,
    ).toBe(false);
  });
});

describe('profileSchema', () => {
  it('rejects an invalid email', () => {
    const result = profileSchema.safeParse({
      name: 'A',
      title: 'B',
      tagline: 'C',
      summary: 'D',
      location: 'E',
      yearsOfExperience: 9,
      email: 'not-an-email',
      links: {
        github: 'https://github.com/a',
        linkedin: 'https://www.linkedin.com/in/a',
      },
    });
    expect(result.success).toBe(false);
  });
});

describe('parseOrThrow', () => {
  it('returns parsed data when valid', () => {
    expect(parseOrThrow(companySchema, validCompany, 'x.ts').name).toBe('Acme');
  });

  it('throws an error naming the source file and the bad field', () => {
    expect(() =>
      parseOrThrow(
        companySchema,
        { ...validCompany, name: '' },
        'content/x.ts',
      ),
    ).toThrow(/content\/x\.ts[\s\S]*name/);
  });
});
