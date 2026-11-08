import { describe, expect, it } from 'vitest';
import {
  displayUrl,
  projectBadge,
  formatRange,
  formatYearMonth,
  toConfigKey,
} from '@/lib/format';

describe('formatYearMonth', () => {
  it('formats YYYY-MM as short month and year', () => {
    expect(formatYearMonth('2023-07')).toBe('Jul 2023');
    expect(formatYearMonth('2017-01')).toBe('Jan 2017');
    expect(formatYearMonth('2026-12')).toBe('Dec 2026');
  });

  it('formats null as Present', () => {
    expect(formatYearMonth(null)).toBe('Present');
  });
});

describe('formatRange', () => {
  it('joins start and end with an en dash', () => {
    expect(formatRange('2023-01', '2023-07')).toBe('Jan 2023 – Jul 2023');
    expect(formatRange('2023-01', null)).toBe('Jan 2023 – Present');
  });
});

describe('displayUrl', () => {
  it('strips protocol, www and trailing slash', () => {
    expect(displayUrl('https://www.linkedin.com/in/mrcbstmnte/')).toBe(
      'linkedin.com/in/mrcbstmnte',
    );
    expect(displayUrl('https://github.com/mrcbstmnte')).toBe(
      'github.com/mrcbstmnte',
    );
  });
});

describe('toConfigKey', () => {
  it('turns a label into a snake_case key', () => {
    expect(toConfigKey('Languages & Runtimes')).toBe('languages_runtimes');
    expect(toConfigKey('AI-Assisted Development')).toBe(
      'ai_assisted_development',
    );
  });
});

describe('projectBadge', () => {
  it('labels each project type', () => {
    expect(projectBadge('private')).toBe('[NDA]');
    expect(projectBadge('public')).toBe('[public]');
    expect(projectBadge('client')).toBe('[client]');
  });
});
