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

  it('lists the stack and product for Montani and PayMongo', () => {
    const tech = Object.fromEntries(experience.map((c) => [c.name, c.tech]));
    expect(tech['Montani International Inc.']).toEqual([
      'Ruby on Rails',
      'PostgreSQL',
    ]);
    expect(tech['PayMongo Philippines Inc.']).toEqual([
      'Ruby on Rails',
      'React.js',
    ]);
    expect(experience[0].roles[0].highlights[0]).toMatch(
      /Valore \(valore\.com\)/,
    );
  });

  it('links each company that has a public website', () => {
    const urls = Object.fromEntries(experience.map((c) => [c.name, c.url]));
    expect(urls).toEqual({
      'Montani International Inc.': 'https://valore.com',
      'PayMongo Philippines Inc.': 'https://paymongo.com',
      'Rakuten Travel Xchange': 'https://solutions.travel.rakuten.com',
      'tawk.to': 'https://www.tawk.to',
      SplitDragon: undefined,
      'Akubo Software Philippines Inc.': undefined,
    });
  });

  it('credits the team for the tawk.to Knowledgebase and CRM', () => {
    const tawk = experience.find((c) => c.name === 'tawk.to');
    const highlight = tawk?.roles[0].highlights.find((h) =>
      h.includes('Knowledgebase'),
    );
    expect(highlight).toMatch(/team/);
    expect(highlight).not.toMatch(/^Built /);
  });

  it('credits the team for the Kafka pipeline and Valore bullets', () => {
    const highlights = experience
      .filter((c) => ['tawk.to', 'Montani International Inc.'].includes(c.name))
      .flatMap((c) => c.roles[0].highlights)
      .filter((h) => /Kafka|Valore/.test(h));
    expect(highlights).toHaveLength(3);
    for (const highlight of highlights) {
      expect(highlight).not.toMatch(/^(Built|Designed and built) /);
    }
  });

  it('has the seven CV skill groups and education', () => {
    expect(skills).toHaveLength(8);
    expect(education[0].degree).toBe('BS Computer Engineering');
  });

  it('lists the testing frameworks', () => {
    const testing = skills.find((group) => group.label === 'Testing');
    expect(testing?.items).toEqual(['RSpec', 'Jest', 'Vitest', 'Playwright']);
  });
});
