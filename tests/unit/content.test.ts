import { describe, expect, it } from 'vitest';
import { education, experience, profile, skills } from '@/lib/content';

describe('site content', () => {
  it('has a profile with no phone number', () => {
    expect(profile.name).toBe('Marc Alain Bustamante');
    expect(profile.phone).toBeUndefined();
  });

  it('lists all six companies, newest first', () => {
    expect(experience.map((c) => c.name)).toEqual([
      'Montani International Inc.',
      'PayMongo Philippines Inc.',
      'Rakuten Travel Xchange',
      'tawk.to',
      'SplitDragon',
      'Akubo Software Philippines Inc.',
    ]);
    const latestStarts = experience.map((c) => c.roles[0].start);
    expect([...latestStarts].sort().reverse()).toEqual(latestStarts);
  });

  it('orders roles within a company newest first', () => {
    for (const company of experience) {
      const starts = company.roles.map((r) => r.start);
      expect([...starts].sort().reverse()).toEqual(starts);
    }
  });

  it('groups both PayMongo roles under one company', () => {
    const paymongo = experience.find((c) => c.name.startsWith('PayMongo'));
    expect(paymongo?.roles.map((r) => r.title)).toEqual([
      'Senior Software Engineer (Interim Technical Lead)',
      'Software Engineer II',
    ]);
  });

  it('has the seven CV skill groups and education', () => {
    expect(skills).toHaveLength(7);
    expect(education[0].degree).toBe('BS Computer Engineering');
  });
});
