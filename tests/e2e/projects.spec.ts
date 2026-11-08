import { expect, test } from '@playwright/test';

const slugs = [
  'resist-store',
  'white-label-ecommerce-platform',
  'direct-online-banking-payments',
  'realtime-event-pipeline',
  'knowledgebase-and-crm',
];

for (const slug of slugs) {
  test(`case study ${slug} renders its sections`, async ({ page }) => {
    const response = await page.goto(`/projects/${slug}`);
    expect(response?.status()).toBe(200);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    for (const heading of ['Context', 'Problem', 'What I did', 'Impact']) {
      await expect(
        page.getByRole('heading', { level: 2, name: heading }),
      ).toBeVisible();
    }
  });
}

test('private case study shows NDA and no external links', async ({ page }) => {
  await page.goto('/projects/realtime-event-pipeline');
  await expect(page.getByText('[NDA]')).toBeVisible();
  await expect(page.locator('aside a[href^="http"]')).toHaveCount(0);
  await expect(page.locator('aside')).toContainText('Back-end Engineer');
});

test('NDA case study can link to its live product', async ({ page }) => {
  await page.goto('/projects/white-label-ecommerce-platform');
  await expect(page.getByText('[NDA]')).toBeVisible();
  await expect(
    page.locator('aside').getByRole('link', { name: 'live site ↗' }),
  ).toHaveAttribute('href', 'https://valore.com');
});

test('client case study shows its badge and live store link', async ({
  page,
}) => {
  await page.goto('/projects/resist-store');
  await expect(page.getByText('[client]')).toBeVisible();
  await expect(
    page.locator('aside').getByRole('link', { name: 'live site ↗' }),
  ).toHaveAttribute('href', 'https://resist-store.vercel.app');
  await expect(page.locator('aside a[href*="github.com"]')).toHaveCount(0);
});

test('RESIST case study shows a captioned screenshot gallery', async ({
  page,
}) => {
  await page.goto('/projects/resist-store');
  const figures = page.locator('figure');
  await expect(figures).toHaveCount(5);
  await expect(figures.first().locator('figcaption')).not.toBeEmpty();
  const first = figures.first().locator('img');
  await expect(first).toHaveAttribute('alt', /.+/);
  await expect
    .poll(() => first.evaluate((img: HTMLImageElement) => img.naturalWidth))
    .toBeGreaterThan(0);
  await expect(figures.first().locator('a')).toHaveAttribute(
    'href',
    '/projects/resist-store/01-storefront.webp',
  );
});

test('NDA case study without screenshots has no gallery', async ({ page }) => {
  await page.goto('/projects/realtime-event-pipeline');
  await expect(page.locator('figure')).toHaveCount(0);
});

test('back link returns to the work section', async ({ page }) => {
  await page.goto('/projects/realtime-event-pipeline');
  await expect(page.getByRole('link', { name: '← cd ..' })).toHaveAttribute(
    'href',
    '/#work',
  );
});

test('page title uses the project title', async ({ page }) => {
  await page.goto('/projects/knowledgebase-and-crm');
  await expect(page).toHaveTitle(/Knowledgebase service & Contacts CRM/);
});

test('unknown slug returns 404', async ({ page }) => {
  const response = await page.goto('/projects/does-not-exist');
  expect(response?.status()).toBe(404);
  await expect(
    page.getByText('command not found: /projects/does-not-exist'),
  ).toBeVisible();
});

test.describe('on a 360px phone', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('case studies do not scroll horizontally', async ({ page }) => {
    for (const slug of slugs) {
      await page.goto(`/projects/${slug}`);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow, slug).toBeLessThanOrEqual(0);
    }
  });
});

test.describe('printing from dark mode', () => {
  test.use({ colorScheme: 'dark' });

  test('case study text prints dark on white', async ({ page }) => {
    await page.goto('/projects/realtime-event-pipeline');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.emulateMedia({ media: 'print' });

    // Resolve each computed colour (may be oklch/lab) to RGB via a canvas.
    const brightest = await page.evaluate(() => {
      const ctx = document.createElement('canvas').getContext('2d')!;
      const elements = document.querySelectorAll(
        'article h1, article h2, article p, article li',
      );
      let max = 0;
      for (const el of elements) {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = getComputedStyle(el).color;
        ctx.fillRect(0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        max = Math.max(max, r, g, b);
      }
      return max;
    });
    expect(brightest).toBeLessThan(120);
  });
});
