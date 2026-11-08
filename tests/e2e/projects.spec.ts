import { expect, test } from '@playwright/test';

const slugs = [
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
