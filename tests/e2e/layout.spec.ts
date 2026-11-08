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
  const text = (await toggle.textContent())?.trim() ?? '';
  expect(text).toMatch(/^theme: (dark|light)$/);
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
