const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

// Parsed by hand rather than with Date so the output never shifts with the
// build machine's timezone.
export function formatYearMonth(value: string | null): string {
  if (value === null) return 'Present';
  const [year, month] = value.split('-');
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

export function formatRange(start: string, end: string | null): string {
  return `${formatYearMonth(start)} – ${formatYearMonth(end)}`;
}

export function displayUrl(url: string): string {
  return url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
}

export function toConfigKey(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}
