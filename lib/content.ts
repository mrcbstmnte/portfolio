import { education as rawEducation } from '@/content/education';
import { experience as rawExperience } from '@/content/experience';
import { profile as rawProfile } from '@/content/profile';
import { skills as rawSkills } from '@/content/skills';
import {
  educationListSchema,
  experienceSchema,
  parseOrThrow,
  profileSchema,
  skillsSchema,
} from '@/lib/schemas';

export const profile = parseOrThrow(
  profileSchema,
  rawProfile,
  'content/profile.ts',
);
export const experience = parseOrThrow(
  experienceSchema,
  rawExperience,
  'content/experience.ts',
);
export const skills = parseOrThrow(
  skillsSchema,
  rawSkills,
  'content/skills.ts',
);
export const education = parseOrThrow(
  educationListSchema,
  rawEducation,
  'content/education.ts',
);
