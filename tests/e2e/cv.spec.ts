import { expect, test } from '@playwright/test';

test('CV renders every section and company from site data', async ({
  page,
}) => {
  await page.goto('/cv');
  await expect(
    page.getByRole('heading', { level: 1, name: 'Marc Alain Bustamante' }),
  ).toBeVisible();
  for (const name of ['Summary', 'Skills', 'Experience', 'Education']) {
    await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();
  }
  for (const company of [
    'Montani International Inc.',
    'PayMongo Philippines Inc.',
    'Rakuten Travel Xchange',
    'tawk.to',
    'SplitDragon',
    'Akubo Software Philippines Inc.',
  ]) {
    await expect(page.getByText(company).first()).toBeVisible();
  }
  // Full highlights, not just the top three shown on the home page.
  await expect(
    page.getByText(/Mentored junior software engineers/),
  ).toBeVisible();
  await expect(page.getByText('Jul 2023 – Oct 2026')).toBeVisible();
});

test('CV shows contact links but never the phone number', async ({ page }) => {
  await page.goto('/cv');
  await expect(
    page.getByRole('link', { name: 'mrcbstmnte@gmail.com' }),
  ).toHaveAttribute('href', 'mailto:mrcbstmnte@gmail.com');
  await expect(
    page.getByRole('link', { name: 'linkedin.com/in/mrcbstmnte' }),
  ).toBeVisible();
  // Any run of 10+ digits with phone separators, in any format.
  const text = await page.locator('body').innerText();
  expect(text).not.toMatch(/\+?\d[\d\s().-]{8,}\d/);
});

test('CV links company websites', async ({ page }) => {
  await page.goto('/cv');
  await expect(
    page.getByRole('link', { name: 'solutions.travel.rakuten.com' }),
  ).toHaveAttribute('href', 'https://solutions.travel.rakuten.com');
  // PayMongo has two roles; the website shows on both.
  await expect(page.getByRole('link', { name: 'paymongo.com' })).toHaveCount(2);
});

test('CV contact links are large enough to tap', async ({ page }) => {
  await page.goto('/cv');
  const links = page.locator('main header a');
  await expect(links).toHaveCount(3);
  for (const box of await links.evaluateAll((els) =>
    els.map((el) => el.getBoundingClientRect().height),
  )) {
    expect(box).toBeGreaterThanOrEqual(24);
  }
});

test('Download PDF opens the print dialog', async ({ page }) => {
  await page.goto('/cv');
  await page.evaluate(() => {
    window.print = () => {
      document.body.dataset.printed = 'true';
    };
  });
  await page.getByRole('button', { name: 'Download PDF' }).click();
  await expect(page.locator('body')).toHaveAttribute('data-printed', 'true');
});

test.describe('printing from dark mode', () => {
  test.use({ colorScheme: 'dark' });

  test('prints black on white with nav and buttons hidden', async ({
    page,
  }) => {
    await page.goto('/cv');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await page.emulateMedia({ media: 'print' });

    const colours = await page.evaluate(() => {
      const body = getComputedStyle(document.body);
      return {
        background: body.backgroundColor,
        text: body.color,
        // Chrome paints the page margins from the root colour scheme.
        scheme: getComputedStyle(document.documentElement).colorScheme,
      };
    });
    expect(colours).toEqual({
      background: 'rgb(255, 255, 255)',
      text: 'rgb(0, 0, 0)',
      scheme: 'light',
    });
    await expect(page.getByRole('navigation')).toBeHidden();
    await expect(
      page.getByRole('button', { name: 'Download PDF' }),
    ).toBeHidden();
  });
});

test.describe('on a 360px phone', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('CV does not scroll horizontally', async ({ page }) => {
    await page.goto('/cv');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  });
});
