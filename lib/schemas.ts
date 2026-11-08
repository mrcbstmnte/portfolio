import { z } from 'zod';

const yearMonth = z
  .string()
  .regex(/^\d{4}-(0[1-9]|1[0-2])$/, 'must be in YYYY-MM format');
const year = z.string().regex(/^\d{4}$/, 'must be a four-digit year');
const httpUrl = z.url({ protocol: /^https?$/ });
const nonEmpty = z.string().trim().min(1);

export const profileSchema = z.object({
  name: nonEmpty,
  title: nonEmpty,
  tagline: nonEmpty,
  summary: nonEmpty,
  location: nonEmpty,
  yearsOfExperience: z.number().int().positive(),
  email: z.email(),
  links: z.object({ github: httpUrl, linkedin: httpUrl }),
  phone: z.string().optional(),
});

export const roleSchema = z
  .object({
    title: nonEmpty,
    start: yearMonth,
    end: yearMonth.nullable(),
    highlights: z.array(nonEmpty).min(1),
  })
  .refine((role) => role.end === null || role.end >= role.start, {
    message: 'end must not be before start',
    path: ['end'],
  });

export const companySchema = z.object({
  name: nonEmpty,
  location: nonEmpty,
  url: httpUrl.optional(),
  roles: z.array(roleSchema).min(1),
  tech: z.array(nonEmpty),
});

export const experienceSchema = z.array(companySchema).min(1);

export const skillGroupSchema = z.object({
  label: nonEmpty,
  items: z.array(nonEmpty).min(1),
});

export const skillsSchema = z.array(skillGroupSchema).min(1);

export const educationSchema = z.object({
  degree: nonEmpty,
  school: nonEmpty,
  start: year,
  end: year,
});

export const educationListSchema = z.array(educationSchema);

export const projectFrontmatterSchema = z
  .object({
    title: nonEmpty,
    summary: nonEmpty,
    role: nonEmpty,
    year: nonEmpty,
    tech: z.array(nonEmpty).min(1),
    type: z.enum(['public', 'private', 'client']),
    repoUrl: httpUrl.optional(),
    demoUrl: httpUrl.optional(),
    featured: z.boolean(),
    order: z.number().int(),
  })
  .refine(
    // A live product is public anyway; only source code stays private.
    (project) => project.type === 'public' || !project.repoUrl,
    {
      message: 'only public projects may have a repoUrl',
      path: ['type'],
    },
  );

export type Profile = z.infer<typeof profileSchema>;
export type Role = z.infer<typeof roleSchema>;
export type Company = z.infer<typeof companySchema>;
export type SkillGroup = z.infer<typeof skillGroupSchema>;
export type Education = z.infer<typeof educationSchema>;
export type ProjectFrontmatter = z.infer<typeof projectFrontmatterSchema>;
export type Project = ProjectFrontmatter & { slug: string; body: string };

export function parseOrThrow<T>(
  schema: z.ZodType<T>,
  data: unknown,
  source: string,
): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new Error(
      `Invalid content in ${source}:\n${z.prettifyError(result.error)}`,
    );
  }
  return result.data;
}
