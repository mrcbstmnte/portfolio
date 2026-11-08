import { expect, test } from '@playwright/test';

test('home has description and an Open Graph image', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('meta[name="description"]')).toHaveAttribute(
    'content',
    /9\+ years/,
  );
  const ogImage = await page
    .locator('meta[property="og:image"]')
    .getAttribute('content');
  expect(ogImage).toBeTruthy();
});

test('Open Graph images render as PNG', async ({ request }) => {
  for (const path of [
    '/opengraph-image',
    '/projects/realtime-event-pipeline/opengraph-image',
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()['content-type'], path).toContain('image/png');
  }
});

test('case study pages have their own Open Graph image', async ({ page }) => {
  await page.goto('/projects/realtime-event-pipeline');
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /\/projects\/realtime-event-pipeline\/opengraph-image/,
  );
});

test('sitemap lists home, CV and every case study', async ({ request }) => {
  const body = await (await request.get('/sitemap.xml')).text();
  for (const path of [
    '/cv',
    '/projects/resist-store',
    '/projects/white-label-ecommerce-platform',
    '/projects/direct-online-banking-payments',
    '/projects/realtime-event-pipeline',
    '/projects/knowledgebase-and-crm',
  ]) {
    expect(body).toContain(path);
  }
});

test('robots allows crawling and points to the sitemap', async ({
  request,
}) => {
  const body = await (await request.get('/robots.txt')).text();
  expect(body).toContain('Allow: /');
  expect(body).toContain('/sitemap.xml');
});
