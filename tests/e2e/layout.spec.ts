import { expect, test, type Page } from '@playwright/test';

function collectErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
}

test.describe('with a light OS preference', () => {
  test.use({ colorScheme: 'light' });

  test('renders light without console errors', async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/dark/);
    expect(errors).toEqual([]);
  });
});

test.describe('with a dark OS preference', () => {
  test.use({ colorScheme: 'dark' });

  test('renders dark and the toggle switches and persists the theme', async ({
    page,
  }) => {
    await page.goto('/');
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);

    await page.getByRole('button', { name: 'Toggle colour theme' }).click();
    await expect(html).not.toHaveClass(/dark/);

    await page.reload();
    await expect(html).not.toHaveClass(/dark/);
  });
});

test('theme toggle name includes its visible text', async ({ page }) => {
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Toggle colour theme' });
  // Before hydration the label is a 'theme: …' placeholder; wait it out.
  await expect(toggle).toHaveText(/^theme: (dark|light)$/);
  const text = (await toggle.textContent())?.trim() ?? '';
  await expect(toggle).toHaveAccessibleName(`${text}, toggle colour theme`);
});

test('nav links to the CV and home sections', async ({ page }) => {
  await page.goto('/');
  const nav = page.getByRole('navigation');
  await expect(nav.getByRole('link', { name: 'cv' })).toHaveAttribute(
    'href',
    '/cv',
  );
  await expect(nav.getByRole('link', { name: 'experience' })).toHaveAttribute(
    'href',
    '/#experience',
  );
});

test('unknown routes show the terminal 404 without console errors', async ({
  page,
}) => {
  const errors = collectErrors(page);
  const response = await page.goto('/nope/missing');
  expect(response?.status()).toBe(404);
  await expect(
    page.getByText('command not found: /nope/missing'),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'cd ~' })).toHaveAttribute(
    'href',
    '/',
  );
  // The 404 response itself is logged by the browser; ignore only that.
  expect(errors.filter((e) => !e.includes('404'))).toEqual([]);
});

test.describe('on a 360px phone', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('404 with a long unbroken path does not scroll horizontally', async ({
    page,
  }) => {
    await page.goto(`/${'a'.repeat(60)}/${'b'.repeat(40)}`);
    await expect(page.getByText('command not found:')).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('accent colour', () => {
  for (const [scheme, rgb] of [
    ['dark', 'rgb(251, 191, 36)'],
    ['light', 'rgb(180, 83, 9)'],
  ] as const) {
    test(`is amber in ${scheme} mode`, async ({ browser }) => {
      const page = await browser.newPage({ colorScheme: scheme });
      await page.goto('/');
      const title = page.getByText(
        'Senior Software Engineer · Backend & Full Stack',
        {
          exact: true,
        },
      );
      await expect(title).toHaveCSS('color', rgb);
      await page.close();
    });
  }
});

test('serves the ~/m favicon in every format', async ({ page, request }) => {
  await page.goto('/');
  const icon = await page
    .locator('link[rel="icon"][type="image/png"]')
    .getAttribute('href');
  const apple = await page
    .locator('link[rel="apple-touch-icon"]')
    .getAttribute('href');
  for (const [path, type] of [
    ['/favicon.ico', 'image/x-icon'],
    [icon ?? '', 'image/png'],
    [apple ?? '', 'image/png'],
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
    expect(response.headers()['content-type'], path).toContain(type);
  }
});
