import { expect, test } from '@playwright/test';

const EMAIL = 'mrcbstmnte@gmail.com';

test('hero shows identity and the two calls to action', async ({ page }) => {
  await page.goto('/');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Marc Alain Bustamante' }),
  ).toBeVisible();
  await expect(page.getByText('9+ yrs')).toBeVisible();
  await expect(page.getByRole('link', { name: 'View CV' })).toHaveAttribute(
    'href',
    '/cv',
  );
  await expect(page.getByRole('link', { name: 'Email me' })).toHaveAttribute(
    'href',
    `mailto:${EMAIL}`,
  );
});

test('renders all four sections', async ({ page }) => {
  await page.goto('/');
  for (const name of ['Experience', 'Selected work', 'Skills', 'Contact']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  }
});

test('experience timeline lists every company and expands details', async ({
  page,
}) => {
  await page.goto('/');
  const section = page.locator('#experience');
  for (const company of [
    'Montani International Inc.',
    'PayMongo Philippines Inc.',
    'Rakuten Travel Xchange',
    'tawk.to',
    'SplitDragon',
    'Akubo Software Philippines Inc.',
  ]) {
    await expect(section.getByRole('heading', { name: company })).toBeVisible();
  }
  await expect(section.getByText('Software Engineer II').first()).toBeVisible();

  const mentoring = section.getByText(/Mentored junior software engineers/);
  await expect(mentoring).toBeHidden();
  await section
    .locator('li', { has: page.getByRole('heading', { name: /PayMongo/ }) })
    .getByText('show more')
    .click();
  await expect(mentoring).toBeVisible();
});

test('selected work links to each case study with an NDA badge', async ({
  page,
}) => {
  await page.goto('/');
  const cards = page.locator('#work').getByRole('link');
  await expect(cards).toHaveCount(5);
  await expect(cards.first()).toHaveAttribute('href', '/projects/resist-store');
  await expect(cards.first()).toContainText('[client]');
  await expect(cards.nth(1)).toContainText('[NDA]');
});

test('skills render as config keys', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#skills')).toContainText('languages_runtimes:');
});

test('copy email uses the clipboard when available', async ({
  page,
  context,
}) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/');
  await page.getByRole('button', { name: 'copy email' }).click();
  await expect(page.getByText('copied to clipboard')).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(EMAIL);
});

test('copy email falls back to selecting the address', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: undefined,
      configurable: true,
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'copy email' }).click();
  await expect(page.getByText('press ⌘/Ctrl+C to copy')).toBeVisible();
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(
    EMAIL,
  );
});

test('contact links point to LinkedIn and GitHub', async ({ page }) => {
  await page.goto('/');
  const contact = page.locator('#contact');
  await expect(contact.getByRole('link', { name: /linkedin/ })).toHaveAttribute(
    'href',
    'https://www.linkedin.com/in/mrcbstmnte',
  );
  await expect(contact.getByRole('link', { name: /github/ })).toHaveAttribute(
    'href',
    'https://github.com/mrcbstmnte',
  );
});

test('never shows the phone number', async ({ page }) => {
  await page.goto('/');
  // Any run of 10+ digits with phone separators, in any format.
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/\+?\d[\d\s().-]{8,}\d/);
});

test('every internal link resolves', async ({ page, request }) => {
  await page.goto('/');
  const hrefs = await page
    .locator('a[href^="/"]')
    .evaluateAll((links) => links.map((a) => a.getAttribute('href') ?? ''));
  const paths = [...new Set(hrefs.map((href) => href.split('#')[0] || '/'))];
  for (const path of paths) {
    const response = await request.get(path);
    expect(response.status(), path).toBe(200);
  }
});

test.describe('on a 360px phone', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('home does not scroll horizontally', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});

test.describe('scroll reveal on a phone', () => {
  test.use({ viewport: { width: 412, height: 823 } });

  test('a tall section is fully opaque once 200px of it is in view', async ({
    page,
  }) => {
    await page.goto('/');
    await page.evaluate(() => {
      const section = document.getElementById('work')!;
      const top = section.getBoundingClientRect().top + window.scrollY;
      window.scrollTo(0, top - window.innerHeight + 200);
    });
    await page.waitForTimeout(100);
    const opacity = await page
      .locator('#work')
      .evaluate((el) => getComputedStyle(el).opacity);
    expect(Number(opacity)).toBe(1);
  });
});
